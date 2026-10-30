---
phase: 4
plan: 1
wave: 1
depends_on: ["3.1"]
files_modified:
  - src/lib/ai/aiTypes.ts
  - src/lib/ai/truthGuard.ts
  - src/lib/ai/heuristicTailor.ts
  - src/app/api/tailor/route.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Deterministic Truth Guard validates that AI suggestions do not introduce unverified tools or metrics"
    - "Heuristic Tailor provides honest offline fallback so the app never fails without API keys"
    - "POST /api/tailor endpoint anonymizes candidate contact info before prompt construction"
    - "Endpoint returns structured suggestions, truth flags, and critic findings"
  artifacts:
    - "src/lib/ai/aiTypes.ts"
    - "src/lib/ai/truthGuard.ts"
    - "src/lib/ai/heuristicTailor.ts"
    - "src/app/api/tailor/route.ts"
---

# Plan 4.1: Bounded AI Tailor API, Deterministic Truth Guard & Heuristic Fallback

<objective>
Build the AI data contracts, the deterministic Truth Guard (anti-hallucination verification), the honest heuristic fallback engine, and the Next.js POST /api/tailor endpoint.
</objective>

<context>
- src/lib/schema/resume.ts
- src/lib/schema/jd.ts
- src/lib/scoring/deterministicScorer.ts
</context>

<tasks>

<task type="auto">
  <name>Build AI Types & Deterministic Truth Guard</name>
  <files>src/lib/ai/aiTypes.ts, src/lib/ai/truthGuard.ts</files>
  <action>
    Create src/lib/ai/aiTypes.ts with types for TailoredSuggestion, CriticFinding, and TailorResponse.
    Create src/lib/ai/truthGuard.ts:
    - `validateSuggestion(masterProfile, suggestion)`:
      - Extracts tool names and numeric metrics (percentages, dollar amounts, scale counts) from the suggested text.
      - Checks if those tools/metrics exist in the master profile.
      - If absent, sets `truthStatus: 'needs_confirmation'` and lists `unverifiedClaims`.
      - If grounded, sets `truthStatus: 'verified'`.
  </action>
  <verify>npx tsc --noEmit succeeds</verify>
  <done>Truth guard accurately flags unverified claims and passes type checks</done>
</task>

<task type="auto">
  <name>Build Heuristic Tailor & POST /api/tailor Route</name>
  <files>src/lib/ai/heuristicTailor.ts, src/app/api/tailor/route.ts</files>
  <action>
    Create src/lib/ai/heuristicTailor.ts:
    - Synthesizes tailored summary based on target title and verified matched skills.
    - Enhances existing bullets with active action verbs and keywords supported by the profile.
    - Generates stylistic CriticFindings (e.g. flagging bullets >180 characters or missing metrics).
    - Runs all outputs through the Truth Guard.
    Create src/app/api/tailor/route.ts:
    - Anonymizes candidate details (removes phone, email, address before LLM call).
    - Checks for FEATHERLESS_API_KEY / OPENAI_API_KEY.
    - If key present, calls LLM with strict JSON schema instructions and 8s timeout.
    - If key absent or request fails, seamlessly falls back to heuristicTailor with `isFallback: true`.
  </action>
  <verify>npm run build succeeds</verify>
  <done>API route compiles and handles both live LLM calls and resilient fallback</done>
</task>

</tasks>

<verification>
After tasks, verify:
- [ ] npm run build compiles cleanly
- [ ] Truth Guard detects fabricated metrics
- [ ] /api/tailor works even with no API keys configured
</verification>

<success_criteria>
- [ ] AI types, truth guard, fallback engine, and API route committed atomically
</success_criteria>
