import { useState, useMemo } from 'react';
import { ReschedulingApplication, AgentRecommendation, DocumentValidationResult } from '../types';
import { Zap, ArrowUpDown, ArrowUp, ArrowDown, Search, X, BrainCircuit, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AssessmentPanel from './AssessmentPanel';
import ProcessingAnimation from './ProcessingAnimation';

interface ApplicationsTableProps {
  applications: ReschedulingApplication[];
  recommendations: Record<string, AgentRecommendation>;
  processingApps: Set<string>;
  expandedApp: string | null;
  batchProgress: string | null;
  onAssess: (appId: string) => void;
  onToggleExpand: (appId: string) => void;
  onAssessAll: () => void;
  documentValidations?: Record<string, DocumentValidationResult[]>;
}

// ── Document validation section shown in expanded officer rows ─────────────────

function DocCard({ v }: { v: DocumentValidationResult }) {
  const scoreColor = v.authenticity_score >= 80 ? '#00704A' : v.authenticity_score >= 60 ? '#E8A020' : '#CC3333';
  const scoreBg   = v.authenticity_score >= 80 ? '#E8F5EE' : v.authenticity_score >= 60 ? '#FEF3E2' : '#FEE8E8';

  const hasExtracted = v.company_name || v.employee_name || v.extracted_salary !== null || v.issue_date;
  const extractedRows: { label: string; value: string; color?: string }[] = [];
  if (v.company_name)        extractedRows.push({ label: 'Company',  value: v.company_name });
  if (v.employee_name)       extractedRows.push({ label: 'Employee', value: v.employee_name });
  if (v.extracted_salary !== null) {
    extractedRows.push({
      label: 'Salary',
      value: `AED ${v.extracted_salary.toLocaleString()}${v.salary_mismatch ? ` ✗ (${v.salary_variance_pct.toFixed(1)}%)` : ' ✓'}`,
      color: v.salary_mismatch ? '#CC3333' : '#00704A',
    });
  }
  if (v.issue_date) extractedRows.push({ label: 'Date', value: v.date_detail, color: v.date_ok ? undefined : '#CC3333' });

  const checks = [
    { label: 'Letterhead',      ok: v.has_letterhead },
    { label: 'Signature',       ok: v.has_signature  },
    { label: 'Stamp',           ok: v.has_stamp       },
    { label: 'Validity Clause', ok: v.validity_clause },
  ];

  return (
    <div style={{ background: '#FFFFFF', border: `1.5px solid ${v.salary_mismatch ? 'rgba(204,51,51,0.35)' : '#E8E0D0'}`, borderRadius: '8px', padding: '12px 14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasExtracted ? '9px' : '10px', gap: '6px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1A1A1A' }}>
          {v.doc_type === 'salary_cert' ? 'Salary Certificate' : 'Bank Statement'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {v.gemini_powered && (
            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#0057A8', background: '#E8F0FB', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(0,87,168,0.2)', whiteSpace: 'nowrap' }}>
              ✦ Gemini
            </span>
          )}
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace', color: scoreColor, background: scoreBg, padding: '2px 8px', borderRadius: '10px' }}>
            {v.authenticity_score}%
          </span>
        </div>
      </div>

      {/* Extracted data */}
      {hasExtracted && (
        <div style={{ background: '#F8F6F2', borderRadius: '6px', padding: '8px 10px', marginBottom: '9px' }}>
          <div style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#BBBBBB', marginBottom: '5px' }}>EXTRACTED DATA</div>
          {extractedRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: i < extractedRows.length - 1 ? '3px' : 0 }}>
              <span style={{ fontSize: '10px', color: '#888888', flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: row.color ?? '#1A1A1A', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Integrity checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: (v.salary_mismatch || v.anomalies.length > 0) ? '9px' : 0 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            {c.ok ? <CheckCircle2 size={11} color="#00704A" /> : <AlertTriangle size={11} color="#CC3333" />}
            <span style={{ flex: 1, color: '#555555' }}>{c.label}</span>
            <span style={{ fontSize: '9.5px', fontWeight: 600, color: c.ok ? '#00704A' : '#CC3333' }}>{c.ok ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>

      {/* Anomalies */}
      {v.anomalies.length > 0 && (
        <div style={{ marginBottom: '7px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {v.anomalies.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', padding: '4px 8px', background: '#FEF3E2', borderRadius: '5px' }}>
              <AlertTriangle size={10} color="#E8A020" style={{ marginTop: '1px', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#7A5A00' }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mismatch / fraud pill */}
      {v.salary_mismatch && (
        <div style={{ padding: '5px 9px', background: '#FEE8E8', border: `1px solid rgba(204,51,51,${v.fraud_flagged ? '0.45' : '0.25'})`, borderRadius: '6px', fontSize: '10px', fontWeight: 700, color: '#CC3333' }}>
          {v.fraud_flagged
            ? `FRAUD ALERT: AED ${(v.declared_salary ?? 0).toLocaleString()} declared vs AED ${(v.extracted_salary ?? 0).toLocaleString()} verified (${v.salary_variance_pct.toFixed(0)}% mismatch)`
            : `Salary mismatch: ${v.salary_variance_pct.toFixed(1)}% variance — case REFERRED`}
        </div>
      )}
    </div>
  );
}

function DocValidationSection({ validations }: { validations: DocumentValidationResult[] }) {
  const hasMismatch = validations.some(v => v.salary_mismatch);
  const hasFraud = validations.some(v => v.fraud_flagged);
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE8E0', background: '#FDFCFA' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
        <FileText size={13} color="#C8922A" />
        <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1A1A1A' }}>
          المستندات | Documents
        </span>
        {hasFraud && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 800, color: '#CC3333', background: '#FEE8E8', padding: '2px 9px', borderRadius: '10px', border: '1px solid rgba(204,51,51,0.45)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={10} /> FRAUD RISK
          </span>
        )}
        {!hasFraud && hasMismatch && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#CC3333', background: '#FEE8E8', padding: '2px 9px', borderRadius: '10px', border: '1px solid rgba(204,51,51,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={10} /> HIGH RISK
          </span>
        )}
        {!hasMismatch && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#00704A', background: '#E8F5EE', padding: '2px 9px', borderRadius: '10px', border: '1px solid rgba(0,112,74,0.25)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={10} /> Verified
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: validations.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
        {validations.map(v => <DocCard key={v.doc_type} v={v} />)}
      </div>
    </div>
  );
}

type SortKey = 'name' | 'arrears' | 'balance' | 'deduction' | 'time' | 'status';
type FilterStatus = 'all' | 'APPROVE' | 'REFER_TO_EMPLOYEE' | 'REJECT' | 'REQUEST_DOCUMENTS' | 'PENDING';

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  APPROVE:           { label: 'Approved',   cls: 'badge-approved', dot: '#00704A' },
  REFER_TO_EMPLOYEE: { label: 'Referred',   cls: 'badge-referred', dot: '#E8A020' },
  REJECT:            { label: 'Rejected',   cls: 'badge-rejected', dot: '#CC3333' },
  REQUEST_DOCUMENTS: { label: 'Docs Req.',  cls: 'badge-docs',     dot: '#888888' },
  PENDING:           { label: 'Pending',    cls: 'badge-pending',  dot: '#AAAAAA' },
};

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all',               label: 'All'      },
  { key: 'APPROVE',           label: 'Approved' },
  { key: 'REFER_TO_EMPLOYEE', label: 'Referred' },
  { key: 'REJECT',            label: 'Rejected' },
  { key: 'REQUEST_DOCUMENTS', label: 'Docs Req' },
  { key: 'PENDING',           label: 'Pending'  },
];

function SortIcon({ col, sortKey, dir }: { col: string; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />;
  return dir === 'asc' ? <ArrowUp size={11} color="#C8922A" /> : <ArrowDown size={11} color="#C8922A" />;
}

export default function ApplicationsTable({
  applications, recommendations, processingApps, expandedApp,
  batchProgress, onAssess, onToggleExpand, onAssessAll, documentValidations,
}: ApplicationsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('arrears');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = useMemo(() => {
    let list = applications.map(app => ({
      app,
      rec: recommendations[app.application_id],
      status: recommendations[app.application_id]?.recommendation || 'PENDING',
    }));

    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.app.beneficiary.full_name.toLowerCase().includes(q) ||
        r.app.beneficiary.emirates_id.includes(q) ||
        r.app.application_id.toLowerCase().includes(q) ||
        (r.app.beneficiary.full_name_ar || '').includes(q)
      );
    }

    list.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'name':      diff = a.app.beneficiary.full_name.localeCompare(b.app.beneficiary.full_name); break;
        case 'arrears':   diff = a.app.arrears.overdue_amount - b.app.arrears.overdue_amount; break;
        case 'balance':   diff = a.app.loan.remaining_balance - b.app.loan.remaining_balance; break;
        case 'deduction': diff = (a.rec?.proposed_plan?.deduction_rate || 0) - (b.rec?.proposed_plan?.deduction_rate || 0); break;
        case 'time':      diff = (a.rec?.processing_time_ms || 0) - (b.rec?.processing_time_ms || 0); break;
        case 'status':    diff = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? diff : -diff;
    });

    return list;
  }, [applications, recommendations, sortKey, sortDir, filterStatus, search]);

  const unassessedCount = applications.filter(a => !recommendations[a.application_id]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Applications</h1>
          <p dir="rtl" className="arabic" style={{ fontSize: '11.5px', color: '#AAAAAA', margin: '3px 0 0' }}>قائمة الطلبات</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {batchProgress && <span style={{ fontSize: '12px', color: '#E8A020', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>{batchProgress}</span>}
          <span style={{ fontSize: '12px', color: '#999999', fontFamily: 'IBM Plex Mono, monospace' }}>{rows.length} / {applications.length}</span>
          {unassessedCount > 0 && (
            <button
              onClick={onAssessAll}
              disabled={!!batchProgress}
              style={{ height: '34px', padding: '0 16px', backgroundColor: batchProgress ? '#F5F0E8' : '#C8922A', color: batchProgress ? '#AAAAAA' : '#FFFFFF', border: batchProgress ? '1px solid #E8E0D0' : 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: batchProgress ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}
            >
              <Zap size={12} />
              {batchProgress || `Assess All (${unassessedCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 260px' }}>
          <Search size={13} color="#AAAAAA" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, ID, Emirates ID…"
            style={{ width: '100%', height: '34px', background: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '7px', paddingLeft: '32px', paddingRight: search ? '32px' : '12px', fontSize: '12.5px', color: '#1A1A1A', outline: 'none', fontFamily: 'Segoe UI, sans-serif', transition: 'border-color 0.15s' }}
            onFocus={e => (e.target.style.borderColor = '#C8922A')}
            onBlur={e => (e.target.style.borderColor = '#E8E0D0')}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: '2px' }}>
              <X size={12} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              style={{ height: '34px', padding: '0 12px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit', transition: 'all 0.13s', backgroundColor: filterStatus === f.key ? '#C8922A' : '#FFFFFF', color: filterStatus === f.key ? '#FFFFFF' : '#888888', borderColor: filterStatus === f.key ? '#C8922A' : '#E8E0D0' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', borderTop: '3px solid rgba(200,146,42,0.4)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dark-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th onClick={() => handleSort('name')} style={{ minWidth: '200px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Beneficiary <SortIcon col="name" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th>Emirates ID</th>
                <th onClick={() => handleSort('arrears')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Arrears <SortIcon col="arrears" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Status <SortIcon col="status" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => handleSort('deduction')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Deduction <SortIcon col="deduction" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Time <SortIcon col="time" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ app, rec, status }, idx) => {
                const badge = STATUS_BADGE[status];
                const isProcessing = processingApps.has(app.application_id);
                const isExpanded = expandedApp === app.application_id;
                const isFraud = (documentValidations?.[app.application_id] ?? []).some(v => v.fraud_flagged);
                return (
                  <>
                    <tr key={app.application_id} style={{ cursor: 'default' }}>
                      <td style={{ color: '#CCBBAA', fontSize: '11.5px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>{idx + 1}</td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `${badge.dot}18`, border: `1px solid ${badge.dot}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 700, color: badge.dot }}>
                            {app.beneficiary.full_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', direction: 'rtl', fontFamily: 'Segoe UI, Tahoma, sans-serif', lineHeight: 1.2 }}>{app.beneficiary.full_name_ar || app.beneficiary.full_name}</div>
                            <div style={{ fontSize: '11px', color: '#888888', marginTop: '1px' }}>{app.beneficiary.full_name}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ fontSize: '11.5px', fontFamily: 'IBM Plex Mono, monospace', color: '#AAAAAA' }}>{app.beneficiary.emirates_id}</td>

                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#CC3333', fontFamily: 'IBM Plex Mono, monospace' }}>{app.arrears.overdue_amount.toLocaleString()}</span>
                        <span style={{ fontSize: '10px', color: '#AAAAAA', marginLeft: '3px' }}>AED</span>
                      </td>

                      <td>
                        {isProcessing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0057A8', fontSize: '11.5px', fontWeight: 600 }}>
                            <BrainCircuit size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            Analysing…
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span className={`badge ${badge.cls}`} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: badge.dot, flexShrink: 0 }} />
                              {badge.label}
                            </span>
                            {isFraud && (
                              <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#CC3333', background: '#FEE8E8', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(204,51,51,0.4)', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                                <AlertTriangle size={9} /> Fraud Risk: HIGH
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', fontWeight: 600 }}>
                        {rec?.proposed_plan
                          ? <span style={{ color: rec.twenty_pct_rule_compliant ? '#00704A' : '#CC3333' }}>{rec.proposed_plan.deduction_rate.toFixed(1)}%</span>
                          : <span style={{ color: '#CCBBAA' }}>—</span>
                        }
                      </td>

                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12.5px', color: '#0057A8', fontWeight: 600 }}>
                        {rec?.processing_time_ms ? `${(rec.processing_time_ms / 1000).toFixed(1)}s` : <span style={{ color: '#CCBBAA' }}>—</span>}
                      </td>

                      <td>
                        {!rec && !isProcessing && (
                          <button
                            onClick={() => onAssess(app.application_id)}
                            style={{ height: '28px', padding: '0 12px', background: '#C8922A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#A67420')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#C8922A')}
                          >
                            <Zap size={11} />
                            Assess
                          </button>
                        )}
                        {rec && !isProcessing && (
                          <button
                            onClick={() => onToggleExpand(app.application_id)}
                            style={{ height: '28px', padding: '0 12px', background: 'transparent', color: isExpanded ? '#C8922A' : '#888888', border: `1px solid ${isExpanded ? '#C8922A' : '#E8E0D0'}`, borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.13s' }}
                          >
                            {isExpanded ? '▲ Hide' : '▼ Details'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${app.application_id}-expanded`}>
                        <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid #E8E0D0' }}>
                          <AnimatePresence>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              style={{ overflow: 'hidden', background: '#FDFAF4' }}
                            >
                              {isProcessing ? <ProcessingAnimation /> : rec ? (
                                <>
                                  {(() => {
                                    const appVals = documentValidations?.[app.application_id];
                                    return appVals?.length ? <DocValidationSection validations={appVals} /> : null;
                                  })()}
                                  <AssessmentPanel recommendation={rec} />
                                </>
                              ) : null}
                            </motion.div>
                          </AnimatePresence>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#AAAAAA' }}>
              <Search size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>No applications match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
