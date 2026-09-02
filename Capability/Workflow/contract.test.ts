import { describe, expect, test } from "bun:test";
import { businessOperation } from "../../Domain/Business/operation.ts";
import { scienceOperation } from "../../Domain/Science/operation.ts";
import { designOperation } from "../../Domain/Design/operation.ts";
import { workflowOperation } from "./operation.ts";
import { BUSINESS_PROTOCOL } from "../../Domain/Business/core.ts";
import { SCIENCE_PROTOCOL } from "../../Domain/Science/core.ts";
import { DESIGN_PROTOCOL } from "../../Domain/Design/core.ts";
import { WORKFLOW_PROTOCOL } from "./core.ts";
import { handleGatewayRpc } from "./gateway.ts";

describe("Golden Protocol & Contract Verification Across All 6 Plugins", () => {
  test("Business plugin contract conforms to strict output schema", async () => {
    const actions = [
      "list_actions",
      "venture_market_validation",
      "venture_pmf_validation",
      "venture_acquisition_audit",
      "venture_activation_funnel",
      "venture_retention_curves",
      "venture_unit_economics",
      "venture_monetization_telemetry",
      "venture_pricing_experiment",
      "venture_growth_playbook",
      "venture_expansion_moat",
      "spriteflow_mrr_engine",
      "spriteflow_pseo_matrix",
      "traffic_domain_overview",
      "traffic_channel_breakdown",
      "service_auth_verify",
      "service_monetization_checkout",
      "service_event_dispatch",
      "service_storage_presign",
      "service_notification_deliver",
      "service_health_telemetry",
      "service_practitioner_workbench",
      "service_scale_battery_config",
      "service_referral_dispatch",
      "service_contract_validate",
      "service_d1_migrate",
      "service_resilience_circuit_breaker",
      "application_market_validation",
      "application_pmf_validation",
      "application_paywall_trigger",
      "application_i18n_matrix",
      "application_compliance_audit",
      "application_release_checklist",
      "company_unit_economics",
      "company_mrr_engine",
      "company_compliance_audit",
      "company_capital_efficiency",
    ] as const;

    for (const action of actions) {
      const res = await businessOperation({ action, modality: "website", domain: "mentalcraft.org", competitors: ["a.com", "b.com"] } as any);
      expect(res.success).toBe(true);
      expect(res.protocol).toBe(BUSINESS_PROTOCOL);
      expect(res.timestamp).toBeDefined();
      expect(res.data).toBeDefined();
    }
  });

  test("Science plugin contract conforms to academic production lifecycle schema", async () => {
    const actions = [
      "list_actions",
      "paper_literature_search",
      "paper_citation_verify",
      "paper_methodology_audit",
      "paper_structure_audit",
      "paper_peer_review_simulate",
      "paper_latex_scaffold",
      "grant_criteria_audit",
      "grant_budget_calculator",
      "grant_aims_alignment",
      "journal_matcher",
      "journal_submission_checklist",
      "social_science_peer_review_audit",
      "chinese_academic_formatter",
      "ssci_top_journal_matcher",
      "css_digital_trace_audit",
      "css_nlp_sentiment_trajectory",
      "css_causal_inference_did",
      "css_abm_simulation",
      "css_telemetry_preprocess",
      "css_nlp_sentiment_score",
      "css_topic_bertopic_cluster",
      "css_did_regression",
      "css_parallel_trends_test",
      "paper_chinese_formatter",
      "paper_social_science_audit",
      "paper_css_digital_trace_audit",
      "paper_css_nlp_sentiment_trajectory",
      "paper_css_causal_inference_did",
      "paper_css_abm_simulation",
      "paper_css_telemetry_preprocess",
      "paper_css_nlp_sentiment_score",
      "paper_css_topic_bertopic_cluster",
      "paper_css_did_regression",
      "paper_css_parallel_trends_test",
      "paper_css_abm_step",
      "journal_ssci_matcher",
      "patent_novelty_check",
      "patent_claim_structure",
      "patent_spec_scaffold",
      "scholarly_impact_forecast",
    ] as const;

    for (const action of actions) {
      const res = await scienceOperation({ action } as any);
      expect(res.success).toBe(true);
      expect(res.protocol).toBe(SCIENCE_PROTOCOL);
      expect(res.timestamp).toBeDefined();
      expect(res.data).toBeDefined();
    }
  });

  test("Design plugin contract conforms to 5-layer design hierarchy and tokens", async () => {
    const layersRes = await designOperation({ action: "list_layers" });
    expect(layersRes.success).toBe(true);
    expect(layersRes.protocol).toBe(DESIGN_PROTOCOL);
    const layersData = layersRes.data as any;
    expect(layersData.layers.length).toBe(5);

    const presetsRes = await designOperation({ action: "domain_presets" });
    expect(presetsRes.success).toBe(true);
    const presetsData = presetsRes.data as any;
    expect(presetsData.total).toBeGreaterThanOrEqual(5);

    const tokensRes = await designOperation({ action: "theme_tokens", token_category: "color" });
    expect(tokensRes.success).toBe(true);
    const tokensData = tokensRes.data as any;
    expect(tokensData.tokens.length).toBeGreaterThan(0);
  });

  test("Workflow orchestrator contract exports valid OpenRPC, OpenAPI, Mermaid, and OTel traces", async () => {
    const openrpcRes = await workflowOperation({ action: "export_schema_catalog" });
    expect(openrpcRes.success).toBe(true);
    expect(openrpcRes.protocol).toBe(WORKFLOW_PROTOCOL);
    expect((openrpcRes.data as any).openrpc).toBe("1.3.2");

    const openapiRes = await workflowOperation({ action: "export_openapi_catalog" });
    expect(openapiRes.success).toBe(true);
    expect((openapiRes.data as any).openapi).toBe("3.1.0");

    const mermaidRes = await workflowOperation({ action: "export_mermaid_dag" });
    expect(mermaidRes.success).toBe(true);
    expect((mermaidRes.data as any).mermaidCode).toContain("graph TD");

    const traceRes = await workflowOperation({ action: "export_trace" });
    expect(traceRes.success).toBe(true);
    expect((traceRes.data as any).format).toBe("OpenTelemetry_v1");
  });

  test("Content plugin contract conforms to creative and marketing output schema", async () => {
    const { contentOperation } = require("../../Domain/Content/operation.ts");
    const actions = [
      "story_worldbuilding_forge",
      "story_character_arc_architect",
      "story_plot_beat_composer",
      "story_sensory_prose_render",
      "story_lore_consistency_linter",
      "story_interactive_ink_exporter",
      "marketing_pas_copywriter",
      "marketing_omnichannel_adapter",
      "marketing_viral_hook_generator",
      "marketing_campaign_playbook",
    ] as const;

    for (const action of actions) {
      const res = await contentOperation({
        action,
        title: "Test World",
        story_title: "Test Story",
        name: "Test Hero",
        excerpt: "Test excerpt",
        manuscript_text: "Test text",
        product_name: "Test Product",
        source_topic: "Test Topic",
      } as any);
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
    }
  });

  test("Master Gateway MCP handles concurrent multi-client requests", async () => {
    const clientRequests = [
      handleGatewayRpc({ jsonrpc: "2.0", id: 101, method: "tools/list" }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 102, method: "tools/call", params: { name: "workflow", arguments: { action: "health_check" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 103, method: "tools/call", params: { name: "design", arguments: { action: "list_layers" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 104, method: "tools/call", params: { name: "science", arguments: { action: "list_actions" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 105, method: "tools/call", params: { name: "content", arguments: { action: "marketing_viral_hook_generator", product_name: "SpriteFlow" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 106, method: "tools/call", params: { name: "infra", arguments: { action: "infra_canary_probe" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 107, method: "tools/call", params: { name: "company", arguments: { action: "company_entity_audit" } } }),
    ];

    const responses = await Promise.all(clientRequests);
    for (const r of responses) {
      expect(r.jsonrpc).toBe("2.0");
      expect(r.result).toBeDefined();
      expect(r.error).toBeUndefined();
    }
  });
});
