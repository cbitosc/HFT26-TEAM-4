import type { ResumeDocument, SectionId } from "@/lib/schema/resume";

export interface PdfExportOptions {
  mode?: "vector" | "print" | "raster";
  filename?: string;
}

/**
 * Robust, cross-device ATS-compliant PDF exporter.
 *
 * 1. Default "vector" mode:
 *    Compiles a native, vector-text PDF directly from ResumeDocument using jsPDF.
 *    Text is 100% selectable, copyable, searchable, and reliably parsed by all
 *    commercial ATS ingest engines (Workday, Taleo, Greenhouse, Lever).
 *
 * 2. "print" mode (or graceful fallback):
 *    Temporarily sets document.title and triggers window.print() with our
 *    isolated A4 print stylesheet.
 */
export async function exportToPdf(
  resumeOrName?: ResumeDocument | string,
  options?: PdfExportOptions
): Promise<void> {
  if (typeof window === "undefined") return;

  const candidateName =
    typeof resumeOrName === "object" && resumeOrName !== null
      ? resumeOrName?.basics?.name?.trim() || "Candidate"
      : typeof resumeOrName === "string"
      ? resumeOrName.trim() || "Candidate"
      : "Candidate";

  const sanitizedName = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = options?.filename || `${sanitizedName}_Tailored_Resume.pdf`;
  const mode = options?.mode || "vector";

  if (mode === "print") {
    triggerBrowserPrint(sanitizedName);
    return;
  }

  // 1. Primary Vector PDF Export (Direct selectable text, 100% ATS compliant)
  if (typeof resumeOrName === "object" && resumeOrName !== null && mode !== "raster") {
    try {
      await generateVectorPdf(resumeOrName, filename);
      return;
    } catch (vectorErr) {
      console.warn("[pdfExport] Native vector PDF generation failed, falling back to DOM capture:", vectorErr);
    }
  }

  // 2. Fallback / Raster mode: Offscreen DOM canvas capture
  try {
    await generateDomCanvasPdf(filename, sanitizedName);
  } catch (error) {
    console.error("[pdfExport] DOM capture failed, falling back to window.print():", error);
    triggerBrowserPrint(sanitizedName);
  }
}

/**
 * Compiles a native vector-text PDF directly from the resume JSON schema.
 * All text lines, headings, and bullet points exist in the PDF content stream
 * with standard fonts (Helvetica/Times), ensuring 100% ATS readability and selectable text.
 */
export async function generateVectorPdf(resume: ResumeDocument, filename?: string): Promise<any> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const { layout, basics, experience, projects, skills, education, certifications } = resume;
  const {
    theme = "modern",
    fontFamily = "inter",
    fontScale = 1.0,
    margins = "normal",
    autoFitOnePage = false,
    sectionOrder = ["summary", "experience", "projects", "skills", "education", "certifications"],
    sectionVisibility,
  } = layout || {};

  // Dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const marginMm = margins === "compact" || autoFitOnePage ? 12.7 : margins === "spacious" ? 22 : 17;
  const contentWidth = pageWidth - marginMm * 2;
  const bottomThreshold = pageHeight - marginMm;

  // Typography
  const fontName = fontFamily === "garamond" ? "times" : "helvetica";
  const scale = autoFitOnePage ? Math.min(fontScale, 0.90) : fontScale;

  const szName = Math.round(18 * scale);
  const szHeadline = Math.round(10.5 * scale);
  const szContact = Math.round(8.5 * scale);
  const szSectionHeading = Math.round(11 * scale);
  const szSubHeading = Math.round(9.5 * scale);
  const szBody = Math.round(9 * scale);
  const szMeta = Math.round(8 * scale);

  const isExecutive = theme === "executive" || theme === "executive-ivy";
  const isTech = theme === "tech" || theme === "tech-clean";

  // Palette (RGB)
  const colorPrimary: [number, number, number] = isExecutive ? [30, 41, 59] : isTech ? [14, 116, 144] : [5, 150, 105];
  const colorHeadingText: [number, number, number] = [15, 23, 42];
  const colorBodyText: [number, number, number] = [30, 41, 59];
  const colorMutedText: [number, number, number] = [71, 85, 105];

  let cursorY = marginMm;

  const ensureSpace = (neededMm: number): boolean => {
    if (cursorY + neededMm > bottomThreshold) {
      if (autoFitOnePage) return false;
      pdf.addPage();
      cursorY = marginMm;
    }
    return true;
  };

  // 1. Candidate Header: Name
  pdf.setFont(fontName, "bold");
  pdf.setFontSize(szName);
  pdf.setTextColor(...colorHeadingText);

  const nameText = basics?.name || "Candidate Name";
  const nameX = isExecutive ? pageWidth / 2 : marginMm;
  const align = isExecutive ? "center" : "left";

  pdf.text(nameText, nameX, cursorY + 4, { align });
  cursorY += szName * 0.38 + 2;

  // Headline
  if (basics?.headline) {
    pdf.setFont(fontName, "italic");
    pdf.setFontSize(szHeadline);
    pdf.setTextColor(...colorPrimary);
    pdf.text(basics.headline, nameX, cursorY, { align });
    cursorY += szHeadline * 0.36 + 2;
  }

  // Contact line
  const contactParts: string[] = [];
  if (basics?.email) contactParts.push(basics.email);
  if (basics?.phone) contactParts.push(basics.phone);
  if (basics?.location) contactParts.push(basics.location);
  if (basics?.website) contactParts.push(basics.website.replace(/^https?:\/\//, ""));
  if (basics?.profiles && basics.profiles.length > 0) {
    basics.profiles.forEach((p) => {
      if (p.url) contactParts.push(p.url.replace(/^https?:\/\//, ""));
    });
  }

  if (contactParts.length > 0) {
    pdf.setFont(fontName, "normal");
    pdf.setFontSize(szContact);
    pdf.setTextColor(...colorMutedText);
    const contactLine = contactParts.join("  |  ");
    const contactLines = pdf.splitTextToSize(contactLine, contentWidth);
    pdf.text(contactLines, nameX, cursorY, { align });
    cursorY += contactLines.length * (szContact * 0.38) + 3;
  }

  // Header separator
  pdf.setDrawColor(...colorPrimary);
  pdf.setLineWidth(0.4);
  pdf.line(marginMm, cursorY, marginMm + contentWidth, cursorY);
  cursorY += autoFitOnePage ? 3 : 5;

  const renderSectionHeader = (title: string) => {
    ensureSpace(12);
    cursorY += autoFitOnePage ? 2.5 : 4;
    pdf.setFont(fontName, "bold");
    pdf.setFontSize(szSectionHeading);
    pdf.setTextColor(...colorPrimary);
    pdf.text(title.toUpperCase(), marginMm, cursorY);
    cursorY += 1.8;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.line(marginMm, cursorY, marginMm + contentWidth, cursorY);
    cursorY += autoFitOnePage ? 2.5 : 3.5;
  };

  // Section Handlers
  const sectionHandlers: Record<SectionId, () => void> = {
    summary: () => {
      if (!basics?.summary) return;
      renderSectionHeader("Professional Summary");
      ensureSpace(10);
      pdf.setFont(fontName, "normal");
      pdf.setFontSize(szBody);
      pdf.setTextColor(...colorBodyText);
      const lines = pdf.splitTextToSize(basics.summary, contentWidth);
      pdf.text(lines, marginMm, cursorY);
      cursorY += lines.length * (szBody * 0.38) + (autoFitOnePage ? 2 : 3.5);
    },

    experience: () => {
      if (!experience || experience.length === 0) return;
      renderSectionHeader("Work Experience");

      for (const exp of experience) {
        ensureSpace(14);
        pdf.setFont(fontName, "bold");
        pdf.setFontSize(szSubHeading);
        pdf.setTextColor(...colorHeadingText);
        pdf.text(exp.position || "Position", marginMm, cursorY);

        const dateStr = `${exp.startDate || ""} — ${exp.current ? "Present" : exp.endDate || ""}`;
        pdf.setFont(fontName, "normal");
        pdf.setFontSize(szMeta);
        pdf.setTextColor(...colorMutedText);
        pdf.text(dateStr, marginMm + contentWidth, cursorY, { align: "right" });
        cursorY += szSubHeading * 0.38 + 1.2;

        pdf.setFont(fontName, "italic");
        pdf.setFontSize(szMeta);
        pdf.setTextColor(...colorBodyText);
        const sub = exp.location ? `${exp.company} • ${exp.location}` : exp.company;
        pdf.text(sub, marginMm, cursorY);
        cursorY += szMeta * 0.38 + 2;

        if (exp.bullets && exp.bullets.length > 0) {
          pdf.setFont(fontName, "normal");
          pdf.setFontSize(szBody);
          pdf.setTextColor(...colorBodyText);
          const bulletIndent = 3.5;
          const bulletWidth = contentWidth - bulletIndent;

          for (const b of exp.bullets) {
            const bLines = pdf.splitTextToSize(b.text, bulletWidth);
            const neededMm = bLines.length * (szBody * 0.38) + 1.5;
            ensureSpace(neededMm);

            pdf.setTextColor(...colorPrimary);
            pdf.text("•", marginMm + 0.5, cursorY);
            pdf.setTextColor(...colorBodyText);
            pdf.text(bLines, marginMm + bulletIndent, cursorY);
            cursorY += bLines.length * (szBody * 0.38) + (autoFitOnePage ? 1.2 : 2.2);
          }
        }
        cursorY += autoFitOnePage ? 1.5 : 2.5;
      }
    },

    projects: () => {
      if (!projects || projects.length === 0) return;
      renderSectionHeader("Key Projects");

      for (const proj of projects) {
        ensureSpace(14);
        pdf.setFont(fontName, "bold");
        pdf.setFontSize(szSubHeading);
        pdf.setTextColor(...colorHeadingText);
        pdf.text(proj.name || "Project", marginMm, cursorY);

        if (proj.role || proj.startDate) {
          const metaStr = proj.role ? (proj.startDate ? `${proj.role} • ${proj.startDate}` : proj.role) : proj.startDate || "";
          pdf.setFont(fontName, "normal");
          pdf.setFontSize(szMeta);
          pdf.setTextColor(...colorMutedText);
          pdf.text(metaStr, marginMm + contentWidth, cursorY, { align: "right" });
        }
        cursorY += szSubHeading * 0.38 + 1.2;

        if (proj.technologies && proj.technologies.length > 0) {
          pdf.setFont(fontName, "italic");
          pdf.setFontSize(szMeta);
          pdf.setTextColor(...colorMutedText);
          pdf.text(`Tech: ${proj.technologies.join(", ")}`, marginMm, cursorY);
          cursorY += szMeta * 0.38 + 2;
        }

        if (proj.bullets && proj.bullets.length > 0) {
          pdf.setFont(fontName, "normal");
          pdf.setFontSize(szBody);
          pdf.setTextColor(...colorBodyText);
          const bulletIndent = 3.5;
          const bulletWidth = contentWidth - bulletIndent;

          for (const b of proj.bullets) {
            const bLines = pdf.splitTextToSize(b.text, bulletWidth);
            const neededMm = bLines.length * (szBody * 0.38) + 1.5;
            ensureSpace(neededMm);

            pdf.setTextColor(...colorPrimary);
            pdf.text("•", marginMm + 0.5, cursorY);
            pdf.setTextColor(...colorBodyText);
            pdf.text(bLines, marginMm + bulletIndent, cursorY);
            cursorY += bLines.length * (szBody * 0.38) + (autoFitOnePage ? 1.2 : 2.2);
          }
        }
        cursorY += autoFitOnePage ? 1.5 : 2.5;
      }
    },

    skills: () => {
      if (!skills || skills.length === 0) return;
      renderSectionHeader("Technical Skills");

      pdf.setFontSize(szBody);
      for (const group of skills) {
        const skillList = group.skills?.map((s: any) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean).join(", ");
        if (!skillList) continue;
        ensureSpace(7);

        pdf.setFont(fontName, "bold");
        pdf.setTextColor(...colorHeadingText);
        const catLabel = `${group.category}: `;
        pdf.text(catLabel, marginMm, cursorY);
        const catWidth = pdf.getTextWidth(catLabel);

        pdf.setFont(fontName, "normal");
        pdf.setTextColor(...colorBodyText);
        const remainingWidth = contentWidth - catWidth;
        const skillLines = pdf.splitTextToSize(skillList, remainingWidth);

        if (skillLines.length > 0) {
          pdf.text(skillLines[0], marginMm + catWidth, cursorY);
          if (skillLines.length > 1) {
            const restLines = skillLines.slice(1);
            cursorY += szBody * 0.38;
            pdf.text(restLines, marginMm + 5, cursorY);
            cursorY += (restLines.length - 1) * (szBody * 0.38);
          }
        }
        cursorY += szBody * 0.38 + (autoFitOnePage ? 1.2 : 2.2);
      }
    },

    education: () => {
      if (!education || education.length === 0) return;
      renderSectionHeader("Education");

      for (const edu of education) {
        ensureSpace(12);
        pdf.setFont(fontName, "bold");
        pdf.setFontSize(szSubHeading);
        pdf.setTextColor(...colorHeadingText);
        const deg = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree;
        pdf.text(deg, marginMm, cursorY);

        const dateStr = `${edu.startDate || ""} — ${edu.endDate || ""}`;
        pdf.setFont(fontName, "normal");
        pdf.setFontSize(szMeta);
        pdf.setTextColor(...colorMutedText);
        pdf.text(dateStr, marginMm + contentWidth, cursorY, { align: "right" });
        cursorY += szSubHeading * 0.38 + 1.2;

        pdf.setFont(fontName, "normal");
        pdf.setFontSize(szMeta);
        pdf.setTextColor(...colorBodyText);
        const instStr = edu.gpa ? `${edu.institution}  •  GPA: ${edu.gpa}` : edu.institution;
        pdf.text(instStr, marginMm, cursorY);
        cursorY += szMeta * 0.38 + (autoFitOnePage ? 1.5 : 2.5);
      }
    },

    certifications: () => {
      if (!certifications || certifications.length === 0) return;
      renderSectionHeader("Certifications");

      for (const cert of certifications) {
        ensureSpace(10);
        pdf.setFont(fontName, "bold");
        pdf.setFontSize(szSubHeading);
        pdf.setTextColor(...colorHeadingText);
        pdf.text(cert.name, marginMm, cursorY);

        if (cert.date) {
          pdf.setFont(fontName, "normal");
          pdf.setFontSize(szMeta);
          pdf.setTextColor(...colorMutedText);
          pdf.text(cert.date, marginMm + contentWidth, cursorY, { align: "right" });
        }
        cursorY += szSubHeading * 0.38 + 1.2;

        if (cert.issuer) {
          pdf.setFont(fontName, "normal");
          pdf.setFontSize(szMeta);
          pdf.setTextColor(...colorMutedText);
          pdf.text(cert.issuer, marginMm, cursorY);
          cursorY += szMeta * 0.38 + (autoFitOnePage ? 1.5 : 2.2);
        }
      }
    },
  };

  // Render sections strictly in ordered layout
  for (const secId of sectionOrder) {
    if (sectionVisibility && sectionVisibility[secId] === false) {
      continue;
    }
    const handler = sectionHandlers[secId];
    if (handler) {
      handler();
    }
  }

  if (filename) {
    pdf.save(filename);
  }
  return pdf;
}

/**
 * Fallback DOM capture for raster-based image embedding when element is available.
 */
async function generateDomCanvasPdf(filename: string, sanitizedName: string): Promise<void> {
  const sourceElement = document.getElementById("resume-a4-sheet");
  if (!sourceElement) {
    triggerBrowserPrint(sanitizedName);
    return;
  }

  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");

  const container = document.createElement("div");
  container.id = "resume-pdf-render-container";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "794px";
  container.style.zIndex = "-99999";
  container.style.pointerEvents = "none";
  container.style.opacity = "1";
  container.style.overflow = "hidden";
  container.style.backgroundColor = "#ffffff";

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.id = "resume-pdf-render-clone";
  clone.style.position = "relative";
  clone.style.top = "0";
  clone.style.left = "0";
  clone.style.width = "794px";
  clone.style.minHeight = "1123px";
  clone.style.maxHeight = sourceElement.style.maxHeight || "none";
  clone.style.overflow = sourceElement.style.overflow || "visible";
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#0f172a";
  clone.style.display = "block";
  clone.style.visibility = "visible";

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 794,
      width: 794,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= 297;

    while (heightLeft > 5) {
      position = position - 297;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= 297;
    }

    pdf.save(filename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

function triggerBrowserPrint(sanitizedName: string): void {
  const originalTitle = document.title;
  document.title = `${sanitizedName}_Tailored_Resume`;

  try {
    window.print();
  } finally {
    window.setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }
}
