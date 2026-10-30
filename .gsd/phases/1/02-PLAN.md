---
phase: 1
plan: 2
wave: 2
depends_on: ["1.1"]
files_modified:
  - src/lib/schema/resume.ts
  - src/lib/schema/jd.ts
  - src/lib/store/useResumeStore.ts
  - src/lib/presets/sampleProfiles.ts
  - src/lib/presets/sampleJds.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "ResumeDocument Zod schema enforces stable IDs for sections and bullets"
    - "Zustand store manages master profile, tailored active copy, and local persistence"
    - "3 complete sample profiles and 3 target JDs are available for 1-click loading"
  artifacts:
    - "src/lib/schema/resume.ts"
    - "src/lib/schema/jd.ts"
    - "src/lib/store/useResumeStore.ts"
    - "src/lib/presets/sampleProfiles.ts"
    - "src/lib/presets/sampleJds.ts"
---

# Plan 1.2: Core Schemas, State Store & Demo Presets

<objective>
Implement the single-source-of-truth Zod schemas for ResumeDocument and JobDescription, create the Zustand store with LocalStorage persistence, and bundle 3 production-grade candidate profiles with matching real-world JDs.
</objective>

<context>
- .gsd/SPEC.md
- src/app/layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Define Zod Schemas for Resume and JD</name>
  <files>src/lib/schema/resume.ts, src/lib/schema/jd.ts</files>
  <action>
    Create src/lib/schema/resume.ts with ResumeDocumentSchema and TypeScript types.
    Ensure stable IDs for experience, education, projects, skills, and bullets.
    Include layout metadata (order, theme, fontScale, margins, autoFitOnePage).
    Create src/lib/schema/jd.ts with JdRequirementsSchema (must-have, nice-to-have, raw text).
    AVOID: Any loose `any` types; all fields must be strictly typed.
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Schemas defined and pass TypeScript type checking</done>
</task>

<task type="auto">
  <name>Create Zustand Store with LocalStorage Persistence</name>
  <files>src/lib/store/useResumeStore.ts</files>
  <action>
    Create useResumeStore using Zustand with `persist` middleware storing under key "resuarchitect_resume_v1".
    Support actions: updateBasics, addExperience, updateExperience, deleteExperience, reorderExperience,
    updateBullet, reorderSections, updateTheme, setJd, loadProfile, resetToDefault.
    Ensure updating the tailored copy never mutates the master profile.
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Zustand store is fully typed with persistence</done>
</task>

<task type="auto">
  <name>Bundle 1-Click Demo Profiles and Real JDs</name>
  <files>src/lib/presets/sampleProfiles.ts, src/lib/presets/sampleJds.ts</files>
  <action>
    Create 3 realistic, high-caliber candidate profiles:
    1. Senior Full-Stack Engineer (React, Next.js, Node.js, TypeScript, PostgreSQL, AWS, Docker)
    2. Data Scientist & ML Engineer (Python, PyTorch, Scikit-learn, LangChain, FastAPI, SQL)
    3. Technical Product Manager (Agile, User Research, Roadmapping, SQL, A/B Testing, System Design)
    Create 3 authentic target job descriptions matching these roles (e.g. Stripe, Google, Airbnb).
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Presets export valid ResumeDocument objects adhering to the schema</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npx tsc --noEmit succeeds with zero errors
- [ ] Sample profiles pass ResumeDocumentSchema.parse()
</verification>

<success_criteria>
- [ ] Schemas, store, and presets committed atomically
</success_criteria>
