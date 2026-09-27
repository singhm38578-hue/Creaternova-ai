export interface VideoCostConfig {
  baseCost: number;
  costPer15s: number;
  modelMultipliers: Record<string, number>;
}

export interface CreditCostConfig {
  ideaGeneration: number;
  scriptGeneration: number;
  sceneGeneration: number;
  seoPack: number;
  thumbnailImage: number;
  voice: number;
  video: VideoCostConfig;
}

// Initial TEST values as specified in requirements
export const GENERATION_CREDIT_COSTS: CreditCostConfig = {
  ideaGeneration: 1,
  scriptGeneration: 2,
  sceneGeneration: 3,
  seoPack: 2,
  thumbnailImage: 5,
  voice: 10,
  video: {
    baseCost: 15,
    costPer15s: 5,
    modelMultipliers: {
      standard: 1.0,
      hd: 1.5,
      cinematic: 2.0,
    },
  },
};

export function calculateVideoCreditCost(durationSeconds: number = 60, model: string = 'standard'): number {
  const blocks = Math.max(1, Math.ceil(durationSeconds / 15));
  const mult = GENERATION_CREDIT_COSTS.video.modelMultipliers[model] || 1.0;
  const raw = GENERATION_CREDIT_COSTS.video.baseCost + blocks * GENERATION_CREDIT_COSTS.video.costPer15s;
  return Math.round(raw * mult);
}

export interface PlanConfig {
  id: 'free' | 'pro' | 'creator' | 'business';
  name: string;
  monthlyPriceINR: number;
  monthlyCredits: number;
  description: string;
  popular?: boolean;
}

export const PLAN_DEFINITIONS: Record<'free' | 'pro' | 'creator' | 'business', PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPriceINR: 0,
    monthlyCredits: 50,
    description: 'Explore CreatorNova AI tools with 50 monthly credits',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPriceINR: 299,
    monthlyCredits: 1000,
    description: 'For active creators producing weekly high-retention content',
    popular: true,
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    monthlyPriceINR: 799,
    monthlyCredits: 4000,
    description: 'For high-frequency daily shorts, reels, and video production',
  },
  business: {
    id: 'business',
    name: 'Business',
    monthlyPriceINR: 1999,
    monthlyCredits: 12000,
    description: 'For creative studios, agencies, and full production teams',
  },
};

export const INITIAL_FREE_PLAN_CREDITS = PLAN_DEFINITIONS.free.monthlyCredits; // 50
export const REFERRAL_REWARD_CREDITS = 25; // Bonus credits awarded per qualified referral
