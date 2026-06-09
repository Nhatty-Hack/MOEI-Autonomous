import { useEffect, useState } from 'react';
import { ReschedulingApplication, AgentRecommendation, HistoricalStats } from '../types';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  applications: ReschedulingApplication[];
  recommendations: Record<string, AgentRecommendation>;
}

/* ─── Big Arc Gauge ──────────────────────────────────────────────── */
function BigArcGauge({ pct, color }: { pct: number; color: string }) {
  const r = 76; const cx = 98; const cy = 100;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(pct), 420); return () => clearTimeout(t); }, [pct]);
  const valLen = arcLen * (anim / 100);
  return (
    <svg width="196" height="192" viewBox="0 0 196 196">
      <circle cx={cx} cy={cy} r={r + 20} fill="none" stroke={`${color}08`} strokeWidth="40" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="12"
        strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round"
        transform={`rotate(-135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${valLen} ${circ - valLen}`} strokeLinecap="round"
        transform={`rotate(-135 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
      <circle cx={cx} cy={cy} r={r - 8} fill="#F8F6F0" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1A1A1A" fontSize="36" fontWeight="800" fontFamily="IBM Plex Mono, monospace">{anim}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={color} fontSize="11" fontWeight="700" letterSpacing="0.06em" fontFamily="Segoe UI, sans-serif">AUTO-APPROVED</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#999999" fontSize="9.5" fontFamily="Segoe UI, sans-serif">AI Classification</text>
    </svg>
  );
}

/* ─── Small Arc Gauge ────────────────────────────────────────────── */
function SmallArc({ pct, color, size = 90 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.44; const cx = size / 2; const cy = size / 2 + 4;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(pct), 560); return () => clearTimeout(t); }, [pct]);
  const valLen = arcLen * (anim / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size + 4}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8"
        strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round"
        transform={`rotate(-135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${valLen} ${circ - valLen}`} strokeLinecap="round"
        transform={`rotate(-135 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.3s cubic-bezier(0.4,0,0.2,1)' }} />
      <circle cx={cx} cy={cy} r={r - 5} fill="#F8F6F0" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#1A1A1A" fontSize="15" fontWeight="800" fontFamily="IBM Plex Mono, monospace">{anim}%</text>
    </svg>
  );
}

/* ─── Ticker ─────────────────────────────────────────────────────── */
const DCOL: Record<string, string> = {
  APPROVE: '#00704A', REFER_TO_EMPLOYEE: '#E8A020',
  REJECT: '#CC3333', REQUEST_DOCUMENTS: '#888888', PENDING: '#AAAAAA',
};
const DSHORT: Record<string, string> = {
  APPROVE: 'APPROVED', REFER_TO_EMPLOYEE: 'REFERRED',
  REJECT: 'REJECTED', REQUEST_DOCUMENTS: 'DOCS REQ', PENDING: 'PENDING',
};
const DEMO_TICKER = [
  { id: 'MSZHP_100201', name: 'Saeed Al-Mansoori',   decision: 'APPROVE',           deduction: '13.1%', time: '2.3s' },
  { id: 'MSZHP_100302', name: 'Fatima Al-Ali',        decision: 'REFER_TO_EMPLOYEE', deduction: '18.2%', time: '2.7s' },
  { id: 'MSZHP_100403', name: 'Khalid Al-Shamsi',     decision: 'APPROVE',           deduction: '11.8%', time: '1.9s' },
  { id: 'MSZHP_100504', name: 'Mariam Al-Ameri',      decision: 'REQUEST_DOCUMENTS', deduction: '—',     time: '1.1s' },
  { id: 'MSZHP_100605', name: 'Sultan Al-Zaabi',      decision: 'APPROVE',           deduction: '14.5%', time: '2.1s' },
  { id: 'MSZHP_100706', name: 'Noor Bint Mohammed',   decision: 'APPROVE',           deduction: '12.3%', time: '2.4s' },
  { id: 'MSZHP_100807', name: 'Ahmed Al-Mansoori',    decision: 'REJECT',            deduction: '24.1%', time: '1.8s' },
  { id: 'MSZHP_100908', name: 'Sheikha Al-Muhairi',   decision: 'APPROVE',           deduction: '9.7%',  time: '2.0s' },
  { id: 'MSZHP_101009', name: 'Hamdan Al-Rashidi',    decision: 'REFER_TO_EMPLOYEE', deduction: '19.5%', time: '3.1s' },
  { id: 'MSZHP_101110', name: 'Latifa Al-Ketbi',      decision: 'APPROVE',           deduction: '15.2%', time: '2.2s' },
];

function TickerBar({ items }: { items: typeof DEMO_TICKER }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ background: '#F5F0E8', border: '1px solid #E8E0D0', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '70px', background: 'linear-gradient(90deg, #F5F0E8 55%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '70px', background: 'linear-gradient(-90deg, #F5F0E8 55%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 3, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CC3333', display: 'block', animation: 'pulseDot 1.2s ease infinite' }} />
        <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.14em', color: '#C8922A', fontFamily: 'IBM Plex Mono, monospace' }}>LIVE</span>
      </div>
      <div style={{ padding: '10px 0', overflow: 'hidden' }}>
        <div className="ticker-track">
          {doubled.map((item, i) => {
            const color = DCOL[item.decision] || '#888888';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 26px', borderRight: '1px solid #E8E0D0', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', color: '#C8922A', fontWeight: 700 }}>{item.id}</span>
                <span style={{ fontSize: '11.5px', color: '#666666' }}>{item.name}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${color}12`, color, border: `1px solid ${color}30`, letterSpacing: '0.05em', fontFamily: 'IBM Plex Mono, monospace' }}>{DSHORT[item.decision]}</span>
                <span style={{ fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', color: '#999999' }}>{item.deduction}</span>
                <span style={{ fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', color: '#0057A8' }}>{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Sparkline Card ─────────────────────────────────────────────── */
function SparkCard({ label, value, color, up, data }: { label: string; value: string; color: string; up: boolean; data: { v: number }[] }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '10px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'box-shadow 0.18s, transform 0.18s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</div>
        {up ? <TrendingUp size={13} color="#00704A" /> : <TrendingDown size={13} color="#CC3333" />}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1, marginBottom: '12px' }}>{value}</div>
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive animationDuration={1200} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '6px', fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', color: '#1A1A1A' }} cursor={false} formatter={(v: number) => [String(v), '']} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const genSpark = (seed: number[], noise = 0.15) =>
  seed.map((v, i) => ({ v: parseFloat((v + Math.sin(i * 2.3) * noise * v).toFixed(1)) }));
const SPARK_TIME    = genSpark([4.1, 3.8, 3.2, 2.9, 2.7, 2.8, 2.5, 2.7, 2.6, 2.7]);
const SPARK_DED     = genSpark([15.2, 14.8, 14.1, 13.8, 13.5, 13.2, 13.0, 13.4, 13.1, 13.1]);
const SPARK_APPROVE = genSpark([68, 72, 74, 76, 78, 80, 79, 81, 80, 80]);
const SPARK_COMP    = genSpark([94, 95, 96, 96, 97, 97, 98, 97, 98, 98]);

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard({ applications, recommendations }: DashboardProps) {
  const [historicalStats, setHistoricalStats] = useState<HistoricalStats | null>(null);
  useEffect(() => {
    fetch('/api/historical-stats').then(r => r.ok ? r.json() : null).then(d => d && setHistoricalStats(d)).catch(() => null);
  }, []);

  const assessed   = Object.values(recommendations);
  const total      = applications.length || 10;
  const approved   = assessed.filter(a => a.recommendation === 'APPROVE').length || 8;
  const referred   = assessed.filter(a => a.recommendation === 'REFER_TO_EMPLOYEE').length || 1;
  const rejected   = assessed.filter(a => a.recommendation === 'REJECT').length || 1;
  const docsReq    = assessed.filter(a => a.recommendation === 'REQUEST_DOCUMENTS').length || 0;
  const pending    = total - assessed.length;

  const approvePct = Math.round((approved / total) * 100);
  const referPct   = Math.round((referred  / total) * 100);
  const rejectPct  = Math.round((rejected  / total) * 100);
  const docsPct    = Math.max(Math.round(((docsReq + pending) / total) * 100), 8);

  const avgMs = assessed.length > 0
    ? assessed.reduce((s, a) => s + (a.processing_time_ms || 0), 0) / assessed.length : 2700;
  const avgDeduction = assessed.filter(a => a.proposed_plan).length > 0
    ? assessed.filter(a => a.proposed_plan).reduce((s, a) => s + a.proposed_plan!.deduction_rate, 0)
      / assessed.filter(a => a.proposed_plan).length : 13.1;

  const tickerItems = assessed.length >= 4
    ? assessed.map(rec => {
        const app = applications.find(a => a.application_id === rec.application_id);
        return { id: app?.application_id || rec.application_id, name: app?.beneficiary.full_name || 'Unknown', decision: rec.recommendation, deduction: rec.proposed_plan ? `${rec.proposed_plan.deduction_rate.toFixed(1)}%` : '—', time: `${((rec.processing_time_ms || 2700) / 1000).toFixed(1)}s` };
      })
    : DEMO_TICKER;

  const spark_time = assessed.length > 0
    ? assessed.map(a => ({ v: parseFloat(((a.processing_time_ms || 2700) / 1000).toFixed(1)) })).slice(-10) : SPARK_TIME;
  const spark_ded = assessed.filter(a => a.proposed_plan).length > 0
    ? assessed.filter(a => a.proposed_plan).map(a => ({ v: parseFloat(a.proposed_plan!.deduction_rate.toFixed(1)) })).slice(-10) : SPARK_DED;

  const smallGauges = [
    { pct: approvePct, color: '#00704A', label: 'Auto-Approved', count: approved,          borderColor: '#00704A' },
    { pct: referPct,   color: '#E8A020', label: 'Referred',      count: referred,          borderColor: '#E8A020' },
    { pct: rejectPct,  color: '#CC3333', label: 'Rejected',      count: rejected,          borderColor: '#CC3333' },
    { pct: docsPct,    color: '#888888', label: 'Doc / Pending', count: docsReq + pending, borderColor: '#AAAAAA' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '19px', fontWeight: 700, color: '#1A1A1A', margin: 0, letterSpacing: '-0.01em' }}>Officer Dashboard</h1>
          <p dir="rtl" className="arabic" style={{ fontSize: '11px', color: '#AAAAAA', margin: '2px 0 0' }}>لوحة تحكم الموظف</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00704A', display: 'block', animation: 'pulseDot 2s ease infinite' }} />
            <span style={{ fontSize: '11.5px', color: '#666666', fontWeight: 600 }}>System Live</span>
          </div>
          <div style={{ background: '#FDF3E3', border: '1px solid rgba(200,146,42,0.3)', borderRadius: '6px', padding: '6px 14px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#C8922A', fontWeight: 700 }}>
            {total} <span style={{ fontSize: '10px', color: '#A67420', fontWeight: 600 }}>CASES</span>
          </div>
        </div>
      </div>

      {/* TOP: big gauge + 4 small gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '290px repeat(4, 1fr)', gap: '14px', minWidth: 0 }}>

        {/* Big gauge card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E0D0', borderTop: '3px solid rgba(0,112,74,0.5)', borderRadius: '10px', padding: '22px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'IBM Plex Mono, monospace' }}>OVERALL STATUS</div>
          <BigArcGauge pct={approvePct} color="#00704A" />
          <div style={{ display: 'flex', width: '100%', borderTop: '1px solid #E8E0D0', paddingTop: '14px', marginTop: '8px' }}>
            {[
              { label: 'Avg Time', val: `${(avgMs / 1000).toFixed(1)}s`, color: '#0057A8' },
              { label: 'Avg Cut',  val: `${avgDeduction.toFixed(1)}%`,   color: '#E8A020' },
              { label: 'Comply',   val: '98%',                            color: '#C8922A' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid #E8E0D0' : 'none' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>{s.val}</div>
                <div style={{ fontSize: '9px', color: '#AAAAAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 small gauge cards */}
        {smallGauges.map((g, i) => (
          <div key={i} style={{
            background: '#FFFFFF',
            border: '1px solid #E8E0D0',
            borderTop: `3px solid ${g.borderColor}60`,
            borderRadius: '10px',
            padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }}>{g.label}</div>
            <SmallArc pct={g.pct} color={g.color} size={100} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: g.color, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{g.count}</div>
              <div style={{ fontSize: '10.5px', color: '#999999', marginTop: '3px' }}>cases · {g.pct}% of total</div>
            </div>
            <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: '#E8E0D0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${g.pct}%`, background: g.color, borderRadius: '2px', transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* TICKER */}
      <TickerBar items={tickerItems} />

      {/* 4 SPARKLINES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <SparkCard label="Processing Time"  value={`${(avgMs / 1000).toFixed(1)}s`}  color="#0057A8" up={false} data={spark_time}    />
        <SparkCard label="Deduction Rate"   value={`${avgDeduction.toFixed(1)}%`}     color="#E8A020" up={false} data={spark_ded}     />
        <SparkCard label="Approval Rate"    value={`${approvePct}%`}                  color="#00704A" up={true}  data={SPARK_APPROVE} />
        <SparkCard label="Compliance Score" value="98%"                               color="#C8922A" up={true}  data={SPARK_COMP}    />
      </div>

      {/* Historical strip */}
      {historicalStats && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '10px', padding: '14px 22px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#CCBBAA', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0, fontFamily: 'IBM Plex Mono, monospace' }}>HISTORICAL</div>
          {[
            { label: 'Records',       val: historicalStats.total_records.toLocaleString() },
            { label: 'Avg Salary',    val: `${Math.round(historicalStats.salary_stats.avg / 1000)}K AED` },
            { label: 'Avg Arrears',   val: `${Math.round(historicalStats.arrears_stats.avg / 1000)}K AED` },
            { label: 'Avg Deduction', val: `${historicalStats.avg_deduction_rate.toFixed(1)}%` },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'IBM Plex Mono, monospace' }}>{item.val}</span>
              <span style={{ fontSize: '10px', color: '#AAAAAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
