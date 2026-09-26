export type ContentFormat = 
  | 'youtube_long'
  | 'youtube_short'
  | 'tiktok'
  | 'instagram_reel'
  | 'facebook'
  | 'podcast'
  | 'educational'
  | 'other';

export type ToneType =
  | 'engaging_energetic'
  | 'cinematic_storytelling'
  | 'humorous_witty'
  | 'educational_calm'
  | 'suspense_mystery'
  | 'playful_kids';

export type PlatformOption =
  | 'YouTube Shorts'
  | 'YouTube Long Video'
  | 'Instagram Reels'
  | 'TikTok'
  | 'Facebook'
  | 'Other';

export type ContentTypeOption =
  | 'Educational'
  | 'Kids'
  | 'Facts'
  | 'Story'
  | 'Entertainment'
  | 'Business'
  | 'Motivation'
  | 'Product/Marketing';

export type LanguageOption =
  | 'English'
  | 'Hindi'
  | 'Spanish'
  | 'Portuguese'
  | 'French'
  | 'German'
  | 'Japanese'
  | 'Korean'
  | 'Arabic'
  | 'Other';

export type VideoDurationOption =
  | '15 seconds'
  | '30 seconds'
  | '60 seconds'
  | '1–3 minutes'
  | '5–10 minutes'
  | 'Custom';

export interface IdeaItem {
  id: string;
  title: string;
  hook: string;
  viralityScore: number; // 1-100
  format: ContentFormat;
  durationEstimate: string;
  angle: string;
  targetAudience: string;
  coreTakeaway: string;
  suggestedVisualHook: string;
  retentionTip: string;
  createdAt?: string;
}

export type ScriptBeatType = 'hook' | 'intro' | 'core_beat' | 'climax' | 'outro' | 'cta';

export interface ScriptBeat {
  id: string;
  timestamp: string;
  speaker: string;
  sectionType: ScriptBeatType;
  directionCue: string; // e.g. [Energetic], [Whispering], [Dramatic Pause]
  dialogue: string;
  visualCue: string; // e.g. B-roll zoom on phone screen
  durationSec: number;
}

export interface ScriptData {
  title: string;
  format: ContentFormat;
  estimatedDuration: string;
  wordCount: number;
  hookSummary: string;
  beats: ScriptBeat[];
  rawFullText: string;
  tone: ToneType;
  callToAction: string;
  lastUpdated: string;
}

export type MediaStatus = 'pending' | 'prompt_ready' | 'generating' | 'generated' | 'integration_required' | 'failed';
export type SceneTransition = 'cut' | 'fade' | 'dissolve' | 'slide' | 'zoom';

export interface SceneItem {
  id: string;
  sceneNumber: number;
  timestampRange: string;
  shotType?: 'Extreme Wide' | 'Wide Shot' | 'Medium Shot' | 'Close Up' | 'Macro' | 'POV' | 'Screen Capture' | 'Drone Aerial' | string;
  cameraAngle?: 'Eye Level' | 'Low Angle' | 'High Angle' | 'Bird Eye' | 'Dutch Tilt' | 'Dynamic Tracking' | string;
  visualDescription: string;
  characterAction?: string;
  voiceover?: string;
  aiVideoPrompt?: string;
  audioSfx: string;
  onScreenText: string;
  lightingMood: string;
  brollKeywords: string[];
  // AI Media Studio extensions
  mediaStatus?: MediaStatus;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  transition?: SceneTransition;
  captionText?: string;
  durationSeconds?: number;
}

export interface SEOTitleVariation {
  title: string;
  score: number; // 1-100
  category: 'Curiosity Gap' | 'Listicle' | 'Emotional / Shock' | 'How-To' | 'Story Driven' | string;
  characterCount: number;
}

export interface SEOData {
  titles: SEOTitleVariation[];
  description: string;
  primaryKeywords: string[];
  longTailKeywords: string[];
  tags: string[];
  hashtags: string[];
  seoHealthScore: number;
  targetAudience: string;
  category: string;
}

export type ThumbnailStyleOption =
  | 'Clean'
  | 'Colorful'
  | 'Cinematic'
  | 'Cartoon'
  | 'Educational'
  | 'Kids'
  | 'Professional';

export type ThumbnailAspectRatio = '16:9' | '9:16' | '1:1';

export interface ThumbnailConfig {
  headline: string;
  subheadline: string;
  badgeText: string;
  templateTheme: 'vibrant_kids' | 'cosmic_dark' | 'neon_glow' | 'bold_creator' | 'minimal_clean';
  aspectRatio: ThumbnailAspectRatio | '16:9' | '9:16';
  textColor: string;
  accentColor: string;
  bgColor1: string;
  bgColor2: string;
  fontSize: number;
  showVignette: boolean;
  showGlow: boolean;
  emojis: string[];
  compositionAngle: string;
  aiConceptPrompt?: string;
  previewImageUrl?: string;
  // Enhanced fields
  thumbnailIdea?: string;
  visualComposition?: string;
  visualStyle?: ThumbnailStyleOption;
  generatedAssetUrl?: string;
}

export interface RepurposeData {
  youtubeShort: {
    hook: string;
    script: string;
    caption: string;
    hashtags: string[];
  };
  instagramReel: {
    hook: string;
    audioIdea: string;
    caption: string;
    hashtags: string[];
  };
  tiktok: {
    hook: string;
    soundTrend: string;
    caption: string;
    hashtags: string[];
  };
  facebookPost: {
    headline: string;
    text: string;
    cta: string;
  };
  youtubeCommunity: {
    postText: string;
    pollQuestion?: string;
    pollOptions?: string[];
  };
}

export interface ContentPackResult {
  projectName: string;
  topic: string;
  platform: PlatformOption;
  contentType: ContentTypeOption;
  language: LanguageOption;
  duration: VideoDurationOption;
  targetAudience: string;
  contentIdea: {
    title: string;
    concept: string;
    coreValue: string;
    targetAudience: string;
  };
  hook: {
    hookText: string;
    timing: string;
    visualAction: string;
    psychologyTrigger: string;
  };
  script: {
    rawFullText: string;
    estimatedDuration: string;
    wordCount: number;
    callToAction: string;
    beats: ScriptBeat[];
  };
  scenes: SceneItem[];
  seo: {
    titleSuggestions: string[];
    description: string;
    keywords: string[];
    hashtags: string[];
    seoScore: number;
  };
  thumbnail: {
    thumbnailIdea: string;
    shortText: string;
    visualComposition: string;
    aiImagePrompt: string;
    suggestedColors?: { bg1: string; bg2: string; accent: string };
  };
  repurposing: RepurposeData;
  createdAt: string;
}

export interface TranslationItem {
  id: string;
  targetLanguage: string;
  languageCode: string;
  mode: 'direct' | 'cultural' | 'dubbing';
  originalSnippet: string;
  translatedText: string;
  culturalNotes: string;
  speechPacingTip: string;
  translatedAt: string;
}

// -------------------------------------------------------------
// AI MEDIA STUDIO INTERFACES
// -------------------------------------------------------------

export interface VisualIdentity {
  characterDescription: string;
  clothing: string;
  colors: string[];
  environmentStyle: string;
  lighting: string;
  artStyle: string;
  cameraStyle: string;
}

export type SpeakingStyle = 'Natural' | 'Energetic' | 'Friendly' | 'Storytelling' | 'Educational' | 'Kids';

export interface VoiceoverConfig {
  language: string;
  voice: string;
  speakingStyle: SpeakingStyle;
  speed: number;
  status: 'ready' | 'synthesizing' | 'preview_available' | 'integration_required';
  scriptText: string;
  audioUrl?: string;
}

export type CaptionStyle = 'Classic' | 'Bold Shorts' | 'Kids' | 'Minimal' | 'Karaoke-style';

export interface CaptionWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface CaptionSegment {
  id: string;
  sceneNumber: number;
  text: string;
  startTime: number;
  endTime: number;
}

export interface CaptionConfig {
  style: CaptionStyle;
  fontSize: number;
  color: string;
  bgColor: string;
  enabled: boolean;
  segments: CaptionSegment[];
}

export type MusicGenre = 'Happy' | 'Educational' | 'Adventure' | 'Cinematic' | 'Calm' | 'Kids' | 'No Music';

export interface MusicConfig {
  genre: MusicGenre;
  volume: number; // 0 - 100
  trackName: string;
  licenseStatus: 'royalty_free' | 'attribution' | 'none';
  audioUrl?: string;
}

export interface MediaStudioData {
  visualIdentity: VisualIdentity;
  scenes: SceneItem[];
  voiceover: VoiceoverConfig;
  captions: CaptionConfig;
  music: MusicConfig;
  thumbnailStyle: ThumbnailStyleOption;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  thumbnailPrompt: string;
  thumbnailImageUrl?: string;
  videoPipelineStatus: {
    scriptReady: boolean;
    voiceoverReady: boolean;
    sceneMediaReady: boolean;
    timelineReady: boolean;
    captionsReady: boolean;
    musicReady: boolean;
    finalPreviewReady: boolean;
  };
  renderedVideoUrl?: string;
}

// Credits Architecture
export interface CreditBalance {
  textCredits: number;
  imageCredits: number;
  voiceCredits: number;
  videoCredits: number;
  totalRemaining: number;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  topic: string;
  format: ContentFormat;
  platform?: PlatformOption;
  contentType?: ContentTypeOption;
  language?: LanguageOption;
  duration?: VideoDurationOption | string;
  targetAudience: string;
  tone: ToneType;
  createdAt: string;
  updatedAt: string;
  ideas: IdeaItem[];
  script?: ScriptData;
  scenes: SceneItem[];
  seo?: SEOData;
  thumbnail: ThumbnailConfig;
  translations: TranslationItem[];
  contentPack?: ContentPackResult;
  mediaStudio?: MediaStudioData;
}

// -------------------------------------------------------------
// CREATORNOVA AI AGENT ARCHITECTURE
// -------------------------------------------------------------

export type AgentTaskStatus = 'Queued' | 'Working' | 'Completed' | 'Failed' | 'Needs Approval';

export interface AgentTaskItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  type:
    | 'research_topics'
    | 'create_hooks'
    | 'write_scripts'
    | 'scene_breakdowns'
    | 'visual_prompts'
    | 'seo_packs'
    | 'thumbnail_concepts'
    | 'calendar_schedule'
    | 'repurpose'
    | 'series_create'
    | 'custom';
  estimatedCredits: number;
  status: AgentTaskStatus;
}

export interface GeneratedProjectItem {
  id: string;
  dayNumber?: number;
  title: string;
  hook: string;
  scriptPreview: string;
  scenesCount: number;
  seoScore: number;
  thumbnailIdea: string;
  platform: string;
  status: 'Ready' | 'Draft';
}

export interface AgentPlan {
  id: string;
  userId?: string;
  goal: string;
  prompt: string;
  platform: PlatformOption | string;
  language: LanguageOption | string;
  numberOfVideos: number;
  estimatedOperations: number;
  estimatedCredits: number;
  expectedOutputs: string[];
  tasks: AgentTaskItem[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'cancelled';
  useBrandKit: boolean;
  selectedCharacterId?: string;
  selectedCharacterName?: string;
  generatedProjects?: GeneratedProjectItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface AgentTask {
  id: string;
  userId: string;
  planId?: string;
  projectId?: string;
  title: string;
  description: string;
  type: string;
  creditCost: number;
  status: AgentTaskStatus;
  requiresApproval?: boolean;
  resultSummary?: string;
  resultData?: any;
  error?: string;
  isAsyncBackground?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CalendarStatus = 'Idea' | 'Script Ready' | 'Media Pending' | 'Ready' | 'Published';

export interface ContentCalendarItem {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  platform: PlatformOption | string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  status: CalendarStatus;
  language: string;
  channelName?: string;
  notes?: string;
  hook?: string;
  thumbnailUrl?: string;
  externalPublishStatus?: {
    connected: boolean;
    channel?: string;
    verified: boolean;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SeriesEpisode {
  episodeNumber: number;
  title: string;
  hook: string;
  concept: string;
  projectId?: string;
  status: 'planned' | 'generated';
}

export interface Series {
  id: string;
  userId: string;
  seriesName: string;
  topic: string;
  numberOfEpisodes: number;
  platform: PlatformOption | string;
  duration: string;
  language: string;
  episodeIdeas: SeriesEpisode[];
  recurringElements: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  role: string;
  visualDescription: string;
  clothing: string;
  mainColors: string[];
  personality: string;
  voiceStyle: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentActionType =
  | 'create_plan'
  | 'generate_scripts'
  | 'prepare_scenes'
  | 'generate_seo'
  | 'add_calendar'
  | 'repurpose_project'
  | 'series_created'
  | 'character_created'
  | 'credit_deduction';

export interface AgentActivity {
  id: string;
  userId: string;
  actionType: AgentActionType;
  description: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  creditsUsed?: number;
}

export interface StrategyRecommendation {
  id: string;
  category: 'Pillar' | 'Series' | 'Variation' | 'Audience' | 'Format' | 'Repurposing';
  title: string;
  description: string;
  reason: string;
  actionPrompt: string;
  metricsImpact: string;
  priority: 'High' | 'Medium' | 'Growth';
}

