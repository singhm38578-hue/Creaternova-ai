import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Coins,
  Sliders,
  TrendingUp,
  Save,
  Check,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Lock,
  Globe,
  Tag,
  Layers,
  Crown
} from 'lucide-react';
import { studioApi } from '../services/api';
import { CreditConfig } from '../types/auth';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [creditPacks, setCreditPacks] = useState<any[]>([]);
  const [creditConfig, setCreditConfig] = useState<CreditConfig>({
    textCost: 1,
    scriptCost: 2,
    seoCost: 2,
    sceneCost: 3,
    imageCost: 5,
    voiceCost: 10,
    videoCost: 20,
    updatedAt: new Date().toISOString(),
  });
  const [featureFlags, setFeatureFlags] = useState({
    enableDirectVideoRendering: false,
    enableBetaModelGeminiPro: true,
    enablePublicSharing: false,
    maintenanceMode: false,
  });

  const [activeAdminTab, setActiveAdminTab] = useState<'metrics' | 'pricing' | 'packs' | 'costs' | 'users'>('pricing');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, metricsRes, configRes, plansRes, packsRes] = await Promise.all([
        studioApi.admin.getUsers().catch(() => ({ users: [] })),
        studioApi.admin.getMetrics().catch(() => ({ metrics: null })),
        studioApi.credits.getConfig().catch(() => ({ config: null })),
        studioApi.billing.getPlans().catch(() => ({ plans: [] })),
        studioApi.billing.getCreditPacks().catch(() => ({ packs: [] })),
      ]);
      setUsers(usersRes.users || []);
      setMetrics(metricsRes.metrics || null);
      if (configRes.config) {
        setCreditConfig(configRes.config);
      }
      if (plansRes.plans) {
        setPlans(plansRes.plans);
      }
      if (packsRes.packs) {
        setCreditPacks(packsRes.packs);
      }
    } catch (err) {
      console.error('Failed fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCreditCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studioApi.admin.updateConfig(creditConfig);
      setSaveSuccess('Credit generation costs saved!');
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePlan = async (plan: any) => {
    try {
      await studioApi.admin.updatePricingPlan(plan.id, plan);
      setSaveSuccess(`Plan "${plan.name}" updated!`);
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePack = async (pack: any) => {
    try {
      await studioApi.admin.updateCreditPack(pack.id, pack);
      setSaveSuccess(`Credit pack "${pack.name}" updated!`);
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: string) => {
    try {
      await studioApi.admin.updateUserPlan(userId, newPlan);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-rose-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Admin & Platform Governance</h2>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/40 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                Restricted Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure India & Global prices, credit packs, generation costs, plan availability, and user entitlements.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'pricing', label: 'Subscription Plans & Regional Prices', icon: Crown },
          { id: 'packs', label: 'Credit Packs Architecture', icon: Coins },
          { id: 'costs', label: 'Generation Credit Costs', icon: Sliders },
          { id: 'users', label: 'User Quotas & Accounts', icon: Users },
          { id: 'metrics', label: 'Platform Metrics & Flags', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeAdminTab === tab.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUBSCRIPTION PLANS & REGIONAL PRICES */}
      {activeAdminTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Subscription Plan Configuration</h3>
              <p className="text-xs text-slate-400">Configure monthly & yearly prices across INR, USD, EUR, GBP, JPY, and credit quotas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan, pIdx) => (
              <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-sm font-black text-white uppercase">{plan.name} Plan</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-mono">({plan.id})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Active</label>
                    <input
                      type="checkbox"
                      checked={plan.isActive !== false}
                      onChange={(e) => {
                        const updated = [...plans];
                        updated[pIdx].isActive = e.target.checked;
                        setPlans(updated);
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Credits</label>
                    <input
                      type="number"
                      value={plan.monthlyCredits || 0}
                      onChange={(e) => {
                        const updated = [...plans];
                        updated[pIdx].monthlyCredits = Number(e.target.value);
                        setPlans(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Project Limit (-1 = unlim)</label>
                    <input
                      type="number"
                      value={plan.projectsLimit || 0}
                      onChange={(e) => {
                        const updated = [...plans];
                        updated[pIdx].projectsLimit = Number(e.target.value);
                        setPlans(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Promotional Tag / Badge</label>
                  <input
                    type="text"
                    value={plan.badge || ''}
                    placeholder="e.g. MOST POPULAR, BEST VALUE"
                    onChange={(e) => {
                      const updated = [...plans];
                      updated[pIdx].badge = e.target.value;
                      setPlans(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1"
                  />
                </div>

                {/* Regional Price Table for Plan */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-violet-400" />
                    <span>Regional Price Tables (Configurable per Country/Region)</span>
                  </div>

                  <div className="space-y-2">
                    {['INR', 'USD', 'EUR', 'GBP', 'JPY'].map((curr) => {
                      const regPrice = plan.regionalPrices?.[curr] || { monthly: 0, yearly: 0, symbol: curr === 'INR' ? '₹' : '$' };
                      return (
                        <div key={curr} className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                          <span className="w-12 font-mono font-bold text-violet-400">{curr}</span>
                          <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">Mo:</span>
                            <input
                              type="number"
                              value={regPrice.monthly}
                              onChange={(e) => {
                                const updated = [...plans];
                                if (!updated[pIdx].regionalPrices) updated[pIdx].regionalPrices = {};
                                updated[pIdx].regionalPrices[curr] = {
                                  ...regPrice,
                                  currency: curr,
                                  monthly: Number(e.target.value),
                                };
                                setPlans(updated);
                              }}
                              className="w-20 bg-slate-900 border border-slate-700 rounded p-1 font-mono text-white text-right"
                            />
                          </div>

                          <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">Yr:</span>
                            <input
                              type="number"
                              value={regPrice.yearly}
                              onChange={(e) => {
                                const updated = [...plans];
                                if (!updated[pIdx].regionalPrices) updated[pIdx].regionalPrices = {};
                                updated[pIdx].regionalPrices[curr] = {
                                  ...regPrice,
                                  currency: curr,
                                  yearly: Number(e.target.value),
                                };
                                setPlans(updated);
                              }}
                              className="w-24 bg-slate-900 border border-slate-700 rounded p-1 font-mono text-white text-right"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSavePlan(plan)}
                    className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save {plan.name} Settings</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CREDIT PACKS ARCHITECTURE */}
      {activeAdminTab === 'packs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Credit Pack Architecture</h3>
              <p className="text-xs text-slate-400">Configure optional one-time credit top-up packs, pricing by currency, and availability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creditPacks.map((pack, kIdx) => (
              <div key={pack.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-sm font-black text-white">{pack.name}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Available in Store</label>
                    <input
                      type="checkbox"
                      checked={pack.available !== false}
                      onChange={(e) => {
                        const updated = [...creditPacks];
                        updated[kIdx].available = e.target.checked;
                        setCreditPacks(updated);
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Credits in Pack</label>
                    <input
                      type="number"
                      value={pack.credits}
                      onChange={(e) => {
                        const updated = [...creditPacks];
                        updated[kIdx].credits = Number(e.target.value);
                        setCreditPacks(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Badge</label>
                    <input
                      type="text"
                      value={pack.badge || ''}
                      placeholder="e.g. BEST VALUE"
                      onChange={(e) => {
                        const updated = [...creditPacks];
                        updated[kIdx].badge = e.target.value;
                        setCreditPacks(updated);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1"
                    />
                  </div>
                </div>

                {/* Regional Pack Prices */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Pack Regional Prices</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {['INR', 'USD', 'EUR', 'GBP', 'JPY'].map((curr) => {
                      const p = pack.prices?.[curr] || { amount: 0 };
                      return (
                        <div key={curr} className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400">{curr}</span>
                          <input
                            type="number"
                            value={p.amount}
                            onChange={(e) => {
                              const updated = [...creditPacks];
                              if (!updated[kIdx].prices) updated[kIdx].prices = {};
                              updated[kIdx].prices[curr] = {
                                currency: curr,
                                amount: Number(e.target.value),
                                symbol: curr === 'INR' ? '₹' : '$',
                              };
                              setCreditPacks(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1 font-mono text-white mt-1 text-right"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSavePack(pack)}
                    className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Pack</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GENERATION CREDIT COSTS */}
      {activeAdminTab === 'costs' && (
        <form onSubmit={handleSaveCreditCosts} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Configurable Generation Credit Costs (Requirement 3)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Update how many credits are deducted per AI request. Video cost is dynamically configurable based on duration & resolution.
              </p>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Generation Costs</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Text/Idea Generation</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.textCost}
                onChange={(e) => setCreditConfig({ ...creditConfig, textCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 1 credit</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Script Generation</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.scriptCost || 2}
                onChange={(e) => setCreditConfig({ ...creditConfig, scriptCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 2 credits</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">SEO Pack</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.seoCost || 2}
                onChange={(e) => setCreditConfig({ ...creditConfig, seoCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 2 credits</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Scene Breakdown</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.sceneCost || 3}
                onChange={(e) => setCreditConfig({ ...creditConfig, sceneCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 3 credits</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Thumbnail / Image</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.imageCost}
                onChange={(e) => setCreditConfig({ ...creditConfig, imageCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 5 credits</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Voice Generation</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.voiceCost}
                onChange={(e) => setCreditConfig({ ...creditConfig, voiceCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Default: 10 credits</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Video Base Cost</label>
              <input
                type="number"
                min={5}
                max={100}
                value={creditConfig.videoBaseCost || 15}
                onChange={(e) => setCreditConfig({ ...creditConfig, videoBaseCost: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Provider base: 15</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Video Cost / 15s</label>
              <input
                type="number"
                min={1}
                max={50}
                value={creditConfig.videoCostPer15s || 5}
                onChange={(e) => setCreditConfig({ ...creditConfig, videoCostPer15s: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500">Duration factor: 5</span>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: USER ACCOUNTS & ENTITLEMENTS */}
      {activeAdminTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span>User Accounts & Tier Entitlements ({filteredUsers.length})</span>
              </h3>
              <p className="text-xs text-slate-400">Manage user roles, assigned plans, and live subscription status.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search creator name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Creator</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Plan</th>
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Change Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        u.role === 'admin' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold uppercase text-violet-400">
                      {u.plan || 'free'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{u.preferredLanguage || 'English'}</td>
                    <td className="py-3 px-3">
                      <select
                        value={u.plan || 'free'}
                        onChange={(e) => handleChangePlan(u.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2 py-1 text-white cursor-pointer"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro (₹299)</option>
                        <option value="creator">Creator (₹799)</option>
                        <option value="business">Business (₹1,999)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM METRICS */}
      {activeAdminTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Users</span>
              <div className="text-3xl font-black text-white font-mono">{metrics.totalUsers}</div>
              <p className="text-[10px] text-slate-400">Registered creators</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Projects</span>
              <div className="text-3xl font-black text-violet-400 font-mono">{metrics.totalProjects}</div>
              <p className="text-[10px] text-slate-400">Persisted in database</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">AI Generations</span>
              <div className="text-3xl font-black text-pink-400 font-mono">{metrics.totalGenerations}</div>
              <p className="text-[10px] text-slate-400">Executed by Gemini</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Plan Mix</span>
              <div className="text-xs font-mono text-emerald-400 font-bold mt-1">
                {metrics.planBreakdown?.pro || 0} Pro • {metrics.planBreakdown?.creator || 0} Creator
              </div>
              <p className="text-[10px] text-slate-400">{metrics.planBreakdown?.free || 0} Free users</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Flag className="w-4 h-4 text-violet-400" />
              <span>System Feature Flags</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Direct Video Rendering</div>
                  <div className="text-[11px] text-slate-400">External neural video provider connection</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatureFlags({ ...featureFlags, enableDirectVideoRendering: !featureFlags.enableDirectVideoRendering })}
                  className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold ${
                    featureFlags.enableDirectVideoRendering ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {featureFlags.enableDirectVideoRendering ? 'ACTIVE' : 'INTEGRATION_REQ'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-white">Gemini 3.8 Pro Fast Pipeline</div>
                  <div className="text-[11px] text-slate-400">Fast-track high token models for Pro & Creator</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeatureFlags({ ...featureFlags, enableBetaModelGeminiPro: !featureFlags.enableBetaModelGeminiPro })}
                  className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold ${
                    featureFlags.enableBetaModelGeminiPro ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {featureFlags.enableBetaModelGeminiPro ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
