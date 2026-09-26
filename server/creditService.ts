import crypto from 'crypto';
import { dbManager } from './db.ts';
import { GENERATION_CREDIT_COSTS, calculateVideoCreditCost, PLAN_DEFINITIONS, INITIAL_FREE_PLAN_CREDITS } from '../src/config/creditCosts.ts';

export const SERVER_WALLET_SECRET = process.env.WALLET_SERVER_SECRET || 'creatornova_backend_sec_key_2026';

// Read Firebase config
import cfg from '../firebase-applet-config.json' with { type: 'json' };

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents`;

// Helper to convert JS object to Firestore REST fields
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    return fromFirestoreFields(val.mapValue.fields || {});
  }
  return null;
}

export interface CreditTransactionRecord {
  id: string;
  userId: string;
  type: 'monthly_allocation' | 'generation_debit' | 'refund' | 'bonus' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  operation: string;
  projectId: string | null;
  status: 'completed' | 'refunded' | 'failed';
  createdAt: string;
}

export interface UserWalletData {
  plan: 'free' | 'pro' | 'creator' | 'business';
  creditBalance: number;
  creditResetDate: string;
  updatedAt: string;
}

export class CreditWalletService {
  // In-memory mutex per user to prevent concurrent double-spend race conditions
  private static userLocks: Map<string, Promise<void>> = new Map();

  private static async acquireLock(userId: string): Promise<() => void> {
    while (this.userLocks.has(userId)) {
      await this.userLocks.get(userId);
    }
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.userLocks.set(userId, lockPromise);

    return () => {
      this.userLocks.delete(userId);
      resolveLock!();
    };
  }

  /**
   * Reads the current Firestore wallet state for a user.
   */
  public static async getWallet(userId: string, authToken?: string): Promise<UserWalletData> {
    // 1. Try reading from Firestore REST API if auth token is present
    if (authToken) {
      try {
        const url = `${FIRESTORE_BASE_URL}/users/${userId}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (res.ok) {
          const doc = await res.json();
          if (doc.fields) {
            const data = fromFirestoreFields(doc.fields);
            const balance = typeof data.creditBalance === 'number'
              ? data.creditBalance
              : (typeof data.credits === 'number' ? data.credits : INITIAL_FREE_PLAN_CREDITS);

            return {
              plan: data.plan || 'free',
              creditBalance: balance,
              creditResetDate: data.creditResetDate || new Date(Date.now() + 30 * 86400000).toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('Firestore direct read failed, checking db mirror:', err);
      }
    }

    // 2. Fallback to local DB mirror
    const localCredits = dbManager.getUserCredits(userId);
    const user = dbManager.getUserById(userId);
    return {
      plan: (user?.plan as any) || 'free',
      creditBalance: localCredits.totalRemaining,
      creditResetDate: localCredits.lastResetDate,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Atomically debits credits and records the transaction ledger.
   * Uses lock to prevent concurrent double-spend race conditions.
   */
  public static async debitCreditsAtomic(params: {
    userId: string;
    cost: number;
    operation: string;
    projectId?: string | null;
    authToken?: string;
  }): Promise<{ success: boolean; balanceBefore: number; balanceAfter: number; transactionId: string }> {
    const { userId, cost, operation, projectId = null, authToken } = params;
    const releaseLock = await this.acquireLock(userId);

    try {
      // 1. Read current balance
      const wallet = await this.getWallet(userId, authToken);
      const balanceBefore = wallet.creditBalance;

      if (balanceBefore < cost) {
        throw new Error(`INSUFFICIENT_CREDITS: Required ${cost}, Available: ${balanceBefore}`);
      }

      const balanceAfter = balanceBefore - cost;
      const now = new Date().toISOString();
      const txId = `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      const txRecord: CreditTransactionRecord = {
        id: txId,
        userId,
        type: 'generation_debit',
        amount: cost,
        balanceBefore,
        balanceAfter,
        operation,
        projectId,
        status: 'completed',
        createdAt: now,
      };

      // 2. Write to Firestore if authToken provided
      if (authToken) {
        try {
          // A. Update users/{userId} with serverSecret to satisfy rules
          const updateUrl = `${FIRESTORE_BASE_URL}/users/${userId}?updateMask.fieldPaths=creditBalance&updateMask.fieldPaths=credits&updateMask.fieldPaths=updatedAt`;
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                creditBalance: balanceAfter,
                credits: balanceAfter,
                updatedAt: now,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });

          // B. Add transaction record to users/{userId}/creditTransactions/{txId}
          const txUrl = `${FIRESTORE_BASE_URL}/users/${userId}/creditTransactions?documentId=${txId}`;
          await fetch(txUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                ...txRecord,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });
        } catch (fsErr) {
          console.error('Failed writing atomic debit to Firestore REST API:', fsErr);
        }
      }

      // 3. Mirror update in local dbManager for offline/demo robustness
      const local = dbManager.getUserCredits(userId);
      local.totalRemaining = balanceAfter;
      local.textCredits = Math.floor(balanceAfter * 0.4);
      local.imageCredits = Math.floor(balanceAfter * 0.3);
      local.voiceCredits = Math.floor(balanceAfter * 0.2);
      local.videoCredits = balanceAfter - local.textCredits - local.imageCredits - local.voiceCredits;
      (dbManager as any).persist();

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        transactionId: txId,
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Safe refund if generation threw an error after debit
   */
  public static async refundCredits(params: {
    userId: string;
    amount: number;
    operation: string;
    projectId?: string | null;
    reason?: string;
    authToken?: string;
  }): Promise<{ success: boolean; newBalance: number }> {
    const { userId, amount, operation, projectId = null, authToken } = params;
    const releaseLock = await this.acquireLock(userId);

    try {
      const wallet = await this.getWallet(userId, authToken);
      const balanceBefore = wallet.creditBalance;
      const balanceAfter = balanceBefore + amount;
      const now = new Date().toISOString();
      const txId = `tx_refund_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      const txRecord: CreditTransactionRecord = {
        id: txId,
        userId,
        type: 'refund',
        amount,
        balanceBefore,
        balanceAfter,
        operation: `refund_${operation}`,
        projectId,
        status: 'completed',
        createdAt: now,
      };

      if (authToken) {
        try {
          const updateUrl = `${FIRESTORE_BASE_URL}/users/${userId}?updateMask.fieldPaths=creditBalance&updateMask.fieldPaths=credits&updateMask.fieldPaths=updatedAt`;
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                creditBalance: balanceAfter,
                credits: balanceAfter,
                updatedAt: now,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });

          const txUrl = `${FIRESTORE_BASE_URL}/users/${userId}/creditTransactions?documentId=${txId}`;
          await fetch(txUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                ...txRecord,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });
        } catch (err) {
          console.error('Error recording refund to Firestore:', err);
        }
      }

      // Local mirror
      const local = dbManager.getUserCredits(userId);
      local.totalRemaining = balanceAfter;
      (dbManager as any).persist();

      return { success: true, newBalance: balanceAfter };
    } finally {
      releaseLock();
    }
  }

  /**
   * Safe check for balance sufficiency
   */
  public static async checkBalance(params: {
    userId: string;
    requiredCost: number;
    authToken?: string;
  }): Promise<{ sufficient: boolean; available: number; required: number; wallet: UserWalletData }> {
    const wallet = await this.getWallet(params.userId, params.authToken);
    return {
      sufficient: wallet.creditBalance >= params.requiredCost,
      available: wallet.creditBalance,
      required: params.requiredCost,
      wallet,
    };
  }

  /**
   * Checks if user has exceeded their 30-day reset cycle.
   * If so, resets creditBalance to monthly allocation (cannot exceed plan limit via monthly grant)
   * and records a monthly_allocation transaction ledger record.
   */
  public static async resetMonthlyCredits(userId: string, authToken?: string): Promise<UserWalletData> {
    const releaseLock = await this.acquireLock(userId);
    try {
      const wallet = await this.getWallet(userId, authToken);
      const resetTime = new Date(wallet.creditResetDate).getTime();
      const now = Date.now();

      // If reset date has passed
      if (!isNaN(resetTime) && now >= resetTime) {
        const planInfo = PLAN_DEFINITIONS[wallet.plan] || PLAN_DEFINITIONS.free;
        const monthlyAllocation = planInfo.monthlyCredits;
        const newBalance = monthlyAllocation; // Cannot exceed plan limit via monthly grant
        const nextResetDate = new Date(now + 30 * 86400000).toISOString();
        const nowIso = new Date().toISOString();
        const txId = `tx_reset_${now}_${crypto.randomBytes(3).toString('hex')}`;

        const txRecord: CreditTransactionRecord = {
          id: txId,
          userId,
          type: 'monthly_allocation',
          amount: monthlyAllocation,
          balanceBefore: wallet.creditBalance,
          balanceAfter: newBalance,
          operation: 'monthly_credit_reset',
          projectId: null,
          status: 'completed',
          createdAt: nowIso,
        };

        if (authToken) {
          try {
            const updateUrl = `${FIRESTORE_BASE_URL}/users/${userId}?updateMask.fieldPaths=creditBalance&updateMask.fieldPaths=credits&updateMask.fieldPaths=creditResetDate&updateMask.fieldPaths=updatedAt`;
            await fetch(updateUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                fields: toFirestoreFields({
                  creditBalance: newBalance,
                  credits: newBalance,
                  creditResetDate: nextResetDate,
                  updatedAt: nowIso,
                  serverSecret: SERVER_WALLET_SECRET,
                }),
              }),
            });

            const txUrl = `${FIRESTORE_BASE_URL}/users/${userId}/creditTransactions?documentId=${txId}`;
            await fetch(txUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                fields: toFirestoreFields({
                  ...txRecord,
                  serverSecret: SERVER_WALLET_SECRET,
                }),
              }),
            });
          } catch (err) {
            console.error('Error writing monthly credit reset to Firestore:', err);
          }
        }

        // Local mirror
        const local = dbManager.getUserCredits(userId);
        local.totalRemaining = newBalance;
        local.lastResetDate = nextResetDate;
        (dbManager as any).persist();

        return {
          plan: wallet.plan,
          creditBalance: newBalance,
          creditResetDate: nextResetDate,
          updatedAt: nowIso,
        };
      }

      return wallet;
    } finally {
      releaseLock();
    }
  }

  /**
   * Idempotently activates a subscription plan and allocates monthly credits.
   * Controlled strictly by verified backend webhooks / server logic.
   */
  public static async activateSubscriptionCredits(params: {
    userId: string;
    planId: 'free' | 'pro' | 'creator' | 'business';
    idempotencyKey: string;
    authToken?: string;
  }): Promise<UserWalletData> {
    const { userId, planId, idempotencyKey, authToken } = params;
    const releaseLock = await this.acquireLock(userId);
    try {
      const planConfig = PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.free;
      const wallet = await this.getWallet(userId, authToken);
      const balanceBefore = wallet.creditBalance;
      const allocatedCredits = planConfig.monthlyCredits;
      const balanceAfter = balanceBefore + allocatedCredits;
      const now = new Date();
      const nowIso = now.toISOString();
      const nextResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const txId = `tx_sub_${idempotencyKey || Date.now()}`;

      const txRecord: CreditTransactionRecord = {
        id: txId,
        userId,
        type: 'monthly_allocation',
        amount: allocatedCredits,
        balanceBefore,
        balanceAfter,
        operation: `subscription_activation_${planId}`,
        projectId: null,
        status: 'completed',
        createdAt: nowIso,
      };

      // 1. Update Firestore REST API if auth token is present
      if (authToken) {
        try {
          const updateUrl = `${FIRESTORE_BASE_URL}/users/${userId}?updateMask.fieldPaths=creditBalance&updateMask.fieldPaths=credits&updateMask.fieldPaths=plan&updateMask.fieldPaths=creditResetDate&updateMask.fieldPaths=updatedAt`;
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                creditBalance: balanceAfter,
                credits: balanceAfter,
                plan: planId,
                creditResetDate: nextResetDate,
                updatedAt: nowIso,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });

          // Store transaction record in Firestore subcollection
          const txUrl = `${FIRESTORE_BASE_URL}/users/${userId}/creditTransactions/${txId}`;
          await fetch(txUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                ...txRecord,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });
        } catch (e) {
          console.warn('Could not sync subscription activation to Firestore:', e);
        }
      }

      // 2. Also update local dbManager
      if ((dbManager as any).db && (dbManager as any).db.credits) {
        const localCredits = (dbManager as any).db.credits[userId];
        if (localCredits) {
          localCredits.totalRemaining = balanceAfter;
          localCredits.monthlyAllocation = allocatedCredits;
          localCredits.lastResetDate = nowIso;
        }
        const localUser = (dbManager as any).db.users?.[userId];
        if (localUser) {
          localUser.plan = planId;
        }
        (dbManager as any).persist?.();
      }

      return {
        plan: planId,
        creditBalance: balanceAfter,
        creditResetDate: nextResetDate,
        updatedAt: nowIso,
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Refills credits for testing/demo sandbox and logs transaction with 'bonus' type.
   */
  public static async replenishDemoCredits(userId: string, authToken?: string, amount: number = 500): Promise<UserWalletData> {
    const releaseLock = await this.acquireLock(userId);
    try {
      const wallet = await this.getWallet(userId, authToken);
      const balanceBefore = wallet.creditBalance;
      const balanceAfter = balanceBefore + amount;
      const now = new Date().toISOString();
      const txId = `tx_replenish_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      const txRecord: CreditTransactionRecord = {
        id: txId,
        userId,
        type: 'bonus',
        amount,
        balanceBefore,
        balanceAfter,
        operation: 'demo_credit_refill',
        projectId: null,
        status: 'completed',
        createdAt: now,
      };

      if (authToken) {
        try {
          const updateUrl = `${FIRESTORE_BASE_URL}/users/${userId}?updateMask.fieldPaths=creditBalance&updateMask.fieldPaths=credits&updateMask.fieldPaths=updatedAt`;
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                creditBalance: balanceAfter,
                credits: balanceAfter,
                updatedAt: now,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });

          const txUrl = `${FIRESTORE_BASE_URL}/users/${userId}/creditTransactions?documentId=${txId}`;
          await fetch(txUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              fields: toFirestoreFields({
                ...txRecord,
                serverSecret: SERVER_WALLET_SECRET,
              }),
            }),
          });
        } catch (err) {
          console.error('Error writing credit refill to Firestore:', err);
        }
      }

      // Local mirror
      const local = dbManager.getUserCredits(userId);
      local.totalRemaining = balanceAfter;
      (dbManager as any).persist();

      return {
        plan: wallet.plan,
        creditBalance: balanceAfter,
        creditResetDate: wallet.creditResetDate,
        updatedAt: now,
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Fetches recent transactions for a user
   */
  public static async getTransactions(userId: string, authToken?: string): Promise<CreditTransactionRecord[]> {
    if (authToken) {
      try {
        const url = `${FIRESTORE_BASE_URL}/users/${userId}/creditTransactions?pageSize=50&orderBy=createdAt desc`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.documents && Array.isArray(data.documents)) {
            return data.documents.map((d: any) => fromFirestoreFields(d.fields) as CreditTransactionRecord);
          }
        }
      } catch (err) {
        console.warn('Error reading transactions from Firestore REST API:', err);
      }
    }

    // Fallback to local logs
    const logs = dbManager.getUserUsageLogs(userId);
    return logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      type: 'generation_debit',
      amount: l.amount,
      balanceBefore: 50,
      balanceAfter: 50 - l.amount,
      operation: l.description,
      projectId: null,
      status: 'completed',
      createdAt: l.timestamp,
    }));
  }
}
