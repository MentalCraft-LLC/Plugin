import { describe, expect, test } from "bun:test";
import { handleGatewayRpc, GATEWAY_TOOLS } from "./gateway.ts";
import { PLUGIN_REGISTRY, COMPOUND_WORKFLOWS } from "./registry.ts";

describe("Plugin Gateway & Orchestrator", () => {
  test("PLUGIN_REGISTRY contains all 6 core subsystems", () => {
    expect(Object.keys(PLUGIN_REGISTRY)).toEqual([
      "chrome",
      "design",
      "business",
      "science",
      "message",
      "secret",
    ]);
    expect(PLUGIN_REGISTRY.design.actionsCount).toBe(10);
    expect(PLUGIN_REGISTRY.business.actionsCount).toBe(11);
    expect(PLUGIN_REGISTRY.science.actionsCount).toBe(7);
  });

  test("COMPOUND_WORKFLOWS defines end-to-end multi-plugin pipelines", () => {
    expect(COMPOUND_WORKFLOWS.length).toBe(3);
    const campaign = COMPOUND_WORKFLOWS.find((w) => w.id === "launch_product_campaign");
    expect(campaign).toBeDefined();
    expect(campaign?.participatingPlugins).toContain("business");
    expect(campaign?.participatingPlugins).toContain("design");
    expect(campaign?.participatingPlugins).toContain("chrome");
    expect(campaign?.pipelineSteps.length).toBe(6);
  });

  test("Gateway MCP Server handles initialize, tools/list, and multi-tool routing", async () => {
    // 1. initialize
    const initRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.id).toBe(1);
    expect((initRes.result as any).serverInfo.name).toBe("mentalcraft-gateway-mcp");

    // 2. tools/list
    const listRes = await handleGatewayRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (listRes.result as any).tools;
    expect(tools.length).toBeGreaterThanOrEqual(5);
    const names = tools.map((t: any) => t.name);
    expect(names).toContain("plugin_registry");
    expect(names).toContain("plugin_workflow");
    expect(names).toContain("design");
    expect(names).toContain("business");
    expect(names).toContain("science");

    // 3. plugin_registry call
    const regRes = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "plugin_registry",
        arguments: { plugin_id: "all" },
      },
    });
    expect(regRes.id).toBe(3);
    const regContent = JSON.parse((regRes.result as any).content[0].text);
    expect(regContent.total).toBe(6);

    // 4. plugin_workflow call
    const wfRes = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "plugin_workflow",
        arguments: { workflow_id: "clinical_study_to_screener", dry_run: true },
      },
    });
    expect(wfRes.id).toBe(4);
    const wfContent = JSON.parse((wfRes.result as any).content[0].text);
    expect(wfContent.status).toBe("dry_run_ready");
    expect(wfContent.workflow.participatingPlugins).toContain("science");

    // 5. dispatch to design tool via gateway
    const designRes = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "design",
        arguments: { action: "list_layers" },
      },
    });
    expect(designRes.id).toBe(5);
    const designContent = JSON.parse((designRes.result as any).content[0].text);
    expect(designContent.action).toBe("list_layers");
    expect(designContent.success).toBe(true);

    // 6. dispatch to science tool via gateway
    const scienceRes = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "science",
        arguments: { action: "score_scale", scale: "gad7", answers: { q1: 3, q2: 3 } },
      },
    });
    expect(scienceRes.id).toBe(6);
    const sciContent = JSON.parse((scienceRes.result as any).content[0].text);
    expect(sciContent.action).toBe("score_scale");
    expect(sciContent.success).toBe(true);
  });
});
