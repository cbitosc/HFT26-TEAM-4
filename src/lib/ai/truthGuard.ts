import { ResumeDocument } from "../schema/resume";
import { ALL_SKILLS } from "../scoring/skillTaxonomy";
import { normalizeSkill, getSkillAliases } from "../scoring/aliasMap";
import {
  TailoredSuggestion,
  SummaryComparison,
  TruthStatus,
} from "./aiTypes";

interface GroundedProfileFacts {
  allTextLower: string;
  tools: Set<string>; // Canonical lowercased tool/skill names
  numbers: Set<string>; // Isolated numbers found in profile (e.g. "42", "95", "450")
  metricsExact: Set<string>; // Exact normalized metric strings (e.g. "42%", "$1.2m", "3.5x")
}

// Cache of regexes for skills
const TOOL_REGEX_CACHE = new Map<string, RegExp>();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSkillRegex(alias: string): RegExp {
  let cached = TOOL_REGEX_CACHE.get(alias);
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

// Regex patterns for detecting metrics in text
const METRIC_PATTERNS = [
  // Percentages: 42%, 99.9%, +15%
  /[+-]?\b\d+(?:\.\d+)?%/g,
  // Currency: $1.2M, $500k, $50,000, 100k USD
  /\$\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:[kKmMbBtT]|thousand|million|billion)?\b/gi,
  // Multipliers: 3.5x, 10X, 2.0x
  /\b\d+(?:\.\d+)?[xX]\b/g,
  // Scale counts with suffix: 450k, 15M+, 500k DAU, 400k QPS
  /\b\d+(?:\.\d+)?\s*(?:k\+|m\+|b\+|[kKmMbB]|million|billion|thousand)\s*(?:dau|mau|rps|qps|tps|users|tenants|customers|events|requests|operations|downloads|stars)?\b/gi,
  // Latency & duration: 95ms, 320ms, 45 minutes, 6 hours
  /\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?|seconds?|mins?|minutes?|hours?)\b/gi,
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
  if (profile.basics.headline) textCorpus.push(profile.basics.headline);
  if (profile.basics.summary) textCorpus.push(profile.basics.summary);

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

  // 3. Extract all metrics and isolated numbers from profile text
  for (const pattern of METRIC_PATTERNS) {
    const matches = combinedText.match(pattern);
    if (matches) {
      for (const m of matches) {
        metricsExact.add(normalizeMetricString(m));
      }
    }
  }

  // Extract isolated numeric digits (e.g. "42", "95", "450", "3.5")
  const rawNumberMatches = combinedText.match(/\b\d+(?:\.\d+)?\b/g);
  if (rawNumberMatches) {
    for (const n of rawNumberMatches) {
      numbers.add(n);
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
 * Extracts candidate tools/skills mentioned in a given piece of text.
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
 * Extracts candidate numeric metrics (percentages, dollar amounts, scale counts, latencies)
 * from a given piece of text.
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
    pattern: /\b(?:comprehensive|automated|unit|integration|end-to-end|e2e)?\s*test(?:ing|\s+coverage|\s+automation)?\b/i,
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
 * ungrounded tool names or fabricated numeric metrics.
 */
export function validateTextAgainstProfile(
  profileOrFacts: ResumeDocument | GroundedProfileFacts,
  text: string
): TruthValidationResult {
  const facts =
    "tools" in profileOrFacts
      ? profileOrFacts
      : extractProfileGroundedFacts(profileOrFacts);

  const detectedTools = extractToolsFromText(text);
  const detectedMetrics = extractMetricsFromText(text);
  const unverifiedClaims: string[] = [];

  // Check tools against grounded tools
  for (const tool of detectedTools) {
    const toolLower = tool.toLowerCase();
    const canon = normalizeSkill(tool)?.toLowerCase();

    const isGrounded =
      facts.tools.has(toolLower) ||
      (canon && facts.tools.has(canon)) ||
      facts.allTextLower.includes(toolLower);

    if (!isGrounded) {
      unverifiedClaims.push(
        `Tool/Skill "${tool}" is not mentioned in your Master Profile`
      );
    }
  }

  // Check metrics against grounded metrics & numbers
  for (const metric of detectedMetrics) {
    const norm = normalizeMetricString(metric);
    const directHit =
      facts.metricsExact.has(norm) ||
      facts.allTextLower.includes(norm) ||
      facts.allTextLower.includes(metric.toLowerCase());

    if (!directHit) {
      unverifiedClaims.push(
        `Metric "${metric}" was not found in your Master Profile (unverified metric)`
      );
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
  const facts = extractProfileGroundedFacts(masterProfile);
  const result = validateTextAgainstProfile(facts, suggestion.suggestedText);

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
  const facts = extractProfileGroundedFacts(masterProfile);
  const result = validateTextAgainstProfile(facts, suggestedSummary);

  return {
    original: originalSummary,
    suggested: suggestedSummary,
    truthStatus: result.truthStatus,
    unverifiedClaims: result.unverifiedClaims,
    explanation,
  };
}
