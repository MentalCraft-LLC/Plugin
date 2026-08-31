/**
 * Plugin/Business Core - Commercial, SEO & Multi-Source Market Intelligence Engine
 *
 * Symmetrical capability engine for Holar's Business pillar.
 * Integrates:
 * - Gefei SEO (Google KD 0-100, link budgets, SERP Top 10, Stripe Radar revenue leaderboards)
 * - TrafficCV (Global domain traffic visits, channel breakdown, geo distribution, competitor comparison)
 * - Traction Rank (Multidimensional product viability index)
 */

import type {
  TrafficCvDomainOverview,
  TrafficCvChannelBreakdown,
  TrafficCvGeoDistribution,
  TrafficCvCompetitorComparison,
} from "./trafficcv.ts";

export const BUSINESS_PROTOCOL = "holar.business.v1" as const;

export type BusinessProvider = "gefei" | "trafficcv" | "auto";

export type BusinessAction =
  | "seo_keyword_difficulty"
  | "seo_batch_keywords"
  | "seo_link_budget"
  | "market_stripe_radar"
  | "market_site_trajectory"
  | "market_niche_discovery"
  | "traffic_domain_overview"
  | "traffic_channel_breakdown"
  | "traffic_geo_distribution"
  | "traffic_competitor_comparison"
  | "product_traction_score"
  | "list_actions";

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
  provider?: BusinessProvider;
  keyword?: string;
  keywords?: string[];
  domain?: string;
  domains?: string[];
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

export type {
  TrafficCvDomainOverview,
  TrafficCvChannelBreakdown,
  TrafficCvGeoDistribution,
  TrafficCvCompetitorComparison,
};
