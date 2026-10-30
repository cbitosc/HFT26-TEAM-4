"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  Target,
  Sparkles,
  Palette,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  FileCheck,
  Type,
  Minimize2,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import ProfileEditor from "./ProfileEditor";
import ThemeCustomizer from "./ThemeCustomizer";

export type EditorTabId = "profile" | "jd" | "ai" | "theme";

interface TabDefinition {
  id: EditorTabId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabDefinition[] = [
  {
    id: "profile",
    label: "Career Details",
    badge: "Master",
    icon: User,
    description: "Contact, summary, experience, projects, skills, education",
  },
  {
    id: "jd",
    label: "Job & Match Score",
    badge: "Coverage",
    icon: Target,
    description: "Target job description, required skills, and keyword gaps",
  },
  {
    id: "ai",
    label: "AI Tailor & Diffs",
    badge: "Smart",
    icon: Sparkles,
    description: "Hallucination-guarded bullet optimizer & git-style diffs",
  },
  {
    id: "theme",
    label: "Theme & Layout",
    badge: "ATS Clean",
    icon: Palette,
    description: "Typography, margins, visual themes, and 1-page auto-fit",
  },
];

interface EditorTabsProps {
  defaultTab?: EditorTabId;
  onTabChange?: (tab: EditorTabId) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  defaultTab = "profile",
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTabId>(defaultTab);
  const [mounted, setMounted] = useState(false);

  const {
    resume,
    jd,
    updateTheme,
    setJd,
  } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabClick = (tabId: EditorTabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleJdTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJd(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Tab Navigation Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-2 sm:px-4 pt-2 shrink-0">
        <nav
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
          aria-label="Editor Tabs"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center sm:items-start p-2.5 rounded-t-lg transition border-b-2 text-left relative ${
                  isActive
                    ? "bg-slate-800/90 text-white border-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border-transparent"
                }`}
              >
                <div className="flex items-center space-x-1.5 w-full justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-400" : "text-slate-400"
                      }`}
                    />
                    <span className="font-semibold text-xs tracking-tight truncate">
                      {tab.label}
                    </span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`hidden lg:inline-block text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700/60"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Panes */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {/* Tab 1: Profile Details */}
        {activeTab === "profile" && <ProfileEditor />}

        {/* Tab 2: Job Description & Match Score */}
        {activeTab === "jd" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Target Job Description & Matching Engine
                </h2>
                <p className="text-xs text-slate-400">
                  Paste any job listing to trigger deterministic keyword extraction and match scoring.
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {mounted && jd.title ? jd.title : "Target JD"}
              </span>
            </div>

            {/* Target Role & Company info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Target Role / Title</span>
                <p className="text-sm font-semibold text-white mt-1">
                  {mounted && jd.title ? jd.title : "Senior Full-Stack Engineer"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Target Company</span>
                <p className="text-sm font-semibold text-white mt-1">
                  {mounted && jd.company ? jd.company : "Stripe"}
                </p>
              </div>
            </div>

            {/* Job Description Text Area */}
            <div className="space-y-2">
              <label
                htmlFor="jd-raw-text"
                className="block text-xs font-semibold text-slate-300"
              >
                Paste Target Job Description (Text or Markdown)
              </label>
              <textarea
                id="jd-raw-text"
                rows={8}
                value={mounted ? jd.rawText : ""}
                onChange={handleJdTextChange}
                placeholder="Paste the full job posting here (responsibilities, qualifications, technologies)..."
                className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono leading-relaxed resize-y"
              />
            </div>

            {/* Extracted Requirements Preview */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Target Required Keywords ({mounted ? jd.keywords.length : 0})
                </span>
                <span className="text-[10px] text-slate-400">
                  Extracted with 400+ tech taxonomy in Phase 3
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(mounted ? jd.keywords : []).slice(0, 15).map((kw, i) => (
                  <span
                    key={`${kw}-${i}`}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200 border border-slate-700/60 font-mono"
                  >
                    {kw}
                  </span>
                ))}
                {mounted && jd.keywords.length === 0 && (
                  <p className="text-xs text-slate-500 italic">
                    Load a sample preset above or paste a job description to populate extracted keywords.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Tailoring & Git-Style Diff Reviewer */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Bounded AI Bullet Tailor & Diffs
                </h2>
                <p className="text-xs text-slate-400">
                  Refines experience bullets strictly using your real achievements and JD keywords.
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Phase 4 Ready
              </span>
            </div>

            {/* Guardrail Guarantee Banner */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Code Truth & Anti-Hallucination Guardrails
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ResuArchitect AI strictly prevents fabricated companies, roles, and dates. All bullet
                modifications follow Google-style XYZ formulas (Accomplished [X] as measured by [Y], by doing [Z]).
              </p>
            </div>

            {/* Diff Card Mock / Interactive Playground */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Sample Live Diff Preview
              </span>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded bg-red-950/20 border border-red-900/40 text-red-300">
                  <span className="text-red-400 font-bold mr-2">-</span>
                  Spearheaded migration of legacy REST API to Next.js App Router and Node.js microservices.
                </div>
                <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-800/50 text-emerald-200">
                  <span className="text-emerald-400 font-bold mr-2">+</span>
                  Spearheaded migration of legacy REST API to Next.js App Router and Node.js microservices, cutting p95 response latency from 320ms to 95ms for 450k active tenants.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Theme, Layout & Typography */}
        {activeTab === "theme" && <ThemeCustomizer />}
      </div>
    </div>
  );
};

export default EditorTabs;
