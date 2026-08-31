# 📖 MentalCraft Capability & Plugin Catalog

> Universal, Agent-Less & Host-Agnostic Intelligence Specifications (OpenRPC 1.3 Compatible)

## 📦 Subsystems Overview

| Subsystem | Actions | Protocol | Key Domain Scope |
|---|---|---|---|
| `Workflow` | 13 | `holar.workflow.v1` | Multi-plugin compound DAG execution, health diagnostics, telemetry & circuit breaker |
| `Business` | 21 | `holar.business.v1` | 8-Stage Venture Lifecycle (Websites, Apps, Games), PMF, SEO KD, ASO, Steam, Activation, Unit Economics, Moats |
| `Science` | 16 | `holar.science.v1` | 8-Stage Academic Production Lifecycle: Literature, Methodology, Grants, Authoring, Peer Review, Journals, Patents, Impact |
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

### `grant_proposal_lifecycle` — NIH/NSF Research Grant Proposal & Budgeting Pipeline
- **Description**: Grant lifecycle: 5-dimension rubric criteria audit → Specific Aims independence matrix → Multi-year MTDC budget calculation.
- **Required Plugins**: `science`
- **Execution Steps**:
  1. **[science]** `grant_criteria_audit`: Evaluate grant proposal against NIH/NSF review rubrics (1.0-9.0 score).
  2. **[science]** `grant_aims_alignment`: Verify Specific Aims independence and funding priority alignment.
  3. **[science]** `grant_budget_calculator`: Calculate multi-year direct costs, fringe benefits, and F&A indirect expenses.

### `patent_invention_pipeline` — Patent Novelty & Claim Specification Pipeline
- **Description**: Patent lifecycle: USPTO/WIPO prior art search & novelty scoring → Independent/dependent claim tree structure → Patent specification scaffolding.
- **Required Plugins**: `science`
- **Execution Steps**:
  1. **[science]** `patent_novelty_check`: Search prior art databases and compute 35 U.S.C. statutory factor scores.
  2. **[science]** `patent_claim_structure`: Validate independent and dependent claims tree and antecedent basis.
  3. **[science]** `patent_spec_scaffold`: Scaffold formal patent specification document with preferred embodiments.

### `venture_growth_lifecycle` — Full-Cycle Business Venture Growth & Unit Economics Engine
- **Description**: Venture lifecycle: Market TAM/SAM/SOM validation → Multi-channel acquisition audit → CAC/LTV unit economics → D1/D7/D30 retention curves → Price elasticity → 90-day playbook.
- **Required Plugins**: `business`
- **Execution Steps**:
  1. **[business]** `venture_market_validation`: Validate venture viability, TAM/SAM/SOM market size, and monetization model.
  2. **[business]** `venture_acquisition_audit`: Audit primary acquisition channel across SEO (Web), ASO (App), or Steam (Game).
  3. **[business]** `venture_unit_economics`: Model CAC, LTV, LTV/CAC ratio, payback months, and gross margins.
  4. **[business]** `venture_retention_curves`: Model D1/D7/D30 cohort retention curves against industry benchmarks.
  5. **[business]** `venture_pricing_experiment`: Simulate price elasticity curve to maximize expected revenue per visitor.
  6. **[business]** `venture_growth_playbook`: Synthesize 90-day execution sprint roadmap.

### `shop_ecommerce_lifecycle` — Full-Cycle E-Commerce & Shop Commercialization Pipeline
- **Description**: Shop lifecycle: E-commerce TAM/SAM/SOM → TikTok/Amazon acquisition audit → Cart/Checkout activation funnel → COGS/3PL unit economics → 30/60/90-day repurchase retention → Volume tiering → Inventory ROP safety stock.
- **Required Plugins**: `business`
- **Execution Steps**:
  1. **[business]** `venture_market_validation`: Validate e-commerce market size, sourcing feasibility, and omnichannel strategy.
  2. **[business]** `venture_acquisition_audit`: Audit TikTok Shop creator affiliates, Google Shopping, and Amazon PPC ROAS.
  3. **[business]** `venture_activation_funnel`: Audit Add-to-Cart (ATC), Initiate Checkout, and abandonment recovery flows.
  4. **[business]** `venture_unit_economics`: Calculate COGS, 3PL shipping, gateway fees, blended ROAS, and net margin.
  5. **[business]** `venture_retention_curves`: Track 30/60/90-day repurchase retention and VIP customer lifetime value.
  6. **[business]** `venture_pricing_experiment`: Optimize bundle packaging, volume tiering, and AOV boost elasticity.
  7. **[business]** `venture_expansion_moat`: Calculate inventory reorder point (ROP), safety stock, and 3PL moats.
  8. **[business]** `venture_growth_playbook`: Generate 90-day omnichannel e-commerce launch sprint roadmap.

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

bun cli.ts repl
```
