import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Save,
  Check,
  User,
  Tv,
  MessageSquare,
  Globe,
  Camera,
  Film,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BrandKit } from '../types/auth';

export const BrandKitView: React.FC = () => {
  const { brandKit, updateBrandKit } = useAuth();

  const [form, setForm] = useState<BrandKit>(
    brandKit || {
      channelName: 'My Creator Studio',
      channelNiche: 'Science & Fact Shorts',
      targetAudience: 'Students & Curious Minds (12-25)',
      preferredLanguage: 'English',
      preferredVisualStyle: 'Cinematic High-Contrast',
      defaultVideoStyle: 'Fast-Paced Shorts with Zoom Cues',
      toneOfVoice: 'Energetic, Curious & Authoritative',
      recurringCharacterDescription: 'Dr. Nova, enthusiastic robotic astronaut with glowing visor',
      preferredCta: 'Subscribe to Cosmic Explorers for weekly discoveries!',
      updatedAt: new Date().toISOString(),
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBrandKit(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-pink-600/30">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Creator Brand Kit</h1>
            <p className="text-xs text-slate-400">
              Establish a coherent voice, visual tone, recurring characters, and CTAs across all videos.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Brand Kit Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Brand Kit'}</span>
            </>
          )}
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300">
          <span className="font-bold text-white block">One-Click Auto-Application Active</span>
          <p className="leading-relaxed">
            When starting any project or generating scripts, check <strong>"Use My Brand Kit"</strong> to instantly populate your channel's niche, tone, audience demographics, and recurring character identity into the Gemini prompt.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Channel Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-pink-400" />
              <span>Channel / Brand Name</span>
            </label>
            <input
              type="text"
              value={form.channelName}
              onChange={(e) => setForm({ ...form, channelName: e.target.value })}
              placeholder="e.g. Veritasium, Cosmic Explorers"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Channel Niche */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-violet-400" />
              <span>Channel Niche & Subject</span>
            </label>
            <input
              type="text"
              value={form.channelNiche}
              onChange={(e) => setForm({ ...form, channelNiche: e.target.value })}
              placeholder="e.g. Space facts, Tech teardowns, Productivity"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Audience Demographics</span>
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              placeholder="e.g. Students & Curious Minds (12-25)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preferred Spoken & Written Language</span>
            </label>
            <select
              value={form.preferredLanguage}
              onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              {['English', 'Hindi', 'Spanish', 'Portuguese', 'French', 'German', 'Japanese', 'Korean', 'Arabic'].map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Preferred Visual Style */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Preferred Visual Style</span>
            </label>
            <select
              value={form.preferredVisualStyle}
              onChange={(e) => setForm({ ...form, preferredVisualStyle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="Cinematic High-Contrast">Cinematic High-Contrast</option>
              <option value="Clean & Minimalist">Clean & Minimalist</option>
              <option value="Colorful & Vibrant">Colorful & Vibrant</option>
              <option value="3D Cartoon Animation">3D Cartoon Animation</option>
              <option value="Educational Diagrammatic">Educational Diagrammatic</option>
              <option value="Hyper-Realistic Octane">Hyper-Realistic Octane</option>
            </select>
          </div>

          {/* Tone of Voice */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tone of Voice</span>
            </label>
            <input
              type="text"
              value={form.toneOfVoice}
              onChange={(e) => setForm({ ...form, toneOfVoice: e.target.value })}
              placeholder="e.g. Energetic, Curious, Authoritative, Witty"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Recurring Character Descriptions */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-pink-400" />
            <span>Recurring Character & Host Identity</span>
          </label>
          <textarea
            rows={3}
            value={form.recurringCharacterDescription}
            onChange={(e) => setForm({ ...form, recurringCharacterDescription: e.target.value })}
            placeholder="Describe your recurring mascot, presenter, clothing, colors and art style so scene prompts maintain visual continuity..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Preferred Call to Action */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Default Call To Action (CTA)</span>
          </label>
          <input
            type="text"
            value={form.preferredCta}
            onChange={(e) => setForm({ ...form, preferredCta: e.target.value })}
            placeholder="e.g. Subscribe to Cosmic Explorers for weekly discoveries and drop your favorite fact below!"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs shadow-md shadow-violet-600/30 transition-all cursor-pointer"
          >
            {savedSuccess ? 'Saved!' : 'Save Brand Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
