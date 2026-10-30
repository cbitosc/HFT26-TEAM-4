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
    label: "Job & Match",
    badge: "Coverage",
    icon: Target,
    description: "Target job description, required skills, and keyword gaps",
  },
  {
    id: "ai",
    label: "AI Tailor",
    badge: "Smart",
    icon: Sparkles,
    description: "Hallucination-guarded bullet optimizer & git-style diffs",
  },
  {
    id: "theme",
    label: "Theme & Fit",
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
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Sticky Tab Navigation Header with Glassmorphism */}
      <div className="sticky top-0 z-20 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-1.5 sm:px-4 pt-2 shrink-0 shadow-xs">
        <nav
          className="grid grid-cols-4 gap-1 sm:gap-1.5"
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
                className={`flex flex-col items-center sm:items-start p-2 sm:p-2.5 rounded-t-lg transition border-b-2 text-left relative ${
                  isActive
                    ? "bg-amber-50/50 dark:bg-stone-800/90 text-stone-900 dark:text-white border-amber-600 dark:border-amber-400 shadow-xs ring-1 ring-amber-200 dark:ring-stone-700/60 font-bold"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850/60 border-transparent font-medium"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-1.5 w-full justify-center sm:justify-between">
                  <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                        isActive ? "text-amber-600 dark:text-amber-400" : "text-stone-400"
                      }`}
                    />
                    <span className="text-[11px] sm:text-xs tracking-tight truncate">
                      {tab.label}
                    </span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                          : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700/60"
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
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-stone-50/50 dark:bg-stone-950">
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
