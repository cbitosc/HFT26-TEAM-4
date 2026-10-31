"use client";

import React, { useState } from "react";
import { User, Target, Sparkles, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    label: "Career Profile",
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
    badge: "Grounded",
    icon: Sparkles,
    description: "Hallucination-guarded bullet optimizer & git-style diffs",
  },
  {
    id: "theme",
    label: "Theme & Fit",
    badge: "A4 Clean",
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sticky Tab Navigation Header with Linear/Raycast Glassmorphism */}
      <div className="sticky top-0 z-20 border-b border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-xl px-2 sm:px-3 pt-2.5 pb-2 shrink-0 shadow-xs">
        <nav
          className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-obsidian-900/90 border border-slate-200 dark:border-white/[0.06]"
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
                className={`relative flex items-center justify-center sm:justify-start px-2 py-2 rounded-lg transition-colors text-left focus:outline-none ${
                  isActive
                    ? "text-slate-950 dark:text-white font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/[0.03] font-medium"
                }`}
              >
                {/* Framer-Motion Spring Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-obsidian-850 border border-slate-200 dark:border-white/[0.1] shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <div className="relative z-10 flex items-center space-x-1.5 w-full justify-center sm:justify-between min-w-0">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isActive ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400"
                      }`}
                    />
                    <span className="text-[11px] sm:text-xs tracking-tight truncate">
                      {tab.label}
                    </span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`hidden lg:inline-block text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider transition-colors ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                          : "bg-slate-200/60 dark:bg-obsidian-800 text-slate-500 dark:text-slate-400 border border-slate-300/60 dark:border-white/[0.06]"
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

      {/* Tab Content Panes with Smooth Fade */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-slate-50/50 dark:bg-obsidian-950">
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileEditor />
            </motion.div>
          )}

          {activeTab === "jd" && (
            <motion.div
              key="jd"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <JdScoringPanel />
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <DiffReviewer />
            </motion.div>
          )}

          {activeTab === "theme" && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <ThemeCustomizer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EditorTabs;
