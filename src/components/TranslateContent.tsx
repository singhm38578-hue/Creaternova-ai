import React, { useState } from 'react';
import {
  Languages,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  Mic,
  Plus,
  Trash2,
  Clock,
  Globe
} from 'lucide-react';
import { Project, TranslationItem } from '../types/content';
import { studioApi } from '../services/api';

interface TranslateContentProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

const GLOBAL_LANGUAGES = [
  { name: 'Spanish (Español)', code: 'es' },
  { name: 'Hindi (हिंदी)', code: 'hi' },
  { name: 'French (Français)', code: 'fr' },
  { name: 'German (Deutsch)', code: 'de' },
  { name: 'Japanese (日本語)', code: 'ja' },
  { name: 'Portuguese (Português - Brasil)', code: 'pt' },
  { name: 'Arabic (العربية)', code: 'ar' },
  { name: 'Korean (한국어)', code: 'ko' },
  { name: 'Chinese (Simplified - 中文)', code: 'zh' },
  { name: 'Italian (Italiano)', code: 'it' },
  { name: 'Russian (Русский)', code: 'ru' },
  { name: 'Turkish (Türkçe)', code: 'tr' },
  { name: 'Indonesian (Bahasa Indonesia)', code: 'id' },
  { name: 'Vietnamese (Tiếng Việt)', code: 'vi' },
  { name: 'Dutch (Nederlands)', code: 'nl' },
];

export const TranslateContent: React.FC<TranslateContentProps> = ({
  project,
  onUpdateProject,
}) => {
  const [sourceType, setSourceType] = useState<'script' | 'titles' | 'description' | 'custom'>('script');
  const [customText, setCustomText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish (Español)');
  const [mode, setMode] = useState<'cultural' | 'dubbing' | 'direct'>('cultural');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  // Get active source text
  const getSourceText = () => {
    switch (sourceType) {
      case 'script':
        return project.script?.rawFullText || project.topic;
      case 'titles':
        return project.seo?.titles.map((t) => t.title).join('\n') || project.name;
      case 'description':
        return project.seo?.description || project.topic;
      case 'custom':
        return customText;
    }
  };

  const handleTranslate = async () => {
    const textToTranslate = getSourceText();
    if (!textToTranslate.trim()) return;

    setIsLoading(true);
    try {
      const selectedLangObj = GLOBAL_LANGUAGES.find((l) => l.name === targetLang) || { code: 'es', name: targetLang };
      const res = await studioApi.translateContent({
        text: textToTranslate,
        targetLanguage: targetLang,
        mode,
        originalLanguage: 'English',
      });

      if (res.translation) {
        const newTrans: TranslationItem = {
          id: `trans-${Date.now()}`,
          targetLanguage: res.translation.targetLanguage || targetLang,
          languageCode: selectedLangObj.code,
          mode: (res.translation.mode as any) || mode,
          originalSnippet: textToTranslate.slice(0, 160),
          translatedText: res.translation.translatedText || '',
          culturalNotes: res.translation.culturalNotes || '',
          speechPacingTip: res.translation.speechPacingTip || 'Natural speech pace',
          translatedAt: new Date().toISOString(),
        };

        const updated = {
          ...project,
          translations: [newTrans, ...project.translations],
          updatedAt: new Date().toISOString(),
        };
        onUpdateProject(updated);
      }
    } catch (err) {
      console.error('Failed translating content', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteTranslation = (id: string) => {
    const updated = {
      ...project,
      translations: project.translations.filter((t) => t.id !== id),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
  };

  // Browser Web Speech Synthesis playback
  const handlePlayVoice = (id: string, text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio === id) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
      utterance.lang = langCode;
      utterance.rate = 1.0;

      utterance.onend = () => {
        setIsPlayingAudio(null);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(null);
      };

      setIsPlayingAudio(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Studio Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Content Localization & Dubbing</h2>
              <p className="text-xs text-slate-400">Translate scripts & metadata into 20+ languages with cultural adaptation and speech pacing</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Saved Translations: <strong className="text-slate-200 font-mono">{project.translations.length}</strong>
          </span>
        </div>

        {/* Source Selector & Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Content Source
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="script">Full Video Script</option>
              <option value="titles">Video Titles & Hooks</option>
              <option value="description">SEO Description</option>
              <option value="custom">Custom Text Snippet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Localization Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="cultural">Cultural Adaptation (Slang & Nuance)</option>
              <option value="dubbing">Voiceover Dubbing (Timed Pacing)</option>
              <option value="direct">Direct Accurate Translation</option>
            </select>
          </div>
        </div>

        {sourceType === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Custom Text to Localize
            </label>
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste dialogue, lines or video captions here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
        )}

        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Source snippet: <span className="text-slate-300 italic">"{getSourceText().slice(0, 60)}..."</span>
          </div>
          <button
            onClick={handleTranslate}
            disabled={isLoading || !getSourceText().trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Localizing Content with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Translate & Localize Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Translations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Project Localization Vault ({project.translations.length})
          </h3>
          <span className="text-xs text-slate-400">
            Listen to native voiceover playback or copy localized text
          </span>
        </div>

        {project.translations.length > 0 ? (
          <div className="space-y-4">
            {project.translations.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-4 transition-colors group"
              >
                {/* Header: Language & Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      {item.targetLanguage}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                      {item.mode.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Preview Button */}
                    <button
                      onClick={() => handlePlayVoice(item.id, item.translatedText, item.languageCode)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      {isPlayingAudio === item.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Hear Voiceover</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(item.id, item.translatedText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteTranslation(item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete Translation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Side-by-side or stacked text comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Original English:</span>
                    <p className="leading-relaxed line-clamp-4 italic">
                      "{item.originalSnippet}..."
                    </p>
                  </div>

                  {/* Translated */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-900/40 text-xs text-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-cyan-400">Localized Output:</span>
                    <p className="leading-relaxed font-medium">
                      "{item.translatedText}"
                    </p>
                  </div>
                </div>

                {/* Cultural Notes & Pacing Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <div>
                    <strong className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                      Cultural Localization Notes:
                    </strong>
                    <span className="text-slate-300 leading-snug">{item.culturalNotes}</span>
                  </div>
                  <div>
                    <strong className="text-[10px] uppercase font-bold text-violet-400 block mb-0.5">
                      Voice Dubbing Pacing Guide:
                    </strong>
                    <span className="text-slate-300 leading-snug">{item.speechPacingTip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <Languages className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300 mb-1">No translations created yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Expand into global markets by translating your video script, titles, or descriptions into Spanish, Hindi, French, Japanese, and more.
            </p>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !getSourceText().trim()}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-colors cursor-pointer"
            >
              Translate Content Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
