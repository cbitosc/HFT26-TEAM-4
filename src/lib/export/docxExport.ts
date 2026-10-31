import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  TabStopType,
  TabStopPosition,
  BorderStyle,
  AlignmentType,
} from "docx";
import { ResumeDocument, SectionId, normalizeSectionOrder } from "../schema/resume";

/**
 * Creates an OpenXML Document model from a ResumeDocument
 * conforming to ATS-parsing standards with native headings,
 * genuine bullet points, tab stops, and clean section borders.
 */
export function createDocxDocument(resume: ResumeDocument): Document {
  const { basics, experience, projects, skills, education, certifications, layout } = resume;
  const { theme, fontFamily, fontScale = 1.0, margins = "normal", autoFitOnePage = false, sectionOrder, sectionVisibility } = layout;

  // Theming & palette configuration
  const isExecutive = theme === "executive" || theme === "executive-ivy";
  const isTech = theme === "tech" || theme === "tech-clean";

  const accentColorHex = isExecutive ? "1E293B" : isTech ? "1D4ED8" : "059669";
  const headerAlignment = isExecutive ? AlignmentType.CENTER : AlignmentType.LEFT;

  // Font family mapping for Word
  const fontName = fontFamily === "garamond" ? "Garamond" : fontFamily === "roboto" ? "Calibri" : "Arial";

  // Margins in twips/dxa (1 in = 1440 dxa, 0.75 in = 1080 dxa, 0.5 in = 720 dxa)
  const marginDxa = margins === "compact" || autoFitOnePage ? 720 : margins === "spacious" ? 1440 : 1080;

  // Base font sizing scaled by user preference (half-points: 20 = 10pt)
  const baseFontSize = Math.max(16, Math.min(24, Math.round(20 * fontScale)));
  const titleFontSize = Math.max(26, Math.round(32 * fontScale));
  const headingFontSize = Math.max(20, Math.round(24 * fontScale));
  const subHeadingFontSize = Math.max(18, Math.round(21 * fontScale));
  const metaFontSize = Math.max(16, Math.round(18 * fontScale));

  const sectionGap = autoFitOnePage ? 100 : 160;
  const itemGap = autoFitOnePage ? 60 : 100;
  const bulletGap = autoFitOnePage ? 30 : 50;

  const children: Paragraph[] = [];

  // ==========================================
  // 1. CANDIDATE HEADER (HeadingLevel.HEADING_1)
  // ==========================================
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: headerAlignment,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: basics.name || "Candidate Name",
          bold: true,
          size: titleFontSize,
          color: accentColorHex,
          font: fontName,
        }),
      ],
    })
  );

  // Headline (if present)
  if (basics.headline) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: basics.headline,
            italics: true,
            size: subHeadingFontSize,
            color: "334155",
            font: fontName,
          }),
        ],
      })
    );
  }

  // Contact info line
  const contactParts: string[] = [];
  if (basics.email) contactParts.push(basics.email);
  if (basics.phone) contactParts.push(basics.phone);
  if (basics.location) contactParts.push(basics.location);
  if (basics.linkedin) contactParts.push(basics.linkedin.replace(/^https?:\/\//i, ""));
  if (basics.github) contactParts.push(basics.github.replace(/^https?:\/\//i, ""));
  if (basics.website) contactParts.push(basics.website.replace(/^https?:\/\//i, ""));
  if (basics.profiles && basics.profiles.length > 0) {
    basics.profiles.forEach((p) => {
      const url = p.url || p.username;
      if (url) {
        const clean = url.replace(/^https?:\/\//i, "");
        if (!contactParts.some((c) => c.toLowerCase().includes(clean.toLowerCase()))) {
          contactParts.push(clean);
        }
      }
    });
  }

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { before: 0, after: sectionGap },
        children: [
          new TextRun({
            text: contactParts.join("  •  "),
            size: metaFontSize,
            color: "475569",
            font: fontName,
          }),
        ],
      })
    );
  }

  // Helper: Section Title Builder (HeadingLevel.HEADING_2 with bottom border)
  const buildSectionHeading = (title: string): Paragraph => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: sectionGap, after: 80 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: accentColorHex,
          space: 4,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: headingFontSize,
          color: accentColorHex,
          font: fontName,
        }),
      ],
    });
  };

  // Helper: Experience / Education / Project date tab stop
  const rightTabStop = {
    type: TabStopType.RIGHT,
    position: TabStopPosition.MAX,
  };

  // ==========================================
  // 2. DYNAMIC SECTION ORDER RENDERING
  // ==========================================
  const order = normalizeSectionOrder(sectionOrder);

  for (const sectionId of order) {
    if (sectionVisibility && sectionVisibility[sectionId as SectionId] === false) {
      continue;
    }

    switch (sectionId) {
      // ----------------------------------------
      // SUMMARY
      // ----------------------------------------
      case "summary": {
        if (!basics.summary || !basics.summary.trim()) break;
        children.push(buildSectionHeading("Professional Summary"));
        children.push(
          new Paragraph({
            spacing: { before: 40, after: itemGap },
            children: [
              new TextRun({
                text: basics.summary,
                size: baseFontSize,
                font: fontName,
                color: "1E293B",
              }),
            ],
          })
        );
        break;
      }

      // ----------------------------------------
      // EXPERIENCE
      // ----------------------------------------
      case "experience": {
        if (!experience || experience.length === 0 || experience.every((e) => e.hidden)) break;
        children.push(buildSectionHeading("Experience"));

        for (const exp of experience) {
          if (exp.hidden) continue;
          const dateRange = `${exp.startDate || ""} – ${exp.current ? "Present" : exp.endDate || ""}`.trim();

          // Role title (bold) with right-aligned Date tab stop
          children.push(
            new Paragraph({
              tabStops: [rightTabStop],
              spacing: { before: itemGap, after: 20 },
              children: [
                new TextRun({
                  text: exp.position || "Position",
                  bold: true,
                  size: subHeadingFontSize,
                  font: fontName,
                  color: "0F172A",
                }),
                new TextRun({
                  text: "\t",
                }),
                new TextRun({
                  text: dateRange,
                  size: metaFontSize,
                  font: fontName,
                  color: "475569",
                }),
              ],
            })
          );

          // Company name and optional location
          const companyLine = exp.location
            ? `${exp.company}  |  ${exp.location}`
            : exp.company;
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: companyLine,
                  italics: true,
                  size: baseFontSize,
                  font: fontName,
                  color: "334155",
                }),
              ],
            })
          );

          if (exp.description && exp.description.trim()) {
            children.push(
              new Paragraph({
                spacing: { before: 10, after: 30 },
                children: [
                  new TextRun({
                    text: exp.description,
                    size: baseFontSize,
                    font: fontName,
                    color: "334155",
                  }),
                ],
              })
            );
          }

          // Bullets with genuine bullet points
          for (const b of exp.bullets ?? []) {
            if (b.hidden || !b.text || !b.text.trim()) continue;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: bulletGap },
                children: [
                  new TextRun({
                    text: b.text,
                    size: baseFontSize,
                    font: fontName,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }

          // Technologies used
          if (exp.technologies && exp.technologies.length > 0) {
            children.push(
              new Paragraph({
                spacing: { before: 30, after: itemGap },
                children: [
                  new TextRun({
                    text: "Key Technologies: ",
                    bold: true,
                    size: metaFontSize,
                    font: fontName,
                    color: "475569",
                  }),
                  new TextRun({
                    text: exp.technologies.join(", "),
                    size: metaFontSize,
                    font: fontName,
                    color: "334155",
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      // ----------------------------------------
      // PROJECTS
      // ----------------------------------------
      case "projects": {
        if (!projects || projects.length === 0 || projects.every((p) => p.hidden)) break;
        children.push(buildSectionHeading("Projects"));

        for (const proj of projects) {
          if (proj.hidden) continue;
          const dateRange = proj.startDate
            ? `${proj.startDate} – ${proj.endDate || "Present"}`
            : "";

          children.push(
            new Paragraph({
              tabStops: [rightTabStop],
              spacing: { before: itemGap, after: 20 },
              children: [
                new TextRun({
                  text: proj.name || "Project",
                  bold: true,
                  size: subHeadingFontSize,
                  font: fontName,
                  color: "0F172A",
                }),
                ...(proj.role
                  ? [
                      new TextRun({
                        text: `  •  ${proj.role}`,
                        italics: true,
                        size: metaFontSize,
                        font: fontName,
                        color: "475569",
                      }),
                    ]
                  : []),
                new TextRun({
                  text: "\t",
                }),
                new TextRun({
                  text: dateRange,
                  size: metaFontSize,
                  font: fontName,
                  color: "475569",
                }),
              ],
            })
          );

          if (proj.description) {
            children.push(
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: proj.description,
                    size: baseFontSize,
                    font: fontName,
                    color: "334155",
                  }),
                ],
              })
            );
          }

          for (const b of proj.bullets ?? []) {
            if (b.hidden || !b.text || !b.text.trim()) continue;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: bulletGap },
                children: [
                  new TextRun({
                    text: b.text,
                    size: baseFontSize,
                    font: fontName,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }

          if (proj.technologies && proj.technologies.length > 0) {
            children.push(
              new Paragraph({
                spacing: { before: 30, after: itemGap },
                children: [
                  new TextRun({
                    text: "Technologies: ",
                    bold: true,
                    size: metaFontSize,
                    font: fontName,
                    color: "475569",
                  }),
                  new TextRun({
                    text: proj.technologies.join(", "),
                    size: metaFontSize,
                    font: fontName,
                    color: "334155",
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      // ----------------------------------------
      // SKILLS
      // ----------------------------------------
      case "skills": {
        if (!skills || skills.length === 0) break;
        children.push(buildSectionHeading("Technical Skills"));

        for (const group of skills) {
          if (!group.skills || group.skills.length === 0) continue;
          children.push(
            new Paragraph({
              spacing: { before: 30, after: 40 },
              children: [
                new TextRun({
                  text: `${group.category}: `,
                  bold: true,
                  size: baseFontSize,
                  font: fontName,
                  color: "0F172A",
                }),
                new TextRun({
                  text: group.skills.join(", "),
                  size: baseFontSize,
                  font: fontName,
                  color: "334155",
                }),
              ],
            })
          );
        }
        break;
      }

      // ----------------------------------------
      // EDUCATION
      // ----------------------------------------
      case "education": {
        if (!education || education.length === 0 || education.every((e) => e.hidden)) break;
        children.push(buildSectionHeading("Education"));

        for (const edu of education) {
          if (edu.hidden) continue;
          const dateRange = `${edu.startDate || ""} – ${edu.current ? "Present" : edu.endDate || ""}`.trim();
          const degreeLine = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree;

          children.push(
            new Paragraph({
              tabStops: [rightTabStop],
              spacing: { before: itemGap, after: 20 },
              children: [
                new TextRun({
                  text: degreeLine,
                  bold: true,
                  size: subHeadingFontSize,
                  font: fontName,
                  color: "0F172A",
                }),
                new TextRun({
                  text: "\t",
                }),
                new TextRun({
                  text: dateRange,
                  size: metaFontSize,
                  font: fontName,
                  color: "475569",
                }),
              ],
            })
          );

          const institutionDetails = [edu.institution];
          if (edu.location) institutionDetails.push(edu.location);
          if (edu.gpa) institutionDetails.push(`GPA: ${edu.gpa}`);

          children.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: institutionDetails.join("  |  "),
                  italics: true,
                  size: baseFontSize,
                  font: fontName,
                  color: "334155",
                }),
              ],
            })
          );

          for (const h of edu.highlights ?? []) {
            if (h.hidden || !h.text || !h.text.trim()) continue;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: bulletGap },
                children: [
                  new TextRun({
                    text: h.text,
                    size: baseFontSize,
                    font: fontName,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      // ----------------------------------------
      // CERTIFICATIONS
      // ----------------------------------------
      case "certifications": {
        if (!certifications || certifications.length === 0 || certifications.every((c) => c.hidden)) break;
        children.push(buildSectionHeading("Certifications"));

        for (const cert of certifications) {
          if (cert.hidden) continue;
          children.push(
            new Paragraph({
              tabStops: [rightTabStop],
              spacing: { before: 30, after: 20 },
              children: [
                new TextRun({
                  text: cert.name,
                  bold: true,
                  size: baseFontSize,
                  font: fontName,
                  color: "0F172A",
                }),
                new TextRun({
                  text: "\t",
                }),
                new TextRun({
                  text: cert.date,
                  size: metaFontSize,
                  font: fontName,
                  color: "475569",
                }),
              ],
            })
          );

          if (cert.issuer) {
            children.push(
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: cert.issuer,
                    italics: true,
                    size: metaFontSize,
                    font: fontName,
                    color: "475569",
                  }),
                ],
              })
            );
          }
        }
        break;
      }
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontName,
            size: baseFontSize,
            color: "0F172A",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: marginDxa,
              right: marginDxa,
              bottom: marginDxa,
              left: marginDxa,
            },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Compiles ResumeDocument into an OpenXML blob.
 */
export async function generateDocxBlob(resume: ResumeDocument): Promise<Blob> {
  const doc = createDocxDocument(resume);
  return await Packer.toBlob(doc);
}

/**
 * Triggers client-side download of `${name}_Tailored_Resume.docx`.
 */
export async function exportToDocx(resume: ResumeDocument): Promise<void> {
  const blob = await generateDocxBlob(resume);
  const candidateName = resume.basics?.name?.trim() || "Candidate";
  const sanitizedName = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${sanitizedName}_Tailored_Resume.docx`;

  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
