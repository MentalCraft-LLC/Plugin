/**
 * Plugin/Gefei Pi Host Adapter
 *
 * Terminal rendering and CLI tool integration for Pi agent environments.
 */

import { Type } from "typebox";
import { createGefeiOperation, GEFEI_ACTIONS, type GefeiInput } from "./operation.ts";

const StringEnum = (values: readonly string[]) =>
  Type.Union(values.map((v) => Type.Literal(v)));

export function compactGefeiResult(action: string, result: any): string {
  if (!result) return `Gefei ${action} completed`;

  switch (action) {
    case "estimate_keyword_difficulty": {
      const kd = result.difficulty ?? result.kd ?? "?";
      const vol = result.search_volume ?? result.volume ?? "?";
      const opp = result.opportunity ?? (typeof kd === "number" && kd < 35 ? "High Opportunity" : "Competitive");
      return `Keyword: "${result.keyword ?? ""}" → KD ${kd}/100 [${opp}] | Vol: ${vol}`;
    }
    case "batch_keyword_difficulty": {
      const items = Array.isArray(result) ? result : result.keywords ?? [];
      return `Batch Evaluated (${items.length} keywords): Avg KD ${result.avg_kd ?? "?"}`;
    }
    case "get_stripe_insights": {
      const count = Array.isArray(result) ? result.length : (result.sites?.length ?? 0);
      return `Stripe Radar Insights: ${count} verified revenue-generating products tracked`;
    }
    case "get_site_stripe_trajectory": {
      const mrr = result.estimated_mrr ?? result.mrr ?? "N/A";
      const growth = result.growth_rate ?? result.mom ?? "N/A";
      return `Site "${result.domain ?? ""}": Est. MRR ${mrr} (MoM: ${growth})`;
    }
    case "calculate_link_budget": {
      const budget = result.target_backlinks ?? result.budget ?? "?";
      const dr = result.min_dr ?? "40+";
      return `Link Strategy for "${result.keyword ?? ""}": Target ${budget} backlinks (DR ${dr})`;
    }
    case "search_niche_ideas": {
      const niches = Array.isArray(result) ? result : (result.results ?? []);
      return `Niche Forensics: ${niches.length} high-opportunity niche spaces identified`;
    }
    default:
      return `Gefei ${action}: Success`;
  }
}

export const gefeiTool = {
  name: "gefei",
  label: "Gefei SEO Intelligence",
  description: "Gefei SEO Toolbox & Market Intelligence Engine. Calculate Google Keyword Difficulty (KD 0-100), link budgets, SERP competitor forensics, and Stripe revenue leaderboards.",
  parameters: Type.Object(
    {
      action: StringEnum(GEFEI_ACTIONS),
      keyword: Type.Optional(Type.String({ description: "Target search keyword." })),
      keywords: Type.Optional(Type.Array(Type.String(), { description: "List of keywords for batch evaluation." })),
      domain: Type.Optional(Type.String({ description: "Target domain for Stripe trajectory." })),
      month: Type.Optional(Type.String({ description: "Month format YYYY-MM for Stripe insights." })),
      query: Type.Optional(Type.String({ description: "Search query for niche ideas." })),
      gl: Type.Optional(Type.String({ description: "Google country code (e.g. 'us', 'gb', 'ca')." })),
      hl: Type.Optional(Type.String({ description: "Google language code (e.g. 'en', 'es', 'zh')." })),
      force: Type.Optional(Type.Boolean({ description: "Force live refresh bypassing cache." })),
    },
    { additionalProperties: false }
  ),
  async execute(_toolCallId: string, params: GefeiInput) {
    const operation = createGefeiOperation();
    const res = await operation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      details: res,
    };
  },
};
