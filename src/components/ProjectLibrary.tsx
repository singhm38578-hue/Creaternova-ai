import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Film,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Check,
  LayoutGrid,
  List,
  ChevronDown,
  RefreshCw,
  X,
  Share2
} from 'lucide-react';
import { Project } from '../types/content';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ShareTemplateModal } from './ShareTemplateModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface ProjectLibraryProps {
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  activeProjectId?: string;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  onSelectProject,
  onOpenNewProject,
  activeProjectId,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [contentTypeFilter, setContentTypeFilter] = useState('All');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'alpha'>('newest');

  // Rename modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');

  // Share as Template modal state
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Autosave toast indicator
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await studioApi.projects.list({
        search: search.trim() || undefined,
        platform: platformFilter,
        language: languageFilter,
        contentType: contentTypeFilter,
        sort: sortOption,
      });
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed fetching projects library:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, platformFilter, languageFilter, contentTypeFilter, sortOption]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !newName.trim()) return;

    try {
      const updated = { ...editingProject, name: newName.trim() };
      await studioApi.projects.update(editingProject.id, updated);
      setSaveIndicator(`"Saved"`);
      setTimeout(() => setSaveIndicator(null), 2500);
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await studioApi.projects.duplicate(projectId);
      setSaveIndicator(`"Saved" Project Duplicated`);
      setTimeout(() => setSaveIndicator(null), 2500);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await studioApi.projects.delete(projectId);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const platforms = ['All', 'YouTube Shorts', 'YouTube Long Video', 'Instagram Reels', 'TikTok', 'Facebook', 'Other'];
  const languages = ['All', 'English', 'Hindi', 'Spanish', 'Portuguese', 'French', 'German', 'Japanese', 'Korean', 'Arabic'];
  const contentTypes = ['All', 'Educational', 'Kids', 'Facts', 'Story', 'Entertainment', 'Business', 'Motivation', 'Product/Marketing'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Project Library</h1>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personal persistent workspace with autosave, version duplicating, and multi-format filters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveIndicator && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{saveIndicator}</span>
            </div>
          )}

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name, topic, or target audience..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={fetchProjects}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Library"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Platform</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Language</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Content Type</label>
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
            >
              {contentTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort By</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
            >
              <option value="newest">Recently Updated</option>
              <option value="oldest">Oldest First</option>
              <option value="alpha">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-violet-400 mb-2" />
          <span>Loading project library...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Film className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No projects found</h3>
            <p className="text-xs text-slate-400">
              {search || platformFilter !== 'All' || languageFilter !== 'All'
                ? 'Try adjusting your filters or search keywords.'
                : 'Create your first project to start generating content.'}
            </p>
          </div>
          <button
            onClick={onOpenNewProject}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Create New Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`group bg-slate-900/80 border rounded-2xl p-5 space-y-4 hover:border-violet-500/50 hover:bg-slate-900 transition-all cursor-pointer relative shadow-lg ${
                  isActive ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-violet-950/80 text-violet-300 border border-violet-800/40">
                        {proj.platform || proj.format?.replace('_', ' ')}
                      </span>
                      {proj.language && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {proj.language}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                      {proj.name}
                    </h3>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSharingProject(proj)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-slate-800 transition-colors"
                      title="Share as Template"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingProject(proj);
                        setNewName(proj.name);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(proj.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {proj.topic}
                </p>

                {/* Metrics footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{proj.duration || '60s'}</span>
                  </span>

                  <span>
                    {proj.scenes?.length || 0} Scenes • {proj.script?.wordCount || 0} Words
                  </span>

                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Saved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Scenes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {projects.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                    {proj.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40">
                      {proj.platform || proj.format}
                    </span>
                  </td>
                  <td className="py-3 px-4">{proj.language || 'English'}</td>
                  <td className="py-3 px-4">{proj.scenes?.length || 0} shots</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono text-[10px]">Saved</td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSharingProject(proj)}
                        className="p-1 text-slate-400 hover:text-violet-300"
                        title="Share as Template"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProject(proj);
                          setNewName(proj.name);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(proj.id, e)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-1 text-slate-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rename Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleRename}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Rename Project</h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Project Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share as Template Modal */}
      {sharingProject && (
        <ShareTemplateModal
          isOpen={true}
          project={sharingProject}
          onClose={() => setSharingProject(null)}
          onOpenPreview={(templateId) => setPreviewTemplateId(templateId)}
        />
      )}

      {/* Template Preview Modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          isOpen={true}
          templateId={previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
          onProjectCreated={(newProj) => {
            fetchProjects();
            onSelectProject(newProj.id);
            setSaveIndicator('"Saved" Template Cloned into Your Projects!');
            setTimeout(() => setSaveIndicator(null), 3000);
          }}
        />
      )}
    </div>
  );
};

