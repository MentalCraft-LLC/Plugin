import { describe, expect, it } from "bun:test";
import { GefeiMcpServer, GEFEI_TOOLS } from "./mcp-server.ts";
import { GefeiClient } from "./core.ts";
import { createGefeiOperation } from "./operation.ts";

describe("Gefei Atomic MCP Server", () => {
  it("initializes cleanly with MCP protocol capabilities", async () => {
    const server = new GefeiMcpServer();
    const res = await server.handleMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });

    expect(res).not.toBeNull();
    expect(res?.id).toBe(1);
    expect((res?.result as any)?.serverInfo?.name).toBe("gefei");
    expect((res?.result as any)?.capabilities?.tools).toBeDefined();
  });

  it("lists all 6 atomic SEO & Stripe intelligence tools", async () => {
    const server = new GefeiMcpServer();
    const res = await server.handleMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });

    expect(res).not.toBeNull();
    const tools = (res?.result as any)?.tools;
    expect(tools).toHaveLength(6);

    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain("estimate_keyword_difficulty");
    expect(toolNames).toContain("batch_keyword_difficulty");
    expect(toolNames).toContain("get_stripe_insights");
    expect(toolNames).toContain("get_site_stripe_trajectory");
    expect(toolNames).toContain("calculate_link_budget");
    expect(toolNames).toContain("search_niche_ideas");
  });

  it("dispatches calculate_link_budget with strategy formulation", async () => {
    const mockClient = {
      estimateKeywordDifficulty: async () => ({
        keyword: "svelte ui library",
        kd: 28,
        volume: 4500,
        linkBudget: { targetDr: 25, requiredBacklinks: 10, minHomepageDr: 15 },
      }),
      batchKeywordDifficulty: async () => [],
      getStripeInsights: async () => ({ month: "202607" }),
      getSiteStripeTrajectory: async () => ({ domain: "test.com" }),
      calculateLinkBudget: async (kw: string) => ({
        keyword: kw,
        kd: 28,
        linkBudget: { targetDr: 25, requiredBacklinks: 10, minHomepageDr: 15 },
        strategyRecommendation: "🟢 Low-Hanging Fruit",
      }),
      searchNicheIdeas: async () => ({ query: "test", matchedDarkhorses: [], matchedSurging: [] }),
    };

    const server = new GefeiMcpServer();
    // @ts-ignore
    server.execute = async (input: any) => {
      if (input.action === "calculate_link_budget") {
        return await mockClient.calculateLinkBudget(input.keyword);
      }
      throw new Error("unsupported");
    };

    const res = await server.handleMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "calculate_link_budget",
        arguments: { keyword: "svelte ui library" },
      },
    });

    expect(res).not.toBeNull();
    expect(res?.error).toBeUndefined();
    const content = (res?.result as any)?.content?.[0]?.text;
    expect(content).toContain("Low-Hanging Fruit");
    expect(content).toContain("svelte ui library");
  });

  it("handles unknown tool errors gracefully", async () => {
    const server = new GefeiMcpServer();
    const res = await server.handleMessage({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "non_existent_tool",
        arguments: {},
      },
    });

    expect(res?.error?.code).toBe(-32601);
  });

  it("formats compact terminal summaries for human/CLI view", () => {
    const { compactGefeiResult } = require("./core.ts");
    const kdLog = compactGefeiResult("estimate_keyword_difficulty", {
      keyword: "online anxiety test",
      kd: 24,
      volume: "18.1k",
      opportunity: "High Opportunity",
    });
    expect(kdLog).toContain("online anxiety test");
    expect(kdLog).toContain("KD 24/100");

    const linkLog = compactGefeiResult("calculate_link_budget", {
      keyword: "phq-9 online",
      target_backlinks: 6,
      min_dr: "35+",
    });
    expect(linkLog).toContain("phq-9 online");
    expect(linkLog).toContain("Target 6 backlinks");
  });
});
