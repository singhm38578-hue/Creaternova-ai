import React, { useState } from 'react';
import { X, Coins, Zap, RefreshCw, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GENERATION_CREDIT_COSTS, PLAN_DEFINITIONS } from '../config/creditCosts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsUpdated?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onCreditsUpdated,
}) => {
  const { user, credits, creditConfig, replenishDemoCredits, refreshCredits } = useAuth();
  const [replenishing, setReplenishing] = useState(false);
  const [replenished, setReplenished] = useState(false);

  if (!isOpen) return null;

  const currentPlan = user?.plan || 'free';
  const planInfo = PLAN_DEFINITIONS[currentPlan] || PLAN_DEFINITIONS.free;
  const totalRemaining = credits?.totalRemaining !== undefined ? credits.totalRemaining : 50;

  const handleReplenish = async () => {
    setReplenishing(true);
    try {
      await replenishDemoCredits();
      await refreshCredits();
      setReplenished(true);
      if (onCreditsUpdated) onCreditsUpdated();
      setTimeout(() => setReplenished(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setReplenishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Creator Profile & Credits</h3>
              <p className="text-xs text-slate-400">CreatorNova Plan: <span className="text-violet-300 font-bold uppercase">{planInfo.name}</span></p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credit Breakdown Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              Available Usage Credits
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {totalRemaining} Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Text Generation</span>
              <div className="text-xl font-black text-white font-mono">{credits?.textCredits || 0}</div>
              <p className="text-[10px] text-slate-400">Cost: {creditConfig?.textCost || GENERATION_CREDIT_COSTS.ideaGeneration} - {creditConfig?.scriptCost || GENERATION_CREDIT_COSTS.scriptGeneration} credits / action</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Image / Thumbnails</span>
              <div className="text-xl font-black text-purple-400 font-mono">{credits?.imageCredits || 0}</div>
              <p className="text-[10px] text-slate-400">Cost: {creditConfig?.imageCost || GENERATION_CREDIT_COSTS.thumbnailImage} credits / thumb</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Voice Generation</span>
              <div className="text-xl font-black text-cyan-400 font-mono">{credits?.voiceCredits || 0}</div>
              <p className="text-[10px] text-slate-400">Cost: {creditConfig?.voiceCost || GENERATION_CREDIT_COSTS.voice} credits / voice</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Video Sequences</span>
              <div className="text-xl font-black text-red-400 font-mono">{credits?.videoCredits || 0}</div>
              <p className="text-[10px] text-slate-400">Cost: {creditConfig?.videoCost || GENERATION_CREDIT_COSTS.video.baseCost} credits base</p>
            </div>
          </div>
        </div>

        {/* Demo Replenish Action */}
        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Demo Credit Refill
            </span>
            <p className="text-[11px] text-slate-400">Refill your balance anytime for testing.</p>
          </div>

          <button
            onClick={handleReplenish}
            disabled={replenishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
          >
            {replenished ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <RefreshCw className={`w-3.5 h-3.5 ${replenishing ? 'animate-spin' : ''}`} />
            )}
            <span>{replenished ? 'Replenished!' : replenishing ? 'Refilling...' : 'Refill'}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
