import { ResumeDocument } from "../schema/resume";
import { JdRequirements } from "../schema/jd";
import { ALL_SKILLS, SkillCategory, getSkillCategory } from "./skillTaxonomy";
import {
  ALIAS_MAP,
  CANONICAL_TO_ALIASES,
  normalizeSkill,
  getSkillAliases,
} from "./aliasMap";

export type RequirementTier = "must-have" | "preferred" | "general";

export interface ParsedRequirementKeyword {
  skill: string;
  category: SkillCategory;
  tier: RequirementTier;
  weight: number; // 3.0 for must-have, 1.5 for preferred, 1.0 for general
  frequency: number;
}

export interface MatchedKeyword {
  skill: string;
  category: SkillCategory;
  tier: RequirementTier;
  weight: number;
  credit: 1.0 | 0.6;
  evidenceType: "bullet" | "skills_list";
  evidenceSnippet?: string;
  location?: string;
}

export interface MissingKeyword {
  skill: string;
  category: SkillCategory;
  tier: RequirementTier;
  weight: number;
  credit: 0;
}

export interface JdCoverageReport {
  overallScore: number; // 0 - 100
  mustHaveScore: number; // 0 - 100
  preferredScore: number; // 0 - 100
  bulletEvidenceScore: number; // % of matched skills proven in bullets
  totalRequiredKeywords: number;
  matchedCount: number;
  missingCount: number;
  mustHaveCount: number;
  preferredCount: number;
  matchedKeywords: MatchedKeyword[];
  missingKeywords: MissingKeyword[];
  executionTimeMs: number;
}

// Precompile regex cache for skills and aliases
interface SkillMatchRule {
  canonical: string;
  category: SkillCategory;
  regex: RegExp;
  alias: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSkillRegex(alias: string): RegExp {
  const lower = alias.toLowerCase().trim();

  // Special handling for single letters and short symbols to prevent false positives
  if (lower === "c") {
    return /(?:^|[\s,;:(/])C(?:[\s,;:)/.]|$)/;
  }
  if (lower === "r") {
    return /(?:^|[\s,;:(/])R(?:[\s,;:)/.]|$)/;
  }
  if (lower === "go") {
    return /\b(?:Golang|go-lang|Go(?:\s+programming|\s+language|\s+code)?)\b/;
  }
  if (lower === ".net" || lower === "dotnet") {
    return /(?:\b|\s)\.NET\b|\bdotnet\b/i;
  }
  if (lower === "c++" || lower === "cpp") {
    return /(?:^|[\s,;:(/])(?:C\+\+|cpp)(?:[\s,;:)/.]|$)/i;
  }
  if (lower === "c#" || lower === "csharp") {
    return /(?:^|[\s,;:(/])(?:C#|csharp)(?:[\s,;:)/.]|$)/i;
  }

  const escaped = escapeRegex(alias);
  const prefix = /^\w/.test(alias) ? "\\b" : "(?:^|[\\s,;:(/])";
  const suffix = /\w$/.test(alias) ? "\\b" : "(?:$|[\\s,;:)/.])";

  return new RegExp(`${prefix}${escaped}${suffix}`, "i");
}

// Compile rules once
const SKILL_RULES: SkillMatchRule[] = [];

for (const canonical of ALL_SKILLS) {
  const category = getSkillCategory(canonical);
  const aliases = CANONICAL_TO_ALIASES.get(canonical) ?? [canonical.toLowerCase()];

  // Sort aliases longer-first so specific terms match
  const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);

  for (const alias of sortedAliases) {
    SKILL_RULES.push({
      canonical,
      category,
      regex: buildSkillRegex(alias),
      alias,
    });
  }
}

const MUST_HAVE_HEADING_REGEX =
  /(?:requirements|qualifications|what\s+you(?:'ll|\s+will)\s+need|must\s+have|minimum\s+qualifications|basic\s+qualifications|core\s+requirements|what\s+we\s+look\s+for|skills\s+required)/i;

const PREFERRED_HEADING_REGEX =
  /(?:nice\s+to\s+have|preferred\s+qualifications|bonus|pluses|preferred\s+skills|what\s+we'd\s+love\s+to\s+see|desired\s+qualifications|additional\s+qualifications)/i;

const GENERAL_HEADING_REGEX =
  /(?:responsibilities|what\s+you(?:'ll|\s+will)\s+do|about\s+the\s+role|role\s+overview|job\s+summary|duties|about\s+us)/i;

/**
 * Deterministically parses JD text into categorized skills with must-have, preferred,
 * and general tiers based on section headings, line context, and frequency.
 */
export function parseJdRequirements(text: string): ParsedRequirementKeyword[] {
  if (!text || !text.trim()) {
    return [];
  }

  const lines = text.split(/\r?\n/);
  let currentTier: RequirementTier = "general";

  // Map from canonical skill -> { skill, category, tier, weight, frequency }
  const foundMap = new Map<string, ParsedRequirementKeyword>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section transitions
    if (PREFERRED_HEADING_REGEX.test(line)) {
      currentTier = "preferred";
      continue;
    } else if (MUST_HAVE_HEADING_REGEX.test(line)) {
      currentTier = "must-have";
      continue;
    } else if (GENERAL_HEADING_REGEX.test(line)) {
      currentTier = "general";
      continue;
    }

    // Determine line-specific tier modifier
    let lineTier: RequirementTier = currentTier;
    if (/(?:must\s+have|required|essential|minimum\s+\d+\s+years?|expert\s+in)/i.test(line)) {
      lineTier = "must-have";
    } else if (/(?:nice\s+to\s+have|preferred|bonus|plus)/i.test(line)) {
      lineTier = "preferred";
    }

    // Match skills against this line
    for (const rule of SKILL_RULES) {
      if (rule.regex.test(line)) {
        const canonical = rule.canonical;
        const existing = foundMap.get(canonical);

        const weight = lineTier === "must-have" ? 3.0 : lineTier === "preferred" ? 1.5 : 1.0;

        if (existing) {
          existing.frequency += 1;
          // Upgrade tier if found in a higher-priority section
          if (lineTier === "must-have" && existing.tier !== "must-have") {
            existing.tier = "must-have";
            existing.weight = 3.0;
          } else if (lineTier === "preferred" && existing.tier === "general") {
            existing.tier = "preferred";
            existing.weight = 1.5;
          }
        } else {
          foundMap.set(canonical, {
            skill: canonical,
            category: rule.category,
            tier: lineTier,
            weight,
            frequency: 1,
          });
        }
      }
    }
  }

  return Array.from(foundMap.values());
}

/**
 * Tests if a given text contains a skill or any of its known aliases.
 */
function textContainsSkill(text: string, canonical: string): boolean {
  if (!text) return false;
  const aliases = getSkillAliases(canonical);

  for (const alias of aliases) {
    const regex = buildSkillRegex(alias);
    if (regex.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates deterministic JD coverage score and produces matched/missing matrix.
 *
 * Scoring Formula:
 * Score = Σ(weight * credit) / Σ(weight) * 100
 *
 * Evidence Credit:
 * - 1.0: Found in Experience or Projects bullet points
 * - 0.6: Found in Skills section or technologies list
 * - 0.0: Missing entirely from resume
 */
export function calculateJdCoverage(
  resume: ResumeDocument,
  jdInput: JdRequirements | string
): JdCoverageReport {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  // 1. Gather Target Skills and their tiers
  const targetSkillsMap = new Map<string, { category: SkillCategory; tier: RequirementTier; weight: number }>();

  if (typeof jdInput === "string") {
    const parsed = parseJdRequirements(jdInput);
    for (const p of parsed) {
      targetSkillsMap.set(p.skill, {
        category: p.category,
        tier: p.tier,
        weight: p.weight,
      });
    }
  } else {
    // If raw text exists, parse it first
    if (jdInput.rawText && jdInput.rawText.trim().length > 0) {
      const parsed = parseJdRequirements(jdInput.rawText);
      for (const p of parsed) {
        targetSkillsMap.set(p.skill, {
          category: p.category,
          tier: p.tier,
          weight: p.weight,
        });
      }
    }

    // Also incorporate explicit structured requirements & lists from JdRequirements
    for (const mh of jdInput.mustHave ?? []) {
      const parsedFromMh = parseJdRequirements(mh);
      for (const p of parsedFromMh) {
        targetSkillsMap.set(p.skill, {
          category: p.category,
          tier: "must-have",
          weight: 3.0,
        });
      }
    }

    for (const nth of jdInput.niceToHave ?? []) {
      const parsedFromNth = parseJdRequirements(nth);
      for (const p of parsedFromNth) {
        const existing = targetSkillsMap.get(p.skill);
        if (!existing || existing.tier !== "must-have") {
          targetSkillsMap.set(p.skill, {
            category: p.category,
            tier: "preferred",
            weight: 1.5,
          });
        }
      }
    }

    // Also check direct keywords array
    for (const rawKw of jdInput.keywords ?? []) {
      const canonical = normalizeSkill(rawKw);
      if (canonical && !targetSkillsMap.has(canonical)) {
        targetSkillsMap.set(canonical, {
          category: getSkillCategory(canonical),
          tier: "general",
          weight: 1.0,
        });
      }
    }
  }

  // If no target keywords found (e.g. empty JD), return clean baseline
  if (targetSkillsMap.size === 0) {
    const elapsed = typeof performance !== "undefined" ? performance.now() - startTime : 0;
    return {
      overallScore: 0,
      mustHaveScore: 0,
      preferredScore: 0,
      bulletEvidenceScore: 0,
      totalRequiredKeywords: 0,
      matchedCount: 0,
      missingCount: 0,
      mustHaveCount: 0,
      preferredCount: 0,
      matchedKeywords: [],
      missingKeywords: [],
      executionTimeMs: Math.max(0.1, Number(elapsed.toFixed(2))),
    };
  }

  // 2. Pre-index Resume Content for rapid matching
  // Bullet index: array of { text, location }
  const bulletItems: { text: string; location: string }[] = [];

  for (const exp of resume.experience ?? []) {
    const loc = `${exp.company} (${exp.position})`;
    for (const b of exp.bullets ?? []) {
      bulletItems.push({ text: b.text, location: loc });
    }
  }

  for (const proj of resume.projects ?? []) {
    const loc = `Project: ${proj.name}`;
    for (const b of proj.bullets ?? []) {
      bulletItems.push({ text: b.text, location: loc });
    }
  }

  for (const edu of resume.education ?? []) {
    const loc = `${edu.institution}`;
    for (const h of edu.highlights ?? []) {
      bulletItems.push({ text: h.text, location: loc });
    }
  }

  // Skills list index: set of lowercase strings and canonical representations
  const skillsListStrings: { text: string; location: string }[] = [];

  for (const group of resume.skills ?? []) {
    for (const s of group.skills ?? []) {
      skillsListStrings.push({ text: s, location: `Skills: ${group.category}` });
    }
  }

  for (const exp of resume.experience ?? []) {
    for (const tech of exp.technologies ?? []) {
      skillsListStrings.push({ text: tech, location: `${exp.company} Technologies` });
    }
  }

  for (const proj of resume.projects ?? []) {
    for (const tech of proj.technologies ?? []) {
      skillsListStrings.push({ text: tech, location: `${proj.name} Tech Stack` });
    }
  }

  if (resume.basics?.summary) {
    skillsListStrings.push({ text: resume.basics.summary, location: "Professional Summary" });
  }

  // 3. Match each target skill
  const matchedKeywords: MatchedKeyword[] = [];
  const missingKeywords: MissingKeyword[] = [];

  let totalWeight = 0;
  let achievedWeight = 0;

  let mustHaveTotalWeight = 0;
  let mustHaveAchievedWeight = 0;

  let preferredTotalWeight = 0;
  let preferredAchievedWeight = 0;

  let bulletMatchedCount = 0;
  let mustHaveCount = 0;
  let preferredCount = 0;

  for (const [skill, meta] of targetSkillsMap.entries()) {
    const { category, tier, weight } = meta;
    totalWeight += weight;

    if (tier === "must-have") {
      mustHaveCount++;
      mustHaveTotalWeight += weight;
    } else if (tier === "preferred") {
      preferredCount++;
      preferredTotalWeight += weight;
    }

    // Step A: Check Experience & Project bullets (Credit = 1.0)
    let foundBullet = false;
    let bulletSnippet = "";
    let bulletLocation = "";

    for (const bullet of bulletItems) {
      if (textContainsSkill(bullet.text, skill)) {
        foundBullet = true;
        bulletSnippet = bullet.text;
        bulletLocation = bullet.location;
        break;
      }
    }

    if (foundBullet) {
      achievedWeight += weight * 1.0;
      bulletMatchedCount++;

      if (tier === "must-have") {
        mustHaveAchievedWeight += weight * 1.0;
      } else if (tier === "preferred") {
        preferredAchievedWeight += weight * 1.0;
      }

      matchedKeywords.push({
        skill,
        category,
        tier,
        weight,
        credit: 1.0,
        evidenceType: "bullet",
        evidenceSnippet: bulletSnippet,
        location: bulletLocation,
      });
      continue;
    }

    // Step B: Check Skills list & technologies (Credit = 0.6)
    let foundSkillsList = false;
    let skillListLocation = "";

    for (const item of skillsListStrings) {
      if (textContainsSkill(item.text, skill)) {
        foundSkillsList = true;
        skillListLocation = item.location;
        break;
      }
    }

    if (foundSkillsList) {
      achievedWeight += weight * 0.6;

      if (tier === "must-have") {
        mustHaveAchievedWeight += weight * 0.6;
      } else if (tier === "preferred") {
        preferredAchievedWeight += weight * 0.6;
      }

      matchedKeywords.push({
        skill,
        category,
        tier,
        weight,
        credit: 0.6,
        evidenceType: "skills_list",
        evidenceSnippet: `Listed in ${skillListLocation}`,
        location: skillListLocation,
      });
      continue;
    }

    // Step C: Missing (Credit = 0.0)
    missingKeywords.push({
      skill,
      category,
      tier,
      weight,
      credit: 0,
    });
  }

  // Calculate percentage scores
  const overallScore = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  const mustHaveScore =
    mustHaveTotalWeight > 0 ? Math.round((mustHaveAchievedWeight / mustHaveTotalWeight) * 100) : 100;
  const preferredScore =
    preferredTotalWeight > 0 ? Math.round((preferredAchievedWeight / preferredTotalWeight) * 100) : 100;
  const bulletEvidenceScore =
    matchedKeywords.length > 0 ? Math.round((bulletMatchedCount / matchedKeywords.length) * 100) : 0;

  // Sort missing keywords: Must-Have first, then Preferred, then General
  missingKeywords.sort((a, b) => b.weight - a.weight || a.skill.localeCompare(b.skill));

  // Sort matched keywords: Tier descending, then Credit descending
  matchedKeywords.sort((a, b) => b.weight - a.weight || b.credit - a.credit || a.skill.localeCompare(b.skill));

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const executionTimeMs = Math.max(0.1, Number((endTime - startTime).toFixed(2)));

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    mustHaveScore: Math.min(100, Math.max(0, mustHaveScore)),
    preferredScore: Math.min(100, Math.max(0, preferredScore)),
    bulletEvidenceScore: Math.min(100, Math.max(0, bulletEvidenceScore)),
    totalRequiredKeywords: targetSkillsMap.size,
    matchedCount: matchedKeywords.length,
    missingCount: missingKeywords.length,
    mustHaveCount,
    preferredCount,
    matchedKeywords,
    missingKeywords,
    executionTimeMs,
  };
}
