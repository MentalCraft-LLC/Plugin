/**
 * Plugin/Business Radar Intelligence Module
 *
 * Connects directly to Infra/Radar for:
 * 1. Portfolio Radar: Cross-domain webmaster matrix discovery (AdSense, Amazon, GA4, GTM)
 * 2. Ad Radar: Multi-platform active ad creative intelligence (Google, Meta, TikTok, LinkedIn)
 * 3. Stack Radar: Monetization network & tracking tech stack forensics
 */

import { RadarClient, type PortfolioResult, type AdInspectResult, type MonetizationStackResult } from "../../../../Infra/Radar/src/index.ts";
import app from "../../../../Infra/Radar/src/index.ts";

export const RADAR_DEFAULT_ENDPOINT = "https://radar.holar.dev";

let defaultClient: RadarClient | null = null;

export function getRadarClient(): RadarClient {
  if (!defaultClient) {
    if (process.env.HOLAR_RADAR_URL) {
      defaultClient = new RadarClient({
        baseUrl: process.env.HOLAR_RADAR_URL,
        apiKey: process.env.HOLAR_RADAR_API_KEY,
      });
    } else {
      // In-process zero-latency fallback to canonical Infra/Radar Hono app
      defaultClient = new RadarClient({
        baseUrl: "http://localhost",
        fetchFn: (url, init) => {
          const path = new URL(url.toString()).pathname;
          return app.request(path, init);
        },
      });
    }
  }
  return defaultClient;
}

/**
 * 1. Reverse lookup of associated websites by domain, AdSense pub-id, or Amazon Affiliate tag
 */
export async function auditCompetitorPortfolio(query: {
  domain?: string;
  pubId?: string;
  amazonTag?: string;
  gaId?: string;
}): Promise<PortfolioResult> {
  const client = getRadarClient();
  return client.lookupPortfolio(query);
}

/**
 * 2. Inspect active multi-platform ad creatives and identify winning creatives (>= 30 days)
 */
export async function inspectCompetitorAds(query: {
  domain: string;
  platforms?: Array<"google" | "meta" | "tiktok" | "linkedin">;
}): Promise<AdInspectResult> {
  const client = getRadarClient();
  return client.inspectAds(query);
}

/**
 * 3. Inspect monetization network, SSP header bidding, and analytics trackers
 */
export async function analyzeMonetizationStack(query: {
  domain: string;
  html?: string;
  adsTxt?: string;
}): Promise<MonetizationStackResult> {
  const client = getRadarClient();
  return client.inspectStack(query);
}
