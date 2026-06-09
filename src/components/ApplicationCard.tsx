import type { ReactNode } from 'react';
import { ReschedulingApplication, AgentRecommendation } from '../types';
import {
  BrainCircuit,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AssessmentPanel from './AssessmentPanel';
import ProcessingAnimation from './ProcessingAnimation';

interface ApplicationCardProps {
  app: ReschedulingApplication;
  recommendation: AgentRecommendation | undefined;
  isProcessing: boolean;
  isExpanded: boolean;
  onAssess: (appId: string) => void;
  onToggleExpand: (appId: string) => void;
}

type BadgeConfig = {
  bg: string;
  text: string;
  border: string;
  label: string;
  labelAr: string;
  accentColor: string;
  icon: ReactNode;
};

function getStatusBadge(rec: string): BadgeConfig {
  switch (rec) {
    case 'APPROVE':
      return {
        bg: '#E8F5EE', text: '#00704A', border: '#A7D9BC', accentColor: '#00704A',
        label: 'Approved', labelAr: 'موافق',
        icon: <CheckCircle2 size={12} />,
      };
    case 'REQUEST_DOCUMENTS':
      return {
        bg: '#FFF9E8', text: '#A67420', border: '#E8C870', accentColor: '#C8922A',
        label: 'Docs Required', labelAr: 'مستندات',
        icon: <FileQuestion size={12} />,
      };
    case 'REFER_TO_EMPLOYEE':
      return {
        bg: '#FEF3E8', text: '#C8922A', border: '#F0C888', accentColor: '#C8922A',
        label: 'Referred', labelAr: 'محال',
        icon: <AlertTriangle size={12} />,
      };
    case 'REJECT':
      return {
        bg: '#FEE8E8', text: '#CC0000', border: '#F5AAAA', accentColor: '#CC3333',
        label: 'Rejected', labelAr: 'مرفوض',
        icon: <XCircle size={12} />,
      };
    default:
      return {
        bg: '#F5F0E8', text: '#8B7355', border: '#D4C5A9', accentColor: '#888888',
        label: 'Pending', labelAr: 'قيد الانتظار',
        icon: <Clock size={12} />,
      };
  }
}

export default function ApplicationCard({
  app,
  recommendation,
  isProcessing,
  isExpanded,
  onAssess,
  onToggleExpand,
}: ApplicationCardProps) {
  const badge = recommendation ? getStatusBadge(recommendation.recommendation) : null;
  const accentColor = badge?.accentColor ?? '#E8E0D0';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8E0D0',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      }}
    >
      {/* Left gold/status accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: accentColor,
        }}
      />

      {/* Processing overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(1px)',
            zIndex: 10,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #E8E0D0',
                borderTopColor: '#C8922A',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 8px',
              }}
            />
            <div style={{ fontSize: '12px', color: '#888888' }}>Processing...</div>
          </div>
        </motion.div>
      )}

      <div style={{ padding: '20px 20px 20px 24px' }}>
        {/* ── Top row: name + status badge ────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Arabic name first (MOEI convention) */}
            {app.beneficiary.full_name_ar && (
              <div
                dir="rtl"
                className="arabic"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {app.beneficiary.full_name_ar}
              </div>
            )}
            <div
              style={{
                fontSize: '14px',
                color: '#555555',
                marginTop: app.beneficiary.full_name_ar ? '2px' : '0',
                fontWeight: app.beneficiary.full_name_ar ? 400 : 600,
              }}
            >
              {app.beneficiary.full_name}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#888888',
                fontFamily: "'Roboto Mono', monospace",
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{app.beneficiary.emirates_id}</span>
              <span style={{ color: '#E8E0D0' }}>·</span>
              <span>{app.application_id}</span>
              <span style={{ color: '#E8E0D0' }}>·</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#555555',
                }}
              >
                <Users size={10} />
                {app.family.total_family_members}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
            {badge ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: badge.bg,
                  color: badge.text,
                  border: `1px solid ${badge.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {badge.icon}
                {badge.labelAr} | {badge.label}
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#F5F0E8',
                  color: '#8B7355',
                  border: '1px solid #D4C5A9',
                }}
              >
                <Clock size={11} />
                قيد الانتظار | Pending
              </div>
            )}
            <div
              style={{
                fontSize: '10px',
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {app.request_type.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* ── Financial figures row ─────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderRadius: '8px',
            border: '1px solid #E8E0D0',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {/* Loan Balance */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#FDFAF5',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              Loan Balance
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#1A1A1A',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {app.loan.remaining_balance.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', color: '#C8922A', fontWeight: 600, marginTop: '3px' }}>
              AED
            </div>
          </div>

          {/* Arrears */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#FFF8F8',
              textAlign: 'center',
              borderLeft: '1px solid #E8E0D0',
              borderRight: '1px solid #E8E0D0',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              Arrears
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#CC3333',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {app.arrears.overdue_amount.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', color: '#CC3333', fontWeight: 600, marginTop: '3px' }}>
              AED
            </div>
          </div>

          {/* Overdue months + salary */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#FDFAF5',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              Overdue
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#1A1A1A',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {app.arrears.overdue_months}
            </div>
            <div style={{ fontSize: '10px', color: '#888888', fontWeight: 600, marginTop: '3px' }}>
              months
            </div>
          </div>
        </div>

        {/* ── Salary + compliance chips ─────────────────────── */}
        {recommendation && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '20px',
                backgroundColor: recommendation.twenty_pct_rule_compliant ? '#E8F5EE' : '#FEE8E8',
                color: recommendation.twenty_pct_rule_compliant ? '#00704A' : '#CC0000',
                border: `1px solid ${recommendation.twenty_pct_rule_compliant ? '#A7D9BC' : '#F5AAAA'}`,
              }}
            >
              {recommendation.twenty_pct_rule_compliant ? '✓' : '✗'} 20% Rule
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '20px',
                backgroundColor: recommendation.period_rule_compliant ? '#E8F5EE' : '#FEE8E8',
                color: recommendation.period_rule_compliant ? '#00704A' : '#CC0000',
                border: `1px solid ${recommendation.period_rule_compliant ? '#A7D9BC' : '#F5AAAA'}`,
              }}
            >
              {recommendation.period_rule_compliant ? '✓' : '✗'} Period Rule
            </div>
            {recommendation.proposed_plan && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  backgroundColor: '#F5F0E8',
                  color: '#555555',
                  border: '1px solid #E8E0D0',
                }}
              >
                New EMI: {recommendation.proposed_plan.new_emi.toLocaleString()} AED
              </div>
            )}
          </div>
        )}

        {/* ── Action row ───────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{ fontSize: '11.5px', color: '#888888', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#F5F0E8',
                border: '1px solid #E8E0D0',
                fontSize: '10px',
                fontWeight: 600,
                color: '#555555',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {app.beneficiary.employment_status.replace(/_/g, ' ')}
            </span>
            {app.beneficiary.is_person_of_determination && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#1D4ED8',
                }}
              >
                PoD
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!recommendation && !isProcessing && (
              <button
                onClick={() => onAssess(app.application_id)}
                style={{
                  height: '40px',
                  padding: '0 20px',
                  backgroundColor: '#C8922A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A67420')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8922A')}
              >
                <Zap size={13} />
                تقييم الطلب | Assess
              </button>
            )}
            {recommendation && !isProcessing && (
              <button
                onClick={() => onToggleExpand(app.application_id)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  color: '#C8922A',
                  border: '1.5px solid #C8922A',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FEF3E8';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={14} />
                    إخفاء | Hide
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    عرض التفاصيل | Details
                  </>
                )}
              </button>
            )}
            {!recommendation && isProcessing && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#C8922A',
                  fontWeight: 600,
                }}
              >
                <BrainCircuit size={14} />
                Analysing...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded assessment panel ─────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                borderTop: '1px solid #E8E0D0',
                margin: '0 0 0 4px',
              }}
            >
              {isProcessing ? (
                <ProcessingAnimation />
              ) : recommendation ? (
                <AssessmentPanel recommendation={recommendation} />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
