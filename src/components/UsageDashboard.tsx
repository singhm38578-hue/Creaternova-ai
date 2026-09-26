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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studioApi } from '../services/api';

export const UsageDashboard: React.FC = () => {
  const { credits, user, replenishDemoCredits, openPricingModal } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await studioApi.credits.getUsage();
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalAllocation = credits?.monthlyAllocation || 1000;
  const totalRemaining = credits?.totalRemaining || 850;
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
            <h1 className="text-xl font-bold text-white tracking-tight">Usage & Credit Wallet</h1>
            <p className="text-xs text-slate-400">
              Real-time monitoring of generation usage, current billing period balance, and category pools.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={replenishDemoCredits}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Refill Balance</span>
          </button>

          <button
            onClick={openPricingModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all cursor-pointer"
          >
            <span>Upgrade Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Billing Period Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Billing Period ({new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white font-mono">
                {totalRemaining.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {totalAllocation.toLocaleString()} credits remaining
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-violet-400 font-bold">
              {percentUsed}% Consumed
            </span>
            <p className="text-[11px] text-slate-500">Resets in 25 days</p>
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

      {/* 4 Category Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Text Generation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">2 Credits / Req</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{credits?.textCredits || 0}</div>
            <span className="text-xs text-slate-400">Text Generation Pool</span>
          </div>
          <div className="text-[11px] text-slate-500">
            For scripts, viral hooks, SEO tags & scene beats.
          </div>
        </div>

        {/* Image Generation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">5 Credits / Req</span>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-400 font-mono">{credits?.imageCredits || 0}</div>
            <span className="text-xs text-slate-400">Image Generation Pool</span>
          </div>
          <div className="text-[11px] text-slate-500">
            For 4K thumbnails, visual style overlays & shot prompts.
          </div>
        </div>

        {/* Voice Generation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">3 Credits / Req</span>
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-400 font-mono">{credits?.voiceCredits || 0}</div>
            <span className="text-xs text-slate-400">Voice Generation Pool</span>
          </div>
          <div className="text-[11px] text-slate-500">
            For multi-language voiceovers & audio speech directions.
          </div>
        </div>

        {/* Video Generation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">20 Credits / Req</span>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400 font-mono">{credits?.videoCredits || 0}</div>
            <span className="text-xs text-slate-400">Video Generation Pool</span>
          </div>
          <div className="text-[11px] text-slate-500">
            For full scene video sequences & pipeline sequencing.
          </div>
        </div>
      </div>

      {/* Usage Transaction Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Generation Audit Log
            </h3>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No recent generation activities recorded in this session.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">{log.description}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()} • {log.type.toUpperCase()}
                  </div>
                </div>
                <div className="font-mono font-bold text-rose-400">
                  -{log.amount} credits
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
