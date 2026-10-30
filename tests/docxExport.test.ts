import test, { describe, it } from "node:test";
import assert from "node:assert";
import { createDocxDocument } from "../src/lib/export/docxExport";
import { defaultResumeDocument } from "../src/lib/store/useResumeStore";
import { Packer, HeadingLevel } from "docx";
import JSZip from "jszip";

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

  it("should render all editable fields into word/document.xml (exp.description, proj.description, edu.highlights, profiles)", async () => {
    const sentinelResume = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        linkedin: "https://linkedin.com/in/sentinel-docx-linkedin",
        github: "https://github.com/sentinel-docx-github",
        profiles: [
          { network: "Portfolio", username: "sentinel_custom_docx", url: "https://sentinel.dev/docx-custom" },
        ],
      },
      experience: [
        {
          id: "exp-sentinel",
          company: "Sentinel DOCX Corp",
          position: "Staff Architect",
          startDate: "2023-01",
          endDate: "Present",
          current: true,
          description: "SENTINEL_DOCX_EXP_DESC: Leading platform modernization.",
          bullets: [{ id: "b1", text: "SENTINEL_DOCX_EXP_BULLET: Scaled infrastructure." }],
          technologies: ["SENTINEL_DOCX_TECH"],
        },
      ],
      projects: [
        {
          id: "proj-sentinel",
          name: "Sentinel DOCX Project",
          role: "Lead",
          description: "SENTINEL_DOCX_PROJ_DESC: Messaging system.",
          bullets: [{ id: "pb1", text: "SENTINEL_DOCX_PROJ_BULLET: 500k ops." }],
          technologies: ["SENTINEL_DOCX_PROJ_TECH"],
        },
      ],
      education: [
        {
          id: "edu-sentinel",
          institution: "Sentinel DOCX University",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startDate: "2018",
          endDate: "2022",
          current: false,
          highlights: [{ id: "h1", text: "SENTINEL_DOCX_EDU_HIGHLIGHT: Honors Thesis." }],
        },
      ],
    };

    const doc = createDocxDocument(sentinelResume);
    const buffer = await Packer.toBuffer(doc);
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file("word/document.xml")!.async("string");

    assert.ok(documentXml.includes("sentinel-docx-linkedin"), "DOCX must contain linkedin");
    assert.ok(documentXml.includes("sentinel-docx-github"), "DOCX must contain github");
    assert.ok(documentXml.includes("sentinel.dev/docx-custom"), "DOCX must contain custom profile URL");
    assert.ok(documentXml.includes("SENTINEL_DOCX_EXP_DESC"), "DOCX must contain experience description");
    assert.ok(documentXml.includes("SENTINEL_DOCX_TECH"), "DOCX must contain experience technologies");
    assert.ok(documentXml.includes("SENTINEL_DOCX_PROJ_DESC"), "DOCX must contain project description");
    assert.ok(documentXml.includes("SENTINEL_DOCX_EDU_HIGHLIGHT"), "DOCX must contain education highlights");
  });
});
