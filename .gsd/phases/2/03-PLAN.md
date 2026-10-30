---
phase: 2
plan: 3
wave: 3
depends_on: ["2.2"]
files_modified:
  - src/components/preview/ResumeCanvas.tsx
  - src/components/preview/AtsRobotView.tsx
  - src/components/editor/ThemeCustomizer.tsx
  - src/app/page.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Live A4 Canvas renders resume in real-time at 60fps reflecting all edits and section reordering"
    - "ThemeCustomizer allows switching between Modern Minimalist, Executive Ivy, and Tech Clean themes"
    - "Font scaling, font family, and margins update CSS variables dynamically"
    - "'View as ATS Robot' toggle shows clean linearized plain text extraction with section parser badges"
  artifacts:
    - "src/components/preview/ResumeCanvas.tsx"
    - "src/components/preview/AtsRobotView.tsx"
    - "src/components/editor/ThemeCustomizer.tsx"
---

# Plan 2.3: Live A4 Canvas, Theme Customizer & ATS Robot View

<objective>
Build the pixel-perfect Live A4 Canvas with dynamic theme styling and CSS variable scaling, the ThemeCustomizer controls, and the "View as ATS Robot" plaintext inspector.
</objective>

<context>
- src/lib/store/useResumeStore.ts
- src/components/editor/EditorTabs.tsx
- src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Build ResumeCanvas & Theme Renderer</name>
  <files>src/components/preview/ResumeCanvas.tsx, src/components/editor/ThemeCustomizer.tsx</files>
  <action>
    Create ResumeCanvas:
    - Standard A4 proportions (210mm x 297mm equivalent aspect ratio) with zoom controls (75%, 90%, 100%, 120%)
    - Dynamic theme application: 'modern-minimal', 'executive-ivy', 'tech-clean'
    - Dynamic font families: Inter, Garamond, Roboto
    - Dynamic margins and font scale
    - Section rendering according to layout.sectionOrder
    - ATS-friendly markup: semantic headings (h1, h2), standard ul/li bullets, copyable text layer
    Create ThemeCustomizer:
    - Theme selector cards
    - Font family dropdown
    - Font scale slider (9.5pt to 11.5pt)
    - Margins toggle (compact vs normal)
    - Auto-fit to 1-page toggle
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>ResumeCanvas renders live resume and ThemeCustomizer modifies layout state</done>
</task>

<task type="auto">
  <name>Build 'View as ATS Robot' Plain-Text Inspector</name>
  <files>src/components/preview/AtsRobotView.tsx, src/app/page.tsx</files>
  <action>
    Create AtsRobotView:
    - Strips all visual styling, background colors, and columns
    - Displays raw linearized plain text sequence that legacy ATS parsers (Taleo, Workday, Greenhouse) extract
    - Header showing parse verification metrics: "Zero unparseable tables detected", "Single-column linear flow", "Standard header hierarchy verified"
    - Add toggle switch in the canvas toolbar ("Normal Preview" ⇄ "View as ATS Robot")
    Mount ResumeCanvas and AtsRobotView into the right pane of src/app/page.tsx.
  </action>
  <verify>npm run build succeeds</verify>
  <done>Live preview is fully functional with instant theme switching and ATS robot inspector</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build compiles cleanly
- [ ] Switching presets or editing fields updates canvas instantly
- [ ] Toggling ATS Robot view displays linearized text
</verification>

<success_criteria>
- [ ] Complete live preview system and ATS inspector committed atomically
</success_criteria>
