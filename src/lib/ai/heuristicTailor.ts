import { ResumeDocument } from "../schema/resume";
import { JdRequirements } from "../schema/jd";
import {
  TailoredSuggestion,
  CriticFinding,
  TailorResponse,
  SummaryComparison,
} from "./aiTypes";
import {
  calculateJdCoverage,
  parseJdRequirements,
} from "../scoring/deterministicScorer";
import {
  validateSuggestion,
  validateSummary,
  extractMetricsFromText,
} from "./truthGuard";

const STRONG_VERBS = [
  "Spearheaded",
  "Architected",
  "Engineered",
  "Orchestrated",
  "Pioneered",
  "Optimized",
  "Streamlined",
  "Accelerated",
  "Formulated",
  "Delivered",
  "Consolidated",
];

const WEAK_OPENERS = [
  /^helped(?:\s+to)?\b/i,
  /^assisted(?:\s+(?:with|in))?\b/i,
  /^worked\s+on\b/i,
  /^was\s+responsible\s+for\b/i,
  /^responsible\s+for\b/i,
  /^involved\s+in\b/i,
  /^participated\s+in\b/i,
  /^did\b/i,
  /^made\b/i,
  /^created\b/i,
  /^developed\b/i,
  /^built\b/i,
  /^handled\b/i,
  /^supported\b/i,
];

function pickActionVerb(index: number): string {
  return STRONG_VERBS[index % STRONG_VERBS.length];
}

/**
 * Enhances a bullet point with stronger action verbs and verified keywords
 * while strictly preserving all factual assertions and grounded metrics.
 */
function enhanceBulletText(
  originalText: string,
  index: number,
  availableTechnologies: string[],
  targetKeywords: string[]
): { enhancedText: string; addedKeywords: string[]; wasModified: boolean } {
  let text = originalText.trim();
  let wasModified = false;
  const addedKeywords: string[] = [];

  // 1. Upgrade weak or passive opening verbs
  for (const pattern of WEAK_OPENERS) {
    if (pattern.test(text)) {
      const verb = pickActionVerb(index);
      text = text.replace(pattern, verb);
      wasModified = true;
      break;
    }
  }

  // If text didn't match weak openers, check if sharpening first word provides higher impact
  if (!wasModified) {
    const firstWordMatch = text.match(/^([A-Z][a-z]+ed)\b/);
    if (firstWordMatch) {
      const currentVerb = firstWordMatch[1];
      // If it's already a strong verb, leave it or conditionally upgrade
      if (["Spearheaded", "Architected", "Engineered", "Orchestrated"].includes(currentVerb)) {
        // Keep strong verb
      } else if (["Developed", "Built", "Implemented", "Created"].includes(currentVerb)) {
        const verb = pickActionVerb(index);
        text = text.replace(/^([A-Z][a-z]+ed)\b/, verb);
        wasModified = true;
      }
    }
  }

  // 2. Weave in an available technology from this role if not already in the bullet text
  // but verified as part of the candidate's tools for this position
  for (const targetKw of targetKeywords) {
    const isAvail = availableTechnologies.some(
      (t) => t.toLowerCase() === targetKw.toLowerCase()
    );
    const inText = new RegExp(`\\b${targetKw}\\b`, "i").test(text);

    if (isAvail && !inText) {
      addedKeywords.push(targetKw);
      // Weave near the end before trailing punctuation
      if (text.endsWith(".")) {
        text = `${text.slice(0, -1)} leveraging ${targetKw}.`;
      } else {
        text = `${text} leveraging ${targetKw}.`;
      }
      wasModified = true;
      break; // Add at most 1 keyword to keep it natural
    }
  }

  return { enhancedText: text, addedKeywords, wasModified };
}

/**
 * Generates ATS Critic findings by analyzing bullet structure, character length,
 * metric presence, and phrasing.
 */
function generateCriticFindings(profile: ResumeDocument): CriticFinding[] {
  const findings: CriticFinding[] = [];
  let findingCounter = 1;

  for (const exp of profile.experience ?? []) {
    const roleTitle = `${exp.company} - ${exp.position}`;

    if (exp.bullets.length > 5) {
      findings.push({
        id: `critic-${findingCounter++}`,
        type: "suggestion",
        category: "formatting",
        targetId: exp.id,
        targetTitle: roleTitle,
        message: `${roleTitle} has ${exp.bullets.length} bullets. Trimming to 3-4 high-impact bullets improves visual scannability.`,
        suggestion: "Consolidate smaller accomplishments into top achievement bullets.",
      });
    }

    for (const b of exp.bullets ?? []) {
      const text = b.text.trim();

      // Brevity check
      if (text.length > 180) {
        findings.push({
          id: `critic-${findingCounter++}`,
          type: "warning",
          category: "brevity",
          targetId: b.id,
          targetTitle: roleTitle,
          message: `Bullet exceeds 180 characters (${text.length} chars). Concise 1-2 line bullets retain recruiter attention during 6-second scans.`,
          suggestion: "Remove redundant filler words or split into two focused bullet points.",
        });
      }

      // Action verb check
      const startsWithStrongVerb = /^[A-Z][a-z]+ed\b/.test(text);
      const isWeak = WEAK_OPENERS.some((re) => re.test(text));
      if (isWeak || !startsWithStrongVerb) {
        findings.push({
          id: `critic-${findingCounter++}`,
          type: "suggestion",
          category: "action_verb",
          targetId: b.id,
          targetTitle: roleTitle,
          message: "Bullet does not begin with an active past-tense engineering verb.",
          suggestion: "Start with an action verb such as 'Spearheaded', 'Engineered', 'Optimized', or 'Architected'.",
        });
      }

      // Metric presence check
      const metrics = extractMetricsFromText(text);
      if (metrics.length === 0) {
        findings.push({
          id: `critic-${findingCounter++}`,
          type: "info",
          category: "metrics",
          targetId: b.id,
          targetTitle: roleTitle,
          message: "Bullet lacks quantifiable metrics or measured outcomes.",
          suggestion: "Add scale, performance deltas, latency improvements, or cost reductions (Google XYZ: Accomplished X, measured by Y, by doing Z).",
        });
      }
    }
  }

  for (const proj of profile.projects ?? []) {
    const projTitle = `Project: ${proj.name}`;
    for (const b of proj.bullets ?? []) {
      const text = b.text.trim();
      if (text.length > 180) {
        findings.push({
          id: `critic-${findingCounter++}`,
          type: "warning",
          category: "brevity",
          targetId: b.id,
          targetTitle: projTitle,
          message: `Project bullet exceeds 180 characters (${text.length} chars).`,
          suggestion: "Tighten wording to focus directly on technical implementation and metrics.",
        });
      }
    }
  }

  return findings;
}

/**
 * Heuristic Tailor offline engine.
 * Synthesizes grounded suggestions, summary comparison, and critic lints
 * without making external API calls.
 */
export function generateHeuristicTailor(
  masterProfile: ResumeDocument,
  jdInput: JdRequirements | string
): TailorResponse {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  // 1. Calculate JD coverage and discover targeted keywords
  const coverage = calculateJdCoverage(masterProfile, jdInput);
  const targetKeywords = coverage.missingKeywords.slice(0, 5).map((m) => m.skill);
  const matchedKeywords = coverage.matchedKeywords.slice(0, 5).map((m) => m.skill);

  // Determine target role title
  let targetTitle = masterProfile.targetRole || "Senior Software Engineer";
  if (typeof jdInput === "object" && jdInput.title) {
    targetTitle = jdInput.title;
  } else if (typeof jdInput === "string") {
    const titleMatch = jdInput.match(/(?:title|role|position):\s*([^\n\r]+)/i);
    if (titleMatch && titleMatch[1]) {
      targetTitle = titleMatch[1].trim();
    }
  }

  // 2. Synthesize Tailored Professional Summary
  const candidateSkills = (masterProfile.skills || []).flatMap((g) => g.skills || []);
  const topSkills = matchedKeywords.length > 0
    ? matchedKeywords
    : candidateSkills.length > 0
    ? candidateSkills.slice(0, 4)
    : [];
  const skillsPhrase = topSkills.length > 0 ? topSkills.join(", ") : "software engineering";
  const originalSummary = masterProfile.basics.summary || "";

  // Grounded tailored summary: preserves candidate's existing experience level and highlights verified skills
  const hasExperience = (masterProfile.experience?.length || 0) > 0;
  const profileCorpusLower = [
    originalSummary,
    ...(masterProfile.experience || []).map(
      (e) => `${e.position} ${e.company} ${e.description || ""} ${e.bullets.map((b) => b.text).join(" ")}`
    ),
    ...(masterProfile.projects || []).map(
      (p) => `${p.name} ${p.description || ""} ${p.bullets.map((b) => b.text).join(" ")}`
    ),
    ...(masterProfile.skills || []).flatMap((g) => g.skills),
  ]
    .join(" ")
    .toLowerCase();

  const hasArchitectureEvidence = profileCorpusLower.includes("architect");
  const hasSeniorityEvidence =
    profileCorpusLower.includes("proven") ||
    profileCorpusLower.includes("track record") ||
    profileCorpusLower.includes("senior") ||
    profileCorpusLower.includes("lead") ||
    profileCorpusLower.includes("principal") ||
    profileCorpusLower.includes("staff");

  let tailoredSummary = "";
  if (originalSummary.length > 0) {
    tailoredSummary = originalSummary.replace(
      /^([^.,]+)/,
      `${targetTitle} with proven expertise in ${skillsPhrase}`
    );
  } else if (hasExperience) {
    if (hasArchitectureEvidence && hasSeniorityEvidence) {
      tailoredSummary = `Results-driven ${targetTitle} with demonstrated expertise in ${skillsPhrase}. Proven track record designing resilient architectures and delivering high-impact engineering solutions.`;
    } else {
      tailoredSummary = `Results-driven ${targetTitle} with demonstrated expertise in ${skillsPhrase} and delivering reliable engineering solutions.`;
    }
  } else {
    // Blank summary and no work experience: do not claim senior track record or enterprise architectures
    tailoredSummary = `${targetTitle} with technical expertise in ${skillsPhrase}. Focused on building high-quality software solutions and applying clean coding principles.`;
  }

  const summaryComparison: SummaryComparison = validateSummary(
    masterProfile,
    originalSummary,
    tailoredSummary,
    `Tailored to align with target role '${targetTitle}' and emphasized verified skills (${skillsPhrase}).`
  );

  // 3. Synthesize Bullet Rewrites for Experience and Projects
  const suggestions: TailoredSuggestion[] = [];
  let suggestionIndex = 1;

  // Iterate over experience items
  for (const exp of masterProfile.experience ?? []) {
    const roleTitle = `${exp.company} (${exp.position})`;
    const expTechs = exp.technologies ?? [];

    for (const b of exp.bullets ?? []) {
      const { enhancedText, addedKeywords, wasModified } = enhanceBulletText(
        b.text,
        suggestionIndex,
        expTechs,
        targetKeywords
      );

      if (wasModified && enhancedText !== b.text) {
        const rawSuggestion: TailoredSuggestion = {
          id: `sugg-exp-${suggestionIndex++}`,
          section: "experience",
          itemId: exp.id,
          bulletId: b.id,
          itemTitle: roleTitle,
          originalText: b.text,
          suggestedText: enhancedText,
          targetKeywords: addedKeywords.length > 0 ? addedKeywords : matchedKeywords.slice(0, 2),
          truthStatus: "verified",
          unverifiedClaims: [],
          explanation: `Sharpened action verb to strengthen executive impact${
            addedKeywords.length > 0 ? ` and reinforced proven skill (${addedKeywords.join(", ")})` : ""
          }.`,
          coverageDeltaEstimate: addedKeywords.length > 0 ? 4 : 2,
        };

        // Run through Truth Guard
        const validated = validateSuggestion(masterProfile, rawSuggestion);
        suggestions.push(validated);
      }

      // Limit suggestions to top 5 for optimal reviewer focus
      if (suggestions.length >= 5) break;
    }
    if (suggestions.length >= 5) break;
  }

  // Also check projects if we have fewer than 3 suggestions
  if (suggestions.length < 3) {
    for (const proj of masterProfile.projects ?? []) {
      const projTitle = `Project: ${proj.name}`;
      const projTechs = proj.technologies ?? [];

      for (const b of proj.bullets ?? []) {
        const { enhancedText, addedKeywords, wasModified } = enhanceBulletText(
          b.text,
          suggestionIndex,
          projTechs,
          targetKeywords
        );

        if (wasModified && enhancedText !== b.text) {
          const rawSuggestion: TailoredSuggestion = {
            id: `sugg-proj-${suggestionIndex++}`,
            section: "projects",
            itemId: proj.id,
            bulletId: b.id,
            itemTitle: projTitle,
            originalText: b.text,
            suggestedText: enhancedText,
            targetKeywords: addedKeywords,
            truthStatus: "verified",
            unverifiedClaims: [],
            explanation: "Sharpened technical action phrasing and highlighted implementation focus.",
            coverageDeltaEstimate: 2,
          };
          suggestions.push(validateSuggestion(masterProfile, rawSuggestion));
        }
        if (suggestions.length >= 5) break;
      }
      if (suggestions.length >= 5) break;
    }
  }

  // 4. Generate Critic Findings
  const criticFindings = generateCriticFindings(masterProfile);

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const executionTimeMs = Math.max(0.1, Number((endTime - startTime).toFixed(2)));

  return {
    suggestions,
    criticFindings,
    isFallback: true,
    provider: "heuristic",
    model: "heuristic-v1-offline",
    executionTimeMs,
    summaryComparison,
  };
}
