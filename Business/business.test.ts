import { describe, expect, test } from "bun:test";
import { businessOperation } from "./operation.ts";
import { handleBusinessRpc } from "./mcp-server.ts";
import { BUSINESS_PROTOCOL, compactBusinessResult } from "./core.ts";

describe("Plugin/Business 8-Stage Venture Lifecycle Engine", () => {
  test("list_actions returns all 24 actions across the 8 venture lifecycle stages and 4 modalities", async () => {
    const res = await businessOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as any;
    expect(data.totalActions).toBe(52);
    expect(data.modalities).toEqual(["website", "app", "game", "shop"]);
    expect(data.modules.application.name).toBe("Application (产品与软件工程线)");
    expect(Object.keys(data.modules.application.stages).length).toBe(10);
    expect(data.modules.service.name).toBe("Service (通用软件服务与基础设施)");
    expect(Object.keys(data.modules.service.stages).length).toBe(8);
    expect(data.modules.company.name).toBe("Company (公司财务与增长线)");
    expect(Object.keys(data.modules.company.stages).length).toBe(8);
    expect(data.lifecycleStages.stage1_ideation.length).toBe(2);
    expect(data.lifecycleStages.stage2_pmf_validation.length).toBe(1);
    expect(data.lifecycleStages.stage3_acquisition.length).toBe(9);
    expect(data.lifecycleStages.stage4_activation.length).toBe(1);
    expect(data.lifecycleStages.stage5_retention.length).toBe(1);
    expect(data.lifecycleStages.stage6_unit_economics.length).toBe(6);
    expect(data.lifecycleStages.stage7_pricing.length).toBe(1);
    expect(data.lifecycleStages.stage8_scale_moats.length).toBe(3);
    expect(data.actions.length).toBe(24);
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
  }, { timeout: 15000 });

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
  }, { timeout: 15000 });

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
  }, { timeout: 15000 });

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

    const mrrRes = await businessOperation({ action: "spriteflow_mrr_engine" });
    expect(compactBusinessResult(mrrRes)).toContain("SpriteFlow MRR Engine: $10,000 MRR");
    expect(compactBusinessResult(mrrRes)).toContain("420 Pro");
    expect(compactBusinessResult(mrrRes)).toContain("25 Studio");
    expect(compactBusinessResult(mrrRes)).toContain("LTV: $542.86");

    const pseoRes = await businessOperation({ action: "spriteflow_pseo_matrix" });
    expect(compactBusinessResult(pseoRes)).toContain("SpriteFlow pSEO: Generated");
    expect(compactBusinessResult(pseoRes)).toContain("low-KD keywords");

    const viralRes = await businessOperation({ action: "zero_cost_viral_loops" });
    expect(compactBusinessResult(viralRes)).toContain("Zero-Cost Viral Loops: 5 vectors analyzed");
    expect(compactBusinessResult(viralRes)).toContain("Blended K-Factor: 1.25");
  });

  test("SpriteFlow MRR Engine: Models path to $10,000 MRR with 420 Pro + 25 Studio, LTV $542.86, and 12-month cohort", async () => {
    const res = await businessOperation({ action: "spriteflow_mrr_engine" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as any;

    expect(data.ventureName).toBe("SpriteFlow");
    expect(data.targetMrrUsd).toBe(10000);
    expect(data.targetArrUsd).toBe(120000);
    expect(data.pricingTiers.freeUsd).toBe(0);
    expect(data.pricingTiers.proUsd).toBe(19);
    expect(data.pricingTiers.studioUsd).toBe(79);

    // Subscribers & Revenue breakdown
    expect(data.targetSubscribers.pro).toBe(420);
    expect(data.targetSubscribers.studio).toBe(25);
    expect(data.targetSubscribers.totalPaying).toBe(445);
    expect(data.targetSubscribers.proRevenueUsd).toBe(7980);
    expect(data.targetSubscribers.studioRevenueUsd).toBe(1975);
    expect(data.targetSubscribers.totalActualMrrUsd).toBe(9955);
    expect(data.targetSubscribers.blendedArpuUsd).toBe(22.37);

    // Unit Economics & LTV
    expect(data.unitEconomics.ltvUsd).toBe(542.86);
    expect(data.unitEconomics.blendedArpuUsd).toBe(22.37);
    expect(data.unitEconomics.monthlyChurnRatePercent).toBe(4.12);
    expect(data.unitEconomics.customerLifespanMonths).toBeGreaterThan(24);
    expect(data.unitEconomics.grossMarginPercent).toBe(96.5);
    expect(data.unitEconomics.organicCacUsd).toBe(0);
    expect(data.unitEconomics.paybackPeriodMonths).toBe(0);
    expect(data.unitEconomics.netMarginAtScalePercent).toBe(92.0);

    // 12-month cohort projection
    expect(data.cohortProjections.length).toBe(12);
    expect(data.cohortProjections[0].month).toBe(1);
    expect(data.cohortProjections[0].mrrUsd).toBe(307);
    expect(data.cohortProjections[11].month).toBe(12);
    expect(data.cohortProjections[11].proSubscribers).toBe(420);
    expect(data.cohortProjections[11].studioSubscribers).toBe(25);
    expect(data.cohortProjections[11].totalSubscribers).toBe(445);
    expect(data.cohortProjections[11].mrrUsd).toBe(9955);
    expect(data.cohortProjections[11].cumulativeRevenueUsd).toBeGreaterThan(60000);

    // Growth milestones
    expect(data.growthMilestones.length).toBe(4);
    expect(data.growthMilestones[0].milestone).toContain("Hacker News");
    expect(data.growthMilestones[3].milestone).toContain("$10k MRR");

    // Zero-spend payback velocity
    expect(data.zeroSpendPaybackVelocity.cacSpend).toBe(0);
    expect(data.zeroSpendPaybackVelocity.paybackVelocityDays).toBe(0);
    expect(data.zeroSpendPaybackVelocity.capitalEfficiencyScore).toContain("Infinite ROI");
    expect(data.zeroSpendPaybackVelocity.primaryFreeGrowthEngines.length).toBeGreaterThanOrEqual(5);

    // Custom overrides
    const customRes = await businessOperation({
      action: "spriteflow_mrr_engine",
      venture_name: "PixelAtlas Pro",
      target_mrr: 20000,
      pro_price: 29,
      studio_price: 99,
      pro_subscribers: 500,
      studio_subscribers: 60,
    });
    expect(customRes.success).toBe(true);
    const customData = customRes.data as any;
    expect(customData.ventureName).toBe("PixelAtlas Pro");
    expect(customData.targetMrrUsd).toBe(20000);
    expect(customData.targetArrUsd).toBe(240000);
    expect(customData.pricingTiers.proUsd).toBe(29);
    expect(customData.pricingTiers.studioUsd).toBe(99);
    expect(customData.targetSubscribers.proRevenueUsd).toBe(14500);
    expect(customData.targetSubscribers.studioRevenueUsd).toBe(5940);
    expect(customData.targetSubscribers.totalActualMrrUsd).toBe(20440);
  });

  test("SpriteFlow pSEO Matrix: Generates 100+ low-KD keywords across Godot 4, Unity, Aseprite, TexturePacker, Unreal, and indie engines", async () => {
    const res = await businessOperation({ action: "spriteflow_pseo_matrix" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as any;

    expect(data.totalKeywords).toBeGreaterThanOrEqual(100);
    expect(data.averageKd).toBeLessThan(30);
    expect(data.totalMonthlySearchVolume).toBeGreaterThan(100000);
    expect(data.highPriorityCount).toBeGreaterThan(10);

    // Check all entries have valid schema
    for (const kw of data.keywords) {
      expect(kw.keyword).toBeDefined();
      expect(kw.ecosystem).toBeDefined();
      expect(["informational", "transactional", "commercial", "navigational"]).toContain(kw.searchIntent);
      expect(kw.estimatedMonthlyVolume).toBeGreaterThan(0);
      expect(kw.kd).toBeGreaterThanOrEqual(0);
      expect(kw.kd).toBeLessThanOrEqual(30); // All low-KD
      expect(kw.slug.startsWith("/")).toBe(true);
      expect(["P0", "P1", "P2"]).toContain(kw.priorityTier);
      expect(["tool_landing", "comparison_alternative", "tutorial_guide", "converter_utility", "integration_doc"]).toContain(kw.targetPageType);
    }

    // Check key ecosystems are present
    expect(data.ecosystemBreakdown["Godot 4"]).toBeDefined();
    expect(data.ecosystemBreakdown["Godot 4"].count).toBeGreaterThanOrEqual(15);
    expect(data.ecosystemBreakdown["Unity"]).toBeDefined();
    expect(data.ecosystemBreakdown["Unity"].count).toBeGreaterThanOrEqual(15);
    expect(data.ecosystemBreakdown["Aseprite"]).toBeDefined();
    expect(data.ecosystemBreakdown["Aseprite"].count).toBeGreaterThanOrEqual(15);
    expect(data.ecosystemBreakdown["TexturePacker"]).toBeDefined();
    expect(data.ecosystemBreakdown["TexturePacker"].count).toBeGreaterThanOrEqual(15);
    expect(data.ecosystemBreakdown["Unreal Engine 5"]).toBeDefined();
    expect(data.ecosystemBreakdown["Cross-Platform"]).toBeDefined();

    // Check specific anchor keywords
    const kwNames = data.keywords.map((k: any) => k.keyword);
    expect(kwNames).toContain("godot 4 sprite sheet packer");
    expect(kwNames).toContain("texturepacker free alternative");
    expect(kwNames).toContain("aseprite batch export sprite sheet");
    expect(kwNames).toContain("unity sprite atlas generator online");
    expect(kwNames).toContain("unreal engine 5 paper2d sprite packer");

    // Check filtering
    const godotRes = await businessOperation({ action: "spriteflow_pseo_matrix", engine_filter: "Godot 4" });
    expect(godotRes.success).toBe(true);
    const godotData = godotRes.data as any;
    expect(godotData.keywords.every((k: any) => k.ecosystem === "Godot 4")).toBe(true);

    const highVolRes = await businessOperation({ action: "spriteflow_pseo_matrix", min_volume: 3000, max_kd: 15 });
    expect(highVolRes.success).toBe(true);
    const highVolData = highVolRes.data as any;
    expect(highVolData.keywords.every((k: any) => k.estimatedMonthlyVolume >= 3000 && k.kd <= 15)).toBe(true);
  });

  test("Zero-Cost Viral Loops: 5 viral vectors with step-by-step deliverables, KPIs, and K-Factor > 1.0", async () => {
    const res = await businessOperation({ action: "zero_cost_viral_loops" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(BUSINESS_PROTOCOL);
    const data = res.data as any;

    expect(data.vectors.length).toBe(5);
    expect(data.blendedKFactor).toBe(1.25);
    expect(data.blendedKFactor).toBeGreaterThan(1.0);
    expect(data.viralLoopStatus).toContain("Self-Sustaining Viral Loop");
    expect(data.totalMonthlyOrganicSignups).toBe(11000);
    expect(data.zeroCostMarketingBudgetUsd).toBe(0);

    // Vector 1: GitHub OSS Bridge
    const v1 = data.vectors.find((v: any) => v.vectorId === "vector_github_oss_bridge");
    expect(v1).toBeDefined();
    expect(v1.kFactorContribution).toBe(0.28);
    expect(v1.projectedMonthlySignups).toBe(1400);
    expect(v1.stepByStepDeliverables.length).toBe(4);
    expect(v1.stepByStepDeliverables[0].action).toContain("spriteflow-core");
    expect(v1.kpis.length).toBe(3);

    // Vector 2: Itch.io Asset Packs
    const v2 = data.vectors.find((v: any) => v.vectorId === "vector_itch_io_packs");
    expect(v2).toBeDefined();
    expect(v2.kFactorContribution).toBe(0.22);
    expect(v2.stepByStepDeliverables.length).toBe(4);
    expect(v2.kpis[0].target).toContain("20,000+");

    // Vector 3: Reddit/HN Deep Dives
    const v3 = data.vectors.find((v: any) => v.vectorId === "vector_reddit_hn_show");
    expect(v3).toBeDefined();
    expect(v3.kFactorContribution).toBe(0.25);
    expect(v3.stepByStepDeliverables[0].action).toContain("Show HN");

    // Vector 4: YouTube & Bilibili Tutorials
    const v4 = data.vectors.find((v: any) => v.vectorId === "vector_video_tutorials");
    expect(v4).toBeDefined();
    expect(v4.kFactorContribution).toBe(0.18);
    expect(v4.stepByStepDeliverables[2].action).toContain("Bilibili");

    // Vector 5: Free Web Sandbox
    const v5 = data.vectors.find((v: any) => v.vectorId === "vector_web_sandbox_watermark");
    expect(v5).toBeDefined();
    expect(v5.kFactorContribution).toBe(0.32);
    expect(v5.projectedMonthlySignups).toBe(3500);

    // Flywheel phases & execution calendar
    expect(data.flywheelPhases.length).toBe(4);
    expect(data.executionCalendar.length).toBe(6);
  });

  test("MCP Protocol server handles SpriteFlow MRR engine, pSEO matrix, and zero-cost viral loops", async () => {
    // Test tools/call for spriteflow_mrr_engine
    const mrrRpc = await handleBusinessRpc({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "business",
        arguments: { action: "spriteflow_mrr_engine" },
      },
    });
    expect(mrrRpc.result.content[0].text).toContain("SpriteFlow");
    expect(mrrRpc.result.content[0].text).toContain("542.86");
    expect(mrrRpc.result.content[0].text).toContain("420");

    // Test tools/call for spriteflow_pseo_matrix
    const pseoRpc = await handleBusinessRpc({
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "business",
        arguments: { action: "spriteflow_pseo_matrix", engine_filter: "Godot 4" },
      },
    });
    expect(pseoRpc.result.content[0].text).toContain("godot 4 sprite sheet packer");

    // Test tools/call for zero_cost_viral_loops
    const viralRpc = await handleBusinessRpc({
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "business",
        arguments: { action: "zero_cost_viral_loops" },
      },
    });
    expect(viralRpc.result.content[0].text).toContain("GitHub OSS Bridge");
    expect(viralRpc.result.content[0].text).toContain("1.25");
  });

  test("Service and Module aliases execute successfully with pure contracts", async () => {
    // Universal Software Services (Cloudflare Workers for Holar products)
    // 1. service_auth_verify (holar-auth / auth.essaydetector.org)
    const authRes = await businessOperation({ action: "service_auth_verify" } as any);
    expect(authRes.success).toBe(true);
    expect((authRes.data as any).serviceName).toBe("holar-auth");
    expect((authRes.data as any).verified).toBe(true);

    // 2. service_monetization_checkout (holar-monetization / Stripe & D1)
    const checkoutRes = await businessOperation({ action: "service_monetization_checkout", amount_usd: 29.0 } as any);
    expect(checkoutRes.success).toBe(true);
    expect((checkoutRes.data as any).serviceName).toBe("holar-monetization");
    expect((checkoutRes.data as any).supportedGateways).toContain("Stripe");

    // 3. service_event_dispatch (holar-event / async queue)
    const eventRes = await businessOperation({ action: "service_event_dispatch", event_type: "user.subscription.activated" } as any);
    expect(eventRes.success).toBe(true);
    expect((eventRes.data as any).serviceName).toBe("holar-event");

    // 4. service_storage_presign (holar-storage / Cloudflare R2)
    const storageRes = await businessOperation({ action: "service_storage_presign" } as any);
    expect(storageRes.success).toBe(true);
    expect((storageRes.data as any).storageProvider).toContain("Cloudflare R2");

    // 5. service_notification_deliver (holar-notification)
    const notifyRes = await businessOperation({ action: "service_notification_deliver", channel: "telegram" } as any);
    expect(notifyRes.success).toBe(true);
    expect((notifyRes.data as any).deliveryStatus).toBe("delivered");

    // 6. service_health_telemetry
    const healthRes = await businessOperation({ action: "service_health_telemetry" } as any);
    expect(healthRes.success).toBe(true);
    expect((healthRes.data as any).clusterStatus).toBe("healthy");
    expect((healthRes.data as any).d1Databases).toContain("auth-db");

    // 7. Module Aliases (application_* and company_*)
    const appMarketRes = await businessOperation({ action: "application_market_validation", venture_name: "MentalCraft" } as any);
    expect(appMarketRes.success).toBe(true);

    const compMrrRes = await businessOperation({ action: "company_mrr_engine", target_mrr: 10000 } as any);
    expect(compMrrRes.success).toBe(true);

    // 8. Granular 10-stage Application Lifecycle Actions
    const paywallRes = await businessOperation({ action: "application_paywall_trigger" } as any);
    expect(paywallRes.success).toBe(true);
    expect((paywallRes.data as any).triggers.length).toBe(3);

    const i18nRes = await businessOperation({ action: "application_i18n_matrix" } as any);
    expect(i18nRes.success).toBe(true);
    expect((i18nRes.data as any).supportedLocales.length).toBe(2);

    const compAppRes = await businessOperation({ action: "application_compliance_audit" } as any);
    expect(compAppRes.success).toBe(true);
    expect((compAppRes.data as any).gdprCompliant).toBe(true);

    const releaseRes = await businessOperation({ action: "application_release_checklist" } as any);
    expect(releaseRes.success).toBe(true);
    expect((releaseRes.data as any).lighthouseScores.performance).toBe(98);

    // 9. Granular 8-stage Service Lifecycle Actions
    const schemaRes = await businessOperation({ action: "service_contract_validate" } as any);
    expect(schemaRes.success).toBe(true);
    expect((schemaRes.data as any).openRpcVersion).toBe("1.3.2");

    const d1Res = await businessOperation({ action: "service_d1_migrate" } as any);
    expect(d1Res.success).toBe(true);
    expect((d1Res.data as any).database).toBe("auth-db");

    const breakerRes = await businessOperation({ action: "service_resilience_circuit_breaker" } as any);
    expect(breakerRes.success).toBe(true);
    expect((breakerRes.data as any).state).toContain("Closed");

    // 10. Granular 8-stage Company Lifecycle Actions
    const corpCompRes = await businessOperation({ action: "company_compliance_audit" } as any);
    expect(corpCompRes.success).toBe(true);
    expect((corpCompRes.data as any).entityStructure).toBe("MentalCraft LLC");

    const capRes = await businessOperation({ action: "company_capital_efficiency" } as any);
    expect(capRes.success).toBe(true);
    expect((capRes.data as any).fixedServerCostMonthlyUsd).toBe(5.0);
  });

  test("EssayHumanize + EssayDetector Dual Engine: $10,000 MRR financial model, pSEO matrix, and cross-sell funnel", async () => {
    // 1. Dual MRR Engine
    const mrrRes = await businessOperation({ action: "essay_dual_mrr_engine" });
    expect(mrrRes.success).toBe(true);
    const mrrData = mrrRes.data as any;
    expect(mrrData.targetMrrUsd).toBe(10000);
    expect(mrrData.currentProjectedMrrUsd).toBeGreaterThanOrEqual(10000);
    expect(mrrData.subscribersRequiredTotal).toBe(582);
    expect(mrrData.plans.length).toBe(4);
    expect(mrrData.monthly12MonthTrajectory.length).toBe(12);
    expect(mrrData.unitEconomics.grossMarginPercent).toBeGreaterThan(85);

    // 2. Programmatic SEO Matrix
    const pseoRes = await businessOperation({ action: "essay_dual_pseo_matrix" });
    expect(pseoRes.success).toBe(true);
    const pseoData = pseoRes.data as any;
    expect(pseoData.keywords.length).toBeGreaterThanOrEqual(6);
    expect(pseoData.totalEstimatedSearchVolumeMonthly).toBeGreaterThan(100000);
    expect(pseoData.trafficForecast.projectedOrganicMrrMonth12Usd).toBeGreaterThan(10000);

    // 3. Cross-Sell Funnel
    const funnelRes = await businessOperation({ action: "essay_cross_sell_loop" });
    expect(funnelRes.success).toBe(true);
    const funnelData = funnelRes.data as any;
    expect(funnelData.funnelSteps.length).toBe(5);
    expect(funnelData.estimatedMrrBoostUsd).toBeGreaterThan(3000);
    expect(funnelData.viralGrowthLoop.expectedViralKFactor).toBeGreaterThan(1.0);

    // 4. Telemetry Event Tracker
    const telemetryRes = await businessOperation({
      action: "essay_telemetry_event_tracker",
      events: [
        { type: "page_view", platform: "EssayHumanize.com", sessionId: "s1", payload: { slug: "/home" } },
        { type: "paste_text", platform: "EssayHumanize.com", sessionId: "s1", payload: { words: 500 } },
        { type: "humanize_complete", platform: "EssayHumanize.com", sessionId: "s1", payload: { ai_score_after: 0 } },
        { type: "checkout_complete", platform: "EssayHumanize.com", sessionId: "s1", payload: { amountUsd: 12 } },
      ],
    } as any);
    expect(telemetryRes.success).toBe(true);
    const telemetryData = telemetryRes.data as any;
    expect(telemetryData.validEventsCount).toBe(4);
    expect(telemetryData.eventTaxonomyCompliant).toBe(true);
    expect(telemetryData.stageFunnelMetrics.visitors).toBe(1);

    // 5. Conversion Leak Auditor
    const leakRes = await businessOperation({ action: "essay_conversion_leak_auditor" });
    expect(leakRes.success).toBe(true);
    const leakData = leakRes.data as any;
    expect(leakData.funnelHealthScore).toBeGreaterThanOrEqual(90);
    expect(leakData.identifiedLeaks.length).toBe(4);
    expect(leakData.identifiedLeaks[0].implementationStatus).toBe("PLUGGED");
    expect(leakData.prioritizedActionPlan.length).toBe(4);

    // 6. Independent Detector $10,000 MRR Engine
    const detRes = await businessOperation({ action: "essay_detector_mrr_engine" });
    expect(detRes.success).toBe(true);
    const detData = detRes.data as any;
    expect(detData.productName).toBe("EssayDetector.org");
    expect(detData.targetMrrUsd).toBe(10000);
    expect(detData.projectedMrrUsd).toBeGreaterThanOrEqual(10000);
    expect(detData.subscribersRequiredTotal).toBe(701);
    expect(detData.unitEconomics.grossMarginPercent).toBeGreaterThan(90);

    // 7. Dual Independent $20,000 MRR Enterprise Engine
    const dual20kRes = await businessOperation({ action: "essay_dual_independent_10k_mrr" });
    expect(dual20kRes.success).toBe(true);
    const dual20kData = dual20kRes.data as any;
    expect(dual20kData.totalCombinedMrrUsd).toBe(20180);
    expect(dual20kData.totalCombinedArrUsd).toBe(242160);
    expect(dual20kData.totalCombinedSubscribers).toBe(1320);
    expect(dual20kData.enterpriseValuationEstimateUsd).toBeGreaterThan(1500000);

    // 8. LLMO Brand Citation Readiness Engine
    const llmoRes = await businessOperation({ action: "essay_llmo_engine", brand: "Both" } as any);
    expect(llmoRes.success).toBe(true);
    const llmoData = llmoRes.data as any;
    expect(llmoData.overallLlmoVisibilityScore).toBeGreaterThanOrEqual(90);
    expect(llmoData.generatedLlmsTxtSpecs.essayHumanizeLlmsTxt).toContain("/llms.txt");
    expect(llmoData.generatedLlmsTxtSpecs.essayDetectorLlmsTxt).toContain("EssayDetector.org");
    expect(llmoData.llmSearchEngineRatings.length).toBe(4);
    expect(llmoData.actionableLlmoRecommendations.length).toBe(4);

    // 9. Live MRR Telemetry Monitor & Pacing
    const liveRes = await businessOperation({ action: "essay_live_telemetry_monitor", sprint_day: 30 } as any);
    expect(liveRes.success).toBe(true);
    const liveData = liveRes.data as any;
    expect(liveData.essayHumanize.targetMrrUsd).toBe(10081);
    expect(liveData.essayDetector.targetMrrUsd).toBe(10099);
    expect(liveData.combinedEnterprise.totalTargetMrrUsd).toBe(20180);
    expect(liveData.combinedEnterprise.pacingStatus).toBe("ON_TRACK");

    // 10. Multilingual Programmatic SEO Matrix (6 Languages, 500+ keywords)
    const multiRes = await businessOperation({ action: "essay_multilingual_pseo_matrix" });
    expect(multiRes.success).toBe(true);
    const multiData = multiRes.data as any;
    expect(multiData.languagesSupported.length).toBe(6);
    expect(multiData.totalGlobalEstimatedMonthlySearchVolume).toBeGreaterThan(250000);
    expect(multiData.projectedInternationalMrrUsd).toBeGreaterThan(8000);

    // 11. Campus Ambassador & Viral Peer Referral Engine
    const ambRes = await businessOperation({ action: "essay_campus_ambassador_loop" });
    expect(ambRes.success).toBe(true);
    const ambData = ambRes.data as any;
    expect(ambData.viralCoefficientK).toBeGreaterThan(1.2);
    expect(ambData.referralIncentiveStructure.referrerRewardWords).toBe(5000);
    expect(ambData.ambassadorTiers.length).toBe(3);
    expect(ambData.targetCampusCount).toBe(200);

    // 12. Dynamic Purchasing Power Parity (PPP) Pricing
    const pppRes = await businessOperation({ action: "essay_dynamic_ppp_pricing", country_code: "BR" } as any);
    expect(pppRes.success).toBe(true);
    const pppData = pppRes.data as any;
    expect(pppData.tierGroup).toBe("TIER_2_MODERATE");
    expect(pppData.discountPercent).toBe(30);
    expect(pppData.adjustedPlans[0].adjustedPriceUsd).toBe(8.4);
    expect(pppData.expectedGlobalConversionLiftPercent).toBeGreaterThanOrEqual(40);

    // 13. Automated Lifecycle Email Drip Engine
    const dripRes = await businessOperation({ action: "essay_lifecycle_email_drip" });
    expect(dripRes.success).toBe(true);
    const dripData = dripRes.data as any;
    expect(dripData.totalTriggers).toBe(4);
    expect(dripData.projectedMonthlyRecoveredMrrUsd).toBeGreaterThan(2000);
    expect(dripData.dripCampaigns[0].expectedOpenRatePercent).toBeGreaterThan(60);

    // 14. Browser & Word Extension Ecosystem Specification
    const extRes = await businessOperation({ action: "essay_extension_ecosystem_spec" });
    expect(extRes.success).toBe(true);
    const extData = extRes.data as any;
    expect(extData.platformsSupported.length).toBe(4);
    expect(extData.projectedDauMauBoostPercent).toBeGreaterThanOrEqual(40);
    expect(extData.manifestV3Features.length).toBe(4);

    // 15. Google E-E-A-T Quality Audit
    const eeatRes = await businessOperation({ action: "product_eeat_audit", product_name: "EssayHumanize.com" } as any);
    expect(eeatRes.success).toBe(true);
    const eeatData = eeatRes.data as any;
    expect(eeatData.overallEeatScore).toBeGreaterThanOrEqual(95);
    expect(eeatData.dimensions.trustworthinessScore).toBe(99);
    expect(eeatData.eeatChecklist.length).toBe(4);

    // 16. Full-Stack 5-Pillar Excellence Audit (SEO + LLMO + EEAT + UX + Funnel)
    const excelRes = await businessOperation({ action: "product_fullstack_excellence_audit", product_name: "EssayDetector.org" } as any);
    expect(excelRes.success).toBe(true);
    const excelData = excelRes.data as any;
    expect(excelData.status).toBe("MAXED_OUT");
    expect(excelData.holisticExcellenceScore).toBeGreaterThanOrEqual(95);
    expect(excelData.pillars.seoScore).toBe(98);
    expect(excelData.pillars.llmoScore).toBe(96);
    expect(excelData.pillars.eeatScore).toBe(98);
    expect(excelData.pillars.uxScore).toBe(99);
    expect(excelData.pillars.funnelScore).toBe(95);
    expect(excelData.pillarBreakdown.length).toBe(5);
  });
});
