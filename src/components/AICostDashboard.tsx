import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Coins,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Info,
  Server,
  CreditCard,
  Lock,
} from 'lucide-react';
import { studioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AICostDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('7d');
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCostData = async (selectedTimeframe = timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await studioApi.admin.getAICostDashboard(selectedTimeframe);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI cost dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCostData();
    }
  }, [user]);

  // Security gate: Normal users must NOT access this dashboard
  if (!user || user.role !== 'admin') {
    return (
      <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-8 max-w-xl mx-auto my-12 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied: Admin Privileges Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The AI Cost & Profit Protection Dashboard is restricted exclusively to platform administrators. Sensitive operational margins, provider cost configurations, and usage audit logs cannot be viewed or modified by standard accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <span>AI Cost & Profit Protection Dashboard</span>
            </h2>
            <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time tracking of AI operation volume, credit consumption, provider liabilities, and subscription unit economics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            {(['today', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  fetchCostData(tf);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf === 'today' ? 'Today' : tf === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchCostData()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PROFIT WARNING BANNER */}
      {data?.hasEconomicsWarning && (
        <div className="p-4 bg-red-950/70 border-2 border-red-500/80 rounded-2xl flex items-start gap-3.5 shadow-xl animate-pulse">
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-black text-red-200 uppercase tracking-wider text-sm block">
              PLAN ECONOMICS WARNING
            </span>
            <p className="text-red-300 leading-relaxed">
              {data?.economicsWarningMessage ||
                'Estimated usage costs have exceeded healthy subscription unit economics (>65% of monthly revenue). High-volume neural video or voice tasks require review. Customer prices remain unchanged per safety policy.'}
            </p>
          </div>
        </div>
      )}

      {/* METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total AI Requests */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Total AI Requests</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {data?.totalRequests !== undefined ? data.totalRequests.toLocaleString() : '—'}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              {data?.successfulRequests || 0} Successful
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-red-400 flex items-center gap-1 font-semibold">
              <XCircle className="w-3 h-3" />
              {data?.failedRequests || 0} Failed
            </span>
          </div>
        </div>

        {/* Credits Consumed */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Credits Consumed</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {data?.creditsConsumed !== undefined ? data.creditsConsumed.toLocaleString() : '—'}
          </div>
          <p className="text-[11px] text-slate-400">
            Deducted exclusively upon verified generation
          </p>
        </div>

        {/* Estimated Provider Cost */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Estimated Provider Cost</span>
            <Server className="w-4 h-4 text-violet-400" />
          </div>
          {data?.costDataRequired ? (
            <div className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono tracking-wider">
              COST DATA REQUIRED
            </div>
          ) : (
            <div className="text-2xl font-black text-white font-mono">
              ₹{(data?.estimatedProviderCostINR || 0).toLocaleString()}
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            {data?.costDataRequired ? 'Provider pricing unconfigured' : 'Internal model inference fees'}
          </p>
        </div>

        {/* Estimated Gross Margin */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Estimated Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          {data?.costDataRequired ? (
            <div className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono tracking-wider">
              COST DATA REQUIRED
            </div>
          ) : (
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {data?.estimatedGrossMarginPercent !== null ? `${data.estimatedGrossMarginPercent}%` : '—'}
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            Revenue: ₹{(data?.estimatedRevenueINR || 0).toLocaleString()} ({timeframe})
          </p>
        </div>
      </div>

      {/* PLAN ECONOMICS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>CreatorNova Plan Economics & Unit Protection</span>
            </h3>
            <p className="text-xs text-slate-400">
              Internal mathematical simulation per plan tier before final subscription pricing is locked.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Gateway Fee: 2.36% • Server Infra: ₹15/mo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-2.5 px-3">Plan Tier</th>
                <th className="py-2.5 px-3">Monthly Price</th>
                <th className="py-2.5 px-3">Credit Allowance</th>
                <th className="py-2.5 px-3">Estimated AI Cost</th>
                <th className="py-2.5 px-3">Payment Fee</th>
                <th className="py-2.5 px-3">Infra Cost</th>
                <th className="py-2.5 px-3">Estimated Gross Profit</th>
                <th className="py-2.5 px-3">Gross Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data?.planEconomics?.map((plan: any) => (
                <tr key={plan.planId} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white uppercase flex items-center gap-2 font-sans">
                    <span>{plan.planName}</span>
                    {plan.hasEconomicsWarning && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                        Warning
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">₹{plan.monthlyPriceINR}/mo</td>
                  <td className="py-3 px-3 text-amber-400 font-bold">{plan.monthlyCredits.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    {plan.costDataRequired ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        COST DATA REQUIRED
                      </span>
                    ) : (
                      `₹${plan.estimatedAIUsageCostINR}`
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400">₹{plan.estimatedPaymentCostINR}</td>
                  <td className="py-3 px-3 text-slate-400">₹{plan.estimatedInfrastructureCostINR}</td>
                  <td className="py-3 px-3">
                    {plan.costDataRequired ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        COST DATA REQUIRED
                      </span>
                    ) : (
                      <span className={plan.estimatedGrossProfitINR >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        ₹{plan.estimatedGrossProfitINR}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {plan.costDataRequired ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        COST DATA REQUIRED
                      </span>
                    ) : (
                      <span className={plan.estimatedGrossMarginPercent >= 40 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {plan.estimatedGrossMarginPercent}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Policy Enforcement:</strong> No fictitious provider charges are presented as real billing. If actual provider rates have not been configured in the server environment, margins display <code>COST DATA REQUIRED</code>. Prices charged to customers are never changed automatically.
          </p>
        </div>
      </div>

      {/* CENTRAL AI OPERATIONS CONFIGURATION MATRIX */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Centralized AI Operations Configuration</span>
            </h3>
            <p className="text-xs text-slate-400">
              Server-authoritative operations matrix for all 10 platform AI workflows.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
            Read-Only (Server Protected)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {data?.operationsConfig &&
            Object.values(data.operationsConfig).map((op: any) => (
              <div key={op.operation} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-sans">{op.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-violet-600/20 text-violet-300 border border-violet-500/40">
                    {op.creditCost} Credits
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{op.description}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/60">
                  <span>Provider: <strong className="text-slate-300">{op.provider}</strong></span>
                  <span>Model: <strong className="text-slate-300">{op.model}</strong></span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* RECENT AI USAGE AUDIT LEDGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent AI Usage Audit Records</span>
            </h3>
            <p className="text-xs text-slate-400">
              Immutable log of billable AI executions with idempotency request IDs and debit status.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing last {data?.recentUsageRecords?.length || 0} entries
          </span>
        </div>

        {data?.recentUsageRecords && data.recentUsageRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Operation</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.recentUsageRecords.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">{rec.requestId}</td>
                    <td className="py-2.5 px-3 text-slate-300 truncate max-w-[110px]">{rec.userId}</td>
                    <td className="py-2.5 px-3 text-white uppercase font-sans font-bold text-[11px]">{rec.operation}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rec.model}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{rec.creditsCharged}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          rec.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : rec.status === 'refunded'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                      {new Date(rec.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No AI generation usage events logged yet for the selected timeframe.
          </div>
        )}
      </div>
    </div>
  );
};
