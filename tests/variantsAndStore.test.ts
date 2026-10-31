import test, { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  normalizeSectionOrder,
  ALL_SECTIONS,
  SectionId,
  ResumeLayoutSchema,
} from "../src/lib/schema/resume";
import {
  useResumeStore,
  defaultResumeDocument,
} from "../src/lib/store/useResumeStore";

describe("Layout & Section Order Normalizer", () => {
  it("should deduplicate section ids and append any missing sections", () => {
    const rawOrder: SectionId[] = ["skills", "experience", "skills", "experience"];
    const normalized = normalizeSectionOrder(rawOrder);

    // Should have all 6 sections exactly once
    assert.strictEqual(normalized.length, ALL_SECTIONS.length);
    assert.strictEqual(new Set(normalized).size, ALL_SECTIONS.length);

    // Initial order should be preserved for unique items
    assert.strictEqual(normalized[0], "skills");
    assert.strictEqual(normalized[1], "experience");
    // Missing sections (summary, projects, education, certifications) should be appended
    assert.ok(normalized.includes("summary"));
    assert.ok(normalized.includes("projects"));
    assert.ok(normalized.includes("education"));
    assert.ok(normalized.includes("certifications"));
  });

  it("should return default ALL_SECTIONS for empty or non-array inputs", () => {
    assert.deepStrictEqual(normalizeSectionOrder([]), ALL_SECTIONS);
    assert.deepStrictEqual(normalizeSectionOrder(null as unknown as SectionId[]), ALL_SECTIONS);
    assert.deepStrictEqual(normalizeSectionOrder(undefined as unknown as SectionId[]), ALL_SECTIONS);
  });

  it("should automatically normalize sectionOrder via resumeLayoutSchema transform", () => {
    const parsed = ResumeLayoutSchema.parse({
      theme: "modern",
      fontFamily: "inter",
      fontScale: 1.0,
      margins: "normal",
      autoFitOnePage: false,
      sectionOrder: ["experience", "projects"], // missing 4 sections
      sectionVisibility: {
        summary: true,
        experience: true,
        projects: true,
        skills: true,
        education: true,
        certifications: true,
      },
    });

    assert.strictEqual(parsed.sectionOrder.length, 6);
    assert.strictEqual(parsed.sectionOrder[0], "experience");
    assert.strictEqual(parsed.sectionOrder[1], "projects");
  });
});

describe("Resume Store: Variants, Hiding & JSON Backup", () => {
  beforeEach(() => {
    useResumeStore.setState({ savedVariants: [] });
    useResumeStore.getState().resetToDefault();
  });

  it("should toggle bullet and item visibility correctly", () => {
    const store = useResumeStore.getState();
    const expId = store.resume.experience[0].id;
    const bulletId = store.resume.experience[0].bullets[0].id;

    // Initially hidden is falsy or undefined
    assert.ok(!store.resume.experience[0].bullets[0].hidden);

    // Toggle bullet hidden
    store.toggleBulletHidden("experience", expId, bulletId);
    let updated = useResumeStore.getState();
    assert.strictEqual(updated.resume.experience[0].bullets[0].hidden, true);

    // Toggle bullet back to visible
    store.toggleBulletHidden("experience", expId, bulletId);
    updated = useResumeStore.getState();
    assert.strictEqual(updated.resume.experience[0].bullets[0].hidden, false);

    // Toggle item hidden
    store.toggleItemHidden("experience", expId);
    updated = useResumeStore.getState();
    assert.strictEqual(updated.resume.experience[0].hidden, true);

    store.toggleItemHidden("experience", expId);
    updated = useResumeStore.getState();
    assert.strictEqual(updated.resume.experience[0].hidden, false);
  });

  it("should save, load, and delete job variants with a max limit of 20", () => {
    const store = useResumeStore.getState();

    // Save variant
    store.saveVariant("Stripe Staff Role", "Staff Infrastructure Engineer", "Must have Go & Kafka");
    let state = useResumeStore.getState();
    assert.strictEqual(state.savedVariants.length, 1);
    assert.strictEqual(state.savedVariants[0].title, "Stripe Staff Role");
    assert.strictEqual(state.savedVariants[0].jobTitle, "Staff Infrastructure Engineer");

    const variantId = state.savedVariants[0].id;

    // Modify active resume
    store.updateBasics({ name: "Alex Modified" });
    assert.strictEqual(useResumeStore.getState().resume.basics.name, "Alex Modified");

    // Load saved variant
    store.loadVariant(variantId);
    state = useResumeStore.getState();
    assert.strictEqual(state.resume.basics.name, "Alex Morgan"); // restored original
    assert.strictEqual(state.jd.rawText, "Must have Go & Kafka");
    assert.strictEqual(state.isTailored, true);

    // Test max cap of 20 variants
    for (let i = 1; i <= 25; i++) {
      store.saveVariant(`Company Variant ${i}`, `Role ${i}`, `JD ${i}`);
    }
    state = useResumeStore.getState();
    assert.ok(state.savedVariants.length <= 20, `Expected <= 20 variants, found ${state.savedVariants.length}`);

    // Delete variant
    const toDeleteId = state.savedVariants[0].id;
    const initialCount = state.savedVariants.length;
    store.deleteVariant(toDeleteId);
    state = useResumeStore.getState();
    assert.strictEqual(state.savedVariants.length, initialCount - 1);
    assert.ok(!state.savedVariants.some((v: { id: string }) => v.id === toDeleteId));
  });

  it("should export and import complete JSON backups with roundtrip fidelity", () => {
    const store = useResumeStore.getState();
    store.saveVariant("Google SWE", "Senior SWE", "Must have C++");
    store.updateBasics({ headline: "Lead Systems Architect & Tech Lead" });

    const backupJson = store.exportBackupJson();
    assert.strictEqual(typeof backupJson, "string");
    const parsed = JSON.parse(backupJson);
    assert.ok(parsed.masterResume);
    assert.ok(parsed.resume);
    assert.ok(parsed.savedVariants);
    assert.strictEqual(parsed.resume.basics.headline, "Lead Systems Architect & Tech Lead");

    // Reset store
    store.resetToDefault();
    assert.notStrictEqual(useResumeStore.getState().resume.basics.headline, "Lead Systems Architect & Tech Lead");

    // Restore from backup
    const success = store.importBackupJson(backupJson);
    assert.strictEqual(success, true);
    assert.strictEqual(useResumeStore.getState().resume.basics.headline, "Lead Systems Architect & Tech Lead");
    assert.strictEqual(useResumeStore.getState().savedVariants.length, 1);

    // Reject invalid JSON safely
    const malformedSuccess = store.importBackupJson("invalid json string {{{");
    assert.strictEqual(malformedSuccess, false);

    const emptyObjSuccess = store.importBackupJson("{}");
    assert.strictEqual(emptyObjSuccess, false);
  });
});
