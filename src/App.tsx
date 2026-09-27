/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { IdeaGenerator } from './components/IdeaGenerator';
import { ScriptWriter } from './components/ScriptWriter';
import { SceneGenerator } from './components/SceneGenerator';
import { SEOGenerator } from './components/SEOGenerator';
import { ThumbnailCreator } from './components/ThumbnailCreator';
import { TranslateContent } from './components/TranslateContent';
import { AIMediaStudio } from './components/AIMediaStudio';
import { NewProjectWorkflow } from './components/NewProjectWorkflow';
import { NewProjectModal } from './components/NewProjectModal';
import { ProjectExportModal } from './components/ProjectExportModal';
import { ProjectLibrary } from './components/ProjectLibrary';
import { UserProfileView } from './components/UserProfileView';
import { PricingScreen } from './components/PricingScreen';
import { UsageDashboard } from './components/UsageDashboard';
import { LandingPageView } from './components/LandingPageView';
import { AdminPanel } from './components/AdminPanel';
import { CreatorNovaAgentView } from './components/CreatorNovaAgentView';
import { ContentCalendarView } from './components/ContentCalendarView';
import { SeriesCreatorView } from './components/SeriesCreatorView';
import { CharacterLibraryView } from './components/CharacterLibraryView';
import { AgentTasksView } from './components/AgentTasksView';
import { RepurposingAgentModal } from './components/RepurposingAgentModal';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { InsufficientCreditModal } from './components/InsufficientCreditModal';
import { useAuth } from './contexts/AuthContext';
import { IdeaItem, Project, Character } from './types/content';
import {
  getStoredProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
} from './services/storage';
import { studioApi } from './services/api';

export default function App() {
  const { user, isPricingModalOpen, closePricingModal } = useAuth();
  const [projects, setProjects] = useState<Project[]>(() => getStoredProjects());
  const [activeProjectId, setActiveId] = useState<string>(() =>
    getActiveProjectId(getStoredProjects())
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRepurposeModalOpen, setIsRepurposeModalOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string>('');

  // Cross-tool handoff states
  const [scriptPrefillTitle, setScriptPrefillTitle] = useState<string | undefined>();
  const [scenePrefillScript, setScenePrefillScript] = useState<string | undefined>();

  // Ensure active project exists
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Save changes to storage whenever projects update
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Save active project id
  useEffect(() => {
    if (activeProjectId) {
      setActiveProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  // Sync projects and characters with server on mount or when user changes
  useEffect(() => {
    const syncProjectsAndCharacters = async () => {
      try {
        const [res, charsRes] = await Promise.all([
          studioApi.projects.list(),
          studioApi.characters.list().catch(() => ({ characters: [] })),
        ]);
        if (res.projects && res.projects.length > 0) {
          setProjects(res.projects);
          if (!activeProjectId || !res.projects.some((p) => p.id === activeProjectId)) {
            setActiveId(res.projects[0].id);
          }
        }
        if (charsRes.characters && charsRes.characters.length > 0) {
          setCharacters(charsRes.characters);
          if (!activeCharacterId) {
            setActiveCharacterId(charsRes.characters[0].id);
          }
        }
      } catch (err) {
        // Fallback to local storage
      }
    };
    syncProjectsAndCharacters();
  }, [user]);

  // Project modification handler
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    studioApi.projects.update(updatedProject.id, updatedProject).catch(console.error);
  };

  // Switch project
  const handleSelectProject = (id: string) => {
    setActiveId(id);
  };

  // Delete project
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      setActiveId(remaining[0].id);
    }
    studioApi.projects.delete(id).catch(console.error);
  };

  // Open New Project workflow (full screen flow)
  const handleOpenNewProject = () => {
    setActiveTab('new_project');
  };

  // Save generated project from NewProjectWorkflow
  const handleSaveGeneratedProject = (newProject: Project) => {
    // Check if project already exists, if so update it, otherwise prepend
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === newProject.id);
      if (exists) {
        return prev.map((p) => (p.id === newProject.id ? newProject : p));
      }
      return [newProject, ...prev];
    });
    setActiveId(newProject.id);
    studioApi.projects.save(newProject).catch(console.error);
  };

  // Create new project from quick modal
  const handleCreateProjectModal = async (newProject: Project, autoGenerateIdeas: boolean) => {
    const updatedList = [newProject, ...projects];
    setProjects(updatedList);
    setActiveId(newProject.id);
    setActiveTab('ideas');
    studioApi.projects.save(newProject).catch(console.error);

    if (autoGenerateIdeas) {
      try {
        const res = await studioApi.generateIdeas({
          topic: newProject.topic,
          format: newProject.format,
          targetAudience: newProject.targetAudience,
          tone: newProject.tone,
          count: 3,
        });

        if (res.ideas && Array.isArray(res.ideas)) {
          const generatedIdeas: IdeaItem[] = res.ideas.map((item, idx) => ({
            id: item.id || `idea-${Date.now()}-${idx}`,
            title: item.title || 'Viral Concept',
            hook: item.hook || 'Opening Hook',
            viralityScore: Number(item.viralityScore) || 92,
            format: item.format || newProject.format,
            durationEstimate: item.durationEstimate || '60 seconds',
            angle: item.angle || 'Curiosity angle',
            targetAudience: item.targetAudience || newProject.targetAudience,
            coreTakeaway: item.coreTakeaway || '',
            suggestedVisualHook: item.suggestedVisualHook || 'Visual zoom',
            retentionTip: item.retentionTip || 'Fast pacing',
            createdAt: new Date().toISOString(),
          }));

          const updatedProjWithIdeas = {
            ...newProject,
            ideas: generatedIdeas,
            updatedAt: new Date().toISOString(),
          };

          setProjects((prev) =>
            prev.map((p) => (p.id === newProject.id ? updatedProjWithIdeas : p))
          );
          studioApi.projects.update(newProject.id, updatedProjWithIdeas).catch(console.error);
        }
      } catch (err) {
        console.error('Failed auto-generating ideas for new project', err);
      }
    }
  };

  // Send an idea to the script writer
  const handleSendIdeaToScript = (idea: IdeaItem) => {
    setScriptPrefillTitle(idea.title);
    setActiveTab('script');
  };

  // Send script to scene generator
  const handleSendScriptToScenes = (scriptText: string) => {
    setScenePrefillScript(scriptText);
    setActiveTab('scenes');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left Sidebar (with responsive drawer for mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onOpenNewProject={handleOpenNewProject}
        onDeleteProject={handleDeleteProject}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          activeTab={activeTab}
          activeProject={activeProject}
          projects={projects}
          onSelectProject={handleSelectProject}
          onOpenNewProject={handleOpenNewProject}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Scrollable Tool Body with bottom padding on mobile for BottomNav */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950 pb-20 md:pb-0">
          {activeTab === 'agent' && (
            <CreatorNovaAgentView
              onOpenProject={(id) => {
                handleSelectProject(id);
                setActiveTab('overview');
              }}
              onOpenNewProjectWorkflow={handleOpenNewProject}
              onOpenCalendar={() => setActiveTab('calendar')}
              onOpenSeriesCreator={() => setActiveTab('series')}
              onOpenRepurpose={() => setIsRepurposeModalOpen(true)}
              onOpenCharacters={() => setActiveTab('characters')}
            />
          )}

          {activeTab === 'new_project' && (
            <NewProjectWorkflow
              onSaveProject={handleSaveGeneratedProject}
              onCancel={() => setActiveTab('overview')}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              project={activeProject}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenExport={() => setIsExportModalOpen(true)}
              onOpenNewProject={handleOpenNewProject}
              onAskAgent={(cmd) => {
                setActiveTab('agent');
              }}
              onOpenSeriesCreator={() => setActiveTab('series')}
              onOpenRepurpose={() => setIsRepurposeModalOpen(true)}
              onOpenCalendar={() => setActiveTab('calendar')}
              characters={characters}
            />
          )}

          {activeTab === 'calendar' && (
            <ContentCalendarView
              onOpenProject={(id) => {
                handleSelectProject(id);
                setActiveTab('overview');
              }}
              onOpenNewPlan={() => setActiveTab('agent')}
            />
          )}

          {activeTab === 'series' && (
            <SeriesCreatorView
              characters={characters}
              onGenerateEpisodeProject={(prompt) => {
                setActiveTab('agent');
              }}
            />
          )}

          {activeTab === 'characters' && (
            <CharacterLibraryView
              activeCharacterId={activeCharacterId}
              onSelectActiveCharacter={(char) => setActiveCharacterId(char.id)}
            />
          )}

          {activeTab === 'tasks' && (
            <AgentTasksView
              onOpenProject={(id) => {
                handleSelectProject(id);
                setActiveTab('overview');
              }}
            />
          )}

          {activeTab === 'library' && (
            <ProjectLibrary
              onSelectProject={(id) => {
                handleSelectProject(id);
                setActiveTab('overview');
              }}
              onOpenNewProject={handleOpenNewProject}
              activeProjectId={activeProjectId}
            />
          )}

          {activeTab === 'ideas' && (
            <IdeaGenerator
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onSendToScript={handleSendIdeaToScript}
            />
          )}

          {activeTab === 'script' && (
            <ScriptWriter
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onSendToScenes={handleSendScriptToScenes}
              initialTitle={scriptPrefillTitle}
            />
          )}

          {activeTab === 'scenes' && (
            <SceneGenerator
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              initialScriptContext={scenePrefillScript}
              onNavigateToMediaStudio={(_sceneId) => {
                setActiveTab('media_studio');
              }}
            />
          )}

          {activeTab === 'seo' && (
            <SEOGenerator
              project={activeProject}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {activeTab === 'thumbnail' && (
            <ThumbnailCreator
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToMediaStudio={() => setActiveTab('media_studio')}
            />
          )}

          {activeTab === 'translate' && (
            <TranslateContent
              project={activeProject}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {activeTab === 'media_studio' && (
            <AIMediaStudio
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'profile' && (
            <UserProfileView />
          )}

          {activeTab === 'pricing' && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
              <PricingScreen onNavigateToUsage={() => setActiveTab('usage')} />
            </div>
          )}

          {activeTab === 'usage' && (
            <UsageDashboard />
          )}

          {activeTab === 'landing' && (
            <LandingPageView
              onStartCreating={() => setActiveTab('overview')}
              onOpenPricing={() => setActiveTab('pricing')}
              onOpenAgent={() => setActiveTab('agent')}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenCreate={handleOpenNewProject}
      />

      {/* Quick Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProjectModal}
      />

      <RepurposingAgentModal
        isOpen={isRepurposeModalOpen}
        onClose={() => setIsRepurposeModalOpen(false)}
        projects={projects}
        activeProject={activeProject}
        onProjectAdapted={(newProj) => {
          handleSaveGeneratedProject(newProj);
        }}
      />

      <ProjectExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={activeProject}
      />

      {/* SaaS Auth & Insufficient Credits Modals */}
      <AuthModal />
      <InsufficientCreditModal />

      {/* Pricing Modal triggered from header or upgrade actions */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-5xl my-8">
            <PricingScreen
              onClose={closePricingModal}
              onNavigateToUsage={() => {
                closePricingModal();
                setActiveTab('usage');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
