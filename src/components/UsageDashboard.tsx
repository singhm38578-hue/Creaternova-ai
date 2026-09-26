import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Clock,
  Calendar,
  AlertCircle,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studioApi } from '../services/api';
import { getCreditTransactions, CreditTransactionRecord } from '../services/firebase';
import { GENERATION_CREDIT_COSTS, PLAN_DEFINITIONS } from '../config/creditCosts';

export const UsageDashboard: React.FC = () => {
  const { credits, user, replenishDemoCredits, openPricingModal, refreshCredits } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        // 1. Fetch from Firestore creditTransactions
        const fsTx = await getCreditTransactions(user.id);
        if (fsTx && fsTx.length > 0) {
          setTransactions(fsTx);
          return;
        }
      }
      // 2. Fallback to API endpoint
      const res = await studioApi.credits.getTransactions();
      if (res.transactions) {
        setTransactions(res.transactions as any);
      }
    } catch (err) {
      console.warn('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    refreshCredits();
  }, [user?.id]);

  const currentPlan = user?.plan || 'free';
  const planInfo = PLAN_DEFINITIONS[currentPlan] || PLAN_DEFINITIONS.free;
  const totalAllocation = credits?.monthlyAllocation || planInfo.monthlyCredits;
  const totalRemaining = credits?.totalRemaining !== undefined ? credits.totalRemaining : 50;
  const totalUsed = Math.max(0, totalAllocation - totalRemaining);
  const percentUsed = Math.min(100, Math.round((totalUsed / totalAllocation) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Usage & Credit Wallet</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-600/30 text-violet-300 border border-violet-500/40">
                {planInfo.name} Plan
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Authoritative Firestore-backed balance, automated generation deductions, and transaction ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={async () => {
              await replenishDemoCredits();
              await fetchTransactions();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Refill Balance</span>
          </button>

          <button
            onClick={openPricingModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* Main Stats Row: Plan, Credits Remaining, Current Period Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-violet-400" />
            Current Plan
          </span>
          <div className="text-2xl font-black text-white capitalize">{planInfo.name}</div>
          <p className="text-[11px] text-slate-400">
            {planInfo.monthlyPriceINR === 0 ? '₹0/month' : `₹${planInfo.monthlyPriceINR}/month`} • {planInfo.monthlyCredits.toLocaleString()} credits/mo
          </p>
        </div>

        {/* Credits Remaining */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Credits Remaining
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {totalRemaining.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Real-time balance in Cloud Firestore
          </p>
        </div>

        {/* Current Period Usage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Current Period Usage
          </span>
          <div className="text-2xl font-black text-white font-mono">
            {totalUsed.toLocaleString()} <span className="text-xs text-slate-400 font-normal">used</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {percentUsed}% of {totalAllocation.toLocaleString()} allocation consumed
          </p>
        </div>
      </div>

      {/* Main Billing Period Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Monthly Credit Cycle ({new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white font-mono">
                {totalRemaining.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {totalAllocation.toLocaleString()} monthly credits remaining
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-violet-400 font-bold">
              {percentUsed}% Consumed
            </span>
            <p className="text-[11px] text-slate-500">Idempotent monthly cycle</p>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className="bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400 h-2 rounded-full transition-all duration-700"
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
          <span>0 Credits</span>
          <span>50%</span>
          <span>{totalAllocation.toLocaleString()} Credits</span>
        </div>
      </div>

      {/* Configurable Generation Costs Reference */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Idea Generation</span>
          <div className="text-lg font-black text-blue-400 font-mono">{GENERATION_CREDIT_COSTS.ideaGeneration} credit</div>
          <span className="text-[10px] text-slate-500">per generation request</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Script Generation</span>
          <div className="text-lg font-black text-purple-400 font-mono">{GENERATION_CREDIT_COSTS.scriptGeneration} credits</div>
          <span className="text-[10px] text-slate-500">per full script beat</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Scene Generation</span>
          <div className="text-lg font-black text-cyan-400 font-mono">{GENERATION_CREDIT_COSTS.sceneGeneration} credits</div>
          <span className="text-[10px] text-slate-500">per storyboard shotlist</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">SEO Pack</span>
          <div className="text-lg font-black text-emerald-400 font-mono">{GENERATION_CREDIT_COSTS.seoPack} credits</div>
          <span className="text-[10px] text-slate-500">titles, tags & description</span>
        </div>
      </div>

      {/* Recent Transactions Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Transactions Ledger
            </h3>
          </div>
          <button
            onClick={fetchTransactions}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            No credit transactions recorded yet. Credits are automatically logged when generating content.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.map((tx) => (
              <div key={tx.id || Math.random().toString()} className="py-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200 capitalize">
                    {tx.operation ? tx.operation.replace(/_/g, ' ') : (tx.type ? tx.type.replace(/_/g, ' ') : 'Credit Adjustment')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(tx.createdAt).toLocaleString()} • {tx.type} • Status: <span className="text-emerald-400">{tx.status}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold ${tx.type === 'generation_debit' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tx.type === 'generation_debit' ? `-${tx.amount}` : `+${tx.amount}`} credits
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Bal: {tx.balanceAfter}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
