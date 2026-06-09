import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Fingerprint, ArrowLeft, Shield, Zap, Users, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReschedulingApplication } from '../types';

interface UAEPassLoginProps {
  onAuthenticated: (emiratesId: string) => void;
  onBack?: () => void;
  applications: ReschedulingApplication[];
}

const normalizeId = (id: string) => id.replace(/[-\s]/g, '');

const VERIFICATION_STEPS = [
  { en: 'Verifying identity via UAE PASS...', ar: 'جارٍ التحقق من الهوية عبر UAE PASS...' },
  { en: 'Retrieving beneficiary profile...', ar: 'استرداد بيانات المستفيد...' },
  { en: 'Loading loan & arrears records...', ar: 'تحميل سجلات القرض والمتأخرات...' },
];

function UAEFalcon({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 46 52" fill="none" aria-hidden="true">
      <path d="M14 21 C9 15 2 18 2 27 C7 26 12 24 14 27Z" fill="#C8922A" />
      <path d="M14 27 C8 28 4 34 6 40 C10 37 13 32 14 32Z" fill="#C8922A" />
      <path d="M32 21 C37 15 44 18 44 27 C39 26 34 24 32 27Z" fill="#C8922A" />
      <path d="M32 27 C38 28 42 34 40 40 C36 37 33 32 32 32Z" fill="#C8922A" />
      <ellipse cx="23" cy="28" rx="8" ry="11" fill="#C8922A" />
      <circle cx="23" cy="13" r="6.5" fill="#C8922A" />
      <path d="M19.5 16 Q23 22 23 22 Q26.5 22 26.5 16Z" fill="#7A5008" />
      <circle cx="21" cy="11" r="1.4" fill="#1A0A00" />
      <rect x="17.5" y="24" width="11" height="14" rx="1" fill="#FFFFFF" />
      <rect x="17.5" y="24" width="3.2" height="14" fill="#EF3340" />
      <rect x="20.7" y="24"   width="7.8" height="4.7" fill="#00732F" />
      <rect x="20.7" y="28.7" width="7.8" height="4.6" fill="#FFFFFF" />
      <rect x="20.7" y="33.3" width="7.8" height="4.7" fill="#1A1A1A" />
      <line x1="18" y1="39" x2="15" y2="47" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.5" y1="40" x2="19.5" y2="48" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="40" x2="23"  y2="49" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25.5" y1="40" x2="26.5" y2="48" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="39" x2="31" y2="47" stroke="#C8922A" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="11" y="47" width="24" height="5" rx="2" fill="#C8922A" />
    </svg>
  );
}

const OTP_DIGITS = 4;

export default function UAEPassLogin({ onAuthenticated, onBack, applications }: UAEPassLoginProps) {
  const [emiratesId, setEmiratesId] = useState('784-1985-4521458-1');
  const [step, setStep] = useState<'input' | 'otp' | 'connecting' | 'done' | 'not_found'>('input');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [currentVerifyStep, setCurrentVerifyStep] = useState(0);

  const handleConnect = () => { setStep('otp'); };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < OTP_DIGITS - 1) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
    if (next.every(d => d !== '') && idx === OTP_DIGITS - 1) {
      setTimeout(() => setStep('connecting'), 300);
    }
  };

  useEffect(() => {
    if (step !== 'connecting') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    VERIFICATION_STEPS.forEach((_, idx) => {
      timers.push(setTimeout(() => setCurrentVerifyStep(idx), idx * 750));
    });
    timers.push(setTimeout(() => {
      const found = applications.find(
        app =>
          app.beneficiary.emirates_id === emiratesId ||
          normalizeId(app.beneficiary.emirates_id) === normalizeId(emiratesId)
      );
      if (found) {
        onAuthenticated(emiratesId);
      } else {
        setStep('not_found');
      }
    }, VERIFICATION_STEPS.length * 750 + 400));
    return () => timers.forEach(clearTimeout);
  }, [step, emiratesId, onAuthenticated, applications]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFFFF' }}>

      {/* ── Left panel: MOEI branding ─────────────────────────────── */}
      <div style={{ width: '420px', flexShrink: 0, background: '#F5F0E8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0', position: 'relative', overflow: 'hidden', borderRight: '1px solid #E8E0D0' }}>
        {/* Gold top bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #C8922A 0%, #E8B44A 60%, #C8922A 100%)', flexShrink: 0 }} />

        {/* Subtle gold pattern overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(200,146,42,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(200,146,42,0.06) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ padding: '44px 44px 0', position: 'relative' }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <img
              src="/logo/logo.png"
              alt="Ministry of Energy & Infrastructure"
              style={{ maxHeight: '48px', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', marginBottom: '8px' }}
            />
            <div>
              <div dir="rtl" style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'Segoe UI, Tahoma, sans-serif', lineHeight: 1.3 }}>وزارة الطاقة والبنية التحتية</div>
              <div style={{ fontSize: '10px', color: '#C8922A', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px', fontWeight: 600 }}>Arrears Portal</div>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3, margin: '0 0 10px' }}>Sheikh Zayed Housing Programme</h2>
            <p dir="rtl" className="arabic" style={{ fontSize: '14px', color: '#888888', margin: 0 }}>برنامج الشيخ زايد للإسكان</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: Zap,    label: '2.7 seconds',  sub: 'avg processing time' },
              { icon: Shield, label: '98% compliance', sub: 'governance score' },
              { icon: Users,  label: 'AI-powered',   sub: '6-step agent pipeline' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E8E0D0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(200,146,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="#C8922A" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#888888', marginTop: '1px' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 44px 40px', position: 'relative' }}>
          <div style={{ height: '1px', backgroundColor: '#E8E0D0', marginBottom: '16px' }} />
          <div style={{ fontSize: '11px', color: '#AAAAAA', lineHeight: 1.6 }}>
            Ministry of Energy &amp; Infrastructure<br />
            United Arab Emirates Government
          </div>
        </div>
      </div>

      {/* ── Right panel: login card ───────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E8', padding: '40px 24px', position: 'relative' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#888888', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontFamily: 'inherit' }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #E8E0D0' }}>
            {/* Gold stripe */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #C8922A, #E8B44A)' }} />

            {/* Header */}
            <div style={{ padding: '28px 32px 22px', textAlign: 'center', borderBottom: '1px solid #F0EBE0', backgroundColor: '#FDFCFA' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0057A8, #003A75)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,87,168,0.25)' }}>
                  <Fingerprint size={28} color="#FFFFFF" />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.01em' }}>UAE PASS</div>
              <div dir="rtl" className="arabic" style={{ fontSize: '13px', color: '#888888', marginTop: '3px' }}>تسجيل الدخول الرقمي الحكومي</div>
            </div>

            {/* Body */}
            <div style={{ padding: '28px 32px' }}>
              <AnimatePresence mode="wait">

                {/* Step 1: Emirates ID */}
                {step === 'input' && (
                  <motion.div key="input" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888888', marginBottom: '8px' }}>
                      Emirates ID — رقم الهوية
                    </label>
                    <input
                      type="text"
                      value={emiratesId}
                      onChange={e => setEmiratesId(e.target.value)}
                      placeholder="784-XXXX-XXXXXXX-X"
                      style={{ width: '100%', height: '50px', padding: '0 16px', border: '1.5px solid #E8E0D0', borderRadius: '10px', fontSize: '15px', fontFamily: 'IBM Plex Mono, Courier New, monospace', color: '#1A1A1A', backgroundColor: '#FAFAF8', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                      onFocus={e => (e.target.style.borderColor = '#C8922A')}
                      onBlur={e => (e.target.style.borderColor = '#E8E0D0')}
                    />
                    <div style={{ fontSize: '10.5px', color: '#AAAAAA', marginTop: '5px', fontFamily: 'IBM Plex Mono, monospace' }}>Format: 784-XXXX-XXXXXXX-X</div>
                    <button
                      onClick={handleConnect}
                      disabled={!emiratesId.trim()}
                      style={{ width: '100%', height: '52px', marginTop: '20px', backgroundColor: emiratesId.trim() ? '#0057A8' : '#E8E0D0', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', cursor: emiratesId.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background-color 0.15s' }}
                      onMouseEnter={e => { if (emiratesId.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#003A75'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = emiratesId.trim() ? '#0057A8' : '#E8E0D0'; }}
                    >
                      <Fingerprint size={18} />
                      Continue with UAE PASS
                    </button>
                  </motion.div>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Enter OTP</div>
                      <div style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>A 4-digit code was sent to your registered mobile</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          style={{ width: '60px', height: '64px', textAlign: 'center', fontSize: '24px', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', border: `2px solid ${d ? '#C8922A' : '#E8E0D0'}`, borderRadius: '10px', outline: 'none', color: '#1A1A1A', backgroundColor: d ? '#FDF3E3' : '#FAFAF8', transition: 'border-color 0.15s, background-color 0.15s' }}
                          onFocus={e => (e.target.style.borderColor = '#C8922A')}
                          onBlur={e => (e.target.style.borderColor = d ? '#C8922A' : '#E8E0D0')}
                        />
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#AAAAAA' }}>
                      Demo: type any 4 digits to proceed
                    </div>
                    <button
                      onClick={() => setStep('input')}
                      style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'none', border: 'none', color: '#888888', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ← Change Emirates ID
                    </button>
                  </motion.div>
                )}

                {/* Step 3: Connecting */}
                {step === 'connecting' && (
                  <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>Connecting to Government Systems</div>
                      <div dir="rtl" className="arabic" style={{ fontSize: '11.5px', color: '#888888', marginTop: '3px' }}>الاتصال بالأنظمة الحكومية...</div>
                    </div>
                    {VERIFICATION_STEPS.map((vs, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.75 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: idx < VERIFICATION_STEPS.length - 1 ? '1px solid #F0EBE0' : 'none' }}
                      >
                        <div style={{ marginTop: '1px', flexShrink: 0 }}>
                          {currentVerifyStep > idx
                            ? <CheckCircle2 size={16} color="#00704A" />
                            : currentVerifyStep === idx
                              ? <Loader2 size={16} color="#0057A8" className="animate-spin" />
                              : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #E8E0D0' }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: currentVerifyStep >= idx ? '#1A1A1A' : '#AAAAAA', fontWeight: currentVerifyStep >= idx ? 500 : 400 }}>{vs.en}</div>
                          {currentVerifyStep >= idx && <div dir="rtl" className="arabic" style={{ fontSize: '11px', color: '#888888', marginTop: '1px' }}>{vs.ar}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Step 4: Not Found */}
                {step === 'not_found' && (
                  <motion.div key="not_found" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                    <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE8E8', border: '1px solid rgba(204,51,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <AlertCircle size={26} color="#CC3333" />
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>Emirates ID Not Found</div>
                      <div dir="rtl" className="arabic" style={{ fontSize: '12px', color: '#888888', marginBottom: '14px' }}>لم يتم العثور على هذه الهوية الإماراتية</div>
                      <div style={{ background: '#FAF7F2', border: '1px solid #E8E0D0', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', textAlign: 'left' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Searched for</div>
                        <div style={{ fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace', color: '#CC3333', fontWeight: 600 }}>{emiratesId}</div>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#666666', lineHeight: 1.6, margin: '0 0 20px' }}>
                        No active application was found for this Emirates ID. Please check the number and try again.
                      </p>
                      <button
                        onClick={() => { setStep('input'); setOtp(['', '', '', '']); }}
                        style={{ width: '100%', height: '48px', backgroundColor: '#C8922A', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A67420')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8922A')}
                      >
                        ← Try a Different Emirates ID
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 32px', backgroundColor: '#FDFCFA', borderTop: '1px solid #F0EBE0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#AAAAAA' }}>
                <span style={{ fontWeight: 600 }}>Demo Mode</span> — Simulated UAE PASS Authentication
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
