import React from "react";
import {
  FileText,
  Sparkles,
  Cpu,
  CheckCircle2,
  Layers,
  Download,
  ShieldCheck,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">ResuArchitect</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Tailored Resume Architect & Interactive Editor</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
            TEAM-4 • Red flowers
          </span>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-700/40 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Phase 1 Initialized</span>
          </div>
        </div>
      </header>

      {/* Hero / Shell Content */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy-First • Local-First Storage • Deterministic Matching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Craft ATS-Optimized Resumes with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Deterministic Precision
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            ResuArchitect AI bridges the gap between candidate master profiles and target job
            descriptions. Instant JD match scoring, keyword gap analysis, hallucination-guarded AI
            refinement, and pixel-perfect dual exports to PDF and DOCX.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">
              Deterministic JD Coverage
            </h3>
            <p className="text-sm text-slate-400">
              Under-5ms browser match scoring with 400+ tech alias taxonomy and weighted bullet
              evidence. Zero LLM hallucinations.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">
              Live A4 Canvas & Robot View
            </h3>
            <p className="text-sm text-slate-400">
              60 FPS live preview with multi-theme customizer, typography controls, and 1-click ATS
              Robot text linearization inspector.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">
              Dual ATS Export Engine
            </h3>
            <p className="text-sm text-slate-400">
              Authentic OpenXML `.docx` generation with standard headings and native browser vector
              print PDF styling with zero margins.
            </p>
          </div>
        </div>

        {/* Architecture Status Checklist */}
        <div className="mt-10 p-6 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-white text-sm tracking-wide uppercase">
                System Status & Phase Checklist
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">CBIT Hacktoberfest &apos;26</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Next.js 14 App Router</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tailwind CSS & Design Tokens</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zustand + Zod Validation</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Print Stylesheet Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        ResuArchitect AI • Team Red flowers (TEAM-4) • Hacktoberfest 2026
      </footer>
    </main>
  );
}
