import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { STARTER_PROJECTS } from '../src/data/starterProjects.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'creatornova_db.json');

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  profileImage: string;
  preferredLanguage: string;
  creatorNiche: string;
  defaultPlatform: string;
  defaultContentLanguage: string;
  plan: 'free' | 'pro' | 'creator' | 'business';
  billingCycle: 'monthly' | 'yearly';
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface BrandKitRecord {
  userId: string;
  channelName: string;
  channelNiche: string;
  targetAudience: string;
  preferredLanguage: string;
  preferredVisualStyle: string;
  defaultVideoStyle: string;
  toneOfVoice: string;
  recurringCharacterDescription: string;
  preferredCta: string;
  updatedAt: string;
}

export interface CreditWalletRecord {
  userId: string;
  textCredits: number;
  imageCredits: number;
  voiceCredits: number;
  videoCredits: number;
  totalRemaining: number;
  monthlyAllocation: number;
  lastResetDate: string;
}

export interface CreditConfigRecord {
  textCost: number; // 1 credit
  scriptCost: number; // 2 credits
  seoCost: number; // 2 credits
  sceneCost: number; // 3 credits
  imageCost: number; // 5 credits
  voiceCost: number; // 10 credits
  videoCost: number; // dynamic fallback e.g. 20
  videoBaseCost: number; // 15
  videoCostPer15s: number; // 5
  videoResolutionMultipliers: Record<string, number>; // 720p: 1.0, 1080p: 1.5, 4K: 2.5
  videoModelMultipliers: Record<string, number>; // standard: 1.0, cinematic: 1.5, ultra: 2.0
  updatedAt: string;
}

export interface RegionalPrice {
  currency: string;
  symbol: string;
  monthly: number;
  yearly: number;
}

export interface PricingPlanRecord {
  id: 'free' | 'pro' | 'creator' | 'business';
  name: string;
  badge?: string;
  tagline: string;
  monthlyCredits: number;
  projectsLimit: number; // 5, 50, -1 for unlimited
  description: string;
  features: string[];
  popular?: boolean;
  isActive: boolean;
  regionalPrices: Record<string, RegionalPrice>;
}

export interface CreditPackRecord {
  id: string;
  name: string;
  credits: number;
  badge?: string;
  available: boolean;
  prices: Record<string, { currency: string; symbol: string; amount: number }>;
}

export interface PaymentOrderRecord {
  orderId: string;
  userId: string;
  planId?: string;
  creditPackId?: string;
  billingCycle?: 'monthly' | 'yearly';
  currency: string;
  amount: number;
  status: 'created' | 'pending' | 'verified' | 'failed';
  paymentMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
  gateway: string;
  paymentId?: string;
  signature?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface UsageLogRecord {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'voice' | 'video';
  amount: number;
  description: string;
  timestamp: string;
  billingPeriod: string;
}

export interface AgentTaskSummary {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  type: string;
  estimatedCredits: number;
  status: 'Queued' | 'Working' | 'Completed' | 'Failed' | 'Needs Approval';
}

export interface GeneratedProjectItemRecord {
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

export interface AgentPlanRecord {
  id: string;
  userId: string;
  goal: string;
  prompt: string;
  platform: string;
  language: string;
  numberOfVideos: number;
  estimatedOperations: number;
  estimatedCredits: number;
  expectedOutputs: string[];
  tasks: AgentTaskSummary[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'cancelled';
  useBrandKit: boolean;
  selectedCharacterId?: string;
  selectedCharacterName?: string;
  generatedProjects?: GeneratedProjectItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentTaskRecord {
  id: string;
  userId: string;
  planId?: string;
  projectId?: string;
  title: string;
  description: string;
  type: string;
  creditCost: number;
  status: 'Queued' | 'Working' | 'Completed' | 'Failed' | 'Needs Approval';
  requiresApproval?: boolean;
  resultSummary?: string;
  resultData?: any;
  error?: string;
  isAsyncBackground?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentCalendarRecord {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  platform: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  status: 'Idea' | 'Script Ready' | 'Media Pending' | 'Ready' | 'Published';
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

export interface SeriesEpisodeRecord {
  episodeNumber: number;
  title: string;
  hook: string;
  concept: string;
  projectId?: string;
  status: 'planned' | 'generated';
}

export interface SeriesRecord {
  id: string;
  userId: string;
  seriesName: string;
  topic: string;
  numberOfEpisodes: number;
  platform: string;
  duration: string;
  language: string;
  episodeIdeas: SeriesEpisodeRecord[];
  recurringElements: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterRecord {
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

export interface AgentActivityRecord {
  id: string;
  userId: string;
  actionType: string;
  description: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  creditsUsed?: number;
}

export interface DatabaseSchema {
  users: Record<string, UserRecord>;
  sessions: Record<string, { userId: string; expiresAt: number }>;
  brandKits: Record<string, BrandKitRecord>;
  credits: Record<string, CreditWalletRecord>;
  creditConfig: CreditConfigRecord;
  usageLogs: UsageLogRecord[];
  projects: Record<string, any>;
  resetTokens: Record<string, { userId: string; expiresAt: number }>;
  agentPlans: Record<string, AgentPlanRecord>;
  agentTasks: Record<string, AgentTaskRecord>;
  contentCalendar: Record<string, ContentCalendarRecord>;
  series: Record<string, SeriesRecord>;
  characters: Record<string, CharacterRecord>;
  agentActivity: AgentActivityRecord[];
  pricingPlans: Record<string, PricingPlanRecord>;
  creditPacks: Record<string, CreditPackRecord>;
  paymentOrders: Record<string, PaymentOrderRecord>;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_creatornova_salt').digest('hex');
}

class DatabaseManager {
  private db: DatabaseSchema;
  private initialized: boolean = false;

  constructor() {
    this.db = this.getInitialSchema();
    this.ensureInitialized();
  }

  private getInitialSchema(): DatabaseSchema {
    return {
      users: {},
      sessions: {},
      brandKits: {},
      credits: {},
      creditConfig: {
        textCost: 1,
        scriptCost: 2,
        seoCost: 2,
        sceneCost: 3,
        imageCost: 5,
        voiceCost: 10,
        videoCost: 20,
        videoBaseCost: 15,
        videoCostPer15s: 5,
        videoResolutionMultipliers: {
          '720p': 1.0,
          '1080p': 1.5,
          '4K': 2.5,
        },
        videoModelMultipliers: {
          standard: 1.0,
          cinematic: 1.5,
          ultra: 2.0,
        },
        updatedAt: new Date().toISOString(),
      },
      usageLogs: [],
      projects: {},
      resetTokens: {},
      agentPlans: {},
      agentTasks: {},
      contentCalendar: {},
      series: {},
      characters: {},
      agentActivity: [],
      pricingPlans: {},
      creditPacks: {},
      paymentOrders: {},
    };
  }

  private ensureInitialized() {
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        if (!this.db.agentPlans) this.db.agentPlans = {};
        if (!this.db.agentTasks) this.db.agentTasks = {};
        if (!this.db.contentCalendar) this.db.contentCalendar = {};
        if (!this.db.series) this.db.series = {};
        if (!this.db.characters) this.db.characters = {};
        if (!this.db.agentActivity) this.db.agentActivity = [];
        if (!this.db.pricingPlans || Object.keys(this.db.pricingPlans).length === 0) {
          this.seedPricingPlans();
        }
        if (!this.db.creditPacks || Object.keys(this.db.creditPacks).length === 0) {
          this.seedCreditPacks();
        }
        if (!this.db.paymentOrders) this.db.paymentOrders = {};

        // If characters or calendar are empty from older db versions, seed initial agent structures
        if (Object.keys(this.db.characters).length === 0) {
          this.seedAgentData('user-creator-default');
          this.persist();
        }
      } else {
        this.seedInitialData();
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing database:', err);
      this.seedInitialData();
      this.initialized = true;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private seedInitialData() {
    const defaultUserId = 'user-creator-default';
    const adminUserId = 'user-admin-default';

    // 1. Seed Demo Creator User
    this.db.users[defaultUserId] = {
      id: defaultUserId,
      name: 'Alex Rivera',
      email: 'creator@creatornova.ai',
      passwordHash: hashPassword('creatornova123'),
      role: 'user',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      preferredLanguage: 'English',
      creatorNiche: 'Science & Educational Animation',
      defaultPlatform: 'YouTube Shorts',
      defaultContentLanguage: 'English',
      plan: 'pro',
      billingCycle: 'monthly',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      onboardingCompleted: true,
    };

    // 2. Seed Admin User
    this.db.users[adminUserId] = {
      id: adminUserId,
      name: 'System Admin',
      email: 'admin@creatornova.ai',
      passwordHash: hashPassword('adminnova123'),
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      preferredLanguage: 'English',
      creatorNiche: 'Platform Administration',
      defaultPlatform: 'YouTube Long Video',
      defaultContentLanguage: 'English',
      plan: 'business',
      billingCycle: 'yearly',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      onboardingCompleted: true,
    };

    // 3. Seed Brand Kit for Creator
    this.db.brandKits[defaultUserId] = {
      userId: defaultUserId,
      channelName: 'Cosmic Explorers',
      channelNiche: 'Space & Modern Science Facts',
      targetAudience: 'Students & Curious Minds (12-25)',
      preferredLanguage: 'English',
      preferredVisualStyle: 'Cinematic High-Contrast',
      defaultVideoStyle: 'Fast-Paced Shorts with Zoom Cues',
      toneOfVoice: 'Energetic, Curious & Authoritative',
      recurringCharacterDescription: 'Dr. Nova, an energetic robotic cosmic guide with deep violet plating and glowing cyan eyes',
      preferredCta: 'Subscribe to Cosmic Explorers for weekly mind-blowing facts!',
      updatedAt: new Date().toISOString(),
    };

    // 4. Seed Credits for Creator (850 credits remaining as requested)
    this.db.credits[defaultUserId] = {
      userId: defaultUserId,
      textCredits: 350,
      imageCredits: 250,
      voiceCredits: 170,
      videoCredits: 80,
      totalRemaining: 850,
      monthlyAllocation: 1000,
      lastResetDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    };

    // Credits for Admin
    this.db.credits[adminUserId] = {
      userId: adminUserId,
      textCredits: 4000,
      imageCredits: 3000,
      voiceCredits: 2000,
      videoCredits: 1000,
      totalRemaining: 10000,
      monthlyAllocation: 10000,
      lastResetDate: new Date().toISOString(),
    };

    // 5. Seed Starter Projects owned by default creator
    for (const proj of STARTER_PROJECTS) {
      this.db.projects[proj.id] = {
        ...proj,
        userId: defaultUserId,
        createdAt: proj.createdAt || new Date().toISOString(),
        updatedAt: proj.updatedAt || new Date().toISOString(),
      };
    }

    // 6. Seed sample usage logs
    this.db.usageLogs.push(
      {
        id: 'log-1',
        userId: defaultUserId,
        type: 'text',
        amount: 2,
        description: 'Generated complete script for "Space Facts Short"',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        billingPeriod: 'Sept 2026',
      },
      {
        id: 'log-2',
        userId: defaultUserId,
        type: 'image',
        amount: 5,
        description: 'Rendered 4K Thumbnail for "Kids Colors Video"',
        timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
        billingPeriod: 'Sept 2026',
      },
      {
        id: 'log-3',
        userId: defaultUserId,
        type: 'voice',
        amount: 3,
        description: 'Synthesized voiceover track for Scene Breakdown',
        timestamp: new Date(Date.now() - 14 * 3600000).toISOString(),
        billingPeriod: 'Sept 2026',
      }
    );

    this.seedAgentData(defaultUserId);
  }

  private seedAgentData(defaultUserId: string = 'user-creator-default') {
    // 7. Seed Character Library
    const charId = 'char-dr-nova';
    this.db.characters[charId] = {
      id: charId,
      userId: defaultUserId,
      name: 'Dr. Nova',
      role: 'Cosmic Guide & Scientist',
      visualDescription: 'Futuristic guide robot with sleek deep violet armor, polished chrome joints, and glowing cyan optic visor with an expressive holographic display',
      clothing: 'Violet titanium exoskeleton with subtle neon circuit engravings and shoulder beacon badge',
      mainColors: ['#8b5cf6', '#06b6d4', '#1e1b4b'],
      personality: 'Inquisitive, energetic, mind-blown by astronomical wonders, loves explaining complex science through fun analogies',
      voiceStyle: 'Energetic, crisp, friendly with a slight reverberant metallic sparkle',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    };

    // 8. Seed Content Calendar
    const today = new Date();
    const formatDate = (daysOffset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysOffset);
      return d.toISOString().split('T')[0];
    };

    const calItems: ContentCalendarRecord[] = [
      {
        id: 'cal-1',
        userId: defaultUserId,
        title: '7 Mind-Blowing Facts About Black Holes',
        platform: 'YouTube Shorts',
        scheduledDate: formatDate(0),
        scheduledTime: '17:00',
        status: 'Ready',
        language: 'English',
        channelName: 'Cosmic Explorers',
        hook: 'What happens if you fall into a supermassive black hole? You become human spaghetti!',
        notes: 'Rendered in AI Media Studio with Dr. Nova character consistency cue.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cal-2',
        userId: defaultUserId,
        title: 'Why Is Space Completely Silent? (The Physics of Sound)',
        platform: 'YouTube Shorts',
        scheduledDate: formatDate(1),
        scheduledTime: '18:00',
        status: 'Script Ready',
        language: 'English',
        channelName: 'Cosmic Explorers',
        hook: 'Hollywood got it wrong—in space, no one can hear you scream, and here is why!',
        notes: 'Script drafted, needs thumbnail preview.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cal-3',
        userId: defaultUserId,
        title: 'Kids Science: How Do Rockets Actually Reach Orbit?',
        platform: 'TikTok',
        scheduledDate: formatDate(2),
        scheduledTime: '15:30',
        status: 'Media Pending',
        language: 'English',
        channelName: 'Cosmic Explorers',
        hook: 'Rockets do NOT just fly straight up—they fall sideways forever!',
        notes: 'Visual prompt generated for Dr. Nova explaining orbital velocity.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cal-4',
        userId: defaultUserId,
        title: 'The Diamond Planet: 55 Cancri e Mystery',
        platform: 'Instagram Reels',
        scheduledDate: formatDate(4),
        scheduledTime: '19:00',
        status: 'Idea',
        language: 'English',
        channelName: 'Cosmic Explorers',
        hook: 'There is a planet made almost entirely of crystallized diamond worth trillions!',
        notes: 'High viral potential angle.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const item of calItems) {
      this.db.contentCalendar[item.id] = item;
    }

    // 9. Seed Series
    const seriesId = 'series-cosmic-wonders';
    this.db.series[seriesId] = {
      id: seriesId,
      userId: defaultUserId,
      seriesName: 'Cosmic Wonders',
      topic: 'Unexplained space phenomena and extreme planets',
      numberOfEpisodes: 5,
      platform: 'YouTube Shorts',
      duration: '60 seconds',
      language: 'English',
      episodeIdeas: [
        { episodeNumber: 1, title: 'The Planet Where It Rains Glass Sideways', hook: 'Imagine winds blowing at 5,000 miles per hour while raining molten glass!', concept: 'HD 189733b planetary atmosphere breakdown', status: 'generated' },
        { episodeNumber: 2, title: 'The Sound of a Black Hole Remastered by NASA', hook: 'Turn your volume up: This is what a cosmic void actually sounds like.', concept: 'Perseus galaxy cluster pressure soundwaves', status: 'planned' },
        { episodeNumber: 3, title: 'The Great Attractor: What Is Pulling Our Galaxy?', hook: 'Something invisible is dragging our entire Milky Way at 2 million km/h!', concept: 'Laniakea supercluster gravitational anomaly', status: 'planned' },
        { episodeNumber: 4, title: 'Neutron Stars: A Teaspoon Weighs a Mountain', hook: 'If you dropped a teaspoon of neutron star matter on Earth, it would sink to the core!', concept: 'Super-dense matter physics explained simply', status: 'planned' },
        { episodeNumber: 5, title: 'The James Webb Deep Field Mystery', hook: 'These galaxies formed when the universe was barely an infant!', concept: 'Earliest cosmic dawn observations', status: 'planned' },
      ],
      recurringElements: 'Dr. Nova host avatar, fast cosmic ambient synth track, 3-second retention question, recurring CTA',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 10. Seed Agent Activity
    this.db.agentActivity.unshift(
      {
        id: 'act-1',
        userId: defaultUserId,
        actionType: 'create_plan',
        description: 'CreatorNova Agent formulated 7-day YouTube Shorts space content plan',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        creditsUsed: 14,
      },
      {
        id: 'act-2',
        userId: defaultUserId,
        actionType: 'character_created',
        description: 'Saved "Dr. Nova" to Character Library for consistent scene generation',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        id: 'act-3',
        userId: defaultUserId,
        actionType: 'series_created',
        description: 'Created 5-part series "Cosmic Wonders" with unique episode hooks',
        timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
      },
      {
        id: 'act-4',
        userId: defaultUserId,
        actionType: 'add_calendar',
        description: 'Scheduled "7 Mind-Blowing Facts About Black Holes" to Content Calendar',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      }
    );

    // 11. Seed Pricing Plans (India-first & Global)
    this.seedPricingPlans();

    // 12. Seed Credit Packs
    this.seedCreditPacks();
  }

  public seedPricingPlans() {
    this.db.pricingPlans = {
      free: {
        id: 'free',
        name: 'FREE',
        tagline: 'For users testing CreatorNova AI',
        monthlyCredits: 50,
        projectsLimit: 5,
        description: 'Test viral ideas, scripts, and basic scene generation at zero cost.',
        features: [
          '50 monthly credits',
          '5 projects',
          'AI idea generation',
          'Basic script generation',
          'Basic SEO',
          'Limited scene generation',
        ],
        popular: false,
        isActive: true,
        regionalPrices: {
          INR: { currency: 'INR', symbol: '₹', monthly: 0, yearly: 0 },
          USD: { currency: 'USD', symbol: '$', monthly: 0, yearly: 0 },
          EUR: { currency: 'EUR', symbol: '€', monthly: 0, yearly: 0 },
          GBP: { currency: 'GBP', symbol: '£', monthly: 0, yearly: 0 },
          JPY: { currency: 'JPY', symbol: '¥', monthly: 0, yearly: 0 },
        },
      },
      pro: {
        id: 'pro',
        name: 'PRO',
        tagline: 'For individual creators wanting higher limits & speed',
        monthlyCredits: 1000,
        projectsLimit: 50,
        description: 'Full studio access, advanced AI scripts, and brand kit memory.',
        features: [
          '1,000 monthly credits',
          '50 projects',
          'Advanced AI scripts',
          'Scene generator',
          'SEO tools',
          'Thumbnail prompt generator',
          'Basic AI Agent',
          'Brand Kit',
          'Multiple languages',
        ],
        popular: false,
        isActive: true,
        regionalPrices: {
          INR: { currency: 'INR', symbol: '₹', monthly: 299, yearly: 2990 },
          USD: { currency: 'USD', symbol: '$', monthly: 9, yearly: 90 },
          EUR: { currency: 'EUR', symbol: '€', monthly: 8, yearly: 80 },
          GBP: { currency: 'GBP', symbol: '£', monthly: 7, yearly: 70 },
          JPY: { currency: 'JPY', symbol: '¥', monthly: 1400, yearly: 14000 },
        },
      },
      creator: {
        id: 'creator',
        name: 'CREATOR',
        badge: 'MOST POPULAR',
        tagline: 'For high-volume creators needing automated pipelines',
        monthlyCredits: 4000,
        projectsLimit: -1, // Unlimited subject to fair use
        description: 'Autonomous AI Creator Agent, Content Calendar, Series Creator, and Character Library.',
        features: [
          '4,000 monthly credits',
          'Unlimited text projects (fair-use)',
          'AI Creator Agent',
          'Content Calendar',
          'Series Creator',
          'Advanced SEO',
          'Thumbnail generation when supported',
          'Voice generation when supported',
          'Character Library',
          'Content repurposing',
          'Priority generation',
        ],
        popular: true,
        isActive: true,
        regionalPrices: {
          INR: { currency: 'INR', symbol: '₹', monthly: 799, yearly: 7990 },
          USD: { currency: 'USD', symbol: '$', monthly: 24, yearly: 240 },
          EUR: { currency: 'EUR', symbol: '€', monthly: 22, yearly: 220 },
          GBP: { currency: 'GBP', symbol: '£', monthly: 19, yearly: 190 },
          JPY: { currency: 'JPY', symbol: '¥', monthly: 3600, yearly: 36000 },
        },
      },
      business: {
        id: 'business',
        name: 'BUSINESS',
        tagline: 'For agencies, creator businesses, and multi-channel studios',
        monthlyCredits: 12000,
        projectsLimit: -1,
        description: 'Everything in Creator plus multiple brand kits, higher limits, and priority support.',
        features: [
          '12,000 monthly credits',
          'Everything in Creator',
          'Multiple Brand Kits',
          'Team-ready architecture',
          'Higher generation limits',
          'Advanced automation',
          'Business content workflows',
          'Priority support',
          'Commercial creator workflows',
        ],
        popular: false,
        isActive: true,
        regionalPrices: {
          INR: { currency: 'INR', symbol: '₹', monthly: 1999, yearly: 19990 },
          USD: { currency: 'USD', symbol: '$', monthly: 59, yearly: 590 },
          EUR: { currency: 'EUR', symbol: '€', monthly: 55, yearly: 550 },
          GBP: { currency: 'GBP', symbol: '£', monthly: 49, yearly: 490 },
          JPY: { currency: 'JPY', symbol: '¥', monthly: 8900, yearly: 89000 },
        },
      },
    };
  }

  public seedCreditPacks() {
    this.db.creditPacks = {
      'pack-100': {
        id: 'pack-100',
        name: '100 Credits',
        credits: 100,
        available: true,
        prices: {
          INR: { currency: 'INR', symbol: '₹', amount: 99 },
          USD: { currency: 'USD', symbol: '$', amount: 3 },
          EUR: { currency: 'EUR', symbol: '€', amount: 3 },
          GBP: { currency: 'GBP', symbol: '£', amount: 2.5 },
          JPY: { currency: 'JPY', symbol: '¥', amount: 450 },
        },
      },
      'pack-500': {
        id: 'pack-500',
        name: '500 Credits',
        credits: 500,
        available: true,
        prices: {
          INR: { currency: 'INR', symbol: '₹', amount: 399 },
          USD: { currency: 'USD', symbol: '$', amount: 12 },
          EUR: { currency: 'EUR', symbol: '€', amount: 11 },
          GBP: { currency: 'GBP', symbol: '£', amount: 9.5 },
          JPY: { currency: 'JPY', symbol: '¥', amount: 1800 },
        },
      },
      'pack-1000': {
        id: 'pack-1000',
        name: '1,000 Credits',
        credits: 1000,
        badge: 'MOST POPULAR',
        available: true,
        prices: {
          INR: { currency: 'INR', symbol: '₹', amount: 699 },
          USD: { currency: 'USD', symbol: '$', amount: 20 },
          EUR: { currency: 'EUR', symbol: '€', amount: 19 },
          GBP: { currency: 'GBP', symbol: '£', amount: 16 },
          JPY: { currency: 'JPY', symbol: '¥', amount: 3000 },
        },
      },
      'pack-5000': {
        id: 'pack-5000',
        name: '5,000 Credits',
        credits: 5000,
        badge: 'BEST VALUE',
        available: true,
        prices: {
          INR: { currency: 'INR', symbol: '₹', amount: 2999 },
          USD: { currency: 'USD', symbol: '$', amount: 85 },
          EUR: { currency: 'EUR', symbol: '€', amount: 80 },
          GBP: { currency: 'GBP', symbol: '£', amount: 70 },
          JPY: { currency: 'JPY', symbol: '¥', amount: 12500 },
        },
      },
    };
  }

  // --- Auth & Sessions ---

  public authenticateToken(token: string): UserRecord | null {
    this.ensureInitialized();
    const session = this.db.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.db.sessions[token];
      this.persist();
      return null;
    }
    return this.db.users[session.userId] || null;
  }

  public registerUser(params: {
    name: string;
    email: string;
    password: string;
    preferredLanguage?: string;
    creatorNiche?: string;
    defaultPlatform?: string;
  }): { user: UserRecord; token: string } {
    this.ensureInitialized();
    const normalizedEmail = params.email.trim().toLowerCase();

    for (const u of Object.values(this.db.users)) {
      if (u.email.toLowerCase() === normalizedEmail) {
        throw new Error('An account with this email already exists.');
      }
    }

    const userId = `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const user: UserRecord = {
      id: userId,
      name: params.name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(params.password),
      role: 'user',
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      preferredLanguage: params.preferredLanguage || 'English',
      creatorNiche: params.creatorNiche || 'General Creator',
      defaultPlatform: params.defaultPlatform || 'YouTube Shorts',
      defaultContentLanguage: params.preferredLanguage || 'English',
      plan: 'free',
      billingCycle: 'monthly',
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };

    this.db.users[userId] = user;

    // Free tier initial credit grant
    this.db.credits[userId] = {
      userId,
      textCredits: 50,
      imageCredits: 30,
      voiceCredits: 20,
      videoCredits: 0,
      totalRemaining: 100,
      monthlyAllocation: 100,
      lastResetDate: new Date().toISOString(),
    };

    // Default Brand Kit
    this.db.brandKits[userId] = {
      userId,
      channelName: `${params.name}'s Studio`,
      channelNiche: params.creatorNiche || 'Content Creation',
      targetAudience: 'General Audience',
      preferredLanguage: params.preferredLanguage || 'English',
      preferredVisualStyle: 'Cinematic',
      defaultVideoStyle: 'High Pacing Shorts',
      toneOfVoice: 'Energetic & Engaging',
      recurringCharacterDescription: '',
      preferredCta: 'Like and subscribe for more!',
      updatedAt: new Date().toISOString(),
    };

    const token = crypto.randomBytes(32).toString('hex');
    this.db.sessions[token] = {
      userId,
      expiresAt: Date.now() + 30 * 86400000, // 30 days
    };

    this.persist();
    return { user, token };
  }

  public loginUser(params: { email: string; password: string }): { user: UserRecord; token: string } {
    this.ensureInitialized();
    const normalizedEmail = params.email.trim().toLowerCase();
    const passHash = hashPassword(params.password);

    let matchedUser: UserRecord | null = null;
    for (const u of Object.values(this.db.users)) {
      if (u.email.toLowerCase() === normalizedEmail) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser || matchedUser.passwordHash !== passHash) {
      throw new Error('Invalid email or password.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    this.db.sessions[token] = {
      userId: matchedUser.id,
      expiresAt: Date.now() + 30 * 86400000,
    };

    this.persist();
    return { user: matchedUser, token };
  }

  public logoutUser(token: string) {
    this.ensureInitialized();
    if (this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.persist();
    }
  }

  public createPasswordResetToken(email: string): string {
    this.ensureInitialized();
    const normalized = email.trim().toLowerCase();
    let targetUser: UserRecord | null = null;
    for (const u of Object.values(this.db.users)) {
      if (u.email.toLowerCase() === normalized) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      throw new Error('No account found with this email address.');
    }

    const resetToken = crypto.randomBytes(16).toString('hex');
    this.db.resetTokens[resetToken] = {
      userId: targetUser.id,
      expiresAt: Date.now() + 3600000, // 1 hour
    };
    this.persist();
    return resetToken;
  }

  public resetPasswordWithToken(token: string, newPass: string): boolean {
    this.ensureInitialized();
    const record = this.db.resetTokens[token];
    if (!record || Date.now() > record.expiresAt) {
      throw new Error('Reset link has expired or is invalid.');
    }

    const user = this.db.users[record.userId];
    if (!user) throw new Error('User not found.');

    user.passwordHash = hashPassword(newPass);
    delete this.db.resetTokens[token];
    this.persist();
    return true;
  }

  public getUserById(userId: string): UserRecord | null {
    this.ensureInitialized();
    return this.db.users[userId] || null;
  }

  public updateUserProfile(userId: string, updates: Partial<UserRecord>): UserRecord {
    this.ensureInitialized();
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');

    const updated = {
      ...user,
      ...updates,
      id: user.id, // prevent id mutation
      email: user.email, // email should remain stable
      role: user.role, // role cannot be escalated via profile edit
    };

    this.db.users[userId] = updated;
    this.persist();
    return updated;
  }

  // --- Brand Kit ---

  public getBrandKit(userId: string): BrandKitRecord {
    this.ensureInitialized();
    if (!this.db.brandKits[userId]) {
      const user = this.db.users[userId];
      this.db.brandKits[userId] = {
        userId,
        channelName: user ? `${user.name}'s Channel` : 'My Channel',
        channelNiche: user?.creatorNiche || 'General',
        targetAudience: 'General Audience',
        preferredLanguage: user?.preferredLanguage || 'English',
        preferredVisualStyle: 'Cinematic',
        defaultVideoStyle: 'High Retention Shorts',
        toneOfVoice: 'Energetic & Engaging',
        recurringCharacterDescription: '',
        preferredCta: 'Subscribe for more videos!',
        updatedAt: new Date().toISOString(),
      };
      this.persist();
    }
    return this.db.brandKits[userId];
  }

  public updateBrandKit(userId: string, updates: Partial<BrandKitRecord>): BrandKitRecord {
    this.ensureInitialized();
    const current = this.getBrandKit(userId);
    const updated = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };
    this.db.brandKits[userId] = updated;
    this.persist();
    return updated;
  }

  // --- Credits & Wallet ---

  public getUserCredits(userId: string): CreditWalletRecord {
    this.ensureInitialized();
    if (!this.db.credits[userId]) {
      this.db.credits[userId] = {
        userId,
        textCredits: 100,
        imageCredits: 50,
        voiceCredits: 30,
        videoCredits: 10,
        totalRemaining: 190,
        monthlyAllocation: 200,
        lastResetDate: new Date().toISOString(),
      };
      this.persist();
    }
    return this.db.credits[userId];
  }

  public deductUserCredits(
    userId: string,
    type: 'text' | 'image' | 'voice' | 'video',
    amount: number,
    description: string
  ): { success: boolean; balance: CreditWalletRecord; error?: string } {
    this.ensureInitialized();
    const wallet = this.getUserCredits(userId);

    const typeKey = `${type}Credits` as keyof CreditWalletRecord;
    const currentTypeCredits = wallet[typeKey] as number;

    // Check balance
    if (wallet.totalRemaining < amount || currentTypeCredits < amount) {
      // Allow overflow from totalRemaining if specific pool is low, or enforce strict
      if (wallet.totalRemaining < amount) {
        return {
          success: false,
          balance: wallet,
          error: `Insufficient credits. Required: ${amount}, Remaining: ${wallet.totalRemaining}`,
        };
      }
    }

    // Deduct from pool and total
    const deductFromPool = Math.min(currentTypeCredits, amount);
    (wallet[typeKey] as number) = currentTypeCredits - deductFromPool;
    wallet.totalRemaining = Math.max(0, wallet.totalRemaining - amount);

    // Record usage log
    this.db.usageLogs.unshift({
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      type,
      amount,
      description,
      timestamp: new Date().toISOString(),
      billingPeriod: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });

    if (this.db.usageLogs.length > 500) {
      this.db.usageLogs = this.db.usageLogs.slice(0, 500);
    }

    this.persist();
    return { success: true, balance: wallet };
  }

  public replenishUserCredits(userId: string, customAmount?: number): CreditWalletRecord {
    this.ensureInitialized();
    const user = this.db.users[userId];
    const plan = user?.plan || 'free';

    let allocation = 100;
    if (plan === 'pro') allocation = 1000;
    else if (plan === 'creator') allocation = 3500;
    else if (plan === 'business') allocation = 10000;

    const total = customAmount || allocation;
    const textCredits = Math.round(total * 0.4);
    const imageCredits = Math.round(total * 0.3);
    const voiceCredits = Math.round(total * 0.2);
    const videoCredits = total - textCredits - imageCredits - voiceCredits;

    this.db.credits[userId] = {
      userId,
      textCredits,
      imageCredits,
      voiceCredits,
      videoCredits,
      totalRemaining: total,
      monthlyAllocation: total,
      lastResetDate: new Date().toISOString(),
    };

    this.db.usageLogs.unshift({
      id: `log-${Date.now()}`,
      userId,
      type: 'text',
      amount: total,
      description: `Plan Credits Reset / Refill (${plan.toUpperCase()} Tier)`,
      timestamp: new Date().toISOString(),
      billingPeriod: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });

    this.persist();
    return this.db.credits[userId];
  }

  public getUserUsageLogs(userId: string): UsageLogRecord[] {
    this.ensureInitialized();
    return this.db.usageLogs.filter((l) => l.userId === userId);
  }

  public getCreditConfig(): CreditConfigRecord {
    this.ensureInitialized();
    return this.db.creditConfig;
  }

  public updateCreditConfig(adminUserId: string, updates: Partial<CreditConfigRecord>): CreditConfigRecord {
    this.ensureInitialized();
    const admin = this.db.users[adminUserId];
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin privilege required.');
    }

    this.db.creditConfig = {
      ...this.db.creditConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.db.creditConfig;
  }

  // --- Projects (Strict User Isolation) ---

  public getUserProjects(
    userId: string,
    filters?: {
      search?: string;
      platform?: string;
      language?: string;
      contentType?: string;
      sort?: string;
    }
  ): any[] {
    this.ensureInitialized();
    let projects = Object.values(this.db.projects).filter((p) => p.userId === userId);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.topic?.toLowerCase().includes(q) ||
          p.targetAudience?.toLowerCase().includes(q)
      );
    }

    if (filters?.platform && filters.platform !== 'All') {
      projects = projects.filter((p) => p.platform === filters.platform);
    }

    if (filters?.language && filters.language !== 'All') {
      projects = projects.filter((p) => p.language === filters.language);
    }

    if (filters?.contentType && filters.contentType !== 'All') {
      projects = projects.filter((p) => p.contentType === filters.contentType);
    }

    if (filters?.sort === 'oldest') {
      projects.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filters?.sort === 'alpha') {
      projects.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Default: newest first
      projects.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    }

    return projects;
  }

  public getUserProjectById(projectId: string, userId: string): any | null {
    this.ensureInitialized();
    const proj = this.db.projects[projectId];
    if (!proj || proj.userId !== userId) {
      return null;
    }
    return proj;
  }

  public saveUserProject(project: any, userId: string): any {
    this.ensureInitialized();
    const projectId = project.id || `project-${Date.now()}`;
    const existing = this.db.projects[projectId];

    if (existing && existing.userId !== userId) {
      throw new Error('Access denied: You do not own this project.');
    }

    const saved = {
      ...project,
      id: projectId,
      userId,
      createdAt: existing?.createdAt || project.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.projects[projectId] = saved;
    this.persist();
    return saved;
  }

  public deleteUserProject(projectId: string, userId: string): boolean {
    this.ensureInitialized();
    const proj = this.db.projects[projectId];
    if (!proj || proj.userId !== userId) {
      throw new Error('Access denied or project not found.');
    }

    delete this.db.projects[projectId];
    this.persist();
    return true;
  }

  public duplicateUserProject(projectId: string, userId: string): any {
    this.ensureInitialized();
    const proj = this.db.projects[projectId];
    if (!proj || proj.userId !== userId) {
      throw new Error('Access denied or project not found.');
    }

    const newId = `project-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const duplicate = {
      ...proj,
      id: newId,
      userId,
      name: `${proj.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.projects[newId] = duplicate;
    this.persist();
    return duplicate;
  }

  // --- Admin Architecture ---

  public getAllUsers(adminUserId: string): UserRecord[] {
    this.ensureInitialized();
    const admin = this.db.users[adminUserId];
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin privilege required.');
    }

    return Object.values(this.db.users).map((u) => {
      const { passwordHash, ...safeUser } = u;
      return safeUser as UserRecord;
    });
  }

  public updateUserPlan(adminUserId: string, targetUserId: string, newPlan: 'free' | 'pro' | 'creator' | 'business') {
    this.ensureInitialized();
    const admin = this.db.users[adminUserId];
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin privilege required.');
    }

    const user = this.db.users[targetUserId];
    if (!user) throw new Error('Target user not found.');

    user.plan = newPlan;
    this.replenishUserCredits(targetUserId);
    this.persist();
    return user;
  }

  public getPlatformMetrics(adminUserId: string) {
    this.ensureInitialized();
    const admin = this.db.users[adminUserId];
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin privilege required.');
    }

    const totalUsers = Object.keys(this.db.users).length;
    const totalProjects = Object.keys(this.db.projects).length;
    const totalGenerations = this.db.usageLogs.length;
    const planBreakdown = {
      free: 0,
      pro: 0,
      creator: 0,
      business: 0,
    };

    for (const u of Object.values(this.db.users)) {
      if (planBreakdown[u.plan] !== undefined) {
        planBreakdown[u.plan]++;
      }
    }

    return {
      totalUsers,
      totalProjects,
      totalGenerations,
      planBreakdown,
      creditConfig: this.db.creditConfig,
    };
  }

  // --- CreatorNova AI Agent Methods ---

  public getAgentPlans(userId: string): AgentPlanRecord[] {
    this.ensureInitialized();
    return Object.values(this.db.agentPlans)
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAgentPlan(planId: string, userId: string): AgentPlanRecord | null {
    this.ensureInitialized();
    const plan = this.db.agentPlans[planId];
    if (!plan || plan.userId !== userId) return null;
    return plan;
  }

  public saveAgentPlan(plan: Partial<AgentPlanRecord> & { userId: string }): AgentPlanRecord {
    this.ensureInitialized();
    const id = plan.id || `plan-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const record: AgentPlanRecord = {
      id,
      userId: plan.userId,
      goal: plan.goal || 'Custom Content Generation',
      prompt: plan.prompt || '',
      platform: plan.platform || 'YouTube Shorts',
      language: plan.language || 'English',
      numberOfVideos: plan.numberOfVideos || 1,
      estimatedOperations: plan.estimatedOperations || 6,
      estimatedCredits: plan.estimatedCredits || 10,
      expectedOutputs: plan.expectedOutputs || [],
      tasks: plan.tasks || [],
      status: plan.status || 'draft',
      useBrandKit: plan.useBrandKit ?? true,
      selectedCharacterId: plan.selectedCharacterId,
      selectedCharacterName: plan.selectedCharacterName,
      generatedProjects: plan.generatedProjects || [],
      createdAt: plan.createdAt || now,
      updatedAt: now,
    };

    this.db.agentPlans[id] = record;
    this.persist();
    return record;
  }

  public updateAgentPlan(planId: string, userId: string, updates: Partial<AgentPlanRecord>): AgentPlanRecord {
    this.ensureInitialized();
    const plan = this.db.agentPlans[planId];
    if (!plan || plan.userId !== userId) {
      throw new Error('Plan not found or unauthorized.');
    }
    const updated: AgentPlanRecord = {
      ...plan,
      ...updates,
      id: plan.id,
      userId: plan.userId,
      updatedAt: new Date().toISOString(),
    };
    this.db.agentPlans[planId] = updated;
    this.persist();
    return updated;
  }

  public deleteAgentPlan(planId: string, userId: string): boolean {
    this.ensureInitialized();
    const plan = this.db.agentPlans[planId];
    if (!plan || plan.userId !== userId) return false;
    delete this.db.agentPlans[planId];
    this.persist();
    return true;
  }

  // --- Agent Task Queue ---

  public getAgentTasks(userId: string): AgentTaskRecord[] {
    this.ensureInitialized();
    return Object.values(this.db.agentTasks)
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveAgentTask(task: Partial<AgentTaskRecord> & { userId: string }): AgentTaskRecord {
    this.ensureInitialized();
    const id = task.id || `task-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const record: AgentTaskRecord = {
      id,
      userId: task.userId,
      planId: task.planId,
      projectId: task.projectId,
      title: task.title || 'Agent Generation Step',
      description: task.description || '',
      type: task.type || 'custom',
      creditCost: task.creditCost || 2,
      status: task.status || 'Queued',
      requiresApproval: task.requiresApproval || false,
      resultSummary: task.resultSummary,
      resultData: task.resultData,
      error: task.error,
      isAsyncBackground: task.isAsyncBackground || false,
      createdAt: task.createdAt || now,
      updatedAt: now,
    };
    this.db.agentTasks[id] = record;
    this.persist();
    return record;
  }

  public updateAgentTask(taskId: string, userId: string, updates: Partial<AgentTaskRecord>): AgentTaskRecord {
    this.ensureInitialized();
    const task = this.db.agentTasks[taskId];
    if (!task || task.userId !== userId) {
      throw new Error('Task not found or unauthorized.');
    }
    const updated: AgentTaskRecord = {
      ...task,
      ...updates,
      id: task.id,
      userId: task.userId,
      updatedAt: new Date().toISOString(),
    };
    this.db.agentTasks[taskId] = updated;
    this.persist();
    return updated;
  }

  public deleteAgentTask(taskId: string, userId: string): boolean {
    this.ensureInitialized();
    const task = this.db.agentTasks[taskId];
    if (!task || task.userId !== userId) return false;
    delete this.db.agentTasks[taskId];
    this.persist();
    return true;
  }

  // --- Content Calendar ---

  public getCalendarItems(userId: string): ContentCalendarRecord[] {
    this.ensureInitialized();
    return Object.values(this.db.contentCalendar)
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }

  public saveCalendarItem(item: Partial<ContentCalendarRecord> & { userId: string }): ContentCalendarRecord {
    this.ensureInitialized();
    const id = item.id || `cal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const record: ContentCalendarRecord = {
      id,
      userId: item.userId,
      projectId: item.projectId,
      title: item.title || 'Untitled Post',
      platform: item.platform || 'YouTube Shorts',
      scheduledDate: item.scheduledDate || now.split('T')[0],
      scheduledTime: item.scheduledTime || '12:00',
      status: item.status || 'Idea',
      language: item.language || 'English',
      channelName: item.channelName,
      notes: item.notes,
      hook: item.hook,
      thumbnailUrl: item.thumbnailUrl,
      externalPublishStatus: item.externalPublishStatus,
      createdAt: item.createdAt || now,
      updatedAt: now,
    };
    this.db.contentCalendar[id] = record;
    this.persist();
    return record;
  }

  public updateCalendarItem(id: string, userId: string, updates: Partial<ContentCalendarRecord>): ContentCalendarRecord {
    this.ensureInitialized();
    const item = this.db.contentCalendar[id];
    if (!item || item.userId !== userId) {
      throw new Error('Calendar item not found or unauthorized.');
    }
    const updated: ContentCalendarRecord = {
      ...item,
      ...updates,
      id: item.id,
      userId: item.userId,
      updatedAt: new Date().toISOString(),
    };
    this.db.contentCalendar[id] = updated;
    this.persist();
    return updated;
  }

  public deleteCalendarItem(id: string, userId: string): boolean {
    this.ensureInitialized();
    const item = this.db.contentCalendar[id];
    if (!item || item.userId !== userId) return false;
    delete this.db.contentCalendar[id];
    this.persist();
    return true;
  }

  // --- Series Creator ---

  public getSeriesList(userId: string): SeriesRecord[] {
    this.ensureInitialized();
    return Object.values(this.db.series)
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveSeries(series: Partial<SeriesRecord> & { userId: string }): SeriesRecord {
    this.ensureInitialized();
    const id = series.id || `series-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const record: SeriesRecord = {
      id,
      userId: series.userId,
      seriesName: series.seriesName || 'New Series',
      topic: series.topic || '',
      numberOfEpisodes: series.numberOfEpisodes || 5,
      platform: series.platform || 'YouTube Shorts',
      duration: series.duration || '60 seconds',
      language: series.language || 'English',
      episodeIdeas: series.episodeIdeas || [],
      recurringElements: series.recurringElements || '',
      createdAt: series.createdAt || now,
      updatedAt: now,
    };
    this.db.series[id] = record;
    this.persist();
    return record;
  }

  public deleteSeries(id: string, userId: string): boolean {
    this.ensureInitialized();
    const s = this.db.series[id];
    if (!s || s.userId !== userId) return false;
    delete this.db.series[id];
    this.persist();
    return true;
  }

  // --- Character Library ---

  public getCharacters(userId: string): CharacterRecord[] {
    this.ensureInitialized();
    return Object.values(this.db.characters)
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveCharacter(char: Partial<CharacterRecord> & { userId: string }): CharacterRecord {
    this.ensureInitialized();
    const id = char.id || `char-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const record: CharacterRecord = {
      id,
      userId: char.userId,
      name: char.name || 'New Character',
      role: char.role || 'Host / Character',
      visualDescription: char.visualDescription || '',
      clothing: char.clothing || '',
      mainColors: char.mainColors || ['#6366f1', '#ec4899'],
      personality: char.personality || '',
      voiceStyle: char.voiceStyle || 'Energetic and natural',
      avatarUrl: char.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(char.name || 'Character')}`,
      createdAt: char.createdAt || now,
      updatedAt: now,
    };
    this.db.characters[id] = record;
    this.persist();
    return record;
  }

  public deleteCharacter(id: string, userId: string): boolean {
    this.ensureInitialized();
    const c = this.db.characters[id];
    if (!c || c.userId !== userId) return false;
    delete this.db.characters[id];
    this.persist();
    return true;
  }

  // --- Agent Activity ---

  public getAgentActivity(userId: string): AgentActivityRecord[] {
    this.ensureInitialized();
    return this.db.agentActivity
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAgentActivity(activity: {
    userId: string;
    actionType: string;
    description: string;
    projectId?: string;
    projectName?: string;
    creditsUsed?: number;
  }): AgentActivityRecord {
    this.ensureInitialized();
    const record: AgentActivityRecord = {
      id: `act-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: activity.userId,
      actionType: activity.actionType,
      description: activity.description,
      timestamp: new Date().toISOString(),
      projectId: activity.projectId,
      projectName: activity.projectName,
      creditsUsed: activity.creditsUsed,
    };
    this.db.agentActivity.unshift(record);
    if (this.db.agentActivity.length > 300) {
      this.db.agentActivity = this.db.agentActivity.slice(0, 300);
    }
    this.persist();
    return record;
  }

  // --- Pricing & Payment Management ---

  public getPricingPlans(): PricingPlanRecord[] {
    this.ensureInitialized();
    if (!this.db.pricingPlans || Object.keys(this.db.pricingPlans).length === 0) {
      this.seedPricingPlans();
    }
    return Object.values(this.db.pricingPlans);
  }

  public getPricingPlan(planId: string): PricingPlanRecord | null {
    this.ensureInitialized();
    return this.db.pricingPlans[planId] || null;
  }

  public updatePricingPlan(planId: string, updates: Partial<PricingPlanRecord>): PricingPlanRecord {
    this.ensureInitialized();
    const existing = this.db.pricingPlans[planId];
    if (!existing) {
      throw new Error(`Plan ${planId} not found`);
    }
    const updated = { ...existing, ...updates };
    this.db.pricingPlans[planId] = updated;
    this.persist();
    return updated;
  }

  public getCreditPacks(): CreditPackRecord[] {
    this.ensureInitialized();
    if (!this.db.creditPacks || Object.keys(this.db.creditPacks).length === 0) {
      this.seedCreditPacks();
    }
    return Object.values(this.db.creditPacks);
  }

  public updateCreditPack(packId: string, updates: Partial<CreditPackRecord>): CreditPackRecord {
    this.ensureInitialized();
    const existing = this.db.creditPacks[packId];
    if (!existing) {
      throw new Error(`Credit pack ${packId} not found`);
    }
    const updated = { ...existing, ...updates };
    this.db.creditPacks[packId] = updated;
    this.persist();
    return updated;
  }

  public createPaymentOrder(params: {
    userId: string;
    planId?: string;
    creditPackId?: string;
    billingCycle?: 'monthly' | 'yearly';
    currency: string;
    amount: number;
    paymentMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
    gateway?: string;
  }): PaymentOrderRecord {
    this.ensureInitialized();
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const order: PaymentOrderRecord = {
      orderId,
      userId: params.userId,
      planId: params.planId,
      creditPackId: params.creditPackId,
      billingCycle: params.billingCycle,
      currency: params.currency,
      amount: params.amount,
      status: 'pending',
      paymentMethod: params.paymentMethod,
      gateway: params.gateway || 'Razorpay/Cashfree Gateway Integration',
      createdAt: new Date().toISOString(),
    };
    this.db.paymentOrders[orderId] = order;
    this.persist();
    return order;
  }

  public verifyPaymentOrder(orderId: string, verificationData: {
    paymentId: string;
    signature?: string;
  }): PaymentOrderRecord {
    this.ensureInitialized();
    const order = this.db.paymentOrders[orderId];
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.status = 'verified';
    order.paymentId = verificationData.paymentId;
    order.signature = verificationData.signature;
    order.verifiedAt = new Date().toISOString();

    // Activate subscription or add credits based on order
    const user = this.db.users[order.userId];
    if (user && order.planId) {
      user.plan = order.planId as any;
      if (order.billingCycle) {
        user.billingCycle = order.billingCycle;
      }
      const planConfig = this.db.pricingPlans[order.planId];
      if (planConfig && this.db.credits[order.userId]) {
        this.db.credits[order.userId].monthlyAllocation = planConfig.monthlyCredits;
        this.db.credits[order.userId].totalRemaining += planConfig.monthlyCredits;
      }
    } else if (order.creditPackId && this.db.credits[order.userId]) {
      const pack = this.db.creditPacks[order.creditPackId];
      if (pack) {
        this.db.credits[order.userId].totalRemaining += pack.credits;
      }
    }

    this.persist();
    return order;
  }
}

export const dbManager = new DatabaseManager();
