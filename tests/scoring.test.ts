import test, { describe, it } from "node:test";
import assert from "node:assert";
import { ALL_SKILLS, getSkillCategory, SKILL_TAXONOMY } from "../src/lib/scoring/skillTaxonomy";
import { normalizeSkill, getSkillAliases } from "../src/lib/scoring/aliasMap";
import { calculateJdCoverage, parseJdRequirements } from "../src/lib/scoring/deterministicScorer";
import { ResumeDocument } from "../src/lib/schema/resume";

describe("Skill Taxonomy & Catalog", () => {
  it("should contain over 400 curated skills across core disciplines", () => {
    assert.ok(ALL_SKILLS.length >= 400, `Expected >= 400 skills, found ${ALL_SKILLS.length}`);
    const categories = Object.keys(SKILL_TAXONOMY);
    assert.ok(categories.length >= 8, "Expected at least 8 engineering categories");
  });

  it("should categorize core skills correctly", () => {
    assert.strictEqual(getSkillCategory("React"), "Frontend");
    assert.strictEqual(getSkillCategory("Node.js"), "Backend");
    assert.strictEqual(getSkillCategory("PostgreSQL"), "Databases");
    assert.strictEqual(getSkillCategory("Docker"), "Cloud & DevOps");
    assert.strictEqual(getSkillCategory("PyTorch"), "AI & Machine Learning");
    assert.strictEqual(getSkillCategory("TypeScript"), "Languages");
    assert.strictEqual(getSkillCategory("Jest"), "Testing & Tooling");
    assert.strictEqual(getSkillCategory("Distributed Systems"), "System Design & Architecture");
  });

  it("should return default category for unlisted skills", () => {
    assert.strictEqual(getSkillCategory("NonExistentSkillXYZ"), "Testing & Tooling");
  });
});

describe("Alias Normalization & Bidirectional Mapping", () => {
  it("should normalize common abbreviations and acronyms to canonical names", () => {
    assert.strictEqual(normalizeSkill("JS"), "JavaScript");
    assert.strictEqual(normalizeSkill("javascript"), "JavaScript");
    assert.strictEqual(normalizeSkill("TS"), "TypeScript");
    assert.strictEqual(normalizeSkill("typescript"), "TypeScript");
    assert.strictEqual(normalizeSkill("k8s"), "Kubernetes");
    assert.strictEqual(normalizeSkill("kubernetes"), "Kubernetes");
    assert.strictEqual(normalizeSkill("postgres"), "PostgreSQL");
    assert.strictEqual(normalizeSkill("postgresql"), "PostgreSQL");
    assert.strictEqual(normalizeSkill("reactjs"), "React");
    assert.strictEqual(normalizeSkill("golang"), "Go");
    assert.strictEqual(normalizeSkill("py"), "Python");
    assert.strictEqual(normalizeSkill("python 3"), "Python");
    assert.strictEqual(normalizeSkill("csharp"), "C#");
    assert.strictEqual(normalizeSkill("c++"), "C++");
    assert.strictEqual(normalizeSkill("cpp"), "C++");
    assert.strictEqual(normalizeSkill("aws lambda"), "AWS Lambda");
  });

  it("should return all alias variations for canonical skills", () => {
    const k8sAliases = getSkillAliases("Kubernetes");
    assert.ok(k8sAliases.includes("k8s"));
    assert.ok(k8sAliases.includes("kubernetes"));

    const jsAliases = getSkillAliases("JavaScript");
    assert.ok(jsAliases.includes("js"));
    assert.ok(jsAliases.includes("javascript"));
    assert.ok(jsAliases.includes("es6"));
  });

  it("should handle edge cases and unknown skills gracefully", () => {
    assert.strictEqual(normalizeSkill(""), "");
    assert.strictEqual(normalizeSkill("   "), "");
    assert.strictEqual(normalizeSkill("unknown-custom-lib-1234"), "unknown-custom-lib-1234");
  });
});

describe("Deterministic JD Parser", () => {
  it("should parse must-have and preferred requirements by section headings", () => {
    const jdText = `
Job Title: Staff Infrastructure Engineer

Responsibilities:
- Build high throughput services with Go and Kafka.

Requirements:
- 5+ years experience with Kubernetes and Docker
- Deep expertise in PostgreSQL and Redis

Preferred Qualifications:
- Experience with GraphQL and Terraform
- Familiarity with Next.js
    `;

    const parsed = parseJdRequirements(jdText);
    assert.ok(parsed.length > 0);

    const k8s = parsed.find((p) => p.skill === "Kubernetes");
    assert.ok(k8s, "Kubernetes should be detected");
    assert.strictEqual(k8s?.tier, "must-have");
    assert.strictEqual(k8s?.weight, 3.0);

    const postgres = parsed.find((p) => p.skill === "PostgreSQL");
    assert.ok(postgres, "PostgreSQL should be detected");
    assert.strictEqual(postgres?.tier, "must-have");

    const graphql = parsed.find((p) => p.skill === "GraphQL");
    assert.ok(graphql, "GraphQL should be detected");
    assert.strictEqual(graphql?.tier, "preferred");
    assert.strictEqual(graphql?.weight, 1.5);
  });

  it("should return empty array for empty JD input", () => {
    const parsed = parseJdRequirements("");
    assert.strictEqual(parsed.length, 0);
  });

  it("should not match sub-phrase Spring Framework when JD specifies Spring Boot", () => {
    const parsed = parseJdRequirements("Requirements:\n- 3+ years of Spring Boot experience.");
    const skills = parsed.map((p) => p.skill);
    assert.ok(skills.includes("Spring Boot"), "Spring Boot should be detected");
    assert.ok(!skills.includes("Spring Framework"), "Spring Framework must not be falsely detected on Spring Boot");
  });

  it("should match both compound skill and subsequent standalone skill on the same line", () => {
    const parsed = parseJdRequirements("Requirements:\n- Deep experience with Redux Toolkit and Redux state management.");
    const skills = parsed.map((p) => p.skill);
    assert.ok(skills.includes("Redux Toolkit"), "Redux Toolkit should be detected");
    assert.ok(skills.includes("Redux"), "Standalone Redux should also be detected on the same line");
  });

  it("should not match Next.js for plain English phrase 'next generation platform'", () => {
    const parsed = parseJdRequirements("Responsibilities:\n- Build the next generation platform for global payments.");
    const skills = parsed.map((p) => p.skill);
    assert.ok(!skills.includes("Next.js"), "Next.js must not be falsely detected on 'next generation'");
  });
});

describe("Weighted Evidence Calculation & Scoring Engine", () => {
  const minimalResume: ResumeDocument = {
    id: "test-resume-1",
    title: "Test Profile",
    basics: {
      name: "Jordan Lee",
      headline: "Full Stack Engineer",
      email: "jordan@example.com",
      phone: "555-0100",
      location: "New York, NY",
      summary: "Passionate engineer with experience in cloud native systems.",
      profiles: [],
    },
    experience: [
      {
        id: "exp-1",
        company: "Alpha Corp",
        position: "Senior Engineer",
        startDate: "2020-01",
        endDate: "Present",
        current: true,
        bullets: [
          { id: "b1", text: "Architected microservices using React and TypeScript on AWS." },
        ],
        technologies: ["React", "TypeScript", "AWS"],
      },
    ],
    projects: [],
    education: [],
    skills: [
      {
        id: "sk-1",
        category: "Databases",
        skills: ["PostgreSQL", "Redis"],
      },
    ],
    certifications: [],
    layout: {
      theme: "modern",
      fontFamily: "inter",
      fontScale: 1.0,
      margins: "normal",
      autoFitOnePage: false,
      sectionOrder: ["summary", "experience", "skills"],
      sectionVisibility: {
        summary: true,
        experience: true,
        projects: true,
        skills: true,
        education: true,
        certifications: true,
      },
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("should award 1.0 credit for skills proven in experience bullets", () => {
    const jd = "Requirements:\n- Must have React and TypeScript experience.";
    const report = calculateJdCoverage(minimalResume, jd);

    const reactMatch = report.matchedKeywords.find((m) => m.skill === "React");
    assert.ok(reactMatch, "React should be matched");
    assert.strictEqual(reactMatch?.credit, 1.0);
    assert.strictEqual(reactMatch?.evidenceType, "bullet");
    assert.ok(reactMatch?.evidenceSnippet?.includes("Architected microservices"));

    const tsMatch = report.matchedKeywords.find((m) => m.skill === "TypeScript");
    assert.ok(tsMatch, "TypeScript should be matched");
    assert.strictEqual(tsMatch?.credit, 1.0);
    assert.strictEqual(tsMatch?.evidenceType, "bullet");

    assert.strictEqual(report.overallScore, 100);
    assert.strictEqual(report.bulletEvidenceScore, 100);
  });

  it("should award 0.6 credit for skills only listed in skills section", () => {
    const jd = "Requirements:\n- Must have PostgreSQL and Redis experience.";
    const report = calculateJdCoverage(minimalResume, jd);

    const pgMatch = report.matchedKeywords.find((m) => m.skill === "PostgreSQL");
    assert.ok(pgMatch, "PostgreSQL should be matched");
    assert.strictEqual(pgMatch?.credit, 0.6);
    assert.strictEqual(pgMatch?.evidenceType, "skills_list");

    const redisMatch = report.matchedKeywords.find((m) => m.skill === "Redis");
    assert.ok(redisMatch, "Redis should be matched");
    assert.strictEqual(redisMatch?.credit, 0.6);
    assert.strictEqual(redisMatch?.evidenceType, "skills_list");

    // Both skills have 0.6 credit with weight 3.0 -> overall score should be 60%
    assert.strictEqual(report.overallScore, 60);
    assert.strictEqual(report.bulletEvidenceScore, 0);
  });

  it("should calculate composite score with mixed evidence: 1.0 (bullets), 0.6 (skills list), and 0.0 (missing)", () => {
    // 1 bullet match (React, weight 3.0 * 1.0 = 3.0)
    // 1 skills list match (PostgreSQL, weight 3.0 * 0.6 = 1.8)
    // 1 missing skill (Kubernetes, weight 3.0 * 0.0 = 0.0)
    // Total weight = 9.0. Achieved weight = 4.8. Score = 4.8 / 9.0 * 100 = 53%
    const jd = "Requirements:\n- React\n- PostgreSQL\n- Kubernetes";
    const report = calculateJdCoverage(minimalResume, jd);

    assert.strictEqual(report.totalRequiredKeywords, 3);
    assert.strictEqual(report.matchedCount, 2);
    assert.strictEqual(report.missingCount, 1);

    const missingK8s = report.missingKeywords.find((m) => m.skill === "Kubernetes");
    assert.ok(missingK8s, "Kubernetes should be flagged as missing");
    assert.strictEqual(missingK8s?.credit, 0);

    assert.strictEqual(report.overallScore, 53);
    assert.strictEqual(report.bulletEvidenceScore, 50); // 1 of 2 matched is in bullets = 50%
  });

  it("should handle empty JD safely returning zero baseline", () => {
    const report = calculateJdCoverage(minimalResume, "");
    assert.strictEqual(report.overallScore, 0);
    assert.strictEqual(report.totalRequiredKeywords, 0);
    assert.strictEqual(report.matchedKeywords.length, 0);
    assert.strictEqual(report.missingKeywords.length, 0);
  });
});
