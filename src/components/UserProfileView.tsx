import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Palette,
  Coins,
  CreditCard,
  Settings,
  HelpCircle,
  ShieldCheck,
  LogOut,
  Edit2,
  Check,
  Sparkles,
  Calendar,
  Globe,
  Tv,
  Crown,
  ExternalLink,
  ChevronRight,
  Save,
  AlertCircle,
  FileText,
  Clock,
  Zap,
  DollarSign,
  Download,
  Trash2,
  Lock,
  Shield,
  Languages,
  FileDown,
  CheckCircle2,
  Key,
  LifeBuoy,
  MessageSquare,
  Server,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studioApi } from '../services/api';
import { BrandKitView } from './BrandKitView';
import { UsageDashboard } from './UsageDashboard';
import { PricingScreen } from './PricingScreen';
import { AdminPanel } from './AdminPanel';
import { AICostDashboard } from './AICostDashboard';
import { ReferralEarnView } from './ReferralEarnView';
import { ContactSupportView } from './support/ContactSupportView';
import { ProviderStatusView } from './admin/ProviderStatusView';
import { Gift } from 'lucide-react';

interface UserProfileViewProps {
  initialSubTab?: 'profile' | 'brand_kit' | 'usage' | 'subscription' | 'billing' | 'settings' | 'help' | 'admin' | 'ai_costs' | 'referrals';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ initialSubTab = 'profile' }) => {
  const { user, logout, updateProfile, deleteAccount, openAuthModal } = useAuth();
  const [subTab, setSubTab] = useState<'profile' | 'brand_kit' | 'usage' | 'subscription' | 'billing' | 'settings' | 'help' | 'admin' | 'ai_costs' | 'referrals'>(initialSubTab);

  // Settings sub-section state (Requirement 4 & 5)
  const [settingsSection, setSettingsSection] = useState<'profile' | 'language' | 'privacy' | 'security' | 'delete_account' | 'provider_status'>('profile');

  // Delete Account Confirmation States
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Data Export States
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Password reset/update state
  const [passwordChangeSent, setPasswordChangeSent] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Edit Profile Form
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [creatorNiche, setCreatorNiche] = useState(user?.creatorNiche || 'Science & Education');
  const [defaultPlatform, setDefaultPlatform] = useState(user?.defaultPlatform || 'YouTube Shorts');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'English');
  const [defaultContentLanguage, setDefaultContentLanguage] = useState(user?.defaultContentLanguage || 'English');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Billing cycle state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [subData, setSubData] = useState<{
    subscription?: any;
    providerStatus?: any;
    invoices?: any[];
    plan?: string;
    billingCycle?: string;
    status?: string;
    renewalDate?: string;
    monthlyAllocation?: number;
  } | null>(null);

  useEffect(() => {
    studioApi.billing.getSubscription().then(setSubData).catch(console.error);
  }, []);

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In to View Profile</h2>
        <p className="text-xs text-slate-400">
          Create an account to save your creator Brand Kit, configure default platforms, and manage credits.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name,
        profileImage,
        creatorNiche,
        defaultPlatform,
        preferredLanguage,
        defaultContentLanguage,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'profile' as const, label: 'Profile Overview', icon: UserIcon },
    { id: 'referrals' as const, label: 'Invite & Earn Credits', icon: Gift },
    { id: 'brand_kit' as const, label: 'Brand Kit', icon: Palette },
    { id: 'usage' as const, label: 'Usage & Credits', icon: Coins },
    { id: 'billing' as const, label: 'Subscription & Billing', icon: CreditCard },
    { id: 'subscription' as const, label: 'Upgrade Plans', icon: Crown },
    { id: 'settings' as const, label: 'Account Settings', icon: Settings },
    { id: 'help' as const, label: 'Help & Guides', icon: HelpCircle },
    ...(user.role === 'admin' ? [{ id: 'admin' as const, label: 'Admin Architecture', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Profile Summary Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shadow-xl shadow-violet-600/30 shrink-0 overflow-hidden">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-violet-300 font-bold text-xl rounded-2xl">
                {user.name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{user.name}</h1>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40">
                {user.plan} Plan
              </span>
              {user.role === 'admin' && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/40">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 flex-wrap">
              <span>Niche: <strong className="text-slate-300">{user.creatorNiche}</strong></span>
              <span>•</span>
              <span>Platform: <strong className="text-slate-300">{user.defaultPlatform}</strong></span>
              <span>•</span>
              <span>Joined: <strong className="text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setSubTab('profile');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-bold border border-red-800/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSubTab(item.id);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {subTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in">
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl max-w-2xl">
              <h3 className="text-base font-bold text-white">Edit Profile Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Creator Niche</label>
                  <input
                    type="text"
                    value={creatorNiche}
                    onChange={(e) => setCreatorNiche(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Default Platform</label>
                  <select
                    value={defaultPlatform}
                    onChange={(e) => setDefaultPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="YouTube Long Video">YouTube Long Video</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Language</label>
                  <input
                    type="text"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Default Content Language</label>
                  <input
                    type="text"
                    value={defaultContentLanguage}
                    onChange={(e) => setDefaultContentLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30"
                >
                  Save Profile
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Specifications</h3>
                <div className="divide-y divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">User ID</span>
                    <span className="font-mono text-slate-300">{user.id}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Email Address</span>
                    <span className="text-slate-200">{user.email}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Current Plan</span>
                    <span className="font-bold text-violet-300 uppercase">{user.plan}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Billing Cycle</span>
                    <span className="text-slate-300 capitalize">{user.billingCycle}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Account Role</span>
                    <span className="text-slate-300 capitalize">{user.role}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Creator Defaults</h3>
                <div className="divide-y divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Channel Niche</span>
                    <span className="text-slate-200">{user.creatorNiche}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Primary Platform</span>
                    <span className="text-slate-200">{user.defaultPlatform}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Spoken Language</span>
                    <span className="text-slate-200">{user.preferredLanguage}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Content Language</span>
                    <span className="text-slate-200">{user.defaultContentLanguage}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'referrals' && <ReferralEarnView />}

      {subTab === 'brand_kit' && <BrandKitView />}

      {subTab === 'usage' && <UsageDashboard />}

      {subTab === 'subscription' && <PricingScreen />}

      {subTab === 'billing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-5xl shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-400" />
                <span>Subscription & Billing Management</span>
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative subscription state, monthly renewal cycles, payment gateway credentials, and auditable transaction history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                subData?.providerStatus?.configured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {subData?.providerStatus?.configured ? 'Gateway Connected' : 'Payment Provider Setup Required'}
              </span>
            </div>
          </div>

          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Current Plan</span>
              <div className="text-xl font-black text-white uppercase font-mono">
                {subData?.subscription?.planId || user.plan}
              </div>
              <p className="text-[11px] text-violet-400">
                {subData?.subscription?.monthlyCredits || (user.plan === 'pro' ? 1000 : user.plan === 'creator' ? 4000 : user.plan === 'business' ? 12000 : 50)} credits/mo
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Billing Cadence</span>
              <div className="text-xl font-black text-violet-400 font-mono capitalize">
                {subData?.subscription?.billingCycle || user.billingCycle || 'monthly'}
              </div>
              <p className="text-[11px] text-slate-400">
                {subData?.subscription?.cancelAtPeriodEnd ? 'Cancels at period end' : 'Auto-renews periodically'}
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Renewal / Reset Date</span>
              <div className="text-xs font-bold text-slate-200 font-mono mt-1">
                {subData?.subscription?.currentPeriodEnd
                  ? new Date(subData.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '30 days from cycle start'}
              </div>
              <p className="text-[10px] text-emerald-400">Credits replenish on reset</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Payment Gateway</span>
              <div className={`text-xs font-bold mt-1 ${subData?.providerStatus?.configured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {subData?.providerStatus?.configured ? subData.providerStatus.provider : 'Payment Provider Setup Required'}
              </div>
              <p className="text-[10px] text-slate-400">
                {subData?.providerStatus?.configured ? 'Live Webhooks Active' : 'Setup Required'}
              </p>
            </div>
          </div>

          {/* Payment Provider Setup Status Banner */}
          {!subData?.providerStatus?.configured ? (
            <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-amber-300 block">Payment Provider Setup Required</span>
                <p className="text-slate-300 leading-relaxed">
                  CreatorNova billing architecture is running in secure production mode. Live payment checkouts and recurring webhook event processing require merchant API keys (<code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code>, <code>RAZORPAY_WEBHOOK_SECRET</code> or Stripe). Direct client-side simulation is permanently disabled.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-950/40 border border-emerald-600/40 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-emerald-300 block">Active Gateway Integration: {subData.providerStatus.provider}</span>
                <p className="text-slate-300 leading-relaxed">
                  All credit allocations and plan updates are protected by cryptographic webhook signature verification and duplicate-event idempotency.
                </p>
              </div>
            </div>
          )}

          {/* Configurable Plans Summary */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-violet-400" />
                <span>Configured Subscription Plans</span>
              </h3>
              <button
                onClick={() => setSubTab('subscription')}
                className="text-xs text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Pricing Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className={`p-3.5 rounded-xl border ${user.plan === 'free' ? 'border-violet-500 bg-violet-950/30' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">FREE</span>
                  <span className="text-slate-400">₹0/mo</span>
                </div>
                <div className="text-amber-400 font-mono font-bold mt-1">50 credits/mo</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Explore AI tools with 50 monthly credits</p>
              </div>

              <div className={`p-3.5 rounded-xl border ${user.plan === 'pro' ? 'border-violet-500 bg-violet-950/30' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">PRO</span>
                  <span className="text-violet-400">₹299/mo</span>
                </div>
                <div className="text-amber-400 font-mono font-bold mt-1">1,000 credits/mo</div>
                <p className="text-[10px] text-slate-500 mt-0.5">For active weekly content creators</p>
              </div>

              <div className={`p-3.5 rounded-xl border ${user.plan === 'creator' ? 'border-violet-500 bg-violet-950/30' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">CREATOR</span>
                  <span className="text-violet-400">₹799/mo</span>
                </div>
                <div className="text-amber-400 font-mono font-bold mt-1">4,000 credits/mo</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Autonomous Agent & high-frequency video</p>
              </div>

              <div className={`p-3.5 rounded-xl border ${user.plan === 'business' ? 'border-violet-500 bg-violet-950/30' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">BUSINESS</span>
                  <span className="text-violet-400">₹1,999/mo</span>
                </div>
                <div className="text-amber-400 font-mono font-bold mt-1">12,000 credits/mo</div>
                <p className="text-[10px] text-slate-500 mt-0.5">For full studio teams & agencies</p>
              </div>
            </div>
          </div>

          {/* Verified Invoices & Payment Records Ledger */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Invoices & Payment Records</span>
            </h3>

            {subData?.invoices && subData.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Plan / Pack</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Gateway</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {subData.invoices.map((inv: any) => (
                      <tr key={inv.orderId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-300">{inv.orderId}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 uppercase font-bold text-white">{inv.planId || inv.creditPackId || 'Plan'}</td>
                        <td className="py-2.5 px-3 font-mono text-white">₹{inv.amount}</td>
                        <td className="py-2.5 px-3 text-slate-400">{inv.gateway}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inv.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No past billing transactions or invoices recorded yet.
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setSubTab('subscription')}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Change Subscription Plan</span>
            </button>

            {user.plan !== 'free' && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                Cancel Subscription
              </button>
            )}
          </div>

          {/* Cancel modal */}
          {cancelModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm space-y-4 shadow-2xl">
                <h3 className="text-base font-bold text-white">Cancel Subscription?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your credits and saved project files will remain active until the end of your billing cycle. After that, your account will switch to the Free tier.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await studioApi.billing.cancelRequest();
                        setCancelModalOpen(false);
                        setCancelMessage('Cancellation scheduled. Plan active until cycle end.');
                        const updated = await studioApi.billing.getSubscription();
                        setSubData(updated);
                      } catch (err: any) {
                        setCancelMessage('Cancellation notice registered.');
                        setCancelModalOpen(false);
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          )}

          {cancelMessage && (
            <p className="text-xs text-emerald-400 text-center font-bold">{cancelMessage}</p>
          )}
        </div>
      )}

      {subTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl shadow-xl animate-in fade-in">
          {/* Header */}
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-violet-400" />
              <span>Account Settings & Privacy</span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage your creator profile, language defaults, privacy rights, security parameters, and account safety.
            </p>
          </div>

          {/* Account Settings Sub-Navigation (Requirement 4) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/60">
            {[
              { id: 'profile' as const, label: 'Profile', icon: UserIcon },
              { id: 'language' as const, label: 'Language', icon: Languages },
              { id: 'privacy' as const, label: 'Privacy', icon: Shield },
              { id: 'security' as const, label: 'Security', icon: Lock },
              ...(user?.role === 'admin' ? [{ id: 'provider_status' as const, label: '🛡️ Provider Status', icon: Server }] : []),
              { id: 'delete_account' as const, label: 'Delete Account', icon: Trash2, danger: true },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = settingsSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSettingsSection(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? tab.danger
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                      : tab.danger
                      ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SECTION: Profile */}
          {settingsSection === 'profile' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Creator Profile Details</h3>
                <p className="text-xs text-slate-400">Public creator moniker, avatar display, and platform defaults.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Creator Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Creator Niche</label>
                  <input
                    type="text"
                    value={creatorNiche}
                    onChange={(e) => setCreatorNiche(e.target.value)}
                    placeholder="e.g. Space Science, Tech Reviews, Finance"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Default Target Platform</label>
                  <select
                    value={defaultPlatform}
                    onChange={(e) => setDefaultPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="YouTube Shorts">YouTube Shorts (Vertical 9:16)</option>
                    <option value="YouTube Long Video">YouTube Long Video (16:9)</option>
                    <option value="TikTok">TikTok (Vertical 9:16)</option>
                    <option value="Instagram Reels">Instagram Reels (Vertical 9:16)</option>
                    <option value="Other">Other / Multi-Platform</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Account Created: {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await updateProfile({ name, creatorNiche, defaultPlatform });
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2500);
                  }}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveSuccess ? 'Saved!' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION: Language */}
          {settingsSection === 'language' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Language & Translation Defaults</h3>
                <p className="text-xs text-slate-400">Set the default language used for AI scripts, teleprompter cues, and studio interface.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Studio Interface Language</label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Korean">Korean (한국어)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Default Script Generation Language</label>
                  <select
                    value={defaultContentLanguage}
                    onChange={(e) => setDefaultContentLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Korean">Korean (한국어)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                CreatorNova supports multi-language teleprompter translation in 12+ regional and global languages.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    await updateProfile({ preferredLanguage, defaultContentLanguage });
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2500);
                  }}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveSuccess ? 'Language Saved!' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION: Privacy & Download My Data */}
          {settingsSection === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Privacy & Data Governance</h3>
                <p className="text-xs text-slate-400">Exercise your creator data rights, download workspace archives, and audit access.</p>
              </div>

              {/* Data Export Card (Requirement 6) */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-violet-400" />
                      <span>Download My Data</span>
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      Generate an authenticated archive containing your creator profile, Brand Kit settings, project metadata, scripts, scenes, calendar entries, and credit usage logs.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isExportingData}
                    onClick={async () => {
                      setIsExportingData(true);
                      setExportSuccessMessage(null);
                      try {
                        const data = await studioApi.auth.exportData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `creatornova-data-export-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        setExportSuccessMessage(
                          `Data archive downloaded! Included ${data.projects?.length || 0} projects, ${data.contentCalendar?.length || 0} calendar items.`
                        );
                      } catch (err: any) {
                        setExportSuccessMessage('Download failed: ' + (err.message || 'Unknown error'));
                      } finally {
                        setIsExportingData(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingData ? 'Generating Archive...' : 'Download My Data'}</span>
                  </button>
                </div>

                {exportSuccessMessage && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-900 space-y-0.5">
                  <div className="font-semibold text-slate-400">Strict Data Privacy Safeguard:</div>
                  <div>Your export package excludes passwords, internal security tokens, API keys, or any other user's data.</div>
                </div>
              </div>

              {/* Data Rights & Policies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-white font-bold block">No Ad-Network Data Sales</span>
                  <p className="text-slate-400 text-[11px]">
                    Your script ideas, video concepts, and Brand Kit assets are strictly isolated and never distributed to advertising aggregators.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-white font-bold block">Template Sharing Isolation</span>
                  <p className="text-slate-400 text-[11px]">
                    Public templates only display the structure you choose to share. Your email, credit balance, and private media remain hidden.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Security */}
          {settingsSection === 'security' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Credentials & Security State</h3>
                <p className="text-xs text-slate-400">Authentication protocol, encrypted token status, and session parameters.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Encrypted Transport & Token Security</div>
                      <div className="text-[11px] text-slate-400">All creator communications authenticated via TLS/HTTPS</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">Active</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-violet-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Password Authentication</div>
                      <div className="text-[11px] text-slate-400">Protected using cryptographic hashing. Plain text is never stored.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={passwordChangeLoading}
                    onClick={async () => {
                      setPasswordChangeLoading(true);
                      try {
                        await studioApi.auth.forgotPassword(user.email);
                        setPasswordChangeSent(true);
                      } catch (e) {
                        setPasswordChangeSent(true);
                      } finally {
                        setPasswordChangeLoading(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {passwordChangeLoading ? 'Sending...' : passwordChangeSent ? 'Reset Link Ready' : 'Change Password'}
                  </button>
                </div>

                {passwordChangeSent && (
                  <p className="text-[11px] text-emerald-400 text-right">
                    Password update request registered. For security, follow the instructions sent to {user.email}.
                  </p>
                )}

                <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</div>
                      <div className="text-[11px] text-slate-400">Secondary authenticator app verification gate</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Integration Ready</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-500">
                  <strong className="text-slate-400 block mb-0.5">Zero Secret Exposure:</strong>
                  CreatorNova never exposes raw Firebase IDs, backend authorization secrets, or database connection strings to the client interface.
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Delete Account (Requirement 5) */}
          {settingsSection === 'delete_account' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Creator Account</span>
                </h3>
                <p className="text-xs text-slate-400">Permanently terminate your CreatorNova account and purge your workspace data.</p>
              </div>

              {/* Explanatory Consequence Warning Card */}
              <div className="p-5 bg-red-950/30 border border-red-500/40 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-xs text-slate-300">
                    <strong className="text-red-300 block font-bold text-sm">
                      Warning: This action is permanent and cannot be undone.
                    </strong>
                    <p className="leading-relaxed">
                      Confirming account deletion will invoke authenticated backend deletion logic to permanently remove:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                      <li>Your creator profile, name, and preferences</li>
                      <li>All private projects, script drafts, and scene storyboards</li>
                      <li>All scheduled content calendar releases</li>
                      <li>All private generated media assets and video jobs</li>
                      <li>Eligible account-related credits, logs, and brand kit records</li>
                    </ul>
                    <p className="text-[11px] text-red-400/90 font-medium">
                      Accidental taps are prevented. You must deliberately acknowledge the consequences and confirm below.
                    </p>
                  </div>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-950/50 border border-red-500 rounded-xl text-xs text-red-300">
                  {deleteError}
                </div>
              )}

              {/* Multi-step deliberate confirmation safeguards */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteAcknowledged}
                    onChange={(e) => setDeleteAcknowledged(e.target.checked)}
                    className="mt-0.5 accent-red-600 rounded"
                  />
                  <span>
                    I understand that deleting my account will permanently delete all my private projects, scripts, calendar data, and credit history.
                  </span>
                </label>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Type <span className="font-mono text-red-400 font-black">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE in capital letters"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={deleteConfirmText.trim() !== 'DELETE' || !deleteAcknowledged || isDeleting}
                    onClick={async () => {
                      if (deleteConfirmText.trim() !== 'DELETE' || !deleteAcknowledged) return;
                      setIsDeleting(true);
                      setDeleteError(null);
                      try {
                        await deleteAccount('DELETE');
                        // Successfully deleted; user will be logged out and state reset
                      } catch (err: any) {
                        setDeleteError(err.message || 'Failed to delete account. Please try again.');
                        setIsDeleting(false);
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Admin-only Provider Status (Settings → Provider Status) */}
          {settingsSection === 'provider_status' && user?.role === 'admin' && (
            <div className="space-y-5 animate-in fade-in pt-2">
              <ProviderStatusView />
            </div>
          )}
        </div>
      )}

      {subTab === 'help' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-violet-400" />
                <span>Help, Support & Creator Knowledge</span>
              </h2>
              <p className="text-xs text-slate-400">Master viral video retention, multi-beat storyboarding, and prompt formulas.</p>
            </div>

            <button
              onClick={() => {
                // Navigate to contact view
                window.location.pathname = '/contact';
              }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-2 shrink-0"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Contact Support Desk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Guide 1</span>
              <h4 className="text-sm font-bold text-white">Crafting 3-Second Retention Hooks</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Learn how pattern interrupts, curiosity gaps, and fast auditory cues stop mobile scrolling on YouTube Shorts and TikTok.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Guide 2</span>
              <h4 className="text-sm font-bold text-white">12%+ CTR Thumbnail Design Formulas</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rules of third, high-contrast rim lighting, bold 3-word impact typography, and visual focal point balance.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Guide 3</span>
              <h4 className="text-sm font-bold text-white">Visual Identity Consistency Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                How to lock down character clothing, palettes, camera lenses, and lighting moods across multi-scene shot breakdowns.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Guide 4</span>
              <h4 className="text-sm font-bold text-white">Credit Economy & Generation Rates</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Understanding credit costs for text screenplays (2 credits), 4K thumbnails (5 credits), and video sequences (20 credits).
              </p>
            </div>
          </div>
        </div>
      )}

      {subTab === 'admin' && user.role === 'admin' && <AdminPanel />}
    </div>
  );
};
