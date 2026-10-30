"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Copy,
  Check,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  RotateCcw,
  Bot,
  Download,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  ResumeTheme,
  ResumeFontFamily,
  ResumeMargins,
  SectionId,
} from "@/lib/schema/resume";
import { exportToDocx } from "@/lib/export/docxExport";
import { exportToPdf } from "@/lib/export/pdfExport";

export interface ResumeCanvasProps {
  className?: string;
  readOnly?: boolean;
  onToggleAtsView?: () => void;
}

export const ResumeCanvas: React.FC<ResumeCanvasProps> = ({
  className = "",
  readOnly = false,
  onToggleAtsView,
}) => {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [copied, setCopied] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { resume } = useResumeStore();

  useEffect(() => {
    setMounted(true);
    // On small screens/phones, auto-scale zoom to fit screen width cleanly
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      const autoScale = Math.max(0.42, Math.min(0.85, (window.innerWidth - 32) / 800));
      setZoom(Number(autoScale.toFixed(2)));
    }
  }, []);

  const handleFitWidth = () => {
    if (typeof window !== "undefined") {
      const available = window.innerWidth < 1024 ? window.innerWidth - 32 : (window.innerWidth / 2) - 48;
      const fit = Math.max(0.40, Math.min(1.2, available / 800));
      setZoom(Number(fit.toFixed(2)));
    }
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Rendering Live A4 Resume Canvas...</span>
        </div>
      </div>
    );
  }

  const { layout, basics, experience, projects, skills, education, certifications } = resume;
  const { theme, fontFamily, fontScale = 1.0, margins = "normal", autoFitOnePage = false, sectionOrder, sectionVisibility } = layout;

  // Zoom controls
  const zoomLevels = [0.75, 0.9, 1.0, 1.2];
  const handleZoomIn = () => {
    const next = zoomLevels.find((z) => z > zoom + 0.05);
    if (next) setZoom(next);
    else setZoom(1.2);
  };
  const handleZoomOut = () => {
    const prev = [...zoomLevels].reverse().find((z) => z < zoom - 0.05);
    if (prev) setZoom(prev);
    else setZoom(0.75);
  };
  const handleSetZoom = (newZoom: number) => {
    setZoom(newZoom);
  };

  // Plain text copy helper
  const handleCopyText = async () => {
    if (!sheetRef.current) return;
    try {
      const text = sheetRef.current.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  // PDF file download trigger
  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportToPdf(resume);
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setExportingPdf(false);
    }
  };

  // DOCX file download
  const handleExportDocx = async () => {
    try {
      setExportingDocx(true);
      await exportToDocx(resume);
    } catch (err) {
      console.error("Failed to export DOCX", err);
    } finally {
      setExportingDocx(false);
    }
  };

  // Normalize theme: Modern Minimalist, Executive Ivy, Tech Clean
  const isExecutive = theme === "executive" || theme === "executive-ivy";
  const isTech = theme === "tech" || theme === "tech-clean";
  const isModern = !isExecutive && !isTech;

  // Font family styles
  const fontFamiliesMap: Record<ResumeFontFamily, string> = {
    inter: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    garamond: 'Garamond, "EB Garamond", Georgia, "Times New Roman", serif',
    roboto: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  };
  const appliedFontFamily = fontFamiliesMap[fontFamily] || fontFamiliesMap.inter;

  // Margins styling
  const marginsMap: Record<ResumeMargins, { padding: string; mm: string }> = {
    compact: { padding: autoFitOnePage ? "28px" : "36px", mm: "12.7mm" },
    normal: { padding: autoFitOnePage ? "38px" : "48px", mm: "19mm" },
    spacious: { padding: autoFitOnePage ? "46px" : "58px", mm: "25.4mm" },
  };
  const currentMargin = marginsMap[margins] || marginsMap.normal;

  // Auto-fit 1-Page dynamic font and spacing clamping
  const totalBullets =
    (experience?.reduce((acc, exp) => acc + (exp.bullets?.length || 0), 0) || 0) +
    (projects?.reduce((acc, proj) => acc + (proj.bullets?.length || 0), 0) || 0);

  const activeSectionsCount = (sectionOrder || []).filter(
    (s) => sectionVisibility?.[s as SectionId] !== false
  ).length;

  // Dynamically scale font down when autoFitOnePage is enabled to strictly lock into 1 A4 page
  let effectiveFontScale = fontScale;
  if (autoFitOnePage) {
    if (totalBullets > 10 || activeSectionsCount > 5) {
      effectiveFontScale = Math.min(fontScale, 0.85);
    } else if (totalBullets > 6) {
      effectiveFontScale = Math.min(fontScale, 0.90);
    } else {
      effectiveFontScale = Math.min(fontScale, 0.95);
    }
  }

  // Base font size and scaling (standard base 10pt scaled by effectiveFontScale)
  const basePt = (effectiveFontScale * 10).toFixed(1);
  const baseFontSizePx = effectiveFontScale * 13.33; // 10pt = 13.33px at 96 DPI

  // Dynamic theme colors & classes
  const themeConfig = isExecutive
    ? {
        name: "Executive Ivy",
        accentColor: "#1e293b",
        accentBorder: "border-slate-800",
        headingBorder: "border-b-2 border-slate-700",
        headingColor: "text-slate-900",
        headingFont: "font-serif",
        headerAlignment: "text-center",
        contactAlignment: "justify-center",
        ruleClass: "border-slate-300",
      }
    : isTech
    ? {
        name: "Tech Clean",
        accentColor: "#1d4ed8",
        accentBorder: "border-blue-700",
        headingBorder: "border-b border-blue-600",
        headingColor: "text-blue-900",
        headingFont: "font-sans",
        headerAlignment: "text-left",
        contactAlignment: "justify-start",
        ruleClass: "border-blue-200",
      }
    : {
        name: "Modern Minimalist",
        accentColor: "#059669",
        accentBorder: "border-emerald-600",
        headingBorder: "border-b border-emerald-600",
        headingColor: "text-emerald-950",
        headingFont: "font-sans",
        headerAlignment: "text-left",
        contactAlignment: "justify-start",
        ruleClass: "border-emerald-200",
      };

  return (
    <div className={`flex flex-col h-full bg-stone-100 dark:bg-stone-950 overflow-hidden print:overflow-visible print:h-auto transition-colors duration-200 ${className}`}>
      {/* Canvas Interactive Top Toolbar */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur px-2.5 sm:px-4 py-2 flex items-center justify-between shrink-0 text-xs print:hidden shadow-xs">
        {/* Left: View & Theme Info */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          <div className="flex items-center space-x-1.5 text-stone-800 dark:text-stone-200 font-bold">
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden xs:inline">A4 Canvas</span>
          </div>
          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono capitalize">
            {themeConfig.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 font-mono hidden sm:inline">
            {basePt} pt
          </span>
          {autoFitOnePage && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              1-Page Fit
            </span>
          )}
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-850 rounded-lg border border-stone-200 dark:border-stone-800 p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.42}
              className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-200 dark:hover:bg-stone-800 transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Fit Width Button */}
            <button
              type="button"
              onClick={handleFitWidth}
              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold transition text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200 dark:hover:bg-stone-800"
              title="Fit A4 sheet to screen width"
            >
              Fit
            </button>

            <div className="hidden sm:flex items-center px-1 space-x-0.5">
              {zoomLevels.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => handleSetZoom(z)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition ${
                    Math.abs(zoom - z) < 0.02
                      ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.2}
              className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-200 dark:hover:bg-stone-800 transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Plaintext button */}
          <button
            type="button"
            onClick={handleCopyText}
            className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-700 transition text-[11px]"
            title="Copy all resume text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden md:inline">Copy Text</span>
              </>
            )}
          </button>

          {/* View as ATS Robot trigger */}
          {onToggleAtsView && (
            <button
              type="button"
              onClick={onToggleAtsView}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition text-[11px]"
              title="Inspect raw linearized plain text as parsed by ATS robots"
            >
              <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">ATS Robot</span>
            </button>
          )}

          {/* DOCX button */}
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={exportingDocx}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-xs transition text-[11px] disabled:opacity-50"
            title="Export ATS-Friendly Word Document (.docx)"
          >
            <Download className={`w-3 h-3 ${exportingDocx ? "animate-bounce" : ""}`} />
            <span>{exportingDocx ? "..." : "DOCX"}</span>
          </button>

          {/* PDF Export button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold shadow-xs transition text-[11px] disabled:opacity-50"
            title="Download ATS-Friendly PDF Document (.pdf) (or Ctrl+P for Vector Print)"
          >
            <Printer className={`w-3 h-3 ${exportingPdf ? "animate-spin" : ""}`} />
            <span>{exportingPdf ? "..." : "PDF"}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Viewport Wrapper */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 md:p-8 flex justify-center bg-stone-200/80 dark:bg-stone-950/80 custom-scrollbar print:p-0 print:bg-white print:overflow-visible transition-colors duration-200">
        {/* Scale transformation wrapper */}
        <div
          id="resume-a4-sheet-wrapper"
          className="transition-transform duration-150 ease-out origin-top flex flex-col items-center print:transform-none print:m-0"
          style={{
            transform: `scale(${zoom})`,
            marginBottom: zoom > 1.0 ? `${(zoom - 1.0) * 1123}px` : undefined,
          }}
        >
          {/* A4 Sheet Container */}
          <article
            ref={sheetRef}
            id="resume-a4-sheet"
            className="bg-white text-slate-900 shadow-2xl rounded-sm print:shadow-none print:w-full print:max-w-none print:p-0 transition-all selection:bg-emerald-100 selection:text-emerald-900"
            style={
              {
                width: "210mm",
                minHeight: "297mm",
                maxHeight: autoFitOnePage ? "297mm" : undefined,
                overflow: autoFitOnePage ? "hidden" : "visible",
                maxWidth: "794px",
                padding: currentMargin.padding,
                fontFamily: appliedFontFamily,
                fontSize: `${baseFontSizePx}px`,
                lineHeight: autoFitOnePage ? "1.25" : "1.45",
                boxSizing: "border-box",
                "--section-gap": autoFitOnePage ? "0.5rem" : "1rem",
                "--bullet-gap": autoFitOnePage ? "0.2rem" : "0.35rem",
              } as React.CSSProperties
            }
          >
            {/* Header: Candidate Basics */}
            <header
              className={`border-b ${themeConfig.ruleClass} ${
                autoFitOnePage ? "pb-2.5 mb-2.5" : "pb-4 mb-4"
              } ${themeConfig.headerAlignment}`}
            >
              <h1
                className={`font-bold tracking-tight text-slate-900 ${
                  isExecutive ? "text-2xl sm:text-3xl font-serif tracking-normal" : "text-2xl sm:text-3xl"
                }`}
                style={{
                  fontSize: `calc(${baseFontSizePx}px * 2.1)`,
                  lineHeight: "1.15",
                }}
              >
                {basics.name || "Alex Morgan"}
              </h1>

              {basics.headline && (
                <p
                  className={`font-semibold mt-1 ${themeConfig.headingColor}`}
                  style={{
                    fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                  }}
                >
                  {basics.headline}
                </p>
              )}

              {/* Contact Information Bar */}
              <div
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 mt-2 ${
                  themeConfig.contactAlignment
                }`}
                style={{
                  fontSize: `calc(${baseFontSizePx}px * 0.9)`,
                }}
              >
                {basics.email && (
                  <a
                    href={`mailto:${basics.email}`}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{basics.email}</span>
                  </a>
                )}
                {basics.phone && (
                  <a
                    href={`tel:${basics.phone}`}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{basics.phone}</span>
                  </a>
                )}
                {basics.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{basics.location}</span>
                  </span>
                )}
                {basics.website && (
                  <a
                    href={basics.website.startsWith("http") ? basics.website : `https://${basics.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{basics.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                {basics.linkedin && (
                  <a
                    href={basics.linkedin.startsWith("http") ? basics.linkedin : `https://${basics.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    <span>LinkedIn</span>
                  </a>
                )}
                {basics.github && (
                  <a
                    href={basics.github.startsWith("http") ? basics.github : `https://${basics.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </header>

            {/* Dynamic Sections ordered by layout.sectionOrder */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--section-gap, 0.5rem)",
              }}
            >
              {(sectionOrder || [
                "summary",
                "experience",
                "projects",
                "skills",
                "education",
                "certifications",
              ]).map((sectionId) => {
                const isVisible = sectionVisibility?.[sectionId as SectionId] !== false;
                if (!isVisible) return null;

                // SECTION 1: Professional Summary
                if (sectionId === "summary") {
                  if (!basics.summary) return null;
                  return (
                    <section
                      key="sec-summary"
                      data-section="summary"
                      className={autoFitOnePage ? "space-y-1" : "space-y-1.5"}
                    >
                      <h2
                        className={`font-bold uppercase tracking-wider pb-0.5 ${themeConfig.headingBorder} ${themeConfig.headingColor} ${themeConfig.headingFont}`}
                        style={{
                          fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                        }}
                      >
                        Professional Summary
                      </h2>
                      <p className="text-slate-700 text-justify leading-relaxed">
                        {basics.summary}
                      </p>
                    </section>
                  );
                }

                // SECTION 2: Work Experience
                if (sectionId === "experience") {
                  if (!experience || experience.length === 0) return null;
                  return (
                    <section
                      key="sec-experience"
                      data-section="experience"
                      className={autoFitOnePage ? "space-y-2" : "space-y-3"}
                    >
                      <h2
                        className={`font-bold uppercase tracking-wider pb-0.5 ${themeConfig.headingBorder} ${themeConfig.headingColor} ${themeConfig.headingFont}`}
                        style={{
                          fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                        }}
                      >
                        Work Experience
                      </h2>
                      <div className={autoFitOnePage ? "space-y-2" : "space-y-3"}>
                        {experience.map((exp) => (
                          <div
                            key={exp.id}
                            className={autoFitOnePage ? "space-y-0.5" : "space-y-1"}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-slate-900 inline">
                                  {exp.position}
                                </h3>
                                <span className="text-slate-600 font-semibold">
                                  {" "}• {exp.company}
                                </span>
                                {exp.location && (
                                  <span className="text-slate-500 font-normal">
                                    {" "}({exp.location})
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 font-mono text-[0.85em] whitespace-nowrap ml-2">
                                {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                              </span>
                            </div>

                            {exp.description && (
                              <p className="text-slate-600 italic text-[0.95em]">
                                {exp.description}
                              </p>
                            )}

                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul
                                className="list-disc list-outside ml-4 text-slate-700 leading-relaxed"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "var(--bullet-gap, 0.2rem)",
                                }}
                              >
                                {exp.bullets.map((bullet) => (
                                  <li key={bullet.id}>{bullet.text}</li>
                                ))}
                              </ul>
                            )}

                            {exp.technologies && exp.technologies.length > 0 && (
                              <p className="text-slate-500 text-[0.85em]">
                                <span className="font-semibold text-slate-700">Technologies: </span>
                                {exp.technologies.join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                // SECTION 3: Key Projects
                if (sectionId === "projects") {
                  if (!projects || projects.length === 0) return null;
                  return (
                    <section
                      key="sec-projects"
                      data-section="projects"
                      className={autoFitOnePage ? "space-y-2" : "space-y-2.5"}
                    >
                      <h2
                        className={`font-bold uppercase tracking-wider pb-0.5 ${themeConfig.headingBorder} ${themeConfig.headingColor} ${themeConfig.headingFont}`}
                        style={{
                          fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                        }}
                      >
                        Key Projects
                      </h2>
                      <div className={autoFitOnePage ? "space-y-1.5" : "space-y-2.5"}>
                        {projects.map((proj) => (
                          <div
                            key={proj.id}
                            className={autoFitOnePage ? "space-y-0.5" : "space-y-1"}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-slate-900 inline">
                                  {proj.name}
                                </h3>
                                {proj.role && (
                                  <span className="text-slate-600 font-normal">
                                    {" "}— {proj.role}
                                  </span>
                                )}
                              </div>
                              {(proj.startDate || proj.endDate) && (
                                <span className="text-slate-500 font-mono text-[0.85em] whitespace-nowrap ml-2">
                                  {proj.startDate}
                                  {proj.endDate ? ` – ${proj.endDate}` : ""}
                                </span>
                              )}
                            </div>

                            {proj.description && (
                              <p className="text-slate-600 text-[0.95em]">
                                {proj.description}
                              </p>
                            )}

                            {proj.bullets && proj.bullets.length > 0 && (
                              <ul
                                className="list-disc list-outside ml-4 text-slate-700 leading-relaxed"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "var(--bullet-gap, 0.2rem)",
                                }}
                              >
                                {proj.bullets.map((b) => (
                                  <li key={b.id}>{b.text}</li>
                                ))}
                              </ul>
                            )}

                            {proj.technologies && proj.technologies.length > 0 && (
                              <p className="text-slate-500 text-[0.85em]">
                                <span className="font-semibold text-slate-700">Tech Stack: </span>
                                {proj.technologies.join(", ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                // SECTION 4: Technical Skills
                if (sectionId === "skills") {
                  if (!skills || skills.length === 0) return null;
                  return (
                    <section
                      key="sec-skills"
                      data-section="skills"
                      className={autoFitOnePage ? "space-y-1" : "space-y-1.5"}
                    >
                      <h2
                        className={`font-bold uppercase tracking-wider pb-0.5 ${themeConfig.headingBorder} ${themeConfig.headingColor} ${themeConfig.headingFont}`}
                        style={{
                          fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                        }}
                      >
                        Technical Skills
                      </h2>
                      <div className="space-y-0.5 text-slate-700">
                        {skills.map((group) => (
                          <div
                            key={group.id}
                            className="flex flex-wrap items-baseline gap-x-1.5"
                          >
                            <span className="font-bold text-slate-900 min-w-[130px]">
                              {group.category}:
                            </span>
                            <span>{group.skills.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                // SECTION 5: Education
                if (sectionId === "education") {
                  if (!education || education.length === 0) return null;
                  return (
                    <section
                      key="sec-education"
                      data-section="education"
                      className={autoFitOnePage ? "space-y-1.5" : "space-y-2"}
                    >
                      <h2
                        className={`font-bold uppercase tracking-wider pb-0.5 ${themeConfig.headingBorder} ${themeConfig.headingColor} ${themeConfig.headingFont}`}
                        style={{
                          fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                        }}
                      >
                        Education
                      </h2>
                      <div className={autoFitOnePage ? "space-y-1" : "space-y-1.5"}>
                        {education.map((edu) => (
                          <div key={edu.id} className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {edu.degree} in {edu.field}
                              </h3>
                              <p className="text-slate-600">
                                {edu.institution}
                                {edu.location ? `, ${edu.location}` : ""}
                                {edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
                              </p>
                              {edu.highlights && edu.highlights.length > 0 && (
                                <ul
                                  className="list-disc list-outside ml-4 mt-0.5 text-slate-600 text-[0.9em]"
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "var(--bullet-gap, 0.2rem)",
                                  }}
                                >
                                  {edu.highlights.map((h) => (
                                    <li key={h.id}>{h.text}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <span className="text-slate-500 font-mono text-[0.85em] whitespace-nowrap ml-2">
                              {edu.startDate} – {edu.endDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                // SECTION 6: Certifications
                if (sectionId === "certifications") {
                  if (!certifications || certifications.length === 0) return null;
                  return (
                    <section
                      key="sec-certifications"
                      data-section="certifications"
                      className={autoFitOnePage ? "space-y-1" : "space-y-1.5"}
                    >
                      <h2
                        className={`font-bold uppercase tracking-wider pb-0.5 ${themeConfig.headingBorder} ${themeConfig.headingColor} ${themeConfig.headingFont}`}
                        style={{
                          fontSize: `calc(${baseFontSizePx}px * 1.05)`,
                        }}
                      >
                        Certifications & Credentials
                      </h2>
                      <div className="space-y-1 text-slate-700">
                        {certifications.map((cert) => (
                          <div key={cert.id} className="flex justify-between items-baseline">
                            <div>
                              <span className="font-semibold text-slate-900">
                                {cert.name}
                              </span>
                              <span className="text-slate-600"> — {cert.issuer}</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[0.85em] whitespace-nowrap ml-2">
                              {cert.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                return null;
              })}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default ResumeCanvas;
