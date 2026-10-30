"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/navbar/Header";
import EditorTabs from "@/components/editor/EditorTabs";
import ResumeCanvas from "@/components/preview/ResumeCanvas";
import AtsRobotView from "@/components/preview/AtsRobotView";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  FileText,
  Bot,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export type PreviewMode = "canvas" | "ats-robot";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("canvas");
  const { resume } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Studio Header */}
      <Header />

      {/* Main Studio Workspace: Responsive Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden">
        {/* Left Pane: Tabbed Form Editor & Studio Controls */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden">
          <EditorTabs />
        </div>

        {/* Right Pane: Live A4 Resume Canvas or ATS Robot Stream */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Preview Mode Switcher Toolbar */}
          <div className="border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 flex items-center justify-between shrink-0">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewMode("canvas")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                  previewMode === "canvas"
                    ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/80"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText
                  className={`w-3.5 h-3.5 ${
                    previewMode === "canvas" ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span>Live A4 Preview</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  60 FPS
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("ats-robot")}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                  previewMode === "ats-robot"
                    ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/80"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Bot
                  className={`w-3.5 h-3.5 ${
                    previewMode === "ats-robot" ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span>View as ATS Robot</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  100% Valid
                </span>
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono capitalize">
                Theme: {mounted ? resume.layout.theme : "modern"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {mounted && resume.layout.autoFitOnePage ? "1-Page Fit" : "Standard A4"}
              </span>
            </div>
          </div>

          {/* Active View Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {previewMode === "canvas" ? (
              <ResumeCanvas onToggleAtsView={() => setPreviewMode("ats-robot")} />
            ) : (
              <AtsRobotView onSwitchToCanvas={() => setPreviewMode("canvas")} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
