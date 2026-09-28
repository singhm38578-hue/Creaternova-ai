import React, { useState } from 'react';
import {
  Download,
  Share2,
  Sparkles,
  ChevronDown,
  Layers,
  FileCheck,
  CheckCircle2,
  Video,
  Radio,
  BookOpen,
  Copy,
  Check,
  Menu,
  Plus,
  User as UserIcon,
  Crown,
  Globe
} from 'lucide-react';
import { Project } from '../types/content';
import { ActiveTab } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLocale, SUPPORTED_CURRENCIES, SUPPORTED_UI_LANGUAGES } from '../contexts/LocaleContext';
import { CreditBadgeDropdown } from './CreditBadgeDropdown';

interface HeaderProps {
  activeTab: ActiveTab;
  activeProject: Project;
  projects: Project[];
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  onOpenExportModal: () => void;
  onOpenShareTemplateModal?: () => void;
  onToggleMobileSidebar?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProject,
  onOpenExportModal,
  onOpenShareTemplateModal,
  onToggleMobileSidebar,
  onNavigate,
}) => {
  const { user, openAuthModal, openPricingModal } = useAuth();
  const { currency, setCurrency, uiLanguage, setUiLanguage, currencySymbol } = useLocale();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'agent': return { title: 'CreatorNova AI Agent', icon: '🤖', desc: 'Natural language creator assistant, planning & execution' };
      case 'new_project': return { title: 'Create New Project', icon: '✨', desc: 'AI content creation workflow' };
      case 'overview': return { title: 'Studio Hub', icon: '✨', desc: 'Project blueprint & asset pipeline' };
      case 'calendar': return { title: 'Content Calendar', icon: '📅', desc: 'Day, week & month release schedule with publishing safety' };
      case 'series': return { title: 'Series Creator', icon: '🎞️', desc: 'Episodic series generator with brand and character consistency' };
      case 'characters': return { title: 'Character Library', icon: '🎭', desc: 'Consistent visual identities, roles, and clothing for scenes' };
      case 'tasks': return { title: 'Agent Tasks & Activity', icon: '📋', desc: 'Task queue monitor, reviews, and historical audit logs' };
      case 'library': return { title: 'Project Library', icon: '📁', desc: 'Manage, search, duplicate and filter all projects' };
      case 'ideas': return { title: 'Idea Generator', icon: '💡', desc: 'Viral concepts, hooks & audience angles' };
      case 'script': return { title: 'Script Writer', icon: '📝', desc: 'Retention-engineered screenplays & teleprompter' };
      case 'scenes': return { title: 'Scene Generator', icon: '🎬', desc: 'Production storyboard, camera shots & SFX cues' };
      case 'seo': return { title: 'SEO Generator', icon: '🔍', desc: 'High-CTR titles, tags, hashtags & descriptions' };
      case 'thumbnail': return { title: 'Thumbnail Creator', icon: '🖼️', desc: '12% CTR visual studio & psychology formulas' };
      case 'translate': return { title: 'Translate Content', icon: '🌐', desc: 'Multi-language voiceover & localized script' };
      case 'media_studio': return { title: 'AI Media Studio', icon: '🎬', desc: 'Audio voiceover, scene media, timeline & video pipeline' };
      case 'profile': return { title: 'Creator Profile', icon: '👤', desc: 'Account settings, Brand Kit, usage and subscription' };
      case 'pricing': return { title: 'Subscription Plans', icon: '👑', desc: 'Transparent India-first & global pricing' };
      case 'usage': return { title: 'Usage & Credits', icon: '⚡', desc: 'Credit wallet and billing period monitoring' };
      case 'landing': return { title: 'Landing & Demo', icon: '🚀', desc: 'Interactive creator studio overview and showcase' };
      case 'admin': return { title: 'Admin Governance', icon: '🛡️', desc: 'Platform configuration, regional pricing and limits' };
    }
  };

  const currentTabInfo = getTabTitle(activeTab);

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
      {/* Left: Mobile Menu Toggle & Active Tool Info */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <span className="text-xl sm:text-2xl">{currentTabInfo.icon}</span>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{currentTabInfo.title}</span>
            <span className="text-[11px] font-normal text-slate-400 hidden lg:inline">
              — {currentTabInfo.desc}
            </span>
          </h1>
        </div>
      </div>

      {/* Right: Controls, Credits, Project Switcher & User Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Selector */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as any)}
          className="hidden sm:block bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2 py-1 cursor-pointer hover:border-slate-600"
          title="Select Currency"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>

        {/* UI Language Selector (Separate from Content Language) */}
        <select
          value={uiLanguage}
          onChange={(e) => setUiLanguage(e.target.value as any)}
          className="hidden lg:block bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2 py-1 cursor-pointer hover:border-slate-600"
          title="Application UI Language"
        >
          {SUPPORTED_UI_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.native}
            </option>
          ))}
        </select>

        {/* Credit Wallet Dropdown */}
        <CreditBadgeDropdown
          onNavigateToUsage={() => onNavigate && onNavigate('usage')}
          onNavigateToPricing={() => onNavigate ? onNavigate('pricing') : openPricingModal()}
        />

        {/* Quick New Project Button in Header */}
        <button
          onClick={onOpenNewProject}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-violet-400" />
          <span>New</span>
        </button>

        {/* Share Project as Template Button */}
        {onOpenShareTemplateModal && (
          <button
            onClick={onOpenShareTemplateModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Share this project workflow as a template"
          >
            <Share2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Share as Template</span>
          </button>
        )}

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="max-w-[90px] sm:max-w-[140px] truncate font-semibold text-white">
              {activeProject.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between">
                <span>Switch Project</span>
                {onNavigate && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate('library');
                    }}
                    className="text-violet-400 hover:text-violet-300 text-[10px] lowercase"
                  >
                    View All →
                  </button>
                )}
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      p.id === activeProject.id
                        ? 'bg-violet-600/30 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.id === activeProject.id && (
                      <CheckCircle2 className="w-3 h-3 text-violet-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800 mt-1.5 pt-1.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-violet-400 hover:bg-violet-950/40 hover:text-violet-300 font-semibold cursor-pointer"
                >
                  + Create New Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar / Sign In */}
        {user ? (
          <button
            onClick={() => onNavigate && onNavigate('profile')}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Open Profile"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.slice(0, 1)
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
