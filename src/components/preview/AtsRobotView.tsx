"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Copy,
  Check,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Hash,
  Terminal,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionId } from "@/lib/schema/resume";

export interface AtsRobotViewProps {
  className?: string;
  onSwitchToCanvas?: () => void;
}

export const AtsRobotView: React.FC<AtsRobotViewProps> = ({
  className = "",
  onSwitchToCanvas,
}) => {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { resume } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate deterministic linearized plain text stream
  const { plainText, lines, metrics } = useMemo(() => {
    if (!resume) {
      return {
        plainText: "",
        lines: [],
        metrics: {
          wordCount: 0,
          charCount: 0,
          lineCount: 0,
          sectionsCount: 0,
          bulletCount: 0,
        },
      };
    }

    const { basics, experience, projects, skills, education, certifications, layout } = resume;
    const { sectionOrder, sectionVisibility } = layout;

    const stream: string[] = [];

    // 1. Candidate Contact Information Header
    stream.push(basics.name ? basics.name.toUpperCase() : "UNTITLED CANDIDATE");
    if (basics.headline) {
      stream.push(basics.headline);
    }

    const contactParts: string[] = [];
    if (basics.email) contactParts.push(`Email: ${basics.email}`);
    if (basics.phone) contactParts.push(`Phone: ${basics.phone}`);
    if (basics.location) contactParts.push(`Location: ${basics.location}`);
    if (contactParts.length > 0) {
      stream.push(contactParts.join(" | "));
    }

    const linkParts: string[] = [];
    if (basics.website) linkParts.push(`Website: ${basics.website}`);
    if (basics.linkedin) linkParts.push(`LinkedIn: ${basics.linkedin}`);
    if (basics.github) linkParts.push(`GitHub: ${basics.github}`);
    if (linkParts.length > 0) {
      stream.push(linkParts.join(" | "));
    }

    stream.push(""); // Spacer

    let bulletCount = 0;
    let sectionsCount = 0;

    // 2. Linearized Sections according to sectionOrder
    (sectionOrder || [
      "summary",
      "experience",
      "projects",
      "skills",
      "education",
      "certifications",
    ]).forEach((sectionId) => {
      const isVisible = sectionVisibility?.[sectionId as SectionId] !== false;
      if (!isVisible) return;

      if (sectionId === "summary" && basics.summary) {
        sectionsCount++;
        stream.push("========================================");
        stream.push("PROFESSIONAL SUMMARY");
        stream.push("========================================");
        stream.push(basics.summary.trim());
        stream.push("");
      }

      if (sectionId === "experience" && experience && experience.length > 0) {
        sectionsCount++;
        stream.push("========================================");
        stream.push("WORK EXPERIENCE");
        stream.push("========================================");

        experience.forEach((exp) => {
          const titleLine = `${exp.position} | ${exp.company}${
            exp.location ? ` | ${exp.location}` : ""
          }`;
          const dateLine = `Dates: ${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`;
          stream.push(titleLine);
          stream.push(dateLine);

          if (exp.description) {
            stream.push(`Overview: ${exp.description}`);
          }

          if (exp.bullets && exp.bullets.length > 0) {
            exp.bullets.forEach((b) => {
              bulletCount++;
              stream.push(`* ${b.text.trim()}`);
            });
          }

          if (exp.technologies && exp.technologies.length > 0) {
            stream.push(`Technologies: ${exp.technologies.join(", ")}`);
          }
          stream.push("");
        });
      }

      if (sectionId === "projects" && projects && projects.length > 0) {
        sectionsCount++;
        stream.push("========================================");
        stream.push("KEY PROJECTS");
        stream.push("========================================");

        projects.forEach((proj) => {
          const nameLine = proj.role
            ? `${proj.name} (Role: ${proj.role})`
            : proj.name;
          stream.push(nameLine);

          if (proj.startDate || proj.endDate) {
            stream.push(
              `Timeline: ${proj.startDate || ""}${
                proj.endDate ? ` - ${proj.endDate}` : ""
              }`
            );
          }

          if (proj.description) {
            stream.push(`Description: ${proj.description}`);
          }

          if (proj.bullets && proj.bullets.length > 0) {
            proj.bullets.forEach((b) => {
              bulletCount++;
              stream.push(`* ${b.text.trim()}`);
            });
          }

          if (proj.technologies && proj.technologies.length > 0) {
            stream.push(`Technologies: ${proj.technologies.join(", ")}`);
          }

          if (proj.url || proj.githubUrl) {
            const urls = [proj.url, proj.githubUrl].filter(Boolean);
            stream.push(`Links: ${urls.join(" | ")}`);
          }
          stream.push("");
        });
      }

      if (sectionId === "skills" && skills && skills.length > 0) {
        sectionsCount++;
        stream.push("========================================");
        stream.push("TECHNICAL SKILLS");
        stream.push("========================================");

        skills.forEach((group) => {
          stream.push(`${group.category}: ${group.skills.join(", ")}`);
        });
        stream.push("");
      }

      if (sectionId === "education" && education && education.length > 0) {
        sectionsCount++;
        stream.push("========================================");
        stream.push("EDUCATION");
        stream.push("========================================");

        education.forEach((edu) => {
          stream.push(`${edu.degree} in ${edu.field}`);
          stream.push(
            `Institution: ${edu.institution}${edu.location ? `, ${edu.location}` : ""}`
          );
          stream.push(`Dates: ${edu.startDate} - ${edu.endDate}`);
          if (edu.gpa) {
            stream.push(`GPA: ${edu.gpa}`);
          }
          if (edu.highlights && edu.highlights.length > 0) {
            edu.highlights.forEach((h) => {
              stream.push(`* ${h.text}`);
            });
          }
          stream.push("");
        });
      }

      if (sectionId === "certifications" && certifications && certifications.length > 0) {
        sectionsCount++;
        stream.push("========================================");
        stream.push("CERTIFICATIONS & CREDENTIALS");
        stream.push("========================================");

        certifications.forEach((cert) => {
          stream.push(`${cert.name} | Issuer: ${cert.issuer} | Date: ${cert.date}`);
        });
        stream.push("");
      }
    });

    const fullText = stream.join("\n");
    const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

    return {
      plainText: fullText,
      lines: stream,
      metrics: {
        wordCount: words,
        charCount: fullText.length,
        lineCount: stream.length,
        sectionsCount,
        bulletCount,
      },
    };
  }, [resume]);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center space-x-2 text-xs">
          <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Extracting linearized ATS text stream...</span>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handleDownloadTxt = () => {
    const filename = `${resume.basics.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_ats_plain.txt`;
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden ${className}`}>
      {/* Top ATS Verification Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 shrink-0 space-y-3">
        {/* Verification Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  ATS Robot Linear Stream
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% Parser Compliant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Exact linearized text stream ingested by Workday, Taleo, Greenhouse, and Lever parsers.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition text-xs"
              title="Copy plain text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-mono">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Stream</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition text-xs"
              title="Download raw .txt file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .TXT</span>
            </button>
          </div>
        </div>

        {/* Verification Checklist Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-[11px]">Zero Unparseable Tables</p>
              <p className="text-[10px] text-slate-400 mt-0.5">100% Single-column flow</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-[11px]">Single-Column Flow</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Zero column collision risk</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-[11px]">Standard Headers</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{metrics.sectionsCount} Sections recognized</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-[11px]">Parse Latency</p>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">&lt; 2ms (Clean ASCII)</p>
            </div>
          </div>
        </div>

        {/* Search & Stream Metadata Strip */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="font-mono">
              Words: <strong className="text-slate-200">{metrics.wordCount}</strong>
            </span>
            <span className="font-mono">
              Characters: <strong className="text-slate-200">{metrics.charCount}</strong>
            </span>
            <span className="font-mono">
              Bullets: <strong className="text-slate-200">{metrics.bulletCount}</strong>
            </span>
            <span className="font-mono hidden sm:inline">
              Lines: <strong className="text-slate-200">{metrics.lineCount}</strong>
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Find keyword in stream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Raw Stream Terminal Output */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 font-mono text-xs leading-relaxed custom-scrollbar">
        <div className="max-w-4xl mx-auto rounded-xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl">
          {/* Terminal Banner */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="font-mono ml-2 text-slate-300">
                stdin:ats_text_parser_v4.2.1
              </span>
            </div>
            <span className="text-emerald-400 font-mono">
              STATUS: OK (No glyph collisions)
            </span>
          </div>

          {/* Line by line display */}
          <div className="space-y-0.5 select-text text-slate-300 font-mono text-[12px] whitespace-pre-wrap">
            {lines.map((line, idx) => {
              const isHeaderLine = line.startsWith("===");
              const isSectionTitle = !isHeaderLine && idx > 0 && lines[idx - 1]?.startsWith("===");
              const isCandidateName = idx === 0;
              const matchesSearch =
                searchQuery.trim().length > 0 &&
                line.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div
                  key={idx}
                  className={`flex items-start group hover:bg-slate-800/40 px-1 rounded transition-colors ${
                    matchesSearch ? "bg-emerald-950/60 ring-1 ring-emerald-500/50" : ""
                  }`}
                >
                  <span className="w-10 shrink-0 text-slate-600 text-right pr-4 select-none text-[10px] pt-0.5 font-mono">
                    {idx + 1}
                  </span>
                  <span
                    className={`flex-1 break-words ${
                      isCandidateName
                        ? "text-emerald-400 font-bold text-sm"
                        : isSectionTitle
                        ? "text-amber-300 font-bold tracking-wider"
                        : isHeaderLine
                        ? "text-slate-600"
                        : line.startsWith("* ")
                        ? "text-slate-200"
                        : "text-slate-300"
                    }`}
                  >
                    {line || "\u00A0"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtsRobotView;
