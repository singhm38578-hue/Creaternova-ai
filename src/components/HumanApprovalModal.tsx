import React from 'react';
import {
  ShieldAlert,
  Coins,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Globe,
  Trash2
} from 'lucide-react';

export type ApprovalType = 'generation' | 'delete_project' | 'publish' | 'paid_operation';

interface HumanApprovalModalProps {
  isOpen: boolean;
  type: ApprovalType;
  title: string;
  description: string;
  details?: {
    creditsCost?: number;
    remainingCredits?: number;
    targetName?: string;
    warningText?: string;
  };
  confirmButtonText?: string;
  onConfirm: () => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  isOpen,
  type,
  title,
  description,
  details,
  confirmButtonText = 'Review & Confirm',
  onConfirm,
  onClose,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  const isDestructive = type === 'delete_project';
  const isPublish = type === 'publish';
  const isCredit = type === 'generation' && !!details?.creditsCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Accent Stripe */}
        <div
          className={`h-1.5 w-full ${
            isDestructive
              ? 'bg-red-500'
              : isPublish
              ? 'bg-amber-500'
              : 'bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500'
          }`}
        />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : isPublish
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-6 h-6" />
              ) : isPublish ? (
                <Globe className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Security & Confirmation
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{title}</h3>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{description}</p>

          {/* Details Card */}
          {details && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              {details.targetName && (
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Item:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">{details.targetName}</span>
                </div>
              )}

              {isCredit && (
                <>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Coins className="w-3.5 h-3.5 text-amber-400" /> Credit Cost:
                    </span>
                    <span className="font-bold text-amber-300">{details.creditsCost} Credits</span>
                  </div>
                  {details.remainingCredits !== undefined && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Balance After Execution:</span>
                      <span className="font-semibold text-slate-200">
                        {Math.max(0, details.remainingCredits - (details.creditsCost || 0))} Credits
                      </span>
                    </div>
                  )}
                </>
              )}

              {details.warningText && (
                <div className="flex items-start gap-2 pt-2 border-t border-slate-800 text-amber-300/90">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{details.warningText}</span>
                </div>
              )}
            </div>
          )}

          {/* Agent Safety Guarantee Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized by you. No hidden charges or automatic external publishes.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-lg flex items-center gap-2 transition-all ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{confirmButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
