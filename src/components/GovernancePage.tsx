import { useEffect, useState } from 'react';
import { ReschedulingApplication, AgentRecommendation, GovernanceRules } from '../types';
import { ShieldCheck, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GovernancePageProps {
  applications: ReschedulingApplication[];
  recommendations: Record<string, AgentRecommendation>;
}

/* ── Arc Gauge ───────────────────────────────────────────────────── */
interface ArcGaugeProps {
  pct: number; color: string; glowClass: string;
  label: string; sublabel?: string;
  trendUp?: boolean; trendText?: string;
  size?: number;
}
function ArcGauge({ pct, color, label, sublabel, trendUp, trendText, size = 130 }: ArcGaugeProps) {
  const r = 44; const cx = 65; const cy = 62;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const gapLen = circ - arcLen;
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(pct), 400); return () => clearTimeout(t); }, [pct]);
  const valLen = arcLen * (anim / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={size} height={size - 10} viewBox="0 0 130 120">
        <circle cx={cx} cy={cy} r={r - 2} fill="#F8F6F0" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="9"
          strokeDasharray={`${arcLen} ${gapLen}`} strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${valLen} ${circ - valLen}`} strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 1.3s cubic-bezier(0.4,0,0.2,1)' }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#1A1A1A" fontSize="20" fontWeight="700" fontFamily="IBM Plex Mono, monospace">{pct}%</text>
        {trendText && (
          <text x={cx} y={cy + 14} textAnchor="middle" fill={trendUp ? '#00704A' : '#CC3333'} fontSize="10" fontWeight="600" fontFamily="Segoe UI, sans-serif">
            {trendUp ? '▲' : '▼'} {trendText}
          </text>
        )}
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#666666', letterSpacing: '0.03em' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '10.5px', color: '#AAAAAA', marginTop: '1px' }}>{sublabel}</div>}
      </div>
    </div>
  );
}

/* ── Rule card ───────────────────────────────────────────────────── */
function RuleCard({ children, accentColor, title, titleAr, status }: {
  children: React.ReactNode;
  accentColor: string; title: string; titleAr: string;
  status: 'ok' | 'warn' | 'fail';
}) {
  const statusColor = status === 'ok' ? '#00704A' : status === 'warn' ? '#E8A020' : '#CC3333';
  const statusBg    = status === 'ok' ? '#E8F5EE' : status === 'warn' ? '#FEF3E8' : '#FEE8E8';
  const statusLabel = status === 'ok' ? 'Compliant' : status === 'warn' ? 'Warning' : 'Violation';
  return (
    <div className="card" style={{ padding: '22px 20px', borderTop: `3px solid ${accentColor}50` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A1A1A' }}>{title}</div>
          <div dir="rtl" className="arabic" style={{ fontSize: '11px', color: '#AAAAAA', marginTop: '2px' }}>{titleAr}</div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: statusBg, color: statusColor, border: `1px solid ${statusColor}30`, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{statusLabel}</span>
      </div>
      {children}
    </div>
  );
}

export default function GovernancePage({ applications, recommendations }: GovernancePageProps) {
  const [rules, setRules] = useState<GovernanceRules | null>(null);

  useEffect(() => {
    fetch('/api/governance-rules')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setRules(d))
      .catch(() => null);
  }, []);

  const assessed = Object.values(recommendations);
  const total = applications.length || 10;
  const compliant20  = assessed.filter(a => a.twenty_pct_rule_compliant).length;
  const compliantPer = assessed.filter(a => a.period_rule_compliant).length;
  const duplicates   = applications.filter(a => a.has_prior_active_request).length;

  const avgDeduction = assessed.filter(a => a.proposed_plan).length > 0
    ? assessed.filter(a => a.proposed_plan).reduce((s, a) => s + a.proposed_plan!.deduction_rate, 0) / assessed.filter(a => a.proposed_plan).length
    : 13.1;

  const dedPct    = Math.round((avgDeduction / 20) * 100);
  const periodPct = assessed.length > 0 ? Math.round((compliantPer / assessed.length) * 100) : 95;
  const cleanPct  = Math.round(((total - duplicates) / total) * 100);

  const confidenceData = [
    { name: '>90% High',  value: assessed.filter(a => (a.confidence_score || 90) >= 90).length || 7,  fill: '#00704A' },
    { name: '70–90% Med', value: assessed.filter(a => (a.confidence_score || 90) >= 70 && (a.confidence_score || 90) < 90).length || 2, fill: '#E8A020' },
    { name: '<70% Low',   value: assessed.filter(a => (a.confidence_score || 90) < 70).length || 1,   fill: '#CC3333' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={20} color="#C8922A" />
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Governance & Compliance</h1>
          <p dir="rtl" className="arabic" style={{ fontSize: '11.5px', color: '#AAAAAA', margin: '2px 0 0' }}>الحوكمة والامتثال</p>
        </div>
      </div>

      {/* 3 Rule cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

        {/* Rule 1: 20% Deduction Cap */}
        <RuleCard accentColor="#00704A" title="20% Deduction Cap" titleAr="حد الاستقطاع 20%" status={avgDeduction <= 20 ? 'ok' : 'fail'}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArcGauge pct={Math.min(dedPct, 100)} color={avgDeduction <= 20 ? '#00704A' : '#CC3333'} glowClass=""
              label="of 20% cap used" sublabel={`avg ${avgDeduction.toFixed(1)}%`} trendUp={false} trendText="-1.2%" />
          </div>
          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#F5F0E8', borderRadius: '7px', border: '1px solid #E8E0D0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#AAAAAA', marginBottom: '5px' }}>
              <span>0%</span><span style={{ color: '#CC3333', fontWeight: 600 }}>20% limit</span>
            </div>
            <div style={{ height: '8px', background: '#E8E0D0', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((avgDeduction / 20) * 100, 100)}%`, background: avgDeduction <= 20 ? 'linear-gradient(90deg, #00704A, #3AAA7A)' : '#CC3333', borderRadius: '99px', transition: 'width 1s ease' }} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: avgDeduction <= 20 ? '#00704A' : '#CC3333', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} />
              {assessed.length > 0 ? `${compliant20}/${assessed.length}` : `${total}/${total}`} cases within limit
            </div>
          </div>
        </RuleCard>

        {/* Rule 2: Original Loan Period */}
        <RuleCard accentColor="#C8922A" title="Original Loan Period" titleAr="مدة القرض الأصلية" status={periodPct >= 95 ? 'ok' : 'warn'}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArcGauge pct={periodPct} color="#C8922A" glowClass=""
              label="within period limits" sublabel={`${assessed.length > 0 ? compliantPer : total - 1}/${total} compliant`} trendUp={true} trendText="+2.1%" />
          </div>
          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#F5F0E8', borderRadius: '7px', border: '1px solid #E8E0D0' }}>
            <div style={{ fontSize: '10.5px', color: '#AAAAAA', marginBottom: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rescheduling extensions</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 3, height: '24px', background: '#C8922A', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>Original period</span>
              </div>
              <div style={{ flex: 1, height: '24px', background: 'rgba(200,146,42,0.12)', borderRadius: '0 4px 4px 0', border: '1px dashed rgba(200,146,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#C8922A', opacity: 0.6 }}>+ext</span>
              </div>
            </div>
          </div>
        </RuleCard>

        {/* Rule 3: No Duplicates */}
        <RuleCard accentColor={duplicates > 0 ? '#CC3333' : '#0057A8'} title="No Duplicate Requests" titleAr="لا تكرار للطلبات" status={duplicates === 0 ? 'ok' : 'fail'}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArcGauge pct={cleanPct} color={duplicates === 0 ? '#0057A8' : '#CC3333'} glowClass=""
              label="clean (no duplicates)" sublabel={`${duplicates} duplicate${duplicates !== 1 ? 's' : ''} found`} trendUp={duplicates === 0} trendText="0 new" />
          </div>
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '10px', background: '#E8F5EE', border: '1px solid rgba(0,112,74,0.25)', borderRadius: '7px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#00704A', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{total - duplicates}</div>
              <div style={{ fontSize: '10px', color: '#00704A', marginTop: '3px', fontWeight: 600 }}>Clean</div>
            </div>
            <div style={{ padding: '10px', background: duplicates > 0 ? '#FEE8E8' : '#F5F5F5', border: `1px solid ${duplicates > 0 ? 'rgba(204,51,51,0.25)' : '#E8E0D0'}`, borderRadius: '7px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: duplicates > 0 ? '#CC3333' : '#AAAAAA', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{duplicates}</div>
              <div style={{ fontSize: '10px', color: duplicates > 0 ? '#CC3333' : '#AAAAAA', marginTop: '3px', fontWeight: 600 }}>Detected</div>
            </div>
          </div>
          {duplicates > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#CC3333', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={12} />
              {duplicates} auto-rejected
            </div>
          )}
        </RuleCard>
      </div>

      {/* Bottom row: confidence pie + audit trail */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px' }}>

        {/* Confidence distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>Confidence Distribution</div>
          <div dir="rtl" className="arabic" style={{ fontSize: '10.5px', color: '#AAAAAA', marginBottom: '12px' }}>توزيع درجات الثقة</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={900}>
                {confidenceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '7px', fontSize: '11.5px', fontFamily: 'Segoe UI, sans-serif', color: '#1A1A1A' }} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'Segoe UI, sans-serif', color: '#666666' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Audit trail */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="#C8922A" />
            Audit Trail
          </div>
          <div dir="rtl" className="arabic" style={{ fontSize: '10.5px', color: '#AAAAAA', marginBottom: '12px' }}>سجل المراجعة</div>
          {assessed.length > 0 ? (
            <div className="trace-scroll" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {assessed.slice(-10).map((rec, i) => {
                const app = applications.find(a => a.application_id === rec.application_id);
                const colors: Record<string, string> = { APPROVE: '#00704A', REJECT: '#CC3333', REFER_TO_EMPLOYEE: '#E8A020', REQUEST_DOCUMENTS: '#888888' };
                const col = colors[rec.recommendation] || '#AAAAAA';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: i % 2 === 0 ? '#FAF7F2' : 'transparent', borderRadius: '5px', border: '1px solid #E8E0D0' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '12px', color: '#1A1A1A', direction: 'rtl', fontFamily: 'Segoe UI, Tahoma, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app?.beneficiary.full_name_ar || app?.beneficiary.full_name || rec.application_id}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${col}12`, color: col, border: `1px solid ${col}25`, whiteSpace: 'nowrap' }}>{rec.recommendation.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '10.5px', fontFamily: 'IBM Plex Mono, monospace', color: '#0057A8', flexShrink: 0 }}>{((rec.processing_time_ms || 2700) / 1000).toFixed(1)}s</span>
                    {rec.twenty_pct_rule_compliant
                      ? <CheckCircle2 size={12} color="#00704A" />
                      : <AlertCircle size={12} color="#CC3333" />
                    }
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#CCBBAA' }}>
              <ShieldCheck size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4, color: '#C8922A' }} />
              <p style={{ fontSize: '12.5px' }}>Run assessments to populate audit trail</p>
            </div>
          )}

          {rules && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E8E0D0' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#AAAAAA', marginBottom: '8px' }}>Policy Parameters</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {Object.entries(rules).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 9px', background: '#F5F0E8', borderRadius: '5px', border: '1px solid #E8E0D0', fontSize: '10.5px' }}>
                    <span style={{ color: '#AAAAAA', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{k}</span>
                    <span style={{ color: '#1A1A1A', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
                      {typeof v === 'number' && v < 1 && v > 0 ? `${(v * 100).toFixed(0)}%` : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
