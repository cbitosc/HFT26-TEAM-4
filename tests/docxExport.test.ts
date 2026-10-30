import test, { describe, it } from "node:test";
import assert from "node:assert";
import { createDocxDocument } from "../src/lib/export/docxExport";
import { defaultResumeDocument } from "../src/lib/store/useResumeStore";
import { Packer, HeadingLevel } from "docx";

describe("Native OpenXML DOCX Exporter", () => {
  it("should compile ResumeDocument into a valid docx Document instance", () => {
    const doc = createDocxDocument(defaultResumeDocument);
    assert.ok(doc, "Document instance should be created");
  });

  it("should generate a non-empty OpenXML binary buffer with Packer", async () => {
    const doc = createDocxDocument(defaultResumeDocument);
    const buffer = await Packer.toBuffer(doc);
    assert.ok(buffer, "Buffer should be generated");
    assert.ok(buffer.length > 5000, `Buffer length (${buffer.length}) should be > 5000 bytes`);

    // First two bytes of a ZIP / OpenXML .docx container are always PK (0x50, 0x4b)
    assert.strictEqual(buffer[0], 0x50);
    assert.strictEqual(buffer[1], 0x4b);
  });

  it("should handle executive and tech themes with appropriate formatting", async () => {
    const executiveResume = {
      ...defaultResumeDocument,
      layout: {
        ...defaultResumeDocument.layout,
        theme: "executive-ivy" as const,
        fontFamily: "garamond" as const,
        margins: "spacious" as const,
      },
    };
    const execDoc = createDocxDocument(executiveResume);
    const execBuffer = await Packer.toBuffer(execDoc);
    assert.ok(execBuffer.length > 5000);

    const techResume = {
      ...defaultResumeDocument,
      layout: {
        ...defaultResumeDocument.layout,
        theme: "tech-clean" as const,
        fontFamily: "roboto" as const,
        margins: "compact" as const,
        autoFitOnePage: true,
      },
    };
    const techDoc = createDocxDocument(techResume);
    const techBuffer = await Packer.toBuffer(techDoc);
    assert.ok(techBuffer.length > 5000);
  });

  it("should handle minimal resume with empty sections without throwing", async () => {
    const emptyResume = {
      ...defaultResumeDocument,
      experience: [],
      projects: [],
      skills: [],
      education: [],
      certifications: [],
    };
    const doc = createDocxDocument(emptyResume);
    const buffer = await Packer.toBuffer(doc);
    assert.ok(buffer.length > 2000);
  });
});
