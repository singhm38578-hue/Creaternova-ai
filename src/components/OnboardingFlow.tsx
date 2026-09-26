import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Video,
  PlaySquare,
  Instagram,
  Flame,
  Briefcase,
  Baby,
  Share2,
  Target,
  Zap,
  Search,
  Clapperboard,
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingFlowProps {
  onComplete: (preferences: {
    creationType: string;
    language: string;
    goals: string[];
  }) => void;
  onSkip?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const { user, updateProfile, updateBrandKit } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: What do you create?
  const [creationType, setCreationType] = useState('Shorts');

  // Step 2: Language
  const [language, setLanguage] = useState('English');

  // Step 3: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Grow audience',
    'Create faster',
  ]);

  const creationOptions = [
    { id: 'YouTube', label: 'YouTube Long', icon: Video, desc: '16:9 deep dives & series' },
    { id: 'Shorts', label: 'YouTube Shorts', icon: PlaySquare, desc: 'Viral 60s vertical retention' },
    { id: 'Reels', label: 'Instagram Reels', icon: Instagram, desc: 'Aesthetic high-engagement' },
    { id: 'TikTok', label: 'TikTok', icon: Flame, desc: 'Fast trends & hooks' },
    { id: 'Business Content', label: 'Business & SaaS', icon: Briefcase, desc: 'Product demos & authority' },
    { id: 'Kids Content', label: 'Kids & Family', icon: Baby, desc: 'Fun songs, colors & rhymes' },
    { id: 'Other', label: 'Multi-Platform', icon: Share2, desc: 'Cross-platform omni-presence' },
  ];

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

  const goalOptions = [
    { id: 'Grow audience', label: 'Grow audience & subscribers', icon: Target },
    { id: 'Create faster', label: 'Create 10x faster with AI scripts & shots', icon: Zap },
    { id: 'Improve SEO', label: 'Improve YouTube search ranking & CTR', icon: Search },
    { id: 'Generate videos', label: 'Generate automated scenes & voiceovers', icon: Clapperboard },
    { id: 'Manage multiple channels', label: 'Manage multiple channels & niches', icon: Layers },
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleFinish = async () => {
    try {
      if (user) {
        await updateProfile({
          defaultPlatform: creationType === 'Shorts' ? 'YouTube Shorts' : creationType === 'Reels' ? 'Instagram Reels' : 'YouTube Long Video',
          preferredLanguage: language,
          defaultContentLanguage: language,
          onboardingCompleted: true,
        });

        await updateBrandKit({
          preferredLanguage: language,
        });
      }
    } catch (e) {
      console.error(e);
    }

    onComplete({
      creationType,
      language,
      goals: selectedGoals,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950/80 px-2.5 py-1 rounded-full border border-violet-800/40">
              Step {currentStep} of 4
            </span>
            <span className="text-xs text-slate-400">Onboarding Setup</span>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Step 1: What do you create? */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Welcome to CreatorNova AI</span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h2>
              <p className="text-xs text-slate-400">
                Step 1: What kind of content do you primarily create?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {creationOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = creationType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCreationType(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 shadow-md shadow-violet-600/20 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{opt.label}</div>
                      <p className="text-[11px] text-slate-400">{opt.desc}</p>
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

        {/* Step 2: Language */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Select Primary Language
              </h2>
              <p className="text-xs text-slate-400">
                Step 2: CreatorNova AI will generate native voiceover scripts, dialogue, and metadata in this language.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
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
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
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

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                What are your creator goals?
              </h2>
              <p className="text-xs text-slate-400">
                Step 3: Select all that apply to calibrate your workflow recommendations.
              </p>
            </div>

            <div className="space-y-2">
              {goalOptions.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold">{goal.label}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-700'}`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
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

        {/* Step 4: Ready to Create */}
        {currentStep === 4 && (
          <div className="space-y-6 text-center animate-in fade-in py-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-pink-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-violet-600/30 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Your Studio Workspace is Ready!
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We've configured your default platform to <strong className="text-white">{creationType}</strong> and language to <strong className="text-white">{language}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 max-w-md mx-auto">
              <div className="text-[11px] font-bold uppercase text-slate-400">Initial Studio Grant</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">CreatorNova Usage Credits</span>
                <span className="font-mono font-bold text-amber-300">850 Credits Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Brand Kit Profile</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-sm font-black shadow-xl shadow-violet-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create My First Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
