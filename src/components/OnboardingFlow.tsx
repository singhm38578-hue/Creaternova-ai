import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Video,
  PlaySquare,
  Briefcase,
  GraduationCap,
  Share2,
  Target,
  Zap,
  Layers,
  Calendar,
  Lightbulb,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../services/analytics';

interface OnboardingFlowProps {
  onComplete: (preferences: {
    creationType: string;
    language: string;
    goals: string[];
    topic: string;
  }) => void;
  onSkip?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const { user, updateProfile, updateBrandKit } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: What do you create? (YouTube, Shorts/Reels, Business Content, Educational Content, Other)
  const [creationType, setCreationType] = useState('Shorts/Reels');

  // Step 2: Language
  const [language, setLanguage] = useState('English');

  // Step 3: What is your main goal? (Create faster, Get content ideas, Create consistent content, Repurpose content, Plan my content)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Create faster',
    'Get content ideas',
  ]);

  // Step 4: First project topic or idea
  const [topic, setTopic] = useState('5 Mind-Blowing Facts About Space');

  // Track onboarding_started on mount
  useEffect(() => {
    analytics.track('onboarding_started', {
      userRole: user?.role || 'user',
    });
  }, [user]);

  // Step 1 Options
  const creationOptions = [
    {
      id: 'YouTube',
      label: 'YouTube',
      subtitle: 'Long-form videos, documentaries & in-depth series',
      icon: Video,
    },
    {
      id: 'Shorts/Reels',
      label: 'Shorts/Reels',
      subtitle: 'Fast-paced 60s vertical retention for YouTube Shorts, Reels & TikTok',
      icon: PlaySquare,
    },
    {
      id: 'Business Content',
      label: 'Business Content',
      subtitle: 'Product walkthroughs, customer explainers & brand marketing',
      icon: Briefcase,
    },
    {
      id: 'Educational Content',
      label: 'Educational Content',
      subtitle: 'Structured tutorials, online coaching, and masterclass lessons',
      icon: GraduationCap,
    },
    {
      id: 'Other',
      label: 'Other',
      subtitle: 'Multi-platform omni-presence, podcast clips & custom formats',
      icon: Share2,
    },
  ];

  // Step 2 Languages
  const languageOptions = [
    'English',
    'Hindi',
    'Spanish',
    'Portuguese',
    'French',
    'German',
    'Japanese',
    'Korean',
    'Arabic',
  ];

  // Step 3 Goals
  const goalOptions = [
    {
      id: 'Create faster',
      label: 'Create faster',
      subtitle: 'Accelerate scripts and camera shot breakdowns with AI assistance',
      icon: Zap,
    },
    {
      id: 'Get content ideas',
      label: 'Get content ideas',
      subtitle: 'Brainstorm viral hooks and unique video premises effortlessly',
      icon: Sparkles,
    },
    {
      id: 'Create consistent content',
      label: 'Create consistent content',
      subtitle: 'Build a repeatable workflow and never miss an upload date',
      icon: Target,
    },
    {
      id: 'Repurpose content',
      label: 'Repurpose content',
      subtitle: 'Turn long-form videos into multi-platform Shorts & translations',
      icon: Layers,
    },
    {
      id: 'Plan my content',
      label: 'Plan my content',
      subtitle: 'Organize your weekly and monthly release calendar in one place',
      icon: Calendar,
    },
  ];

  const quickTopicSuggestions = [
    '5 Mind-Blowing Facts About Space',
    'Top 3 Daily Productivity Habits for Creators',
    'How Remote Work is Transforming Cities',
    'The Secret Science Behind Deep Ocean Creatures',
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleFinish = async () => {
    const finalTopic = topic.trim() || 'My First Content Project';
    try {
      if (user) {
        await updateProfile({
          defaultPlatform:
            creationType === 'Shorts/Reels'
              ? 'YouTube Shorts'
              : creationType === 'YouTube'
              ? 'YouTube Long Video'
              : creationType,
          preferredLanguage: language,
          defaultContentLanguage: language,
          creatorNiche: creationType,
          onboardingCompleted: true,
        });

        await updateBrandKit({
          preferredLanguage: language,
          channelNiche: creationType,
        });
      }
    } catch (e) {
      console.error('Error saving onboarding profile:', e);
    }

    analytics.track('onboarding_completed', {
      creationType,
      language,
      goalsCount: selectedGoals.length,
    });

    onComplete({
      creationType,
      language,
      goals: selectedGoals,
      topic: finalTopic,
    });
  };

  const handleSkip = async () => {
    try {
      if (user) {
        await updateProfile({
          onboardingCompleted: true,
        });
      }
    } catch (e) {
      console.error('Error marking onboarding skipped:', e);
    }

    analytics.track('onboarding_completed', {
      skipped: true,
    });

    if (onSkip) {
      onSkip();
    } else {
      onComplete({
        creationType,
        language,
        goals: selectedGoals,
        topic: 'My First Content Project',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl p-5 sm:p-8 space-y-6 relative overflow-hidden my-auto">
        {/* Ambient violet glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step indicator & Skip for now */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950/80 px-2.5 py-1 rounded-full border border-violet-800/40">
              Step {currentStep} of 4
            </span>
            <span className="text-xs text-slate-400 font-medium">Quick Workspace Setup</span>
          </div>

          <button
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Skip for now
          </button>
        </div>

        {/* STEP 1: What do you create? */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>What do you create?</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Choose your primary content medium so we can adapt script pacing and shot templates.
              </p>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {creationOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = creationType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCreationType(opt.id)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 shadow-md shadow-violet-600/20 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{opt.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose preferred content language */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Choose preferred content language
              </h2>
              <p className="text-xs text-slate-400">
                CreatorNova will draft hooks, screenplay dialogue, and metadata natively in this language.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {languageOptions.map((lang) => {
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: What is your main goal? */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                What is your main goal?
              </h2>
              <p className="text-xs text-slate-400">
                Select your focus areas so we can personalize your workspace prompts and shortcuts.
              </p>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {goalOptions.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 shadow-md shadow-violet-600/20 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                        <span>{goal.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{goal.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Create First Project (Ask for Topic or idea) */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Create First Project</span>
                <FileText className="w-5 h-5 text-violet-400" />
              </h2>
              <p className="text-xs text-slate-400">
                What topic or video idea would you like to build first?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Topic or Idea
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 5 Mind-Blowing Facts About Space"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Quick Inspiration suggestions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Or click an idea to start:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTopicSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(sug)}
                    className="text-[11px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Info */}
            <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl text-[11px] text-slate-300 flex items-center justify-between gap-2">
              <div>
                Platform: <strong className="text-white">{creationType}</strong> • Language: <strong className="text-white">{language}</strong>
              </div>
              <span className="text-emerald-400 font-mono font-bold shrink-0">50 Credits Free</span>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs sm:text-sm font-black shadow-xl shadow-violet-600/30 transition-all cursor-pointer"
              >
                <span>Launch First Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
