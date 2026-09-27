import React, { useState, useEffect } from 'react';
import {
  Video,
  Film,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sliders,
  Play,
  RotateCcw,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Coins,
  Cpu,
  RefreshCw,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { Project, SceneItem, VideoJob, VideoProviderStatus } from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface VideoStudioViewProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  selectedSceneId?: string | null;
  onNavigateToTab?: (tab: string) => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  project,
  onUpdateProject,
  selectedSceneId = null,
  onNavigateToTab,
}) => {
  const { user, credits, refreshCredits, openInsufficientCreditModal } = useAuth();

  // Mode: scene_to_video, text_to_video, image_to_video
  const [generationMode, setGenerationMode] = useState<'scene' | 'text' | 'image'>(
    selectedSceneId ? 'scene' : 'scene'
  );

  // Selected Scene
  const [activeSceneId, setActiveSceneId] = useState<string>(
    selectedSceneId || (project.scenes?.[0]?.id ?? '')
  );

  // Video Settings
  const [prompt, setPrompt] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('720p');
  const [selectedModel, setSelectedModel] = useState<string>('veo-3.1-lite-generate-preview');

  // Provider Status
  const [providerStatus, setProviderStatus] = useState<VideoProviderStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Cost Protection calculation
  const [costCalculation, setCostCalculation] = useState<any>({
    totalEstimatedCredits: 15,
    baseCredits: 15,
    blockCredits: 0,
    resolutionMultiplier: 1.0,
    modelMultiplier: 1.0,
  });
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  // Jobs state
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // One-time verification test state
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Fetch provider status
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await studioApi.video.getProviderStatus();
      setProviderStatus(res);
      if (res.supportedModels?.length > 0) {
        setSelectedModel(res.supportedModels[0].id);
      }
      if (res.supportedAspectRatios?.length > 0 && !res.supportedAspectRatios.includes(aspectRatio)) {
        setAspectRatio(res.supportedAspectRatios[0] as any);
      }
      if (res.supportedResolutions?.length > 0 && !res.supportedResolutions.includes(resolution)) {
        setResolution(res.supportedResolutions[0] as any);
      }
      if (res.supportedDurations?.length > 0 && !res.supportedDurations.includes(duration)) {
        setDuration(res.supportedDurations[0]);
      }
    } catch (err) {
      console.warn('Failed fetching video provider status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Fetch user's jobs for this project
  const fetchJobs = async () => {
    try {
      const res = await studioApi.video.listJobs(project.id);
      if (res.jobs) {
        setJobs(res.jobs);
        // Find if any job is currently generating or queued
        const pending = res.jobs.find((j: any) => j.status === 'Generating' || j.status === 'Queued');
        if (pending) {
          setActiveJobId(pending.id);
        }
      }
    } catch (err) {
      // continue
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchJobs();
  }, [project.id]);

  // Sync prompt when scene changes
  const activeScene = project.scenes?.find((s) => s.id === activeSceneId) || project.scenes?.[0];
  useEffect(() => {
    if (generationMode === 'scene' && activeScene) {
      const visualContinuity = project.mediaStudio?.visualIdentity?.characterDescription
        ? ` Character: ${project.mediaStudio.visualIdentity.characterDescription}. Attire: ${project.mediaStudio.visualIdentity.clothing || 'consistent clothing'}.`
        : '';
      const scenePrompt =
        activeScene.aiVideoPrompt ||
        `${activeScene.visualDescription || project.topic}.${visualContinuity} Cinematic ${activeScene.shotType || 'shot'}, ${activeScene.cameraAngle || 'eye-level'} angle. Smooth camera motion, high detail photorealism.`;
      setPrompt(scenePrompt);

      // Auto-set aspect ratio based on project format
      if (project.format === 'youtube_short' || project.format === 'tiktok' || project.format === 'instagram_reel') {
        setAspectRatio('9:16');
      } else {
        setAspectRatio('16:9');
      }

      if (activeScene.durationSeconds) {
        setDuration(activeScene.durationSeconds <= 5 ? 5 : 10);
      }
    }
  }, [activeSceneId, generationMode, project]);

  // Recalculate cost dynamically whenever settings change
  useEffect(() => {
    setIsCalculatingCost(true);
    studioApi.video
      .calculateCost({
        provider: providerStatus?.activeProvider || 'google-veo',
        model: selectedModel,
        durationSeconds: duration,
        resolution,
        numberOfVideos: 1,
      })
      .then((calc) => {
        setCostCalculation(calc);
      })
      .catch((e) => console.warn('Cost calc warning:', e))
      .finally(() => setIsCalculatingCost(false));
  }, [selectedModel, duration, resolution, providerStatus?.activeProvider]);

  // Polling active generating job
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await studioApi.video.getJob(activeJobId);
        if (res.job) {
          setJobs((prev) => prev.map((j) => (j.id === activeJobId ? res.job : j)));

          if (res.job.status === 'Completed') {
            setActiveJobId(null);
            setSuccessMessage(`Video clip generated successfully! (Charged ${res.job.creditsCharged} credits)`);
            refreshCredits();
            // Refresh parent project to show newly attached video
            studioApi.projects.get(project.id).then((p) => {
              if (p?.project) onUpdateProject(p.project);
            });
          } else if (res.job.status === 'Failed') {
            setActiveJobId(null);
            setErrorMessage(res.job.errorMessage || 'Video generation failed.');
            refreshCredits();
          }
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeJobId, project.id]);

  // Trigger Video Generation Job
  const handleStartGeneration = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const requiredCost = costCalculation?.totalEstimatedCredits || 15;
    const currentBalance = credits?.totalRemaining !== undefined ? credits.totalRemaining : 50;

    if (currentBalance < requiredCost) {
      setShowConfirmModal(false);
      openInsufficientCreditModal(requiredCost);
      return;
    }

    setShowConfirmModal(false);
    setIsCreatingJob(true);

    try {
      const requestId = `vreq_${project.id}_${activeSceneId || 'freeform'}_${Date.now()}`;
      const res = await studioApi.video.createJob({
        projectId: project.id,
        sceneId: generationMode === 'scene' ? activeSceneId : null,
        provider: providerStatus?.activeProvider || 'google-veo',
        model: selectedModel,
        prompt: prompt.trim(),
        referenceImageUrl: generationMode === 'image' ? referenceImageUrl : null,
        duration,
        aspectRatio,
        resolution,
        confirmedCredits: requiredCost,
        requestId,
      });

      if (res.job) {
        setJobs((prev) => [res.job, ...prev]);
        setActiveJobId(res.job.id);
        refreshCredits();
      }
    } catch (err: any) {
      console.error('Video creation error:', err);
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        openInsufficientCreditModal(requiredCost);
        return;
      }
      setErrorMessage(
        err.message || 'Video generation failed. Please check your provider configuration.'
      );
    } finally {
      setIsCreatingJob(false);
    }
  };

  // Run the provider verification test
  const handleRunTest = async () => {
    setIsRunningTest(true);
    setTestResult(null);
    try {
      const res = await studioApi.video.runTest();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        status: 'FAIL',
        message: err.message || 'Test execution failed',
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const currentBalance = credits?.totalRemaining !== undefined ? credits.totalRemaining : 50;
  const isConfigured = providerStatus?.configured === true;

  return (
    <div className="space-y-6 text-left animate-in fade-in">
      {/* Studio Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
                <Video className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Video Studio</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {project.name}
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Turn your project storyboard scenes and creative prompts into real cinematic video clips.
            </p>
          </div>

          {/* Provider Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                isConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isConfigured ? 'Provider: Connected' : 'Video Provider Setup Required'}</span>
            </div>

            <button
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh provider status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Provider Setup Required Banner if not configured */}
        {!isConfigured && (
          <div className="p-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-600/40 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Video Provider Setup Required
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real video generation requires a supported video provider API key. CreatorNova never creates fake video URLs or mock placeholders.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Google Veo: <code>VEO_API_KEY</code> or paid <code>GEMINI_API_KEY</code>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Runway: <code>RUNWAY_API_KEY</code>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Luma: <code>LUMA_API_KEY</code>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Replicate: <code>REPLICATE_API_TOKEN</code>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-800/30 text-xs">
              <span className="text-slate-400">Verify provider status test:</span>
              <button
                onClick={handleRunTest}
                disabled={isRunningTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRunningTest ? 'Verifying Provider...' : 'Run Provider Health Check'}</span>
              </button>
            </div>

            {testResult && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      testResult.status === 'PASS'
                        ? 'text-emerald-400'
                        : testResult.status === 'PROVIDER REQUIRED'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    TEST: {testResult.status}
                  </span>
                  <span className="text-slate-400">— {testResult.message}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success / Error Messages */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Configuration Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            {/* Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Generation Architecture
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'scene', label: 'Scene → Video' },
                    { id: 'text', label: 'Text → Video' },
                    { id: 'image', label: 'Image → Video' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setGenerationMode(m.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      generationMode === m.id
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scene Selector when in Scene Mode */}
            {generationMode === 'scene' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-pink-400" />
                  <span>Target Project Scene</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {project.scenes?.map((scene) => {
                    const isSelected = activeSceneId === scene.id;
                    const hasVideo = !!scene.mediaUrl || scene.mediaType === 'video';
                    return (
                      <button
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pink-600/20 border-pink-500 text-white shadow-md shadow-pink-600/10'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>Scene #{scene.sceneNumber}</span>
                          {hasVideo && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Video clip ready" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {scene.visualDescription || scene.shotType || 'Scene action'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prompt Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Video Prompt & Visual Direction
                </label>
                {generationMode === 'scene' && (
                  <span className="text-[10px] text-slate-500">Auto-synced with scene breakdown</span>
                )}
              </div>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe cinematic subject, lighting, environment, and camera movement..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-pink-500 resize-none font-mono"
              />
            </div>

            {/* Reference Image input when in Image mode */}
            {generationMode === 'image' && (
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reference Starting Image</span>
                </label>
                <input
                  type="text"
                  placeholder="Paste image data URL or image path..."
                  value={referenceImageUrl}
                  onChange={(e) => setReferenceImageUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            )}

            {/* Parameter Controls (Aspect Ratio, Duration, Resolution) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Aspect Ratio */}
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="text-[10px] font-bold uppercase text-slate-400 block">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['16:9', '9:16', '1:1'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        aspectRatio === r
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="text-[10px] font-bold uppercase text-slate-400 block">Duration</label>
                <div className="grid grid-cols-2 gap-1">
                  {[5, 10].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        duration === d
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="text-[10px] font-bold uppercase text-slate-400 block">Resolution</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['720p', '1080p'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        resolution === res
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Video Engine Model</span>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {providerStatus?.supportedModels?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Protection Bar */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {isCalculatingCost ? '...' : `${costCalculation?.totalEstimatedCredits || 15} credits`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({duration}s sequence @ {resolution})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Balance</span>
                <span className="text-xs font-mono font-bold text-white">{currentBalance} credits</span>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isCreatingJob || !prompt.trim() || !!activeJobId}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                prompt.trim() && !activeJobId
                  ? 'bg-gradient-to-r from-violet-600 via-pink-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-pink-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {activeJobId ? 'Video Job Processing...' : 'Generate Scene Video Clip'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Active Jobs & Completed Clips Player (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Job Processing Card */}
          {activeJobId && (
            <div className="bg-gradient-to-br from-violet-950/60 to-slate-900 border border-violet-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-400 animate-ping" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Generating Video Clip
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-800/40 text-violet-300 border border-violet-600/40 font-bold">
                  Status: Generating
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Job ID:</span>
                  <span className="font-mono text-white">{activeJobId.slice(0, 14)}...</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Engine:</span>
                  <span className="text-slate-200">{selectedModel}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Target Format:</span>
                  <span className="text-slate-200">{duration}s • {resolution} • {aspectRatio}</span>
                </div>

                <div className="pt-2">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-full w-2/3 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center pt-2">
                    Neural rendering in progress. Polling status from secure provider...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Scene Video Player or Scene Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-pink-400" />
                <span>Scene #{activeScene?.sceneNumber || 1} Media Preview</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {activeScene?.mediaStatus === 'generated' ? 'Clip Ready' : 'Pending Generation'}
              </span>
            </div>

            {activeScene?.mediaUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 relative">
                  <video
                    src={activeScene.mediaUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={project.thumbnail?.previewImageUrl}
                  />
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Scene Clip Status:</span>
                    <span className="text-emerald-400 font-bold">Ready</span>
                  </div>
                  {activeScene.videoMetadata && (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Resolution / Duration:</span>
                        <span className="text-white font-mono">
                          {activeScene.videoMetadata.resolution} • {activeScene.videoMetadata.duration}s
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Credits Charged:</span>
                        <span className="text-amber-300 font-mono">
                          {activeScene.videoMetadata.creditsCharged} credits
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
                <Film className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-semibold text-slate-300">No video clip generated yet</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Select a scene and click "Generate Scene Video Clip" to render this scene with the configured video engine.
                </p>
              </div>
            )}
          </div>

          {/* Recent Video Jobs History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Video Generation Jobs ({jobs.length})
              </span>
              <button
                onClick={fetchJobs}
                className="text-slate-400 hover:text-white text-xs"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {jobs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No video jobs recorded for this project.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {job.sceneId ? `Scene Clip` : 'Prompt Video'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          job.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : job.status === 'Failed'
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : 'bg-violet-950 text-violet-300 border border-violet-500/40'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">{job.prompt}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                      <span>{job.duration}s • {job.resolution}</span>
                      <span>{job.creditsCharged} credits</span>
                    </div>

                    {job.errorMessage && (
                      <p className="text-[10px] text-red-400 pt-1 font-sans">{job.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal before charging credits */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                  <Film className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm Video Generation</h3>
                  <p className="text-xs text-slate-400">Pre-flight credit verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Model Engine:</span>
                <span className="text-white font-semibold">{selectedModel}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Duration & Resolution:</span>
                <span className="text-white font-mono">{duration}s @ {resolution}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aspect Ratio:</span>
                <span className="text-white font-mono">{aspectRatio}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2 font-bold">
                <span className="text-slate-300">Required Credits:</span>
                <span className="text-amber-300 text-sm font-mono">
                  {costCalculation?.totalEstimatedCredits || 15} credits
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                id="riskCheck"
                checked={confirmedRisk}
                onChange={(e) => setConfirmedRisk(e.target.checked)}
                className="mt-0.5 accent-pink-600 rounded cursor-pointer"
              />
              <label htmlFor="riskCheck" className="cursor-pointer leading-relaxed">
                I authorize deducting <strong>{costCalculation?.totalEstimatedCredits || 15} credits</strong> for this generation job. Credits are protected: if the provider fails, credits will be refunded safely.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartGeneration}
                disabled={!confirmedRisk}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                  confirmedRisk
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 text-white shadow-pink-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Confirm & Start Job</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
