/**
 * Plugin/Business Core - Business & Venture 8-Stage Lifecycle Intelligence Engine
 *
 * Symmetrical 8-stage commercial lifecycle engine managing ventures from ideation to scale & moats across:
 * 1. Websites (Web Apps, SaaS, Content, E-commerce, B2B Platforms)
 * 2. Mobile/Desktop Apps (iOS/Android App Store, ASO, IAP, Subscriptions)
 * 3. Games (Steam, Mobile, WebGL, Engagement, ARPDAU, Gacha/Battle Pass)
 * 4. Shops (E-Commerce D2C, TikTok Shop, Amazon FBA, Print-On-Demand Merch, Digital Downloads)
 *
 * 8-Stage Commercial Lifecycle Architecture:
 * - Stage 1: Ideation & Market Sizing (TAM/SAM/SOM, Niche Discovery)
 * - Stage 2: Validation & Prototype PMF (Sean Ellis 40% rule, Smoke testing, Value hypothesis)
 * - Stage 3: Acquisition & Discovery (SEO KD, ASO, Steam Wishlists, TikTok Shop ROAS, TrafficCV)
 * - Stage 4: Activation & Funnel (Time-to-Value, Add-to-Cart ATC, Cart/Checkout Abandonment Recovery)
 * - Stage 5: Retention & Cohort Stickiness (D1/D7/D14/D30 curves, 30/60/90-Day Repurchase rate, DAU/MAU)
 * - Stage 6: Unit Economics & Telemetry (CAC, LTV, Payback, COGS, 3PL Shipping, ROAS, MRR/ARR/ARPDAU)
 * - Stage 7: Pricing Strategy & Revenue Optimization (Price elasticity curves, Bundles, AOV Boost, Tier A/B tests)
 * - Stage 8: Scale, Expansion & Moats (Virality K-Factor, Inventory ROP & Safety Stock, B2B Multi-seat)
 */

export * from "./modules/essay_growth.ts";

export const BUSINESS_PROTOCOL = "holar.business.v1" as const;

export type BusinessModality = "website" | "app" | "game" | "shop";

export type BusinessModule = "application" | "service" | "company";

export type BusinessProvider = "gefei" | "trafficcv" | "store_radar" | "auto";

export type BusinessAction =
  | "venture_market_validation"
  | "market_niche_discovery"
  | "venture_pmf_validation"
  | "venture_acquisition_audit"
  | "seo_keyword_difficulty"
  | "seo_batch_keywords"
  | "seo_link_budget"
  | "traffic_domain_overview"
  | "traffic_channel_breakdown"
  | "traffic_geo_distribution"
  | "traffic_competitor_comparison"
  | "venture_activation_funnel"
  | "venture_retention_curves"
  | "venture_unit_economics"
  | "venture_monetization_telemetry"
  | "market_stripe_radar"
  | "market_site_trajectory"
  | "product_traction_score"
  | "venture_pricing_experiment"
  | "venture_growth_playbook"
  | "venture_expansion_moat"
  | "spriteflow_mrr_engine"
  | "spriteflow_pseo_matrix"
  | "zero_cost_viral_loops"
  | "essay_dual_mrr_engine"
  | "essay_dual_pseo_matrix"
  | "essay_cross_sell_loop"
  | "essay_telemetry_event_tracker"
  | "essay_conversion_leak_auditor"
  | "essay_detector_mrr_engine"
  | "essay_dual_independent_10k_mrr"
  | "essay_llmo_engine"
  | "application_market_validation"
  | "application_niche_discovery"
  | "application_pmf_validation"
  | "application_product_traction"
  | "application_acquisition_audit"
  | "application_pseo_matrix"
  | "application_seo_keywords"
  | "application_zero_cost_viral_loops"
  | "application_activation_funnel"
  | "application_retention_curves"
  | "application_paywall_trigger"
  | "application_i18n_matrix"
  | "application_compliance_audit"
  | "application_release_checklist"
  | "service_contract_validate"
  | "service_auth_verify"
  | "service_monetization_checkout"
  | "service_event_dispatch"
  | "service_storage_presign"
  | "service_notification_deliver"
  | "service_d1_migrate"
  | "service_health_telemetry"
  | "service_resilience_circuit_breaker"
  | "service_practitioner_workbench"
  | "service_scale_battery_config"
  | "service_referral_dispatch"
  | "company_unit_economics"
  | "company_mrr_engine"
  | "company_pricing_experiment"
  | "company_monetization_telemetry"
  | "company_growth_playbook"
  | "company_expansion_moat"
  | "company_compliance_audit"
  | "company_capital_efficiency"
  | "list_actions";

export type MarketValidationResult = {
  ventureName: string;
  modality: BusinessModality;
  viabilityScore: number; // 0-100
  marketSize: {
    tamUsd: number;
    samUsd: number;
    somUsd: number;
  };
  recommendedMonetization: string;
  competitiveIntensity: "Low" | "Moderate" | "High" | "Fierce";
  keyRisks: string[];
  growthPlaybook: string[];
};

export type PmfValidationResult = {
  ventureName: string;
  modality: BusinessModality;
  pmfScorePercent: number; // Sean Ellis score (% who would be very disappointed without product)
  pmfStatus: "🟢 Strong PMF (>40%)" | "🟡 Moderate Traction (25-40%)" | "🔴 Pivot Required (<25%)";
  surveyRespondentsCount: number;
  smokeTestConversionPercent: number;
  coreValuePropositionValid: boolean;
  topRequestedFeatures: string[];
  verbatimInsights?: string[];
};

export type AcquisitionAuditResult = {
  ventureName: string;
  modality: BusinessModality;
  primaryAcquisitionChannel: string;
  channelScore: number; // 0-100
  metrics: Record<string, unknown>;
  actionableInsights: string[];
};

export type ActivationFunnelResult = {
  ventureName: string;
  modality: BusinessModality;
  overallActivationRatePercent: number;
  timeToValueMinutes: number;
  funnelSteps: Array<{
    stepNumber: number;
    stepName: string;
    conversionPercent: number;
    dropoffPercent: number;
    frictionReason?: string;
  }>;
  ahaMomentMilestone: string;
  recommendations: string[];
  abandonmentRecoveryFlow?: {
    triggerEvent: string;
    recoveryChannels: string[];
    estimatedRecoveryRatePercent: number;
  };
};

export type UnitEconomicsResult = {
  ventureName: string;
  modality: BusinessModality;
  cacUsd: number;
  ltvUsd: number;
  ltvToCacRatio: number;
  paybackPeriodMonths: number;
  grossMarginPercent: number;
  healthStatus: "🟢 Exceptional (LTV/CAC > 3x)" | "🟡 Borderline" | "🔴 Unprofitable Unit Economics";
  modalityMetrics: {
    mrrUsd?: number;
    arrUsd?: number;
    arpuUsd?: number;
    arpdauUsd?: number;
    storeCutPercent?: number;
    // Shop specific unit economics
    cogsUsd?: number;
    fulfillmentShippingUsd?: number;
    paymentGatewayCutPercent?: number;
    targetRoas?: number;
    refundReturnRatePercent?: number;
    netMarginPercent: number;
  };
};

export type RetentionCurvesResult = {
  ventureName: string;
  modality: BusinessModality;
  dauToMauRatio: number; // Stickiness
  retentionCurve: {
    d1Percent: number;
    d7Percent: number;
    d14Percent: number;
    d30Percent: number;
    // E-Commerce Shop Repurchase Rates
    d60Percent?: number;
    d90Percent?: number;
  };
  industryBenchmark: {
    d1Percent: number;
    d7Percent: number;
    d30Percent: number;
    d90Percent?: number;
  };
  cohortHealth: "Top Quartile" | "Average" | "Underperforming";
  churnRateMonthlyPercent: number;
  recommendations: string[];
};

export type MonetizationTelemetryResult = {
  ventureName: string;
  modality: BusinessModality;
  billingProvider: "Stripe" | "AppStore" | "GooglePlay" | "Steam" | "ShopifyPay" | "TikTokShop";
  totalRevenueUsd: number;
  growthRateMoMPercent: number;
  activePayingUsers: number;
  refundRatePercent: number;
  revenueTrajectory: "Exponential" | "Strong Growth" | "Plateau" | "Declining";
  tierDistribution: Array<{ tierName: string; revenueSharePercent: number; users: number }>;
};

export type PricingExperimentResult = {
  ventureName: string;
  modality: BusinessModality;
  optimalPriceUsd: number;
  revenuePerVisitorMaxUsd: number;
  tiersEvaluated: Array<{
    priceUsd: number;
    estimatedConversionPercent: number;
    expectedRevenuePerVisitorUsd: number;
    recommendation: "Underpriced" | "Optimal Revenue Max" | "Overpriced / Friction";
  }>;
  bundleTiers?: Array<{
    bundleName: string;
    tierPriceUsd: number;
    discountPercent: number;
    estimatedTakeRatePercent: number;
    projectedAovBoostPercent: number;
  }>;
  aovBoostStrategy?: string[];
};

export type GrowthPlaybookResult = {
  ventureName: string;
  modality: BusinessModality;
  horizonDays: number;
  sprints: Array<{
    phase: string;
    dayRange: string;
    focus: string;
    deliverables: string[];
    targetKpi: string;
  }>;
};

export type ExpansionMoatResult = {
  ventureName: string;
  modality: BusinessModality;
  viralityKFactor: number;
  viralStatus: "🔥 Self-Sustaining Viral Loop (K > 1.0)" | "⚡ Viral Assisted (K 0.4 - 1.0)" | "Paid / Organic Dependent (K < 0.4)";
  expansionVectors: Array<{ vector: string; readiness: "Ready" | "In Progress" | "Future"; estimatedMrrLiftUsd: number }>;
  defensiveMoats: Array<{ moatType: "Network Effects" | "Switching Costs" | "Data Flywheel" | "Brand & Community" | "Supply Chain & 3PL"; strengthScore: number }>;
  // Shop inventory reorder point
  inventoryOptimization?: {
    reorderPointUnits: number;
    safetyStockUnits: number;
    leadTimeDemandUnits: number;
    leadTimeDays: number;
    dailyDemandUnits: number;
    serviceLevelPercent: number;
    formula: string;
  };
};

export type KeywordDifficultyResult = {
  keyword: string;
  kd: number;
  difficultyTier: "🟢 Low-Hanging Fruit" | "🟡 Moderate Competition" | "🔴 High Authority / Red Ocean";
  searchVolume: number;
  cpc?: number;
  linkBudget: {
    targetDr: number;
    requiredBacklinks: number;
    minHomepageDr: number;
  };
  serpTop10?: Array<{
    position: number;
    domain: string;
    url: string;
    dr: number;
    isHomepage: boolean;
  }>;
};

export type StripeSiteInsight = {
  domain: string;
  name: string;
  category: string;
  monthlyCheckoutVisits: number;
  growthRateMoM: string;
  estimatedMrr: string;
  tier: "darkhorse" | "surged" | "steady";
};

export type TrafficCvDomainOverview = {
  domain: string;
  monthlyVisits: number;
  monthlyUniqueVisitors: number;
  avgVisitDurationSeconds: number;
  pagesPerVisit: number;
  bounceRatePercent: number;
  globalRank: number;
  categoryRank?: number;
  category?: string;
  estimatedTrafficValueUsd?: number;
};

export type TrafficCvChannelBreakdown = {
  domain: string;
  channels: {
    direct: number;
    organicSearch: number;
    referral: number;
    social: number;
    paidSearch: number;
    email: number;
  };
  primaryChannel: "Direct" | "Organic Search" | "Referral" | "Social" | "Paid Search";
};

export type TrafficCvGeoDistribution = {
  domain: string;
  topCountries: Array<{
    countryCode: string;
    countryName: string;
    trafficSharePercent: number;
  }>;
};

export type TrafficCvCompetitorComparison = {
  domains: string[];
  metrics: Array<{
    domain: string;
    monthlyVisits: number;
    organicShare: number;
    bounceRate: number;
    globalRank: number;
  }>;
  leaderDomain: string;
};

export type TractionScoreResult = {
  product: string;
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D";
  dimensions: {
    marketOpportunity: number;
    seoViability: number;
    revenueAffordance: number;
    competitiveMoat: number;
  };
  recommendations: string[];
};

export type SpriteFlowCohortMonth = {
  month: number;
  monthName: string;
  freeUsers: number;
  proSubscribers: number;
  studioSubscribers: number;
  totalSubscribers: number;
  mrrUsd: number;
  arrUsd: number;
  grossRevenueUsd: number;
  churnedSubscribers: number;
  churnedMrrUsd: number;
  netNewMrrUsd: number;
  cumulativeRevenueUsd: number;
};

export type SpriteFlowMrrEngineResult = {
  ventureName: string;
  targetMrrUsd: number;
  targetArrUsd: number;
  currentStatus: {
    modelType: "Freemium + Developer SaaS Subscriptions";
    currency: "USD";
    breakEvenMonth: number;
  };
  pricingTiers: {
    freeUsd: number;
    proUsd: number;
    studioUsd: number;
  };
  targetSubscribers: {
    pro: number;
    studio: number;
    totalPaying: number;
    proRevenueUsd: number;
    studioRevenueUsd: number;
    totalActualMrrUsd: number;
    blendedArpuUsd: number;
  };
  unitEconomics: {
    blendedArpuUsd: number;
    monthlyChurnRatePercent: number;
    customerLifespanMonths: number;
    grossMarginPercent: number;
    ltvUsd: number;
    organicCacUsd: number;
    ltvToCacRatio: number;
    paybackPeriodMonths: number;
    burnRateMonthlyUsd: number;
    netMarginAtScalePercent: number;
  };
  cohortProjections: SpriteFlowCohortMonth[];
  growthMilestones: Array<{
    milestone: string;
    targetMrrUsd: number;
    subscribersRequired: { pro: number; studio: number };
    projectedMonth: number;
    tacticalFocus: string;
  }>;
  zeroSpendPaybackVelocity: {
    cacSpend: number;
    paybackVelocityDays: number;
    primaryFreeGrowthEngines: string[];
    capitalEfficiencyScore: string;
  };
};

export type PseoKeywordEntry = {
  keyword: string;
  ecosystem:
    | "Godot 4"
    | "Unity"
    | "Aseprite"
    | "TexturePacker"
    | "Unreal Engine 5"
    | "GameMaker"
    | "Phaser"
    | "Defold"
    | "Cross-Platform"
    | "RPG Maker"
    | "Bevy"
    | "Pygame";
  searchIntent: "informational" | "transactional" | "commercial" | "navigational";
  estimatedMonthlyVolume: number;
  kd: number;
  cpcUsd: number;
  slug: string;
  priorityTier: "P0" | "P1" | "P2";
  targetPageType: "tool_landing" | "comparison_alternative" | "tutorial_guide" | "converter_utility" | "integration_doc";
};

export type SpriteFlowPseoMatrixResult = {
  ventureName: string;
  totalKeywords: number;
  totalMonthlySearchVolume: number;
  averageKd: number;
  highPriorityCount: number;
  ecosystemBreakdown: Record<string, { count: number; totalVolume: number; avgKd: number }>;
  intentBreakdown: Record<string, { count: number; totalVolume: number }>;
  keywords: PseoKeywordEntry[];
  topP0Keywords: PseoKeywordEntry[];
  programmaticSeoStrategy: {
    slugArchitecture: string;
    indexingCadence: string;
    contentTemplateTypes: string[];
    schemaMarkup: string[];
    internalLinkingStrategy: string;
  };
};

export type ViralVectorDeliverable = {
  vectorId: string;
  vectorName: string;
  channel: string;
  kFactorContribution: number;
  projectedMonthlySignups: number;
  conversionToProPercent: number;
  stepByStepDeliverables: Array<{
    stepNumber: number;
    title: string;
    action: string;
    timeline: string;
    status: "Ready" | "In Progress" | "Planned";
  }>;
  kpis: Array<{
    metric: string;
    target: string;
    measurementWindow: string;
  }>;
};

export type ZeroCostViralLoopsResult = {
  ventureName: string;
  blendedKFactor: number;
  viralLoopStatus: "🔥 Self-Sustaining Viral Loop (K > 1.0)" | "⚡ Viral Assisted (K 0.4 - 1.0)" | "Paid / Organic Dependent (K < 0.4)";
  totalMonthlyOrganicSignups: number;
  zeroCostMarketingBudgetUsd: number;
  vectors: ViralVectorDeliverable[];
  flywheelPhases: Array<{
    phase: string;
    mechanism: string;
    compoundingEffect: string;
  }>;
  executionCalendar: Array<{
    week: string;
    focusVector: string;
    primaryDeliverable: string;
    targetMilestone: string;
  }>;
};

export type BusinessInput = {
  action: BusinessAction;
  modality?: BusinessModality;
  venture_name?: string;
  target_audience?: string;
  monetization_model?: "subscription" | "freemium" | "iap" | "ads" | "one_time" | "battle_pass" | "ecommerce_cogs" | "digital_download";
  keyword?: string;
  keywords?: string[];
  domain?: string;
  domains?: string[];
  competitors?: string[];
  cac?: number;
  arpu?: number;
  dau?: number;
  mau?: number;
  d1_retention?: number;
  d7_retention?: number;
  d30_retention?: number;
  d90_retention?: number;
  price_points?: number[];
  cogs?: number;
  shipping_cost?: number;
  lead_time_days?: number;
  daily_demand_units?: number;
  demand_std_dev?: number;
  service_level_percent?: number;
  pmf_score?: number;
  smoke_test_ctr?: number;
  ttv_minutes?: number;
  provider?: BusinessProvider;
  month?: string;
  query?: string;
  product_name?: string;
  gl?: string;
  hl?: string;
  force?: boolean;
  // SpriteFlow & Growth Action Parameters
  target_mrr?: number;
  pro_price?: number;
  studio_price?: number;
  pro_subscribers?: number;
  studio_subscribers?: number;
  engine_filter?: string;
  min_volume?: number;
  max_kd?: number;
};

export type BusinessResult = {
  protocol: typeof BUSINESS_PROTOCOL;
  action: BusinessAction;
  success: boolean;
  timestamp: string;
  provider?: BusinessProvider;
  data: unknown;
  diagnostics?: string[];
};

export function formatBusinessSummary(result: BusinessResult): string {
  if (!result.success) {
    return `✗ Business ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_actions": {
      const data = result.data as { totalActions: number; actions: Array<{ name: string }> };
      return `Business Actions (${data.totalActions}): ${data.actions.map((a) => a.name).join(", ")}`;
    }
    case "venture_market_validation": {
      const data = result.data as MarketValidationResult;
      return `Market Validation [${data.modality.toUpperCase()}]: ${data.ventureName} → Viability ${data.viabilityScore}/100 (TAM: $${(data.marketSize.tamUsd / 1e9).toFixed(1)}B, Mon: ${data.recommendedMonetization})`;
    }
    case "market_niche_discovery": {
      const data = result.data as { query?: string; totalNiches?: number; niches?: Array<{ name: string; estimatedMrr?: string }> };
      const count = data.niches?.length ?? data.totalNiches ?? 0;
      return `Market Niche Discovery: Found ${count} high-opportunity niches for '${data.query ?? "market"}'`;
    }
    case "venture_pmf_validation": {
      const data = result.data as PmfValidationResult;
      return `PMF Validation [${data.modality.toUpperCase()}]: ${data.pmfScorePercent}% Sean Ellis Score [${data.pmfStatus}] (${data.surveyRespondentsCount} respondents, Smoke Test: ${data.smokeTestConversionPercent}%)`;
    }
    case "venture_acquisition_audit": {
      const data = result.data as AcquisitionAuditResult;
      return `Acquisition Audit [${data.modality.toUpperCase()}]: Primary '${data.primaryAcquisitionChannel}' (Channel Score: ${data.channelScore}/100)`;
    }
    case "venture_activation_funnel": {
      const data = result.data as ActivationFunnelResult;
      return `Activation Funnel [${data.modality.toUpperCase()}]: ${data.overallActivationRatePercent}% Activation Rate (TTV: ${data.timeToValueMinutes} min, Aha: "${data.ahaMomentMilestone}")`;
    }
    case "venture_unit_economics": {
      const data = result.data as UnitEconomicsResult;
      return `Unit Economics [${data.modality.toUpperCase()}]: LTV/CAC ${data.ltvToCacRatio.toFixed(1)}x (Payback: ${data.paybackPeriodMonths}mo, Margin: ${data.grossMarginPercent}%) [${data.healthStatus}]`;
    }
    case "venture_retention_curves": {
      const data = result.data as RetentionCurvesResult;
      const d90Str = data.retentionCurve.d90Percent ? ` | D90 ${data.retentionCurve.d90Percent}%` : "";
      return `Retention Curves [${data.modality.toUpperCase()}]: D1 ${data.retentionCurve.d1Percent}% | D7 ${data.retentionCurve.d7Percent}% | D30 ${data.retentionCurve.d30Percent}%${d90Str} (DAU/MAU: ${(data.dauToMauRatio * 100).toFixed(0)}% [${data.cohortHealth}])`;
    }
    case "venture_monetization_telemetry": {
      const data = result.data as MonetizationTelemetryResult;
      return `Monetization [${data.billingProvider}]: $${data.totalRevenueUsd.toLocaleString()} (+${data.growthRateMoMPercent}% MoM, Trajectory: ${data.revenueTrajectory})`;
    }
    case "venture_pricing_experiment": {
      const data = result.data as PricingExperimentResult;
      const bundleStr = data.bundleTiers && data.bundleTiers.length > 0 ? ` + ${data.bundleTiers.length} bundle tiers` : "";
      return `Pricing Experiment [${data.modality.toUpperCase()}]: Optimal Price $${data.optimalPriceUsd} (Max Revenue: $${data.revenuePerVisitorMaxUsd.toFixed(2)}/visitor across ${data.tiersEvaluated.length} price points${bundleStr})`;
    }
    case "venture_growth_playbook": {
      const data = result.data as GrowthPlaybookResult;
      return `Growth Playbook [${data.modality.toUpperCase()}]: ${data.horizonDays}-Day Sprint Plan (${data.sprints.length} phases: ${data.sprints.map((s) => s.phase).join(" ➔ ")})`;
    }
    case "venture_expansion_moat": {
      const data = result.data as ExpansionMoatResult;
      const ropStr = data.inventoryOptimization ? ` | ROP: ${data.inventoryOptimization.reorderPointUnits} units` : "";
      return `Expansion & Moats [${data.modality.toUpperCase()}]: K-Factor ${data.viralityKFactor.toFixed(2)} [${data.viralStatus}] (${data.expansionVectors.length} expansion vectors${ropStr})`;
    }
    case "seo_keyword_difficulty": {
      const data = result.data as KeywordDifficultyResult;
      return `SEO KD: "${data.keyword}" → KD ${data.kd}/100 [${data.difficultyTier}] | Vol: ${data.searchVolume.toLocaleString()} | Links needed: ${data.linkBudget.requiredBacklinks}`;
    }
    case "seo_batch_keywords": {
      const data = result.data as { totalKeywords?: number; results?: unknown[] };
      return `SEO Batch: Evaluated ${data.totalKeywords ?? data.results?.length ?? 0} keywords matrix`;
    }
    case "seo_link_budget": {
      const data = result.data as { keyword: string; kd: number; linkBudget: { targetDr: number; requiredBacklinks: number } };
      return `SEO Link Budget: "${data.keyword}" → Target DR ${data.linkBudget.targetDr} (${data.linkBudget.requiredBacklinks} backlinks needed)`;
    }
    case "traffic_domain_overview": {
      const data = result.data as TrafficCvDomainOverview;
      return `TrafficCV: ${data.domain} → ${data.monthlyVisits.toLocaleString()} visits/mo (#${data.globalRank.toLocaleString()} global, Bounce: ${data.bounceRatePercent}%)`;
    }
    case "traffic_channel_breakdown": {
      const data = result.data as TrafficCvChannelBreakdown;
      return `Traffic Channels: ${data.domain} → Primary '${data.primaryChannel}' (${data.channels.organicSearch}% Search, ${data.channels.direct}% Direct, ${data.channels.referral}% Referral)`;
    }
    case "traffic_geo_distribution": {
      const data = result.data as TrafficCvGeoDistribution;
      return `Traffic Geo: ${data.domain} → Top country ${data.topCountries[0]?.countryName ?? "US"} (${data.topCountries[0]?.trafficSharePercent ?? 0}%)`;
    }
    case "traffic_competitor_comparison": {
      const data = result.data as TrafficCvCompetitorComparison;
      return `Traffic Benchmark: Leader '${data.leaderDomain}' across ${data.domains.length} domains analyzed`;
    }
    case "product_traction_score": {
      const data = result.data as TractionScoreResult;
      return `Traction Rank: ${data.product} → Grade ${data.grade} (${data.score}/100) [Mkt: ${data.dimensions.marketOpportunity}, SEO: ${data.dimensions.seoViability}, Rev: ${data.dimensions.revenueAffordance}]`;
    }
    case "market_stripe_radar": {
      const data = result.data as { total: number; leaderboards: StripeSiteInsight[] };
      return `Stripe Radar: ${data.total} surged checkout domains tracked (Leader: ${data.leaderboards[0]?.domain ?? ""})`;
    }
    case "market_site_trajectory": {
      const data = result.data as { domain: string; estimatedMonthlyRevenueUsd?: number };
      return `Site Trajectory: ${data.domain} billing telemetry tracked`;
    }
    case "spriteflow_mrr_engine": {
      const data = result.data as SpriteFlowMrrEngineResult;
      return `SpriteFlow MRR Engine: $${data.targetMrrUsd.toLocaleString()} MRR ($${data.targetArrUsd.toLocaleString()} ARR) → Target: ${data.targetSubscribers.pro} Pro ($${data.pricingTiers.proUsd}/mo) + ${data.targetSubscribers.studio} Studio ($${data.pricingTiers.studioUsd}/mo) | LTV: $${data.unitEconomics.ltvUsd.toFixed(2)} (Payback: ${data.unitEconomics.paybackPeriodMonths}mo, CAC: $${data.unitEconomics.organicCacUsd})`;
    }
    case "spriteflow_pseo_matrix": {
      const data = result.data as SpriteFlowPseoMatrixResult;
      return `SpriteFlow pSEO: Generated ${data.totalKeywords} low-KD keywords across ${Object.keys(data.ecosystemBreakdown).length} ecosystems (Total Vol: ${data.totalMonthlySearchVolume.toLocaleString()}/mo, Avg KD: ${data.averageKd})`;
    }
    case "zero_cost_viral_loops": {
      const data = result.data as ZeroCostViralLoopsResult;
      return `Zero-Cost Viral Loops: ${data.vectors.length} vectors analyzed → Blended K-Factor: ${data.blendedKFactor.toFixed(2)} [${data.viralLoopStatus}] (Projected Organic Signups: ${data.totalMonthlyOrganicSignups.toLocaleString()}/mo)`;
    }
    default: {
      return `✓ Business ${result.action} executed successfully.`;
    }
  }
}

export const compactBusinessResult = formatBusinessSummary;
