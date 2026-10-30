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
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-4 py-3 bg-stone-50/80 dark:bg-stone-850/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wide">
                Key Technical Projects
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                {resume.projects.length} Projects
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Open-source libraries, web systems, and technical architectures
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddNewProject}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="p-4 space-y-3.5">
        {resume.projects.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-stone-300 dark:border-stone-800 rounded-lg text-stone-400 text-xs">
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
                className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/90 overflow-hidden transition shadow-sm"
              >
                {/* Project Header Bar */}
                <div className="px-3.5 py-2.5 bg-stone-100/90 dark:bg-stone-900 flex items-center justify-between border-b border-stone-200 dark:border-stone-800/80">
                  <button
                    type="button"
                    onClick={() => toggleExpand(proj.id)}
                    className="flex items-center space-x-2 text-left min-w-0"
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                      {pIdx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {proj.name || "Project Name"}
                      </span>
                      {proj.role && (
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 ml-1.5 hidden sm:inline">
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
                      className="p-1 rounded text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveProject(pIdx, "down")}
                      title="Move project down"
                      className="p-1 rounded text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3 bg-stone-200 dark:bg-stone-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      title="Delete project"
                      className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(proj.id)}
                      className="p-1 rounded text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition"
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
                        <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                          Project Name <span className="text-amber-500 dark:text-emerald-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) =>
                            updateProject(proj.id, { name: e.target.value })
                          }
                          placeholder="e.g. HyperGraph Engine"
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                          Your Role / Contribution
                        </label>
                        <input
                          type="text"
                          value={proj.role || ""}
                          onChange={(e) =>
                            updateProject(proj.id, { role: e.target.value })
                          }
                          placeholder="e.g. Creator & Maintainer, Lead Architect"
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                        High-Level Overview
                      </label>
                      <input
                        type="text"
                        value={proj.description}
                        onChange={(e) =>
                          updateProject(proj.id, { description: e.target.value })
                        }
                        placeholder="e.g. High-performance in-memory graph query engine with WebAssembly acceleration."
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                      />
                    </div>

                    {/* URLs & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-stone-400" />
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
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                          <span className="flex items-center gap-1">
                            <Github className="w-3 h-3 text-stone-400" />
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
                          className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
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
                            className="w-full px-2 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={proj.endDate || ""}
                            onChange={(e) =>
                              updateProject(proj.id, { endDate: e.target.value })
                            }
                            placeholder="Present"
                            className="w-full px-2 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technologies Tag Manager */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Technologies Stack
                      </label>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {proj.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-850 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-750 text-xs"
                          >
                            <span>{tech}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTech(proj.id, tech)}
                              className="text-stone-400 hover:text-red-500 transition"
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
                            className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 dark:focus:border-emerald-500 w-32"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTech(proj.id)}
                            className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points Section */}
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          Key Project Contributions ({proj.bullets.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(proj.id)}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium flex items-center space-x-1"
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
                              className="flex items-start space-x-2 bg-white dark:bg-stone-900/60 p-2 rounded-lg border border-stone-200 dark:border-stone-850 shadow-sm"
                            >
                              <div className="flex flex-col items-center space-y-0.5 pt-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={isFirstBullet}
                                  onClick={() =>
                                    handleMoveBullet(proj.id, bIdx, "up")
                                  }
                                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-20"
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
                                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-20"
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
                                className="flex-1 px-2.5 py-1.5 rounded bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500 leading-relaxed resize-y"
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
                                className="px-2 py-1 rounded text-amber-700 dark:text-emerald-400 hover:text-amber-800 dark:hover:text-emerald-300 hover:bg-amber-100 dark:hover:bg-emerald-500/15 border border-amber-300 dark:border-emerald-500/30 transition shrink-0 flex items-center space-x-1 group mt-0.5 shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-amber-600 dark:text-emerald-400" />
                                <span className="text-[10px] font-semibold hidden sm:inline">✨ Optimize</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBullet(proj.id, bullet.id)}
                                title="Delete bullet point"
                                className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition pt-1.5 shrink-0"
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
