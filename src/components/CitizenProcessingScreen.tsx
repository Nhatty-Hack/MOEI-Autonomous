import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Activity, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { ReschedulingApplication, AgentRecommendation } from '../types';

const STEPS = [
  { en: 'Verifying identity via UAE PASS',         ar: 'التحقق من الهوية عبر UAE PASS'             },
  { en: 'Checking for prior active requests',      ar: 'التحقق من الطلبات النشطة المسبقة'           },
  { en: 'Validating submitted documents',          ar: 'التحقق من المستندات المقدمة'                },
  { en: 'Retrieving loan data from SZHP',          ar: 'استرداد بيانات القرض من برنامج الإسكان'     },
  { en: 'Analysing income & family situation',     ar: 'تحليل الدخل والوضع الأسري'                  },
  { en: 'Calculating rescheduling plan',           ar: 'احتساب خطة إعادة الجدولة'                   },
  { en: 'Validating 20% deduction rule',           ar: 'التحقق من قاعدة الاستقطاع ٢٠٪'              },
  { en: 'Generating official recommendation',      ar: 'إصدار التوصية الرسمية'                      },
];

const STEP_DELAY = 620; // ms per step

interface Props {
  application: ReschedulingApplication;
  onComplete: (rec: AgentRecommendation) => void;
}

export default function CitizenProcessingScreen({ application, onComplete }: Props) {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [apiResult, setApiResult] = useState<AgentRecommendation | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  // API call — agent endpoint with deterministic fallback
  useEffect(() => {
    const ctrl = new AbortController();
    const tryFallback = () =>
      fetch(`/api/assess/${application.application_id}`, { method: 'POST', signal: ctrl.signal })
        .then(r => r.json())
        .then(d => { if (!ctrl.signal.aborted) setApiResult(d.data as AgentRecommendation); })
        .catch(() => {});

    fetch(`/api/agent-assess/${application.application_id}`, { method: 'POST', signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject('bad'))
      .then(d => { if (!ctrl.signal.aborted) setApiResult(d.data as AgentRecommendation); })
      .catch(() => { if (!ctrl.signal.aborted) tryFallback(); });

    // Hard timeout: if API never responds, fall back after 25s
    const timeout = setTimeout(tryFallback, 25000);
    return () => { ctrl.abort(); clearTimeout(timeout); };
  }, [application.application_id]);

  // Step animation
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setCompletedSteps(i + 1), (i + 1) * STEP_DELAY));
    });
    timers.push(setTimeout(() => setAnimDone(true), STEPS.length * STEP_DELAY + 500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Transition when both animation and API are ready
  useEffect(() => {
    if (!animDone || !apiResult) return;
    const t = setTimeout(() => onCompleteRef.current(apiResult), 650);
    return () => clearTimeout(t);
  }, [animDone, apiResult]);

  const pct = Math.round((completedSteps / STEPS.length) * 100);
  const isDone = animDone && !!apiResult;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32 }}
        style={{ width: '100%', maxWidth: '560px' }}
      >
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0D0', borderTop: `4px solid ${isDone ? '#00704A' : '#C8922A'}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.09)', transition: 'border-top-color 0.4s' }}>

          {/* Header */}
          <div style={{ backgroundColor: '#FDFCFA', borderBottom: '1px solid #F0EBE0', padding: '20px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: isDone ? '#E8F5EE' : '#FDF3E3', border: `1px solid ${isDone ? '#A7D9BC' : 'rgba(200,146,42,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s' }}>
                {isDone
                  ? <CheckCircle2 size={20} color="#00704A" />
                  : <Activity size={20} color="#C8922A" />
                }
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
                  {isDone ? 'Decision Ready' : 'AI Agent Processing'}
                </div>
                <div dir="rtl" className="arabic" style={{ fontSize: '12px', color: '#888888' }}>
                  {isDone ? 'التوصية جاهزة' : 'جارٍ معالجة طلبك بالذكاء الاصطناعي...'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '10.5px' }}>
              <span style={{ color: '#AAAAAA' }}>
                Application:&nbsp;<span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#555555' }}>{application.application_id}</span>
              </span>
              <span style={{ color: '#AAAAAA' }}>
                Applicant:&nbsp;<span style={{ fontWeight: 600, color: '#555555' }}>{application.beneficiary.full_name}</span>
              </span>
            </div>
          </div>

          {/* Steps list */}
          <div style={{ padding: '20px 26px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
              {STEPS.map((step, i) => {
                const done    = completedSteps > i;
                const running = completedSteps === i && !animDone;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: done || running ? 1 : 0.32, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 9px', borderRadius: '7px', background: done ? '#F5FBF7' : running ? '#FDF9F2' : 'transparent', transition: 'background 0.3s' }}
                  >
                    <div style={{ width: '15px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {done    && <CheckCircle2 size={14} color="#00704A" />}
                      {running && <Loader2 size={14} color="#C8922A" className="animate-spin" />}
                      {!done && !running && <div style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1.5px solid #DDDDDD' }} />}
                    </div>
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: done ? 600 : 400, color: done ? '#1A1A1A' : running ? '#C8922A' : '#AAAAAA', fontFamily: 'IBM Plex Mono, monospace', transition: 'color 0.2s' }}>
                      {step.en}
                    </span>
                    {done && (
                      <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ fontSize: '10px', fontWeight: 700, color: '#00704A', background: '#E8F5EE', padding: '2px 7px', borderRadius: '10px' }}
                      >✓</motion.span>
                    )}
                    {running && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#C8922A', fontFamily: 'IBM Plex Mono, monospace' }}>running…</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div style={{ paddingBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isDone ? 'Complete — جاهز' : 'Processing — جارٍ المعالجة'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: isDone ? '#00704A' : '#C8922A' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: '5px', background: '#EDE8E0', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ height: '100%', background: isDone ? '#00704A' : '#C8922A', borderRadius: '3px', transition: 'background 0.4s' }}
                />
              </div>
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Zap size={10} color="#BBBBBB" />
                <span style={{ fontSize: '10px', color: '#BBBBBB', fontFamily: 'IBM Plex Mono, monospace' }}>MOEI AI Agent v2.0 · 8-step pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
