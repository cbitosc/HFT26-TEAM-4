"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { ExperienceItem, BulletPoint } from "@/lib/schema/resume";
import BulletOptimizerModal from "./BulletOptimizerModal";

export const ExperienceEditor: React.FC = () => {
  const [expandedId, setExpandedId] = useState<Record<string, boolean>>({});
  const [techInputs, setTechInputs] = useState<Record<string, string>>({});
  const [optimizingBullet, setOptimizingBullet] = useState<{
    experienceId: string;
    bulletId: string;
    originalText: string;
    roleTitle: string;
    roleTechnologies: string[];
  } | null>(null);

  const {
    resume,
    addExperience,
    updateExperience,
    deleteExperience,
    reorderExperience,
    addBullet,
    updateBullet,
    deleteBullet,
  } = useResumeStore();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const handleAddNewExperience = () => {
    const newId = `exp-${Date.now()}`;
    const newExp: ExperienceItem = {
      id: newId,
      company: "Company Name",
      position: "Software Engineer",
      location: "San Francisco, CA",
      startDate: "2023-01",
      endDate: "Present",
      current: true,
      description: "Core responsibilities & team context",
      bullets: [
        {
          id: `b-${Date.now()}-1`,
          text: "Engineered scalable feature or service, cutting latency by 30% and serving 100k+ active users.",
        },
      ],
      technologies: ["TypeScript", "React", "Node.js"],
    };
    addExperience(newExp);
    setExpandedId((prev) => ({ ...prev, [newId]: true }));
  };

  const handleMoveJob = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resume.experience.length) return;
    reorderExperience(index, targetIndex);
  };

  const handleMoveBullet = (expId: string, bulletIdx: number, direction: "up" | "down") => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp) return;

    const targetIdx = direction === "up" ? bulletIdx - 1 : bulletIdx + 1;
    if (targetIdx < 0 || targetIdx >= exp.bullets.length) return;

    const newBullets = [...exp.bullets];
    const [moved] = newBullets.splice(bulletIdx, 1);
    newBullets.splice(targetIdx, 0, moved);
    updateExperience(expId, { bullets: newBullets });
  };

  const handleAddTech = (expId: string) => {
    const inputVal = (techInputs[expId] || "").trim();
    if (!inputVal) return;

    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp) return;

    // Support comma-separated tags
    const newTags = inputVal
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !exp.technologies.includes(t));

    if (newTags.length > 0) {
      updateExperience(expId, {
        technologies: [...exp.technologies, ...newTags],
      });
    }

    setTechInputs((prev) => ({ ...prev, [expId]: "" }));
  };

  const handleRemoveTech = (expId: string, tagToRemove: string) => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp) return;

    updateExperience(expId, {
      technologies: exp.technologies.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Work Experience
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {resume.experience.length} Roles
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Add companies, roles, quantifiable bullet points, and tech stacks
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddNewExperience}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Position</span>
        </button>
      </div>

      {/* Experience List */}
      <div className="p-4 space-y-3.5">
        {resume.experience.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-slate-400 text-xs">
            No work experience positions listed yet. Click &quot;Add Position&quot; to add your first job.
          </div>
        ) : (
          resume.experience.map((exp, expIdx) => {
            const isExpanded = expandedId[exp.id] ?? true;
            const isFirst = expIdx === 0;
            const isLast = expIdx === resume.experience.length - 1;

            return (
              <div
                key={exp.id}
                className="rounded-lg border border-slate-800 bg-slate-950/90 overflow-hidden transition shadow-sm"
              >
                {/* Job Card Header */}
                <div className="px-3.5 py-2.5 bg-slate-900 flex items-center justify-between border-b border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => toggleExpand(exp.id)}
                    className="flex items-center space-x-2 text-left min-w-0"
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                      {expIdx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-200">
                        {exp.position || "Position Title"}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                        • {exp.company || "Company"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono ml-2 hidden md:inline">
                        ({exp.startDate || "Date"} – {exp.current ? "Present" : exp.endDate || "Date"})
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveJob(expIdx, "up")}
                      title="Move role up"
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveJob(expIdx, "down")}
                      title="Move role down"
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => deleteExperience(exp.id)}
                      title="Delete experience"
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(exp.id)}
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

                {/* Job Card Body */}
                {isExpanded && (
                  <div className="p-3.5 space-y-3.5">
                    {/* Position & Company */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Job Title / Position <span className="text-emerald-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) =>
                            updateExperience(exp.id, { position: e.target.value })
                          }
                          placeholder="e.g. Senior Full-Stack Engineer"
                          className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Company / Organization <span className="text-emerald-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(exp.id, { company: e.target.value })
                          }
                          placeholder="e.g. Apex Cloud Technologies"
                          className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Location, Dates, Current Job */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            Location
                          </span>
                        </label>
                        <input
                          type="text"
                          value={exp.location || ""}
                          onChange={(e) =>
                            updateExperience(exp.id, { location: e.target.value })
                          }
                          placeholder="e.g. San Francisco, CA (or Remote)"
                          className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Start Date (YYYY-MM)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(exp.id, { startDate: e.target.value })
                          }
                          placeholder="2022-03"
                          className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            End Date
                          </label>
                          <label className="flex items-center space-x-1.5 text-[10px] text-emerald-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) =>
                                updateExperience(exp.id, {
                                  current: e.target.checked,
                                  endDate: e.target.checked ? "Present" : exp.endDate || "2024-01",
                                })
                              }
                              className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-3 h-3 bg-slate-900"
                            />
                            <span>Present</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? "Present" : exp.endDate}
                          onChange={(e) =>
                            updateExperience(exp.id, { endDate: e.target.value })
                          }
                          placeholder="2024-01"
                          className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Technologies Tag Manager */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Technologies & Tools Used
                      </label>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {exp.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-750 text-xs"
                          >
                            <span>{tech}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTech(exp.id, tech)}
                              className="text-slate-400 hover:text-red-400 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center space-x-1 min-w-[140px]">
                          <input
                            type="text"
                            value={techInputs[exp.id] || ""}
                            onChange={(e) =>
                              setTechInputs((prev) => ({
                                ...prev,
                                [exp.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTech(exp.id);
                              }
                            }}
                            placeholder="+ Add tech tag..."
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-32"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTech(exp.id)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points Section */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Achievement Bullets ({exp.bullets.length})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (Google XYZ formula recommended)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            addBullet(
                              exp.id,
                              "Spearheaded key improvement resulting in quantifiable metric gain."
                            )
                          }
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {exp.bullets.map((bullet, bIdx) => {
                          const isFirstBullet = bIdx === 0;
                          const isLastBullet = bIdx === exp.bullets.length - 1;

                          return (
                            <div
                              key={bullet.id}
                              className="flex items-start space-x-2 bg-slate-900/60 p-2 rounded-lg border border-slate-850"
                            >
                              <div className="flex flex-col items-center space-y-0.5 pt-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={isFirstBullet}
                                  onClick={() =>
                                    handleMoveBullet(exp.id, bIdx, "up")
                                  }
                                  className="text-slate-500 hover:text-slate-300 disabled:opacity-20"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] font-mono text-emerald-400">
                                  {bIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  disabled={isLastBullet}
                                  onClick={() =>
                                    handleMoveBullet(exp.id, bIdx, "down")
                                  }
                                  className="text-slate-500 hover:text-slate-300 disabled:opacity-20"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              <textarea
                                rows={2}
                                value={bullet.text}
                                onChange={(e) =>
                                  updateBullet(exp.id, bullet.id, e.target.value)
                                }
                                placeholder="Describe quantifiable accomplishment..."
                                className="flex-1 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setOptimizingBullet({
                                    experienceId: exp.id,
                                    bulletId: bullet.id,
                                    originalText: bullet.text,
                                    roleTitle: `${exp.company} - ${exp.position}`,
                                    roleTechnologies: exp.technologies,
                                  })
                                }
                                title="Optimize bullet with AI Co-Pilot (Google XYZ formula)"
                                className="px-2 py-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/30 transition shrink-0 flex items-center space-x-1 group mt-0.5"
                              >
                                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-emerald-400" />
                                <span className="text-[10px] font-semibold hidden sm:inline">✨ Optimize</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteBullet(exp.id, bullet.id)}
                                title="Delete bullet point"
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition pt-1.5 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {optimizingBullet && (
        <BulletOptimizerModal
          isOpen={true}
          onClose={() => setOptimizingBullet(null)}
          originalText={optimizingBullet.originalText}
          roleTitle={optimizingBullet.roleTitle}
          roleTechnologies={optimizingBullet.roleTechnologies}
          onApply={(newText) => {
            updateBullet(
              optimizingBullet.experienceId,
              optimizingBullet.bulletId,
              newText
            );
          }}
        />
      )}
    </div>
  );
};

export default ExperienceEditor;
