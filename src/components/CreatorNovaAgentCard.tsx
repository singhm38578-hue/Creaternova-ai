import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  Sliders,
  Check,
  Zap,
  Repeat,
  Calendar,
  Layers,
  Lightbulb,
  Coins,
  Palette
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Character } from '../types/content';

interface CreatorNovaAgentCardProps {
  onAskAgent: (command: string, useBrandKit: boolean, characterId?: string) => void;
  onOpenSeriesCreator?: () => void;
  onOpenRepurpose?: () => void;
  onOpenCalendar?: () => void;
  characters?: Character[];
  isLoading?: boolean;
}

export const CreatorNovaAgentCard: React.FC<CreatorNovaAgentCardProps> = ({
  onAskAgent,
  onOpenSeriesCreator,
  onOpenRepurpose,
  onOpenCalendar,
  characters = [],
  isLoading = false,
}) => {
  const { user, brandKit } = useAuth();
  const [command, setCommand] = useState('');
  const [useBrandKit, setUseBrandKit] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState<string>(
    characters.length > 0 ? characters[0].id : ''
  );
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceTranscriptFeedback, setVoiceTranscriptFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = brandKit?.preferredLanguage === 'Hindi' ? 'hi-IN' : 'en-US';

      recog.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setCommand(transcript);
        setVoiceTranscriptFeedback(`Hearing: "${transcript}"`);
      };

      recog.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceTranscriptFeedback(null);
      };

      recog.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceTranscriptFeedback(null), 3000);
      };

      recognitionRef.current = recog;
    } else {
      setSpeechSupported(false);
    }
  }, [brandKit]);

  const toggleVoice = () => {
    if (!speechSupported) {
      alert('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setVoiceTranscriptFeedback('Listening... Speak your goal clearly.');
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!command.trim() || isLoading) return;
    onAskAgent(command.trim(), useBrandKit, selectedCharId || undefined);
  };

  const handleQuickCommand = (text: string) => {
    setCommand(text);
    onAskAgent(text, useBrandKit, selectedCharId || undefined);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-violet-500/40 shadow-2xl shadow-violet-500/10 p-5 sm:p-7 space-y-5">
      {/* Decorative Top Glow */}
      <div className="absolute top-0 right-1/4 -mt-10 w-96 h-32 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-10 -mt-10 w-64 h-32 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/20">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">CreatorNova AI Agent</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                Assistant Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Tell CreatorNova what you want to create.</p>
          </div>
        </div>

        {/* Brand Kit & Character Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Kit Toggle (Requirement 1 & 7) */}
          <button
            type="button"
            onClick={() => setUseBrandKit(!useBrandKit)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              useBrandKit
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${useBrandKit ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>Use My Brand Kit: {useBrandKit ? 'ON' : 'OFF'}</span>
          </button>

          {/* Character Selector (Requirement 8) */}
          {characters.length > 0 && (
            <select
              value={selectedCharId}
              onChange={(e) => setSelectedCharId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-violet-300 focus:outline-none focus:border-violet-500"
              title="Recurring character consistency"
            >
              <option value="">No Character</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  Avatar: {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Voice Transcript Toast */}
      {voiceTranscriptFeedback && (
        <div className="p-2.5 bg-violet-950/60 border border-violet-500/40 rounded-xl text-xs text-violet-300 flex items-center gap-2 animate-in fade-in">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
          <span>{voiceTranscriptFeedback}</span>
        </div>
      )}

      {/* Large Command Input Area (Requirement 1 & 16) */}
      <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
        <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all shadow-inner overflow-hidden">
          <textarea
            rows={3}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Example: Create a 7-day content plan for my kids learning YouTube channel."
            className="w-full p-4 sm:p-4 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Action Row Inside Box */}
          <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {/* Voice Command Button (Requirement 13) */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-md animate-pulse'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
                title={speechSupported ? 'Start Voice Command' : 'Speech recognition integration ready'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-violet-400" />}
                <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
              </button>

              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Natural Language Planning
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !command.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50 transition-all shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Formulating Plan...</span>
                </>
              ) : (
                <>
                  <span>Ask CreatorNova</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Commands Chips (Requirement 1) */}
      <div className="space-y-2 relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Commands
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickCommand("Create today's content for my channel")}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" /> Create today's content
          </button>

          <button
            type="button"
            onClick={() => handleQuickCommand("Plan my week: 7 days of high-retention YouTube Shorts")}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3 h-3 text-cyan-400" /> Plan my week
          </button>

          <button
            type="button"
            onClick={() => handleQuickCommand("Give me 10 video ideas with 3-second viral hooks")}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Lightbulb className="w-3 h-3 text-yellow-400" /> Give me 10 video ideas
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenSeriesCreator) onOpenSeriesCreator();
              else handleQuickCommand("Create a Shorts series: 5 episodic parts with consistent recurring hook");
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3 h-3 text-purple-400" /> Create a Shorts series
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenRepurpose) onOpenRepurpose();
              else handleQuickCommand("Repurpose my content for Instagram Reels and TikTok");
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Repeat className="w-3 h-3 text-pink-400" /> Repurpose my content
          </button>
        </div>
      </div>
    </div>
  );
};
