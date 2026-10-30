"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  RotateCcw,
  Printer,
  Download,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Check,
  Cpu,
  User,
  Briefcase,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  sampleProfilesMap,
  seniorFullStackProfile,
  dataScientistMlProfile,
  technicalProductManagerProfile,
} from "@/lib/presets/sampleProfiles";
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
    isTailored,
  } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      role: "Senior Full-Stack Engineer",
      candidate: "Alex Morgan",
      exp: "7+ Years • Next.js, Node, Postgres, AWS",
      targetJd: "Stripe Full-Stack Staff/Senior JD",
    },
    {
      id: "profile-ml-01",
      key: "data-scientist-ml" as const,
      role: "Senior ML & Data Scientist",
      candidate: "Dr. Elena Rostova",
      exp: "6+ Years • PyTorch, LLMs, MLOps, GCP",
      targetJd: "Google ML Infrastructure JD",
    },
    {
      id: "profile-pm-01",
      key: "technical-product-manager" as const,
      role: "Principal Tech Product Manager",
      candidate: "Marcus Vance",
      exp: "8+ Years • AI Platforms, Systems, Strategy",
      targetJd: "Airbnb Core Systems PM JD",
    },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 px-4 py-2.5 sm:px-6 print:hidden">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Brand & Badges */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                ResuArchitect
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                AI
              </span>
              <span className="hidden md:inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                Local-First & ATS-Optimized
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Tailored Resume Studio & Deterministic JD Engine
            </p>
          </div>
        </div>

        {/* Center / Right Control Panel */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Privacy Badge */}
          <div
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 font-medium"
            title="All resume data, scoring, and text generation stay 100% on your device."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>100% On-Device Data</span>
          </div>

          {/* 1-Click Preset Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition focus:outline-none focus:ring-1 focus:ring-emerald-500"
              aria-label="Load Sample Profile"
              aria-expanded={dropdownOpen}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Load Preset:</span>
              <span className="font-semibold text-emerald-300 max-w-[120px] truncate sm:max-w-none">
                {mounted
                  ? presets.find((p) => p.id === currentProfileId)?.role ??
                    "Senior Full-Stack"
                  : "Senior Full-Stack"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">
                    Load Production Sample Profile & JD
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Instantly populates realistic careers & paired job descriptions.
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
                            ? "bg-emerald-950/40 border border-emerald-500/30 text-white"
                            : "hover:bg-slate-800 text-slate-200 border border-transparent"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                              {preset.role}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({preset.candidate})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {preset.exp}
                          </p>
                          <p className="text-[10px] text-emerald-400/80 font-mono">
                            Paired: {preset.targetJd}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
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
            title="Reset active resume and JD to default template"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/80 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Export Actions */}
          <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-2 sm:pl-3">
            <button
              type="button"
              onClick={handlePdfClick}
              title="Print or Save to PDF (Clean vector page with @media print)"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDocxClick}
              disabled={exportingDocx}
              title="Export ATS-Friendly Word Document (.docx)"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition shadow-sm shadow-emerald-950/40"
            >
              <Download className={`w-3.5 h-3.5 shrink-0 ${exportingDocx ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">{exportingDocx ? "Generating..." : "Export"}</span>
              <span>{exportingDocx ? "DOCX..." : "DOCX"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
