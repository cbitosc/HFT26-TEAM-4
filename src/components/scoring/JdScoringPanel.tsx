"use client";

import React, { useState, useMemo } from "react";
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  FileText,
  Search,
  Filter,
  Layers,
  Award,
  Globe,
  Link2,
  Loader2,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  calculateJdCoverage,
  JdCoverageReport,
  MatchedKeyword,
  MissingKeyword,
  RequirementTier,
} from "@/lib/scoring/deterministicScorer";
import { getSkillCategory, SkillCategory } from "@/lib/scoring/skillTaxonomy";
import {
  sampleJds,
  stripeFullStackJd,
  googleMlJd,
  airbnbProductManagerJd,
} from "@/lib/presets/sampleJds";
import { JdRequirements } from "@/lib/schema/jd";

export const JdScoringPanel: React.FC = () => {
  const { resume, jd, setJd, addSkillToGroup, addSkillGroup } = useResumeStore();

  const [activeFilter, setActiveFilter] = useState<"all" | "missing" | "matched" | "must-have">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [justAddedSkill, setJustAddedSkill] = useState<string | null>(null);

  // URL Importer State
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<{ message: string; advice?: string } | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState<string | null>(null);

  // Real-time deterministic coverage calculation (<5ms)
  const report: JdCoverageReport = useMemo(() => {
    return calculateJdCoverage(resume, jd);
  }, [resume, jd]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJd(e.target.value);
  };

  const handleExtractJd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    setIsScraping(true);
    setScrapeError(null);
    setScrapeSuccess(null);

    try {
      const res = await fetch("/api/scrape-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setScrapeError({
          message: data.error || "Failed to extract job posting from URL.",
          advice:
            data.advice ||
            "Many job platforms require login or block scrapers. Please copy and paste the job description text directly.",
        });
      } else {
        setJd(data.text);
        setScrapeSuccess(
          `Successfully extracted ${data.text.length} characters from ${data.title ? `"${data.title}"` : "job posting"}!`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setScrapeError({
        message: `Network error: ${message}`,
        advice: "Could not reach the scraping service. Please copy and paste the job description text directly.",
      });
    } finally {
      setIsScraping(false);
    }
  };


  const handleLoadSample = (sample: JdRequirements) => {
    setJd(sample);
  };

  const handleClearJd = () => {
    setJd("");
  };

  const handleAddSkill = (skill: string) => {
    const targetCategory = getSkillCategory(skill);

    // Look for an existing group that matches the category
    const categoryLower = targetCategory.toLowerCase();
    const existingGroup = resume.skills.find((group) => {
      const gLower = group.category.toLowerCase();
      return (
        gLower === categoryLower ||
        gLower.includes(categoryLower) ||
        categoryLower.includes(gLower)
      );
    });

    if (existingGroup) {
      addSkillToGroup(existingGroup.id, skill);
    } else if (resume.skills.length > 0) {
      // If no exact match, add to the first skill group
      addSkillToGroup(resume.skills[0].id, skill);
    } else {
      // Create a brand new skill group for this category
      addSkillGroup({
        id: `sk-group-${Date.now()}`,
        category: targetCategory,
        skills: [skill],
      });
    }

    setJustAddedSkill(skill);
    setTimeout(() => {
      setJustAddedSkill((prev) => (prev === skill ? null : prev));
    }, 2500);
  };

  // Color logic for overall gauge
  const getScoreTheme = (score: number) => {
    if (score >= 90) {
      return {
        label: "Exceptional Match",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        barColor: "bg-emerald-400",
        strokeColor: "#34d399",
        textColor: "text-emerald-400",
        desc: "Exceeds requirements; ATS keyword threshold met for top interview ranking.",
      };
    } else if (score >= 75) {
      return {
        label: "Strong Match",
        badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
        barColor: "bg-teal-400",
        strokeColor: "#2dd4bf",
        textColor: "text-teal-400",
        desc: "Solid alignment with core requirements and strong bullet evidence.",
      };
    } else if (score >= 50) {
      return {
        label: "Moderate Fit",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        barColor: "bg-amber-400",
        strokeColor: "#fbbf24",
        textColor: "text-amber-400",
        desc: "Covers general skills, but has missing must-haves or unevidenced keywords.",
      };
    } else {
      return {
        label: "Needs Alignment",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        barColor: "bg-rose-400",
        strokeColor: "#f43f5e",
        textColor: "text-rose-400",
        desc: "Significant keyword gap. Address red must-haves to clear ATS automated filters.",
      };
    }
  };

  const theme = getScoreTheme(report.overallScore);

  // Word and character counts
  const rawText = jd.rawText || "";
  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  // Filtered lists for the keyword alignment grid
  const filteredMissing = useMemo(() => {
    return report.missingKeywords.filter((kw) => {
      if (activeFilter === "matched") return false;
      if (activeFilter === "must-have" && kw.tier !== "must-have") return false;
      if (searchQuery) {
        return (
          kw.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kw.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    });
  }, [report.missingKeywords, activeFilter, searchQuery]);

  const filteredMatched = useMemo(() => {
    return report.matchedKeywords.filter((kw) => {
      if (activeFilter === "missing") return false;
      if (activeFilter === "must-have" && kw.tier !== "must-have") return false;
      if (searchQuery) {
        return (
          kw.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kw.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (kw.evidenceSnippet && kw.evidenceSnippet.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return true;
    });
  }, [report.matchedKeywords, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Header with Title and Benchmarking */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-stone-200 dark:border-stone-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
              JD Coverage & Deterministic Keyword Matrix
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Evaluates 400+ tech skills with weighted evidence: 1.0x in bullets, 0.6x in skills list, 0.0x missing.
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
            <Zap className="w-3 h-3 mr-1" />
            {report.executionTimeMs}ms
          </span>
          <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-800">
            400+ Taxonomy
          </span>
        </div>
      </div>

      {/* 1-Click Sample JD Presets */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Load Sample Target Job Description
          </span>
          {rawText.length > 0 && (
            <button
              onClick={handleClearJd}
              className="text-[11px] text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear JD
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample(stripeFullStackJd)}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              jd.id === "jd-stripe-fullstack"
                ? "bg-amber-50 dark:bg-stone-850 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20"
                : "bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-850/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900 dark:text-white">Stripe</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-peach-100 dark:bg-peach-950/40 text-peach-800 dark:text-peach-300 font-bold border border-peach-200 dark:border-peach-800/40">
                Full-Stack
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 line-clamp-1">
              Senior Full-Stack Engineer
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample(googleMlJd)}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              jd.id === "jd-google-ml"
                ? "bg-amber-50 dark:bg-stone-850 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20"
                : "bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-850/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900 dark:text-white">Google</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                AI / ML
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 line-clamp-1">
              Senior Machine Learning Engineer
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample(airbnbProductManagerJd)}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              jd.id === "jd-airbnb-tpm"
                ? "bg-amber-50 dark:bg-stone-850 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20"
                : "bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-850/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900 dark:text-white">Airbnb</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-gold-100 dark:bg-gold-950/40 text-gold-800 dark:text-gold-300 font-bold border border-gold-200 dark:border-gold-800/40">
                Platform PM
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 line-clamp-1">
              Senior Technical Product Manager
            </p>
          </button>
        </div>
      </div>

      {/* Target Job Description: URL Importer & Text Area */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="jd-input-box"
            className="block text-xs font-semibold text-slate-300"
          >
            Target Job Description Text
          </label>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setShowUrlImport(!showUrlImport);
                setScrapeError(null);
                setScrapeSuccess(null);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition ${
                showUrlImport
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800/80 text-slate-300 hover:text-emerald-400 border border-slate-700/80"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{showUrlImport ? "Close URL Importer" : "Import from URL"}</span>
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-slate-400 font-mono">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        </div>

        {/* Expandable SSRF-Protected URL Reader Box */}
        {showUrlImport && (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3 transition">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-white">Import from Public Job Posting URL</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  SSRF Protected
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Greenhouse, Lever, standard public boards</span>
            </div>

            <form onSubmit={handleExtractJd} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://boards.greenhouse.io/company/jobs/..."
                  disabled={isScraping}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isScraping || !urlInput.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm shrink-0"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting JD...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract JD</span>
                  </>
                )}
              </button>
            </form>

            {/* Success Feedback Alert */}
            {scrapeSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{scrapeSuccess}</p>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    Extracted text loaded into the editor below and scored in real-time.
                  </p>
                </div>
              </div>
            )}

            {/* Graceful Fallback Error Alert with Clear Direct-Paste Guidance */}
            {scrapeError && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-amber-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{scrapeError.message}</span>
                </div>
                {scrapeError.advice && (
                  <p className="text-[11px] text-amber-200/90 pl-6 leading-relaxed">
                    💡 {scrapeError.advice}
                  </p>
                )}
                <div className="pl-6 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("jd-input-box");
                      if (el) el.focus();
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-medium flex items-center gap-1"
                  >
                    Paste text manually into editor below &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <textarea
          id="jd-input-box"
          rows={7}
          value={rawText}
          onChange={handleTextChange}
          placeholder="Paste job posting text here (responsibilities, requirements, qualifications)..."
          className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono leading-relaxed resize-y shadow-xs"
        />
      </div>

      {/* Real-Time Coverage Gauge Card with Linear/Raycast Ambient Obsidian Theme */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white dark:bg-obsidian-900/90 border border-slate-200 dark:border-white/[0.08] shadow-sm transition-all duration-200">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Circular/Numeric Score Presentation with Glowing SVG Ring */}
          <div className="flex items-center space-x-5">
            <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
              {/* Circular SVG Gauge with Glow */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-obsidian-800"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeDasharray={`${report.overallScore}, 100`}
                  stroke={theme.strokeColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    filter: `drop-shadow(0 0 6px ${theme.strokeColor}66)`,
                  }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {report.overallScore}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono font-bold">
                  Coverage
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border tracking-tight ${theme.badge}`}>
                  {theme.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {report.matchedCount}/{report.totalRequiredKeywords} skills
                </span>
                {/* Floating Live Indicator Badge */}
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md tracking-tight">
                {theme.desc}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200 dark:border-white/[0.08] pt-3 sm:pt-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Missing Gaps</span>
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                report.missingCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {report.missingCount} {report.missingCount === 1 ? "gap" : "gaps"}
            </span>
          </div>
        </div>

        {/* 3 Metric Breakdown Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06]">
          {/* Must-Haves */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-850/80 border border-slate-200 dark:border-white/[0.06] hover:border-white/10 transition-all duration-150 hover:-translate-y-0.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tracking-tight">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Must-Haves (3.0x)
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{report.mustHaveScore}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-obsidian-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${report.mustHaveScore}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {report.mustHaveCount} core requirements identified
            </p>
          </div>

          {/* Preferred */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-850/80 border border-slate-200 dark:border-white/[0.06] hover:border-white/10 transition-all duration-150 hover:-translate-y-0.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tracking-tight">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Preferred (1.5x)
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{report.preferredScore}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-obsidian-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${report.preferredScore}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {report.preferredCount} nice-to-have qualifications
            </p>
          </div>

          {/* Bullet Evidence */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-850/80 border border-slate-200 dark:border-white/[0.06] hover:border-white/10 transition-all duration-150 hover:-translate-y-0.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tracking-tight">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Bullet Evidence (1.0x)
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{report.bulletEvidenceScore}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-obsidian-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${report.bulletEvidenceScore}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Matched skills backed by real bullet points
            </p>
          </div>
        </div>
      </div>

      {/* Keyword Alignment & Gap Matrix */}
      <div className="space-y-3">
        {/* Filter bar and search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-stone-100 dark:bg-stone-900/80 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeFilter === "all"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm border border-stone-200 dark:border-stone-700"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              All ({report.totalRequiredKeywords})
            </button>
            <button
              onClick={() => setActiveFilter("missing")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 ${
                activeFilter === "missing"
                  ? "bg-peach-100 dark:bg-peach-950/60 text-peach-800 dark:text-peach-300 border border-peach-300 dark:border-peach-800/50"
                  : "text-stone-600 dark:text-stone-400 hover:text-peach-600 dark:hover:text-peach-300"
              }`}
            >
              Missing Gaps ({report.missingCount})
            </button>
            <button
              onClick={() => setActiveFilter("matched")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 ${
                activeFilter === "matched"
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50"
                  : "text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-300"
              }`}
            >
              Matched ({report.matchedCount})
            </button>
            <button
              onClick={() => setActiveFilter("must-have")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeFilter === "must-have"
                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              Must-Haves ({report.mustHaveCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search keyword or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500 font-mono shadow-sm"
            />
          </div>
        </div>

        {/* Section 1: Missing Keywords (Priority Gaps) with 1-Click Injection */}
        {(activeFilter === "all" || activeFilter === "missing" || activeFilter === "must-have") &&
          filteredMissing.length > 0 && (
            <div className="p-4 rounded-xl bg-peach-50/40 dark:bg-stone-900/60 border border-peach-200/80 dark:border-peach-900/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-peach-900 dark:text-peach-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-peach-600 dark:text-peach-400" />
                  Missing Skill Gaps ({filteredMissing.length})
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Click &quot;+ Add to Skills&quot; to inject instantly and boost coverage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMissing.map((item) => {
                  const isJustAdded = justAddedSkill === item.skill;
                  return (
                    <div
                      key={item.skill}
                      className="p-2.5 rounded-lg bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 hover:border-peach-300 dark:hover:border-stone-700 transition flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                            {item.skill}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              item.tier === "must-have"
                                ? "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30"
                                : item.tier === "preferred"
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                            }`}
                          >
                            {item.tier === "must-have" ? "Must-Have" : item.tier === "preferred" ? "Preferred" : "General"}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate mt-0.5">
                          {item.category}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSkill(item.skill)}
                        disabled={isJustAdded}
                        className={`shrink-0 px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 shadow-sm ${
                          isJustAdded
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-600 hover:to-gold-600 text-white border border-amber-400/40"
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>+ Add to Skills</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Section 2: Matched Keywords with Evidence Badges */}
        {(activeFilter === "all" || activeFilter === "matched" || activeFilter === "must-have") &&
          filteredMatched.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-stone-900/60 border border-emerald-200/80 dark:border-emerald-900/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Matched Keywords ({filteredMatched.length})
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Full 1.0x credit for bullet evidence, 0.6x for skills section
                </span>
              </div>

              <div className="space-y-2">
                {filteredMatched.map((item) => {
                  const isExpanded = expandedKeyword === item.skill;
                  return (
                    <div
                      key={item.skill}
                      className="rounded-lg bg-white dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800/80 overflow-hidden transition shadow-sm"
                    >
                      <div
                        onClick={() => setExpandedKeyword(isExpanded ? null : item.skill)}
                        className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {item.credit === 1.0 ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                          )}
                          <span className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                            {item.skill}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono hidden sm:inline">
                            ({item.category})
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              item.credit === 1.0
                                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/25"
                                : "bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/25"
                            }`}
                          >
                            {item.credit === 1.0 ? "Bullet Evidence (1.0x)" : "Skills List (0.6x)"}
                          </span>
                          {item.evidenceSnippet && (
                            <button
                              type="button"
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                              aria-label="Toggle evidence details"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Snippet / Evidence Location */}
                      {isExpanded && item.evidenceSnippet && (
                        <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 text-[11px] space-y-1 font-mono">
                          <div className="text-stone-600 dark:text-stone-400 flex items-center gap-1 font-sans">
                            <Layers className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            <span className="font-semibold text-stone-800 dark:text-stone-300">Evidence Source:</span>{" "}
                            {item.location || "Resume"}
                          </div>
                          <p className="text-stone-700 dark:text-stone-300 pl-4 border-l-2 border-emerald-500/50 italic">
                            &quot;{item.evidenceSnippet}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Empty State */}
        {filteredMissing.length === 0 && filteredMatched.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              No keywords match your current filter or search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JdScoringPanel;
