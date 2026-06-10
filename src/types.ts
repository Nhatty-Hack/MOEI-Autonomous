/**
 * types.ts — MOEI Housing Arrears Rescheduling Agent
 * Data model aligned to the official challenge specification
 * and real historical data from RescheduleArrears.xlsx
 */

// ─── Enums & Literal Types ────────────────────────────────────────────────────

/** Request type matching the real Excel data */
export type RequestType = 'UPDATE_INSTALLMENT' | 'TRANSFER_ARREARS';

/** Employment status of the beneficiary */
export type EmploymentStatus =
  | 'EMPLOYED'
  | 'RETIRED'
  | 'MEDICAL_RETIREMENT'
  | 'UNEMPLOYED'
  | 'SELF_EMPLOYED';

/** Salary trend over recent months */
export type SalaryTrend = 'INCREASED' | 'DECREASED' | 'STABLE';

/** Marital status */
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

/** Agent recommendation decision — matching the expected output table */
export type Recommendation =
  | 'APPROVE'
  | 'REQUEST_DOCUMENTS'
  | 'REFER_TO_EMPLOYEE'
  | 'REJECT';

/** Application status visible to the beneficiary */
export type ApplicationStatus =
  | 'PROCESSING'
  | 'COMPLETE'
  | 'INCOMPLETE'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFERRED'
  | 'PENDING_INFO';

/** Trace log status */
export type TraceStatus =
  | 'PASSED'
  | 'FAILED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'SUCCESS'
  | 'WARNING'
  | 'SKIPPED';

// ─── Beneficiary & Application Interfaces ─────────────────────────────────────

export interface BeneficiaryProfile {
  full_name: string;
  full_name_ar?: string;
  emirates_id: string;                  // e.g., "784-1990-1234567-8"
  customer_id: string;                  // EDB_CUSTOMER_ID from real data
  marital_status: MaritalStatus;
  employment_status: EmploymentStatus;
  location_emirate: string;
  is_person_of_determination: boolean;
}

export interface FamilySituation {
  dependents_count: number;             // Children + elderly dependents
  total_family_members: number;         // Including beneficiary
  avg_income_per_member?: number;       // Calculated: salary / total_family_members
  special_circumstances?: string;       // Medical, hardship, etc.
}

export interface IncomeData {
  current_salary: number;               // CURRENT_SALARY from real data
  salary_trend: SalaryTrend;            // Whether salary has changed recently
  income_source: string;                // e.g., "Government", "Private Sector", "Pension"
  total_obligations?: number;           // Other financial commitments (bank loans, etc.)
  obligations_to_income_ratio?: number; // Calculated
}

export interface LoanData {
  agreement_id: string;                 // AGREEMENT_ID from real data
  edb_loan_id: string;                  // EDB_LOAN_ID from real data
  original_loan_amount: number;         // Original housing loan amount
  remaining_balance: number;            // Outstanding principal
  original_period_months: number;       // Original approved repayment period
  remaining_period_months: number;      // Months left on the loan
  current_emi: number;                  // CURRENT_EMI_AMT — current monthly installment
  payment_history_summary: string;      // e.g., "Regular until 6 months ago"
}

export interface ArrearsData {
  overdue_amount: number;               // OVER_DUE_AMT from real data
  overdue_months: number;               // OVER_DUE_MONTHS from real data
  reason_for_delay: string;             // JUSTIFICATIONS from real data (often Arabic)
  supporting_documents: SupportingDocument[];
}

export interface SupportingDocument {
  name: string;
  type: 'SALARY_CERTIFICATE' | 'BANK_STATEMENT' | 'MEDICAL_REPORT' | 'PENSION_CERTIFICATE' | 'EMPLOYER_LETTER' | 'OTHER';
  is_stamped: boolean;                  // Has official stamp / letterhead
  is_valid: boolean;                    // Within validity period (e.g., 30 days)
  validation_notes?: string;
}

/** The main application model — what the AI agent processes */
export interface ReschedulingApplication {
  application_id: string;               // APPLICATION_ID from real data
  request_type: RequestType;            // UPDATE_INSTALLMENT or TRANSFER_ARREARS
  deduct_from_salary: boolean;          // DEDUCT_FROM_SALARY
  created_date: string;                 // ISO date string
  has_prior_active_request: boolean;    // Check for duplicate active requests

  beneficiary: BeneficiaryProfile;
  family: FamilySituation;
  income: IncomeData;
  loan: LoanData;
  arrears: ArrearsData;
}

// ─── Agent Output Interfaces ──────────────────────────────────────────────────

export interface TraceStep {
  step_name: string;
  status: TraceStatus | string;
  log_message: string;
  timestamp?: string;
}

/** Proposed rescheduling plan */
export interface ProposedPlan {
  request_type: RequestType;
  new_emi: number;                      // NEW_EMI_AMT — proposed new monthly installment
  additional_premium: number;           // ADDITIONAL_PREMIUM — how much more per month
  additional_months: number;            // ADDITIONAL_MONTHS — extra months needed
  until_loan_end: boolean;              // UNTIL_LOAN_END — spread until end of loan?
  deduction_rate: number;               // new_emi / current_salary * 100
  total_repayment: number;              // What they'll pay in total over the additional period
}

/** The structured recommendation matching the challenge's expected output */
export interface AgentRecommendation {
  application_id: string;

  // Application completeness
  application_status: ApplicationStatus;

  // Case analysis
  case_summary: string;
  case_summary_ar?: string;
  income_analysis: string;
  family_analysis?: string;

  // Financial data
  arrears_amount: number;
  remaining_loan_balance: number;
  remaining_period_months: number;

  // Proposed plan
  proposed_plan?: ProposedPlan;

  // Rule compliance
  twenty_pct_rule_compliant: boolean;   // Deduction ≤ 20% of salary
  period_rule_compliant: boolean;       // Does not exceed original loan period

  // Decision
  recommendation: Recommendation;
  reasoning: string;
  reasoning_ar?: string;

  // Memo (for approved cases)
  memo_en?: string;
  memo_ar?: string;

  // Audit trail
  trace: TraceStep[];
  confidence_score?: number;            // 0-100, for governance
  processing_time_ms?: number;

  // Historical context (enriched from Excel data)
  historical_insight?: string;
  historical_precedent?: {
    similar_count: number;
    approved_count: number;
    referred_count: number;
    rejected_count: number;
    avg_additional_months: number;
    salary_range_label: string;
    arrears_ratio_label: string;
  };
}

/** API response wrapper */
export interface AssessmentResponse {
  status: 'success' | 'error';
  data: AgentRecommendation;
}

// ─── Historical Data Types (from Excel) ───────────────────────────────────────

/** Raw record from the Excel file */
export interface HistoricalRecord {
  ID?: string;
  APPLICANT?: string;
  APPLICATION_ID: string;
  AGREEMENT_ID: string;
  EDB_LOAN_ID: string;
  EDB_CUSTOMER_ID: number;
  CURRENT_SALARY: number;
  OVER_DUE_AMT: number;
  OVER_DUE_MONTHS: number;
  DEDUCT_FROM_SALARY: string;
  REQUEST_TYPE?: string;
  APPROVED_REQUEST_TYPE: string;
  NEW_EMI_APPLICABLE_MONTHS?: number;
  CURRENT_EMI_AMT: number;
  NEW_EMI_AMT?: number;
  CREATED_DATE: number;                 // Excel serial date
  STATUS: string;
  APPROVED_DATE?: number;
  JUSTIFICATIONS?: string;
  REMARKS?: string;
  UNTIL_LOAN_END?: string;
  ADDITIONAL_MONTHS?: number;
  ADDITIONAL_PREMIUM?: number;
  AUTH_SIGNATORY?: string;
  CREATED_BY?: string;
  START_MONTH?: number;
  START_YEAR?: number;
  year: string;                         // Sheet name (2023, 2024, 2025)
}

/** Aggregated stats for the dashboard */
export interface HistoricalStats {
  total_records: number;
  by_year: Record<string, number>;
  by_request_type: Record<string, number>;
  by_status: Record<string, number>;
  salary_stats: { min: number; max: number; avg: number; median: number };
  arrears_stats: { min: number; max: number; avg: number; median: number };
  avg_deduction_rate: number;
  avg_additional_months: number;
}

// ─── Governance Rules Type ────────────────────────────────────────────────────

export interface GovernanceRules {
  MAX_DEDUCTION_RATE: number;
  MIN_INCOME_PER_MEMBER: number;
  HIGH_OBLIGATION_RATIO: number;
  MAX_EMI_INCREASE_FACTOR: number;
  SALARY_CERT_VALIDITY_DAYS: number;
}
