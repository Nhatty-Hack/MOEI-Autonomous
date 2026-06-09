import { useState, useEffect, useRef } from 'react';
import { ReschedulingApplication, AgentRecommendation } from '../types';
import { Zap, Clock, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface AgentPipelinePageProps {
  applications: ReschedulingApplication[];
  recommendations: Record<string, AgentRecommendation>;
  onAssessAll: () => void;
  batchProgress: string | null;
}

type LogType = 'system' | 'info' | 'success' | 'warning' | 'error' | 'data' | 'decision' | 'separator';
interface LogLine { type: LogType; text: string; ts?: string; }

const LOG_COLOR: Record<LogType, string> = {
  system:    '#999999',
  info:      '#0057A8',
  success:   '#00704A',
  warning:   '#A67420',
  error:     '#CC3333',
  data:      '#666666',
  decision:  '#C8922A',
  separator: '#E8E0D0',
};

const DEMO_LOGS: LogLine[] = [
  { type: 'system',    text: '════════════════════════════════════════════' },
  { type: 'system',    text: '  MOEI Arrears Assessment Agent  v2.0.0' },
  { type: 'system',    text: '  Sheikh Zayed Housing Programme' },
  { type: 'system',    text: '════════════════════════════════════════════' },
  { type: 'info',      text: '[INIT] Agent initialized. Awaiting case...' },
  { type: 'info',      text: '[CASE] Processing: MSZHP_100201' },
  { type: 'separator', text: '────────────────────────────────────────────' },
  { type: 'info',      text: '[STEP 1] UAE-PASS · Identity Verification' },
  { type: 'data',      text: '         emirates_id: 784-1985-XXXXXXX-X' },
  { type: 'success',   text: '         ✓ Identity verified [180ms]' },
  { type: 'info',      text: '[STEP 2] PRIOR-CHECK · Duplicate Detection' },
  { type: 'data',      text: '         active_requests: 0' },
  { type: 'success',   text: '         ✓ No duplicates found [95ms]' },
  { type: 'info',      text: '[STEP 3] DOC-VALIDATE · Document Check' },
  { type: 'data',      text: '         salary_cert_age: 28 days' },
  { type: 'warning',   text: '         ⚠ Certificate age approaching limit' },
  { type: 'success',   text: '         ✓ All documents valid [320ms]' },
  { type: 'info',      text: '[STEP 4] LOAN-DATA · SZHP Database Query' },
  { type: 'data',      text: '         balance:  387,500 AED' },
  { type: 'data',      text: '         arrears:   42,000 AED (18 months)' },
  { type: 'data',      text: '         emi_curr:   3,800 AED/mo' },
  { type: 'success',   text: '         ✓ Loan data retrieved [410ms]' },
  { type: 'info',      text: '[STEP 5] FINANCIAL · Income Analysis' },
  { type: 'data',      text: '         salary:    22,000 AED' },
  { type: 'data',      text: '         new_emi:    4,200 AED' },
  { type: 'data',      text: '         deduction: 13.1% (limit: 20%)' },
  { type: 'success',   text: '         ✓ 20% rule: COMPLIANT [680ms]' },
  { type: 'info',      text: '[STEP 6] SCHEDULE · Rescheduling Calc' },
  { type: 'data',      text: '         additional_months: 18' },
  { type: 'data',      text: '         new_emi:  4,200 AED/mo' },
  { type: 'data',      text: '         premium:    400 AED/mo' },
  { type: 'success',   text: '         ✓ Plan generated [1,015ms]' },
  { type: 'separator', text: '────────────────────────────────────────────' },
  { type: 'decision',  text: '  ✓ RECOMMENDATION: APPROVED' },
  { type: 'data',      text: '  confidence:   94%' },
  { type: 'data',      text: '  total_time:   2.7s' },
  { type: 'separator', text: '────────────────────────────────────────────' },
  { type: 'info',      text: '[AGENT] Case complete. Awaiting next...' },
  { type: 'system',    text: '█' },
];

const STEPS = [
  { n: 1, label: 'UAE PASS Verification',  labelAr: 'التحقق من الهوية',        time: '180ms' },
  { n: 2, label: 'Prior Request Check',    labelAr: 'فحص الطلبات',             time: '95ms'  },
  { n: 3, label: 'Document Validation',    labelAr: 'التحقق من المستندات',     time: '320ms' },
  { n: 4, label: 'Loan Data Retrieval',    labelAr: 'استرجاع بيانات القرض',    time: '410ms' },
  { n: 5, label: 'Financial Analysis',     labelAr: 'التحليل المالي',          time: '680ms' },
  { n: 6, label: 'Rescheduling Calc',      labelAr: 'احتساب الجدولة',          time: '1.0s'  },
];

export default function AgentPipelinePage({ applications, recommendations, onAssessAll, batchProgress }: AgentPipelinePageProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [activeStep] = useState(6);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isRunning = !!batchProgress;

  const realTraces = Object.values(recommendations).flatMap(r =>
    r.trace.map(t => ({
      type: t.status === 'FAILED' ? 'error' : t.status === 'WARNING' ? 'warning' : t.status === 'COMPLETED' || t.status === 'SUCCESS' || t.status === 'PASSED' ? 'success' : 'info',
      text: `[${t.step_name}] ${t.log_message}`,
    } as LogLine))
  );
  const logLines: LogLine[] = realTraces.length > 8 ? realTraces.slice(-40) : DEMO_LOGS;

  useEffect(() => {
    if (visibleLines >= logLines.length) return;
    const delay = logLines[visibleLines]?.type === 'separator' ? 30 : 60;
    const t = setTimeout(() => setVisibleLines(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [visibleLines, logLines.length]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [visibleLines]);

  useEffect(() => { setVisibleLines(0); }, [logLines.length]);

  const assessed = Object.values(recommendations);
  const avgMs = assessed.length > 0
    ? assessed.reduce((s, a) => s + (a.processing_time_ms || 0), 0) / assessed.length
    : 2700;
  const unassessedCount = applications.length - assessed.length;

  const lastRec = assessed[assessed.length - 1];
  const lastApp = lastRec ? applications.find(a => a.application_id === lastRec.application_id) : applications[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>AI Agent Pipeline</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 12px', borderRadius: '20px', backgroundColor: '#E8F5EE', border: '1px solid rgba(0,112,74,0.3)' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00704A', animation: 'pulseDot 2s ease infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00704A', letterSpacing: '0.06em' }}>AGENT ACTIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '6px' }}>
            <Clock size={12} color="#0057A8" />
            <span style={{ fontSize: '12px', fontFamily: 'IBM Plex Mono, monospace', color: '#0057A8', fontWeight: 600 }}>{avgMs > 0 ? `${(avgMs/1000).toFixed(1)}s` : '2.7s'} avg</span>
          </div>
          {unassessedCount > 0 && (
            <button
              onClick={onAssessAll}
              disabled={isRunning}
              style={{ height: '34px', padding: '0 16px', backgroundColor: isRunning ? '#F5F0E8' : '#C8922A', color: isRunning ? '#AAAAAA' : '#FFFFFF', border: isRunning ? '1px solid #E8E0D0' : 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}
            >
              <Zap size={12} />
              {batchProgress || `Run Pipeline (${unassessedCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Processed',    val: String(assessed.length || applications.length), color: '#C8922A' },
          { label: 'Avg Time',     val: avgMs > 0 ? `${(avgMs/1000).toFixed(1)}s` : '2.7s', color: '#0057A8' },
          { label: 'Success Rate', val: '98.2%', color: '#00704A' },
          { label: 'Agent Steps',  val: '6',     color: '#E8A020' },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: item.color, fontFamily: 'IBM Plex Mono, monospace' }}>{item.val}</span>
            <span style={{ fontSize: '11.5px', color: '#888888', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' }}>

        {/* Government terminal */}
        <div className="gov-terminal">
          <div className="gov-terminal-header">
            <div className="term-dot" style={{ background: '#EF4444' }} />
            <div className="term-dot" style={{ background: '#E8A020' }} />
            <div className="term-dot" style={{ background: '#00704A' }} />
            <span style={{ fontSize: '11px', color: '#999999', marginLeft: '8px', fontFamily: 'IBM Plex Mono, monospace' }}>
              moei-agent@szhp ~ assessment-pipeline
            </span>
          </div>
          <div ref={bodyRef} className="gov-terminal-body trace-scroll" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {logLines.slice(0, visibleLines).map((line, i) => {
              if (line.type === 'separator') {
                return <div key={i} style={{ color: '#E8E0D0', fontSize: '11px', userSelect: 'none' }}>{line.text}</div>;
              }
              return (
                <div key={i} className="term-line" style={{ color: LOG_COLOR[line.type], marginBottom: '1px' }}>
                  {line.type === 'decision'
                    ? <strong style={{ color: '#C8922A', fontSize: '13px' }}>{line.text}</strong>
                    : <span>{line.text}</span>
                  }
                </div>
              );
            })}
            {visibleLines > 0 && (
              <span className="cursor" style={{ color: '#C8922A', fontSize: '13px' }}>█</span>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Current case */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: '12px' }}>
              {isRunning ? 'Processing' : 'Last Processed'}
            </div>
            {lastApp ? (
              <>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px', direction: 'rtl', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
                  {lastApp.beneficiary.full_name_ar || lastApp.beneficiary.full_name}
                </div>
                <div style={{ fontSize: '12px', color: '#AAAAAA', fontFamily: 'IBM Plex Mono, monospace', marginBottom: '12px' }}>{lastApp.application_id}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Arrears', val: `${lastApp.arrears.overdue_amount.toLocaleString()} AED`, color: '#CC3333' },
                    { label: 'Balance', val: `${(lastApp.loan.remaining_balance / 1000).toFixed(0)}K AED`, color: '#1A1A1A' },
                    { label: 'Salary',  val: `${(lastApp.income.current_salary / 1000).toFixed(0)}K AED`, color: '#00704A' },
                    { label: 'Overdue', val: `${lastApp.arrears.overdue_months} mo`, color: '#E8A020' },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#F5F0E8', borderRadius: '6px', padding: '8px 10px', border: '1px solid #E8E0D0' }}>
                      <div style={{ fontSize: '9.5px', color: '#AAAAAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: item.color, fontFamily: 'IBM Plex Mono, monospace' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                {lastRec && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#F5F0E8', border: `1px solid ${lastRec.recommendation === 'APPROVE' ? 'rgba(0,112,74,0.3)' : 'rgba(204,51,51,0.25)'}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: lastRec.recommendation === 'APPROVE' ? '#00704A' : '#E8A020', letterSpacing: '0.05em' }}>
                      {lastRec.recommendation === 'APPROVE' ? '✓ APPROVED' : lastRec.recommendation === 'REFER_TO_EMPLOYEE' ? '→ REFERRED' : lastRec.recommendation}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999999', marginTop: '2px', fontFamily: 'IBM Plex Mono, monospace' }}>
                      {lastRec.confidence_score ? `confidence: ${lastRec.confidence_score}%` : ''} {lastRec.processing_time_ms ? `· ${(lastRec.processing_time_ms/1000).toFixed(1)}s` : ''}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#AAAAAA', fontSize: '12px' }}>No cases processed yet</div>
            )}
          </div>

          {/* Pipeline steps */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: '14px' }}>Pipeline Steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {STEPS.map((step, i) => {
                const isDone = i < activeStep;
                const isActive = i === activeStep && isRunning;
                return (
                  <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '6px', background: isDone ? 'rgba(0,112,74,0.04)' : 'transparent', border: isActive ? '1px solid rgba(0,87,168,0.3)' : '1px solid transparent' }}>
                    <div style={{ flexShrink: 0 }}>
                      {isDone
                        ? <CheckCircle2 size={15} color="#00704A" />
                        : isActive
                          ? <Loader2 size={15} color="#0057A8" style={{ animation: 'spin 1s linear infinite' }} />
                          : <Circle size={15} color="#E8E0D0" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: isDone ? '#1A1A1A' : '#AAAAAA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.label}</div>
                      <div dir="rtl" className="arabic" style={{ fontSize: '10px', color: isDone ? '#C8922A' : '#CCBBAA', marginTop: '1px' }}>{step.labelAr}</div>
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', color: isDone ? '#0057A8' : '#CCBBAA', flexShrink: 0 }}>{step.time}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
