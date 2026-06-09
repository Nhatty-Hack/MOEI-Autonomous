/**
 * dataLoader.ts — Server-side Historical Data Loader
 *
 * Reads the RescheduleArrears.xlsx file and provides historical records
 * and aggregate statistics for the dashboard and analytics endpoints.
 *
 * This module runs on the SERVER side only.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import { HistoricalRecord, HistoricalStats } from '../types';

let cachedRecords: HistoricalRecord[] | null = null;

// ──────────────────────────────────────────────────────────────────────────────
// Load Historical Data from Excel
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Reads the Excel file and combines all sheets (2023, 2024, 2025).
 * Adds a 'year' field from the sheet name.
 * Filters out garbage rows (e.g., where OVER_DUE_MONTHS > 1000 or missing key fields).
 * Caches the result for subsequent calls.
 */
export function loadHistoricalData(filePath: string): HistoricalRecord[] {
  if (cachedRecords) {
    return cachedRecords;
  }

  const workbook = XLSX.readFile(filePath);
  const allRecords: HistoricalRecord[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: undefined,
    }) as Record<string, unknown>[];

    for (const row of rows) {
      const record: HistoricalRecord = {
        ID: row['ID'] != null ? String(row['ID']) : undefined,
        APPLICANT: row['APPLICANT'] != null ? String(row['APPLICANT']) : undefined,
        APPLICATION_ID: String(row['APPLICATION_ID'] ?? ''),
        AGREEMENT_ID: String(row['AGREEMENT_ID'] ?? ''),
        EDB_LOAN_ID: String(row['EDB_LOAN_ID'] ?? ''),
        EDB_CUSTOMER_ID: Number(row['EDB_CUSTOMER_ID'] ?? 0),
        CURRENT_SALARY: Number(row['CURRENT_SALARY'] ?? 0),
        OVER_DUE_AMT: Number(row['OVER_DUE_AMT'] ?? 0),
        OVER_DUE_MONTHS: Number(row['OVER_DUE_MONTHS'] ?? 0),
        DEDUCT_FROM_SALARY: String(row['DEDUCT_FROM_SALARY'] ?? ''),
        REQUEST_TYPE: row['REQUEST_TYPE'] != null ? String(row['REQUEST_TYPE']) : undefined,
        APPROVED_REQUEST_TYPE: String(row['APPROVED_REQUEST_TYPE'] ?? ''),
        NEW_EMI_APPLICABLE_MONTHS: row['NEW_EMI_APPLICABLE_MONTHS'] != null
          ? Number(row['NEW_EMI_APPLICABLE_MONTHS'])
          : undefined,
        CURRENT_EMI_AMT: Number(row['CURRENT_EMI_AMT'] ?? 0),
        NEW_EMI_AMT: row['NEW_EMI_AMT'] != null ? Number(row['NEW_EMI_AMT']) : undefined,
        CREATED_DATE: Number(row['CREATED_DATE'] ?? 0),
        STATUS: String(row['STATUS'] ?? ''),
        APPROVED_DATE: row['APPROVED_DATE'] != null ? Number(row['APPROVED_DATE']) : undefined,
        JUSTIFICATIONS: row['JUSTIFICATIONS'] != null ? String(row['JUSTIFICATIONS']) : undefined,
        REMARKS: row['REMARKS'] != null ? String(row['REMARKS']) : undefined,
        UNTIL_LOAN_END: row['UNTIL_LOAN_END'] != null ? String(row['UNTIL_LOAN_END']) : undefined,
        ADDITIONAL_MONTHS: row['ADDITIONAL_MONTHS'] != null
          ? Number(row['ADDITIONAL_MONTHS'])
          : undefined,
        ADDITIONAL_PREMIUM: row['ADDITIONAL_PREMIUM'] != null
          ? Number(row['ADDITIONAL_PREMIUM'])
          : undefined,
        AUTH_SIGNATORY: row['AUTH_SIGNATORY'] != null ? String(row['AUTH_SIGNATORY']) : undefined,
        CREATED_BY: row['CREATED_BY'] != null ? String(row['CREATED_BY']) : undefined,
        START_MONTH: row['START_MONTH'] != null ? Number(row['START_MONTH']) : undefined,
        START_YEAR: row['START_YEAR'] != null ? Number(row['START_YEAR']) : undefined,
        year: sheetName,
      };

      // Filter out garbage rows
      if (
        record.OVER_DUE_MONTHS > 1000 ||
        record.OVER_DUE_MONTHS < 0 ||
        !record.APPLICATION_ID ||
        !record.AGREEMENT_ID
      ) {
        continue;
      }

      allRecords.push(record);
    }
  }

  cachedRecords = allRecords;
  return cachedRecords;
}

// ──────────────────────────────────────────────────────────────────────────────
// Aggregate Statistics
// ──────────────────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates aggregate statistics from the historical records.
 * Filters to clean records (valid salary > 0, valid arrears >= 0).
 */
export function getHistoricalStats(records: HistoricalRecord[]): HistoricalStats {
  // Filter to clean records
  const clean = records.filter(
    r => r.CURRENT_SALARY > 0 && r.OVER_DUE_AMT >= 0 && r.CURRENT_EMI_AMT > 0,
  );

  // By year
  const byYear: Record<string, number> = {};
  for (const r of records) {
    byYear[r.year] = (byYear[r.year] || 0) + 1;
  }

  // By request type
  const byRequestType: Record<string, number> = {};
  for (const r of records) {
    const type = r.APPROVED_REQUEST_TYPE || r.REQUEST_TYPE || 'UNKNOWN';
    byRequestType[type] = (byRequestType[type] || 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of records) {
    byStatus[r.STATUS] = (byStatus[r.STATUS] || 0) + 1;
  }

  // Salary stats
  const salaries = clean.map(r => r.CURRENT_SALARY);
  const salaryStats = {
    min: salaries.length > 0 ? Math.min(...salaries) : 0,
    max: salaries.length > 0 ? Math.max(...salaries) : 0,
    avg: salaries.length > 0
      ? Number((salaries.reduce((a, b) => a + b, 0) / salaries.length).toFixed(2))
      : 0,
    median: Number(median(salaries).toFixed(2)),
  };

  // Arrears stats
  const arrears = clean.map(r => r.OVER_DUE_AMT);
  const arrearsStats = {
    min: arrears.length > 0 ? Math.min(...arrears) : 0,
    max: arrears.length > 0 ? Math.max(...arrears) : 0,
    avg: arrears.length > 0
      ? Number((arrears.reduce((a, b) => a + b, 0) / arrears.length).toFixed(2))
      : 0,
    median: Number(median(arrears).toFixed(2)),
  };

  // Average deduction rate (NEW_EMI_AMT / CURRENT_SALARY * 100) for records with NEW_EMI
  const deductionRates = clean
    .filter(r => r.NEW_EMI_AMT != null && r.NEW_EMI_AMT > 0)
    .map(r => (r.NEW_EMI_AMT! / r.CURRENT_SALARY) * 100);
  const avgDeductionRate = deductionRates.length > 0
    ? Number((deductionRates.reduce((a, b) => a + b, 0) / deductionRates.length).toFixed(2))
    : 0;

  // Average additional months
  const additionalMonthsArr = clean
    .filter(r => r.ADDITIONAL_MONTHS != null && r.ADDITIONAL_MONTHS > 0)
    .map(r => r.ADDITIONAL_MONTHS!);
  const avgAdditionalMonths = additionalMonthsArr.length > 0
    ? Number((additionalMonthsArr.reduce((a, b) => a + b, 0) / additionalMonthsArr.length).toFixed(2))
    : 0;

  return {
    total_records: records.length,
    by_year: byYear,
    by_request_type: byRequestType,
    by_status: byStatus,
    salary_stats: salaryStats,
    arrears_stats: arrearsStats,
    avg_deduction_rate: avgDeductionRate,
    avg_additional_months: avgAdditionalMonths,
  };
}
