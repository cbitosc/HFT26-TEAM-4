import { ResumeDocument } from "../schema/resume";
import { ALL_SKILLS } from "../scoring/skillTaxonomy";
import { normalizeSkill, getSkillAliases } from "../scoring/aliasMap";
import {
  TailoredSuggestion,
  SummaryComparison,
  TruthStatus,
} from "./aiTypes";

export interface GroundedProfileFacts {
  allTextLower: string;
  tools: Set<string>;
  numbers: Set<string>;
  metricsExact: Set<string>;
}

const TOOL_REGEX_CACHE = new Map<string, RegExp>();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSkillRegex(alias: string): RegExp {
  const cached = TOOL_REGEX_CACHE.get(alias);
  if (cached) return cached;

  const lower = alias.toLowerCase().trim();
  let regex: RegExp;

  if (lower === "c") {
    regex = /(?:^|[\s,;:(/])C(?:[\s,;:)/.]|$)/;
  } else if (lower === "r") {
    regex = /(?:^|[\s,;:(/])R(?:[\s,;:)/.]|$)/;
  } else if (lower === "go") {
    regex = /\b(?:Golang|go-lang|Go(?:\s+programming|\s+language|\s+code)?)\b/;
  } else if (lower === ".net" || lower === "dotnet") {
    regex = /(?:\b|\s)\.NET\b|\bdotnet\b/i;
  } else if (lower === "c++" || lower === "cpp") {
    regex = /(?:^|[\s,;:(/])(?:C\+\+|cpp)(?:[\s,;:)/.]|$)/i;
  } else if (lower === "c#" || lower === "csharp") {
    regex = /(?:^|[\s,;:(/])(?:C#|csharp)(?:[\s,;:)/.]|$)/i;
  } else {
    const escaped = escapeRegex(alias);
    const prefix = /^\w/.test(alias) ? "\\b" : "(?:^|[\\s,;:(/])";
    const suffix = /\w$/.test(alias) ? "\\b" : "(?:$|[\\s,;:)/.])";
    regex = new RegExp(`${prefix}${escaped}${suffix}`, "i");
  }

  TOOL_REGEX_CACHE.set(alias, regex);
  return regex;
}

const SIGNED_METRIC_TOKEN_REGEX =
  /[+-]?[$€£₹]?\b\d+(?:,\d{3})*(?:\.\d+)?(?:%|x|ms|s|sec|mins?|minutes?|hours?|k|m|b|\+)?(?!\w)/gi;

// Regex patterns for detecting metrics in text
const METRIC_PATTERNS = [
  // Percentages: 42%, -20%, 99.9%, +15%
  /(?:^|(?<=[\s(;:,]))[+-]?\d+(?:\.\d+)?%/g,
  // Currency: $1.2M, $500k, $50,000, -$10k
  /(?:^|(?<=[\s(;:,]))[+-]?\$\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:[kKmMbBtT]|thousand|million|billion)?\b/gi,
  // Multipliers: 3.5x, -2x, 10X
  /(?:^|(?<=[\s(;:,]))[+-]?\d+(?:\.\d+)?[xX]\b/g,
  // Scale counts with suffix: 450k, 15M+, 500k DAU, 400k QPS
  /(?:^|(?<=[\s(;:,]))[+-]?\d+(?:\.\d+)?\s*(?:k\+|m\+|b\+|[kKmMbB]|million|billion|thousand)\s*(?:dau|mau|rps|qps|tps|users|tenants|customers|events|requests|operations|downloads|stars)?\b/gi,
  // Latency & duration: 95ms, 320ms, 45 minutes, 6 hours
  /(?:^|(?<=[\s(;:,]))[+-]?\d+(?:\.\d+)?\s*(?:ms|milliseconds?|seconds?|mins?|minutes?|hours?)\b/gi,
];

function normalizeMetricString(metric: string): string {
  return metric.toLowerCase().replace(/\s+/g, "").trim();
}

/**
 * Deterministically extracts all grounded facts (tools, numbers, metrics)
 * from the Master Profile document.
 */
export function extractProfileGroundedFacts(
  profile: ResumeDocument
): GroundedProfileFacts {
  const tools = new Set<string>();
  const numbers = new Set<string>();
  const metricsExact = new Set<string>();
  const textCorpus: string[] = [];

  // 1. Gather all raw strings from master profile
  if (profile.basics?.headline) textCorpus.push(profile.basics.headline);
  if (profile.basics?.summary) textCorpus.push(profile.basics.summary);

  for (const exp of profile.experience ?? []) {
    if (exp.company) textCorpus.push(exp.company);
    if (exp.position) textCorpus.push(exp.position);
    if (exp.description) textCorpus.push(exp.description);
    for (const b of exp.bullets ?? []) {
      textCorpus.push(b.text);
    }
    for (const tech of exp.technologies ?? []) {
      textCorpus.push(tech);
      const canon = normalizeSkill(tech);
      if (canon) tools.add(canon.toLowerCase());
      tools.add(tech.toLowerCase());
    }
  }

  for (const proj of profile.projects ?? []) {
    if (proj.name) textCorpus.push(proj.name);
    if (proj.description) textCorpus.push(proj.description);
    for (const b of proj.bullets ?? []) {
      textCorpus.push(b.text);
    }
    for (const tech of proj.technologies ?? []) {
      textCorpus.push(tech);
      const canon = normalizeSkill(tech);
      if (canon) tools.add(canon.toLowerCase());
      tools.add(tech.toLowerCase());
    }
  }

  for (const edu of profile.education ?? []) {
    if (edu.institution) textCorpus.push(edu.institution);
    if (edu.degree) textCorpus.push(edu.degree);
    if (edu.field) textCorpus.push(edu.field);
    for (const h of edu.highlights ?? []) {
      textCorpus.push(h.text);
    }
  }

  for (const group of profile.skills ?? []) {
    if (group.category) textCorpus.push(group.category);
    for (const s of group.skills ?? []) {
      textCorpus.push(s);
      const canon = normalizeSkill(s);
      if (canon) tools.add(canon.toLowerCase());
      tools.add(s.toLowerCase());
    }
  }

  for (const cert of profile.certifications ?? []) {
    if (cert.name) textCorpus.push(cert.name);
    if (cert.issuer) textCorpus.push(cert.issuer);
  }

  const combinedText = textCorpus.join(" ");
  const allTextLower = combinedText.toLowerCase();

  // 2. Discover all tools/skills mentioned anywhere in the profile text
  for (const skill of ALL_SKILLS) {
    const aliases = getSkillAliases(skill);
    for (const alias of aliases) {
      const regex = getSkillRegex(alias);
      if (regex.test(combinedText)) {
        tools.add(skill.toLowerCase());
        tools.add(alias.toLowerCase());
        break;
      }
    }
  }

  // 3. Extract exact metric phrases and raw numbers
  for (const pattern of METRIC_PATTERNS) {
    const matches = combinedText.match(pattern);
    if (matches) {
      for (const m of matches) {
        metricsExact.add(normalizeMetricString(m));
      }
    }
  }

  const signedMatches = combinedText.match(SIGNED_METRIC_TOKEN_REGEX);
  if (signedMatches) {
    for (const m of signedMatches) {
      metricsExact.add(normalizeMetricString(m));
    }
  }

  const rawNumberMatches = combinedText.match(/(?:^|(?<=[\s(;:,]))[+-]?\d+(?:\.\d+)?\b/g);
  if (rawNumberMatches) {
    for (const n of rawNumberMatches) {
      numbers.add(n.trim());
    }
  }

  return {
    allTextLower,
    tools,
    numbers,
    metricsExact,
  };
}

/**
 * Extracts tool/technology mentions from arbitrary text.
 */
export function extractToolsFromText(text: string): string[] {
  if (!text || !text.trim()) return [];
  const detected: string[] = [];

  for (const skill of ALL_SKILLS) {
    const aliases = getSkillAliases(skill);
    for (const alias of aliases) {
      const regex = getSkillRegex(alias);
      if (regex.test(text)) {
        detected.push(skill);
        break;
      }
    }
  }

  return detected;
}

/**
 * Extracts metric patterns from arbitrary text.
 */
export function extractMetricsFromText(text: string): string[] {
  if (!text || !text.trim()) return [];
  const found = new Set<string>();

  for (const pattern of METRIC_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const trimmed = m.trim();
        if (trimmed.length > 0) {
          found.add(trimmed);
        }
      }
    }
  }

  return Array.from(found);
}

interface QualitativeClaimCheck {
  pattern: RegExp;
  claimName: string;
  requiredKeywords: string[];
}

export const QUALITATIVE_CLAIM_RULES: QualitativeClaimCheck[] = [
  {
    pattern: /\b(?:architect(?:ed|ing|ure|ures)?)\b/i,
    claimName: "resilient/system architecture",
    requiredKeywords: ["architect", "architecture"],
  },
  {
    pattern: /\b(?:comprehensive|automated|unit|integration|end-to-end|e2e)?\s*test(?:s|ing|\s+coverage|\s+automation)?\b/i,
    claimName: "testing / test coverage",
    requiredKeywords: ["test", "testing", "qa", "tdd", "jest", "pytest", "cypress", "playwright", "junit", "test coverage"],
  },
  {
    pattern: /\bcontinuous integration\b|\bci\/cd\b/i,
    claimName: "CI/CD / continuous integration",
    requiredKeywords: ["ci/cd", "continuous integration", "jenkins", "github actions", "gitlab ci", "circleci", "travis"],
  },
  {
    pattern: /\bstructured reviews?\b|\bcode reviews?\b/i,
    claimName: "code/structured reviews",
    requiredKeywords: ["review", "reviews", "reviewer", "pr review"],
  },
  {
    pattern: /\b(?:system\s+)?reliability\b|\boperational efficiency\b/i,
    claimName: "system reliability / operational efficiency",
    requiredKeywords: ["reliability", "sre", "resilience", "fault-tolerant", "uptime", "availability", "operational efficiency"],
  },
  {
    pattern: /\bproven track record\b/i,
    claimName: "proven track record",
    requiredKeywords: ["track record", "proven", "senior", "lead", "principal", "staff"],
  },
];

export interface TruthValidationResult {
  truthStatus: TruthStatus;
  unverifiedClaims: string[];
  detectedTools: string[];
  detectedMetrics: string[];
}

/**
 * Validates text against the master profile facts, detecting any
 * ungrounded tool names, fabricated numeric metrics, sign-flips, or precision changes.
 * When originalBulletText is provided, metrics and tools are strictly grounded
 * against that specific bullet and its parent role/project.
 */
export function validateTextAgainstProfile(
  profileOrFacts: ResumeDocument | GroundedProfileFacts,
  text: string,
  originalBulletText?: string,
  targetItemId?: string
): TruthValidationResult {
  const isFullProfile = typeof profileOrFacts === "object" && "experience" in profileOrFacts;
  const facts =
    "tools" in profileOrFacts
      ? profileOrFacts
      : extractProfileGroundedFacts(profileOrFacts);

  const detectedTools = extractToolsFromText(text);
  const detectedMetrics = extractMetricsFromText(text);
  const unverifiedClaims: string[] = [];

  // Check length bounds (conciseness for ATS 1-page fit)
  if (text.length > 180) {
    unverifiedClaims.push(
      `Text exceeds recommended ATS line limit (${text.length} chars > 180 chars)`
    );
  }

  // If a full profile and originalBulletText (or targetItemId) are available,
  // tie tools strictly to that specific role or project.
  let roleGroundedTools: Set<string> | null = null;
  let roleContextTitle = "";

  if (isFullProfile && (originalBulletText || targetItemId)) {
    const origTrim = (originalBulletText || "").trim();
    const expItem = (profileOrFacts.experience ?? []).find(
      (e) => (targetItemId && e.id === targetItemId) || (origTrim && e.bullets?.some((b) => b.text.trim() === origTrim))
    );
    const projItem = !expItem
      ? (profileOrFacts.projects ?? []).find(
          (p) => (targetItemId && p.id === targetItemId) || (origTrim && p.bullets?.some((b) => b.text.trim() === origTrim))
        )
      : null;

    if (expItem) {
      roleGroundedTools = new Set<string>();
      roleContextTitle = expItem.company;
      for (const t of expItem.technologies ?? []) {
        roleGroundedTools.add(t.toLowerCase());
        const canon = normalizeSkill(t);
        if (canon) roleGroundedTools.add(canon.toLowerCase());
      }
      if (originalBulletText) {
        for (const t of extractToolsFromText(originalBulletText)) {
          roleGroundedTools.add(t.toLowerCase());
          const canon = normalizeSkill(t);
          if (canon) roleGroundedTools.add(canon.toLowerCase());
        }
      }
    } else if (projItem) {
      roleGroundedTools = new Set<string>();
      roleContextTitle = projItem.name;
      for (const t of projItem.technologies ?? []) {
        roleGroundedTools.add(t.toLowerCase());
        const canon = normalizeSkill(t);
        if (canon) roleGroundedTools.add(canon.toLowerCase());
      }
      if (originalBulletText) {
        for (const t of extractToolsFromText(originalBulletText)) {
          roleGroundedTools.add(t.toLowerCase());
          const canon = normalizeSkill(t);
          if (canon) roleGroundedTools.add(canon.toLowerCase());
        }
      }
    }
  }

  // Check tools against grounded tools
  for (const tool of detectedTools) {
    const toolLower = tool.toLowerCase();
    const canon = normalizeSkill(tool)?.toLowerCase();

    const isProfileGrounded =
      facts.tools.has(toolLower) ||
      (canon && facts.tools.has(canon)) ||
      getSkillRegex(toolLower).test(facts.allTextLower);

    if (!isProfileGrounded) {
      unverifiedClaims.push(
        `Tool/Skill "${tool}" is not mentioned in your Master Profile`
      );
    } else if (roleGroundedTools) {
      // Tool exists in profile, but verify it belongs to this role/project
      const isRoleGrounded =
        roleGroundedTools.has(toolLower) ||
        (canon && roleGroundedTools.has(canon));
      if (!isRoleGrounded) {
        unverifiedClaims.push(
          `Tool/Skill "${tool}" is from another role in your profile, but not associated with this role (${roleContextTitle})`
        );
      }
    }
  }

  const origBulletMetrics = originalBulletText
    ? new Set(extractMetricsFromText(originalBulletText).map(normalizeMetricString))
    : null;

  // Check metrics against grounded metrics & numbers
  for (const metric of detectedMetrics) {
    const norm = normalizeMetricString(metric);

    // If originalBulletText is provided (a bullet is being rewritten),
    // any metric MUST be grounded in the original bullet itself!
    // Metrics cannot be fabricated or transplanted from another role.
    if (originalBulletText !== undefined) {
      if (!origBulletMetrics || !origBulletMetrics.has(norm)) {
        unverifiedClaims.push(
          `Metric "${metric}" was not found in the original bullet (metrics cannot be fabricated or transferred from other roles)`
        );
        continue;
      }

      // Catch decimal precision drift or sign change when original bullet had e.g. 99.9% and suggested has 99.99% or 20% vs -20%
      const bareNum = norm.replace(/[^0-9.+-]/g, "");
      const flippedOrPrecisionChanged = Array.from(origBulletMetrics).some((origM) => {
        const origBare = origM.replace(/[^0-9.+-]/g, "");
        const isExactSignFlip = origM.replace(/^[+-]/, "") === norm.replace(/^[+-]/, "");
        const hasDecimal = origBare.includes(".") || bareNum.includes(".");
        const isPrecisionDrift = hasDecimal && (bareNum.startsWith(origBare) || origBare.startsWith(bareNum));
        return origM !== norm && (isExactSignFlip || isPrecisionDrift);
      });
      if (flippedOrPrecisionChanged) {
        unverifiedClaims.push(
          `Metric "${metric}" altered sign or decimal precision from original bullet`
        );
        continue;
      }
    } else {
      // For general text (e.g. summary or new bullet), check against profile facts
      const exactHit =
        facts.metricsExact.has(norm) ||
        (!norm.startsWith("-") && facts.numbers.has(norm));

      if (!exactHit) {
        unverifiedClaims.push(
          `Metric "${metric}" was not found in your Master Profile (unverified metric)`
        );
      }
    }
  }

  // Check qualitative claims (architecture, test coverage, reliability, track record)
  for (const rule of QUALITATIVE_CLAIM_RULES) {
    if (rule.pattern.test(text)) {
      const isGrounded = rule.requiredKeywords.some(
        (kw) => facts.allTextLower.includes(kw) || facts.tools.has(kw)
      );
      if (!isGrounded) {
        unverifiedClaims.push(
          `Qualitative claim "${rule.claimName}" is not supported by evidence in your Master Profile`
        );
      }
    }
  }

  const truthStatus: TruthStatus =
    unverifiedClaims.length > 0 ? "needs_confirmation" : "verified";

  return {
    truthStatus,
    unverifiedClaims,
    detectedTools,
    detectedMetrics,
  };
}

/**
 * Validates a single TailoredSuggestion against the master profile.
 * Modifies and returns the suggestion with truthStatus and unverifiedClaims populated.
 */
export function validateSuggestion(
  masterProfile: ResumeDocument,
  suggestion: TailoredSuggestion
): TailoredSuggestion {
  const result = validateTextAgainstProfile(
    masterProfile,
    suggestion.suggestedText,
    suggestion.originalText,
    suggestion.itemId
  );

  return {
    ...suggestion,
    truthStatus: result.truthStatus,
    unverifiedClaims: result.unverifiedClaims,
  };
}

/**
 * Validates a summary rewrite against the master profile.
 */
export function validateSummary(
  masterProfile: ResumeDocument,
  originalSummary: string,
  suggestedSummary: string,
  explanation?: string
): SummaryComparison {
  const result = validateTextAgainstProfile(
    masterProfile,
    suggestedSummary,
    undefined
  );

  return {
    original: originalSummary,
    suggested: suggestedSummary,
    truthStatus: result.truthStatus,
    unverifiedClaims: result.unverifiedClaims,
    explanation,
  };
}
