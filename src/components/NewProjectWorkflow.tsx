import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  Save,
  Film,
  Video,
  PlaySquare,
  Instagram,
  Facebook,
  Share2,
  Clock,
  Globe,
  Users,
  Lightbulb,
  FileText,
  Clapperboard,
  Search,
  Image as ImageIcon,
  Repeat,
  Tv,
  Camera,
  Layers,
  Flame,
  Download,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Tag
} from 'lucide-react';
import {
  PlatformOption,
  ContentTypeOption,
  LanguageOption,
  VideoDurationOption,
  ContentPackResult,
  Project,
  SceneItem,
  ContentFormat,
  ToneType
} from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface NewProjectWorkflowProps {
  onSaveProject: (project: Project) => void;
  onOpenStudioTab?: (tabName: string) => void;
  onCancel?: () => void;
}

export const NewProjectWorkflow: React.FC<NewProjectWorkflowProps> = ({
  onSaveProject,
  onOpenStudioTab,
  onCancel,
}) => {
  const { brandKit, credits, creditConfig, openInsufficientCreditModal, refreshCredits } = useAuth();
  const [usingBrandKit, setUsingBrandKit] = useState(false);
  // Step state: 'form' | 'generating' | 'result'
  const [step, setStep] = useState<'form' | 'generating' | 'result'>('form');

  // Form Fields
  const [projectName, setProjectName] = useState('Space Facts Short');
  const [topic, setTopic] = useState('5 amazing facts about space');
  const [platform, setPlatform] = useState<PlatformOption>('YouTube Shorts');
  const [contentType, setContentType] = useState<ContentTypeOption>('Facts');
  const [language, setLanguage] = useState<LanguageOption>('English');
  const [duration, setDuration] = useState<VideoDurationOption>('60 seconds');
  const [customDuration, setCustomDuration] = useState('');
  const [targetAudience, setTargetAudience] = useState('Students');

  // Generation Progress
  const [currentProgressIndex, setCurrentProgressIndex] = useState(0);
  const [contentPack, setContentPack] = useState<ContentPackResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'script' | 'scenes' | 'seo' | 'thumbnail' | 'repurpose'>('overview');

  // Edit and Copy state
  const [isEditing, setIsEditing] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Repurpose Sub-tab state
  const [activeRepurposePlatform, setActiveRepurposePlatform] = useState<'youtubeShort' | 'instagramReel' | 'tiktok' | 'facebookPost' | 'youtubeCommunity'>('youtubeShort');

  // Canvas ref for live thumbnail preview in Result Screen
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const platforms: { name: PlatformOption; label: string; icon: React.ReactNode; color: string }[] = [
    { name: 'YouTube Shorts', label: 'YouTube Shorts', icon: <PlaySquare className="w-5 h-5 text-red-500" />, color: 'hover:border-red-500/60' },
    { name: 'YouTube Long Video', label: 'YouTube Long', icon: <Video className="w-5 h-5 text-red-600" />, color: 'hover:border-red-600/60' },
    { name: 'Instagram Reels', label: 'Instagram Reels', icon: <Instagram className="w-5 h-5 text-pink-500" />, color: 'hover:border-pink-500/60' },
    { name: 'TikTok', label: 'TikTok', icon: <Flame className="w-5 h-5 text-cyan-400" />, color: 'hover:border-cyan-400/60' },
    { name: 'Facebook', label: 'Facebook', icon: <Facebook className="w-5 h-5 text-blue-500" />, color: 'hover:border-blue-500/60' },
    { name: 'Other', label: 'Other Format', icon: <Share2 className="w-5 h-5 text-violet-400" />, color: 'hover:border-violet-500/60' },
  ];

  const contentTypes: ContentTypeOption[] = [
    'Educational',
    'Kids',
    'Facts',
    'Story',
    'Entertainment',
    'Business',
    'Motivation',
    'Product/Marketing',
  ];

  const languages: LanguageOption[] = [
    'English',
    'Hindi',
    'Spanish',
    'Portuguese',
    'French',
    'German',
    'Japanese',
    'Korean',
    'Arabic',
    'Other',
  ];

  const durations: VideoDurationOption[] = [
    '15 seconds',
    '30 seconds',
    '60 seconds',
    '1–3 minutes',
    '5–10 minutes',
    'Custom',
  ];

  const audienceExamples = [
    'Kids 3–8',
    'Students',
    'Entrepreneurs',
    'General Audience',
    'Tech Lovers',
    'Fitness Enthusiasts',
  ];

  const progressSteps = [
    'Analyzing topic...',
    'Creating idea...',
    'Writing script...',
    'Building scenes...',
    'Preparing SEO...',
    'Creating thumbnail concept...',
  ];

  // Animated progress stepper during generation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'generating') {
      timer = setInterval(() => {
        setCurrentProgressIndex((prev) => {
          if (prev < progressSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Render thumbnail canvas when in thumbnail tab
  useEffect(() => {
    if (step === 'result' && contentPack && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isVertical = platform === 'YouTube Shorts' || platform === 'TikTok' || platform === 'Instagram Reels';
      const width = isVertical ? 720 : 1280;
      const height = isVertical ? 1280 : 720;
      canvas.width = width;
      canvas.height = height;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, contentPack.thumbnail.suggestedColors?.bg1 || '#0F172A');
      grad.addColorStop(1, contentPack.thumbnail.suggestedColors?.bg2 || '#3B0764');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Grid overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Outer border rim
      ctx.strokeStyle = contentPack.thumbnail.suggestedColors?.accent || '#F59E0B';
      ctx.lineWidth = 8;
      ctx.strokeRect(24, 24, width - 48, height - 48);

      // Top Badge
      ctx.fillStyle = contentPack.thumbnail.suggestedColors?.accent || '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(isVertical ? 40 : 60, isVertical ? 60 : 50, 180, 48, 24);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = '900 22px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(contentType.toUpperCase(), isVertical ? 130 : 150, isVertical ? 84 : 74);

      // Headline Text
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const headlineY = height * 0.48;
      const fontSize = isVertical ? 56 : 72;
      ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;

      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 12;
      ctx.strokeText(contentPack.thumbnail.shortText || 'MUST WATCH', width / 2, headlineY);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(contentPack.thumbnail.shortText || 'MUST WATCH', width / 2, headlineY);
      ctx.restore();

      // Subtitle
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '800 28px system-ui, sans-serif';
      ctx.fillStyle = contentPack.thumbnail.suggestedColors?.accent || '#F59E0B';
      ctx.fillText(contentPack.contentIdea.title.slice(0, 36), width / 2, headlineY + 80);
      ctx.restore();
    }
  }, [step, contentPack, platform, contentType, activeResultTab]);

  const handleStartGeneration = async () => {
    if (!topic.trim()) return;

    const cost = creditConfig?.textCost || 2;
    if (credits && credits.totalRemaining < cost) {
      openInsufficientCreditModal(cost);
      return;
    }

    setStep('generating');
    setCurrentProgressIndex(0);

    const actualDuration = duration === 'Custom' ? (customDuration || '60 seconds') : duration;

    try {
      const res = await studioApi.generateContentPack({
        projectName: projectName.trim() || 'New Creator Project',
        topic: topic.trim(),
        platform,
        contentType,
        language,
        duration: actualDuration,
        targetAudience: targetAudience.trim() || 'General Audience',
      });

      if (res.contentPack) {
        setContentPack(res.contentPack);
        refreshCredits();
        // Small delay so user sees final checkmarks
        setTimeout(() => {
          setStep('result');
          setActiveResultTab('overview');
        }, 600);
      }
    } catch (err: any) {
      console.error('Failed generating content pack:', err);
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        setStep('form');
        openInsufficientCreditModal(cost);
        return;
      }
      // Wait slightly then proceed to result with fallback
      setTimeout(() => {
        setStep('result');
      }, 1000);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handleSaveToRecentProjects = () => {
    if (!contentPack) return;

    // Map platform to ContentFormat
    let mappedFormat: ContentFormat = 'youtube_short';
    if (platform === 'YouTube Long Video') mappedFormat = 'youtube_long';
    else if (platform === 'Instagram Reels') mappedFormat = 'instagram_reel';
    else if (platform === 'TikTok') mappedFormat = 'tiktok';
    else if (platform === 'Facebook') mappedFormat = 'facebook';
    else if (contentType === 'Kids') mappedFormat = 'educational';

    // Map contentType to ToneType
    let mappedTone: ToneType = 'engaging_energetic';
    if (contentType === 'Story') mappedTone = 'cinematic_storytelling';
    else if (contentType === 'Kids') mappedTone = 'playful_kids';
    else if (contentType === 'Facts') mappedTone = 'suspense_mystery';
    else if (contentType === 'Educational') mappedTone = 'educational_calm';
    else if (contentType === 'Entertainment') mappedTone = 'humorous_witty';

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: contentPack.projectName || projectName,
      topic: contentPack.topic || topic,
      format: mappedFormat,
      platform: platform,
      contentType: contentType,
      language: language,
      duration: duration === 'Custom' ? customDuration : duration,
      targetAudience: targetAudience,
      tone: mappedTone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ideas: [
        {
          id: `idea-${Date.now()}-1`,
          title: contentPack.contentIdea.title,
          hook: contentPack.hook.hookText,
          viralityScore: 96,
          format: mappedFormat,
          durationEstimate: contentPack.script.estimatedDuration,
          angle: contentPack.hook.psychologyTrigger,
          targetAudience: targetAudience,
          coreTakeaway: contentPack.contentIdea.coreValue,
          suggestedVisualHook: contentPack.hook.visualAction,
          retentionTip: 'Pattern interrupt within 3 seconds',
          createdAt: new Date().toISOString(),
        },
      ],
      script: {
        title: contentPack.contentIdea.title,
        format: mappedFormat,
        estimatedDuration: contentPack.script.estimatedDuration,
        wordCount: contentPack.script.wordCount,
        hookSummary: contentPack.hook.hookText,
        beats: contentPack.script.beats || [],
        rawFullText: contentPack.script.rawFullText,
        tone: mappedTone,
        callToAction: contentPack.script.callToAction,
        lastUpdated: new Date().toISOString(),
      },
      scenes: contentPack.scenes || [],
      seo: {
        titles: contentPack.seo.titleSuggestions.map((title, i) => ({
          title,
          score: 95 - i * 2,
          category: i === 0 ? 'Curiosity Gap' : i === 1 ? 'Listicle' : i === 2 ? 'Emotional / Shock' : 'How-To',
          characterCount: title.length,
        })),
        description: contentPack.seo.description,
        primaryKeywords: contentPack.seo.keywords.slice(0, 3),
        longTailKeywords: contentPack.seo.keywords.slice(3),
        tags: contentPack.seo.keywords,
        hashtags: contentPack.seo.hashtags,
        seoHealthScore: contentPack.seo.seoScore || 96,
        targetAudience: targetAudience,
        category: contentType,
      },
      thumbnail: {
        headline: contentPack.thumbnail.shortText || 'MUST WATCH',
        subheadline: contentPack.contentIdea.title.slice(0, 28),
        badgeText: contentType.toUpperCase(),
        templateTheme: contentType === 'Kids' ? 'vibrant_kids' : 'bold_creator',
        aspectRatio: mappedFormat === 'youtube_long' ? '16:9' : '9:16',
        textColor: '#FFFFFF',
        accentColor: contentPack.thumbnail.suggestedColors?.accent || '#F59E0B',
        bgColor1: contentPack.thumbnail.suggestedColors?.bg1 || '#0F172A',
        bgColor2: contentPack.thumbnail.suggestedColors?.bg2 || '#3B0764',
        fontSize: 54,
        showVignette: true,
        showGlow: true,
        emojis: ['🔥', '✨', '⚡'],
        compositionAngle: contentPack.thumbnail.visualComposition,
        thumbnailIdea: contentPack.thumbnail.thumbnailIdea,
        aiConceptPrompt: contentPack.thumbnail.aiImagePrompt,
      },
      translations: [],
      contentPack: contentPack,
    };

    onSaveProject(newProject);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${(projectName || 'creatornova').toLowerCase().replace(/\s+/g, '_')}_thumbnail.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* =========================================================================
   * STEP 1: CREATE NEW PROJECT SCREEN
   * ========================================================================= */
  if (step === 'form') {
    return (
      <div className="min-h-full p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Content Creation Workflow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create New Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Generate a complete content pack: concept, hook, full script, scenes, SEO, thumbnail & repurposed posts.
            </p>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Form Container */}
        <div className="space-y-6">
          {/* 1. Project Name */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">1</span>
                Project Name *
              </label>
              <span className="text-[11px] text-slate-500">e.g. "Space Facts Short", "Kids Colors Video"</span>
            </div>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Space Facts Short"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-medium"
            />
          </div>

          {/* 2. Content Topic */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">2</span>
                Content Topic *
              </label>
              <span className="text-[11px] text-slate-500">What do you want to create content about?</span>
            </div>
            <textarea
              rows={2}
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to create content about? e.g. 5 amazing facts about space"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-medium resize-none"
            />
            {/* Quick pre-fill pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
              <span className="text-slate-500">Quick suggestions:</span>
              <button
                type="button"
                onClick={() => { setTopic('5 amazing facts about space'); setProjectName('Space Facts Short'); setPlatform('YouTube Shorts'); setContentType('Facts'); }}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                🌌 Space Facts
              </button>
              <button
                type="button"
                onClick={() => { setTopic('Fun nursery rhyme learning primary colors'); setProjectName('Kids Colors Video'); setPlatform('YouTube Long Video'); setContentType('Kids'); setTargetAudience('Kids 3–8'); }}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                🎨 Kids Colors
              </button>
              <button
                type="button"
                onClick={() => { setTopic('3 AI tools that will replace your workflow in 2026'); setProjectName('Top 3 AI Productivity Tools'); setPlatform('TikTok'); setContentType('Business'); setTargetAudience('Entrepreneurs'); }}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                ⚡ AI Productivity
              </button>
            </div>
          </div>

          {/* 3. Platform Selection */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">3</span>
                Platform Selection
              </label>
              <span className="text-[11px] text-slate-400">Select target video destination</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {platforms.map((p) => {
                const isSelected = platform === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPlatform(p.name)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 shadow-md shadow-violet-500/10 text-white ring-1 ring-violet-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 ' + p.color
                    }`}
                  >
                    <div className="shrink-0">{p.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{p.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {p.name.includes('Short') || p.name.includes('TikTok') || p.name.includes('Reel') ? '9:16 Vertical' : '16:9 Standard'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Content Type */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">4</span>
                Content Type
              </label>
              <span className="text-[11px] text-slate-400">Adapts narrative style and pacing</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => {
                const isSelected = contentType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Language & 6. Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Language */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">5</span>
                Language
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 font-medium"
                >
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500">
                Script, voiceover lines, titles, and captions will be generated in this language.
              </p>
            </div>

            {/* Video Duration */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">6</span>
                Video Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {durations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                      duration === d
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {duration === 'Custom' && (
                <input
                  type="text"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="e.g. 45 seconds, 8 minutes"
                  className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              )}
            </div>
          </div>

          {/* 7. Target Audience */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-[11px] flex items-center justify-center font-mono">7</span>
                Target Audience
              </label>
              <span className="text-[11px] text-slate-400">Who is watching?</span>
            </div>

            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Students, Kids 3–8, Entrepreneurs, General Audience"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500 text-[11px] self-center">Presets:</span>
              {audienceExamples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setTargetAudience(ex)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                    targetAudience === ex
                      ? 'bg-violet-600/30 text-violet-300 border-violet-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Large Primary Action Button */}
          <div className="pt-4 pb-8">
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={!topic.trim() || !projectName.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
            >
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span>Generate With AI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
   * STEP 2: AI GENERATION PROGRESS SCREEN
   * ========================================================================= */
  if (step === 'generating') {
    return (
      <div className="min-h-full flex items-center justify-center p-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 max-w-lg w-full shadow-2xl space-y-8 text-center">
          {/* Animated Spinner Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-spin">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Generating Creator Content Pack
            </h2>
            <p className="text-xs text-slate-400">
              Gemini AI is crafting your hook, screenplay, visual shots, SEO tags and thumbnail formulas for{' '}
              <strong className="text-violet-300">{platform}</strong>
            </p>
          </div>

          {/* Stepper Checklist */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-3.5">
            {progressSteps.map((stepText, idx) => {
              const isPast = idx < currentProgressIndex;
              const isCurrent = idx === currentProgressIndex;
              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span
                    className={`font-semibold transition-colors ${
                      isPast
                        ? 'text-slate-300'
                        : isCurrent
                        ? 'text-violet-300 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((currentProgressIndex + 1) / progressSteps.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
   * STEP 3: RESULT SCREEN WITH 6 TABS
   * ========================================================================= */
  if (step === 'result' && contentPack) {
    const tabs = [
      { id: 'overview' as const, label: 'Overview', icon: Sparkles },
      { id: 'script' as const, label: 'Script', icon: FileText },
      { id: 'scenes' as const, label: 'Scenes', icon: Clapperboard },
      { id: 'seo' as const, label: 'SEO', icon: Search },
      { id: 'thumbnail' as const, label: 'Thumbnail', icon: ImageIcon },
      { id: 'repurpose' as const, label: 'Repurpose', icon: Repeat },
    ];

    return (
      <div className="min-h-full p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in">
        {/* Success Banner */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-violet-950/60 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Your Content Pack is Ready</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Film
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {contentPack.projectName} &bull; {contentPack.platform} &bull; {contentPack.language} &bull; {contentPack.duration}
              </p>
            </div>
          </div>

          {/* Action Buttons: Copy, Regenerate, Edit, Save Project */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCopy(JSON.stringify(contentPack, null, 2), 'pack-json')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedStatus === 'pack-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStatus === 'pack-json' ? 'Copied All!' : 'Copy'}</span>
            </button>

            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Regenerate</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit'}</span>
            </button>

            <button
              onClick={handleSaveToRecentProjects}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved to Recent Projects!' : 'Save Project'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeResultTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeResultTab === 'overview' && (
          <div className="space-y-6">
            {/* Hook Hero Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  High Retention Opening Hook (0-3s)
                </span>
                <button
                  onClick={() => handleCopy(contentPack.hook.hookText, 'hook')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedStatus === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStatus === 'hook' ? 'Copied' : 'Copy Hook'}</span>
                </button>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                "{contentPack.hook.hookText}"
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  Visual Action: <strong className="text-slate-200">{contentPack.hook.visualAction}</strong>
                </span>
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  Trigger: <strong className="text-slate-200">{contentPack.hook.psychologyTrigger}</strong>
                </span>
              </div>
            </div>

            {/* Video Concept & Core Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  Content Concept
                </h3>
                <h4 className="text-base font-bold text-white">
                  {contentPack.contentIdea.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {contentPack.contentIdea.concept}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <TargetIcon />
                  Target Audience & Core Value
                </h3>
                <div className="text-xs font-semibold text-slate-200">
                  For: <span className="text-cyan-300">{contentPack.targetAudience}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {contentPack.contentIdea.coreValue}
                </p>
              </div>
            </div>

            {/* Content Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Script Length</span>
                <div className="text-base font-bold text-white">{contentPack.script.wordCount} Words</div>
                <span className="text-[11px] text-slate-400">{contentPack.script.estimatedDuration}</span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Scene Breakdown</span>
                <div className="text-base font-bold text-white">{contentPack.scenes.length} Scenes</div>
                <span className="text-[11px] text-slate-400">With AI Video Prompts</span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">SEO Health Score</span>
                <div className="text-base font-bold text-emerald-400">{contentPack.seo.seoScore}/100</div>
                <span className="text-[11px] text-slate-400">5 High-CTR Titles</span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Repurposed Channels</span>
                <div className="text-base font-bold text-violet-400">5 Formats</div>
                <span className="text-[11px] text-slate-400">Shorts, IG, TikTok, FB, Comm</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCRIPT */}
        {activeResultTab === 'script' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Full Video Script ({contentPack.language})
                </h3>
                <p className="text-xs text-slate-400">
                  Estimated duration: {contentPack.script.estimatedDuration} &bull; {contentPack.script.wordCount} words
                </p>
              </div>

              <button
                onClick={() => handleCopy(contentPack.script.rawFullText, 'script-text')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedStatus === 'script-text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStatus === 'script-text' ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                rows={12}
                value={contentPack.script.rawFullText}
                onChange={(e) =>
                  setContentPack({
                    ...contentPack,
                    script: { ...contentPack.script, rawFullText: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-violet-500"
              />
            ) : (
              <div className="space-y-4">
                {contentPack.script.beats && contentPack.script.beats.length > 0 ? (
                  contentPack.script.beats.map((beat, idx) => (
                    <div
                      key={beat.id || idx}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {beat.timestamp}
                        </span>
                        <span className="text-amber-400 font-mono italic">
                          {beat.directionCue}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white pl-2 border-l-2 border-violet-500">
                        "{beat.dialogue}"
                      </p>
                      {beat.visualCue && (
                        <p className="text-xs text-slate-400 pt-1">
                          <strong className="text-slate-500 uppercase text-[10px]">Visual Cue:</strong> {beat.visualCue}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 whitespace-pre-line font-mono text-sm leading-relaxed text-slate-200">
                    {contentPack.script.rawFullText}
                  </div>
                )}
              </div>
            )}

            {/* Call to Action */}
            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Call to Action (Outro)</span>
              <p className="text-xs font-semibold text-white">"{contentPack.script.callToAction}"</p>
            </div>
          </div>
        )}

        {/* TAB 3: SCENES */}
        {activeResultTab === 'scenes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-purple-400" />
                  Scene Breakdown ({contentPack.scenes.length} Scenes)
                </h3>
                <p className="text-xs text-slate-400">
                  Each scene includes visual description, character action, voiceover line, and AI video generator prompt.
                </p>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    contentPack.scenes
                      .map(
                        (s) =>
                          `SCENE ${s.sceneNumber} (${s.timestampRange})\nVisual: ${s.visualDescription}\nAction: ${s.characterAction}\nVoiceover: ${s.voiceover}\nAI Prompt: ${s.aiVideoPrompt}\n`
                      )
                      .join('\n---\n\n'),
                    'all-scenes'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedStatus === 'all-scenes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStatus === 'all-scenes' ? 'Copied' : 'Copy All Scenes'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentPack.scenes.map((scene) => (
                <div
                  key={scene.id || scene.sceneNumber}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between transition-colors"
                >
                  <div className="space-y-3">
                    {/* Scene Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-sm text-purple-400">
                        Scene #{scene.sceneNumber}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {scene.timestampRange}
                      </span>
                    </div>

                    {/* Visual Description */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Visual Description</span>
                      <p className="text-xs text-white leading-relaxed mt-0.5">{scene.visualDescription}</p>
                    </div>

                    {/* Character / Action Description */}
                    {scene.characterAction && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cyan-500 tracking-wider block">Character / Action</span>
                        <p className="text-xs text-cyan-200 leading-relaxed mt-0.5">{scene.characterAction}</p>
                      </div>
                    )}

                    {/* Voiceover */}
                    {scene.voiceover && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">Voiceover</span>
                        <p className="text-xs text-amber-200 italic leading-relaxed mt-0.5">"{scene.voiceover}"</p>
                      </div>
                    )}

                    {/* AI Video Generation Prompt */}
                    {scene.aiVideoPrompt && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-violet-400 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            AI Video Prompt (Veo / Sora / Runway)
                          </span>
                          <button
                            onClick={() => handleCopy(scene.aiVideoPrompt || '', `prompt-${scene.sceneNumber}`)}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >
                            {copiedStatus === `prompt-${scene.sceneNumber}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">{scene.aiVideoPrompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SEO */}
        {activeResultTab === 'seo' && (
          <div className="space-y-6">
            {/* Title Suggestions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  5 High-CTR Title Suggestions
                </h3>
                <span className="text-xs text-slate-400">Click any title to copy</span>
              </div>

              <div className="space-y-2.5">
                {contentPack.seo.titleSuggestions.map((title, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopy(title, `title-${idx}`)}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {title}
                      </span>
                    </div>

                    <button className="text-xs text-slate-400 group-hover:text-white shrink-0">
                      {copiedStatus === `title-${idx}` ? (
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description & Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    SEO Description
                  </h4>
                  <button
                    onClick={() => handleCopy(contentPack.seo.description, 'desc')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedStatus === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStatus === 'desc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line">
                  {contentPack.seo.description}
                </div>
              </div>

              {/* Keywords & Hashtags */}
              <div className="space-y-6">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Relevant Keywords ({contentPack.seo.keywords.length})
                    </h4>
                    <button
                      onClick={() => handleCopy(contentPack.seo.keywords.join(', '), 'keywords')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {copiedStatus === 'keywords' ? 'Copied' : 'Copy All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contentPack.seo.keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Hashtags
                    </h4>
                    <button
                      onClick={() => handleCopy(contentPack.seo.hashtags.join(' '), 'hashtags')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {copiedStatus === 'hashtags' ? 'Copied' : 'Copy All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contentPack.seo.hashtags.map((ht, i) => (
                      <span key={i} className="text-xs bg-violet-950/40 text-violet-300 border border-violet-800/40 px-2.5 py-1 rounded-full font-semibold">
                        {ht}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THUMBNAIL */}
        {activeResultTab === 'thumbnail' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left 6 cols: Live Canvas Preview */}
            <div className="md:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  Thumbnail Preview
                </span>
                <button
                  onClick={handleDownloadThumbnail}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>
              </div>

              <div className="w-full flex items-center justify-center py-2">
                <canvas
                  ref={canvasRef}
                  className="max-w-full rounded-xl shadow-2xl border-2 border-slate-700/60 object-contain max-h-[380px]"
                />
              </div>

              <div className="w-full text-center text-xs text-slate-400 font-mono">
                Short Overlay Text: <strong className="text-white">"{contentPack.thumbnail.shortText}"</strong>
              </div>
            </div>

            {/* Right 6 cols: Concepts & AI Prompts */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Thumbnail Concept
                </h4>
                <p className="text-xs text-white leading-relaxed">
                  {contentPack.thumbnail.thumbnailIdea}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Visual Composition & Focal Point
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {contentPack.thumbnail.visualComposition}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Image-Generation Prompt (Midjourney / Imagen)
                  </h4>
                  <button
                    onClick={() => handleCopy(contentPack.thumbnail.aiImagePrompt, 'thumb-prompt')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {copiedStatus === 'thumb-prompt' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed">
                  {contentPack.thumbnail.aiImagePrompt}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REPURPOSE CONTENT */}
        {activeResultTab === 'repurpose' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-cyan-400" />
                  Repurpose Content
                </h3>
                <p className="text-xs text-slate-400">
                  Turn this project into ready-to-publish posts across 5 different social platforms.
                </p>
              </div>
            </div>

            {/* Repurpose Platform Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setActiveRepurposePlatform('youtubeShort')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeRepurposePlatform === 'youtubeShort'
                    ? 'bg-red-500/20 text-red-300 border-red-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <PlaySquare className="w-4 h-4 text-red-500" />
                <span>YouTube Short</span>
              </button>

              <button
                onClick={() => setActiveRepurposePlatform('instagramReel')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeRepurposePlatform === 'instagramReel'
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>Instagram Reel</span>
              </button>

              <button
                onClick={() => setActiveRepurposePlatform('tiktok')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeRepurposePlatform === 'tiktok'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4 text-cyan-400" />
                <span>TikTok</span>
              </button>

              <button
                onClick={() => setActiveRepurposePlatform('facebookPost')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeRepurposePlatform === 'facebookPost'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Facebook className="w-4 h-4 text-blue-500" />
                <span>Facebook Post</span>
              </button>

              <button
                onClick={() => setActiveRepurposePlatform('youtubeCommunity')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeRepurposePlatform === 'youtubeCommunity'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Community Post</span>
              </button>
            </div>

            {/* Platform Repurpose Details */}
            {activeRepurposePlatform === 'youtubeShort' && contentPack.repurposing.youtubeShort && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <PlaySquare className="w-4 h-4 text-red-500" />
                    YouTube Short Format
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${contentPack.repurposing.youtubeShort.hook}\n\n${contentPack.repurposing.youtubeShort.script}\n\n${contentPack.repurposing.youtubeShort.caption}\n\n${contentPack.repurposing.youtubeShort.hashtags.join(' ')}`,
                        'yt-short'
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedStatus === 'yt-short' ? 'Copied!' : 'Copy Short Pack'}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Vertical Hook</span>
                  <p className="text-xs text-white italic">"{contentPack.repurposing.youtubeShort.hook}"</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Under 60s Script</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">{contentPack.repurposing.youtubeShort.script}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Caption & Hashtags</span>
                  <p className="text-xs text-slate-300 font-mono">
                    {contentPack.repurposing.youtubeShort.caption} {contentPack.repurposing.youtubeShort.hashtags.join(' ')}
                  </p>
                </div>
              </div>
            )}

            {activeRepurposePlatform === 'instagramReel' && contentPack.repurposing.instagramReel && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    Instagram Reel Format
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${contentPack.repurposing.instagramReel.hook}\n\n${contentPack.repurposing.instagramReel.caption}\n\n${contentPack.repurposing.instagramReel.hashtags.join(' ')}`,
                        'ig-reel'
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedStatus === 'ig-reel' ? 'Copied!' : 'Copy Reel Pack'}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-pink-400 block mb-1">Reel Hook</span>
                  <p className="text-xs text-white italic">"{contentPack.repurposing.instagramReel.hook}"</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Suggested Audio Vibe</span>
                  <p className="text-xs text-cyan-300 font-mono">{contentPack.repurposing.instagramReel.audioIdea}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Formatted Instagram Caption</span>
                  <div className="text-xs text-slate-300 whitespace-pre-line bg-slate-900 p-3 rounded-xl border border-slate-800">
                    {contentPack.repurposing.instagramReel.caption}
                    <div className="pt-2 text-violet-400">
                      {contentPack.repurposing.instagramReel.hashtags.join(' ')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRepurposePlatform === 'tiktok' && contentPack.repurposing.tiktok && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-cyan-400" />
                    TikTok Format
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${contentPack.repurposing.tiktok.hook}\n\n${contentPack.repurposing.tiktok.caption}\n\n${contentPack.repurposing.tiktok.hashtags.join(' ')}`,
                        'tiktok-pack'
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedStatus === 'tiktok-pack' ? 'Copied!' : 'Copy TikTok Pack'}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Native TikTok Pattern Interrupt</span>
                  <p className="text-xs text-white italic">"{contentPack.repurposing.tiktok.hook}"</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sound / Trend Direction</span>
                  <p className="text-xs text-amber-300 font-mono">{contentPack.repurposing.tiktok.soundTrend}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">TikTok Caption</span>
                  <p className="text-xs text-slate-200">
                    {contentPack.repurposing.tiktok.caption} <span className="text-cyan-400">{contentPack.repurposing.tiktok.hashtags.join(' ')}</span>
                  </p>
                </div>
              </div>
            )}

            {activeRepurposePlatform === 'facebookPost' && contentPack.repurposing.facebookPost && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-500" />
                    Facebook Long-form Post
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${contentPack.repurposing.facebookPost.headline}\n\n${contentPack.repurposing.facebookPost.text}\n\n${contentPack.repurposing.facebookPost.cta}`,
                        'fb-pack'
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedStatus === 'fb-pack' ? 'Copied!' : 'Copy Facebook Post'}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">Headline</span>
                  <p className="text-sm font-bold text-white">{contentPack.repurposing.facebookPost.headline}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Post Body</span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{contentPack.repurposing.facebookPost.text}</p>
                </div>

                <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-blue-400 block">CTA Question</span>
                  <p className="text-xs text-white">{contentPack.repurposing.facebookPost.cta}</p>
                </div>
              </div>
            )}

            {activeRepurposePlatform === 'youtubeCommunity' && contentPack.repurposing.youtubeCommunity && (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    YouTube Community Post & Poll
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${contentPack.repurposing.youtubeCommunity.postText}\n\nPoll: ${contentPack.repurposing.youtubeCommunity.pollQuestion || ''}\n${(contentPack.repurposing.youtubeCommunity.pollOptions || []).join('\n')}`,
                        'comm-pack'
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedStatus === 'comm-pack' ? 'Copied!' : 'Copy Community Post'}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Post Text</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{contentPack.repurposing.youtubeCommunity.postText}</p>
                </div>

                {contentPack.repurposing.youtubeCommunity.pollQuestion && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Interactive Subscriber Poll</span>
                    <p className="text-xs font-bold text-white">{contentPack.repurposing.youtubeCommunity.pollQuestion}</p>
                    <div className="space-y-1.5 pt-1">
                      {(contentPack.repurposing.youtubeCommunity.pollOptions || []).map((opt, i) => (
                        <div key={i} className="text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

function TargetIcon() {
  return (
    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
