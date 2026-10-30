---
phase: 3
plan: 1
wave: 1
depends_on: ["2.3"]
files_modified:
  - src/lib/scoring/skillTaxonomy.ts
  - src/lib/scoring/aliasMap.ts
  - src/lib/scoring/deterministicScorer.ts
  - src/components/scoring/JdScoringPanel.tsx
  - src/components/editor/EditorTabs.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Deterministic scorer evaluates 400+ tech skills with alias expansion in <5ms"
    - "Keyword evidence is weighted: 1.0 for experience/project bullets, 0.6 for skills section, 0 for missing"
    - "JD scoring panel renders real-time coverage % gauge and breakdown"
    - "Missing keyword badges have a 1-click '+ Add to Skills' button that updates score instantly"
  artifacts:
    - "src/lib/scoring/skillTaxonomy.ts"
    - "src/lib/scoring/aliasMap.ts"
    - "src/lib/scoring/deterministicScorer.ts"
    - "src/components/scoring/JdScoringPanel.tsx"
---

# Plan 3.1: Deterministic JD Coverage Scorer & Keyword Gap Matrix

<objective>
Implement the 400+ skill taxonomy and alias mapping, the deterministic 0-100% JD Coverage scoring algorithm with weighted evidence, and the interactive JD scoring panel with instant gap badges and "+ Add to Skills" injection.
</objective>

<context>
- src/lib/schema/resume.ts
- src/lib/store/useResumeStore.ts
- src/lib/presets/sampleJds.ts
</context>

<tasks>

<task type="auto">
  <name>Build Skill Taxonomy, Alias Map & Deterministic Scoring Engine</name>
  <files>src/lib/scoring/skillTaxonomy.ts, src/lib/scoring/aliasMap.ts, src/lib/scoring/deterministicScorer.ts</files>
  <action>
    Create src/lib/scoring/skillTaxonomy.ts:
    - 400+ skills categorized into: Languages, Frontend, Backend, Databases, Cloud & DevOps, AI & Machine Learning, Testing & Tooling, System Design & Architecture.
    Create src/lib/scoring/aliasMap.ts:
    - Bidirectional normalization (e.g. JS -> JavaScript, K8s -> Kubernetes, Postgres -> PostgreSQL, React.js -> React).
    Create src/lib/scoring/deterministicScorer.ts:
    - `parseJdRequirements(text)`: extracts skills, identifies Must-Have (weight 3.0), Preferred (weight 1.5), and General tools (weight 1.0) using section headings and frequency.
    - `calculateJdCoverage(resume, jd)`: computes weighted evidence score:
      score = Σ(weight * credit) / Σ(weight) * 100, where credit is 1.0 in bullets, 0.6 in skills list, 0.0 if missing.
    - Returns overallScore, mustHaveScore, preferredScore, matchedKeywords array, and missingKeywords array.
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Scoring algorithm executes deterministically and passes TypeScript checks</done>
</task>

<task type="auto">
  <name>Build JdScoringPanel with Real-Time Gap Badges and 1-Click Skill Injection</name>
  <files>src/components/scoring/JdScoringPanel.tsx, src/components/editor/EditorTabs.tsx</files>
  <action>
    Create JdScoringPanel component:
    - JD Input controls (pasted text area with word/char counters, plus 1-click sample JD loader buttons).
    - Circular / Bar Coverage Gauge with color-coded status (<50% Needs Alignment, 50-75% Moderate Fit, 75-90% Strong Match, >90% Exceptional).
    - Coverage Breakdown metrics (Must-Haves %, Preferred %, Bullet Evidence %).
    - Keyword Alignment Grid:
      - Matched Skills (green pills) showing which bullet point or skill matched it.
      - Missing Skill Gaps (amber/red pills) with a "+ Add to Skills" button that immediately inserts the skill into the user's active resume and recalculates score in real time.
    Mount JdScoringPanel into the 'jd' tab in src/components/editor/EditorTabs.tsx.
  </action>
  <verify>npm run build succeeds</verify>
  <done>JD Scoring panel renders interactively and updates live score on typing or adding skills</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build compiles cleanly
- [ ] Pasting a JD calculates coverage % immediately (<10ms)
- [ ] Clicking "+ Add to Skills" on a missing keyword increases the score
</verification>

<success_criteria>
- [ ] Deterministic scoring and keyword gap matrix fully operational and committed atomically
</success_criteria>
