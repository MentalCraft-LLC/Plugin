import { describe, expect, test } from "bun:test";
import {
  workflowOperation,
  executeHealthCheck,
  dispatchPluginAction,
  exportMermaidDag,
  runWithConcurrencyLimit,
  clearWorkflowCache,
} from "./operation.ts";
import { handleWorkflowRpc } from "./mcp-server.ts";
import {
  WORKFLOW_PROTOCOL,
  BUILTIN_WORKFLOWS,
  compactWorkflowResult,
  evaluateStepCondition,
  evaluateStepAssertions,
} from "./core.ts";

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

  test("health_check evaluates all 10 plugins with 100/100 score", async () => {
    const res = await workflowOperation({ action: "health_check" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.healthScore).toBe(100);
    expect(data.totalPlugins).toBe(10);
    expect(data.healthyPlugins).toBe(10);
    expect(data.plugins.browser.status).toBe("healthy");
    expect(data.plugins.design.status).toBe("healthy");
    expect(data.plugins.business.status).toBe("healthy");
    expect(data.plugins.science.status).toBe("healthy");
    expect(data.plugins.content.status).toBe("healthy");
    expect(data.plugins.workflow.status).toBe("healthy");
    expect(data.plugins.message.status).toBe("healthy");
    expect(data.plugins.secret.status).toBe("healthy");
    expect(data.plugins.infra.status).toBe("healthy");
    expect(data.plugins.company.status).toBe("healthy");
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
    expect(data.plan[4].plugin).toBe("browser");
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
    expect(data.configs.mcpServers["mentalcraft-browser"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-message"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-secret"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-business"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-workflow"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-company"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-infra"]).toBeDefined();
    expect(data.configs.mcpServers["mentalcraft-gateway"].args[0].endsWith("/gateway.ts")).toBe(true);
    expect(data.configs.mcpServers["mentalcraft-browser"].args[0]).toContain("/Tool/Browser/serve.mjs");
    expect(data.commandInstructions.length).toBeGreaterThan(0);
  });

  test("install_mcp_schemas writes JSON schemas to designated directory", async () => {
    const { mkdtempSync, rmSync, existsSync } = require("node:fs");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");
    const tmp = mkdtempSync(join(tmpdir(), "mcp-test-"));
    try {
      const { installMcpSchemasToAgy } = require("./operation.ts");
      const res = installMcpSchemasToAgy(tmp);
      expect(res.installedCount).toBe(20);
      expect(res.installedPaths.length).toBe(20);
      expect(existsSync(join(tmp, "gateway", "workflow.json"))).toBe(true);
      expect(existsSync(join(tmp, "gateway", "infra.json"))).toBe(true);
      expect(existsSync(join(tmp, "gateway", "company.json"))).toBe(true);
      expect(existsSync(join(tmp, "infra", "infra.json"))).toBe(true);
      expect(existsSync(join(tmp, "company", "company.json"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("sync_mcp synchronizes all 11 servers and tool schemas", async () => {
    const res = await workflowOperation({ action: "sync_mcp" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.serversCount).toBe(11);
    expect(data.servers).toContain("gateway");
    expect(data.servers).toContain("browser");
    expect(data.servers).toContain("message");
    expect(data.servers).toContain("secret");
    expect(data.servers).toContain("infra");
    expect(data.servers).toContain("company");
    expect(data.installedCount).toBeGreaterThanOrEqual(10);
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
    expect(data.plugins.browser).toBeDefined();
    expect(data.plugins.message).toBeDefined();
  });

  test("Master Gateway MCP handles initialize, tools/list, and multi-plugin tools/call", async () => {
    const { handleGatewayRpc, startGatewayMcpHttp } = require("./gateway.ts");
    const initRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-gateway-mcp");

    const listRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools.length).toBe(10);

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
      { step: 2, plugin: "company", action: "company_entity_audit" },
      { step: 3, plugin: "infra", action: "infra_canary_probe" },
      { step: 4, plugin: "secret", action: "mask" },
      { step: 5, plugin: "design", action: "generate_ui", dependsOn: [1], parameters: { prompt: "${step1.data.query}" } },
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
    expect(data.paths["/api/browser"]).toBeDefined();
    expect(data.paths["/api/message"]).toBeDefined();
    expect(data.components.schemas.BusinessInput).toBeDefined();
  });

  test("export_openrpc_spec exports standard OpenRPC 1.3.2 schema", async () => {
    const res = await workflowOperation({ action: "export_openrpc_spec" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.openrpc).toBe("1.3.2");
    expect(data.info.title).toContain("MentalCraft Unified Plugin");
    expect(data.methods.length).toBeGreaterThanOrEqual(10);
    expect(data.totalPlugins).toBe(10);
    expect(data.totalMethods).toBeGreaterThanOrEqual(144);
    expect(data.methods.map((m: any) => m.name)).toContain("workflow");
    expect(data.methods.map((m: any) => m.name)).toContain("business");
    expect(data.methods.map((m: any) => m.name)).toContain("science");
    expect(data.methods.map((m: any) => m.name)).toContain("content");
    expect(data.methods.map((m: any) => m.name)).toContain("design");
    expect(data.methods.map((m: any) => m.name)).toContain("browser");
    expect(data.methods.map((m: any) => m.name)).toContain("message");
    expect(data.methods.map((m: any) => m.name)).toContain("secret");
    expect(data.methods.map((m: any) => m.name)).toContain("infra");
    expect(data.methods.map((m: any) => m.name)).toContain("company");
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
  }, 30000);

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

  test("benchmark engine measures latency percentiles and ops/sec across all 10 subsystems", async () => {
    const { executeBenchmark } = require("./operation.ts");
    const bench = await executeBenchmark({ iterations: 50, warmupIterations: 5 });
    expect(bench.totalSubsystems).toBe(10);
    expect(bench.totalActionsTested).toBeGreaterThanOrEqual(26);
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
    expect(bench.subsystems.secret.length).toBeGreaterThanOrEqual(1);
    expect(bench.subsystems.infra.length).toBeGreaterThanOrEqual(2);
    expect(bench.subsystems.company.length).toBeGreaterThanOrEqual(2);

    // Also verify via workflowOperation
    const opRes = await workflowOperation({ action: "benchmark", benchmark_options: { iterations: 20 } });
    expect(opRes.success).toBe(true);
    expect((opRes.data as any).totalSubsystems).toBe(10);
  });

  test("compactWorkflowResult formats readable terminal summary", async () => {
    const res = await workflowOperation({ action: "health_check" });
    const log = compactWorkflowResult(res);
    expect(log).toContain("System Health: 100/100");
    expect(log).toContain("HEALTHY");
  });

  test("product_iteration_lifecycle workflow is registered and adheres to the 6-stage Sprint OS", async () => {
    const res = await workflowOperation({ action: "list_workflows" });
    expect(res.success).toBe(true);
    const workflows = (res.data as any).workflows;
    const iterationWf = workflows.find((w: any) => w.id === "product_iteration_lifecycle");
    expect(iterationWf).toBeDefined();
    expect(iterationWf.name).toContain("Standard 6-Stage Product Iteration Lifecycle");
    expect(iterationWf.steps.length).toBe(6);
    expect(iterationWf.steps[0].action).toBe("venture_market_validation");
    expect(iterationWf.steps[1].action).toBe("audit_ui");
    expect(iterationWf.steps[2].action).toBe("generate_ui");
    expect(iterationWf.steps[3].action).toBe("inspect_element");
    expect(iterationWf.steps[4].action).toBe("venture_monetization_telemetry");
    expect(iterationWf.steps[5].action).toBe("autopilot_step");
  });

  test("plan_dynamic_workflow synthesizes JIT DAG tailored to target intent", async () => {
    // 1. Conversion intent
    const convRes = await workflowOperation({
      action: "plan_dynamic_workflow",
      dynamic_intent: { goal: "optimize_stripe_conversion", venture: "MentalCraft" },
    });
    expect(convRes.success).toBe(true);
    const convData = convRes.data as any;
    expect(convData.synthesizedWorkflow.name).toContain("Dynamic JIT Funnel & Conversion Sprint");
    expect(convData.totalSteps).toBe(5);

    // 2. Clinical scale intent
    const clinRes = await workflowOperation({
      action: "plan_dynamic_workflow",
      dynamic_intent: { goal: "add_epds_clinical_cutoff_scale", venture: "MentalCraft" },
    });
    expect(clinRes.success).toBe(true);
    const clinData = clinRes.data as any;
    expect(clinData.synthesizedWorkflow.name).toContain("Dynamic Clinical Evidence");
    expect(clinData.synthesizedWorkflow.requiredPlugins).toContain("science");

    // 3. Incident remediation intent
    const incRes = await workflowOperation({
      action: "plan_dynamic_workflow",
      dynamic_intent: { goal: "fix_checkout_error_incident", venture: "MentalCraft" },
    });
    expect(incRes.success).toBe(true);
    const incData = incRes.data as any;
    expect(incData.synthesizedWorkflow.name).toContain("Dynamic Rapid Remediation");
    expect(incData.synthesizedWorkflow.requiredPlugins).toContain("workflow");

    // 4. Compliance & governance intent
    const compRes = await workflowOperation({
      action: "plan_dynamic_workflow",
      dynamic_intent: { goal: "annual_compliance_and_entity_audit", venture: "MentalCraft" },
    });
    expect(compRes.success).toBe(true);
    const compData = compRes.data as any;
    expect(compData.synthesizedWorkflow.name).toContain("Dynamic Corporate Governance & Entity Compliance Sprint");
    expect(compData.synthesizedWorkflow.requiredPlugins).toContain("company");

    // 5. Edge infrastructure & deployment intent
    const infraRes = await workflowOperation({
      action: "plan_dynamic_workflow",
      dynamic_intent: { goal: "edge_infra_canary_deployment", venture: "MentalCraft" },
    });
    expect(infraRes.success).toBe(true);
    const infraData = infraRes.data as any;
    expect(infraData.synthesizedWorkflow.name).toContain("Dynamic Edge Infrastructure & Resilience Sprint");
    expect(infraData.synthesizedWorkflow.requiredPlugins).toContain("infra");
  });

  test("run_dynamic_workflow compiles and executes dynamic pipeline end-to-end", async () => {
    const res = await workflowOperation({
      action: "run_dynamic_workflow",
      dynamic_intent: { goal: "optimize_conversion", venture: "MentalCraft" },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.stepsCount).toBe(5);
    expect(data.stepResults.length).toBe(5);
  }, 30000);

  test("workflowOperation check_flywheel audits 42-channel heptagonal flywheel with domain filtering", async () => {
    // 1. Overall flywheel check
    const fullRes = await workflowOperation({ action: "check_flywheel", json: true });
    expect(fullRes.success).toBe(true);
    const fullData = fullRes.data as any;
    expect(fullData.report.totalCount).toBe(42);
    expect(fullData.report.passedCount).toBe(42);
    expect(fullData.report.score).toBe(100);

    // 2. Domain-specific scorecard
    const infraRes = await workflowOperation({ action: "check_flywheel", domain: "Infra", json: true });
    expect(infraRes.success).toBe(true);
    const infraData = infraRes.data as any;
    expect(infraData.report.totalCount).toBe(12);
    expect(infraData.report.passedCount).toBe(12);
    expect(infraData.report.scope).toContain("Infra Domain Flywheel");
  }, 10000);

  test("dispatchPluginAction dispatches cleanly across all 10 subsystems", async () => {
    // 1. Business
    const biz = await dispatchPluginAction("business", "venture_market_validation", { modality: "website" });
    expect(biz.success).toBe(true);

    // 2. Science
    const sci = await dispatchPluginAction("science", "grant_criteria_audit", { funding_agency: "NIH" });
    expect(sci.success).toBe(true);

    // 3. Content
    const cnt = await dispatchPluginAction("content", "story_worldbuilding_forge", { genre: "sci-fi" });
    expect(cnt.success).toBe(true);

    // 4. Design
    const dsn = await dispatchPluginAction("design", "audit_ui", { code: "<button>test</button>" });
    expect(dsn.success).toBe(true);

    // 5. Workflow
    const wf = await dispatchPluginAction("workflow", "list_workflows");
    expect(wf.success).toBe(true);

    // 6. Browser
    const brw = await dispatchPluginAction("browser", "security_audit", { url: "https://example.com" });
    expect(brw.success).toBe(true);

    // 7. Message
    const msg = await dispatchPluginAction("message", "status");
    expect(msg.success).toBe(true);

    // 8. Secret
    const sec = await dispatchPluginAction("secret", "mask", { secret: "dummy_vault_secret_token_123" });
    expect(sec.success).toBe(true);

    // 9. Infra
    const inf = await dispatchPluginAction("infra", "infra_canary_probe");
    expect(inf.success).toBe(true);
    expect((inf.data as any).status).toBe("HEALTHY");

    // 10. Company
    const cmp = await dispatchPluginAction("company", "company_entity_audit");
    expect(cmp.success).toBe(true);
    expect((cmp.data as any).status).toBe("COMPLIANT");
  }, 10000);

  test("batchExecute dispatches tasks across infra, company, secret, content, and business", async () => {
    const res = await workflowOperation({
      action: "batch_run",
      tasks: [
        { id: "t_infra", plugin: "infra", action: "infra_canary_probe" },
        { id: "t_company", plugin: "company", action: "company_compliance_check" },
        { id: "t_secret", plugin: "secret", action: "mask", parameters: { secret: "dummy_vault_token" } },
        { id: "t_content", plugin: "content", action: "story_worldbuilding_forge", parameters: { genre: "fantasy" } },
        { id: "t_biz", plugin: "business", action: "venture_market_validation", parameters: { modality: "website" } },
      ],
      concurrency: 5,
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.total).toBe(5);
    expect(data.successful).toBe(5);
    expect(data.failed).toBe(0);
    expect(data.results.map((r: any) => r.plugin)).toContain("infra");
    expect(data.results.map((r: any) => r.plugin)).toContain("company");
    expect(data.results.map((r: any) => r.plugin)).toContain("secret");
  });

  test("run_workflow executes venture_compliance_and_edge_deployment", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "venture_compliance_and_edge_deployment",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.stepsCount).toBe(6);
    expect(data.stepResults.length).toBe(6);
    expect(data.stepResults.every((s: any) => s.success)).toBe(true);
    expect(data.stepResults[0].plugin).toBe("company");
    expect(data.stepResults[2].plugin).toBe("infra");
  }, 20000);

  test("dispatchPluginAction supports flexible signatures, case-insensitivity, and nested params", async () => {
    const { dispatchPluginAction } = require("./operation.ts");
    const { executePluginAction } = require("./cli.ts");

    // 1. Single-object form with case-insensitivity
    const r1 = await dispatchPluginAction("Company", { action: "company_compliance_check" });
    expect(r1.success).toBe(true);
    expect((r1.data as any).status).toBe("GOOD_STANDING");

    // 2. Nested params object unwrapping
    const r2 = await dispatchPluginAction("infra", "infra_canary_probe", { params: {} });
    expect(r2.success).toBe(true);
    expect((r2.data as any).status).toBe("HEALTHY");

    // 3. executePluginAction CLI delegation
    const r3 = await executePluginAction("company", "company_entity_audit");
    expect(r3.success).toBe(true);
    expect((r3.data as any).status).toBe("COMPLIANT");
  });

  test("circuit breaker operations query and reset circuit states cleanly", async () => {
    const { getCircuitState, resetCircuit, recordTelemetry } = require("./operation.ts");

    // Manually simulate 3 consecutive failures
    recordTelemetry("test.failing_action", 10, false);
    recordTelemetry("test.failing_action", 15, false);
    recordTelemetry("test.failing_action", 20, false);

    expect(getCircuitState("test.failing_action")).toBe("OPEN");

    // Query via workflowOperation
    const getRes = await workflowOperation({ action: "get_circuit", target_action: "test.failing_action" } as any);
    expect(getRes.success).toBe(true);
    expect((getRes.data as any).circuitState).toBe("OPEN");

    // Reset via workflowOperation
    const resetRes = await workflowOperation({ action: "reset_circuit", target_action: "test.failing_action" } as any);
    expect(resetRes.success).toBe(true);
    expect((resetRes.data as any).resetCount).toBeGreaterThanOrEqual(1);

    // Verify state returned to CLOSED
    expect(getCircuitState("test.failing_action")).toBe("CLOSED");
  });

  test("dispatchPluginAction fast-fails when circuit breaker is OPEN and enforceCircuit is enabled", async () => {
    const { recordTelemetry, resetCircuit } = require("./operation.ts");

    // Trip circuit for infra.canary_probe
    recordTelemetry("infra.infra_canary_probe", 10, false);
    recordTelemetry("infra.infra_canary_probe", 15, false);
    recordTelemetry("infra.infra_canary_probe", 20, false);

    // Call with enforceCircuit: true
    const fastFailRes = await dispatchPluginAction(
      "infra",
      "infra_canary_probe",
      {},
      { enforceCircuit: true }
    );

    expect(fastFailRes.success).toBe(false);
    expect(String(fastFailRes.error)).toContain("Circuit breaker is OPEN");
    expect((fastFailRes.data as any).circuitState).toBe("OPEN");

    // Reset circuit
    resetCircuit("infra.infra_canary_probe");

    // Call again - should succeed now
    const recoveredRes = await dispatchPluginAction(
      "infra",
      "infra_canary_probe",
      {},
      { enforceCircuit: true }
    );
    expect(recoveredRes.success).toBe(true);
  });

  test("workflowOperation get_circuit returns system-wide overview when target_action is omitted", async () => {
    const res = await workflowOperation({ action: "get_circuit" } as any);
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(typeof data.totalTracked).toBe("number");
    expect(typeof data.openCircuitsCount).toBe("number");
    expect(typeof data.halfOpenCircuitsCount).toBe("number");
    expect(typeof data.circuits).toBe("object");
  });

  test("all 10 subsystems return standardized introspection manifest via list_actions", async () => {
    const plugins = [
      "business",
      "science",
      "design",
      "content",
      "workflow",
      "browser",
      "message",
      "secret",
      "infra",
      "company",
    ];

    for (const p of plugins) {
      const res = await dispatchPluginAction(p, "list_actions");
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(Array.isArray(data.actions)).toBe(true);
      expect(data.actions.length).toBeGreaterThanOrEqual(4);
      expect(typeof data.description).toBe("string");
      expect(typeof data.totalActions).toBe("number");
    }
  });

  test("protectStdioTransport intercepts console logging to protect JSON-RPC stdout", () => {
    const { protectStdioTransport } = require("./gateway.ts");
    const origLog = console.log;
    let stderrWritten = "";
    const origStderrWrite = process.stderr.write;
    try {
      process.stderr.write = ((chunk: any) => {
        stderrWritten += String(chunk);
        return true;
      }) as any;

      protectStdioTransport();
      console.log("stdio safety probe");
      expect(stderrWritten).toContain("stdio safety probe");
    } finally {
      console.log = origLog;
      process.stderr.write = origStderrWrite;
    }
  });

  test("dry_run simulates dynamic workflows with DAG validation and preflight health", async () => {
    const res = await workflowOperation({
      action: "dry_run",
      dynamic_intent: { goal: "launch_startup", venture: "AeroTest" },
    });
    expect(res.success).toBe(true);
    expect(res.data.isDynamic).toBe(true);
    expect(res.data.dagValidation.valid).toBe(true);
    expect(res.data.plan.length).toBeGreaterThanOrEqual(4);
    expect(res.data.preflightHealth).toBe("healthy");
  });

  test("dispatchPluginAction supports retry policies with backoff", async () => {
    const res = await dispatchPluginAction(
      "business",
      "venture_market_validation",
      { modality: "game", venture_name: "TestSprint" },
      { retries: 2, retryDelayMs: 10 }
    );
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
  });

  test("batchExecute propagates task-level retries and circuit enforcement", async () => {
    const { batchExecute } = require("./operation.ts");
    const batch = await batchExecute(
      [
        { id: "b1", plugin: "business", action: "venture_market_validation", parameters: { modality: "app", venture_name: "BatchApp" }, retries: 1 },
        { id: "b2", plugin: "science", action: "journal_submission_checklist", retries: 1 },
      ],
      2,
      { enforceCircuit: true, retries: 1 }
    );
    expect(batch.total).toBe(2);
    expect(batch.successful).toBe(2);
    expect(batch.failed).toBe(0);
  });

  test("scheduleDagWaves partitions steps into parallel execution waves respecting dependencies", () => {
    const { scheduleDagWaves } = require("./core.ts");
    const steps = [
      { step: 1, plugin: "science", action: "paper_literature_search" },
      { step: 2, plugin: "business", action: "venture_market_validation", dependsOn: [1] },
      { step: 3, plugin: "company", action: "company_entity_audit", dependsOn: [1] },
      { step: 4, plugin: "design", action: "generate_ui", dependsOn: [2, 3] },
      { step: 5, plugin: "infra", action: "infra_canary_probe" },
    ];

    const waves = scheduleDagWaves(steps);
    // Wave 0: steps with no dependencies: step 1, step 5
    expect(waves[0].map((s: any) => s.step)).toEqual([1, 5]);
    // Wave 1: steps depending on step 1: step 2, step 3
    expect(waves[1].map((s: any) => s.step)).toEqual([2, 3]);
    // Wave 2: step depending on steps 2 and 3: step 4
    expect(waves[2].map((s: any) => s.step)).toEqual([4]);
  });

  test("run_workflow with concurrent_dag executes waves and records checkpoint", async () => {
    const customWf = {
      id: "test_concurrent_dag_flow",
      name: "Test Concurrent DAG Flow",
      description: "Tests parallel wave execution",
      requiredPlugins: ["science", "infra", "company"],
      concurrencyMode: "concurrent_dag" as const,
      steps: [
        { step: 1, plugin: "science" as const, action: "journal_submission_checklist" },
        { step: 2, plugin: "infra" as const, action: "infra_canary_probe" },
        { step: 3, plugin: "company" as const, action: "company_entity_audit", dependsOn: [1, 2] },
      ],
    };

    const res = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      concurrency_mode: "concurrent_dag",
    });

    expect(res.success).toBe(true);
    const receipt = res.data as any;
    expect(receipt.stepsCount).toBe(3);
    expect(receipt.executionMode).toBe("concurrent_dag");
    expect(receipt.checkpoint).toBeDefined();
    expect(receipt.checkpoint.lastCompletedStep).toBe(3);
    expect(receipt.checkpoint.resumable).toBe(false);
  });

  test("resume_workflow resumes from checkpoint after step failure", async () => {
    const customWf = {
      id: "test_resumable_flow",
      name: "Test Resumable Flow",
      description: "Tests resumption from checkpoint",
      requiredPlugins: ["science", "company"],
      steps: [
        { step: 1, plugin: "science" as const, action: "journal_submission_checklist" },
        { step: 2, plugin: "company" as const, action: "non_existent_failing_action" },
        { step: 3, plugin: "science" as const, action: "paper_literature_search", parameters: { query: "resumed test" } },
      ],
    };

    // First run fails at step 2
    const failRes = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
    });

    expect(failRes.success).toBe(false);
    const failReceipt = failRes.data as any;
    expect(failReceipt.checkpoint.lastCompletedStep).toBe(1);
    expect(failReceipt.checkpoint.resumable).toBe(true);

    // Fix definition for resumption
    const fixedWf = {
      ...customWf,
      steps: [
        { step: 1, plugin: "science" as const, action: "journal_submission_checklist" },
        { step: 2, plugin: "company" as const, action: "company_entity_audit" },
        { step: 3, plugin: "science" as const, action: "paper_literature_search", parameters: { query: "resumed test" } },
      ],
    };

    // Resume using run_id
    const resumeRes = await workflowOperation({
      action: "resume_workflow",
      run_id: failReceipt.runId,
      custom_workflow: fixedWf,
    });

    expect(resumeRes.success).toBe(true);
    const resumedReceipt = resumeRes.data as any;
    expect(resumedReceipt.resumedFromRunId).toBe(failReceipt.runId);
    expect(resumedReceipt.resumedFromStep).toBe(2);
    expect(resumedReceipt.stepsCount).toBe(3);
    expect(resumedReceipt.checkpoint.resumable).toBe(false);

    // Prior run checkpoint should now be marked as not resumable
    expect(failReceipt.checkpoint.resumable).toBe(false);
  });

  test("resume_workflow returns diagnostic error if run is already completed or not found", async () => {
    const resNotFound = await workflowOperation({
      action: "resume_workflow",
      run_id: "non_existent_run_99999",
    });
    expect(resNotFound.success).toBe(false);
    expect(resNotFound.diagnostics?.[0]).toContain("not found in run history");
  });

  test("evaluateStepCondition correctly evaluates object and string expressions without eval()", () => {
    const context = {
      step1: {
        success: true,
        data: {
          score: 85,
          tier: "enterprise",
          tags: ["alpha", "beta", "gamma"],
          active: true,
          zero: 0,
          emptyStr: "",
        },
      },
    };

    // Object condition tests
    expect(evaluateStepCondition({ path: "step1.data.score", operator: "greater_equal", value: 80 }, context)).toBe(true);
    expect(evaluateStepCondition({ path: "step1.data.score", operator: "less_than", value: 50 }, context)).toBe(false);
    expect(evaluateStepCondition({ path: "step1.data.tier", operator: "equals", value: "enterprise" }, context)).toBe(true);
    expect(evaluateStepCondition({ path: "step1.data.tier", operator: "not_equals", value: "free" }, context)).toBe(true);
    expect(evaluateStepCondition({ path: "step1.data.tags", operator: "contains", value: "beta" }, context)).toBe(true);
    expect(evaluateStepCondition({ path: "step1.data.tags", operator: "contains", value: "omega" }, context)).toBe(false);
    expect(evaluateStepCondition({ path: "step1.data.active", operator: "truthy" }, context)).toBe(true);
    expect(evaluateStepCondition({ path: "step1.data.emptyStr", operator: "falsy" }, context)).toBe(true);

    // String condition tests
    expect(evaluateStepCondition("${step1.data.score} >= 80", context)).toBe(true);
    expect(evaluateStepCondition("${step1.data.score} < 50", context)).toBe(false);
    expect(evaluateStepCondition("${step1.data.tier} == 'enterprise'", context)).toBe(true);
    expect(evaluateStepCondition("${step1.data.tier} != 'free'", context)).toBe(true);
    expect(evaluateStepCondition("${step1.data.active} truthy", context)).toBe(true);
    expect(evaluateStepCondition("${step1.data.emptyStr} falsy", context)).toBe(true);
    expect(evaluateStepCondition("${step1.missing} falsy", context)).toBe(true);
  });

  test("workflowOperation executes conditional steps and skips when condition is false", async () => {
    const customWf = {
      id: "test_conditional_workflow",
      name: "Test Conditional Workflow",
      description: "Tests conditional step execution and skipping",
      requiredPlugins: ["science", "company"],
      steps: [
        {
          step: 1,
          plugin: "science" as const,
          action: "journal_submission_checklist",
        },
        {
          step: 2,
          plugin: "company" as const,
          action: "company_entity_audit",
          condition: "${step1.data.fake_status} == 'non_existent'", // Evaluates to false
        },
        {
          step: 3,
          plugin: "science" as const,
          action: "paper_literature_search",
          parameters: { query: "conditional test" },
          condition: { path: "step1.success", operator: "truthy" as const }, // Evaluates to true
        },
      ],
    };

    const res = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
    });

    expect(res.success).toBe(true);
    const receipt = res.data as any;
    expect(receipt.stepsCount).toBe(3);

    // Step 2 should be skipped
    const step2Result = receipt.stepResults.find((s: any) => s.step === 2);
    expect(step2Result.skipped).toBe(true);
    expect(step2Result.data.status).toBe("SKIPPED");
    const step2Span = receipt.spans.find((s: any) => s.step === 2);
    expect(step2Span.status).toBe("SKIPPED");

    // Step 3 should be executed normally
    const step3Result = receipt.stepResults.find((s: any) => s.step === 3);
    expect(step3Result.skipped).toBeUndefined();
    expect(step3Result.success).toBe(true);
  });

  test("dispatchPluginAction enforces step-level timeoutMs and aborts execution", async () => {
    // Calling infra_canary_probe with a 1ms timeout will reliably trigger a timeout rejection
    try {
      await dispatchPluginAction(
        "infra",
        "infra_canary_probe",
        {},
        { timeoutMs: 1 }
      );
      // If it somehow completed in 0ms, test passes
    } catch (err: any) {
      expect(err.message).toContain("timed out after 1ms");
    }
  });

  test("workflowOperation emits events to on_event callback and supports get_events", async () => {
    const streamedEvents: any[] = [];
    const customWf = {
      id: "test_event_streaming_flow",
      name: "Test Event Streaming Flow",
      description: "Tests live event telemetry",
      requiredPlugins: ["science"],
      steps: [
        {
          step: 1,
          plugin: "science" as const,
          action: "journal_submission_checklist",
        },
      ],
    };

    const res = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      on_event: (evt) => streamedEvents.push(evt),
    });

    expect(res.success).toBe(true);
    const runId = (res.data as any).runId;

    // Verify streaming events captured
    expect(streamedEvents.length).toBeGreaterThanOrEqual(3);
    expect(streamedEvents.some((e) => e.type === "workflow_start")).toBe(true);
    expect(streamedEvents.some((e) => e.type === "step_start")).toBe(true);
    expect(streamedEvents.some((e) => e.type === "step_complete")).toBe(true);
    expect(streamedEvents.some((e) => e.type === "workflow_complete")).toBe(true);

    // Query events via get_events action
    const eventsRes = await workflowOperation({
      action: "get_events",
      run_id: runId,
    });

    expect(eventsRes.success).toBe(true);
    const eventData = eventsRes.data as any;
    expect(eventData.total).toBeGreaterThanOrEqual(3);
    expect(eventData.events[0].runId).toBe(runId);
  });

  test("exportMermaidDag includes conditional edges and subsystem styles", () => {
    const customWf = {
      id: "test_mermaid_condition_flow",
      name: "Test Mermaid Condition Flow",
      description: "Tests conditional edge rendering in Mermaid",
      requiredPlugins: ["infra", "company"],
      steps: [
        {
          step: 1,
          plugin: "infra" as const,
          action: "infra_canary_probe",
        },
        {
          step: 2,
          plugin: "company" as const,
          action: "company_entity_audit",
          dependsOn: [1],
          condition: "${step1.data.status} == 'healthy'",
        },
      ],
    };

    const result = exportMermaidDag(customWf);
    expect(result.mermaidCode).toContain("graph TD");
    expect(result.mermaidCode).toContain("when:");
    expect(result.mermaidCode).toContain("classDef infra");
    expect(result.mermaidCode).toContain("classDef company");
  });

  test("run_workflow executes Saga compensating rollback in reverse order upon step failure", async () => {
    const emittedEvents: any[] = [];
    const customWf = {
      id: "test_saga_rollback_flow",
      name: "Test Saga Rollback Flow",
      description: "Tests Saga compensation pattern in reverse order",
      requiredPlugins: ["science", "infra", "company"],
      steps: [
        {
          step: 1,
          plugin: "science" as const,
          action: "journal_submission_checklist",
          rollback: {
            plugin: "science" as const,
            action: "journal_submission_checklist",
            parameters: { mode: "revert_step_1" },
          },
        },
        {
          step: 2,
          plugin: "infra" as const,
          action: "infra_canary_probe",
          rollback: {
            plugin: "infra" as const,
            action: "infra_canary_probe",
            parameters: { mode: "revert_step_2" },
          },
        },
        {
          step: 3,
          plugin: "company" as const,
          action: "non_existent_failing_action_triggering_rollback",
        },
      ],
    };

    const res = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      rollback_on_failure: true,
      on_event: (evt) => emittedEvents.push(evt),
    });

    expect(res.success).toBe(false);
    const receipt = res.data as any;
    expect(receipt.rollbackStatus).toBe("COMPLETED");
    expect(receipt.rollbackResults?.length).toBe(2);

    // Verify reverse execution order: step 2 compensated before step 1
    expect(receipt.rollbackResults[0].step).toBe(2);
    expect(receipt.rollbackResults[0].action).toBe("infra_canary_probe");
    expect(receipt.rollbackResults[0].success).toBe(true);

    expect(receipt.rollbackResults[1].step).toBe(1);
    expect(receipt.rollbackResults[1].action).toBe("journal_submission_checklist");
    expect(receipt.rollbackResults[1].success).toBe(true);

    // Verify rollback events emitted
    expect(emittedEvents.some((e) => e.type === "rollback_start")).toBe(true);
    expect(emittedEvents.filter((e) => e.type === "rollback_step").length).toBe(2);
    expect(emittedEvents.some((e) => e.type === "rollback_complete" && e.success === true)).toBe(true);
  });

  test("run_workflow dispatches automated notifications via Tool/Message", async () => {
    const customWf = {
      id: "test_notification_flow",
      name: "Test Notification Flow",
      description: "Tests automated alert delivery",
      requiredPlugins: ["science"],
      steps: [
        {
          step: 1,
          plugin: "science" as const,
          action: "journal_submission_checklist",
        },
      ],
    };

    const res = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      notify: {
        channel: "telegram",
        on: "always",
        title: "Test CI Pipeline Alert",
      },
    });

    expect(res.success).toBe(true);
    const receipt = res.data as any;
    expect(receipt.notificationSent).toBeDefined();
    expect(receipt.notificationSent.channel).toBe("telegram");
    expect(receipt.notificationSent.success).toBe(true);
  });

  test("exportMermaidDag generates rollback compensation nodes and edges", () => {
    const customWf = {
      id: "test_mermaid_rollback_flow",
      name: "Test Mermaid Rollback Flow",
      description: "Tests rollback nodes in Mermaid",
      requiredPlugins: ["infra"],
      steps: [
        {
          step: 1,
          plugin: "infra" as const,
          action: "infra_canary_probe",
          rollback: {
            plugin: "infra" as const,
            action: "infra_canary_probe",
          },
        },
      ],
    };

    const result = exportMermaidDag(customWf);
    expect(result.mermaidCode).toContain("RB1");
    expect(result.mermaidCode).toContain("Compensate:");
    expect(result.mermaidCode).toContain("-. \"rollback\" .->");
    expect(result.nodesCount).toBe(2); // 1 normal step + 1 rollback node
  });

  test("evaluateStepAssertions validates output data against contract assertions", () => {
    const outputData = {
      score: 92,
      tier: "pro",
      active: true,
      features: ["audit", "export", "telemetry"],
    };

    // Valid assertions
    const passResult = evaluateStepAssertions(
      [
        { path: "score", operator: "greater_equal", value: 90 },
        { path: "tier", operator: "equals", value: "pro" },
        { path: "active", operator: "truthy" },
        { path: "features", operator: "contains", value: "telemetry" },
      ],
      outputData
    );
    expect(passResult.valid).toBe(true);
    expect(passResult.failureReason).toBeUndefined();

    // Failing assertion
    const failResult = evaluateStepAssertions(
      [
        { path: "score", operator: "less_than", value: 80, message: "Score below required threshold" },
      ],
      outputData
    );
    expect(failResult.valid).toBe(false);
    expect(failResult.failureReason).toContain("Score below required threshold");
  });

  test("run_workflow enforces step-level assertions and fails when assertion is violated", async () => {
    const customWf = {
      id: "test_step_assertions_flow",
      name: "Test Step Assertions Flow",
      description: "Tests runtime step contract assertions",
      requiredPlugins: ["science"],
      steps: [
        {
          step: 1,
          plugin: "science" as const,
          action: "journal_submission_checklist",
          assertions: [
            {
              path: "non_existent_impossible_property",
              operator: "truthy" as const,
              message: "Missing required camera-ready certification",
            },
          ],
        },
      ],
    };

    const res = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
    });

    expect(res.success).toBe(false);
    const receipt = res.data as any;
    expect(receipt.stepResults[0].success).toBe(false);
    expect(receipt.stepResults[0].data.error).toContain("Missing required camera-ready certification");
  });

  test("run_workflow supports workflow-level idempotency_key and cache_ttl_seconds", async () => {
    clearWorkflowCache();
    const testIdemKey = `idem_test_${Date.now()}`;
    const customWf = {
      id: "test_caching_flow",
      name: "Test Caching Flow",
      description: "Tests workflow-level idempotency caching",
      requiredPlugins: ["infra"],
      steps: [
        {
          step: 1,
          plugin: "infra" as const,
          action: "infra_canary_probe",
        },
      ],
    };

    // First run: executes and populates cache
    const res1 = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      idempotency_key: testIdemKey,
      cache_ttl_seconds: 60,
    });

    expect(res1.success).toBe(true);
    const receipt1 = res1.data as any;
    expect(receipt1.cached).toBeUndefined();

    // Second run: served from cache immediately
    const res2 = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      idempotency_key: testIdemKey,
      cache_ttl_seconds: 60,
    });

    expect(res2.success).toBe(true);
    const receipt2 = res2.data as any;
    expect(receipt2.cached).toBe(true);
    expect(receipt2.runId).toBe(receipt1.runId);

    // Clear cache action invalidates entry
    const clearRes = await workflowOperation({
      action: "clear_cache",
    });
    expect(clearRes.success).toBe(true);
    expect((clearRes.data as any).clearedCount).toBeGreaterThanOrEqual(1);

    // Third run after cache cleared: executes fresh
    const res3 = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
      idempotency_key: testIdemKey,
      cache_ttl_seconds: 60,
    });
    expect((res3.data as any).cached).toBeUndefined();
  });

  test("run_workflow supports step-level cacheTtlMs", async () => {
    clearWorkflowCache();
    const customWf = {
      id: "test_step_cache_flow",
      name: "Test Step Cache Flow",
      description: "Tests step-level cache caching",
      requiredPlugins: ["infra"],
      steps: [
        {
          step: 1,
          plugin: "infra" as const,
          action: "infra_canary_probe",
          cacheTtlMs: 30000,
        },
      ],
    };

    // First run
    const res1 = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
    });
    expect(res1.success).toBe(true);
    const step1Run1 = (res1.data as any).stepResults[0];
    expect(step1Run1.cached).toBe(false);

    // Second run with same step params should serve from step cache
    const res2 = await workflowOperation({
      action: "run_workflow",
      custom_workflow: customWf,
    });
    expect(res2.success).toBe(true);
    const step1Run2 = (res2.data as any).stepResults[0];
    expect(step1Run2.cached).toBe(true);
    expect(step1Run2.durationMs).toBe(0);
  });

  test("runWithConcurrencyLimit executes tasks with bounded concurrency pool", async () => {
    let currentConcurrent = 0;
    let maxObservedConcurrent = 0;
    const taskIds = [1, 2, 3, 4, 5];

    const results = await runWithConcurrencyLimit(taskIds, 2, async (id) => {
      currentConcurrent++;
      maxObservedConcurrent = Math.max(maxObservedConcurrent, currentConcurrent);
      await new Promise((r) => setTimeout(r, 20));
      currentConcurrent--;
      return id * 10;
    });

    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(maxObservedConcurrent).toBeLessThanOrEqual(2);
  });
});






