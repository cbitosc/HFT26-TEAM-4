import test from "node:test";
import assert from "node:assert/strict";
import { defaultResumeDocument } from "../src/lib/store/useResumeStore";
import {
  detectFormProvider,
  parseFormHtml,
  getPresetForm,
  getAvailablePresets,
} from "../src/lib/form/formParser";
import {
  detectSemanticMapping,
  resolveResumeValue,
  autoFillFormFields,
  validateFilledForm,
} from "../src/lib/form/formAutoFiller";
import { FormField, ParsedForm } from "../src/lib/form/formTypes";

test("Form AutoFill & Submission Engine", async (t) => {
  const sampleCandidate = {
    ...defaultResumeDocument,
    basics: {
      ...defaultResumeDocument.basics,
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      headline: "Senior Full-Stack Engineer",
      summary: "Senior Full-Stack Engineer with 7+ years of experience building scalable distributed web applications.",
      website: "https://alexmorgan.dev",
      profiles: [
        {
          network: "LinkedIn",
          username: "alex-morgan",
          url: "https://linkedin.com/in/alex-morgan",
        },
        {
          network: "GitHub",
          username: "alexm",
          url: "https://github.com/alexm",
        },
      ],
    },
    experience: [
      {
        id: "exp-1",
        company: "Stripe",
        position: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2021-03",
        current: true,
        bullets: [
          {
            id: "b-1",
            text: "Architected real-time payment webhook delivery engine handling 45k req/s using Node.js and PostgreSQL.",
          },
          {
            id: "b-2",
            text: "Optimized distributed Redis cache invalidation, reducing p99 latency by 42%.",
          },
        ],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of California, Berkeley",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2015-08",
        endDate: "2019-05",
        gpa: "3.85",
      },
    ],
    skills: [
      {
        id: "s-1",
        category: "Languages",
        skills: ["TypeScript", "Python", "Go", "SQL"],
      },
      {
        id: "s-2",
        category: "Frameworks",
        skills: ["React", "Next.js", "Node.js", "PostgreSQL"],
      },
    ],
  };

  await t.test("1. Provider Detection", () => {
    assert.equal(
      detectFormProvider("https://boards.greenhouse.io/airbnb/jobs/12345"),
      "greenhouse"
    );
    assert.equal(
      detectFormProvider("https://jobs.lever.co/apex/frontend-dev"),
      "lever"
    );
    assert.equal(
      detectFormProvider("https://docs.google.com/forms/d/e/1FAIpQLSc/viewform"),
      "google_form"
    );
    assert.equal(
      detectFormProvider("https://company.myworkdayjobs.com/careers/job/1"),
      "workday"
    );
    assert.equal(
      detectFormProvider("https://customcompany.com/apply-now"),
      "generic"
    );
  });

  await t.test("2. HTML Form Parser & Extraction", () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Apex Systems - Application</title></head>
        <body>
          <form action="/apply/submit" method="POST">
            <input type="hidden" name="csrf_token" value="sec_token_98765" />
            <label for="cand_name">Full Name *</label>
            <input id="cand_name" name="candidate_name" type="text" required />

            <label for="cand_email">Email Address</label>
            <input id="cand_email" name="email" type="email" placeholder="you@domain.com" required />

            <label for="cand_phone">Mobile Phone</label>
            <input id="cand_phone" name="phone" type="tel" />

            <label for="cand_li">LinkedIn Profile</label>
            <input id="cand_li" name="linkedin_url" type="url" />

            <label for="cand_exp">Years of Experience</label>
            <input id="cand_exp" name="total_years" type="number" />

            <label for="cand_notes">Cover Letter / Note</label>
            <textarea id="cand_notes" name="cover_letter" placeholder="Tell us about yourself"></textarea>

            <label for="cand_auth">Are you legally authorized to work?</label>
            <select id="cand_auth" name="work_auth" required>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </form>
        </body>
      </html>
    `;

    const parsed: ParsedForm = parseFormHtml(sampleHtml, "https://apex.com/apply");
    assert.equal(parsed.title, "Apex Systems - Application");
    assert.equal(parsed.method, "POST");
    assert.equal(parsed.actionUrl, "https://apex.com/apply/submit");
    assert.equal(parsed.csrfToken, "sec_token_98765");
    assert.ok(parsed.fields.length >= 7, "Extracted all active form inputs");

    const nameField = parsed.fields.find((f) => f.name === "candidate_name");
    assert.ok(nameField);
    assert.equal(nameField?.required, true);
    assert.equal(nameField?.mappingKey, "basics.name");

    const emailField = parsed.fields.find((f) => f.name === "email");
    assert.ok(emailField);
    assert.equal(emailField?.mappingKey, "basics.email");

    const authField = parsed.fields.find((f) => f.name === "work_auth");
    assert.ok(authField);
    assert.equal(authField?.type, "select");
    assert.deepEqual(authField?.options, ["Yes", "No"]);
  });

  await t.test("3. Semantic Field Value Resolution", () => {
    // Name
    const nameRes = resolveResumeValue("basics.name", sampleCandidate);
    assert.equal(nameRes.value, "Alex Morgan");
    assert.equal(nameRes.confidence, 1.0);

    // First and Last Name splitting
    const fnRes = resolveResumeValue("basics.first_name", sampleCandidate);
    assert.equal(fnRes.value, "Alex");
    const lnRes = resolveResumeValue("basics.last_name", sampleCandidate);
    assert.equal(lnRes.value, "Morgan");

    // Email & Phone
    assert.equal(
      resolveResumeValue("basics.email", sampleCandidate).value,
      "alex.morgan@example.com"
    );
    assert.equal(
      resolveResumeValue("basics.phone", sampleCandidate).value,
      "+1 (555) 234-5678"
    );

    // Social Profiles
    assert.equal(
      resolveResumeValue("basics.linkedin", sampleCandidate).value,
      "https://linkedin.com/in/alex-morgan"
    );
    assert.equal(
      resolveResumeValue("basics.github", sampleCandidate).value,
      "https://github.com/alexm"
    );

    // Current Experience & Years
    assert.equal(
      resolveResumeValue("experience.current_company", sampleCandidate).value,
      "Stripe"
    );
    assert.equal(
      resolveResumeValue("experience.current_role", sampleCandidate).value,
      "Senior Software Engineer"
    );
    assert.equal(
      resolveResumeValue("experience.years", sampleCandidate).value,
      "7"
    );

    // Education
    assert.equal(
      resolveResumeValue("education.institution", sampleCandidate).value,
      "University of California, Berkeley"
    );
    assert.equal(
      resolveResumeValue("education.degree", sampleCandidate).value,
      "Bachelor of Science"
    );
    assert.equal(
      resolveResumeValue("education.graduation_year", sampleCandidate).value,
      "2019"
    );

    // Skills
    const skillsRes = resolveResumeValue("skills.list", sampleCandidate);
    assert.ok(skillsRes.value.includes("TypeScript"));
    assert.ok(skillsRes.value.includes("React"));
    assert.ok(skillsRes.value.includes("PostgreSQL"));
  });

  await t.test("4. AutoFilling & Two-Way Live Reactivity", () => {
    const initialForm = getPresetForm("greenhouse");
    const filled = autoFillFormFields(initialForm.fields, sampleCandidate);

    const emailField = filled.find((f) => f.mappingKey === "basics.email");
    assert.equal(emailField?.value, "alex.morgan@example.com");

    const phoneField = filled.find((f) => f.mappingKey === "basics.phone");
    assert.equal(phoneField?.value, "+1 (555) 234-5678");

    // Live update simulation: User changes their email and phone in the resume editor
    const updatedCandidate = {
      ...sampleCandidate,
      basics: {
        ...sampleCandidate.basics,
        email: "alex.newemail@stripe.com",
        phone: "+1 (555) 999-0000",
      },
    };

    // Form fields re-sync live
    const liveSynced = autoFillFormFields(filled, updatedCandidate);
    const updatedEmailField = liveSynced.find((f) => f.mappingKey === "basics.email");
    const updatedPhoneField = liveSynced.find((f) => f.mappingKey === "basics.phone");

    assert.equal(
      updatedEmailField?.value,
      "alex.newemail@stripe.com",
      "Live sync immediately updated email in form"
    );
    assert.equal(
      updatedPhoneField?.value,
      "+1 (555) 999-0000",
      "Live sync immediately updated phone in form"
    );
  });

  await t.test("5. User Override Preservation Invariant", () => {
    const initialForm = getPresetForm("lever");
    const filled = autoFillFormFields(initialForm.fields, sampleCandidate);

    // User manually customizes the "comments" / cover letter field directly in the form
    const withUserOverride = filled.map((f) => {
      if (f.id === "comments") {
        return {
          ...f,
          value: "Customized cover letter note tailored specifically for Apex Cloud.",
          isUserModified: true,
        };
      }
      return f;
    });

    // Now resume changes elsewhere (e.g. basics headline changes)
    const modifiedResume = {
      ...sampleCandidate,
      basics: {
        ...sampleCandidate.basics,
        name: "Alex J. Morgan",
      },
    };

    const reSynced = autoFillFormFields(withUserOverride, modifiedResume);

    // Name field updated live from resume
    const nameField = reSynced.find((f) => f.mappingKey === "basics.name");
    assert.equal(nameField?.value, "Alex J. Morgan");

    // Customized comments field strictly preserved user override!
    const commentsField = reSynced.find((f) => f.id === "comments");
    assert.equal(
      commentsField?.value,
      "Customized cover letter note tailored specifically for Apex Cloud."
    );
    assert.equal(commentsField?.isUserModified, true);
  });

  await t.test("6. Form Validation & Submission Preparation", () => {
    const testFields: FormField[] = [
      {
        id: "name",
        name: "name",
        label: "Full Name",
        type: "text",
        required: true,
        category: "personal",
        mappingKey: "basics.name",
        confidence: 1.0,
        value: "Alex Morgan",
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
        value: "", // Missing required value
        sourceFieldLabel: "resume.basics.email",
      },
    ];

    const invalidCheck = validateFilledForm(testFields);
    assert.equal(invalidCheck.isValid, false);
    assert.deepEqual(invalidCheck.missingRequired, ["Email"]);

    // Fill the required field
    testFields[1].value = "alex@example.com";
    const validCheck = validateFilledForm(testFields);
    assert.equal(validCheck.isValid, true);
    assert.deepEqual(validCheck.missingRequired, []);
  });

  await t.test("7. Presets Catalog Completeness", () => {
    const presets = getAvailablePresets();
    assert.ok(presets.length >= 4);
    assert.ok(presets.some((p) => p.id === "greenhouse"));
    assert.ok(presets.some((p) => p.id === "lever"));
    assert.ok(presets.some((p) => p.id === "google_form"));
    assert.ok(presets.some((p) => p.id === "workday"));

    const gh = getPresetForm("greenhouse");
    assert.equal(gh.provider, "greenhouse");
    assert.ok(gh.fields.length >= 10);
  });
});
