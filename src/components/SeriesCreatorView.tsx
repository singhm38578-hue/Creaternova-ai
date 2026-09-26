import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Sparkles,
  Bot,
  Video,
  Clock,
  Languages,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Layers,
  ChevronRight,
  Palette,
  Play
} from 'lucide-react';
import { Series, Character } from '../types/content';
import { studioApi } from '../services/api';

interface SeriesCreatorViewProps {
  onGenerateEpisodeProject?: (promptText: string) => void;
  characters?: Character[];
}

export const SeriesCreatorView: React.FC<SeriesCreatorViewProps> = ({
  onGenerateEpisodeProject,
  characters = [],
}) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [seriesName, setSeriesName] = useState('Amazing Space');
  const [topic, setTopic] = useState('Bizarre exoplanets, black hole physics, and deep cosmos anomalies');
  const [numberOfEpisodes, setNumberOfEpisodes] = useState<number>(5);
  const [platform, setPlatform] = useState('YouTube Shorts');
  const [duration, setDuration] = useState('60 seconds');
  const [language, setLanguage] = useState('English');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    characters.length > 0 ? characters[0].id : ''
  );
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const res = await studioApi.series.list();
      setSeriesList(res.series || []);
    } catch (err: any) {
      console.error('Failed to load series:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesName.trim() || !topic.trim()) {
      setError('Series Name and Topic are required.');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const res = await studioApi.series.create({
        seriesName,
        topic,
        numberOfEpisodes,
        platform,
        duration,
        language,
        useBrandKit: true,
        selectedCharacterId: selectedCharacterId || undefined,
      });

      setSeriesList((prev) => [res.series, ...prev]);
      // Reset form to creative defaults
      setSeriesName('');
      setTopic('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate series');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this series?')) return;
    try {
      await studioApi.series.delete(id);
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleLaunchEpisode = (series: Series, ep: any) => {
    const prompt = `Create a ${series.platform} for Episode ${ep.episodeNumber} of "${series.seriesName}": "${ep.title}". Hook: "${ep.hook}". Language: ${series.language}.`;
    if (onGenerateEpisodeProject) {
      onGenerateEpisodeProject(prompt);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-semibold mb-2">
            <Film className="w-3.5 h-3.5" /> Episodic Retention Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Series Creator</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Automatically create episodic video series where each episode features a distinct viral angle while maintaining unified series branding, recurring hooks, and host identity.
          </p>
        </div>
      </div>

      {/* Series Creation Form Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Create a New Series</h2>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateSeries} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Series Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amazing Space, Mind-Bending Paradoxes, Tiny Titans"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Core Topic & Premise *</label>
              <input
                type="text"
                required
                placeholder="e.g. Extreme exoplanets and cosmic anomalies explained simply"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Number of Episodes</label>
              <input
                type="number"
                min={2}
                max={12}
                value={numberOfEpisodes}
                onChange={(e) => setNumberOfEpisodes(parseInt(e.target.value) || 5)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="YouTube Long Video">YouTube Long Video</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram Reels">Instagram Reels</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="30 seconds">30 seconds</option>
                <option value="60 seconds">60 seconds</option>
                <option value="1–3 minutes">1–3 minutes</option>
                <option value="5–10 minutes">5–10 minutes</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>

          {characters.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-violet-400" /> Host Character Continuity
              </label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Default Brand Kit Voice</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Formulating {numberOfEpisodes} Episodes...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Generate Series with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Series List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" /> Saved Series ({seriesList.length})
        </h3>

        {loading ? (
          <div className="h-40 rounded-2xl bg-slate-900 animate-pulse" />
        ) : seriesList.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-500">
            No video series created yet. Formulate your first series above!
          </div>
        ) : (
          <div className="space-y-6">
            {seriesList.map((series) => (
              <div
                key={series.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
              >
                {/* Series Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/40">
                        {series.numberOfEpisodes} Episodes
                      </span>
                      <span className="text-xs text-slate-400">{series.platform}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{series.duration}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{series.language}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mt-1">{series.seriesName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{series.topic}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(series.id)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors self-start sm:self-auto"
                    title="Delete Series"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Recurring Elements Summary */}
                {series.recurringElements && (
                  <div className="p-3 bg-violet-950/20 border border-violet-800/30 rounded-xl text-xs text-violet-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Series Identity & Consistency:</span>{' '}
                      {series.recurringElements}
                    </div>
                  </div>
                )}

                {/* Episodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {series.episodeIdeas?.map((ep) => (
                    <div
                      key={ep.episodeNumber}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Episode {ep.episodeNumber}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white">{ep.title}</h5>
                        <p className="text-xs text-violet-300 italic">"{ep.hook}"</p>
                        <p className="text-[11px] text-slate-400">{ep.concept}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex justify-end">
                        <button
                          onClick={() => handleLaunchEpisode(series, ep)}
                          className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" /> Create With Agent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
