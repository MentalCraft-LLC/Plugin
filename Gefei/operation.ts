import { GefeiClient, type GefeiConfig } from "./core.ts";

export const GEFEI_ACTIONS = [
  "estimate_keyword_difficulty",
  "batch_keyword_difficulty",
  "get_stripe_insights",
  "get_site_stripe_trajectory",
  "calculate_link_budget",
  "search_niche_ideas",
] as const;

export type GefeiAction = (typeof GEFEI_ACTIONS)[number];

export type GefeiInput = {
  action: GefeiAction;
  keyword?: string;
  keywords?: string[];
  domain?: string;
  month?: string;
  query?: string;
  gl?: string;
  hl?: string;
  force?: boolean;
};

export type GefeiOperation = (input: GefeiInput) => Promise<unknown>;

export function createGefeiOperation(config?: GefeiConfig): GefeiOperation {
  const client = new GefeiClient(config);

  return async (input: GefeiInput): Promise<unknown> => {
    switch (input.action) {
      case "estimate_keyword_difficulty": {
        if (!input.keyword) {
          throw new Error("Missing required parameter: keyword");
        }
        return await client.estimateKeywordDifficulty(input.keyword, {
          gl: input.gl,
          hl: input.hl,
          force: input.force,
        });
      }

      case "batch_keyword_difficulty": {
        const kws = input.keywords || (input.keyword ? [input.keyword] : []);
        if (kws.length === 0) {
          throw new Error("Missing required parameter: keywords");
        }
        return await client.batchKeywordDifficulty(kws, {
          gl: input.gl,
          hl: input.hl,
        });
      }

      case "get_stripe_insights": {
        return await client.getStripeInsights(input.month);
      }

      case "get_site_stripe_trajectory": {
        if (!input.domain) {
          throw new Error("Missing required parameter: domain");
        }
        return await client.getSiteStripeTrajectory(input.domain);
      }

      case "calculate_link_budget": {
        if (!input.keyword) {
          throw new Error("Missing required parameter: keyword");
        }
        return await client.calculateLinkBudget(input.keyword, input.gl);
      }

      case "search_niche_ideas": {
        if (!input.query) {
          throw new Error("Missing required parameter: query");
        }
        return await client.searchNicheIdeas(input.query, input.month);
      }

      default: {
        const exhaustiveCheck: never = input.action;
        throw new Error(`Unknown Gefei action: ${exhaustiveCheck}`);
      }
    }
  };
}
