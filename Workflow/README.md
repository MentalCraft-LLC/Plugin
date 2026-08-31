# MentalCraft Workflow Orchestrator & Health Engine Plugin

The `workflow` plugin is the master orchestrator coordinating multi-plugin compound DAG pipelines, pre-flight diagnostics, and end-to-end execution across the MentalCraft ecosystem (`Business`, `Design`, `Science`, `Chrome`, `Message`).

---

## ⚡ Protocol Actions

| Action | Description | Key Parameters |
|---|---|---|
| `list_workflows` | List all built-in compound multi-plugin pipelines | N/A |
| `run_workflow` | Sequentially execute a compound workflow with state forwarding | `workflow_id`, `parameters` |
| `dry_run` | Validate required plugins and inspect execution graph without running actions | `workflow_id` |
| `health_check` | Run system-wide diagnostics across all 6 capability plugins | `target_plugin` |

---

## 🔄 Built-in Compound Pipelines

1. **`launch_product_campaign`**:
   - `Business.seo_keyword_difficulty` ➔ `Business.market_stripe_radar` ➔ `Design.generate_ui` ➔ `Design.audit_ui` ➔ `Chrome.navigate` ➔ `Chrome.profile_vitals`
2. **`clinical_study_to_screener`**:
   - `Science.score_scale` ➔ `Science.crisis_boundary_check` ➔ `Design.domain_presets` ➔ `Design.resolve_imports` ➔ `Chrome.inspect_element`
3. **`automated_revenue_monitor`**:
   - `Business.market_site_trajectory` ➔ `Message.send`
4. **`design_system_audit_pipeline`**:
   - `Design.audit_ui` ➔ `Design.resolve_imports` ➔ `Chrome.inspect_element`

---

## 🧪 Testing & Verification

```bash
bun test Workflow/
```
