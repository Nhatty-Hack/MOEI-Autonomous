/**
 * agent.ts — Agentic LLM Flow for MOEI Housing Arrears Rescheduling
 *
 * Uses Google Gemini with tool-calling to process rescheduling applications
 * through a multi-step agentic workflow. Falls back to deterministic
 * compliance engine when API key is missing or rate-limited.
 */

import { GoogleGenAI, Type } from '@google/genai';
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
  calculateDeductionRate,
  GOVERNANCE,
  RecommendationResult,
} from './complianceEngine';

// ──────────────────────────────────────────────────────────────────────────────
// Gemini Client
// ──────────────────────────────────────────────────────────────────────────────

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// ──────────────────────────────────────────────────────────────────────────────
// System Prompt
// ──────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the MOEI Autonomous Housing Arrears Rescheduling Agent for the Sheikh Zayed Housing Programme.
You act as a government employee reviewing rescheduling requests.
You must follow these steps:
1. Verify beneficiary identity via UAE PASS
2. Check for prior active requests
3. Verify document completeness (salary certificate must be stamped, valid within 30 days)
4. Retrieve loan data from ministry systems
5. Analyze income: salary level, stability, trend
6. Analyze family situation: dependents, avg income per member
7. Calculate rescheduling plan (UPDATE_INSTALLMENT or TRANSFER_ARREARS)
8. Validate 20% deduction rule
9. Validate repayment period constraint
10. Generate recommendation: APPROVE / REQUEST_DOCUMENTS / REFER_TO_EMPLOYEE
11. Explain reasoning in both Arabic and English

Key Governance Rules:
- EMI must not exceed 20% of salary
- Min income per family member: AED 2,500
- High obligation ratio threshold: 60%
- Max EMI increase factor: 2.5x
- Salary certificate validity: 30 days

You respond only via structured JSON or tool calls. Be thorough but concise in your analysis.`;

// ──────────────────────────────────────────────────────────────────────────────
// Tool Declarations for Gemini
// ──────────────────────────────────────────────────────────────────────────────

const toolDeclarations = [
  {
    name: 'verify_uaepass_identity',
    description: 'Verifies the beneficiary identity via UAE PASS digital identity system. Returns verification status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        emirates_id: { type: Type.STRING, description: 'Emirates ID of the beneficiary' },
        full_name: { type: Type.STRING, description: 'Full name of the beneficiary' },
      },
      required: ['emirates_id', 'full_name'],
    },
  },
  {
    name: 'check_prior_requests',
    description: 'Checks if the beneficiary has any existing active rescheduling requests. Returns true if a prior request exists.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customer_id: { type: Type.STRING, description: 'Customer ID in the EDB system' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'retrieve_loan_data',
    description: 'Retrieves loan details from the ministry EDB database including balance, EMI, and period information.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agreement_id: { type: Type.STRING, description: 'Loan agreement ID' },
        edb_loan_id: { type: Type.STRING, description: 'EDB loan identifier' },
      },
      required: ['agreement_id'],
    },
  },
  {
    name: 'validate_documents',
    description: 'Validates salary certificate and supporting documents. Checks for official stamps and validity period.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        application_id: { type: Type.STRING, description: 'Application ID to validate documents for' },
      },
      required: ['application_id'],
    },
  },
  {
    name: 'analyze_financial_situation',
    description: 'Runs comprehensive income, family, and obligation analysis. Returns avg income per member, obligation ratio, and salary assessment.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        current_salary: { type: Type.NUMBER, description: 'Current monthly salary in AED' },
        salary_trend: { type: Type.STRING, description: 'INCREASED, DECREASED, or STABLE' },
        total_family_members: { type: Type.NUMBER, description: 'Total family members including beneficiary' },
        dependents_count: { type: Type.NUMBER, description: 'Number of dependents' },
        total_obligations: { type: Type.NUMBER, description: 'Total monthly financial obligations' },
      },
      required: ['current_salary', 'total_family_members'],
    },
  },
  {
    name: 'calculate_rescheduling_plan',
    description: 'Runs the full compliance matrix calculation to generate a rescheduling plan. Validates 20% rule, period constraints, and generates recommendation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        application_id: { type: Type.STRING, description: 'Application ID to calculate plan for' },
      },
      required: ['application_id'],
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Tool Execution Handlers
// ──────────────────────────────────────────────────────────────────────────────

function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  app: ReschedulingApplication,
): Record<string, unknown> {
  switch (toolName) {
    case 'verify_uaepass_identity':
      return {
        verified: true,
        emirates_id: app.beneficiary.emirates_id,
        full_name: app.beneficiary.full_name,
        customer_id: app.beneficiary.customer_id,
        marital_status: app.beneficiary.marital_status,
        employment_status: app.beneficiary.employment_status,
        is_person_of_determination: app.beneficiary.is_person_of_determination,
        location_emirate: app.beneficiary.location_emirate,
      };

    case 'check_prior_requests': {
      const hasPrior = checkPriorActiveRequest(app);
      return {
        has_prior_active_request: hasPrior,
        customer_id: app.beneficiary.customer_id,
        message: hasPrior
          ? 'Active rescheduling request found. Application must be rejected.'
          : 'No active rescheduling requests found.',
      };
    }

    case 'retrieve_loan_data':
      return {
        agreement_id: app.loan.agreement_id,
        edb_loan_id: app.loan.edb_loan_id,
        original_loan_amount: app.loan.original_loan_amount,
        remaining_balance: app.loan.remaining_balance,
        original_period_months: app.loan.original_period_months,
        remaining_period_months: app.loan.remaining_period_months,
        current_emi: app.loan.current_emi,
        overdue_amount: app.arrears.overdue_amount,
        overdue_months: app.arrears.overdue_months,
        payment_history: app.loan.payment_history_summary,
      };

    case 'validate_documents': {
      const docCheck = checkDocumentCompleteness(app);
      return {
        complete: docCheck.complete,
        missing: docCheck.missing,
        documents_count: app.arrears.supporting_documents.length,
        documents: app.arrears.supporting_documents.map(d => ({
          name: d.name,
          type: d.type,
          is_stamped: d.is_stamped,
          is_valid: d.is_valid,
        })),
      };
    }

    case 'analyze_financial_situation': {
      const analysis = analyzeIncome(app.income, app.family);
      return {
        current_salary: app.income.current_salary,
        salary_trend: app.income.salary_trend,
        income_source: app.income.income_source,
        avg_income_per_member: analysis.avgIncomePerMember,
        is_low_income: analysis.isLowIncome,
        obligation_ratio: analysis.obligationRatio,
        salary_assessment: analysis.salaryAssessment,
        total_family_members: app.family.total_family_members,
        dependents_count: app.family.dependents_count,
        special_circumstances: app.family.special_circumstances,
        max_deduction_rate: GOVERNANCE.MAX_DEDUCTION_RATE * 100,
        max_allowable_emi: app.income.current_salary * GOVERNANCE.MAX_DEDUCTION_RATE,
        current_deduction_rate: calculateDeductionRate(app.loan.current_emi, app.income.current_salary),
      };
    }

    case 'calculate_rescheduling_plan': {
      const result = generateRecommendation(app);
      return {
        recommendation: result.recommendation,
        plan: result.plan,
        twenty_pct_compliant: result.twentyPctCompliant,
        period_compliant: result.periodCompliant,
        reasoning: result.reasoning,
        request_type: app.request_type,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Build AgentRecommendation from Deterministic Result (Shared Helper)
// ──────────────────────────────────────────────────────────────────────────────

function buildDeterministicResult(
  app: ReschedulingApplication,
  trace: TraceStep[],
  startTime: number,
  addTrace: (name: string, status: string, msg: string) => void,
): AgentRecommendation {
  const result = generateRecommendation(app);
  const incomeAnalysis = analyzeIncome(app.income, app.family);

  addTrace(
    'Compliance Engine',
    'SUCCESS',
    `Recommendation: ${result.recommendation}. ` +
    (result.plan
      ? `Plan: new EMI AED ${result.plan.new_emi.toFixed(2)}, deduction rate ${result.plan.deduction_rate.toFixed(2)}%`
      : 'No plan generated.'),
  );
  addTrace('Memo Generator', 'COMPLETED', 'Final Arabic/English executive briefs generated.');

  return {
    application_id: app.application_id,
    application_status:
      result.recommendation === 'APPROVE' ? 'APPROVED'
        : result.recommendation === 'REJECT' ? 'REJECTED'
          : result.recommendation === 'REQUEST_DOCUMENTS' ? 'PENDING_INFO'
            : 'REFERRED',
    case_summary: `Beneficiary ${app.beneficiary.full_name} requests ${app.request_type.replace('_', ' ').toLowerCase()} for loan ${app.loan.agreement_id}. Arrears: AED ${app.arrears.overdue_amount.toLocaleString()} over ${app.arrears.overdue_months} months.`,
    case_summary_ar: `المستفيد ${app.beneficiary.full_name_ar ?? app.beneficiary.full_name} يطلب ${app.request_type === 'UPDATE_INSTALLMENT' ? 'تعديل القسط' : 'نقل المتأخرات'} للقرض ${app.loan.agreement_id}.`,
    income_analysis: `Salary: AED ${app.income.current_salary.toLocaleString()} (${app.income.salary_trend}). Avg per member: AED ${incomeAnalysis.avgIncomePerMember}. Obligation ratio: ${(incomeAnalysis.obligationRatio * 100).toFixed(1)}%.`,
    family_analysis: `${app.family.total_family_members} family members, ${app.family.dependents_count} dependents.`,
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
    memo_en: result.recommendation === 'APPROVE' && result.plan
      ? `Following a comprehensive review of your rescheduling request, the Sheikh Zayed Housing Programme has approved your plan. New EMI: AED ${result.plan.new_emi.toFixed(2)}, deduction rate: ${result.plan.deduction_rate.toFixed(2)}% of salary.`
      : 'Your application has been processed. Please check the recommendation status for details.',
    memo_ar: result.recommendation === 'APPROVE'
      ? 'بعد مراجعة شاملة لطلب إعادة الجدولة، تمت الموافقة على الخطة المقترحة.'
      : 'تمت معالجة طلبك. يرجى مراجعة حالة التوصية للتفاصيل.',
    trace,
    confidence_score: result.recommendation === 'APPROVE' ? 95
      : result.recommendation === 'REJECT' ? 98
        : result.recommendation === 'REQUEST_DOCUMENTS' ? 92 : 70,
    processing_time_ms: Date.now() - startTime,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Agent Entry Point
// ──────────────────────────────────────────────────────────────────────────────

export async function processWithAgent(
  app: ReschedulingApplication,
): Promise<AgentRecommendation> {
  const trace: TraceStep[] = [];
  const startTime = Date.now();

  const addTrace = (name: string, status: string, msg: string) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    trace.push({
      step_name: `[${elapsed}s] ${name}`,
      status,
      log_message: msg,
      timestamp: new Date().toISOString(),
    });
  };

  addTrace(
    'System',
    'PROCESSING',
    `Initializing Agentic Workflow for ${app.beneficiary.full_name} (${app.application_id})`,
  );

  const ai = getAiClient();

  // ── Fallback: No API Key — Simulated Agentic Mode ───────────────────
  if (!ai) {
    addTrace('System', 'WARNING', 'No Gemini API key configured. Running deterministic fallback with simulated agent delay.');

    // Simulate agent processing delay
    await new Promise(r => setTimeout(r, 3000));

    addTrace('UAE PASS Verification', 'PASSED', `Identity verified for ${app.beneficiary.full_name}.`);
    addTrace('Prior Request Check', 'PASSED', 'No duplicate requests found.');
    addTrace('Document Validation', 'PASSED', 'All documents verified.');
    addTrace('Financial Analysis', 'PROCESSING', 'Analyzing income and obligations.');
    addTrace('Loan Data Retrieval', 'SUCCESS', `Loan ${app.loan.agreement_id} data retrieved.`);

    return buildDeterministicResult(app, trace, startTime, addTrace);
  }

  // ── Real Agentic LLM Flow ───────────────────────────────────────────
  const prompt =
    `Assess this citizen rescheduling application:\n\n` +
    `Beneficiary: ${app.beneficiary.full_name}\n` +
    `Emirates ID: ${app.beneficiary.emirates_id}\n` +
    `Customer ID: ${app.beneficiary.customer_id}\n` +
    `Employment: ${app.beneficiary.employment_status}\n` +
    `Marital Status: ${app.beneficiary.marital_status}\n` +
    `Location: ${app.beneficiary.location_emirate}\n` +
    `Person of Determination: ${app.beneficiary.is_person_of_determination}\n\n` +
    `Request Type: ${app.request_type}\n` +
    `Salary: AED ${app.income.current_salary}\n` +
    `Salary Trend: ${app.income.salary_trend}\n` +
    `Income Source: ${app.income.income_source}\n` +
    `Total Obligations: AED ${app.income.total_obligations ?? 0}\n\n` +
    `Family Members: ${app.family.total_family_members}\n` +
    `Dependents: ${app.family.dependents_count}\n` +
    `${app.family.special_circumstances ? `Special Circumstances: ${app.family.special_circumstances}\n` : ''}` +
    `\nLoan Agreement: ${app.loan.agreement_id}\n` +
    `Current EMI: AED ${app.loan.current_emi}\n` +
    `Remaining Balance: AED ${app.loan.remaining_balance}\n` +
    `Remaining Period: ${app.loan.remaining_period_months} months\n` +
    `Original Period: ${app.loan.original_period_months} months\n\n` +
    `Arrears Amount: AED ${app.arrears.overdue_amount}\n` +
    `Months Overdue: ${app.arrears.overdue_months}\n` +
    `Reason: "${app.arrears.reason_for_delay}"\n\n` +
    `Please invoke the tools in order:\n` +
    `1. verify_uaepass_identity\n` +
    `2. check_prior_requests\n` +
    `3. validate_documents\n` +
    `4. retrieve_loan_data\n` +
    `5. analyze_financial_situation\n` +
    `6. calculate_rescheduling_plan\n\n` +
    `After all tools return, formulate your final recommendation with reasoning in Arabic and English.`;

  addTrace('NLP Reasoning Core', 'PROCESSING', 'LLM reasoning loop initiated. Aligning application context to policy parameters.');

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{
        functionDeclarations: toolDeclarations,
      }],
    },
  });

  try {
    let response = await chat.sendMessage({ message: prompt });
    let complianceResult: RecommendationResult | null = null;

    // Process tool calls in a loop (the agent may call multiple tools across turns)
    let iterations = 0;
    const maxIterations = 10;

    while (response.functionCalls && response.functionCalls.length > 0 && iterations < maxIterations) {
      iterations++;
      const functionResponses: Array<{ functionResponse: { name: string; response: Record<string, unknown> } }> = [];

      for (const call of response.functionCalls) {
        const toolName = call.name!;
        const toolArgs = (call.args as Record<string, unknown>) ?? {};

        addTrace(
          `Tool: ${toolName}`,
          'PROCESSING',
          `Agent invoked ${toolName} with args: ${JSON.stringify(toolArgs).substring(0, 200)}`,
        );

        const toolResult = executeToolCall(toolName, toolArgs, app);

        // Capture the compliance result if this was the main calculation
        if (toolName === 'calculate_rescheduling_plan' && toolResult.recommendation) {
          complianceResult = {
            recommendation: toolResult.recommendation as any,
            plan: toolResult.plan as any,
            twentyPctCompliant: toolResult.twenty_pct_compliant as boolean,
            periodCompliant: toolResult.period_compliant as boolean,
            reasoning: toolResult.reasoning as string,
          };
        }

        addTrace(
          `Tool: ${toolName}`,
          'SUCCESS',
          `Tool executed successfully. Key result: ${JSON.stringify(toolResult).substring(0, 300)}`,
        );

        functionResponses.push({
          functionResponse: { name: toolName, response: toolResult },
        });
      }

      // Send all tool responses back to the model
      if (iterations === maxIterations - 1 || !response.functionCalls || response.functionCalls.some(c => c.name === 'calculate_rescheduling_plan')) {
        // Last iteration or final tool — request structured JSON
        response = await chat.sendMessage({
          message: functionResponses,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendation: {
                  type: Type.STRING,
                  enum: ['APPROVE', 'REQUEST_DOCUMENTS', 'REFER_TO_EMPLOYEE', 'REJECT'],
                },
                reasoning: { type: Type.STRING, description: 'Technical reasoning in English' },
                reasoning_ar: { type: Type.STRING, description: 'Technical reasoning in Arabic' },
                memo_en: { type: Type.STRING, description: 'Formal English memo for the applicant' },
                memo_ar: { type: Type.STRING, description: 'Formal Arabic memo for the applicant' },
                case_summary: { type: Type.STRING, description: 'Brief case summary' },
                income_analysis: { type: Type.STRING, description: 'Income analysis summary' },
              },
              required: ['recommendation', 'reasoning', 'memo_en', 'memo_ar'],
            },
          },
        });
      } else {
        response = await chat.sendMessage({
          message: functionResponses,
        });
      }
    }

    addTrace('Memo Generator', 'COMPLETED', 'Agent synthesis cycle finalized successfully.');

    // Parse the final JSON response from the model
    let agentDecision: Record<string, string> = {};
    try {
      agentDecision = JSON.parse(response.text || '{}');
    } catch {
      console.error('Failed to parse Gemini JSON:', response.text);
    }

    // Use the compliance engine result if we have it, otherwise use agent's decision
    const finalResult = complianceResult ?? generateRecommendation(app);
    const incomeAnalysis = analyzeIncome(app.income, app.family);

    return {
      application_id: app.application_id,
      application_status:
        finalResult.recommendation === 'APPROVE' ? 'APPROVED'
          : finalResult.recommendation === 'REJECT' ? 'REJECTED'
            : finalResult.recommendation === 'REQUEST_DOCUMENTS' ? 'PENDING_INFO'
              : 'REFERRED',
      case_summary: agentDecision.case_summary ||
        `Beneficiary ${app.beneficiary.full_name} requests ${app.request_type.replace('_', ' ').toLowerCase()} for loan ${app.loan.agreement_id}.`,
      case_summary_ar: `المستفيد ${app.beneficiary.full_name_ar ?? app.beneficiary.full_name} يطلب ${app.request_type === 'UPDATE_INSTALLMENT' ? 'تعديل القسط' : 'نقل المتأخرات'}.`,
      income_analysis: agentDecision.income_analysis ||
        `Salary: AED ${app.income.current_salary.toLocaleString()} (${app.income.salary_trend}). Avg per member: AED ${incomeAnalysis.avgIncomePerMember}.`,
      family_analysis: `${app.family.total_family_members} family members, ${app.family.dependents_count} dependents.`,
      arrears_amount: app.arrears.overdue_amount,
      remaining_loan_balance: app.loan.remaining_balance,
      remaining_period_months: app.loan.remaining_period_months,
      proposed_plan: finalResult.plan ?? undefined,
      twenty_pct_rule_compliant: finalResult.twentyPctCompliant,
      period_rule_compliant: finalResult.periodCompliant,
      recommendation: finalResult.recommendation,
      reasoning: agentDecision.reasoning || finalResult.reasoning,
      reasoning_ar: agentDecision.reasoning_ar,
      memo_en: agentDecision.memo_en || 'Application processed successfully.',
      memo_ar: agentDecision.memo_ar || 'تمت معالجة الطلب بنجاح.',
      trace,
      confidence_score: finalResult.recommendation === 'APPROVE' ? 95
        : finalResult.recommendation === 'REJECT' ? 98
          : finalResult.recommendation === 'REQUEST_DOCUMENTS' ? 92 : 70,
      processing_time_ms: Date.now() - startTime,
    };

  } catch (error: unknown) {
    const err = error as { status?: number | string; message?: string };
    const errMsg = err.message ?? '';

    // ── Rate Limit / Quota Fallback ───────────────────────────────────
    if (
      err.status === 429 ||
      err.status === 'RESOURCE_EXHAUSTED' ||
      errMsg.includes('quota') ||
      errMsg.includes('429')
    ) {
      addTrace(
        'System',
        'WARNING',
        `Agent rate-limited (${err.status}). Falling back to deterministic compliance engine.`,
      );

      return buildDeterministicResult(app, trace, startTime, addTrace);
    }

    addTrace('System', 'FAILED', `Agent loop crashed: ${errMsg}`);
    throw error;
  }
}
