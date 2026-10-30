import type { ResumeDocument } from "@/lib/schema/resume";

export interface PdfExportOptions {
  mode?: "download" | "print";
  filename?: string;
}

/**
 * Robust, cross-device ATS-compliant PDF exporter.
 *
 * 1. Default "download" mode:
 *    Renders the A4 resume sheet cleanly via html2canvas into jsPDF and triggers
 *    a direct browser download of `${candidateName}_Tailored_Resume.pdf`.
 *    Works reliably across mobile devices, desktop, webviews, and small viewports.
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
    typeof resumeOrName === "object"
      ? resumeOrName?.basics?.name?.trim() || "Candidate"
      : typeof resumeOrName === "string"
      ? resumeOrName.trim() || "Candidate"
      : "Candidate";

  const sanitizedName = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = options?.filename || `${sanitizedName}_Tailored_Resume.pdf`;
  const mode = options?.mode || "download";

  if (mode === "print") {
    triggerBrowserPrint(sanitizedName);
    return;
  }

  // "download" mode: Direct .pdf file generation and download
  try {
    const sourceElement = document.getElementById("resume-a4-sheet");

    if (!sourceElement) {
      console.warn("[pdfExport] #resume-a4-sheet not found in DOM, falling back to window.print()");
      triggerBrowserPrint(sanitizedName);
      return;
    }

    // Dynamic imports to prevent SSR issues
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    // Container positioned at (0, 0) underneath everything
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

    // Clone element to an isolated container so zoom scales,
    // dark mode, or mobile hidden parents never distort or clip the PDF
    const clone = sourceElement.cloneNode(true) as HTMLElement;
    clone.id = "resume-pdf-render-clone";
    clone.style.position = "relative";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.width = "794px"; // 210mm at 96dpi standard A4
    clone.style.minHeight = "1123px"; // 297mm at 96dpi standard A4
    clone.style.maxHeight = "none";
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
        scale: 2, // 2x resolution for retina-crisp typography
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
  } catch (error) {
    console.error("[pdfExport] Direct PDF generation failed, falling back to window.print():", error);
    triggerBrowserPrint(sanitizedName);
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
