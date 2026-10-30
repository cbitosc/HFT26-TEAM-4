# Phase 4 Plan 1: Bounded AI Tailor API, Deterministic Truth Guard & Heuristic Fallback Summary

**Phase:** Phase 4 (Bounded AI Tailor & Diff Studio)  
**Plan:** 4.1  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objective
Build the AI data contracts, the deterministic Truth Guard (anti-hallucination verification engine), the honest heuristic fallback engine, and the Next.js App Router POST `/api/tailor` endpoint with candidate anonymization and 8s timeout resilience.

---

## 2. Completed Work

### Task 1: AI Types & Deterministic Truth Guard
- **`src/lib/ai/aiTypes.ts`**:
  - Defined strictly typed data contracts and Zod schemas for `TailoredSuggestion`, `CriticFinding`, `SummaryComparison`, `TailorResponse`, and `TailorRequest`.
  - Defined `TruthStatus` (`"verified" | "needs_confirmation"`), `CriticCategory` (`"brevity" | "action_verb" | "metrics" | "formatting" | "keyword"`), and `CriticType`.
- **`src/lib/ai/truthGuard.ts`**:
  - Implemented `extractProfileGroundedFacts` to extract all grounded tools (across all taxonomy aliases and profile sections), isolated numbers, and exact metrics (percentages, dollar amounts, multipliers, scale counts, latencies).
  - Implemented `extractToolsFromText` and `extractMetricsFromText` using high-precision regular expressions.
  - Implemented `validateTextAgainstProfile` and `validateSuggestion` to detect ungrounded tools or fabricated numbers/metrics and flag them with `needs_confirmation` and descriptive `unverifiedClaims`. Grounded facts receive `verified`.
  - Implemented `validateSummary` for professional summary rewrites.
- **Commit:** `1f761e0 feat(phase-4): build AI types and deterministic truth guard`

### Task 2: Heuristic Tailor & POST `/api/tailor` Route
- **`src/lib/ai/heuristicTailor.ts`**:
  - Implemented offline fallback engine that operates with zero API keys or external dependencies.
  - Dynamically computes JD coverage, top matched skills, and missing keywords.
  - Synthesizes tailored professional summary aligned with target job title and verified competencies.
  - Enhances experience and project bullets with strong action verbs ("Spearheaded", "Architected", "Engineered", "Orchestrated") while preserving candidate's authentic metrics.
  - Implemented ATS Critic Linter generating findings for brevity (>180 chars), weak opening verbs, and missing metrics.
  - Runs all outputs through the Truth Guard.
- **`src/app/api/tailor/route.ts`**:
  - Implemented Next.js App Router `POST` handler with `runtime = "nodejs"`.
  - Anonymizes candidate PII (removes phone, email, address, website, social profiles) before prompt construction.
  - Connects to Featherless AI (`meta-llama/Meta-Llama-3.1-8B-Instruct`) or OpenAI (`gpt-4o-mini`) with JSON response mode.
  - Enforces strict 8-second timeout using `AbortController`.
  - Seamlessly falls back to `generateHeuristicTailor` on timeout, missing API keys, or upstream failure with `isFallback: true`.
  - Runs all suggestions and summaries through the deterministic Truth Guard before responding.
- **Commit:** `82dedd4 feat(phase-4): build heuristic tailor and POST /api/tailor endpoint`

---

## 3. Verification & Empirical Proof

| Verification Step | Command / Test | Result |
|---|---|---|
| **TypeScript & Build** | `npm run build` | Route `ƒ /api/tailor` compiled cleanly with 0 type errors |
| **Truth Guard Anti-Hallucination** | Executed against `defaultResumeDocument` | Flagged fabricated 77%, $8.5M, Cassandra, and Snowflake as `needs_confirmation`; passed verified 42%, 95ms, 450k as `verified` |
| **Heuristic Tailor Offline** | Executed with test JD | Generated 3 verified suggestions, 4 critic findings, and 1 verified summary comparison with `isFallback: true` |
| **POST /api/tailor Handler** | Tested simulated HTTP POST | Returned HTTP 200 with structured JSON and full fallback resilience |

---

## 4. Atomic Commits
1. `1f761e0`: `feat(phase-4): build AI types and deterministic truth guard`
2. `82dedd4`: `feat(phase-4): build heuristic tailor and POST /api/tailor endpoint`
