import React from 'react';
import {
  Sparkles,
  Lightbulb,
  FileText,
  Clapperboard,
  Search,
  Image as ImageIcon,
  Languages,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Flame,
  Award,
  Download,
  FolderOpen
} from 'lucide-react';
import { Project, Character } from '../types/content';
import { ActiveTab } from './Sidebar';
import { CreatorNovaAgentCard } from './CreatorNovaAgentCard';
import { SmartStrategySection } from './SmartStrategySection';

interface OverviewDashboardProps {
  project: Project;
  onNavigate: (tab: ActiveTab) => void;
  onOpenExport: () => void;
  onOpenNewProject?: () => void;
  onAskAgent?: (command: string, useBrandKit: boolean, characterId?: string) => void;
  onOpenSeriesCreator?: () => void;
  onOpenRepurpose?: () => void;
  onOpenCalendar?: () => void;
  characters?: Character[];
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  project,
  onNavigate,
  onOpenExport,
  onOpenNewProject,
  onAskAgent,
  onOpenSeriesCreator,
  onOpenRepurpose,
  onOpenCalendar,
  characters = [],
}) => {
  const hasScript = !!project.script && project.script.beats.length > 0;
  const hasScenes = project.scenes && project.scenes.length > 0;
  const hasSeo = !!project.seo && project.seo.titles.length > 0;
  const hasThumbnail = !!project.thumbnail && !!project.thumbnail.headline;
  const hasTranslations = project.translations && project.translations.length > 0;

  const completionCount = [
    project.ideas.length > 0,
    hasScript,
    hasScenes,
    hasSeo,
    hasThumbnail,
    hasTranslations,
  ].filter(Boolean).length;

  const completionPercent = Math.round((completionCount / 6) * 100);

  const modules = [
    {
      id: 'ideas' as ActiveTab,
      title: '💡 Idea Generator',
      subtitle: `${project.ideas.length} Brainstormed Hooks`,
      description: 'Discover viral video concepts, 3-second retention hooks, and audience angles.',
      status: project.ideas.length > 0 ? 'Ready' : 'Not started',
      isComplete: project.ideas.length > 0,
      badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      action: 'Brainstorm Ideas',
    },
    {
      id: 'script' as ActiveTab,
      title: '📝 Script Writer',
      subtitle: hasScript ? `${project.script?.wordCount} Words (${project.script?.estimatedDuration})` : 'Draft Needed',
      description: 'Write complete multi-beat scripts with voice directions, pacing, and teleprompter.',
      status: hasScript ? 'Completed' : 'Drafting',
      isComplete: hasScript,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      action: hasScript ? 'Review Script' : 'Generate Script',
    },
    {
      id: 'scenes' as ActiveTab,
      title: '🎬 Scene Generator',
      subtitle: `${project.scenes.length} Production Shots`,
      description: 'Breakdown camera angles, B-roll footage keywords, SFX audio cues, and lighting moods.',
      status: hasScenes ? `${project.scenes.length} Scenes` : 'Pending',
      isComplete: hasScenes,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      action: hasScenes ? 'View Storyboard' : 'Generate Shots',
    },
    {
      id: 'seo' as ActiveTab,
      title: '🔍 SEO Generator',
      subtitle: hasSeo ? `Score: ${project.seo?.seoHealthScore}/100` : 'Unoptimized',
      description: 'High-CTR YouTube titles, copy-paste tags, formatted description, and ranking hashtags.',
      status: hasSeo ? 'Optimized' : 'Ready to rank',
      isComplete: hasSeo,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      action: hasSeo ? 'Inspect SEO' : 'Optimize Tags',
    },
    {
      id: 'thumbnail' as ActiveTab,
      title: '🖼️ Thumbnail Creator',
      subtitle: project.thumbnail?.headline || 'Design Needed',
      description: 'Psychological visual formulas, canvas title overlays, badge customizers, and AI images.',
      status: hasThumbnail ? 'Designed' : 'Template ready',
      isComplete: hasThumbnail,
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      action: 'Open Canvas',
    },
    {
      id: 'translate' as ActiveTab,
      title: '🌐 Translate Content',
      subtitle: `${project.translations.length} Global Languages`,
      description: 'Expand audience reach with cultural localization, speech dubbing notes, and audio playback.',
      status: hasTranslations ? `${project.translations.length} Locales` : 'Ready to translate',
      isComplete: hasTranslations,
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      action: 'Localize Video',
    },
    {
      id: 'media_studio' as ActiveTab,
      title: '🎬 AI Media Studio',
      subtitle: project.mediaStudio?.scenes?.length ? `${project.mediaStudio.scenes.length} Scenes Media Ready` : 'Voiceover, Visuals & Video Pipeline',
      description: 'AI Voiceover synthesis, scene media generation with Visual Identity consistency, video timeline, auto-captions, and royalty-free music.',
      status: project.mediaStudio ? 'Assets Ready' : 'Ready to produce',
      isComplete: !!project.mediaStudio,
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      action: 'Launch Media Studio',
    },
    {
      id: 'library' as ActiveTab,
      title: '📁 Project Library',
      subtitle: 'All Saved Projects',
      description: 'Search, duplicate, rename, filter by platform and language, and manage your creator content library.',
      status: 'Cloud Synced',
      isComplete: true,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      action: 'Open Library',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* 1. Prominent CreatorNova AI Agent Dashboard Card (Requirement 1) */}
      <CreatorNovaAgentCard
        onAskAgent={(cmd, useKit, charId) => {
          if (onAskAgent) onAskAgent(cmd, useKit, charId);
          else onNavigate('agent');
        }}
        onOpenSeriesCreator={onOpenSeriesCreator || (() => onNavigate('series'))}
        onOpenRepurpose={onOpenRepurpose}
        onOpenCalendar={onOpenCalendar || (() => onNavigate('calendar'))}
        characters={characters}
      />

      {/* Hero Studio Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>Creator Studio Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {project.topic}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                Audience: <strong className="text-slate-200">{project.targetAudience}</strong>
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                Tone: <strong className="text-slate-200">{project.tone.replace('_', ' ')}</strong>
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                Format: <strong className="text-slate-200">{project.format.replace('_', ' ').toUpperCase()}</strong>
              </span>
            </div>
          </div>

          {/* Progress & Export Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col gap-3 min-w-[240px] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Completion</span>
              <span className="text-sm font-extrabold text-violet-400">{completionPercent}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {completionCount} of 6 production assets generated
            </p>
            <div className="flex flex-col gap-2 mt-1">
              {onOpenNewProject && (
                <button
                  onClick={onOpenNewProject}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>+ New Project Workflow</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('media_studio')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-pink-600/30 hover:bg-pink-600 text-pink-200 hover:text-white text-xs font-bold border border-pink-500/40 transition-all cursor-pointer"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Open AI Media Studio</span>
              </button>
              <button
                onClick={() => onNavigate('library')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-700/50 transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Browse Project Library</span>
              </button>
              <button
                onClick={onOpenExport}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Production Packet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Content Creation Modules
          </h3>
          <span className="text-xs text-slate-400">Click any card to start generating</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="group bg-slate-900/70 hover:bg-slate-850/90 border border-slate-800 hover:border-violet-500/50 rounded-xl p-5 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-violet-950/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-bold text-white text-base group-hover:text-violet-300 transition-colors">
                    {mod.title}
                  </h4>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${mod.badgeColor}`}>
                    {mod.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  {mod.isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span>{mod.subtitle}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {mod.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-violet-400 group-hover:text-violet-300">
                <span>{mod.action}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Preview of Script & SEO if available */}
      {hasScript && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Script Hook Preview (0:00 - 0:15)
            </h4>
            <button
              onClick={() => onNavigate('script')}
              className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
            >
              Open Full Script & Teleprompter &rarr;
            </button>
          </div>
          <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 text-sm text-slate-200 font-mono">
            <span className="text-amber-400">{project.script?.beats[0]?.directionCue}</span>{' '}
            "{project.script?.beats[0]?.dialogue}"
          </div>
        </div>
      )}

      {/* Smart Content Strategy Section (Requirement 6) */}
      <SmartStrategySection
        onExecutePrompt={(promptText) => {
          if (onAskAgent) onAskAgent(promptText, true);
          else onNavigate('agent');
        }}
      />
    </div>
  );
};
