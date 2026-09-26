import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Palette,
  Type,
  Smile,
  Layers,
  Wand2,
  Sliders,
  Check,
  RefreshCw,
  Eye,
  Maximize2,
  Copy,
  Edit3,
  Film
} from 'lucide-react';
import { Project, ThumbnailConfig, ThumbnailStyleOption, ThumbnailAspectRatio } from '../types/content';
import { studioApi } from '../services/api';

interface ThumbnailCreatorProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onNavigateToMediaStudio?: () => void;
}

export const ThumbnailCreator: React.FC<ThumbnailCreatorProps> = ({
  project,
  onUpdateProject,
  onNavigateToMediaStudio,
}) => {
  const [config, setConfig] = useState<ThumbnailConfig>(
    project.thumbnail || {
      headline: project.name.toUpperCase(),
      subheadline: 'Watch This Now!',
      badgeText: 'MUST WATCH',
      templateTheme: 'bold_creator',
      aspectRatio: project.format === 'youtube_short' || project.format === 'tiktok' ? '9:16' : '16:9',
      textColor: '#FFFFFF',
      accentColor: '#F59E0B',
      bgColor1: '#0F172A',
      bgColor2: '#1E1B4B',
      fontSize: 52,
      showVignette: true,
      showGlow: true,
      emojis: ['🔥', '⚡', '✨'],
      compositionAngle: 'Center dynamic focal point',
    }
  );

  const [selectedVisualStyle, setSelectedVisualStyle] = useState<ThumbnailStyleOption>(
    (project.thumbnail?.visualStyle as ThumbnailStyleOption) || 'Cinematic'
  );
  const [productionPrompt, setProductionPrompt] = useState<string>(
    project.mediaStudio?.thumbnailPrompt ||
    project.thumbnail?.aiConceptPrompt ||
    `Ultra high-CTR ${selectedVisualStyle.toLowerCase()} thumbnail for "${project.name}": dynamic high-contrast focal visual illustrating ${project.topic}, volumetric lighting, dramatic angle, negative space for bold headline text.`
  );
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const [aiConcepts, setAiConcepts] = useState<any[]>([]);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync to project
  const updateConfig = (newCfg: Partial<ThumbnailConfig>) => {
    const updated = { ...config, ...newCfg };
    setConfig(updated);
    onUpdateProject({
      ...project,
      thumbnail: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSelectVisualStyle = (style: ThumbnailStyleOption) => {
    setSelectedVisualStyle(style);
    updateConfig({ visualStyle: style });
    if (style === 'Clean') {
      applyPresetTheme('minimal_clean');
    } else if (style === 'Kids') {
      applyPresetTheme('vibrant_kids');
    } else if (style === 'Cinematic') {
      applyPresetTheme('cosmic_dark');
    } else if (style === 'Colorful') {
      updateConfig({
        bgColor1: '#4F46E5',
        bgColor2: '#DB2777',
        accentColor: '#FBBF24',
        textColor: '#FFFFFF',
      });
    } else if (style === 'Cartoon') {
      updateConfig({
        bgColor1: '#059669',
        bgColor2: '#D97706',
        accentColor: '#FEF08A',
        textColor: '#FFFFFF',
      });
    } else if (style === 'Educational') {
      updateConfig({
        bgColor1: '#0F172A',
        bgColor2: '#0369A1',
        accentColor: '#38BDF8',
        textColor: '#FFFFFF',
      });
    } else if (style === 'Professional') {
      updateConfig({
        bgColor1: '#090D16',
        bgColor2: '#1E293B',
        accentColor: '#60A5FA',
        textColor: '#FFFFFF',
      });
    }
  };

  const handleGenerateThumbnailPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const res = await studioApi.generateThumbnailPromptEnhanced({
        topic: project.topic,
        title: project.name,
        targetAudience: project.targetAudience,
        thumbnailConcept: project.thumbnail?.thumbnailIdea || config.headline,
        visualStyle: selectedVisualStyle,
        aspectRatio: config.aspectRatio as ThumbnailAspectRatio,
      });
      if (res.result) {
        setProductionPrompt(res.result.prompt);
        updateConfig({
          aiConceptPrompt: res.result.prompt,
          headline: res.result.shortHeadline || config.headline,
        });
      }
    } catch (err) {
      console.error('Failed generating thumbnail prompt:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(productionPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Render thumbnail on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const is169 = config.aspectRatio === '16:9';
    const is916 = config.aspectRatio === '9:16';
    const width = is169 ? 1280 : is916 ? 720 : 1080;
    const height = is169 ? 720 : is916 ? 1280 : 1080;

    canvas.width = width;
    canvas.height = height;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, config.bgColor1);
    bgGrad.addColorStop(1, config.bgColor2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Graphic Mesh / Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Glow Aura
    if (config.showGlow) {
      const radialGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        width * 0.45
      );
      radialGrad.addColorStop(0, `${config.accentColor}44`);
      radialGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Vignette
    if (config.showVignette) {
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.3,
        width / 2,
        height / 2,
        width * 0.65
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    // Center Hero Shape / Frame
    ctx.save();
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, width - 60, height - 60);
    ctx.restore();

    // Badge Pill (Top-Right or Top-Left)
    if (config.badgeText) {
      ctx.save();
      const badgeX = is169 ? 70 : 50;
      const badgeY = is169 ? 70 : 80;
      ctx.fillStyle = config.accentColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, 200, 50, 25);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = '900 24px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.badgeText.toUpperCase(), badgeX + 100, badgeY + 26);
      ctx.restore();
    }

    // Emojis / Floating Stickers
    if (config.emojis && config.emojis.length > 0) {
      ctx.save();
      ctx.font = '70px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      if (is169) {
        ctx.fillText(config.emojis[0] || '🔥', width - 120, 130);
        if (config.emojis[1]) ctx.fillText(config.emojis[1], width - 120, height - 120);
        if (config.emojis[2]) ctx.fillText(config.emojis[2], 120, height - 120);
      } else {
        ctx.fillText(config.emojis[0] || '🔥', width - 90, 120);
        if (config.emojis[1]) ctx.fillText(config.emojis[1], 90, height - 120);
      }
      ctx.restore();
    }

    // Main Headline Text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const headlineY = is169 ? height * 0.48 : height * 0.42;
    ctx.font = `900 ${config.fontSize * (is169 ? 1.4 : 1.1)}px Impact, "Arial Black", sans-serif`;

    // Drop shadow
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;

    // Stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 14;
    ctx.strokeText(config.headline, width / 2, headlineY);

    // Text Fill
    ctx.fillStyle = config.textColor;
    ctx.fillText(config.headline, width / 2, headlineY);
    ctx.restore();

    // Subheadline
    if (config.subheadline) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const subY = headlineY + (is169 ? 100 : 90);
      ctx.font = `800 ${config.fontSize * 0.65}px system-ui, sans-serif`;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeText(config.subheadline, width / 2, subY);

      ctx.fillStyle = config.accentColor;
      ctx.fillText(config.subheadline, width / 2, subY);
      ctx.restore();
    }
  }, [config]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_thumbnail.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleFetchAiConcepts = async () => {
    setIsLoadingConcepts(true);
    try {
      const res = await studioApi.generateThumbnailConcepts({
        title: project.script?.title || project.name,
        topic: project.topic,
        tone: project.tone,
      });

      if (res.concepts && Array.isArray(res.concepts)) {
        setAiConcepts(res.concepts);
      }
    } catch (err) {
      console.error('Failed generating thumbnail concepts', err);
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  const applyPresetTheme = (theme: ThumbnailConfig['templateTheme']) => {
    switch (theme) {
      case 'vibrant_kids':
        updateConfig({
          templateTheme: theme,
          bgColor1: '#3B82F6',
          bgColor2: '#EC4899',
          accentColor: '#F59E0B',
          textColor: '#FFFFFF',
          emojis: ['🎨', '🌟', '👶'],
          badgeText: 'KIDS FAVORITE',
        });
        break;
      case 'cosmic_dark':
        updateConfig({
          templateTheme: theme,
          bgColor1: '#0F172A',
          bgColor2: '#581C87',
          accentColor: '#A855F7',
          textColor: '#FFFFFF',
          emojis: ['🕳️', '🌌', '⚠️'],
          badgeText: 'DO NOT JUMP',
        });
        break;
      case 'bold_creator':
        updateConfig({
          templateTheme: theme,
          bgColor1: '#000000',
          bgColor2: '#18181B',
          accentColor: '#FACC15',
          textColor: '#FFFFFF',
          emojis: ['🔥', '😱', '⚡'],
          badgeText: 'SHOCKING',
        });
        break;
      case 'neon_glow':
        updateConfig({
          templateTheme: theme,
          bgColor1: '#030712',
          bgColor2: '#064E3B',
          accentColor: '#10B981',
          textColor: '#FFFFFF',
          emojis: ['💎', '🚀', '👑'],
          badgeText: '100% SECRET',
        });
        break;
      case 'minimal_clean':
        updateConfig({
          templateTheme: theme,
          bgColor1: '#1E293B',
          bgColor2: '#0F172A',
          accentColor: '#38BDF8',
          textColor: '#FFFFFF',
          emojis: ['✨', '🎯', '💡'],
          badgeText: 'NEW!',
        });
        break;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Studio Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interactive Thumbnail Creator</h2>
            <p className="text-xs text-slate-400">Design 12%+ CTR thumbnails with bold typography, contrast formulas & PNG export</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PNG (HD)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Canvas & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Live Canvas Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center">
            {/* Aspect Ratio Toggle */}
            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-pink-400" />
                Live High-Res Preview
              </span>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => updateConfig({ aspectRatio: '16:9' })}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    config.aspectRatio === '16:9' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  16:9 (YouTube)
                </button>
                <button
                  onClick={() => updateConfig({ aspectRatio: '9:16' })}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    config.aspectRatio === '9:16' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  9:16 (Shorts/Reel)
                </button>
                <button
                  onClick={() => updateConfig({ aspectRatio: '1:1' })}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    config.aspectRatio === '1:1' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1:1 (Social Post)
                </button>
              </div>
            </div>

            {/* Visual Style Selection */}
            <div className="w-full bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Visual Style
                </span>
                <span className="text-[11px] font-mono text-pink-400 font-bold">
                  {selectedVisualStyle}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['Clean', 'Colorful', 'Cinematic', 'Cartoon', 'Educational', 'Kids', 'Professional'] as ThumbnailStyleOption[]).map(
                  (style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleSelectVisualStyle(style)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedVisualStyle === style
                          ? 'bg-pink-600 text-white border-pink-500 shadow-sm shadow-pink-600/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
                      }`}
                    >
                      {style}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Canvas Element with Responsive Container */}
            <div className="w-full flex items-center justify-center py-2">
              <canvas
                ref={canvasRef}
                className="max-w-full rounded-xl shadow-2xl border-2 border-slate-700/60 object-contain max-h-[460px]"
              />
            </div>

            <div className="w-full flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 mt-2 font-mono">
              <span>{config.aspectRatio === '16:9' ? '1280 x 720 px (16:9)' : config.aspectRatio === '9:16' ? '720 x 1280 px (9:16)' : '1080 x 1080 px (1:1)'}</span>
              <span>Ultra-sharp vector typography</span>
            </div>
          </div>

          {/* AI Production Thumbnail Prompt Studio Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Production-Ready Thumbnail Prompt
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateThumbnailPrompt}
                  disabled={isGeneratingPrompt}
                  className="px-3 py-1.5 rounded-lg bg-pink-600/30 hover:bg-pink-600 text-pink-200 hover:text-white text-xs font-bold border border-pink-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingPrompt ? 'Generating...' : 'Generate Thumbnail'}</span>
                </button>
                <button
                  onClick={handleCopyPrompt}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Generated automatically from your project topic, title, audience (<span className="text-slate-200 font-semibold">{project.targetAudience}</span>), concept, and selected <span className="text-pink-300 font-semibold">{selectedVisualStyle}</span> style.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] text-pink-400 font-semibold uppercase">AI Image Generation Prompt:</span>
                <button
                  onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingPrompt ? 'Save' : 'Edit Prompt'}</span>
                </button>
              </div>

              {isEditingPrompt ? (
                <textarea
                  rows={4}
                  value={productionPrompt}
                  onChange={(e) => {
                    setProductionPrompt(e.target.value);
                    updateConfig({ aiConceptPrompt: e.target.value });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-pink-500"
                />
              ) : (
                <div className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {productionPrompt}
                </div>
              )}
            </div>

            {onNavigateToMediaStudio && (
              <div className="pt-2 flex items-center justify-between bg-gradient-to-r from-violet-950/40 to-pink-950/40 border border-violet-800/40 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-slate-300">Want full voiceover, scene media generation & video timeline?</span>
                </div>
                <button
                  onClick={onNavigateToMediaStudio}
                  className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Open AI Media Studio →
                </button>
              </div>
            )}
          </div>

          {/* AI Psychology Concepts Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Viral Thumbnail Formulas
                </h3>
              </div>
              <button
                onClick={handleFetchAiConcepts}
                disabled={isLoadingConcepts}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConcepts ? 'animate-spin' : ''}`} />
                <span>{aiConcepts.length > 0 ? 'Regenerate Ideas' : 'Generate Formulas with AI'}</span>
              </button>
            </div>

            {aiConcepts.length > 0 ? (
              <div className="space-y-3">
                {aiConcepts.map((c, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      updateConfig({
                        headline: c.headline || config.headline,
                        aiConceptPrompt: c.imagePrompt,
                      })
                    }
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        {c.conceptName || `Concept ${i + 1}`}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Apply Headline
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white font-mono">
                      "{c.headline}"
                    </div>
                    <p className="text-xs text-slate-400">{c.focalPoint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Click "Generate Formulas with AI" to get 3 psychology-backed thumbnail concepts designed for 12%+ CTR.
              </p>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Customization Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              Thumbnail Designer Controls
            </h3>

            {/* Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Style Preset Themes
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => applyPresetTheme('bold_creator')}
                  className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-left transition-colors"
                >
                  ⚡ Bold Creator
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTheme('cosmic_dark')}
                  className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-left transition-colors"
                >
                  🌌 Cosmic Void
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTheme('vibrant_kids')}
                  className="p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 text-left transition-colors"
                >
                  🎨 Vibrant Kids
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTheme('neon_glow')}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-left transition-colors"
                >
                  💎 Neon Emerald
                </button>
              </div>
            </div>

            {/* Headline Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Main Headline Text (3-4 words max)
              </label>
              <input
                type="text"
                value={config.headline}
                onChange={(e) => updateConfig({ headline: e.target.value })}
                placeholder="e.g. DO NOT JUMP IN!"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Subheadline & Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subheadline
                </label>
                <input
                  type="text"
                  value={config.subheadline}
                  onChange={(e) => updateConfig({ subheadline: e.target.value })}
                  placeholder="e.g. Inside The Void 🕳️"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={config.badgeText}
                  onChange={(e) => updateConfig({ badgeText: e.target.value })}
                  placeholder="e.g. VIRAL, MUST WATCH"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Color Palette Pickers */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => updateConfig({ accentColor: e.target.value })}
                  className="w-full h-8 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Gradient Start
                </label>
                <input
                  type="color"
                  value={config.bgColor1}
                  onChange={(e) => updateConfig({ bgColor1: e.target.value })}
                  className="w-full h-8 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Gradient End
                </label>
                <input
                  type="color"
                  value={config.bgColor2}
                  onChange={(e) => updateConfig({ bgColor2: e.target.value })}
                  className="w-full h-8 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Font Size: {config.fontSize}px</span>
              </div>
              <input
                type="range"
                min="36"
                max="80"
                value={config.fontSize}
                onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Visual Overlays Toggles */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGlow}
                  onChange={(e) => updateConfig({ showGlow: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600 bg-slate-950 border-slate-700"
                />
                <span>Center Glow</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showVignette}
                  onChange={(e) => updateConfig({ showVignette: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600 bg-slate-950 border-slate-700"
                />
                <span>Dark Vignette</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
