"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/navbar/Header";
import EditorTabs from "@/components/editor/EditorTabs";
import ResumeCanvas from "@/components/preview/ResumeCanvas";
import AtsRobotView from "@/components/preview/AtsRobotView";
import ScoreDeltaToast from "@/components/feedback/ScoreDeltaToast";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  FileText,
  Bot,
  Sparkles,
  Edit3,
  Eye,
  CheckCircle2,
} from "lucide-react";

export type PreviewMode = "canvas" | "ats-robot";
export type MobileTab = "editor" | "preview";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("canvas");
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");
  const { resume } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Top Studio Header - Always Sticky with PDF and DOCX Exports */}
      <Header />

      {/* Mobile/Tablet View Toggle (Screens < 1024px) */}
      <div className="lg:hidden sticky top-[53px] z-40 bg-stone-100/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 px-3 py-1.5 flex items-center justify-center gap-2 print:hidden shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
            mobileTab === "editor"
              ? "bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-sm shadow-amber-900/20"
              : "bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Resume Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
            mobileTab === "preview"
              ? "bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-sm shadow-amber-900/20"
              : "bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-800"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live A4 Preview</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ml-1 font-mono">
            60 FPS
          </span>
        </button>
      </div>

      {/* Main Studio Workspace: Side-by-side on desktop, Full-view on mobile */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-53px)] lg:h-[calc(100vh-53px)] overflow-hidden print:h-auto print:overflow-visible">
        {/* Left Pane: Tabbed Form Editor & Studio Controls */}
        <div
          className={`w-full lg:w-1/2 h-full border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800 flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden print:hidden ${
            mobileTab === "editor" ? "flex" : "hidden lg:flex"
          }`}
        >
          <EditorTabs />
        </div>

        {/* Right Pane: Live A4 Resume Canvas or ATS Robot Stream */}
        <div
          className={`w-full lg:w-1/2 h-full flex-col bg-stone-100/70 dark:bg-stone-900/40 overflow-hidden print:!flex print:w-full print:h-auto print:overflow-visible print:bg-white ${
            mobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Preview Mode Switcher Toolbar - Sticky */}
          <div className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/90 backdrop-blur px-3 py-1.5 flex items-center justify-between shrink-0 print:hidden shadow-xs">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setPreviewMode("canvas")}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition ${
                  previewMode === "canvas"
                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs ring-1 ring-stone-300 dark:ring-stone-700 font-bold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                <FileText
                  className={`w-3.5 h-3.5 ${
                    previewMode === "canvas" ? "text-amber-600 dark:text-amber-400" : "text-stone-400"
                  }`}
                />
                <span>Live A4 Preview</span>
                <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono">
                  60 FPS
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("ats-robot")}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition ${
                  previewMode === "ats-robot"
                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs ring-1 ring-stone-300 dark:ring-stone-700 font-bold"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                <Bot
                  className={`w-3.5 h-3.5 ${
                    previewMode === "ats-robot" ? "text-amber-600 dark:text-amber-400" : "text-stone-400"
                  }`}
                />
                <span>View as ATS Robot</span>
                <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono">
                  100% Valid
                </span>
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-peach-50 dark:bg-peach-950/40 text-peach-800 dark:text-peach-300 border border-peach-200 dark:border-peach-800/40 font-mono capitalize">
                {mounted ? resume.layout.theme : "modern"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-50 dark:bg-gold-950/40 text-gold-800 dark:text-gold-300 border border-gold-200 dark:border-gold-800/40 font-mono hidden sm:inline">
                {mounted && resume.layout.autoFitOnePage ? "1-Page Fit" : "A4 Standard"}
              </span>
            </div>
          </div>

          {/* Active View Container */}
          <div className="flex-1 overflow-hidden flex flex-col print:overflow-visible print:h-auto">
            {previewMode === "canvas" ? (
              <ResumeCanvas onToggleAtsView={() => setPreviewMode("ats-robot")} />
            ) : (
              <>
                <div className="flex-1 flex flex-col overflow-hidden print:hidden">
                  <AtsRobotView onSwitchToCanvas={() => setPreviewMode("canvas")} />
                </div>
                {/* Keep ResumeCanvas in DOM for PDF export and printing, visually hidden in ATS mode */}
                <div className="hidden print:block" aria-hidden="true">
                  <ResumeCanvas />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Coverage Score Increase Notification */}
      <div className="print:hidden">
        <ScoreDeltaToast />
      </div>
    </div>
  );
}
