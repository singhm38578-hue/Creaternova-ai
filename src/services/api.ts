export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('creatornova_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error: any = new Error(errorBody.message || errorBody.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.code = errorBody.error;
    error.details = errorBody;
    throw error;
  }

  return response.json();
}

export const studioApi = {
  checkHealth: () => fetchApi<{ status: string; hasApiKey: boolean; studio: string }>('/api/health'),
  
  // AI Generation
  generateIdeas: (params: { topic: string; format?: string; targetAudience?: string; tone?: string; count?: number }) =>
    fetchApi<{ ideas: any[]; notice?: string }>('/api/generate-ideas', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateScript: (params: { title: string; format?: string; targetAudience?: string; tone?: string; pacing?: string; hostFormat?: string; duration?: string }) =>
    fetchApi<{ script: any; notice?: string }>('/api/generate-script', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  refineScript: (params: { originalText: string; instruction?: string }) =>
    fetchApi<{ refinedText: string; directionCue: string; reasoning: string }>('/api/refine-script', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateScenes: (params: { title: string; scriptText?: string; format?: string; sceneCount?: number }) =>
    fetchApi<{ scenes: any[]; notice?: string }>('/api/generate-scenes', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateSeo: (params: { title: string; topic?: string; scriptText?: string; targetAudience?: string }) =>
    fetchApi<{ seo: any; notice?: string }>('/api/generate-seo', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  translateContent: (params: { text: string; targetLanguage: string; mode?: string; originalLanguage?: string }) =>
    fetchApi<{ translation: any; notice?: string }>('/api/translate-content', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateThumbnailConcepts: (params: { title: string; topic?: string; tone?: string }) =>
    fetchApi<{ concepts: any[] }>('/api/generate-thumbnail-prompt', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateContentPack: (params: {
    projectName: string;
    topic: string;
    platform: string;
    contentType: string;
    language: string;
    duration: string;
    targetAudience: string;
  }) =>
    fetchApi<{ contentPack: any; notice?: string }>('/api/generate-content-pack', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateThumbnailPromptEnhanced: (params: {
    topic: string;
    title?: string;
    targetAudience?: string;
    thumbnailConcept?: string;
    visualStyle?: string;
    aspectRatio?: string;
  }) =>
    fetchApi<{ result: { prompt: string; shortHeadline: string; negativePrompt?: string } }>('/api/generate-thumbnail-prompt-enhanced', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateSceneMediaPrompt: (params: {
    sceneNumber: number;
    visualDescription: string;
    characterAction?: string;
    visualIdentity?: any;
  }) =>
    fetchApi<{ result: { consistentPrompt: string; styleGuide: string } }>('/api/generate-scene-prompt', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateAutoCaptions: (params: { scriptText: string; sceneCount?: number }) =>
    fetchApi<{ segments: any[] }>('/api/generate-captions', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Authentication
  auth: {
    register: (data: { name: string; email: string; password: string; preferredLanguage?: string; creatorNiche?: string; defaultPlatform?: string }) =>
      fetchApi<{ user: any; token: string; brandKit: any; credits: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      fetchApi<{ user: any; token: string; brandKit: any; credits: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    googleSignIn: () =>
      fetchApi<{ integrationRequired: boolean; message: string }>('/api/auth/google', {
        method: 'POST',
      }),

    forgotPassword: (email: string) =>
      fetchApi<{ success: boolean; message: string; demoResetToken?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      fetchApi<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),

    getMe: () =>
      fetchApi<{ user: any; brandKit: any; credits: any; creditConfig: any; isDemoGuest: boolean }>('/api/auth/me'),

    updateProfile: (updates: any) =>
      fetchApi<{ user: any }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    logout: () =>
      fetchApi<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
      }),
  },

  // Brand Kit
  brandKit: {
    get: () => fetchApi<{ brandKit: any }>('/api/brand-kit'),
    update: (updates: any) =>
      fetchApi<{ brandKit: any }>('/api/brand-kit', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },

  // Project Library (Persistent & Isolated)
  projects: {
    list: (filters?: { search?: string; platform?: string; language?: string; contentType?: string; sort?: string }) => {
      const q = new URLSearchParams();
      if (filters?.search) q.set('search', filters.search);
      if (filters?.platform) q.set('platform', filters.platform);
      if (filters?.language) q.set('language', filters.language);
      if (filters?.contentType) q.set('contentType', filters.contentType);
      if (filters?.sort) q.set('sort', filters.sort);
      return fetchApi<{ projects: any[]; count: number }>(`/api/projects?${q.toString()}`);
    },

    get: (id: string) => fetchApi<{ project: any }>(`/api/projects/${id}`),

    save: (project: any) =>
      fetchApi<{ project: any; saved: boolean }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      }),

    update: (id: string, project: any) =>
      fetchApi<{ project: any; saved: boolean; updatedAt: string }>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
      }),

    delete: (id: string) =>
      fetchApi<{ success: boolean; id: string }>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),

    duplicate: (id: string) =>
      fetchApi<{ project: any }>(`/api/projects/${id}/duplicate`, {
        method: 'POST',
      }),
  },

  // Credits & Wallet
  credits: {
    getWallet: () => fetchApi<{ wallet: any; config: any }>('/api/credits/wallet'),
    getConfig: () => fetchApi<{ config: any }>('/api/credits/config'),
    getUsage: () => fetchApi<{ logs: any[]; wallet: any }>('/api/credits/usage'),
    replenishDemo: () => fetchApi<{ wallet: any; success: boolean }>('/api/credits/replenish-demo', { method: 'POST' }),
  },

  // Billing & Subscriptions
  billing: {
    getSubscription: () => fetchApi<any>('/api/billing/subscription'),
    getPlans: () => fetchApi<{ plans: any[] }>('/api/billing/plans'),
    getCreditPacks: () => fetchApi<{ packs: any[] }>('/api/billing/credit-packs'),
    createOrder: (params: {
      planId?: string;
      creditPackId?: string;
      billingCycle?: 'monthly' | 'yearly';
      currency?: string;
      amount: number;
      paymentMethod?: string;
    }) =>
      fetchApi<{ order: any; paymentGatewayRequired: boolean; supportedMethods: string[]; message: string }>(
        '/api/billing/create-order',
        {
          method: 'POST',
          body: JSON.stringify(params),
        }
      ),
    verifyOrder: (orderId: string, paymentId: string, signature?: string) =>
      fetchApi<{ success: boolean; order: any }>('/api/billing/verify-order', {
        method: 'POST',
        body: JSON.stringify({ orderId, paymentId, signature }),
      }),
    upgradeRequest: (targetPlan: string, billingCycle: string) =>
      fetchApi<{ integrationRequired: boolean; message: string; provider: string }>('/api/billing/upgrade-request', {
        method: 'POST',
        body: JSON.stringify({ targetPlan, billingCycle }),
      }),
    cancelRequest: () =>
      fetchApi<{ success: boolean; message: string }>('/api/billing/cancel-request', {
        method: 'POST',
      }),
  },

  // Admin
  admin: {
    getUsers: () => fetchApi<{ users: any[] }>('/api/admin/users'),
    getMetrics: () => fetchApi<{ metrics: any }>('/api/admin/metrics'),
    updateConfig: (config: any) =>
      fetchApi<{ config: any }>('/api/admin/credit-config', {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
    updateUserPlan: (userId: string, plan: string) =>
      fetchApi<{ user: any }>('/api/admin/user-plan', {
        method: 'PUT',
        body: JSON.stringify({ userId, plan }),
      }),
    updatePricingPlan: (planId: string, updates: any) =>
      fetchApi<{ plan: any }>('/api/admin/pricing-plan', {
        method: 'PUT',
        body: JSON.stringify({ planId, ...updates }),
      }),
    updateCreditPack: (packId: string, updates: any) =>
      fetchApi<{ pack: any }>('/api/admin/credit-pack', {
        method: 'PUT',
        body: JSON.stringify({ packId, ...updates }),
      }),
  },

  // CreatorNova AI Agent Subsystem
  agent: {
    parseCommand: (params: { command: string; useBrandKit?: boolean; selectedCharacterId?: string }) =>
      fetchApi<{ plan: any }>('/api/agent/parse-command', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    getPlans: () => fetchApi<{ plans: any[] }>('/api/agent/plans'),
    
    getPlan: (id: string) => fetchApi<{ plan: any }>(`/api/agent/plans/${id}`),

    updatePlan: (id: string, updates: any) =>
      fetchApi<{ plan: any }>(`/api/agent/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    deletePlan: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/agent/plans/${id}`, {
        method: 'DELETE',
      }),

    executePlan: (params: { planId: string; approved: boolean }) =>
      fetchApi<{
        success: boolean;
        plan: any;
        generatedProjects: any[];
        scheduledCalendarItems: any[];
        creditsRemaining: number;
        deductedCredits: number;
      }>('/api/agent/execute-plan', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    getStrategy: () => fetchApi<{ strategy: any[]; niche: string; audience: string }>('/api/agent/strategy', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

    repurpose: (params: { projectId: string; repurposeType: string; customInstruction?: string }) =>
      fetchApi<{ success: boolean; adaptedProject: any; adaptedData: any; repurposeType: string }>('/api/agent/repurpose', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    getTasks: () => fetchApi<{ tasks: any[] }>('/api/agent/tasks'),

    updateTask: (id: string, updates: { action?: string; status?: string; resultSummary?: string }) =>
      fetchApi<{ task: any }>(`/api/agent/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    getActivity: () => fetchApi<{ activities: any[] }>('/api/agent/activity'),

    logActivity: (activity: { actionType: string; description: string; projectId?: string; projectName?: string; creditsUsed?: number }) =>
      fetchApi<{ activity: any }>('/api/agent/activity', {
        method: 'POST',
        body: JSON.stringify(activity),
      }),
  },

  // Content Calendar
  calendar: {
    list: () => fetchApi<{ items: any[] }>('/api/calendar'),

    create: (item: any) =>
      fetchApi<{ item: any }>('/api/calendar', {
        method: 'POST',
        body: JSON.stringify(item),
      }),

    update: (id: string, updates: any) =>
      fetchApi<{ item: any }>(`/api/calendar/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/calendar/${id}`, {
        method: 'DELETE',
      }),

    verifyPublish: (id: string) =>
      fetchApi<{ success: boolean; verified: boolean; connected: boolean; status: string; message: string }>(
        `/api/calendar/${id}/publish`,
        { method: 'POST' }
      ),
  },

  // Series Creator
  series: {
    list: () => fetchApi<{ series: any[] }>('/api/series'),

    create: (params: {
      seriesName: string;
      topic: string;
      numberOfEpisodes?: number;
      platform?: string;
      duration?: string;
      language?: string;
      useBrandKit?: boolean;
      selectedCharacterId?: string;
    }) =>
      fetchApi<{ series: any }>('/api/series', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/series/${id}`, {
        method: 'DELETE',
      }),
  },

  // Character Library
  characters: {
    list: () => fetchApi<{ characters: any[] }>('/api/characters'),

    create: (params: {
      name: string;
      role: string;
      visualDescription: string;
      clothing?: string;
      mainColors?: string[];
      personality?: string;
      voiceStyle?: string;
      avatarUrl?: string;
    }) =>
      fetchApi<{ character: any }>('/api/characters', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/characters/${id}`, {
        method: 'DELETE',
      }),
  },
};
