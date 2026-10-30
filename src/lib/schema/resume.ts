import { z } from "zod";

export const BulletPointSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type BulletPoint = z.infer<typeof BulletPointSchema>;

export const SocialProfileSchema = z.object({
  network: z.string(),
  username: z.string(),
  url: z.string(),
});
export type SocialProfile = z.infer<typeof SocialProfileSchema>;

export const ResumeBasicsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  headline: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  summary: z.string().default(""),
  profiles: z.array(SocialProfileSchema).default([]),
});
export type ResumeBasics = z.infer<typeof ResumeBasicsSchema>;

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  description: z.string().optional(),
  bullets: z.array(BulletPointSchema).default([]),
  technologies: z.array(z.string()).default([]),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().default(""),
  location: z.string().optional(),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  gpa: z.string().optional(),
  highlights: z.array(BulletPointSchema).default([]),
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().default(""),
  role: z.string().optional(),
  url: z.string().optional(),
  githubUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(BulletPointSchema).default([]),
  technologies: z.array(z.string()).default([]),
});
export type ProjectItem = z.infer<typeof ProjectItemSchema>;

export const SkillGroupSchema = z.object({
  id: z.string(),
  category: z.string(),
  skills: z.array(z.string()).default([]),
});
export type SkillGroup = z.infer<typeof SkillGroupSchema>;

export const CertificationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: z.string().optional(),
});
export type CertificationItem = z.infer<typeof CertificationItemSchema>;

export const SectionIdSchema = z.enum([
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
]);
export type SectionId = z.infer<typeof SectionIdSchema>;

export const ResumeThemeSchema = z.enum([
  "modern",
  "executive",
  "tech",
  "modern-minimal",
  "executive-ivy",
  "tech-clean",
]);
export type ResumeTheme = z.infer<typeof ResumeThemeSchema>;

export const ResumeFontFamilySchema = z.enum(["inter", "garamond", "roboto"]);
export type ResumeFontFamily = z.infer<typeof ResumeFontFamilySchema>;

export const ResumeMarginsSchema = z.enum(["compact", "normal", "spacious"]);
export type ResumeMargins = z.infer<typeof ResumeMarginsSchema>;

export const ResumeLayoutSchema = z.object({
  theme: ResumeThemeSchema.default("modern"),
  fontFamily: ResumeFontFamilySchema.default("inter"),
  fontScale: z.number().min(0.75).max(1.3).default(1.0),
  margins: ResumeMarginsSchema.default("normal"),
  autoFitOnePage: z.boolean().default(false),
  sectionOrder: z.array(SectionIdSchema).default([
    "summary",
    "experience",
    "projects",
    "skills",
    "education",
    "certifications",
  ]),
  sectionVisibility: z.record(SectionIdSchema, z.boolean()).default({
    summary: true,
    experience: true,
    projects: true,
    skills: true,
    education: true,
    certifications: true,
  }),
});
export type ResumeLayout = z.infer<typeof ResumeLayoutSchema>;

export const ResumeDocumentSchema = z.object({
  id: z.string(),
  title: z.string().default("Master Profile"),
  targetRole: z.string().optional(),
  basics: ResumeBasicsSchema,
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  skills: z.array(SkillGroupSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  layout: ResumeLayoutSchema.default({
    theme: "modern",
    fontFamily: "inter",
    fontScale: 1.0,
    margins: "normal",
    autoFitOnePage: false,
    sectionOrder: [
      "summary",
      "experience",
      "projects",
      "skills",
      "education",
      "certifications",
    ],
    sectionVisibility: {
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true,
      certifications: true,
    },
  }),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});
export type ResumeDocument = z.infer<typeof ResumeDocumentSchema>;
