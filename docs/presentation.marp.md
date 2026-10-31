---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #0b0f19
color: #f1f5f9
style: |
  section {
    font-family: 'Inter', system-ui, sans-serif;
    padding: 40px;
    background-color: #0b0f19;
    color: #f1f5f9;
  }
  h1, h2, h3 {
    color: #ffffff;
    letter-spacing: -0.02em;
  }
  h1 { font-size: 2.2rem; }
  h2 { font-size: 1.6rem; color: #10b981; }
  h3 { font-size: 1.2rem; }
  p, li { font-size: 0.85rem; line-height: 1.45; color: #cbd5e1; }
  code {
    font-family: 'JetBrains Mono', monospace;
    background: #141b2d;
    color: #38bdf8;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  pre {
    background: #06080d;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 12px;
    font-size: 0.75rem;
  }
  table {
    font-size: 0.78rem;
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  th {
    background: #141b2d;
    color: #10b981;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 8px;
  }
  td {
    border: 1px solid rgba(255,255,255,0.08);
    padding: 8px;
    background: rgba(14,20,34,0.6);
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-family: monospace;
    font-weight: bold;
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border: 1px solid rgba(16,185,129,0.3);
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 12px;
  }
  .card {
    background: rgba(14, 20, 34, 0.75);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px;
  }
  footer {
    font-size: 0.65rem;
    color: #64748b;
    font-family: monospace;
  }
---

<!-- Slide 1 -->
<span class="badge">CBIT HACKTOBERFEST '26 • RESUME ARCHITECT TRACK</span>

# ResuArchitect AI
### Local-First, ATS-Certified Resume Architect & Deterministic Tailoring Studio

**Team Red flowers (TEAM-4)** &bull; Registration ID: `HFEST26-2P5XJ82R`
**Members:** Nawander Raghavendra (Lead), Nara Lakshmi Sankeerth, Navneet
**Institution:** International Institute of Information Technology, Hyderabad (IIIT-H)

<div class="card-grid">
  <div class="card">
    <strong style="color: #10b981; font-size: 1rem;">100% Local-First</strong><br/>
    <small>Zero DB &bull; PII remains strictly in browser</small>
  </div>
  <div class="card">
    <strong style="color: #06b6d4; font-size: 1rem;">&lt; 5ms Scoring</strong><br/>
    <small>Deterministic &bull; 400+ Taxonomy</small>
  </div>
  <div class="card">
    <strong style="color: #f59e0b; font-size: 1rem;">0% Hallucination</strong><br/>
    <small>Static Truth Guard &bull; Metric Grounding</small>
  </div>
</div>

---

<!-- Slide 2 -->
<span class="badge">INDUSTRY PROBLEM</span>

## The Three Systemic Failures of Modern Hiring
**75%+ of qualified candidates are silently rejected by Applicant Tracking Systems before a human reviews them.**

<div class="card-grid">
  <div class="card" style="border-left: 4px solid #f43f5e;">
    <strong style="color: #f43f5e;">1. The Parsing Trap</strong><br/>
    <p>Visual drag-and-drop builders use multi-column CSS tables and canvas frames. ATS linear parsers extract scrambled text streams (e.g. <i>"React 2022 Senior Developer Education"</i>).</p>
  </div>
  <div class="card" style="border-left: 4px solid #f59e0b;">
    <strong style="color: #f59e0b;">2. The Keyword Gap</strong><br/>
    <p>Candidates manually guess target keywords. Listing skills in a catalog without bullet evidence fails ATS ranking filters and lacks tier weighting.</p>
  </div>
  <div class="card" style="border-left: 4px solid #06b6d4;">
    <strong style="color: #06b6d4;">3. AI Hallucination & PII</strong><br/>
    <p>Generic LLM wrappers invent past employment numbers (<i>"increased revenue by $10M"</i>) and leak sensitive contact PII to cloud databases.</p>
  </div>
</div>

---

<!-- Slide 3 -->
<span class="badge">ARCHITECTURE PILLARS</span>

## System Overview & Architecture Pillars

* **Pillar 1: Local-First Privacy**
  * Full client-side execution via **Zustand** + browser `localStorage`.
  * Zero server-side candidate data storage; complete PII sovereignty.
* **Pillar 2: Deterministic Scorer (&lt; 5ms Latency)**
  * Curated **400+ skill taxonomy** across 8 engineering disciplines.
  * Bidirectional alias dictionary (`k8s` &harr; `Kubernetes`, `postgres` &harr; `PostgreSQL`).
* **Pillar 3: Algorithmic Truth Guard**
  * Deterministic static analysis gate. Inspects AI proposals for metric sign-flips, precision drifts, and ungrounded tools against Master Profile.
* **Pillar 4: Certified Dual ATS Exporters**
  * Native OpenXML DOCX (real headings, 9000-twip tab stops, zero tables).
  * Vector Print PDF (`jsPDF` / `@page A4` CSS) with 1-page auto-fit.

---

<!-- Slide 4 -->
<span class="badge">EXECUTION TOPOLOGY</span>

## End-to-End System Workflow Architecture

```
[Job URL / Pasted Text] ──► [SSRF-Protected Extractor (JSON-LD)] ──┐
                                                                    ▼
[Candidate Master Profile] ──► [Zustand Local Store] ──► [Deterministic Scorer (<5ms)]
                                        │                           ▼
                                        │                 [Coverage % Gauge]
                                        ▼
                   [/api/tailor (Bounded LLM / 8s Cap)]
                                        │
                                        ▼
                           [Algorithmic Truth Guard]
                                        │
                                        ▼
                         [Git-Style Diff Reviewer]
                                        │
                                        ▼
             [Live A4 Canvas / ATS Robot Inspector] ──► [Native DOCX & Vector PDF]
```

*Data flow runs 100% locally; network calls are strictly bounded and timeout-protected.*

---

<!-- Slide 5 -->
<span class="badge">SCORING ENGINE</span>

## Deterministic Scoring & 400+ Skill Taxonomy

### The Normalized Coverage Equation:
$$\text{Coverage \%} = \min\left(100, \left[\frac{\sum (\text{Weight} \times \text{EvidenceCredit})}{\sum \text{Weight}}\right] \times 100\right)$$

| Evidence Tier | Multiplier | Semantic Rule |
| :--- | :---: | :--- |
| **Work / Project Bullet Point** | **1.0x** | Proven applied engineering impact with measurable context |
| **Skills Catalog / Summary** | **0.6x** | Listed familiarity without active bullet evidence (anti-stuffing) |
| **Missing Requirement** | **0.0x** | Actionable gap highlighted for targeted candidate learning |

* **Tier Multipliers:** Must-Haves (`3.0x`), Preferred (`1.5x`), General (`1.0x`).
* **Greedy Token Subsumption:** Matches specific phrases like *"Spring Boot"* without falsely matching substring *"Spring Framework"*.

---

<!-- Slide 6 -->
<span class="badge">ETHICAL AI</span>

## Algorithmic Truth Guard: Preventing AI Hallucinations

**A 4-step static analysis gate intercepts ungrounded AI claims:**

1. **Grounded Entity Extraction:** Whitelists all tools, languages, and metrics in Master Profile.
2. **Metric & Precision Linter:** Flags newly invented numbers, sign-flips (`-20%` vs `20%`), and decimal drift (`99.9%` vs `99.99%`).
3. **Tool Guard:** Blocks tools the candidate never used.
4. **Qualitative & Envelope Guard:** Flags unearned claims (*"resilient architecture"*) on entry profiles; enforces strict **180-char** ATS line envelope.

```diff
+ [VERIFIED]: "Engineered Redis caching layer for merchant checkout, reducing p99 API latency by 42%."
- [FLAGGED]:  "Architected multi-region AWS Lambda microservices saving $1.4M annually with 99.99% uptime."
              (AWS Lambda not in profile; $1.4M fabricated; 99.99% ungrounded)
```

---

<!-- Slide 7 -->
<span class="badge">CO-PILOT OPTIMIZATION</span>

## Bounded AI Tailoring & Single-Bullet Co-Pilot

* **Google XYZ Impact Formula:**
  $$\text{"Accomplished [X], as measured by [Y], by doing [Z]"}$$
  * Front-loads high-impact action verbs from curated 30-verb taxonomy.
  * Ensures quantifiable result metrics are coupled with technical mechanism.

* **Bounded Execution & Offline Resilience:**
  * **Primary:** Single-turn Featherless/OpenAI LLM call with strict **8-second circuit breaker** and temperature `0.2`.
  * **Fallback:** Zero-delay Heuristic Engine (`heuristicTailor.ts`) runs 100% offline, guaranteeing unbroken live pitch demos.

* **Dynamic Score Delta Bump:**
  * Computes exact mathematical $\%$ increase for each proposal (e.g. `+18% Coverage`) before candidate accepts.

---

<!-- Slide 8 -->
<span class="badge">DOCUMENT COMPILATION</span>

## Dual ATS Export: Engineering Under the Hood

### 1. Native OpenXML DOCX Compiler (`docx-js`):
* Compiles valid binary `word/document.xml` packages directly in-browser.
* **True Heading Styles:** Employs real `Heading 1` & `Heading 2` for native outline trees.
* **Tab Stops (9000 twips):** Right-aligned dates and locations without hidden tables.
* **ZERO Tables:** Eliminates table-based parsing corruption in legacy ATS engines.

### 2. Vector Print PDF Engine (`jsPDF` / `@page A4`):
* Pure vector text stream (`%PDF-`) with exact geometric millimeter coordinates.
* **Selectable & Searchable:** 100% copy-pasteable for machine indexing.
* **Auto-Fit Algorithm:** Dynamically clamps spacing variables to fit single page without dropping or clipping lines.

---

<!-- Slide 9 -->
<span class="badge">SECURITY & INGESTION</span>

## SSRF-Protected Enterprise Job Scraper

**Perimeter Defense Architecture:**
* **Protocol & Host Filter:** Enforces HTTP/HTTPS; blocks `file://`, `ftp://`, and embedded credentials.
* **Private IP Filter:** Blocks loopback (`127.0.0.1`), RFC1918 ranges, and cloud metadata (`169.254.169.254`).
* **DNS Pre-Flight & Hard Pinning:** Pre-resolves hostname and binds outbound socket to verified public IP, preventing DNS rebinding attacks (`.nip.io`, `.sslip.io`).

**3-Tier Resilient Extraction:**
* **Tier 1 (JSON-LD Schema):** Parses `JobPosting` schema, handling `@graph` arrays.
* **Tier 2 (Semantic DOM):** Targets `<main>`, `<article>`, and filters tracking JSON bloat (Phenom `themeOptions`, `questionsApply`).
* **Tier 3 (Structural Post-Processor):** Reconstructs block linebreaks and isolates glued headings (`### Required Qualifications`).

---

<!-- Slide 10 -->
<span class="badge">USER EXPERIENCE</span>

## "View as ATS Robot" & Visual Studio

* **Obsidian Studio Workspace:**
  * Dark obsidian palette (`#08090d`, `#0e111a`, `#141824`) with razor borders.
  * Draggable layout divider with responsive presets (35% / 45% / 55%).
  * Real-time reactive A4 paper canvas with 60fps pan/zoom controls.

* **"View as ATS Robot" Inspector:**
  * Dedicated terminal diagnostic view showing the exact linearized plaintext parsed by bots.
  * Verifies reading-order integrity and proves absence of column scrambling to judges.

* **1-Click Auto-Fit:**
  * Mathematical line budget optimizer adjusting `--section-gap` and font scaling dynamically.

---

<!-- Slide 11 -->
<span class="badge">QUALITY ASSURANCE</span>

## Production Verification & Test Suite

### Metrics Dashboard:
* **38 / 38 Unit Tests Passing** across 12 comprehensive suites (100% pass rate).
* **&lt; 600ms Execution Time** via native `tsx`/`vitest` runner.
* **0 TypeScript & ESLint Errors** (`tsc --noEmit` clean on strict mode).
* **5 / 5 Production Routes** statically compiled via Next.js 14 App Router.

### Test Domains Verified:
1. Deterministic Scoring & 3.0x/1.5x/1.0x Tier Weighting
2. Bidirectional Alias Dictionary Normalization
3. Truth Guard Metric Precision, Sign-Flip & Tool Linter
4. OpenXML DOCX Tab-Stop & Heading Structure
5. Vector PDF Text Layer Extraction & Auto-Fit
6. SSRF IP Validation, DNS Rebinding & 3-Tier Scraper

---

<!-- Slide 12 -->
<span class="badge">CONCLUSION</span>

## Summary: The ResuArchitect AI Paradigm

* **100% Privacy-Preserving:**
  * Sensitive career histories and contact PII never touch external cloud databases.
* **Mathematically Explainable:**
  * Eliminates opaque LLM percentages with an auditable, sub-5ms evidence scoring formula.
* **Certified ATS Integrity:**
  * True linear reading order, zero table layout traps, and native vector exports.

---
### CBIT Hacktoberfest '26 &bull; Team Red flowers (TEAM-4)
**IIIT Hyderabad** &bull; Nawander Raghavendra, Nara Lakshmi Sankeerth, Navneet
