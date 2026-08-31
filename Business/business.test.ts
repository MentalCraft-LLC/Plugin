import { describe, expect, test } from "bun:test";
import { businessOperation } from "./operation.ts";
import { handleBusinessRpc } from "./mcp-server.ts";
import { compactBusinessResult } from "./pi.ts";
import { BUSINESS_PROTOCOL } from "./core.ts";

describe("Plugin/Business Intelligence Engine", () => {
  test("list_actions returns all commercial & SEO actions", async () => {
    const res = await businessOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as { actions: Array<{ name: string }> };
    expect(data.actions.length).toBe(7);
    expect(data.actions.map((a) => a.name)).toContain("seo_keyword_difficulty");
    expect(data.actions.map((a) => a.name)).toContain("product_traction_score");
  });

  test("product_traction_score calculates multi-dimensional viability", async () => {
    const res = await businessOperation({
      action: "product_traction_score",
      product_name: "MentalCraft Screening",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.product).toBe("MentalCraft Screening");
    expect(data.score).toBeGreaterThanOrEqual(80);
    expect(data.grade).toBeDefined();
    expect(data.dimensions.seoViability).toBeGreaterThan(80);
    expect(data.recommendations.length).toBeGreaterThan(0);
  });

  test("handles missing keyword validation gracefully", async () => {
    const res = await businessOperation({ action: "seo_keyword_difficulty" });
    expect(res.success).toBe(false);
    expect(res.diagnostics?.[0]).toContain("keyword");
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    // 1. initialize
    const initRes = await handleBusinessRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.id).toBe(1);
    expect((initRes.result as any).serverInfo.name).toBe("mentalcraft-business-mcp");

    // 2. tools/list
    const listRes = await handleBusinessRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (listRes.result as any).tools;
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe("business");

    // 3. tools/call
    const callRes = await handleBusinessRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "business",
        arguments: { action: "product_traction_score", product_name: "PosiChat" },
      },
    });
    expect(callRes.id).toBe(3);
    const content = (callRes.result as any).content;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.action).toBe("product_traction_score");
    expect(parsed.success).toBe(true);
  });

  test("compactBusinessResult formats clean terminal summary", async () => {
    const res = await businessOperation({
      action: "product_traction_score",
      product_name: "MentalCraft",
    });
    const log = compactBusinessResult(res);
    expect(log).toContain("MentalCraft");
    expect(log).toContain("Traction Score:");
  });
});
