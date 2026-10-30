---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - tailwind.config.ts
  - postcss.config.mjs
  - LICENSE
  - src/app/layout.tsx
  - src/app/globals.css
  - src/app/page.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Next.js 14 App Router project compiles without errors"
    - "Tailwind CSS styles are configured and active"
    - "MIT License exists"
  artifacts:
    - "package.json exists with required dependencies"
    - "LICENSE exists"
    - "src/app/page.tsx renders initial shell"
---

# Plan 1.1: Project Scaffolding & Design Foundation

<objective>
Initialize the Next.js 14 App Router workspace with Tailwind CSS, TypeScript, core dependencies (Zustand, Zod, Lucide, docx), MIT License, and the initial application shell.
</objective>

<context>
- .gsd/SPEC.md
- .gsd/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Initialize package.json and configuration files</name>
  <files>package.json, tsconfig.json, tailwind.config.ts, postcss.config.mjs, LICENSE</files>
  <action>
    Create package.json targeting Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide icons, Zustand, Zod, and docx.
    Create tsconfig.json with "@/*" path aliases.
    Create tailwind.config.ts with modern typography and slate/emerald palette.
    Create MIT LICENSE for Team Red flowers.
    AVOID: Unnecessary heavyweight libraries; keep bundle lean and fast.
  </action>
  <verify>npm install succeeds</verify>
  <done>package.json and all config files are in place with no syntax errors</done>
</task>

<task type="auto">
  <name>Create App Shell and Styles</name>
  <files>src/app/layout.tsx, src/app/globals.css, src/app/page.tsx</files>
  <action>
    Create globals.css with print styles (@page { size: A4; margin: 0; }) and Tailwind directives.
    Create layout.tsx with Inter font and metadata for ResuArchitect AI.
    Create page.tsx with initial dashboard header and status badge.
  </action>
  <verify>npm run build succeeds</verify>
  <done>Next.js app compiles cleanly</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build exits with 0
- [ ] LICENSE is present
- [ ] src/app/page.tsx exists
</verification>

<success_criteria>
- [ ] Next.js app builds cleanly
- [ ] Git commit created with type(scope): description
</success_criteria>
