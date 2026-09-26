import { CreditBalance } from '../types/content';
import { GENERATION_CREDIT_COSTS, INITIAL_FREE_PLAN_CREDITS } from '../config/creditCosts';

const CREDITS_STORAGE_KEY = 'creatornova_credits_v2';

export const CREDIT_COSTS = {
  idea: GENERATION_CREDIT_COSTS.ideaGeneration,
  script: GENERATION_CREDIT_COSTS.scriptGeneration,
  scene: GENERATION_CREDIT_COSTS.sceneGeneration,
  seo: GENERATION_CREDIT_COSTS.seoPack,
  image: GENERATION_CREDIT_COSTS.thumbnailImage,
  voice: GENERATION_CREDIT_COSTS.voice,
  video: GENERATION_CREDIT_COSTS.video.baseCost,
};

const DEFAULT_BALANCE: CreditBalance = {
  textCredits: Math.floor(INITIAL_FREE_PLAN_CREDITS * 0.4),
  imageCredits: Math.floor(INITIAL_FREE_PLAN_CREDITS * 0.3),
  voiceCredits: Math.floor(INITIAL_FREE_PLAN_CREDITS * 0.2),
  videoCredits: Math.floor(INITIAL_FREE_PLAN_CREDITS * 0.1),
  totalRemaining: INITIAL_FREE_PLAN_CREDITS,
};

export function getCreditBalance(): CreditBalance {
  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(DEFAULT_BALANCE));
      return DEFAULT_BALANCE;
    }
    const parsed = JSON.parse(raw);
    const totalRemaining =
      (parsed.textCredits || 0) +
      (parsed.imageCredits || 0) +
      (parsed.voiceCredits || 0) +
      (parsed.videoCredits || 0);
    return { ...parsed, totalRemaining };
  } catch (e) {
    return DEFAULT_BALANCE;
  }
}

export function deductCredits(type: 'text' | 'image' | 'voice' | 'video', amount: number): boolean {
  try {
    const balance = getCreditBalance();
    const key = `${type}Credits` as keyof CreditBalance;
    const current = balance[key] as number;

    if (current < amount) {
      if (balance.totalRemaining < amount) return false;
    }

    const updated = {
      ...balance,
      [key]: Math.max(0, current - amount),
      totalRemaining: Math.max(0, balance.totalRemaining - amount),
    };

    localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    return false;
  }
}

export function replenishCredits(): CreditBalance {
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(DEFAULT_BALANCE));
  return DEFAULT_BALANCE;
}
