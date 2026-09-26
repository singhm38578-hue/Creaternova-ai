import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
  Flame,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studioApi } from '../../services/api';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    login,
    loginWithGoogle,
    register,
    forgotPassword,
    loginAsDemo,
    isFirebaseConfigured,
    isFirebaseConnected,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(authModalTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [niche, setNiche] = useState('YouTube Shorts & Reels');
  const [platform, setPlatform] = useState('YouTube Shorts');
  const [language, setLanguage] = useState('English');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register({
          name,
          email,
          password,
          creatorNiche: niche,
          defaultPlatform: platform,
          preferredLanguage: language,
        });
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setSuccessMsg('If an account exists for this email, a password reset link has been dispatched.');
      } else if (mode === 'reset') {
        const res = await studioApi.auth.resetPassword(resetToken, newPassword);
        setSuccessMsg(res.message);
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // User cancelled popup
        return;
      }
      setGoogleNotice(
        err.message || 'Google Authentication requires popup permission or configured Firebase Auth domain.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">CreatorNova AI</h3>
              <p className="text-[11px] text-slate-400">Creator Studio & SaaS Workspace</p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        {(mode === 'login' || mode === 'register') && (
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                mode === 'register' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {googleNotice && (
          <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-in fade-in">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{googleNotice}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Creator Niche
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Science & Facts">Science & Facts</option>
                  <option value="Kids & Family">Kids & Family</option>
                  <option value="Tech & Coding">Tech & Coding</option>
                  <option value="Storytelling & Film">Storytelling</option>
                  <option value="Business & Finance">Business & Finance</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Primary Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="YouTube Long Video">YouTube Long</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Create Creator Account</span>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </>
            ) : mode === 'forgot' ? (
              <span>Send Reset Instructions</span>
            ) : (
              <span>Update Password</span>
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-1 cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </form>

        {/* Google Sign-in */}
        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500">
                Or Continue With
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Quick Demo Logins for Instant Testing */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Quick One-Click Test Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => loginAsDemo('creator')}
              className="py-1.5 px-2 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-800/40 text-[11px] font-bold transition-colors cursor-pointer text-center"
            >
              👤 Demo Creator (Pro)
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('admin')}
              className="py-1.5 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] font-bold transition-colors cursor-pointer text-center"
            >
              🛡️ Demo Admin (Role)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
