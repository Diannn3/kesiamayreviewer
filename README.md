# Kesia May Reviewer — CKYCA Study Lab

An independent, evidence-first Certified Know Your Customer Associate (CKYCA) study and examination simulator engineered for rigorous scenario-based overtraining, competency diagnostics, and timed mock assessments.

---

## 🎯 Production Deployment Targets

| Attribute | Value |
| :--- | :--- |
| **Project Name** | `kesiamayreviewer` |
| **Production URL** | `https://kesiamayreviewer.netlify.app` |
| **Netlify Site ID** | `135ca3f1-2348-4f8e-9b32-e01acf6051d6` |
| **Deployment State** | Pre-deployment validated, packaged, and frozen. Final deployment to be performed by ChatGPT. |

> **⚠️ Deployment Boundary:** This repository was prepared, statically verified, and audited by Antigravity under strict execution constraints. Per operational instructions, Netlify deployment commands (`netlify deploy`, `netlify deploy --prod`) were intentionally **NOT** executed by this agent.

---

## 📦 Project Architecture

The application is architected as an ultra-high performance, self-contained single-page application (SPA) with zero external runtime dependencies, ensuring total offline reliability, privacy, and zero CDN latency.

```
kesiamayreviewer/
├── index.html              # Core single-page application (HARD-1 60 scenarios, 20 competencies)
├── netlify.toml            # Netlify publish root and security headers
├── _headers                # Strict nosniff, DENY, and device permissions headers
├── _redirects              # Static SPA rewrite rule (/* /index.html 200)
├── package.json            # Development QA scripts and Playwright runner
├── .gitignore              # Ignores node_modules, temp files, and Netlify state
├── scripts/
│   ├── audit.mjs           # Automated static compliance and schema integrity audit
│   └── smoke-test.mjs      # Playwright headless browser E2E smoke test suite (6 viewports)
├── docs/
│   └── DEPLOYMENT_AUDIT.md # Comprehensive verification and accessibility audit report
└── questions/
    └── README.md           # Schema and roadmap documentation for future daily question packs
```

---

## 🚀 Local Development & Offline Use

Because the entire application is self-contained in `index.html`, it can be launched directly:

### 1. Direct File Opening
Double-click `index.html` or open it in any modern browser (Chrome, Edge, Safari, Firefox). All assets, styling, and JavaScript execute entirely within the local context.

### 2. Local HTTP Server
```bash
# Using Node.js
npx serve .

# Or using Python
python -m http.server 8080
```
Open `http://localhost:8080` in your browser.

---

## 🧪 Automated Testing & QA

Run the full verification suite before any production handoff:

```bash
# 1. Run static integrity audit (validates 60 questions, answer balance, tokens, IDs)
npm run audit

# 2. Run multi-viewport headless browser smoke test suite (Playwright across 6 viewports)
npm test
```

### What `npm run audit` Checks:
- `index.html` presence and valid HTML5 syntax.
- Exactly 60 HARD-1 scenario questions present sequentially (1–60).
- All 20 CKYCA competency identifiers covered across 5 domains.
- Balanced answer distribution (15 A, 15 B, 15 C, 15 D; max identical streak $\le 2$).
- Zero duplicate element IDs.
- Zero local filesystem paths (`C:\...`), `file://` URLs, or `localhost` strings.
- Zero leaked API keys, tokens, or environment secrets.
- Zero external runtime script or font dependencies.

### What `npm test` Checks:
- Headless browser validation across 6 viewports: `320×568`, `375×667`, `390×844`, `768×1024`, `1440×900`, `1920×1080`.
- Zero page-level horizontal overflow (`scrollWidth <= clientWidth`).
- Zero uncaught console or runtime exceptions.
- Interactive switching across all 7 views (`home`, `learn`, `drill`, `mock`, `review`, `reference`, `settings`).
- Drill answer evaluation with real-time regulatory rationale.
- 90-minute countdown mock timer initialization and question navigation (Next, Prev, Jump).
- Question bookmarking and confidence rating (Low, Medium, High).
- Complete mock submission, diagnostic scoring calculation, and competency remediation rendering.
- `localStorage` persistence under isolated key `kesiamay-reviewer-hard-v1`.
- WCAG 2.2 AA visible keyboard focus styles (`:focus-visible`).

---

## ⚖️ Disclaimer & Educational Safety

This application is an independent academic study reviewer designed solely for educational overtraining and professional development. It is **not** affiliated with, endorsed by, sponsored by, or associated with the Association of Certified Anti-Money Laundering Specialists (ACAMS) or any regulatory body. 

No copyrighted ACAMS examination questions, study guide passages, or trademarked logos are reproduced or distributed. All mock questions are original scenario constructions based on public regulatory guidance (FATF 40 Recommendations, Basel CDD guidelines, FinCEN regulations, and Wolfsberg Group standards).
