import React, { useState, useEffect } from 'react';
import { AlertCircle, Lock, ShieldX, KeyRound, X, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type SecurityNoticeType = 'session_expired' | 'auth_required' | 'permission_denied';

export interface SecurityNoticePayload {
  type: SecurityNoticeType;
  message?: string;
}

export const SecurityNoticeModal: React.FC = () => {
  const { openAuthModal } = useAuth();
  const [notice, setNotice] = useState<SecurityNoticePayload | null>(null);

  useEffect(() => {
    const handleNotice = (e: Event) => {
      const customEvent = e as CustomEvent<SecurityNoticePayload>;
      if (customEvent.detail) {
        setNotice(customEvent.detail);
      }
    };

    window.addEventListener('creatornova_security_notice', handleNotice);
    return () => window.removeEventListener('creatornova_security_notice', handleNotice);
  }, []);

  if (!notice) return null;

  const getNoticeConfig = (type: SecurityNoticeType) => {
    switch (type) {
      case 'session_expired':
        return {
          title: 'Session Expired',
          badge: 'Security Authentication',
          icon: KeyRound,
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          heading: 'Your active session has expired',
          description:
            notice.message ||
            'For your creator account security, authentication tokens expire periodically. Please sign in again to continue managing your workspace, credits, and video projects.',
          primaryActionText: 'Sign In Again',
          primaryAction: () => {
            setNotice(null);
            openAuthModal('login');
          },
        };
      case 'auth_required':
        return {
          title: 'Authentication Required',
          badge: 'Access Gate',
          icon: Lock,
          iconBg: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
          heading: 'Sign in to access this creator feature',
          description:
            notice.message ||
            'This action requires an active CreatorNova account to save drafts, deduct compute credits, or manage project libraries.',
          primaryActionText: 'Sign In / Register',
          primaryAction: () => {
            setNotice(null);
            openAuthModal('register');
          },
        };
      case 'permission_denied':
        return {
          title: 'Permission Denied',
          badge: 'Security Restriction',
          icon: ShieldX,
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          heading: 'Access not authorized',
          description:
            notice.message ||
            'You do not have administrative permissions or ownership clearance to modify or view this specific workspace resource.',
          primaryActionText: 'Understood',
          primaryAction: () => setNotice(null),
        };
    }
  };

  const config = getNoticeConfig(notice.type);
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {config.badge}
            </span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${config.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">{config.heading}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{config.description}</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Security Protection Active</span>
          </div>
          <p>CreatorNova never exposes raw token hashes, secret credentials, or system stack traces to end users.</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setNotice(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={config.primaryAction}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <span>{config.primaryActionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
