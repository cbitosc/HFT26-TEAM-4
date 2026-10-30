"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  X,
  Layers,
  Check,
} from "lucide-react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SkillGroup } from "@/lib/schema/resume";

const COMMON_PRESET_CATEGORIES = [
  "Languages & Core",
  "Frameworks & Frontend",
  "Backend & APIs",
  "Databases & Storage",
  "Cloud & DevOps",
  "AI & Machine Learning",
  "Testing & Tooling",
];

export const SkillsEditor: React.FC = () => {
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});

  const {
    resume,
    addSkillGroup,
    updateSkillGroup,
    deleteSkillGroup,
    addSkillToGroup,
    removeSkillFromGroup,
  } = useResumeStore();

  const handleAddNewCategory = (categoryName?: string) => {
    const newId = `sk-${Date.now()}`;
    const name =
      categoryName ||
      COMMON_PRESET_CATEGORIES.find(
        (cat) => !resume.skills.some((s) => s.category.toLowerCase() === cat.toLowerCase())
      ) ||
      "New Skill Category";

    const newGroup: SkillGroup = {
      id: newId,
      category: name,
      skills: [],
    };
    addSkillGroup(newGroup);
  };

  const handleAddSkill = (groupId: string) => {
    const inputVal = (skillInputs[groupId] || "").trim();
    if (!inputVal) return;

    // Handle comma-separated skills
    const rawSkills = inputVal.split(",");
    rawSkills.forEach((s) => {
      const trimmed = s.trim();
      if (trimmed) {
        addSkillToGroup(groupId, trimmed);
      }
    });

    setSkillInputs((prev) => ({ ...prev, [groupId]: "" }));
  };

  const totalSkillsCount = resume.skills.reduce(
    (acc, group) => acc + group.skills.length,
    0
  );

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/70 overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-4 py-3 bg-stone-50/80 dark:bg-stone-850/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wide">
                Categorized Technical Skills
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                {totalSkillsCount} Skills in {resume.skills.length} Categories
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              ATS-matched tech badges grouped cleanly by domain or stack
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAddNewCategory()}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Skill Categories List */}
      <div className="p-4 space-y-4">
        {resume.skills.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-stone-300 dark:border-stone-800 rounded-lg text-stone-400 text-xs">
            No skill categories added yet. Click &quot;Add Category&quot; to organize your skills.
          </div>
        ) : (
          resume.skills.map((group, gIdx) => (
            <div
              key={group.id}
              className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 space-y-3 shadow-sm"
            >
              {/* Category Header: Name & Delete */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 max-w-sm">
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                    {gIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={group.category}
                    onChange={(e) =>
                      updateSkillGroup(group.id, { category: e.target.value })
                    }
                    placeholder="Category Name (e.g. Languages, Cloud, Frameworks)"
                    className="w-full px-2 py-1 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                    {group.skills.length} skills
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteSkillGroup(group.id)}
                    title="Delete category"
                    className="p-1 rounded text-stone-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Skills Pills */}
              <div className="flex flex-wrap gap-1.5 items-center min-h-[32px] p-2 rounded-md bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-850">
                {group.skills.length === 0 ? (
                  <span className="text-xs text-stone-400 dark:text-stone-500 italic">
                    Type a skill below or paste comma-separated skills to add tags.
                  </span>
                ) : (
                  group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-stone-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-mono font-medium shadow-sm transition group hover:border-emerald-500/60"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillFromGroup(group.id, skill)}
                        className="text-stone-400 hover:text-red-500 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Skill Tag Input */}
              <div className="flex items-center space-x-2 pt-0.5">
                <input
                  type="text"
                  value={skillInputs[group.id] || ""}
                  onChange={(e) =>
                    setSkillInputs((prev) => ({
                      ...prev,
                      [group.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill(group.id);
                    }
                  }}
                  placeholder="Type skill & press Enter (or comma-separate: Python, Go, SQL)..."
                  className="flex-1 px-3 py-1.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(group.id)}
                  className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SkillsEditor;
