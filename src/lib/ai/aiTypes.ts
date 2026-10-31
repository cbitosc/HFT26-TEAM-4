import { z } from "zod";
import { ResumeDocument, ResumeDocumentSchema } from "../schema/resume";
import { JdRequirements, JdRequirementsSchema } from "../schema/jd";

export type TruthStatus = "verified" | "needs_confirmation";

export const TruthStatusSchema = z.enum(["verified", "needs_confirmation"]);

export const TailoredSuggestionSchema = z.object({
  id: z.string(),
  section: z.enum(["summary", "experience", "projects"]),
  itemId: z.string().optional(),
  bulletId: z.string().optional(),
  itemTitle: z.string().optional(),
  originalText: z.string(),
  suggestedText: z.string(),
  targetKeywords: z.array(z.string()).default([]),
  truthStatus: TruthStatusSchema.default("verified"),
  unverifiedClaims: z.array(z.string()).default([]),
  explanation: z.string().optional(),
  coverageDeltaEstimate: z.number().optional(),
});
export type TailoredSuggestion = z.infer<typeof TailoredSuggestionSchema>;

export const CriticCategorySchema = z.enum([
  "brevity",
  "action_verb",
  "metrics",
  "formatting",
  "keyword",
]);
export type CriticCategory = z.infer<typeof CriticCategorySchema>;

export const CriticTypeSchema = z.enum(["warning", "suggestion", "info"]);
export type CriticType = z.infer<typeof CriticTypeSchema>;

export const CriticFindingSchema = z.object({
  id: z.string(),
  type: CriticTypeSchema.default("suggestion"),
  category: CriticCategorySchema,
  targetId: z.string().optional(),
  targetTitle: z.string().optional(),
  message: z.string(),
  suggestion: z.string().optional(),
});
export type CriticFinding = z.infer<typeof CriticFindingSchema>;

export const SummaryComparisonSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  truthStatus: TruthStatusSchema.default("verified"),
  unverifiedClaims: z.array(z.string()).default([]),
  explanation: z.string().optional(),
});
export type SummaryComparison = z.infer<typeof SummaryComparisonSchema>;

export const TailorResponseSchema = z.object({
  suggestions: z.array(TailoredSuggestionSchema).default([]),
  criticFindings: z.array(CriticFindingSchema).default([]),
  isFallback: z.boolean().default(false),
  provider: z.string().optional(),
  model: z.string().optional(),
  executionTimeMs: z.number().optional(),
  summaryComparison: SummaryComparisonSchema.optional(),
});
export type TailorResponse = z.infer<typeof TailorResponseSchema>;

export const TailorRequestSchema = z.object({
  resume: ResumeDocumentSchema,
  jd: z.union([JdRequirementsSchema, z.string()]),
  targetKeywords: z.array(z.string()).optional(),
});
export type TailorRequest = z.infer<typeof TailorRequestSchema>;
