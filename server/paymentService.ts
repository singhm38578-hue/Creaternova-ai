import crypto from 'crypto';
import { dbManager, type SubscriptionRecord, type PaymentOrderRecord } from './db.ts';
import { CreditWalletService } from './creditService.ts';
import { PLAN_DEFINITIONS, type PlanConfig } from '../src/config/creditCosts.ts';

export interface ProviderStatus {
  configured: boolean;
  status: 'Connected' | 'Payment Provider Setup Required';
  provider: 'Razorpay' | 'Stripe' | 'Cashfree' | 'None';
  message: string;
  supportedGateways: string[];
}

export class PaymentService {
  /**
   * Determine live payment gateway configuration state from environment variables.
   * Real merchant credentials are required. No fake or dummy keys are permitted.
   */
  public static getProviderStatus(): ProviderStatus {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const cashfreeAppId = process.env.CASHFREE_APP_ID;
    const cashfreeSecret = process.env.CASHFREE_SECRET_KEY;

    if (razorpayKeyId && razorpaySecret) {
      return {
        configured: true,
        status: 'Connected',
        provider: 'Razorpay',
        message: 'Razorpay Payment Gateway is configured with active merchant credentials.',
        supportedGateways: ['UPI (GPay, PhonePe, Paytm, BHIM)', 'Cards (RuPay, Visa, Mastercard)', 'Net Banking', 'e-Mandates'],
      };
    }

    if (stripeSecretKey) {
      return {
        configured: true,
        status: 'Connected',
        provider: 'Stripe',
        message: 'Stripe Payment Gateway is configured with active secret key.',
        supportedGateways: ['Credit/Debit Cards', 'International Payments', 'Digital Wallets'],
      };
    }

    if (cashfreeAppId && cashfreeSecret) {
      return {
        configured: true,
        status: 'Connected',
        provider: 'Cashfree',
        message: 'Cashfree Payment Gateway is configured with active credentials.',
        supportedGateways: ['UPI', 'Cards', 'Net Banking', 'PayLater'],
      };
    }

    return {
      configured: false,
      status: 'Payment Provider Setup Required',
      provider: 'None',
      message: 'Payment Provider Setup Required: Live payments and webhook processing are inactive. Please configure merchant API credentials in environment variables.',
      supportedGateways: ['Razorpay', 'Cashfree', 'Stripe'],
    };
  }

  /**
   * Creates a secure, server-authoritative checkout order.
   * Prices and credit amounts are strictly enforced from PLAN_DEFINITIONS.
   * Frontend cannot alter amounts, currencies, or grant credits.
   */
  public static async createCheckoutSession(params: {
    userId: string;
    userEmail?: string;
    planId: 'free' | 'pro' | 'creator' | 'business';
    billingCycle?: 'monthly' | 'yearly';
    currency?: string;
    paymentMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
  }): Promise<{
    success: boolean;
    providerConfigured: boolean;
    order?: PaymentOrderRecord;
    error?: string;
    message: string;
    checkoutUrl?: string;
    paymentProvider?: string;
  }> {
    const providerStatus = this.getProviderStatus();

    // If provider is not configured, do not proceed or simulate payment
    if (!providerStatus.configured) {
      return {
        success: false,
        providerConfigured: false,
        error: 'PAYMENT_PROVIDER_SETUP_REQUIRED',
        message: 'Payment Provider Setup Required: Automated checkout is disabled until merchant credentials (RAZORPAY_KEY_ID / STRIPE_SECRET_KEY) are configured in the environment.',
      };
    }

    const { userId, planId, billingCycle = 'monthly', currency = 'INR', paymentMethod = 'upi' } = params;

    // Server-authoritative plan lookup
    const planConfig: PlanConfig | undefined = PLAN_DEFINITIONS[planId];
    if (!planConfig) {
      throw new Error(`Invalid plan specified: ${planId}`);
    }

    if (planId === 'free') {
      return {
        success: true,
        providerConfigured: true,
        message: 'Free tier does not require payment checkout.',
      };
    }

    // Exact mathematical price calculation on server
    const baseMonthlyPrice = planConfig.monthlyPriceINR;
    const authoritativeAmount = billingCycle === 'yearly' ? baseMonthlyPrice * 10 : baseMonthlyPrice;

    // 1. Create internal pending payment record
    const internalOrder = dbManager.createPaymentOrder({
      userId,
      planId,
      billingCycle,
      currency,
      amount: authoritativeAmount,
      paymentMethod,
      gateway: providerStatus.provider,
    });

    // 2. Real provider API dispatch if configured
    if (providerStatus.provider === 'Razorpay') {
      try {
        const keyId = process.env.RAZORPAY_KEY_ID!;
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: authoritativeAmount * 100, // Razorpay uses paise
            currency: 'INR',
            receipt: internalOrder.orderId,
            notes: {
              userId,
              planId,
              billingCycle,
            },
          }),
        });

        if (razorpayRes.ok) {
          const rzpOrder = await razorpayRes.json();
          internalOrder.paymentId = rzpOrder.id;
          return {
            success: true,
            providerConfigured: true,
            order: internalOrder,
            paymentProvider: 'Razorpay',
            message: 'Razorpay order created successfully.',
          };
        }
      } catch (err: any) {
        console.error('Error creating Razorpay order:', err);
      }
    }

    return {
      success: true,
      providerConfigured: true,
      order: internalOrder,
      paymentProvider: providerStatus.provider,
      message: 'Payment order created. Awaiting secure backend webhook verification.',
    };
  }

  /**
   * Secure Backend Webhook Architecture:
   * 1. Cryptographic HMAC signature verification
   * 2. Duplicate-event deduplication protection
   * 3. Idempotent credit allocation and subscription state transition
   */
  public static async handleWebhook(params: {
    rawPayload: string;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<{ status: string; eventId?: string; error?: string }> {
    const providerStatus = this.getProviderStatus();
    if (!providerStatus.configured) {
      throw new Error('Payment Provider Setup Required: Webhooks cannot be processed without live provider credentials.');
    }

    const { rawPayload, headers } = params;

    let eventId: string = '';
    let eventType: string = '';
    let parsedBody: any = null;

    try {
      parsedBody = JSON.parse(rawPayload);
    } catch {
      throw new Error('Invalid JSON payload received in webhook');
    }

    // 1. Signature Verification
    if (providerStatus.provider === 'Razorpay') {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured on the server');
      }

      const incomingSignature = (headers['x-razorpay-signature'] || headers['X-Razorpay-Signature']) as string;
      if (!incomingSignature) {
        throw new Error('Missing x-razorpay-signature header');
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (expectedSignature !== incomingSignature) {
        throw new Error('Razorpay webhook signature verification failed');
      }

      eventId = (headers['x-razorpay-event-id'] as string) || parsedBody.event_id || `rzp_${Date.now()}`;
      eventType = parsedBody.event;
    } else if (providerStatus.provider === 'Stripe') {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured on the server');
      }

      const sigHeader = (headers['stripe-signature'] || headers['Stripe-Signature']) as string;
      if (!sigHeader) {
        throw new Error('Missing stripe-signature header');
      }

      // Basic Stripe signature verification (t=timestamp,v1=signature)
      const elements = sigHeader.split(',').reduce((acc: Record<string, string>, item: string) => {
        const [k, v] = item.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const timestamp = elements.t;
      const signature = elements.v1;
      if (!timestamp || !signature) {
        throw new Error('Malformed stripe-signature header');
      }

      const signedPayload = `${timestamp}.${rawPayload}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Stripe webhook signature verification failed');
      }

      eventId = parsedBody.id || `stripe_${Date.now()}`;
      eventType = parsedBody.type;
    } else {
      throw new Error(`Unsupported webhook provider: ${providerStatus.provider}`);
    }

    // 2. Duplicate-Event Protection (Deduplication)
    if (dbManager.isWebhookEventProcessed(eventId)) {
      return { status: 'already_processed', eventId };
    }

    // 3. Idempotent Processing of Payment Success Events
    const isPaymentSuccess =
      eventType === 'order.paid' ||
      eventType === 'payment.captured' ||
      eventType === 'checkout.session.completed' ||
      eventType === 'invoice.payment_succeeded';

    if (isPaymentSuccess) {
      let orderId = '';
      let paymentId = '';
      let userId = '';
      let planId: 'free' | 'pro' | 'creator' | 'business' = 'pro';
      let billingCycle: 'monthly' | 'yearly' = 'monthly';

      if (providerStatus.provider === 'Razorpay') {
        const paymentEntity = parsedBody.payload?.payment?.entity;
        const orderEntity = parsedBody.payload?.order?.entity;
        orderId = orderEntity?.receipt || paymentEntity?.order_id || '';
        paymentId = paymentEntity?.id || `pay_${Date.now()}`;
        userId = paymentEntity?.notes?.userId || orderEntity?.notes?.userId || '';
        planId = (paymentEntity?.notes?.planId || orderEntity?.notes?.planId || 'pro') as any;
        billingCycle = (paymentEntity?.notes?.billingCycle || 'monthly') as any;
      } else if (providerStatus.provider === 'Stripe') {
        const session = parsedBody.data?.object;
        orderId = session?.client_reference_id || session?.metadata?.orderId || '';
        paymentId = session?.payment_intent || session?.id || `pay_${Date.now()}`;
        userId = session?.metadata?.userId || '';
        planId = (session?.metadata?.planId || 'pro') as any;
        billingCycle = (session?.metadata?.billingCycle || 'monthly') as any;
      }

      // If orderId is found in database, fetch authoritative details
      let order: PaymentOrderRecord | undefined;
      if (orderId) {
        order = dbManager.getPaymentRecord ? dbManager.getPaymentRecord(orderId) : (dbManager as any).db?.paymentOrders?.[orderId];
        if (order) {
          userId = order.userId;
          planId = (order.planId || planId) as any;
          billingCycle = order.billingCycle || billingCycle;
        }
      }

      if (userId && planId) {
        // If order was already verified, don't allocate credits again
        if (order && order.status === 'verified') {
          dbManager.recordWebhookEvent(eventId, 'duplicate_payment_ignored');
          return { status: 'already_verified', eventId };
        }

        // Verify order in dbManager
        if (orderId && (dbManager as any).db?.paymentOrders?.[orderId]) {
          const ord = (dbManager as any).db.paymentOrders[orderId];
          ord.status = 'verified';
          ord.paymentId = paymentId;
          ord.verifiedAt = new Date().toISOString();
        }

        // Update/create SubscriptionRecord
        const now = new Date();
        const nextPeriod = new Date(now.getTime() + 30 * 86400000);
        const planConfig = PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.pro;

        const subscriptionRecord: SubscriptionRecord = {
          id: `sub_${userId}_${Date.now()}`,
          userId,
          planId,
          billingCycle,
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: nextPeriod.toISOString(),
          monthlyCredits: planConfig.monthlyCredits,
          paymentProvider: providerStatus.provider,
          externalSubscriptionId: paymentId,
          cancelAtPeriodEnd: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        dbManager.saveUserSubscription(subscriptionRecord);

        // Connect to CreatorNova Credit Wallet idempotently
        await CreditWalletService.activateSubscriptionCredits({
          userId,
          planId,
          idempotencyKey: paymentId,
        });

        // Record processed webhook event
        dbManager.recordWebhookEvent(eventId, 'processed_and_allocated');
        return { status: 'success', eventId };
      }
    }

    // Default: record event acknowledged
    dbManager.recordWebhookEvent(eventId, `acknowledged_${eventType}`);
    return { status: 'acknowledged', eventId };
  }

  /**
   * Retrieves authoritative user subscription status.
   */
  public static getUserSubscription(userId: string): {
    subscription: SubscriptionRecord;
    providerStatus: ProviderStatus;
    invoices: PaymentOrderRecord[];
  } {
    const subscription = dbManager.getUserSubscription(userId);
    const providerStatus = this.getProviderStatus();
    const invoices = dbManager.getUserPaymentOrders(userId);

    return {
      subscription,
      providerStatus,
      invoices,
    };
  }

  /**
   * Cancels subscription renewal at end of current period.
   */
  public static cancelSubscription(userId: string): SubscriptionRecord {
    const subscription = dbManager.getUserSubscription(userId);
    subscription.cancelAtPeriodEnd = true;
    subscription.updatedAt = new Date().toISOString();
    dbManager.saveUserSubscription(subscription);
    return subscription;
  }
}
