/**
 * Plugin/Business Core - Commercial, SEO & Market Intelligence Engine
 *
 * Symmetrical capability engine for Holar's Business pillar.
 * Integrates Google SEO keyword difficulty, SERP forensics, Stripe Radar revenue leaderboards,
 * competitor MRR trajectories, and product monetization traction metrics.
 */

export const BUSINESS_PROTOCOL = "holar.business.v1" as const;

export type BusinessAction =
  | "seo_keyword_difficulty"
  | "seo_batch_keywords"
  | "seo_link_budget"
  | "market_stripe_radar"
  | "market_site_trajectory"
  | "market_niche_discovery"
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
  keyword?: string;
  keywords?: string[];
  domain?: string;
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
  data: unknown;
  diagnostics?: string[];
};
