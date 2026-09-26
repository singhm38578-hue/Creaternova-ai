import { CreditBalance } from '../types/content';

const CREDITS_STORAGE_KEY = 'creatornova_credits_v1';

export const CREDIT_COSTS = {
  text: 5,
  image: 20,
  voice: 15,
  video: 50,
};

const DEFAULT_BALANCE: CreditBalance = {
  textCredits: 200,
  imageCredits: 100,
  voiceCredits: 120,
  videoCredits: 50,
  totalRemaining: 470,
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
      return false; // Insufficient credits
    }

    const updated = {
      ...balance,
      [key]: current - amount,
    };
    updated.totalRemaining =
      updated.textCredits + updated.imageCredits + updated.voiceCredits + updated.videoCredits;

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
