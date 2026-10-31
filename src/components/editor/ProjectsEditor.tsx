"use client";

import React, { useState } from "react";
import {
  Code,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Github,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { ProjectItem, BulletPoint } from "@/lib/schema/resume";
import BulletOptimizerModal from "./BulletOptimizerModal";

export const ProjectsEditor: React.FC = () => {
  const [expandedId, setExpandedId] = useState<Record<string, boolean>>({});
  const [techInputs, setTechInputs] = useState<Record<string, string>>({});
  const [optimizingBullet, setOptimizingBullet] = useState<{
    projectId: string;
    bulletId: string;
    originalText: string;
    roleTitle: string;
    roleTechnologies: string[];
  } | null>(null);

  const {
    resume,
    addProject,
    updateProject,
    deleteProject,
    updateProjectBullet,
  } = useResumeStore();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const handleAddNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProject: ProjectItem = {
      id: newId,
      name: "New Key Project",
      description: "Concise summary of architecture, impact, or open-source purpose.",
      role: "Lead Creator / Developer",
      url: "https://myproject.dev",
      githubUrl: "https://github.com/username/project",
      startDate: "2023-01",
      endDate: "Present",
      bullets: [
        {
          id: `pb-${Date.now()}-1`,
          text: "Engineered core high-performance engine using modern paradigms, achieving sub-10ms response times.",
        },
      ],
      technologies: ["TypeScript", "Next.js", "PostgreSQL"],
    };
    addProject(newProject);
    setExpandedId((prev) => ({ ...prev, [newId]: true }));
  };

  const handleMoveProject = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resume.projects.length) return;

    const list = [...resume.projects];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    // Update projects order in store
    useResumeStore.setState((state) => ({
      resume: {
        ...state.resume,
        projects: list,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleAddBullet = (projId: string) => {
    const proj = resume.projects.find((p) => p.id === projId);
    if (!proj) return;

    const newBullet: BulletPoint = {
      id: `pb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: "Architected solution that streamlined data pipelines and improved developer velocity.",
    };
    updateProject(projId, {
      bullets: [...proj.bullets, newBullet],
    });
  };

  const handleDeleteBullet = (projId: string, bulletId: string) => {
    const proj = resume.projects.find((p) => p.id === projId);
    if (!proj) return;

    updateProject(projId, {
      bullets: proj.bullets.filter((b) => b.id !== bulletId),
    });
  };

  const handleMoveBullet = (projId: string, bIdx: number, direction: "up" | "down") => {
    const proj = resume.projects.find((p) => p.id === projId);
    if (!proj) return;

    const targetIdx = direction === "up" ? bIdx - 1 : bIdx + 1;
    if (targetIdx < 0 || targetIdx >= proj.bullets.length) return;

    const newBullets = [...proj.bullets];
    const [moved] = newBullets.splice(bIdx, 1);
    newBullets.splice(targetIdx, 0, moved);
    updateProject(projId, { bullets: newBullets });
  };

  const handleAddTech = (projId: string) => {
    const inputVal = (techInputs[projId] || "").trim();
    if (!inputVal) return;

    const proj = resume.projects.find((p) => p.id === projId);
    if (!proj) return;

    const newTags = inputVal
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !proj.technologies.includes(t));

    if (newTags.length > 0) {
      updateProject(projId, {
        technologies: [...proj.technologies, ...newTags],
      });
    }

    setTechInputs((prev) => ({ ...prev, [projId]: "" }));
  };

  const handleRemoveTech = (projId: string, tagToRemove: string) => {
    const proj = resume.projects.find((p) => p.id === projId);
    if (!proj) return;

    updateProject(projId, {
      technologies: proj.technologies.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-obsidian-900 overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
      {/* Section Header */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-obsidian-850/60 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Key Technical Projects
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-200 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.06]">
                {resume.projects.length} Projects
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Open-source libraries, web systems, and technical architectures
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddNewProject}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="p-4 space-y-3.5">
        {resume.projects.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-300 dark:border-white/[0.1] rounded-lg text-slate-400 text-xs">
            No projects added yet. Click &quot;Add Project&quot; to showcase your technical portfolio.
          </div>
        ) : (
          resume.projects.map((proj, pIdx) => {
            const isExpanded = expandedId[proj.id] ?? true;
            const isFirst = pIdx === 0;
            const isLast = pIdx === resume.projects.length - 1;

            return (
              <div
                key={proj.id}
                className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-obsidian-950/70 overflow-hidden transition-all shadow-xs"
              >
                {/* Project Header Bar */}
                <div className="px-3.5 py-2.5 bg-slate-100/90 dark:bg-obsidian-850 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => toggleExpand(proj.id)}
                    className="flex items-center space-x-2 text-left min-w-0"
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 dark:bg-obsidian-800 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                      {pIdx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {proj.name || "Project Name"}
                      </span>
                      {proj.role && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5 hidden sm:inline">
                          • {proj.role}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveProject(pIdx, "up")}
                      title="Move project up"
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveProject(pIdx, "down")}
                      title="Move project down"
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3 bg-slate-200 dark:border-white/[0.1] mx-0.5" />
                    <button
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      title="Delete project"
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(proj.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Project Body */}
                {isExpanded && (
                  <div className="p-3.5 space-y-3.5">
                    {/* Project Name & Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          Project Name <span className="text-emerald-500 dark:text-emerald-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) =>
                            updateProject(proj.id, { name: e.target.value })
                          }
                          placeholder="e.g. HyperGraph Engine"
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          Your Role / Contribution
                        </label>
                        <input
                          type="text"
                          value={proj.role || ""}
                          onChange={(e) =>
                            updateProject(proj.id, { role: e.target.value })
                          }
                          placeholder="e.g. Creator & Maintainer, Lead Architect"
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        High-Level Overview
                      </label>
                      <input
                        type="text"
                        value={proj.description}
                        onChange={(e) =>
                          updateProject(proj.id, { description: e.target.value })
                        }
                        placeholder="e.g. High-performance in-memory graph query engine with WebAssembly acceleration."
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      />
                    </div>

                    {/* URLs & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            Live Demo URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={proj.url || ""}
                          onChange={(e) =>
                            updateProject(proj.id, { url: e.target.value })
                          }
                          placeholder="https://hypergraph.dev"
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Github className="w-3 h-3 text-slate-400" />
                            GitHub Repository
                          </span>
                        </label>
                        <input
                          type="url"
                          value={proj.githubUrl || ""}
                          onChange={(e) =>
                            updateProject(proj.id, { githubUrl: e.target.value })
                          }
                          placeholder="https://github.com/org/repo"
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Dates (Start – End)
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={proj.startDate || ""}
                            onChange={(e) =>
                              updateProject(proj.id, { startDate: e.target.value })
                            }
                            placeholder="2023-01"
                            className="w-full px-2 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          />
                          <input
                            type="text"
                            value={proj.endDate || ""}
                            onChange={(e) =>
                              updateProject(proj.id, { endDate: e.target.value })
                            }
                            placeholder="Present"
                            className="w-full px-2 py-1.5 rounded-md bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technologies Tag Manager */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                        Technologies Stack
                      </label>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {proj.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-200/70 dark:bg-obsidian-800 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-white/[0.08] text-xs"
                          >
                            <span>{tech}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTech(proj.id, tech)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center space-x-1 min-w-[140px]">
                          <input
                            type="text"
                            value={techInputs[proj.id] || ""}
                            onChange={(e) =>
                              setTechInputs((prev) => ({
                                ...prev,
                                [proj.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTech(proj.id);
                              }
                            }}
                            placeholder="+ Add technology..."
                            className="px-2 py-0.5 rounded bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-32 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTech(proj.id)}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-obsidian-800 hover:bg-slate-300 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points Section */}
                    <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                          Key Project Contributions ({proj.bullets.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(proj.id)}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium flex items-center space-x-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Bullet</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {proj.bullets.map((bullet, bIdx) => {
                          const isFirstBullet = bIdx === 0;
                          const isLastBullet = bIdx === proj.bullets.length - 1;

                          return (
                            <div
                              key={bullet.id}
                              className="flex items-start space-x-2 bg-white dark:bg-obsidian-900 p-2 rounded-lg border border-slate-200 dark:border-white/[0.08] shadow-xs"
                            >
                              <div className="flex flex-col items-center space-y-0.5 pt-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={isFirstBullet}
                                  onClick={() =>
                                    handleMoveBullet(proj.id, bIdx, "up")
                                  }
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-20 transition-colors"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  {bIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  disabled={isLastBullet}
                                  onClick={() =>
                                    handleMoveBullet(proj.id, bIdx, "down")
                                  }
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-20 transition-colors"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              <textarea
                                rows={2}
                                value={bullet.text}
                                onChange={(e) =>
                                  updateProjectBullet(proj.id, bullet.id, e.target.value)
                                }
                                placeholder="Describe technical accomplishment or scale..."
                                className="flex-1 px-2.5 py-1.5 rounded bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 leading-relaxed resize-y transition-all"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setOptimizingBullet({
                                    projectId: proj.id,
                                    bulletId: bullet.id,
                                    originalText: bullet.text,
                                    roleTitle: `Project: ${proj.name}`,
                                    roleTechnologies: proj.technologies,
                                  })
                                }
                                title="Optimize bullet with AI Co-Pilot (Google XYZ formula)"
                                className="px-2 py-1 rounded text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 border border-emerald-300/60 dark:border-emerald-500/30 transition-all shrink-0 flex items-center space-x-1 group mt-0.5 shadow-xs hover:-translate-y-0.5 active:scale-95"
                              >
                                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[10px] font-semibold hidden sm:inline font-mono">✨ Optimize</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBullet(proj.id, bullet.id)}
                                title="Delete bullet point"
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors pt-1.5 shrink-0"
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
            updateProjectBullet(
              optimizingBullet.projectId,
              optimizingBullet.bulletId,
              newText
            );
          }}
        />
      )}
    </div>
  );
};

export default ProjectsEditor;
