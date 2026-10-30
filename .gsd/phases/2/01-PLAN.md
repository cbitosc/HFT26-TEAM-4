---
phase: 2
plan: 1
wave: 1
depends_on: ["1.2"]
files_modified:
  - src/components/navbar/Header.tsx
  - src/components/editor/EditorTabs.tsx
  - src/app/page.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Header renders brand, 1-click Preset Loader dropdown, Export action triggers, and active status"
    - "Left pane renders responsive tabs: Profile, Job & Match, AI Tailor & Diffs, Theme & Layout"
    - "Selecting a sample profile updates Zustand state instantly"
  artifacts:
    - "src/components/navbar/Header.tsx"
    - "src/components/editor/EditorTabs.tsx"
---

# Plan 2.1: Navigation Header, Preset Selector & Tabbed Studio Shell

<objective>
Build the top navigation bar with 1-click sample profile/JD selectors and export triggers, and construct the split-screen layout with left-pane tab navigation.
</objective>

<context>
- src/lib/store/useResumeStore.ts
- src/lib/presets/sampleProfiles.ts
- src/lib/presets/sampleJds.ts
</context>

<tasks>

<task type="auto">
  <name>Build Header Component with Preset Profile Loader</name>
  <files>src/components/navbar/Header.tsx</files>
  <action>
    Create Header component featuring:
    - ResuArchitect AI logo and badge ("Local-First & ATS-Optimized")
    - 1-Click "Load Sample" dropdown (Senior Full-Stack, ML Engineer, Tech PM)
    - "Reset" button to clear or restore default
    - Privacy badge indicator ("100% On-Device Data")
    - Quick export buttons (PDF & DOCX placeholders wired to export actions)
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Header renders and interacting with preset loader populates store</done>
</task>

<task type="auto">
  <name>Build Split-Screen Workspace and EditorTabs Shell</name>
  <files>src/components/editor/EditorTabs.tsx, src/app/page.tsx</files>
  <action>
    Create EditorTabs component supporting 4 tabs:
    1. 'profile': Career Details & Section Ordering
    2. 'jd': Job Description & Match Score
    3. 'ai': AI Tailoring & Git-Style Diff Reviewer
    4. 'theme': Layout, Fonts, Margins & ATS Auto-Fit
    Wire up src/app/page.tsx to render the responsive split-screen (50% left editor, 50% right canvas preview).
  </action>
  <verify>npm run build succeeds</verify>
  <done>Split-screen layout renders with responsive switching between tabs</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build completes with zero errors
- [ ] Loading a preset switches active resume in store
</verification>

<success_criteria>
- [ ] Header, EditorTabs, and main page compiled and committed atomically
</success_criteria>
