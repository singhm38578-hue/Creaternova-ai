import React, { useState, useEffect } from 'react';
import {
  ListChecks,
  History,
  RotateCcw,
  XCircle,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  Coins,
  Filter
} from 'lucide-react';
import { AgentTask, AgentActivity, AgentTaskStatus } from '../types/content';
import { studioApi } from '../services/api';

interface AgentTasksViewProps {
  onOpenProject?: (projectId: string) => void;
}

export const AgentTasksView: React.FC<AgentTasksViewProps> = ({ onOpenProject }) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'activity'>('queue');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<AgentTask | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, aRes] = await Promise.all([
        studioApi.agent.getTasks(),
        studioApi.agent.getActivity(),
      ]);
      setTasks(tRes.tasks || []);
      setActivities(aRes.activities || []);
    } catch (err: any) {
      console.error('Failed to load tasks/activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTaskAction = async (taskId: string, action: 'retry' | 'cancel' | 'review') => {
    try {
      const res = await studioApi.agent.updateTask(taskId, { action });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.task : t)));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: AgentTaskStatus) => {
    switch (status) {
      case 'Completed':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: CheckCircle2,
        };
      case 'Working':
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          icon: Clock,
        };
      case 'Needs Approval':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
        };
      case 'Failed':
        return {
          bg: 'bg-red-500/15 text-red-300 border-red-500/30',
          icon: XCircle,
        };
      default: // Queued
        return {
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
          icon: Clock,
        };
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'All') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-semibold mb-2">
            <ListChecks className="w-3.5 h-3.5" /> Agent Operations Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Agent Tasks & Activity</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Monitor real-time task queues, verify human reviews, and audit historical generation logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'queue'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" /> Task Queue ({tasks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('activity')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'activity'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Activity Log ({activities.length})
          </button>
        </div>
      </div>

      {/* Real Process Architecture Notice (Requirement 11) */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Truthful Asynchronous Processing:</span>{' '}
          CreatorNova executes verified local AI generation operations synchronously. Unsupported external asynchronous long-running worker engines are explicitly marked as{' '}
          <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            "Background processing integration required."
          </code>{' '}
          without simulating fake progress bars.
        </div>
      </div>

      {/* SUBTAB 1: TASK QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {['All', 'Queued', 'Working', 'Completed', 'Needs Approval', 'Failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/50'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">{filteredTasks.length} tasks</span>
          </div>

          {loading ? (
            <div className="h-40 rounded-2xl bg-slate-900 animate-pulse" />
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
              No tasks currently match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const badge = getStatusBadge(task.status);
                const Icon = badge.icon;
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                          <Icon className="w-3 h-3" /> {task.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Cost: {task.creditCost} creds</span>
                        {task.isAsyncBackground && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Background processing integration required
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{task.title}</h4>
                      <p className="text-xs text-slate-400">{task.description}</p>
                      {task.resultSummary && (
                        <p className="text-xs text-emerald-400/90 font-medium pt-1">
                          ✓ {task.resultSummary}
                        </p>
                      )}
                    </div>

                    {/* Actions: Retry, Cancel, Review */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {task.status === 'Needs Approval' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'review')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      )}

                      {task.status === 'Failed' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'retry')}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retry
                        </button>
                      )}

                      {task.status !== 'Completed' && task.status !== 'Failed' && (
                        <button
                          onClick={() => handleTaskAction(task.id, 'cancel')}
                          className="px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-red-400 rounded-lg text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTaskDetails(task)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: AGENT ACTIVITY AUDIT TRAIL */}
      {activeSubTab === 'activity' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" /> Historical Agent Actions
          </h3>

          {loading ? (
            <div className="h-40 bg-slate-950 rounded-xl animate-pulse" />
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No recorded activity yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{act.description}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span className="capitalize text-violet-400">{act.actionType.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                      {act.projectName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">Project: {act.projectName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {act.creditsUsed ? (
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                      -{act.creditsUsed} Credits
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Task Details</h3>
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong>Title:</strong> {selectedTaskDetails.title}</p>
              <p><strong>Status:</strong> {selectedTaskDetails.status}</p>
              <p><strong>Credit Cost:</strong> {selectedTaskDetails.creditCost}</p>
              <p><strong>Description:</strong> {selectedTaskDetails.description}</p>
              {selectedTaskDetails.resultSummary && (
                <p><strong>Result:</strong> {selectedTaskDetails.resultSummary}</p>
              )}
              {selectedTaskDetails.error && (
                <p className="text-red-400"><strong>Error:</strong> {selectedTaskDetails.error}</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
