import React from 'react';
import { AlertCircle, Coins, ArrowRight, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const InsufficientCreditModal: React.FC = () => {
  const {
    isInsufficientCreditModalOpen,
    closeInsufficientCreditModal,
    insufficientCreditCost,
    credits,
    openPricingModal,
  } = useAuth();

  if (!isInsufficientCreditModalOpen) return null;

  const totalRemaining = credits?.totalRemaining || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-5 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-600/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-600/20">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-white tracking-tight">
            Not enough credits for this generation.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            This AI creation requires <strong className="text-white">{insufficientCreditCost} credits</strong>, but your wallet currently has <strong className="text-amber-400">{totalRemaining} credits</strong> remaining.
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs flex items-center justify-between font-mono">
          <span className="text-slate-400">Required Cost:</span>
          <span className="font-bold text-rose-400">-{insufficientCreditCost} credits</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={closeInsufficientCreditModal}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              closeInsufficientCreditModal();
              openPricingModal();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Upgrade</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
