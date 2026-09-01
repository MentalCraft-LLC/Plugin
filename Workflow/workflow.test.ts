import { describe, expect, test } from "bun:test";
import { workflowOperation, executeHealthCheck } from "./operation.ts";
import { handleWorkflowRpc } from "./mcp-server.ts";
import { WORKFLOW_PROTOCOL, BUILTIN_WORKFLOWS, compactWorkflowResult } from "./core.ts";

describe("Plugin/Workflow Orchestrator & Health Engine", () => {
  test("list_workflows returns all multi-plugin compound pipelines", async () => {
    const res = await workflowOperation({ action: "list_workflows" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(WORKFLOW_PROTOCOL);
    const data = res.data as { total: number; workflows: typeof BUILTIN_WORKFLOWS };
    expect(data.total).toBeGreaterThanOrEqual(4);
    expect(data.workflows.map((w) => w.id)).toContain("launch_product_campaign");
    expect(data.workflows.map((w) => w.id)).toContain("academic_paper_to_journal_submission");
  });

  test("health_check evaluates all 6 plugins with 100/100 score", async () => {
    const res = await workflowOperation({ action: "health_check" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.healthScore).toBe(100);
    expect(data.healthyPlugins).toBeGreaterThanOrEqual(6);
    expect(data.plugins.chrome.status).toBe("healthy");
    expect(data.plugins.design.status).toBe("healthy");
    expect(data.plugins.business.status).toBe("healthy");
    expect(data.plugins.science.status).toBe("healthy");
    expect(data.plugins.workflow.status).toBe("healthy");
  });

  test("dry_run generates execution plan and checks pre-flight health", async () => {
    const res = await workflowOperation({
      action: "dry_run",
      workflow_id: "launch_product_campaign",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflow.name).toContain("Autonomous Product Campaign Launch");
    expect(data.preflightHealth).toBe("healthy");
    expect(data.plan.length).toBe(6);
    expect(data.plan[0].plugin).toBe("business");
    expect(data.plan[2].plugin).toBe("design");
    expect(data.plan[4].plugin).toBe("chrome");
  });

  test("run_workflow executes Academic Paper, Grant, and Patent pipelines", async () => {
    // 1. Academic Paper
    const paperRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "academic_paper_to_journal_submission",
    });
    expect(paperRes.success).toBe(true);
    expect((paperRes.data as any).stepsCount).toBe(5);

    // 2. Grant Proposal
    const grantRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "grant_proposal_lifecycle",
    });
    expect(grantRes.success).toBe(true);
    expect((grantRes.data as any).stepsCount).toBe(3);

    // 3. Patent Invention
    const patentRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "patent_invention_pipeline",
    });
    expect(patentRes.success).toBe(true);
    expect((patentRes.data as any).stepsCount).toBe(3);
  });

  test("run_workflow executes Venture Growth and Shop E-Commerce pipelines", async () => {
    // 4. Venture Growth Lifecycle (Game)
    const ventureRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "venture_growth_lifecycle",
      parameters: { modality: "game", venture_name: "Echoes of Eternity" },
    });
    expect(ventureRes.success).toBe(true);
    expect((ventureRes.data as any).stepsCount).toBe(6);

    // 5. Shop E-Commerce Lifecycle
    const shopWfRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "shop_ecommerce_lifecycle",
      parameters: { venture_name: "EcoCraft Merch Store" },
    });
    expect(shopWfRes.success).toBe(true);
    expect((shopWfRes.data as any).stepsCount).toBe(8);
  });

  test("run_workflow executes SpriteFlow $10k MRR, Social Science, and Zero-Cost pipelines", async () => {
    // 6. SpriteFlow $10k MRR Growth Pipeline
    const spriteRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "spriteflow_10k_mrr_growth_pipeline",
      parameters: { venture_name: "SpriteFlow" },
    });
    expect(spriteRes.success).toBe(true);
    expect((spriteRes.data as any).stepsCount).toBe(5);

    // 7. Top Social Science Publication Pipeline
    const socSciRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "social_science_top_journal_pipeline",
      parameters: {
        manuscript_title: "算法代哺：数智社会的亲子关系变迁",
        target_cssci_journal: "《中国社会科学》",
        target_ssci_journal: "Nature Human Behaviour",
      },
    });
    expect(socSciRes.success).toBe(true);
    expect((socSciRes.data as any).stepsCount).toBe(5);

    // 9. MentalCraft $10k MRR Dual Academic-Commercial Workflow
    const mcRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "mentalcraft_practitioner_growth_workflow",
      parameters: { venture_name: "MentalCraft" },
    });
    expect(mcRes.success).toBe(true);
    expect((mcRes.data as any).stepsCount).toBe(5);
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    // 1. initialize
    const initRes = await handleWorkflowRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.id).toBe(1);
    expect((initRes.result as any).serverInfo.name).toBe("mentalcraft-workflow-mcp");

    // 2. tools/list
    const listRes = await handleWorkflowRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (listRes.result as any).tools;
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe("workflow");

    // 3. tools/call
    const callRes = await handleWorkflowRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "workflow",
        arguments: { action: "health_check" },
      },
    });
    expect(callRes.id).toBe(3);
    const content = (callRes.result as any).content;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.action).toBe("health_check");
    expect(parsed.success).toBe(true);
  });

  test("register_workflow dynamically registers custom multi-plugin pipeline", async () => {
    const res = await workflowOperation({
      action: "register_workflow",
      custom_workflow: {
        id: "custom_seo_to_ui",
        name: "Custom SEO to UI Pipeline",
        description: "Custom pipeline created by agent.",
        requiredPlugins: ["business", "design"],
        steps: [
          { step: 1, plugin: "business", action: "seo_keyword_difficulty", description: "Keyword lookup" },
          { step: 2, plugin: "design", action: "domain_presets", description: "Design preset" },
        ],
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.registeredId).toBe("custom_seo_to_ui");
    expect(data.stepsCount).toBe(2);

    // Verify it appears in list_workflows
    const listRes = await workflowOperation({ action: "list_workflows" });
    const listData = listRes.data as any;
    expect(listData.customCount).toBeGreaterThanOrEqual(1);
    expect(listData.workflows.map((w: any) => w.id)).toContain("custom_seo_to_ui");
  });

  test("get_workflow_history records and retrieves execution receipts", async () => {
    await workflowOperation({
      action: "run_workflow",
      workflow_id: "academic_paper_to_journal_submission",
    });
    const res = await workflowOperation({ action: "get_workflow_history" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.totalRuns).toBeGreaterThan(0);
    expect(data.recentRuns[0].runId).toBeDefined();
    expect(data.recentRuns[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  test("export_config generates standard multi-server client configurations", async () => {
    const res = await workflowOperation({
      action: "export_config",
      client_target: "claude_desktop",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.target).toBe("claude_desktop");
    expect(data.configs.mcpServers["mentalcraft-gateway"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-business"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-workflow"]).toBeDefined();
    expect(data.commandInstructions.length).toBeGreaterThan(0);
  });

  test("install_mcp_schemas writes JSON schemas to designated directory", async () => {
    const { mkdtempSync, rmSync } = require("node:fs");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");
    const tmp = mkdtempSync(join(tmpdir(), "mcp-test-"));
    try {
      const { installMcpSchemasToAgy } = require("./operation.ts");
      const res = installMcpSchemasToAgy(tmp);
      expect(res.installedCount).toBe(6);
      expect(res.installedPaths.length).toBe(6);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("export_schema_catalog returns OpenRPC 1.3 specification for all plugins", async () => {
    const res = await workflowOperation({ action: "export_schema_catalog" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.openrpc).toBe("1.3.2");
    expect(data.totalPlugins).toBeGreaterThanOrEqual(6);
    expect(data.totalTools).toBeGreaterThanOrEqual(6);
    expect(data.totalMethods).toBeGreaterThanOrEqual(106);
    expect(data.plugins.business).toBeDefined();
    expect(data.plugins.science).toBeDefined();
    expect(data.plugins.design).toBeDefined();
    expect(data.plugins.workflow).toBeDefined();
    expect(data.plugins.chrome).toBeDefined();
    expect(data.plugins.message).toBeDefined();
  });

  test("Master Gateway MCP handles initialize, tools/list, and multi-plugin tools/call", async () => {
    const { handleGatewayRpc, startGatewayMcpHttp } = require("./gateway.ts");
    const initRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-gateway-mcp");

    const listRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools.length).toBe(7);

    const callRes = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "science", arguments: { action: "paper_literature_search", query: "agent" } },
    });
    expect(callRes.result.content[0].text).toContain("Autonomous Agent Architectures");

    // Test HTTP server
    const server = startGatewayMcpHttp(3999);
    try {
      const healthRes = await fetch("http://localhost:3999/health");
      expect(healthRes.status).toBe(200);
      const healthData = await healthRes.json() as any;
      expect(healthData.overallStatus).toBe("healthy");

      const metricsRes = await fetch("http://localhost:3999/metrics");
      expect(metricsRes.status).toBe(200);

      const schemaRes = await fetch("http://localhost:3999/schema");
      expect(schemaRes.status).toBe(200);
      const schemaData = await schemaRes.json() as any;
      expect(schemaData.openrpc).toBe("1.3.2");

      const mcpHttpRes = await fetch("http://localhost:3999/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 10, method: "initialize" }),
      });
      expect(mcpHttpRes.status).toBe(200);
    } finally {
      server.stop();
    }
  });

  test("Root index.ts cleanly re-exports all 6 capabilities and gateway", async () => {
    const root = await import("./index.ts");
    expect(root.businessOperation).toBeDefined();
    expect(root.scienceOperation).toBeDefined();
    expect(root.designOperation).toBeDefined();
    expect(root.workflowOperation).toBeDefined();
    expect(root.createBrowserContextOperation).toBeDefined();
    expect(root.createMessageOperation).toBeDefined();
    expect(root.handleGatewayRpc).toBeDefined();
  });

  test("get_metrics returns live telemetry and circuit breaker states", async () => {
    const res = await workflowOperation({ action: "get_metrics" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.totalInvocations).toBeGreaterThanOrEqual(0);
    expect(data.overallSuccessRate).toBeGreaterThanOrEqual(0);
  });

  test("export_trace formats OTel compatible traces and spans", async () => {
    const res = await workflowOperation({ action: "export_trace" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.format).toBe("OpenTelemetry_v1");
    expect(data.tracesCount).toBeGreaterThanOrEqual(0);
    expect(data.totalSpans).toBeGreaterThanOrEqual(0);
  });

  test("custom dynamic workflow executes steps with variable interpolation", async () => {
    const regRes = await workflowOperation({
      action: "register_workflow",
      custom_workflow: {
        id: "custom_seo_to_ui_test",
        name: "Custom SEO to UI Pipeline",
        description: "Dynamic interpolation test",
        requiredPlugins: ["business", "design"],
        steps: [
          {
            step: 1,
            plugin: "business",
            action: "traffic_domain_overview",
            description: "Fetch domain traffic",
            parameters: { domain: "mentalcraft.org" },
          },
          {
            step: 2,
            plugin: "design",
            action: "catalog",
            description: "Fetch design components",
            parameters: { layer: "component" },
          },
        ],
      },
    });
    expect(regRes.success).toBe(true);

    const runRes = await workflowOperation({
      action: "run_workflow",
      workflow_id: "custom_seo_to_ui_test",
    });
    expect(runRes.success).toBe(true);
    const data = runRes.data as any;
    expect(data.stepsCount).toBe(2);
    expect(data.stepResults[0].action).toBe("traffic_domain_overview");
    expect(data.stepResults[1].action).toBe("catalog");
  });

  test("validateWorkflowDag detects circular dependencies and undefined parameters", () => {
    const { validateWorkflowDag } = require("./operation.ts");
    const valid = validateWorkflowDag([
      { step: 1, plugin: "science", action: "paper_literature_search" },
      { step: 2, plugin: "design", action: "generate_ui", dependsOn: [1], parameters: { prompt: "${step1.data.query}" } },
    ]);
    expect(valid.valid).toBe(true);
    expect(valid.errors.length).toBe(0);

    const invalidForward = validateWorkflowDag([
      { step: 1, plugin: "science", action: "paper_literature_search", parameters: { prompt: "${step2.data.someVal}" } },
      { step: 2, plugin: "design", action: "generate_ui" },
    ]);
    expect(invalidForward.valid).toBe(false);
    expect(invalidForward.errors[0]).toContain("references forward/unexecuted step2");
  });

  test("redactSensitiveData masks API keys, secrets, and auth tokens", () => {
    const { redactSensitiveData } = require("./operation.ts");
    const raw = {
      user: "alice",
      api_key: "sk-proj-1234567890abcdef",
      telegram_token: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      cookie_secret: "session_id_987654321",
      nested: {
        stripe_key: "sk_live_998877665544",
        safeValue: 42,
      },
    };
    const redacted = redactSensitiveData(raw);
    expect(redacted.api_key).toBe("[REDACTED_cdef]");
    expect(redacted.telegram_token).toBe("[REDACTED_ew11]");
    expect(redacted.cookie_secret).toBe("[REDACTED_4321]");
    expect(redacted.nested.stripe_key).toBe("[REDACTED_5544]");
    expect(redacted.nested.safeValue).toBe(42);
    expect(redacted.user).toBe("alice");
  });

  test("export_mermaid_dag generates valid Mermaid flowchart code", async () => {
    const res = await workflowOperation({
      action: "export_mermaid_dag",
      workflow_id: "launch_product_campaign",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.mermaidCode).toContain("graph TD");
    expect(data.mermaidCode).toContain("seo_keyword_difficulty");
    expect(data.nodesCount).toBe(6);
    expect(data.edgesCount).toBe(5);
  });

  test("withRetry recovers from transient failures with exponential backoff", async () => {
    const { withRetry } = require("./operation.ts");
    let attempts = 0;
    const res = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error("Transient network partition");
      return "SUCCESS_PAYLOAD";
    }, { maxRetries: 3, initialDelayMs: 5 });
    expect(res.result).toBe("SUCCESS_PAYLOAD");
    expect(res.attempts).toBe(3);
  });

  test("batch_run executes multiple parallel tasks across plugins with pooled concurrency", async () => {
    const res = await workflowOperation({
      action: "batch_run",
      concurrency: 3,
      tasks: [
        { id: "b1", plugin: "science", action: "paper_literature_search", parameters: { query: "agent workflow" } },
        { id: "b2", plugin: "business", action: "traffic_domain_overview", parameters: { domain: "mentalcraft.org" } },
        { id: "b3", plugin: "design", action: "domain_presets", parameters: { preset_name: "clinical" } },
      ],
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.total).toBe(3);
    expect(data.successful).toBe(3);
    expect(data.failed).toBe(0);
    expect(data.results.length).toBe(3);
  });

  test("export_openapi_spec exports standard OpenAPI 3.1 schema", async () => {
    const res = await workflowOperation({ action: "export_openapi_spec" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.openapi).toBe("3.1.0");
    expect(data.paths["/api/workflow"]).toBeDefined();
    expect(data.paths["/api/business"]).toBeDefined();
    expect(data.paths["/api/science"]).toBeDefined();
    expect(data.paths["/api/design"]).toBeDefined();
    expect(data.paths["/api/chrome"]).toBeDefined();
    expect(data.paths["/api/message"]).toBeDefined();
    expect(data.components.schemas.BusinessInput).toBeDefined();
  });

  test("export_openrpc_spec exports standard OpenRPC 1.3.2 schema", async () => {
    const res = await workflowOperation({ action: "export_openrpc_spec" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.openrpc).toBe("1.3.2");
    expect(data.info.title).toContain("MentalCraft Unified Plugin");
    expect(data.methods.length).toBeGreaterThanOrEqual(6);
    expect(data.totalPlugins).toBe(6);
    expect(data.totalMethods).toBe(106);
    expect(data.methods.map((m: any) => m.name)).toContain("workflow");
    expect(data.methods.map((m: any) => m.name)).toContain("business");
    expect(data.methods.map((m: any) => m.name)).toContain("science");
    expect(data.methods.map((m: any) => m.name)).toContain("design");
    expect(data.methods.map((m: any) => m.name)).toContain("chrome");
    expect(data.methods.map((m: any) => m.name)).toContain("message");
  });

  test("run_workflow executes ecommerce_full_launch_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "ecommerce_full_launch_pipeline",
      parameters: {
        venture_name: "AeroPulse Ergonomic Shop",
        prompt: "AeroPulse Ergonomic Mechanical Keyboard",
        cogs: 42,
        shipping_cost: 7.5,
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("ecommerce_full_launch_pipeline");
    expect(data.stepsCount).toBe(5);
    expect(data.stepResults[0].plugin).toBe("business");
    expect(data.stepResults[0].action).toBe("venture_market_validation");
    expect(data.stepResults[1].plugin).toBe("design");
    expect(data.stepResults[1].action).toBe("generate_ui");
    expect(data.stepResults[2].plugin).toBe("business");
    expect(data.stepResults[2].action).toBe("venture_unit_economics");
    expect(data.stepResults[3].plugin).toBe("business");
    expect(data.stepResults[3].action).toBe("venture_expansion_moat");
    expect(data.stepResults[4].plugin).toBe("message");
    expect(data.stepResults[4].action).toBe("send");
  });

  test("run_workflow executes academic_manuscript_complete_lifecycle compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "academic_manuscript_complete_lifecycle",
      parameters: {
        manuscript_title: "Deterministic Host-Agnostic Plugin Architecture for Autonomous Systems",
        doi: "10.1038/s41586-024-07521-3",
        desired_impact_factor_min: 5.0,
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("academic_manuscript_complete_lifecycle");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("paper_citation_verify");
    expect(data.stepResults[1].action).toBe("paper_methodology_audit");
    expect(data.stepResults[2].action).toBe("paper_latex_scaffold");
    expect(data.stepResults[3].action).toBe("paper_peer_review_simulate");
    expect(data.stepResults[4].action).toBe("journal_matcher");
    expect(data.stepResults[5].action).toBe("journal_submission_checklist");
  });

  test("run_workflow executes startup_pmf_and_scale_sprint compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "startup_pmf_and_scale_sprint",
      parameters: {
        venture_name: "CloudScale AI",
        modality: "website",
        pmf_score: 48,
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("startup_pmf_and_scale_sprint");
    expect(data.stepsCount).toBe(5);
    expect(data.stepResults[0].action).toBe("venture_pmf_validation");
    expect(data.stepResults[1].action).toBe("venture_activation_funnel");
    expect(data.stepResults[2].action).toBe("venture_retention_curves");
    expect(data.stepResults[3].action).toBe("venture_pricing_experiment");
    expect(data.stepResults[4].action).toBe("venture_growth_playbook");
  });

  test("run_workflow executes browser_full_devops_audit_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "browser_full_devops_audit_pipeline",
      parameters: {
        url: "https://app.mentalcraft.org",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("browser_full_devops_audit_pipeline");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("lighthouse_audit");
    expect(data.stepResults[1].action).toBe("performance_trace");
    expect(data.stepResults[2].action).toBe("security_audit");
    expect(data.stepResults[3].action).toBe("extract_structured_data");
    expect(data.stepResults[4].action).toBe("persona_emulation");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes ecommerce_conversion_and_resilience_sprint compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "ecommerce_conversion_and_resilience_sprint",
      parameters: {
        venture_name: "MentalCraft Merch",
        modality: "shop",
        url: "https://shop.mentalcraft.org/pdp/hoodie",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("ecommerce_conversion_and_resilience_sprint");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("venture_market_validation");
    expect(data.stepResults[1].action).toBe("generate_ui");
    expect(data.stepResults[2].action).toBe("visual_regression_diff");
    expect(data.stepResults[3].action).toBe("journey_record_and_replay");
    expect(data.stepResults[4].action).toBe("chaos_resilience_test");
    expect(data.stepResults[5].action).toBe("venture_unit_economics");
  }, { timeout: 15000 });

  test("run_workflow executes story_to_novel_chapter_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "story_to_novel_chapter_pipeline",
      parameters: {
        title: "心智裂变",
        story_title: "心智裂变",
        name: "陆沉",
        genre: "cyberpunk",
        excerpt: "雨水顺着霓虹招牌滴落，在沥青路面上砸出微光。",
        manuscript_text: "陆沉消耗了钐冷凝液，启动了神经超频加速。",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("story_to_novel_chapter_pipeline");
    expect(data.stepsCount).toBe(5);
    expect(data.stepResults[0].action).toBe("story_worldbuilding_forge");
    expect(data.stepResults[1].action).toBe("story_character_arc_architect");
    expect(data.stepResults[2].action).toBe("story_plot_beat_composer");
    expect(data.stepResults[3].action).toBe("story_sensory_prose_render");
    expect(data.stepResults[4].action).toBe("story_lore_consistency_linter");
  }, { timeout: 15000 });

  test("run_workflow executes marketing_full_launch_campaign compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "marketing_full_launch_campaign",
      parameters: {
        product_name: "SpriteFlow",
        source_topic: "2D 贴图打包与显存优化",
        target_audience: "indie_game_dev",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("marketing_full_launch_campaign");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("marketing_pas_copywriter");
    expect(data.stepResults[1].action).toBe("marketing_viral_hook_generator");
    expect(data.stepResults[2].action).toBe("marketing_omnichannel_adapter");
    expect(data.stepResults[3].action).toBe("marketing_campaign_playbook");
    expect(data.stepResults[4].action).toBe("generate_ui");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes browser_resilient_e2e_and_saliency_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "browser_resilient_e2e_and_saliency_pipeline",
      parameters: {
        url: "https://app.mentalcraft.org/workbench",
        suite_name: "Workbench Core Flow",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("browser_resilient_e2e_and_saliency_pipeline");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("stealth_profile_guard");
    expect(data.stepResults[1].action).toBe("network_mock_interceptor");
    expect(data.stepResults[2].action).toBe("web_vitals_radar");
    expect(data.stepResults[3].action).toBe("attention_heatmap_predict");
    expect(data.stepResults[4].action).toBe("e2e_spec_generator");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes holistic_commercial_and_creative_launch_sprint compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "holistic_commercial_and_creative_launch_sprint",
      parameters: {
        product_name: "MentalCraft Studio",
        modality: "app",
        source_topic: "AI Agentic Development IDE",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("holistic_commercial_and_creative_launch_sprint");
    expect(data.stepsCount).toBe(8);
    expect(data.stepResults[0].action).toBe("venture_market_validation");
    expect(data.stepResults[1].action).toBe("story_worldbuilding_forge");
    expect(data.stepResults[2].action).toBe("marketing_pas_copywriter");
    expect(data.stepResults[3].action).toBe("generate_ui");
    expect(data.stepResults[4].action).toBe("responsive_matrix_linter");
    expect(data.stepResults[5].action).toBe("stealth_profile_guard");
    expect(data.stepResults[6].action).toBe("venture_unit_economics");
    expect(data.stepResults[7].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes essay_humanize_full_launch_and_mrr_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "essay_humanize_full_launch_and_mrr_pipeline",
      parameters: {
        pro_price: 12,
        scholar_price: 29,
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("essay_humanize_full_launch_and_mrr_pipeline");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("essay_dual_mrr_engine");
    expect(data.stepResults[1].action).toBe("essay_dual_pseo_matrix");
    expect(data.stepResults[2].action).toBe("generate_ui");
    expect(data.stepResults[3].action).toBe("responsive_matrix_linter");
    expect(data.stepResults[4].action).toBe("stealth_profile_guard");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes essay_detector_and_cross_sell_sprint compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "essay_detector_and_cross_sell_sprint",
      parameters: {
        url: "https://essaydetector.org",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("essay_detector_and_cross_sell_sprint");
    expect(data.stepsCount).toBe(5);
    expect(data.stepResults[0].action).toBe("essay_cross_sell_loop");
    expect(data.stepResults[1].action).toBe("generate_ui");
    expect(data.stepResults[2].action).toBe("web_vitals_radar");
    expect(data.stepResults[3].action).toBe("e2e_spec_generator");
    expect(data.stepResults[4].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes essay_dual_20k_mrr_enterprise_sprint compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "essay_dual_20k_mrr_enterprise_sprint",
      parameters: {
        target: "enterprise",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("essay_dual_20k_mrr_enterprise_sprint");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("essay_dual_independent_10k_mrr");
    expect(data.stepResults[1].action).toBe("essay_conversion_leak_auditor");
    expect(data.stepResults[2].action).toBe("generate_ui");
    expect(data.stepResults[3].action).toBe("responsive_matrix_linter");
    expect(data.stepResults[4].action).toBe("web_vitals_radar");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes essay_llmo_and_global_seo_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "essay_llmo_and_global_seo_pipeline",
      parameters: {
        brand: "Both",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("essay_llmo_and_global_seo_pipeline");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("essay_llmo_engine");
    expect(data.stepResults[1].action).toBe("essay_dual_pseo_matrix");
    expect(data.stepResults[2].action).toBe("generate_ui");
    expect(data.stepResults[3].action).toBe("responsive_matrix_linter");
    expect(data.stepResults[4].action).toBe("stealth_profile_guard");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes essay_retention_and_monetization_deepening_sprint compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "essay_retention_and_monetization_deepening_sprint",
      parameters: {
        country_code: "BR",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("essay_retention_and_monetization_deepening_sprint");
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults[0].action).toBe("essay_dynamic_ppp_pricing");
    expect(data.stepResults[1].action).toBe("essay_lifecycle_email_drip");
    expect(data.stepResults[2].action).toBe("essay_extension_ecosystem_spec");
    expect(data.stepResults[3].action).toBe("generate_ui");
    expect(data.stepResults[4].action).toBe("responsive_matrix_linter");
    expect(data.stepResults[5].action).toBe("send");
  }, { timeout: 15000 });

  test("run_workflow executes holistic_product_excellence_master_pipeline compound workflow", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "holistic_product_excellence_master_pipeline",
      parameters: {
        product_name: "EssayHumanize.com",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.workflowId).toBe("holistic_product_excellence_master_pipeline");
    expect(data.stepsCount).toBe(7);
    expect(data.stepResults[0].action).toBe("product_fullstack_excellence_audit");
    expect(data.stepResults[1].action).toBe("product_eeat_audit");
    expect(data.stepResults[2].action).toBe("essay_llmo_engine");
    expect(data.stepResults[3].action).toBe("generate_ui");
    expect(data.stepResults[4].action).toBe("responsive_matrix_linter");
    expect(data.stepResults[5].action).toBe("web_vitals_radar");
    expect(data.stepResults[6].action).toBe("send");
  }, { timeout: 15000 });

  test("benchmark engine measures latency percentiles and ops/sec across all 7 subsystems", async () => {
    const { executeBenchmark } = require("./operation.ts");
    const bench = await executeBenchmark({ iterations: 50, warmupIterations: 5 });
    expect(bench.totalSubsystems).toBe(7);
    expect(bench.totalActionsTested).toBeGreaterThanOrEqual(22);
    expect(bench.overallOpsPerSec).toBeGreaterThan(0);
    expect(bench.summary.avgP50Ms).toBeGreaterThanOrEqual(0);
    expect(bench.summary.avgP90Ms).toBeGreaterThanOrEqual(0);
    expect(bench.summary.avgP99Ms).toBeGreaterThanOrEqual(0);
    expect(bench.subsystems.business.length).toBeGreaterThanOrEqual(4);
    expect(bench.subsystems.science.length).toBeGreaterThanOrEqual(4);
    expect(bench.subsystems.content.length).toBeGreaterThanOrEqual(4);
    expect(bench.subsystems.design.length).toBeGreaterThanOrEqual(4);
    expect(bench.subsystems.workflow.length).toBeGreaterThanOrEqual(4);
    expect((bench.subsystems.browser || bench.subsystems.chrome).length).toBeGreaterThanOrEqual(1);
    expect(bench.subsystems.message.length).toBeGreaterThanOrEqual(2);

    // Also verify via workflowOperation
    const opRes = await workflowOperation({ action: "benchmark", benchmark_options: { iterations: 20 } });
    expect(opRes.success).toBe(true);
    expect((opRes.data as any).totalSubsystems).toBe(7);
  });

  test("compactWorkflowResult formats readable terminal summary", async () => {
    const res = await workflowOperation({ action: "health_check" });
    const log = compactWorkflowResult(res);
    expect(log).toContain("System Health: 100/100");
    expect(log).toContain("HEALTHY");
  });
});






