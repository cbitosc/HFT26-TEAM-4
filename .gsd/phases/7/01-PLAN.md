---
phase: 7
plan: 1
wave: 1
depends_on: ["6.1"]
files_modified:
  - src/app/api/scrape-jd/route.ts
  - src/components/scoring/JdScoringPanel.tsx
  - docs/ARCHITECTURE.md
  - README.md
autonomous: true
user_setup: []

must_haves:
  truths:
    - "POST /api/scrape-jd safely extracts text from public job URLs with SSRF protection"
    - "Scrape failures fall back cleanly to pasted text with clear messaging"
    - "README.md provides complete problem statement, system architecture, setup instructions, and demo guide"
    - "docs/ARCHITECTURE.md documents scoring formulas, truth guard, and document pipeline"
  artifacts:
    - "src/app/api/scrape-jd/route.ts"
    - "docs/ARCHITECTURE.md"
    - "README.md"
---

# Plan 7.1: SSRF-Safe Job URL Scraper & Hackathon Deliverables

<objective>
Implement the SSRF-safe public job URL scraper with graceful fallback, wire it to the JD panel, write the technical documentation in docs/ARCHITECTURE.md, and create the comprehensive, award-winning README.md.
</objective>

<context>
- .gsd/SPEC.md
- src/components/scoring/JdScoringPanel.tsx
- README.md
</context>

<tasks>

<task type="auto">
  <name>Build SSRF-Safe Public Job URL Reader</name>
  <files>src/app/api/scrape-jd/route.ts, src/components/scoring/JdScoringPanel.tsx</files>
  <action>
    Create src/app/api/scrape-jd/route.ts:
    - Validates URL syntax (http/https only).
    - Blocks private IP ranges (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254, localhost).
    - 5-second timeout and 1MB response limit.
    - Fetches content and strips HTML tags/scripts/styles, extracting readable job description text.
    - If anti-bot/login wall detected, returns graceful error with instructions to paste text directly.
    Update JdScoringPanel.tsx:
    - Add "Import from URL" toggle with input field and "Extract JD" loading button.
  </action>
  <verify>npm run build succeeds</verify>
  <done>URL scraping works safely with clear error fallback</done>
</task>

<task type="auto">
  <name>Create Project Documentation & Deliverables</name>
  <files>docs/ARCHITECTURE.md, README.md</files>
  <action>
    Create docs/ARCHITECTURE.md:
    - Detailed breakdown of data schemas, deterministic scoring formulas, truth guard algorithm, and OpenXML mapping.
    Update README.md:
    - Official Team details (Team 4, Red flowers).
    - Problem Statement & Solution Overview.
    - Architectural highlights (Local-first, Deterministic Scorer, Bounded AI with Truth Guard, Dual ATS Export).
    - Mermaid Architecture Diagrams.
    - Setup & Installation guide (`npm install`, `npm run dev`).
    - Demo Walkthrough Script (for the 3-minute video).
    - Verification checklist.
  </action>
  <verify>git status confirms clean tracked documentation</verify>
  <done>README.md and ARCHITECTURE.md are polished and hackathon-ready</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build compiles cleanly
- [ ] README.md contains all submission deliverables
</verification>

<success_criteria>
- [ ] URL reader and documentation committed atomically
</success_criteria>
