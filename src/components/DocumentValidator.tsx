import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Clock, X, FileText, Shield } from 'lucide-react';

type DocId = 'salary_cert' | 'bank_stmt' | 'emirates_id' | 'medical_report';

const DOCS_CONFIG: { id: DocId; label: string; labelAr: string; required: boolean }[] = [
  { id: 'salary_cert',    label: 'Salary Certificate',               labelAr: 'شهادة الراتب',                      required: true  },
  { id: 'bank_stmt',      label: 'Bank Statement (6 months)',        labelAr: 'كشف الحساب البنكي ٦ أشهر',           required: true  },
  { id: 'emirates_id',    label: 'Emirates ID Copy',                 labelAr: 'نسخة من بطاقة الهوية الإماراتية',    required: true  },
  { id: 'medical_report', label: 'Medical Report (if applicable)',   labelAr: 'التقرير الطبي (إن وجد)',              required: false },
];

const BASE_CHECKS = [
  { id: 'letterhead', label: 'Checking letterhead',  labelAr: 'فحص الترويسة الرسمية' },
  { id: 'signature',  label: 'Checking signature',   labelAr: 'فحص التوقيع والختم'   },
  { id: 'date',       label: 'Checking issue date',  labelAr: 'فحص تاريخ الإصدار'    },
];
const CROSS_CHECK = { id: 'cross', label: 'Salary cross-check vs statement', labelAr: 'التحقق المتقاطع مع كشف الحساب' };

type CheckStatus = 'wait' | 'running' | 'pass' | 'warn';

interface CheckResult {
  id: string;
  label: string;
  labelAr: string;
  status: CheckStatus;
  detail: string;
}

interface DocState {
  file: File | null;
  fileName: string;
  phase: 'idle' | 'checking' | 'done';
  checks: CheckResult[];
  score: number;
  requiresReview: boolean;
}

type DocsState = Record<DocId, DocState>;

export interface DocValidationState {
  allRequiredUploaded: boolean;
  hasRequiresReview: boolean;
}

interface DocumentValidatorProps {
  onChange: (state: DocValidationState) => void;
}

const makeIdleDoc = (): DocState => ({
  file: null, fileName: '', phase: 'idle', checks: [], score: 0, requiresReview: false,
});

const INITIAL_DOCS: DocsState = {
  salary_cert:    makeIdleDoc(),
  bank_stmt:      makeIdleDoc(),
  emirates_id:    makeIdleDoc(),
  medical_report: makeIdleDoc(),
};

const STEP_MS   = 420;
const DONE_MS   = 290;

function calcScore(docId: string, fileName: string): number {
  const n = fileName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + docId.charCodeAt(0);
  if (docId === 'medical_report' && n % 4 === 0) return 57 + (n % 12); // 57–68 → triggers review
  return 87 + (n % 11); // 87–97
}

function checkDetail(checkId: string, fileName: string): string {
  const n = fileName.length;
  switch (checkId) {
    case 'letterhead': return 'Verified';
    case 'signature':  return 'Verified';
    case 'date':       return `${15 + (n % 13)} days ago`;
    case 'cross':      return `±${1 + (n % 4)}% variance`;
    default:           return 'Verified';
  }
}

function getChecks(docId: string): Omit<CheckResult, 'status' | 'detail'>[] {
  const base = BASE_CHECKS.map(c => ({ id: c.id, label: c.label, labelAr: c.labelAr }));
  return docId === 'salary_cert' ? [...base, { id: CROSS_CHECK.id, label: CROSS_CHECK.label, labelAr: CROSS_CHECK.labelAr }] : base;
}

const SPINNER: React.CSSProperties = {
  width: '11px', height: '11px', borderRadius: '50%',
  border: '1.5px solid #C8922A', borderTopColor: 'transparent',
  animation: 'spin 0.7s linear infinite',
};

export default function DocumentValidator({ onChange }: DocumentValidatorProps) {
  const [docs, setDocs] = useState<DocsState>(INITIAL_DOCS);
  const fileRefs = useRef<Record<DocId, HTMLInputElement | null>>({} as Record<DocId, HTMLInputElement | null>);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    const allRequiredUploaded = DOCS_CONFIG.filter(d => d.required).every(d => docs[d.id].file !== null);
    const hasRequiresReview   = DOCS_CONFIG.some(d => docs[d.id].requiresReview);
    onChangeRef.current({ allRequiredUploaded, hasRequiresReview });
  }, [docs]);

  const handleFileSelect = useCallback((docId: DocId, file: File) => {
    const checkDefs   = getChecks(docId);
    const score       = calcScore(docId, file.name);
    const needsReview = score < 75;

    setDocs(prev => ({
      ...prev,
      [docId]: {
        file, fileName: file.name, phase: 'checking',
        checks: checkDefs.map(c => ({ ...c, status: 'wait' as CheckStatus, detail: '' })),
        score: 0, requiresReview: false,
      },
    }));

    checkDefs.forEach((check, i) => {
      setTimeout(() => {
        setDocs(prev => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            checks: prev[docId].checks.map((c, j) => j === i ? { ...c, status: 'running' as CheckStatus } : c),
          },
        }));
      }, i * STEP_MS + 80);

      setTimeout(() => {
        const isLast = i === checkDefs.length - 1;
        const status: CheckStatus = needsReview && isLast ? 'warn' : 'pass';
        setDocs(prev => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            checks: prev[docId].checks.map((c, j) =>
              j === i ? { ...c, status, detail: checkDetail(check.id, file.name) } : c
            ),
          },
        }));
      }, i * STEP_MS + 80 + DONE_MS);
    });

    setTimeout(() => {
      setDocs(prev => ({ ...prev, [docId]: { ...prev[docId], phase: 'done', score, requiresReview: needsReview } }));
    }, checkDefs.length * STEP_MS + 80 + DONE_MS + 350);
  }, []);

  const handleRemove = useCallback((docId: DocId) => {
    setDocs(prev => ({ ...prev, [docId]: makeIdleDoc() }));
    const el = fileRefs.current[docId];
    if (el) el.value = '';
  }, []);

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0D0', borderRadius: '10px', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#F5F0E8', borderBottom: '1px solid #E8E0D0', padding: '13px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={13} color="#C8922A" />
          <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1A1A1A' }}>
            Document Verification — التحقق من المستندات
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace' }}>AI · MOEI v2.1</span>
      </div>

      {/* Document slots */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {DOCS_CONFIG.map((docConf, idx) => {
          const doc    = docs[docConf.id];
          const isLast = idx === DOCS_CONFIG.length - 1;
          return (
            <div key={docConf.id} style={{ borderBottom: isLast ? 'none' : '1px solid #F0EBE0', padding: '13px 18px' }}>

              {/* Hidden file input */}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                ref={el => { fileRefs.current[docConf.id] = el; }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(docConf.id, f);
                }}
              />

              {/* Row header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                  <div style={{ marginTop: '3px', flexShrink: 0, width: '14px' }}>
                    {doc.phase === 'idle'                           && <FileText size={13} color="#BBBBBB" />}
                    {doc.phase === 'checking'                       && <div style={SPINNER} />}
                    {doc.phase === 'done' && !doc.requiresReview    && <CheckCircle2 size={13} color="#00704A" />}
                    {doc.phase === 'done' && doc.requiresReview     && <AlertTriangle size={13} color="#C8922A" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>
                      {docConf.label}
                      {docConf.required && <span style={{ color: '#CC3333', marginLeft: '3px', fontSize: '11px' }}>*</span>}
                    </div>
                    <div dir="rtl" className="arabic" style={{ fontSize: '10px', color: '#888888', marginTop: '1px' }}>
                      {docConf.labelAr}
                    </div>
                  </div>
                </div>

                {doc.phase === 'idle' ? (
                  <button
                    onClick={() => fileRefs.current[docConf.id]?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '6px',
                      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                      backgroundColor: '#F5F0E8', border: '1px solid #E8E0D0', color: '#555555',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C8922A'; e.currentTarget.style.color = '#C8922A'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#555555'; }}
                  >
                    <Upload size={10} />
                    Upload
                  </button>
                ) : (
                  <button
                    onClick={() => handleRemove(docConf.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px',
                      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                      backgroundColor: 'transparent', border: '1px solid #E8E0D0', color: '#888888',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC3333'; e.currentTarget.style.color = '#CC3333'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#888888'; }}
                  >
                    <X size={10} />
                    Remove
                  </button>
                )}
              </div>

              {/* Validation results */}
              {doc.phase !== 'idle' && (
                <div style={{ marginTop: '9px', paddingLeft: '22px' }}>
                  <div style={{ fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace', marginBottom: '8px' }}>
                    📎 {doc.fileName}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {doc.checks.map(check => (
                      <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {check.status === 'wait'    && <Clock size={11} color="#CCCCCC" />}
                          {check.status === 'running' && <div style={SPINNER} />}
                          {check.status === 'pass'    && <CheckCircle2 size={11} color="#00704A" />}
                          {check.status === 'warn'    && <AlertTriangle size={11} color="#C8922A" />}
                        </div>
                        <span style={{
                          fontSize: '11.5px', flex: 1,
                          color: check.status === 'wait' ? '#BBBBBB' : check.status === 'warn' ? '#A67420' : '#444444',
                        }}>
                          {check.label}
                        </span>
                        {check.detail && (
                          <span style={{
                            fontSize: '10px', fontFamily: 'monospace', fontWeight: 600,
                            color: check.status === 'warn' ? '#C8922A' : '#00704A',
                          }}>
                            {check.detail}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {doc.phase === 'done' && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Authenticity Score
                        </span>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                          color: doc.requiresReview ? '#C8922A' : '#00704A',
                        }}>
                          {doc.score}%
                        </span>
                      </div>
                      <div style={{ height: '4px', backgroundColor: '#EDE8E0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${doc.score}%`,
                          backgroundColor: doc.requiresReview ? '#C8922A' : '#00704A',
                          borderRadius: '2px', transition: 'width 0.6s ease',
                        }} />
                      </div>
                      {doc.requiresReview && (
                        <div style={{
                          marginTop: '8px', padding: '7px 10px',
                          backgroundColor: '#FEF3E8', border: '1px solid #F0C888', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                          <AlertTriangle size={11} color="#C8922A" />
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#A67420' }}>
                            يتطلب مراجعة بشرية | Requires Human Review
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
