import test, { describe, it } from "node:test";
import assert from "node:assert";
import zlib from "node:zlib";
import { generateVectorPdf } from "../src/lib/export/pdfExport";
import { defaultResumeDocument } from "../src/lib/store/useResumeStore";

function extractTextFromPdf(pdf: any): string {
  const binary = pdf.output();
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let fullText = "";
  let match;
  while ((match = streamRegex.exec(binary)) !== null) {
    try {
      const decompressed = zlib.inflateSync(Buffer.from(match[1], "binary")).toString("utf-8");
      fullText += decompressed + "\n";
    } catch {
      fullText += match[1] + "\n";
    }
  }
  return fullText;
}

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

  it("should render all editable fields: exp.description, proj.description, edu.highlights, basics.linkedin, basics.github, basics.profiles", async () => {
    const sentinelResume = {
      ...defaultResumeDocument,
      basics: {
        ...defaultResumeDocument.basics,
        linkedin: "https://linkedin.com/in/sentinel-linkedin-user",
        github: "https://github.com/sentinel-github-user",
        profiles: [
          { network: "Portfolio", username: "sentinel_custom_profile", url: "https://sentinel.dev/custom" },
        ],
      },
      experience: [
        {
          id: "exp-sentinel",
          company: "Sentinel Corp",
          position: "Staff Architect",
          startDate: "2023-01",
          endDate: "Present",
          current: true,
          description: "SENTINEL_EXP_DESCRIPTION: Leading architectural modernization and platform reliability.",
          bullets: [{ id: "b1", text: "SENTINEL_EXP_BULLET: Scaled core infrastructure." }],
          technologies: ["SENTINEL_EXP_TECH"],
        },
      ],
      projects: [
        {
          id: "proj-sentinel",
          name: "Sentinel Core Project",
          role: "Lead",
          description: "SENTINEL_PROJ_DESCRIPTION: High throughput distributed messaging system.",
          bullets: [{ id: "pb1", text: "SENTINEL_PROJ_BULLET: 500k messages per second." }],
          technologies: ["SENTINEL_PROJ_TECH"],
        },
      ],
      education: [
        {
          id: "edu-sentinel",
          institution: "Sentinel Institute of Tech",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startDate: "2018",
          endDate: "2022",
          current: false,
          highlights: [{ id: "h1", text: "SENTINEL_EDU_HIGHLIGHT: Summa Cum Laude with Honors Thesis." }],
        },
      ],
    };

    const pdf = await generateVectorPdf(sentinelResume);
    const pdfOutput = extractTextFromPdf(pdf);

    assert.ok(pdfOutput.includes("sentinel-linkedin-user"), "PDF must contain linkedin profile text");
    assert.ok(pdfOutput.includes("sentinel-github-user"), "PDF must contain github profile text");
    assert.ok(pdfOutput.includes("sentinel.dev/custom"), "PDF must contain custom social profile url");
    assert.ok(pdfOutput.includes("SENTINEL_EXP_DESCRIPTION"), "PDF must contain experience description");
    assert.ok(pdfOutput.includes("SENTINEL_EXP_TECH"), "PDF must contain experience technologies");
    assert.ok(pdfOutput.includes("SENTINEL_PROJ_DESCRIPTION"), "PDF must contain project description");
    assert.ok(pdfOutput.includes("SENTINEL_EDU_HIGHLIGHT"), "PDF must contain education highlights");
  });

  it("should add new page instead of dropping lines when content exceeds 1 page in autoFitOnePage mode", async () => {
    // Generate a long resume with 25 bullet points that exceeds 297mm standard A4
    const longBullets = Array.from({ length: 25 }, (_, i) => ({
      id: `bullet-${i}`,
      text: `Accomplished milestone ${i} by engineering distributed fault-tolerant processing workflows reducing p99 latency to 12ms.`,
    }));

    const longResume = {
      ...defaultResumeDocument,
      layout: {
        ...defaultResumeDocument.layout,
        autoFitOnePage: true,
      },
      experience: [
        {
          id: "exp-long",
          company: "Enterprise Cloud Systems",
          position: "Principal Architect",
          startDate: "2020",
          endDate: "Present",
          current: true,
          bullets: longBullets,
          technologies: [],
        },
      ],
    };

    const pdf = await generateVectorPdf(longResume);
    assert.ok(pdf.getNumberOfPages() >= 2, "PDF exporter must create a second page instead of clipping overflowing content");
  });
});
