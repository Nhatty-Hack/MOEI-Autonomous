import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

const STEPS = [
  { prefix: '[SYS]', color: 'text-slate-500', text: 'Verifying identity via UAE PASS...' },
  { prefix: '[OK]', color: 'text-emerald-500', text: 'Checking for prior active requests...' },
  { prefix: '[SYS]', color: 'text-slate-500', text: 'Validating salary certificate & documents...' },
  { prefix: '[OK]', color: 'text-emerald-500', text: 'Retrieving loan data from SZHP systems...' },
  { prefix: '[LMM]', color: 'text-indigo-400', text: 'Analyzing income & family situation...' },
  { prefix: '[TOOL]', color: 'text-indigo-400', text: 'Calculating rescheduling plan...' },
  { prefix: '[SYS]', color: 'text-slate-500', text: 'Validating 20% deduction rule...' },
  { prefix: '[OK]', color: 'text-emerald-500', text: 'Generating recommendation...' },
];

export default function ProcessingAnimation() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 right-5 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 rounded-full bg-slate-700 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
      </div>

      <h4 className="flex items-center text-emerald-400 font-mono text-sm tracking-widest font-bold mb-6">
        <Activity className="w-4 h-4 mr-2" /> AGENTIC WORKFLOW INITIALIZING...
      </h4>

      <div className="font-mono text-xs md:text-sm text-slate-400 space-y-4 max-w-3xl">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.8 }}
          >
            <span className={`${step.color} mr-2`}>{step.prefix}</span> {step.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
