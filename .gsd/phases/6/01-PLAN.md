---
phase: 6
plan: 1
wave: 1
depends_on: ["5.1"]
files_modified:
  - src/lib/export/docxExport.ts
  - src/lib/export/pdfExport.ts
  - src/components/navbar/Header.tsx
  - tests/scoring.test.ts
  - tests/truthGuard.test.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "docxExport compiles ResumeDocument into native OpenXML .docx with Heading 1, Heading 2, and bullet formatting"
    - "pdfExport triggers browser print dialog with @media print stylesheet producing crisp vector text"
    - "Automated tests verify deterministic scoring math, alias normalization, and truth guard detection"
  artifacts:
    - "src/lib/export/docxExport.ts"
    - "src/lib/export/pdfExport.ts"
    - "tests/scoring.test.ts"
    - "tests/truthGuard.test.ts"
---

# Plan 6.1: Dual ATS Export Engine & Automated Test Suite

<objective>
Implement native OpenXML .docx compilation using the docx library, configure vector PDF export via window.print() and print CSS, wire the Header download buttons, and create automated unit tests.
</objective>

<context>
- src/lib/schema/resume.ts
- src/lib/store/useResumeStore.ts
- src/components/navbar/Header.tsx
</context>

<tasks>

<task type="auto">
  <name>Build Native OpenXML DOCX & Vector PDF Exporters</name>
  <files>src/lib/export/docxExport.ts, src/lib/export/pdfExport.ts, src/components/navbar/Header.tsx</files>
  <action>
    Create src/lib/export/docxExport.ts:
    - Uses `docx` library (Document, Paragraph, TextRun, HeadingLevel).
    - Header: Candidate Name as HeadingLevel.HEADING_1, Contact info line with email/phone/links.
    - Section Titles as HeadingLevel.HEADING_2 with bottom border.
    - Experience/Projects: Role & Company, right-aligned dates, bullet points with real `bullet: { level: 0 }`.
    - Generates Blob and triggers client-side file download: `${name}_Tailored_Resume.docx`.
    Create src/lib/export/pdfExport.ts:
    - Invokes `window.print()` with custom document title `${name}_Tailored_Resume.pdf`.
    Wire both export functions to the "Export PDF" and "Export Word (.docx)" buttons in Header.tsx and ResumeCanvas.tsx.
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>DOCX and PDF export actions generate downloadable files</done>
</task>

<task type="auto">
  <name>Write Automated Unit Tests</name>
  <files>tests/scoring.test.ts, tests/truthGuard.test.ts</files>
  <action>
    Create tests/scoring.test.ts:
    - Tests skill taxonomy matches.
    - Tests alias normalization (e.g. JS -> JavaScript, K8s -> Kubernetes).
    - Tests weighted evidence calculation (1.0 for bullet evidence vs 0.6 for skills list).
    Create tests/truthGuard.test.ts:
    - Tests detection of ungrounded tools (e.g. candidate profile has React, AI introduces Kubernetes -> flags needs_confirmation).
    - Tests detection of ungrounded metrics (e.g. AI introduces $5M revenue not in profile -> flags needs_confirmation).
    Run tests with node/vitest or custom test runner script.
  </action>
  <verify>npm run build succeeds</verify>
  <done>Automated tests verify core algorithmic correctness</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build completes cleanly
- [ ] Automated tests pass with 100% success
- [ ] Export buttons trigger DOCX and PDF workflows
</verification>

<success_criteria>
- [ ] Dual ATS export and test suite committed atomically
</success_criteria>
