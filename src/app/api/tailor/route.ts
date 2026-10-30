import { NextRequest, NextResponse } from "next/server";
import { ResumeDocument } from "../../../lib/schema/resume";
import { JdRequirements } from "../../../lib/schema/jd";
import {
  TailoredSuggestion,
  CriticFinding,
  TailorResponse,
  SummaryComparison,
  TailorRequestSchema,
} from "../../../lib/ai/aiTypes";
import { validateSuggestion, validateSummary } from "../../../lib/ai/truthGuard";
import { generateHeuristicTailor } from "../../../lib/ai/heuristicTailor";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const parsedRequest = TailorRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid tailor request structure", details: parsedRequest.error.issues },
      { status: 400 }
    );
  }

  const { resume: masterProfile, jd: jdInput, targetKeywords } = parsedRequest.data;

  // Check for external LLM API credentials
  const apiKey =
    process.env.FEATHERLESS_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY;

  // If no API key is provided, seamlessly execute offline heuristic fallback
  if (!apiKey) {
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
${jdText}

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
      "explanation": string,
      "coverageDeltaEstimate": number
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

    // Validate all suggestions through the Truth Guard
    const validatedSuggestions: TailoredSuggestion[] = (parsedData.suggestions || []).map(
      (sugg: TailoredSuggestion, idx: number) => {
        const withDefaults: TailoredSuggestion = {
          id: sugg.id || `llm-sugg-${idx + 1}`,
          section: sugg.section || "experience",
          itemId: sugg.itemId,
          bulletId: sugg.bulletId,
          itemTitle: sugg.itemTitle || "Experience Bullet",
          originalText: sugg.originalText || "",
          suggestedText: sugg.suggestedText || "",
          targetKeywords: Array.isArray(sugg.targetKeywords) ? sugg.targetKeywords : [],
          truthStatus: "verified",
          unverifiedClaims: [],
          explanation: sugg.explanation,
          coverageDeltaEstimate: typeof sugg.coverageDeltaEstimate === "number" ? sugg.coverageDeltaEstimate : 3,
        };
        return validateSuggestion(masterProfile, withDefaults);
      }
    );

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
