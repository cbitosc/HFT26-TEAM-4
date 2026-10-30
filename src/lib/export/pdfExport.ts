/**
 * ATS-compliant vector PDF export trigger.
 * Temporarily sets document.title to `${name}_Tailored_Resume` so the browser's
 * "Save as PDF" dialog suggests the exact filename, then triggers window.print().
 */
export function exportToPdf(name?: string): void {
  if (typeof window === "undefined") return;

  const candidateName = name?.trim() || "Candidate";
  const sanitizedName = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const targetTitle = `${sanitizedName}_Tailored_Resume`;
  const originalTitle = document.title;

  document.title = targetTitle;

  try {
    window.print();
  } finally {
    // Restore original document title after print preview closes
    window.setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }
}
