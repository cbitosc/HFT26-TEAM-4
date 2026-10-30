---
phase: 2
plan: 2
wave: 2
depends_on: ["2.1"]
files_modified:
  - src/components/editor/ProfileEditor.tsx
  - src/components/editor/SectionReorder.tsx
  - src/components/editor/ExperienceEditor.tsx
  - src/components/editor/ProjectsEditor.tsx
  - src/components/editor/SkillsEditor.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "User can edit all personal, summary, experience, education, projects, and skills fields"
    - "User can add, edit, delete, and reorder experience and project bullet points"
    - "User can reorder entire resume sections (e.g. move Projects above Experience) using Up/Down buttons"
    - "Every update reactive in Zustand store without lag"
  artifacts:
    - "src/components/editor/ProfileEditor.tsx"
    - "src/components/editor/SectionReorder.tsx"
---

# Plan 2.2: Profile Form Editors & Section Reordering

<objective>
Implement complete structured form editors for all career sections (Basics, Summary, Experience, Education, Projects, Skills) and an intuitive section reordering controller with up/down buttons.
</objective>

<context>
- src/lib/store/useResumeStore.ts
- src/components/editor/EditorTabs.tsx
</context>

<tasks>

<task type="auto">
  <name>Build Section Reordering & Personal Info Forms</name>
  <files>src/components/editor/SectionReorder.tsx, src/components/editor/ProfileEditor.tsx</files>
  <action>
    Create SectionReorder component:
    - Displays current order of sections (Summary, Experience, Education, Projects, Skills)
    - Up / Down arrow buttons to shift sections up or down
    - Section visibility toggle (hide/show)
    Create ProfileEditor containing:
    - SectionReorder at the top
    - Basics form (Full Name, Target Title, Email, Phone, Location, Portfolio/GitHub links)
    - Summary form (professional summary with character counter)
    - Education form (institution, degree, field, graduation date, honors)
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Basics, Summary, Education, and SectionReorder forms render and update store</done>
</task>

<task type="auto">
  <name>Build Experience, Projects, and Skills Editors</name>
  <files>src/components/editor/ExperienceEditor.tsx, src/components/editor/ProjectsEditor.tsx, src/components/editor/SkillsEditor.tsx</files>
  <action>
    Create ExperienceEditor:
    - Add new job entry / delete job
    - Edit company, role, location, dates
    - Bullet point list with inline text editing, "+ Add Bullet", delete bullet, and move up/down
    Create ProjectsEditor:
    - Add new project / delete project
    - Title, link, technologies comma/tag input
    - Bullet point list with add/edit/delete
    Create SkillsEditor:
    - Categorized skill groups (Languages, Frameworks, Cloud/DevOps, Tools)
    - Add/remove skill badge tags with instant pill rendering
    Integrate ExperienceEditor, ProjectsEditor, and SkillsEditor into ProfileEditor.
  </action>
  <verify>npm run build succeeds</verify>
  <done>All career components are editable, bullets can be added/removed, and build succeeds</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build completes cleanly
- [ ] Changing form values updates preview state
</verification>

<success_criteria>
- [ ] Complete profile editor operational and committed atomically
</success_criteria>
