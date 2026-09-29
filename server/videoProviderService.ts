import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { dbManager, type VideoJobRecord, type VideoAssetRecord } from './db.ts';
import { CreditWalletService } from './creditService.ts';
import { AIUsageService } from './aiUsageService.ts';
import { calculateEstimatedVideoCost, AI_SAFETY_LIMITS } from './aiCostConfig.ts';
import cfg from '../firebase-applet-config.json' with { type: 'json' };

const execFileAsync = promisify(execFile);
const ASSETS_DIR = path.resolve(process.cwd(), 'data', 'assets');
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents`;

// Helper to convert JS object to Firestore REST fields
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

export interface VideoModelOption {
  id: string;
  name: string;
  provider: 'google-veo' | 'runway' | 'luma' | 'replicate';
  resolutions: Array<'720p' | '1080p' | '4k'>;
  aspectRatios: Array<'16:9' | '9:16' | '1:1'>;
  durations: number[]; // e.g. [5, 10]
  supportsImageToVideo: boolean;
  supportsTextToVideo: boolean;
  tier: 'standard' | 'hd' | 'cinematic';
}

export const SUPPORTED_VIDEO_MODELS: VideoModelOption[] = [
  {
    id: 'veo-3.1-lite-generate-preview',
    name: 'Google Veo 3.1 Lite (Fast)',
    provider: 'google-veo',
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16'],
    durations: [5, 10],
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    tier: 'standard',
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Google Veo 3.1 Cinematic (Ultra HQ)',
    provider: 'google-veo',
    resolutions: ['720p', '1080p', '4k'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [5, 10],
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    tier: 'cinematic',
  },
  {
    id: 'gen3_alpha',
    name: 'Runway Gen-3 Alpha',
    provider: 'runway',
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [5, 10],
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    tier: 'hd',
  },
  {
    id: 'ray-2',
    name: 'Luma Dream Machine (Ray 2)',
    provider: 'luma',
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16'],
    durations: [5],
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    tier: 'standard',
  },
  {
    id: 'minimax/video-01',
    name: 'Replicate MiniMax Video-01',
    provider: 'replicate',
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [6],
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    tier: 'hd',
  },
];

export class VideoProviderService {
  private static googleGenAIClient: GoogleGenAI | null = null;

  /**
   * Initializes or gets the shared Google GenAI instance
   */
  private static getGoogleGenAI(): GoogleGenAI | null {
    const key = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY;
    if (!key || key.trim().length < 10) return null;
    if (!this.googleGenAIClient) {
      this.googleGenAIClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'creatornova-video-studio' } },
      });
    }
    return this.googleGenAIClient;
  }

  /**
   * Checks real video provider configuration status
   */
  public static getProviderStatus(): {
    configured: boolean;
    activeProvider: string | null;
    statusText: 'Connected' | 'Video Provider Setup Required';
    availableProviders: Array<{
      id: string;
      name: string;
      configured: boolean;
      models: VideoModelOption[];
    }>;
    supportedModels: VideoModelOption[];
    supportedAspectRatios: string[];
    supportedResolutions: string[];
    supportedDurations: number[];
    message: string;
  } {
    const hasVeoKey = !!(process.env.VEO_API_KEY && process.env.VEO_API_KEY.trim().length > 10);
    // Note: Veo requires paid tier quota. If only default GEMINI_API_KEY is present without VEO_API_KEY,
    // Google Veo models require paid billing enablement.
    const hasRunwayKey = !!(process.env.RUNWAY_API_KEY && process.env.RUNWAY_API_KEY.trim().length > 10);
    const hasLumaKey = !!(process.env.LUMA_API_KEY && process.env.LUMA_API_KEY.trim().length > 10);
    const hasReplicateKey = !!(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN.trim().length > 10);

    const availableProviders = [
      {
        id: 'google-veo',
        name: 'Google Veo (Google GenAI)',
        configured: hasVeoKey,
        models: SUPPORTED_VIDEO_MODELS.filter((m) => m.provider === 'google-veo'),
      },
      {
        id: 'runway',
        name: 'RunwayML (Gen-3)',
        configured: hasRunwayKey,
        models: SUPPORTED_VIDEO_MODELS.filter((m) => m.provider === 'runway'),
      },
      {
        id: 'luma',
        name: 'Luma Dream Machine',
        configured: hasLumaKey,
        models: SUPPORTED_VIDEO_MODELS.filter((m) => m.provider === 'luma'),
      },
      {
        id: 'replicate',
        name: 'Replicate (Video Models)',
        configured: hasReplicateKey,
        models: SUPPORTED_VIDEO_MODELS.filter((m) => m.provider === 'replicate'),
      },
    ];

    const configuredProvider = availableProviders.find((p) => p.configured);
    const configured = !!configuredProvider;

    // Display options actually supported by the configured provider(s)
    let supportedModels: VideoModelOption[] = [];
    if (configured) {
      supportedModels = SUPPORTED_VIDEO_MODELS.filter((m) => {
        const prov = availableProviders.find((p) => p.id === m.provider);
        return prov?.configured;
      });
    } else {
      supportedModels = SUPPORTED_VIDEO_MODELS;
    }

    const supportedAspectRatios = Array.from(
      new Set(supportedModels.flatMap((m) => m.aspectRatios))
    );
    const supportedResolutions = Array.from(
      new Set(supportedModels.flatMap((m) => m.resolutions))
    );
    const supportedDurations = Array.from(
      new Set(supportedModels.flatMap((m) => m.durations))
    ).sort((a, b) => a - b);

    return {
      configured,
      activeProvider: configuredProvider ? configuredProvider.id : null,
      statusText: configured ? 'Connected' : 'Video Provider Setup Required',
      availableProviders,
      supportedModels,
      supportedAspectRatios: supportedAspectRatios.length ? supportedAspectRatios : ['16:9', '9:16', '1:1'],
      supportedResolutions: supportedResolutions.length ? supportedResolutions : ['720p', '1080p'],
      supportedDurations: supportedDurations.length ? supportedDurations : [5, 10],
      message: configured
        ? `Video Provider (${configuredProvider?.name}) is connected and ready for neural video generation.`
        : 'Video Provider Setup Required. Configure a supported video provider (Google Veo with paid quota via VEO_API_KEY, RUNWAY_API_KEY, LUMA_API_KEY, or REPLICATE_API_TOKEN) in your environment to enable real video generation.',
    };
  }

  /**
   * Cost Protection: Calculates estimated credit cost before generation
   */
  public static calculateCost(params: {
    provider?: string;
    model?: string;
    durationSeconds?: number;
    resolution?: '720p' | '1080p' | '4k';
    numberOfVideos?: number;
  }) {
    const modelTier: 'standard' | 'hd' | 'cinematic' =
      params.model?.includes('cinematic') || params.model?.includes('generate-preview')
        ? 'cinematic'
        : params.model?.includes('hd') || params.model?.includes('gen3')
        ? 'hd'
        : 'standard';

    return calculateEstimatedVideoCost({
      provider: params.provider || 'google-veo',
      model: modelTier,
      durationSeconds: params.durationSeconds || 5,
      resolution: params.resolution || '720p',
      numberOfVideos: params.numberOfVideos || 1,
    });
  }

  /**
   * Creates an asynchronous video generation job with full credit protection & idempotency
   */
  public static async createJob(params: {
    userId: string;
    projectId: string;
    sceneId?: string | null;
    provider?: string;
    model?: string;
    prompt: string;
    referenceImageUrl?: string | null;
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    resolution?: '720p' | '1080p' | '4k';
    authToken?: string;
    requestId?: string;
    confirmedCredits?: number;
  }): Promise<VideoJobRecord> {
    const {
      userId,
      projectId,
      sceneId = null,
      prompt,
      referenceImageUrl = null,
      authToken,
    } = params;

    if (!prompt || !prompt.trim()) {
      throw new Error('Video generation prompt is required.');
    }

    const providerStatus = this.getProviderStatus();
    const provider = params.provider || providerStatus.activeProvider || 'google-veo';
    const model =
      params.model ||
      (provider === 'google-veo' ? 'veo-3.1-lite-generate-preview' : 'gen3_alpha');
    const duration = Math.max(5, Math.min(params.duration || 5, AI_SAFETY_LIMITS.maxVideoDurationSeconds));
    const aspectRatio = params.aspectRatio || '16:9';
    const resolution = params.resolution || '720p';

    // 1. Cost calculation & validation
    const calculation = this.calculateCost({
      provider,
      model,
      durationSeconds: duration,
      resolution,
      numberOfVideos: 1,
    });
    const creditCost = calculation.totalEstimatedCredits;

    // 2. Safety limits check
    const safety = AIUsageService.checkSafetyLimits({
      userId,
      operation: 'video_generation',
      creditsToCharge: creditCost,
      videoDurationSeconds: duration,
    });
    if (!safety.allowed) {
      throw new Error(safety.error || 'Operation violates safety threshold.');
    }

    // 3. Idempotency protection: check if requestId already exists
    const requestId = params.requestId || `vreq_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const existingJobs = dbManager.listVideoJobs(userId, projectId);
    const duplicateJob = existingJobs.find(
      (j) => j.requestId === requestId && j.status !== 'Failed'
    );
    if (duplicateJob) {
      return duplicateJob;
    }

    // 4. Credit balance check
    const wallet = await CreditWalletService.getWallet(userId, authToken);
    if (wallet.creditBalance < creditCost) {
      const err: any = new Error(
        `INSUFFICIENT_CREDITS: Required ${creditCost} credits, available ${wallet.creditBalance}.`
      );
      err.status = 402;
      err.code = 'INSUFFICIENT_CREDITS';
      throw err;
    }

    const jobId = `vjob_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    // 5. If NO video provider is configured, do NOT create fake videos.
    // Record job as Failed with clear explanation and do NOT charge credits.
    if (!providerStatus.configured) {
      const failedJob: VideoJobRecord = {
        id: jobId,
        userId,
        projectId,
        sceneId,
        provider,
        model,
        prompt,
        referenceImageUrl,
        duration,
        aspectRatio,
        resolution,
        status: 'Failed',
        creditsCharged: 0,
        requestId,
        errorMessage:
          'Video Provider Setup Required. A supported video provider (Google Veo with paid quota via VEO_API_KEY, RunwayML, Luma, or Replicate) must be configured in your cloud environment.',
        createdAt: now,
        updatedAt: now,
      };

      dbManager.createVideoJob(failedJob);

      // Record failed usage with 0 credits charged
      dbManager.recordAIUsage({
        id: `usage_${jobId}`,
        userId,
        projectId,
        operation: 'video_generation',
        provider,
        model,
        creditsCharged: 0,
        estimatedProviderCost: null,
        status: 'failed',
        requestId,
        createdAt: now,
        errorMessage: failedJob.errorMessage || 'Video Provider Setup Required',
      });

      const err: any = new Error(failedJob.errorMessage || 'Video Provider Setup Required');
      err.status = 503;
      err.code = 'VIDEO_PROVIDER_SETUP_REQUIRED';
      err.job = failedJob;
      throw err;
    }

    // 6. Provider is configured! Atomically reserve/debit credits before generation
    let debitSuccess = false;
    try {
      await CreditWalletService.debitCreditsAtomic({
        userId,
        cost: creditCost,
        operation: 'video_generation',
        projectId,
        authToken,
      });
      debitSuccess = true;
    } catch (debitErr: any) {
      const err: any = new Error(debitErr?.message || 'Failed debiting wallet credits');
      err.status = 402;
      err.code = 'INSUFFICIENT_CREDITS';
      throw err;
    }

    // 7. Persist initial Queued job
    const newJob: VideoJobRecord = {
      id: jobId,
      userId,
      projectId,
      sceneId,
      provider,
      model,
      prompt,
      referenceImageUrl,
      duration,
      aspectRatio,
      resolution,
      status: 'Queued',
      creditsCharged: creditCost,
      creditsReserved: creditCost,
      requestId,
      createdAt: now,
      updatedAt: now,
    };
    dbManager.createVideoJob(newJob);

    // Sync job to Firestore if user is authenticated
    if (authToken) {
      this.syncJobToFirestore(newJob, authToken).catch((e) =>
        console.warn('Firestore video job sync notice:', e)
      );
    }

    // 8. Trigger real asynchronous generation job in background
    this.executeAsyncJob(newJob, authToken).catch((bgErr) => {
      console.error(`Async video generation job error for ${jobId}:`, bgErr);
    });

    return newJob;
  }

  /**
   * Background processor for long-running video generation jobs
   */
  private static async executeAsyncJob(job: VideoJobRecord, authToken?: string): Promise<void> {
    dbManager.updateVideoJob(job.id, { status: 'Generating' });

    try {
      if (job.provider === 'google-veo') {
        await this.executeGoogleVeoGeneration(job, authToken);
      } else if (job.provider === 'runway') {
        await this.executeRunwayGeneration(job, authToken);
      } else if (job.provider === 'luma') {
        await this.executeLumaGeneration(job, authToken);
      } else if (job.provider === 'replicate') {
        await this.executeReplicateGeneration(job, authToken);
      } else {
        throw new Error(`Unsupported video provider: ${job.provider}`);
      }
    } catch (execErr: any) {
      const errorMsg = execErr?.message || 'Video generation failed';
      console.error(`Video job ${job.id} failed:`, errorMsg);

      // Safe credit refund on provider failure!
      if (job.creditsCharged > 0) {
        try {
          await CreditWalletService.refundCreditsAtomic({
            userId: job.userId,
            amount: job.creditsCharged,
            operation: 'video_generation_failure_refund',
            projectId: job.projectId,
            reason: errorMsg,
            authToken,
          });
        } catch (refundErr) {
          console.error(`Failed to refund credits for job ${job.id}:`, refundErr);
        }
      }

      // Record failed usage
      dbManager.recordAIUsage({
        id: `usage_${job.id}`,
        userId: job.userId,
        projectId: job.projectId,
        operation: 'video_generation',
        provider: job.provider,
        model: job.model,
        creditsCharged: 0,
        estimatedProviderCost: null,
        status: 'failed',
        requestId: job.requestId,
        createdAt: new Date().toISOString(),
        errorMessage: errorMsg,
      });

      // Update job status to Failed
      const failedJob = dbManager.updateVideoJob(job.id, {
        status: 'Failed',
        errorMessage: errorMsg,
        creditsCharged: 0,
      });

      if (authToken && failedJob) {
        this.syncJobToFirestore(failedJob, authToken).catch(() => {});
      }
    }
  }

  /**
   * Executes Google Veo video generation via @google/genai SDK
   */
  private static async executeGoogleVeoGeneration(
    job: VideoJobRecord,
    authToken?: string
  ): Promise<void> {
    const ai = this.getGoogleGenAI();
    if (!ai) {
      throw new Error('Google Veo provider key is not configured.');
    }

    const apiKey = process.env.VEO_API_KEY || process.env.GEMINI_API_KEY!;
    const generateOptions: any = {
      model: job.model || 'veo-3.1-lite-generate-preview',
      prompt: job.prompt,
      config: {
        numberOfVideos: 1,
        resolution: job.resolution === '4k' ? '1080p' : job.resolution,
        aspectRatio: job.aspectRatio === '1:1' ? '16:9' : job.aspectRatio,
      },
    };

    // If starting image is provided for Image-to-Video
    if (job.referenceImageUrl && job.referenceImageUrl.startsWith('data:image')) {
      const parts = job.referenceImageUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      generateOptions.image = {
        imageBytes: parts[1],
        mimeType: mime,
      };
    }

    // Step 1: Start operation
    const operation = await ai.models.generateVideos(generateOptions);
    if (!operation?.name) {
      throw new Error('Provider did not return an operation ID for video generation.');
    }

    dbManager.updateVideoJob(job.id, {
      operationName: operation.name,
      status: 'Generating',
    });

    // Step 2: Poll operation status
    let isDone = false;
    let completedOp: any = null;
    let pollCount = 0;
    const maxPolls = 120; // up to 10 minutes (polling every 5 seconds)

    while (!isDone && pollCount < maxPolls) {
      pollCount++;
      await new Promise((res) => setTimeout(res, 5000));

      const op = new GenerateVideosOperation();
      op.name = operation.name;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      if (updated.done) {
        isDone = true;
        completedOp = updated;
      } else if (updated.error) {
        const errObj = updated.error as any;
        const msg = typeof errObj === 'string' ? errObj : errObj?.message || JSON.stringify(errObj);
        throw new Error(msg || 'Veo generation returned an operation error.');
      }
    }

    if (!isDone || !completedOp) {
      throw new Error('Video generation operation timed out waiting for provider.');
    }

    const downloadUri = completedOp.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadUri) {
      throw new Error('Provider marked job as complete but returned no video URI.');
    }

    // Step 3: Fetch video bytes securely from downloadUri with x-goog-api-key
    const videoRes = await fetch(downloadUri, {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!videoRes.ok) {
      throw new Error(`Failed to download video file from provider (HTTP ${videoRes.status}).`);
    }

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    if (videoBuffer.length === 0) {
      throw new Error('Downloaded video stream is empty.');
    }

    // Step 4: Persist video file into secure project asset storage
    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }
    const assetId = `vasset_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const storagePath = path.join(ASSETS_DIR, `${assetId}.mp4`);
    fs.writeFileSync(storagePath, videoBuffer);

    const videoUrl = `/api/video-assets/${assetId}`;

    // Step 5: Create VideoAssetRecord
    const assetRecord: VideoAssetRecord = {
      id: assetId,
      userId: job.userId,
      projectId: job.projectId,
      sceneId: job.sceneId,
      jobId: job.id,
      provider: job.provider,
      model: job.model,
      prompt: job.prompt,
      duration: job.duration,
      aspectRatio: job.aspectRatio,
      resolution: job.resolution,
      status: 'completed',
      storagePath,
      videoUrl,
      creditsCharged: job.creditsCharged,
      requestId: job.requestId,
      createdAt: new Date().toISOString(),
    };
    dbManager.createVideoAsset(assetRecord);

    // Step 6: Mark job as Completed
    const completedJob = dbManager.updateVideoJob(job.id, {
      status: 'Completed',
      storagePath,
      videoUrl,
      completedAt: new Date().toISOString(),
    });

    // Step 7: Record successful AI usage
    AIUsageService.startUsageRecord({
      userId: job.userId,
      projectId: job.projectId,
      operation: 'video_generation',
      creditsCharged: job.creditsCharged,
    });

    // Step 8: Attach completed clip directly to scene in project
    this.attachAssetToProjectScene(job.projectId, job.sceneId, assetRecord, job.userId);

    // Step 9: Sync asset & job to Firestore if authenticated
    if (authToken && completedJob) {
      this.syncAssetToFirestore(assetRecord, authToken).catch((e) =>
        console.warn('Firestore video asset sync notice:', e)
      );
      this.syncJobToFirestore(completedJob, authToken).catch((e) =>
        console.warn('Firestore video job sync notice:', e)
      );
    }
  }

  /**
   * Executes RunwayML generation
   */
  private static async executeRunwayGeneration(job: VideoJobRecord, authToken?: string): Promise<void> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error('RunwayML API key is not configured in the environment.');

    const promptText = job.prompt;
    const body: any = {
      promptText,
      model: 'gen3a_turbo',
      duration: job.duration >= 10 ? 10 : 5,
      ratio: job.aspectRatio === '9:16' ? '9:16' : '16:9',
    };

    if (job.referenceImageUrl) {
      body.promptImage = job.referenceImageUrl;
    }

    const createRes = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-09-13',
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errBody = await createRes.json().catch(() => ({}));
      throw new Error(errBody.error || `Runway API error (HTTP ${createRes.status})`);
    }

    const { id: taskId } = await createRes.json();
    dbManager.updateVideoJob(job.id, { providerJobId: taskId, status: 'Generating' });

    // Poll taskId
    let isDone = false;
    let videoUrl = '';
    let pollCount = 0;
    while (!isDone && pollCount < 120) {
      pollCount++;
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-09-13',
        },
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === 'SUCCEEDED') {
          isDone = true;
          videoUrl = statusData.output?.[0] || '';
        } else if (statusData.status === 'FAILED') {
          throw new Error(statusData.failure || 'Runway task failed.');
        }
      }
    }

    if (!videoUrl) throw new Error('Runway generation timed out.');

    await this.downloadAndPersistVideo(job, videoUrl, authToken);
  }

  /**
   * Executes Luma Dream Machine generation
   */
  private static async executeLumaGeneration(job: VideoJobRecord, authToken?: string): Promise<void> {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error('Luma API key is not configured in the environment.');

    const body: any = {
      prompt: job.prompt,
      aspect_ratio: job.aspectRatio === '9:16' ? '9:16' : '16:9',
    };
    if (job.referenceImageUrl) {
      body.keyframes = {
        frame0: { type: 'image', url: job.referenceImageUrl },
      };
    }

    const createRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errBody = await createRes.json().catch(() => ({}));
      throw new Error(errBody.error || `Luma API error (HTTP ${createRes.status})`);
    }

    const { id: genId } = await createRes.json();
    dbManager.updateVideoJob(job.id, { providerJobId: genId, status: 'Generating' });

    let isDone = false;
    let videoUrl = '';
    let pollCount = 0;
    while (!isDone && pollCount < 120) {
      pollCount++;
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${genId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.state === 'completed') {
          isDone = true;
          videoUrl = data.assets?.video;
        } else if (data.state === 'failed') {
          throw new Error(data.failure_reason || 'Luma generation failed.');
        }
      }
    }

    if (!videoUrl) throw new Error('Luma generation timed out.');

    await this.downloadAndPersistVideo(job, videoUrl, authToken);
  }

  /**
   * Executes Replicate video generation
   */
  private static async executeReplicateGeneration(job: VideoJobRecord, authToken?: string): Promise<void> {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) throw new Error('Replicate API token is not configured in the environment.');

    const modelVersion =
      job.model === 'kwaivgi/kling-v1'
        ? 'kwaivgi/kling-v1'
        : 'minimax/video-01';

    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          prompt: job.prompt,
          aspect_ratio: job.aspectRatio,
        },
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.json().catch(() => ({}));
      throw new Error(errBody.detail || `Replicate API error (HTTP ${createRes.status})`);
    }

    const { id: predId } = await createRes.json();
    dbManager.updateVideoJob(job.id, { providerJobId: predId, status: 'Generating' });

    let isDone = false;
    let videoUrl = '';
    let pollCount = 0;
    while (!isDone && pollCount < 120) {
      pollCount++;
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
        headers: { Authorization: `Token ${apiToken}` },
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.status === 'succeeded') {
          isDone = true;
          videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        } else if (data.status === 'failed' || data.status === 'canceled') {
          throw new Error(data.error || 'Replicate prediction failed.');
        }
      }
    }

    if (!videoUrl) throw new Error('Replicate generation timed out.');

    await this.downloadAndPersistVideo(job, videoUrl, authToken);
  }

  /**
   * Helper to download video from external URL and persist into project asset storage
   */
  private static async downloadAndPersistVideo(
    job: VideoJobRecord,
    externalUrl: string,
    authToken?: string
  ): Promise<void> {
    const res = await fetch(externalUrl);
    if (!res.ok) throw new Error(`Failed to download completed video from provider (${res.status})`);

    const videoBuffer = Buffer.from(await res.arrayBuffer());
    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    const assetId = `vasset_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const storagePath = path.join(ASSETS_DIR, `${assetId}.mp4`);
    fs.writeFileSync(storagePath, videoBuffer);

    const videoUrl = `/api/video-assets/${assetId}`;

    const assetRecord: VideoAssetRecord = {
      id: assetId,
      userId: job.userId,
      projectId: job.projectId,
      sceneId: job.sceneId,
      jobId: job.id,
      provider: job.provider,
      model: job.model,
      prompt: job.prompt,
      duration: job.duration,
      aspectRatio: job.aspectRatio,
      resolution: job.resolution,
      status: 'completed',
      storagePath,
      videoUrl,
      creditsCharged: job.creditsCharged,
      requestId: job.requestId,
      createdAt: new Date().toISOString(),
    };
    dbManager.createVideoAsset(assetRecord);

    const completedJob = dbManager.updateVideoJob(job.id, {
      status: 'Completed',
      storagePath,
      videoUrl,
      completedAt: new Date().toISOString(),
    });

    AIUsageService.startUsageRecord({
      userId: job.userId,
      projectId: job.projectId,
      operation: 'video_generation',
      creditsCharged: job.creditsCharged,
    });

    this.attachAssetToProjectScene(job.projectId, job.sceneId, assetRecord, job.userId);

    if (authToken && completedJob) {
      this.syncAssetToFirestore(assetRecord, authToken).catch(() => {});
      this.syncJobToFirestore(completedJob, authToken).catch(() => {});
    }
  }

  /**
   * Attaches the generated video clip directly to the scene inside the project
   */
  private static attachAssetToProjectScene(
    projectId: string,
    sceneId: string | null | undefined,
    asset: VideoAssetRecord,
    userId: string
  ): void {
    if (!projectId) return;
    try {
      const proj = dbManager.getUserProjectById(projectId, userId);
      if (!proj) return;

      let sceneUpdated = false;
      const scenes = Array.isArray(proj.scenes) ? proj.scenes : [];

      const updatedScenes = scenes.map((s: any) => {
        if (sceneId ? s.id === sceneId : !sceneUpdated) {
          sceneUpdated = true;
          return {
            ...s,
            mediaType: 'video',
            mediaUrl: asset.videoUrl,
            mediaStatus: 'generated',
            videoMetadata: {
              jobId: asset.jobId,
              assetId: asset.id,
              provider: asset.provider,
              model: asset.model,
              prompt: asset.prompt,
              duration: asset.duration,
              aspectRatio: asset.aspectRatio,
              resolution: asset.resolution,
              creditsCharged: asset.creditsCharged,
              requestId: asset.requestId,
              createdAt: asset.createdAt,
              storagePath: asset.storagePath,
            },
          };
        }
        return s;
      });

      proj.scenes = updatedScenes;
      if (proj.mediaStudio) {
        proj.mediaStudio.scenes = updatedScenes;
      }
      proj.updatedAt = new Date().toISOString();
      dbManager.saveUserProject(proj, userId);
    } catch (err) {
      console.warn('Error attaching video asset to project scene:', err);
    }
  }

  /**
   * Syncs Video Job metadata to Firestore under users/{userId}/videoJobs/{jobId}
   */
  private static async syncJobToFirestore(job: VideoJobRecord, authToken: string): Promise<void> {
    try {
      const url = `${FIRESTORE_BASE_URL}/users/${job.userId}/videoJobs/${job.id}`;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fields: toFirestoreFields(job),
        }),
      });
    } catch (e) {
      // continue
    }
  }

  /**
   * Syncs Video Asset metadata to Firestore under users/{userId}/videoAssets/{assetId}
   */
  private static async syncAssetToFirestore(asset: VideoAssetRecord, authToken: string): Promise<void> {
    try {
      const url = `${FIRESTORE_BASE_URL}/users/${asset.userId}/videoAssets/${asset.id}`;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fields: toFirestoreFields(asset),
        }),
      });
    } catch (e) {
      // continue
    }
  }

  /**
   * Concatenates completed scene videos into a full project video using ffmpeg
   * If any scene is missing genuine completed video files, strictly returns "Video Rendering Integration Required"
   */
  public static async exportProjectVideo(
    projectId: string,
    userId: string
  ): Promise<{
    success: boolean;
    status: 'Ready' | 'Video Rendering Integration Required';
    exportedVideoUrl?: string;
    message: string;
    completedScenesCount?: number;
    totalScenesCount?: number;
  }> {
    const project = dbManager.getUserProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found');
    }

    const scenes = Array.isArray(project.scenes) ? project.scenes : [];
    if (scenes.length === 0) {
      return {
        success: false,
        status: 'Video Rendering Integration Required',
        message: 'No scenes found in this project. Please generate storyboard scenes first.',
        completedScenesCount: 0,
        totalScenesCount: 0,
      };
    }

    // Check which scenes have genuine on-disk video assets
    const validVideoFiles: string[] = [];
    for (const scene of scenes) {
      if (scene.videoMetadata?.storagePath && fs.existsSync(scene.videoMetadata.storagePath)) {
        validVideoFiles.push(scene.videoMetadata.storagePath);
      } else if (scene.mediaUrl && scene.mediaUrl.startsWith('/api/video-assets/')) {
        const assetId = scene.mediaUrl.replace('/api/video-assets/', '').trim();
        const asset = dbManager.getVideoAsset(assetId, userId);
        if (asset?.storagePath && fs.existsSync(asset.storagePath)) {
          validVideoFiles.push(asset.storagePath);
        }
      }
    }

    // If not all scenes have genuine video files:
    if (validVideoFiles.length < scenes.length) {
      return {
        success: false,
        status: 'Video Rendering Integration Required',
        message: `Video Rendering Integration Required. ${validVideoFiles.length} of ${scenes.length} scenes have generated video clips. Generate clips for all scenes to render the complete project video.`,
        completedScenesCount: validVideoFiles.length,
        totalScenesCount: scenes.length,
      };
    }

    // All scenes have genuine video files! Genuinely merge with ffmpeg
    try {
      const exportId = `export_${projectId}_${Date.now()}`;
      const concatListPath = path.join(ASSETS_DIR, `${exportId}_list.txt`);
      const outputVideoPath = path.join(ASSETS_DIR, `${exportId}.mp4`);

      // Write concat demuxer file
      const listContent = validVideoFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
      fs.writeFileSync(concatListPath, listContent);

      // Run ffmpeg concatenation
      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-c',
        'copy',
        outputVideoPath,
      ]);

      // Cleanup concat list
      try {
        fs.unlinkSync(concatListPath);
      } catch (e) {
        // continue
      }

      const assetId = `vasset_full_${exportId}`;
      const assetRecord: VideoAssetRecord = {
        id: assetId,
        userId,
        projectId,
        sceneId: null,
        jobId: `job_${exportId}`,
        provider: 'ffmpeg_concat',
        model: 'multiscene_render',
        prompt: `Full project video for "${project.name}" (${scenes.length} scenes)`,
        duration: scenes.reduce((sum: number, s: any) => sum + (s.durationSeconds || 5), 0),
        aspectRatio: project.format === 'youtube_short' ? '9:16' : '16:9',
        resolution: '1080p',
        status: 'completed',
        storagePath: outputVideoPath,
        videoUrl: `/api/video-assets/${assetId}`,
        creditsCharged: 0,
        requestId: `req_${exportId}`,
        createdAt: new Date().toISOString(),
      };
      dbManager.createVideoAsset(assetRecord);

      // Update project with rendered video URL
      project.renderedVideoUrl = assetRecord.videoUrl;
      if (project.mediaStudio) {
        project.mediaStudio.renderedVideoUrl = assetRecord.videoUrl;
      }
      dbManager.saveUserProject(project, userId);

      return {
        success: true,
        status: 'Ready',
        exportedVideoUrl: assetRecord.videoUrl,
        message: 'Project video clips successfully concatenated into master production video.',
        completedScenesCount: validVideoFiles.length,
        totalScenesCount: scenes.length,
      };
    } catch (ffmpegErr: any) {
      console.error('FFmpeg export error:', ffmpegErr);
      return {
        success: false,
        status: 'Video Rendering Integration Required',
        message: 'Video Rendering Integration Required. Failed to encode media stream with local renderer.',
        completedScenesCount: validVideoFiles.length,
        totalScenesCount: scenes.length,
      };
    }
  }

  /**
   * One-time low-cost provider test as required by specification:
   * Prompt: "A friendly cartoon robot exploring a colorful futuristic city, smooth gentle camera movement."
   */
  public static async runTest(): Promise<{
    status: 'PASS' | 'FAIL' | 'PROVIDER REQUIRED';
    message: string;
    details?: any;
  }> {
    const status = this.getProviderStatus();
    if (!status.configured) {
      return {
        status: 'PROVIDER REQUIRED',
        message: 'No video provider credentials configured in environment. PROVIDER REQUIRED.',
      };
    }

    try {
      const ai = this.getGoogleGenAI();
      if (status.activeProvider === 'google-veo' && ai) {
        const op = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt:
            'A friendly cartoon robot exploring a colorful futuristic city, smooth gentle camera movement.',
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
          },
        });
        return {
          status: 'PASS',
          message: 'Veo video generation initialized successfully.',
          details: { operationName: op?.name },
        };
      }
      return {
        status: 'PROVIDER REQUIRED',
        message: 'Configured provider requires live verification.',
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        return {
          status: 'PROVIDER REQUIRED',
          message: 'Video provider quota exceeded / paid billing tier required. PROVIDER REQUIRED.',
          details: { error: msg },
        };
      }
      return {
        status: 'FAIL',
        message: `Video test failed: ${msg}`,
        details: { error: msg },
      };
    }
  }
}
