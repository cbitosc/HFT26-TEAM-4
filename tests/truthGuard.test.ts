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
import { optimizeSingleBullet } from "../src/lib/ai/singleBulletOptimizer";
import { generateHeuristicTailor } from "../src/lib/ai/heuristicTailor";
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

    it("should prevent substring false-positives for skills (JavaScript does not validate Java)", () => {
      // groundedProfile has JavaScript / TypeScript, but NOT standalone Java
      const javaClaim = "Engineered enterprise backend microservices with Java and Spring Boot.";
      const result = validateTextAgainstProfile(groundedProfile, javaClaim);

      assert.strictEqual(result.truthStatus, "needs_confirmation");
      assert.ok(
        result.unverifiedClaims.some((claim) => claim.includes("Java")),
        `Expected claim mentioning Java, got: ${JSON.stringify(result.unverifiedClaims)}`
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

    it("should detect metric sign flips and decimal precision alterations against original bullet", () => {
      // Original bullet has 95ms
      const alteredPrecision = "Spearheaded migration cutting latency to 95.5ms for active tenants.";
      const resPrecision = validateTextAgainstProfile(
        groundedProfile,
        alteredPrecision,
        "Spearheaded migration cutting latency to 95ms for active tenants."
      );
      assert.strictEqual(resPrecision.truthStatus, "needs_confirmation");
      assert.ok(
        resPrecision.unverifiedClaims.some((c) => c.includes("95.5ms") || c.includes("precision") || c.includes("altered")),
        `Expected altered precision claim, got: ${JSON.stringify(resPrecision.unverifiedClaims)}`
      );

      // Sign flip test: original has +28% or 28%, suggested has -28%
      const flippedSign = "Optimized complex PostgreSQL analytical queries, decreasing spend by -28%.";
      const resSign = validateTextAgainstProfile(
        groundedProfile,
        flippedSign,
        "Optimized complex PostgreSQL analytical queries, decreasing spend by 28%."
      );
      assert.strictEqual(resSign.truthStatus, "needs_confirmation");
      assert.ok(
        resSign.unverifiedClaims.some((c) => c.includes("-28%") || c.includes("sign") || c.includes("altered")),
        `Expected sign flip claim, got: ${JSON.stringify(resSign.unverifiedClaims)}`
      );
    });

    it("should flag bullets exceeding 180 character limit for clean single-line ATS formatting", () => {
      const longBullet =
        "Spearheaded enterprise cloud platform modernization utilizing TypeScript, React, Next.js, PostgreSQL, Docker, AWS ECS, Redis, WebSockets, and CI/CD pipelines to dramatically scale operations worldwide.";
      assert.ok(longBullet.length > 180, `Expected bullet > 180 chars, got ${longBullet.length}`);

      const result = validateTextAgainstProfile(groundedProfile, longBullet);
      assert.ok(
        result.unverifiedClaims.some((c) => c.includes("180 chars")),
        `Expected ATS 180 char warning, got: ${JSON.stringify(result.unverifiedClaims)}`
      );
    });
  });

  describe("validateSuggestion & validateSummary helper methods", () => {
    it("should validate and populate truth status on a TailoredSuggestion", () => {
      const suggestion: TailoredSuggestion = {
        id: "sug-1",
        section: "experience",
        bulletId: "b-1",
        originalText: "Spearheaded migration of legacy REST API to Next.js App Router.",
        suggestedText: "Managed Kubernetes clusters cutting latency to 95ms.",
        targetKeywords: ["Kubernetes"],
        explanation: "Added Kubernetes for JD match",
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

    it("should prevent cross-role metric and tool transfer (Codex Finding 1 reproduction)", () => {
      const multiRoleProfile: ResumeDocument = {
        ...groundedProfile,
        experience: [
          {
            id: "exp-cloud",
            company: "Apex Cloud Technologies",
            position: "Senior Cloud Engineer",
            startDate: "2022-01",
            endDate: "Present",
            current: true,
            bullets: [
              {
                id: "b-cloud-1",
                text: "Reduced API latency by 42% on AWS infrastructure.",
              },
            ],
            technologies: ["AWS", "Docker"],
          },
          {
            id: "exp-docs",
            company: "Acme Logistics",
            position: "Documentation Specialist",
            startDate: "2020-01",
            endDate: "2021-12",
            current: false,
            bullets: [
              {
                id: "b-docs-1",
                text: "Authored deployment guides and internal developer documentation.",
              },
            ],
            technologies: ["Markdown"],
          },
        ],
      };

      // Rewriting the documentation bullet with claims transplanted from the cloud role:
      const transplantedSuggestion: TailoredSuggestion = {
        id: "sugg-transplant",
        section: "experience",
        itemId: "exp-docs",
        bulletId: "b-docs-1",
        originalText: "Authored deployment guides and internal developer documentation.",
        suggestedText: "Reduced cloud spend by 42% using AWS.",
        targetKeywords: ["AWS"],
        explanation: "Attempting to claim AWS and 42% metric from another role",
        truthStatus: "verified",
        unverifiedClaims: [],
      };

      const validated = validateSuggestion(multiRoleProfile, transplantedSuggestion);

      assert.strictEqual(
        validated.truthStatus,
        "needs_confirmation",
        "Transplanted metrics or tools from another role must require confirmation"
      );
      assert.ok(
        validated.unverifiedClaims.some((c) => c.includes("42%")),
        `Expected claim flagging 42% metric, got: ${JSON.stringify(validated.unverifiedClaims)}`
      );
      assert.ok(
        validated.unverifiedClaims.some((c) => c.includes("AWS")),
        `Expected claim flagging AWS tool not in Acme Logistics, got: ${JSON.stringify(validated.unverifiedClaims)}`
      );

      // Legitimate rewrite for the cloud role preserving its own grounded 42% and AWS:
      const legitimateSuggestion: TailoredSuggestion = {
        id: "sugg-legit",
        section: "experience",
        itemId: "exp-cloud",
        bulletId: "b-cloud-1",
        originalText: "Reduced API latency by 42% on AWS infrastructure.",
        suggestedText: "Architected cloud services reducing API latency by 42% on AWS.",
        targetKeywords: ["AWS"],
        explanation: "Action verb upgrade preserving grounded metrics and tools",
        truthStatus: "verified",
        unverifiedClaims: [],
      };

      const validatedLegit = validateSuggestion(multiRoleProfile, legitimateSuggestion);
      assert.strictEqual(validatedLegit.truthStatus, "verified");
      assert.strictEqual(validatedLegit.unverifiedClaims.length, 0);
    });
  });

  describe("Anti-Hallucination: Qualitative Grounding (Architecture, Testing, Reliability)", () => {
    const minimalProfile: ResumeDocument = {
      ...groundedProfile,
      basics: {
        ...groundedProfile.basics,
        headline: "Operations Associate",
        summary: "",
      },
      experience: [
        {
          id: "exp-min",
          company: "Acme Logistics",
          position: "Operations Associate",
          startDate: "2023-01",
          endDate: "2024-01",
          current: false,
          bullets: [{ id: "b-min", text: "Filed weekly paperwork." }],
          technologies: [],
        },
      ],
      projects: [],
      skills: [],
    };

    it("should flag unsupported qualitative claims as needs_confirmation", () => {
      const unsupportedText = "Architected dashboard improving system reliability, test coverage, and structured reviews.";
      const result = validateTextAgainstProfile(minimalProfile, unsupportedText);

      assert.strictEqual(result.truthStatus, "needs_confirmation");
      assert.ok(result.unverifiedClaims.length >= 2, "Should flag unsupported qualitative claims");
      assert.ok(result.unverifiedClaims.some((c) => c.includes("architecture")));
      assert.ok(result.unverifiedClaims.some((c) => c.includes("test coverage") || c.includes("testing")));
      assert.ok(result.unverifiedClaims.some((c) => c.includes("reliability")));
      assert.ok(result.unverifiedClaims.some((c) => c.includes("reviews")));
    });

    it("should produce grounded XYZ bullet without fabricating metrics or unverified reliability", () => {
      const opt = optimizeSingleBullet({
        bulletText: "Built a dashboard",
        roleTitle: "Operations Associate",
        roleTechnologies: [],
        candidateResume: minimalProfile,
        jdRequirements: "Looking for an engineer to build operational dashboards.",
      });

      assert.strictEqual(opt.truthStatus, "verified");
      assert.strictEqual(opt.unverifiedClaims.length, 0);
      assert.ok(!opt.optimizedText.includes("32%"));
      assert.ok(!opt.optimizedText.includes("2.5x"));
      assert.ok(!opt.optimizedText.includes("microservices"));
      assert.ok(!opt.optimizedText.includes("telemetry"));
      assert.ok(!opt.optimizedText.includes("resilient architectures"));
    });

    it("should not claim proven track record or resilient architectures for blank-summary entry profile", () => {
      const blankProfileWithSkills: ResumeDocument = {
        ...minimalProfile,
        experience: [],
        skills: [
          {
            id: "sk-1",
            category: "Frontend",
            skills: ["React", "TypeScript"],
          },
        ],
      };

      const tailored = generateHeuristicTailor(
        blankProfileWithSkills,
        "Frontend Engineer position requiring React and TypeScript."
      );

      assert.ok(tailored.summaryComparison, "summaryComparison should be generated");
      assert.strictEqual(tailored.summaryComparison!.truthStatus, "verified");
      assert.strictEqual(tailored.summaryComparison!.unverifiedClaims.length, 0);
      assert.ok(!tailored.summaryComparison!.suggested.includes("proven track record"));
      assert.ok(!tailored.summaryComparison!.suggested.includes("resilient architectures"));
      assert.ok(tailored.summaryComparison!.suggested.includes("React"));
      assert.ok(tailored.summaryComparison!.suggested.includes("TypeScript"));
    });
  });
});
