import { useEffect, useState } from 'react';
import { ReschedulingApplication, AgentRecommendation, GovernanceRules, HistoricalStats } from '../types';
import { BarChart3, ShieldCheck, Users, TrendingUp, Clock, Zap, Database } from 'lucide-react';

interface DashboardProps {
  applications: ReschedulingApplication[];
  recommendations: Record<string, AgentRecommendation>;
}

const REC_CONFIG = {
  APPROVE: { label: 'Approved', color: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  REQUEST_DOCUMENTS: { label: 'Documents Required', color: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-700', bg: 'bg-amber-50' },
  REFER_TO_EMPLOYEE: { label: 'Referred', color: 'bg-blue-500', border: 'border-blue-300', text: 'text-blue-700', bg: 'bg-blue-50' },
  REJECT: { label: 'Rejected', color: 'bg-red-500', border: 'border-red-300', text: 'text-red-700', bg: 'bg-red-50' },
  PENDING: { label: 'Pending', color: 'bg-slate-400', border: 'border-slate-300', text: 'text-slate-700', bg: 'bg-slate-50' },
} as const;

export default function Dashboard({ applications, recommendations }: DashboardProps) {
  const [governanceRules, setGovernanceRules] = useState<GovernanceRules | null>(null);
  const [historicalStats, setHistoricalStats] = useState<HistoricalStats | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/governance-rules');
        if (res.ok) setGovernanceRules(await res.json());
      } catch (err) {
        console.error('Failed to fetch governance rules', err);
      }
    };

    const fetchHistorical = async () => {
      try {
        const res = await fetch('/api/historical-stats');
        if (res.ok) setHistoricalStats(await res.json());
      } catch (err) {
        console.error('Failed to fetch historical stats', err);
      }
    };

    fetchRules();
    fetchHistorical();
  }, []);

  const assessed = Object.values(recommendations);
  const recCounts = {
    APPROVE: assessed.filter((a) => a.recommendation === 'APPROVE').length,
    REQUEST_DOCUMENTS: assessed.filter((a) => a.recommendation === 'REQUEST_DOCUMENTS').length,
    REFER_TO_EMPLOYEE: assessed.filter((a) => a.recommendation === 'REFER_TO_EMPLOYEE').length,
    REJECT: assessed.filter((a) => a.recommendation === 'REJECT').length,
    PENDING: applications.length - assessed.length,
  };

  const avgProcessingTime = assessed.length > 0
    ? assessed.reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / assessed.length
    : 0;

  const maxCount = Math.max(...Object.values(recCounts), 1);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5 mb-1">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          Analytics Dashboard
        </h2>
        <p className="text-sm text-slate-500">Real-time overview of assessment pipeline, historical data, and compliance parameters.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" /> Total Applications
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">{applications.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-4 h-4" /> Assessed
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {assessed.length}
            <span className="text-sm text-slate-400 font-normal ml-1">/ {applications.length}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4" /> Auto-Approved
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700">{recCounts.APPROVE}</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Referred
          </div>
          <div className="text-3xl font-bold font-mono text-blue-700">{recCounts.REFER_TO_EMPLOYEE}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" /> Avg Processing
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {avgProcessingTime > 0 ? `${(avgProcessingTime / 1000).toFixed(1)}s` : '< 5s'}
          </div>
        </div>
      </div>

      {/* Recommendation Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Recommendation Distribution</h3>
        <div className="space-y-4">
          {(Object.keys(REC_CONFIG) as Array<keyof typeof REC_CONFIG>).map((key) => {
            const config = REC_CONFIG[key];
            const count = recCounts[key];
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={key} className="flex items-center gap-4">
                <div className={`w-36 text-xs font-semibold ${config.text} ${config.bg} px-2.5 py-1 rounded border ${config.border} text-center`}>
                  {config.label}
                </div>
                <div className="flex-1 h-7 bg-slate-100 rounded-md overflow-hidden relative">
                  <div
                    className={`h-full ${config.color} rounded-md transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%`, minWidth: count > 0 ? '24px' : '0' }}
                  />
                </div>
                <div className="w-8 text-right font-mono text-sm font-bold text-slate-700">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processing Time Comparison */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider">Manual Process</h3>
          </div>
          <div className="text-4xl font-bold font-mono text-red-700 mb-1">5 days</div>
          <p className="text-xs text-slate-500">Working days for a single application</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-emerald-500/30 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">AI Agent</h3>
          </div>
          <div className="text-4xl font-bold font-mono text-emerald-400 mb-1">&lt; 5 sec</div>
          <p className="text-xs text-slate-400">End-to-end automated assessment</p>
        </div>
      </div>

      {/* Historical Data Summary */}
      {historicalStats && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4" /> Historical Data Summary
          </h3>

          {/* Top-level stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Records</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{historicalStats.total_records.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Salary</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{historicalStats.salary_stats.avg.toLocaleString()}</div>
              <div className="text-xs text-slate-400">AED</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Arrears</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{historicalStats.arrears_stats.avg.toLocaleString()}</div>
              <div className="text-xs text-slate-400">AED</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Deduction Rate</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{historicalStats.avg_deduction_rate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Year-over-year */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Records by Year</h4>
              <div className="space-y-2">
                {Object.entries(historicalStats.by_year)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([year, count]) => (
                    <div key={year} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2 border border-slate-200">
                      <span className="font-mono text-sm font-semibold text-slate-700">{year}</span>
                      <span className="font-mono text-sm font-bold text-indigo-600">{count.toLocaleString()} records</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">By Request Type</h4>
              <div className="space-y-2">
                {Object.entries(historicalStats.by_request_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">{type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-sm font-bold text-indigo-600">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Governance Rules Table */}
      {governanceRules && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
            Active Governance Parameters
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(governanceRules).map(([key, value]) => (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700 text-xs">
                      {key}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {typeof value === 'number' && value < 1 && value > 0
                        ? `${(value * 100).toFixed(0)}%`
                        : typeof value === 'number' && key.includes('RATE')
                          ? `${value}%`
                          : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
