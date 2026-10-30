"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Download,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Cpu,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { sampleProfilesMap } from "@/lib/presets/sampleProfiles";
import {
  stripeFullStackJd,
  googleMlJd,
  airbnbProductManagerJd,
} from "@/lib/presets/sampleJds";
import { exportToDocx } from "@/lib/export/docxExport";
import { exportToPdf } from "@/lib/export/pdfExport";

interface HeaderProps {
  onExportPdf?: () => void;
  onExportDocx?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportPdf, onExportDocx }) => {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    resume,
    loadProfile,
    resetToDefault,
    setJd,
    uiTheme,
    toggleUiTheme,
  } = useResumeStore();

  useEffect(() => {
    setMounted(true);
    // Sync html class on mount
    if (typeof document !== "undefined") {
      if (uiTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [uiTheme]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPreset = (
    key: "senior-fullstack" | "data-scientist-ml" | "technical-product-manager"
  ) => {
    const profile = sampleProfilesMap[key];
    if (profile) {
      loadProfile(profile);
      if (key === "senior-fullstack") {
        setJd(stripeFullStackJd);
      } else if (key === "data-scientist-ml") {
        setJd(googleMlJd);
      } else if (key === "technical-product-manager") {
        setJd(airbnbProductManagerJd);
      }
    }
    setDropdownOpen(false);
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset resume and JD back to the default Senior Full-Stack profile? Any unsaved edits will be restored."
    );
    if (confirmed) {
      resetToDefault();
      setJd(stripeFullStackJd);
    }
  };

  const handlePdfClick = () => {
    if (onExportPdf) {
      onExportPdf();
    } else {
      exportToPdf(resume?.basics?.name);
    }
  };

  const handleDocxClick = async () => {
    if (onExportDocx) {
      onExportDocx();
    } else {
      try {
        setExportingDocx(true);
        await exportToDocx(resume);
      } catch (err) {
        console.error("Failed to export DOCX", err);
      } finally {
        setExportingDocx(false);
      }
    }
  };

  const currentProfileId = mounted ? resume.id : "resume-default-01";

  const presets = [
    {
      id: "profile-fullstack-01",
      key: "senior-fullstack" as const,
      role: "Senior Full-Stack",
      fullRole: "Senior Full-Stack Engineer",
      candidate: "Alex Morgan",
      exp: "7+ Yrs • Next.js, Node, Postgres, AWS",
      targetJd: "Stripe Full-Stack Staff/Senior JD",
    },
    {
      id: "profile-ml-01",
      key: "data-scientist-ml" as const,
      role: "ML & Data Science",
      fullRole: "Senior ML & Data Scientist",
      candidate: "Dr. Elena Rostova",
      exp: "6+ Yrs • PyTorch, LLMs, MLOps, GCP",
      targetJd: "Google ML Infrastructure JD",
    },
    {
      id: "profile-pm-01",
      key: "technical-product-manager" as const,
      role: "Tech Product Manager",
      fullRole: "Principal Tech Product Manager",
      candidate: "Marcus Vance",
      exp: "8+ Yrs • AI Platforms, Systems, Strategy",
      targetJd: "Airbnb Core Systems PM JD",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 dark:border-stone-800/80 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md px-2.5 sm:px-4 lg:px-6 py-2 transition-colors duration-200 print:hidden shadow-sm">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-emerald-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/30 shadow-sm">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-stone-900 dark:text-stone-100">
                ResuArchitect
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                AI
              </span>
              <span className="hidden xl:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 font-medium">
                Local-First & ATS-Optimized
              </span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 hidden md:block">
              Tailored Resume Studio & Deterministic Scoring
            </p>
          </div>
        </div>

        {/* Right Action Cluster - Highly Compact and Always Visible on Mobile */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Privacy Badge (Visible on larger screens) */}
          <div
            className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium"
            title="All resume data, scoring, and text generation stay 100% on your device."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>100% On-Device Data</span>
          </div>

          {/* 1-Click Preset Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-850 border border-stone-300 dark:border-stone-700/80 text-xs font-medium text-stone-800 dark:text-stone-200 transition focus:outline-none focus:ring-1 focus:ring-amber-500"
              aria-label="Load Sample Profile"
              aria-expanded={dropdownOpen}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline text-stone-500 dark:text-stone-400">Preset:</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400 max-w-[80px] sm:max-w-[130px] md:max-w-none truncate text-[11px] sm:text-xs">
                {mounted
                  ? presets.find((p) => p.id === currentProfileId)?.role ?? "Full-Stack"
                  : "Full-Stack"}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-stone-400 transition-transform duration-200 shrink-0 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-xs font-semibold text-stone-900 dark:text-white">
                    Load Sample Profile & Matching JD
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Instantly populates career history & paired job postings.
                  </p>
                </div>
                <div className="mt-1 space-y-1">
                  {presets.map((preset) => {
                    const isSelected = currentProfileId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.key)}
                        className={`w-full text-left p-2.5 rounded-lg transition flex items-start justify-between group ${
                          isSelected
                            ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-stone-900 dark:text-white"
                            : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border border-transparent"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {preset.fullRole}
                            </span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400">
                              ({preset.candidate})
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                            {preset.exp}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            Target: {preset.targetJd}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to default profile"
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition text-xs font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only sm:inline-block sm:ml-1">Reset</span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleUiTheme}
            title={`Switch to ${uiTheme === "dark" ? "Light" : "Dark"} Mode`}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Toggle Theme"
          >
            {mounted && uiTheme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-stone-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="sr-only">Toggle Theme</span>
          </button>

          {/* ALWAYS VISIBLE EXPORT BUTTONS (Even on Smallest Screen) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 border-l border-stone-200 dark:border-stone-800 pl-1.5 sm:pl-2 shrink-0">
            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handlePdfClick}
              title="Export as Vector PDF (Clean @media print)"
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>PDF</span>
            </button>

            {/* DOCX Export Button */}
            <button
              type="button"
              onClick={handleDocxClick}
              disabled={exportingDocx}
              title="Export as Native Word Document (.docx)"
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-sm shadow-emerald-900/20"
            >
              <Download
                className={`w-3.5 h-3.5 shrink-0 ${exportingDocx ? "animate-bounce" : ""}`}
              />
              <span className="hidden sm:inline">{exportingDocx ? "Wait..." : "Word"}</span>
              <span>{exportingDocx ? "..." : "DOCX"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
