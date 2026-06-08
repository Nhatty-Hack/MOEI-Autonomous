import { Clock, Zap, Sparkles } from 'lucide-react';

export default function PipelineComparison() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-4">
      {/* Manual 5 Working Days */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400"></div>
        <h3 className="text-rose-700 font-bold mb-6 text-xl tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6" /> Manual Process: 5 Working Days
        </h3>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          The traditional pipeline requiring serial human validations, cross-department coordination, and physical approvals.
        </p>

        <div className="space-y-4 relative border-l-2 border-rose-100 ml-3 pl-6 text-sm text-slate-700 font-medium">
          <div className="relative">
            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-rose-400 border border-white"></span>
            <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Day 1 — Document Review</strong>
            Collect and verify salary certificates, bank statements, and supporting documents manually.
          </div>
          <div className="relative">
            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-rose-400 border border-white"></span>
            <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Day 2 — Data Verification</strong>
            Cross-reference beneficiary data with SZHP systems and external records.
          </div>
          <div className="relative">
            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-rose-400 border border-white"></span>
            <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Day 3 — Financial Study</strong>
            Manual income analysis, obligation ratios, and family situation assessment.
          </div>
          <div className="relative">
            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-rose-400 border border-white"></span>
            <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Day 4 — Capacity Calculation</strong>
            Calculate deduction rates, validate 20% rule, and propose repayment structure.
          </div>
          <div className="relative">
            <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-rose-400 border border-white"></span>
            <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Day 5 — Decision Making</strong>
            Committee review, executive sign-offs, and final notification dispatch.
          </div>
        </div>
      </div>

      {/* AI Agent Pipeline */}
      <div className="bg-slate-900 text-slate-300 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-50">
          <Sparkles className="w-16 h-16 text-indigo-500" strokeWidth={1} />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>

        <h3 className="text-emerald-400 font-bold mb-6 text-xl tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6" /> AI Agent: &lt; 5 Seconds
        </h3>
        <p className="text-slate-400 text-sm mb-6 max-w-sm relative z-10">
          End-to-end autonomous assessment powered by Gemini AI with structured tool-chains and governance constraints.
        </p>

        <div className="space-y-4 relative border-l border-slate-700 ml-3 pl-6 text-sm font-mono tracking-tight z-10">
          <div className="relative">
            <span className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-emerald-400 inline-block w-12 font-bold">[0.5s]</span> UAE PASS identity authentication & beneficiary retrieval.
          </div>
          <div className="relative">
            <span className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-emerald-400 inline-block w-12 font-bold">[1.2s]</span> Automated document validation & stamp verification.
          </div>
          <div className="relative">
            <span className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-emerald-400 inline-block w-12 font-bold">[2.5s]</span> Instant financial calculation & 20% rule validation.
          </div>
          <div className="relative">
            <span className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <span className="text-indigo-400 inline-block w-12 font-bold">[3.8s]</span> AI recommendation with bilingual memo generation.
          </div>
        </div>
      </div>
    </div>
  );
}
