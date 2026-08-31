# 📖 MentalCraft Capability & Plugin Catalog

> Universal, Agent-Less & Host-Agnostic Intelligence Specifications (OpenRPC 1.3 Compatible)

## 📦 Subsystems Overview

| Subsystem | Actions | Protocol | Key Domain Scope |
|---|---|---|---|
| `Workflow` | 9 | `holar.workflow.v1` | Multi-plugin compound DAG execution, health diagnostics, telemetry & circuit breaker |
| `Business` | 11 | `holar.business.v1` | Google SEO KD (0-100), link budgets, TrafficCV traffic forensics, Stripe Radar leaderboards |
| `Science` | 7 | `holar.science.v1` | Clinical psychometrics (GAD-7/PHQ-9), 988 suicide safety, literature & patent novelty |
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

### `clinical_study_to_screener` — Clinical Scale to Interactive Screener Pipeline
- **Description**: Scientific validation: Psychometric scoring & crisis boundary check → Scaffold Svelte 5 Screener block → Responsive audit.
- **Required Plugins**: `science` ➔ `design` ➔ `chrome`
- **Execution Steps**:
  1. **[science]** `score_scale`: Verify scale severity algorithms and clinical cutoffs.
  2. **[science]** `crisis_boundary_check`: Ensure 988 emergency hotline safeguard protocol is active.
  3. **[design]** `domain_presets`: Scaffold the 'clinical' domain preset with Screener and Questionnaire.
  4. **[design]** `resolve_imports`: Optimize on-demand imports for sub-15KB client footprint.
  5. **[chrome]** `inspect_element`: Audit live DOM focus rings, touch targets, and mobile ergonomics.

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
