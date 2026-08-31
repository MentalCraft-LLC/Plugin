import { describe, expect, test } from "bun:test";
import { workflowOperation, executeHealthCheck } from "./operation.ts";
import { handleWorkflowRpc } from "./mcp-server.ts";
import { compactWorkflowResult } from "./pi.ts";
import { WORKFLOW_PROTOCOL, BUILTIN_WORKFLOWS } from "./core.ts";

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
    expect(data.executedStepsCount).toBe(4);
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

  test("compactWorkflowResult formats readable terminal summary", async () => {
    const res = await workflowOperation({ action: "health_check" });
    const log = compactWorkflowResult(res);
    expect(log).toContain("System Health: 100/100");
    expect(log).toContain("HEALTHY");
  });
});
