import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Languages,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Move,
  Trash2,
  Edit2,
  Globe,
  Share2,
  Sparkles,
  ShieldAlert,
  X
} from 'lucide-react';
import { ContentCalendarItem, CalendarStatus, PlatformOption } from '../types/content';
import { studioApi } from '../services/api';

type CalendarViewMode = 'day' | 'week' | 'month';

interface ContentCalendarViewProps {
  onOpenProject?: (projectId: string) => void;
  onOpenNewPlan?: (prefilledText?: string) => void;
}

export const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({
  onOpenProject,
  onOpenNewPlan,
}) => {
  const [items, setItems] = useState<ContentCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [publishModalItem, setPublishModalItem] = useState<ContentCalendarItem | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // New item form states
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState<PlatformOption>('YouTube Shorts');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('17:00');
  const [newLanguage, setNewLanguage] = useState('English');
  const [newStatus, setNewStatus] = useState<CalendarStatus>('Idea');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await studioApi.calendar.list();
      setItems(res.items || []);
    } catch (err: any) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const getStatusBadge = (status: CalendarStatus) => {
    switch (status) {
      case 'Published':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'Ready':
        return {
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'Media Pending':
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'Script Ready':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      default: // Idea
        return {
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
          dot: 'bg-slate-400',
        };
    }
  };

  // Date Navigation Helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get days array for Week view
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0 is Sunday
    const firstDay = new Date(curr);
    firstDay.setDate(curr.getDate() - day);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(firstDay);
      next.setDate(firstDay.getDate() + i);
      week.push(next);
    }
    return week;
  };

  // Get days array for Month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days = [];
    // Leading days from previous month to align with Sunday
    const startDayOfWeek = firstDayOfMonth.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Trailing days
    const totalRendered = days.length;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const formatDateYMD = (d: Date) => d.toISOString().split('T')[0];

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await studioApi.calendar.create({
        title: newTitle,
        platform: newPlatform,
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: newStatus,
        language: newLanguage,
      });

      setItems((prev) => [...prev, res.item]);
      setIsNewItemModalOpen(false);
      setNewTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    }
  };

  const handleUpdateStatus = async (id: string, status: CalendarStatus) => {
    try {
      const res = await studioApi.calendar.update(id, { status });
      setItems((prev) => prev.map((item) => (item.id === id ? res.item : item)));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this schedule item?')) return;
    try {
      await studioApi.calendar.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handlePublishVerify = async (item: ContentCalendarItem) => {
    setPublishModalItem(item);
    setPublishFeedback(null);
    try {
      const res = await studioApi.calendar.verifyPublish(item.id);
      setPublishFeedback(res.message);
    } catch (err: any) {
      setPublishFeedback(err.message || 'Publishing verification error');
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedStatusFilter === 'All') return true;
    return item.status === selectedStatusFilter;
  });

  const getItemsForDate = (dateStr: string) => {
    return filteredItems.filter((i) => i.scheduledDate === dateStr);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-800/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-semibold mb-2">
            <CalendarIcon className="w-3.5 h-3.5" /> Omnichannel Release Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Content Calendar</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Plan, reschedule, and organize your cross-platform content release pipeline with verified publishing safety.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Schedule Content
          </button>
        </div>
      </div>

      {/* Date Navigation & Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' ? { day: 'numeric', weekday: 'short' } : {}),
            })}
          </h2>

          <button
            onClick={handleToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-medium"
          >
            Today
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['All', 'Idea', 'Script Ready', 'Media Pending', 'Ready', 'Published'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatusFilter === st
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR VIEWS */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {getWeekDays().map((dayDate, idx) => {
            const dateStr = formatDateYMD(dayDate);
            const dayItems = getItemsForDate(dateStr);
            const isToday = formatDateYMD(new Date()) === dateStr;

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-3 min-h-[380px] flex flex-col justify-between transition-all ${
                  isToday
                    ? 'bg-violet-950/20 border-violet-500/50 shadow-lg shadow-violet-500/5'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div>
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-300 bg-slate-800'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                  </div>

                  {/* Day Items List */}
                  <div className="space-y-2.5">
                    {dayItems.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic text-center py-6">
                        No videos planned
                      </p>
                    ) : (
                      dayItems.map((item) => {
                        const badge = getStatusBadge(item.status);
                        return (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2 group relative"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                {item.status}
                              </span>

                              <button
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-0.5 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <h4
                              onClick={() => item.projectId && onOpenProject && onOpenProject(item.projectId)}
                              className="text-xs font-bold text-white hover:text-violet-300 cursor-pointer line-clamp-2"
                              title={item.title}
                            >
                              {item.title}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                              <span className="flex items-center gap-1">
                                <Video className="w-3 h-3 text-cyan-400" />
                                <span className="truncate max-w-[70px]">{item.platform}</span>
                              </span>
                              <span>{item.scheduledTime || '17:00'}</span>
                            </div>

                            {/* Status Change Selector & Publish Check */}
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateStatus(item.id, e.target.value as CalendarStatus)}
                                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none"
                              >
                                <option value="Idea">Idea</option>
                                <option value="Script Ready">Script Ready</option>
                                <option value="Media Pending">Media Pending</option>
                                <option value="Ready">Ready</option>
                                <option value="Published">Published</option>
                              </select>

                              {item.status === 'Ready' && (
                                <button
                                  onClick={() => handlePublishVerify(item)}
                                  className="text-[10px] text-violet-400 hover:text-violet-300 font-bold underline"
                                >
                                  Publish...
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Day Footer Add Button */}
                <button
                  onClick={() => {
                    setNewDate(dateStr);
                    setIsNewItemModalOpen(true);
                  }}
                  className="mt-3 w-full py-1.5 border border-dashed border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 text-[11px] rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Card
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/80 text-center py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60">
            {getMonthDays().map((slot, idx) => {
              const dateStr = formatDateYMD(slot.date);
              const dayItems = getItemsForDate(dateStr);
              const isToday = formatDateYMD(new Date()) === dateStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                    slot.isCurrentMonth ? 'bg-slate-900/30' : 'bg-slate-950/50 opacity-40'
                  } ${isToday ? 'ring-1 ring-violet-500/50 bg-violet-950/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-violet-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {slot.date.getDate()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] font-extrabold text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px]">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.projectId && onOpenProject && onOpenProject(item.projectId)}
                        className="text-[10px] font-medium text-slate-200 truncate p-1 rounded bg-slate-950 border border-slate-800 hover:border-violet-500 cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setNewDate(dateStr);
                      setIsNewItemModalOpen(true);
                    }}
                    className="opacity-0 hover:opacity-100 text-[10px] text-slate-400 hover:text-white text-center pt-1"
                  >
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-extrabold text-violet-400">Day View</span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>
            <button
              onClick={() => {
                setNewDate(formatDateYMD(currentDate));
                setIsNewItemModalOpen(true);
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {getItemsForDate(formatDateYMD(currentDate)).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No content items scheduled for this date.
              </div>
            ) : (
              getItemsForDate(formatDateYMD(currentDate)).map((item) => {
                const badge = getStatusBadge(item.status);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-slate-400">{item.platform}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{item.scheduledTime || '17:00'}</span>
                      </div>
                      <h4 className="text-base font-bold text-white">{item.title}</h4>
                      {item.hook && (
                        <p className="text-xs text-violet-300 italic bg-violet-950/20 p-2 rounded-lg border border-violet-800/30">
                          Hook: "{item.hook}"
                        </p>
                      )}
                      {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as CalendarStatus)}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none"
                      >
                        <option value="Idea">Idea</option>
                        <option value="Script Ready">Script Ready</option>
                        <option value="Media Pending">Media Pending</option>
                        <option value="Ready">Ready</option>
                        <option value="Published">Published</option>
                      </select>

                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="text-xs text-red-400 hover:text-red-300 pt-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Schedule Content Card</h3>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Video Title / Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5 Black Hole Facts That Will Give You Chills"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as PlatformOption)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="YouTube Long Video">YouTube Long Video</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as CalendarStatus)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Script Ready">Script Ready</option>
                    <option value="Media Pending">Media Pending</option>
                    <option value="Ready">Ready</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Scheduled Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold"
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFIED PUBLISHING SAFETY MODAL (Requirement 5 & 14) */}
      {publishModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-amber-400">Publishing Safety Check</span>
                <h3 className="text-base font-bold text-white mt-0.5">Direct Publishing Verification</h3>
              </div>
              <button
                onClick={() => setPublishModalItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-white">Target Video: {publishModalItem.title}</p>
              <p className="text-slate-400">Platform: {publishModalItem.platform}</p>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] leading-relaxed">
                {publishFeedback || 'Checking certified channel integration credentials...'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPublishModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
