import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BrandKitView } from './BrandKitView';
import { UsageDashboard } from './UsageDashboard';
import { PricingScreen } from './PricingScreen';
import { AdminPanel } from './AdminPanel';

interface UserProfileViewProps {
  initialSubTab?: 'profile' | 'brand_kit' | 'usage' | 'subscription' | 'billing' | 'settings' | 'help' | 'admin';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ initialSubTab = 'profile' }) => {
  const { user, logout, updateProfile, openAuthModal } = useAuth();
  const [subTab, setSubTab] = useState<'profile' | 'brand_kit' | 'usage' | 'subscription' | 'billing' | 'settings' | 'help' | 'admin'>(initialSubTab);

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
    { id: 'brand_kit' as const, label: 'Brand Kit', icon: Palette },
    { id: 'usage' as const, label: 'Usage & Credits', icon: Coins },
    { id: 'subscription' as const, label: 'Subscription Plans', icon: Crown },
    { id: 'billing' as const, label: 'Billing & Invoices', icon: CreditCard },
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

      {subTab === 'brand_kit' && <BrandKitView />}

      {subTab === 'usage' && <UsageDashboard />}

      {subTab === 'subscription' && <PricingScreen />}

      {subTab === 'billing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Billing & Payment Settings</h2>
            <p className="text-xs text-slate-400">Manage billing cadence, payment methods, and receipts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Current Plan</span>
              <div className="text-xl font-black text-white uppercase font-mono">{user.plan}</div>
              <p className="text-[11px] text-slate-400">Active status</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Billing Cycle</span>
              <div className="text-xl font-black text-violet-400 font-mono capitalize">{user.billingCycle}</div>
              <p className="text-[11px] text-slate-400">Auto-renews in 25 days</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Payment Gateway</span>
              <div className="text-sm font-bold text-amber-300">Integration Ready</div>
              <p className="text-[10px] text-slate-400">Stripe / LemonSqueezy</p>
            </div>
          </div>

          <div className="p-4 bg-amber-950/40 border border-amber-800/40 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-300">
              <span className="font-bold text-white block">Production Billing Security Notice</span>
              <p className="leading-relaxed">
                Payment transactions and card activations are performed via authenticated server webhooks. No private payment credentials or cards are stored on the browser.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setSubTab('subscription')}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Upgrade Subscription Plan
            </button>

            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
            >
              Cancel Subscription
            </button>
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
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={() => {
                      setCancelModalOpen(false);
                      setCancelMessage('Cancellation scheduled. Plan active until cycle end.');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          )}

          {cancelMessage && (
            <p className="text-xs text-emerald-400 text-center">{cancelMessage}</p>
          )}
        </div>
      )}

      {subTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 max-w-3xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Account Settings & Security</h2>
            <p className="text-xs text-slate-400">Configure notifications, security credentials, and workspace preferences.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Autosave Project Changes</div>
                <div className="text-[11px] text-slate-400">Save edits to persistent storage automatically</div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</div>
                <div className="text-[11px] text-slate-400">Secure sign-in with authenticator app</div>
              </div>
              <span className="text-xs font-mono text-slate-500">Integration Ready</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Export Format</div>
                <div className="text-[11px] text-slate-400">Default production export file format</div>
              </div>
              <span className="text-xs font-mono text-slate-300">Markdown (.md) + JSON</span>
            </div>
          </div>
        </div>
      )}

      {subTab === 'help' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">CreatorNova AI Knowledge & Guides</h2>
            <p className="text-xs text-slate-400">Master viral video retention, multi-beat storyboarding, and prompt formulas.</p>
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
