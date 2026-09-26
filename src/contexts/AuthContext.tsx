import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, BrandKit, CreditWallet, CreditConfig } from '../types/auth';
import { studioApi } from '../services/api';
import {
  auth,
  isFirebaseConfigured,
  testFirestoreConnection,
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle as firebaseLoginWithGoogle,
  sendPasswordReset,
  logoutUser,
  getUserProfile,
  initUserProfile,
  updateUserProfile as updateFirestoreUserProfile,
  getFirestoreBrandKit,
  saveFirestoreBrandKit,
  recordCreditTransaction,
  FirestoreUserProfile
} from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseConnected: boolean;
  isFirebaseConfigured: boolean;
  autosaveStatus: AutosaveStatus;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  brandKit: BrandKit | null;
  credits: CreditWallet | null;
  creditConfig: CreditConfig | null;
  isLowCredits: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    preferredLanguage?: string;
    creatorNiche?: string;
    defaultPlatform?: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateBrandKit: (updates: Partial<BrandKit>) => Promise<void>;
  refreshCredits: () => Promise<void>;
  replenishDemoCredits: () => Promise<void>;
  loginAsDemo: (role: 'creator' | 'admin') => Promise<void>;
  // Modals state
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isPricingModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
  isInsufficientCreditModalOpen: boolean;
  insufficientCreditCost: number;
  openInsufficientCreditModal: (requiredCost?: number) => void;
  closeInsufficientCreditModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('creatornova_token') : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [credits, setCredits] = useState<CreditWallet | null>(null);
  const [creditConfig, setCreditConfig] = useState<CreditConfig | null>({
    textCost: 1,
    scriptCost: 2,
    seoCost: 2,
    sceneCost: 3,
    imageCost: 5,
    voiceCost: 10,
    videoCost: 20,
    videoBaseCost: 15,
    videoCostPer15s: 5,
    updatedAt: new Date().toISOString(),
  });

  // Modal triggers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isInsufficientCreditModalOpen, setIsInsufficientCreditModalOpen] = useState(false);
  const [insufficientCreditCost, setInsufficientCreditCost] = useState(5);

  const isLowCredits = !!credits && credits.totalRemaining < 20;

  // Initialize and validate connection on boot
  useEffect(() => {
    let isMounted = true;

    const initConnection = async () => {
      if (isFirebaseConfigured) {
        const ok = await testFirestoreConnection();
        if (isMounted) setIsFirebaseConnected(ok);
      }
    };
    initConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // If Firebase not configured, load local session
      loadLocalSession();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (fbUser) {
        try {
          let profile = await getUserProfile(fbUser.uid);
          if (!profile) {
            profile = await initUserProfile(fbUser.uid, {
              name: fbUser.displayName || 'Creator',
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || undefined,
            });
          }

          const safeUser: User = {
            id: profile.uid,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            profileImage: profile.photoURL,
            plan: profile.plan,
            billingCycle: profile.billingCycle,
            preferredLanguage: profile.preferredLanguage || 'English',
            creatorNiche: profile.creatorNiche || 'Content Creation',
            defaultPlatform: profile.defaultPlatform || 'YouTube Shorts',
            defaultContentLanguage: profile.preferredLanguage || 'English',
            createdAt: profile.createdAt,
            onboardingCompleted: true,
          };

          setUser(safeUser);
          setCredits({
            textCredits: Math.floor(profile.credits * 0.4),
            imageCredits: Math.floor(profile.credits * 0.3),
            voiceCredits: Math.floor(profile.credits * 0.2),
            videoCredits: Math.floor(profile.credits * 0.1),
            totalRemaining: profile.credits,
            monthlyAllocation: profile.monthlyAllocation || profile.credits,
            lastResetDate: profile.updatedAt,
          });

          // Fetch Brand Kit
          const bk = await getFirestoreBrandKit(fbUser.uid);
          if (bk) setBrandKit(bk);

          const token = await fbUser.getIdToken();
          setToken(token);
          localStorage.setItem('creatornova_token', token);
        } catch (err) {
          console.error('Error fetching Firestore user profile:', err);
          // Fallback to local session if Firestore access is pending
          await loadLocalSession();
        }
      } else {
        // Fallback: check if local token / demo user exists
        const localToken = localStorage.getItem('creatornova_token');
        if (localToken && !localToken.startsWith('eyJ')) {
          await loadLocalSession();
        } else {
          setUser(null);
          setBrandKit(null);
          setCredits(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadLocalSession = async () => {
    try {
      const res = await studioApi.auth.getMe();
      if (res.user) {
        setUser(res.user);
        setBrandKit(res.brandKit);
        setCredits(res.credits);
        if (res.creditConfig) setCreditConfig(res.creditConfig);
      }
    } catch (err) {
      // Guest explorer mode
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        await loginWithEmail(email, pass);
      } else {
        const res = await studioApi.auth.login({ email, password: pass });
        setUser(res.user);
        setBrandKit(res.brandKit);
        setCredits(res.credits);
        setToken(res.token);
        localStorage.setItem('creatornova_token', res.token);
      }
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        await firebaseLoginWithGoogle();
        setIsAuthModalOpen(false);
      } else {
        throw new Error('Firebase configuration required for Google Sign-In.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    preferredLanguage?: string;
    creatorNiche?: string;
    defaultPlatform?: string;
  }) => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        await registerWithEmail(data.email, data.password, data.name);
      } else {
        const res = await studioApi.auth.register(data);
        setUser(res.user);
        setBrandKit(res.brandKit);
        setCredits(res.credits);
        setToken(res.token);
        localStorage.setItem('creatornova_token', res.token);
      }
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    if (isFirebaseConfigured) {
      await sendPasswordReset(email);
    } else {
      await studioApi.auth.forgotPassword(email);
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured) {
        await logoutUser();
      }
      await studioApi.auth.logout().catch(() => {});
    } finally {
      localStorage.removeItem('creatornova_token');
      setToken(null);
      setUser(null);
      setBrandKit(null);
      setCredits(null);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    setAutosaveStatus('saving');
    try {
      if (user && isFirebaseConfigured) {
        await updateFirestoreUserProfile(user.id, {
          name: updates.name,
          preferredLanguage: updates.preferredLanguage,
          creatorNiche: updates.creatorNiche,
          defaultPlatform: updates.defaultPlatform,
          photoURL: updates.profileImage,
        });
      }
      const res = await studioApi.auth.updateProfile(updates);
      if (res.user) {
        setUser(res.user);
      }
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch (e) {
      setAutosaveStatus('failed');
      setTimeout(() => setAutosaveStatus('idle'), 3000);
    }
  };

  const updateBrandKit = async (updates: Partial<BrandKit>) => {
    setAutosaveStatus('saving');
    try {
      if (user && isFirebaseConfigured) {
        await saveFirestoreBrandKit(user.id, updates);
      }
      const res = await studioApi.brandKit.update(updates);
      if (res.brandKit) {
        setBrandKit(res.brandKit);
      }
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch (e) {
      setAutosaveStatus('failed');
      setTimeout(() => setAutosaveStatus('idle'), 3000);
    }
  };

  const refreshCredits = async () => {
    try {
      if (user && isFirebaseConfigured) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setCredits({
            textCredits: Math.floor(profile.credits * 0.4),
            imageCredits: Math.floor(profile.credits * 0.3),
            voiceCredits: Math.floor(profile.credits * 0.2),
            videoCredits: Math.floor(profile.credits * 0.1),
            totalRemaining: profile.credits,
            monthlyAllocation: profile.monthlyAllocation || profile.credits,
            lastResetDate: profile.updatedAt,
          });
          return;
        }
      }
      const res = await studioApi.credits.getWallet();
      if (res.wallet) setCredits(res.wallet);
      if (res.config) setCreditConfig(res.config);
    } catch (e) {
      console.error('Failed refreshing credits:', e);
    }
  };

  const replenishDemoCredits = async () => {
    try {
      const res = await studioApi.credits.replenishDemo();
      if (res.wallet) {
        setCredits(res.wallet);
      }
      if (user && isFirebaseConfigured) {
        await updateFirestoreUserProfile(user.id, { credits: res.wallet?.totalRemaining || 850 });
        await recordCreditTransaction(user.id, {
          type: 'replenish',
          amount: 500,
          operation: 'demo_replenish',
          description: 'Developer sandbox credit replenishment',
          balanceAfter: res.wallet?.totalRemaining || 850,
        });
      }
    } catch (e) {
      console.error('Failed replenishing credits:', e);
    }
  };

  const loginAsDemo = async (role: 'creator' | 'admin') => {
    const email = role === 'admin' ? 'admin@creatornova.ai' : 'creator@creatornova.ai';
    const pass = role === 'admin' ? 'adminnova123' : 'creatornova123';
    await login(email, pass);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openPricingModal = () => setIsPricingModalOpen(true);
  const closePricingModal = () => setIsPricingModalOpen(false);

  const openInsufficientCreditModal = (requiredCost: number = 5) => {
    setInsufficientCreditCost(requiredCost);
    setIsInsufficientCreditModalOpen(true);
  };

  const closeInsufficientCreditModal = () => setIsInsufficientCreditModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isFirebaseConnected,
        isFirebaseConfigured,
        autosaveStatus,
        setAutosaveStatus,
        brandKit,
        credits,
        creditConfig,
        isLowCredits,
        login,
        loginWithGoogle,
        register,
        forgotPassword,
        logout,
        updateProfile,
        updateBrandKit,
        refreshCredits,
        replenishDemoCredits,
        loginAsDemo,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isPricingModalOpen,
        openPricingModal,
        closePricingModal,
        isInsufficientCreditModalOpen,
        insufficientCreditCost,
        openInsufficientCreditModal,
        closeInsufficientCreditModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
