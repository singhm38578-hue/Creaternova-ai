import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  ArrowRight,
  Wand2,
  Clapperboard,
  Clock,
  Mic,
  Maximize2,
  Minimize2,
  Volume2,
  Sliders,
  Flame,
  Plus,
  Trash2
} from 'lucide-react';
import { Project, ScriptBeat, ScriptData } from '../types/content';
import { studioApi } from '../services/api';

interface ScriptWriterProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onSendToScenes: (scriptText: string) => void;
  initialTitle?: string;
}

export const ScriptWriter: React.FC<ScriptWriterProps> = ({
  project,
  onUpdateProject,
  onSendToScenes,
  initialTitle,
}) => {
  const currentScript = project.script;
  const [title, setTitle] = useState(initialTitle || currentScript?.title || project.name);
  const [duration, setDuration] = useState(currentScript?.estimatedDuration || (project.format === 'youtube_short' ? '60 seconds' : '4-5 minutes'));
  const [pacing, setPacing] = useState('balanced');
  const [hostFormat, setHostFormat] = useState('solo');
  const [tone, setTone] = useState(project.tone);
  const [activeView, setActiveView] = useState<'beats' | 'fullText' | 'teleprompter'>('beats');
  const [isLoading, setIsLoading] = useState(false);
  const [polishingBeatId, setPolishingBeatId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Teleprompter state
  const [isPrompterRunning, setIsPrompterRunning] = useState(false);
  const [prompterSpeed, setPrompterSpeed] = useState(2); // 1-5
  const [prompterFontSize, setPrompterFontSize] = useState(24);
  const [isPrompterMirrored, setIsPrompterMirrored] = useState(false);
  const prompterContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll loop for teleprompter
  useEffect(() => {
    let animId: number;
    if (isPrompterRunning && activeView === 'teleprompter' && prompterContainerRef.current) {
      const scrollStep = () => {
        if (prompterContainerRef.current) {
          prompterContainerRef.current.scrollTop += prompterSpeed * 0.7;
          if (
            prompterContainerRef.current.scrollTop + prompterContainerRef.current.clientHeight >=
            prompterContainerRef.current.scrollHeight - 5
          ) {
            setIsPrompterRunning(false);
            return;
          }
        }
        animId = requestAnimationFrame(scrollStep);
      };
      animId = requestAnimationFrame(scrollStep);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPrompterRunning, activeView, prompterSpeed]);

  const handleGenerateScript = async () => {
    if (!title.trim()) return;
    setIsLoading(true);

    try {
      const res = await studioApi.generateScript({
        title: title.trim(),
        format: project.format,
        targetAudience: project.targetAudience,
        tone: tone,
        pacing: pacing,
        hostFormat: hostFormat,
        duration: duration,
      });

      if (res.script) {
        const newScript: ScriptData = {
          ...res.script,
          lastUpdated: new Date().toISOString(),
        };

        const updatedProject = {
          ...project,
          script: newScript,
          updatedAt: new Date().toISOString(),
        };
        onUpdateProject(updatedProject);
      }
    } catch (err: any) {
      console.error('Failed generating script', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePolishBeat = async (beatId: string, instruction: string) => {
    if (!currentScript) return;
    const beat = currentScript.beats.find((b) => b.id === beatId);
    if (!beat) return;

    setPolishingBeatId(beatId);
    try {
      const res = await studioApi.refineScript({
        originalText: beat.dialogue,
        instruction,
      });

      if (res.refinedText) {
        const updatedBeats = currentScript.beats.map((b) => {
          if (b.id === beatId) {
            return {
              ...b,
              dialogue: res.refinedText,
              directionCue: res.directionCue || b.directionCue,
            };
          }
          return b;
        });

        const newRawText = updatedBeats.map((b) => b.dialogue).join('\n\n');
        const updatedScript: ScriptData = {
          ...currentScript,
          beats: updatedBeats,
          rawFullText: newRawText,
          wordCount: newRawText.split(/\s+/).filter(Boolean).length,
          lastUpdated: new Date().toISOString(),
        };

        onUpdateProject({
          ...project,
          script: updatedScript,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error polishing beat', err);
    } finally {
      setPolishingBeatId(null);
    }
  };

  const handleCopyScript = () => {
    if (!currentScript) return;
    navigator.clipboard.writeText(currentScript.rawFullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!currentScript) return;
    const element = document.createElement('a');
    const file = new Blob([currentScript.rawFullText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_script.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getSectionBadge = (type: string) => {
    switch (type) {
      case 'hook': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'intro': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'climax': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'cta':
      case 'outro': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default: return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Script Setup Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Script Writer & Teleprompter</h2>
              <p className="text-xs text-slate-400">Pacing-engineered scripts with voice direction, B-roll cues, and teleprompter</p>
            </div>
          </div>
          {currentScript && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 font-mono text-slate-200">
                {currentScript.wordCount} Words
              </span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 font-mono text-slate-200">
                Est: {currentScript.estimatedDuration}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Video Title / Concept *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Falling Into A Black Hole: The 60-Second Reality"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Estimated Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="30 seconds">30-second Short / Reel</option>
              <option value="60 seconds">60-second Short / TikTok</option>
              <option value="3-4 minutes">3-4 minutes (Quick Explainer)</option>
              <option value="6-8 minutes">6-8 minutes (Standard YouTube)</option>
              <option value="10-12 minutes">10-12 minutes (Deep-Dive)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Pacing
            </label>
            <select
              value={pacing}
              onChange={(e) => setPacing(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="fast_punchy">Fast & Punchy (Shorts / TikTok)</option>
              <option value="balanced">Balanced & Conversational</option>
              <option value="slow_cinematic">Cinematic & Deliberate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Host Format
            </label>
            <select
              value={hostFormat}
              onChange={(e) => setHostFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="solo">Solo Creator on Camera</option>
              <option value="voiceover">Voiceover Narrator (Faceless)</option>
              <option value="dual_hosts">Two Hosts / Dialogue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tone Override
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="engaging_energetic">High Energy & Punchy</option>
              <option value="cinematic_storytelling">Cinematic Storytelling</option>
              <option value="suspense_mystery">Suspense & Mystery</option>
              <option value="playful_kids">Playful & Nursery Fun</option>
              <option value="educational_calm">Educational & Calm</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerateScript}
            disabled={isLoading || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Writing Production Screenplay...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{currentScript ? 'Regenerate Full Script' : 'Generate Script with AI'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Script Display and Modes */}
      {currentScript ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Top Bar for Modes & Actions */}
          <div className="px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
            {/* View Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveView('beats')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'beats'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Production Beats
              </button>
              <button
                onClick={() => setActiveView('fullText')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'fullText'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Clean Readout
              </button>
              <button
                onClick={() => setActiveView('teleprompter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'teleprompter'
                    ? 'bg-violet-600 text-white shadow-sm animate-pulse'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                Teleprompter
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>

              <button
                onClick={() => onSendToScenes(currentScript.rawFullText)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Clapperboard className="w-3.5 h-3.5 text-purple-400" />
                <span>Send to Scene Generator &rarr;</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: Production Beats */}
          {activeView === 'beats' && (
            <div className="p-6 space-y-4">
              {currentScript.beats.map((beat, idx) => (
                <div
                  key={beat.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getSectionBadge(beat.sectionType)}`}>
                        {beat.sectionType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {beat.timestamp}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {beat.speaker}
                      </span>
                    </div>

                    {/* Quick Polish Dropdown/Actions */}
                    <div className="opacity-80 group-hover:opacity-100 flex items-center gap-1.5">
                      <button
                        onClick={() => handlePolishBeat(beat.id, 'Make it punchier with high retention cadence')}
                        disabled={polishingBeatId === beat.id}
                        className="text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                        title="AI rewrite to make punchier"
                      >
                        {polishingBeatId === beat.id ? 'Polishing...' : '⚡ Punchier'}
                      </button>
                      <button
                        onClick={() => handlePolishBeat(beat.id, 'Add natural humor and witty phrasing')}
                        disabled={polishingBeatId === beat.id}
                        className="text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                        title="Add subtle humor"
                      >
                        😂 Witty
                      </button>
                    </div>
                  </div>

                  {/* Direction Cue & Dialogue */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-amber-400 font-mono italic">
                      {beat.directionCue}
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed pl-2 border-l-2 border-blue-500/50">
                      "{beat.dialogue}"
                    </p>
                  </div>

                  {/* Visual & Camera Cue */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Visual B-Roll:</span>
                    <span className="text-slate-300 truncate">{beat.visualCue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 2: Clean Readout */}
          {activeView === 'fullText' && (
            <div className="p-6">
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 max-h-[550px] overflow-y-auto font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-line selection:bg-blue-600">
                {currentScript.rawFullText}
              </div>
            </div>
          )}

          {/* VIEW 3: Teleprompter */}
          {activeView === 'teleprompter' && (
            <div className="p-6 space-y-4">
              {/* Teleprompter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPrompterRunning(!isPrompterRunning)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                      isPrompterRunning
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {isPrompterRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPrompterRunning ? 'Pause Teleprompter' : 'Start Auto-Scroll'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (prompterContainerRef.current) {
                        prompterContainerRef.current.scrollTop = 0;
                        setIsPrompterRunning(false);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Reset to Top"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Scroll Speed:</span>
                    {[1, 2, 3, 4, 5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPrompterSpeed(spd)}
                        className={`w-6 h-6 rounded font-mono font-bold text-xs ${
                          prompterSpeed === spd
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Font:</span>
                    <button
                      onClick={() => setPrompterFontSize(Math.max(18, prompterFontSize - 4))}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setPrompterFontSize(Math.min(48, prompterFontSize + 4))}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      A+
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPrompterMirrored(!isPrompterMirrored)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                      isPrompterMirrored
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Mirror (Glass Rig)
                  </button>
                </div>
              </div>

              {/* Prompter Scrolling Canvas */}
              <div
                ref={prompterContainerRef}
                className="h-[460px] overflow-y-auto bg-black border-2 border-violet-900/50 rounded-2xl p-8 scrollbar-none relative"
                style={{
                  transform: isPrompterMirrored ? 'scaleX(-1)' : 'none',
                }}
              >
                {/* Horizontal Reading Line Guide */}
                <div className="sticky top-24 left-0 right-0 h-0.5 bg-red-500/40 pointer-events-none z-10 flex items-center">
                  <span className="text-[10px] font-mono text-red-400 uppercase bg-black px-1">Eye-level Marker</span>
                </div>

                <div
                  className="space-y-8 font-sans font-semibold text-white tracking-wide max-w-3xl mx-auto py-12"
                  style={{ fontSize: `${prompterFontSize}px`, lineHeight: 1.6 }}
                >
                  {currentScript.beats.map((beat) => (
                    <div key={beat.id} className="space-y-2">
                      <div className="text-yellow-400 text-sm font-mono tracking-widest uppercase">
                        [{beat.timestamp}] {beat.directionCue}
                      </div>
                      <p>{beat.dialogue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No script generated yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Click "Generate Script with AI" above to craft an Emmy-caliber, high-retention script for this project.
          </p>
          <button
            onClick={handleGenerateScript}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Create Script Now
          </button>
        </div>
      )}
    </div>
  );
};
