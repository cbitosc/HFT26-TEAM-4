---
phase: 4
plan: 2
wave: 2
depends_on: ["4.1"]
files_modified:
  - src/components/tailor/DiffReviewer.tsx
  - src/components/tailor/DiffCard.tsx
  - src/components/editor/EditorTabs.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "DiffReviewer triggers /api/tailor with multi-stage progress stepper"
    - "DiffCard shows Before (red/neutral) vs After (green highlight on added keywords)"
    - "Truth Guard warnings display prominently on unverified suggestions"
    - "Accepting a suggestion applies the change to Zustand store with a live +X% coverage delta badge"
    - "User can Accept, Reject, or Edit each suggestion individually, or 'Apply All Verified'"
  artifacts:
    - "src/components/tailor/DiffReviewer.tsx"
    - "src/components/tailor/DiffCard.tsx"
---

# Plan 4.2: Git-Style Diff Reviewer UI & Delta Score Feedback

<objective>
Build the interactive Git-Style Diff Reviewer in the 'ai' tab, rendering multi-stage AI progress indicators, side-by-side diff cards with Truth Guard badges, and live +X% coverage score delta feedback upon acceptance.
</objective>

<context>
- src/lib/ai/aiTypes.ts
- src/lib/store/useResumeStore.ts
- src/components/editor/EditorTabs.tsx
</context>

<tasks>

<task type="auto">
  <name>Build DiffCard with Keyword Highlighting & Truth Guard Warning</name>
  <files>src/components/tailor/DiffCard.tsx</files>
  <action>
    Create DiffCard component:
    - Section & Role context badge (e.g. "Senior SWE at Stripe - Bullet 2")
    - Original text display (neutral/red strikethrough styling)
    - Proposed text display with green badge highlights for newly injected target keywords
    - Truth Guard badge:
      - If verified: green shield badge ("✓ Verified from Master Profile")
      - If needs confirmation: amber alert badge ("⚠️ Requires Confirmation: [Tool/Metric] was not found in your Master Profile. Verify before accepting.")
    - Action buttons: "✓ Accept (+X% Coverage)", "✗ Reject", "✏️ Edit inline"
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>DiffCard renders comparisons with truth badges and responsive action buttons</done>
</task>

<task type="auto">
  <name>Build DiffReviewer and Mount into EditorTabs</name>
  <files>src/components/tailor/DiffReviewer.tsx, src/components/editor/EditorTabs.tsx</files>
  <action>
    Create DiffReviewer:
    - AI Run button: "⚡ Generate Tailored Resume with AI"
    - Multi-stage progress stepper showing real-time workflow:
      - "[✓] Stage 1: JD Parser extracted core mandates"
      - "[✓] Stage 2: Resume Tailor crafted XYZ bullets"
      - "[✓] Stage 3: Truth Guard verified factual claims"
      - "[✓] Stage 4: Critic linted action verbs & brevity"
    - Summary Diff card (Before vs Tailored Summary)
    - List of Bullet Diff cards with filter (All, Verified, Needs Confirmation)
    - "Accept All Verified" bulk action button
    - Live Delta indicator: flashes green chip "+X% Coverage" when a suggestion is accepted
    Mount DiffReviewer into the 'ai' tab of src/components/editor/EditorTabs.tsx.
  </action>
  <verify>npm run build succeeds</verify>
  <done>Complete AI Diff Reviewer is operational and compiles cleanly</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build completes cleanly
- [ ] Clicking "Generate Tailored Resume" returns suggestions
- [ ] Accepting a diff updates the resume and increases JD coverage
</verification>

<success_criteria>
- [ ] Git-style Diff Studio fully functional and committed atomically
</success_criteria>
