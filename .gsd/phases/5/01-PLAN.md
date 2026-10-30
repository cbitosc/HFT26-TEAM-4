---
phase: 5
plan: 1
wave: 1
depends_on: ["4.2"]
files_modified:
  - src/components/editor/ExperienceEditor.tsx
  - src/components/editor/ProjectsEditor.tsx
  - src/components/preview/ResumeCanvas.tsx
  - src/components/feedback/ScoreDeltaToast.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Experience and project bullets have a '✨ Optimize' button for targeted single-sentence enhancement"
    - "Auto-Fit 1-Page mode dynamically constrains section spacing and font sizes to prevent page spillover"
    - "ScoreDeltaToast displays a floating '+X% Coverage' badge whenever score increases"
  artifacts:
    - "src/components/feedback/ScoreDeltaToast.tsx"
---

# Plan 5.1: Targeted Bullet Co-Pilot & Dynamic 1-Page Auto-Scaler

<objective>
Implement the single-bullet AI Co-Pilot button ("✨ Optimize") in the experience/project editors, the dynamic 1-page auto-scaler CSS rules, and the floating ScoreDeltaToast notification.
</objective>

<context>
- src/lib/store/useResumeStore.ts
- src/components/editor/ExperienceEditor.tsx
- src/components/preview/ResumeCanvas.tsx
</context>

<tasks>

<task type="auto">
  <name>Build Single-Bullet '✨ Optimize' Co-Pilot Action</name>
  <files>src/components/editor/ExperienceEditor.tsx, src/components/editor/ProjectsEditor.tsx</files>
  <action>
    Add a "✨" co-pilot button next to each bullet in ExperienceEditor and ProjectsEditor.
    When clicked:
    - Calls local optimization logic (or /api/tailor) targeted to that single bullet.
    - Proposes Google XYZ version incorporating missing JD keywords.
    - Shows an inline modal/popover with Before vs After and an "Apply" button.
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Single-bullet optimizer allows in-place enhancement without full resume re-tailoring</done>
</task>

<task type="auto">
  <name>Build ScoreDeltaToast and Dynamic 1-Page Auto-Scaler</name>
  <files>src/components/feedback/ScoreDeltaToast.tsx, src/components/preview/ResumeCanvas.tsx</files>
  <action>
    Create ScoreDeltaToast:
    - Listens to store coverage score changes.
    - When score increases (e.g. from 68% -> 76%), pops a floating green badge: "+8% Coverage!" with smooth fade-out.
    Update ResumeCanvas:
    - If layout.autoFitOnePage is true, dynamically clamps `--section-gap: 0.5rem`, `--bullet-gap: 0.2rem`, and adjusts font scale so content stays strictly within 1 A4 page height (297mm).
  </action>
  <verify>npm run build succeeds</verify>
  <done>Auto-fit scales canvas spacing and toast flashes on score increases</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build completes cleanly
- [ ] Clicking ✨ on a bullet opens targeted enhancement
- [ ] Accepting changes triggers the +X% toast
</verification>

<success_criteria>
- [ ] Single-bullet co-pilot and 1-page auto-scaler committed atomically
</success_criteria>
