"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Check,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  optimizeSingleBullet,
  SingleBulletOptimizationResult,
} from "@/lib/ai/singleBulletOptimizer";

export interface BulletOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  roleTitle?: string;
  roleTechnologies?: string[];
  onApply: (optimizedText: string) => void;
}

export const BulletOptimizerModal: React.FC<BulletOptimizerModalProps> = ({
  isOpen,
  onClose,
  originalText,
  roleTitle,
  roleTechnologies = [],
  onApply,
}) => {
  const { resume, jd } = useResumeStore();

  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [result, setResult] = useState<SingleBulletOptimizationResult | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  // Run optimization whenever modal opens or selected keyword changes
  useEffect(() => {
    if (!isOpen || !originalText) return;

    const optResult = optimizeSingleBullet({
      bulletText: originalText,
      roleTitle,
      roleTechnologies,
      candidateResume: resume,
      jdRequirements: jd,
      focusKeyword: selectedKeyword || undefined,
    });

    setResult(optResult);
    setEditedText(optResult.optimizedText);
  }, [isOpen, originalText, roleTitle, roleTechnologies, resume, jd, selectedKeyword]);

  if (!isOpen || !result) return null;

  const handleApply = () => {
    onApply(editedText.trim() || result.optimizedText);
    onClose();
  };

  const handleSelectKeyword = (kw: string) => {
    setSelectedKeyword((prev) => (prev === kw ? "" : kw));
  };

  const isVerified = result.truthStatus === "verified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Single-Bullet Co-Pilot</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google XYZ Formula
                </span>
              </h3>
              {roleTitle && (
                <p className="text-[11px] text-slate-400 truncate max-w-md">
                  Context: <span className="text-slate-300 font-medium">{roleTitle}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Missing JD Keywords to Weave */}
          {result.suggestedJdKeywords.length > 0 && (
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Weave Missing JD Keyword:
                </span>
                <span className="text-[10px] text-slate-500">
                  Click to incorporate into Google XYZ bullet
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.suggestedJdKeywords.map((kw) => {
                  const isSelected = selectedKeyword.toLowerCase() === kw.toLowerCase();
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleSelectKeyword(kw)}
                      className={`text-xs px-2.5 py-1 rounded-md font-mono transition flex items-center space-x-1 ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                          : "bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750"
                      }`}
                    >
                      <span>+ {kw}</span>
                      {isSelected && <Check className="w-3 h-3 text-slate-950" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Google XYZ Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-emerald-400">
                [X] Accomplished
              </div>
              <div className="text-slate-300 text-[11px] leading-tight">
                {result.accomplishedX}
              </div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-cyan-400">
                [Y] Measured By
              </div>
              <div className="text-slate-300 text-[11px] leading-tight">
                {result.measuredY}
              </div>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-purple-400">
                [Z] By Doing / Tech
              </div>
              <div className="text-slate-300 text-[11px] leading-tight">
                {result.byDoingZ}
              </div>
            </div>
          </div>

          {/* Before vs After Side-by-Side Comparison */}
          <div className="space-y-3">
            {/* Before */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-slate-500">
                  Original Bullet
                </span>
                <span className="font-mono text-[10px]">{originalText.length} chars</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-850 text-xs text-slate-400 leading-relaxed font-sans">
                {originalText}
              </div>
            </div>

            {/* Down Arrow separator */}
            <div className="flex justify-center -my-1 text-emerald-400/60">
              <ArrowRight className="w-4 h-4 rotate-90" />
            </div>

            {/* After (Editable) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Optimized Google XYZ (Editable Preview)
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-slate-400">
                    {editedText.length} chars
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    +{result.estimatedCoverageDelta}% Coverage
                  </span>
                </div>
              </div>
              <textarea
                rows={3}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-950 border border-emerald-500/40 text-xs text-slate-100 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>
          </div>

          {/* Truth Guard Badge */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2.5 ${
              isVerified
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : "bg-amber-950/20 border-amber-500/30 text-amber-300"
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-semibold text-[11px]">
                {isVerified
                  ? "Truth Guard Verified — Grounded in Candidate Experience"
                  : "Truth Guard Alert — Requires Candidate Confirmation"}
              </div>
              <p className="text-[11px] opacity-90 leading-tight">
                {result.explanation}
              </p>
              {result.unverifiedClaims.length > 0 && (
                <ul className="list-disc list-inside text-[10px] text-amber-300/90 pt-1">
                  {result.unverifiedClaims.map((claim, idx) => (
                    <li key={idx}>{claim}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setSelectedKeyword("");
              const opt = optimizeSingleBullet({
                bulletText: originalText,
                roleTitle,
                roleTechnologies,
                candidateResume: resume,
                jdRequirements: jd,
              });
              setResult(opt);
              setEditedText(opt.optimizedText);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Variation</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Bullet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulletOptimizerModal;
