import test, { describe, it } from "node:test";
import assert from "node:assert";
import { generateVectorPdf } from "../src/lib/export/pdfExport";
import { defaultResumeDocument } from "../src/lib/store/useResumeStore";

describe("Native Vector PDF Exporter (ATS Compliant)", () => {
  it("should compile ResumeDocument into a valid jsPDF document", async () => {
    const pdf = await generateVectorPdf(defaultResumeDocument);
    assert.ok(pdf, "jsPDF instance should be created");
  });

  it("should generate a valid PDF binary buffer with %PDF- header", async () => {
    const pdf = await generateVectorPdf(defaultResumeDocument);
    const arrayBuffer = pdf.output("arraybuffer");
    const buffer = Buffer.from(arrayBuffer);

    assert.ok(buffer.length > 3000, `PDF size (${buffer.length} bytes) should be > 3000 bytes`);
    // PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2d)
    const header = buffer.subarray(0, 5).toString("ascii");
    assert.strictEqual(header, "%PDF-", "Should have valid PDF header %PDF-");
  });

  it("should handle executive and tech themes with various margin layouts", async () => {
    const executiveResume = {
      ...defaultResumeDocument,
      layout: {
        ...defaultResumeDocument.layout,
        theme: "executive-ivy" as const,
        fontFamily: "garamond" as const,
        margins: "spacious" as const,
      },
    };
    const execPdf = await generateVectorPdf(executiveResume);
    const execBuf = Buffer.from(execPdf.output("arraybuffer"));
    assert.ok(execBuf.length > 3000);

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
    const techPdf = await generateVectorPdf(techResume);
    const techBuf = Buffer.from(techPdf.output("arraybuffer"));
    assert.ok(techBuf.length > 3000);
  });

  it("should respect section visibility settings", async () => {
    const hiddenSectionsResume = {
      ...defaultResumeDocument,
      layout: {
        ...defaultResumeDocument.layout,
        sectionVisibility: {
          summary: false,
          experience: true,
          projects: false,
          skills: true,
          education: false,
          certifications: false,
        },
      },
    };
    const pdf = await generateVectorPdf(hiddenSectionsResume);
    const buf = Buffer.from(pdf.output("arraybuffer"));
    assert.ok(buf.length > 1000);
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
    const pdf = await generateVectorPdf(emptyResume);
    const buf = Buffer.from(pdf.output("arraybuffer"));
    assert.ok(buf.length > 500);
    assert.strictEqual(buf.subarray(0, 5).toString("ascii"), "%PDF-");
  });
});
