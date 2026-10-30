import test, { describe, it } from "node:test";
import assert from "node:assert";
import { parseJdRequirements, calculateJdCoverage } from "../src/lib/scoring/deterministicScorer";
import { extractProfileGroundedFacts, validateTextAgainstProfile } from "../src/lib/ai/truthGuard";
import { optimizeSingleBullet } from "../src/lib/ai/singleBulletOptimizer";
import { generateVectorPdf } from "../src/lib/export/pdfExport";
import { createDocxDocument } from "../src/lib/export/docxExport";
import { defaultResumeDocument } from "../src/lib/store/useResumeStore";
import { ResumeDocument } from "../src/lib/schema/resume";

describe("Autonomous Boundary Matrix: Numbers, Strings, and Extreme Cases", () => {
  it("Scorer handles empty string, whitespace only, and null bytes without throwing", () => {
    const empty = parseJdRequirements("");
    assert.strictEqual(empty.length, 0);

    const whitespace = parseJdRequirements("   \n\t  \r\n   ");
    assert.strictEqual(whitespace.length, 0);

    const nullBytes = parseJdRequirements("Requirements:\n- Python\0 and Docker\0");
    const skills = nullBytes.map((s) => s.skill);
    assert.ok(skills.includes("Python"));
    assert.ok(skills.includes("Docker"));
  });

  it("Scorer handles extreme 25,000 character string without crashing or slowing down", () => {
    const hugeText = "Requirements:\n" + "- Proficient in TypeScript, React, and Node.js.\n".repeat(500);
    const start = performance.now();
    const parsed = parseJdRequirements(hugeText);
    const duration = performance.now() - start;

    assert.ok(parsed.length > 0);
    assert.ok(duration < 1000, `Execution took ${duration}ms, should be under 1000ms`);
  });

  it("Coverage score is strictly bounded in [0, 100] across all edge-case inputs", () => {
    const emptyResume: ResumeDocument = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        headline: "",
        summary: "",
      },
      experience: [],
      projects: [],
      skills: [],
      education: [],
      certifications: [],
    };

    const emptyScore = calculateJdCoverage(emptyResume, "");
    assert.strictEqual(emptyScore.overallScore, 0);
    assert.ok(emptyScore.overallScore >= 0 && emptyScore.overallScore <= 100);

    const jdText = "Requirements:\n- React\n- Node.js\n- Python\n- AWS";
    const partialScore = calculateJdCoverage(emptyResume, jdText);
    assert.strictEqual(partialScore.overallScore, 0);

    const fullScore = calculateJdCoverage(defaultResumeDocument, jdText);
    assert.ok(fullScore.overallScore >= 0 && fullScore.overallScore <= 100);
  });

  it("Scoring calculation is strictly idempotent: f(f(x)) === f(x)", () => {
    const jdText = "Requirements:\n- Next.js\n- TypeScript\n- PostgreSQL";
    const score1 = calculateJdCoverage(defaultResumeDocument, jdText);
    const score2 = calculateJdCoverage(defaultResumeDocument, jdText);

    assert.strictEqual(score1.overallScore, score2.overallScore);
    assert.strictEqual(score1.matchedKeywords.length, score2.matchedKeywords.length);
    assert.strictEqual(score1.missingKeywords.length, score2.missingKeywords.length);
  });

  it("Truth Guard handles completely blank profile without throwing and flags all ungrounded claims", () => {
    const blankResume: ResumeDocument = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        headline: "",
        summary: "",
      },
      experience: [],
      projects: [],
      skills: [],
      education: [],
      certifications: [],
    };

    const facts = extractProfileGroundedFacts(blankResume);
    assert.strictEqual(facts.tools.size, 0);

    // Text with claims not in profile
    const result = validateTextAgainstProfile(facts, "Built a Kubernetes pipeline reducing latency by 45% and saving $2M.");
    assert.strictEqual(result.truthStatus, "needs_confirmation");
    assert.ok(result.unverifiedClaims.length > 0);
  });

  it("Single Bullet Optimizer never injects fake numbers or microservice claims when candidate has none", () => {
    const blankResume: ResumeDocument = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        summary: "",
      },
      experience: [],
      projects: [],
      skills: [],
    };

    const opt = optimizeSingleBullet({
      bulletText: "Worked on customer dashboard",
      candidateResume: blankResume,
      roleTitle: "Software Intern",
    });

    // Should NOT contain fabricated metrics
    assert.ok(!opt.optimizedText.includes("32%"));
    assert.ok(!opt.optimizedText.includes("2.5x"));
    assert.ok(!opt.optimizedText.includes("modular microservices"));
  });

  it("PDF Exporter handles extreme unicode, emojis, and RTL characters safely", async () => {
    const unicodeResume: ResumeDocument = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        name: "José Müller-Ñoño 👨‍💻",
        headline: "Ingénieur Système & Developer 🚀 | العربية | עברית",
        summary: "Développeur spécialisé dans les systèmes distribués. 100% testé & vérifié.",
      },
    };

    const pdf = await generateVectorPdf(unicodeResume);
    assert.ok(pdf);
    const buf = Buffer.from(pdf.output("arraybuffer"));
    assert.ok(buf.length > 3000);
    assert.strictEqual(buf.subarray(0, 5).toString("ascii"), "%PDF-");
  });

  it("DOCX Exporter handles empty sections and special XML entities (&, <, >, \", ') safely", async () => {
    const specialCharsResume: ResumeDocument = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        name: "A & B <Engineering> \"Lead\" 'Consultant'",
      },
    };

    const doc = createDocxDocument(specialCharsResume);
    assert.ok(doc);
  });
});
