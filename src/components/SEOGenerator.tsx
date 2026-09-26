import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  Tag,
  Hash,
  FileText,
  Award,
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project, SEOData } from '../types/content';
import { studioApi } from '../services/api';

interface SEOGeneratorProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const SEOGenerator: React.FC<SEOGeneratorProps> = ({
  project,
  onUpdateProject,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const currentSeo = project.seo;

  const handleGenerateSEO = async () => {
    setIsLoading(true);
    try {
      const res = await studioApi.generateSeo({
        title: project.script?.title || project.name,
        topic: project.topic,
        scriptText: project.script?.rawFullText,
        targetAudience: project.targetAudience,
      });

      if (res.seo) {
        onUpdateProject({
          ...project,
          seo: res.seo as SEOData,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed generating SEO', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !currentSeo) return;
    const updatedTags = [...currentSeo.tags, newTagInput.trim().toLowerCase()];
    onUpdateProject({
      ...project,
      seo: { ...currentSeo, tags: updatedTags },
      updatedAt: new Date().toISOString(),
    });
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!currentSeo) return;
    const updatedTags = currentSeo.tags.filter((t) => t !== tagToRemove);
    onUpdateProject({
      ...project,
      seo: { ...currentSeo, tags: updatedTags },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI YouTube & TikTok SEO Suite</h2>
            <p className="text-xs text-slate-400">High-ranking titles, 1-click copy tags, formatted description & hashtag engine</p>
          </div>
        </div>

        <button
          onClick={handleGenerateSEO}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Optimizing Metadata...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{currentSeo ? 'Regenerate SEO' : 'Generate Full SEO Suite'}</span>
            </>
          )}
        </button>
      </div>

      {currentSeo ? (
        <div className="space-y-6">
          {/* SEO Health Overview Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-emerald-400">SCORE</span>
                <span className="text-xl font-extrabold text-white leading-none">
                  {currentSeo.seoHealthScore}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">SEO Health Optimization: Excellent</h4>
                <p className="text-xs text-slate-400">
                  Targeted category: <span className="text-emerald-300 font-semibold">{currentSeo.category}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{currentSeo.titles.length} High-CTR Titles</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{currentSeo.tags.length} Search Tags</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{currentSeo.hashtags.length} Hashtags</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: High-CTR Title Laboratory */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                High-CTR Video Title Variations
              </h3>
              <span className="text-xs text-slate-400">Ranked by predicted Click-Through Rate</span>
            </div>

            <div className="space-y-3">
              {currentSeo.titles.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {t.score}% CTR Score
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t.title.length} characters (Optimal: 50-65)
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {t.title}
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(t.title, `title-${idx}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedType === `title-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Description Master & Tags Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  YouTube Video Description
                </h3>
                <button
                  onClick={() => copyToClipboard(currentSeo.description, 'description')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedType === 'description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'description' ? 'Copied!' : 'Copy Description'}</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={currentSeo.description}
                onChange={(e) =>
                  onUpdateProject({
                    ...project,
                    seo: { ...currentSeo, description: e.target.value },
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-none selection:bg-cyan-600"
              />
            </div>

            {/* Tags & Hashtags */}
            <div className="space-y-6">
              {/* Tags Vault */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    YouTube Studio Tags ({currentSeo.tags.length})
                  </h3>
                  <button
                    onClick={() => copyToClipboard(currentSeo.tags.join(', '), 'all-tags')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedType === 'all-tags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'all-tags' ? 'Copied All!' : 'Copy All Tags (Comma)'}</span>
                  </button>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {currentSeo.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-xs font-medium group hover:border-slate-700"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Tag Form */}
                <form onSubmit={handleAddTag} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Add custom keyword or tag..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    Add Tag
                  </button>
                </form>
              </div>

              {/* Hashtag Suite */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-violet-400" />
                    Trending Hashtags
                  </h3>
                  <button
                    onClick={() => copyToClipboard(currentSeo.hashtags.join(' '), 'all-hashtags')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedType === 'all-hashtags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'all-hashtags' ? 'Copied!' : 'Copy All Hashtags'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentSeo.hashtags.map((h, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-violet-950/40 text-violet-300 border border-violet-800/50 text-xs font-semibold"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No SEO metadata generated yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Generate high-CTR YouTube titles, copy-paste keyword tags, hashtags, and a formatted description optimized for search algorithms.
          </p>
          <button
            onClick={handleGenerateSEO}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            Generate SEO Metadata
          </button>
        </div>
      )}
    </div>
  );
};
