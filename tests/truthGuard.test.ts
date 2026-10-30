import test, { describe, it } from "node:test";
import assert from "node:assert";
import {
  extractProfileGroundedFacts,
  extractToolsFromText,
  extractMetricsFromText,
  validateTextAgainstProfile,
  validateSuggestion,
  validateSummary,
} from "../src/lib/ai/truthGuard";
import { ResumeDocument } from "../src/lib/schema/resume";
import { TailoredSuggestion } from "../src/lib/ai/aiTypes";

describe("Deterministic Truth Guard Engine", () => {
  const groundedProfile: ResumeDocument = {
    id: "alex-morgan-test",
    title: "Senior Full-Stack Engineer Profile",
    basics: {
      name: "Alex Morgan",
      headline: "Senior Full-Stack Engineer | Distributed Systems & React Architecture",
      email: "alex.morgan@example.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      summary:
        "Full-Stack Engineer with 7+ years of experience architecting high-throughput distributed web systems. Cut p95 response latency from 320ms to 95ms and scaled SaaS platforms from 10k to 500k DAU using Next.js, Node.js, TypeScript, PostgreSQL, and AWS.",
      profiles: [],
    },
    experience: [
      {
        id: "exp-1",
        company: "Apex Cloud Technologies",
        position: "Senior Full-Stack Engineer",
        startDate: "2022-03",
        endDate: "Present",
        current: true,
        bullets: [
          {
            id: "b-1",
            text: "Spearheaded migration of legacy REST API to Next.js App Router, cutting p95 response latency from 320ms to 95ms for 450k active tenants.",
          },
          {
            id: "b-2",
            text: "Engineered real-time collaboration canvas using WebSockets and Redis Pub/Sub, boosting multi-user concurrent session capacity by 3.5x with zero dropped frames.",
          },
          {
            id: "b-3",
            text: "Architected automated CI/CD deployment pipelines on AWS ECS & Docker, shrinking release cycle time from 45 minutes to 6 minutes while enforcing 94% test coverage.",
          },
        ],
        technologies: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS ECS"],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "HyperGraph Engine",
        description: "High-performance in-memory graph query engine with WebAssembly acceleration.",
        role: "Creator",
        bullets: [
          {
            id: "pb-1",
            text: "Designed in-memory indexing algorithms in TypeScript and Rust, achieving 400k query operations per second.",
          },
        ],
        technologies: ["TypeScript", "Rust", "WebAssembly"],
      },
    ],
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
      sectionOrder: ["summary", "experience", "projects", "skills"],
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

  it("should extract grounded tools, numbers, and exact metrics from the master profile", () => {
    const facts = extractProfileGroundedFacts(groundedProfile);

    // Tools grounded in profile
    assert.ok(facts.tools.has("react"), "React should be in grounded tools");
    assert.ok(facts.tools.has("typescript"), "TypeScript should be in grounded tools");
    assert.ok(facts.tools.has("postgresql"), "PostgreSQL should be in grounded tools");
    assert.ok(facts.tools.has("docker"), "Docker should be in grounded tools");
    assert.ok(facts.tools.has("rust"), "Rust should be in grounded tools");

    // Metrics grounded in profile
    assert.ok(facts.metricsExact.has("95ms"), "95ms should be grounded");
    assert.ok(facts.metricsExact.has("320ms"), "320ms should be grounded");
    assert.ok(facts.metricsExact.has("3.5x"), "3.5x should be grounded");
    assert.ok(facts.metricsExact.has("94%"), "94% should be grounded");
    assert.ok(facts.metricsExact.has("450k"), "450k should be grounded");

    // Tools NOT in profile
    assert.strictEqual(facts.tools.has("kubernetes"), false);
    assert.strictEqual(facts.tools.has("solidity"), false);
    assert.strictEqual(facts.tools.has("ruby on rails"), false);
  });

  describe("Anti-Hallucination: Tool & Skill Verification", () => {
    it("should verify grounded tools mentioned in candidate profile", () => {
      const groundedText = "Architected deployment pipelines using React, TypeScript, and Docker.";
      const result = validateTextAgainstProfile(groundedProfile, groundedText);

      assert.strictEqual(result.truthStatus, "verified");
      assert.strictEqual(result.unverifiedClaims.length, 0);
      assert.ok(result.detectedTools.includes("React"));
      assert.ok(result.detectedTools.includes("TypeScript"));
      assert.ok(result.detectedTools.includes("Docker"));
    });

    it("should accept canonical aliases of grounded tools (e.g. Postgres for PostgreSQL)", () => {
      const textWithAlias = "Maintained databases using Postgres and Redis.";
      const result = validateTextAgainstProfile(groundedProfile, textWithAlias);

      assert.strictEqual(result.truthStatus, "verified");
      assert.strictEqual(result.unverifiedClaims.length, 0);
    });

    it("should flag ungrounded tools that do not exist in the candidate profile", () => {
      const hallucinatedToolText = "Deployed distributed workloads to Kubernetes clusters using Helm charts.";
      const result = validateTextAgainstProfile(groundedProfile, hallucinatedToolText);

      assert.strictEqual(result.truthStatus, "needs_confirmation");
      assert.ok(result.unverifiedClaims.length > 0);
      assert.ok(
        result.unverifiedClaims.some((claim) => claim.includes("Kubernetes")),
        `Expected claim mentioning Kubernetes, got: ${JSON.stringify(result.unverifiedClaims)}`
      );
    });
  });

  describe("Anti-Hallucination: Metric & Number Verification", () => {
    it("should verify genuine grounded metrics from the candidate profile", () => {
      const genuineMetricText = "Reduced p95 API latency to 95ms while increasing concurrent capacity by 3.5x.";
      const result = validateTextAgainstProfile(groundedProfile, genuineMetricText);

      assert.strictEqual(result.truthStatus, "verified");
      assert.strictEqual(result.unverifiedClaims.length, 0);
      assert.ok(result.detectedMetrics.includes("95ms"));
      assert.ok(result.detectedMetrics.includes("3.5x"));
    });

    it("should flag fabricated metrics and dollar values not in the candidate profile", () => {
      const fabricatedMetricText = "Drove $5M in enterprise annual recurring revenue by boosting uptime to 99.99%.";
      const result = validateTextAgainstProfile(groundedProfile, fabricatedMetricText);

      assert.strictEqual(result.truthStatus, "needs_confirmation");
      assert.ok(
        result.unverifiedClaims.some((claim) => claim.includes("$5M") || claim.includes("5M")),
        `Expected claim mentioning $5M, got: ${JSON.stringify(result.unverifiedClaims)}`
      );
      assert.ok(
        result.unverifiedClaims.some((claim) => claim.includes("99.99%")),
        `Expected claim mentioning 99.99%, got: ${JSON.stringify(result.unverifiedClaims)}`
      );
    });

    it("should flag both unverified tools and fabricated metrics simultaneously", () => {
      const mixedText = "Led migration to Kubernetes generating $10M cost savings with 99.99% reliability.";
      const result = validateTextAgainstProfile(groundedProfile, mixedText);

      assert.strictEqual(result.truthStatus, "needs_confirmation");
      assert.ok(result.unverifiedClaims.length >= 2, "Expected at least 2 unverified claims");
      assert.ok(result.unverifiedClaims.some((c) => c.includes("Kubernetes")));
      assert.ok(result.unverifiedClaims.some((c) => c.includes("$10M") || c.includes("10M")));
    });
  });

  describe("validateSuggestion & validateSummary helper methods", () => {
    it("should validate and populate truth status on a TailoredSuggestion", () => {
      const suggestion: TailoredSuggestion = {
        bulletId: "b-1",
        originalText: "Spearheaded migration of legacy REST API to Next.js App Router.",
        suggestedText: "Managed Kubernetes clusters cutting latency to 95ms.",
        keywordsAdded: ["Kubernetes"],
        rationale: "Added Kubernetes for JD match",
        truthStatus: "verified",
        unverifiedClaims: [],
      };

      const validated = validateSuggestion(groundedProfile, suggestion);
      assert.strictEqual(validated.truthStatus, "needs_confirmation");
      assert.ok(validated.unverifiedClaims.length > 0);
      assert.ok(validated.unverifiedClaims[0].includes("Kubernetes"));
    });

    it("should validate and populate truth status on summary comparison", () => {
      const summaryResult = validateSummary(
        groundedProfile,
        groundedProfile.basics.summary,
        "Senior Leader driving $20M ARR using Apache Kafka and Kubernetes across global teams.",
        "Highlighting enterprise scale"
      );

      assert.strictEqual(summaryResult.truthStatus, "needs_confirmation");
      assert.ok(summaryResult.unverifiedClaims.length > 0);
      assert.ok(summaryResult.unverifiedClaims.some((c) => c.includes("Kubernetes")));
      assert.ok(summaryResult.unverifiedClaims.some((c) => c.includes("$20M") || c.includes("20M")));
    });
  });
});
