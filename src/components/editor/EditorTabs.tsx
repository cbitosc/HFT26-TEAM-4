"use client";

import React, { useState } from "react";
import { User, Target, Sparkles, Palette } from "lucide-react";
import ProfileEditor from "./ProfileEditor";
import ThemeCustomizer from "./ThemeCustomizer";
import JdScoringPanel from "../scoring/JdScoringPanel";
import DiffReviewer from "../tailor/DiffReviewer";

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

  const handleTabClick = (tabId: EditorTabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
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
        {activeTab === "jd" && <JdScoringPanel />}

        {/* Tab 3: AI Tailoring & Git-Style Diff Reviewer */}
        {activeTab === "ai" && <DiffReviewer />}

        {/* Tab 4: Theme, Layout & Typography */}
        {activeTab === "theme" && <ThemeCustomizer />}
      </div>
    </div>
  );
};

export default EditorTabs;
