# MentalCraft Workflow Orchestrator & Health Engine Plugin

The `workflow` (`holar.workflow.v1`) plugin is the master orchestrator coordinating multi-plugin compound DAG execution pipelines, concurrency pools, pre-flight diagnostics, latency percentile benchmarks (P50/P90/P99), OpenRPC 1.3.2 and OpenAPI 3.1.0 specifications, and circuit breaker telemetry across the MentalCraft ecosystem (`Business`, `Science`, `Design`, `Workflow`, `Chrome`, `Message`, `Secret`).

---

## ⚡ Protocol Actions (17 Actions)

| Action | Description | Key Parameters |
|---|---|---|
| `list_workflows` | List all 11 built-in and dynamic compound multi-plugin pipelines | N/A |
| `run_workflow` | Execute a compound workflow with dependency graph resolution, telemetry, OTel spans, and run receipts | `workflow_id`, `parameters` |
| `register_workflow` | Dynamically register a custom multi-plugin DAG pipeline with schema validation | `custom_workflow` |
| `get_workflow_history` | Retrieve past workflow execution receipts, duration metrics, and spans | N/A |
| `export_config` | Generate ready-to-use MCP configuration JSON for Claude Desktop, Cursor, etc. | `client_target` |
| `install_mcp_schemas` | Auto-install JSON tool schemas to local AI agent directory | `output_dir` |
| `export_openrpc_spec` | Export comprehensive OpenRPC 1.3.2 specification across all 6 capability subsystems (106 methods) | N/A |
| `export_openapi_spec` | Export OpenAPI 3.1.0 REST specification with component schemas | N/A |
| `export_schema_catalog` | OpenRPC 1.3 specification alias for cross-compatibility | N/A |
| `export_openapi_catalog` | OpenAPI 3.1 specification alias for cross-compatibility | N/A |
| `benchmark` | Execute multi-subsystem latency percentile benchmark (P50, P90, P99, ops/sec) | `benchmark_options` (`iterations`, `subsystems`) |
| `get_metrics` | Retrieve live telemetry and 3-state circuit breaker metrics (CLOSED, HALF_OPEN, OPEN) | N/A |
| `export_trace` | Export OpenTelemetry v1 compatible traces and step execution spans | N/A |
| `export_mermaid_dag` | Generate visual Mermaid.js flowchart code for any workflow pipeline | `workflow_id` |
| `batch_run` | Execute parallel tasks across multiple plugins with pooled concurrency | `tasks`, `concurrency` |
| `dry_run` | Validate required plugins and inspect execution plan without side-effects | `workflow_id` |
| `health_check` | Run system-wide diagnostics and integrity scoring across all 6 plugins | `target_plugin` |

---

## 🔄 Built-in Compound DAG Workflows (11 Pipelines)

1. **`ecommerce_full_launch_pipeline`**:
   - `Business.venture_market_validation` (Shop) ➔ `Design.generate_ui` (ecommerce_pdp) ➔ `Business.venture_unit_economics` (Shop) ➔ `Business.venture_expansion_moat` (ROP inventory) ➔ `Message.send` (telegram launch notification)
2. **`academic_manuscript_complete_lifecycle`**:
   - `Science.paper_citation_verify` ➔ `Science.paper_methodology_audit` ➔ `Science.paper_latex_scaffold` ➔ `Science.paper_peer_review_simulate` ➔ `Science.journal_matcher` ➔ `Science.journal_submission_checklist`
3. **`startup_pmf_and_scale_sprint`**:
   - `Business.venture_pmf_validation` ➔ `Business.venture_activation_funnel` ➔ `Business.venture_retention_curves` ➔ `Business.venture_pricing_experiment` ➔ `Business.venture_growth_playbook`
4. **`academic_paper_to_journal_submission`**:
   - `Science.paper_literature_search` ➔ `Science.paper_citation_verify` ➔ `Science.paper_structure_audit` ➔ `Science.journal_matcher` ➔ `Science.journal_submission_checklist`
5. **`grant_proposal_lifecycle`**:
   - `Science.grant_criteria_audit` ➔ `Science.grant_aims_alignment` ➔ `Science.grant_budget_calculator`
6. **`patent_invention_pipeline`**:
   - `Science.patent_novelty_check` ➔ `Science.patent_claim_structure` ➔ `Science.patent_spec_scaffold`
7. **`venture_growth_lifecycle`**:
   - `Business.venture_market_validation` ➔ `Business.venture_acquisition_audit` ➔ `Business.venture_unit_economics` ➔ `Business.venture_retention_curves` ➔ `Business.venture_pricing_experiment` ➔ `Business.venture_growth_playbook`
8. **`shop_ecommerce_lifecycle`**:
   - `Business.venture_market_validation` ➔ `Business.venture_acquisition_audit` ➔ `Business.venture_activation_funnel` ➔ `Business.venture_unit_economics` ➔ `Business.venture_retention_curves` ➔ `Business.venture_pricing_experiment` ➔ `Business.venture_expansion_moat` ➔ `Business.venture_growth_playbook`
9. **`launch_product_campaign`**:
   - `Business.seo_keyword_difficulty` ➔ `Business.market_stripe_radar` ➔ `Design.generate_ui` ➔ `Design.audit_ui` ➔ `Chrome.navigate` ➔ `Chrome.profile_vitals`
10. **`clinical_study_to_screener`**:
    - `Science.score_scale` ➔ `Science.crisis_boundary_check` ➔ `Design.domain_presets` ➔ `Design.resolve_imports` ➔ `Chrome.inspect_element`
11. **`automated_revenue_monitor`**:
    - `Business.market_site_trajectory` ➔ `Message.send`

---

## ⚡ Latency Benchmark Engine

Run microsecond benchmark suite across all 6 subsystems:

```bash
bun cli.ts benchmark --iterations=200
```

Sample output:
```
Subsystem   | Action / Target                          |  P50 (ms) |  P90 (ms) |  P99 (ms) | Throughput
------------+------------------------------------------+-----------+-----------+-----------+------------
business    | venture_market_validation                |     0.006 |     0.013 |     0.102 | 105,263 ops/s
business    | venture_unit_economics                   |     0.005 |     0.009 |     0.013 | 161,290 ops/s
science     | paper_citation_verify                    |     0.001 |     0.004 |     0.014 | 588,235 ops/s
design      | generate_ui                              |     0.002 |     0.004 |     0.016 | 416,667 ops/s
workflow    | health_check                             |     0.004 |     0.012 |     0.048 | 161,290 ops/s
chrome      | status                                   |     0.006 |     0.010 |     0.019 | 147,059 ops/s
message     | bootstrap                                |     0.000 |     0.002 |     0.005 | 1,428,571 ops/s
```

---

## 📋 Interface Specifications

Export OpenRPC 1.3.2 and OpenAPI 3.1.0 specifications:

```bash
bun cli.ts export-specs
```

Outputs:
- `Plugin/openrpc.json`: OpenRPC 1.3.2 schema detailing 106 methods and input parameters across 6 subsystems.
- `Plugin/openapi.json`: OpenAPI 3.1.0 REST API catalog.

---

## 🧪 Testing & Verification

```bash
cd Plugin/Workflow && bun test
```
