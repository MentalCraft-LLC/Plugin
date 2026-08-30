/**
 * Gefei SEO & Market Intelligence Client
 * Powers atomic operations for keyword difficulty, SERP forensics, and Stripe Radar.
 */

export const DEFAULT_GEFEI_TOKEN = "wc_mcp_7d13ce52f57fbfd371d48c3de6ed9f1d76c8150a8f94a426";
export const DEFAULT_REF_TOKEN = "1787865231343.eb27980a1648a057fe0746f2c4e78d86eb7ac3910f7ad9f755eb637d2c9058ce";
export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type GefeiConfig = {
  token?: string;
  refToken?: string;
  userAgent?: string;
  baseUrl?: string;
};

export type KeywordDifficultyResult = {
  keyword: string;
  kd: number;
  volume?: number;
  cpc?: number;
  intent?: string;
  linkBudget?: {
    targetDr: number;
    requiredBacklinks: number;
    minHomepageDr?: number;
  };
  serp?: Array<{
    rank: number;
    title: string;
    url: string;
    domain: string;
    dr?: number;
    backlinks?: number;
    isHomepage?: boolean;
    ageYears?: number;
  }>;
  error?: string;
};

export type StripeInsightItem = {
  domain: string;
  rank: number;
  category?: string;
  estimatedVisits?: number;
  growthRate?: number;
  revenueTier?: string;
  tags?: string[];
};

export type StripeInsightsResponse = {
  month: string;
  summary?: {
    totalTracked: number;
    totalVisits: number;
    medianGrowth: number;
  };
  darkhorses?: StripeInsightItem[];
  surging?: StripeInsightItem[];
  topGainers?: StripeInsightItem[];
  error?: string;
};

export type SiteTrajectoryItem = {
  domain: string;
  firstSeen?: string;
  historicalVisits?: Array<{
    month: string;
    visits: number;
    growth?: number;
  }>;
  currentRank?: number;
  category?: string;
  error?: string;
};

export class GefeiClient {
  private token: string;
  private refToken: string;
  private userAgent: string;
  private baseUrl: string;

  constructor(config: GefeiConfig = {}) {
    this.token = config.token || process.env.GEFEI_TOKEN || DEFAULT_GEFEI_TOKEN;
    this.refToken = config.refToken || process.env.GEFEI_REF_TOKEN || DEFAULT_REF_TOKEN;
    this.userAgent = config.userAgent || USER_AGENT;
    this.baseUrl = (config.baseUrl || "https://seo.web.cafe").replace(/\/$/, "");
  }

  async estimateKeywordDifficulty(
    keyword: string,
    options: { gl?: string; hl?: string; force?: boolean } = {},
  ): Promise<KeywordDifficultyResult> {
    const gl = options.gl || "us";
    const hl = options.hl || "en";
    let url = `${this.baseUrl}/kd/api/v1/kd?keyword=${encodeURIComponent(keyword)}&gl=${gl}&hl=${hl}`;
    if (options.force) url += "&force=1";

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as KeywordDifficultyResult;
    } catch (err: unknown) {
      return {
        keyword,
        kd: -1,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async batchKeywordDifficulty(
    keywords: string[],
    options: { gl?: string; hl?: string } = {},
  ): Promise<KeywordDifficultyResult[]> {
    const results: KeywordDifficultyResult[] = [];
    for (const kw of keywords) {
      const res = await this.estimateKeywordDifficulty(kw, options);
      results.push(res);
    }
    return results;
  }

  async getStripeInsights(month?: string): Promise<StripeInsightsResponse> {
    try {
      let targetMonth = month;
      if (!targetMonth) {
        const summaryRes = await fetch(`${this.baseUrl}/referring/api/summary`, {
          headers: {
            "User-Agent": this.userAgent,
            "X-REF-Token": this.refToken,
          },
        });
        if (summaryRes.ok) {
          const sdata = (await summaryRes.json()) as { latest?: string };
          targetMonth = sdata.latest || "202607";
        } else {
          targetMonth = "202607";
        }
      }

      const url = `${this.baseUrl}/referring/api/insights?m=${targetMonth}`;
      const resp = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          "X-REF-Token": this.refToken,
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      return (await resp.json()) as StripeInsightsResponse;
    } catch (err: unknown) {
      return {
        month: month || "latest",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getSiteStripeTrajectory(domain: string): Promise<SiteTrajectoryItem> {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      const url = `${this.baseUrl}/referring/api/site?domain=${encodeURIComponent(cleanDomain)}`;
      const resp = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          "X-REF-Token": this.refToken,
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      return (await resp.json()) as SiteTrajectoryItem;
    } catch (err: unknown) {
      return {
        domain,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async calculateLinkBudget(keyword: string, gl = "us"): Promise<{
    keyword: string;
    kd: number;
    linkBudget: { targetDr: number; requiredBacklinks: number; minHomepageDr?: number };
    strategyRecommendation: string;
  }> {
    const data = await this.estimateKeywordDifficulty(keyword, { gl });
    const kd = data.kd ?? 50;
    const targetDr = data.linkBudget?.targetDr ?? Math.min(80, Math.max(10, Math.round(kd * 0.8)));
    const requiredBacklinks = data.linkBudget?.requiredBacklinks ?? Math.max(5, Math.round(kd * 1.5));

    let strategyRecommendation = "";
    if (kd < 35) {
      strategyRecommendation = "🟢 Low-Hanging Fruit: Direct tool MVP or single-page application can rank within 30-60 days with minimal directory listings.";
    } else if (kd < 60) {
      strategyRecommendation = "🟡 Moderate Opportunity: Requires dedicated homepage authority, programmatic directory listings, and 5-15 high-DR domain referrals.";
    } else {
      strategyRecommendation = "🔴 High Difficulty: Dominated by authority subpages. Focus on long-tail sub-intent clusters before targeting this primary term.";
    }

    return {
      keyword,
      kd,
      linkBudget: {
        targetDr,
        requiredBacklinks,
        minHomepageDr: data.linkBudget?.minHomepageDr,
      },
      strategyRecommendation,
    };
  }

  async searchNicheIdeas(query: string, month?: string): Promise<{
    query: string;
    matchedDarkhorses: StripeInsightItem[];
    matchedSurging: StripeInsightItem[];
  }> {
    const insights = await this.getStripeInsights(month);
    const q = query.toLowerCase();

    const matches = (item: StripeInsightItem) =>
      item.domain.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

    return {
      query,
      matchedDarkhorses: (insights.darkhorses || []).filter(matches),
      matchedSurging: (insights.surging || []).filter(matches),
    };
  }
}
