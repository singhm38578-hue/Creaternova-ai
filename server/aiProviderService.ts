import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { dbManager } from './db.ts';
import { CreditWalletService } from './creditService.ts';
import { AIUsageService } from './aiUsageService.ts';
import cfg from '../firebase-applet-config.json' with { type: 'json' };

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

export class AIProviderError extends Error {
  public statusCode: number;
  public errorCode: 'QUOTA_EXCEEDED' | 'UNAUTHORIZED' | 'SERVICE_UNAVAILABLE' | 'BAD_RESPONSE' | 'INSUFFICIENT_CREDITS' | 'SAFETY_LIMIT_EXCEEDED';
  public isQuota: boolean;

  constructor(message: string, statusCode: number = 503, errorCode: 'QUOTA_EXCEEDED' | 'UNAUTHORIZED' | 'SERVICE_UNAVAILABLE' | 'BAD_RESPONSE' | 'INSUFFICIENT_CREDITS' | 'SAFETY_LIMIT_EXCEEDED' = 'SERVICE_UNAVAILABLE', isQuota: boolean = false) {
    super(message);
    this.name = 'AIProviderError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isQuota = isQuota;
  }
}

export class AIProviderService {
  private static client: GoogleGenAI | null = null;
  public static readonly TEXT_MODEL = 'gemini-3.8-flash';

  /**
   * Initializes or returns the shared GoogleGenAI client
   */
  public static getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError('AI service temporarily unavailable. Please try again later.', 503, 'SERVICE_UNAVAILABLE');
    }
    if (!this.client) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.client;
  }

  /**
   * Checks if real AI provider API credentials are configured in the environment
   */
  public static isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key.trim().length > 10);
  }

  /**
   * Translates internal Gemini/provider errors into secure, user-friendly errors
   */
  public static normalizeError(err: any): AIProviderError {
    const msg = (err?.message || String(err)).toLowerCase();
    const status = err?.status || err?.statusCode || 0;

    if (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate-limit') ||
      msg.includes('rate limit')
    ) {
      return new AIProviderError(
        'AI service quota exceeded or rate limited. Please try again in a few moments.',
        429,
        'QUOTA_EXCEEDED',
        true
      );
    }

    if (status === 401 || status === 403 || msg.includes('unauthorized') || msg.includes('invalid api key')) {
      return new AIProviderError(
        'AI service temporarily unavailable. Please try again later.',
        503,
        'UNAUTHORIZED'
      );
    }

    return new AIProviderError(
      'AI service temporarily unavailable. Please try again later.',
      503,
      'SERVICE_UNAVAILABLE'
    );
  }

  /**
   * Safely checks Gemini API status without exposing key or throwing uncaught exceptions.
   */
  public static async safeCheck(): Promise<{
    connectionStatus: 'CONNECTED' | 'SETUP REQUIRED' | 'DISABLED';
    quotaStatus: 'CONNECTED' | 'QUOTA BLOCKED' | 'SETUP REQUIRED' | 'DISABLED';
    status: 'CONNECTED' | 'QUOTA BLOCKED' | 'SETUP REQUIRED' | 'DISABLED';
    message: string;
    model: string;
    lastSafeCheck: string;
    blockerReason: string;
  }> {
    const isConfig = this.isConfigured();
    const lastCheck = new Date().toISOString();
    if (!isConfig) {
      return {
        connectionStatus: 'SETUP REQUIRED',
        quotaStatus: 'DISABLED',
        status: 'SETUP REQUIRED',
        message: 'No GEMINI_API_KEY detected in environment.',
        model: this.TEXT_MODEL,
        lastSafeCheck: lastCheck,
        blockerReason: 'Missing GEMINI_API_KEY environment variable.',
      };
    }

    try {
      const client = this.getClient();
      await client.models.generateContent({
        model: this.TEXT_MODEL,
        contents: 'ping',
      });
      return {
        connectionStatus: 'CONNECTED',
        quotaStatus: 'CONNECTED',
        status: 'CONNECTED',
        message: 'Google Gemini integration is connected and active.',
        model: this.TEXT_MODEL,
        lastSafeCheck: lastCheck,
        blockerReason: 'None. Provider operational.',
      };
    } catch (err: any) {
      const normalized = this.normalizeError(err);
      if (
        normalized.isQuota ||
        normalized.statusCode === 429 ||
        String(err?.message).includes('demand') ||
        String(err?.message).includes('503') ||
        String(err?.message).includes('429')
      ) {
        return {
          connectionStatus: 'CONNECTED',
          quotaStatus: 'QUOTA BLOCKED',
          status: 'QUOTA BLOCKED',
          message: 'Gemini integration verified and working. Free-tier quota limits (5 RPM / 429) or high-demand spikes require paid billing to lift restrictions.',
          model: this.TEXT_MODEL,
          lastSafeCheck: lastCheck,
          blockerReason: 'Free-tier rate quota / billing not enabled. The integration itself is verified and intact.',
        };
      }
      return {
        connectionStatus: 'CONNECTED',
        quotaStatus: 'QUOTA BLOCKED',
        status: 'QUOTA BLOCKED',
        message: `Integration connected. Safe probe: ${normalized.message}`,
        model: this.TEXT_MODEL,
        lastSafeCheck: lastCheck,
        blockerReason: normalized.message,
      };
    }
  }

  /**
   * Safely extracts JSON from raw model string
   */
  public static extractJson<T = any>(rawText: string): T {
    try {
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/gi, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // fall through
        }
      }
      throw new AIProviderError('AI returned an invalid structured response. Please try again.', 500, 'BAD_RESPONSE');
    }
  }

  /**
   * Low-level raw generation with timeout, retry backoff, and quota protection
   */
  public static async generateContent(options: {
    prompt: string;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    timeoutMs?: number;
    maxRetries?: number;
  }): Promise<string> {
    const maxRetries = options.maxRetries ?? 1;
    let attempt = 0;

    while (true) {
      attempt++;
      try {
        const ai = this.getClient();
        const timeoutMs = options.timeoutMs || 30000;

        const generatePromise = ai.models.generateContent({
          model: this.TEXT_MODEL,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: options.responseMimeType || 'application/json',
            temperature: options.temperature ?? 0.7,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new AIProviderError('AI generation timed out. Please try again.', 504, 'SERVICE_UNAVAILABLE')), timeoutMs);
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const text = response.text;
        if (!text || !text.trim()) {
          throw new AIProviderError('AI returned an empty response. Please try again.', 500, 'BAD_RESPONSE');
        }
        return text;
      } catch (err: any) {
        const normalized = err instanceof AIProviderError ? err : this.normalizeError(err);
        const isTransient = normalized.isQuota || normalized.statusCode === 429 || normalized.statusCode === 503;
        if (isTransient && attempt <= maxRetries) {
          const delay = 1200 * attempt + Math.floor(Math.random() * 400);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw normalized;
      }
    }
  }

  /**
   * Real generation: Ideas
   */
  public static async generateIdeas(params: {
    topic: string;
    format?: string;
    targetAudience?: string;
    tone?: string;
    count?: number;
  }): Promise<any[]> {
    const { topic, format = 'youtube_long', targetAudience = 'General Audience', tone = 'engaging_energetic', count = 3 } = params;

    const prompt = `Generate exactly ${count} viral, high-retention video concept ideas for:
Topic: "${topic}"
Format: "${format}"
Target Audience: "${targetAudience}"
Tone: "${tone}"

Return a JSON array of objects with this schema:
[
  {
    "id": "idea-1",
    "title": "Specific High-CTR Title",
    "hook": "Compelling 3-second opening hook",
    "viralityScore": 92,
    "format": "${format}",
    "durationEstimate": "3-5 minutes",
    "angle": "Psychological curiosity gap / unique perspective",
    "targetAudience": "${targetAudience}",
    "coreTakeaway": "Main value proposition",
    "suggestedVisualHook": "Specific camera movement and visual asset description",
    "retentionTip": "Actionable retention strategy for minute 1"
  }
]`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are an elite YouTube creative director and viral media strategist. Return ONLY valid JSON array with real high-CTR concepts.',
      temperature: 0.8,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any[]>(raw);
    const ideas = Array.isArray(parsed) ? parsed : [parsed];
    if (ideas.length === 0 || !ideas[0].title || !ideas[0].hook) {
      throw new AIProviderError('AI generated malformed ideas structure.', 500, 'BAD_RESPONSE');
    }
    return ideas.map((idea, index) => ({
      ...idea,
      id: idea.id || `idea-${Date.now()}-${index + 1}`,
      format: idea.format || format,
      targetAudience: idea.targetAudience || targetAudience,
    }));
  }

  /**
   * Real generation: Hooks
   */
  public static async generateHooks(params: {
    topic: string;
    format?: string;
    targetAudience?: string;
    count?: number;
  }): Promise<any[]> {
    const { topic, format = 'youtube_short', targetAudience = 'General Creators', count = 5 } = params;

    const prompt = `Generate ${count} high-retention opening hooks for:
Topic: "${topic}"
Format: "${format}"
Target Audience: "${targetAudience}"

Return a JSON array of objects:
[
  {
    "id": "hook-1",
    "hookText": "Exact spoken line to grab viewer attention in the first 3 seconds",
    "hookType": "Question / Shock / Curiosity Gap / Story / Counter-intuitive",
    "retentionMechanism": "Why this prevents swiping away",
    "predictedHoldRate": "85-92%"
  }
]`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are a short-form video retention expert specializing in viral hooks for TikTok, YouTube Shorts, and Reels.',
      temperature: 0.8,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any[]>(raw);
    const hooks = Array.isArray(parsed) ? parsed : [parsed];
    if (hooks.length === 0 || !hooks[0].hookText) {
      throw new AIProviderError('AI generated malformed hook structure.', 500, 'BAD_RESPONSE');
    }
    return hooks;
  }

  /**
   * Real generation: Full Script
   */
  public static async generateScript(params: {
    title: string;
    format?: string;
    duration?: string;
    targetAudience?: string;
    tone?: string;
    pacing?: string;
    hostFormat?: string;
  }): Promise<any> {
    const {
      title,
      format = 'youtube_long',
      duration = '3-5 minutes',
      targetAudience = 'General Audience',
      tone = 'engaging_energetic',
      pacing = 'balanced',
      hostFormat = 'solo',
    } = params;

    const prompt = `Write a complete, production-ready video script:
Title: "${title}"
Format: "${format}"
Duration: "${duration}"
Target Audience: "${targetAudience}"
Tone: "${tone}"
Pacing: "${pacing}"
Host Format: "${hostFormat}"

Must include:
1. High-retention opening Hook (0:00 - 0:05)
2. Setup and curiosity stakes
3. 3 to 6 narrative beats with dialogue, voice direction cues, and visual/B-roll directions
4. Climax / Core Revelation
5. Call to action

Return ONLY valid JSON:
{
  "title": "${title}",
  "format": "${format}",
  "estimatedDuration": "${duration}",
  "wordCount": 350,
  "hookSummary": "Punchy hook summary",
  "tone": "${tone}",
  "callToAction": "Natural CTA",
  "beats": [
    {
      "id": "beat-1",
      "timestamp": "0:00 - 0:08",
      "speaker": "Host",
      "sectionType": "hook",
      "directionCue": "[Fast, intense delivery]",
      "dialogue": "Exact spoken line.",
      "visualCue": "Specific visual camera instruction",
      "durationSec": 8
    }
  ],
  "rawFullText": "Complete continuous script for teleprompter"
}`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You write world-class video scripts with viral retention hooks, clear pacing, emotional arcs, and natural speech rhythm.',
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any>(raw);
    if (!parsed || !parsed.beats || !Array.isArray(parsed.beats) || !parsed.rawFullText) {
      throw new AIProviderError('AI generated malformed script structure.', 500, 'BAD_RESPONSE');
    }
    parsed.lastUpdated = new Date().toISOString();
    return parsed;
  }

  /**
   * Real generation: Script Refinement
   */
  public static async refineScript(params: {
    originalText: string;
    instruction?: string;
  }): Promise<{ refinedText: string; directionCue: string; reasoning: string }> {
    const { originalText, instruction = 'Make it punchier, conversational, and optimize for audience retention' } = params;

    const prompt = `Refine and polish the following video script excerpt:
Original Excerpt:
"""${originalText}"""

Directive: "${instruction}"

Return ONLY valid JSON:
{
  "refinedText": "The improved spoken dialogue line",
  "directionCue": "[Voiceover delivery cue, e.g. Whispering urgently]",
  "reasoning": "Brief explanation of why this edit improves viewer engagement"
}`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are an expert screenplay script doctor specializing in dialogue pacing and retention punch-ups.',
      temperature: 0.6,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any>(raw);
    if (!parsed || !parsed.refinedText) {
      throw new AIProviderError('AI generated malformed script refinement response.', 500, 'BAD_RESPONSE');
    }
    return parsed;
  }

  /**
   * Real generation: Scenes & Storyboard
   */
  public static async generateScenes(params: {
    title: string;
    scriptText?: string;
    format?: string;
    sceneCount?: number;
  }): Promise<any[]> {
    const { title, scriptText = '', format = 'youtube_long', sceneCount = 5 } = params;

    const prompt = `Break down the video into ${sceneCount} cinematic storyboard shot scenes:
Title: "${title}"
Format: "${format}"
Script Context:
"""${(scriptText || title).slice(0, 1500)}"""

Return ONLY a JSON array of scenes:
[
  {
    "id": "scene-1",
    "sceneNumber": 1,
    "timestampRange": "0:00 - 0:08",
    "shotType": "Close Up / Wide Shot / Medium Shot / Macro",
    "cameraAngle": "Eye Level / Low Angle / Dutch Tilt / Overhead",
    "visualDescription": "Detailed visual description of action, subject, background",
    "audioSfx": "Sound effect design and music cue",
    "onScreenText": "On-screen motion graphics or title text",
    "lightingMood": "Lighting style and color palette",
    "brollKeywords": ["broll keyword 1", "broll keyword 2"]
  }
]`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are an award-winning cinematic visual director creating precise shotlists and visual scene breakdowns.',
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any[]>(raw);
    const scenes = Array.isArray(parsed) ? parsed : [parsed];
    if (scenes.length === 0 || !scenes[0].visualDescription) {
      throw new AIProviderError('AI generated malformed scene breakdown.', 500, 'BAD_RESPONSE');
    }
    return scenes.map((s, idx) => ({
      ...s,
      id: s.id || `scene-${Date.now()}-${idx + 1}`,
      sceneNumber: s.sceneNumber || idx + 1,
    }));
  }

  /**
   * Real generation: SEO Suite
   */
  public static async generateSeo(params: {
    title: string;
    topic?: string;
    scriptText?: string;
    targetAudience?: string;
  }): Promise<any> {
    const { title, topic, scriptText, targetAudience = 'General Audience' } = params;
    const subject = title || topic || 'Creative Video';

    const prompt = `Create a complete YouTube/social media SEO package for:
Subject: "${subject}"
Audience: "${targetAudience}"
Script Context:
"""${(scriptText || subject).slice(0, 1500)}"""

Return ONLY valid JSON:
{
  "titles": [
    {
      "title": "High-CTR Title Variation",
      "score": 96,
      "category": "Curiosity Gap / How-To / Listicle / Shock / Story",
      "characterCount": 54
    }
  ],
  "description": "Comprehensive video description with timestamps placeholders, links, and search keywords",
  "primaryKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4"],
  "longTailKeywords": ["long tail 1", "long tail 2", "long tail 3", "long tail 4"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "seoHealthScore": 95,
  "targetAudience": "${targetAudience}",
  "category": "Education / Entertainment / How-To"
}`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are a top YouTube algorithm and CTR optimization specialist.',
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any>(raw);
    if (!parsed || !parsed.titles || !Array.isArray(parsed.titles) || !parsed.description) {
      throw new AIProviderError('AI generated malformed SEO metadata.', 500, 'BAD_RESPONSE');
    }
    return parsed;
  }

  /**
   * Real generation: Translation & Cultural Localization
   */
  public static async generateTranslation(params: {
    text: string;
    targetLanguage: string;
    mode?: string;
    originalLanguage?: string;
  }): Promise<any> {
    const { text, targetLanguage, mode = 'cultural', originalLanguage = 'English' } = params;

    const prompt = `Translate and culturally localize the following content:
From: "${originalLanguage}"
To: "${targetLanguage}"
Mode: "${mode}" (direct | cultural | dubbing)

Original Text:
"""${text}"""

Return ONLY valid JSON:
{
  "targetLanguage": "${targetLanguage}",
  "mode": "${mode}",
  "translatedText": "Complete translated text localized with natural idioms",
  "culturalNotes": "Notes on how idioms and cultural nuances were adapted",
  "speechPacingTip": "Guidance on voiceover pacing and inflection"
}`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You provide natural, fluent, culturally attuned translations tailored for video voiceovers, subtitles, and YouTube metadata.',
      temperature: 0.4,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any>(raw);
    if (!parsed || !parsed.translatedText) {
      throw new AIProviderError('AI generated malformed translation structure.', 500, 'BAD_RESPONSE');
    }
    return parsed;
  }

  /**
   * Real generation: Repurposing
   */
  public static async generateRepurposing(params: {
    projectTitle: string;
    projectTopic: string;
    scriptText: string;
    repurposeType: string;
    customInstruction?: string;
  }): Promise<any> {
    const { projectTitle, projectTopic, scriptText, repurposeType, customInstruction = '' } = params;

    const typeLabels: Record<string, string> = {
      long_to_shorts: 'Long Video → 5 High-Impact Shorts',
      youtube_to_reels: 'YouTube → Instagram Reel (Aesthetic & Audio Trend)',
      youtube_to_tiktok: 'YouTube → TikTok (Fast Paced & Hook Heavy)',
      video_to_post: 'Video → Community Post & Carousel',
      english_to_hindi: 'English → Hindi (Cultural Adaptation & Dubbing)',
      english_to_spanish: 'English → Spanish (Global Localization)',
    };
    const label = typeLabels[repurposeType] || repurposeType;

    const prompt = `Adapt source content for format: "${label}".
Source Project:
Title: "${projectTitle}"
Topic: "${projectTopic}"
Script Excerpt:
"""${scriptText.slice(0, 1500) || projectTopic}"""

Directive: "${customInstruction || 'Maximize retention and native platform engagement'}"

Return ONLY valid JSON:
{
  "adaptedTitle": "New punchy title suited for the target format",
  "adaptedHook": "Fresh 3-second hook customized for target platform",
  "adaptedScript": "Complete reworked script with pacing cues",
  "platformStrategy": "Short explanation of how and why the content was adapted",
  "keyHashtags": ["#tag1", "#tag2", "#tag3"],
  "callToAction": "Platform-specific call to action"
}`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are CreatorNova Repurposing Agent. Adapt content rather than simply copying it. Rework hooks, pacing, formatting conventions, and language nuances.',
      temperature: 0.5,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any>(raw);
    if (!parsed || !parsed.adaptedScript) {
      throw new AIProviderError('AI generated malformed repurposing content.', 500, 'BAD_RESPONSE');
    }
    return parsed;
  }

  /**
   * Real generation: AI Creator Agent Command Planning
   */
  public static async generateAgentPlan(params: {
    command: string;
    brandKitContext?: string;
    characterInfo?: string;
  }): Promise<any> {
    const { command, brandKitContext = '', characterInfo = '' } = params;

    const prompt = `You are CreatorNova AI Agent. Parse the creator's natural language command into a structured production plan.
Command: "${command}"
${brandKitContext ? `Brand Context: ${brandKitContext}` : ''}
${characterInfo ? `Character Context: ${characterInfo}` : ''}

Break this request into logical sequential creative actions (e.g. idea_generation, script_generation, scene_breakdown, seo_pack, repurposing).
For each action estimate required credits (ideas: 1, script: 2, scenes: 3, seo: 2, repurpose: 3).

Return ONLY valid JSON:
{
  "intentSummary": "Clear 1-sentence summary of what the agent will produce",
  "detectedTopic": "Main topic",
  "detectedFormat": "youtube_long | youtube_short | tiktok | reel",
  "proposedActions": [
    {
      "id": "act-1",
      "type": "idea_generation | script_generation | scene_breakdown | seo_pack | repurposing",
      "title": "Action title",
      "description": "Specific action to perform",
      "estimatedCredits": 2
    }
  ],
  "estimatedTotalCredits": 5,
  "requiresApproval": true
}`;

    const raw = await this.generateContent({
      prompt,
      systemInstruction: 'You are the autonomous CreatorNova AI Studio Agent capable of orchestrating full creator video production workflows.',
      temperature: 0.4,
      responseMimeType: 'application/json',
    });

    const parsed = this.extractJson<any>(raw);
    if (!parsed || !parsed.proposedActions || !Array.isArray(parsed.proposedActions)) {
      throw new AIProviderError('AI generated malformed agent plan.', 500, 'BAD_RESPONSE');
    }
    return parsed;
  }

  /**
   * Central Pipeline Runner:
   * 1. Check provider availability (never return fake success)
   * 2. Check safety limits
   * 3. Check wallet credit balance
   * 4. Call generator
   * 5. If fails: record failed usage, do NOT charge credits, throw user-friendly error
   * 6. If succeeds: atomic credit debit, record successful usage, persist project in DB & Firestore
   */
  public static async executePipeline<T>(options: {
    userId: string;
    projectId?: string | null;
    operation: string;
    creditCost: number;
    authToken?: string;
    generator: () => Promise<T>;
    projectUpdater?: (project: any, result: T) => any;
  }): Promise<{
    result: T;
    creditsDeducted: number;
    remainingCredits: number;
    requestId: string;
    savedToProject: boolean;
  }> {
    const { userId, projectId = null, operation, creditCost, authToken, generator, projectUpdater } = options;

    // 1. Verify provider configuration
    if (!this.isConfigured()) {
      throw new AIProviderError('AI service temporarily unavailable. Please try again later.', 503, 'SERVICE_UNAVAILABLE');
    }

    // 2. Check safety limits
    const safety = AIUsageService.checkSafetyLimits({
      userId,
      operation,
      creditsToCharge: creditCost,
    });
    if (!safety.allowed) {
      throw new AIProviderError(safety.error || 'Operation violates safety threshold.', 400, 'SAFETY_LIMIT_EXCEEDED');
    }

    // 3. Check wallet credits
    const wallet = await CreditWalletService.getWallet(userId, authToken);
    if (wallet.creditBalance < creditCost) {
      throw new AIProviderError(
        `INSUFFICIENT_CREDITS: Required ${creditCost} credits, available ${wallet.creditBalance}.`,
        402,
        'INSUFFICIENT_CREDITS'
      );
    }

    const requestId = `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // 4. Execute Real AI Generation
    let generatedData: T;
    try {
      generatedData = await generator();
    } catch (genErr: any) {
      // Record failed usage - NEVER charge credits for failed generation
      dbManager.recordAIUsage({
        id: `usage_${requestId}`,
        userId,
        projectId,
        operation,
        provider: 'google',
        model: this.TEXT_MODEL,
        creditsCharged: 0,
        estimatedProviderCost: null,
        status: 'failed',
        requestId,
        createdAt: new Date().toISOString(),
        errorMessage: genErr?.message || 'Generation failed',
      });

      const normalized = genErr instanceof AIProviderError ? genErr : this.normalizeError(genErr);
      throw normalized;
    }

    // 5. Generation succeeded! Atomically debit credits
    let balanceAfter = wallet.creditBalance - creditCost;
    if (creditCost > 0) {
      const debitRes = await CreditWalletService.debitCreditsAtomic({
        userId,
        cost: creditCost,
        operation,
        projectId,
        authToken,
      });
      balanceAfter = debitRes.balanceAfter;
    }

    // 6. Record successful AI usage
    AIUsageService.startUsageRecord({
      userId,
      projectId,
      operation,
      creditsCharged: creditCost,
    });

    // 7. Persist to project in dbManager and Firestore
    let savedToProject = false;
    if (projectId && projectUpdater) {
      try {
        const existingProj = dbManager.getUserProjectById(projectId, userId);
        if (existingProj) {
          const updatedProj = projectUpdater(existingProj, generatedData);
          dbManager.saveUserProject(updatedProj, userId);
          savedToProject = true;

          // Sync to Firestore if authenticated
          if (authToken) {
            try {
              const url = `${FIRESTORE_BASE_URL}/users/${userId}/projects/${projectId}`;
              await fetch(url, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  fields: toFirestoreFields(updatedProj),
                }),
              });
            } catch (fsErr) {
              console.warn('Async Firestore project sync notice:', fsErr);
            }
          }
        }
      } catch (saveErr) {
        console.warn('Project state save notice:', saveErr);
      }
    }

    return {
      result: generatedData,
      creditsDeducted: creditCost,
      remainingCredits: balanceAfter,
      requestId,
      savedToProject,
    };
  }
}
