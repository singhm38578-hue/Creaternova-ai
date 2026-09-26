import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  Clock,
  Coins,
  CheckCircle2,
  X,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Video,
  Languages,
  Layers,
  Palette,
  AlertCircle
} from 'lucide-react';
import { AgentPlan, PlatformOption } from '../types/content';

interface CreatorNovaPlanModalProps {
  isOpen: boolean;
  plan: AgentPlan | null;
  onClose: () => void;
  onApproveAndExecute: (plan: AgentPlan) => void;
  onUpdatePlan: (updatedPlan: AgentPlan) => void;
}

export const CreatorNovaPlanModal: React.FC<CreatorNovaPlanModalProps> = ({
  isOpen,
  plan,
  onClose,
  onApproveAndExecute,
  onUpdatePlan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState('');
  const [editedCount, setEditedCount] = useState(1);
  const [editedPlatform, setEditedPlatform] = useState('');
  const [editedLanguage, setEditedLanguage] = useState('');

  if (!isOpen || !plan) return null;

  const handleStartEdit = () => {
    setEditedGoal(plan.goal);
    setEditedCount(plan.numberOfVideos);
    setEditedPlatform(plan.platform);
    setEditedLanguage(plan.language);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const updated: AgentPlan = {
      ...plan,
      goal: editedGoal,
      numberOfVideos: editedCount,
      platform: editedPlatform as PlatformOption,
      language: editedLanguage,
      estimatedOperations: editedCount * 6,
      estimatedCredits: editedCount * 2,
    };
    onUpdatePlan(updated);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden my-8">
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-6 border-b border-violet-800/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-inner">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/30">
                  Pre-Execution Plan
                </span>
                <span className="text-xs text-slate-400">Step 1 of 2</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">CreatorNova Plan</h2>
              <p className="text-xs text-slate-400">Review estimated operations & credits before execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Plan Goal Highlight */}
          <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-700/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Target Goal</span>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Plan
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Goal Description</label>
                  <input
                    type="text"
                    value={editedGoal}
                    onChange={(e) => setEditedGoal(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Number of Videos</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={editedCount}
                      onChange={(e) => setEditedCount(parseInt(e.target.value) || 1)}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Platform</label>
                    <input
                      type="text"
                      value={editedPlatform}
                      onChange={(e) => setEditedPlatform(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Language</label>
                    <input
                      type="text"
                      value={editedLanguage}
                      onChange={(e) => setEditedLanguage(e.target.value)}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base font-semibold text-white">{plan.goal}</p>
            )}
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                Videos
              </div>
              <p className="text-lg font-bold text-white mt-1">{plan.numberOfVideos} {plan.numberOfVideos === 1 ? 'Piece' : 'Pieces'}</p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Platform
              </div>
              <p className="text-sm font-bold text-white mt-1 truncate">{plan.platform}</p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Languages className="w-3.5 h-3.5 text-pink-400" />
                Language
              </div>
              <p className="text-sm font-bold text-white mt-1">{plan.language}</p>
            </div>

            <div className="bg-slate-950/70 border border-violet-800/60 rounded-xl p-3 bg-violet-950/20">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                <Coins className="w-3.5 h-3.5" />
                Credits
              </div>
              <p className="text-lg font-black text-amber-300 mt-1">~{plan.estimatedCredits} <span className="text-xs font-normal text-slate-400">creds</span></p>
            </div>
          </div>

          {/* Context Memory Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-full border ${plan.useBrandKit ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              Brand Memory: {plan.useBrandKit ? 'Active (Using Brand Kit)' : 'OFF'}
            </span>
            {plan.selectedCharacterName && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Character: {plan.selectedCharacterName}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Operations: ~{plan.estimatedOperations} AI tasks
            </span>
          </div>

          {/* Expected Outputs Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Expected Outputs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.expectedOutputs.map((out, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{out}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Planned Tasks Sequence */}
          {plan.tasks && plan.tasks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400" /> Structured Tasks Sequence
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {plan.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center text-[10px]">
                        {task.stepNumber}
                      </span>
                      <span className="font-semibold text-slate-200">{task.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{task.estimatedCredits} credits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Human Confirmation Safety Note */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Human In The Loop Architecture</p>
              <p className="text-amber-200/80 mt-0.5">
                CreatorNova never executes expensive generations without your review. Clicking "Start Creation" will ask for final confirmation before deducting credits.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Plan
              </button>
            )}
            <button
              onClick={() => onApproveAndExecute(plan)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all"
            >
              <span>Start Creation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
