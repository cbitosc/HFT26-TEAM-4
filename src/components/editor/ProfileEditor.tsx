"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  FileText,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Briefcase,
  Code,
  Layers,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import SectionReorder from "./SectionReorder";
import ExperienceEditor from "./ExperienceEditor";
import ProjectsEditor from "./ProjectsEditor";
import SkillsEditor from "./SkillsEditor";
import { EducationItem, BulletPoint, CertificationItem } from "@/lib/schema/resume";

export const ProfileEditor: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [expandedEdu, setExpandedEdu] = useState<Record<string, boolean>>({});

  const {
    resume,
    updateBasics,
    addEducation,
    updateEducation,
    deleteEducation,
    addCertification,
    deleteCertification,
  } = useResumeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-900/60 rounded-xl" />
        <div className="h-64 bg-slate-900/60 rounded-xl" />
      </div>
    );
  }

  const { basics, education, certifications } = resume;

  // Toggle education item accordion
  const toggleEdu = (id: string) => {
    setExpandedEdu((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddNewEducation = () => {
    const newId = `edu-${Date.now()}`;
    const newEdu: EducationItem = {
      id: newId,
      institution: "New University / College",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "",
      startDate: "2018-09",
      endDate: "2022-05",
      current: false,
      gpa: "",
      highlights: [],
    };
    addEducation(newEdu);
    setExpandedEdu((prev) => ({ ...prev, [newId]: true }));
  };

  const handleAddHighlight = (eduId: string) => {
    const targetEdu = education.find((e) => e.id === eduId);
    if (!targetEdu) return;

    const newHighlight: BulletPoint = {
      id: `eh-${Date.now()}`,
      text: "Relevant coursework or academic honor",
    };
    updateEducation(eduId, {
      highlights: [...targetEdu.highlights, newHighlight],
    });
  };

  const handleUpdateHighlight = (eduId: string, hId: string, text: string) => {
    const targetEdu = education.find((e) => e.id === eduId);
    if (!targetEdu) return;

    updateEducation(eduId, {
      highlights: targetEdu.highlights.map((h) =>
        h.id === hId ? { ...h, text } : h
      ),
    });
  };

  const handleDeleteHighlight = (eduId: string, hId: string) => {
    const targetEdu = education.find((e) => e.id === eduId);
    if (!targetEdu) return;

    updateEducation(eduId, {
      highlights: targetEdu.highlights.filter((h) => h.id !== hId),
    });
  };

  const handleAddCertification = () => {
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023-06",
    };
    addCertification(newCert);
  };

  const summaryCharCount = basics.summary ? basics.summary.length : 0;
  const isSummaryLengthGood = summaryCharCount >= 150 && summaryCharCount <= 600;

  return (
    <div className="space-y-6">
      {/* 1. Section Flow & Reordering Panel */}
      <section id="section-reorder">
        <SectionReorder />
      </section>

      {/* 2. Personal & Contact Basics Form */}
      <section id="basics-form" className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Personal Contact & Identification
              </h3>
              <p className="text-[11px] text-slate-400">
                Full name, target headline, email, phone, location & profiles
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Name & Headline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="basics-name"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Full Name <span className="text-emerald-400">*</span>
              </label>
              <input
                id="basics-name"
                type="text"
                value={basics.name}
                onChange={(e) => updateBasics({ name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="basics-headline"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Target Title / Headline
              </label>
              <input
                id="basics-headline"
                type="text"
                value={basics.headline}
                onChange={(e) => updateBasics({ headline: e.target.value })}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Email, Phone, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="basics-email"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  Email
                </span>
              </label>
              <input
                id="basics-email"
                type="email"
                value={basics.email}
                onChange={(e) => updateBasics({ email: e.target.value })}
                placeholder="alex.morgan@example.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="basics-phone"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Phone
                </span>
              </label>
              <input
                id="basics-phone"
                type="text"
                value={basics.phone}
                onChange={(e) => updateBasics({ phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="basics-location"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Location
                </span>
              </label>
              <input
                id="basics-location"
                type="text"
                value={basics.location}
                onChange={(e) => updateBasics({ location: e.target.value })}
                placeholder="San Francisco, CA"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Website, LinkedIn, GitHub */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label
                htmlFor="basics-website"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  Website / Portfolio
                </span>
              </label>
              <input
                id="basics-website"
                type="url"
                value={basics.website || ""}
                onChange={(e) => updateBasics({ website: e.target.value })}
                placeholder="https://alexmorgan.dev"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="basics-linkedin"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                <span className="flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-slate-400" />
                  LinkedIn
                </span>
              </label>
              <input
                id="basics-linkedin"
                type="text"
                value={basics.linkedin || ""}
                onChange={(e) => updateBasics({ linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="basics-github"
                className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                <span className="flex items-center gap-1">
                  <Github className="w-3 h-3 text-slate-400" />
                  GitHub
                </span>
              </label>
              <input
                id="basics-github"
                type="text"
                value={basics.github || ""}
                onChange={(e) => updateBasics({ github: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Professional Summary Form */}
      <section id="summary-form" className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Professional Summary
              </h3>
              <p className="text-[11px] text-slate-400">
                Concise executive overview tailored to your target industry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                isSummaryLengthGood
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {summaryCharCount} chars ({isSummaryLengthGood ? "Optimal" : "200-500 recommended"})
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <textarea
            rows={4}
            value={basics.summary}
            onChange={(e) => updateBasics({ summary: e.target.value })}
            placeholder="Write a high-impact 2-4 sentence summary highlighting your core expertise, years of experience, and quantifiable achievements..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed resize-y"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Tip: Include 2-3 target keywords and a concrete metric (e.g. 40% latency reduction).
            </span>
          </div>
        </div>
      </section>

      {/* 4. Work Experience Form */}
      <section id="experience-editor">
        <ExperienceEditor />
      </section>

      {/* 5. Key Projects Form */}
      <section id="projects-editor">
        <ProjectsEditor />
      </section>

      {/* 6. Technical Skills Form */}
      <section id="skills-editor">
        <SkillsEditor />
      </section>

      {/* 7. Education Form */}
      <section id="education-form" className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Education & Degrees
              </h3>
              <p className="text-[11px] text-slate-400">
                Universities, degrees, honors, and relevant academic highlights
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddNewEducation}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {education.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-400 text-xs">
              No education entries added yet. Click &quot;Add Education&quot; above to add your university or degree.
            </div>
          ) : (
            education.map((edu, idx) => {
              const isExpanded = expandedEdu[edu.id] ?? true;
              return (
                <div
                  key={edu.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden transition"
                >
                  {/* Card Header */}
                  <div className="px-3.5 py-2.5 bg-slate-900 flex items-center justify-between border-b border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => toggleEdu(edu.id)}
                      className="flex items-center space-x-2 text-left min-w-0"
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 text-emerald-400 font-mono text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-200">
                          {edu.degree || "Degree"} in {edu.field || "Field"}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                          • {edu.institution || "Institution"}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => deleteEducation(edu.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete education entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEdu(edu.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  {isExpanded && (
                    <div className="p-3.5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Institution / University
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) =>
                              updateEducation(edu.id, { institution: e.target.value })
                            }
                            placeholder="e.g. UC Berkeley"
                            className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Degree
                          </label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) =>
                              updateEducation(edu.id, { degree: e.target.value })
                            }
                            placeholder="e.g. Bachelor of Science"
                            className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Field of Study / Major
                          </label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) =>
                              updateEducation(edu.id, { field: e.target.value })
                            }
                            placeholder="e.g. Computer Science"
                            className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Graduation Date / Period
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={edu.startDate}
                              onChange={(e) =>
                                updateEducation(edu.id, { startDate: e.target.value })
                              }
                              placeholder="2013-08"
                              className="w-full px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={edu.endDate}
                              onChange={(e) =>
                                updateEducation(edu.id, { endDate: e.target.value })
                              }
                              placeholder="2017-05"
                              className="w-full px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            GPA / Honors (Optional)
                          </label>
                          <input
                            type="text"
                            value={edu.gpa || ""}
                            onChange={(e) =>
                              updateEducation(edu.id, { gpa: e.target.value })
                            }
                            placeholder="e.g. 3.85 / 4.0"
                            className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Academic Highlights / Honors Bullets */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Honors & Coursework ({edu.highlights.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddHighlight(edu.id)}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Highlight</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {edu.highlights.map((h) => (
                            <div key={h.id} className="flex items-center space-x-2">
                              <span className="text-slate-500 text-xs">•</span>
                              <input
                                type="text"
                                value={h.text}
                                onChange={(e) =>
                                  handleUpdateHighlight(edu.id, h.id, e.target.value)
                                }
                                placeholder="e.g. Dean's Honor List, Distributed Systems Coursework"
                                className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteHighlight(edu.id, h.id)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 8. Certifications Form */}
      <section id="certifications-form" className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Certifications & Credentials
              </h3>
              <p className="text-[11px] text-slate-400">
                Industry credentials, cloud certifications, and licenses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCertification}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {certifications.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-400 text-xs">
              No certifications added yet. Click &quot;Add Certification&quot; to add your credentials.
            </div>
          ) : (
            certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800"
              >
                <div>
                  <p className="text-xs font-bold text-white">{cert.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {cert.issuer} • <span className="font-mono text-emerald-400">{cert.date}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCertification(cert.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfileEditor;
