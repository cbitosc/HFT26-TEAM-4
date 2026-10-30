import { ResumeDocument } from "../schema/resume";
import { JdRequirements } from "../schema/jd";
import { calculateJdCoverage, MissingKeyword } from "../scoring/deterministicScorer";
import { extractMetricsFromText, validateTextAgainstProfile } from "./truthGuard";
import { TruthStatus } from "./aiTypes";

export interface SingleBulletOptimizationRequest {
  bulletText: string;
  roleTitle?: string;
  roleTechnologies?: string[];
  candidateResume: ResumeDocument;
  jdRequirements?: JdRequirements | string;
  focusKeyword?: string;
}

export interface SingleBulletOptimizationResult {
  originalText: string;
  optimizedText: string;
  accomplishedX: string;
  measuredY: string;
  byDoingZ: string;
  addedKeywords: string[];
  suggestedJdKeywords: string[];
  truthStatus: TruthStatus;
  unverifiedClaims: string[];
  explanation: string;
  estimatedCoverageDelta: number;
}

const ACTION_VERBS = [
  "Spearheaded",
  "Architected",
  "Engineered",
  "Orchestrated",
  "Pioneered",
  "Optimized",
  "Streamlined",
  "Accelerated",
  "Overhauled",
  "Formulated",
];

const WEAK_VERB_PATTERNS = [
  /^helped(?:\s+to)?\b/i,
  /^assisted(?:\s+(?:with|in))?\b/i,
  /^worked\s+on\b/i,
  /^was\s+responsible\s+for\b/i,
  /^responsible\s+for\b/i,
  /^involved\s+in\b/i,
  /^participated\s+in\b/i,
  /^did\b/i,
  /^made\b/i,
  /^handled\b/i,
  /^supported\b/i,
  /^built\b/i,
  /^developed\b/i,
  /^implemented\b/i,
  /^created\b/i,
];

/**
 * Optimizes a single bullet point using Google's XYZ formula:
 * Accomplished [X], as measured by [Y], by doing [Z].
 * Weaves in missing target JD keywords with deterministic Truth Guard verification.
 */
export function optimizeSingleBullet(
  request: SingleBulletOptimizationRequest
): SingleBulletOptimizationResult {
  const {
    bulletText,
    roleTitle = "",
    roleTechnologies = [],
    candidateResume,
    jdRequirements,
    focusKeyword,
  } = request;

  const rawText = (bulletText || "").trim();

  // 1. Discover missing JD keywords if JD provided
  let missingJdKeywords: MissingKeyword[] = [];
  if (jdRequirements) {
    try {
      const coverage = calculateJdCoverage(candidateResume, jdRequirements);
      missingJdKeywords = coverage.missingKeywords;
    } catch (e) {
      console.warn("Failed to calculate JD coverage for single bullet", e);
    }
  }

  const suggestedJdKeywords = missingJdKeywords
    .slice(0, 6)
    .map((m) => m.skill);

  // Determine target keyword to weave
  const targetKeyword = focusKeyword?.trim() || suggestedJdKeywords[0] || (roleTechnologies[0] ?? "");

  // 2. Extract existing metrics or identify if absent
  const existingMetrics = extractMetricsFromText(rawText);
  const hasExistingMetric = existingMetrics.length > 0;

  // 3. Normalize action verb
  let cleaned = rawText.replace(/[.]+$/, ""); // Strip trailing period
  let chosenVerb = ACTION_VERBS[0];

  for (const pattern of WEAK_VERB_PATTERNS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, "").trim();
      break;
    }
  }

  // Check if starts with a past-tense verb already
  const leadingVerbMatch = cleaned.match(/^([A-Z][a-z]+ed)\b\s*(.*)/i);
  let mainAction = cleaned;
  if (leadingVerbMatch) {
    const existingVerb = leadingVerbMatch[1];
    if (ACTION_VERBS.some((v) => v.toLowerCase() === existingVerb.toLowerCase())) {
      chosenVerb = existingVerb.charAt(0).toUpperCase() + existingVerb.slice(1);
    } else {
      chosenVerb = "Architected";
    }
    mainAction = leadingVerbMatch[2] || cleaned;
  } else {
    chosenVerb = "Engineered";
  }

  // 4. Construct Google XYZ Components
  // X: Accomplished [X]
  let accomplishedX = "";
  // Y: As measured by [Y]
  let measuredY = "";
  // Z: By doing [Z]
  let byDoingZ = "";

  if (hasExistingMetric) {
    // If the bullet already includes metrics, parse and align them
    // Pattern check: e.g. "cutting p95 response latency from 320ms to 95ms for 450k active tenants"
    const metricPhraseMatch = cleaned.match(
      /(cutting|reducing|boosting|increasing|shrinking|achieving|generating|improving|decreasing|elevating)\s+([^,]+)/i
    );

    if (metricPhraseMatch) {
      measuredY = metricPhraseMatch[0].trim();
      // Remove metric phrase from mainAction so we don't duplicate
      mainAction = mainAction.replace(metricPhraseMatch[0], "").replace(/,\s*,/g, ",").trim();
    } else {
      measuredY = `achieving ${existingMetrics.join(" and ")} performance gain`;
    }
  } else {
    // Qualitative grounded impact when no numbers exist in candidate profile (never fabricate numbers or reliability claims)
    const purposeMatch = cleaned.match(/(?:to|in order to|for)\s+([^,.]+)/i);
    if (purposeMatch && purposeMatch[1]) {
      measuredY = `enhancing ${purposeMatch[1].trim()}`;
    } else {
      measuredY = "supporting core engineering workflows";
    }
  }

  // Clean main action for [X]
  mainAction = mainAction.replace(/^[,;\s]+|[,;\s]+$/g, "");
  if (!mainAction || mainAction.length < 5) {
    mainAction = "production-grade software solutions";
  }
  accomplishedX = `${chosenVerb} ${mainAction}`;

  // Build [Z] incorporating target keyword without fabricating unverified architecture or testing
  const addedKeywords: string[] = [];
  if (targetKeyword) {
    const keywordRegex = new RegExp(`\\b${targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const alreadyContains = keywordRegex.test(accomplishedX);

    if (!alreadyContains) {
      byDoingZ = `utilizing ${targetKeyword}`;
      addedKeywords.push(targetKeyword);
    } else {
      byDoingZ = `applying clean code standards`;
    }
  } else {
    byDoingZ = `applying clean code standards and iterative delivery`;
  }

  // Assemble full XYZ sentence
  let optimizedText = "";
  if (accomplishedX.toLowerCase().includes(" by ") || accomplishedX.toLowerCase().includes(" leveraging ")) {
    optimizedText = `${accomplishedX}, ${measuredY}.`;
  } else {
    optimizedText = `${accomplishedX}, ${measuredY}, by ${byDoingZ}.`;
  }

  // Clean double spaces or weird punctuation
  optimizedText = optimizedText
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*,/g, ",")
    .replace(/\.\.+/g, ".")
    .trim();

  if (!optimizedText.endsWith(".")) {
    optimizedText += ".";
  }

  // 5. Truth Guard Validation
  const validation = validateTextAgainstProfile(candidateResume, optimizedText);

  // 6. Calculate estimated coverage delta
  let estimatedCoverageDelta = 0;
  if (addedKeywords.length > 0) {
    const isMustHave = missingJdKeywords.some(
      (m) =>
        m.tier === "must-have" &&
        addedKeywords.some((k) => k.toLowerCase() === m.skill.toLowerCase())
    );
    estimatedCoverageDelta = isMustHave ? 7 : 4;
  } else {
    estimatedCoverageDelta = 2; // Sharp Google XYZ verbs still improve score
  }

  return {
    originalText: bulletText,
    optimizedText,
    accomplishedX,
    measuredY,
    byDoingZ,
    addedKeywords,
    suggestedJdKeywords,
    truthStatus: validation.truthStatus,
    unverifiedClaims: validation.unverifiedClaims,
    explanation: addedKeywords.length > 0
      ? `Re-architected into Google XYZ format with strong active verb '${chosenVerb}' and integrated target JD keyword '${addedKeywords.join(", ")}'.`
      : `Re-architected into Google XYZ format with high-impact action verb '${chosenVerb}' and measurable outcomes.`,
    estimatedCoverageDelta,
  };
}
