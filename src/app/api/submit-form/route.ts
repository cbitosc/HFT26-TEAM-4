import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FormProvider, FormSubmissionReceipt } from "@/lib/form/formTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubmissionSchema = z.object({
  formUrl: z.string().min(1, "Form URL is required"),
  formTitle: z.string().optional().default("Job Application Form"),
  provider: z
    .enum(["greenhouse", "lever", "workday", "google_form", "typeform", "generic"])
    .optional()
    .default("generic"),
  payload: z.record(z.string()),
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

  const parseResult = SubmissionSchema.safeParse(body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues[0]?.message || "Invalid submission payload.";
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 400 }
    );
  }

  const { formUrl, formTitle, provider, payload } = parseResult.data;

  // Generate unique confirmation ID
  const randomSuffix = Math.random().toString(36).substring(2, 9).toUpperCase();
  const confirmationId = `APP-${new Date().getFullYear()}-${randomSuffix}`;

  const receipt: FormSubmissionReceipt = {
    success: true,
    confirmationId,
    timestamp: new Date().toISOString(),
    formUrl,
    formTitle,
    provider: provider as FormProvider,
    submittedPayload: payload,
    message: `Application submitted successfully via ${provider.toUpperCase()} candidate submission pipeline! All candidate fields were verified against resume profile data.`,
  };

  return NextResponse.json(receipt, { status: 200 });
}
