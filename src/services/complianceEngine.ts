/**
 * complianceEngine.ts — MOEI Housing Arrears Rescheduling Compliance Engine
 *
 * Single source of truth for all governance rules, financial calculations,
 * and the rescheduling decision matrix. Both the deterministic assessment
 * and the agentic LLM flow import from this module.
 *
 * Rules based on the Sheikh Zayed Housing Programme challenge specification.
 */

import {
  ReschedulingApplication,
  IncomeData,
  FamilySituation,
  ProposedPlan,
  Recommendation,
} from '../types';

// ──────────────────────────────────────────────────────────────────────────────
// Governance Constants
// ──────────────────────────────────────────────────────────────────────────────

export const GOVERNANCE = {
  /** Max deduction rate: EMI must be ≤ 20% of beneficiary's salary */
  MAX_DEDUCTION_RATE: 0.20,
  /** Minimum income per family member threshold (AED) */
  MIN_INCOME_PER_MEMBER: 2500,
  /** High obligation ratio — flag for referral */
  HIGH_OBLIGATION_RATIO: 0.60,
  /** Maximum factor EMI can increase by in one reschedule */
  MAX_EMI_INCREASE_FACTOR: 2.5,
  /** Salary certificate validity in days */
  SALARY_CERT_VALIDITY_DAYS: 30,
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// 1. Document Completeness Check
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Validates that all required documents are present, stamped, and valid.
 * Requirements:
 *  - Salary certificate: present, stamped, and valid (within 30 days)
 *  - Bank statement: present
 *  - At least 2 supporting documents total
 */
export function checkDocumentCompleteness(app: ReschedulingApplication): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  const docs = app.arrears.supporting_documents;

  // Check salary certificate
  const salaryCert = docs.find(d => d.type === 'SALARY_CERTIFICATE');
  if (!salaryCert) {
    missing.push('Salary certificate not provided');
  } else {
    if (!salaryCert.is_stamped) {
      missing.push('Salary certificate is not officially stamped');
    }
    if (!salaryCert.is_valid) {
      missing.push(`Salary certificate is expired (must be within ${GOVERNANCE.SALARY_CERT_VALIDITY_DAYS} days)`);
    }
  }

  // Check bank statement
  const bankStatement = docs.find(d => d.type === 'BANK_STATEMENT');
  if (!bankStatement) {
    missing.push('Bank statement not provided');
  }

  // Check minimum supporting documents count (at least 2)
  if (docs.length < 2) {
    missing.push(`Insufficient supporting documents: ${docs.length} provided, minimum 2 required`);
  }

  return {
    complete: missing.length === 0,
    missing,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Prior Active Request Check
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether the beneficiary already has an active rescheduling request.
 * Returns true if a prior active request exists (should reject).
 */
export function checkPriorActiveRequest(app: ReschedulingApplication): boolean {
  return app.has_prior_active_request;
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Income Analysis
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes income relative to family situation and obligations.
 */
export function analyzeIncome(
  income: IncomeData,
  family: FamilySituation,
): {
  avgIncomePerMember: number;
  isLowIncome: boolean;
  obligationRatio: number;
  salaryAssessment: string;
} {
  const avgIncomePerMember = family.total_family_members > 0
    ? income.current_salary / family.total_family_members
    : income.current_salary;

  const isLowIncome = avgIncomePerMember < GOVERNANCE.MIN_INCOME_PER_MEMBER;

  const totalObligations = income.total_obligations ?? 0;
  const obligationRatio = income.current_salary > 0
    ? totalObligations / income.current_salary
    : 0;

  let salaryAssessment: string;
  switch (income.salary_trend) {
    case 'INCREASED':
      salaryAssessment = 'Salary has increased — positive financial trajectory';
      break;
    case 'DECREASED':
      salaryAssessment = 'Salary has decreased — higher risk, conservative approach recommended';
      break;
    case 'STABLE':
    default:
      salaryAssessment = 'Salary is stable — consistent income stream';
      break;
  }

  return {
    avgIncomePerMember: Number(avgIncomePerMember.toFixed(2)),
    isLowIncome,
    obligationRatio: Number(obligationRatio.toFixed(4)),
    salaryAssessment,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Deduction Rate Calculator
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the deduction rate as a percentage, rounded to 2 decimal places.
 * deduction_rate = (newEMI / salary) * 100
 */
export function calculateDeductionRate(newEMI: number, salary: number): number {
  if (salary <= 0) return 999.99;
  return Number(((newEMI / salary) * 100).toFixed(2));
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Propose Update Installment Plan
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Core UPDATE_INSTALLMENT logic:
 *  - Calculate max allowable EMI = salary * MAX_DEDUCTION_RATE
 *  - Try spreading arrears over remaining period first
 *  - If that exceeds 20%, try longer period (up to original loan period)
 *  - If income decreased or avg income per member < 2500, be conservative
 *  - Returns ProposedPlan or null if no viable plan
 */
export function proposeUpdateInstallment(
  app: ReschedulingApplication,
): ProposedPlan | null {
  const { current_salary, salary_trend } = app.income;
  const { current_emi, remaining_period_months, original_period_months } = app.loan;
  const { overdue_amount, overdue_months } = app.arrears;

  const maxAllowableEMI = current_salary * GOVERNANCE.MAX_DEDUCTION_RATE;

  // If current EMI already exceeds max allowable, we can't add anything
  if (current_emi >= maxAllowableEMI) {
    return null;
  }

  const incomeAnalysis = analyzeIncome(app.income, app.family);
  const isConservative = salary_trend === 'DECREASED' || incomeAnalysis.isLowIncome;

  // Conservative factor reduces the max premium we're willing to apply
  const conservativeFactor = isConservative ? 0.5 : 1.0;

  // Maximum additional premium per month (headroom between current EMI and cap)
  const maxPremiumRoom = (maxAllowableEMI - current_emi) * conservativeFactor;

  // Strategy 1: Try spreading arrears over remaining period
  let additionalMonths = remaining_period_months;
  let additionalPremium = overdue_amount / additionalMonths;

  if (additionalPremium <= maxPremiumRoom) {
    // Fits within remaining period
    const newEMI = current_emi + additionalPremium;
    const deductionRate = calculateDeductionRate(newEMI, current_salary);

    // Check EMI increase factor constraint
    if (newEMI > current_emi * GOVERNANCE.MAX_EMI_INCREASE_FACTOR) {
      // EMI increase too large, try longer period
    } else {
      return {
        request_type: 'UPDATE_INSTALLMENT',
        new_emi: Number(newEMI.toFixed(2)),
        additional_premium: Number(additionalPremium.toFixed(2)),
        additional_months: 0, // No extra months, within remaining period
        until_loan_end: true,
        deduction_rate: deductionRate,
        total_repayment: Number((additionalPremium * additionalMonths).toFixed(2)),
      };
    }
  }

  // Strategy 2: Extend the period — try from remaining+12 up to original period
  const maxExtendedPeriod = original_period_months;

  for (let months = remaining_period_months + 12; months <= maxExtendedPeriod; months += 6) {
    additionalPremium = overdue_amount / months;
    const newEMI = current_emi + additionalPremium;
    const deductionRate = calculateDeductionRate(newEMI, current_salary);

    if (deductionRate <= GOVERNANCE.MAX_DEDUCTION_RATE * 100 &&
        newEMI <= current_emi * GOVERNANCE.MAX_EMI_INCREASE_FACTOR) {
      const extraMonths = months - remaining_period_months;
      return {
        request_type: 'UPDATE_INSTALLMENT',
        new_emi: Number(newEMI.toFixed(2)),
        additional_premium: Number(additionalPremium.toFixed(2)),
        additional_months: extraMonths,
        until_loan_end: false,
        deduction_rate: deductionRate,
        total_repayment: Number((additionalPremium * months).toFixed(2)),
      };
    }
  }

  // Strategy 3: Use the absolute maximum period
  additionalPremium = overdue_amount / maxExtendedPeriod;
  const finalEMI = current_emi + additionalPremium;
  const finalDeductionRate = calculateDeductionRate(finalEMI, current_salary);

  if (finalDeductionRate <= GOVERNANCE.MAX_DEDUCTION_RATE * 100 &&
      finalEMI <= current_emi * GOVERNANCE.MAX_EMI_INCREASE_FACTOR) {
    return {
      request_type: 'UPDATE_INSTALLMENT',
      new_emi: Number(finalEMI.toFixed(2)),
      additional_premium: Number(additionalPremium.toFixed(2)),
      additional_months: maxExtendedPeriod - remaining_period_months,
      until_loan_end: false,
      deduction_rate: finalDeductionRate,
      total_repayment: Number((additionalPremium * maxExtendedPeriod).toFixed(2)),
    };
  }

  // No viable plan found
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. Propose Transfer Arrears Plan
// ──────────────────────────────────────────────────────────────────────────────

/**
 * TRANSFER_ARREARS: Move arrears to the end of the loan.
 *  - No EMI increase — keep current EMI
 *  - Additional months = ceil(arrears / currentEMI)
 *  - Check this doesn't exceed original period
 */
export function proposeTransferArrears(
  app: ReschedulingApplication,
): ProposedPlan {
  const { current_emi, remaining_period_months, original_period_months } = app.loan;
  const { overdue_amount } = app.arrears;

  // Additional months needed to cover arrears at current EMI rate
  let additionalMonths = Math.ceil(overdue_amount / current_emi);

  // Cap at original period if it would exceed
  const totalPeriod = remaining_period_months + additionalMonths;
  const exceedsOriginal = totalPeriod > original_period_months;

  if (exceedsOriginal) {
    additionalMonths = Math.max(0, original_period_months - remaining_period_months);
  }

  const deductionRate = calculateDeductionRate(current_emi, app.income.current_salary);

  return {
    request_type: 'TRANSFER_ARREARS',
    new_emi: current_emi, // No change
    additional_premium: 0, // No additional premium
    additional_months: additionalMonths,
    until_loan_end: !exceedsOriginal,
    deduction_rate: deductionRate,
    total_repayment: Number((current_emi * additionalMonths).toFixed(2)),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. Generate Recommendation — Main Orchestrator
// ──────────────────────────────────────────────────────────────────────────────

export interface RecommendationResult {
  recommendation: Recommendation;
  plan: ProposedPlan | null;
  twentyPctCompliant: boolean;
  periodCompliant: boolean;
  reasoning: string;
}

/**
 * The main decision orchestrator. Follows a 10-step flow:
 *
 *  Step 1:  Check prior active request → REJECT if yes
 *  Step 2:  Check document completeness → REQUEST_DOCUMENTS if incomplete
 *  Step 3:  Analyze income and family situation
 *  Step 4:  Based on request_type, call proposeUpdateInstallment or proposeTransferArrears
 *  Step 5:  Validate 20% rule compliance
 *  Step 6:  Validate period rule compliance
 *  Step 7:  If obligations > 60% of income and complex case → REFER_TO_EMPLOYEE
 *  Step 8:  If salary trend DECREASED and arrears > 6 months → REFER_TO_EMPLOYEE
 *  Step 9:  If plan found and all rules pass → APPROVE
 *  Step 10: Otherwise → REFER_TO_EMPLOYEE
 */
export function generateRecommendation(app: ReschedulingApplication): RecommendationResult {
  const reasoningParts: string[] = [];

  // ── Step 1: Prior active request ──────────────────────────────────────
  if (checkPriorActiveRequest(app)) {
    return {
      recommendation: 'REJECT',
      plan: null,
      twentyPctCompliant: false,
      periodCompliant: false,
      reasoning: 'Application rejected: beneficiary has an existing active rescheduling request. Only one active request is permitted at a time per Ministry policy.',
    };
  }
  reasoningParts.push('No prior active request found.');

  // ── Step 2: Document completeness ─────────────────────────────────────
  const docCheck = checkDocumentCompleteness(app);
  if (!docCheck.complete) {
    return {
      recommendation: 'REQUEST_DOCUMENTS',
      plan: null,
      twentyPctCompliant: false,
      periodCompliant: false,
      reasoning: `Application incomplete. Missing documents: ${docCheck.missing.join('; ')}. Beneficiary must provide all required documentation before assessment can proceed.`,
    };
  }
  reasoningParts.push('All required documents verified and stamped.');

  // ── Step 3: Income & family analysis ──────────────────────────────────
  const incomeResult = analyzeIncome(app.income, app.family);
  reasoningParts.push(
    `Income analysis: salary AED ${app.income.current_salary.toLocaleString()}, ` +
    `avg income per member AED ${incomeResult.avgIncomePerMember.toLocaleString()}, ` +
    `obligation ratio ${(incomeResult.obligationRatio * 100).toFixed(1)}%. ` +
    incomeResult.salaryAssessment + '.'
  );

  if (incomeResult.isLowIncome) {
    reasoningParts.push(
      `⚠ Low income flag: AED ${incomeResult.avgIncomePerMember}/member is below the AED ${GOVERNANCE.MIN_INCOME_PER_MEMBER} threshold.`
    );
  }

  // ── Step 4: Generate proposed plan ────────────────────────────────────
  let plan: ProposedPlan | null = null;

  if (app.request_type === 'UPDATE_INSTALLMENT') {
    plan = proposeUpdateInstallment(app);
    if (plan) {
      reasoningParts.push(
        `Update installment plan proposed: new EMI AED ${plan.new_emi.toFixed(2)}, ` +
        `additional premium AED ${plan.additional_premium.toFixed(2)}/mo` +
        (plan.additional_months > 0 ? `, extended by ${plan.additional_months} months` : ', within remaining period') + '.'
      );
    } else {
      reasoningParts.push('No viable update installment plan found within governance constraints.');
    }
  } else {
    // TRANSFER_ARREARS
    plan = proposeTransferArrears(app);
    reasoningParts.push(
      `Transfer arrears plan proposed: arrears of AED ${app.arrears.overdue_amount.toLocaleString()} ` +
      `moved to end of loan, adding ${plan.additional_months} months at current EMI of AED ${plan.new_emi.toFixed(2)}.`
    );
  }

  // ── Step 5: Validate 20% rule compliance ──────────────────────────────
  let twentyPctCompliant = false;
  if (plan) {
    const deductionPct = plan.deduction_rate;
    twentyPctCompliant = deductionPct <= GOVERNANCE.MAX_DEDUCTION_RATE * 100;
    reasoningParts.push(
      `20% deduction rule: ${deductionPct.toFixed(2)}% of salary → ${twentyPctCompliant ? 'COMPLIANT ✓' : 'NON-COMPLIANT ✗'}.`
    );
  }

  // ── Step 6: Validate period rule compliance ───────────────────────────
  let periodCompliant = false;
  if (plan) {
    const totalPeriod = app.loan.remaining_period_months + plan.additional_months;
    periodCompliant = totalPeriod <= app.loan.original_period_months;
    reasoningParts.push(
      `Period rule: total ${totalPeriod} months vs original ${app.loan.original_period_months} months → ${periodCompliant ? 'COMPLIANT ✓' : 'NON-COMPLIANT ✗'}.`
    );
  }

  // ── Step 7: High obligation ratio + complex case → REFER ─────────────
  if (incomeResult.obligationRatio > GOVERNANCE.HIGH_OBLIGATION_RATIO) {
    const isComplex = app.arrears.overdue_months > 12 ||
                      incomeResult.isLowIncome ||
                      app.income.salary_trend === 'DECREASED';
    if (isComplex) {
      reasoningParts.push(
        `Obligation ratio ${(incomeResult.obligationRatio * 100).toFixed(1)}% exceeds ${GOVERNANCE.HIGH_OBLIGATION_RATIO * 100}% threshold with complex circumstances. Referred to employee.`
      );
      return {
        recommendation: 'REFER_TO_EMPLOYEE',
        plan,
        twentyPctCompliant,
        periodCompliant,
        reasoning: reasoningParts.join(' '),
      };
    }
  }

  // ── Step 8: Salary decreased + arrears > 6 months → REFER ────────────
  if (app.income.salary_trend === 'DECREASED' && app.arrears.overdue_months > 6) {
    reasoningParts.push(
      `Salary trend DECREASED with ${app.arrears.overdue_months} months overdue (>6). Risk warrants employee review.`
    );
    return {
      recommendation: 'REFER_TO_EMPLOYEE',
      plan,
      twentyPctCompliant,
      periodCompliant,
      reasoning: reasoningParts.join(' '),
    };
  }

  // ── Step 9: All rules pass + plan found → APPROVE ─────────────────────
  if (plan && twentyPctCompliant && periodCompliant) {
    reasoningParts.push('All governance rules satisfied. Application approved.');
    return {
      recommendation: 'APPROVE',
      plan,
      twentyPctCompliant,
      periodCompliant,
      reasoning: reasoningParts.join(' '),
    };
  }

  // ── Step 10: Otherwise → REFER ────────────────────────────────────────
  reasoningParts.push(
    'Unable to construct a fully compliant plan within automated parameters. Referred to employee for manual assessment.'
  );
  return {
    recommendation: 'REFER_TO_EMPLOYEE',
    plan,
    twentyPctCompliant,
    periodCompliant,
    reasoning: reasoningParts.join(' '),
  };
}
