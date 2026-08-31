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
    expect(data.total).toBe(4);
    expect(data.workflows.map((w) => w.id)).toContain("launch_product_campaign");
    expect(data.workflows.map((w) => w.id)).toContain("clinical_study_to_screener");
  });

  test("health_check evaluates all 6 plugins with 100/100 score", async () => {
    const res = await workflowOperation({ action: "health_check" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.healthScore).toBe(100);
    expect(data.healthyPlugins).toBe(6);
    expect(data.plugins.chrome.status).toBe("healthy");
    expect(data.plugins.design.status).toBe("healthy");
    expect(data.plugins.business.status).toBe("healthy");
    expect(data.plugins.science.status).toBe("healthy");
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

  test("run_workflow sequentially executes compound cross-plugin pipeline", async () => {
    const res = await workflowOperation({
      action: "run_workflow",
      workflow_id: "clinical_study_to_screener",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.stepsCount).toBe(4);
    expect(data.stepResults.every((s: any) => s.success)).toBe(true);
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
    expect(listData.customCount).toBe(1);
    expect(listData.workflows.map((w: any) => w.id)).toContain("custom_seo_to_ui");
  });

  test("get_workflow_history records and retrieves execution receipts", async () => {
    await workflowOperation({
      action: "run_workflow",
      workflow_id: "clinical_study_to_screener",
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
      expect(res.installedCount).toBe(5);
      expect(res.installedPaths.length).toBe(5);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("export_schema_catalog returns OpenRPC 1.3 specification for all plugins", async () => {
    const res = await workflowOperation({ action: "export_schema_catalog" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.openrpc).toBe("1.3.0");
    expect(data.totalPlugins).toBe(6);
    expect(data.totalTools).toBe(6);
    expect(data.totalMethods).toBe(79);
    expect(data.plugins.business).toBeDefined();
    expect(data.plugins.science).toBeDefined();
    expect(data.plugins.design).toBeDefined();
    expect(data.plugins.workflow).toBeDefined();
    expect(data.plugins.chrome).toBeDefined();
    expect(data.plugins.message).toBeDefined();
  });

  test("Master Gateway MCP handles initialize, tools/list, and multi-plugin tools/call", async () => {
    const { handleGatewayRpc } = require("../gateway.ts");
    const initRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-gateway-mcp");

    const listRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools.length).toBe(6);

    const callRes = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "science", arguments: { action: "score_scale", scale: "gad7", answers: { q1: 3, q2: 3 } } },
    });
    expect(callRes.result.content[0].text).toContain("GAD-7");
  });

  test("compactWorkflowResult formats readable terminal summary", async () => {
    const res = await workflowOperation({ action: "health_check" });
    const log = compactWorkflowResult(res);
    expect(log).toContain("System Health: 100/100");
    expect(log).toContain("HEALTHY");
  });
});


