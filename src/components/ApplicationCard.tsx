import { ReschedulingApplication, AgentRecommendation } from '../types';
import {
  BrainCircuit,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
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

function getRecommendationColor(rec: string) {
  switch (rec) {
    case 'APPROVE':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    case 'REQUEST_DOCUMENTS':
      return 'bg-amber-500/10 text-amber-700 border-amber-200';
    case 'REFER_TO_EMPLOYEE':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'REJECT':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-slate-500/10 text-slate-700 border-slate-200';
  }
}

function getRecommendationIcon(rec: string) {
  switch (rec) {
    case 'APPROVE':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case 'REQUEST_DOCUMENTS':
      return <Clock className="w-5 h-5 text-amber-600" />;
    case 'REFER_TO_EMPLOYEE':
      return <AlertTriangle className="w-5 h-5 text-blue-600" />;
    case 'REJECT':
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Clock className="w-5 h-5 text-slate-600" />;
  }
}

function getRecommendationLabel(rec: string) {
  switch (rec) {
    case 'APPROVE':
      return 'APPROVED';
    case 'REQUEST_DOCUMENTS':
      return 'DOCUMENTS REQUIRED';
    case 'REFER_TO_EMPLOYEE':
      return 'REFERRED TO EMPLOYEE';
    case 'REJECT':
      return 'REJECTED';
    default:
      return rec;
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all relative overflow-hidden">
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] z-10 pointer-events-none rounded-xl"
        />
      )}

      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        {/* Left: Beneficiary Info */}
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-medium">{app.beneficiary.full_name}</h3>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded border border-slate-200 uppercase tracking-wide">
                {app.beneficiary.employment_status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm font-mono text-slate-500">
              ID: {app.beneficiary.emirates_id} &middot; APP: {app.application_id}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm mt-4">
            {/* Financial Summary */}
            <div className="bg-slate-50 rounded pl-3 py-2 border-l-2 border-indigo-200">
              <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
                Arrears
              </div>
              <div className="font-mono text-slate-800 font-semibold">
                {app.arrears.overdue_amount.toLocaleString()} AED
              </div>
              <div className="text-xs text-slate-500">
                {app.arrears.overdue_months} Months Overdue
              </div>
            </div>

            <div className="bg-slate-50 rounded pl-3 py-2 border-l-2 border-emerald-200">
              <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
                Income & Family
              </div>
              <div className="font-mono text-slate-800 font-semibold">
                {app.income.current_salary.toLocaleString()} AED
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {app.family.dependents_count} dependents · {app.family.total_family_members} members
              </div>
            </div>

            {/* Request Type */}
            <div className="col-span-1 sm:col-span-2 flex items-center gap-3">
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                  app.request_type === 'UPDATE_INSTALLMENT'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {app.request_type.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500">
                EMI: {app.loan.current_emi.toLocaleString()} AED
              </span>
              <span className="text-xs text-slate-500">
                <FileText className="w-3 h-3 inline mr-0.5" />
                {app.arrears.supporting_documents.length} docs
              </span>
            </div>

            {/* Reason */}
            {app.arrears.reason_for_delay && (
              <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Reason for Delay
                </div>
                <div className="text-sm text-slate-700 leading-relaxed italic bg-amber-50 p-2 rounded border border-amber-100 border-dashed">
                  "{app.arrears.reason_for_delay}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Assessment Panel */}
        <div className="w-full md:w-80 space-y-4 shrink-0 flex flex-col justify-start">
          {!recommendation && !isProcessing && (
            <div className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50 space-y-3">
              <BrainCircuit className="w-8 h-8 text-indigo-400 opacity-60" />
              <div className="text-sm text-slate-500">
                Requires AI assessment to generate recommendation.
              </div>
              <button
                onClick={() => onAssess(app.application_id)}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Zap className="w-4 h-4" /> Execute AI Assessment
              </button>
            </div>
          )}

          {recommendation && !isProcessing && (
            <>
              {/* Recommendation Badge */}
              <div
                className={`rounded-lg border px-4 py-3 flex items-start gap-3 shadow-sm ${getRecommendationColor(recommendation.recommendation)}`}
              >
                <div className="mt-0.5 shrink-0">{getRecommendationIcon(recommendation.recommendation)}</div>
                <div className="space-y-1.5">
                  <div className="font-bold text-sm tracking-widest">
                    {getRecommendationLabel(recommendation.recommendation)}
                  </div>
                  <div className="text-xs font-medium leading-relaxed opacity-95">
                    {recommendation.reasoning}
                  </div>
                </div>
              </div>

              {/* Compliance Checks */}
              <div className="flex gap-2">
                <div
                  className={`flex-1 text-center text-xs font-semibold py-1.5 rounded border ${
                    recommendation.twenty_pct_rule_compliant
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {recommendation.twenty_pct_rule_compliant ? '✓' : '✗'} 20% Rule
                </div>
                <div
                  className={`flex-1 text-center text-xs font-semibold py-1.5 rounded border ${
                    recommendation.period_rule_compliant
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {recommendation.period_rule_compliant ? '✓' : '✗'} Period Rule
                </div>
              </div>

              {/* Proposed Plan */}
              {recommendation.recommendation === 'APPROVE' && recommendation.proposed_plan && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded">
                    <span className="block text-emerald-600/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                      New EMI
                    </span>
                    <span className="font-mono text-emerald-700 text-lg font-semibold">
                      {recommendation.proposed_plan.new_emi.toLocaleString()}
                    </span>
                    <span className="text-emerald-500 ml-1">AED</span>
                  </div>
                  <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded">
                    <span className="block text-emerald-600/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Add. Premium
                    </span>
                    <span className="font-mono text-emerald-700 text-lg font-semibold">
                      {recommendation.proposed_plan.additional_premium.toLocaleString()}
                    </span>
                    <span className="text-emerald-500 ml-1">AED</span>
                  </div>
                  <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded">
                    <span className="block text-emerald-600/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Add. Months
                    </span>
                    <span className="font-mono text-emerald-700 text-lg font-semibold">
                      {recommendation.proposed_plan.additional_months}
                    </span>
                  </div>
                  <div className="border border-emerald-100 bg-emerald-50/50 p-2.5 rounded">
                    <span className="block text-emerald-600/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Deduction Rate
                    </span>
                    <span className="font-mono text-emerald-700 text-lg font-semibold">
                      {recommendation.proposed_plan.deduction_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Arabic reasoning */}
              {recommendation.reasoning_ar && (
                <div
                  className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 font-[family-name:var(--font-arabic)] leading-relaxed"
                  dir="rtl"
                >
                  {recommendation.reasoning_ar}
                </div>
              )}

              <button
                onClick={() => onToggleExpand(app.application_id)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 mt-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Hide Assessment Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View Assessment Details
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Processing / Details Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 pt-8 border-t border-slate-200">
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
