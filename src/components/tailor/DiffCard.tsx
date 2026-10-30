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
      className={`rounded-xl border p-4 transition duration-200 space-y-3.5 relative ${
        isAccepted
          ? "bg-slate-900/95 border-emerald-500/40 shadow-sm shadow-emerald-950/20"
          : isRejected
          ? "bg-slate-900/40 border-slate-800/80 opacity-60"
          : "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm"
      }`}
    >
      {/* Header: Section Context Badge & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
            {suggestion.section}
          </span>
          {suggestion.itemTitle && (
            <span className="text-xs font-semibold text-slate-200">
              {suggestion.itemTitle}
            </span>
          )}
          {suggestion.bulletId && (
            <span className="text-[10px] font-mono text-slate-500">
              • ID: {suggestion.bulletId}
            </span>
          )}
        </div>

        {/* Accepted / Rejected Indicator or Status Pill */}
        <div className="flex items-center space-x-2">
          {isAccepted && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Accepted</span>
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
              <X className="w-3 h-3 text-red-400" />
              <span>Rejected</span>
            </span>
          )}
        </div>
      </div>

      {/* Truth Guard Verification Banner */}
      <div>
        {isVerified ? (
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-950/25 border border-emerald-800/40 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              ✓ Verified from Master Profile
            </span>
            <span className="text-[11px] text-emerald-400/80 ml-auto hidden sm:inline">
              Safe to apply
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                ⚠️ Requires Confirmation: Unverified claims detected
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              ResuArchitect Truth Guard flagged claims or metrics that were not found in your Master Profile. Verify before accepting.
            </p>
            {suggestion.unverifiedClaims && suggestion.unverifiedClaims.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-amber-300/90 space-y-0.5 pl-1">
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
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center space-x-1">
            <Tag className="w-3 h-3 text-emerald-400" />
            <span>Target Keywords:</span>
          </span>
          {suggestion.targetKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
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
          <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-slate-300 font-sans space-y-1">
            <div className="flex items-center text-red-400 font-mono text-[11px] font-semibold space-x-1">
              <span>- ORIGINAL</span>
            </div>
            <p className="line-through text-slate-400/90 leading-relaxed">
              {suggestion.originalText}
            </p>
          </div>
        )}

        {/* Proposed Text (Green badge highlights for newly injected keywords) */}
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-slate-100 font-sans space-y-1">
          <div className="flex items-center justify-between text-emerald-400 font-mono text-[11px] font-semibold">
            <span>+ PROPOSED TAILORING</span>
            {suggestion.explanation && !isEditing && (
              <span className="text-[10px] font-sans text-slate-400 font-normal italic">
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
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans resize-y leading-relaxed"
                placeholder="Edit bullet point inline..."
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition"
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
            <p className="text-slate-200 leading-relaxed pt-0.5">
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
          <div className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>+{deltaEstimate}% JD Coverage</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isRejected ? (
              onRestore && (
                <button
                  type="button"
                  onClick={() => onRestore(suggestion.id)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition border border-slate-700"
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
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition border border-slate-700"
                  title="Edit suggestion inline before accepting"
                >
                  <Edit3 className="w-3 h-3 text-slate-400" />
                  <span>✏️ Edit inline</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReject(suggestion.id)}
                  disabled={isAccepted}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded transition border ${
                    isAccepted
                      ? "text-slate-500 bg-slate-900 border-slate-800 cursor-not-allowed"
                      : "text-slate-400 hover:text-red-300 bg-slate-800 hover:bg-red-950/40 border-slate-700 hover:border-red-800/60"
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
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default"
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
