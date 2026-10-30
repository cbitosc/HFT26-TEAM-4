"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Type,
  Maximize2,
  Minimize2,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  ResumeTheme,
  ResumeFontFamily,
  ResumeMargins,
} from "@/lib/schema/resume";

export interface ThemeOption {
  id: ResumeTheme;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  accentColor: string;
  borderPreview: string;
  sampleFont: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimalist",
    badge: "Tech Standard",
    tagline: "Clean emerald accents with balanced whitespace",
    description: "Ideal for SWE, DevOps, and Product roles at modern tech firms & high-growth startups.",
    accentColor: "bg-emerald-500",
    borderPreview: "border-l-4 border-emerald-500",
    sampleFont: "Inter / Sans-Serif",
  },
  {
    id: "executive-ivy",
    name: "Executive Ivy",
    badge: "Leadership & C-Suite",
    tagline: "Classic Ivy League serif with dignified hierarchy",
    description: "Preferred format for Directors, VPs, Management Consultants, Finance, and Enterprise Law.",
    accentColor: "bg-slate-700",
    borderPreview: "border-l-4 border-slate-600",
    sampleFont: "Garamond / Serif",
  },
  {
    id: "tech-clean",
    name: "Tech Clean",
    badge: "High Density",
    tagline: "Maximum information density with blue accents",
    description: "Optimized for dense technical portfolios, machine learning researchers, and Quant developers.",
    accentColor: "bg-blue-600",
    borderPreview: "border-l-4 border-blue-500",
    sampleFont: "Roboto / Monospace Accents",
  },
];

export const FONT_OPTIONS: {
  id: ResumeFontFamily;
  name: string;
  category: string;
  fontClass: string;
  previewSample: string;
}[] = [
  {
    id: "inter",
    name: "Inter",
    category: "Modern Sans-Serif",
    fontClass: "font-sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "garamond",
    name: "Garamond",
    category: "Executive Serif",
    fontClass: "font-serif",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
  {
    id: "roboto",
    name: "Roboto",
    category: "Clean Neutral Sans",
    fontClass: "font-sans",
    previewSample: "The quick brown fox jumps over the lazy dog",
  },
];

export const MARGIN_OPTIONS: {
  id: ResumeMargins;
  label: string;
  size: string;
  desc: string;
}[] = [
  {
    id: "compact",
    label: "Compact",
    size: "0.50 in (12.7 mm)",
    desc: "Maximizes printable space for senior 2-page or dense 1-page resumes",
  },
  {
    id: "normal",
    label: "Normal",
    size: "0.75 in (19.0 mm)",
    desc: "Industry-standard balance of margin whitespace and ATS readability",
  },
  {
    id: "spacious",
    label: "Spacious",
    size: "1.00 in (25.4 mm)",
    desc: "Classic executive margin format for executive and academic CVs",
  },
];

export const ThemeCustomizer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { resume, updateTheme } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-6 text-center text-stone-400 dark:text-slate-400 text-xs animate-pulse">
        Loading theme customizer...
      </div>
    );
  }

  const { theme, fontFamily, fontScale, margins, autoFitOnePage } = resume.layout;

  // Normalize theme aliases if stored as short names
  const activeThemeId: ResumeTheme =
    theme === "modern"
      ? "modern-minimal"
      : theme === "executive"
      ? "executive-ivy"
      : theme === "tech"
      ? "tech-clean"
      : theme;

  // Font scale points: 1.0 scale represents 10.0pt (slider from 9.5pt to 11.5pt)
  const currentPt = (fontScale * 10).toFixed(1);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pt = parseFloat(e.target.value);
    const newScale = parseFloat((pt / 10).toFixed(3));
    updateTheme({ fontScale: newScale });
  };

  const handleResetDefaults = () => {
    updateTheme({
      theme: "modern-minimal",
      fontFamily: "inter",
      fontScale: 1.0,
      margins: "normal",
      autoFitOnePage: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">
              Visual Theme & Typography Studio
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            100% ATS-guaranteed typography hierarchy, margin scales, and single-page constraint controls.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 rounded-lg transition"
          title="Reset to recommended layout defaults"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* 1. Theme Selection Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 uppercase tracking-wider">
            1. Select ATS Theme Preset
          </label>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
            3 High-Passing Presets
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {THEME_OPTIONS.map((th) => {
            const isSelected = activeThemeId === th.id;
            return (
              <div
                key={th.id}
                role="button"
                tabIndex={0}
                onClick={() => updateTheme({ theme: th.id })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    updateTheme({ theme: th.id });
                  }
                }}
                className={`p-4 rounded-xl text-left transition cursor-pointer border relative shadow-sm ${
                  isSelected
                    ? "bg-amber-50/40 dark:bg-stone-900/90 border-amber-500/80 dark:border-emerald-500/80 ring-1 ring-amber-500/40 dark:ring-emerald-500/50"
                    : "bg-white dark:bg-stone-900/40 border-stone-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700 text-stone-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${th.accentColor} shrink-0 ring-2 ring-stone-200 dark:ring-slate-800`}
                    />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white tracking-tight">
                      {th.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        isSelected
                          ? "bg-amber-100 dark:bg-emerald-500/20 text-amber-800 dark:text-emerald-300 border border-amber-300 dark:border-emerald-500/40"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border border-stone-200 dark:border-slate-700"
                      }`}
                    >
                      {th.badge}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 dark:bg-emerald-500/20 text-amber-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-amber-500/40 dark:border-emerald-500/40">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-700 dark:text-slate-300 mt-1.5 font-medium">
                  {th.tagline}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {th.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
                  <span className="font-mono">
                    Typography: <span className="text-stone-800 dark:text-slate-300 font-semibold">{th.sampleFont}</span>
                  </span>
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-mono text-[10px] gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    100% ATS Safe
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Font Family Picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 uppercase tracking-wider">
            2. Typography Font Family
          </label>
          <span className="text-[10px] text-stone-400 dark:text-slate-400 font-mono">
            Universally Available ATS Fonts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FONT_OPTIONS.map((f) => {
            const isSelected = fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => updateTheme({ fontFamily: f.id })}
                className={`p-3 rounded-xl text-left transition border shadow-sm ${
                  isSelected
                    ? "bg-amber-50/50 dark:bg-stone-900/90 border-amber-500/70 dark:border-emerald-500/70 text-stone-900 dark:text-white ring-1 ring-amber-500/30 dark:ring-emerald-500/30"
                    : "bg-white dark:bg-stone-900/40 border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-slate-700 hover:text-stone-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${f.fontClass} text-stone-900 dark:text-white`}>
                    {f.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-emerald-400" />
                  )}
                </div>
                <span className="block text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                  {f.category}
                </span>
                <p
                  className={`text-xs mt-2 text-stone-600 dark:text-slate-300 truncate opacity-80 ${f.fontClass}`}
                >
                  Aa Bb Gg 123
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Font Scale Slider (9.5pt to 11.5pt) */}
      <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <label
              htmlFor="font-scale-slider"
              className="text-xs font-semibold text-stone-700 dark:text-slate-200 uppercase tracking-wider"
            >
              3. Font Scale Slider (9.5pt – 11.5pt)
            </label>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
              Adjust body & heading text sizes proportionally while preserving ATS vertical rhythm.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-stone-200 dark:bg-slate-800 text-amber-700 dark:text-emerald-400 border border-stone-300 dark:border-slate-700 font-mono text-xs font-bold">
              {currentPt} pt
            </span>
            <span className="text-[10px] text-stone-500 dark:text-slate-500 font-mono">
              ({Math.round(fontScale * 100)}%)
            </span>
          </div>
        </div>

        <div className="pt-2">
          <input
            id="font-scale-slider"
            type="range"
            min="9.5"
            max="11.5"
            step="0.25"
            value={currentPt}
            onChange={handleScaleChange}
            className="w-full h-2 bg-stone-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-emerald-500 focus:outline-none"
          />
          <div className="flex justify-between text-[10px] font-mono text-stone-500 dark:text-slate-500 mt-1.5 px-0.5">
            <span>9.5 pt (Dense)</span>
            <span>10.0 pt (Standard)</span>
            <span>10.5 pt</span>
            <span>11.0 pt</span>
            <span>11.5 pt (Spacious)</span>
          </div>
        </div>

        {/* Quick Scale Presets */}
        <div className="flex gap-2 pt-1 flex-wrap">
          {[
            { pt: 9.5, label: "9.5pt Compact" },
            { pt: 10.0, label: "10.0pt Standard" },
            { pt: 10.5, label: "10.5pt Medium" },
            { pt: 11.0, label: "11.0pt Large" },
          ].map((preset) => {
            const isCurrent = Math.abs(parseFloat(currentPt) - preset.pt) < 0.1;
            return (
              <button
                key={preset.pt}
                type="button"
                onClick={() =>
                  updateTheme({ fontScale: parseFloat((preset.pt / 10).toFixed(3)) })
                }
                className={`px-2 py-1 rounded text-[10px] font-mono transition border ${
                  isCurrent
                    ? "bg-amber-100 dark:bg-emerald-500/20 text-amber-800 dark:text-emerald-300 border-amber-400 dark:border-emerald-500/40"
                    : "bg-white dark:bg-slate-800/80 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-700/60 hover:text-stone-900 dark:hover:text-slate-200"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Page Margins Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700 dark:text-slate-200 uppercase tracking-wider">
            4. Page Margins
          </label>
          <span className="text-[10px] text-stone-400 dark:text-slate-400 font-mono">
            A4 Standard Bounds
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MARGIN_OPTIONS.map((m) => {
            const isSelected = margins === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => updateTheme({ margins: m.id })}
                className={`p-3 rounded-xl text-left transition border shadow-sm ${
                  isSelected
                    ? "bg-amber-50/50 dark:bg-stone-900/90 border-amber-500/70 dark:border-emerald-500/70 text-stone-900 dark:text-white ring-1 ring-amber-500/30 dark:ring-emerald-500/30"
                    : "bg-white dark:bg-stone-900/40 border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-slate-700 hover:text-stone-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white">{m.label}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-emerald-400" />
                  )}
                </div>
                <span className="block text-[10px] text-amber-700 dark:text-emerald-400 font-mono mt-0.5">
                  {m.size}
                </span>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1.5 leading-snug">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Auto-Fit to 1-Page Constraint Toggle */}
      <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-900/80 border border-stone-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Minimize2
              className={`w-4 h-4 ${
                autoFitOnePage ? "text-amber-600 dark:text-emerald-400" : "text-stone-400 dark:text-slate-400"
              }`}
            />
            <div>
              <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                5. Auto-Fit to 1-Page Constraint
              </span>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                Automatically condenses line-height and vertical padding to ensure zero 2-page spill.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={autoFitOnePage}
            onClick={() => updateTheme({ autoFitOnePage: !autoFitOnePage })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoFitOnePage ? "bg-amber-500 dark:bg-emerald-500" : "bg-stone-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                autoFitOnePage ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {autoFitOnePage && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-emerald-950/30 border border-amber-200 dark:border-emerald-800/40 text-[11px] text-amber-800 dark:text-emerald-300 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-emerald-400" />
            <span>
              1-Page Auto-Fit Active: CSS line-height compressed to 1.3 and section padding reduced by 30%.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeCustomizer;
