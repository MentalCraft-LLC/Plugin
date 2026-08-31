/**
 * Plugin/Business Pi Host Adapter
 *
 * Terminal rendering and CLI tool integration for Pi agent environments.
 */

import { Type } from "typebox";
import { businessOperation } from "./operation.ts";
import { BUSINESS_ACTIONS } from "./mcp-server.ts";
import type { BusinessInput, BusinessResult, TractionScoreResult } from "./core.ts";

const StringEnum = (values: readonly string[]) =>
  Type.Union(values.map((v) => Type.Literal(v)));

export function compactBusinessResult(result: BusinessResult): string {
  if (!result.success) {
    return `✗ Business ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_actions": {
      const data = result.data as { actions: Array<{ name: string }> };
      return `Business Actions (${data.actions.length}): ${data.actions.map((a) => a.name).join(", ")}`;
    }
    case "seo_keyword_difficulty": {
      const res = result.data as any;
      const kd = res.difficulty ?? res.kd ?? "?";
      const vol = res.search_volume ?? res.volume ?? "?";
      return `Keyword: "${res.keyword ?? ""}" → KD ${kd}/100 | Vol: ${vol}`;
    }
    case "seo_batch_keywords": {
      const items = Array.isArray(result.data) ? result.data : (result.data as any)?.keywords ?? [];
      return `Batch Evaluated (${items.length} keywords)`;
    }
    case "seo_link_budget": {
      const res = result.data as any;
      return `Link Budget for "${res.keyword ?? ""}": Target ${res.target_backlinks ?? res.linkBudget?.requiredBacklinks ?? "?"} backlinks (DR ${res.min_dr ?? res.linkBudget?.targetDr ?? "40+"})`;
    }
    case "market_stripe_radar": {
      const count = Array.isArray(result.data) ? result.data.length : ((result.data as any)?.darkhorses?.length ?? 0);
      return `Stripe Radar Insights: ${count} verified revenue-generating products tracked`;
    }
    case "market_site_trajectory": {
      const res = result.data as any;
      return `Domain "${res.domain ?? ""}": Est. MRR ${res.estimated_mrr ?? res.estimatedMrr ?? "N/A"}`;
    }
    case "market_niche_discovery": {
      const niches = Array.isArray(result.data) ? result.data : ((result.data as any)?.results ?? []);
      return `Niche Discovery: ${niches.length} high-opportunity spaces found`;
    }
    case "traffic_domain_overview": {
      const data = result.data as any;
      return `TrafficCV "${data.domain}": ${(data.monthlyVisits / 1000).toFixed(1)}k visits/mo (Rank #${data.globalRank}, Bounce: ${data.bounceRatePercent}%)`;
    }
    case "traffic_channel_breakdown": {
      const data = result.data as any;
      return `Traffic Channels "${data.domain}": Organic ${data.channels.organicSearch}%, Direct ${data.channels.direct}%, Referral ${data.channels.referral}%`;
    }
    case "traffic_geo_distribution": {
      const data = result.data as any;
      return `Geo Traffic "${data.domain}": Top: ${data.topCountries?.slice(0, 3).map((c: any) => `${c.countryCode} (${c.trafficSharePercent}%)`).join(", ")}`;
    }
    case "traffic_competitor_comparison": {
      const data = result.data as any;
      return `Competitor Traffic: Leader "${data.leaderDomain}" across ${data.domains?.length} domains`;
    }
    case "product_traction_score": {
      const data = result.data as TractionScoreResult;
      return `Product "${data.product}" Traction Score: ${data.score}/100 [Grade ${data.grade}]`;
    }
  }
}

export const businessTool = {
  name: "business",
  label: "Business Intelligence",
  description: "MentalCraft Business & Product Engineering Intelligence Engine. Google SEO KD calculation, link budgets, SERP competitor forensics, Stripe revenue leaderboards, TrafficCV domain traffic analytics, and product traction indexing.",
  parameters: Type.Object(
    {
      action: StringEnum(BUSINESS_ACTIONS),
      provider: Type.Optional(StringEnum(["gefei", "trafficcv", "auto"] as const)),
      keyword: Type.Optional(Type.String({ description: "Target search keyword." })),
      keywords: Type.Optional(Type.Array(Type.String(), { description: "List of keywords for batch evaluation." })),
      domain: Type.Optional(Type.String({ description: "Target domain for Stripe trajectory or TrafficCV analytics." })),
      domains: Type.Optional(Type.Array(Type.String(), { description: "Domains for competitor benchmark." })),
      month: Type.Optional(Type.String({ description: "Month format YYYYMM for Stripe insights." })),
      query: Type.Optional(Type.String({ description: "Search query for niche ideas." })),
      product_name: Type.Optional(Type.String({ description: "Product name for traction scoring." })),
      gl: Type.Optional(Type.String({ description: "Google country code (e.g. 'us', 'gb', 'ca')." })),
      hl: Type.Optional(Type.String({ description: "Google language code (e.g. 'en', 'es', 'zh')." })),
      force: Type.Optional(Type.Boolean({ description: "Force live refresh bypassing cache." })),
    },
    { additionalProperties: false }
  ),
  async execute(_toolCallId: string, params: BusinessInput) {
    const res = await businessOperation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      details: res,
    };
  },
};
