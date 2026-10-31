"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
  Edit3,
  TrendingUp,
  Tag,
  RotateCcw,
} from "lucide-react";
import { TailoredSuggestion } from "../../lib/ai/aiTypes";

export interface DiffCardProps {
  suggestion: TailoredSuggestion;
  onAccept: (suggestion: TailoredSuggestion, editedText?: string) => void;
  onReject: (suggestionId: string) => void;
  onRestore?: (suggestionId: string) => void;
  isAccepted?: boolean;
  isRejected?: boolean;
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renders suggested text with target keywords dynamically highlighted with emerald badge pills.
 */
function renderHighlightedText(text: string, keywords: string[]): React.ReactNode {
  if (!keywords || keywords.length === 0 || !text) {
    return text;
  }

  // Filter valid keywords and sort by length descending to match longest phrases first
  const validKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .sort((a, b) => b.length - a.length);

  if (validKeywords.length === 0) {
    return text;
  }

  const pattern = `(\\b(?:${validKeywords.map(escapeRegex).join("|")})\\b)`;
  const regex = new RegExp(pattern, "gi");

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isKeyword = validKeywords.some(
      (kw) => kw.toLowerCase() === part.toLowerCase()
    );

    if (isKeyword) {
      return (
        <span
          key={index}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const DiffCard: React.FC<DiffCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  onRestore,
  isAccepted = false,
  isRejected = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.suggestedText);

  const isVerified = suggestion.truthStatus === "verified";
  const deltaEstimate = suggestion.coverageDeltaEstimate ?? 3;

  const handleSaveAndAccept = () => {
    onAccept(suggestion, editedText.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(suggestion.suggestedText);
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-150 space-y-4 relative shadow-sm hover:-translate-y-0.5 ${
        isAccepted
          ? "bg-emerald-50/50 dark:bg-obsidian-900/95 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-glow-emerald"
          : isRejected
          ? "bg-slate-100/50 dark:bg-obsidian-900/40 border-slate-200 dark:border-white/[0.04] opacity-50"
          : "bg-white dark:bg-obsidian-900/90 border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/30 dark:hover:border-white/20"
      }`}
    >
      {/* Header: Section Context Badge & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-obsidian-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
            {suggestion.section}
          </span>
          {suggestion.itemTitle && (
            <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
              {suggestion.itemTitle}
            </span>
          )}
          {suggestion.bulletId && (
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              • ID: {suggestion.bulletId}
            </span>
          )}
        </div>

        {/* Accepted / Rejected Indicator or Status Pill */}
        <div className="flex items-center space-x-2">
          {isAccepted && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Accepted</span>
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
              <X className="w-3 h-3 text-rose-500" />
              <span>Rejected</span>
            </span>
          )}
        </div>
      </div>

      {/* Truth Guard Verification Banner */}
      <div>
        {isVerified ? (
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs shadow-glow-emerald">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold tracking-tight">
              ✓ Grounded in Master Profile
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ml-auto hidden sm:inline">
              Safe to apply
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 shadow-glow-amber">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-semibold tracking-tight">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                ⚠️ Requires Confirmation: Unverified claims detected
              </span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
              ResuArchitect Truth Guard flagged claims or metrics that were not found in your Master Profile. Verify before accepting.
            </p>
            {suggestion.unverifiedClaims && suggestion.unverifiedClaims.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300/90 space-y-0.5 pl-1">
                {suggestion.unverifiedClaims.map((claim, idx) => (
                  <li key={idx} className="font-mono text-[10px]">
                    {claim}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Target Keywords Highlight Pills (if present) */}
      {suggestion.targetKeywords && suggestion.targetKeywords.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono uppercase tracking-wider flex items-center space-x-1">
            <Tag className="w-3 h-3 text-amber-500 dark:text-emerald-400" />
            <span>Target Keywords:</span>
          </span>
          {suggestion.targetKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-amber-50 dark:bg-emerald-500/10 text-amber-800 dark:text-emerald-300 border border-amber-200 dark:border-emerald-500/20"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Before vs After Diff Comparison */}
      <div className="space-y-2 text-xs">
        {/* Original Text (Red/Strikethrough styling) */}
        {suggestion.originalText && (
          <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-red-950/20 border border-rose-200 dark:border-red-900/40 text-stone-700 dark:text-slate-300 font-sans space-y-1">
            <div className="flex items-center text-rose-600 dark:text-red-400 font-mono text-[11px] font-semibold space-x-1">
              <span>- ORIGINAL</span>
            </div>
            <p className="line-through text-stone-500 dark:text-slate-400/90 leading-relaxed">
              {suggestion.originalText}
            </p>
          </div>
        )}

        {/* Proposed Text (Green badge highlights for newly injected keywords) */}
        <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-stone-900 dark:text-slate-100 font-sans space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-semibold">
            <span>+ PROPOSED TAILORING</span>
            {suggestion.explanation && !isEditing && (
              <span className="text-[10px] font-sans text-stone-500 dark:text-slate-400 font-normal italic">
                {suggestion.explanation}
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={3}
                className="w-full text-xs bg-white dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded p-2 text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500 font-sans resize-y leading-relaxed"
                placeholder="Edit bullet point inline..."
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 text-xs text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded transition border border-stone-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndAccept}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Accept (+{deltaEstimate}% Coverage)</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-stone-800 dark:text-slate-200 leading-relaxed pt-0.5">
              {renderHighlightedText(
                isAccepted && editedText ? editedText : suggestion.suggestedText,
                suggestion.targetKeywords || []
              )}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      {!isEditing && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Delta Estimate Badge */}
          <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+{deltaEstimate}% JD Coverage</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isRejected ? (
              onRestore && (
                <button
                  type="button"
                  onClick={() => onRestore(suggestion.id)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded transition border border-stone-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded transition border border-stone-200 dark:border-slate-700"
                  title="Edit suggestion inline before accepting"
                >
                  <Edit3 className="w-3 h-3 text-stone-500 dark:text-slate-400" />
                  <span>✏️ Edit inline</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReject(suggestion.id)}
                  disabled={isAccepted}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded transition border ${
                    isAccepted
                      ? "text-stone-400 dark:text-slate-500 bg-stone-100 dark:bg-slate-900 border-stone-200 dark:border-slate-800 cursor-not-allowed"
                      : "text-stone-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-300 bg-stone-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border-stone-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800/60"
                  }`}
                  title="Reject this suggestion"
                >
                  <X className="w-3 h-3" />
                  <span>✗ Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAccept(suggestion, editedText !== suggestion.suggestedText ? editedText : undefined)}
                  className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded shadow-sm transition border ${
                    isAccepted
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 cursor-default"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                  }`}
                  title="Accept and apply this suggestion to resume"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {isAccepted
                      ? "✓ Accepted"
                      : `✓ Accept (+${deltaEstimate}% Coverage)`}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffCard;
