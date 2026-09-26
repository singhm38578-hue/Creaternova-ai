import React, { useState, useRef, useEffect } from 'react';
import {
  Coins,
  ChevronDown,
  Zap,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CreditBadgeDropdownProps {
  onNavigateToUsage?: () => void;
  onNavigateToPricing?: () => void;
}

export const CreditBadgeDropdown: React.FC<CreditBadgeDropdownProps> = ({
  onNavigateToUsage,
  onNavigateToPricing,
}) => {
  const { credits, creditConfig, isLowCredits, replenishDemoCredits } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const totalRemaining = credits?.totalRemaining || 850;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
          isLowCredits
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-200'
        }`}
      >
        <Coins className={`w-3.5 h-3.5 ${isLowCredits ? 'text-amber-400' : 'text-amber-400'}`} />
        <div className="flex items-center gap-1.5 font-mono">
          <span className="hidden sm:inline text-slate-400 text-[11px]">CreatorNova Credits</span>
          <span className="font-extrabold text-white">{totalRemaining}</span>
          <span className="text-[10px] text-slate-400">remaining</span>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 space-y-3.5 z-50 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Credit Wallet</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {totalRemaining} Available
            </span>
          </div>

          {/* Low Credit Alert */}
          {isLowCredits && (
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/40 text-[11px] text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>You're running low on CreatorNova Credits. Upgrade your plan to prevent generation pauses.</span>
            </div>
          )}

          {/* Category breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-400" />
                Text Pool
              </span>
              <div className="font-mono font-bold text-white text-sm">{credits?.textCredits || 0}</div>
              <span className="text-[9px] text-slate-500">{creditConfig?.textCost || 2} credits / script</span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-purple-400" />
                Image Pool
              </span>
              <div className="font-mono font-bold text-purple-300 text-sm">{credits?.imageCredits || 0}</div>
              <span className="text-[9px] text-slate-500">{creditConfig?.imageCost || 5} credits / thumb</span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Mic className="w-3 h-3 text-cyan-400" />
                Voice Pool
              </span>
              <div className="font-mono font-bold text-cyan-300 text-sm">{credits?.voiceCredits || 0}</div>
              <span className="text-[9px] text-slate-500">{creditConfig?.voiceCost || 3} credits / voice</span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Video className="w-3 h-3 text-rose-400" />
                Video Pool
              </span>
              <div className="font-mono font-bold text-rose-300 text-sm">{credits?.videoCredits || 0}</div>
              <span className="text-[9px] text-slate-500">{creditConfig?.videoCost || 20} credits / seq</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-1 flex flex-col gap-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToPricing) onNavigateToPricing();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <span>Upgrade Plan</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToUsage) onNavigateToUsage();
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                View Usage
              </button>
            </div>

            <button
              onClick={() => {
                replenishDemoCredits();
                setIsOpen(false);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-400 text-center py-1 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>Reset / Refill Demo Credits</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
