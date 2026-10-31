"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Layers,
  GraduationCap,
  Briefcase,
  Code,
  Sparkles,
  Award,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionId } from "@/lib/schema/resume";

const SECTION_CONFIG: Record<
  SectionId,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  summary: {
    label: "Professional Summary",
    icon: FileText,
    description: "High-impact career overview & value proposition",
  },
  experience: {
    label: "Work Experience",
    icon: Briefcase,
    description: "Reverse-chronological career history and bullets",
  },
  projects: {
    label: "Key Projects",
    icon: Code,
    description: "Open source, technical architectures, and apps",
  },
  skills: {
    label: "Technical Skills",
    icon: Sparkles,
    description: "Categorized stacks, languages, and competencies",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    description: "Degrees, institutions, GPA, and academic honors",
  },
  certifications: {
    label: "Certifications",
    icon: Award,
    description: "Industry credentials and vendor qualifications",
  },
};

const DEFAULT_ORDER: SectionId[] = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
];

export const SectionReorder: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const { resume, reorderSections, toggleSectionVisibility } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-4 rounded-xl bg-slate-200 dark:bg-obsidian-900/60 border border-slate-200 dark:border-white/[0.08] animate-pulse h-28" />
    );
  }

  const { sectionOrder, sectionVisibility } = resume.layout;

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;

    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    reorderSections(newOrder);
  };

  const handleReset = () => {
    reorderSections(DEFAULT_ORDER);
  };

  const visibleCount = sectionOrder.filter(
    (sec) => sectionVisibility[sec] !== false
  ).length;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-obsidian-900 overflow-hidden transition-all shadow-sm hover:border-slate-300 dark:hover:border-white/[0.12]">
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-obsidian-850/60 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-left group focus:outline-none"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wider font-mono uppercase">
                Section Flow & Ordering
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-200 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.06]">
                {visibleCount}/{sectionOrder.length} Visible
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Shift section priorities up or down and toggle preview visibility
            </p>
          </div>
        </button>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleReset}
            title="Reset standard order"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-obsidian-800 border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08] text-xs flex items-center space-x-1 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
          >
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Reorderable List */}
      {isOpen && (
        <div className="p-3 space-y-1.5">
          {sectionOrder.map((sectionId, index) => {
            const config = SECTION_CONFIG[sectionId] || {
              label: sectionId,
              icon: FileText,
              description: "",
            };
            const Icon = config.icon;
            const isVisible = sectionVisibility[sectionId] !== false;
            const isFirst = index === 0;
            const isLast = index === sectionOrder.length - 1;

            return (
              <div
                key={sectionId}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                  isVisible
                    ? "bg-slate-50 dark:bg-obsidian-950/70 border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:border-emerald-500/40 shadow-xs"
                    : "bg-slate-100/50 dark:bg-obsidian-950/40 border-slate-200/60 dark:border-white/[0.04] text-slate-400 dark:text-slate-600 opacity-60"
                }`}
              >
                {/* Left: Position index, Icon, and Label */}
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 dark:bg-obsidian-800 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isVisible
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-obsidian-800 text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate leading-tight text-slate-900 dark:text-slate-100">
                      {config.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* Right: Actions (Up, Down, Toggle Visibility) */}
                <div className="flex items-center space-x-1 shrink-0 ml-2">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMove(index, "up")}
                    aria-label={`Move ${config.label} Up`}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMove(index, "down")}
                    aria-label={`Move ${config.label} Down`}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-white/[0.08] mx-0.5" />

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(sectionId)}
                    aria-label={
                      isVisible
                        ? `Hide ${config.label} from resume`
                        : `Show ${config.label} on resume`
                    }
                    className={`p-1.5 rounded transition-colors ${
                      isVisible
                        ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-200 dark:hover:bg-obsidian-800"
                    }`}
                  >
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SectionReorder;
