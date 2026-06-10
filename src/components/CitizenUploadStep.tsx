import { useState, useRef, useCallback, DragEvent } from 'react';
import {
  Upload, CheckCircle2, Clock, X, LogOut, User,
  ArrowRight, Loader2, ChevronRight, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReschedulingApplication } from '../types';

type DocId = 'salary_cert' | 'bank_stmt';

const DOCS: { id: DocId; label: string; labelAr: string; hint: string }[] = [
  { id: 'salary_cert', label: 'Salary Certificate',       labelAr: 'شهادة الراتب',          hint: 'Issued within 30 days · official letterhead' },
  { id: 'bank_stmt',   label: 'Bank Statement (6 months)', labelAr: 'كشف الحساب البنكي',     hint: 'Last 6 months · official bank copy' },
];

interface CheckDef { id: string; label: string; labelAr: string; detail: (n: string) => string }
const SALARY_CHECKS: CheckDef[] = [
  { id: 'letterhead', label: 'Letterhead & official logo',   labelAr: 'فحص الترويسة الرسمية',   detail: () => 'Verified' },
  { id: 'signature',  label: 'Signature & stamp',            labelAr: 'التوقيع والختم',           detail: () => 'Verified' },
  { id: 'date',       label: 'Issue date within 30 days',    labelAr: 'تاريخ الإصدار',             detail: n => `${12 + (n.length % 14)} days ago` },
  { id: 'salary',     label: 'Salary amount extracted',      labelAr: 'استخراج مبلغ الراتب',      detail: n => `AED ${(25000 + (n.charCodeAt(0) % 20000)).toLocaleString()}` },
];
const BANK_CHECKS: CheckDef[] = SALARY_CHECKS.slice(0, 3);

type CheckStatus = 'wait' | 'running' | 'pass';
interface CheckResult { id: string; label: string; labelAr: string; status: CheckStatus; detail: string }
interface DocState { file: File | null; phase: 'idle' | 'checking' | 'done'; checks: CheckResult[]; score: number; dragging: boolean }

const STEP_MS = 460;

const idle = (): DocState => ({ file: null, phase: 'idle', checks: [], score: 0, dragging: false });

interface Props {
  application: ReschedulingApplication;
  onSubmit: () => void;
  onLogout: () => void;
}

export default function CitizenUploadStep({ application: app, onSubmit, onLogout }: Props) {
  const [docs, setDocs] = useState<Record<DocId, DocState>>({ salary_cert: idle(), bank_stmt: idle() });
  const [consent, setConsent] = useState(false);
  const fileRefs = useRef<Record<DocId, HTMLInputElement | null>>({} as Record<DocId, HTMLInputElement | null>);

  const startValidation = useCallback((docId: DocId, file: File) => {
    const defs = docId === 'salary_cert' ? SALARY_CHECKS : BANK_CHECKS;
    const n = file.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const score = 88 + (n % 10);

    setDocs(prev => ({
      ...prev,
      [docId]: { ...prev[docId], file, phase: 'checking', dragging: false,
        checks: defs.map(c => ({ id: c.id, label: c.label, labelAr: c.labelAr, status: 'wait' as CheckStatus, detail: '' })),
        score: 0 },
    }));

    defs.forEach((def, i) => {
      setTimeout(() => setDocs(prev => ({
        ...prev,
        [docId]: { ...prev[docId], checks: prev[docId].checks.map((c, j) => j === i ? { ...c, status: 'running' } : c) },
      })), i * STEP_MS + 60);

      setTimeout(() => setDocs(prev => ({
        ...prev,
        [docId]: { ...prev[docId], checks: prev[docId].checks.map((c, j) => j === i ? { ...c, status: 'pass', detail: def.detail(file.name) } : c) },
      })), i * STEP_MS + 60 + 330);
    });

    setTimeout(() => setDocs(prev => ({ ...prev, [docId]: { ...prev[docId], phase: 'done', score } })),
      defs.length * STEP_MS + 60 + 330 + 300);
  }, []);

  const handleDrop = useCallback((docId: DocId, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDocs(prev => ({ ...prev, [docId]: { ...prev[docId], dragging: false } }));
    const file = e.dataTransfer.files[0];
    if (file) startValidation(docId, file);
  }, [startValidation]);

  const handleRemove = useCallback((docId: DocId) => {
    setDocs(prev => ({ ...prev, [docId]: idle() }));
    if (fileRefs.current[docId]) fileRefs.current[docId]!.value = '';
  }, []);

  const bothDone = docs.salary_cert.phase === 'done' && docs.bank_stmt.phase === 'done';
  const canSubmit = bothDone && consent;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E0D0', padding: '11px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '3px', height: '32px', background: '#C8922A', borderRadius: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1A1A1A' }}>وزارة الطاقة والبنية التحتية</div>
            <div style={{ fontSize: '9px', color: '#C8922A', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ministry of Energy & Infrastructure</div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#00704A' }}>
            <CheckCircle2 size={12} color="#00704A" /> Login
          </span>
          <ChevronRight size={11} color="#CCBBAA" />
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C8922A', background: '#FDF3E3', padding: '3px 9px', borderRadius: '20px', border: '1px solid rgba(200,146,42,0.25)' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C8922A', display: 'inline-block' }} />
            Upload Documents
          </span>
          <ChevronRight size={11} color="#CCBBAA" />
          <span style={{ color: '#BBBBBB' }}>AI Decision</span>
        </div>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F5F0E8', border: '1px solid #E8E0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={13} color="#C8922A" />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1A1A1A' }}>{app.beneficiary.full_name}</div>
              <div style={{ fontSize: '9.5px', color: '#AAAAAA', fontFamily: 'IBM Plex Mono, monospace' }}>{app.beneficiary.emirates_id}</div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#888888', background: 'none', border: '1px solid #E8E0D0', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#CC3333'; e.currentTarget.style.borderColor = 'rgba(204,51,51,0.3)'; e.currentTarget.style.background = '#FEE8E8'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#888888'; e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={11} /> Logout
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, maxWidth: '740px', width: '100%', margin: '0 auto', padding: '28px 24px 40px', display: 'flex', flexDirection: 'column', gap: '18px', boxSizing: 'border-box' }}>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #A7D9BC', borderTop: '3px solid #00704A', borderRadius: '10px', padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: '#00704A', background: '#E8F5EE', padding: '3px 9px', borderRadius: '20px', border: '1px solid #A7D9BC' }}>
              <CheckCircle2 size={11} color="#00704A" /> Profile auto-loaded via UAE PASS
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px' }}>
            {([
              { la: 'المستفيد', le: 'Beneficiary', v: app.beneficiary.full_name, va: app.beneficiary.full_name_ar },
              { la: 'رقم الهوية', le: 'Emirates ID', v: app.beneficiary.emirates_id, mono: true },
              { la: 'رقم الطلب', le: 'Application ID', v: app.application_id, mono: true },
              { la: 'الراتب الشهري', le: 'Monthly Salary', v: `${app.income.current_salary.toLocaleString()} AED`, mono: true },
              { la: 'مبلغ المتأخرات', le: 'Arrears Amount', v: `${app.arrears.overdue_amount.toLocaleString()} AED`, mono: true, red: true },
              { la: 'أشهر التأخر', le: 'Overdue Months', v: `${app.arrears.overdue_months} months`, mono: true },
            ] as { la: string; le: string; v: string; va?: string; mono?: boolean; red?: boolean }[]).map(({ la, le, v, va, mono, red }) => (
              <div key={le}>
                <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#AAAAAA', marginBottom: '1px' }}>{la} · {le}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: red ? '#CC3333' : '#1A1A1A', fontFamily: mono ? 'IBM Plex Mono, monospace' : 'inherit' }}>{v}</div>
                {va && <div dir="rtl" className="arabic" style={{ fontSize: '11px', color: '#888888' }}>{va}</div>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upload section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Shield size={13} color="#C8922A" />
            <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1A1A1A' }}>
              رفع المستندات | Upload Documents
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#AAAAAA' }}>Both required *</span>
          </div>

          {/* 2-col upload zones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {DOCS.map(docConf => {
              const doc = docs[docConf.id];
              return (
                <div key={docConf.id}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                    ref={el => { fileRefs.current[docConf.id] = el; }}
                    data-testid={`upload-${docConf.id}`}
                    onChange={e => { const f = e.target.files?.[0]; if (f) startValidation(docConf.id, f); }}
                  />
                  <div
                    style={{ backgroundColor: '#FFFFFF', border: `1.5px ${doc.dragging ? 'solid #C8922A' : doc.phase === 'done' ? 'solid #A7D9BC' : 'dashed #D0C8BC'}`, borderRadius: '10px', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: doc.dragging ? '0 0 0 3px rgba(200,146,42,0.12)' : 'none', overflow: 'hidden' }}
                    onDragOver={e => { e.preventDefault(); setDocs(prev => ({ ...prev, [docConf.id]: { ...prev[docConf.id], dragging: true } })); }}
                    onDragLeave={() => setDocs(prev => ({ ...prev, [docConf.id]: { ...prev[docConf.id], dragging: false } }))}
                    onDrop={e => handleDrop(docConf.id, e)}
                  >
                    {doc.phase === 'idle' && (
                      <div style={{ padding: '28px 18px', textAlign: 'center', cursor: 'pointer', background: doc.dragging ? '#FDF3E3' : 'transparent', transition: 'background 0.15s' }}
                        onClick={() => fileRefs.current[docConf.id]?.click()}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: doc.dragging ? '#FDF3E3' : '#F5F0E8', border: '1px solid #E8E0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            <Upload size={17} color={doc.dragging ? '#C8922A' : '#AAAAAA'} />
                          </div>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>{docConf.label}</div>
                        <div dir="rtl" className="arabic" style={{ fontSize: '10.5px', color: '#888888', marginBottom: '7px' }}>{docConf.labelAr}</div>
                        <div style={{ fontSize: '10px', color: '#AAAAAA', lineHeight: 1.5 }}>{docConf.hint}</div>
                        <div style={{ marginTop: '10px', fontSize: '10px', color: doc.dragging ? '#C8922A' : '#C8922A', fontWeight: 600 }}>
                          {doc.dragging ? '↓ Drop to upload' : 'Drag & drop  ·  or click to browse'}
                        </div>
                        <div style={{ marginTop: '3px', fontSize: '9px', color: '#BBBBBB' }}>PDF · JPG · PNG</div>
                      </div>
                    )}

                    {doc.phase !== 'idle' && (
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '11px', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            {doc.phase === 'checking' ? <Loader2 size={14} color="#C8922A" className="animate-spin" /> : <CheckCircle2 size={14} color="#00704A" />}
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A' }}>{docConf.label}</div>
                              <div style={{ fontSize: '9.5px', color: '#AAAAAA', fontFamily: 'IBM Plex Mono, monospace', marginTop: '1px' }}>📎 {doc.file?.name ?? ''}</div>
                            </div>
                          </div>
                          <button onClick={() => handleRemove(docConf.id)}
                            style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E8E0D0', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: '#999999', padding: 0, flexShrink: 0, transition: 'all 0.12s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC3333'; e.currentTarget.style.color = '#CC3333'; e.currentTarget.style.background = '#FEE8E8'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#999999'; e.currentTarget.style.background = 'transparent'; }}
                          ><X size={11} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {doc.checks.map(check => (
                            <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <div style={{ width: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {check.status === 'wait'    && <Clock size={11} color="#DDDDDD" />}
                                {check.status === 'running' && <Loader2 size={11} color="#C8922A" className="animate-spin" />}
                                {check.status === 'pass'    && <CheckCircle2 size={11} color="#00704A" />}
                              </div>
                              <span style={{ fontSize: '11.5px', flex: 1, color: check.status === 'wait' ? '#CCCCCC' : '#444444', transition: 'color 0.2s' }}>{check.label}</span>
                              {check.detail && <span style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#00704A' }}>{check.detail}</span>}
                            </div>
                          ))}
                        </div>

                        {doc.phase === 'done' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F0EBE0' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authenticity Score</span>
                              <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace', color: '#00704A' }}>{doc.score}%</span>
                            </div>
                            <div style={{ height: '3px', background: '#EDE8E0', borderRadius: '2px', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${doc.score}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                                style={{ height: '100%', background: '#00704A', borderRadius: '2px' }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Consent + Submit — appears after first file is touched */}
        <AnimatePresence>
          {(docs.salary_cert.phase !== 'idle' || docs.bank_stmt.phase !== 'idle') && (
            <motion.div key="consent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ backgroundColor: '#FFFFFF', border: `1px solid ${consent ? 'rgba(200,146,42,0.35)' : '#E8E0D0'}`, borderTop: `3px solid ${consent ? '#C8922A' : '#E8E0D0'}`, borderRadius: '10px', padding: '15px 18px', transition: 'border-color 0.2s' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                    data-testid="consent-checkbox"
                    style={{ marginTop: '2px', width: '15px', height: '15px', cursor: 'pointer', accentColor: '#C8922A', flexShrink: 0 }}
                  />
                  <div>
                    <p dir="rtl" className="arabic" style={{ fontSize: '13px', color: '#1A1A1A', lineHeight: 1.8, margin: '0 0 5px', fontWeight: 600 }}>
                      أقر بأن جميع المستندات المقدمة صحيحة وأصلية ولم يتم تعديلها أو تزويرها
                    </p>
                    <p style={{ fontSize: '11.5px', color: '#666666', lineHeight: 1.6, margin: 0 }}>
                      I confirm all submitted documents are authentic and have not been altered or fabricated
                    </p>
                  </div>
                </label>
              </div>

              <button onClick={canSubmit ? onSubmit : undefined} disabled={!canSubmit}
                data-testid="submit-btn"
                style={{ width: '100%', height: '54px', backgroundColor: canSubmit ? '#C8922A' : '#D0C8C0', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: canSubmit ? '0 4px 20px rgba(200,146,42,0.28)' : 'none', opacity: canSubmit ? 1 : 0.55, transition: 'background-color 0.15s, opacity 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = '#A67420'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = canSubmit ? '#C8922A' : '#D0C8C0'; }}
              >
                <ArrowRight size={18} />
                تقديم الطلب | Submit Request
              </button>

              {!bothDone && <p style={{ fontSize: '11px', color: '#AAAAAA', textAlign: 'center', margin: 0 }}>Upload both documents to continue</p>}
              {bothDone && !consent && <p style={{ fontSize: '11px', color: '#C8922A', textAlign: 'center', margin: 0 }}>Check the consent declaration above to proceed</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
