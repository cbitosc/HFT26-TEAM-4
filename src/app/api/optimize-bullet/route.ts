import { NextRequest, NextResponse } from "next/server";
import { optimizeSingleBullet } from "@/lib/ai/singleBulletOptimizer";
import { validateTextAgainstProfile } from "@/lib/ai/truthGuard";
import { ResumeDocumentSchema } from "@/lib/schema/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    // Interoperable payload extraction (supports HFT26, gemini, and chatgpt formats)
    const bulletText =
      (typeof body?.bulletText === "string" ? body.bulletText : "") ||
      (typeof body?.bullet === "string" ? body.bullet : "") ||
      (typeof body?.original === "string" ? body.original : "");

    const rawResume = body?.candidateResume ?? body?.profile ?? body?.resume;
    const roleTitle = typeof body?.roleTitle === "string" ? body.roleTitle.slice(0, 100) : "";
    const roleTechnologies = (Array.isArray(body?.roleTechnologies) ? body.roleTechnologies : [])
      .slice(0, 20)
      .map((t: unknown) => String(t).slice(0, 50));
    const jdRequirements =
      typeof (body?.jdRequirements ?? body?.jobDescription ?? body?.jd) === "string"
        ? (body.jdRequirements ?? body.jobDescription ?? body.jd).slice(0, 4000)
        : "";
    const focusKeyword =
      typeof body?.focusKeyword === "string"
        ? body.focusKeyword.slice(0, 100)
        : (Array.isArray(body?.targetKeywords) && typeof body.targetKeywords[0] === "string" ? body.targetKeywords[0].slice(0, 100) : "");

    const targetType =
      body?.targetType === "project"
        ? "project"
        : body?.targetType === "experience"
        ? "experience"
        : null;
    const targetId = typeof body?.targetId === "string" ? body.targetId : "";
    const bulletId = typeof body?.bulletId === "string" ? body.bulletId : "";

    if (!bulletText.trim()) {
      return NextResponse.json(
        { error: "A non-empty 'bulletText' parameter is required." },
        { status: 400 }
      );
    }

    if (bulletText.length > 1000) {
      return NextResponse.json(
        { error: "The 'bulletText' parameter exceeds the 1,000 character limit." },
        { status: 400 }
      );
    }

    if (!rawResume || typeof rawResume !== "object") {
      return NextResponse.json(
        { error: "Candidate resume payload is required." },
        { status: 400 }
      );
    }

    const parsedResume = ResumeDocumentSchema.safeParse(rawResume);
    if (!parsedResume.success) {
      return NextResponse.json(
        { error: "Invalid candidateResume payload.", details: parsedResume.error.issues },
        { status: 400 }
      );
    }

    const resume = parsedResume.data;

    // Stale-Edit Protection (409 Conflict): If bulletId & targetId provided, ensure bullet hasn't changed or become hidden
    if (targetType && targetId && bulletId) {
      const collection =
        targetType === "experience" ? resume.experience : resume.projects;
      const targetItem = collection.find(
        (item) => item.id === targetId && !item.hidden
      );
      const selectedBullet = targetItem?.bullets.find(
        (b) => b.id === bulletId && !b.hidden
      );

      if (!selectedBullet || selectedBullet.text.trim() !== bulletText.trim()) {
        return NextResponse.json(
          {
            error:
              "The selected bullet changed or is hidden. Refresh the editor and retry.",
          },
          { status: 409 }
        );
      }
    }

    // Always compute the deterministic XYZ baseline first
    const baseline = optimizeSingleBullet({
      bulletText: bulletText.trim(),
      roleTitle,
      roleTechnologies,
      candidateResume: resume,
      jdRequirements,
      focusKeyword,
    });

    const isFeatherless = Boolean(process.env.FEATHERLESS_API_KEY);
    const apiKey =
      process.env.FEATHERLESS_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.AI_API_KEY;

    const isPlaceholder =
      !apiKey ||
      apiKey === "your-featherless-api-key" ||
      apiKey === "your_api_key_here" ||
      apiKey === "test_key";

    if (isPlaceholder) {
      return NextResponse.json(
        {
          ...baseline,
          proposed: baseline.optimizedText,
          reason: baseline.explanation,
          flags: baseline.unverifiedClaims,
          needsConfirmation: baseline.truthStatus === "needs_confirmation",
          mode: "deterministic-assist",
        },
        { status: 200 }
      );
    }

    const baseUrl = (
      process.env.FEATHERLESS_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      (isFeatherless ? "https://api.featherless.ai/v1" : "https://api.openai.com/v1")
    ).replace(/\/+$/, "");

    const model =
      process.env.FEATHERLESS_MODEL ||
      process.env.OPENAI_MODEL ||
      (isFeatherless ? "meta-llama/Meta-Llama-3.1-70B-Instruct" : "gpt-4o-mini");

    try {
      const prompt = `Rewrite this single resume bullet using Google's XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]."
CRITICAL RULES:
1. NEVER invent numbers, metrics, or tools not grounded in the original bullet or candidate profile.
2. Keep strictly under 180 characters and start with a strong past-tense action verb.
3. Return strict JSON only: {"optimizedText":"string","accomplishedX":"string","measuredY":"string","byDoingZ":"string","explanation":"string"}

ROLE: ${roleTitle}
ROLE TECHNOLOGIES: ${roleTechnologies.join(", ")}
FOCUS KEYWORD: ${focusKeyword || baseline.addedKeywords[0] || ""}
ORIGINAL BULLET: ${bulletText.trim()}`;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 350,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Output strict JSON only. Never fabricate metrics.",
            },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(7000),
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || "";
        const jsonStr = rawContent
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed.optimizedText && typeof parsed.optimizedText === "string") {
          const validation = validateTextAgainstProfile(
            resume,
            parsed.optimizedText.trim(),
            bulletText.trim()
          );

          return NextResponse.json({
            ...baseline,
            optimizedText: parsed.optimizedText.trim(),
            proposed: parsed.optimizedText.trim(),
            accomplishedX: parsed.accomplishedX || baseline.accomplishedX,
            measuredY: parsed.measuredY || baseline.measuredY,
            byDoingZ: parsed.byDoingZ || baseline.byDoingZ,
            explanation: parsed.explanation || baseline.explanation,
            reason: parsed.explanation || baseline.explanation,
            truthStatus: validation.truthStatus,
            needsConfirmation: validation.truthStatus === "needs_confirmation",
            unverifiedClaims: validation.unverifiedClaims,
            flags: validation.unverifiedClaims,
            mode: "llm-assisted",
          });
        }
      }
    } catch {
      // Seamless fallback to deterministic XYZ optimizer
    }

    return NextResponse.json(
      {
        ...baseline,
        proposed: baseline.optimizedText,
        reason: baseline.explanation,
        flags: baseline.unverifiedClaims,
        needsConfirmation: baseline.truthStatus === "needs_confirmation",
        mode: "deterministic-assist",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
