import React, { useState } from 'react';
import { X, Coins, ShieldCheck, Zap, RefreshCw, CheckCircle2, User, Sparkles } from 'lucide-react';
import { getCreditBalance, replenishCredits } from '../services/credits';

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
  const [balance, setBalance] = useState(getCreditBalance());
  const [replenished, setReplenished] = useState(false);

  if (!isOpen) return null;

  const handleReplenish = () => {
    const fresh = replenishCredits();
    setBalance(fresh);
    setReplenished(true);
    if (onCreditsUpdated) onCreditsUpdated();
    setTimeout(() => setReplenished(false), 2000);
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
              <p className="text-xs text-slate-400">CreatorNova Studio Account Tier: Professional</p>
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
              Available SaaS Usage Credits
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {balance.totalRemaining} Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Text Generation</span>
              <div className="text-xl font-black text-white font-mono">{balance.textCredits}</div>
              <p className="text-[10px] text-slate-400">Cost: 5 credits / request</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Image Generation</span>
              <div className="text-xl font-black text-purple-400 font-mono">{balance.imageCredits}</div>
              <p className="text-[10px] text-slate-400">Cost: 20 credits / thumbnail</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Voice Generation</span>
              <div className="text-xl font-black text-cyan-400 font-mono">{balance.voiceCredits}</div>
              <p className="text-[10px] text-slate-400">Cost: 15 credits / voiceover</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Video Generation</span>
              <div className="text-xl font-black text-red-400 font-mono">{balance.videoCredits}</div>
              <p className="text-[10px] text-slate-400">Cost: 50 credits / video</p>
            </div>
          </div>
        </div>

        {/* Demo Replenish Action */}
        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Demo Credit Architecture
            </span>
            <p className="text-[11px] text-slate-400">Reset your balance anytime for testing.</p>
          </div>

          <button
            onClick={handleReplenish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {replenished ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{replenished ? 'Replenished!' : 'Replenish'}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
