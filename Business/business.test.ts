import { describe, expect, test } from "bun:test";
import { businessOperation } from "./operation.ts";
import { handleBusinessRpc } from "./mcp-server.ts";
import { BUSINESS_PROTOCOL, compactBusinessResult } from "./core.ts";

describe("Plugin/Business 8-Stage Venture Lifecycle Engine", () => {
  test("list_actions returns all 21 actions across the 8 venture lifecycle stages and 4 modalities", async () => {
    const res = await businessOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as any;
    expect(data.totalActions).toBe(21);
    expect(data.modalities).toEqual(["website", "app", "game", "shop"]);
    expect(data.lifecycleStages.stage1_ideation.length).toBe(2);
    expect(data.lifecycleStages.stage2_pmf_validation.length).toBe(1);
    expect(data.lifecycleStages.stage3_acquisition.length).toBe(8);
    expect(data.lifecycleStages.stage4_activation.length).toBe(1);
    expect(data.lifecycleStages.stage5_retention.length).toBe(1);
    expect(data.lifecycleStages.stage6_unit_economics.length).toBe(5);
    expect(data.lifecycleStages.stage7_pricing.length).toBe(1);
    expect(data.lifecycleStages.stage8_scale_moats.length).toBe(2);
    expect(data.actions.length).toBe(21);
  });

  test("Stage 1: Market Validation models all 4 modalities (website, app, game, shop)", async () => {
    // Website (SaaS / Web App)
    const webRes = await businessOperation({ action: "venture_market_validation", modality: "website", venture_name: "MentalCraft Cloud" });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.modality).toBe("website");
    expect(webData.viabilityScore).toBeGreaterThanOrEqual(80);
    expect(webData.marketSize.tamUsd).toBeGreaterThan(1e9);
    expect(webData.recommendedMonetization).toContain("SaaS");

    // App (iOS / Android)
    const appRes = await businessOperation({ action: "venture_market_validation", modality: "app", venture_name: "MindFlow Daily" });
    expect(appRes.success).toBe(true);
    const appData = appRes.data as any;
    expect(appData.modality).toBe("app");
    expect(appData.recommendedMonetization).toContain("Freemium");
    expect(appData.growthPlaybook[0]).toContain("ASO");

    // Game (Steam / Console)
    const gameRes = await businessOperation({ action: "venture_market_validation", modality: "game", venture_name: "Echoes of Eternity" });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.modality).toBe("game");
    expect(gameData.recommendedMonetization).toContain("Steam");
    expect(gameData.growthPlaybook[0]).toContain("Steam Next Fest");

    // Shop (E-Commerce D2C / TikTok Shop / Amazon FBA)
    const shopRes = await businessOperation({ action: "venture_market_validation", modality: "shop", venture_name: "EcoCraft Merch" });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.modality).toBe("shop");
    expect(shopData.marketSize.tamUsd).toBeGreaterThan(1e12);
    expect(shopData.recommendedMonetization).toContain("TikTok Shop");
    expect(shopData.keyRisks[0]).toContain("Supply chain");
  });

  test("Stage 1: Niche Discovery identifies commercial opportunities across sectors", async () => {
    const res = await businessOperation({ action: "market_niche_discovery", query: "developer tools" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.niches.length).toBeGreaterThan(0);
    expect(data.niches[0].name).toBeDefined();
  });

  test("Stage 2: PMF Validation implements Sean Ellis 40% rule and smoke tests across modalities", async () => {
    // Website PMF
    const webRes = await businessOperation({ action: "venture_pmf_validation", modality: "website", venture_name: "MentalCraft" });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.pmfScorePercent).toBeGreaterThanOrEqual(40);
    expect(webData.pmfStatus).toContain("Strong PMF");
    expect(webData.smokeTestConversionPercent).toBeGreaterThan(0);
    expect(webData.coreValuePropositionValid).toBe(true);
    expect(webData.topRequestedFeatures.length).toBeGreaterThan(0);

    // Shop PMF
    const shopRes = await businessOperation({ action: "venture_pmf_validation", modality: "shop", venture_name: "EcoCraft" });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.topRequestedFeatures[0]).toContain("Shop Pay");

    // Game PMF
    const gameRes = await businessOperation({ action: "venture_pmf_validation", modality: "game", venture_name: "RogueStar" });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.topRequestedFeatures[0]).toContain("multiplayer");

    // Custom score override
    const customRes = await businessOperation({ action: "venture_pmf_validation", modality: "app", pmf_score: 22, smoke_test_ctr: 2.1 });
    expect(customRes.success).toBe(true);
    const customData = customRes.data as any;
    expect(customData.pmfScorePercent).toBe(22);
    expect(customData.pmfStatus).toContain("Pivot Required");
    expect(customData.coreValuePropositionValid).toBe(false);
  });

  test("Stage 3: Acquisition Audit deeply adapts across SEO (Web), ASO (App), Steam (Game), and TikTok/Amazon (Shop)", async () => {
    // Web acquisition (Google SERP & TrafficCV)
    const webRes = await businessOperation({ action: "venture_acquisition_audit", modality: "website", domain: "mentalcraft.org" });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.primaryAcquisitionChannel).toContain("Google SERP");
    expect(webData.metrics.monthlyVisits).toBeGreaterThan(0);

    // App acquisition (ASO & Search Ads)
    const appRes = await businessOperation({ action: "venture_acquisition_audit", modality: "app", venture_name: "MindFlow" });
    expect(appRes.success).toBe(true);
    const appData = appRes.data as any;
    expect(appData.primaryAcquisitionChannel).toContain("App Store");
    expect(appData.metrics.appStoreRank).toBeDefined();

    // Game acquisition (Steam Wishlists)
    const gameRes = await businessOperation({ action: "venture_acquisition_audit", modality: "game", venture_name: "Echoes" });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.primaryAcquisitionChannel).toContain("Steam");
    expect(gameData.metrics.steamWishlists).toBeGreaterThan(10000);
    expect(gameData.metrics.dailyWishlistVelocity).toBeGreaterThan(0);

    // Shop acquisition (TikTok Shop & Meta Ads)
    const shopRes = await businessOperation({ action: "venture_acquisition_audit", modality: "shop", venture_name: "EcoCraft" });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.primaryAcquisitionChannel).toContain("TikTok Shop");
    expect(shopData.metrics.blendedRoas).toBeGreaterThan(3.0);
    expect(shopData.metrics.creatorAffiliatesActive).toBeGreaterThan(50);
  });

  test("Stage 4: Activation Funnel tracks Time-to-Value, step friction, and abandonment recovery flows", async () => {
    // App Funnel
    const appRes = await businessOperation({ action: "venture_activation_funnel", modality: "app", venture_name: "MindFlow" });
    expect(appRes.success).toBe(true);
    const appData = appRes.data as any;
    expect(appData.timeToValueMinutes).toBeLessThanOrEqual(5);
    expect(appData.overallActivationRatePercent).toBeGreaterThan(50);
    expect(appData.funnelSteps.length).toBe(4);
    expect(appData.ahaMomentMilestone).toBeDefined();

    // Shop Funnel with Abandoned Checkout Recovery
    const shopRes = await businessOperation({ action: "venture_activation_funnel", modality: "shop", venture_name: "EcoCraft" });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.timeToValueMinutes).toBe(1);
    expect(shopData.funnelSteps[1].stepName).toContain("Add-to-Cart");
    expect(shopData.abandonmentRecoveryFlow).toBeDefined();
    expect(shopData.abandonmentRecoveryFlow.estimatedRecoveryRatePercent).toBeGreaterThan(10);

    // Game Funnel
    const gameRes = await businessOperation({ action: "venture_activation_funnel", modality: "game", venture_name: "RogueStar" });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.timeToValueMinutes).toBe(5);
    expect(gameData.ahaMomentMilestone).toContain("tutorial");
  });

  test("Stage 5: Retention Curves models D1/D7/D14/D30 cohorts and 30/60/90-day shop repurchase rates", async () => {
    // Game retention
    const gameRes = await businessOperation({ action: "venture_retention_curves", modality: "game", dau: 12000, mau: 40000 });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.retentionCurve.d1Percent).toBeGreaterThan(0);
    expect(gameData.retentionCurve.d7Percent).toBeGreaterThan(0);
    expect(gameData.retentionCurve.d14Percent).toBeGreaterThan(0);
    expect(gameData.retentionCurve.d30Percent).toBeGreaterThan(0);
    expect(gameData.dauToMauRatio).toBe(0.3);

    // Shop retention with D60 and D90 repurchase
    const shopRes = await businessOperation({ action: "venture_retention_curves", modality: "shop", d1_retention: 28, d30_retention: 20 });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.retentionCurve.d60Percent).toBe(28);
    expect(shopData.retentionCurve.d90Percent).toBe(36);
    expect(shopData.cohortHealth).toBe("Top Quartile");
  });

  test("Stage 6: Unit Economics models CAC, LTV, COGS, 3PL shipping, ROAS, and ARPDAU", async () => {
    // Website SaaS unit economics
    const webRes = await businessOperation({ action: "venture_unit_economics", modality: "website", cac: 80, arpu: 320 });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.ltvToCacRatio).toBeGreaterThanOrEqual(3.0);
    expect(webData.grossMarginPercent).toBeGreaterThan(80);
    expect(webData.modalityMetrics.mrrUsd).toBe(45000);

    // Game ARPDAU and platform cut
    const gameRes = await businessOperation({ action: "venture_unit_economics", modality: "game", cac: 4.5, arpu: 25 });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.modalityMetrics.arpdauUsd).toBe(0.22);
    expect(gameData.modalityMetrics.storeCutPercent).toBe(15.0);

    // Shop COGS, shipping, and ROAS
    const shopRes = await businessOperation({
      action: "venture_unit_economics",
      modality: "shop",
      cac: 25,
      arpu: 85,
      cogs: 18.0,
      shipping_cost: 7.5,
    });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.modalityMetrics.cogsUsd).toBe(18.0);
    expect(shopData.modalityMetrics.fulfillmentShippingUsd).toBe(7.5);
    expect(shopData.modalityMetrics.targetRoas).toBe(3.4);
    expect(shopData.modalityMetrics.netMarginPercent).toBeGreaterThan(15);
  });

  test("Stage 6: Monetization Telemetry monitors billing streams across Stripe, AppStore, Steam, and ShopifyPay", async () => {
    // Shop ShopifyPay telemetry
    const shopRes = await businessOperation({ action: "venture_monetization_telemetry", modality: "shop" });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.billingProvider).toBe("ShopifyPay");
    expect(shopData.totalRevenueUsd).toBe(560000);
    expect(shopData.tierDistribution.length).toBe(2);

    // Game Steam telemetry
    const gameRes = await businessOperation({ action: "venture_monetization_telemetry", modality: "game" });
    expect(gameRes.success).toBe(true);
    const gameData = gameRes.data as any;
    expect(gameData.billingProvider).toBe("Steam");
    expect(gameData.tierDistribution.length).toBe(3);

    // App Store telemetry
    const appRes = await businessOperation({ action: "venture_monetization_telemetry", modality: "app" });
    expect(appRes.success).toBe(true);
    const appData = appRes.data as any;
    expect(appData.billingProvider).toBe("AppStore");

    // Stripe telemetry
    const webRes = await businessOperation({ action: "venture_monetization_telemetry", modality: "website" });
    expect(webRes.success).toBe(true);
    expect((webRes.data as any).billingProvider).toBe("Stripe");
  });

  test("Stage 7: Pricing Strategy calculates price elasticity curves, bundle tiers, and AOV boost", async () => {
    // App pricing elasticity
    const appRes = await businessOperation({
      action: "venture_pricing_experiment",
      modality: "app",
      price_points: [19.99, 29.99, 49.99, 79.99],
    });
    expect(appRes.success).toBe(true);
    const appData = appRes.data as any;
    expect(appData.optimalPriceUsd).toBeDefined();
    expect(appData.revenuePerVisitorMaxUsd).toBeGreaterThan(0);
    expect(appData.tiersEvaluated.length).toBe(4);

    // Shop pricing with multi-SKU bundle tiers and AOV boost strategy
    const shopRes = await businessOperation({
      action: "venture_pricing_experiment",
      modality: "shop",
      price_points: [29, 49, 89, 149],
    });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.bundleTiers.length).toBe(3);
    expect(shopData.bundleTiers[1].discountPercent).toBe(15);
    expect(shopData.aovBoostStrategy.length).toBeGreaterThan(0);
  });

  test("Stage 8: Growth Playbook delivers tailored 90-day sprint roadmaps", async () => {
    // Shop Growth Playbook
    const shopRes = await businessOperation({
      action: "venture_growth_playbook",
      modality: "shop",
      venture_name: "EcoCraft Merch",
    });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.horizonDays).toBe(90);
    expect(shopData.sprints.length).toBe(3);
    expect(shopData.sprints[0].focus).toContain("TikTok Shop");
    expect(shopData.sprints[1].focus).toContain("Amazon FBA");
    expect(shopData.sprints[2].deliverables.length).toBeGreaterThan(0);

    // Game Growth Playbook
    const gameRes = await businessOperation({ action: "venture_growth_playbook", modality: "game", venture_name: "RogueStar" });
    expect(gameRes.success).toBe(true);
    expect((gameRes.data as any).sprints[0].focus).toContain("Steam");
  });

  test("Stage 8: Expansion & Moats evaluates Virality K-Factor and Inventory Reorder Point (ROP = LTD + SS)", async () => {
    // Shop with inventory optimization formula
    const shopRes = await businessOperation({
      action: "venture_expansion_moat",
      modality: "shop",
      venture_name: "EcoCraft",
      lead_time_days: 21,
      daily_demand_units: 50,
      service_level_percent: 95,
    });
    expect(shopRes.success).toBe(true);
    const shopData = shopRes.data as any;
    expect(shopData.viralityKFactor).toBeGreaterThan(0);
    expect(shopData.expansionVectors.length).toBe(3);
    expect(shopData.inventoryOptimization).toBeDefined();
    expect(shopData.inventoryOptimization.leadTimeDemandUnits).toBe(1050);
    expect(shopData.inventoryOptimization.safetyStockUnits).toBeGreaterThan(0);
    expect(shopData.inventoryOptimization.reorderPointUnits).toBeGreaterThan(1050);
    expect(shopData.inventoryOptimization.formula).toContain("ROP = LTD + SS");

    // Website moats & viral status
    const webRes = await businessOperation({
      action: "venture_expansion_moat",
      modality: "website",
      venture_name: "MentalCraft",
    });
    expect(webRes.success).toBe(true);
    const webData = webRes.data as any;
    expect(webData.viralityKFactor).toBeGreaterThan(0);
    expect(webData.defensiveMoats.length).toBe(4);
    expect(webData.inventoryOptimization).toBeUndefined();
  });

  test("TrafficCV integration: domain overview, channels, geo, and competitor benchmark", async () => {
    const overviewRes = await businessOperation({ action: "traffic_domain_overview", domain: "mentalcraft.org" });
    expect(overviewRes.success).toBe(true);
    expect((overviewRes.data as any).monthlyVisits).toBeGreaterThan(0);

    const channelsRes = await businessOperation({ action: "traffic_channel_breakdown", domain: "mentalcraft.org" });
    expect(channelsRes.success).toBe(true);
    expect((channelsRes.data as any).channels.organicSearch).toBeGreaterThan(0);

    const geoRes = await businessOperation({ action: "traffic_geo_distribution", domain: "mentalcraft.org" });
    expect(geoRes.success).toBe(true);
    expect((geoRes.data as any).topCountries.length).toBeGreaterThan(0);

    const compRes = await businessOperation({ action: "traffic_competitor_comparison", domains: ["a.com", "b.com"] });
    expect(compRes.success).toBe(true);
    expect((compRes.data as any).leaderDomain).toBeDefined();
  });

  test("Gefei SEO integration: keyword difficulty, batch keywords, and link budget", async () => {
    const kdRes = await businessOperation({ action: "seo_keyword_difficulty", keyword: "ai coding agent" });
    expect(kdRes.success).toBe(true);
    expect((kdRes.data as any).kd).toBeDefined();

    const batchRes = await businessOperation({ action: "seo_batch_keywords", keywords: ["saas directory", "ai tools"] });
    expect(batchRes.success).toBe(true);

    const budgetRes = await businessOperation({ action: "seo_link_budget", keyword: "saas directory" });
    expect(budgetRes.success).toBe(true);
    expect((budgetRes.data as any).linkBudget).toBeDefined();
  });

  test("Product traction score and Stripe radar calculate multidimensional viability", async () => {
    const tractionRes = await businessOperation({ action: "product_traction_score", product_name: "MentalCraft" });
    expect(tractionRes.success).toBe(true);
    const data = tractionRes.data as any;
    expect(data.score).toBeGreaterThan(0);
    expect(data.dimensions.competitiveMoat).toBeDefined();

    const radarRes = await businessOperation({ action: "market_stripe_radar", month: "202607" });
    expect(radarRes.success).toBe(true);

    const trajRes = await businessOperation({ action: "market_site_trajectory", domain: "v0.dev" });
    expect(trajRes.success).toBe(true);
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    const initRes = await handleBusinessRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-business-mcp");

    const listRes = await handleBusinessRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools[0].name).toBe("business");
    expect(listRes.result.tools[0].inputSchema.properties.modality.enum).toContain("shop");

    const callRes = await handleBusinessRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "business",
        arguments: { action: "venture_pmf_validation", modality: "game", venture_name: "RogueStar" },
      },
    });
    expect(callRes.result.content[0].text).toContain("RogueStar");
  });

  test("compactBusinessResult formats clean terminal summaries across all actions", async () => {
    const mktRes = await businessOperation({ action: "venture_market_validation", modality: "shop", venture_name: "EcoCraft" });
    expect(compactBusinessResult(mktRes)).toContain("Market Validation [SHOP]");

    const pmfRes = await businessOperation({ action: "venture_pmf_validation", modality: "app", venture_name: "MindFlow" });
    expect(compactBusinessResult(pmfRes)).toContain("PMF Validation [APP]");

    const acqRes = await businessOperation({ action: "venture_acquisition_audit", modality: "game", venture_name: "Echoes" });
    expect(compactBusinessResult(acqRes)).toContain("Acquisition Audit [GAME]");

    const funRes = await businessOperation({ action: "venture_activation_funnel", modality: "website" });
    expect(compactBusinessResult(funRes)).toContain("Activation Funnel [WEBSITE]");

    const retRes = await businessOperation({ action: "venture_retention_curves", modality: "shop" });
    expect(compactBusinessResult(retRes)).toContain("Retention Curves [SHOP]");

    const uecRes = await businessOperation({ action: "venture_unit_economics", modality: "website" });
    expect(compactBusinessResult(uecRes)).toContain("Unit Economics [WEBSITE]");

    const prcRes = await businessOperation({ action: "venture_pricing_experiment", modality: "shop" });
    expect(compactBusinessResult(prcRes)).toContain("Pricing Experiment [SHOP]");

    const gpbRes = await businessOperation({ action: "venture_growth_playbook", modality: "website" });
    expect(compactBusinessResult(gpbRes)).toContain("Growth Playbook [WEBSITE]");

    const expRes = await businessOperation({ action: "venture_expansion_moat", modality: "shop" });
    expect(compactBusinessResult(expRes)).toContain("Expansion & Moats [SHOP]");
  });
});
