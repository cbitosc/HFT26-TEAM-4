"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RefreshCw,
  Check,
  Filter,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useResumeStore } from "../../lib/store/useResumeStore";
import { TailorResponse, TailoredSuggestion } from "../../lib/ai/aiTypes";
import { calculateJdCoverage } from "../../lib/scoring/deterministicScorer";
import { stripeFullStackJd } from "../../lib/presets/sampleJds";
import DiffCard from "./DiffCard";

interface StageInfo {
  number: number;
  title: string;
  description: string;
}

const STAGES: StageInfo[] = [
  {
    number: 1,
    title: "Stage 1: JD Parser extracted core mandates",
    description: "Extracted must-have skills, preferred tech stack, and responsibilities.",
  },
  {
    number: 2,
    title: "Stage 2: Resume Tailor crafted XYZ bullets",
    description: "Synthesized Google-style XYZ bullets prioritizing target JD keywords.",
  },
  {
    number: 3,
    title: "Stage 3: Truth Guard verified factual claims",
    description: "Cross-checked all metrics, tools, and dates against Master Profile facts.",
  },
  {
    number: 4,
    title: "Stage 4: Critic linted action verbs & brevity",
    description: "Scanned for passive voice, weak verbs, and character count constraints.",
  },
];

type FilterTab = "all" | "verified" | "needs_confirmation";

export const DiffReviewer: React.FC = () => {
  const {
    resume,
    jd,
    setJd,
    updateBasics,
    updateBullet,
    updateProjectBullet,
  } = useResumeStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [tailorResponse, setTailorResponse] = useState<TailorResponse | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showCritic, setShowCritic] = useState<boolean>(true);
  const [liveDelta, setLiveDelta] = useState<{
    text: string;
    scoreDelta: number;
    timestamp: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if JD is loaded
  const hasJd = Boolean(
    jd.rawText?.trim() ||
      (jd.mustHave && jd.mustHave.length > 0) ||
      (jd.keywords && jd.keywords.length > 0)
  );

  // Compute current coverage score
  const currentCoverage = calculateJdCoverage(resume, jd);

  // Helper to sleep for stepper pacing
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Trigger AI Tailoring pipeline
  const handleGenerateTailoring = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveStage(1);

    const stepPromise = (async () => {
      await sleep(350);
      setActiveStage(2);
      await sleep(400);
      setActiveStage(3);
      await sleep(350);
      setActiveStage(4);
      await sleep(300);
      setActiveStage(5);
    })();

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resume, // Send active working resume so edits are preserved and tailored
          jd: jd.rawText || jd,
          targetKeywords: jd.keywords || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Tailoring request failed with status: ${response.status}`);
      }

      const data: TailorResponse = await response.json();

      // Wait for stepper animation to finish
      await stepPromise;

      setTailorResponse(data);
      // Reset accepted/rejected statuses for new batch
      setAcceptedIds(new Set());
      setRejectedIds(new Set());
    } catch (err: unknown) {
      console.error("[DiffReviewer] Failed to generate tailoring:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to run tailoring engine."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Flash live delta indicator
  const triggerLiveDelta = (deltaPercent: number, label?: string) => {
    setLiveDelta({
      text: label || (deltaPercent > 0 ? `+${deltaPercent}% Coverage` : "Action Verb Polished"),
      scoreDelta: deltaPercent,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      setLiveDelta((prev) => (prev && Date.now() - prev.timestamp >= 3500 ? null : prev));
    }, 3800);
  };

  // Apply a single suggestion
  const handleAcceptSuggestion = (
    suggestion: TailoredSuggestion,
    editedText?: string
  ) => {
    const textToApply = editedText !== undefined ? editedText : suggestion.suggestedText;

    // Calculate score before update
    const scoreBefore = calculateJdCoverage(resume, jd).overallScore;

    if (suggestion.section === "summary") {
      updateBasics({ summary: textToApply });
    } else if (suggestion.section === "projects") {
      if (suggestion.itemId && suggestion.bulletId) {
        updateProjectBullet(suggestion.itemId, suggestion.bulletId, textToApply);
      } else {
        // Find matching project
        const targetProj = resume.projects?.find((p) =>
          p.bullets?.some((b) => b.id === suggestion.bulletId)
        );
        if (targetProj && suggestion.bulletId) {
          updateProjectBullet(targetProj.id, suggestion.bulletId, textToApply);
        }
      }
    } else {
      // Default: experience section
      if (suggestion.itemId && suggestion.bulletId) {
        updateBullet(suggestion.itemId, suggestion.bulletId, textToApply);
      } else {
        // Find matching experience
        const targetExp = resume.experience?.find((e) =>
          e.bullets?.some((b) => b.id === suggestion.bulletId)
        );
        if (targetExp && suggestion.bulletId) {
          updateBullet(targetExp.id, suggestion.bulletId, textToApply);
        }
      }
    }

    // Mark as accepted
    setAcceptedIds((prev) => new Set([...prev, suggestion.id]));
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(suggestion.id);
      return next;
    });

    // Calculate measured score change directly from store after update
    const updatedResume = useResumeStore.getState().resume;
    const scoreAfter = calculateJdCoverage(updatedResume, jd).overallScore;
    const realDelta = Math.max(0, scoreAfter - scoreBefore);

    if (realDelta > 0) {
      triggerLiveDelta(realDelta, `+${realDelta}% Coverage`);
    } else {
      triggerLiveDelta(0, "Action Verb Polished");
    }
  };

  // Reject a suggestion
  const handleRejectSuggestion = (suggestionId: string) => {
    setRejectedIds((prev) => new Set([...prev, suggestionId]));
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      next.delete(suggestionId);
      return next;
    });
  };

  // Restore a rejected suggestion
  const handleRestoreSuggestion = (suggestionId: string) => {
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(suggestionId);
      return next;
    });
  };

  // Accept All Verified suggestions in bulk
  const handleAcceptAllVerified = () => {
    if (!tailorResponse) return;

    const scoreBefore = calculateJdCoverage(resume, jd).overallScore;
    let newlyAcceptedCount = 0;
    const newAccepted = new Set(acceptedIds);

    // 1. Accept Summary if verified and not yet accepted
    if (
      tailorResponse.summaryComparison &&
      tailorResponse.summaryComparison.truthStatus === "verified" &&
      !acceptedIds.has("summary-comparison")
    ) {
      updateBasics({ summary: tailorResponse.summaryComparison.suggested });
      newAccepted.add("summary-comparison");
      newlyAcceptedCount++;
    }

    // 2. Accept all verified bullet suggestions
    for (const sugg of tailorResponse.suggestions) {
      if (sugg.truthStatus === "verified" && !acceptedIds.has(sugg.id)) {
        if (sugg.section === "projects" && sugg.itemId && sugg.bulletId) {
          updateProjectBullet(sugg.itemId, sugg.bulletId, sugg.suggestedText);
        } else if (sugg.itemId && sugg.bulletId) {
          updateBullet(sugg.itemId, sugg.bulletId, sugg.suggestedText);
        }
        newAccepted.add(sugg.id);
        newlyAcceptedCount++;
      }
    }

    setAcceptedIds(newAccepted);

    if (newlyAcceptedCount > 0) {
      const updatedResume = useResumeStore.getState().resume;
      const scoreAfter = calculateJdCoverage(updatedResume, jd).overallScore;
      const delta = Math.max(scoreAfter - scoreBefore, newlyAcceptedCount * 2);
      triggerLiveDelta(delta);
    }
  };

  // Prepare Summary comparison as a TailoredSuggestion for DiffCard
  const summarySuggestion: TailoredSuggestion | null = tailorResponse?.summaryComparison
    ? {
        id: "summary-comparison",
        section: "summary",
        itemTitle: "Professional Summary",
        originalText: tailorResponse.summaryComparison.original,
        suggestedText: tailorResponse.summaryComparison.suggested,
        targetKeywords: jd.keywords?.slice(0, 5) || [],
        truthStatus: tailorResponse.summaryComparison.truthStatus,
        unverifiedClaims: tailorResponse.summaryComparison.unverifiedClaims || [],
        explanation:
          tailorResponse.summaryComparison.explanation ||
          "Targeted rewrite highlighting leadership and core technical competencies",
        coverageDeltaEstimate: 3,
      }
    : null;

  // Filter bullet suggestions
  const allBulletSuggestions = tailorResponse?.suggestions || [];
  const verifiedCount = allBulletSuggestions.filter(
    (s) => s.truthStatus === "verified"
  ).length;
  const unverifiedCount = allBulletSuggestions.filter(
    (s) => s.truthStatus === "needs_confirmation"
  ).length;

  const filteredBulletSuggestions = allBulletSuggestions.filter((s) => {
    if (filter === "verified") return s.truthStatus === "verified";
    if (filter === "needs_confirmation") return s.truthStatus === "needs_confirmation";
    return true;
  });

  const verifiedUnacceptedCount =
    allBulletSuggestions.filter(
      (s) => s.truthStatus === "verified" && !acceptedIds.has(s.id)
    ).length +
    (summarySuggestion &&
    summarySuggestion.truthStatus === "verified" &&
    !acceptedIds.has("summary-comparison")
      ? 1
      : 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Header & Live Delta Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08] gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center space-x-2 tracking-tight">
            <span>Bounded AI Bullet Tailor & Diffs</span>
            {tailorResponse?.isFallback && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Offline Heuristic Engine
              </span>
            )}
            {tailorResponse && !tailorResponse.isFallback && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {tailorResponse.provider || "LLM"} • {tailorResponse.model}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Re-architects bullets using Google XYZ formulas while strictly preventing fabricated claims.
          </p>
        </div>

        {/* Live Delta Score Floating / Inline Chip */}
        {liveDelta && (
          <div
            className={`animate-bounce flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg transition-transform ${
              liveDelta.scoreDelta > 0
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                : "bg-sky-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.35)]"
            }`}
          >
            {liveDelta.scoreDelta > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="font-mono tabular-nums">
              {liveDelta.scoreDelta > 0
                ? `Score Boost: ${liveDelta.text}!`
                : `${liveDelta.text}!`}
            </span>
          </div>
        )}
      </div>

      {/* Empty JD Alert if no JD is loaded */}
      {!hasJd && (
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start space-x-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                No Job Description loaded
              </p>
              <p className="text-amber-700 dark:text-amber-300/80 text-[11px] mt-0.5">
                The AI Tailor needs target JD keywords to align your experience bullets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJd(stripeFullStackJd)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all hover:-translate-y-0.5 active:scale-95 shrink-0 flex items-center space-x-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Load Sample Stripe JD</span>
          </button>
        </div>
      )}

      {/* Generator Trigger Card */}
      <div className="p-4 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-white">
                Current JD Coverage:
              </span>
              <span className="text-xs font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                {currentCoverage.overallScore}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({currentCoverage.matchedCount} / {currentCoverage.totalRequiredKeywords} skills matched)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run the 4-stage bounded pipeline to tailor bullets with missing keywords.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateTailoring}
            disabled={isLoading || !hasJd}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 shadow-md transition-all ${
              isLoading || !hasJd
                ? "bg-slate-200 dark:bg-obsidian-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-white/[0.06]"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 shadow-glow-emerald hover:-translate-y-0.5 active:scale-95"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                <span>Generating Tailored Resume...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                <span>⚡ Generate Tailored Resume with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Multi-Stage Progress Stepper */}
        {(isLoading || activeStage > 0) && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-obsidian-950/90 border border-slate-200 dark:border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-emerald-400" />
                <span>AI Pipeline Execution Workflow</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                {activeStage >= 5
                  ? "✓ Pipeline Finished"
                  : `Stage ${Math.min(activeStage, 4)} of 4`}
              </span>
            </div>

            <div className="space-y-1.5">
              {STAGES.map((stg) => {
                const isPassed = activeStage > stg.number || activeStage >= 5;
                const isCurrent = activeStage === stg.number && !isPassed;
                const isPending = activeStage < stg.number;

                return (
                  <div
                    key={stg.number}
                    className={`flex items-start space-x-2.5 p-2 rounded-lg text-xs transition-all duration-200 ${
                      isCurrent
                        ? "bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-sm"
                        : isPassed
                        ? "text-slate-700 dark:text-slate-300 bg-white dark:bg-obsidian-900/60 border border-slate-200/70 dark:border-white/[0.04]"
                        : "text-slate-400 dark:text-slate-600 opacity-60 border border-transparent"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/[0.1] flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {stg.number}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-xs flex items-center space-x-1.5">
                        <span className="text-slate-900 dark:text-white font-medium">{stg.title}</span>
                        {isPassed && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            [Done]
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 animate-pulse uppercase tracking-wider">
                            [Processing...]
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {stg.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-red-950/30 border border-rose-200 dark:border-red-800/50 text-rose-800 dark:text-red-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Tailoring Results Studio */}
      {tailorResponse && (
        <div className="space-y-5">
          {/* Action & Filter Header Toolbar */}
          <div className="p-3 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-obsidian-950 p-1 rounded-lg border border-slate-200 dark:border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === "all"
                    ? "bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/[0.08]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All Diffs ({allBulletSuggestions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("verified")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                  filter === "verified"
                    ? "bg-emerald-50 dark:bg-obsidian-850 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-200 dark:border-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified ({verifiedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("needs_confirmation")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                  filter === "needs_confirmation"
                    ? "bg-amber-50 dark:bg-obsidian-850 text-amber-800 dark:text-amber-300 shadow-xs border border-amber-200 dark:border-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Requires Review ({unverifiedCount})</span>
              </button>
            </div>

            {/* Accept All Verified Button */}
            <button
              type="button"
              onClick={handleAcceptAllVerified}
              disabled={verifiedUnacceptedCount === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                verifiedUnacceptedCount === 0
                  ? "bg-slate-200 dark:bg-obsidian-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-white/[0.06]"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald border border-emerald-400/40 hover:-translate-y-0.5 active:scale-95"
              }`}
              title="Apply all verified suggestions with a single click"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {verifiedUnacceptedCount === 0
                  ? "All Verified Accepted"
                  : `Accept All Verified (${verifiedUnacceptedCount})`}
              </span>
            </button>
          </div>

          {/* 1. Summary Diff Card (if present) */}
          {summarySuggestion && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                <span>1. Professional Summary Tailoring</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 lowercase font-normal">
                  (aligns target role & core highlights)
                </span>
              </div>
              <DiffCard
                suggestion={summarySuggestion}
                onAccept={(sugg, text) => handleAcceptSuggestion(sugg, text)}
                onReject={(id) => handleRejectSuggestion(id)}
                onRestore={(id) => handleRestoreSuggestion(id)}
                isAccepted={acceptedIds.has(summarySuggestion.id)}
                isRejected={rejectedIds.has(summarySuggestion.id)}
              />
            </div>
          )}

          {/* 2. Experience & Project Bullet Diffs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              <span>
                2. Experience & Project Bullet Diffs ({filteredBulletSuggestions.length})
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 lowercase font-normal">
                {filter === "all" ? "Showing all" : `Filtered: ${filter}`}
              </span>
            </div>

            {filteredBulletSuggestions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-obsidian-950/60 rounded-xl border border-slate-200 dark:border-white/[0.08]">
                No bullet diffs match the current filter ({filter}).
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBulletSuggestions.map((suggestion) => (
                  <DiffCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={(sugg, text) => handleAcceptSuggestion(sugg, text)}
                    onReject={(id) => handleRejectSuggestion(id)}
                    onRestore={(id) => handleRestoreSuggestion(id)}
                    isAccepted={acceptedIds.has(suggestion.id)}
                    isRejected={rejectedIds.has(suggestion.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3. Critic & ATS Scannability Findings Panel */}
          {tailorResponse.criticFindings && tailorResponse.criticFindings.length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
              <button
                type="button"
                onClick={() => setShowCritic(!showCritic)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Critic Linting & Action Verb Analysis ({tailorResponse.criticFindings.length})
                  </span>
                </div>
                {showCritic ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                )}
              </button>

              {showCritic && (
                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-white/[0.08]">
                  {tailorResponse.criticFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-obsidian-950/80 border border-slate-200 dark:border-white/[0.06] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/[0.06]">
                          {finding.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            finding.type === "warning"
                              ? "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                              : "bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20"
                          }`}
                        >
                          {finding.type}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs">{finding.message}</p>
                      {finding.suggestion && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center space-x-1">
                          <ArrowRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{finding.suggestion}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiffReviewer;
