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
  FileJson,
  Upload,
  Plus,
  Trash2,
  Bookmark,
  Layers,
  Zap,
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
  onOpenFormAutoFill?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportPdf,
  onExportDocx,
  onOpenFormAutoFill,
}) => {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const variantsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    resume,
    masterResume,
    savedVariants,
    saveVariant,
    loadVariant,
    deleteVariant,
    saveAsMaster,
    resetToMaster,
    exportBackupJson,
    importBackupJson,
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        variantsRef.current &&
        !variantsRef.current.contains(event.target as Node)
      ) {
        setVariantsOpen(false);
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

  const handleSaveVariant = () => {
    const defaultName = `${resume.targetRole || "Role"} - ${new Date().toLocaleDateString()}`;
    const name = window.prompt("Enter a name for this saved resume variant:", defaultName);
    if (name && name.trim()) {
      saveVariant(name.trim(), resume.targetRole, "");
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume.basics.name || "Resume").replace(/\s+/g, "_")}_ResuArchitect_Backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJson(content);
        if (ok) {
          alert("Backup successfully restored!");
        } else {
          alert("Invalid backup JSON file.");
        }
      }
    };
    reader.onerror = () => {
      alert("Failed to read the selected backup file. Please try again.");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePdfClick = async () => {
    if (onExportPdf) {
      onExportPdf();
      return;
    }
    try {
      setExportingPdf(true);
      await exportToPdf(resume);
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setExportingPdf(false);
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-obsidian-950/80 backdrop-blur-xl px-2.5 sm:px-4 lg:px-6 py-2 transition-colors duration-200 print:hidden shadow-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />
      <div className="max-w-[1780px] mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500/40 via-amber-500/30 to-teal-500/40 blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 dark:bg-obsidian-900/90 border border-white/15 flex items-center justify-center text-emerald-400 shadow-sm">
              <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                ResuArchitect
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/25 tracking-wide">
                AI
              </span>
              <span className="hidden xl:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-obsidian-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] font-mono tracking-wide">
                STUDIO v2.2
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block tracking-tight">
              Deterministic ATS Architecture & Live Vector Studio
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Privacy Badge */}
          <div
            className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium tracking-tight"
            title="All resume data, scoring, and text generation stay 100% on your device."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>100% On-Device Data</span>
          </div>

          {/* Variants & Backup Dropdown */}
          <div className="relative" ref={variantsRef}>
            <button
              type="button"
              onClick={() => setVariantsOpen((prev) => !prev)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-900/90 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-slate-200 transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              title="Manage Saved Variants and JSON Backup"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="hidden md:inline">Variants</span>
              {mounted && savedVariants.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold border border-amber-500/20">
                  {savedVariants.length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${variantsOpen ? "rotate-180" : ""}`} />
            </button>

            {variantsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.1] shadow-glass-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-2xl">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
                      Saved Job Variants
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Separate resumes for different target roles
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveVariant();
                      setVariantsOpen(false);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs transition active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Save Current</span>
                  </button>
                </div>

                {/* Variants List */}
                <div className="max-h-48 overflow-y-auto py-1">
                  {savedVariants.length === 0 ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 p-3 text-center">
                      No saved variants yet. Click &quot;Save Current&quot; to save this tailored resume.
                    </p>
                  ) : (
                    savedVariants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 transition text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Load variant "${v.title}" into the working editor?`)) {
                              loadVariant(v.id);
                              setVariantsOpen(false);
                            }
                          }}
                          className="text-left flex-1 min-w-0 pr-2"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {v.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                            {v.jobTitle || "Role"} • {new Date(v.savedAt).toLocaleDateString()}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete saved variant "${v.title}"?`)) {
                              deleteVariant(v.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete variant"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Master & Backup Tools */}
                <div className="border-t border-slate-100 dark:border-white/[0.06] pt-2 mt-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Save current working resume as Master Profile?")) {
                        saveAsMaster();
                        setVariantsOpen(false);
                        alert("Saved as Master Profile!");
                      }
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between transition"
                  >
                    <span>Save as Master Profile</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Master</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Restore editor from Master Profile? Unsaved changes will be replaced.")) {
                        resetToMaster();
                        setVariantsOpen(false);
                      }
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between transition"
                  >
                    <span>Restore from Master Profile</span>
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                  </button>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportJson();
                        setVariantsOpen(false);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] transition"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>Backup JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setVariantsOpen(false);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] transition"
                    >
                      <Upload className="w-3 h-3 text-slate-400" />
                      <span>Import JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Preset Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-900/90 dark:hover:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-slate-200 transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              aria-label="Load Sample Profile"
              aria-expanded={dropdownOpen}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span className="hidden md:inline text-slate-500 dark:text-slate-400">Preset:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 max-w-[80px] sm:max-w-[130px] md:max-w-none truncate text-[11px] sm:text-xs">
                {mounted
                  ? presets.find((p) => p.id === currentProfileId)?.role ?? "Full-Stack"
                  : "Full-Stack"}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.1] shadow-glass-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-2xl">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
                    Load Sample Profile & Matching JD
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                        className={`w-full text-left p-2.5 rounded-lg transition-all duration-150 flex items-start justify-between group ${
                          isSelected
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-slate-900 dark:text-white"
                            : "hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-700 dark:text-slate-200 border border-transparent"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                              {preset.fullRole}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              ({preset.candidate})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {preset.exp}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            Target: {preset.targetJd}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
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
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-obsidian-900 hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-600 dark:text-slate-300 transition-all hover:-translate-y-0.5 active:scale-95 text-xs font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only sm:inline-block sm:ml-1">Reset</span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleUiTheme}
            title={`Switch to ${uiTheme === "dark" ? "Light" : "Dark"} Mode`}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-obsidian-900 hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5 active:scale-95 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            aria-label="Toggle Theme"
          >
            {mounted && uiTheme === "light" ? (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="sr-only">Toggle Theme</span>
          </button>

          {/* ALWAYS VISIBLE EXPORT & ACTION BUTTONS */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 border-l border-slate-200 dark:border-white/[0.08] pl-1.5 sm:pl-2 shrink-0">
            {onOpenFormAutoFill && (
              <button
                type="button"
                onClick={onOpenFormAutoFill}
                title="Open Job Application Form Auto-Filler"
                className="hidden lg:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden xl:inline">AutoFill Form</span>
              </button>
            )}

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={handlePdfClick}
              disabled={exportingPdf}
              title="Download ATS-Friendly PDF (.pdf)"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-900 dark:hover:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/[0.1] text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer
                className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0 ${
                  exportingPdf ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">{exportingPdf ? "Compiling..." : "PDF"}</span>
              <span className="sm:hidden">{exportingPdf ? "..." : "PDF"}</span>
            </button>

            {/* DOCX Export Button (Prominent Showcase) */}
            <button
              type="button"
              onClick={handleDocxClick}
              disabled={exportingDocx}
              title="Export as Native Word Document (.docx)"
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] shadow-glow-emerald disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download
                className={`w-3.5 h-3.5 shrink-0 ${exportingDocx ? "animate-bounce" : ""}`}
              />
              <span className="hidden sm:inline">{exportingDocx ? "Exporting..." : "Word DOCX"}</span>
              <span className="sm:hidden">{exportingDocx ? "..." : "DOCX"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
