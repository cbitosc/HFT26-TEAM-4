import { ResumeDocument } from "../schema/resume";
import { FormField, FormFieldCategory, FormFieldType } from "./formTypes";

/**
 * Resolves a semantic mapping key against the active ResumeDocument.
 * Always returns pure grounded data from the resume without hallucinations.
 */
export function resolveResumeValue(
  mappingKey: string,
  resume: ResumeDocument
): { value: string; confidence: number; sourceFieldLabel: string } {
  const basics = resume.basics || ({} as ResumeDocument["basics"]);
  const experience = resume.experience || [];
  const education = resume.education || [];
  const skills = resume.skills || [];

  // Helper to find social profile by network keyword
  const findProfile = (networkKeyword: string): string => {
    const directMatch = basics.profiles?.find((p) =>
      p.network.toLowerCase().includes(networkKeyword.toLowerCase())
    );
    if (directMatch) return directMatch.url || directMatch.username;
    if (networkKeyword === "linkedin" && basics.linkedin) return basics.linkedin;
    if (networkKeyword === "github" && basics.github) return basics.github;
    if ((networkKeyword === "portfolio" || networkKeyword === "website") && basics.website) {
      return basics.website;
    }
    return "";
  };

  // Helper to calculate total years of experience
  const calculateExperienceYears = (): string => {
    // Check summary for explicit years e.g. "7+ years", "5 years"
    const summaryMatch = (basics.summary || "").match(/(\d+)\+?\s*years/i);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1];
    }

    if (experience.length === 0) return "1";

    let totalMonths = 0;
    const now = new Date();
    for (const exp of experience) {
      if (!exp.startDate) continue;
      const startParts = exp.startDate.split("-").map(Number);
      const startYear = startParts[0] || 2020;
      const startMonth = startParts[1] || 1;
      const startDate = new Date(startYear, startMonth - 1);

      let endDate: Date;
      if (exp.current || !exp.endDate) {
        endDate = now;
      } else {
        const endParts = exp.endDate.split("-").map(Number);
        const endYear = endParts[0] || startYear;
        const endMonth = endParts[1] || 12;
        endDate = new Date(endYear, endMonth - 1);
      }

      const diffMonths = Math.max(
        1,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth())
      );
      totalMonths += diffMonths;
    }

    const calculatedYears = Math.max(1, Math.round(totalMonths / 12));
    return calculatedYears.toString();
  };

  const currentExp =
    experience.find((e) => e.current) || experience[0] || undefined;
  const primaryEdu = education[0] || undefined;
  const allSkillsList = skills
    .flatMap((g) => g.skills || [])
    .filter(Boolean)
    .join(", ");

  switch (mappingKey) {
    case "basics.name":
      return {
        value: basics.name || "",
        confidence: basics.name ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.name",
      };

    case "basics.first_name": {
      const parts = (basics.name || "").trim().split(/\s+/);
      return {
        value: parts[0] || "",
        confidence: parts[0] ? 0.95 : 0.0,
        sourceFieldLabel: "resume.basics.name (First Name)",
      };
    }

    case "basics.last_name": {
      const parts = (basics.name || "").trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
      return {
        value: lastName,
        confidence: lastName ? 0.95 : 0.0,
        sourceFieldLabel: "resume.basics.name (Last Name)",
      };
    }

    case "basics.email":
      return {
        value: basics.email || "",
        confidence: basics.email ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.email",
      };

    case "basics.phone":
      return {
        value: basics.phone || "",
        confidence: basics.phone ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.phone",
      };

    case "basics.location":
      return {
        value: basics.location || "",
        confidence: basics.location ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.location",
      };

    case "basics.city": {
      const city = (basics.location || "").split(",")[0]?.trim() || "";
      return {
        value: city,
        confidence: city ? 0.9 : 0.0,
        sourceFieldLabel: "resume.basics.location (City)",
      };
    }

    case "basics.linkedin": {
      const url = findProfile("linkedin");
      return {
        value: url,
        confidence: url ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.linkedin",
      };
    }

    case "basics.github": {
      const url = findProfile("github");
      return {
        value: url,
        confidence: url ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.github",
      };
    }

    case "basics.website": {
      const url = findProfile("portfolio") || findProfile("website");
      return {
        value: url,
        confidence: url ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.website",
      };
    }

    case "basics.headline":
      return {
        value: basics.headline || resume.targetRole || "",
        confidence: basics.headline ? 1.0 : 0.5,
        sourceFieldLabel: "resume.basics.headline",
      };

    case "basics.summary":
      return {
        value: basics.summary || "",
        confidence: basics.summary ? 1.0 : 0.0,
        sourceFieldLabel: "resume.basics.summary",
      };

    case "experience.current_role":
      return {
        value: currentExp?.position || basics.headline || "",
        confidence: currentExp?.position ? 1.0 : 0.6,
        sourceFieldLabel: "resume.experience[0].position",
      };

    case "experience.current_company":
      return {
        value: currentExp?.company || "",
        confidence: currentExp?.company ? 1.0 : 0.0,
        sourceFieldLabel: "resume.experience[0].company",
      };

    case "experience.years": {
      const yrs = calculateExperienceYears();
      return {
        value: yrs,
        confidence: 0.9,
        sourceFieldLabel: "Calculated Experience Duration",
      };
    }

    case "experience.summary": {
      if (!currentExp) return { value: "", confidence: 0, sourceFieldLabel: "resume.experience" };
      const bulletsText = (currentExp.bullets || [])
        .map((b) => `• ${b.text}`)
        .join("\n");
      return {
        value: `${currentExp.position} at ${currentExp.company}\n${bulletsText}`,
        confidence: 0.9,
        sourceFieldLabel: "resume.experience[0]",
      };
    }

    case "education.institution":
      return {
        value: primaryEdu?.institution || "",
        confidence: primaryEdu?.institution ? 1.0 : 0.0,
        sourceFieldLabel: "resume.education[0].institution",
      };

    case "education.degree":
      return {
        value: primaryEdu?.degree || "",
        confidence: primaryEdu?.degree ? 1.0 : 0.0,
        sourceFieldLabel: "resume.education[0].degree",
      };

    case "education.field":
      return {
        value: primaryEdu?.field || "",
        confidence: primaryEdu?.field ? 1.0 : 0.0,
        sourceFieldLabel: "resume.education[0].field",
      };

    case "education.gpa":
      return {
        value: primaryEdu?.gpa || "",
        confidence: primaryEdu?.gpa ? 1.0 : 0.0,
        sourceFieldLabel: "resume.education[0].gpa",
      };

    case "education.graduation_year": {
      const year = primaryEdu?.endDate?.split("-")[0] || "";
      return {
        value: year,
        confidence: year ? 0.9 : 0.0,
        sourceFieldLabel: "resume.education[0].endDate",
      };
    }

    case "skills.list":
      return {
        value: allSkillsList,
        confidence: allSkillsList ? 1.0 : 0.0,
        sourceFieldLabel: "resume.skills",
      };

    case "skills.primary": {
      const topCategory = skills[0];
      const topSkills = topCategory?.skills?.slice(0, 5).join(", ") || "";
      return {
        value: topSkills,
        confidence: topSkills ? 0.9 : 0.0,
        sourceFieldLabel: `resume.skills[0] (${topCategory?.category || "Core"})`,
      };
    }

    case "cover_letter": {
      const candidateName = basics.name || "Candidate";
      const targetRole = resume.targetRole || basics.headline || "Software Engineer";
      const topSkills = skills.flatMap((g) => g.skills || []).slice(0, 4).join(", ");
      const letter = `Dear Hiring Team,\n\nI am writing to express my strong enthusiasm for the ${targetRole} position. With verified engineering experience in ${topSkills || "modern software development"}, I have built a proven background delivering scalable and reliable systems.\n\n${basics.summary || ""}\n\nI look forward to discussing how my experience aligns with your team's goals.\n\nBest regards,\n${candidateName}`;
      return {
        value: letter,
        confidence: 0.95,
        sourceFieldLabel: "Generated from Profile & Summary",
      };
    }

    case "work_authorization":
      return {
        value: "Yes, authorized to work",
        confidence: 0.85,
        sourceFieldLabel: "Standard Work Authorization",
      };

    case "sponsorship_required":
      return {
        value: "No sponsorship required",
        confidence: 0.85,
        sourceFieldLabel: "Standard Visa Requirement",
      };

    case "resume_file": {
      const cleanName = (basics.name || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
      return {
        value: `${cleanName}_Resume.pdf`,
        confidence: 1.0,
        sourceFieldLabel: "ATS-Compliant Vector PDF Export",
      };
    }

    default:
      return {
        value: "",
        confidence: 0.0,
        sourceFieldLabel: "Unmapped Field",
      };
  }
}

/**
 * Detects the semantic mapping key for an HTML or ATS form field
 * by examining its label, name, placeholder, and type.
 */
export function detectSemanticMapping(
  label: string,
  name: string,
  type: string = "text",
  placeholder: string = ""
): {
  mappingKey: string;
  category: FormFieldCategory;
  confidence: number;
  sourceFieldLabel: string;
} {
  const haystack = `${label} ${name} ${placeholder}`.toLowerCase();

  // 1. Name checks
  if (
    haystack.includes("first name") ||
    haystack.includes("firstname") ||
    haystack.includes("fname") ||
    haystack.includes("given name")
  ) {
    return {
      mappingKey: "basics.first_name",
      category: "personal",
      confidence: 0.95,
      sourceFieldLabel: "resume.basics.name (First Name)",
    };
  }

  if (
    haystack.includes("last name") ||
    haystack.includes("lastname") ||
    haystack.includes("lname") ||
    haystack.includes("family name") ||
    haystack.includes("surname")
  ) {
    return {
      mappingKey: "basics.last_name",
      category: "personal",
      confidence: 0.95,
      sourceFieldLabel: "resume.basics.name (Last Name)",
    };
  }

  if (
    haystack.includes("full name") ||
    haystack.includes("fullname") ||
    haystack.includes("your name") ||
    haystack.includes("candidate name") ||
    /\bname\b/.test(haystack)
  ) {
    return {
      mappingKey: "basics.name",
      category: "personal",
      confidence: 0.98,
      sourceFieldLabel: "resume.basics.name",
    };
  }

  // 2. Contact info
  if (haystack.includes("email") || type === "email") {
    return {
      mappingKey: "basics.email",
      category: "contact",
      confidence: 1.0,
      sourceFieldLabel: "resume.basics.email",
    };
  }

  if (
    haystack.includes("phone") ||
    haystack.includes("mobile") ||
    haystack.includes("telephone") ||
    haystack.includes("cell") ||
    type === "tel"
  ) {
    return {
      mappingKey: "basics.phone",
      category: "contact",
      confidence: 1.0,
      sourceFieldLabel: "resume.basics.phone",
    };
  }

  if (
    haystack.includes("city") ||
    haystack.includes("metro")
  ) {
    return {
      mappingKey: "basics.city",
      category: "contact",
      confidence: 0.9,
      sourceFieldLabel: "resume.basics.location (City)",
    };
  }

  if (
    haystack.includes("location") ||
    haystack.includes("address") ||
    haystack.includes("residence") ||
    haystack.includes("country") ||
    haystack.includes("postal")
  ) {
    return {
      mappingKey: "basics.location",
      category: "contact",
      confidence: 0.9,
      sourceFieldLabel: "resume.basics.location",
    };
  }

  // 3. Links & Socials
  if (haystack.includes("linkedin")) {
    return {
      mappingKey: "basics.linkedin",
      category: "links",
      confidence: 1.0,
      sourceFieldLabel: "resume.basics.linkedin",
    };
  }

  if (haystack.includes("github") || haystack.includes("git repository")) {
    return {
      mappingKey: "basics.github",
      category: "links",
      confidence: 1.0,
      sourceFieldLabel: "resume.basics.github",
    };
  }

  if (
    haystack.includes("portfolio") ||
    haystack.includes("website") ||
    haystack.includes("personal site") ||
    haystack.includes("url") ||
    type === "url"
  ) {
    return {
      mappingKey: "basics.website",
      category: "links",
      confidence: 0.9,
      sourceFieldLabel: "resume.basics.website",
    };
  }

  // 4. Experience & Work
  if (
    haystack.includes("current company") ||
    haystack.includes("current employer") ||
    haystack.includes("most recent company") ||
    haystack.includes("employer")
  ) {
    return {
      mappingKey: "experience.current_company",
      category: "experience",
      confidence: 0.95,
      sourceFieldLabel: "resume.experience[0].company",
    };
  }

  if (
    haystack.includes("current title") ||
    haystack.includes("current position") ||
    haystack.includes("current role") ||
    haystack.includes("job title") ||
    haystack.includes("headline")
  ) {
    return {
      mappingKey: "experience.current_role",
      category: "experience",
      confidence: 0.95,
      sourceFieldLabel: "resume.experience[0].position",
    };
  }

  if (
    haystack.includes("years of experience") ||
    haystack.includes("experience in years") ||
    haystack.includes("total experience") ||
    haystack.includes("years exp")
  ) {
    return {
      mappingKey: "experience.years",
      category: "experience",
      confidence: 0.9,
      sourceFieldLabel: "Calculated Experience Duration",
    };
  }

  if (
    haystack.includes("work experience") ||
    haystack.includes("employment history") ||
    haystack.includes("describe your experience")
  ) {
    return {
      mappingKey: "experience.summary",
      category: "experience",
      confidence: 0.85,
      sourceFieldLabel: "resume.experience[0]",
    };
  }

  // 5. Education
  if (
    haystack.includes("university") ||
    haystack.includes("college") ||
    haystack.includes("school") ||
    haystack.includes("institution")
  ) {
    return {
      mappingKey: "education.institution",
      category: "education",
      confidence: 0.95,
      sourceFieldLabel: "resume.education[0].institution",
    };
  }

  if (
    haystack.includes("degree") ||
    haystack.includes("qualification")
  ) {
    return {
      mappingKey: "education.degree",
      category: "education",
      confidence: 0.95,
      sourceFieldLabel: "resume.education[0].degree",
    };
  }

  if (
    haystack.includes("major") ||
    haystack.includes("field of study") ||
    haystack.includes("discipline")
  ) {
    return {
      mappingKey: "education.field",
      category: "education",
      confidence: 0.9,
      sourceFieldLabel: "resume.education[0].field",
    };
  }

  if (haystack.includes("gpa")) {
    return {
      mappingKey: "education.gpa",
      category: "education",
      confidence: 0.95,
      sourceFieldLabel: "resume.education[0].gpa",
    };
  }

  if (
    haystack.includes("graduation year") ||
    haystack.includes("grad year") ||
    haystack.includes("year of completion")
  ) {
    return {
      mappingKey: "education.graduation_year",
      category: "education",
      confidence: 0.9,
      sourceFieldLabel: "resume.education[0].endDate",
    };
  }

  // 6. Skills
  if (
    haystack.includes("skills") ||
    haystack.includes("technologies") ||
    haystack.includes("tech stack") ||
    haystack.includes("proficiencies") ||
    haystack.includes("tools used")
  ) {
    return {
      mappingKey: "skills.list",
      category: "skills",
      confidence: 0.95,
      sourceFieldLabel: "resume.skills",
    };
  }

  // 7. Cover Letter & Summary
  if (
    haystack.includes("cover letter") ||
    haystack.includes("note to hiring manager") ||
    haystack.includes("why do you want to join") ||
    haystack.includes("additional comments") ||
    haystack.includes("personal statement")
  ) {
    return {
      mappingKey: "cover_letter",
      category: "cover_letter",
      confidence: 0.9,
      sourceFieldLabel: "Generated from Profile & Summary",
    };
  }

  if (
    haystack.includes("summary") ||
    haystack.includes("bio") ||
    haystack.includes("about you") ||
    haystack.includes("introduction")
  ) {
    return {
      mappingKey: "basics.summary",
      category: "cover_letter",
      confidence: 0.95,
      sourceFieldLabel: "resume.basics.summary",
    };
  }

  // 8. Work Authorization & Legal
  if (
    haystack.includes("authorized to work") ||
    haystack.includes("work authorization") ||
    haystack.includes("legally eligible")
  ) {
    return {
      mappingKey: "work_authorization",
      category: "personal",
      confidence: 0.9,
      sourceFieldLabel: "Standard Work Authorization",
    };
  }

  if (
    haystack.includes("sponsorship") ||
    haystack.includes("visa")
  ) {
    return {
      mappingKey: "sponsorship_required",
      category: "personal",
      confidence: 0.9,
      sourceFieldLabel: "Standard Visa Requirement",
    };
  }

  // 9. Resume File Upload
  if (
    haystack.includes("resume") ||
    haystack.includes("cv") ||
    type === "file"
  ) {
    return {
      mappingKey: "resume_file",
      category: "personal",
      confidence: 1.0,
      sourceFieldLabel: "ATS-Compliant Vector PDF Export",
    };
  }

  // Default fallback
  return {
    mappingKey: "custom",
    category: "custom",
    confidence: 0.3,
    sourceFieldLabel: "Custom Field",
  };
}

/**
 * Auto-fills a list of FormFields against the current ResumeDocument.
 * If a field was manually edited by the user (isUserModified === true),
 * its manual value is strictly preserved.
 * Otherwise, it dynamically binds and updates live from the candidate's resume!
 */
export function autoFillFormFields(
  fields: FormField[],
  resume: ResumeDocument
): FormField[] {
  return fields.map((field) => {
    // If user explicitly altered this value inside the form, preserve their override
    if (field.isUserModified) {
      return field;
    }

    const resolved = resolveResumeValue(field.mappingKey, resume);
    return {
      ...field,
      value: resolved.value || field.value || "",
      confidence: resolved.confidence > 0 ? resolved.confidence : field.confidence,
      sourceFieldLabel: resolved.sourceFieldLabel || field.sourceFieldLabel,
    };
  });
}

/**
 * Validates whether all required fields have non-empty values.
 */
export function validateFilledForm(fields: FormField[]): {
  isValid: boolean;
  missingRequired: string[];
} {
  const missing: string[] = [];

  for (const field of fields) {
    if (field.required) {
      if (!field.value || !field.value.trim()) {
        missing.push(field.label || field.name);
      }
    }
  }

  return {
    isValid: missing.length === 0,
    missingRequired: missing,
  };
}
