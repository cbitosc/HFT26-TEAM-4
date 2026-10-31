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
  actionMetricDensityPercent?: number;
  totalRequiredKeywords: number;
  matchedCount: number;
  missingCount: number;
  mustHaveCount: number;
  preferredCount: number;
  matchedKeywords: MatchedKeyword[];
  missingKeywords: MissingKeyword[];
  executionTimeMs: number;
}

const ACTION_VERBS_LIST = [
  "architected", "engineered", "developed", "built", "designed", "implemented",
  "optimized", "spearheaded", "accelerated", "reduced", "scaled", "automated",
  "led", "orchestrated", "refactored", "delivered", "deployed", "streamlined",
  "formulated", "established", "revamped", "transformed", "pioneered", "enhanced",
  "authored", "instituted", "championed", "trained", "fine-tuned", "audited",
];

const ACTION_VERBS_REGEX = new RegExp(`\\b(?:${ACTION_VERBS_LIST.join("|")})\\b`, "i");

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

// Compile rules once and sort globally by alias length descending for greedy non-overlapping matching
const SKILL_RULES: SkillMatchRule[] = [];

for (const canonical of ALL_SKILLS) {
  const category = getSkillCategory(canonical);
  const aliases = CANONICAL_TO_ALIASES.get(canonical) ?? [canonical.toLowerCase()];

  for (const alias of aliases) {
    SKILL_RULES.push({
      canonical,
      category,
      regex: buildSkillRegex(alias),
      alias,
    });
  }
}

// Sort longest alias first to guarantee specific compound phrases take precedence over substrings
SKILL_RULES.sort((a, b) => b.alias.length - a.alias.length);

export const PREFERRED_HEADING_REGEX =
  /^(?:[-*•+\d.)\s]*)(?:#+\s*|\*\*\s*)?(?:(?:preferred|desired|additional|bonus|optional)\s+(?:qualifications|requirements|skills|experience|competencies)|nice\s+to\s+have|bonus\s*(?:points|qualifications)?|what\s+we'd\s+love\s+to\s+see|pluses|great\s+to\s+have)(?:[:\-–—\s*]|$)/i;

export const MUST_HAVE_HEADING_REGEX =
  /^(?:[-*•+\d.)\s]*)(?:#+\s*|\*\*\s*)?(?:(?:required|minimum|basic|core|key|mandatory|essential)\s+(?:qualifications|requirements|skills|experience|competencies)|qualifications|requirements|skills\s+required|what\s+you(?:'ll|\s+will)\s+need|must\s+have|what\s+we(?:'re|\s+are)\s+looking\s+for|what\s+you\s+bring|who\s+you\s+are)(?:[:\-–—\s*]|$)/i;

export const GENERAL_HEADING_REGEX =
  /^(?:[-*•+\d.)\s]*)(?:#+\s*|\*\*\s*)?(?:(?:core\s+|primary\s+|key\s+)?responsibilities|what\s+you(?:'ll|\s+will)\s+do|about\s+the\s+role|role\s+overview|job\s+summary|duties|about\s+us|the\s+role)(?:[:\-–—\s*]|$)/i;

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

    // Heading regexes matching at line start (resilient across markdown hashes, bullets, and bold markers)
    const preferredHeadingMatch = line.match(PREFERRED_HEADING_REGEX);
    const mustHaveHeadingMatch = !preferredHeadingMatch && line.match(MUST_HAVE_HEADING_REGEX);
    const generalHeadingMatch = !preferredHeadingMatch && !mustHaveHeadingMatch && line.match(GENERAL_HEADING_REGEX);

    let lineToParse = line;
    let headingMatched = false;

    if (preferredHeadingMatch) {
      currentTier = "preferred";
      headingMatched = true;
      lineToParse = line.slice(preferredHeadingMatch[0].length).replace(/^[:\-–—\s*]+/, "").trim();
    } else if (mustHaveHeadingMatch) {
      currentTier = "must-have";
      headingMatched = true;
      lineToParse = line.slice(mustHaveHeadingMatch[0].length).replace(/^[:\-–—\s*]+/, "").trim();
    } else if (generalHeadingMatch) {
      currentTier = "general";
      headingMatched = true;
      lineToParse = line.slice(generalHeadingMatch[0].length).replace(/^[:\-–—\s*]+/, "").trim();
    }

    // If this line was purely a heading with no trailing content on the same line, advance to next line
    if (headingMatched && !lineToParse) {
      continue;
    }

    // Determine line-specific tier modifier
    let lineTier: RequirementTier = currentTier;
    if (/(?:must\s+have|required|essential|minimum\s+\d+\s+years?|expert\s+in)/i.test(line)) {
      lineTier = "must-have";
    } else if (/(?:nice\s+to\s+have|preferred|bonus|plus)/i.test(line)) {
      lineTier = "preferred";
    }

    // Match skills against this line using non-overlapping span subsumption
    // (e.g. matching "Spring Boot" prevents substring "Spring" from falsely matching the same token)
    const matchedSpans: { start: number; end: number }[] = [];

    for (const rule of SKILL_RULES) {
      const globalRegex = new RegExp(
        rule.regex.source,
        rule.regex.flags.includes("g") ? rule.regex.flags : rule.regex.flags + "g"
      );
      let match: RegExpExecArray | null;

      while ((match = globalRegex.exec(lineToParse)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // Discard sub-match if it overlaps with an already-claimed longer skill span
        const overlaps = matchedSpans.some(
          (span) => start < span.end && end > span.start
        );

        if (overlaps) {
          continue;
        }

        matchedSpans.push({ start, end });

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
        break; // Matched non-overlapping instance for this rule on this line
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
      actionMetricDensityPercent: 0,
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
  const sectionVisibility = resume?.layout?.sectionVisibility;
  const isSectionVisible = (sec: "summary" | "experience" | "projects" | "skills" | "education" | "certifications") =>
    sectionVisibility?.[sec] !== false;

  // Bullet index: array of { text, location }
  const bulletItems: { text: string; location: string }[] = [];

  if (isSectionVisible("experience")) {
    for (const exp of resume.experience ?? []) {
      if (exp.hidden) continue;
      const loc = `${exp.company} (${exp.position})`;
      for (const b of exp.bullets ?? []) {
        if (b.hidden || !b.text?.trim()) continue;
        bulletItems.push({ text: b.text, location: loc });
      }
    }
  }

  if (isSectionVisible("projects")) {
    for (const proj of resume.projects ?? []) {
      if (proj.hidden) continue;
      const loc = `Project: ${proj.name}`;
      for (const b of proj.bullets ?? []) {
        if (b.hidden || !b.text?.trim()) continue;
        bulletItems.push({ text: b.text, location: loc });
      }
    }
  }

  if (isSectionVisible("education")) {
    for (const edu of resume.education ?? []) {
      if (edu.hidden) continue;
      const loc = `${edu.institution}`;
      for (const h of edu.highlights ?? []) {
        if (h.hidden || !h.text?.trim()) continue;
        bulletItems.push({ text: h.text, location: loc });
      }
    }
  }

  // Skills list index: set of lowercase strings and canonical representations
  const skillsListStrings: { text: string; location: string }[] = [];

  if (isSectionVisible("skills")) {
    for (const group of resume.skills ?? []) {
      for (const s of group.skills ?? []) {
        skillsListStrings.push({ text: s, location: `Skills: ${group.category}` });
      }
    }
  }

  if (isSectionVisible("experience")) {
    for (const exp of resume.experience ?? []) {
      if (exp.hidden) continue;
      for (const tech of exp.technologies ?? []) {
        skillsListStrings.push({ text: tech, location: `${exp.company} Technologies` });
      }
    }
  }

  if (isSectionVisible("projects")) {
    for (const proj of resume.projects ?? []) {
      if (proj.hidden) continue;
      for (const tech of proj.technologies ?? []) {
        skillsListStrings.push({ text: tech, location: `${proj.name} Tech Stack` });
      }
    }
  }

  if (isSectionVisible("summary") && resume.basics?.summary) {
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

  let metricCount = 0;
  const metricRegex = /\b\d+(?:\.\d+)?(?:%|x|ms|s|k|m)?\+?(?!\w)/i;
  for (const b of bulletItems) {
    const hasVerb = ACTION_VERBS_REGEX.test(b.text);
    const hasMetric = metricRegex.test(b.text);
    if (hasVerb && hasMetric) metricCount++;
  }
  const actionMetricDensityPercent =
    bulletItems.length > 0 ? Math.min(100, Math.round((metricCount / bulletItems.length) * 100)) : 0;

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const executionTimeMs = Math.max(0.1, Number((endTime - startTime).toFixed(2)));

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    mustHaveScore: Math.min(100, Math.max(0, mustHaveScore)),
    preferredScore: Math.min(100, Math.max(0, preferredScore)),
    bulletEvidenceScore: Math.min(100, Math.max(0, bulletEvidenceScore)),
    actionMetricDensityPercent,
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
