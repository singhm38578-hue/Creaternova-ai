import React, { useState } from 'react';
import {
  Sparkles,
  Repeat,
  ArrowRight,
  CheckCircle2,
  X,
  Languages,
  Video,
  Share2,
  Film,
  Coins,
  Bot,
  Layers,
  Check
} from 'lucide-react';
import { Project } from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RepurposingAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProject?: Project;
  onProjectAdapted?: (newProject: Project) => void;
}

export const RepurposingAgentModal: React.FC<RepurposingAgentModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProject,
  onProjectAdapted,
}) => {
  const { credits, refreshCredits } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProject?.id || (projects.length > 0 ? projects[0].id : '')
  );
  const [repurposeType, setRepurposeType] = useState<string>('long_to_shorts');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const options = [
    {
      id: 'long_to_shorts',
      title: 'Long Video → Shorts',
      description: 'Extract 5 punchy high-retention micro-stories with custom hooks.',
      icon: Film,
      badge: 'High Viral Impact',
      badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
    },
    {
      id: 'youtube_to_reels',
      title: 'YouTube → Instagram Reel',
      description: 'Adapt visual pacing and hook style for Instagram aesthetic trends.',
      icon: Video,
      badge: 'Visual Focus',
      badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    },
    {
      id: 'youtube_to_tiktok',
      title: 'YouTube → TikTok',
      description: 'Fast-paced pattern interrupts and raw conversational energy.',
      icon: Share2,
      badge: 'Max Pacing',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    },
    {
      id: 'video_to_post',
      title: 'Video → Social Post',
      description: 'Transform key insights into an engaging Community Post & carousel.',
      icon: Layers,
      badge: 'Audience Debates',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    },
    {
      id: 'english_to_hindi',
      title: 'English → Hindi',
      description: 'Culturally adapt idioms and tone for massive Hindi-speaking viewers.',
      icon: Languages,
      badge: 'Global Localization',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
    {
      id: 'english_to_spanish',
      title: 'English → Spanish',
      description: 'Native Spanish dubbing script and localized cultural metaphors.',
      icon: Languages,
      badge: 'Global Localization',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
  ];

  const handleExecute = async () => {
    if (!selectedProjectId) {
      setError('Please select a project to repurpose');
      return;
    }

    if (credits && credits.totalRemaining < 2) {
      setError('Insufficient credits. 2 credits required for adaptive repurposing.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await studioApi.agent.repurpose({
        projectId: selectedProjectId,
        repurposeType,
        customInstruction,
      });

      setResult(res);
      refreshCredits();
      if (onProjectAdapted && res.adaptedProject) {
        onProjectAdapted(res.adaptedProject);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to repurpose project');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedProj = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Glow Header */}
        <div className="p-6 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border-b border-violet-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Repeat className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/30">
                CreatorNova Repurposing Agent
              </span>
              <h2 className="text-xl font-black text-white mt-1">Repurpose With AI</h2>
              <p className="text-xs text-slate-400">Adapt content across platforms & languages rather than simply copying</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {!result ? (
            <>
              {/* Step 1: Select Source Project */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Source Project to Repurpose
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.platform || p.format})
                    </option>
                  ))}
                </select>
                {selectedProj && (
                  <p className="text-xs text-slate-400 italic">
                    Topic: "{selectedProj.topic}" • Words: {selectedProj.script?.wordCount || 100} • Scenes: {selectedProj.scenes?.length || 3}
                  </p>
                )}
              </div>

              {/* Step 2: Select Repurpose Target */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Choose Transformation Target
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {options.map((opt) => {
                    const isSelected = repurposeType === opt.id;
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setRepurposeType(opt.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                            <span className="text-sm font-bold text-white">{opt.title}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-violet-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
                        <div className="mt-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Custom Directives */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Custom Tone or Adaptation Cue (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on the psychological curiosity twist, add funny relatable analogy..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-500"
                />
              </div>

              {/* Credit Estimate */}
              <div className="p-3 bg-violet-950/20 border border-violet-800/40 rounded-xl flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Estimated Cost: <strong className="text-amber-300">2 Credits</strong>
                </span>
                <span className="text-slate-400">
                  Wallet: {credits?.totalRemaining ?? 850} remaining
                </span>
              </div>
            </>
          ) : (
            /* Result Preview View */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Content Repurposed Successfully!</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Saved as a brand new project in your Project Library.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Adapted Title</span>
                  <p className="text-sm font-bold text-white mt-0.5">{result.adaptedData?.adaptedTitle}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-400">3-Second Spoken Hook</span>
                  <p className="text-xs text-violet-200 mt-0.5 italic">"{result.adaptedData?.adaptedHook}"</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Platform Strategy Note</span>
                  <p className="text-xs text-slate-300 mt-0.5">{result.adaptedData?.platformStrategy}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Adapted Script Preview</span>
                  <div className="mt-1 p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                    {result.adaptedData?.adaptedScript}
                  </div>
                </div>

                {result.adaptedData?.keyHashtags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {result.adaptedData.keyHashtags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
          >
            {result ? 'Done' : 'Cancel'}
          </button>

          {!result ? (
            <button
              onClick={handleExecute}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adapting Content...</span>
                </>
              ) : (
                <>
                  <span>Repurpose With AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                setResult(null);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
            >
              Close & View Projects
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
