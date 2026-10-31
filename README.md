# 🎯 ResuArchitect AI — Interactive ATS Resume Architect & Tailoring Studio

> **CBIT Hacktoberfest '26 — Official Submission Repository**  
> *Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad*

[![Build & Typecheck](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=nextdotjs)](https://github.com/cbitosc/HFT26-TEAM-4)
[![Tests Passing](https://img.shields.io/badge/Tests-86%2F86%20Passing-emerald?style=for-the-badge&logo=vitest)](https://github.com/cbitosc/HFT26-TEAM-4)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Local First](https://img.shields.io/badge/Privacy-100%25%20Local--First-purple?style=for-the-badge)](docs/ARCHITECTURE.md)
[![Design System](https://img.shields.io/badge/Design%20System-Linear%20%7C%20Vercel%20%7C%20Raycast-black?style=for-the-badge)](https://github.com/cbitosc/HFT26-TEAM-4)

---

## 👥 Official Team & Submission Information

| Attribute | Details |
| :--- | :--- |
| **Team Name** | **Red flowers** |
| **Team Number** | `TEAM-4` (`HFT26-TEAM-4`) |
| **Registration ID** | `HFEST26-2P5XJ82R` |
| **Problem Track** | **AI-Powered Resume Architect & Interactive Tailoring Studio** |
| **Domain** | **General Track** |
| **Team Leader** | Nawander Raghavendra (`rnn.2777@gmail.com`) — IIIT Hyderabad |
| **Institution** | International Institute of Information Technology, Hyderabad (IIIT-H) |
| **Submission Branch** | `feature/prototype` |
| **Target PR Title** | `[SUBMISSION] TEAM-4 - Red flowers - Track Selection in Progress` |

### 👥 Registered Team Members

| # | Name | Email | Institution | Role |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Nawander Raghavendra** | `rnn.2777@gmail.com` | IIIT Hyderabad | Team Lead & Core Architecture |
| 2 | **Nara Lakshmi Sankeerth** | `raghavendra.nawander@students.iiit.ac.in` | IIIT Hyderabad | Frontend & Studio Design Systems |
| 3 | **Navneet** | `raghavendranavneetnawander@gmail.com` | IIIT Hyderabad | AI Engines, Truth Guard & Verification |

---

## 🎯 Problem Statement

Over 75% of qualified job seekers are silently filtered out by Applicant Tracking Systems (ATS) like Workday, Taleo, Greenhouse, Lever, and Ashby before human recruiters ever review their applications. This breakdown happens due to three systemic industry problems:

1. **The Parsing Trap**: Resumes designed on modern drag-and-drop graphic builders use multi-column CSS tables, text frames, floating canvas graphics, and non-standard symbols that turn into unreadable garbage when processed by linear ATS text extractors.
2. **The Keyword Alignment Gap**: Candidates fail to map their authentic achievements to the exact terminology, must-have qualifications, and impact metrics demanded by target Job Descriptions (JDs).
3. **The LLM Hallucination Hazard**: Unconstrained generative AI tools invent past employment metrics (e.g., *"Grew revenue by $10M"*), fabricate technologies the candidate never touched, and compromise candidate privacy by sending personal data to untrusted cloud databases.

---

## 💡 The ResuArchitect AI Solution

**ResuArchitect AI** is an intelligent, **local-first, privacy-preserving resume architecture platform** that bridges the gap between candidate qualifications and target job requirements with zero hallucinations and certified ATS formatting.

- 🔒 **100% Local-First & Zero-DB**: Candidate profile data lives entirely in browser `localStorage`. No candidate PII is sent to external databases or stored without consent.
- ⚡ **Sub-2ms Deterministic Match Scoring**: Evaluates candidate coverage across a built-in taxonomy of **400+ tech skills** with an alias dictionary (`K8s` $\leftrightarrow$ `Kubernetes`, `Postgres` $\leftrightarrow$ `PostgreSQL`) using an empirical weighted evidence formula.
- 🛡️ **Bounded AI Tailor with Algorithmic Truth Guard**: Proposes tailored summary and Google XYZ bullet rewrites, gated by a **deterministic code truth guard** that automatically flags ungrounded tools or fabricated metrics before candidate approval.
- 📄 **Certified Dual ATS Export Engine**: One-click generation of native **OpenXML `.docx`** (authentic `Heading 1`, `Heading 2`, right-aligned tab stops, standard bullet points) and **crisp vector print `.pdf`** (`@page A4`).
- 🤖 **"View as ATS Robot" Inspector**: A real-time diagnostic terminal view that strips all visual styling to show the exact linearized plain-text stream and sequential reading order parsed by ATS robots.
- 🌐 **SSRF-Protected Public Job URL Reader**: Ingests job postings from Greenhouse, Lever, and public career pages with strict SSRF defense (blocking private/localhost IPs, cloud metadata, and DNS rebinding) and clean fallback to manual paste.
- 🎨 **Elevated Linear/Vercel/Raycast Studio v2.2**: Obsidian dark surfaces (`#08090D`, `#0E111A`), razor-sharp translucent borders, Framer Motion spring physics, dynamic circular SVG score gauge, studio dot-grid canvas, and keyboard-accessible split-screen divider.

---

## 📁 Recommended Project Structure

```text
.
├── docs/                                    # Documentation, architecture diagrams, slides & guides
│   ├── ARCHITECTURE.md                      # Comprehensive system design & scoring math proof
│   ├── ResuArchitect_AI_Project_Guide.pdf   # Complete 4-page Executive & Engineering PDF Field Guide
│   ├── ResuArchitect_AI_Pitch_Deck.pptx     # 16:9 Hackathon Presentation Slide Deck
│   └── presentation.marp.md                 # Marp Markdown source for presentation slides
├── public/                                  # Static icons and assets
├── src/                                     # Complete Source Code
│   ├── app/                                 # Next.js 14 App Router (pages & serverless API routes)
│   │   ├── api/optimize-bullet/             # Single-bullet Google XYZ optimizer API
│   │   ├── api/scrape-jd/                   # SSRF-protected multi-tier job scraper API
│   │   ├── api/tailor/                      # Bounded AI tailoring API with Truth Guard gate
│   │   ├── globals.css                      # Obsidian theme, print styles, studio dot grid
│   │   ├── layout.tsx                       # Root layout & dark mode baseline
│   │   └── page.tsx                         # Studio split-screen editor & canvas layout
│   ├── components/                          # Elevated UI Components
│   │   ├── editor/                          # Profile, experience, projects, skills, themes
│   │   ├── feedback/                        # ScoreDeltaToast & notifications
│   │   ├── navbar/                          # Header, preset selectors, theme toggle, export buttons
│   │   ├── preview/                         # Live A4 ResumeCanvas & AtsRobotView terminal
│   │   ├── scoring/                         # JdScoringPanel with circular SVG progress gauge
│   │   └── tailor/                          # DiffReviewer & DiffCard with Truth Guard badges
│   └── lib/                                 # Core Algorithms & Engines
│       ├── ai/                              # Truth Guard, heuristic tailor, bullet optimizer
│       ├── export/                          # Client-side native jsPDF vector & docx OpenXML engines
│       ├── presets/                         # 3 production-grade candidate profiles & authentic JDs
│       ├── schema/                          # Zod schemas for resumes, JDs, and layout order
│       ├── scoring/                         # 400+ skill taxonomy, alias map, deterministic scorer
│       ├── scraper/                         # SSRF validation & multi-tier HTML/JSON-LD extractor
│       └── store/                           # Zustand store with variants, hiding & backup/restore
├── tests/                                   # Automated Test Suites (86 tests across 17 suites)
│   ├── boundaryMatrix.test.ts               # Autonomous boundary tests (nulls, extremes, 25k chars)
│   ├── docxExport.test.ts                   # OpenXML DOCX document generation tests
│   ├── pdfExport.test.ts                    # Vector PDF compilation & auto-fit tests
│   ├── runAll.ts                            # Test runner entrypoint
│   ├── scoring.test.ts                      # Deterministic parser & weighted evidence tests
│   ├── truthGuard.test.ts                   # Tool/metric verification & anti-hallucination tests
│   ├── urlScraper.test.ts                   # SSRF defense, JSON-LD, and Phenom scraper tests
│   └── variantsAndStore.test.ts             # Variant management & backup roundtrip tests
├── .env.example                             # Environment variable template
├── LICENSE                                  # MIT Open-Source License
├── next.config.mjs                          # Next.js configuration (security hardening)
├── package.json                             # Dependencies & scripts
├── tailwind.config.ts                       # Tailwind configuration with custom obsidian tokens
└── README.md                                # Official project documentation & presentation
```

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph INGEST["1. Data Ingestion"]
        P["Candidate Master Profile\n(Form Editor / 3 Presets)"] --> STORE["Zustand Master Store\n(localStorage / Zero DB)"]
        JD_TEXT["Target Job Description\n(Pasted Text)"] --> STORE
        JD_URL["Public Job URL\n(Greenhouse/Lever)"] --> SSRF["SSRF-Protected Scraper\n(/api/scrape-jd)"]
        SSRF --> STORE
    end

    subgraph SCORING["2. Deterministic Scoring (<2ms)"]
        STORE --> SCORER["Deterministic Scorer\n(deterministicScorer.ts)"]
        TAXONOMY["400+ Curated Skill Taxonomy"] --> SCORER
        ALIAS["Bidirectional Alias Dictionary"] --> SCORER
        SCORER --> GAUGE["Real-Time Coverage Gauge\n• 1.0x Bullet Evidence\n• 0.6x Skills List\n• 0.0x Missing Gaps"]
    end

    subgraph TAILOR["3. Bounded AI & Truth Guard"]
        STORE --> TAILOR_API["AI Tailor (/api/tailor)\nAnonymized PII / 8s Cap"]
        TAILOR_API --> ENGINE_CHECK{"API Key Present?"}
        ENGINE_CHECK -->|Yes| LLM["Featherless / OpenAI API"]
        ENGINE_CHECK -->|No / Timeout| OFFLINE["Offline Heuristic Engine\n(100% Offline Resilience)"]
        LLM --> TG["Deterministic Truth Guard Gate\n(Static Analysis)"]
        OFFLINE --> TG
        TG --> DIFFS["Git-Style Diff Reviewer\n• Green Shield: Grounded Fact\n• Amber Shield: Flagged Claim"]
        DIFFS -->|Accept / Edit| STORE
    end

    subgraph OUTPUT["4. Studio & Dual ATS Exports"]
        STORE --> CANVAS["Live A4 Canvas\n(60 FPS / 1-Page Auto-Fit)"]
        STORE --> ROBOT["ATS Robot View\n(Linearized Text Preview)"]
        STORE --> DOCX["Native OpenXML Exporter\n(.docx Word Document)"]
        CANVAS --> PDF["Vector Print Engine\n(.pdf Searchable Document)"]
    end
```

> 📖 **Deep Dive**: For full schema definitions, mathematical scoring proofs, and security architecture, read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/ResuArchitect_AI_Project_Guide.pdf](docs/ResuArchitect_AI_Project_Guide.pdf).

---

## ✨ Key Features & Technical Highlights

### 1. Split-Screen Interactive Visual Studio (Linear/Raycast Aesthetic)
- **Left Pane**: Dynamic studio tabs for Profile Editor, JD & Match Scoring, AI Tailor Diffs, Section Reorder, and Theme Customization.
- **Right Pane**: Instant 60 FPS live A4 canvas preview with zoom controls (75% to 120%), theme switching, and instant toggle to **"View as ATS Robot"**.
- **Keyboard-Accessible Splitter**: Precision divider with arrow-key stepping and double-click reset to 50/50.

### 2. 3 Production-Grade Master Presets & Target JDs
- **Alex Rivera**: Senior Full-Stack Engineer paired with an authentic *Stripe Senior Full-Stack Job Description*.
- **Dr. Elena Vance**: Senior Machine Learning Engineer paired with an authentic *Google Staff ML Engineer Job Description*.
- **Marcus Chen**: Senior Technical Product Manager paired with an authentic *Airbnb Platform PM Job Description*.

### 3. Deterministic JD Coverage Matrix
- **Empirical Evidence Formula**: Awards 1.0x credit for skills proven in experience/project bullets, 0.6x credit for skills only listed in skills catalog, and 0.0x for missing gaps.
- **Requirement Tiering**: Classifies requirements into Must-Haves (60% weight) vs. Preferred Qualifications (40% weight).
- **1-Click Skill Injection**: Amber gap badges feature an instant `+ Add to Skills` button that reactively updates the master resume and boosts coverage score in real time.

### 4. Bounded AI Tailor & Algorithmic Truth Guard
- **Zero Hallucination Guarantee**: The deterministic Truth Guard statically inspects every suggested rewrite for ungrounded tools or fabricated metrics not present in the master profile.
- **Git-Style Diff Reviewer**: Side-by-side Before/After diffs with keyword badges, green verified shields, amber verification alerts, inline editing, and bulk *"Accept All Verified"* action.
- **Single-Bullet Google XYZ Co-Pilot**: Integrated `"✨ Optimize"` button on every experience and project bullet, synthesizing Google's formula: *"Accomplished [X], as measured by [Y], by doing [Z]"*.

### 5. Dual ATS Document Generation
- **Native OpenXML `.docx`**: Uses the `docx` library to construct true Word document hierarchies with `HeadingLevel.HEADING_1`, `HeadingLevel.HEADING_2`, right-aligned tab stops for dates, and genuine bullet point runs.
- **Vector Print `.pdf`**: Clean `@page A4` vector output with selectable text and isolated print styling via `jsPDF`.
- **1-Page Auto-Fit Engine**: Dynamic CSS clamping (`--section-gap`, `--bullet-gap`, and font scale) that automatically constraints content to fit a single page.

### 6. SSRF-Safe Public Job URL Reader
- Scrapes job postings from public URLs (Greenhouse, Lever, Microsoft Phenom, etc.) with multi-layer SSRF protection:
  - Whitelists only `http:` and `https:`.
  - Blocks loopback (`127.0.0.0/8`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), cloud metadata (`169.254.169.254`), and IPv6 loopback (`::1`).
  - Pre-resolves DNS records via `dns.promises.lookup` to prevent DNS rebinding attacks.
  - Automatically parses JSON-LD `@type: JobPosting`, Next.js hydration props, and semantic DOM containers.

---

## 🚀 Local Setup & Installation

Follow these steps to run ResuArchitect AI locally on your development machine:

### Prerequisites
- **Node.js**: `v18.17.0` or higher (Node.js 20+ LTS recommended)
- **npm**: `v9.0.0` or higher
- **Git**: Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/rnn27/HFT26-TEAM-4.git
cd HFT26-TEAM-4
git checkout feature/prototype
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
ResuArchitect AI includes a built-in **Offline Heuristic Engine** and works **100% offline out-of-the-box** without any API keys. If you wish to connect an external LLM for tailoring:

```bash
cp .env.example .env.local
```

Add your preferred provider credentials to `.env.local`:
```env
# Optional: Featherless or OpenAI API credentials
FEATHERLESS_API_KEY="your-featherless-api-key"
# OR
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Launch the Server

**Development Mode (with hot-reload):**
```bash
npm run dev
```

**Production Mode (optimized build):**
```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the ResuArchitect AI Studio.

### 5. Run the Autonomous Test Suite
Execute the fast automated unit and boundary test suite (**86 tests across 17 suites**):
```bash
npm test
```

### 6. Verify Static Types
```bash
npm run typecheck
```

---

## 🎬 3-Minute Demo Video Walkthrough Script

Use this structured scene-by-scene script when recording your 3-minute hackathon evaluation video:

| Time | Scene | Action & Narration | Key Visual |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:30** | **The ATS Problem & Solution Overview** | *"Recruiters receive hundreds of resumes, but 75% are filtered out by ATS due to parsing glitches and keyword gaps. Meet ResuArchitect AI — a privacy-first, local-first studio that tailors resumes deterministically with zero hallucinations."* | Show Home Studio, split-screen layout, and load preset: **Alex Rivera (Senior SWE)**. |
| **0:30 - 1:00** | **Deterministic Scoring & Gap Engine** | *"Watch the JD Coverage Matrix in action. We select the Stripe Senior Full-Stack JD. In less than 2 milliseconds, our deterministic engine analyzes 400+ tech skills. Notice the circular gauge showing 68% match with weighted evidence. Click '+ Add to Skills' on Kubernetes — the score jumps instantly to 74%."* | Click Stripe preset, inspect Must-Have vs. Preferred badges, and click `+ Add to Skills`. |
| **1:00 - 1:40** | **Bounded AI Tailoring & Truth Guard** | *"Now we navigate to the AI Tailor. Unlike generic chatbots that hallucinate fake metrics, ResuArchitect AI uses an algorithmic Truth Guard. Notice the Git-style Diff Reviewer: verified facts get a green shield, while unverified claims get flagged with an amber warning. We click 'Accept All Verified' — our resume is tailored safely."* | Switch to AI tab, trigger tailor, show Before/After diff card with Green/Amber shields, and accept diffs. |
| **1:40 - 2:10** | **Single-Bullet Google XYZ Co-Pilot** | *"In the Experience tab, click '✨ Optimize' on any bullet. Our co-pilot converts weak bullets into high-impact Google XYZ statements ('Accomplished [X] measured by [Y] by doing [Z]'). The floating Score Delta chip shows real-time progress."* | Click '✨ Optimize', show the comparison modal with target keywords, and apply the optimized bullet. |
| **2:10 - 2:40** | **Visual Studio & ATS Robot View** | *"On the right canvas, customize fonts, scale, and theme: Modern Minimalist, Executive Ivy, or Clean Tech. Toggle '1-Page Auto-Fit' to dynamically clamp margins. Now click 'View as ATS Robot' — see exactly how ATS parsers read your resume in linear order without formatting errors."* | Switch themes, toggle ATS Robot View to show raw text and parser badges. |
| **2:40 - 3:00** | **Dual Export & Wrap-Up** | *"Finally, click Export. ResuArchitect AI exports native OpenXML .docx with authentic Word headings and right-aligned date tabs, plus a selectable vector PDF. 100% local-first, zero DB, zero hallucinations. Built by Team Red flowers for CBIT Hacktoberfest '26."* | Click DOCX export and PDF export, showing generated documents. |

---

## 🧪 Verification & PR Submission Checklist

- [x] **SSRF-Protected URL Scraper**: `POST /api/scrape-jd` blocks localhost, private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`), cloud metadata (`169.254.169.254`), with 5s timeout and 1MB limit.
- [x] **URL Reader UI Integration**: `JdScoringPanel.tsx` features an "Import from URL" toggle, input box, loading spinner, and graceful fallback to direct pasting.
- [x] **Deterministic Match Scorer**: Evaluates 400+ skill taxonomy and alias dictionary in `<2ms` with 1.0x bullet / 0.6x skills list weighting.
- [x] **Algorithmic Truth Guard**: Gates AI suggestions, blocks fabricated metrics and unverified tools, and presents green/amber badges in `DiffReviewer.tsx`.
- [x] **Dual ATS Exporter**: OpenXML `.docx` with `HeadingLevel.HEADING_1` / `HEADING_2` and browser vector print `.pdf` via `jsPDF`.
- [x] **Visual Studio**: Split-screen editor, 3 master presets, theme customizer, 1-page auto-fit constraint, and ATS Robot View.
- [x] **Comprehensive Test Suite**: 86 unit and boundary tests across 17 suites with 100% pass rate (`npm test`).
- [x] **Clean Production Build**: `npm run build` succeeds with zero TypeScript or ESLint errors.
- [x] **Exhaustive Documentation**: `docs/ARCHITECTURE.md`, `docs/ResuArchitect_AI_Project_Guide.pdf`, and `docs/ResuArchitect_AI_Pitch_Deck.pptx`.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **Team 4 (Red flowers)** for **CBIT Hacktoberfest '26**.
