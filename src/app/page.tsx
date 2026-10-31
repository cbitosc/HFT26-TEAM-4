"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/navbar/Header";
import EditorTabs from "@/components/editor/EditorTabs";
import ResumeCanvas from "@/components/preview/ResumeCanvas";
import AtsRobotView from "@/components/preview/AtsRobotView";
import FormAutoFillView from "@/components/form/FormAutoFillView";
import ScoreDeltaToast from "@/components/feedback/ScoreDeltaToast";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  FileText,
  Bot,
  Edit3,
  Eye,
  GripVertical,
  RotateCcw,
  Zap,
} from "lucide-react";

export type PreviewMode = "canvas" | "ats-robot" | "form-fill";
export type MobileTab = "editor" | "preview";

const DEFAULT_LEFT_PCT = 50;
const MIN_LEFT_PCT = 30;
const MAX_LEFT_PCT = 68;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("canvas");
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");
  const [leftWidthPct, setLeftWidthPct] = useState<number>(DEFAULT_LEFT_PCT);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  // Keep a ref in sync with leftWidthPct so event handlers can read the
  // current value without being listed in the useEffect dependency array.
  // This prevents re-registering mousemove/mouseup on every pixel of drag.
  const leftWidthPctRef = useRef(DEFAULT_LEFT_PCT);
  const { resume } = useResumeStore();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("resuarchitect_split_pct");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_LEFT_PCT && parsed <= MAX_LEFT_PCT) {
          setLeftWidthPct(parsed);
          leftWidthPctRef.current = parsed;
        }
      }
    } catch {}
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
  }, []);

  const setPresetRatio = useCallback((pct: number) => {
    const clamped = Math.min(Math.max(pct, MIN_LEFT_PCT), MAX_LEFT_PCT);
    setLeftWidthPct(clamped);
    leftWidthPctRef.current = clamped;
    try {
      localStorage.setItem("resuarchitect_split_pct", clamped.toString());
    } catch {}
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || typeof window === "undefined") return;
      const pct = Math.round((e.clientX / window.innerWidth) * 100);
      const clamped = Math.min(Math.max(pct, MIN_LEFT_PCT), MAX_LEFT_PCT);
      leftWidthPctRef.current = clamped;
      setLeftWidthPct(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        try {
          // Read from ref — stable, no stale-closure issue
          localStorage.setItem("resuarchitect_split_pct", leftWidthPctRef.current.toString());
        } catch {}
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]); // ✅ No longer depends on leftWidthPct — eliminates listener re-registration on every drag pixel

  return (
    <div
      style={{ "--left-pane-w": `${leftWidthPct}%` } as React.CSSProperties}
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      <Header onOpenFormAutoFill={() => setPreviewMode("form-fill")} />

      {/* Mobile/Tablet View Toggle (Screens < 1024px) */}
      <div className="lg:hidden sticky top-[53px] z-40 bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] px-3 py-1.5 flex items-center justify-center gap-2 print:hidden shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
            mobileTab === "editor"
              ? "bg-emerald-500 text-obsidian-950 shadow-glow-emerald"
              : "bg-slate-100 dark:bg-obsidian-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Resume Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
            mobileTab === "preview"
              ? "bg-emerald-500 text-obsidian-950 shadow-glow-emerald"
              : "bg-slate-100 dark:bg-obsidian-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live A4 Preview</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ml-1 font-mono font-bold">
            60 FPS
          </span>
        </button>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-53px)] overflow-hidden print:h-auto print:overflow-visible">
        {/* Left Pane: Tabbed Form Editor & Studio Controls */}
        <div
          className={`w-full lg:w-[var(--left-pane-w)] lg:shrink-0 h-full border-b lg:border-b-0 border-slate-200 dark:border-white/[0.08] flex-col bg-slate-50 dark:bg-obsidian-950 overflow-hidden print:hidden ${
            mobileTab === "editor" ? "flex" : "hidden lg:flex"
          }`}
        >
          <EditorTabs />
        </div>

        {/* Draggable Split-Screen Handle with Raycast/Linear Precision */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-valuenow={leftWidthPct}
          aria-valuemin={MIN_LEFT_PCT}
          aria-valuemax={MAX_LEFT_PCT}
          aria-label="Resize editor and preview panes"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPresetRatio(Math.max(MIN_LEFT_PCT, leftWidthPct - 2));
            else if (e.key === "ArrowRight") setPresetRatio(Math.min(MAX_LEFT_PCT, leftWidthPct + 2));
            else if (e.key === "Home") setPresetRatio(MIN_LEFT_PCT);
            else if (e.key === "End") setPresetRatio(MAX_LEFT_PCT);
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setPresetRatio(DEFAULT_LEFT_PCT)}
          title="Drag left/right to resize panels (Arrow keys to step, Double-click to reset)"
          className={`hidden lg:flex w-2 hover:w-2.5 items-center justify-center cursor-col-resize select-none z-30 transition-all group relative border-x border-slate-200 dark:border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-emerald-500/50 print:hidden ${
            isDragging
              ? "bg-emerald-500/20 border-emerald-500/40"
              : "bg-slate-100 dark:bg-obsidian-950 hover:bg-emerald-500/10"
          }`}
        >
          <div
            className={`w-0.5 h-7 rounded-full flex items-center justify-center transition-colors ${
              isDragging
                ? "bg-emerald-500 shadow-glow-emerald"
                : "bg-slate-300 dark:bg-obsidian-750 group-hover:bg-emerald-500"
            }`}
          />
          {isDragging && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-obsidian-900 border border-white/10 text-white text-[10px] font-mono whitespace-nowrap shadow-glass-elevated pointer-events-none z-50">
              {leftWidthPct}% / {100 - leftWidthPct}%
            </div>
          )}
        </div>

        {/* Right Pane: Live A4 Resume Canvas or ATS Robot Stream */}
        <div
          className={`flex-1 h-full flex-col bg-slate-100/50 dark:bg-obsidian-950 overflow-hidden print:!flex print:w-full print:h-auto print:overflow-visible print:bg-white ${
            mobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Preview Mode Switcher & Split Presets Toolbar */}
          <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-xl px-3 py-1.5 flex items-center justify-between shrink-0 print:hidden shadow-xs">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-obsidian-900 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setPreviewMode("canvas")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewMode === "canvas"
                    ? "bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/[0.08] font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live A4 Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("ats-robot")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewMode === "ats-robot"
                    ? "bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/[0.08] font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
                <span>View as ATS Robot</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("form-fill")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewMode === "form-fill"
                    ? "bg-white dark:bg-obsidian-850 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/[0.08] font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>AutoFill Job Form</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ml-1 font-bold">
                  Live
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <div className="hidden xl:flex items-center space-x-1 mr-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Split:</span>
                {[35, 45, 50, 55].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPresetRatio(pct)}
                    className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
                      leftWidthPct === pct
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/25"
                        : "hover:bg-slate-200 dark:hover:bg-obsidian-850"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPresetRatio(DEFAULT_LEFT_PCT)}
                  title="Reset split width"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-obsidian-850 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-obsidian-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] font-mono capitalize tracking-wide">
                {mounted ? resume.layout.theme : "modern"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-mono hidden sm:inline tracking-wide">
                {mounted && resume.layout.autoFitOnePage ? "1-Page Fit" : "A4 Standard"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col print:overflow-visible print:h-auto">
            {previewMode === "canvas" ? (
              <ResumeCanvas onToggleAtsView={() => setPreviewMode("ats-robot")} />
            ) : previewMode === "ats-robot" ? (
              <>
                <div className="flex-1 flex flex-col overflow-hidden print:hidden">
                  <AtsRobotView onSwitchToCanvas={() => setPreviewMode("canvas")} />
                </div>
                <div className="hidden print:block" aria-hidden="true">
                  <ResumeCanvas />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden print:hidden">
                <FormAutoFillView onSwitchToCanvas={() => setPreviewMode("canvas")} />
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <ScoreDeltaToast />
      </div>
    </div>
  );
}
