import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Clapperboard,
  Image as ImageIcon,
  Mic,
  Music,
  Tv,
  Film,
  Layers,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  Copy as DuplicateIcon,
  ArrowUp,
  ArrowDown,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Settings2,
  Coins,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Edit3,
  Flame,
  Info
} from 'lucide-react';
import {
  Project,
  VisualIdentity,
  SceneItem,
  ThumbnailStyleOption,
  ThumbnailAspectRatio,
  SpeakingStyle,
  CaptionStyle,
  MusicGenre,
  MediaStudioData,
  SceneTransition,
  MediaStatus
} from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GENERATION_CREDIT_COSTS } from '../config/creditCosts';
import { CREDIT_COSTS } from '../services/credits';
import { ExpensiveVideoProtectionModal } from './ExpensiveVideoProtectionModal';

interface AIMediaStudioProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AIMediaStudio: React.FC<AIMediaStudioProps> = ({
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  // Sub-modules inside AI Media Studio
  const [activeStudioSection, setActiveStudioSection] = useState<
    'pipeline' | 'thumbnail' | 'voiceover' | 'scenes' | 'timeline' | 'captions' | 'music' | 'preview'
  >('pipeline');

  // Credits state from authoritative backend context
  const { credits, creditConfig, openInsufficientCreditModal, refreshCredits } = useAuth();
  const [creditWarning, setCreditWarning] = useState<string | null>(null);

  // Error handling state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedActionContext, setFailedActionContext] = useState<(() => void) | null>(null);

  // Visual Identity state
  const defaultVisualIdentity: VisualIdentity = {
    characterDescription:
      project.targetAudience.includes('Kids')
        ? 'Friendly smiling cartoon mascot character with big expressive eyes'
        : 'Charismatic presenter in modern smart-casual attire with confident body language',
    clothing:
      project.targetAudience.includes('Kids')
        ? 'Vibrant colorful explorer outfit with round buttons'
        : 'Minimalist dark navy tailored overshirt over white crewneck',
    colors: ['#8B5CF6', '#3B82F6', '#F59E0B'],
    environmentStyle:
      project.targetAudience.includes('Kids')
        ? 'Playful magical playroom with soft floating pastel shapes'
        : 'High-tech minimalist studio with soft ambient LED gradient panels',
    lighting: 'Volumetric cinematic rim lighting, 3500K warm key light, soft fill',
    artStyle: 'Cinematic 3D render, octane photorealism, crisp detail, 8k',
    cameraStyle: '35mm anamorphic prime lens, shallow depth of field, subtle film grain',
  };

  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity>(
    project.mediaStudio?.visualIdentity || defaultVisualIdentity
  );
  const [isEditingVisualIdentity, setIsEditingVisualIdentity] = useState(false);

  // Thumbnail Studio state
  const [thumbnailStyle, setThumbnailStyle] = useState<ThumbnailStyleOption>(
    project.mediaStudio?.thumbnailStyle || (project.contentType === 'Kids' ? 'Kids' : 'Cinematic')
  );
  const [thumbnailAspectRatio, setThumbnailAspectRatio] = useState<ThumbnailAspectRatio>(
    project.format === 'youtube_short' || project.format === 'tiktok' || project.format === 'instagram_reel'
      ? '9:16'
      : '16:9'
  );
  const [thumbnailPrompt, setThumbnailPrompt] = useState(
    project.mediaStudio?.thumbnailPrompt ||
      project.thumbnail?.aiConceptPrompt ||
      `Cinematic YouTube thumbnail for "${project.name}": A high-contrast focal point featuring the main breakthrough with dynamic volumetric lighting and negative space for bold headline.`
  );
  const [isGeneratingThumbnailPrompt, setIsGeneratingThumbnailPrompt] = useState(false);
  const [isEditingThumbnailPrompt, setIsEditingThumbnailPrompt] = useState(false);
  const [thumbnailShortText, setThumbnailShortText] = useState(project.thumbnail?.headline || 'MUST WATCH');
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);

  // Voiceover Studio state
  const [voiceLanguage, setVoiceLanguage] = useState<string>(project.language || 'English');
  const [voiceSpeaker, setVoiceSpeaker] = useState('Alex (Natural & Clear)');
  const [speakingStyle, setSpeakingStyle] = useState<SpeakingStyle>('Storytelling');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [voiceoverScript, setVoiceoverScript] = useState(
    project.mediaStudio?.voiceover?.scriptText || project.script?.rawFullText || project.topic
  );
  const [isEditingVoiceScript, setIsEditingVoiceScript] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Scenes Media state
  const [scenes, setScenes] = useState<SceneItem[]>(() => {
    if (project.mediaStudio?.scenes && project.mediaStudio.scenes.length > 0) {
      return project.mediaStudio.scenes;
    }
    return project.scenes.map((s, idx) => ({
      ...s,
      mediaStatus: s.mediaStatus || 'prompt_ready',
      durationSeconds: s.durationSeconds || 5,
      transition: s.transition || 'dissolve',
      captionText: s.captionText || s.voiceover || s.onScreenText || `Scene ${idx + 1}`,
    }));
  });
  const [editingScenePromptId, setEditingScenePromptId] = useState<string | null>(null);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  // Video Pipeline & Modal state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showVideoProtectionModal, setShowVideoProtectionModal] = useState(false);
  const [confirmedVideoCalculation, setConfirmedVideoCalculation] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto Captions state
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('Bold Shorts');
  const [captionFontSize, setCaptionFontSize] = useState(24);
  const [captionColor, setCaptionColor] = useState('#FACC15');
  const [captionBgColor, setCaptionBgColor] = useState('rgba(0,0,0,0.7)');
  const [captionsEnabled, setCaptionsEnabled] = useState(true);

  // Background Music state
  const [musicGenre, setMusicGenre] = useState<MusicGenre>('Adventure');
  const [musicVolume, setMusicVolume] = useState<number>(40);
  const [isPlayingMusicPreview, setIsPlayingMusicPreview] = useState(false);

  // Final Preview Video simulation player state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentScenePreviewIdx, setCurrentScenePreviewIdx] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync to parent project
  const saveMediaStudioToProject = (extraUpdates: Partial<MediaStudioData> = {}) => {
    const mediaStudio: MediaStudioData = {
      visualIdentity,
      scenes,
      voiceover: {
        language: voiceLanguage,
        voice: voiceSpeaker,
        speakingStyle,
        speed: voiceSpeed,
        scriptText: voiceoverScript,
        status: isPlayingVoice ? 'preview_available' : 'ready',
      },
      captions: {
        style: captionStyle,
        fontSize: captionFontSize,
        color: captionColor,
        bgColor: captionBgColor,
        enabled: captionsEnabled,
        segments: scenes.map((s, i) => ({
          id: `cap-${s.id || i}`,
          sceneNumber: s.sceneNumber,
          text: s.captionText || s.voiceover || `Scene ${s.sceneNumber}`,
          startTime: i * 5,
          endTime: (i + 1) * 5,
        })),
      },
      music: {
        genre: musicGenre,
        volume: musicVolume,
        trackName: musicGenre === 'No Music' ? 'None' : `${musicGenre} Ambient Theme (Royalty Free)`,
        licenseStatus: 'royalty_free',
      },
      thumbnailStyle,
      thumbnailAspectRatio,
      thumbnailPrompt,
      videoPipelineStatus: {
        scriptReady: !!voiceoverScript,
        voiceoverReady: true,
        sceneMediaReady: scenes.length > 0,
        timelineReady: scenes.length > 0,
        captionsReady: captionsEnabled,
        musicReady: musicGenre !== 'No Music',
        finalPreviewReady: scenes.length > 0,
      },
      ...extraUpdates,
    };

    onUpdateProject({
      ...project,
      mediaStudio,
      updatedAt: new Date().toISOString(),
    });
  };

  // Auto-sync whenever key settings change
  useEffect(() => {
    saveMediaStudioToProject();
  }, [visualIdentity, thumbnailStyle, thumbnailAspectRatio, voiceLanguage, voiceSpeaker, speakingStyle, voiceSpeed, captionStyle, musicGenre, musicVolume]);

  // Thumbnail Canvas live rendering
  useEffect(() => {
    const canvas = thumbnailCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const is169 = thumbnailAspectRatio === '16:9';
    const is916 = thumbnailAspectRatio === '9:16';
    const width = is169 ? 1280 : is916 ? 720 : 1080;
    const height = is169 ? 720 : is916 ? 1280 : 1080;

    canvas.width = width;
    canvas.height = height;

    // Style colors
    let bg1 = '#0F172A';
    let bg2 = '#3B0764';
    let accent = '#F59E0B';

    if (thumbnailStyle === 'Kids') {
      bg1 = '#3B82F6';
      bg2 = '#EC4899';
      accent = '#FACC15';
    } else if (thumbnailStyle === 'Clean' || thumbnailStyle === 'Professional') {
      bg1 = '#0B0F19';
      bg2 = '#1E293B';
      accent = '#38BDF8';
    } else if (thumbnailStyle === 'Colorful') {
      bg1 = '#4F46E5';
      bg2 = '#DB2777';
      accent = '#FBBF24';
    } else if (thumbnailStyle === 'Cartoon') {
      bg1 = '#059669';
      bg2 = '#D97706';
      accent = '#FEF08A';
    }

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, bg1);
    grad.addColorStop(1, bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative cinematic grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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

    // Glowing border frame
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Badge
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(is916 ? 40 : 60, is916 ? 50 : 50, 200, 48, 24);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 22px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(thumbnailStyle.toUpperCase(), is916 ? 140 : 160, is916 ? 74 : 74);

    // Main Headline Text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const headlineY = height * 0.48;
    const fontSize = is169 ? 76 : is916 ? 64 : 68;
    ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;

    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 6;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeText(thumbnailShortText.toUpperCase(), width / 2, headlineY);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(thumbnailShortText.toUpperCase(), width / 2, headlineY);
    ctx.restore();

    // Secondary subtext
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(project.name.slice(0, 32), width / 2, headlineY + 80);
    ctx.restore();
  }, [thumbnailStyle, thumbnailAspectRatio, thumbnailShortText, project.name]);

  // Video simulation loop for Final Preview
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingPreview && scenes.length > 0) {
      timer = setInterval(() => {
        setPreviewProgress((prev) => {
          if (prev >= 100) {
            setCurrentScenePreviewIdx((sIdx) => (sIdx + 1) % scenes.length);
            return 0;
          }
          return prev + 5;
        });
      }, 250);
    } else {
      setPreviewProgress(0);
    }
    return () => clearInterval(timer);
  }, [isPlayingPreview, scenes.length]);

  // Handle Thumbnail Prompt Generation with Credits
  const handleGenerateThumbnailPrompt = async () => {
    const cost = creditConfig?.imageCost || GENERATION_CREDIT_COSTS.thumbnailImage;
    if (credits && credits.totalRemaining < cost) {
      openInsufficientCreditModal(cost);
      return;
    }
    setCreditWarning(null);
    setErrorMessage(null);
    setIsGeneratingThumbnailPrompt(true);

    try {
      const res = await studioApi.generateThumbnailPromptEnhanced({
        topic: project.topic,
        title: project.name,
        targetAudience: project.targetAudience,
        thumbnailConcept: project.thumbnail?.thumbnailIdea || project.thumbnail?.headline,
        visualStyle: thumbnailStyle,
        aspectRatio: thumbnailAspectRatio,
      });

      if (res.result) {
        setThumbnailPrompt(res.result.prompt);
        if (res.result.shortHeadline) {
          setThumbnailShortText(res.result.shortHeadline);
        }
        saveMediaStudioToProject({
          thumbnailPrompt: res.result.prompt,
        });
        refreshCredits();
      }
    } catch (err: any) {
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        openInsufficientCreditModal(cost);
        return;
      }
      console.error('Thumbnail prompt generation error:', err);
      setErrorMessage('Generation failed. Your project is safe.');
      setFailedActionContext(() => handleGenerateThumbnailPrompt);
    } finally {
      setIsGeneratingThumbnailPrompt(false);
    }
  };

  // Generate Consistent Scene Prompt using Visual Identity with Credits
  const handleGenerateConsistentScenePrompt = async (sceneNumber: number) => {
    const cost = creditConfig?.sceneCost || GENERATION_CREDIT_COSTS.sceneGeneration;
    if (credits && credits.totalRemaining < cost) {
      openInsufficientCreditModal(cost);
      return;
    }
    setCreditWarning(null);
    setErrorMessage(null);
    setGeneratingSceneId(`scene-${sceneNumber}`);

    const targetScene = scenes.find((s) => s.sceneNumber === sceneNumber);
    if (!targetScene) return;

    try {
      const res = await studioApi.generateSceneMediaPrompt({
        sceneNumber,
        visualDescription: targetScene.visualDescription,
        characterAction: targetScene.characterAction,
        visualIdentity,
      });

      if (res.result) {
        const updatedScenes = scenes.map((s) => {
          if (s.sceneNumber === sceneNumber) {
            return {
              ...s,
              aiVideoPrompt: res.result.consistentPrompt,
              mediaStatus: 'prompt_ready' as MediaStatus,
            };
          }
          return s;
        });
        setScenes(updatedScenes);
        saveMediaStudioToProject({ scenes: updatedScenes });
        refreshCredits();
      }
    } catch (err: any) {
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        openInsufficientCreditModal(cost);
        return;
      }
      setErrorMessage('Generation failed. Your project is safe.');
      setFailedActionContext(() => () => handleGenerateConsistentScenePrompt(sceneNumber));
    } finally {
      setGeneratingSceneId(null);
    }
  };

  // Real Web Speech API voice preview
  const handleToggleVoicePreview = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceoverScript.slice(0, 400));
    utterance.rate = voiceSpeed;
    utterance.pitch = speakingStyle === 'Kids' ? 1.3 : speakingStyle === 'Energetic' ? 1.15 : 1.0;

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  // Timeline operations
  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;

    const copy = [...scenes];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // re-index scene numbers
    const reindexed = copy.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(reindexed);
    saveMediaStudioToProject({ scenes: reindexed });
  };

  const handleDuplicateScene = (index: number) => {
    const sceneToDup = scenes[index];
    const newScene: SceneItem = {
      ...sceneToDup,
      id: `scene-${Date.now()}`,
      sceneNumber: index + 2,
    };
    const copy = [...scenes];
    copy.splice(index + 1, 0, newScene);
    const reindexed = copy.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(reindexed);
    saveMediaStudioToProject({ scenes: reindexed });
  };

  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) return;
    const copy = scenes.filter((_, idx) => idx !== index);
    const reindexed = copy.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(reindexed);
    saveMediaStudioToProject({ scenes: reindexed });
  };

  const handleChangeSceneDuration = (index: number, delta: number) => {
    const updated = scenes.map((s, idx) => {
      if (idx === index) {
        const currentSec = s.durationSeconds || 5;
        const newSec = Math.max(2, Math.min(60, currentSec + delta));
        return {
          ...s,
          durationSeconds: newSec,
          timestampRange: `${newSec}s`,
        };
      }
      return s;
    });
    setScenes(updated);
    saveMediaStudioToProject({ scenes: updated });
  };

  const handleChangeTransition = (index: number, transition: SceneTransition) => {
    const updated = scenes.map((s, idx) => (idx === index ? { ...s, transition } : s));
    setScenes(updated);
    saveMediaStudioToProject({ scenes: updated });
  };

  const totalVideoDurationSeconds = scenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);

  // Active scene in preview
  const currentPreviewScene = scenes[currentScenePreviewIdx] || scenes[0];

  return (
    <div className="min-h-full p-3 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in pb-24 md:pb-8">
      {/* Studio Header & Credit Architecture Bar */}
      <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
            <Film className="w-3.5 h-3.5 text-violet-300" />
            <span>AI Media Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Production Media Assets</span>
            <span className="text-xs px-2 py-0.5 rounded bg-violet-800/50 text-violet-200 border border-violet-600/40 font-mono">
              {project.name}
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Convert your script and storyboard into high-CTR thumbnails, voiceovers, consistent scene prompts, captions, music & timeline.
          </p>
        </div>

        {/* Credits Monitor Badge */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 sm:p-4 flex flex-col gap-2 min-w-[220px]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Creator Credits
            </span>
            <span className="font-mono font-bold text-amber-300">
              {credits?.totalRemaining !== undefined ? credits.totalRemaining : 50}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-mono">
            <div className="bg-slate-950 p-1 rounded border border-slate-800">
              <span className="text-slate-500 block">TXT</span>
              <span className="text-slate-200 font-bold">{credits?.textCredits || 0}</span>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-800">
              <span className="text-slate-500 block">IMG</span>
              <span className="text-purple-300 font-bold">{credits?.imageCredits || 0}</span>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-800">
              <span className="text-slate-500 block">VOX</span>
              <span className="text-cyan-300 font-bold">{credits?.voiceCredits || 0}</span>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-800">
              <span className="text-slate-500 block">VID</span>
              <span className="text-red-300 font-bold">{credits?.videoCredits || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Warning Banner if insufficient credits */}
      {creditWarning && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{creditWarning}</span>
          </div>
          <button
            onClick={() => setCreditWarning(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Standard Error Recovery Banner (Error Handling requirement) */}
      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-white">{errorMessage}</p>
              <p className="text-[11px] text-red-300">Your script, scenes and project data remain completely safe.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {failedActionContext && (
              <button
                onClick={() => {
                  setErrorMessage(null);
                  failedActionContext();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-800/60 hover:bg-red-700/80 text-white font-bold transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => {
                setErrorMessage(null);
                setActiveStudioSection('thumbnail');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
            >
              Edit Prompt
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              Continue Manually
            </button>
          </div>
        </div>
      )}

      {/* Visual Identity Engine Pill Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Visual Consistency Identity
              </h3>
              <p className="text-[11px] text-slate-400">
                Ensures recurring characters, outfits, and environments remain 100% consistent across all scene prompts
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingVisualIdentity(!isEditingVisualIdentity)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isEditingVisualIdentity ? 'Save Identity' : 'Edit Consistency Profile'}</span>
          </button>
        </div>

        {isEditingVisualIdentity ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Character Description</label>
              <input
                type="text"
                value={visualIdentity.characterDescription}
                onChange={(e) => setVisualIdentity({ ...visualIdentity, characterDescription: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Signature Clothing</label>
              <input
                type="text"
                value={visualIdentity.clothing}
                onChange={(e) => setVisualIdentity({ ...visualIdentity, clothing: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Environment Style</label>
              <input
                type="text"
                value={visualIdentity.environmentStyle}
                onChange={(e) => setVisualIdentity({ ...visualIdentity, environmentStyle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lighting & Tone</label>
              <input
                type="text"
                value={visualIdentity.lighting}
                onChange={(e) => setVisualIdentity({ ...visualIdentity, lighting: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Art Style</label>
              <input
                type="text"
                value={visualIdentity.artStyle}
                onChange={(e) => setVisualIdentity({ ...visualIdentity, artStyle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Camera & Lens</label>
              <input
                type="text"
                value={visualIdentity.cameraStyle}
                onChange={(e) => setVisualIdentity({ ...visualIdentity, cameraStyle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              <strong className="text-slate-500 uppercase text-[9px] mr-1">Char:</strong>
              {visualIdentity.characterDescription.slice(0, 30)}...
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              <strong className="text-slate-500 uppercase text-[9px] mr-1">Outfit:</strong>
              {visualIdentity.clothing.slice(0, 24)}...
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              <strong className="text-slate-500 uppercase text-[9px] mr-1">Lighting:</strong>
              {visualIdentity.lighting.slice(0, 24)}...
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              <strong className="text-slate-500 uppercase text-[9px] mr-1">Art Style:</strong>
              {visualIdentity.artStyle.slice(0, 24)}...
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs for Media Studio */}
      <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: 'pipeline' as const, label: 'Video Pipeline', icon: Film },
          { id: 'thumbnail' as const, label: 'Thumbnail Studio', icon: ImageIcon },
          { id: 'voiceover' as const, label: 'AI Voiceover', icon: Mic },
          { id: 'scenes' as const, label: 'Scene Media', icon: Clapperboard },
          { id: 'timeline' as const, label: 'Timeline', icon: Sliders },
          { id: 'captions' as const, label: 'Auto Captions', icon: Tv },
          { id: 'music' as const, label: 'Music', icon: Music },
          { id: 'preview' as const, label: 'Final Preview', icon: Play },
        ].map((tab) => {
          const isActive = activeStudioSection === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStudioSection(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
       * 1. VIDEO PRODUCTION PIPELINE ("Create Video" Button & Pipeline Flow)
       * ========================================================================= */}
      {activeStudioSection === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-violet-400" />
                  Full Video Production Pipeline
                </h2>
                <p className="text-xs text-slate-400">
                  Track every milestone from script readiness to final preview rendering
                </p>
              </div>

              {/* Main "Create Video" Button with Expensive Video Protection Check */}
              <button
                onClick={() => setShowVideoProtectionModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-extrabold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                <span>Create Video</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pipeline Visual Stepper */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Production Pipeline Stages
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                {[
                  { name: 'Script Ready', status: !!voiceoverScript, icon: CheckCircle2 },
                  { name: 'Voiceover', status: true, icon: Mic },
                  { name: 'Scene Media', status: scenes.length > 0, icon: ImageIcon },
                  { name: 'Timeline', status: scenes.length > 0, icon: Sliders },
                  { name: 'Captions', status: captionsEnabled, icon: Tv },
                  { name: 'Music', status: musicGenre !== 'No Music', icon: Music },
                  { name: 'Final Preview', status: true, icon: Play },
                ].map((stage, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center ${
                      stage.status
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <stage.icon className={`w-4 h-4 ${stage.status ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className="font-bold text-[11px]">{stage.name}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {stage.status ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Launch Cards into Media Studio tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveStudioSection('thumbnail')}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-pink-500/40 rounded-xl cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase">
                  <ImageIcon className="w-4 h-4" />
                  Thumbnail Studio
                </div>
                <p className="text-xs text-slate-300">Generate style prompts & download HD canvas</p>
              </div>

              <div
                onClick={() => setActiveStudioSection('voiceover')}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <Mic className="w-4 h-4" />
                  Voiceover Studio
                </div>
                <p className="text-xs text-slate-300">Pacing, voice styles & browser speech preview</p>
              </div>

              <div
                onClick={() => setActiveStudioSection('scenes')}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-xl cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
                  <Clapperboard className="w-4 h-4" />
                  Scene Media Engine
                </div>
                <p className="text-xs text-slate-300">Visual prompts powered by Visual Identity</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 2. THUMBNAIL STUDIO
       * ========================================================================= */}
      {activeStudioSection === 'thumbnail' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                  Thumbnail Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Styles, prompt engineering, aspect ratio switching & real asset export
                </p>
              </div>

              {/* Estimated Credits Pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Est. Cost: <strong className="text-amber-300">{CREDIT_COSTS.image} Credits</strong>
                </span>

                <button
                  onClick={handleGenerateThumbnailPrompt}
                  disabled={isGeneratingThumbnailPrompt}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingThumbnailPrompt ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingThumbnailPrompt ? 'Engineering Prompt...' : 'Generate Thumbnail'}</span>
                </button>
              </div>
            </div>

            {/* Controls: Visual Style & Aspect Ratio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aspect Ratio Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '16:9' as const, label: '16:9 YouTube' },
                    { id: '9:16' as const, label: '9:16 Shorts/Reels' },
                    { id: '1:1' as const, label: '1:1 Social Post' },
                  ].map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setThumbnailAspectRatio(ar.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                        thumbnailAspectRatio === ar.id
                          ? 'bg-pink-600/30 text-pink-300 border-pink-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Styles */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Visual Style
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Clean', 'Colorful', 'Cinematic', 'Cartoon', 'Educational', 'Kids', 'Professional'] as ThumbnailStyleOption[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setThumbnailStyle(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          thumbnailStyle === st
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Live Canvas Preview + Production Prompt Display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Canvas Preview Area */}
              <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">Live Preview ({thumbnailAspectRatio})</span>
                  <button
                    onClick={() => {
                      const canvas = thumbnailCanvasRef.current;
                      if (!canvas) return;
                      const a = document.createElement('a');
                      a.href = canvas.toDataURL('image/png');
                      a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_thumbnail.png`;
                      a.click();
                    }}
                    className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PNG</span>
                  </button>
                </div>

                <canvas
                  ref={thumbnailCanvasRef}
                  className="max-w-full rounded-lg shadow-xl border border-slate-800 object-contain max-h-[300px]"
                />

                <input
                  type="text"
                  value={thumbnailShortText}
                  onChange={(e) => setThumbnailShortText(e.target.value)}
                  placeholder="3-word bold headline..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white text-center font-bold"
                />
              </div>

              {/* Prompt Editor & Copy Area */}
              <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    Production-Ready Thumbnail Prompt
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingThumbnailPrompt(!isEditingThumbnailPrompt)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingThumbnailPrompt ? 'Done' : 'Edit Prompt'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(thumbnailPrompt, 'thumb-prompt')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"
                    >
                      {copiedKey === 'thumb-prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'thumb-prompt' ? 'Copied!' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                </div>

                {isEditingThumbnailPrompt ? (
                  <textarea
                    rows={5}
                    value={thumbnailPrompt}
                    onChange={(e) => setThumbnailPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-pink-500"
                  />
                ) : (
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {thumbnailPrompt}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  💡 <strong>Neural Generation Status:</strong> Direct image generator integration requires API tokens. The production-ready prompt above is optimized for Midjourney v6, Imagen 3, or FLUX.1.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 3. AI VOICEOVER STUDIO
       * ========================================================================= */}
      {activeStudioSection === 'voiceover' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-cyan-400" />
                  AI Voiceover Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Voice personas, speaking styles, speech rate and real-time audio playback
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Est. Cost: <strong className="text-amber-300">{CREDIT_COSTS.voice} Credits</strong>
                </span>

                <button
                  onClick={handleToggleVoicePreview}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                    isPlayingVoice
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isPlayingVoice ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingVoice ? 'Stop Voice' : 'Preview Voiceover'}</span>
                </button>
              </div>
            </div>

            {/* Controls: Voice, Style, Speed, Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Language
                </label>
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {['English', 'Hindi', 'Spanish', 'Portuguese', 'French', 'German', 'Japanese', 'Korean', 'Arabic'].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Voice Persona
                </label>
                <select
                  value={voiceSpeaker}
                  onChange={(e) => setVoiceSpeaker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {['Alex (Natural & Clear)', 'Sarah (Upbeat Host)', 'David (Deep Cinematic)', 'Maya (Friendly Storyteller)', 'Priya (Warm & Expressive)', 'Kore (Crisp Educational)'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Speaking Style
                </label>
                <select
                  value={speakingStyle}
                  onChange={(e) => setSpeakingStyle(e.target.value as SpeakingStyle)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {(['Natural', 'Energetic', 'Friendly', 'Storytelling', 'Educational', 'Kids'] as SpeakingStyle[]).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Speech Speed ({voiceSpeed}x)
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setVoiceSpeed(spd)}
                      className={`py-2 rounded-lg text-xs font-bold border ${
                        voiceSpeed === spd
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Script Display and Editing */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  Voiceover Screenplay
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingVoiceScript(!isEditingVoiceScript)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingVoiceScript ? 'Save Script' : 'Edit Script'}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(voiceoverScript, 'voice-script')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"
                  >
                    {copiedKey === 'voice-script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'voice-script' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {isEditingVoiceScript ? (
                <textarea
                  rows={8}
                  value={voiceoverScript}
                  onChange={(e) => setVoiceoverScript(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              ) : (
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {voiceoverScript}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 4. SCENE MEDIA GENERATOR (Visual Prompts with Visual Identity)
       * ========================================================================= */}
      {activeStudioSection === 'scenes' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-purple-400" />
                  Scene Media Generator ({scenes.length} Scenes)
                </h2>
                <p className="text-xs text-slate-400">
                  Each scene prompt automatically incorporates your project's Visual Identity to prevent random character shifts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {CREDIT_COSTS.image} credits / shot
                </span>
              </div>
            </div>

            {/* Scenes Accordion List */}
            <div className="space-y-3">
              {scenes.map((scene, idx) => {
                const isExpanded = expandedSceneId === scene.id || expandedSceneId === `scene-${scene.sceneNumber}`;
                const isGeneratingThis = generatingSceneId === `scene-${scene.sceneNumber}`;

                return (
                  <div
                    key={scene.id || idx}
                    className="bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center">
                          #{scene.sceneNumber}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Scene {scene.sceneNumber} &bull; {scene.durationSeconds || 5}s
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {scene.visualDescription.slice(0, 48)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Media Status Pill */}
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                          {scene.mediaStatus || 'prompt_ready'}
                        </span>

                        {/* Regenerate Consistent Prompt Button */}
                        <button
                          onClick={() => handleGenerateConsistentScenePrompt(scene.sceneNumber)}
                          disabled={isGeneratingThis}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/40"
                        >
                          <Sparkles className={`w-3 h-3 ${isGeneratingThis ? 'animate-spin' : ''}`} />
                          <span>{isGeneratingThis ? 'Generating...' : 'Regenerate Prompt'}</span>
                        </button>

                        <button
                          onClick={() => setExpandedSceneId(isExpanded ? null : (scene.id || `scene-${scene.sceneNumber}`))}
                          className="p-1 rounded text-slate-400 hover:text-white"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Visual & Character Action</span>
                            <p className="text-slate-200">{scene.visualDescription}</p>
                            {scene.characterAction && (
                              <p className="text-cyan-300 italic pt-1">&rarr; {scene.characterAction}</p>
                            )}
                          </div>

                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Spoken Voiceover Line</span>
                            <p className="text-slate-200">"{scene.voiceover || scene.captionText || 'Dialogue cue'}"</p>
                          </div>
                        </div>

                        {/* Visual Prompt with Identity applied */}
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-purple-900/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Consistent AI Video Generation Prompt
                            </span>
                            <button
                              onClick={() => handleCopy(scene.aiVideoPrompt || scene.visualDescription, `scene-prompt-${scene.sceneNumber}`)}
                              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold"
                            >
                              {copiedKey === `scene-prompt-${scene.sceneNumber}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy Prompt</span>
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-slate-300 leading-relaxed">
                            {scene.aiVideoPrompt || scene.visualDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 5. VIDEO TIMELINE (Mobile-Friendly Sequencer)
       * ========================================================================= */}
      {activeStudioSection === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  Mobile Video Timeline ({scenes.length} Scenes &bull; {totalVideoDurationSeconds}s Total)
                </h2>
                <p className="text-xs text-slate-400">
                  Reorder shots, tweak durations, assign transitions, and edit caption hooks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-800/40">
                  Total Duration: {totalVideoDurationSeconds}s
                </span>
              </div>
            </div>

            {/* Timeline Strip */}
            <div className="space-y-3">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.id || idx}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  {/* Left: Shot badge and thumbnail preview */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                      #{scene.sceneNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                        {scene.captionText || scene.voiceover || scene.visualDescription}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Duration: {scene.durationSeconds || 5}s</span>
                        <span>&bull;</span>
                        <span>Transition: {scene.transition || 'cut'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Duration +/- & Reorder & Transition selector */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Duration Controls */}
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => handleChangeSceneDuration(idx, -1)}
                        className="text-xs font-bold px-1.5 text-slate-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-white px-1">
                        {scene.durationSeconds || 5}s
                      </span>
                      <button
                        onClick={() => handleChangeSceneDuration(idx, 1)}
                        className="text-xs font-bold px-1.5 text-slate-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    {/* Transition Selector */}
                    <select
                      value={scene.transition || 'dissolve'}
                      onChange={(e) => handleChangeTransition(idx, e.target.value as SceneTransition)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300"
                    >
                      <option value="cut">Cut</option>
                      <option value="fade">Fade</option>
                      <option value="dissolve">Dissolve</option>
                      <option value="slide">Slide</option>
                      <option value="zoom">Zoom</option>
                    </select>

                    {/* Up / Down Reorder */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveScene(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveScene(idx, 'down')}
                        disabled={idx === scenes.length - 1}
                        className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicateScene(idx)}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300"
                      title="Duplicate Scene"
                    >
                      <DuplicateIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteScene(idx)}
                      disabled={scenes.length <= 1}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 disabled:opacity-30"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 6. AUTO CAPTIONS
       * ========================================================================= */}
      {activeStudioSection === 'captions' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-yellow-400" />
                  Auto Captions Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Synchronized subtitles, viral short styles & karaoke word highlighting
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={captionsEnabled}
                    onChange={(e) => setCaptionsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 bg-slate-950 border-slate-700"
                  />
                  <span>Enable Captions Overlay</span>
                </label>
              </div>
            </div>

            {/* Caption Style Options */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['Classic', 'Bold Shorts', 'Kids', 'Minimal', 'Karaoke-style'] as CaptionStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setCaptionStyle(style)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    captionStyle === style
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Live Subtitle Style Preview Card */}
            <div className="bg-black rounded-xl p-8 border border-slate-800 text-center relative overflow-hidden">
              <div className="text-[10px] uppercase font-mono text-slate-500 mb-2">Live Subtitle Look</div>
              <div
                className="inline-block px-4 py-2 rounded-lg font-black uppercase tracking-wider"
                style={{
                  backgroundColor: captionBgColor,
                  color: captionColor,
                  fontSize: `${captionFontSize}px`,
                  boxShadow: captionStyle === 'Bold Shorts' ? '0 8px 24px rgba(0,0,0,0.8)' : 'none',
                }}
              >
                {captionStyle === 'Karaoke-style' ? (
                  <span>
                    THIS IS <span className="text-green-400 underline decoration-4">VIRAL</span> CAPTION LOOK
                  </span>
                ) : (
                  <span>"STOP SCROLLING RIGHT NOW!"</span>
                )}
              </div>
            </div>

            {/* Editable Scene Captions List */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Scene Subtitle Lines
              </span>
              {scenes.map((scene, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-xs text-yellow-400 w-12 shrink-0">#{scene.sceneNumber}</span>
                  <input
                    type="text"
                    value={scene.captionText || ''}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[idx] = { ...updated[idx], captionText: e.target.value };
                      setScenes(updated);
                    }}
                    placeholder="Enter on-screen subtitle line..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 7. BACKGROUND MUSIC
       * ========================================================================= */}
      {activeStudioSection === 'music' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-400" />
                  Background Audio & Music
                </h2>
                <p className="text-xs text-slate-400">
                  100% royalty-free mood tracks and ambient mixing volume
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">Volume: {musicVolume}%</span>
              </div>
            </div>

            {/* Genre Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Happy', 'Educational', 'Adventure', 'Cinematic', 'Calm', 'Kids', 'No Music'] as MusicGenre[]).map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setMusicGenre(genre)}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                    musicGenre === genre
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>{genre}</span>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            {musicGenre !== 'No Music' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    Background Music Volume Balance
                  </span>
                  <span className="font-mono">{musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  We automatically duck music volume by 70% during voiceover speech segments.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
       * 8. FINAL PREVIEW (Video Preview Simulation & Export Check)
       * ========================================================================= */}
      {activeStudioSection === 'preview' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-violet-400" />
                  Final Video Preview Player
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive real-time playback simulation of scenes, transitions, subtitles & audio balance
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${
                    isPlayingPreview
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingPreview ? 'Pause Preview' : 'Play Video'}</span>
                </button>

                <button
                  onClick={() => setShowVideoProtectionModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Video</span>
                </button>
              </div>
            </div>

            {/* Video Player Canvas Screen */}
            <div className="relative mx-auto rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl max-w-2xl aspect-video flex flex-col justify-between p-6">
              {/* Top Scene Marker */}
              <div className="flex items-center justify-between text-xs z-10">
                <span className="px-2.5 py-1 rounded bg-black/80 text-violet-300 font-mono border border-slate-800">
                  Scene #{currentPreviewScene?.sceneNumber} of {scenes.length}
                </span>
                <span className="px-2.5 py-1 rounded bg-black/80 text-emerald-400 font-mono border border-slate-800">
                  {currentPreviewScene?.transition?.toUpperCase() || 'CUT'}
                </span>
              </div>

              {/* Center Scene Visual Content Representation */}
              <div className="text-center space-y-2 max-w-lg mx-auto z-10">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center mx-auto mb-2">
                  <Film className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {currentPreviewScene?.visualDescription}
                </h4>
                {currentPreviewScene?.characterAction && (
                  <p className="text-xs text-cyan-300 italic">
                    Action: {currentPreviewScene.characterAction}
                  </p>
                )}
              </div>

              {/* Bottom Auto-Captions Subtitle Overlay */}
              <div className="text-center z-10">
                {captionsEnabled && currentPreviewScene?.captionText && (
                  <div
                    className="inline-block px-4 py-1.5 rounded-lg font-black uppercase tracking-wider text-xs"
                    style={{
                      backgroundColor: captionBgColor,
                      color: captionColor,
                    }}
                  >
                    "{currentPreviewScene.captionText}"
                  </div>
                )}
              </div>

              {/* Progress Bar scrubber */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className="bg-violet-500 h-1.5 transition-all duration-300"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            </div>

            {/* Video Metrics Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Duration</span>
                <span className="font-bold text-white text-sm">{totalVideoDurationSeconds} Seconds</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Voiceover Status</span>
                <span className="font-bold text-cyan-400 text-sm">Synthesized (Web Audio)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Music Mix</span>
                <span className="font-bold text-emerald-400 text-sm">{musicGenre} ({musicVolume}%)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Export Capability</span>
                <span className="font-bold text-amber-400 text-sm">Integration Required</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL: VIDEO GENERATOR INTEGRATION REQUIRED MODAL
       * ========================================================================= */}
      {showIntegrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Video Rendering: Integration Required</h3>
                <p className="text-xs text-slate-400">Direct neural video rendering requires provider credentials</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                CreatorNova AI has prepared your complete production pipeline:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Strict Visual Identity profile for consistency</li>
                <li>{scenes.length} Production scenes with AI camera prompts</li>
                <li>Audio-synced subtitle tracks & music balance</li>
              </ul>
              <p className="text-[11px] text-amber-300/90 pt-1">
                To render final .MP4 files automatically, connect an external video provider (e.g. Veo, Runway, Luma, or Sora webhook).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowIntegrationModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCopy(
                    JSON.stringify(
                      {
                        project: project.name,
                        scenes: scenes,
                        visualIdentity,
                        script: voiceoverScript,
                      },
                      null,
                      2
                    ),
                    'pipeline-json'
                  );
                  setShowIntegrationModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
              >
                Copy Render JSON Payload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expensive Video Protection Confirmation Modal */}
      <ExpensiveVideoProtectionModal
        isOpen={showVideoProtectionModal}
        onClose={() => setShowVideoProtectionModal(false)}
        onConfirm={(calc) => {
          setConfirmedVideoCalculation(calc);
          setShowIntegrationModal(true);
        }}
        projectName={project.name}
      />
    </div>
  );
};
