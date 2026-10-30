import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scrapeJobUrl } from "@/lib/scraper/urlScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
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
        advice: "Ensure the request body contains a valid JSON payload with a 'url' property.",
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
        advice: "Please enter a valid HTTP or HTTPS job posting URL.",
      },
      { status: 400 }
    );
  }

  const { url } = parseResult.data;

  const result = await scrapeJobUrl(url);

  if (!result.success) {
    // Determine appropriate HTTP status code
    let status = 422;
    if (result.error?.includes("timed out")) {
      status = 504;
    } else if (result.error?.includes("SSRF") || result.error?.includes("blocked") || result.error?.includes("Protocol")) {
      status = 400;
    } else if (result.error?.includes("Network error") || result.error?.includes("DNS")) {
      status = 502;
    }

    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 200 });
}
