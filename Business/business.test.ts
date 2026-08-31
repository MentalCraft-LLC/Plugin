import { describe, expect, test } from "bun:test";
import { businessOperation } from "./operation.ts";
import { handleBusinessRpc } from "./mcp-server.ts";
import { BUSINESS_PROTOCOL, compactBusinessResult } from "./core.ts";

describe("Plugin/Business Venture Lifecycle Engine", () => {
  test("list_actions returns all 18 actions across the 5 venture lifecycle stages", async () => {
    const res = await businessOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as any;
    expect(data.totalActions).toBe(18);
    expect(data.modalities).toEqual(["website", "app", "game"]);
    expect(data.lifecycleStages.validation.length).toBeGreaterThan(0);
    expect(data.lifecycleStages.acquisition.length).toBeGreaterThan(0);
    expect(data.lifecycleStages.unit_economics.length).toBeGreaterThan(0);
    expect(data.lifecycleStages.retention.length).toBeGreaterThan(0);
    expect(data.lifecycleStages.monetization.length).toBeGreaterThan(0);
  });

  test("Stage 1: Market Validation models website, app, and game viability", async () => {
    // Website
    const webRes = await businessOperation({ action: "venture_market_validation", modality: "website", venture_name: "MentalCraft Cloud" });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.modality).toBe("website");
    expect(webData.viabilityScore).toBeGreaterThanOrEqual(80);
    expect(webData.marketSize.tamUsd).toBeGreaterThan(1e9);

    // App
    const appRes = await businessOperation({ action: "venture_market_validation", modality: "app", venture_name: "MindFlow Daily" });
    expect(appRes.success).toBe(true);
    expect((appRes.data as any).recommendedMonetization).toContain("Freemium");

    // Game
    const gameRes = await businessOperation({ action: "venture_market_validation", modality: "game", venture_name: "Echoes of Eternity" });
    expect(gameRes.success).toBe(true);
    expect((gameRes.data as any).recommendedMonetization).toContain("Steam");
  });

  test("Stage 2: Acquisition Audit adapts to SEO (Web), ASO (App), and Steam (Game)", async () => {
    // Web acquisition
    const webRes = await businessOperation({ action: "venture_acquisition_audit", modality: "website", domain: "mentalcraft.org" });
    expect(webRes.success).toBe(true);
    expect((webRes.data as any).primaryAcquisitionChannel).toContain("Google SERP");

    // App acquisition (ASO)
    const appRes = await businessOperation({ action: "venture_acquisition_audit", modality: "app", venture_name: "MindFlow" });
    expect(appRes.success).toBe(true);
    expect((appRes.data as any).primaryAcquisitionChannel).toContain("App Store");

    // Game acquisition (Steam Wishlists)
    const gameRes = await businessOperation({ action: "venture_acquisition_audit", modality: "game", venture_name: "Echoes" });
    expect(gameRes.success).toBe(true);
    expect((gameRes.data as any).primaryAcquisitionChannel).toContain("Steam");
    expect((gameRes.data as any).metrics.steamWishlists).toBeGreaterThan(10000);
  });

  test("Stage 3: Unit Economics models CAC, LTV, payback period and ARPDAU", async () => {
    const webRes = await businessOperation({ action: "venture_unit_economics", modality: "website", cac: 80, arpu: 320 });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.ltvToCacRatio).toBeGreaterThanOrEqual(3.0);
    expect(webData.grossMarginPercent).toBeGreaterThan(80);

    const gameRes = await businessOperation({ action: "venture_unit_economics", modality: "game", cac: 4.5, arpu: 25 });
    expect(gameRes.success).toBe(true);
    expect((gameRes.data as any).modalityMetrics.arpdauUsd).toBeDefined();
  });

  test("Stage 4: Retention Curves computes D1/D7/D30 cohorts and DAU/MAU stickiness", async () => {
    const res = await businessOperation({ action: "venture_retention_curves", modality: "game", dau: 12000, mau: 40000 });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.retentionCurve.d1Percent).toBeGreaterThan(0);
    expect(data.retentionCurve.d7Percent).toBeGreaterThan(0);
    expect(data.retentionCurve.d30Percent).toBeGreaterThan(0);
    expect(data.dauToMauRatio).toBe(0.3);
  });

  test("Stage 5: Monetization Telemetry monitors Stripe, App Store, and Steam billing", async () => {
    const res = await businessOperation({ action: "venture_monetization_telemetry", modality: "website" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.billingProvider).toBe("Stripe");
    expect(data.totalRevenueUsd).toBeGreaterThan(0);
    expect(data.tierDistribution.length).toBeGreaterThan(0);
  });

  test("Stage 5: Pricing Experiment calculates price elasticity and optimal RPV", async () => {
    const res = await businessOperation({
      action: "venture_pricing_experiment",
      modality: "app",
      price_points: [19.99, 29.99, 49.99],
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.optimalPriceUsd).toBeDefined();
    expect(data.revenuePerVisitorMaxUsd).toBeGreaterThan(0);
    expect(data.tiersEvaluated.length).toBe(3);
  });

  test("Stage 5: Growth Playbook delivers 90-day multi-channel sprint plan", async () => {
    const res = await businessOperation({
      action: "venture_growth_playbook",
      modality: "game",
      venture_name: "Echoes",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.horizonDays).toBe(90);
    expect(data.sprints.length).toBe(3);
    expect(data.sprints[0].deliverables.length).toBeGreaterThan(0);
  });

  test("TrafficCV integration: domain overview, channels, and competitor benchmark", async () => {
    const overviewRes = await businessOperation({ action: "traffic_domain_overview", domain: "mentalcraft.org" });
    expect(overviewRes.success).toBe(true);
    expect((overviewRes.data as any).monthlyVisits).toBeGreaterThan(0);

    const compRes = await businessOperation({ action: "traffic_competitor_comparison", domains: ["a.com", "b.com"] });
    expect(compRes.success).toBe(true);
    expect((compRes.data as any).leaderDomain).toBeDefined();
  });

  test("Gefei SEO integration: keyword difficulty and link budget", async () => {
    const kdRes = await businessOperation({ action: "seo_keyword_difficulty", keyword: "ai coding agent" });
    expect(kdRes.success).toBe(true);
    expect((kdRes.data as any).kd).toBeDefined();

    const budgetRes = await businessOperation({ action: "seo_link_budget", keyword: "saas directory" });
    expect(budgetRes.success).toBe(true);
    expect((budgetRes.data as any).linkBudget).toBeDefined();
  });

  test("Product traction score calculates multidimensional viability", async () => {
    const res = await businessOperation({ action: "product_traction_score", product_name: "MentalCraft" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.score).toBeGreaterThan(0);
    expect(data.dimensions.competitiveMoat).toBeDefined();
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    const initRes = await handleBusinessRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-business-mcp");

    const listRes = await handleBusinessRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools[0].name).toBe("business");

    const callRes = await handleBusinessRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "business",
        arguments: { action: "venture_market_validation", modality: "game", venture_name: "RogueStar" },
      },
    });
    expect(callRes.result.content[0].text).toContain("RogueStar");
  });

  test("compactBusinessResult formats clean terminal summary", async () => {
    const res = await businessOperation({ action: "venture_market_validation", modality: "website", venture_name: "MentalCraft" });
    const summary = compactBusinessResult(res);
    expect(summary).toContain("Market Validation");
    expect(summary).toContain("WEBSITE");
  });
});
