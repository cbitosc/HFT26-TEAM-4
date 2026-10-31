---
marp: true
theme: gaia
_class: lead
paginate: true
size: 16:9
backgroundColor: #f8fafc
color: #0f172a
style: |
  section {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    padding: 36px 50px;
    background-color: #f8fafc;
    color: #0f172a;
    font-size: 16px;
  }
  section.dark {
    background-color: #08090d;
    color: #f1f5f9;
  }
  section.dark h1, section.dark h2, section.dark h3 {
    color: #ffffff;
  }
  section.dark p, section.dark li {
    color: #cbd5e1;
  }
  h1 {
    font-size: 2.2rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
    margin-bottom: 0.2rem;
  }
  h2 {
    font-size: 1.45rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-bottom: 0.6rem;
  }
  .kicker {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #059669;
    margin-bottom: 0.2rem;
  }
  section.dark .kicker {
    color: #10b981;
  }
  .card-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
  .card-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-top: 16px;
  }
  .card-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 16px;
  }
  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  section.dark .card {
    background: #0e111a;
    border: 1px solid #252d43;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .card-num {
    font-size: 1.1rem;
    font-weight: 800;
    color: #059669;
    margin-bottom: 4px;
  }
  .card-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }
  section.dark .card-title {
    color: #ffffff;
  }
  .card-sub {
    font-size: 0.75rem;
    font-weight: 600;
    color: #059669;
    margin-bottom: 8px;
  }
  .card-text {
    font-size: 0.78rem;
    line-height: 1.4;
    color: #475569;
  }
  section.dark .card-text {
    color: #94a3b8;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 0.68rem;
    font-family: monospace;
    font-weight: 700;
  }
  .badge-emerald { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-slate { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    margin-top: 10px;
  }
  th {
    background: #0f172a;
    color: #ffffff;
    padding: 8px 10px;
    text-align: left;
    font-weight: 700;
  }
  td {
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
  }
  .highlight-banner {
    background: #0f172a;
    color: #ffffff;
    border-radius: 10px;
    padding: 12px 18px;
    margin-top: 14px;
  }
  footer {
    font-size: 0.65rem;
    color: #64748b;
  }
---

<!-- _class: dark -->
<!-- _paginate: false -->

<div class="kicker">CBIT HACKTOBERFEST '26 • GENERAL TRACK • TEAM-4</div>

# ResuArchitect AI

### Deterministic ATS Resume Architecture & Bounded AI Tailoring Studio

<div style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px; margin-bottom: 24px;">
High-precision resume compilation with zero hallucinations, sub-2ms match scoring, and dual client-side native exports.
</div>

<div class="card-grid-3">
  <div class="card">
    <div class="card-title" style="color: #10b981;">Sub-2ms Deterministic Scorer</div>
    <div class="card-text">
      • 400+ Curated Skills & 150+ Aliases<br/>
      • 1.0x Bullet vs 0.6x Skill evidence model<br/>
      • Zero LLM scoring drift (Strictly idempotent)
    </div>
  </div>
  <div class="card">
    <div class="card-title" style="color: #10b981;">Bounded Code Truth Guard</div>
    <div class="card-text">
      • Pre-view static regex & set difference<br/>
      • Flags fabricated metrics & unverified tools<br/>
      • Prevents resume inflation disqualification
    </div>
  </div>
  <div class="card">
    <div class="card-title" style="color: #10b981;">100% Local-First Privacy</div>
    <div class="card-text">
      • Zero-DB browser localStorage persistence<br/>
      • Native Vector PDF + OpenXML Word .docx<br/>
      • Zero candidate PII ingress to cloud servers
    </div>
  </div>
</div>

<div style="margin-top: 24px; font-size: 0.72rem; color: #64748b;">
Team Red flowers • Lead: Nawander Raghavendra | Members: Nara Lakshmi Sankeerth, Navneet • Repo: cbitosc/HFT26-TEAM-4
</div>

---

<div class="kicker">The Recruitment Funnel Dilemma</div>

## 75% of Qualified Candidates Filtered Out Before Human Review

<div class="card-grid-4">
  <div class="card">
    <div class="card-num" style="color: #d97706;">01</div>
    <div class="card-title">The Parsing Trap</div>
    <div class="card-sub">Graphical & Table Flaws</div>
    <div class="card-text">
      Canva-style visual builders emit multi-column tables, text frames, and SVG icons. Automated ATS extractors scramble them into unreadable character soup.
    </div>
  </div>
  <div class="card">
    <div class="card-num">02</div>
    <div class="card-title">The Keyword Gap</div>
    <div class="card-sub">Blind Requirement Matching</div>
    <div class="card-text">
      Candidates manually guess target keywords. Lack of visibility into Must-Haves vs Preferred qualifications leads to silent ATS rejection.
    </div>
  </div>
  <div class="card">
    <div class="card-num" style="color: #d97706;">03</div>
    <div class="card-title">The Hallucination Hazard</div>
    <div class="card-sub">Unbounded Generative AI</div>
    <div class="card-text">
      Chatbots invent metrics ("grew revenue by 35%") and fabricate tools the candidate never used, causing immediate disqualification in technical interviews.
    </div>
  </div>
  <div class="card">
    <div class="card-num">04</div>
    <div class="card-title">The Privacy & Paywall Trap</div>
    <div class="card-sub">Predatory Monetization</div>
    <div class="card-text">
      Platforms lock downloads behind $29 subscription paywalls after hours of editing, while harvesting candidate PII into recruiter databases.
    </div>
  </div>
</div>

---

<div class="kicker">System Topology & Data Flow</div>

## 100% Local-First Engine with Zero Database & Zero PII Ingress

<div class="card-grid-4">
  <div class="card">
    <div class="card-sub">STAGE 1: INGESTION</div>
    <div class="card-title">Profile & JD Input</div>
    <div class="card-text">
      • Form editor + 3 production presets<br/>
      • Pasted text or SSRF-protected URL<br/>
      • Browser localStorage; Zero cloud DB
    </div>
  </div>
  <div class="card">
    <div class="card-sub">STAGE 2: SCORING</div>
    <div class="card-title">Deterministic Engine</div>
    <div class="card-text">
      • 400+ skill taxonomy & alias dictionary<br/>
      • 1.0x Bullet vs 0.6x Skill weighting<br/>
      • Real-time circular SVG progress gauge
    </div>
  </div>
  <div class="card">
    <div class="card-sub">STAGE 3: TAILORING</div>
    <div class="card-title">Bounded AI Pipeline</div>
    <div class="card-text">
      • Google XYZ bullet optimization<br/>
      • Code Truth Guard static audit<br/>
      • Git-style diff reviewer with shields
    </div>
  </div>
  <div class="card">
    <div class="card-sub">STAGE 4: EXPORT</div>
    <div class="card-title">Dual AST Compilers</div>
    <div class="card-text">
      • OpenXML .docx with Heading 1/2<br/>
      • Vector-text PDF with exact A4 bounds<br/>
      • "View as ATS Robot" plaintext console
    </div>
  </div>
</div>

<div class="highlight-banner">
  <div style="font-weight: 700; font-size: 0.85rem; color: #10b981; margin-bottom: 2px;">CORE ARCHITECTURAL INVARIANT: COMPLETE DATA RESIDENCY</div>
  <div style="font-size: 0.75rem; color: #e2e8f0;">
    All resume state, scoring algorithms, and binary file compilation execute 100% on the candidate's device in client-side TypeScript. No candidate PII is ever sent to external databases or stored without explicit consent.
  </div>
</div>

---

<div class="kicker">The Match Algorithm</div>

## Deterministic Mathematical Precision Replaces Flaky LLM Guesswork

<div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 20px; margin-top: 14px;">
  <div>
    <table>
      <thead>
        <tr>
          <th>Evaluation Dimension</th>
          <th style="color: #10b981;">ResuArchitect Deterministic</th>
          <th style="color: #f59e0b;">Flaky LLM Scoring</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Execution Latency</b></td>
          <td><b>&lt; 2 ms</b> (Instantaneous)</td>
          <td>8,000 – 15,000 ms (High lag)</td>
        </tr>
        <tr>
          <td><b>Idempotency</b></td>
          <td><b>100% Stable</b>: <code>f(f(x)) === f(x)</code></td>
          <td>Non-deterministic (±20% drift)</td>
        </tr>
        <tr>
          <td><b>Compute Cost</b></td>
          <td><b>$0.00</b> (Client-side JS)</td>
          <td>$0.03+ per keystroke (API burn)</td>
        </tr>
        <tr>
          <td><b>Explainability</b></td>
          <td><b>Exact keyword delta</b> &amp; tier list</td>
          <td>Vague summary without proof</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="card" style="padding: 14px;">
    <div class="card-title" style="color: #059669; font-size: 0.88rem;">EVIDENCE WEIGHTING FORMULA</div>
    <div class="card-text" style="font-size: 0.74rem; line-height: 1.45;">
      • <b>1.0x Full Credit:</b> Skill proven in Experience / Project bullets.<br/>
      • <b>0.6x Partial Credit:</b> Listed in Skills block without bullet proof.<br/>
      • <b>0.0x Zero Credit:</b> Missing requirement or hidden item.<br/>
      • <b>60% / 40% Tiering:</b> Must-Haves (60%) vs Preferred (40%).<br/>
      • <b>150+ Aliases:</b> <code>K8s</code> ↔ <code>Kubernetes</code>, <code>Postgres</code> ↔ <code>PostgreSQL</code>.
    </div>
  </div>
</div>

---

<div class="kicker">Anti-Hallucination Architecture</div>

## Bounded 3-Stage Co-Pilot Eliminates Invented Metrics & Tools

<div class="card-grid-3">
  <div class="card">
    <div class="card-num">STAGE 1</div>
    <div class="card-title">Deterministic JD Parser</div>
    <div class="card-text">
      Extracts canonical keywords &amp; requirement tiers before any generative invocation. Bounded scope ensures zero model drift.
    </div>
  </div>
  <div class="card">
    <div class="card-num" style="color: #059669;">STAGE 2</div>
    <div class="card-title">Google XYZ Bullet Rewriter</div>
    <div class="card-text">
      Transforms passive bullets into Google's structure:<br/>
      <em>"Accomplished [X], as measured by [Y], by doing [Z]"</em> with target JD keywords.
    </div>
  </div>
  <div class="card">
    <div class="card-num" style="color: #d97706;">STAGE 3</div>
    <div class="card-title">Code Truth Guard &amp; Critic</div>
    <div class="card-text">
      Static regex and set-difference audit. Validates candidate tools and numbers against original text before rendering diffs.
    </div>
  </div>
</div>

<div class="card" style="margin-top: 14px; padding: 12px 16px;">
  <div style="font-weight: 700; font-size: 0.8rem; color: #0f172a; margin-bottom: 6px;">TRUTH GUARD CLASSIFICATION STATES</div>
  <div style="font-size: 0.74rem; line-height: 1.5; color: #334155;">
    <span class="badge badge-emerald">[VERIFIED GROUNDED]</span> <b>Green Shield:</b> All tools, numbers, and metrics exist in verified profile. Safe to apply.<br/>
    <span class="badge badge-amber">[NEEDS CONFIRMATION]</span> <b>Amber Shield:</b> Qualitative enhancement or phrasing adjustment lacking explicit baseline.<br/>
    <span class="badge" style="background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;">[UNGROUNDED CLAIM]</span> <b>Red Alert:</b> Invented tools or fabricated metrics detected. Automatically blocked.
  </div>
</div>

---

<div class="kicker">Studio User Interface & Workflow</div>

## Split-Screen Precision Studio with Real-Time Score Delta Feedback

<div class="card-grid-3">
  <div class="card">
    <div class="card-title">Left Control Pane (50%)</div>
    <div class="card-sub">Tactile Form &amp; Diff Controls</div>
    <div class="card-text">
      • Segmented card blocks with emerald focus rings<br/>
      • Instant <code>+ Add to Skills</code> 1-click gap injection<br/>
      • Git-style Diff Reviewer with side-by-side comparison<br/>
      • Drag-and-drop section reordering
    </div>
  </div>
  <div class="card">
    <div class="card-title">Center Precision Divider</div>
    <div class="card-sub">Keyboard-Accessible Splitter</div>
    <div class="card-text">
      • Seamless cursor-col-resize drag handle<br/>
      • <code>ArrowLeft</code> / <code>ArrowRight</code> keyboard stepping<br/>
      • Double-click instant reset to 50/50 balance<br/>
      • Floating split-percentage readout chip
    </div>
  </div>
  <div class="card">
    <div class="card-title">Right Live Studio (50%)</div>
    <div class="card-sub">Floating A4 Paper Canvas</div>
    <div class="card-text">
      • Ambient studio dot grid (<code>.studio-grid-bg</code>)<br/>
      • 60 FPS live reactive updates on every keystroke<br/>
      • Glassmorphic zoom toolbar (75% to 120% scale)<br/>
      • Dynamic 1-Page Layout Auto-fit constraint bounds
    </div>
  </div>
</div>

<div class="card" style="margin-top: 14px; padding: 10px 16px;">
  <div style="font-size: 0.75rem; color: #059669; font-weight: 600;">
    <b>Framer Motion Micro-Interactions:</b> Spring tab indicators (stiffness: 380, damping: 30) • Floating <code>+4% Coverage</code> animated delta badges • Dynamic circular SVG gauge with glowing filters • Tabular numerals preventing layout jitter.
  </div>
</div>

---

<div class="kicker">Verified Document Generation</div>

## Dual Native Exporters & Real-Time ATS Robot Inspector

<div class="card-grid-3">
  <div class="card">
    <div class="card-title">Native OpenXML Word DOCX</div>
    <div class="card-sub">Office OpenXML XML Binaries</div>
    <div class="card-text">
      • Programmatically constructed with <code>docx</code><br/>
      • True semantic <code>Heading 1</code> &amp; <code>Heading 2</code><br/>
      • Right-aligned tab-stops for dates &amp; locations<br/>
      • Genuine bullet runs; recruiters can edit in Word
    </div>
  </div>
  <div class="card">
    <div class="card-title">Native Vector-Text PDF</div>
    <div class="card-sub">jsPDF Coordinate Engine</div>
    <div class="card-text">
      • Exact coordinate drawing with <code>@page A4</code><br/>
      • Clean selectable, copyable vector typography<br/>
      • Preserves exact line-height &amp; margin bounds<br/>
      • Eliminates OCR errors common in canvas tools
    </div>
  </div>
  <div class="card">
    <div class="card-title">"View as ATS Robot" Terminal</div>
    <div class="card-sub">Linearized Diagnostic View</div>
    <div class="card-text">
      • Authentic developer terminal chrome<br/>
      • Traffic-light window controls (red/yellow/green)<br/>
      • Shows raw character stream parsed by robots<br/>
      • Proves linear reading order before applying
    </div>
  </div>
</div>

---

<div class="kicker">Security & Production Resilience</div>

## Enterprise Security Hardening with 100% Offline Fallback Failsafe

<div class="card-grid-3">
  <div class="card">
    <div class="card-title">SSRF Defense in Scraping</div>
    <div class="card-sub">Multi-Layer URL Guard</div>
    <div class="card-text">
      • Whitelists <code>http:</code> and <code>https:</code> only<br/>
      • Pre-resolves DNS to prevent rebinding attacks<br/>
      • Blocks loopback, RFC1918, and <code>169.254.169.254</code><br/>
      • Enforces 5s timeout &amp; 1MB payload ceiling
    </div>
  </div>
  <div class="card">
    <div class="card-title">Autonomous Boundary Matrix</div>
    <div class="card-sub">86/86 Passing Automated Tests</div>
    <div class="card-text">
      • Fuzzed with null bytes, emojis, RTL scripts<br/>
      • Stress-tested with 25,000-character JDs<br/>
      • Math invariant verified: score bounded in [0, 100]<br/>
      • Strict idempotency verified across runs
    </div>
  </div>
  <div class="card">
    <div class="card-title">Offline Heuristic Failsafe</div>
    <div class="card-sub">Zero Single-Point-of-Failure</div>
    <div class="card-text">
      • Complete client-side rule engine<br/>
      • Functions 100% offline without external API keys<br/>
      • Instant zero-latency fallback during network cut<br/>
      • Guaranteed flawless live hackathon demo
    </div>
  </div>
</div>

---

<!-- _class: dark -->
<!-- _paginate: false -->

<div class="kicker">Executive Summary & Demo Roadmap</div>

## ResuArchitect AI: Deterministic Precision Meets Modern Design

<div class="card-grid-2">
  <div class="card">
    <div class="card-title" style="color: #10b981;">THREE CORE STRATEGIC PILLARS</div>
    <div class="card-text" style="font-size: 0.8rem; line-height: 1.5;">
      <b>1. Verifiable Mathematical Scoring:</b> Sub-2ms evidence weighting (1.0x vs 0.6x) replaces arbitrary LLM guesswork with reproducible precision.<br/><br/>
      <b>2. Algorithmic Truth Guard:</b> Code-level regex and set validation prevents fabricated metrics or unverified tools before candidate review.<br/><br/>
      <b>3. Dual Client-Side Native Compilation:</b> 100% on-device vector PDF and OpenXML .docx generation ensures complete data privacy and zero paywalls.
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="color: #10b981;">LIVE DEMONSTRATION WORKFLOW</div>
    <div class="card-text" style="font-size: 0.76rem; line-height: 1.45;">
      <span class="badge badge-emerald">STEP 1</span> Load Preset: Alex Rivera (Senior SWE) + Stripe Full-Stack JD<br/>
      <span class="badge badge-emerald">STEP 2</span> Sub-2ms Match Scoring: Inspect Must-Have vs Preferred coverage<br/>
      <span class="badge badge-emerald">STEP 3</span> 1-Click Skill Injection: Add missing 'Kubernetes' skill (+6% surge)<br/>
      <span class="badge badge-emerald">STEP 4</span> Bounded AI Tailoring: Before/After diffs with Truth Guard badges<br/>
      <span class="badge badge-emerald">STEP 5</span> Single-Bullet Co-Pilot: Google XYZ optimization modal<br/>
      <span class="badge badge-emerald">STEP 6</span> ATS Robot Terminal: Inspect raw linearized text stream<br/>
      <span class="badge badge-emerald">STEP 7</span> Dual One-Click Export: Generate native OpenXML .docx &amp; vector PDF
    </div>
  </div>
</div>

<div style="text-align: center; margin-top: 24px; font-size: 0.85rem; font-weight: 700; color: #10b981;">
Team Red flowers (TEAM-4) • Thank You &amp; Open for Q&amp;A
</div>
