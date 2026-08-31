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
    const data = res.data as { actions: Array<{ name: string }>; providers: string[] };
    expect(data.actions.length).toBe(11);
    expect(data.providers).toContain("trafficcv");
    expect(data.providers).toContain("gefei");
    expect(data.actions.map((a) => a.name)).toContain("traffic_domain_overview");
    expect(data.actions.map((a) => a.name)).toContain("seo_keyword_difficulty");
    expect(data.actions.map((a) => a.name)).toContain("product_traction_score");
  });

  test("traffic_domain_overview fetches domain visits and rank via TrafficCV", async () => {
    const res = await businessOperation({
      action: "traffic_domain_overview",
      domain: "lovable.dev",
    });
    expect(res.success).toBe(true);
    expect(res.provider).toBe("trafficcv");
    const data = res.data as any;
    expect(data.domain).toBe("lovable.dev");
    expect(data.monthlyVisits).toBeGreaterThan(10000);
    expect(data.bounceRatePercent).toBeGreaterThan(0);
    expect(data.globalRank).toBeGreaterThan(0);
  });

  test("traffic_channel_breakdown decomposes acquisition channels", async () => {
    const res = await businessOperation({
      action: "traffic_channel_breakdown",
      domain: "cursor.com",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.domain).toBe("cursor.com");
    expect(data.channels.organicSearch).toBeGreaterThan(0);
    expect(data.channels.direct).toBeGreaterThan(0);
    expect(data.primaryChannel).toBeDefined();
  });

  test("traffic_competitor_comparison benchmarks multi-domain traffic", async () => {
    const res = await businessOperation({
      action: "traffic_competitor_comparison",
      domains: ["lovable.dev", "v0.dev"],
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.domains.length).toBe(2);
    expect(data.metrics.length).toBe(2);
    expect(data.leaderDomain).toBeDefined();
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
