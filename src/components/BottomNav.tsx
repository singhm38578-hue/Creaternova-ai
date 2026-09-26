import React from 'react';
import {
  Home,
  FolderOpen,
  PlusCircle,
  Film,
  User,
  Bot,
  Calendar
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenCreate: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onOpenCreate,
}) => {
  const tabs = [
    { id: 'agent' as ActiveTab, label: 'AI Agent', icon: Bot, isAgent: true },
    { id: 'overview' as ActiveTab, label: 'Hub', icon: Home },
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: Calendar },
    { id: 'library' as ActiveTab, label: 'Projects', icon: FolderOpen },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === 'profile'
              ? activeTab === 'profile'
              : tab.id === 'library'
              ? activeTab === 'library'
              : tab.id === 'calendar'
              ? activeTab === 'calendar'
              : tab.id === 'agent'
              ? activeTab === 'agent'
              : tab.id === 'overview'
              ? activeTab === 'overview' || activeTab === 'ideas' || activeTab === 'script' || activeTab === 'scenes' || activeTab === 'seo' || activeTab === 'thumbnail' || activeTab === 'translate' || activeTab === 'media_studio'
              : activeTab === tab.id;

          if (tab.isAgent) {
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate('agent')}
                className="flex flex-col items-center justify-center p-1 cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white ring-2 ring-violet-400 shadow-violet-600/50'
                    : 'bg-violet-950/80 text-violet-300 border border-violet-500/40'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-violet-400' : 'text-slate-400'}`}>
                  AI Agent
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-violet-400' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-violet-400 mt-0.5 shadow-sm shadow-violet-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
