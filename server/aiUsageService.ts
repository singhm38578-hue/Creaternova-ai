import crypto from 'crypto';
import { dbManager, type AIUsageRecord } from './db.ts';
import {
  AI_OPERATIONS_CONFIG,
  AI_SAFETY_LIMITS,
  REAL_PROVIDER_PRICING_CONFIGURED,
  calculateEstimatedVideoCost,
  type VideoCostCalculationParams,
} from './aiCostConfig.ts';
import { CreditWalletService } from './creditService.ts';
import { PLAN_DEFINITIONS } from '../src/config/creditCosts.ts';

export interface PlanEconomicsItem {
  planId: 'free' | 'pro' | 'creator' | 'business';
  planName: string;
  monthlyPriceINR: number;
  monthlyCredits: number;
  estimatedAIUsageCostINR: number | null;
  estimatedPaymentCostINR: number;
  estimatedInfrastructureCostINR: number;
  estimatedGrossProfitINR: number | null;
  estimatedGrossMarginPercent: number | null;
  costDataRequired: boolean;
  hasEconomicsWarning: boolean;
}

export interface AdminCostDashboardData {
  timeframe: 'today' | '7d' | '30d';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  creditsConsumed: number;
  estimatedProviderCostINR: number | null;
  estimatedRevenueINR: number;
  estimatedGrossMarginPercent: number | null;
  costDataRequired: boolean;
  hasEconomicsWarning: boolean;
  economicsWarningMessage: string | null;
  planEconomics: PlanEconomicsItem[];
  operationsConfig: Record<string, any>;
  recentUsageRecords: AIUsageRecord[];
}

export class AIUsageService {
  /**
   * Enforces configurable safety limits before starting AI operations.
   * Throws an explicit descriptive error if any threshold is violated.
   */
  public static checkSafetyLimits(params: {
    userId: string;
    operation: string;
    creditsToCharge: number;
    videoDurationSeconds?: number;
  }): { allowed: boolean; error?: string } {
    const { userId, creditsToCharge, videoDurationSeconds } = params;

    // 1. Max credits per single request
    if (creditsToCharge > AI_SAFETY_LIMITS.maxCreditsPerRequest) {
      return {
        allowed: false,
        error: `SAFETY LIMIT EXCEEDED: Requested operation requires ${creditsToCharge} credits, which exceeds the maximum allowable threshold of ${AI_SAFETY_LIMITS.maxCreditsPerRequest} credits per request.`,
      };
    }

    // 2. Max video duration
    if (videoDurationSeconds && videoDurationSeconds > AI_SAFETY_LIMITS.maxVideoDurationSeconds) {
      return {
        allowed: false,
        error: `SAFETY LIMIT EXCEEDED: Video duration of ${videoDurationSeconds}s exceeds the maximum limit of ${AI_SAFETY_LIMITS.maxVideoDurationSeconds}s per sequence.`,
      };
    }

    // 3. Daily usage limit check
    const todayRecords = dbManager.getAIUsageRecords({ userId, timeframe: 'today' });
    const todayCreditsUsed = todayRecords
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + r.creditsCharged, 0);

    if (todayCreditsUsed + creditsToCharge > AI_SAFETY_LIMITS.dailyUsageLimitCredits) {
      return {
        allowed: false,
        error: `DAILY USAGE LIMIT REACHED: User has consumed ${todayCreditsUsed} credits today. Adding ${creditsToCharge} credits would exceed the daily cap of ${AI_SAFETY_LIMITS.dailyUsageLimitCredits} credits.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Initializes a pending AI usage record before generation.
   */
  public static startUsageRecord(params: {
    userId: string;
    projectId?: string | null;
    operation: string;
    creditsCharged: number;
    videoParams?: VideoCostCalculationParams;
    metadata?: Record<string, any>;
  }): AIUsageRecord {
    const { userId, projectId = null, operation, creditsCharged, videoParams, metadata } = params;
    const opConfig = AI_OPERATIONS_CONFIG[operation] || {
      provider: 'google',
      model: 'gemini-2.5-flash',
      estimatedProviderCost: null,
    };

    const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const record: AIUsageRecord = {
      id: `usage_${requestId}`,
      userId,
      projectId,
      operation,
      provider: videoParams?.provider || opConfig.provider,
      model: videoParams?.model || opConfig.model,
      creditsCharged,
      estimatedProviderCost: REAL_PROVIDER_PRICING_CONFIGURED ? opConfig.estimatedProviderCost : null,
      status: 'success', // will be updated to failed if generation errors
      requestId,
      createdAt: nowIso,
      metadata: {
        ...metadata,
        videoParams,
      },
    };

    dbManager.recordAIUsage(record);
    return record;
  }

  /**
   * Marks a usage record as failed and refunds credits if they were deducted.
   * Guarantees: Never charge credits permanently for failed generation.
   */
  public static async handleFailedGeneration(params: {
    userId: string;
    requestId: string;
    creditsToRefund: number;
    errorMessage: string;
    authToken?: string;
  }): Promise<void> {
    const { userId, requestId, creditsToRefund, errorMessage, authToken } = params;

    // Update status in usage records
    dbManager.updateAIUsageStatus(requestId, 'failed', errorMessage);

    // If credits were deducted, refund them to user wallet
    if (creditsToRefund > 0) {
      try {
        await CreditWalletService.refundCreditsAtomic({
          userId,
          amount: creditsToRefund,
          operation: `refund_failed_${requestId}`,
          authToken,
        });
        dbManager.updateAIUsageStatus(requestId, 'refunded', `Refunded ${creditsToRefund} credits: ${errorMessage}`);
      } catch (refundErr) {
        console.error('Failed to refund credits for requestId:', requestId, refundErr);
      }
    }
  }

  /**
   * Computes Admin Plan Economics for all 4 subscription tiers.
   * If real provider pricing is not configured, displays COST DATA REQUIRED.
   */
  public static getPlanEconomics(): PlanEconomicsItem[] {
    const plans: ('free' | 'pro' | 'creator' | 'business')[] = ['free', 'pro', 'creator', 'business'];

    return plans.map((planId) => {
      const planDef = PLAN_DEFINITIONS[planId];
      const monthlyRevenue = planDef.monthlyPriceINR;
      const monthlyCredits = planDef.monthlyCredits;

      // Estimated gateway fee (2% + 18% GST on fee = 2.36% for India)
      const estimatedPaymentCost = monthlyRevenue > 0 ? Math.round(monthlyRevenue * 0.0236) : 0;
      // Fixed infrastructure / storage / hosting estimate
      const estimatedInfraCost = monthlyRevenue > 0 ? 15 : 2;

      let estimatedAICost: number | null = null;
      let estimatedProfit: number | null = null;
      let estimatedMargin: number | null = null;
      let hasWarning = false;

      if (REAL_PROVIDER_PRICING_CONFIGURED) {
        // Benchmark estimation formula: average cost per credit in INR
        // 1 token text ~ 0.0001 INR, video ~ 0.50 INR. Weighted benchmark = 0.05 INR per credit
        const benchmarkCostPerCredit = 0.05;
        estimatedAICost = Math.round(monthlyCredits * benchmarkCostPerCredit);
        estimatedProfit = monthlyRevenue - estimatedAICost - estimatedPaymentCost - estimatedInfraCost;
        estimatedMargin = monthlyRevenue > 0 ? Math.round((estimatedProfit / monthlyRevenue) * 100) : 0;

        // Trigger warning if margin < 35% or AI cost > 60% of revenue
        if (monthlyRevenue > 0 && (estimatedMargin < 35 || estimatedAICost > monthlyRevenue * 0.6)) {
          hasWarning = true;
        }
      }

      return {
        planId,
        planName: planDef.name,
        monthlyPriceINR: monthlyRevenue,
        monthlyCredits,
        estimatedAIUsageCostINR: estimatedAICost,
        estimatedPaymentCostINR: estimatedPaymentCost,
        estimatedInfrastructureCostINR: estimatedInfraCost,
        estimatedGrossProfitINR: estimatedProfit,
        estimatedGrossMarginPercent: estimatedMargin,
        costDataRequired: !REAL_PROVIDER_PRICING_CONFIGURED,
        hasEconomicsWarning: hasWarning,
      };
    });
  }

  /**
   * Computes Admin AI Cost Dashboard metrics filterable by timeframe.
   */
  public static getAdminDashboardData(timeframe: 'today' | '7d' | '30d'): AdminCostDashboardData {
    const records = dbManager.getAIUsageRecords({ timeframe });

    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.status === 'success').length;
    const failedRequests = records.filter((r) => r.status === 'failed' || r.status === 'refunded').length;
    const creditsConsumed = records
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + r.creditsCharged, 0);

    // Calculate estimated subscription revenue from verified orders in the timeframe
    const now = Date.now();
    const timeframeMs =
      timeframe === 'today' ? 86400000 : timeframe === '7d' ? 7 * 86400000 : 30 * 86400000;
    const threshold = now - timeframeMs;

    const allOrders = Object.values((dbManager as any).db?.paymentOrders || {});
    const timeframeRevenue = allOrders
      .filter((o: any) => o.status === 'verified' && new Date(o.createdAt).getTime() >= threshold)
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

    let estimatedProviderCost: number | null = null;
    let estimatedGrossMarginPercent: number | null = null;
    let hasWarning = false;
    let warningMessage: string | null = null;

    if (REAL_PROVIDER_PRICING_CONFIGURED) {
      estimatedProviderCost = records
        .filter((r) => r.status === 'success' && r.estimatedProviderCost !== null)
        .reduce((sum, r) => sum + (r.estimatedProviderCost || 0), 0);

      if (timeframeRevenue > 0 && estimatedProviderCost !== null) {
        const grossProfit = timeframeRevenue - estimatedProviderCost;
        estimatedGrossMarginPercent = Math.round((grossProfit / timeframeRevenue) * 100);

        if (estimatedGrossMarginPercent < 35) {
          hasWarning = true;
          warningMessage = 'PLAN ECONOMICS WARNING: Estimated AI provider usage cost is exceeding healthy unit economics threshold (>65% of revenue). Inspect high-volume video and voice generations.';
        }
      }
    }

    const planEconomics = this.getPlanEconomics();

    return {
      timeframe,
      totalRequests,
      successfulRequests,
      failedRequests,
      creditsConsumed,
      estimatedProviderCostINR: estimatedProviderCost,
      estimatedRevenueINR: timeframeRevenue,
      estimatedGrossMarginPercent,
      costDataRequired: !REAL_PROVIDER_PRICING_CONFIGURED,
      hasEconomicsWarning: hasWarning,
      economicsWarningMessage: warningMessage,
      planEconomics,
      operationsConfig: AI_OPERATIONS_CONFIG,
      recentUsageRecords: records.slice(0, 50),
    };
  }
}
