import { DocumentValidationResult } from '../types';

interface GeminiPayload {
  is_valid_doc: boolean;
  document_type: string;
  company_name: string | null;
  employee_name: string | null;
  emirates_id: string | null;
  monthly_salary_aed: number | null;
  issue_date: string | null;
  has_letterhead: boolean;
  has_signature: boolean;
  has_stamp: boolean;
  validity_clause: boolean;
  days_since_issue: number | null;
  anomalies: string[];
  authenticity_score: number;
}

async function callGeminiVision(
  base64: string,
  mimeType: string,
  docType: 'salary_cert' | 'bank_stmt',
): Promise<GeminiPayload> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No GEMINI_API_KEY configured');

  const docTypeLabel = docType === 'salary_cert' ? 'salary / income certificate' : 'bank statement';

  const prompt = `You are a UAE government document validator. The user claims to have uploaded a ${docTypeLabel}.

Analyze this image carefully and return ONLY JSON:
{
  "is_valid_doc": bool,
  "document_type": string,
  "company_name": string or null,
  "employee_name": string or null,
  "emirates_id": string or null,
  "monthly_salary_aed": number or null,
  "issue_date": string or null,
  "has_letterhead": bool,
  "has_signature": bool,
  "has_stamp": bool,
  "validity_clause": bool,
  "days_since_issue": number or null,
  "anomalies": string[],
  "authenticity_score": 0-100
}

Rules:
- is_valid_doc: true ONLY if this image is genuinely a ${docTypeLabel}; set false if this is a photo, selfie, portrait, ID card, passport, invoice, contract, blank page, or ANY document that is NOT a ${docTypeLabel}
- document_type: classify as exactly one of: 'salary_cert', 'bank_stmt', 'id_card', 'passport', 'invoice', 'contract', 'photo', 'blank', 'other'
- company_name: issuing company/employer name, or null if not visible or is_valid_doc is false
- employee_name: full name of employee on document, or null
- emirates_id: Emirates ID number on document (format 784-xxxx-xxxxxxx-x), or null
- monthly_salary_aed: net monthly salary as a plain integer (no commas/symbols), or null
- issue_date: document issue date as "DD Mon YYYY" (e.g. "15 Jan 2026"), or null
- has_letterhead: true if official company letterhead with logo/address is present
- has_signature: true if an authorised signature is present
- has_stamp: true if an official company/government stamp or seal is present
- validity_clause: true if a validity period statement is printed on the document
- days_since_issue: integer days between issue_date and today, or null
- anomalies: list of specific concerns (e.g. "salary figure partially obscured", "date stamp smudged"); empty array if none or is_valid_doc is false
- authenticity_score: integer 0-100 overall confidence the document is genuine; set 0 if is_valid_doc is false

Respond ONLY with valid JSON. No markdown, no explanation.`;

  const body = {
    contents: [{ parts: [
      { text: prompt },
      { inlineData: { mimeType, data: base64 } },
    ]}],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText.substring(0, 160)}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned) as GeminiPayload;
}

// ── Manual review result — Gemini unavailable (429 / network) ─────────────────
function buildManualReviewResult(
  applicationId: string,
  docType: 'salary_cert' | 'bank_stmt',
  fileName: string,
  declaredSalary: number,
): DocumentValidationResult {
  return {
    application_id: applicationId,
    doc_type: docType,
    file_name: fileName,
    validated_at: new Date().toISOString(),
    gemini_powered: false,
    is_valid_document: true,
    document_type: docType,
    needs_manual_review: true,
    company_name: null,
    employee_name: null,
    emirates_id_on_doc: null,
    issue_date: null,
    days_since_issue: null,
    anomalies: ['Automated AI verification unavailable — document queued for manual officer review'],
    has_letterhead: false,
    has_signature: false,
    has_stamp: false,
    date_ok: false,
    date_detail: 'Unverified — pending manual review',
    validity_clause: false,
    extracted_salary: null,
    declared_salary: declaredSalary,
    salary_mismatch: false,
    salary_variance_pct: 0,
    authenticity_score: 0,
    risk_level: 'medium',
    risk_label: 'MANUAL REVIEW — Automated verification unavailable',
    fraud_flagged: false,
  };
}

// ── Invalid document result — photo / wrong type uploaded ─────────────────────
function buildInvalidDocResult(
  applicationId: string,
  docType: 'salary_cert' | 'bank_stmt',
  fileName: string,
  declaredSalary: number,
  detectedType: string,
): DocumentValidationResult {
  const label = docType === 'salary_cert' ? 'salary certificate' : 'bank statement';
  return {
    application_id: applicationId,
    doc_type: docType,
    file_name: fileName,
    validated_at: new Date().toISOString(),
    gemini_powered: true,
    is_valid_document: false,
    document_type: detectedType,
    needs_manual_review: false,
    company_name: null,
    employee_name: null,
    emirates_id_on_doc: null,
    issue_date: null,
    days_since_issue: null,
    anomalies: [`Uploaded file is not a ${label} (detected: ${detectedType})`],
    has_letterhead: false,
    has_signature: false,
    has_stamp: false,
    date_ok: false,
    date_detail: 'N/A — invalid document',
    validity_clause: false,
    extracted_salary: null,
    declared_salary: declaredSalary,
    salary_mismatch: false,
    salary_variance_pct: 0,
    authenticity_score: 0,
    risk_level: 'high',
    risk_label: `INVALID DOCUMENT — Not a ${label}`,
    fraud_flagged: false,
  };
}

// ── Public export ─────────────────────────────────────────────────────────────
export async function validateDocument(
  base64: string,
  mimeType: string,
  fileName: string,
  docType: 'salary_cert' | 'bank_stmt',
  applicationId: string,
  declaredSalary: number,
): Promise<DocumentValidationResult> {
  let payload: GeminiPayload;

  try {
    payload = await callGeminiVision(base64, mimeType, docType);
  } catch (err) {
    console.warn('[geminiValidator] Gemini unavailable, queuing for manual review:', (err as Error).message?.slice(0, 80));
    return buildManualReviewResult(applicationId, docType, fileName, declaredSalary);
  }

  // Wrong document type → reject immediately, do not process further
  if (!payload.is_valid_doc) {
    const detected = payload.document_type ?? 'unknown';
    console.log(`[geminiValidator] Invalid document: detected '${detected}' for requested '${docType}'`);
    return buildInvalidDocResult(applicationId, docType, fileName, declaredSalary, detected);
  }

  // ── Valid document — run full checks ──────────────────────────────────────

  const extracted = typeof payload.monthly_salary_aed === 'number' ? payload.monthly_salary_aed : null;
  const variancePct =
    docType === 'salary_cert' && extracted !== null && declaredSalary > 0
      ? Math.abs((extracted - declaredSalary) / declaredSalary) * 100
      : 0;
  const salaryMismatch = docType === 'salary_cert' && extracted !== null && variancePct > 15;
  const fraudFlagged = salaryMismatch && variancePct > 50;

  const maxDays = docType === 'salary_cert' ? 30 : 90;
  const dateOk = payload.days_since_issue !== null
    ? payload.days_since_issue <= maxDays
    : !!payload.issue_date;

  const dateDetail = payload.issue_date
    ? (payload.days_since_issue !== null
        ? `${payload.issue_date} · ${payload.days_since_issue}d ago`
        : payload.issue_date)
    : 'No date found';

  const rawScore = typeof payload.authenticity_score === 'number'
    && payload.authenticity_score >= 0
    && payload.authenticity_score <= 100
    ? payload.authenticity_score : null;

  const passCount = [payload.has_letterhead, payload.has_signature, payload.has_stamp, dateOk, payload.validity_clause].filter(Boolean).length;
  const computedScore = 50 + passCount * 9 + (salaryMismatch ? -20 : extracted !== null ? 5 : 0);
  const score = salaryMismatch
    ? Math.min(45, rawScore ?? computedScore)
    : Math.min(100, Math.max(0, rawScore ?? computedScore));

  const hasAnomalies = (payload.anomalies?.length ?? 0) > 0;
  const riskLevel: 'low' | 'medium' | 'high' = salaryMismatch ? 'high'
    : (hasAnomalies || passCount < 3) ? 'medium'
    : 'low';

  return {
    application_id: applicationId,
    doc_type: docType,
    file_name: fileName,
    validated_at: new Date().toISOString(),
    gemini_powered: true,
    is_valid_document: true,
    document_type: payload.document_type ?? docType,
    needs_manual_review: false,
    company_name:       payload.company_name   ?? null,
    employee_name:      payload.employee_name  ?? null,
    emirates_id_on_doc: payload.emirates_id    ?? null,
    issue_date:         payload.issue_date     ?? null,
    days_since_issue:   payload.days_since_issue ?? null,
    anomalies:          payload.anomalies       ?? [],
    has_letterhead:     payload.has_letterhead,
    has_signature:      payload.has_signature,
    has_stamp:          payload.has_stamp,
    date_ok:            dateOk,
    date_detail:        dateDetail,
    validity_clause:    payload.validity_clause,
    extracted_salary:   extracted,
    declared_salary:    declaredSalary,
    salary_mismatch:    salaryMismatch,
    salary_variance_pct: variancePct,
    authenticity_score: score,
    risk_level: riskLevel,
    risk_label: fraudFlagged
      ? 'FRAUD ALERT — Declared income does not match verified financial records'
      : salaryMismatch
      ? 'HIGH RISK — Salary mismatch detected'
      : riskLevel === 'medium'
      ? 'MEDIUM RISK — Review required'
      : 'LOW RISK — Document verified',
    fraud_flagged: fraudFlagged,
  };
}
