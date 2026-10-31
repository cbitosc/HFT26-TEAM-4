import { NextRequest, NextResponse } from "next/server";
import { ResumeDocument, ResumeDocumentSchema } from "../../../lib/schema/resume";
import { JdRequirements, JdRequirementsSchema } from "../../../lib/schema/jd";
import {
  TailoredSuggestion,
  CriticFinding,
  TailorResponse,
  SummaryComparison,
  TailorRequestSchema,
} from "../../../lib/ai/aiTypes";
import { validateSuggestion, validateSummary } from "../../../lib/ai/truthGuard";
import { generateHeuristicTailor } from "../../../lib/ai/heuristicTailor";
import { calculateJdCoverage } from "../../../lib/scoring/deterministicScorer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;

/**
 * Anonymizes candidate contact info and private identifiers before
 * sending data to an external LLM.
 */
function anonymizeProfile(profile: ResumeDocument): ResumeDocument {
  return {
    ...profile,
    basics: {
      ...profile.basics,
      name: "Candidate",
      email: "[EMAIL_REDACTED]",
      phone: "[PHONE_REDACTED]",
      location: "[LOCATION_REDACTED]",
      website: undefined,
      linkedin: undefined,
      github: undefined,
      profiles: [],
    },
  };
}

export async function POST(req: NextRequest) {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Support both { resume, jd } and { resume, jdText } payload formats
  const candidateResume = body?.resume;
  const candidateJd = body?.jd ?? body?.jdText;
  const targetKeywords = Array.isArray(body?.targetKeywords) ? body.targetKeywords : [];

  if (!candidateResume || typeof candidateResume !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid 'resume' payload" },
      { status: 400 }
    );
  }

  const parsedResume = ResumeDocumentSchema.safeParse(candidateResume);
  if (!parsedResume.success) {
    return NextResponse.json(
      { error: "Invalid resume structure", details: parsedResume.error.issues },
      { status: 400 }
    );
  }

  const masterProfile = parsedResume.data;
  const jdInput = candidateJd || "";

  // Check for external LLM API credentials
  const apiKey =
    process.env.FEATHERLESS_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY;

  const isPlaceholder =
    !apiKey ||
    apiKey === "your_api_key_here" ||
    apiKey === "your-featherless-api-key" ||
    apiKey === "test_key";

  // If no API key or placeholder provided, seamlessly execute offline heuristic fallback
  if (isPlaceholder) {
    const fallbackResponse = generateHeuristicTailor(masterProfile, jdInput);
    return NextResponse.json(fallbackResponse, { status: 200 });
  }

  // LLM Configuration
  const isFeatherless = Boolean(process.env.FEATHERLESS_API_KEY);
  const baseUrl =
    process.env.FEATHERLESS_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    (isFeatherless
      ? "https://api.featherless.ai/v1"
      : "https://api.openai.com/v1");

  const model =
    process.env.FEATHERLESS_MODEL ||
    process.env.OPENAI_MODEL ||
    (isFeatherless
      ? "meta-llama/Meta-Llama-3.1-8B-Instruct"
      : "gpt-4o-mini");

  // Anonymize profile data before prompt serialization
  const anonymizedResume = anonymizeProfile(masterProfile);

  const jdText =
    typeof jdInput === "string"
      ? jdInput
      : [
          `Title: ${jdInput.title || "Target Role"}`,
          `Company: ${jdInput.company || "Target Company"}`,
          jdInput.rawText || "",
          (jdInput.mustHave || []).length > 0 ? `Must Have: ${jdInput.mustHave.join(", ")}` : "",
          (jdInput.niceToHave || []).length > 0 ? `Nice To Have: ${jdInput.niceToHave.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n");

  const promptContent = `
You are an expert ATS Resume Architect and Truth-Preserving Tailoring Engine.
Your task is to tailor the candidate's resume for the target job description while strictly adhering to truthful facts.

CRITICAL TRUTH GUARD RULES:
1. NEVER fabricate or invent metrics, numbers, percentages, or dollar amounts not present in the original resume.
2. NEVER claim the candidate has hands-on production experience with tools or technologies they have not used.
3. Only weave in target keywords that are supported by the candidate's existing background or related tech stack.
4. Keep all rewritten bullets concise (<180 characters where possible) and begin with strong past-tense action verbs.

Candidate Profile (Anonymized):
${JSON.stringify({
  targetRole: anonymizedResume.targetRole,
  summary: anonymizedResume.basics.summary,
  experience: anonymizedResume.experience.map((e) => ({
    id: e.id,
    company: e.company,
    position: e.position,
    bullets: e.bullets,
    technologies: e.technologies,
  })),
  projects: anonymizedResume.projects.map((p) => ({
    id: p.id,
    name: p.name,
    bullets: p.bullets,
    technologies: p.technologies,
  })),
  skills: anonymizedResume.skills,
})}

Target Job Description:
${jdText.slice(0, 4000)}

${targetKeywords && targetKeywords.length > 0 ? `Target Focus Keywords: ${targetKeywords.join(", ")}` : ""}

Respond with a single JSON object with this exact shape:
{
  "summaryComparison": {
    "original": string,
    "suggested": string,
    "explanation": string
  },
  "suggestions": [
    {
      "id": string,
      "section": "experience" | "projects",
      "itemId": string,
      "bulletId": string,
      "itemTitle": string,
      "originalText": string,
      "suggestedText": string,
      "targetKeywords": string[],
      "explanation": string
    }
  ],
  "criticFindings": [
    {
      "id": string,
      "type": "warning" | "suggestion" | "info",
      "category": "brevity" | "action_verb" | "metrics" | "formatting" | "keyword",
      "targetId": string,
      "targetTitle": string,
      "message": string,
      "suggestion": string
    }
  ]
}
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const apiResponse = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert ATS Resume Architect. You output only valid JSON matching the requested schema with no surrounding Markdown code fences or introductory text.",
          },
          {
            role: "user",
            content: promptContent,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errText = await apiResponse.text().catch(() => "");
      console.warn(
        `[Tailor API] LLM endpoint returned status ${apiResponse.status}: ${errText}. Falling back to heuristic engine.`
      );
      const fallback = generateHeuristicTailor(masterProfile, jdInput);
      return NextResponse.json(fallback, { status: 200 });
    }

    const json = await apiResponse.json();
    const rawContent = json.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.warn("[Tailor API] LLM response empty. Falling back to heuristic engine.");
      const fallback = generateHeuristicTailor(masterProfile, jdInput);
      return NextResponse.json(fallback, { status: 200 });
    }

    // Clean potential markdown fences if present
    const cleanedJson = rawContent
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    const parsedData = JSON.parse(cleanedJson);
    const baseReport = calculateJdCoverage(masterProfile, jdInput);

    // Validate all suggestions through the Truth Guard and drop nonexistent bullet IDs
    const validatedSuggestions: TailoredSuggestion[] = [];
    const suggestionsList = Array.isArray(parsedData.suggestions) ? parsedData.suggestions : [];

    for (let idx = 0; idx < suggestionsList.length; idx++) {
      const sugg = suggestionsList[idx];
      if (!sugg || typeof sugg !== "object" || !sugg.suggestedText) continue;

      const targetBulletId = sugg.bulletId || sugg.targetId || sugg.id;

      // Locate original bullet in master profile
      let foundExp = masterProfile.experience?.find((e) =>
        e.bullets?.some((b) => b.id === targetBulletId)
      );
      let foundProj = !foundExp
        ? masterProfile.projects?.find((p) =>
            p.bullets?.some((b) => b.id === targetBulletId)
          )
        : undefined;

      if (!foundExp && !foundProj && sugg.originalText) {
        foundExp = masterProfile.experience?.find((e) =>
          e.bullets?.some((b) => b.text.trim() === sugg.originalText.trim())
        );
        if (!foundExp) {
          foundProj = masterProfile.projects?.find((p) =>
            p.bullets?.some((b) => b.text.trim() === sugg.originalText.trim())
          );
        }
      }

      // Drop hallucinated bullet IDs that do not exist in the candidate's profile
      if (!foundExp && !foundProj) continue;

      const section: "experience" | "projects" = foundExp ? "experience" : "projects";
      const itemId = foundExp ? foundExp.id : foundProj!.id;
      const itemTitle = foundExp
        ? `${foundExp.company} (${foundExp.position})`
        : `Project: ${foundProj!.name}`;
      const actualBullet = (foundExp ? foundExp.bullets : foundProj!.bullets).find(
        (b) => b.id === targetBulletId || b.text.trim() === (sugg.originalText || "").trim()
      )!;

      // Compute mathematically grounded hypothetical score delta
      const hypotheticalResume: ResumeDocument = {
        ...masterProfile,
        experience: (masterProfile.experience || []).map((e) =>
          e.id === itemId
            ? {
                ...e,
                bullets: (e.bullets || []).map((b) =>
                  b.id === actualBullet.id ? { ...b, text: sugg.suggestedText } : b
                ),
              }
            : e
        ),
        projects: (masterProfile.projects || []).map((p) =>
          p.id === itemId
            ? {
                ...p,
                bullets: (p.bullets || []).map((b) =>
                  b.id === actualBullet.id ? { ...b, text: sugg.suggestedText } : b
                ),
              }
            : p
        ),
      };
      const hypoReport = calculateJdCoverage(hypotheticalResume, jdInput);
      const dynamicDelta = Math.max(0, hypoReport.overallScore - baseReport.overallScore);

      const candidateSuggestion: TailoredSuggestion = {
        id: `sugg-${section}-${idx + 1}`,
        section,
        itemId,
        bulletId: actualBullet.id,
        itemTitle,
        originalText: actualBullet.text,
        suggestedText: sugg.suggestedText,
        targetKeywords: Array.isArray(sugg.targetKeywords)
          ? sugg.targetKeywords.filter((k: string) =>
              typeof k === "string" &&
              new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(sugg.suggestedText)
            )
          : [],
        truthStatus: "verified",
        unverifiedClaims: [],
        explanation: sugg.explanation,
        coverageDeltaEstimate: dynamicDelta,
      };

      validatedSuggestions.push(validateSuggestion(masterProfile, candidateSuggestion));
    }

    // Validate summary comparison through Truth Guard
    let validatedSummary: SummaryComparison | undefined;
    if (parsedData.summaryComparison?.suggested) {
      validatedSummary = validateSummary(
        masterProfile,
        masterProfile.basics.summary || parsedData.summaryComparison.original || "",
        parsedData.summaryComparison.suggested,
        parsedData.summaryComparison.explanation
      );
    }

    const criticFindings: CriticFinding[] = (parsedData.criticFindings || []).map(
      (f: CriticFinding, idx: number) => ({
        id: f.id || `critic-${idx + 1}`,
        type: f.type || "suggestion",
        category: f.category || "action_verb",
        targetId: f.targetId,
        targetTitle: f.targetTitle,
        message: f.message || "Improve phrasing for ATS scannability",
        suggestion: f.suggestion,
      })
    );

    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const executionTimeMs = Math.max(0.1, Number((endTime - startTime).toFixed(2)));

    const response: TailorResponse = {
      suggestions: validatedSuggestions,
      criticFindings,
      isFallback: false,
      provider: isFeatherless ? "featherless" : "openai",
      model,
      executionTimeMs,
      summaryComparison: validatedSummary,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout =
      (err instanceof Error && err.name === "AbortError") ||
      String(err).includes("aborted");

    console.warn(
      `[Tailor API] Call failed (${isTimeout ? "Timeout >8s" : String(err)}). Engaging offline heuristic fallback.`
    );

    const fallback = generateHeuristicTailor(masterProfile, jdInput);
    return NextResponse.json(fallback, { status: 200 });
  }
}
