import { FormField, FormFieldType, FormProvider, ParsedForm } from "./formTypes";
import { detectSemanticMapping } from "./formAutoFiller";

/**
 * Detects the ATS or form provider based on URL and HTML markers.
 */
export function detectFormProvider(urlStr: string, html: string = ""): FormProvider {
  const lowerUrl = urlStr.toLowerCase();
  const lowerHtml = html.toLowerCase();

  if (
    lowerUrl.includes("boards.greenhouse.io") ||
    lowerUrl.includes("greenhouse.io") ||
    lowerHtml.includes("greenhouse") ||
    lowerHtml.includes('id="application_form"')
  ) {
    return "greenhouse";
  }

  if (
    lowerUrl.includes("jobs.lever.co") ||
    lowerUrl.includes("lever.co") ||
    lowerHtml.includes("lever-form") ||
    lowerHtml.includes("postings-btn-wrapper")
  ) {
    return "lever";
  }

  if (
    lowerUrl.includes("myworkdayjobs.com") ||
    lowerUrl.includes("workday") ||
    lowerHtml.includes("workday")
  ) {
    return "workday";
  }

  if (
    lowerUrl.includes("docs.google.com/forms") ||
    lowerUrl.includes("forms.gle") ||
    lowerHtml.includes("freebirdformview") ||
    lowerHtml.includes("docs.google.com/forms")
  ) {
    return "google_form";
  }

  if (lowerUrl.includes("typeform.com") || lowerHtml.includes("typeform")) {
    return "typeform";
  }

  return "generic";
}

/**
 * Strips HTML tags and decodes common HTML entities.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Humanizes identifier names like "first_name" or "jobApplicantPhone" into "First Name" / "Job Applicant Phone".
 */
function humanizeIdentifier(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Extracts form fields and metadata from raw HTML.
 */
export function parseFormHtml(html: string, urlStr: string): ParsedForm {
  const provider = detectFormProvider(urlStr, html);

  // Extract page or form title
  const titleMatch =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  let formTitle = titleMatch ? cleanText(titleMatch[1]) : "";
  if (!formTitle || formTitle.length > 80) {
    formTitle = provider !== "generic" ? `${humanizeIdentifier(provider)} Application Form` : "Job Application Form";
  }

  // Extract Form action and method
  const formMatch = html.match(/<form\b([^>]*)>([\s\S]*?)<\/form>/i);
  const formAttrs = formMatch ? formMatch[1] : "";
  const formContent = formMatch ? formMatch[2] : html;

  const actionMatch = formAttrs.match(/action=["']([^"']*)["']/i);
  const methodMatch = formAttrs.match(/method=["']([^"']*)["']/i);
  let actionUrl = actionMatch ? actionMatch[1] : undefined;
  if (actionUrl && !actionUrl.startsWith("http") && !actionUrl.startsWith("//")) {
    try {
      actionUrl = new URL(actionUrl, urlStr).toString();
    } catch {
      // keep relative if invalid base
    }
  }

  const method: "POST" | "GET" =
    methodMatch && methodMatch[1].toUpperCase() === "GET" ? "GET" : "POST";

  // Check for CSRF token
  let csrfToken: string | undefined;
  const csrfMatch = html.match(
    /<input[^>]*name=["']([^"']*(?:csrf|token|authenticity)[^"']*)["'][^>]*value=["']([^"']*)["']/i
  );
  if (csrfMatch) {
    csrfToken = csrfMatch[2];
  }

  // Map label targets for quick lookup: map of for-id -> label text
  const labelsById = new Map<string, string>();
  const labelRegex = /<label\b[^>]*for=["']([^"']+)["'][^>]*>([\s\S]*?)<\/label>/gi;
  let lMatch: RegExpExecArray | null;
  while ((lMatch = labelRegex.exec(html)) !== null) {
    const id = lMatch[1].trim();
    const text = cleanText(lMatch[2]).replace(/[\*:]+$/, "").trim();
    if (id && text) {
      labelsById.set(id, text);
    }
  }

  const fields: FormField[] = [];
  const seenIds = new Set<string>();

  // Helper to extract an attribute from an HTML tag string
  const getAttr = (tag: string, attr: string): string => {
    const m = tag.match(new RegExp(`${attr}=(?:["']([^"']*)["']|([^\\s>]+))`, "i"));
    return m ? (m[1] !== undefined ? m[1] : m[2]) : "";
  };

  // 1. Parse Input elements
  const inputRegex = /<input\b([^>]*)>/gi;
  let iMatch: RegExpExecArray | null;
  while ((iMatch = inputRegex.exec(formContent)) !== null) {
    const tag = iMatch[1];
    const typeAttr = (getAttr(tag, "type") || "text").toLowerCase();

    // Skip hidden, submit, button, image, reset
    if (["hidden", "submit", "button", "reset", "image"].includes(typeAttr)) {
      continue;
    }

    const id = getAttr(tag, "id");
    const name = getAttr(tag, "name") || id || `field_${fields.length + 1}`;
    const placeholder = getAttr(tag, "placeholder");
    const ariaLabel = getAttr(tag, "aria-label");
    const required =
      tag.toLowerCase().includes("required") ||
      getAttr(tag, "aria-required") === "true";

    // Determine field type
    let fieldType: FormFieldType = "text";
    if (["email", "tel", "url", "number", "checkbox", "radio", "file"].includes(typeAttr)) {
      fieldType = typeAttr as FormFieldType;
    }

    // Determine label
    let label = "";
    if (id && labelsById.has(id)) {
      label = labelsById.get(id)!;
    } else if (ariaLabel) {
      label = cleanText(ariaLabel);
    } else if (placeholder) {
      label = cleanText(placeholder);
    } else {
      label = humanizeIdentifier(name);
    }
    label = label.replace(/[\*:]+$/, "").trim();

    // Semantic mapping inference
    const mapping = detectSemanticMapping(label, name, placeholder, fieldType);
    const fieldId = id || name;

    if (!seenIds.has(fieldId)) {
      seenIds.add(fieldId);
      fields.push({
        id: fieldId,
        name,
        label: label || humanizeIdentifier(name),
        type: fieldType,
        placeholder: placeholder || undefined,
        required,
        category: mapping.category,
        mappingKey: mapping.mappingKey,
        confidence: mapping.confidence,
        value: "",
        sourceFieldLabel: mapping.sourceFieldLabel,
      });
    }
  }

  // 2. Parse Textarea elements
  const textareaRegex = /<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = textareaRegex.exec(formContent)) !== null) {
    const tag = tMatch[1];
    const id = getAttr(tag, "id");
    const name = getAttr(tag, "name") || id || `field_${fields.length + 1}`;
    const placeholder = getAttr(tag, "placeholder");
    const ariaLabel = getAttr(tag, "aria-label");
    const required =
      tag.toLowerCase().includes("required") ||
      getAttr(tag, "aria-required") === "true";

    let label = "";
    if (id && labelsById.has(id)) {
      label = labelsById.get(id)!;
    } else if (ariaLabel) {
      label = cleanText(ariaLabel);
    } else if (placeholder) {
      label = cleanText(placeholder);
    } else {
      label = humanizeIdentifier(name);
    }
    label = label.replace(/[\*:]+$/, "").trim();

    const mapping = detectSemanticMapping(label, name, placeholder, "textarea");
    const fieldId = id || name;

    if (!seenIds.has(fieldId)) {
      seenIds.add(fieldId);
      fields.push({
        id: fieldId,
        name,
        label: label || humanizeIdentifier(name),
        type: "textarea",
        placeholder: placeholder || undefined,
        required,
        category: mapping.category,
        mappingKey: mapping.mappingKey,
        confidence: mapping.confidence,
        value: "",
        sourceFieldLabel: mapping.sourceFieldLabel,
      });
    }
  }

  // 3. Parse Select elements
  const selectRegex = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = selectRegex.exec(formContent)) !== null) {
    const tag = sMatch[1];
    const optionsBlock = sMatch[2];
    const id = getAttr(tag, "id");
    const name = getAttr(tag, "name") || id || `field_${fields.length + 1}`;
    const required =
      tag.toLowerCase().includes("required") ||
      getAttr(tag, "aria-required") === "true";

    let label = "";
    if (id && labelsById.has(id)) {
      label = labelsById.get(id)!;
    } else {
      label = humanizeIdentifier(name);
    }
    label = label.replace(/[\*:]+$/, "").trim();

    // Extract options
    const options: string[] = [];
    const optRegex = /<option\b[^>]*>([\s\S]*?)<\/option>/gi;
    let oMatch: RegExpExecArray | null;
    while ((oMatch = optRegex.exec(optionsBlock)) !== null) {
      const optText = cleanText(oMatch[1]);
      if (optText && !optText.toLowerCase().includes("select one")) {
        options.push(optText);
      }
    }

    const mapping = detectSemanticMapping(label, name, "", "select");
    const fieldId = id || name;

    if (!seenIds.has(fieldId)) {
      seenIds.add(fieldId);
      fields.push({
        id: fieldId,
        name,
        label: label || humanizeIdentifier(name),
        type: "select",
        options: options.length > 0 ? options : undefined,
        required,
        category: mapping.category,
        mappingKey: mapping.mappingKey,
        confidence: mapping.confidence,
        value: options[0] || "",
        sourceFieldLabel: mapping.sourceFieldLabel,
      });
    }
  }

  // If parsed HTML has very few fields or empty fields (e.g. client-rendered SPA),
  // supplement with provider preset template so the user gets an immediately usable form!
  if (fields.length < 3) {
    const preset = getPresetForm(provider, urlStr);
    return {
      ...preset,
      title: formTitle || preset.title,
      url: urlStr,
    };
  }

  return {
    url: urlStr,
    title: formTitle,
    provider,
    actionUrl,
    method,
    fields,
    csrfToken,
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Returns a complete realistic ATS form template for popular providers.
 * Allows instant one-click testing and testing across Greenhouse, Lever, Google Form, and Workday.
 */
export function getPresetForm(
  provider: FormProvider = "greenhouse",
  customUrl?: string
): ParsedForm {
  switch (provider) {
    case "greenhouse":
      return {
        url: customUrl || "https://boards.greenhouse.io/techcorp/jobs/4829102",
        title: "TechCorp — Senior Software Engineer Application",
        provider: "greenhouse",
        actionUrl: "https://boards.greenhouse.io/techcorp/jobs/4829102/apply",
        method: "POST",
        detectedAt: new Date().toISOString(),
        fields: [
          {
            id: "first_name",
            name: "first_name",
            label: "First Name",
            type: "text",
            required: true,
            category: "personal",
            mappingKey: "basics.first_name",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.name (First Name)",
          },
          {
            id: "last_name",
            name: "last_name",
            label: "Last Name",
            type: "text",
            required: true,
            category: "personal",
            mappingKey: "basics.last_name",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.name (Last Name)",
          },
          {
            id: "email",
            name: "email",
            label: "Email Address",
            type: "email",
            required: true,
            category: "contact",
            mappingKey: "basics.email",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.email",
          },
          {
            id: "phone",
            name: "phone",
            label: "Phone Number",
            type: "tel",
            required: true,
            category: "contact",
            mappingKey: "basics.phone",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.phone",
          },
          {
            id: "location",
            name: "location",
            label: "Current Location",
            type: "text",
            placeholder: "e.g. San Francisco, CA",
            required: true,
            category: "contact",
            mappingKey: "basics.location",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.location",
          },
          {
            id: "resume_file",
            name: "resume_file",
            label: "Resume / CV Document",
            type: "file",
            required: true,
            category: "personal",
            mappingKey: "resume_file",
            confidence: 1.0,
            value: "ATS_Clean_Vector_Resume.pdf",
            sourceFieldLabel: "Native ATS Vector PDF Export",
          },
          {
            id: "linkedin_url",
            name: "linkedin_url",
            label: "LinkedIn Profile URL",
            type: "url",
            placeholder: "https://linkedin.com/in/username",
            category: "links",
            mappingKey: "basics.linkedin",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.linkedin",
          },
          {
            id: "github_url",
            name: "github_url",
            label: "GitHub Profile URL",
            type: "url",
            placeholder: "https://github.com/username",
            category: "links",
            mappingKey: "basics.github",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.github",
          },
          {
            id: "portfolio_url",
            name: "portfolio_url",
            label: "Portfolio / Personal Website",
            type: "url",
            placeholder: "https://yourportfolio.dev",
            category: "links",
            mappingKey: "basics.website",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.website",
          },
          {
            id: "current_company",
            name: "current_company",
            label: "Current Company / Employer",
            type: "text",
            category: "experience",
            mappingKey: "experience.current_company",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.experience[0].company",
          },
          {
            id: "current_title",
            name: "current_title",
            label: "Current Title / Headline",
            type: "text",
            category: "experience",
            mappingKey: "experience.current_role",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.experience[0].position",
          },
          {
            id: "years_experience",
            name: "years_experience",
            label: "Total Years of Relevant Experience",
            type: "number",
            required: true,
            category: "experience",
            mappingKey: "experience.years",
            confidence: 0.9,
            value: "",
            sourceFieldLabel: "Calculated Experience Duration",
          },
          {
            id: "cover_letter",
            name: "cover_letter",
            label: "Cover Letter / Additional Candidate Note",
            type: "textarea",
            placeholder: "Share why you are interested in this position...",
            category: "cover_letter",
            mappingKey: "cover_letter.text",
            confidence: 0.95,
            value: "",
            sourceFieldLabel: "Grounded Tailored Cover Letter",
          },
          {
            id: "work_auth",
            name: "work_auth",
            label: "Are you legally authorized to work in this country?",
            type: "select",
            options: ["Yes", "No"],
            required: true,
            category: "personal",
            mappingKey: "work_authorization",
            confidence: 1.0,
            value: "Yes",
            sourceFieldLabel: "Standard Work Authorization",
          },
          {
            id: "sponsorship",
            name: "sponsorship",
            label: "Will you now or in the future require visa sponsorship?",
            type: "select",
            options: ["No", "Yes"],
            required: true,
            category: "personal",
            mappingKey: "sponsorship_required",
            confidence: 1.0,
            value: "No",
            sourceFieldLabel: "Standard Visa Requirement",
          },
        ],
      };

    case "lever":
      return {
        url: customUrl || "https://jobs.lever.co/apex-cloud/senior-frontend-engineer",
        title: "Apex Cloud — Senior Frontend Engineer (Lever)",
        provider: "lever",
        actionUrl: "https://jobs.lever.co/apex-cloud/senior-frontend-engineer/apply",
        method: "POST",
        detectedAt: new Date().toISOString(),
        fields: [
          {
            id: "full_name",
            name: "name",
            label: "Full Name",
            type: "text",
            required: true,
            category: "personal",
            mappingKey: "basics.name",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.name",
          },
          {
            id: "email",
            name: "email",
            label: "Email",
            type: "email",
            required: true,
            category: "contact",
            mappingKey: "basics.email",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.email",
          },
          {
            id: "phone",
            name: "phone",
            label: "Phone",
            type: "tel",
            required: true,
            category: "contact",
            mappingKey: "basics.phone",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.phone",
          },
          {
            id: "org",
            name: "org",
            label: "Current Company",
            type: "text",
            category: "experience",
            mappingKey: "experience.current_company",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.experience[0].company",
          },
          {
            id: "urls_linkedin",
            name: "urls[LinkedIn]",
            label: "LinkedIn URL",
            type: "url",
            category: "links",
            mappingKey: "basics.linkedin",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.linkedin",
          },
          {
            id: "urls_github",
            name: "urls[GitHub]",
            label: "GitHub URL",
            type: "url",
            category: "links",
            mappingKey: "basics.github",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.github",
          },
          {
            id: "urls_portfolio",
            name: "urls[Portfolio]",
            label: "Portfolio URL",
            type: "url",
            category: "links",
            mappingKey: "basics.website",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.website",
          },
          {
            id: "skills",
            name: "skills",
            label: "Core Technical Skills",
            type: "text",
            category: "skills",
            mappingKey: "skills.list",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.skills",
          },
          {
            id: "comments",
            name: "comments",
            label: "Additional Information",
            type: "textarea",
            placeholder: "Add a note or cover letter for the hiring manager...",
            category: "cover_letter",
            mappingKey: "cover_letter.text",
            confidence: 0.95,
            value: "",
            sourceFieldLabel: "Grounded Tailored Cover Letter",
          },
        ],
      };

    case "google_form":
      return {
        url: customUrl || "https://docs.google.com/forms/d/e/1FAIpQLScExampleInternship/viewform",
        title: "Software Engineering Fast-Track Candidate Registration (Google Form)",
        provider: "google_form",
        actionUrl: "https://docs.google.com/forms/d/e/1FAIpQLScExampleInternship/formResponse",
        method: "POST",
        detectedAt: new Date().toISOString(),
        fields: [
          {
            id: "entry.1000001",
            name: "entry.1000001",
            label: "Full Name *",
            type: "text",
            required: true,
            category: "personal",
            mappingKey: "basics.name",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.name",
          },
          {
            id: "entry.1000002",
            name: "entry.1000002",
            label: "Email Address *",
            type: "email",
            required: true,
            category: "contact",
            mappingKey: "basics.email",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.email",
          },
          {
            id: "entry.1000003",
            name: "entry.1000003",
            label: "Phone Number *",
            type: "tel",
            required: true,
            category: "contact",
            mappingKey: "basics.phone",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.phone",
          },
          {
            id: "entry.1000004",
            name: "entry.1000004",
            label: "College / University Name *",
            type: "text",
            required: true,
            category: "education",
            mappingKey: "education.institution",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.education[0].institution",
          },
          {
            id: "entry.1000005",
            name: "entry.1000005",
            label: "Degree & Major / Branch *",
            type: "text",
            required: true,
            category: "education",
            mappingKey: "education.degree",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.education[0].degree",
          },
          {
            id: "entry.1000006",
            name: "entry.1000006",
            label: "Graduation Year *",
            type: "number",
            required: true,
            category: "education",
            mappingKey: "education.graduation_year",
            confidence: 0.95,
            value: "",
            sourceFieldLabel: "resume.education[0].endDate",
          },
          {
            id: "entry.1000007",
            name: "entry.1000007",
            label: "LinkedIn Profile URL",
            type: "url",
            category: "links",
            mappingKey: "basics.linkedin",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.linkedin",
          },
          {
            id: "entry.1000008",
            name: "entry.1000008",
            label: "GitHub / Project Showcase URL",
            type: "url",
            category: "links",
            mappingKey: "basics.github",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.github",
          },
          {
            id: "entry.1000009",
            name: "entry.1000009",
            label: "Brief Experience & Key Projects Summary",
            type: "textarea",
            category: "experience",
            mappingKey: "experience.summary",
            confidence: 0.9,
            value: "",
            sourceFieldLabel: "resume.experience[0]",
          },
        ],
      };

    case "workday":
    default:
      return {
        url: customUrl || "https://globalenterprise.myworkdayjobs.com/careers/job/Principal-Engineer_R1048",
        title: "Global Enterprise Careers — Principal Engineer (Workday)",
        provider: "workday",
        actionUrl: "https://globalenterprise.myworkdayjobs.com/careers/job/apply",
        method: "POST",
        detectedAt: new Date().toISOString(),
        fields: [
          {
            id: "wd_first_name",
            name: "legalFirstName",
            label: "Legal First Name",
            type: "text",
            required: true,
            category: "personal",
            mappingKey: "basics.first_name",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.name (First Name)",
          },
          {
            id: "wd_last_name",
            name: "legalLastName",
            label: "Legal Last Name",
            type: "text",
            required: true,
            category: "personal",
            mappingKey: "basics.last_name",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.name (Last Name)",
          },
          {
            id: "wd_email",
            name: "primaryEmail",
            label: "Primary Email Address",
            type: "email",
            required: true,
            category: "contact",
            mappingKey: "basics.email",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.email",
          },
          {
            id: "wd_phone",
            name: "primaryPhone",
            label: "Mobile / Primary Phone",
            type: "tel",
            required: true,
            category: "contact",
            mappingKey: "basics.phone",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.phone",
          },
          {
            id: "wd_location",
            name: "candidateAddress",
            label: "City, State / Country",
            type: "text",
            required: true,
            category: "contact",
            mappingKey: "basics.location",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.basics.location",
          },
          {
            id: "wd_degree",
            name: "highestDegree",
            label: "Degree Level",
            type: "text",
            category: "education",
            mappingKey: "education.degree",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.education[0].degree",
          },
          {
            id: "wd_school",
            name: "universityName",
            label: "University / Institution",
            type: "text",
            category: "education",
            mappingKey: "education.institution",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.education[0].institution",
          },
          {
            id: "wd_current_role",
            name: "mostRecentJobTitle",
            label: "Most Recent Job Title",
            type: "text",
            category: "experience",
            mappingKey: "experience.current_role",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.experience[0].position",
          },
          {
            id: "wd_skills",
            name: "primarySkills",
            label: "Top Core Skills & Technologies",
            type: "textarea",
            category: "skills",
            mappingKey: "skills.list",
            confidence: 1.0,
            value: "",
            sourceFieldLabel: "resume.skills",
          },
          {
            id: "wd_work_auth",
            name: "workAuthorizationStatus",
            label: "Legally eligible to work without restriction?",
            type: "select",
            options: ["Yes", "No"],
            required: true,
            category: "personal",
            mappingKey: "work_authorization",
            confidence: 1.0,
            value: "Yes",
            sourceFieldLabel: "Standard Work Authorization",
          },
        ],
      };
  }
}

/**
 * Returns available preset options for the UI quick-loader chips.
 */
export function getAvailablePresets(): Array<{
  id: FormProvider;
  name: string;
  sampleUrl: string;
  description: string;
}> {
  return [
    {
      id: "greenhouse",
      name: "Greenhouse",
      sampleUrl: "https://boards.greenhouse.io/techcorp/jobs/4829102",
      description: "Standard Greenhouse ATS application form with file upload & EEO fields",
    },
    {
      id: "lever",
      name: "Lever",
      sampleUrl: "https://jobs.lever.co/apex-cloud/senior-frontend-engineer",
      description: "Lever job application with categorized social links & candidate notes",
    },
    {
      id: "google_form",
      name: "Google Form",
      sampleUrl: "https://docs.google.com/forms/d/e/1FAIpQLScExampleInternship/viewform",
      description: "Direct entry Google Forms candidate intake questionnaire",
    },
    {
      id: "workday",
      name: "Workday",
      sampleUrl: "https://globalenterprise.myworkdayjobs.com/careers/job/Principal-Engineer_R1048",
      description: "Enterprise Workday portal with legal name and credentials",
    },
  ];
}
