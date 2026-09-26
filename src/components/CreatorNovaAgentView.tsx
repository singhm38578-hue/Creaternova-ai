import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  Zap,
  Repeat,
  Calendar,
  Layers,
  Lightbulb,
  Coins,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  Search,
  Image as ImageIcon,
  Play,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Palette
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  AgentPlan,
  AgentTask,
  ContentCalendarItem,
  Character,
  Project,
  GeneratedProjectItem
} from '../types/content';
import { studioApi } from '../services/api';
import { CreatorNovaPlanModal } from './CreatorNovaPlanModal';
import { HumanApprovalModal } from './HumanApprovalModal';
import { SmartStrategySection } from './SmartStrategySection';

interface CreatorNovaAgentViewProps {
  onOpenProject?: (projectId: string) => void;
  onOpenNewProjectWorkflow?: () => void;
  onOpenCalendar?: () => void;
  onOpenSeriesCreator?: () => void;
  onOpenRepurpose?: () => void;
  onOpenCharacters?: () => void;
}

export const CreatorNovaAgentView: React.FC<CreatorNovaAgentViewProps> = ({
  onOpenProject,
  onOpenNewProjectWorkflow,
  onOpenCalendar,
  onOpenSeriesCreator,
  onOpenRepurpose,
  onOpenCharacters,
}) => {
  const { user, brandKit, credits, refreshCredits } = useAuth();

  // Agent Input States
  const [command, setCommand] = useState('');
  const [useBrandKit, setUseBrandKit] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Agent Processing & Plan States
  const [isParsing, setIsParsing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activePlan, setActivePlan] = useState<AgentPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingExecutionPlan, setPendingExecutionPlan] = useState<AgentPlan | null>(null);

  // Result display
  const [generatedBatch, setGeneratedBatch] = useState<GeneratedProjectItem[] | null>(null);
  const [activeBatchItem, setActiveBatchItem] = useState<GeneratedProjectItem | null>(null);

  // Tasks & Upcoming Calendar for dashboard
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [upcomingCalendar, setUpcomingCalendar] = useState<ContentCalendarItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const recognitionRef = useRef<any>(null);

  const loadInitialData = async () => {
    try {
      setLoadingDashboard(true);
      const [charsRes, tasksRes, calRes, plansRes] = await Promise.all([
        studioApi.characters.list(),
        studioApi.agent.getTasks(),
        studioApi.calendar.list(),
        studioApi.agent.getPlans(),
      ]);

      setCharacters(charsRes.characters || []);
      if (charsRes.characters?.length > 0 && !selectedCharId) {
        setSelectedCharId(charsRes.characters[0].id);
      }
      setTasks(tasksRes.tasks?.slice(0, 5) || []);
      setUpcomingCalendar(calRes.items?.slice(0, 4) || []);

      // If user has a recent completed or draft plan, show it
      if (plansRes.plans?.length > 0) {
        const latest = plansRes.plans[0];
        setActivePlan(latest);
        if (latest.generatedProjects && latest.generatedProjects.length > 0) {
          setGeneratedBatch(latest.generatedProjects);
          setActiveBatchItem(latest.generatedProjects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load initial agent data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Setup speech recognition
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
        setVoiceFeedback(`Hearing: "${transcript}"`);
      };

      recog.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceFeedback(null);
      };

      recog.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceFeedback(null), 3000);
      };

      recognitionRef.current = recog;
    }
  }, [brandKit]);

  const toggleVoice = () => {
    if (!speechSupported) {
      alert('Speech Recognition is ready. Please use a supported browser like Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setVoiceFeedback('Listening... Speak your goal clearly.');
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Step 1: User enters command -> AI understands request & creates Plan (Pre-Execution)
  const handleAskAgent = async (text?: string) => {
    const promptToUse = text || command;
    if (!promptToUse.trim() || isParsing) return;

    setIsParsing(true);
    try {
      const res = await studioApi.agent.parseCommand({
        command: promptToUse.trim(),
        useBrandKit,
        selectedCharacterId: selectedCharId || undefined,
      });

      setActivePlan(res.plan);
      setIsPlanModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to formulate plan');
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2: User reviews Plan in PlanModal and clicks "Start Creation" -> Prompts Human Approval
  const handleApproveFromPlanModal = (planToExecute: AgentPlan) => {
    setIsPlanModalOpen(false);
    setPendingExecutionPlan(planToExecute);
    setIsApprovalModalOpen(true);
  };

  // Step 3: Human reviews & confirms credit deduction & generation
  const handleConfirmedExecution = async () => {
    if (!pendingExecutionPlan) return;

    setIsExecuting(true);
    try {
      const res = await studioApi.agent.executePlan({
        planId: pendingExecutionPlan.id,
        approved: true,
      });

      setIsApprovalModalOpen(false);
      setPendingExecutionPlan(null);
      refreshCredits();

      if (res.generatedProjects && res.generatedProjects.length > 0) {
        setGeneratedBatch(res.generatedProjects);
        setActiveBatchItem(res.generatedProjects[0]);
      }

      // Refresh dashboard data
      loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setCommand(text);
    handleAskAgent(text);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* ========================================================= */}
      {/* MOBILE OPTIMIZED AGENT HOME LAYOUT (Requirement 16) */}
      {/* ========================================================= */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-violet-500/40 shadow-2xl p-5 sm:p-7 space-y-5">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/3 -mt-12 w-80 h-32 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-10 -mt-12 w-64 h-32 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/20 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">CreatorNova AI Agent</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  Assistant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Tell CreatorNova what you want to create.</p>
            </div>
          </div>

          {/* Controls: Brand Kit & Character Consistency */}
          <div className="flex flex-wrap items-center gap-2">
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
              <span>Use Brand Kit: {useBrandKit ? 'ON' : 'OFF'}</span>
            </button>

            {characters.length > 0 && (
              <select
                value={selectedCharId}
                onChange={(e) => setSelectedCharId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-violet-300 focus:outline-none focus:border-violet-500"
                title="Consistent Avatar"
              >
                <option value="">No Character</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Character: {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Voice Feedback Toast */}
        {voiceFeedback && (
          <div className="p-2.5 bg-violet-950/60 border border-violet-500/40 rounded-xl text-xs text-violet-300 flex items-center gap-2 animate-in fade-in">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span>{voiceFeedback}</span>
          </div>
        )}

        {/* Command Box Area */}
        <div className="relative rounded-2xl bg-slate-950/90 border border-slate-800 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all shadow-inner overflow-hidden">
          <textarea
            rows={3}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Example: Create a 7-day content plan for my kids learning YouTube channel."
            className="w-full p-4 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Action Row Inside Box */}
          <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-md animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-violet-400" />}
                <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
              </button>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Natural Language Commands
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAskAgent()}
              disabled={isParsing || !command.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isParsing ? (
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

        {/* Quick Actions (Requirement 1 & 16) */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Actions
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => handleQuickAction("Create today's content for my channel")}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all text-left flex flex-col justify-between space-y-1"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Today's Content</span>
            </button>

            <button
              onClick={() => handleQuickAction("Plan my week: 7 days of high-retention YouTube Shorts")}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all text-left flex flex-col justify-between space-y-1"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Plan My Week</span>
            </button>

            <button
              onClick={() => handleQuickAction("Give me 10 video ideas with 3-second viral retention hooks")}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all text-left flex flex-col justify-between space-y-1"
            >
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span>10 Video Ideas</span>
            </button>

            <button
              onClick={() => {
                if (onOpenSeriesCreator) onOpenSeriesCreator();
                else handleQuickAction("Create a 5-part Shorts series with recurring hook");
              }}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all text-left flex flex-col justify-between space-y-1"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Create Series</span>
            </button>

            <button
              onClick={() => {
                if (onOpenRepurpose) onOpenRepurpose();
                else handleQuickAction("Repurpose my content for Instagram Reels and TikTok");
              }}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all text-left flex flex-col justify-between space-y-1"
            >
              <Repeat className="w-4 h-4 text-pink-400" />
              <span>Repurpose</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MULTI-CONTENT GENERATION OUTPUT VIEWER (Requirement 4) */}
      {/* ========================================================= */}
      {generatedBatch && generatedBatch.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-violet-500/40 p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Multi-Content Plan Generated
                </span>
                <span className="text-xs text-slate-400">{generatedBatch.length} Projects Saved & Scheduled</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Multi-Piece Production Roster</h2>
            </div>

            {onOpenCalendar && (
              <button
                onClick={onOpenCalendar}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> View on Content Calendar
              </button>
            )}
          </div>

          {/* Days / Pieces Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {generatedBatch.map((item, idx) => {
              const isSelected = activeBatchItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveBatchItem(item)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">
                    {item.dayNumber || (idx + 1)}
                  </span>
                  <span>Day {item.dayNumber || (idx + 1)}</span>
                </button>
              );
            })}
          </div>

          {/* Active Piece Breakdown Card */}
          {activeBatchItem && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900">
                <div>
                  <span className="text-[11px] font-bold uppercase text-violet-400 tracking-wider">
                    Day {activeBatchItem.dayNumber} Breakdown
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{activeBatchItem.title}</h3>
                </div>

                <button
                  onClick={() => onOpenProject && onOpenProject(activeBatchItem.id)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/20 self-start sm:self-auto"
                >
                  <span>Open in Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day 1: Hook, Script, Scenes, SEO, Thumbnail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Hook & Script */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> 3-Second Retention Hook
                    </span>
                    <p className="text-xs text-amber-200 mt-1 italic font-medium">
                      "{activeBatchItem.hook}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-400" /> Script Preview
                    </span>
                    <p className="text-xs text-slate-300 mt-1 font-mono whitespace-pre-wrap leading-relaxed">
                      {activeBatchItem.scriptPreview}
                    </p>
                  </div>
                </div>

                {/* Scenes, SEO, Thumbnail */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-purple-400" /> Storyboard Breakdown
                      </span>
                      <p className="text-xs text-white font-semibold mt-0.5">
                        {activeBatchItem.scenesCount} Production Scenes Ready
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 justify-end">
                        <Search className="w-3.5 h-3.5 text-emerald-400" /> SEO Score
                      </span>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">
                        {activeBatchItem.seoScore}/100
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Thumbnail Concept
                    </span>
                    <p className="text-xs text-slate-300 mt-1 font-semibold">
                      Headline: "{activeBatchItem.thumbnailIdea}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2-COLUMN BOTTOM: CURRENT TASKS & UPCOMING CONTENT */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Tasks (Requirement 11 & 16) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" /> Current Tasks
            </h3>
            <span className="text-xs text-slate-400">{tasks.length} Active</span>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active tasks in queue.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white truncate max-w-[240px]">{task.title}</p>
                    <p className="text-[11px] text-slate-400">{task.description}</p>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : task.status === 'Working'
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Content (Requirement 16) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Upcoming Content
            </h3>
            {onOpenCalendar && (
              <button
                onClick={onOpenCalendar}
                className="text-xs text-violet-400 hover:text-violet-300 font-bold"
              >
                Calendar View →
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {upcomingCalendar.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No upcoming scheduled content.</p>
            ) : (
              upcomingCalendar.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.projectId && onOpenProject && onOpenProject(item.projectId)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="space-y-0.5 truncate">
                    <p className="font-semibold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{item.scheduledDate}</span>
                      <span>•</span>
                      <span>{item.platform}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 shrink-0">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SMART CONTENT STRATEGY SECTION (Requirement 6) */}
      {/* ========================================================= */}
      <SmartStrategySection onExecutePrompt={(p) => handleQuickAction(p)} />

      {/* ========================================================= */}
      {/* STEP 1 MODAL: CREATORNOVA PLAN BEFORE EXECUTION (Req 3) */}
      {/* ========================================================= */}
      <CreatorNovaPlanModal
        isOpen={isPlanModalOpen}
        plan={activePlan}
        onClose={() => setIsPlanModalOpen(false)}
        onApproveAndExecute={handleApproveFromPlanModal}
        onUpdatePlan={(updated) => setActivePlan(updated)}
      />

      {/* ========================================================= */}
      {/* STEP 2 MODAL: HUMAN APPROVAL REVIEW & CONFIRM (Req 12) */}
      {/* ========================================================= */}
      <HumanApprovalModal
        isOpen={isApprovalModalOpen}
        type="generation"
        title="Review & Confirm Creation"
        description={`CreatorNova Agent will execute multi-content generation for "${pendingExecutionPlan?.goal}". This will generate complete scripts, scene directives, visual prompts, SEO, thumbnails, and schedule them to your Content Calendar.`}
        details={{
          creditsCost: pendingExecutionPlan?.estimatedCredits || 2,
          remainingCredits: credits?.totalRemaining ?? 850,
          targetName: pendingExecutionPlan?.goal,
        }}
        confirmButtonText="Review & Confirm Generation"
        onConfirm={handleConfirmedExecution}
        onClose={() => setIsApprovalModalOpen(false)}
        isProcessing={isExecuting}
      />
    </div>
  );
};
