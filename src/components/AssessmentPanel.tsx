import { Sparkles, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AgentRecommendation } from '../types';

function statusColors(status: string) {
  switch (status) {
    case 'PASSED':
    case 'SUCCESS':
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'PROCESSING':
      return 'bg-blue-500/10 text-blue-400';
    case 'WARNING':
    case 'SKIPPED':
      return 'bg-amber-500/10 text-amber-400';
    case 'FAILED':
      return 'bg-red-500/10 text-red-400';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
}

function statusBorderStyle(status: string) {
  switch (status) {
    case 'PASSED':
    case 'SUCCESS':
    case 'COMPLETED':
      return 'border-emerald-500';
    case 'PROCESSING':
      return 'border-blue-500';
    case 'WARNING':
    case 'SKIPPED':
      return 'border-amber-500';
    case 'FAILED':
      return 'border-red-500';
    default:
      return 'border-slate-500';
  }
}

interface AssessmentPanelProps {
  recommendation: AgentRecommendation;
}

export default function AssessmentPanel({ recommendation }: AssessmentPanelProps) {
  const r = recommendation;

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assessment Details Table */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Assessment Output
          </h4>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-44">Application Status</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{r.application_status}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Case Summary</td>
                  <td className="py-2.5 px-4 text-slate-700 text-xs leading-relaxed">{r.case_summary}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Income Analysis</td>
                  <td className="py-2.5 px-4 text-slate-700 text-xs leading-relaxed">{r.income_analysis}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Arrears Amount</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{r.arrears_amount.toLocaleString()} AED</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Balance</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{r.remaining_loan_balance.toLocaleString()} AED</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Period</td>
                  <td className="py-2.5 px-4 font-mono text-slate-900">{r.remaining_period_months} months</td>
                </tr>
                {r.proposed_plan && (
                  <>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deduction Rate</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{r.proposed_plan.deduction_rate.toFixed(1)}%</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proposed Plan</td>
                      <td className="py-2.5 px-4 text-xs text-slate-700">
                        New EMI: {r.proposed_plan.new_emi.toLocaleString()} AED · 
                        Premium: {r.proposed_plan.additional_premium.toLocaleString()} AED · 
                        {r.proposed_plan.additional_months} add. months
                      </td>
                    </tr>
                  </>
                )}
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">20% Rule</td>
                  <td className="py-2.5 px-4">
                    {r.twenty_pct_rule_compliant ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Non-Compliant
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Period Rule</td>
                  <td className="py-2.5 px-4">
                    {r.period_rule_compliant ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Non-Compliant
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recommendation</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{r.recommendation.replace(/_/g, ' ')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Confidence & Processing Time */}
          {(r.confidence_score !== undefined || r.processing_time_ms !== undefined) && (
            <div className="flex gap-3 text-xs">
              {r.confidence_score !== undefined && (
                <div className="bg-indigo-50 border border-indigo-200 rounded px-3 py-1.5 font-mono text-indigo-700">
                  Confidence: {r.confidence_score}%
                </div>
              )}
              {r.processing_time_ms !== undefined && (
                <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 font-mono text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {(r.processing_time_ms / 1000).toFixed(2)}s
                </div>
              )}
            </div>
          )}

          {/* Bilingual Memos */}
          <div className="space-y-3 mt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-indigo-500" /> AI Generated Memos
            </h4>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-sm">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                English Memo
              </span>
              <p className="text-slate-700 leading-relaxed min-h-16">
                {r.memo_en || r.reasoning || 'System processed.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-sm" dir="rtl">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2" dir="ltr">
                Arabic Memo
              </span>
              <p className="text-slate-800 font-medium leading-relaxed min-h-16 text-base font-[family-name:var(--font-arabic)]">
                {r.memo_ar || r.reasoning_ar || 'تم المعالجة آلياً.'}
              </p>
            </div>
          </div>
        </div>

        {/* Execution Trace Segment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-inner relative flex flex-col h-full max-h-[500px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 sticky top-0 bg-slate-900 pb-2 border-b border-slate-800">
            System Execution Trace Log
          </h4>

          <div className="overflow-y-auto pr-2 space-y-1 font-mono text-[11px] text-slate-300 flex-1 trace-scroll">
            {r.trace.map((step, i) => (
              <div key={i} className="flex gap-3 py-1.5 hover:bg-slate-800/80 rounded px-2">
                <div className="shrink-0 pt-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 w-24 inline-block text-center border-l-2 ${statusBorderStyle(step.status)} ${statusColors(step.status)}`}
                  >
                    {step.status}
                  </span>
                </div>
                <div>
                  <div className="text-slate-100 font-bold tracking-tight mb-0.5 opacity-90">
                    {step.step_name}
                  </div>
                  <div className="text-slate-400 leading-relaxed">{step.log_message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
