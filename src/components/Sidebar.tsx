import React from 'react';
import {
  Sparkles,
  Lightbulb,
  FileText,
  Clapperboard,
  Search,
  Image as ImageIcon,
  Languages,
  Plus,
  Trash2,
  FolderOpen,
  ChevronRight,
  Flame,
  Film,
  X,
  Wand2,
  User as UserIcon,
  Crown,
  Coins,
  Settings,
  ShieldCheck,
  Palette,
  Bot,
  Calendar,
  Layers,
  ListChecks
} from 'lucide-react';
import { Project } from '../types/content';
import { useAuth } from '../contexts/AuthContext';
import { Globe } from 'lucide-react';

export type ActiveTab =
  | 'agent'
  | 'new_project'
  | 'overview'
  | 'calendar'
  | 'series'
  | 'characters'
  | 'tasks'
  | 'library'
  | 'ideas'
  | 'script'
  | 'scenes'
  | 'seo'
  | 'thumbnail'
  | 'translate'
  | 'media_studio'
  | 'profile'
  | 'pricing'
  | 'usage'
  | 'landing'
  | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  onDeleteProject: (projectId: string, e: React.MouseEvent) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  activeProject,
  onSelectProject,
  onOpenNewProject,
  onDeleteProject,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, credits, openAuthModal, openPricingModal } = useAuth();

  const navItems = [
    { id: 'agent' as ActiveTab, label: '🤖 CreatorNova Agent', icon: Bot, color: 'text-violet-400', isNew: true },
    { id: 'overview' as ActiveTab, label: '✨ Studio Hub', icon: Sparkles, color: 'text-amber-400' },
    { id: 'calendar' as ActiveTab, label: '📅 Content Calendar', icon: Calendar, color: 'text-cyan-400', isNew: true },
    { id: 'series' as ActiveTab, label: '🎞️ Series Creator', icon: Layers, color: 'text-purple-400', isNew: true },
    { id: 'characters' as ActiveTab, label: '🎭 Character Library', icon: Palette, color: 'text-pink-400', isNew: true },
    { id: 'tasks' as ActiveTab, label: '📋 Agent Tasks', icon: ListChecks, color: 'text-emerald-400', isNew: true },
    { id: 'library' as ActiveTab, label: '📁 Project Library', icon: FolderOpen, color: 'text-indigo-400' },
    { id: 'media_studio' as ActiveTab, label: '🎬 AI Media Studio', icon: Film, color: 'text-rose-400' },
    { id: 'ideas' as ActiveTab, label: '💡 Idea Generator', icon: Lightbulb, color: 'text-yellow-400' },
    { id: 'script' as ActiveTab, label: '📝 Script Writer', icon: FileText, color: 'text-blue-400' },
    { id: 'scenes' as ActiveTab, label: '🎬 Scene Generator', icon: Clapperboard, color: 'text-purple-400' },
    { id: 'seo' as ActiveTab, label: '🔍 SEO Generator', icon: Search, color: 'text-emerald-400' },
    { id: 'thumbnail' as ActiveTab, label: '🖼️ Thumbnail Creator', icon: ImageIcon, color: 'text-pink-400' },
    { id: 'translate' as ActiveTab, label: '🌐 Translate Content', icon: Languages, color: 'text-cyan-400' },
    { id: 'landing' as ActiveTab, label: '🚀 Landing & Demo', icon: Globe, color: 'text-cyan-300' },
    ...(user?.role === 'admin'
      ? [{ id: 'admin' as ActiveTab, label: '🛡️ Admin & Pricing', icon: ShieldCheck, color: 'text-rose-400' }]
      : []),
  ];

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'youtube_short':
      case 'tiktok':
      case 'instagram_reel':
        return { label: 'Short', bg: 'bg-red-950/60 text-red-400 border-red-800/40' };
      case 'podcast':
        return { label: 'Audio', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/40' };
      case 'educational':
        return { label: 'Edu', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' };
      default:
        return { label: 'Video', bg: 'bg-blue-950/60 text-blue-400 border-blue-800/40' };
    }
  };

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectProj = (id: string) => {
    onSelectProject(id);
    if (activeTab === 'new_project') {
      setActiveTab('overview');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewProjectClick = () => {
    onOpenNewProject();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none shrink-0 overflow-hidden transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20 ring-1 ring-white/20">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">CreatorNova</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/40">AI</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Create Content With AI</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Button: Generate Content */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-900/40">
          <button
            onClick={handleNewProjectClick}
            className={`w-full flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${
              activeTab === 'new_project'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-violet-500/30 ring-2 ring-violet-400/40'
                : 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600 hover:to-indigo-600 text-violet-200 hover:text-white border border-violet-500/40 hover:border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>✨ Generate Content</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Navigation Section */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Studio Tools
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/40 shadow-sm shadow-violet-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.color} ${
                        isActive ? 'scale-110' : ''
                      }`}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.isNew && (
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        NEW
                      </span>
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800/80 mx-2" />

          {/* Recent Projects Section */}
          <div>
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                Recent Projects
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                {projects.length}
              </span>
            </div>

            <div className="space-y-1">
              {projects.map((proj) => {
                const isSelected = activeProject.id === proj.id && activeTab !== 'new_project';
                const badge = getFormatBadge(proj.format);

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProj(proj.id)}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800/80 text-white border-violet-500/50 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Film className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                      <span className="truncate font-medium text-xs">{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {projects.length > 1 && (
                        <button
                          title="Delete project"
                          onClick={(e) => onDeleteProject(proj.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity text-slate-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* New Project Button */}
            <div className="mt-3 px-1">
              <button
                onClick={handleNewProjectClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-violet-300 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-600/40 hover:border-violet-500 transition-all shadow-sm group cursor-pointer"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 text-violet-400" />
                <span>[ + New Project ]</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Account / Profile Footer */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/80 space-y-2">
          {user ? (
            <div
              onClick={() => handleNavClick('profile')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                activeTab === 'profile'
                  ? 'bg-violet-950/60 border-violet-500/60 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-750 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.name.slice(0, 1)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 bg-violet-600/30 text-violet-300 rounded font-mono font-bold">
                      {user.plan}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    {credits?.totalRemaining !== undefined ? credits.totalRemaining : 50} credits
                  </div>
                </div>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Create Account</span>
            </button>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-slate-400 text-center">
            <button
              onClick={() => handleNavClick('pricing')}
              className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white transition-colors cursor-pointer"
            >
              Plans & Pricing
            </button>
            <button
              onClick={() => handleNavClick('usage')}
              className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-white transition-colors cursor-pointer"
            >
              Usage Wallet
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
