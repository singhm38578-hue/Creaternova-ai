import React, { useState } from 'react';
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
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Video,
  ChevronDown,
  ChevronUp,
  Coins,
  Globe,
  Star
} from 'lucide-react';
import { useLocale, SUPPORTED_CURRENCIES, SUPPORTED_UI_LANGUAGES } from '../contexts/LocaleContext';

interface LandingPageViewProps {
  onStartCreating: () => void;
  onOpenPricing: () => void;
  onOpenAgent: () => void;
  onSelectPlatform?: (platform: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onStartCreating,
  onOpenPricing,
  onOpenAgent,
}) => {
  const { currency, currencySymbol, setCurrency, uiLanguage, setUiLanguage, t } = useLocale();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('YouTube Shorts');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const platforms = [
    { id: 'YouTube Shorts', name: 'YouTube Shorts', icon: '🔴', tag: 'Fast Vertical' },
    { id: 'Instagram Reels', name: 'Instagram Reels', icon: '📸', tag: 'High Aesthetic' },
    { id: 'TikTok', name: 'TikTok', icon: '🎵', tag: 'Trend Engineered' },
    { id: 'YouTube Long Video', name: 'YouTube Long Video', icon: '🎬', tag: 'High Retention' },
  ];

  const workflowSteps = [
    {
      title: '1. Natural Language Command',
      icon: '💬',
      desc: 'Tell CreatorNova what you want to make — from a single Short to a 30-day episodic series.',
      previewText: '"Create a 7-day YouTube Shorts series on weird deep sea creatures using my Brand Kit and character Dr. Nova."',
    },
    {
      title: '2. Plan Before Execution',
      icon: '📋',
      desc: 'The agent presents an upfront execution plan with estimated operations and credit costs before generating anything.',
      previewText: 'Goal: 7 Shorts | Platform: YouTube Shorts | Estimated Credits: 14 | Expected: 7 scripts, 21 scenes, 7 SEO packs',
    },
    {
      title: '3. Multi-Content Production',
      icon: '⚡',
      desc: 'High-conversion hooks, full teleprompter scripts, scene camera shotlists, and 12% CTR thumbnail concepts.',
      previewText: 'Day 1: "The 3,000-ft Vampire Squid" | Day 2: "Deep-Sea Gulper Eel Mystery" | Day 3: "Bioluminescent Nightmares"',
    },
    {
      title: '4. Calendar & Repurposing',
      icon: '📅',
      desc: 'Direct sync to Day, Week, and Month content calendars, plus 1-click cross-platform transformation.',
      previewText: 'Scheduled for release across next 7 days • Repurposed into Instagram Reels and TikTok captions.',
    },
  ];

  const features = [
    {
      icon: Bot,
      color: 'from-violet-500 to-indigo-500',
      title: 'Autonomous Creator Agent',
      desc: 'Understands requests in plain language, produces upfront plans, and generates entire multi-day campaigns.',
    },
    {
      icon: Calendar,
      color: 'from-cyan-500 to-blue-500',
      title: 'Smart Content Calendar',
      desc: 'Day, Week, and Month views with status workflows (Idea, Script Ready, Media Pending, Ready, Published).',
    },
    {
      icon: Layers,
      color: 'from-purple-500 to-pink-500',
      title: 'Series Creator',
      desc: 'Build cohesive 5-to-30 episode series with consistent narratives, episode numbering, and recurring themes.',
    },
    {
      icon: Palette,
      color: 'from-amber-500 to-orange-500',
      title: 'Character Consistency Library',
      desc: 'Store visual descriptions, wardrobe, and voice tone so scene prompts remain consistent across every video.',
    },
    {
      icon: Zap,
      color: 'from-emerald-500 to-teal-500',
      title: 'Repurposing Agent',
      desc: 'Adapt long-form videos into high-retention Shorts, YouTube to TikTok, and English to Hindi or Spanish.',
    },
    {
      icon: ShieldCheck,
      color: 'from-rose-500 to-red-500',
      title: 'Human-in-the-Loop Approval',
      desc: 'Zero surprise credit deductions. High-cost generations and sensitive actions require upfront confirmation.',
    },
  ];

  const faqs = [
    {
      q: 'What is CreatorNova AI Agent?',
      a: 'CreatorNova AI Agent is your autonomous studio assistant. Simply type or speak what content you want to create (e.g. "Create 7 days of space shorts"), and it plans, scripts, creates camera shotlists, optimizes SEO, and schedules everything on your Content Calendar.',
    },
    {
      q: 'How does India pricing work?',
      a: 'For creators in India, pricing is displayed directly in Indian Rupees (₹) starting at ₹0 for Free, ₹299/mo for Pro, ₹799/mo for Creator (Most Popular), and ₹1,999/mo for Business. Subscriptions support future UPI, Cards, Net Banking, and wallet integration.',
    },
    {
      q: 'Can I use international currencies?',
      a: 'Yes! CreatorNova has a global currency architecture supporting INR (₹), USD ($), EUR (€), GBP (£), and JPY (¥) with configured regional price tables rather than simple naive exchange rates.',
    },
    {
      q: 'Will the Agent charge credits without my permission?',
      a: 'Never. CreatorNova strictly enforces "Plan Before Execution" and "Human Approval". You inspect the exact goal, estimated operations, and credit costs before confirming any generation.',
    },
    {
      q: 'Can I keep my recurring characters consistent in videos?',
      a: 'Yes! The Character Library lets you save your recurring hosts (like Dr. Nova) with visual descriptions, signature outfits, colors, and personality. When generating scene breakdown prompts, CreatorNova automatically weaves these attributes in.',
    },
    {
      q: 'What happens if background processing is not configured?',
      a: 'CreatorNova processes all supported AI agent tasks directly. Unsupported external background queues are clearly marked with "Background processing integration required" with no fake progress indicators.',
    },
  ];

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 selection:bg-violet-500/30">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg text-white tracking-tight">CreatorNova AI</span>
            <span className="ml-2 text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
              Agent Edition
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:border-slate-600"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          {/* UI Language Switcher */}
          <select
            value={uiLanguage}
            onChange={(e) => setUiLanguage(e.target.value as any)}
            className="hidden sm:block bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:border-slate-600"
          >
            {SUPPORTED_UI_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.native}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenPricing}
            className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t('viewPricing')}
          </button>

          <button
            onClick={onStartCreating}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2 rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <span>{t('startFree')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-16 pb-20 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-bold shadow-inner">
          <Bot className="w-4 h-4 text-violet-400 animate-pulse" />
          <span>Next-Generation Autonomous Content Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
          {t('heroTitle')}
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          {t('heroSubtitle')}
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartCreating}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-black text-base shadow-xl shadow-violet-600/40 hover:shadow-violet-600/60 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>{t('startFree')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenAgent}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700 font-bold text-base transition-all cursor-pointer"
          >
            <Bot className="w-5 h-5 text-violet-400" />
            <span>{t('watchDemo')}</span>
          </button>
        </div>

        {/* Pricing snippet banner */}
        <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Free Tier Available ({currencySymbol}0/mo)</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pro at just {currencySymbol === '₹' ? '₹299' : `${currencySymbol}9`}/month</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>No Credit Card Required To Test</span>
          </span>
        </div>
      </section>

      {/* Platform Selector & Interactive Workflow Demo */}
      <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Engineered For Every Social Platform</h2>
          <p className="text-sm text-slate-400">Select your target channel to see tailored retention formulas in action</p>
        </div>

        {/* Platform Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedPlatform === p.id
                  ? 'bg-violet-950/60 border-violet-500 shadow-xl shadow-violet-900/30'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-2xl mb-1">{p.icon}</div>
              <div className="font-bold text-white text-sm">{p.name}</div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">{p.tag}</span>
            </button>
          ))}
        </div>

        {/* Interactive Studio Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-black text-lg text-white">Interactive Creator Workflow</h3>
              </div>
              <p className="text-xs text-slate-400">Step-by-step pipeline from prompt to published calendar release</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-400 bg-violet-950/60 border border-violet-800/60 px-3 py-1 rounded-full">
                Active: {selectedPlatform}
              </span>
            </div>
          </div>

          {/* Workflow Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {workflowSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeWorkflowStep === idx
                    ? 'bg-slate-850 border-violet-500 shadow-md text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xl mb-1">{step.icon}</div>
                <div className="font-bold text-xs">{step.title}</div>
              </button>
            ))}
          </div>

          {/* Active Step Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-bold text-violet-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{workflowSteps[activeWorkflowStep].desc}</span>
            </div>
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-750 font-mono text-xs text-slate-200 leading-relaxed">
              {workflowSteps[activeWorkflowStep].previewText}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">Integrated with Brand Kit & Character consistency memory</span>
              <button
                onClick={onStartCreating}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Try this workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 sm:px-8 py-16 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white">Full-Stack Production Suite</h2>
          <p className="text-sm text-slate-400">
            Every tool is designed to work in synergy — your Brand Kit informs the Agent, characters remain consistent across scenes, and scripts flow seamlessly into teleprompter and video prompts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl space-y-3 transition-all hover:shadow-xl group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Social Proof / Metrics */}
      <section className="px-4 sm:px-8 py-12 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">10x</div>
            <div className="text-xs text-slate-400">Faster Content Velocity</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-violet-400 font-mono">100%</div>
            <div className="text-xs text-slate-400">Character Consistency</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-pink-400 font-mono">12%+</div>
            <div className="text-xs text-slate-400">Target Thumbnail CTR</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">0</div>
            <div className="text-xs text-slate-400">Surprise Generation Charges</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-8 py-16 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">Everything you need to know about CreatorNova AI and our transparent pricing</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = expandedFaq === i;
            return (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-violet-300 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-violet-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-700/50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Build Your Content Empire?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Join thousands of creators using CreatorNova AI Agent to plan, write, and execute daily content without burnout.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onStartCreating}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm shadow-xl transition-all cursor-pointer"
            >
              Start Free Today ({currencySymbol}0/month)
            </button>
            <button
              onClick={onOpenPricing}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              View Compare Plans
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-4 sm:px-8 py-8 text-center text-xs text-slate-500">
        <p>© 2026 CreatorNova AI. Autonomous Content Production Engine. Designed for creators worldwide.</p>
      </footer>
    </div>
  );
};
