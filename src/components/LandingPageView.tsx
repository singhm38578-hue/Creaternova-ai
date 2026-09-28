import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  Play,
  CheckCircle2,
  Calendar,
  Film,
  Layers,
  Palette,
  ShieldCheck,
  Video,
  FileText,
  Search,
  Image as ImageIcon,
  Languages,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Target,
  Briefcase,
  GraduationCap,
  Users,
  Check,
  Eye,
  Sliders,
  Clock,
  Lock
} from 'lucide-react';
import { useLocale, SUPPORTED_CURRENCIES } from '../contexts/LocaleContext';
import { analytics } from '../services/analytics';

interface LandingPageViewProps {
  onStartCreating: () => void;
  onSignIn?: () => void;
  onOpenPricing?: () => void;
  onOpenAgent?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onStartCreating,
  onSignIn,
  onOpenPricing,
  onOpenAgent,
}) => {
  const { currency, setCurrency } = useLocale();

  // Active Interactive Demo Tab
  const [demoTab, setDemoTab] = useState<'idea' | 'script' | 'scenes' | 'thumbnail' | 'seo' | 'calendar'>('idea');
  // Target Audience Tab
  const [activeAudience, setActiveAudience] = useState<'youtube' | 'shorts' | 'business' | 'teachers' | 'marketing'>('shorts');
  // Trust Modals
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'contact' | 'pricing' | null>(null);

  // Track landing_view on mount
  useEffect(() => {
    analytics.track('landing_view', { page: 'home' });
  }, []);

  const handleStartFree = () => {
    analytics.track('start_free_clicked', { source: 'landing_cta' });
    onStartCreating();
  };

  const handleScrollToDemo = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 2. HOW IT WORKS WORKFLOW STAGES
  const workflowStages = [
    { id: 'idea', label: '1. IDEA', icon: Sparkles, color: 'text-amber-400', desc: 'Brainstorm hooks & premises' },
    { id: 'script', label: '2. SCRIPT', icon: FileText, color: 'text-blue-400', desc: 'Write retention screenplays' },
    { id: 'scenes', label: '3. SCENES', icon: Film, color: 'text-purple-400', desc: 'Storyboard camera shotlists' },
    { id: 'media', label: '4. MEDIA', icon: Video, color: 'text-rose-400', desc: 'Voiceover & visual prompt cues*' },
    { id: 'seo', label: '5. SEO', icon: Search, color: 'text-emerald-400', desc: 'High-CTR titles & hashtags' },
    { id: 'calendar', label: '6. CONTENT CALENDAR', icon: Calendar, color: 'text-cyan-400', desc: 'Day, week & month scheduling' },
  ];

  // 3. TARGET AUDIENCE USE CASES
  const audienceUseCases = {
    shorts: {
      title: 'Shorts & Reels Creators (Primary Launch Focus)',
      badge: 'Launch Audience',
      subtitle: 'Engineered for fast-paced 60-second vertical videos on YouTube Shorts, Instagram Reels, and TikTok.',
      benefits: [
        '3-second spoken hook formulas with auditory pattern interrupts',
        'Concise 15-second multi-scene shot breakdowns with camera dolly & zoom cues',
        'Thumbnails with bold 3-word impact headline overlays optimized for mobile feeds',
        'Direct multi-platform adaptation to publish the same idea across Shorts, Reels & TikTok',
      ],
      sampleOutput: '3-Act Short: "3 Mind-Blowing Facts About the Deep Ocean (Under 60s)"',
    },
    youtube: {
      title: 'Long-Form YouTube Creators',
      badge: 'High Retention',
      subtitle: 'Comprehensive multi-scene video blueprints for deep-dives, video essays, and documentaries.',
      benefits: [
        'Structured 3-to-15 minute screenplays with narrative chapter arcs',
        'Continuous scrolling teleprompter mode with dynamic word-count pacing',
        'Scene shotlists with lighting moods, camera angles, and b-roll asset tags',
        'Search-intent optimized titles and description tags tailored for YouTube search',
      ],
      sampleOutput: '10-Minute Video: "The Engineering Breakthrough Behind Next-Gen Robotics"',
    },
    business: {
      title: 'Small Businesses & Solopreneurs',
      badge: 'Authority & Growth',
      subtitle: 'Produce professional product showcases, client education, and brand authority content without agency costs.',
      benefits: [
        'Store your company Brand Kit (channel niche, tone of voice, recurring CTA)',
        'Turn product release notes or customer questions into educational video scripts',
        'Consistent social video cadence without spending hours brainstorming',
      ],
      sampleOutput: 'Product Launch Short: "How Our New Feature Cuts Workflow Time by 50%"',
    },
    teachers: {
      title: 'Teachers, Coaches & Educators',
      badge: 'Education First',
      subtitle: 'Break down complex academic topics, skills, and tutorials into structured, digestible lessons.',
      benefits: [
        'Simplify dense concepts into clear sequential beats',
        'Native multi-language localization (English, Hindi, Spanish, etc.)',
        'Visual identity continuity for recurring cartoon or realistic character teachers',
      ],
      sampleOutput: 'Lesson Short: "Why Does Ice Float on Water? (Physics in 45 Seconds)"',
    },
    marketing: {
      title: 'Marketing & Social Media Teams',
      badge: 'Campaign Velocity',
      subtitle: 'Coordinate multi-day social campaigns with unified calendars and exportable blueprints.',
      benefits: [
        'Publishable Shareable Templates to standardize winning formats across team members',
        'Centralized Content Calendar with clear production status workflow',
        'Pre-checked credit safety limits to protect marketing operational budgets',
      ],
      sampleOutput: 'Campaign Series: "7-Day Social Campaign for Creator Growth"',
    },
  };

  // 5. EXISTING CREATORNOVA CAPABILITIES
  const platformFeatures = [
    {
      title: 'AI Creator Agent',
      desc: 'Plan and execute multi-day content campaigns with upfront operation estimates and cost transparency.',
      icon: Bot,
      color: 'from-violet-500 to-indigo-500',
    },
    {
      title: 'Idea Generator',
      desc: 'Formulate viral premises, hook angles, audience psychology triggers, and core takeaways.',
      icon: Sparkles,
      color: 'from-amber-500 to-yellow-500',
    },
    {
      title: 'Script Writer',
      desc: 'Complete retention-engineered scripts with hook summaries, beat-by-beat directions, and teleprompter.',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Scene Generator',
      desc: 'Storyboard camera shotlists with shot types, lighting moods, character actions, and AI video prompts.',
      icon: Film,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'SEO Generator',
      desc: 'Generate searchable YouTube & social titles, high-retention hashtags, and keyword packs.',
      icon: Search,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Media Studio',
      desc: 'Timeline sequencing, multi-voice audio synthesis, and video render pipeline (*requires configured media providers).',
      icon: Video,
      color: 'from-rose-500 to-red-500',
    },
    {
      title: 'Content Calendar',
      desc: 'Day, Week, and Month scheduling dashboard with production status tags from Idea to Published.',
      icon: Calendar,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Brand Kit',
      desc: 'Save your recurring channel niche, visual aesthetic, recurring character descriptions, and default CTAs.',
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Repurposing Agent',
      desc: 'Transform long-form scripts into vertical Shorts or Reels, and cross-adapt English to Hindi or Spanish.',
      icon: Zap,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Shareable Templates',
      desc: 'Publish sanitized workflow blueprints to fellow creators and clone templates into your isolated workspace.',
      icon: Share2,
      color: 'from-indigo-500 to-violet-500',
    },
  ];

  // 6. PRICING PREVIEW (Configurable Launch / Test Plans)
  const pricingPlans = [
    {
      id: 'free',
      name: 'FREE',
      price: '₹0',
      period: 'forever',
      badge: 'Free Tier',
      popular: false,
      credits: '50 Credits / month',
      features: [
        '5 active project workspaces',
        'Idea Generator & Script Writer',
        'Scene Generator & camera shotlists',
        'SEO tags, titles & descriptions',
        'Content Calendar access',
        'No credit card required to start',
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '₹299',
      period: 'per month',
      badge: 'Essential',
      popular: false,
      credits: '1,000 Credits / month',
      features: [
        '50 active project workspaces',
        'Autonomous CreatorNova Agent',
        'Character Consistency Library',
        'Full Brand Kit profile memory',
        'Series Creator & multi-episode plans',
        'Priority script & teleprompter mode',
      ],
    },
    {
      id: 'creator',
      name: 'CREATOR',
      price: '₹799',
      period: 'per month',
      badge: 'Most Popular',
      popular: true,
      credits: '3,500 Credits / month',
      features: [
        'Unlimited project workspaces',
        'High-velocity content production',
        'Multi-language translation engine',
        'Repurposing Agent (Shorts ↔ Reels ↔ Long)',
        'Full Media Studio audio & shot pipeline',
        'Commercial project export formats',
      ],
    },
    {
      id: 'business',
      name: 'BUSINESS',
      price: '₹1,999',
      period: 'per month',
      badge: 'Scale & Teams',
      popular: false,
      credits: '10,000 Credits / month',
      features: [
        'Highest priority execution allocation',
        'Multi-channel Brand Kit architecture',
        'Shareable template collaboration',
        'Direct JSON & Markdown data portability',
        'Extended audio and video operations quota',
        'Dedicated onboarding support',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-600/30 overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg text-white tracking-tight block">
                CreatorNova AI
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                All-In-One Creator Workspace
              </span>
            </div>
          </div>

          {/* Nav Links & Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleScrollToDemo}
              className="hidden md:inline-flex text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveModal('pricing')}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            {onSignIn && (
              <button
                onClick={onSignIn}
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button
              onClick={handleStartFree}
              className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer min-h-[40px]"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Clean badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/70 border border-violet-500/30 text-violet-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Launch Edition • Free Account Setup</span>
        </div>

        {/* Main Headline (Requirement 1) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Turn One Idea Into Your Complete Content Workflow
        </h1>

        {/* Subheadline (Requirement 1) */}
        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Plan, write, organize and create content with one AI-powered creator workspace.
        </p>

        {/* CTAs (Requirement 1) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={handleStartFree}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-black text-sm sm:text-base shadow-xl shadow-violet-600/30 transition-all cursor-pointer min-h-[48px]"
          >
            <span>Start Creating Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleScrollToDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm sm:text-base transition-all cursor-pointer min-h-[48px]"
          >
            <Play className="w-4 h-4 text-violet-400" />
            <span>See How It Works</span>
          </button>
        </div>

        {/* Responsible Transparency Badges (No unsupported guarantees) */}
        <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>50 Free Credits on Signup</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>No Credit Card Required</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transparent Plan Economics</span>
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. HOW IT WORKS (Visual Workflow: IDEA -> SCRIPT -> SCENES -> MEDIA -> SEO -> CALENDAR) */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works-section" className="px-4 sm:px-6 lg:px-8 py-14 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
            Clear Production Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">How It Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Move step-by-step from an initial spark into a fully structured production schedule.
          </p>
        </div>

        {/* Visual Workflow Steps (Requirement 2) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflowStages.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={st.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 relative group hover:border-violet-500/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${st.color}`} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">0{i + 1}</span>
                  </div>
                  <h3 className="font-black text-xs text-white tracking-wide">{st.label}</h3>
                  <p className="text-[11px] text-slate-400 leading-snug">{st.desc}</p>
                </div>
                {i < 5 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 font-bold text-xs pointer-events-none">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 text-center max-w-2xl mx-auto">
          <span className="font-semibold text-slate-300">* Note on Media Generation:</span> Script, scene shotlists, thumbnail formulas, and calendar plans run natively inside CreatorNova. Actual AI video/image rendering depends on configured neural media providers.
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. PRODUCT DEMO SECTION (Interactive Preview) */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-5xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
          {/* Demo Prompt Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider block">
                Interactive Preview
              </span>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>"Create a 7-day YouTube Shorts plan about space."</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                7 Shorts Planned • 60s Format
              </span>
            </div>
          </div>

          {/* Demo Stage Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/60">
            {[
              { id: 'idea', label: 'Ideas & Hooks', icon: Sparkles },
              { id: 'script', label: 'Screenplay Script', icon: FileText },
              { id: 'scenes', label: 'Scene Shotlist', icon: Film },
              { id: 'thumbnail', label: 'Thumbnail Strategy', icon: ImageIcon },
              { id: 'seo', label: 'SEO Metadata', icon: Search },
              { id: 'calendar', label: 'Calendar Release', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = demoTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDemoTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Demo Component Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 text-xs">
            {demoTab === 'idea' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white uppercase text-[11px]">Curated Viral Concepts</span>
                  <span className="font-mono text-emerald-400">Target Virality: 92/100</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">Day 1: The 3,000-ft Vampire Squid Mystery</strong>
                      <span className="text-[10px] bg-violet-950 text-violet-300 px-2 py-0.5 rounded font-mono">Curiosity Gap</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Hook: "This creature turns its body completely inside out when it senses danger in the pitch black ocean..."
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">Day 2: What NASA Heard at the Black Hole's Event Horizon</strong>
                      <span className="text-[10px] bg-violet-950 text-violet-300 px-2 py-0.5 rounded font-mono">Pattern Interrupt</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Hook: "Everyone thinks space is silent. But in 2022, NASA turned black hole acoustic waves into audio..."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {demoTab === 'script' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white uppercase text-[11px]">Day 1 Teleprompter Script (58 Seconds)</span>
                  <span className="font-mono text-slate-300">142 Spoken Words</span>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-mono text-[11px] leading-relaxed">
                  <p className="text-violet-300 font-bold">[0:00 - 0:04] HOOK (Fast Delivery, Eye Contact):</p>
                  <p className="text-white">"Stop scrolling, because 3,000 feet beneath the Pacific surface, this creature is watching you with the largest eyes in the animal kingdom relative to its body."</p>
                  <p className="text-amber-300 font-bold pt-1">[0:05 - 0:38] CORE INSIGHT (Rapid Beat Progression):</p>
                  <p className="text-slate-300">"Scientists call it the Vampire Squid from Hell, but it doesn't drink blood. Instead, it creates bioluminescent fireballs at the tips of its tentacles to blind predators before vanishing into the midnight zone."</p>
                  <p className="text-cyan-300 font-bold pt-1">[0:39 - 0:58] CALL TO ACTION:</p>
                  <p className="text-slate-300">"Drop a comment if you'd ever dare dive this deep, and follow for Day 2 of our Deep Sea series."</p>
                </div>
              </div>
            )}

            {demoTab === 'scenes' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white uppercase text-[11px]">Production Storyboard Shots</span>
                  <span className="font-mono text-slate-300">3 Planned Scenes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-violet-400 font-mono font-bold">Scene 1 (0:00 - 0:04)</span>
                    <strong className="text-white block">Close-Up Eye Focus</strong>
                    <p className="text-slate-400 text-[11px]">Dynamic push-in with electric cyan rim light reflecting off dark deep ocean water.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-violet-400 font-mono font-bold">Scene 2 (0:05 - 0:38)</span>
                    <strong className="text-white block">Wide Bioluminescence</strong>
                    <p className="text-slate-400 text-[11px]">Squid curls tentacles inward showing glowing blue organ points against the abyss.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-violet-400 font-mono font-bold">Scene 3 (0:39 - 0:58)</span>
                    <strong className="text-white block">Host Teleprompter Outro</strong>
                    <p className="text-slate-400 text-[11px]">Creator split-screen commentary with graphic badge overlay asking for subscriber comments.</p>
                  </div>
                </div>
              </div>
            )}

            {demoTab === 'thumbnail' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white uppercase text-[11px]">High-CTR Visual Strategy (12%+ CTR Formula)</span>
                  <span className="font-mono text-pink-400">Vertical (9:16)</span>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Bold 3-Word Headline:</span>
                    <span className="text-sm font-black text-amber-300">DO NOT LOOK</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-white">Psychological Trigger:</strong> Extreme loss aversion & curiosity gap. Neon cyan typography over pitch obsidian ocean floor with luminous glowing subject.
                  </p>
                </div>
              </div>
            )}

            {demoTab === 'seo' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white uppercase text-[11px]">Ranked Search Metadata Suite</span>
                  <span className="font-mono text-emerald-400">SEO Health: 94/100</span>
                </div>
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Title:</span>
                    <strong className="text-white">The 3,000-ft Deep Sea Monster That Turns Inside Out #Shorts</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Hashtags:</span>
                    <span className="text-violet-300 font-mono text-[11px]">#DeepSea #OceanMysteries #ScienceFacts #YouTubeShorts #Shorts</span>
                  </div>
                </div>
              </div>
            )}

            {demoTab === 'calendar' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-white uppercase text-[11px]">7-Day Content Schedule Timeline</span>
                  <span className="font-mono text-cyan-400">Daily Pacing</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 font-mono">Day 1 (Mon)</div>
                    <div className="text-white font-bold truncate">Vampire Squid</div>
                    <span className="text-[9px] text-emerald-400">Ready</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 font-mono">Day 2 (Tue)</div>
                    <div className="text-white font-bold truncate">NASA Black Hole</div>
                    <span className="text-[9px] text-emerald-400">Ready</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 font-mono">Day 3 (Wed)</div>
                    <div className="text-white font-bold truncate">Gulper Eel Trap</div>
                    <span className="text-[9px] text-amber-400">Script Ready</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 font-mono">Day 4-7 (Thu-Sun)</div>
                    <div className="text-white font-bold truncate">Space Arc Series</div>
                    <span className="text-[9px] text-violet-400">Scheduled</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. TARGET USERS & USE CASES */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
            Tailored For Modern Creators
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Who CreatorNova Is Built For</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            From solo YouTube and short-form creators to businesses and educators.
          </p>
        </div>

        {/* Audience Selector Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-wrap">
          {[
            { id: 'shorts', label: 'Shorts & Reels Creators', icon: Video },
            { id: 'youtube', label: 'YouTube Creators', icon: Film },
            { id: 'business', label: 'Small Businesses', icon: Briefcase },
            { id: 'teachers', label: 'Teachers & Coaches', icon: GraduationCap },
            { id: 'marketing', label: 'Marketing Teams', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeAudience === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveAudience(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Audience Detail Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 max-w-3xl mx-auto shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{audienceUseCases[activeAudience].title}</h3>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800/40">
                  {audienceUseCases[activeAudience].badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{audienceUseCases[activeAudience].subtitle}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Key Workflow Advantages</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {audienceUseCases[activeAudience].benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-850">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-violet-950/40 border border-violet-800/40 rounded-xl flex items-center justify-between gap-3">
            <span className="text-xs text-violet-200">
              Sample Plan: <strong>{audienceUseCases[activeAudience].sampleOutput}</strong>
            </span>
            <button
              onClick={handleStartFree}
              className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Build this workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. FEATURE SECTION (CreatorNova Core Capabilities) */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
            All-In-One Toolkit
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Full-Stack Creator Capabilities</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Every feature is integrated into a unified project library and credits wallet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {platformFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">{f.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. PRICING PREVIEW */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto space-y-8 bg-slate-900/40 border-y border-slate-800/80">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">
            Clear Launch Plans
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Simple, Predictable Plans</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Start free with 50 monthly credits. Upgrade only when you are ready to scale production.
          </p>
        </div>

        {/* Pricing Cards (Requirement 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'bg-slate-900 border-violet-500 shadow-xl shadow-violet-900/30'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-750'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase">{plan.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    plan.popular
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {plan.badge}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-3xl font-black text-white font-mono">{plan.price}</div>
                  <div className="text-[11px] text-slate-500">{plan.period}</div>
                </div>

                <div className="text-xs font-mono font-bold text-violet-300 bg-violet-950/40 px-3 py-1.5 rounded-xl border border-violet-800/40">
                  {plan.credits}
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-300 leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  onClick={handleStartFree}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    plan.popular
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  Start Free
                </button>
                {plan.id !== 'free' && (
                  <span className="text-[10px] text-slate-500 text-center block">
                    Paid plans coming soon / Payment setup required
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. TRUST + FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-800/80 px-4 sm:px-8 py-10 max-w-7xl mx-auto text-xs text-slate-400 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">CreatorNova AI</span>
            <span>—</span>
            <span>All-in-one AI creator workspace</span>
          </div>

          {/* Placeholders for Privacy, Terms, Contact, Pricing */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveModal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveModal('contact')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact Support
            </button>
            <button
              onClick={() => setActiveModal('pricing')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Pricing Details
            </button>
          </div>
        </div>

        <div className="text-center sm:text-left text-[11px] text-slate-500 pt-4 border-t border-slate-850">
          <p>© 2026 CreatorNova AI. Content workspace architecture for independent video and social creators.</p>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* INFORMATIONAL TRUST MODAL (Privacy, Terms, Contact, Pricing) */}
      {/* ------------------------------------------------------------- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white capitalize">
                {activeModal === 'privacy' && 'CreatorNova Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'contact' && 'Contact & Support'}
                {activeModal === 'pricing' && 'Pricing & Credit Policy'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {activeModal === 'privacy' && (
                <>
                  <p>
                    <strong>Data Isolation & Confidentiality:</strong> CreatorNova AI does not sell or distribute your private scripts, project concepts, or brand assets to third-party advertising networks.
                  </p>
                  <p>
                    <strong>Template Sharing Privacy:</strong> Public templates never expose your Firebase UID, email address, private media files, credit balances, or billing records. Only explicitly selected public titles and scene structures are shared.
                  </p>
                  <p>
                    <strong>Analytics:</strong> All product lifecycle events are privacy-conscious and anonymized, tracking navigation counts without capturing prompt copy or user secrets.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>
                    <strong>Creator Ownership:</strong> You retain complete intellectual ownership of all ideas, scripts, storyboard shotlists, and project assets formulated in your CreatorNova workspace.
                  </p>
                  <p>
                    <strong>Usage Policy:</strong> CreatorNova credits represent units of compute utilized across scripting, teleprompter, thumbnail design, and scene breakdowns. Credits possess no monetary surrender value.
                  </p>
                  <p>
                    <strong>Neural Generation Disclaimer:</strong> Third-party video generation, voice synthesis, and neural image operations depend strictly on configured external providers.
                  </p>
                </>
              )}

              {activeModal === 'contact' && (
                <>
                  <p>
                    <strong>Creator Support:</strong> Need assistance calibrating your Brand Kit, planning an episodic series, or configuring credit allowances?
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                    <div>Support: support@creatornova.ai</div>
                    <div>Developer Portal: https://creatornova.ai/help</div>
                    <div>Status: Live Application Runtime Active</div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Our team responds to all creator inquiries within 1 business day.
                  </p>
                </>
              )}

              {activeModal === 'pricing' && (
                <>
                  <p>
                    <strong>Free Tier Access:</strong> Every creator receives 50 free credits upon account registration to test idea generation, screenplays, scene camera shotlists, and SEO packs.
                  </p>
                  <p>
                    <strong>Payment Setup Status:</strong> Paid plans are shown for launch preview and cost transparency. No automated card charges occur unless an authoritative payment gateway is explicitly connected.
                  </p>
                  <p>
                    <strong>Credit Economy:</strong> Idea generation (1 credit), Full scripts (2 credits), SEO suites (2 credits), Scene breakdowns (3 credits), and 4K thumbnail formulas (5 credits).
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
