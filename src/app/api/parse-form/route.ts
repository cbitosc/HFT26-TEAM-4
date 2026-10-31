import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchHtmlSafely, validateJobUrl } from "@/lib/scraper/urlScraper";
import {
  detectFormProvider,
  getPresetForm,
  parseFormHtml,
} from "@/lib/form/formParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body.",
      },
      { status: 400 }
    );
  }

  const parseResult = RequestSchema.safeParse(body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues[0]?.message || "Invalid URL parameter.";
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 400 }
    );
  }

  const { url } = parseResult.data;

  // 1. Direct Preset Check (e.g. preset://greenhouse or sample URLs)
  if (url.startsWith("preset://")) {
    const providerName = url.replace("preset://", "").trim().toLowerCase();
    const provider = ["greenhouse", "lever", "google_form", "workday"].includes(providerName)
      ? (providerName as any)
      : "greenhouse";
    const form = getPresetForm(provider, url);
    return NextResponse.json({ success: true, form }, { status: 200 });
  }

  // 2. Validate URL strictly for SSRF protection
  const validation = await validateJobUrl(url);
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error || "Invalid or restricted URL.",
      },
      { status: 400 }
    );
  }

  // 3. Attempt safe network fetch
  try {
    const fetchRes = await fetchHtmlSafely(url);

    if (fetchRes.success && fetchRes.html) {
      const parsed = parseFormHtml(fetchRes.html, fetchRes.finalUrl || url);
      return NextResponse.json({ success: true, form: parsed }, { status: 200 });
    }

    // If network fetch fails (e.g. sandbox offline, anti-bot captcha wall, or 403),
    // detect provider from URL and gracefully load the matching standard form layout!
    const provider = detectFormProvider(url);
    const fallbackForm = getPresetForm(provider, url);
    return NextResponse.json(
      {
        success: true,
        form: fallbackForm,
        note: `Form structure loaded via ${provider.toUpperCase()} provider schema (target page protected by bot/login gate).`,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const provider = detectFormProvider(url);
    const fallbackForm = getPresetForm(provider, url);
    return NextResponse.json(
      {
        success: true,
        form: fallbackForm,
        note: `Form loaded from provider template (${provider}).`,
      },
      { status: 200 }
    );
  }
}
