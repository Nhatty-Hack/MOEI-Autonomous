import { Shield, Zap, Database, BrainCircuit } from 'lucide-react';

interface HeaderProps {
  applicationCount: number;
}

export default function Header({ applicationCount }: HeaderProps) {
  return (
    <div className="relative">
      {/* Animated gradient top border — MOEI green to gold */}
      <div
        className="h-1"
        style={{
          background: 'linear-gradient(90deg, #00694E, #C8A84E, #00694E)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
        }}
      />
      <style>{`@keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }`}</style>

      <div className="bg-[#1A1A2E] text-slate-50 py-14 px-6 md:px-12 border-b border-[#00694E]/20">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* MOEI Attribution */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00694E]/20 text-emerald-300 font-mono text-xs border border-[#00694E]/30">
              <BrainCircuit className="w-4 h-4" />
              Hybrid Agentic Architecture Active
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">
              <Shield className="w-3 h-3" />
              Ministry of Energy and Infrastructure × 42 Abu Dhabi
            </div>
          </div>

          {/* Programme Name */}
          <div className="space-y-1">
            <div className="text-[#C8A84E] text-sm font-semibold tracking-wide uppercase">
              Sheikh Zayed Housing Programme
            </div>
            <div className="text-slate-500 text-xs font-[family-name:var(--font-arabic)]" dir="rtl">
              برنامج الشيخ زايد للإسكان
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Autonomous Arrears Rescheduling Engine
          </h1>

          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            Sheikh Zayed Housing Programme | Ministry of Energy and Infrastructure × 42 Abu Dhabi
          </p>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-sm">
              <span className="text-indigo-400 font-mono font-bold">{applicationCount}</span>
              <span className="text-slate-400">Applications</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">&lt; 5s Processing</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-sm">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">2,158 Historical Records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
