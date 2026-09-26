export type UserRole = 'user' | 'admin';

export type SubscriptionPlanTier = 'free' | 'pro' | 'creator' | 'business';

export type BillingCycle = 'monthly' | 'yearly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  preferredLanguage: string;
  creatorNiche: string;
  defaultPlatform: string;
  defaultContentLanguage: string;
  plan: SubscriptionPlanTier;
  billingCycle: BillingCycle;
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface BrandKit {
  channelName: string;
  channelNiche: string;
  targetAudience: string;
  preferredLanguage: string;
  preferredVisualStyle: string;
  defaultVideoStyle: string;
  toneOfVoice: string;
  recurringCharacterDescription: string;
  preferredCta: string;
  updatedAt: string;
}

export interface CreditWallet {
  textCredits: number;
  imageCredits: number;
  voiceCredits: number;
  videoCredits: number;
  totalRemaining: number;
  monthlyAllocation: number;
  lastResetDate: string;
}

export interface CreditConfig {
  textCost: number;
  scriptCost?: number;
  seoCost?: number;
  sceneCost?: number;
  imageCost: number;
  voiceCost: number;
  videoCost: number;
  videoBaseCost?: number;
  videoCostPer15s?: number;
  videoResolutionMultipliers?: Record<string, number>;
  videoModelMultipliers?: Record<string, number>;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'voice' | 'video';
  amount: number;
  description: string;
  timestamp: string;
  billingPeriod: string;
}

export interface PlanFeatureComparison {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  creator: string | boolean;
  business: string | boolean;
}

export interface SubscriptionPlanDetails {
  id: SubscriptionPlanTier;
  name: string;
  badge?: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: number;
  projectsLimit: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: SubscriptionPlanTier;
  billingCycle: BillingCycle;
  status: 'active' | 'past_due' | 'cancelled' | 'pending';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  monthlyCredits: number;
  paymentProvider?: string;
  externalSubscriptionId?: string;
  externalCustomerId?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planId?: SubscriptionPlanTier;
  creditPackId?: string;
  type: 'subscription' | 'credit_pack';
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'verified' | 'failed';
  paymentProvider?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  idempotencyKey?: string;
  creditsAllocated?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  verifiedAt?: string;
}

