/**
 * Centralized Server-Side AI Cost & Profit Protection Configuration
 * 
 * Operations:
 * 1. idea_generation
 * 2. script_generation
 * 3. scene_generation
 * 4. seo_generation
 * 5. thumbnail_generation
 * 6. image_generation
 * 7. voice_generation
 * 8. video_generation
 * 9. translation
 * 10. repurposing
 */

export interface AIOperationConfig {
  operation: string;
  label: string;
  provider: string;
  model: string;
  creditCost: number;
  estimatedProviderCost: number | null; // USD or INR per call. null when unconfigured
  currency: 'USD' | 'INR';
  enabled: boolean;
  category: 'text' | 'image' | 'voice' | 'video';
  description: string;
}

export interface AISafetyLimits {
  maxCreditsPerRequest: number;
  maxVideoDurationSeconds: number;
  dailyUsageLimitCredits: number;
  monthlyPlanAllowance: Record<'free' | 'pro' | 'creator' | 'business', number>;
}

export interface VideoCostCalculationParams {
  provider?: string;
  model?: 'standard' | 'hd' | 'cinematic';
  durationSeconds: number;
  resolution?: '720p' | '1080p' | '4k';
  numberOfVideos?: number;
}

export interface VideoCostCalculationResult {
  provider: string;
  model: string;
  durationSeconds: number;
  resolution: string;
  numberOfVideos: number;
  blocksCount: number;
  baseCredits: number;
  blockCredits: number;
  resolutionMultiplier: number;
  modelMultiplier: number;
  totalEstimatedCredits: number;
  isExpensive: boolean; // Flagged when >= 20 credits
}

// 1. Centralized AI Operations Configuration
export const AI_OPERATIONS_CONFIG: Record<string, AIOperationConfig> = {
  idea_generation: {
    operation: 'idea_generation',
    label: 'Idea & Angle Generation',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 1,
    estimatedProviderCost: null, // Real billing cost unconfigured
    currency: 'USD',
    enabled: true,
    category: 'text',
    description: 'Generates viral angles, audience hooks, retention tactics, and format analysis',
  },
  script_generation: {
    operation: 'script_generation',
    label: 'Full Screenplay & Script Writing',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 2,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'text',
    description: 'Full video script with scene-by-scene timing, voiceover dialogue, and stage directions',
  },
  scene_generation: {
    operation: 'scene_generation',
    label: 'Scene & Visual Breakdown',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 3,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'text',
    description: 'Detailed camera directions, character clothing, props, and lighting breakdown',
  },
  seo_generation: {
    operation: 'seo_generation',
    label: 'SEO & Metadata Pack',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 2,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'text',
    description: 'High-CTR YouTube titles, algorithmic descriptions, 15+ tags, and social copy',
  },
  thumbnail_generation: {
    operation: 'thumbnail_generation',
    label: 'Thumbnail Prompt Engineering',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 5,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'image',
    description: 'Hyper-detailed 3D photorealistic composition prompt with 3-word headline typography',
  },
  image_generation: {
    operation: 'image_generation',
    label: 'Scene Media & Image Prompt',
    provider: 'google',
    model: 'imagen-3.0-fast',
    creditCost: 5,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'image',
    description: 'Visual identity asset prompts with exact lighting, camera lens, and palette rules',
  },
  voice_generation: {
    operation: 'voice_generation',
    label: 'Neural Voiceover & Audio Pipeline',
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    creditCost: 10,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'voice',
    description: 'Natural timbre synthesis, phonetic pronunciation formatting, and subtitle timing sync',
  },
  video_generation: {
    operation: 'video_generation',
    label: 'Variable Video Sequence Generation',
    provider: 'runway',
    model: 'gen3_alpha',
    creditCost: 20, // Base cost for standard 15s sequence
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'video',
    description: 'Dynamic neural video rendering with variable duration, resolution, and clip multipliers',
  },
  translation: {
    operation: 'translation',
    label: 'Multi-Language Translation & Localization',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 2,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'text',
    description: 'Culturally localized translation maintaining viral tone, pacing, and retention slang',
  },
  repurposing: {
    operation: 'repurposing',
    label: 'Autonomous Multi-Platform Repurposing',
    provider: 'google',
    model: 'gemini-2.5-flash',
    creditCost: 3,
    estimatedProviderCost: null,
    currency: 'USD',
    enabled: true,
    category: 'text',
    description: 'Transmutes long scripts into Reels, TikTok hooks, LinkedIn threads, and carousels',
  },
};

// 2. Configurable Safety & Usage Limits
export const AI_SAFETY_LIMITS: AISafetyLimits = {
  maxCreditsPerRequest: 250,
  maxVideoDurationSeconds: 180, // Maximum single video duration (3 minutes)
  dailyUsageLimitCredits: 5000, // Maximum credits any single user can consume per day
  monthlyPlanAllowance: {
    free: 50,
    pro: 1000,
    creator: 4000,
    business: 12000,
  },
};

// 3. Provider Real Cost Tracking Flag
// When false, Admin Plan Economics strictly displays "COST DATA REQUIRED" instead of fake profit estimates
export const REAL_PROVIDER_PRICING_CONFIGURED = false;

// 4. Expensive Video Variable Cost Protection
export function calculateEstimatedVideoCost(params: VideoCostCalculationParams): VideoCostCalculationResult {
  const provider = params.provider || 'runway';
  const model = params.model || 'standard';
  const durationSeconds = Math.max(5, Math.min(params.durationSeconds || 15, AI_SAFETY_LIMITS.maxVideoDurationSeconds));
  const resolution = params.resolution || '1080p';
  const numberOfVideos = Math.max(1, params.numberOfVideos || 1);

  // Each 15 seconds constitutes 1 video block
  const blocksCount = Math.max(1, Math.ceil(durationSeconds / 15));
  const baseCredits = 15;
  const costPer15sBlock = 5;

  // Resolution multiplier
  const resolutionMultipliers: Record<string, number> = {
    '720p': 1.0,
    '1080p': 1.4,
    '4k': 2.2,
  };
  const resMult = resolutionMultipliers[resolution] || 1.4;

  // Model multiplier
  const modelMultipliers: Record<string, number> = {
    standard: 1.0,
    hd: 1.5,
    cinematic: 2.0,
  };
  const modMult = modelMultipliers[model] || 1.0;

  // Formula: (baseCredits + (blocksCount - 1) * costPer15sBlock) * resMult * modMult * numberOfVideos
  const rawCreditsPerVideo = (baseCredits + (blocksCount - 1) * costPer15sBlock) * resMult * modMult;
  const totalEstimatedCredits = Math.round(rawCreditsPerVideo * numberOfVideos);

  return {
    provider,
    model,
    durationSeconds,
    resolution,
    numberOfVideos,
    blocksCount,
    baseCredits,
    blockCredits: (blocksCount - 1) * costPer15sBlock,
    resolutionMultiplier: resMult,
    modelMultiplier: modMult,
    totalEstimatedCredits,
    isExpensive: totalEstimatedCredits >= 20,
  };
}

// 5. Safe Client Metadata (no sensitive profit or cost data leaked to normal users)
export function getClientSafeOperationsMeta() {
  const meta: Record<string, {
    operation: string;
    label: string;
    creditCost: number;
    enabled: boolean;
    category: string;
    provider: string;
    model: string;
  }> = {};

  for (const [key, op] of Object.entries(AI_OPERATIONS_CONFIG)) {
    meta[key] = {
      operation: op.operation,
      label: op.label,
      creditCost: op.creditCost,
      enabled: op.enabled,
      category: op.category,
      provider: op.provider,
      model: op.model,
    };
  }

  return {
    operations: meta,
    limits: {
      maxCreditsPerRequest: AI_SAFETY_LIMITS.maxCreditsPerRequest,
      maxVideoDurationSeconds: AI_SAFETY_LIMITS.maxVideoDurationSeconds,
    },
  };
}
