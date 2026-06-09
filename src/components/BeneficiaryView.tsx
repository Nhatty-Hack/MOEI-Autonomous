import type { ReactNode } from 'react';
import { ReschedulingApplication, AgentRecommendation } from '../types';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  FileQuestion,
  UserCheck,
  Zap,
  FileText,
  Clock,
  Activity,
} from 'lucide-react';

interface BeneficiaryViewProps {
  application: ReschedulingApplication;
  recommendation: AgentRecommendation | null;
  isProcessing: boolean;
  onSubmitForAssessment: () => void;
}

const PROCESSING_STEPS = [
  { en: 'Verifying identity via UAE PASS...',       ar: 'التحقق من الهوية عبر UAE PASS...' },
  { en: 'Checking for prior active requests...',    ar: 'التحقق من الطلبات النشطة المسبقة...' },
  { en: 'Validating salary certificate...',         ar: 'التحقق من شهادة الراتب...' },
  { en: 'Retrieving loan data from SZHP...',        ar: 'استرداد بيانات القرض...' },
  { en: 'Analysing income & family situation...',   ar: 'تحليل الدخل والوضع الأسري...' },
  { en: 'Calculating rescheduling plan...',         ar: 'حساب خطة إعادة الجدولة...' },
  { en: 'Validating 20% deduction rule...',         ar: 'التحقق من قاعدة الاستقطاع 20٪...' },
  { en: 'Generating official recommendation...',   ar: 'إصدار التوصية الرسمية...' },
];

type StatusConfig = {
  label: string;
  labelAr: string;
  bg: string;
  border: string;
  text: string;
  accentColor: string;
  icon: ReactNode;
};

function getRecommendationConfig(rec: string): StatusConfig {
  switch (rec) {
    case 'APPROVE':
      return {
        label: 'Application Approved',
        labelAr: 'تمت الموافقة على الطلب',
        bg: '#E8F5EE', border: '#A7D9BC', text: '#00704A', accentColor: '#00704A',
        icon: <CheckCircle2 size={36} color="#00704A" />,
      };
    case 'REQUEST_DOCUMENTS':
      return {
        label: 'Additional Documents Required',
        labelAr: 'مستندات إضافية مطلوبة',
        bg: '#FFF9E8', border: '#E8C870', text: '#A67420', accentColor: '#C8922A',
        icon: <FileQuestion size={36} color="#A67420" />,
      };
    case 'REFER_TO_EMPLOYEE':
      return {
        label: 'Referred for Manual Review',
        labelAr: 'محال للمراجعة اليدوية',
        bg: '#FEF3E8', border: '#F0C888', text: '#C8922A', accentColor: '#C8922A',
        icon: <UserCheck size={36} color="#C8922A" />,
      };
    case 'REJECT':
      return {
        label: 'Request Declined',
        labelAr: 'تم رفض الطلب',
        bg: '#FEE8E8', border: '#F5AAAA', text: '#CC3333', accentColor: '#CC3333',
        icon: <XCircle size={36} color="#CC3333" />,
      };
    default:
      return {
        label: 'Pending',
        labelAr: 'قيد الانتظار',
        bg: '#F5F0E8', border: '#E8E0D0', text: '#8B7355', accentColor: '#888888',
        icon: <Clock size={36} color="#888888" />,
      };
  }
}

export default function BeneficiaryView({
  application: app,
  recommendation,
  isProcessing,
  onSubmitForAssessment,
}: BeneficiaryViewProps) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Portal header card ──────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E0D0',
          borderRadius: '10px',
          borderTop: '3px solid #C8922A',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 3px' }}>
            Your Rescheduling Request
          </h2>
          <div
            dir="rtl"
            className="arabic"
            style={{ fontSize: '13px', color: '#888888' }}
          >
            طلب إعادة جدولة المتأخرات
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
            Application ID
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#555555', fontWeight: 600 }}>
            {app.application_id}
          </div>
        </div>
      </div>

      {/* ── Processing animation ────────────────────────────── */}
      {isProcessing && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8E0D0',
            borderRadius: '10px',
            padding: '22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#C8922A',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '18px',
            }}
          >
            <Activity size={14} />
            Processing your request...
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PROCESSING_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.6 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.6 + 0.4 }}
                  style={{ marginTop: '2px', flexShrink: 0 }}
                >
                  <CheckCircle2 size={13} color="#C8922A" />
                </motion.div>
                <div>
                  <span style={{ fontSize: '12px', color: '#444444', fontFamily: 'monospace' }}>
                    {step.en}
                  </span>
                  <span
                    dir="rtl"
                    className="arabic"
                    style={{ display: 'block', fontSize: '10px', color: '#999999', marginTop: '1px' }}
                  >
                    {step.ar}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Result ──────────────────────────────────────────── */}
      {recommendation && !isProcessing && (() => {
        const cfg = getRecommendationConfig(recommendation.recommendation);
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {/* Decision card */}
            <div
              style={{
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: '10px',
                borderTop: `3px solid ${cfg.accentColor}`,
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                {cfg.icon}
              </div>
              <div
                dir="rtl"
                className="arabic"
                style={{ fontSize: '22px', fontWeight: 700, color: cfg.text, lineHeight: 1.2 }}
              >
                {cfg.labelAr}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: cfg.text, marginTop: '4px' }}>
                {cfg.label}
              </div>
              <p style={{ fontSize: '13.5px', color: '#555555', marginTop: '12px', lineHeight: 1.65 }}>
                {recommendation.reasoning}
              </p>
              {recommendation.reasoning_ar && (
                <p
                  dir="rtl"
                  className="arabic"
                  style={{ fontSize: '13px', color: '#1A1A1A', marginTop: '8px', lineHeight: 1.75 }}
                >
                  {recommendation.reasoning_ar}
                </p>
              )}
            </div>

            {/* Approved plan metrics */}
            {recommendation.recommendation === 'APPROVE' && recommendation.proposed_plan && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #A7D9BC',
                  borderRadius: '10px',
                  borderTop: '3px solid #00704A',
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#00704A',
                    marginBottom: '14px',
                  }}
                >
                  Approved Rescheduling Plan — الخطة المعتمدة
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    {
                      label: 'New Monthly EMI',
                      labelAr: 'القسط الشهري الجديد',
                      value: `${recommendation.proposed_plan.new_emi.toLocaleString()}`,
                      unit: 'AED',
                    },
                    {
                      label: 'Additional Months',
                      labelAr: 'أشهر إضافية',
                      value: `${recommendation.proposed_plan.additional_months}`,
                      unit: 'months',
                    },
                    {
                      label: 'Deduction Rate',
                      labelAr: 'نسبة الاستقطاع',
                      value: `${recommendation.proposed_plan.deduction_rate.toFixed(1)}%`,
                      unit: 'of salary',
                    },
                  ].map(m => (
                    <div
                      key={m.label}
                      style={{
                        backgroundColor: '#F5F0E8',
                        border: '1px solid #E8E0D0',
                        borderRadius: '8px',
                        padding: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#00704A', marginBottom: '6px' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'monospace', lineHeight: 1 }}>
                        {m.value}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888888', marginTop: '3px' }}>{m.unit}</div>
                      <div dir="rtl" className="arabic" style={{ fontSize: '10px', color: '#888888', marginTop: '2px' }}>
                        {m.labelAr}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* ── Pre-assessment ──────────────────────────────────── */}
      {!recommendation && !isProcessing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Application summary card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E0D0',
              borderRadius: '10px',
              borderTop: '3px solid #C8922A',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#1A1A1A',
                marginBottom: '16px',
              }}
            >
              Application Summary — ملخص الطلب
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { labelEn: 'Beneficiary', labelAr: 'المستفيد', value: app.beneficiary.full_name, valueAr: app.beneficiary.full_name_ar },
                { labelEn: 'Emirates ID', labelAr: 'رقم الهوية', value: app.beneficiary.emirates_id, mono: true },
                { labelEn: 'Monthly Salary', labelAr: 'الراتب الشهري', value: `${app.income.current_salary.toLocaleString()} AED`, mono: true },
                { labelEn: 'Arrears Amount', labelAr: 'مبلغ المتأخرات', value: `${app.arrears.overdue_amount.toLocaleString()} AED`, mono: true, red: true },
                { labelEn: 'Overdue Months', labelAr: 'أشهر التأخر', value: `${app.arrears.overdue_months} months`, mono: true },
                { labelEn: 'Request Type', labelAr: 'نوع الطلب', value: app.request_type.replace(/_/g, ' ') },
              ].map(({ labelEn, labelAr, value, valueAr, mono, red }) => (
                <div key={labelEn}>
                  <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888888', marginBottom: '3px' }}>
                    {labelEn}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: red ? '#CC3333' : '#1A1A1A',
                      fontFamily: mono ? 'monospace' : 'inherit',
                    }}
                  >
                    {value}
                  </div>
                  {valueAr && (
                    <div
                      dir="rtl"
                      className="arabic"
                      style={{ fontSize: '12px', color: '#888888' }}
                    >
                      {valueAr}
                    </div>
                  )}
                  <div dir="rtl" className="arabic" style={{ fontSize: '10px', color: '#AAAAAA' }}>
                    {labelAr}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E0D0',
              borderRadius: '10px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#1A1A1A',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FileText size={13} color="#C8922A" />
              Submitted Documents — المستندات المقدمة
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {app.arrears.supporting_documents.map((doc, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    padding: '8px 12px',
                    backgroundColor: '#FDFAF5',
                    border: '1px solid #F0EBE0',
                    borderRadius: '6px',
                  }}
                >
                  <CheckCircle2 size={14} color={doc.is_valid ? '#00704A' : '#C8922A'} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#555555' }}>{doc.name}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: doc.is_stamped ? '#E8F5EE' : '#FEE8E8',
                      color: doc.is_stamped ? '#00704A' : '#CC3333',
                    }}
                  >
                    {doc.is_stamped ? 'STAMPED' : 'UNSTAMPED'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submit CTA */}
          <button
            onClick={onSubmitForAssessment}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: '#C8922A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(200,146,42,0.25)',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A67420')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8922A')}
          >
            <Zap size={18} />
            تقديم للتقييم | Submit for Assessment
          </button>
        </div>
      )}
    </div>
  );
}
