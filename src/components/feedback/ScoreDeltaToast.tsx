"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, Sparkles, X, CheckCircle2 } from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { calculateJdCoverage } from "@/lib/scoring/deterministicScorer";

export const ScoreDeltaToast: React.FC = () => {
  const { resume, jd } = useResumeStore();

  const [toast, setToast] = useState<{
    delta: number;
    oldScore: number;
    newScore: number;
    id: number;
  } | null>(null);

  const prevScoreRef = useRef<number | null>(null);
  const isInitialRef = useRef(true);

  // Compute live coverage score deterministically
  const currentScore = useMemo(() => {
    try {
      const report = calculateJdCoverage(resume, jd);
      return Math.round(report.overallScore);
    } catch {
      return 0;
    }
  }, [resume, jd]);

  useEffect(() => {
    // Skip initial mount to prevent showing toast on load
    if (isInitialRef.current) {
      isInitialRef.current = false;
      prevScoreRef.current = currentScore;
      return;
    }

    if (prevScoreRef.current !== null && currentScore > prevScoreRef.current) {
      const delta = currentScore - prevScoreRef.current;
      const oldScore = prevScoreRef.current;
      const newScore = currentScore;

      if (delta > 0) {
        setToast({
          delta,
          oldScore,
          newScore,
          id: Date.now(),
        });
      }
    }

    prevScoreRef.current = currentScore;
  }, [currentScore]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="relative flex items-center space-x-3.5 bg-obsidian-950/95 border border-emerald-500/40 rounded-xl px-4 py-3 shadow-glow-emerald backdrop-blur-xl max-w-sm text-slate-100 ring-1 ring-emerald-500/20">
        {/* Glowing badge icon */}
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
          <TrendingUp className="w-5 h-5 animate-pulse" />
        </div>

        {/* Text information */}
        <div className="min-w-0 pr-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-extrabold text-emerald-300 flex items-center gap-1 font-mono tracking-tight">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              +{toast.delta}% Coverage!
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tabular-nums">
              {toast.oldScore}% ➔ {toast.newScore}%
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate mt-0.5">
            ATS match score increased with targeted bullet keywords.
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setToast(null)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors shrink-0 ml-1"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Bottom progress decay bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-obsidian-800 rounded-b-xl overflow-hidden">
          <div className="h-full bg-emerald-400 animate-[width_4s_linear]" />
        </div>
      </div>
    </div>
  );
};

export default ScoreDeltaToast;
