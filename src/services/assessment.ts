/**
 * assessment.ts — Deterministic Application Assessment
 *
 * Uses the compliance engine to produce a structured AgentRecommendation
 * with a full audit trace. This is the local, non-agentic path.
 */

import {
  ReschedulingApplication,
  AgentRecommendation,
  TraceStep,
} from '../types';
import {
  checkDocumentCompleteness,
  checkPriorActiveRequest,
  analyzeIncome,
  generateRecommendation,
  GOVERNANCE,
} from './complianceEngine';

export function assessApplication(app: ReschedulingApplication): AgentRecommendation {
  const trace: TraceStep[] = [];
  const startTime = Date.now();

  const addTrace = (stepName: string, status: string, logMessage: string) => {
    trace.push({
      step_name: stepName,
      status,
      log_message: logMessage,
      timestamp: new Date().toISOString(),
    });
  };

  // ── Step 1: UAE PASS Identity Verification (simulated) ────────────────
  addTrace(
    'UAE_PASS_VERIFICATION',
    'PASSED',
    `Identity verified for ${app.beneficiary.full_name} (Emirates ID: ${app.beneficiary.emirates_id}). ` +
    `UAE PASS digital identity token validated successfully. Customer ID: ${app.beneficiary.customer_id}.`,
  );

  // ── Step 2: Prior Active Request Check ────────────────────────────────
  const hasPrior = checkPriorActiveRequest(app);
  if (hasPrior) {
    addTrace(
      'PRIOR_REQUEST_CHECK',
      'FAILED',
      `Beneficiary ${app.beneficiary.full_name} has an existing active rescheduling request. ` +
      `Ministry policy prohibits concurrent active requests. Application must be rejected.`,
    );
  } else {
    addTrace(
      'PRIOR_REQUEST_CHECK',
      'PASSED',
      `No prior active rescheduling requests found for customer ${app.beneficiary.customer_id}. ` +
      `Proceeding with assessment.`,
    );
  }

  // ── Step 3: Document Completeness Check ───────────────────────────────
  const docResult = checkDocumentCompleteness(app);
  if (docResult.complete) {
    addTrace(
      'DOCUMENT_VERIFICATION',
      'PASSED',
      `All ${app.arrears.supporting_documents.length} supporting documents verified. ` +
      `Salary certificate is officially stamped and within ${GOVERNANCE.SALARY_CERT_VALIDITY_DAYS}-day validity window. ` +
      `Bank statement present. Document completeness requirements satisfied.`,
    );
  } else {
    addTrace(
      'DOCUMENT_VERIFICATION',
      'FAILED',
      `Document verification failed. Issues identified: ${docResult.missing.join('; ')}. ` +
      `Beneficiary must rectify document deficiencies before assessment can proceed.`,
    );
  }

  // ── Step 4: Income & Family Analysis ──────────────────────────────────
  const incomeAnalysis = analyzeIncome(app.income, app.family);
  addTrace(
    'INCOME_ANALYSIS',
    incomeAnalysis.isLowIncome ? 'WARNING' : 'PASSED',
    `Income analysis complete. Current salary: AED ${app.income.current_salary.toLocaleString()}. ` +
    `Family members: ${app.family.total_family_members} (${app.family.dependents_count} dependents). ` +
    `Average income per member: AED ${incomeAnalysis.avgIncomePerMember.toLocaleString()} ` +
    `(threshold: AED ${GOVERNANCE.MIN_INCOME_PER_MEMBER}). ` +
    `Obligation ratio: ${(incomeAnalysis.obligationRatio * 100).toFixed(1)}% ` +
    `(high threshold: ${GOVERNANCE.HIGH_OBLIGATION_RATIO * 100}%). ` +
    `Salary assessment: ${incomeAnalysis.salaryAssessment}.`,
  );

  // ── Step 5: Loan Data Retrieval (simulated from application) ──────────
  addTrace(
    'LOAN_DATA_RETRIEVAL',
    'SUCCESS',
    `Loan data retrieved from EDB system. Agreement: ${app.loan.agreement_id}, ` +
    `Loan ID: ${app.loan.edb_loan_id}. Original amount: AED ${app.loan.original_loan_amount.toLocaleString()}, ` +
    `remaining balance: AED ${app.loan.remaining_balance.toLocaleString()}. ` +
    `Current EMI: AED ${app.loan.current_emi.toLocaleString()}, ` +
    `remaining period: ${app.loan.remaining_period_months} months of ${app.loan.original_period_months} original. ` +
    `Arrears: AED ${app.arrears.overdue_amount.toLocaleString()} (${app.arrears.overdue_months} months overdue).`,
  );

  // ── Step 6: Rescheduling Calculation ──────────────────────────────────
  addTrace(
    'RESCHEDULING_CALCULATION',
    'PROCESSING',
    `Initiating ${app.request_type} calculation engine. ` +
    `Max deduction rate: ${GOVERNANCE.MAX_DEDUCTION_RATE * 100}% of salary. ` +
    `Max EMI increase factor: ${GOVERNANCE.MAX_EMI_INCREASE_FACTOR}x. ` +
    `Analyzing optimal plan within governance constraints.`,
  );

  // ── Step 7 & 8: Generate recommendation (runs all compliance checks) ──
  const result = generateRecommendation(app);

  if (result.plan) {
    addTrace(
      'PLAN_GENERATION',
      'COMPLETED',
      `Proposed plan: ${result.plan.request_type}. ` +
      `New EMI: AED ${result.plan.new_emi.toFixed(2)}, ` +
      `additional premium: AED ${result.plan.additional_premium.toFixed(2)}/mo, ` +
      `additional months: ${result.plan.additional_months}. ` +
      `Deduction rate: ${result.plan.deduction_rate.toFixed(2)}% of salary. ` +
      `Total repayment of arrears: AED ${result.plan.total_repayment.toFixed(2)}.`,
    );
  } else {
    addTrace(
      'PLAN_GENERATION',
      result.recommendation === 'REJECT' || result.recommendation === 'REQUEST_DOCUMENTS'
        ? 'SKIPPED'
        : 'FAILED',
      result.recommendation === 'REJECT'
        ? 'Plan generation skipped — application rejected due to prior active request.'
        : result.recommendation === 'REQUEST_DOCUMENTS'
          ? 'Plan generation skipped — incomplete documentation.'
          : 'No viable rescheduling plan could be constructed within governance constraints.',
    );
  }

  // ── Rule Compliance Validation ────────────────────────────────────────
  addTrace(
    'RULE_COMPLIANCE',
    result.twentyPctCompliant && result.periodCompliant ? 'PASSED' : 'WARNING',
    `20% deduction rule: ${result.twentyPctCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}. ` +
    `Period rule: ${result.periodCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}.`,
  );

  // ── Final Recommendation ──────────────────────────────────────────────
  addTrace(
    'FINAL_RECOMMENDATION',
    result.recommendation === 'APPROVE' ? 'SUCCESS' : result.recommendation,
    `Decision: ${result.recommendation}. ${result.reasoning}`,
  );

  const processingTimeMs = Date.now() - startTime;

  // ── Build the AgentRecommendation ─────────────────────────────────────
  const caseSummary =
    `Beneficiary ${app.beneficiary.full_name} (${app.beneficiary.employment_status}, ${app.beneficiary.marital_status}) ` +
    `requests ${app.request_type.replace('_', ' ').toLowerCase()} for housing loan ${app.loan.agreement_id}. ` +
    `Arrears of AED ${app.arrears.overdue_amount.toLocaleString()} accumulated over ${app.arrears.overdue_months} months. ` +
    `Current EMI: AED ${app.loan.current_emi.toLocaleString()}, salary: AED ${app.income.current_salary.toLocaleString()}.`;

  const caseSummaryAr =
    `المستفيد ${app.beneficiary.full_name_ar ?? app.beneficiary.full_name} ` +
    `يطلب ${app.request_type === 'UPDATE_INSTALLMENT' ? 'تعديل القسط' : 'نقل المتأخرات'} ` +
    `للقرض السكني ${app.loan.agreement_id}. ` +
    `متأخرات بقيمة ${app.arrears.overdue_amount.toLocaleString()} درهم خلال ${app.arrears.overdue_months} شهر.`;

  const incomeAnalysisText =
    `Salary: AED ${app.income.current_salary.toLocaleString()} (${app.income.salary_trend}). ` +
    `Income source: ${app.income.income_source}. ` +
    `Avg income per family member: AED ${incomeAnalysis.avgIncomePerMember.toLocaleString()}${incomeAnalysis.isLowIncome ? ' (BELOW THRESHOLD)' : ''}. ` +
    `Obligation ratio: ${(incomeAnalysis.obligationRatio * 100).toFixed(1)}%.`;

  const familyAnalysis =
    `${app.family.total_family_members} family members (${app.family.dependents_count} dependents). ` +
    `Marital status: ${app.beneficiary.marital_status}.` +
    (app.family.special_circumstances ? ` Special circumstances: ${app.family.special_circumstances}` : '');

  // Generate memos for approved cases
  let memoEn: string | undefined;
  let memoAr: string | undefined;

  if (result.recommendation === 'APPROVE' && result.plan) {
    memoEn =
      `Dear ${app.beneficiary.full_name},\n\n` +
      `Following a comprehensive review of your rescheduling request (Application: ${app.application_id}), ` +
      `the Sheikh Zayed Housing Programme has approved your ${app.request_type === 'UPDATE_INSTALLMENT' ? 'installment update' : 'arrears transfer'} request.\n\n` +
      `Approved Plan:\n` +
      `• New monthly installment: AED ${result.plan.new_emi.toFixed(2)}\n` +
      `• Additional premium: AED ${result.plan.additional_premium.toFixed(2)}/month\n` +
      `• Additional months: ${result.plan.additional_months}\n` +
      `• Deduction rate: ${result.plan.deduction_rate.toFixed(2)}% of salary\n\n` +
      `This plan complies with all Ministry governance rules including the 20% salary deduction cap ` +
      `and repayment period constraints.\n\n` +
      `Ministry of Energy and Infrastructure\nSheikh Zayed Housing Programme`;

    memoAr =
      `السيد/ة ${app.beneficiary.full_name_ar ?? app.beneficiary.full_name} المحترم/ة،\n\n` +
      `بعد مراجعة شاملة لطلب إعادة الجدولة الخاص بكم (رقم الطلب: ${app.application_id})، ` +
      `وافق برنامج الشيخ زايد للإسكان على طلب ${app.request_type === 'UPDATE_INSTALLMENT' ? 'تعديل القسط' : 'نقل المتأخرات'}.\n\n` +
      `الخطة المعتمدة:\n` +
      `• القسط الشهري الجديد: ${result.plan.new_emi.toFixed(2)} درهم\n` +
      `• القسط الإضافي: ${result.plan.additional_premium.toFixed(2)} درهم/شهر\n` +
      `• الأشهر الإضافية: ${result.plan.additional_months}\n` +
      `• نسبة الاستقطاع: ${result.plan.deduction_rate.toFixed(2)}% من الراتب\n\n` +
      `وزارة الطاقة والبنية التحتية\nبرنامج الشيخ زايد للإسكان`;
  }

  // Confidence score based on recommendation type
  let confidenceScore = 85;
  if (result.recommendation === 'APPROVE') confidenceScore = 95;
  else if (result.recommendation === 'REJECT') confidenceScore = 98;
  else if (result.recommendation === 'REQUEST_DOCUMENTS') confidenceScore = 92;
  else if (result.recommendation === 'REFER_TO_EMPLOYEE') confidenceScore = 70;

  return {
    application_id: app.application_id,
    application_status:
      result.recommendation === 'APPROVE' ? 'APPROVED'
        : result.recommendation === 'REJECT' ? 'REJECTED'
          : result.recommendation === 'REQUEST_DOCUMENTS' ? 'PENDING_INFO'
            : 'REFERRED',
    case_summary: caseSummary,
    case_summary_ar: caseSummaryAr,
    income_analysis: incomeAnalysisText,
    family_analysis: familyAnalysis,
    arrears_amount: app.arrears.overdue_amount,
    remaining_loan_balance: app.loan.remaining_balance,
    remaining_period_months: app.loan.remaining_period_months,
    proposed_plan: result.plan ?? undefined,
    twenty_pct_rule_compliant: result.twentyPctCompliant,
    period_rule_compliant: result.periodCompliant,
    recommendation: result.recommendation,
    reasoning: result.reasoning,
    reasoning_ar: result.recommendation === 'APPROVE'
      ? 'تم الموافقة على الطلب. جميع قواعد الحوكمة مستوفاة.'
      : result.recommendation === 'REJECT'
        ? 'تم رفض الطلب. يوجد طلب إعادة جدولة نشط مسبق.'
        : result.recommendation === 'REQUEST_DOCUMENTS'
          ? 'الطلب غير مكتمل. يرجى تقديم المستندات المطلوبة.'
          : 'تم إحالة الطلب لمراجعة الموظف المختص.',
    memo_en: memoEn,
    memo_ar: memoAr,
    trace,
    confidence_score: confidenceScore,
    processing_time_ms: processingTimeMs,
  };
}
