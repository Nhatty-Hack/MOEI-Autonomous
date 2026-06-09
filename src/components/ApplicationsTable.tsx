import { useState, useMemo } from 'react';
import { ReschedulingApplication, AgentRecommendation } from '../types';
import { Zap, ArrowUpDown, ArrowUp, ArrowDown, Search, X, BrainCircuit } from 'lucide-react';
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
  batchProgress, onAssess, onToggleExpand, onAssessAll,
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
                          <span className={`badge ${badge.cls}`} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: badge.dot, flexShrink: 0 }} />
                            {badge.label}
                          </span>
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
                              {isProcessing ? <ProcessingAnimation /> : rec ? <AssessmentPanel recommendation={rec} /> : null}
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
