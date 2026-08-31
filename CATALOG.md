# 📖 MentalCraft Capability & Plugin Catalog

> Universal, Agent-Less & Host-Agnostic Intelligence Specifications (OpenRPC 1.3 Compatible)

## 📦 Subsystems Overview

| Subsystem | Actions | Protocol | Key Domain Scope |
|---|---|---|---|
| `Workflow` | 13 | `holar.workflow.v1` | Multi-plugin compound DAG execution, health diagnostics, telemetry & circuit breaker |
| `Business` | 11 | `holar.business.v1` | Google SEO KD (0-100), link budgets, TrafficCV traffic forensics, Stripe Radar leaderboards |
| `Science` | 11 | `holar.science.v1` | Academic production lifecycle: Paper authoring, Grant rubrics (NIH/NSF), Journal IF matching, Patent novelty |
| `Design` | 10 | `holar.design.v1` | 5-layer hierarchy, tokens, Svelte 5 runes UI generation, on-demand subpaths |
| `Chrome` | 38 | `holar.browser.v1` | Inactive tab driving, CDP inspection, HUD annotations, storage/cookie receipts |
| `Message` | 4 | `holar.message.v1` | Multi-channel priority bus (Telegram > iMessage > Email) with mode-0600 isolation |

---

## 🚀 Compound Workflows

### `launch_product_campaign` — Autonomous Product Campaign Launch
- **Description**: Commercial validation: Keyword research & Stripe revenue benchmark → Svelte 5 landing page UI → Chrome live visual/vitals audit.
- **Required Plugins**: `business` ➔ `design` ➔ `chrome`
- **Execution Steps**:
  1. **[business]** `seo_keyword_difficulty`: Evaluate search volume & low-hanging fruit ranking opportunities.
  2. **[business]** `market_stripe_radar`: Benchmark revenue tiers of top competitors in the niche.
  3. **[design]** `generate_ui`: Synthesize Svelte 5 Runes marketing hero and pricing table.
  4. **[design]** `audit_ui`: Audit generated code against A11y and OKLCH color tokens.
  5. **[chrome]** `navigate`: Load the deployed preview page in an isolated browser context.
  6. **[chrome]** `profile_vitals`: Verify LCP, CLS, and FID performance scores.

### `academic_paper_to_journal_submission` — Academic Paper to Journal Submission Pipeline
- **Description**: Academic lifecycle: Literature discovery & citation verification → Manuscript structure audit → Target journal matching → Camera-ready checklist.
- **Required Plugins**: `science`
- **Execution Steps**:
  1. **[science]** `paper_literature_search`: Search prior literature and identify state-of-the-art benchmarks.
  2. **[science]** `paper_citation_verify`: Verify DOI citations and generate valid BibTeX records.
  3. **[science]** `paper_structure_audit`: Audit manuscript section completeness and word count.
  4. **[science]** `journal_matcher`: Match target journal venues based on Impact Factor and acceptance rates.
  5. **[science]** `journal_submission_checklist`: Perform camera-ready submission compliance checklist.

### `automated_revenue_monitor` — Automated Competitor Revenue & Alert Monitor
- **Description**: Track Stripe billing trajectory and dispatch milestone notifications to Telegram.
- **Required Plugins**: `business` ➔ `message`
- **Execution Steps**:
  1. **[business]** `market_site_trajectory`: Fetch latest month-over-month checkout referral growth.
  2. **[message]** `send`: Dispatch encrypted summary message to designated bot channel.

### `design_system_audit_pipeline` — Design System & A11y Compliance Pipeline
- **Description**: Audit template code for tokens, resolve minimal subpath imports, and verify DOM tokens via Chrome.
- **Required Plugins**: `design` ➔ `chrome`
- **Execution Steps**:
  1. **[design]** `audit_ui`: Lint template code against hardcoded hex and raw buttons.
  2. **[design]** `resolve_imports`: Calculate optimal tree-shaken on-demand subpaths.
  3. **[chrome]** `inspect_element`: Verify live DOM element against design tokens.

---

## 🛠️ CLI Quick Reference

```bash
# System Health & Diagnostics
bun cli.ts health

# Live Telemetry & Circuit Breaker Dashboard
bun cli.ts metrics

# Execute Compound Workflow
bun cli.ts run-workflow clinical_study_to_screener

# Microsecond Benchmark Suite
bun cli.ts bench

# Interactive Developer REPL
bun cli.ts repl
```
