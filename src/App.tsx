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
import { OnboardingFlow } from './components/OnboardingFlow';
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
import { ShareTemplateModal } from './components/ShareTemplateModal';
import { TemplatePreviewModal } from './components/TemplatePreviewModal';
import { PrivacyPolicyView } from './components/legal/PrivacyPolicyView';
import { TermsOfServiceView } from './components/legal/TermsOfServiceView';
import { ContactSupportView } from './components/support/ContactSupportView';
import { SecurityNoticeModal } from './components/security/SecurityNoticeModal';
import { useAuth } from './contexts/AuthContext';
import {
  IdeaItem,
  Project,
  Character,
  ContentFormat,
  PlatformOption,
  ContentTypeOption,
  ToneType,
} from './types/content';
import {
  getStoredProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
} from './services/storage';
import { studioApi } from './services/api';
import { analytics } from './services/analytics';

export default function App() {
  const {
    user,
    openAuthModal,
    openPricingModal,
    isPricingModalOpen,
    closePricingModal,
    updateProfile,
  } = useAuth();
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
  const [isShareTemplateModalOpen, setIsShareTemplateModalOpen] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [referralBanner, setReferralBanner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string>('');

  // Cross-tool handoff states
  const [scriptPrefillTitle, setScriptPrefillTitle] = useState<string | undefined>();
  const [scenePrefillScript, setScenePrefillScript] = useState<string | undefined>();

  // Ensure active project exists
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0];

  // Inspect URL for shareable template, referral link, or legal/support paths on mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const templateParam = searchParams.get('template');
      const refParam = searchParams.get('ref');

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const pathTemplate = pathParts[0] === 'template' ? pathParts[1] : null;
      const pathRef = pathParts[0] === 'ref' ? pathParts[1] : null;

      if (pathParts[0] === 'privacy') {
        setActiveTab('privacy');
      } else if (pathParts[0] === 'terms') {
        setActiveTab('terms');
      } else if (pathParts[0] === 'contact') {
        setActiveTab('contact');
      } else if (pathParts[0] === 'pricing') {
        setActiveTab('pricing');
      }

      const activeTemplate = templateParam || pathTemplate;
      if (activeTemplate) {
        setPreviewTemplateId(activeTemplate);
      }

      const activeRef = refParam || pathRef;
      if (activeRef) {
        localStorage.setItem('creatornova_referral_code', activeRef);
        studioApi.referrals.recordClick(activeRef).catch(() => {});
        setReferralBanner('Welcome to CreatorNova! You were invited by a creator. Sign up to get bonus credits!');
      }

      const handlePopState = () => {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts[0] === 'privacy') setActiveTab('privacy');
        else if (parts[0] === 'terms') setActiveTab('terms');
        else if (parts[0] === 'contact') setActiveTab('contact');
        else if (parts[0] === 'pricing') setActiveTab('pricing');
        else setActiveTab('overview');
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch (e) {
      console.warn('URL parsing error:', e);
    }
  }, []);

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

    // Check if user was in middle of using a template before sign-in (Requirement 3)
    if (user) {
      const pendingTemplateId = localStorage.getItem('pending_template_to_use');
      if (pendingTemplateId) {
        setPreviewTemplateId(pendingTemplateId);
        localStorage.removeItem('pending_template_to_use');
      }

      // Check if user signed up with a referral code (Requirement 6 & 8)
      const storedRef = localStorage.getItem('creatornova_referral_code');
      if (storedRef) {
        studioApi.referrals.recordSignup(storedRef)
          .then((res) => {
            if (res.success) {
              localStorage.removeItem('creatornova_referral_code');
            }
          })
          .catch(() => {});
      }
    }
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

  // Handle Onboarding Completion (Requirement 7)
  const handleOnboardingComplete = async (preferences: {
    creationType: string;
    language: string;
    goals: string[];
    topic: string;
  }) => {
    try {
      const topicTitle = preferences.topic.trim() || 'My First Content Project';
      const isShortFormat =
        preferences.creationType === 'Shorts/Reels' ||
        preferences.creationType.toLowerCase().includes('short') ||
        preferences.creationType.toLowerCase().includes('reel');

      const format: ContentFormat = isShortFormat ? 'youtube_short' : 'youtube_long';
      const platform: PlatformOption =
        preferences.creationType === 'Shorts/Reels'
          ? 'YouTube Shorts'
          : preferences.creationType === 'YouTube'
          ? 'YouTube Long Video'
          : 'Other';
      const contentType: ContentTypeOption =
        preferences.creationType === 'Business Content'
          ? 'Business'
          : preferences.creationType === 'Educational Content'
          ? 'Educational'
          : 'Entertainment';
      const tone: ToneType = 'engaging_energetic';

      const firstProject: Project = {
        id: `proj-${Date.now()}`,
        name: topicTitle.length > 45 ? `${topicTitle.substring(0, 42)}...` : topicTitle,
        topic: topicTitle,
        format,
        targetAudience: 'General Audience',
        tone,
        platform,
        contentType,
        language: (preferences.language as any) || 'English',
        ideas: [],
        scenes: [],
        seo: {
          titles: [
            {
              title: topicTitle,
              score: 92,
              category: 'Curiosity Gap',
              characterCount: topicTitle.length,
            },
          ],
          description: `Discover everything about ${topicTitle}. Plan, script, and create with CreatorNova AI.`,
          primaryKeywords: [topicTitle],
          longTailKeywords: [`${topicTitle} breakdown`, `how to ${topicTitle}`],
          tags: ['CreatorNova', 'ContentCreation'],
          hashtags: ['#CreatorNova', '#Shorts', '#ViralContent'],
          seoHealthScore: 90,
          targetAudience: 'General Audience',
          category: contentType,
        },
        thumbnail: {
          headline: 'VIRAL HOOK',
          subheadline: 'Watch Until The End',
          badgeText: 'NEW',
          templateTheme: 'bold_creator',
          aspectRatio: isShortFormat ? '9:16' : '16:9',
          textColor: '#FFFFFF',
          accentColor: '#8b5cf6',
          bgColor1: '#0f172a',
          bgColor2: '#1e1b4b',
          fontSize: 48,
          showVignette: true,
          showGlow: true,
          emojis: ['🔥', '✨'],
          compositionAngle: 'Eye-level dynamic',
          thumbnailIdea: 'Bold typography with high contrast subject',
        },
        translations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setProjects((prev) => [firstProject, ...prev]);
      setActiveId(firstProject.id);
      setActiveTab('overview');
      studioApi.projects.save(firstProject).catch(console.error);

      // Track first project created (Requirement 11)
      analytics.track('first_project_created', {
        format: firstProject.format,
        platform: String(firstProject.platform || 'Other'),
      });

      setToastMessage(`Welcome to CreatorNova! Your first project "${firstProject.name}" is ready.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await updateProfile({ onboardingCompleted: true });
    } catch (err) {
      console.error('Error skipping onboarding:', err);
    }
  };

  // Public Landing Page, Privacy, Terms, or Contact for unauthenticated visitors (Requirement 1, 2, 3, 9)
  if (!user) {
    if (activeTab === 'privacy') {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-600/30">
          <PrivacyPolicyView
            onBack={() => {
              setActiveTab('landing');
              window.history.pushState({}, '', '/');
            }}
          />
          <SecurityNoticeModal />
        </div>
      );
    }

    if (activeTab === 'terms') {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-600/30">
          <TermsOfServiceView
            onBack={() => {
              setActiveTab('landing');
              window.history.pushState({}, '', '/');
            }}
          />
          <SecurityNoticeModal />
        </div>
      );
    }

    if (activeTab === 'contact') {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-600/30">
          <ContactSupportView
            onBack={() => {
              setActiveTab('landing');
              window.history.pushState({}, '', '/');
            }}
          />
          <SecurityNoticeModal />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-600/30">
        <LandingPageView
          onStartCreating={() => openAuthModal('register')}
          onSignIn={() => openAuthModal('login')}
          onOpenPricing={() => openPricingModal()}
          onOpenAgent={() => openAuthModal('register')}
          onOpenPrivacy={() => {
            setActiveTab('privacy');
            window.history.pushState({}, '', '/privacy');
          }}
          onOpenTerms={() => {
            setActiveTab('terms');
            window.history.pushState({}, '', '/terms');
          }}
          onOpenContact={() => {
            setActiveTab('contact');
            window.history.pushState({}, '', '/contact');
          }}
        />

        {/* Auth Modal triggered by CTAs */}
        <AuthModal />
        <SecurityNoticeModal />

        {/* Pricing Modal */}
        {isPricingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-5xl my-8">
              <PricingScreen
                onClose={closePricingModal}
                onNavigateToUsage={() => {
                  closePricingModal();
                  openAuthModal('register');
                }}
              />
            </div>
          </div>
        )}

        {/* Public Template Preview Modal if visitor arrived via shared template link */}
        {previewTemplateId && (
          <TemplatePreviewModal
            isOpen={true}
            templateId={previewTemplateId}
            onClose={() => setPreviewTemplateId(null)}
            onProjectCreated={(newProj) => {
              setProjects((prev) => [newProj, ...prev]);
              setActiveId(newProj.id);
              setActiveTab('overview');
            }}
          />
        )}
      </div>
    );
  }

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
          onOpenShareTemplateModal={() => setIsShareTemplateModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Referral Invitation Banner */}
        {referralBanner && (
          <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-violet-800 px-4 py-2 text-white text-xs font-semibold flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎁</span>
              <span>{referralBanner}</span>
            </div>
            <button
              onClick={() => setReferralBanner(null)}
              className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 px-4 py-2 text-white text-xs font-bold flex items-center justify-between shadow-lg shrink-0 animate-in fade-in">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

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

          {activeTab === 'privacy' && (
            <PrivacyPolicyView
              onBack={() => {
                setActiveTab('overview');
                window.history.pushState({}, '', '/');
              }}
            />
          )}

          {activeTab === 'terms' && (
            <TermsOfServiceView
              onBack={() => {
                setActiveTab('overview');
                window.history.pushState({}, '', '/');
              }}
            />
          )}

          {activeTab === 'contact' && (
            <ContactSupportView
              onBack={() => {
                setActiveTab('overview');
                window.history.pushState({}, '', '/');
              }}
            />
          )}
        </main>
      </div>

      {/* Security UX Notices (Session expired, Auth required, Permission denied) */}
      <SecurityNoticeModal />

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

      {/* Share as Template Modal */}
      {isShareTemplateModalOpen && (
        <ShareTemplateModal
          isOpen={true}
          project={activeProject}
          onClose={() => setIsShareTemplateModalOpen(false)}
          onOpenPreview={(id) => setPreviewTemplateId(id)}
        />
      )}

      {/* Public Template Preview Modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          isOpen={true}
          templateId={previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
          onProjectCreated={(newProj) => {
            setProjects((prev) => [newProj, ...prev]);
            setActiveId(newProj.id);
            setActiveTab('overview');
            setToastMessage(`Template "${newProj.name}" copied into your workspace!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {/* First-Time User Onboarding Flow (Requirement 7 & 8) */}
      {user && !user.onboardingCompleted && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}

