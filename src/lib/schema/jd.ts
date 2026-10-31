import { z } from "zod";

export const JdRequirementItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(["must-have", "nice-to-have"]).default("must-have"),
  keywords: z.array(z.string()).default([]),
});
export type JdRequirementItem = z.infer<typeof JdRequirementItemSchema>;

export const JdRequirementsSchema = z.object({
  id: z.string().default(() => `jd-${Date.now()}`),
  title: z.string().default(""),
  company: z.string().default(""),
  location: z.string().optional(),
  sourceUrl: z.string().optional(),
  rawText: z.string().default(""),
  mustHave: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  structuredRequirements: z.array(JdRequirementItemSchema).default([]),
  parsedAt: z.string().optional(),
});
export type JdRequirements = z.infer<typeof JdRequirementsSchema>;

export const createEmptyJd = (): JdRequirements => ({
  id: `jd-${Date.now()}`,
  title: "",
  company: "",
  rawText: "",
  mustHave: [],
  niceToHave: [],
  keywords: [],
  structuredRequirements: [],
});
