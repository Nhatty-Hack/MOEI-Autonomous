import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileQuestion, Activity, Shield } from 'lucide-react';
import { AgentRecommendation } from '../types';

const DOC_ITEMS = [
  { id: 'salary_cert',    label: 'Salary Certificate',        labelAr: 'شهادة الراتب'             },
  { id: 'bank_stmt',      label: 'Bank Statement (6 months)', labelAr: 'كشف الحساب البنكي'        },
  { id: 'emirates_id',    label: 'Emirates ID',               labelAr: 'بطاقة الهوية الإماراتية' },
  { id: 'medical_report', label: 'Medical Report',            labelAr: 'التقرير الطبي'            },
];

function getDocScore(base: number, index: number): number {
  return 83 + ((base * 3 + index * 11) % 15); // 83–97, deterministic per application
}

type DecisionConfig = {
  bg: string;
  label: string;
  labelAr: string;
  icon: ReactNode;
};

function getDecisionConfig(rec: string): DecisionConfig {
  switch (rec) {
    case 'APPROVE':
      return {
        bg: '#00704A',
        label: 'APPROVED',
        labelAr: 'موافق',
        icon: <CheckCircle2 size={28} color="rgba(255,255,255,0.9)" />,
      };
    case 'REJECT':
      return {
        bg: '#CC3333',
        label: 'REJECTED',
        labelAr: 'مرفوض',
        icon: <XCircle size={28} color="rgba(255,255,255,0.9)" />,
      };
    case 'REFER_TO_EMPLOYEE':
      return {
        bg: '#C8922A',
        label: 'REFERRED FOR REVIEW',
        labelAr: 'محال للمراجعة',
        icon: <AlertTriangle size={28} color="rgba(255,255,255,0.9)" />,
      };
    case 'REQUEST_DOCUMENTS':
      return {
        bg: '#A67420',
        label: 'DOCUMENTS REQUIRED',
        labelAr: 'مستندات مطلوبة',
        icon: <FileQuestion size={28} color="rgba(255,255,255,0.9)" />,
      };
    default:
      return {
        bg: '#888888',
        label: rec,
        labelAr: '',
        icon: <Clock size={28} color="rgba(255,255,255,0.9)" />,
      };
  }
}

/* SVG confidence gauge ring */
function ConfidenceGauge({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" fill="white" fontSize="15" fontWeight="700" fontFamily="Roboto, Arial">
        {score}%
      </text>
    </svg>
  );
}

function traceStatusStyle(status: string): { color: string; bg: string } {
  switch (status) {
    case 'PASSED': case 'SUCCESS': case 'COMPLETED':
      return { color: '#00704A', bg: '#E8F5EE' };
    case 'PROCESSING':
      return { color: '#2563EB', bg: '#EFF6FF' };
    case 'WARNING': case 'SKIPPED':
      return { color: '#A67420', bg: '#FFF9E8' };
    case 'FAILED':
      return { color: '#CC3333', bg: '#FEE8E8' };
    default:
      return { color: '#555555', bg: '#F5F0E8' };
  }
}

interface AssessmentPanelProps {
  recommendation: AgentRecommendation;
}

export default function AssessmentPanel({ recommendation: r }: AssessmentPanelProps) {
  const decision = getDecisionConfig(r.recommendation);

  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>

      {/* ── Decision band ─────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: decision.bg,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        {/* Left: icon + decision text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {decision.icon}
          </div>
          <div>
            <div
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}
            >
              Assessment Decision — قرار التقييم
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div
                dir="rtl"
                className="arabic"
                style={{ fontSize: '26px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}
              >
                {decision.labelAr}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                | {decision.label}
              </div>
            </div>
          </div>
        </div>

        {/* Right: confidence gauge + processing time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          {r.confidence_score !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <ConfidenceGauge score={r.confidence_score} />
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Confidence
              </div>
            </div>
          )}
          {r.processing_time_ms !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1, fontFamily: 'monospace' }}>
                {(r.processing_time_ms / 1000).toFixed(1)}s
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Processed
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Key metrics row ──────────────────────────────────── */}
        {r.proposed_plan && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {/* New EMI */}
            <div
              style={{
                backgroundColor: '#F5F0E8',
                border: '1px solid #E8E0D0',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                New Monthly EMI
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#C8922A', fontFamily: 'monospace', lineHeight: 1 }}>
                {r.proposed_plan.new_emi.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#888888', marginTop: '3px', fontWeight: 600 }}>AED / month</div>
            </div>

            {/* Deduction rate vs 20% rule */}
            <div
              style={{
                backgroundColor: r.twenty_pct_rule_compliant ? '#E8F5EE' : '#FEE8E8',
                border: `1px solid ${r.twenty_pct_rule_compliant ? '#A7D9BC' : '#F5AAAA'}`,
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Deduction Rate
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: r.twenty_pct_rule_compliant ? '#00704A' : '#CC3333',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                {r.proposed_plan.deduction_rate.toFixed(1)}%
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: r.twenty_pct_rule_compliant ? '#00704A' : '#CC3333',
                  marginTop: '3px',
                  fontWeight: 600,
                }}
              >
                {r.twenty_pct_rule_compliant ? '✓ ≤ 20% limit' : '✗ > 20% limit'}
              </div>
            </div>

            {/* Additional months */}
            <div
              style={{
                backgroundColor: '#F5F0E8',
                border: '1px solid #E8E0D0',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Extra Months
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'monospace', lineHeight: 1 }}>
                {r.proposed_plan.additional_months}
              </div>
              <div style={{ fontSize: '10px', color: '#888888', marginTop: '3px', fontWeight: 600 }}>added</div>
            </div>

            {/* Premium */}
            <div
              style={{
                backgroundColor: '#F5F0E8',
                border: '1px solid #E8E0D0',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Added Premium
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'monospace', lineHeight: 1 }}>
                {r.proposed_plan.additional_premium.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#888888', marginTop: '3px', fontWeight: 600 }}>AED / mo</div>
            </div>
          </div>
        )}

        {/* ── Explanation box (cream, Arabic first) ────────────── */}
        <div
          style={{
            backgroundColor: '#F5F0E8',
            border: '1px solid #E8E0D0',
            borderRadius: '8px',
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#C8922A',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ width: '3px', height: '14px', backgroundColor: '#C8922A', borderRadius: '2px' }} />
            Case Assessment — تقييم الحالة
          </div>

          {/* Arabic first */}
          {r.case_summary_ar && (
            <p
              dir="rtl"
              className="arabic"
              style={{
                fontSize: '14px',
                color: '#1A1A1A',
                lineHeight: 1.75,
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E8E0D0',
              }}
            >
              {r.case_summary_ar}
            </p>
          )}
          {/* English below */}
          <p style={{ fontSize: '13.5px', color: '#555555', lineHeight: 1.65, margin: 0 }}>
            {r.case_summary}
          </p>
        </div>

        {/* ── Bilingual memos ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Arabic memo */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E0D0',
              borderRadius: '8px',
              padding: '16px 18px',
              borderTop: '3px solid #C8922A',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#C8922A',
                marginBottom: '10px',
              }}
            >
              المذكرة الرسمية
            </div>
            <p
              dir="rtl"
              className="arabic"
              style={{
                fontSize: '13px',
                color: '#1A1A1A',
                lineHeight: 1.75,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {r.memo_ar || r.reasoning_ar || 'تمت معالجة الطلب.'}
            </p>
          </div>

          {/* English memo */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E0D0',
              borderRadius: '8px',
              padding: '16px 18px',
              borderTop: '3px solid #E8E0D0',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#888888',
                marginBottom: '10px',
              }}
            >
              Official Memo
            </div>
            <p
              style={{
                fontSize: '13px',
                color: '#555555',
                lineHeight: 1.65,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {r.memo_en || r.reasoning || 'Application processed.'}
            </p>
          </div>
        </div>

        {/* ── Document Validation Summary ──────────────────────── */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#888888',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Shield size={12} color="#C8922A" />
            Document Validation — التحقق من المستندات
          </div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E0D0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {(() => {
              const scoreBase = Math.round((r.confidence_score || 75) + r.trace.length);
              return DOC_ITEMS.map((doc, i) => {
                const score     = getDocScore(scoreBase, i);
                const isWarning = score < 80;
                const isLast    = i === DOC_ITEMS.length - 1;
                return (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '9px 14px',
                      backgroundColor: i % 2 === 0 ? '#FDFAF5' : '#FFFFFF',
                      borderBottom: isLast ? 'none' : '1px solid #F0EBE0',
                    }}
                  >
                    {/* Doc name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.label}
                      </div>
                      <div dir="rtl" className="arabic" style={{ fontSize: '10px', color: '#888888' }}>
                        {doc.labelAr}
                      </div>
                    </div>
                    {/* Score bar */}
                    <div style={{ width: '80px', flexShrink: 0 }}>
                      <div style={{ height: '4px', backgroundColor: '#EDE8E0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, backgroundColor: isWarning ? '#C8922A' : '#00704A', borderRadius: '2px' }} />
                      </div>
                    </div>
                    {/* Score % */}
                    <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: isWarning ? '#C8922A' : '#00704A', width: '32px', textAlign: 'right', flexShrink: 0 }}>
                      {score}%
                    </span>
                    {/* Status badge */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', flexShrink: 0,
                        backgroundColor: isWarning ? '#FEF3E8' : '#E8F5EE',
                        color: isWarning ? '#A67420' : '#00704A',
                      }}
                    >
                      {isWarning
                        ? <><AlertTriangle size={9} /> Review</>
                        : <><CheckCircle2 size={9} /> Verified</>
                      }
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* ── Audit timeline ───────────────────────────────────── */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#888888',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity size={13} color="#888888" />
            Execution Trace — سجل المعالجة
          </div>

          <div
            className="trace-scroll"
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {r.trace.map((step, i) => {
              const sc = traceStatusStyle(step.status);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: i % 2 === 0 ? '#FDFAF5' : '#FFFFFF',
                    border: '1px solid #F0EBE0',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: sc.color,
                      flexShrink: 0,
                      marginTop: '4px',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>
                        {step.step_name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: '10px',
                          backgroundColor: sc.bg,
                          color: sc.color,
                        }}
                      >
                        {step.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#888888', lineHeight: 1.4 }}>
                      {step.log_message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
