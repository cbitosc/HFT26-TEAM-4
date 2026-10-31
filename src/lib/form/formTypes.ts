import { ResumeDocument } from "../schema/resume";

export type FormFieldCategory =
  | "personal"
  | "contact"
  | "links"
  | "experience"
  | "education"
  | "skills"
  | "cover_letter"
  | "custom";

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file";

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // Options for select, radio, checkbox
  category: FormFieldCategory;
  mappingKey: string; // Semantic resume key path, e.g. "basics.name", "basics.email", "experience.current_company"
  confidence: number; // 0 to 1 confidence score of mapping
  value: string; // Current auto-filled value
  isUserModified?: boolean; // Set to true if the user manually typed an override in the form
  sourceFieldLabel: string; // User-facing origin label, e.g. "resume.basics.email"
}

export type FormProvider =
  | "greenhouse"
  | "lever"
  | "workday"
  | "google_form"
  | "typeform"
  | "generic";

export interface ParsedForm {
  url: string;
  title: string;
  provider: FormProvider;
  actionUrl?: string;
  method: "POST" | "GET";
  fields: FormField[];
  csrfToken?: string;
  detectedAt: string;
}

export interface FormSubmissionReceipt {
  success: boolean;
  confirmationId: string;
  timestamp: string;
  formUrl: string;
  formTitle: string;
  provider: FormProvider;
  submittedPayload: Record<string, string>;
  message: string;
}
