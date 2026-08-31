/**
 * Plugin/Business MCP Protocol Server
 *
 * Exposes the 'business' venture lifecycle & commercial intelligence tool over JSON-RPC 2.0 stdio stream.
 */

import { businessOperation } from "./operation.ts";
import { type BusinessInput } from "./core.ts";

export const BUSINESS_ACTIONS = [
  "venture_market_validation",
  "venture_acquisition_audit",
  "venture_unit_economics",
  "venture_retention_curves",
  "venture_monetization_telemetry",
  "venture_pricing_experiment",
  "venture_growth_playbook",
  "seo_keyword_difficulty",
  "seo_batch_keywords",
  "seo_link_budget",
  "traffic_domain_overview",
  "traffic_channel_breakdown",
  "traffic_geo_distribution",
  "traffic_competitor_comparison",
  "market_stripe_radar",
  "market_site_trajectory",
  "market_niche_discovery",
  "product_traction_score",
  "list_actions",
] as const;

export const BUSINESS_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: BUSINESS_ACTIONS,
      description: "Business action across the 5 venture lifecycle stages: 'venture_market_validation' (TAM/SAM/SOM & viability), 'venture_acquisition_audit' (SEO/ASO/Steam Wishlists), 'venture_unit_economics' (CAC, LTV, MRR/ARPDAU), 'venture_retention_curves' (D1/D7/D30 & DAU/MAU stickiness), 'venture_monetization_telemetry' (Stripe/AppStore/Steam billing), 'venture_pricing_experiment' (Price elasticity curve), 'venture_growth_playbook' (90-day roadmap), plus modular SEO/TrafficCV actions and 'list_actions'.",
    },
    modality: {
      type: "string",
      enum: ["website", "app", "game"],
      description: "Commercial modality of the venture: 'website' (SaaS/Web App), 'app' (iOS/Android mobile/desktop app), 'game' (Steam/mobile/console game). Default is 'website'.",
    },
    venture_name: {
      type: "string",
      description: "Name of the business venture or product.",
    },
    target_audience: {
      type: "string",
      description: "Target demographic or customer persona.",
    },
    monetization_model: {
      type: "string",
      enum: ["subscription", "freemium", "iap", "ads", "one_time", "battle_pass"],
      description: "Business monetization model.",
    },
    provider: {
      type: "string",
      enum: ["gefei", "trafficcv", "store_radar", "auto"],
      description: "Data provider selection.",
    },
    keyword: {
      type: "string",
      description: "Search keyword to analyze (e.g. 'anxiety test online', 'deckbuilder roguelike').",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Array of keywords for batch evaluation.",
    },
    domain: {
      type: "string",
      description: "Domain name for Stripe billing trajectory or TrafficCV analytics.",
    },
    domains: {
      type: "array",
      items: { type: "string" },
      description: "Array of domain names for TrafficCV competitor comparison.",
    },
    competitors: {
      type: "array",
      items: { type: "string" },
      description: "List of competitor names or domains.",
    },
    cac: {
      type: "number",
      description: "Customer Acquisition Cost in USD.",
    },
    arpu: {
      type: "number",
      description: "Average Revenue Per User in USD.",
    },
    dau: {
      type: "integer",
      description: "Daily Active Users count.",
    },
    mau: {
      type: "integer",
      description: "Monthly Active Users count.",
    },
    price_points: {
      type: "array",
      items: { type: "number" },
      description: "Array of price points to test in pricing elasticity experiment.",
    },
    month: {
      type: "string",
      description: "Month in YYYYMM format (e.g. '202607').",
    },
    query: {
      type: "string",
      description: "Niche idea search query.",
    },
    product_name: {
      type: "string",
      description: "Product name for traction scoring.",
    },
    gl: {
      type: "string",
      description: "Google country code (default 'us').",
    },
    hl: {
      type: "string",
      description: "Google language code (default 'en').",
    },
    force: {
      type: "boolean",
      description: "Bypass cache and force fresh SERP evaluation.",
    },
  },
} as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export async function handleBusinessRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = request.id ?? null;

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "mentalcraft-business-mcp",
          version: "1.0.0",
        },
      },
    };
  }

  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "business",
            description: "MentalCraft Business & Venture Lifecycle Intelligence Engine (Market validation, Acquisition across SEO/ASO/Steam, Unit economics CAC/LTV, D1/D7/D30 Retention curves, Stripe/AppStore monetization telemetry across Websites, Apps, and Games).",
            inputSchema: BUSINESS_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    if (toolName !== "business") {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${toolName ?? "undefined"}`,
        },
      };
    }

    try {
      const output = await businessOperation(args as unknown as BusinessInput);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
            },
          ],
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`,
    },
  };
}

export function startBusinessMcpServer() {
  let buffer = "";
  process.stdin.setEncoding("utf-8");

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const req = JSON.parse(trimmed) as JsonRpcRequest;
        const res = await handleBusinessRpc(req);
        process.stdout.write(JSON.stringify(res) + "\n");
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          }) + "\n"
        );
      }
    }
  });
}

if (import.meta.main) {
  startBusinessMcpServer();
}
