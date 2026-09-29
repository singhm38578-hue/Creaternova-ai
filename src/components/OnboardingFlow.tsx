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
  FileText,
  AlertCircle
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

  // Loading & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'launch' | 'skip' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
    if (isSubmitting) return;

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setValidationError('Please enter a topic or video idea to create your first project.');
      return;
    }

    setIsSubmitting(true);
    setSubmitAction('launch');
    setErrorMessage(null);
    setValidationError(null);

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
        }).catch((e) => {
          console.warn('BrandKit update non-critical warning:', e);
        });
      }

      analytics.track('onboarding_completed', {
        creationType,
        language,
        goalsCount: selectedGoals.length,
      });

      await onComplete({
        creationType,
        language,
        goals: selectedGoals,
        topic: trimmedTopic,
      });
    } catch (err: any) {
      console.error('Error completing onboarding and creating project:', err);
      setErrorMessage(err?.message || 'Failed to complete project setup. Please tap Launch First Project again.');
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitAction('skip');
    setErrorMessage(null);
    setValidationError(null);

    try {
      if (user) {
        await updateProfile({
          onboardingCompleted: true,
        });
      }
    } catch (e: any) {
      console.error('Error marking onboarding skipped:', e);
    }

    analytics.track('onboarding_completed', {
      skipped: true,
    });

    try {
      if (onSkip) {
        await onSkip();
      } else {
        onComplete({
          creationType,
          language,
          goals: selectedGoals,
          topic: 'My First Content Project',
        });
      }
    } catch (navErr: any) {
      console.error('Navigation error on skip:', navErr);
      setErrorMessage('Could not open Studio Hub. Please try tapping Skip for now again.');
      setIsSubmitting(false);
      setSubmitAction(null);
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
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 relative z-10 touch-manipulation"
          >
            {isSubmitting && submitAction === 'skip' && (
              <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            )}
            <span>Skip for now</span>
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
                disabled={isSubmitting}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g., 5 Mind-Blowing Facts About Space"
                className={`w-full bg-slate-950 border ${
                  validationError ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60`}
              />
              {validationError && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            {/* General Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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
                    disabled={isSubmitting}
                    onClick={() => {
                      setTopic(sug);
                      if (validationError) setValidationError(null);
                    }}
                    className="text-[11px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer disabled:opacity-50 touch-manipulation"
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

            <div className="pt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={isSubmitting}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              >
                ← Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center gap-1.5"
                >
                  {isSubmitting && submitAction === 'skip' && (
                    <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Skip for now</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs sm:text-sm font-black shadow-xl shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation relative z-10"
                >
                  {isSubmitting && submitAction === 'launch' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Setting up Studio...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch First Project</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
