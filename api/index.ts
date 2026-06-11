import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { mockApplications } from '../src/data';
import { assessApplication } from '../src/services/assessment';
import { processWithAgent } from '../src/services/agent';
import { GOVERNANCE } from '../src/services/complianceEngine';
import { loadHistoricalData, getHistoricalStats, computeHistoricalInsight } from '../src/services/dataLoader';
import { validateDocument } from '../src/services/geminiValidator';
import { HistoricalRecord, HistoricalStats, AgentRecommendation, DocumentValidationResult, TraceStep } from '../src/types';

// ── Async error wrapper ────────────────────────────────────────────────────────
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ── Historical data ────────────────────────────────────────────────────────────
let historicalRecords: HistoricalRecord[] = [];
let historicalStats: HistoricalStats | null = null;

const excelPath = path.join(process.cwd(), 'RescheduleArrears.xlsx');
try {
  if (fs.existsSync(excelPath)) {
    historicalRecords = loadHistoricalData(excelPath);
    historicalStats = getHistoricalStats(historicalRecords);
  }
} catch (_) {
  // Historical data unavailable in serverless — endpoints return empty
}

// ── Document validation store (in-memory, per cold-start) ──────────────────────
const validationStore = new Map<string, DocumentValidationResult[]>();

// ── Express app ────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '15mb' }));

// ── Override recommendation when salary mismatch detected ──────────────────────
function applyDocumentOverrides(result: AgentRecommendation, appId: string): AgentRecommendation {
  const validations = validationStore.get(appId) ?? [];
  if (validations.some(v => v.needs_manual_review)) {
    return {
      ...result,
      recommendation: 'REQUEST_DOCUMENTS',
      application_status: 'PENDING_INFO',
      reasoning: 'Document verification could not be completed automatically. A human officer will manually review your submitted documents and contact you within 2 working days.',
      reasoning_ar: 'لم يتمكن النظام من التحقق من المستندات آلياً. سيقوم موظف بمراجعة مستنداتك يدوياً والتواصل معك خلال يومي عمل.',
    };
  }
  const mismatch = validations.find(v => v.salary_mismatch && v.extracted_salary !== null);
  if (!mismatch) return result;
  const declared = (mismatch.declared_salary ?? 0).toLocaleString();
  const extracted = mismatch.extracted_salary!.toLocaleString();
  const variancePct = mismatch.salary_variance_pct.toFixed(0);
  if (mismatch.fraud_flagged) {
    const fraudTrace: TraceStep = {
      step_name: 'FRAUD_DETECTION',
      status: 'FAILED',
      log_message: `⚠ FRAUD ALERT: Declared income (AED ${declared}) inconsistent with verified financial records (AED ${extracted}). Mismatch: ${variancePct}%. Case escalated to human officer with full evidence trail.`,
      timestamp: new Date().toISOString(),
    };
    return {
      ...result,
      recommendation: 'REFER_TO_EMPLOYEE',
      application_status: 'REFERRED',
      reasoning: `Declared income (AED ${declared}) inconsistent with verified financial records (AED ${extracted}). Mismatch: ${variancePct}%. Case escalated to human officer with full evidence trail.`,
      reasoning_ar: 'الدخل المُصرَّح به غير متطابق مع السجلات المالية الموثقة. تم تصعيد الحالة إلى موظف بشري مع مسار التدقيق الكامل.',
      trace: [...(result.trace ?? []), fraudTrace],
    };
  }
  return {
    ...result,
    recommendation: 'REFER_TO_EMPLOYEE',
    application_status: 'REFERRED',
    reasoning: `Declared salary (${declared} AED) inconsistent with verified records (${extracted} AED). Document validation flagged HIGH RISK with ${mismatch.salary_variance_pct.toFixed(1)}% variance. Case referred for manual review.`,
    reasoning_ar: 'الراتب المُصرَّح به غير متطابق مع السجلات الموثقة. تم تحويل الطلب للمراجعة اليدوية.',
  };
}

function enrichWithHistory<T extends { arrears_amount?: number }>(
  result: T,
  salary: number,
  arrearsAmount: number,
): T & { historical_insight?: string; historical_precedent?: unknown } {
  if (!historicalRecords.length) return result;
  const precedent = computeHistoricalInsight(historicalRecords, salary, arrearsAmount);
  return {
    ...result,
    historical_insight: precedent.insight_text,
    historical_precedent: precedent.similar_count > 0 ? {
      similar_count: precedent.similar_count,
      approved_count: precedent.approved_count,
      referred_count: precedent.referred_count,
      rejected_count: precedent.rejected_count,
      avg_additional_months: precedent.avg_additional_months,
      salary_range_label: precedent.salary_range_label,
      arrears_ratio_label: precedent.arrears_ratio_label,
    } : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/applications', (_req, res) => {
  res.json(mockApplications);
});

app.get('/api/governance-rules', (_req, res) => {
  res.json(GOVERNANCE);
});

app.post('/api/assess/:id', (req, res) => {
  const application = mockApplications.find(a => a.application_id === req.params.id);
  if (!application) { res.status(404).json({ error: 'Application not found' }); return; }
  const result = assessApplication(application);
  const enriched = enrichWithHistory(result, application.income.current_salary, application.arrears.overdue_amount);
  const final = applyDocumentOverrides(enriched as AgentRecommendation, req.params.id);
  res.json({ status: 'success', data: final });
});

app.post('/api/agent-assess/:id', asyncHandler(async (req, res) => {
  const application = mockApplications.find(a => a.application_id === req.params.id);
  if (!application) { res.status(404).json({ error: 'Application not found' }); return; }
  try {
    const result = await processWithAgent(application);
    const enriched = enrichWithHistory(result, application.income.current_salary, application.arrears.overdue_amount);
    const final = applyDocumentOverrides(enriched as AgentRecommendation, req.params.id);
    res.json({ status: 'success', data: final });
  } catch (err) {
    console.warn(`Agent failed for ${req.params.id}, using deterministic fallback:`, (err as Error).message?.substring(0, 80));
    const result = assessApplication(application);
    const enriched = enrichWithHistory(result, application.income.current_salary, application.arrears.overdue_amount);
    const final = applyDocumentOverrides(enriched as AgentRecommendation, req.params.id);
    res.json({ status: 'success', data: final });
  }
}));

app.post('/api/assess', (_req, res) => {
  const results = mockApplications.map(a => ({
    status: "success",
    data: assessApplication(a)
  }));
  res.json(results);
});

app.get('/api/historical-data', (req, res) => {
  const year = req.query.year as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  let filtered = historicalRecords;
  if (year) filtered = filtered.filter(r => r.year === year);
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / limit);
  const offset = (page - 1) * limit;
  const paginatedRecords = filtered.slice(offset, offset + limit);
  res.json({
    records: paginatedRecords,
    pagination: { page, limit, total_records: totalRecords, total_pages: totalPages, has_next: page < totalPages, has_prev: page > 1 },
  });
});

app.get('/api/historical-stats', (_req, res) => {
  if (historicalStats) { res.json(historicalStats); return; }
  if (historicalRecords.length > 0) {
    historicalStats = getHistoricalStats(historicalRecords);
    res.json(historicalStats);
  } else {
    res.json({
      total_records: 0, by_year: {}, by_request_type: {}, by_status: {},
      salary_stats: { min: 0, max: 0, avg: 0, median: 0 },
      arrears_stats: { min: 0, max: 0, avg: 0, median: 0 },
      avg_deduction_rate: 0, avg_additional_months: 0,
    });
  }
});

app.post('/api/validate-document', asyncHandler(async (req, res) => {
  const { base64, mimeType, fileName, docType, applicationId, declaredSalary } = req.body as {
    base64: string; mimeType: string; fileName: string;
    docType: 'salary_cert' | 'bank_stmt'; applicationId: string; declaredSalary: number;
  };
  if (!base64 || !mimeType || !fileName || !docType || !applicationId) {
    res.status(400).json({ error: 'Missing required fields' }); return;
  }
  const result = await validateDocument(base64, mimeType, fileName, docType, applicationId, declaredSalary ?? 0);
  const existing = validationStore.get(applicationId) ?? [];
  validationStore.set(applicationId, [...existing.filter(v => v.doc_type !== docType), result]);
  res.json({ status: 'success', data: result });
}));

app.get('/api/document-validations', (_req, res) => {
  const all: Record<string, DocumentValidationResult[]> = {};
  validationStore.forEach((vals, appId) => { all[appId] = vals; });
  res.json(all);
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Export as Vercel Serverless Function ────────────────────────────────────────
export default app;
