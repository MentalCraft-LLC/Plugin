/**
 * Plugin/Business Core - Business & Venture Lifecycle Intelligence Engine
 *
 * Symmetrical capability engine managing the full lifecycle of commercial ventures across:
 * 1. Websites (Web Apps, SaaS, Content, E-commerce)
 * 2. Mobile/Desktop Apps (iOS/Android App Store, ASO, IAP, Subscriptions)
 * 3. Games (Steam, Mobile, WebGL, Engagement, ARPDAU, Gacha/Battle Pass)
 *
 * Covers all 5 stages of the business lifecycle:
 * - Stage 1: Market & Idea Validation (TAM/SAM/SOM, Niche Viability)
 * - Stage 2: Acquisition & Traffic Discovery (SEO KD, ASO, Steam Wishlists, TrafficCV)
 * - Stage 3: Unit Economics & Financial Modeling (CAC, LTV, Payback, MRR/ARR/ARPDAU)
 * - Stage 4: Retention & Cohort Engagement (D1/D7/D30 Curves, DAU/MAU Stickiness)
 * - Stage 5: Monetization & Payment Telemetry (Stripe, App Store, Steam Invoicing)
 */

export const BUSINESS_PROTOCOL = "holar.business.v1" as const;

export type BusinessModality = "website" | "app" | "game";

export type BusinessProvider = "gefei" | "trafficcv" | "store_radar" | "auto";

export type BusinessAction =
  | "venture_market_validation"
  | "venture_acquisition_audit"
  | "venture_unit_economics"
  | "venture_retention_curves"
  | "venture_monetization_telemetry"
  | "seo_keyword_difficulty"
  | "seo_batch_keywords"
  | "seo_link_budget"
  | "traffic_domain_overview"
  | "traffic_channel_breakdown"
  | "traffic_geo_distribution"
  | "traffic_competitor_comparison"
  | "market_stripe_radar"
  | "market_site_trajectory"
  | "market_niche_discovery"
  | "product_traction_score"
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

export type AcquisitionAuditResult = {
  ventureName: string;
  modality: BusinessModality;
  primaryAcquisitionChannel: string;
  channelScore: number; // 0-100
  metrics: Record<string, unknown>;
  actionableInsights: string[];
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
  };
  industryBenchmark: {
    d1Percent: number;
    d7Percent: number;
    d30Percent: number;
  };
  cohortHealth: "Top Quartile" | "Average" | "Underperforming";
  churnRateMonthlyPercent: number;
  recommendations: string[];
};

export type MonetizationTelemetryResult = {
  ventureName: string;
  modality: BusinessModality;
  billingProvider: "Stripe" | "AppStore" | "GooglePlay" | "Steam";
  totalRevenueUsd: number;
  growthRateMoMPercent: number;
  activePayingUsers: number;
  refundRatePercent: number;
  revenueTrajectory: "Exponential" | "Strong Growth" | "Plateau" | "Declining";
  tierDistribution: Array<{ tierName: string; revenueSharePercent: number; users: number }>;
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

export type BusinessInput = {
  action: BusinessAction;
  modality?: BusinessModality;
  venture_name?: string;
  target_audience?: string;
  monetization_model?: "subscription" | "freemium" | "iap" | "ads" | "one_time" | "battle_pass";
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
  provider?: BusinessProvider;
  month?: string;
  query?: string;
  product_name?: string;
  gl?: string;
  hl?: string;
  force?: boolean;
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
    case "venture_acquisition_audit": {
      const data = result.data as AcquisitionAuditResult;
      return `Acquisition Audit [${data.modality.toUpperCase()}]: Primary '${data.primaryAcquisitionChannel}' (Channel Score: ${data.channelScore}/100)`;
    }
    case "venture_unit_economics": {
      const data = result.data as UnitEconomicsResult;
      return `Unit Economics [${data.modality.toUpperCase()}]: LTV/CAC ${data.ltvToCacRatio.toFixed(1)}x (Payback: ${data.paybackPeriodMonths}mo, Margin: ${data.grossMarginPercent}%) [${data.healthStatus}]`;
    }
    case "venture_retention_curves": {
      const data = result.data as RetentionCurvesResult;
      return `Retention Curves [${data.modality.toUpperCase()}]: D1 ${data.retentionCurve.d1Percent}% | D7 ${data.retentionCurve.d7Percent}% | D30 ${data.retentionCurve.d30Percent}% (DAU/MAU: ${(data.dauToMauRatio * 100).toFixed(0)}% [${data.cohortHealth}])`;
    }
    case "venture_monetization_telemetry": {
      const data = result.data as MonetizationTelemetryResult;
      return `Monetization [${data.billingProvider}]: $${data.totalRevenueUsd.toLocaleString()} (+${data.growthRateMoMPercent}% MoM, Trajectory: ${data.revenueTrajectory})`;
    }
    case "seo_keyword_difficulty": {
      const data = result.data as KeywordDifficultyResult;
      return `SEO KD: "${data.keyword}" → KD ${data.kd}/100 [${data.difficultyTier}] | Vol: ${data.searchVolume.toLocaleString()} | Links needed: ${data.linkBudget.requiredBacklinks}`;
    }
    case "traffic_domain_overview": {
      const data = result.data as TrafficCvDomainOverview;
      return `TrafficCV: ${data.domain} → ${data.monthlyVisits.toLocaleString()} visits/mo (#${data.globalRank.toLocaleString()} global, Bounce: ${data.bounceRatePercent}%)`;
    }
    case "traffic_channel_breakdown": {
      const data = result.data as TrafficCvChannelBreakdown;
      return `Traffic Channels: ${data.domain} → Primary '${data.primaryChannel}' (${data.channels.organicSearch}% Search, ${data.channels.direct}% Direct, ${data.channels.referral}% Referral)`;
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
    default: {
      return `✓ Business ${result.action} executed successfully.`;
    }
  }
}

export const compactBusinessResult = formatBusinessSummary;
