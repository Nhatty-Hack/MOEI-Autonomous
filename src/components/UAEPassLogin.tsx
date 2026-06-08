import { useState, useEffect } from 'react';
import { Shield, Loader2, CheckCircle2, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UAEPassLoginProps {
  onAuthenticated: (emiratesId: string) => void;
}

const VERIFICATION_STEPS = [
  'Verifying identity...',
  'Retrieving beneficiary data...',
  'Loading loan records...',
];

export default function UAEPassLogin({ onAuthenticated }: UAEPassLoginProps) {
  const [emiratesId, setEmiratesId] = useState('784-1985-1234567-8');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const stepDuration = 700;
    const timers: ReturnType<typeof setTimeout>[] = [];

    VERIFICATION_STEPS.forEach((_, idx) => {
      timers.push(
        setTimeout(() => {
          setCurrentStep(idx);
        }, idx * stepDuration)
      );
    });

    timers.push(
      setTimeout(() => {
        onAuthenticated(emiratesId);
      }, VERIFICATION_STEPS.length * stepDuration + 300)
    );

    return () => timers.forEach(clearTimeout);
  }, [isLoading, emiratesId, onAuthenticated]);

  const handleAuthenticate = () => {
    if (!emiratesId.trim()) return;
    setIsLoading(true);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* UAE PASS Card */}
        <div className="uaepass-gradient rounded-2xl shadow-2xl overflow-hidden border border-purple-500/20">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/20 mb-5">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">UAE PASS</h1>
            <p className="text-purple-200 text-sm">Unified Digital Identity Platform</p>
          </div>

          {/* Form */}
          <div className="bg-white/5 backdrop-blur-sm px-8 py-8 space-y-6">
            <div>
              <label className="block text-purple-200 text-xs font-semibold uppercase tracking-wider mb-2">
                Emirates ID Number
              </label>
              <input
                type="text"
                value={emiratesId}
                onChange={(e) => setEmiratesId(e.target.value)}
                placeholder="784-XXXX-XXXXXXX-X"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/10 border border-purple-400/30 rounded-lg text-white font-mono text-lg placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all disabled:opacity-50"
              />
              <p className="text-purple-300/60 text-[11px] mt-1.5 font-mono">
                Format: 784-XXXX-XXXXXXX-X
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isLoading ? (
                <motion.button
                  key="auth-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleAuthenticate}
                  disabled={!emiratesId.trim()}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-purple-900/40 text-sm"
                >
                  <Fingerprint className="w-5 h-5" />
                  Authenticate with UAE PASS
                </motion.button>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  {VERIFICATION_STEPS.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.7 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      {currentStep > idx ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : currentStep === idx ? (
                        <Loader2 className="w-4 h-4 text-purple-300 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-purple-400/30 shrink-0" />
                      )}
                      <span
                        className={
                          currentStep >= idx ? 'text-white' : 'text-purple-300/50'
                        }
                      >
                        {step}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-purple-300/50 text-[11px]">
              Demo Mode — Simulated UAE PASS verification
            </p>
          </div>

          {/* Footer attribution */}
          <div className="px-8 py-5 border-t border-purple-500/10 text-center space-y-1">
            <div className="text-purple-200/60 text-[11px] font-semibold tracking-wide">
              Ministry of Energy and Infrastructure
            </div>
            <div className="text-[#C8A84E] text-[10px] font-medium tracking-wider uppercase">
              Sheikh Zayed Housing Programme
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
