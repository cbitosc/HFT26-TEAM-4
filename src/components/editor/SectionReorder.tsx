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
      <div className="p-4 rounded-xl bg-stone-200 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 animate-pulse h-28" />
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
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 overflow-hidden transition-all shadow-sm">
      {/* Header bar */}
      <div className="px-4 py-3 bg-stone-50/80 dark:bg-stone-850/80 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-left group focus:outline-none"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-stone-900 dark:text-white tracking-wide uppercase">
                Section Flow & Ordering
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                {visibleCount}/{sectionOrder.length} Visible
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Shift section priorities up or down and toggle preview visibility
            </p>
          </div>
        </button>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleReset}
            title="Reset standard order"
            className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-300 dark:hover:border-stone-700 text-xs flex items-center space-x-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                  isVisible
                    ? "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-amber-300 dark:hover:border-stone-700 shadow-sm"
                    : "bg-stone-100/50 dark:bg-stone-950/60 border-stone-200/60 dark:border-stone-850 text-stone-400 dark:text-stone-500 opacity-60"
                }`}
              >
                {/* Left: Position index, Icon, and Label */}
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isVisible
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate leading-tight text-stone-900 dark:text-stone-100">
                      {config.label}
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate hidden sm:block">
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
                    className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMove(index, "down")}
                    aria-label={`Move ${config.label} Down`}
                    className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-3.5 bg-stone-200 dark:bg-slate-800 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(sectionId)}
                    aria-label={
                      isVisible
                        ? `Hide ${config.label} from resume`
                        : `Show ${config.label} on resume`
                    }
                    className={`p-1.5 rounded transition ${
                      isVisible
                        ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        : "text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 hover:bg-stone-200 dark:hover:bg-slate-800"
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
