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
  'Verifying identity via UAE PASS...',
  'Checking for prior active requests...',
  'Validating salary certificate & documents...',
  'Retrieving loan data from SZHP systems...',
  'Analyzing income & family situation...',
  'Calculating rescheduling plan...',
  'Validating 20% deduction rule...',
  'Generating recommendation...',
];

function getRecommendationConfig(rec: string) {
  switch (rec) {
    case 'APPROVE':
      return { label: 'Approved', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" /> };
    case 'REQUEST_DOCUMENTS':
      return { label: 'Additional Documents Required', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: <FileQuestion className="w-8 h-8 text-amber-600" /> };
    case 'REFER_TO_EMPLOYEE':
      return { label: 'Referred for Manual Review', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: <UserCheck className="w-8 h-8 text-blue-600" /> };
    case 'REJECT':
      return { label: 'Request Declined', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <XCircle className="w-8 h-8 text-red-600" /> };
    default:
      return { label: 'Pending', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: <Clock className="w-8 h-8 text-slate-600" /> };
  }
}

export default function BeneficiaryView({
  application,
  recommendation,
  isProcessing,
  onSubmitForAssessment,
}: BeneficiaryViewProps) {
  const app = application;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Your Rescheduling Request
        </h2>
        <p className="text-sm font-mono text-slate-500">
          Application ID: {app.application_id}
        </p>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-slate-900 rounded-xl p-6 md:p-8 shadow-2xl border border-slate-800">
          <h4 className="flex items-center text-emerald-400 font-mono text-sm tracking-widest font-bold mb-6">
            <Activity className="w-4 h-4 mr-2" /> PROCESSING YOUR REQUEST...
          </h4>
          <div className="font-mono text-xs md:text-sm text-slate-400 space-y-3">
            {PROCESSING_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.6 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.6 + 0.4 }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </motion.div>
                <span>{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Result */}
      {recommendation && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Badge */}
          {(() => {
            const config = getRecommendationConfig(recommendation.recommendation);
            return (
              <div className={`${config.bg} border ${config.border} rounded-xl p-6 text-center space-y-3`}>
                <div className="flex justify-center">{config.icon}</div>
                <h3 className={`text-xl font-bold ${config.text}`}>{config.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                  {recommendation.reasoning}
                </p>
                {recommendation.reasoning_ar && (
                  <p
                    className="text-sm text-slate-700 leading-relaxed max-w-lg mx-auto font-[family-name:var(--font-arabic)]"
                    dir="rtl"
                  >
                    {recommendation.reasoning_ar}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Proposed Plan */}
          {recommendation.recommendation === 'APPROVE' && recommendation.proposed_plan && (
            <div className="bg-white border border-emerald-200 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">
                Approved Rescheduling Plan
              </h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
                    New Monthly EMI
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-800">
                    {recommendation.proposed_plan.new_emi.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-600">AED</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
                    Additional Months
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-800">
                    {recommendation.proposed_plan.additional_months}
                  </div>
                  <div className="text-xs text-emerald-600">months</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
                    Deduction Rate
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-800">
                    {recommendation.proposed_plan.deduction_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-emerald-600">of salary</div>
                </div>
              </div>
            </div>
          )}

          {/* Missing Documents */}
          {recommendation.recommendation === 'REQUEST_DOCUMENTS' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
              <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider">
                Documents Required
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                {recommendation.case_summary}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Pre-assessment View */}
      {!recommendation && !isProcessing && (
        <div className="space-y-6">
          {/* Application Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Application Summary
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Beneficiary</div>
                <div className="text-slate-900 font-medium">{app.beneficiary.full_name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Emirates ID</div>
                <div className="text-slate-900 font-mono">{app.beneficiary.emirates_id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Current Salary</div>
                <div className="text-slate-900 font-mono font-semibold">
                  {app.income.current_salary.toLocaleString()} AED
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Arrears Amount</div>
                <div className="text-red-700 font-mono font-semibold">
                  {app.arrears.overdue_amount.toLocaleString()} AED
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Overdue Months</div>
                <div className="text-slate-900 font-mono">{app.arrears.overdue_months}</div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Request Type</div>
                <div className="text-slate-900 text-xs font-semibold">
                  {app.request_type.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Document Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Submitted Documents
            </h3>
            <ul className="space-y-2">
              {app.arrears.supporting_documents.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${doc.is_valid ? 'text-emerald-500' : 'text-amber-500'}`}
                  />
                  <span className="text-slate-700">{doc.name}</span>
                  {doc.is_stamped && (
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200">
                      STAMPED
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmitForAssessment}
            className="w-full py-3.5 bg-[#00694E] hover:bg-[#005740] text-white font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-900/20 text-sm"
          >
            <Zap className="w-5 h-5" />
            Submit for AI Assessment
          </button>
        </div>
      )}
    </div>
  );
}
