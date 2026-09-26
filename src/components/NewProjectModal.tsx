import React, { useState } from 'react';
import { X, Sparkles, Film, ArrowRight, Wand2 } from 'lucide-react';
import { ContentFormat, Project, ToneType } from '../types/content';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (newProject: Project, autoGenerateIdeas: boolean) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState<ContentFormat>('youtube_long');
  const [targetAudience, setTargetAudience] = useState('Curious Viewers & Creators');
  const [tone, setTone] = useState<ToneType>('engaging_energetic');
  const [autoGenerate, setAutoGenerate] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: name.trim(),
      topic: topic.trim() || name.trim(),
      format,
      targetAudience: targetAudience.trim() || 'General Audience',
      tone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ideas: [],
      scenes: [],
      thumbnail: {
        headline: name.trim().toUpperCase(),
        subheadline: 'Watch This Now!',
        badgeText: 'VIRAL',
        templateTheme: 'bold_creator',
        aspectRatio: format === 'youtube_short' || format === 'tiktok' || format === 'instagram_reel' ? '9:16' : '16:9',
        textColor: '#FFFFFF',
        accentColor: '#8B5CF6',
        bgColor1: '#0F172A',
        bgColor2: '#1E1B4B',
        fontSize: 52,
        showVignette: true,
        showGlow: true,
        emojis: ['🔥', '✨', '⚡'],
        compositionAngle: 'Center dynamic focal point with bold typography',
      },
      translations: [],
    };

    onCreateProject(newProject, autoGenerate);
    setName('');
    setTopic('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Film className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Project</h2>
              <p className="text-xs text-slate-400">Initialize content studio workflow with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Coding Masterclass, Deep Space Mystery, Kids Nursery Fun"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Topic / Niche Premise
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is this video/channel about? e.g. Mind-blowing facts about ancient civilizations"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ContentFormat)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="youtube_long">YouTube Video (16:9)</option>
                <option value="youtube_short">YouTube Short (9:16)</option>
                <option value="tiktok">TikTok / Reel (9:16)</option>
                <option value="educational">Kids / Educational</option>
                <option value="podcast">Podcast Episode</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="engaging_energetic">High Energy & Punchy</option>
                <option value="cinematic_storytelling">Cinematic Storytelling</option>
                <option value="suspense_mystery">Suspense & Mystery</option>
                <option value="playful_kids">Playful Kids & Fun</option>
                <option value="humorous_witty">Humorous & Witty</option>
                <option value="educational_calm">Educational & Calm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Gen Z Creators, Parents of Preschoolers, Tech Professionals"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* AI Auto-generate Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-violet-950/20 border border-violet-800/40 rounded-xl cursor-pointer hover:bg-violet-950/30 transition-colors">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="w-4 h-4 text-violet-600 rounded bg-slate-900 border-slate-700 focus:ring-violet-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                  Auto-generate Viral Ideas with Gemini
                </div>
                <p className="text-[11px] text-slate-400">
                  Immediately brainstorm high-retention hooks and angles for this project.
                </p>
              </div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <span>Create Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
