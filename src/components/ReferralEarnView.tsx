import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { studioApi } from '../services/api';
import { ReferralStats } from '../types/content';

export const ReferralEarnView: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await studioApi.referrals.getMyStats();
      setStats(res);
    } catch (err) {
      console.error('Failed fetching referral stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fullReferralUrl = stats?.referralCode
    ? `${window.location.origin}/?ref=${stats.referralCode}`
    : '';

  const handleCopyLink = async () => {
    if (!fullReferralUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CreatorNova AI - Join & Create Viral Videos',
          text: 'Join CreatorNova AI and build viral videos with AI scripts, storyboards, and video generators!',
          url: fullReferralUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullReferralUrl);
      setCopied(true);
      setFeedback('Referral link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setFeedback(null);
      }, 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = async () => {
    if (!stats?.referralCode) return;
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900 border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-violet-600/40 text-violet-300 border border-violet-500/40 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              Creator Program
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Invite & Earn Credits
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Earn bonus CreatorNova credits for eligible referrals. When fellow creators sign up with your unique referral link and begin crafting videos, you receive bonus credits directly into your credit wallet.
          </p>
          <p className="text-[11px] text-violet-300/80 font-medium">
            * Bonus credits can be used across text, storyboard scenes, thumbnails, voice synthesis, and video generations. No cash payouts.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Shareable Link Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Your Unique Referral Link
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-w-0">
            <span className="text-xs font-mono text-slate-300 truncate select-all">
              {isLoading ? 'Generating code...' : fullReferralUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              disabled={isLoading || !fullReferralUrl}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleCopyCode}
              disabled={isLoading || !stats?.referralCode}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Copy referral code only"
            >
              <span>Code: <strong>{stats?.referralCode || '...'}</strong></span>
              {copiedCode && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Successful Referrals */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Successful Referrals</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white pt-1">
            {isLoading ? '...' : stats?.successfulReferrals || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Active creators referred
          </p>
        </div>

        {/* Credits Earned */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Credits Earned</span>
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 pt-1">
            +{isLoading ? '...' : stats?.creditsEarned || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Credited directly to wallet
          </p>
        </div>

        {/* Reward per Referral */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Reward Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 pt-1">
            {stats?.rewardPerReferral || 25} Credits
          </div>
          <p className="text-[11px] text-slate-500">
            Per qualified new creator
          </p>
        </div>
      </div>

      {/* Referral History / Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Referral Activity Log
          </h3>
          <span className="text-[11px] text-slate-400">
            Total link clicks tracked: <strong>{stats?.totalClicks || 0}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading referral records...</div>
        ) : !stats?.referrals || stats.referrals.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <Gift className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No referral activity yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Share your link with fellow content creators, YouTubers, and podcasters to earn bonus credits.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {stats.referrals.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">{item.referredUserLabel}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.rewardCredits > 0 && (
                    <span className="text-xs font-bold text-amber-400">
                      +{item.rewardCredits} Credits
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      item.status === 'rewarded'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : item.status === 'qualified'
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : item.status === 'signed_up'
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anti-Abuse & Quality Policy Guarantee */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-300">Integrity & Anti-Abuse Standards</span>
          <p className="text-[11px] leading-relaxed">
            Credits are awarded when an invited creator signs up and saves their first video production workflow. To prevent fraud, self-referrals, duplicate accounts, and spammy bots are automatically blocked by the secure wallet validator.
          </p>
        </div>
      </div>
    </div>
  );
};
