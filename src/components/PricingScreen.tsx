import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  X,
  ArrowRight,
  Info,
  Clock,
  Layers,
  Crown,
  Building,
  Star,
  Coins,
  Globe,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale, SUPPORTED_CURRENCIES } from '../contexts/LocaleContext';
import { studioApi } from '../services/api';

interface PricingScreenProps {
  onClose?: () => void;
  onNavigateToUsage?: () => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({ onClose, onNavigateToUsage }) => {
  const { user, refreshCredits } = useAuth();
  const { currency, currencySymbol, setCurrency, formatPrice, t } = useLocale();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<any[]>([]);
  const [creditPacks, setCreditPacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    status: 'Connected' | 'Payment Provider Setup Required';
    provider: string;
    message: string;
    supportedGateways: string[];
  }>({
    configured: false,
    status: 'Payment Provider Setup Required',
    provider: 'None',
    message: 'Payment Provider Setup Required: Live payments and webhook processing are inactive. Please configure merchant API credentials in environment variables.',
    supportedGateways: ['Razorpay', 'Cashfree', 'Stripe'],
  });

  // India payment checkout modal state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [selectedPackForCheckout, setSelectedPackForCheckout] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('');
  const [orderNotice, setOrderNotice] = useState<{
    orderId?: string;
    amount?: number;
    currency?: string;
    message: string;
    isVerified?: boolean;
    providerConfigured?: boolean;
  } | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Fetch configured plans, credit packs, and provider status from backend
  useEffect(() => {
    const fetchPricing = async () => {
      setIsLoading(true);
      try {
        const [plansRes, packsRes, statusRes] = await Promise.all([
          studioApi.billing.getPlans().catch(() => ({ plans: [] })),
          studioApi.billing.getCreditPacks().catch(() => ({ packs: [] })),
          studioApi.billing.getProviderStatus().catch(() => ({
            configured: false,
            status: 'Payment Provider Setup Required' as const,
            provider: 'None',
            message: 'Payment Provider Setup Required: Live payments and webhook processing are inactive. Please configure merchant API credentials in environment variables.',
            supportedGateways: ['Razorpay', 'Cashfree', 'Stripe'],
          })),
        ]);
        if (plansRes.plans && plansRes.plans.length > 0) {
          setPlans(plansRes.plans);
        } else {
          // Default launch plans if API unavailable
          setPlans(defaultLaunchPlans);
        }
        if (packsRes.packs && packsRes.packs.length > 0) {
          setCreditPacks(packsRes.packs);
        } else {
          setCreditPacks(defaultCreditPacks);
        }
        if (statusRes) {
          setProviderStatus(statusRes);
        }
      } catch (err) {
        setPlans(defaultLaunchPlans);
        setCreditPacks(defaultCreditPacks);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const defaultLaunchPlans = [
    {
      id: 'free',
      name: 'FREE',
      tagline: 'For users testing CreatorNova AI',
      monthlyCredits: 50,
      projectsLimit: 5,
      description: '50 monthly credits, 5 projects, AI idea generation, basic script generation, basic SEO, limited scene generation.',
      features: [
        '50 monthly credits',
        '5 projects',
        'AI idea generation',
        'Basic script generation',
        'Basic SEO',
        'Limited scene generation',
      ],
      popular: false,
      regionalPrices: {
        INR: { currency: 'INR', symbol: '₹', monthly: 0, yearly: 0 },
        USD: { currency: 'USD', symbol: '$', monthly: 0, yearly: 0 },
        EUR: { currency: 'EUR', symbol: '€', monthly: 0, yearly: 0 },
        GBP: { currency: 'GBP', symbol: '£', monthly: 0, yearly: 0 },
        JPY: { currency: 'JPY', symbol: '¥', monthly: 0, yearly: 0 },
      },
    },
    {
      id: 'pro',
      name: 'PRO',
      tagline: 'For individual ambitious creators',
      monthlyCredits: 1000,
      projectsLimit: 50,
      description: '1,000 monthly credits, 50 projects, advanced AI scripts, scene generator, SEO tools, thumbnail prompt generator, basic AI Agent, Brand Kit, multiple languages.',
      features: [
        '1,000 monthly credits',
        '50 projects',
        'Advanced AI scripts',
        'Scene generator',
        'SEO tools',
        'Thumbnail prompt generator',
        'Basic AI Agent',
        'Brand Kit',
        'Multiple languages',
      ],
      popular: false,
      regionalPrices: {
        INR: { currency: 'INR', symbol: '₹', monthly: 299, yearly: 2990 },
        USD: { currency: 'USD', symbol: '$', monthly: 9, yearly: 90 },
        EUR: { currency: 'EUR', symbol: '€', monthly: 8, yearly: 80 },
        GBP: { currency: 'GBP', symbol: '£', monthly: 7, yearly: 70 },
        JPY: { currency: 'JPY', symbol: '¥', monthly: 1400, yearly: 14000 },
      },
    },
    {
      id: 'creator',
      name: 'CREATOR',
      badge: 'MOST POPULAR',
      tagline: 'For frequent creators and content channels',
      monthlyCredits: 4000,
      projectsLimit: -1,
      description: '4,000 monthly credits, unlimited text projects subject to fair-use, AI Creator Agent, Content Calendar, Series Creator, Advanced SEO, Thumbnail & Voice generation, Character Library, Content repurposing, Priority generation.',
      features: [
        '4,000 monthly credits',
        'Unlimited text projects (fair-use)',
        'AI Creator Agent',
        'Content Calendar',
        'Series Creator',
        'Advanced SEO',
        'Thumbnail generation when supported',
        'Voice generation when supported',
        'Character Library',
        'Content repurposing',
        'Priority generation',
      ],
      popular: true,
      regionalPrices: {
        INR: { currency: 'INR', symbol: '₹', monthly: 799, yearly: 7990 },
        USD: { currency: 'USD', symbol: '$', monthly: 24, yearly: 240 },
        EUR: { currency: 'EUR', symbol: '€', monthly: 22, yearly: 220 },
        GBP: { currency: 'GBP', symbol: '£', monthly: 19, yearly: 190 },
        JPY: { currency: 'JPY', symbol: '¥', monthly: 3600, yearly: 36000 },
      },
    },
    {
      id: 'business',
      name: 'BUSINESS',
      tagline: 'For agencies, creator businesses, and teams',
      monthlyCredits: 12000,
      projectsLimit: -1,
      description: '12,000 monthly credits, everything in Creator, multiple Brand Kits, team-ready architecture, higher generation limits, advanced automation, business content workflows, priority support, commercial creator workflows.',
      features: [
        '12,000 monthly credits',
        'Everything in Creator',
        'Multiple Brand Kits',
        'Team-ready architecture',
        'Higher generation limits',
        'Advanced automation',
        'Business content workflows',
        'Priority support',
        'Commercial creator workflows',
      ],
      popular: false,
      regionalPrices: {
        INR: { currency: 'INR', symbol: '₹', monthly: 1999, yearly: 19990 },
        USD: { currency: 'USD', symbol: '$', monthly: 59, yearly: 590 },
        EUR: { currency: 'EUR', symbol: '€', monthly: 55, yearly: 550 },
        GBP: { currency: 'GBP', symbol: '£', monthly: 49, yearly: 490 },
        JPY: { currency: 'JPY', symbol: '¥', monthly: 8900, yearly: 89000 },
      },
    },
  ];

  const defaultCreditPacks = [
    {
      id: 'pack-100',
      name: '100 Credits',
      credits: 100,
      prices: {
        INR: { currency: 'INR', symbol: '₹', amount: 99 },
        USD: { currency: 'USD', symbol: '$', amount: 3 },
        EUR: { currency: 'EUR', symbol: '€', amount: 3 },
        GBP: { currency: 'GBP', symbol: '£', amount: 2.5 },
        JPY: { currency: 'JPY', symbol: '¥', amount: 450 },
      },
    },
    {
      id: 'pack-500',
      name: '500 Credits',
      credits: 500,
      prices: {
        INR: { currency: 'INR', symbol: '₹', amount: 399 },
        USD: { currency: 'USD', symbol: '$', amount: 12 },
        EUR: { currency: 'EUR', symbol: '€', amount: 11 },
        GBP: { currency: 'GBP', symbol: '£', amount: 9.5 },
        JPY: { currency: 'JPY', symbol: '¥', amount: 1800 },
      },
    },
    {
      id: 'pack-1000',
      name: '1,000 Credits',
      credits: 1000,
      badge: 'MOST POPULAR',
      prices: {
        INR: { currency: 'INR', symbol: '₹', amount: 699 },
        USD: { currency: 'USD', symbol: '$', amount: 20 },
        EUR: { currency: 'EUR', symbol: '€', amount: 19 },
        GBP: { currency: 'GBP', symbol: '£', amount: 16 },
        JPY: { currency: 'JPY', symbol: '¥', amount: 3000 },
      },
    },
    {
      id: 'pack-5000',
      name: '5,000 Credits',
      credits: 5000,
      badge: 'BEST VALUE',
      prices: {
        INR: { currency: 'INR', symbol: '₹', amount: 2999 },
        USD: { currency: 'USD', symbol: '$', amount: 85 },
        EUR: { currency: 'EUR', symbol: '€', amount: 80 },
        GBP: { currency: 'GBP', symbol: '£', amount: 70 },
        JPY: { currency: 'JPY', symbol: '¥', amount: 12500 },
      },
    },
  ];

  // Helper to extract regional price
  const getPlanPrice = (plan: any, cycle: 'monthly' | 'yearly') => {
    const reg = plan.regionalPrices?.[currency] || plan.regionalPrices?.INR || { monthly: 0, yearly: 0 };
    return cycle === 'monthly' ? reg.monthly : reg.yearly;
  };

  // Helper to calculate exact mathematical savings
  const calculateSavings = (plan: any) => {
    const reg = plan.regionalPrices?.[currency] || plan.regionalPrices?.INR || { monthly: 0, yearly: 0 };
    const monthlyTotal = reg.monthly * 12;
    const yearlyPrice = reg.yearly;
    if (monthlyTotal <= 0 || yearlyPrice >= monthlyTotal) return null;
    const diff = monthlyTotal - yearlyPrice;
    const percent = Math.round((diff / monthlyTotal) * 100);
    return { diff, percent };
  };

  const getPackPrice = (pack: any) => {
    const reg = pack.prices?.[currency] || pack.prices?.INR || { amount: 0 };
    return reg.amount;
  };

  const getPlanButtonLabel = (planId: string) => {
    switch (planId) {
      case 'free': return 'Start Free';
      case 'pro': return 'Upgrade to Pro';
      case 'creator': return 'Choose Creator';
      case 'business': return 'Choose Business';
      default: return 'Select Plan';
    }
  };

  const handleOpenPlanCheckout = (plan: any) => {
    if (plan.id === 'free') {
      alert('You are already on the Free starter plan!');
      return;
    }
    setSelectedPlanForCheckout(plan);
    setSelectedPackForCheckout(null);
    setOrderNotice(null);
  };

  const handleOpenPackCheckout = (pack: any) => {
    setSelectedPackForCheckout(pack);
    setSelectedPlanForCheckout(null);
    setOrderNotice(null);
  };

  // Create payment order
  const handleCreatePaymentOrder = async () => {
    setIsProcessingOrder(true);
    try {
      const res = await studioApi.billing.createCheckoutSession({
        planId: selectedPlanForCheckout?.id,
        billingCycle,
        currency,
        paymentMethod,
      });

      if (!res.providerConfigured) {
        setOrderNotice({
          message: res.message || 'Payment Provider Setup Required: Merchant gateway credentials must be configured on the server.',
          providerConfigured: false,
          isVerified: false,
        });
      } else {
        setOrderNotice({
          orderId: res.order?.orderId,
          currency,
          message: res.message || 'Payment order created. Subscriptions become active upon secure provider webhook verification.',
          isVerified: false,
          providerConfigured: true,
        });
      }
    } catch (err: any) {
      setOrderNotice({
        message: err.message || 'Payment provider communication error.',
        providerConfigured: false,
        isVerified: false,
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in">
      {/* Top Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>India-First & Global Creator Pricing</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Supercharge Your Content Creation
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Transparent pricing in Indian Rupees ({currencySymbol}) and global currencies. All prices and credit allocations are configurable without hidden surcharges.
        </p>

        {!providerStatus.configured && (
          <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-2xl flex items-start gap-3 max-w-2xl mx-auto text-left shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 uppercase tracking-wide">Payment Provider Setup Required</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-mono">Integration Disabled</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Automated checkout and subscription renewals are disabled until merchant credentials (such as <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code>, <code>RAZORPAY_WEBHOOK_SECRET</code> or Stripe) are configured in the server environment. Direct payment simulation is permanently disabled for security.
              </p>
            </div>
          </div>
        )}

        {/* Currency & Billing Cycle Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-2" />
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  currency === c.code
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold">
                Up to 17% Off
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = getPlanPrice(plan, billingCycle);
          const savings = calculateSavings(plan);
          const isCreator = plan.id === 'creator';
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                isCreator
                  ? 'bg-gradient-to-b from-slate-900 via-violet-950/40 to-slate-900 border-2 border-violet-500 shadow-2xl shadow-violet-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badge for Popular */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white text-[10px] font-black tracking-wider uppercase shadow-lg shadow-violet-600/40">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                      {formatPrice(price)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </div>

                  {/* Mathematically Correct Savings Claim */}
                  {billingCycle === 'yearly' && savings && (
                    <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        Save {formatPrice(savings.diff)}/yr ({savings.percent}% savings)
                      </span>
                    </div>
                  )}

                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-violet-300 text-xs font-bold font-mono">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{plan.monthlyCredits?.toLocaleString()} credits/mo</span>
                  </div>
                </div>

                {/* Main Feature List */}
                <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Included Features
                  </div>
                  {plan.features?.map((f: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={() => handleOpenPlanCheckout(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isCurrentPlan
                      ? 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                      : isCreator
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-slate-800 hover:bg-slate-750 text-white border border-slate-700'
                  }`}
                >
                  <span>{isCurrentPlan ? 'Current Plan' : getPlanButtonLabel(plan.id)}</span>
                  {!isCurrentPlan && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Purchase Architecture (One-time Packs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-black text-white">One-Time Credit Packs</h2>
            </div>
            <p className="text-xs text-slate-400">
              Need extra generation power without upgrading plans? Purchase optional credit top-ups that never expire.
            </p>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
            Instant Credit Grant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPacks.map((pack) => {
            const packPrice = getPackPrice(pack);
            return (
              <div
                key={pack.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{pack.name}</span>
                    {pack.badge && (
                      <span className="text-[9px] bg-violet-600/30 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                        {pack.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {formatPrice(packPrice)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {pack.credits?.toLocaleString()} generation credits
                  </p>
                </div>

                <button
                  onClick={() => handleOpenPackCheckout(pack)}
                  className="w-full py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  Buy {pack.credits} Credits
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compare Plans Detailed Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-black text-white">Compare Plans</h2>
          <p className="text-xs text-slate-400">Detailed breakdown of quotas, features, and capabilities across all tiers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Feature / Dimension</th>
                <th className="py-3 px-4 font-bold">Free</th>
                <th className="py-3 px-4 font-bold">Pro</th>
                <th className="py-3 px-4 font-bold text-violet-400">Creator (Most Popular)</th>
                <th className="py-3 px-4 font-bold">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Monthly Credits</td>
                <td className="py-3 px-4">50</td>
                <td className="py-3 px-4">1,000</td>
                <td className="py-3 px-4 font-bold text-violet-300">4,000</td>
                <td className="py-3 px-4 font-bold text-emerald-400">12,000</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Projects Limit</td>
                <td className="py-3 px-4">5</td>
                <td className="py-3 px-4">50</td>
                <td className="py-3 px-4 font-bold text-violet-300">Unlimited (Fair-use)</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Unlimited Multi-Team</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">CreatorNova AI Agent</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4">Basic Agent</td>
                <td className="py-3 px-4 font-bold text-violet-300">Full Autonomous Agent</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Priority Agent Pipeline</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Content Calendar (Day/Week/Month)</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 font-bold text-violet-300">Included</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Included</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Series Creator</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 font-bold text-violet-300">Up to 30 Episodes</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Unlimited Episodes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Character Consistency Library</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 font-bold text-violet-300">5 Saved Characters</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Unlimited Characters</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Brand Kits</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4">1 Brand Kit</td>
                <td className="py-3 px-4 font-bold text-violet-300">3 Brand Kits</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Unlimited Brand Kits</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Content Repurposing (1-Click)</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 text-slate-500">—</td>
                <td className="py-3 px-4 font-bold text-violet-300">Shorts, Reels, TikTok, Post</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Full Omnichannel & Multi-lingual</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* India Payment Architecture Checkout Modal */}
      {(selectedPlanForCheckout || selectedPackForCheckout) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedPlanForCheckout(null);
                setSelectedPackForCheckout(null);
                setOrderNotice(null);
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300 text-[10px] font-bold uppercase mb-2">
                India Payment Architecture
              </div>
              <h3 className="text-xl font-black text-white">
                {selectedPlanForCheckout
                  ? `Upgrade to ${selectedPlanForCheckout.name} (${billingCycle})`
                  : `Purchase ${selectedPackForCheckout?.name}`}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Amount:{' '}
                <span className="font-mono font-bold text-white text-base">
                  {formatPrice(
                    selectedPlanForCheckout
                      ? getPlanPrice(selectedPlanForCheckout, billingCycle)
                      : getPackPrice(selectedPackForCheckout)
                  )}
                </span>
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Payment Method
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-violet-950/60 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-violet-400" />
                  <span className="font-bold">UPI / GPay / PhonePe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-violet-950/60 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-pink-400" />
                  <span className="font-bold">Cards (RuPay, Visa)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'bg-violet-950/60 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Net Banking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'bg-violet-950/60 border-violet-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">Wallets & Mandate</span>
                </button>
              </div>

              {paymentMethod === 'upi' && (
                <div className="pt-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Virtual Payment Address (UPI ID)</label>
                  <input
                    type="text"
                    placeholder="creator@okhdfcbank / mobile@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* Provider Configuration Warning / Policy */}
            {!providerStatus.configured ? (
              <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Payment Provider Setup Required</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-300">
                  Automated checkout and recurring plans are inactive because merchant API keys are not configured in the server environment. Direct payment simulation is permanently disabled for financial security.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure Server Webhook Verification</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Subscriptions become active strictly upon verified webhook notification from {providerStatus.provider} with HMAC signature validation.
                </p>
              </div>
            )}

            {orderNotice && (
              <div className={`p-4 rounded-xl text-xs space-y-2 ${
                orderNotice.providerConfigured
                  ? 'bg-indigo-950/80 border border-indigo-500/60 text-indigo-200'
                  : 'bg-amber-950/80 border border-amber-500/60 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <Info className="w-4 h-4" />
                  <span>{orderNotice.orderId ? `Order: ${orderNotice.orderId}` : 'Provider Notice'}</span>
                </div>
                <p className="leading-relaxed text-[11px]">{orderNotice.message}</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setSelectedPackForCheckout(null);
                  setOrderNotice(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Close
              </button>

              {!providerStatus.configured ? (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700 text-xs font-bold cursor-not-allowed"
                >
                  Payment Provider Setup Required
                </button>
              ) : !orderNotice?.orderId ? (
                <button
                  onClick={handleCreatePaymentOrder}
                  disabled={isProcessingOrder}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  {isProcessingOrder ? 'Creating Order...' : 'Create Payment Order'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
