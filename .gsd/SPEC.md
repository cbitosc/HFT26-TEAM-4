# SPEC.md — AI-Powered Tailored Resume Architect & Interactive Editor

**Status: FINALIZED**  
**Team:** Red flowers (TEAM-4)  
**Hackathon:** CBIT Hacktoberfest '26  
**Upstream Repository:** `cbitosc/HFT26-TEAM-4`  
**Local Branch:** `feature/prototype`  

---

## 1. Problem Statement
Job seekers spend hours manually tweaking resumes for different job postings, often struggling to align their experience with target keywords or format their documents cleanly. Existing resume generators produce rigid layouts, lack real-world match scoring, or lock editing behind paywalls. 

ResuArchitect AI builds an intelligent, privacy-first, local-first resume architecture platform that generates tailored, ATS-friendly resumes based on a user's master profile, skills, and a specific Job Description (JD). The system calculates a deterministic JD match score, highlights keyword gaps, provides a smooth visual editor for live tweak-and-preview adjustments, and allows seamless, clean exports to both PDF and DOCX formats without requiring pre-collected candidate datasets.

---

## 2. Core Requirements

1. **Profile & JD Ingestion**:
   - Accept user details (experience, education, projects, skills) via clean web forms or 1-click demo presets (Full-Stack Engineer, Data Scientist, Product Manager).
   - Ingest target Job Description via pasted text (primary) or public URL (best-effort SSRF-safe reader).
   - All profile data stored in browser `localStorage` (Privacy-first, zero DB required).
   - Stable IDs assigned to sections and bullets for immutable referencing.

2. **Deterministic Match Scoring ("JD Coverage Estimate")**:
   - Compute real-time coverage % in under 5ms in the browser without LLM hallucinations.
   - Built-in taxonomy of 400+ tech skills with alias dictionary (`JS` $\leftrightarrow$ `JavaScript`, `K8s` $\leftrightarrow$ `Kubernetes`, `Postgres` $\leftrightarrow$ `PostgreSQL`).
   - Weighted evidence: 1.0 credit for skills proven in experience/project bullets; 0.6 credit for skills only listed in skills section.
   - Matched keyword badges (green) and missing gap badges (amber/red) with 1-click "+ Add to Skills" for verified skills.
   - Live score delta chips (e.g. `+4% Coverage`) as suggestions are accepted.

3. **Bounded 3-Stage AI Pipeline with Deterministic Truth Guard**:
   - **Stage 1 (JD Parser)**: Parses JD into must-have and nice-to-have requirements.
   - **Stage 2 (Resume Tailor)**: Proposes tailored summary and XYZ bullet rewrites based *only* on profile facts.
   - **Deterministic Code Truth Guard**: Algorithmic gate checking that rewritten bullets do not introduce ungrounded metrics or tool names not present in the Master Profile.
   - **Stage 3 (ATS Critic Linter)**: Lints for action verbs, brevity (<180 chars), and formatting.
   - Git-Style Diff Reviewer with Accept / Reject / Edit controls per suggestion.
   - Honest fallback: If LLM API times out (>8s) or is disconnected, deterministic assist mode provides keyword gap analysis, bullet reordering, and skill additions without faking AI rewrites.

4. **Responsive Visual Studio & Live Canvas**:
   - Split-screen workspace: Left controls (Tabs: Profile, JD & Score, AI Diffs, Theme), Right live A4 canvas (60 FPS).
   - Theme customizer: Modern Minimalist, Executive Ivy, Clean Tech; font pairings (Inter, Garamond, Roboto); margins and font scale.
   - Section reordering (up/down controls) and visibility toggles.
   - "View as ATS Robot" Inspector: Single-click toggle stripping visual styling to show pure linearized text parse order.

5. **Dual ATS-Optimized Document Export**:
   - **PDF Export**: Browser vector print engine with `@page { size: A4; margin: 0; }` styling and selectable text.
   - **DOCX Export**: Native OpenXML `.docx` via `docx` library with authentic `Heading 1`, `Heading 2`, and standard bullet formatting.
   - Round-trip automated test verifying section and bullet extraction.

---

## 3. Technology Stack
- **Framework**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **State Management**: Zustand with `localStorage` persistence
- **Validation**: Zod
- **Icons**: Lucide React
- **Document Export**: `docx` (Word OpenXML) + Native Print CSS (PDF)
- **AI Integration**: Featherless / OpenAI-compatible endpoint via serverless `/api/tailor`
- **Testing**: Vitest + fast automated tests

---

## 4. Verification & Must-Have Truths
- `npm run build` succeeds with zero TypeScript or ESLint errors.
- Master profile loads, edits, and persists across browser refreshes.
- Deterministic scoring updates in <10ms as text is edited.
- Truth Guard blocks unverified claims before reaching candidate approval.
- DOCX export produces valid OpenXML with standard headings and bullets.
- PDF export renders crisp single-page/multi-page A4 vector text.
- Full offline / no-AI resilience: scoring, editing, and exports work without network or API keys.
