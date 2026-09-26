import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Layers,
  Repeat,
  Compass,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { StrategyRecommendation } from '../types/content';
import { studioApi } from '../services/api';

interface SmartStrategySectionProps {
  onExecutePrompt: (promptText: string) => void;
}

export const SmartStrategySection: React.FC<SmartStrategySectionProps> = ({
  onExecutePrompt,
}) => {
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelNiche, setChannelNiche] = useState<string>('');

  const fetchStrategy = async () => {
    try {
      setLoading(true);
      const res = await studioApi.agent.getStrategy();
      setRecommendations(res.strategy || []);
      setChannelNiche(res.niche || 'Science & Space Facts');
    } catch (err: any) {
      console.error('Failed to load strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Pillar':
        return Compass;
      case 'Series':
        return Layers;
      case 'Variation':
        return RefreshCw;
      case 'Repurposing':
        return Repeat;
      default:
        return Lightbulb;
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/40">
              AI Strategy Engine
            </span>
            <span className="text-xs text-slate-400">Grounded in Algorithmic Retention</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Smart Content Strategy
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explainable strategic growth pillars tailored for your niche ({channelNiche})
          </p>
        </div>

        <button
          onClick={fetchStrategy}
          disabled={loading}
          className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Strategy
        </button>
      </div>

      {/* Grid of Strategy Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-950/70 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          No strategy suggestions currently loaded. Click refresh to generate.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((item) => {
            const Icon = getCategoryIcon(item.category);
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-violet-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                      <Icon className="w-3 h-3" /> {item.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.metricsImpact}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Explainable Reason (Requirement 6) */}
                  <div className="p-2.5 rounded-lg bg-violet-950/30 border border-violet-800/30 text-[11px] text-violet-200/90">
                    <span className="font-bold text-violet-300 block mb-0.5">
                      Why CreatorNova Recommends This:
                    </span>
                    {item.reason}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-end">
                  <button
                    onClick={() => onExecutePrompt(item.actionPrompt)}
                    className="w-full py-2 px-3 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>Execute with Agent</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
