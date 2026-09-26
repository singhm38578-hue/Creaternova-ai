import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Flame,
  ArrowRight,
  Copy,
  Check,
  Plus,
  Trash2,
  FileText,
  Clock,
  Eye,
  Zap,
  Target
} from 'lucide-react';
import { IdeaItem, Project } from '../types/content';
import { studioApi } from '../services/api';

interface IdeaGeneratorProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onSendToScript: (idea: IdeaItem) => void;
}

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({
  project,
  onUpdateProject,
  onSendToScript,
}) => {
  const [topic, setTopic] = useState(project.topic);
  const [format, setFormat] = useState(project.format);
  const [targetAudience, setTargetAudience] = useState(project.targetAudience);
  const [tone, setTone] = useState(project.tone);
  const [count, setCount] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await studioApi.generateIdeas({
        topic: topic.trim(),
        format,
        targetAudience,
        tone,
        count,
      });

      const newIdeas: IdeaItem[] = (res.ideas || []).map((item, idx) => ({
        id: item.id || `idea-${Date.now()}-${idx}`,
        title: item.title || 'Untitled Idea',
        hook: item.hook || 'Opening Hook',
        viralityScore: Number(item.viralityScore) || 90,
        format: item.format || format,
        durationEstimate: item.durationEstimate || '60 seconds',
        angle: item.angle || 'Curiosity angle',
        targetAudience: item.targetAudience || targetAudience,
        coreTakeaway: item.coreTakeaway || '',
        suggestedVisualHook: item.suggestedVisualHook || 'Dynamic visual zoom',
        retentionTip: item.retentionTip || 'Fast cut pacing',
        createdAt: new Date().toISOString(),
      }));

      // Append new ideas to current project
      const updatedProject = {
        ...project,
        ideas: [...newIdeas, ...project.ideas],
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updatedProject);
    } catch (err: any) {
      console.error('Failed generating ideas', err);
      setErrorMsg(err.message || 'Could not generate ideas right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIdea = (id: string) => {
    const updated = {
      ...project,
      ideas: project.ideas.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
  };

  const handleCopyHook = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getViralityColor = (score: number) => {
    if (score >= 95) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Generator Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Idea Generator</h2>
              <p className="text-xs text-slate-400">Brainstorm viral hooks, video angles, and high-retention concepts</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Current Project: <strong className="text-slate-200">{project.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Topic or Niche Premise *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 Black Hole Mysteries, Teaching Toddlers Shapes, Building SaaS in 24h"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="youtube_long">YouTube Video (16:9)</option>
              <option value="youtube_short">YouTube Short (9:16)</option>
              <option value="tiktok">TikTok / Reel (9:16)</option>
              <option value="educational">Educational / Kids</option>
              <option value="podcast">Podcast Episode</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Preschoolers, Developers, Gen Z"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tone & Style
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="engaging_energetic">High Energy & Punchy</option>
              <option value="cinematic_storytelling">Cinematic Storytelling</option>
              <option value="suspense_mystery">Suspense & Mystery</option>
              <option value="playful_kids">Playful & Nursery Fun</option>
              <option value="humorous_witty">Humorous & Witty</option>
              <option value="educational_calm">Educational & Calm</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Number of Ideas
            </label>
            <div className="flex gap-2">
              {[3, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    count === num
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60'
                      : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {num} Ideas
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-yellow-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Brainstorming Viral Concepts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Viral Ideas with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Ideas Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-yellow-400" />
            Project Idea Vault ({project.ideas.length})
          </h3>
          {project.ideas.length > 0 && (
            <span className="text-xs text-slate-400">
              Select an idea below to write the full screenplay
            </span>
          )}
        </div>

        {project.ideas.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <Lightbulb className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300 mb-1">No ideas generated yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Enter your topic above and let Gemini AI generate viral hooks, storytelling angles, and visual triggers.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold hover:bg-yellow-500/30 transition-colors"
            >
              Generate First Batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.ideas.map((idea) => {
              const scoreStyle = getViralityColor(idea.viralityScore);
              return (
                <div
                  key={idea.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-yellow-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header: Virality Score & Duration */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${scoreStyle}`}>
                          <Zap className="w-3 h-3" />
                          Virality {idea.viralityScore}/100
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {idea.durationEstimate}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-white group-hover:text-yellow-300 transition-colors leading-snug">
                      {idea.title}
                    </h4>

                    {/* Hook Box */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 relative group/hook">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-yellow-400" />
                          3-Second Hook Line
                        </span>
                        <button
                          onClick={() => handleCopyHook(idea.id, idea.hook)}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === idea.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                        "{idea.hook}"
                      </p>
                    </div>

                    {/* Visual Hook & Retention Tips */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2 text-slate-300">
                        <Eye className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-slate-400 text-[11px] block uppercase">First-Second Visual:</strong>
                          <span className="text-slate-300">{idea.suggestedVisualHook}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-slate-300">
                        <Target className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-slate-400 text-[11px] block uppercase">Angle & Retention:</strong>
                          <span className="text-slate-300">{idea.angle} — {idea.retentionTip}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {idea.targetAudience}
                    </span>
                    <button
                      onClick={() => onSendToScript(idea)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Send to Script Writer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
