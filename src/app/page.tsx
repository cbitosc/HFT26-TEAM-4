"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/navbar/Header";
import EditorTabs from "@/components/editor/EditorTabs";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  FileText,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Globe,
  Layers,
} from "lucide-react";

import { ResumeTheme, ResumeFontFamily, SectionId } from "@/lib/schema/resume";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { resume } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fontClassMap: Record<ResumeFontFamily, string> = {
    inter: "font-sans",
    roboto: "font-sans",
    garamond: "font-serif",
  };

  const themeAccentMap: Record<ResumeTheme, string> = {
    modern: "text-emerald-700 border-emerald-600",
    "modern-minimal": "text-emerald-700 border-emerald-600",
    executive: "text-slate-800 border-slate-700",
    "executive-ivy": "text-slate-800 border-slate-700",
    tech: "text-blue-800 border-blue-700",
    "tech-clean": "text-blue-800 border-blue-700",
  };

  const currentFontClass = mounted
    ? fontClassMap[resume.layout.fontFamily] ?? "font-sans"
    : "font-sans";

  const currentThemeAccent = mounted
    ? themeAccentMap[resume.layout.theme] ?? "text-emerald-700 border-emerald-600"
    : "text-emerald-700 border-emerald-600";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Studio Header */}
      <Header />

      {/* Main Studio Workspace: Responsive Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden">
        {/* Left Pane: Tabbed Form Editor & Studio Controls */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden">
          <EditorTabs />
        </div>

        {/* Right Pane: Live A4 Resume Canvas Preview Container */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Canvas Sub-Header & Controls */}
          <div className="border-b border-slate-800/80 bg-slate-900/90 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Live A4 Preview</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  60 FPS
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono capitalize">
                Theme: {mounted ? resume.layout.theme : "modern"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                1 / 1 Page
              </span>
            </div>
          </div>

          {/* Scrollable Canvas Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/70 custom-scrollbar print:p-0 print:bg-white">
            {/* A4 Sheet Container */}
            <article
              id="resume-a4-sheet"
              className={`w-full max-w-[794px] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-10 transition-all ${currentFontClass} print:shadow-none print:w-full print:max-w-none print:p-0`}
              style={{
                minHeight: "1123px",
              }}
            >
              {/* Header / Basics */}
              <header className="border-b border-slate-200 pb-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {mounted ? resume.basics.name : "Alex Morgan"}
                </h1>
                <p className={`text-sm font-semibold mt-0.5 ${currentThemeAccent.split(" ")[0]}`}>
                  {mounted ? resume.basics.headline : "Senior Full-Stack Engineer"}
                </p>

                {/* Contact items */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2.5">
                  {mounted && resume.basics.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {resume.basics.email}
                    </span>
                  )}
                  {mounted && resume.basics.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {resume.basics.phone}
                    </span>
                  )}
                  {mounted && resume.basics.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {resume.basics.location}
                    </span>
                  )}
                  {mounted && resume.basics.website && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500" />
                      {resume.basics.website.replace(/^https?:\/\//, "")}
                    </span>
                  )}
                </div>
              </header>

              {/* Dynamic Sections ordered by layout.sectionOrder */}
              <div className="space-y-4">
                {(mounted ? resume.layout.sectionOrder : [
                  "summary",
                  "experience",
                  "projects",
                  "skills",
                  "education",
                  "certifications",
                ]).map((sectionId) => {
                  const isVisible = mounted
                    ? resume.layout.sectionVisibility[sectionId as SectionId] !== false
                    : true;

                  if (!isVisible) return null;

                  if (sectionId === "summary" && mounted && resume.basics.summary) {
                    return (
                      <section key="sec-summary" className="space-y-1.5">
                        <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${currentThemeAccent}`}>
                          Professional Summary
                        </h2>
                        <p className="text-xs text-slate-700 leading-relaxed text-justify">
                          {resume.basics.summary}
                        </p>
                      </section>
                    );
                  }

                  if (sectionId === "experience" && mounted && resume.experience.length > 0) {
                    return (
                      <section key="sec-experience" className="space-y-3">
                        <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${currentThemeAccent}`}>
                          Work Experience
                        </h2>
                        <div className="space-y-3">
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="space-y-1">
                              <div className="flex items-start justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900">
                                    {exp.position}
                                  </span>
                                  <span className="text-slate-600 font-medium">
                                    {" "}• {exp.company}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                                  {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                                </span>
                              </div>
                              <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                                {exp.bullets.map((b) => (
                                  <li key={b.id}>{b.text}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionId === "projects" && mounted && resume.projects.length > 0) {
                    return (
                      <section key="sec-projects" className="space-y-2.5">
                        <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${currentThemeAccent}`}>
                          Key Projects
                        </h2>
                        <div className="space-y-2.5">
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="space-y-0.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-900">
                                  {proj.name}
                                  {proj.role && (
                                    <span className="font-normal text-slate-600">
                                      {" "}({proj.role})
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {proj.startDate} – {proj.endDate}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 italic">
                                {proj.description}
                              </p>
                              <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-slate-700 leading-relaxed">
                                {proj.bullets.map((b) => (
                                  <li key={b.id}>{b.text}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionId === "skills" && mounted && resume.skills.length > 0) {
                    return (
                      <section key="sec-skills" className="space-y-1.5">
                        <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${currentThemeAccent}`}>
                          Technical Skills
                        </h2>
                        <div className="space-y-1 text-xs text-slate-700">
                          {resume.skills.map((group) => (
                            <div key={group.id} className="flex flex-wrap gap-1 items-baseline">
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

                  if (sectionId === "education" && mounted && resume.education.length > 0) {
                    return (
                      <section key="sec-education" className="space-y-2">
                        <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${currentThemeAccent}`}>
                          Education
                        </h2>
                        <div className="space-y-1.5">
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="flex items-start justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900">
                                  {edu.degree} in {edu.field}
                                </span>
                                <p className="text-slate-600">
                                  {edu.institution} {edu.gpa ? `• GPA: ${edu.gpa}` : ""}
                                </p>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                                {edu.startDate} – {edu.endDate}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  if (sectionId === "certifications" && mounted && resume.certifications.length > 0) {
                    return (
                      <section key="sec-certifications" className="space-y-1.5">
                        <h2 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${currentThemeAccent}`}>
                          Certifications
                        </h2>
                        <div className="space-y-1 text-xs text-slate-700">
                          {resume.certifications.map((cert) => (
                            <div key={cert.id} className="flex justify-between">
                              <span className="font-semibold text-slate-900">
                                {cert.name} — {cert.issuer}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
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
      </main>
    </div>
  );
}
