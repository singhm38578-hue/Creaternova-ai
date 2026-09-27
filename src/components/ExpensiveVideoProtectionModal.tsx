import React, { useState, useEffect } from 'react';
import {
  Film,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  ShieldAlert,
  Sparkles,
  X,
  Layers,
  Clock,
  Video,
} from 'lucide-react';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ExpensiveVideoProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (calculation: any) => void;
  projectName?: string;
  defaultDuration?: number;
}

export const ExpensiveVideoProtectionModal: React.FC<ExpensiveVideoProtectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName = 'Current Video Project',
  defaultDuration = 30,
}) => {
  const { user } = useAuth();
  const [provider, setProvider] = useState('runway');
  const [model, setModel] = useState<'standard' | 'hd' | 'cinematic'>('hd');
  const [durationSeconds, setDurationSeconds] = useState(defaultDuration);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [numberOfVideos, setNumberOfVideos] = useState(1);
  const [calculation, setCalculation] = useState<any>({
    totalEstimatedCredits: 35,
    baseCredits: 15,
    blockCredits: 5,
    resolutionMultiplier: 1.4,
    modelMultiplier: 1.5,
    blocksCount: 2,
    isExpensive: true,
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  // Recalculate estimated credits whenever params change
  useEffect(() => {
    if (!isOpen) return;
    setIsCalculating(true);
    studioApi.ai
      .calculateVideoCost({
        provider,
        model,
        durationSeconds,
        resolution,
        numberOfVideos,
      })
      .then((res) => {
        setCalculation(res);
      })
      .catch((err) => {
        console.error('Failed to calculate video cost:', err);
      })
      .finally(() => {
        setIsCalculating(false);
      });
  }, [isOpen, provider, model, durationSeconds, resolution, numberOfVideos]);

  if (!isOpen) return null;

  const currentBalance = (user as any)?.creditBalance || (user as any)?.credits || 50;
  const hasEnoughCredits = currentBalance >= (calculation?.totalEstimatedCredits || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-7 space-y-6 text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 p-0.5 shadow-lg shadow-violet-600/30 shrink-0 flex items-center justify-center text-white">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Variable Video Cost Protection</h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Pre-Flight Check
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Variable neural video rendering is metered dynamically based on duration, resolution, and model fidelity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="space-y-4 text-xs">
          {/* Duration Slider */}
          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>Target Video Duration</span>
              </label>
              <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {durationSeconds} seconds ({calculation?.blocksCount || 1} x 15s blocks)
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="w-full accent-violet-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10s (Short)</span>
              <span>60s (Reel)</span>
              <span>180s (Max safety cap: 3 mins)</span>
            </div>
          </div>

          {/* Resolution & Model Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Resolution */}
            <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Output Resolution
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['720p', '1080p', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      resolution === res
                        ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {res.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Multiplier */}
            <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Quality / Fidelity Tier
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['standard', 'hd', 'cinematic'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`py-1.5 px-1.5 rounded-xl text-[11px] font-bold border capitalize transition-colors cursor-pointer ${
                      model === m
                        ? 'bg-pink-600 text-white border-pink-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Callout Card */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-violet-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Calculated Video Credit Requirement</span>
            </span>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {isCalculating ? '...' : `${calculation?.totalEstimatedCredits || 0} credits`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
            <div>
              <span className="block text-slate-500">Base + Duration</span>
              <strong className="text-slate-200">
                {calculation?.baseCredits || 15} + {calculation?.blockCredits || 0} credits
              </strong>
            </div>
            <div>
              <span className="block text-slate-500">Resolution Multiplier</span>
              <strong className="text-slate-200">{calculation?.resolutionMultiplier || 1.4}x</strong>
            </div>
            <div>
              <span className="block text-slate-500">Model Multiplier</span>
              <strong className="text-slate-200">{calculation?.modelMultiplier || 1.5}x</strong>
            </div>
          </div>
        </div>

        {/* User Balance Comparison */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400">Your Available Balance:</span>
          <span className="font-mono font-bold text-white">
            {currentBalance} credits
          </span>
        </div>

        {!hasEnoughCredits && (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>
              Insufficient credits for this video configuration. You need at least{' '}
              <strong>{calculation?.totalEstimatedCredits} credits</strong> (available: {currentBalance}).
            </p>
          </div>
        )}

        {/* Mandatory Confirmation Checkbox */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
          <input
            type="checkbox"
            id="confirmRisk"
            checked={confirmedRisk}
            onChange={(e) => setConfirmedRisk(e.target.checked)}
            className="mt-1 accent-violet-600 rounded cursor-pointer"
          />
          <label htmlFor="confirmRisk" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
            I confirm the estimated deduction of <strong>{calculation?.totalEstimatedCredits} credits</strong> for rendering this {durationSeconds}s {resolution} sequence. Credits are only deducted upon verified completion.
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(calculation);
              onClose();
            }}
            disabled={!confirmedRisk || !hasEnoughCredits || isCalculating}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
              confirmedRisk && hasEnoughCredits && !isCalculating
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-violet-600/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Confirm & Start Generation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
