/**
 * Plugin/Business MCP Protocol Server
 *
 * Exposes the 'business' 8-stage venture lifecycle & commercial intelligence tool over JSON-RPC 2.0 stdio stream.
 */

import { businessOperation } from "./operation.ts";
import { type BusinessInput } from "./core.ts";

export const BUSINESS_ACTIONS = [
  "venture_market_validation",
  "market_niche_discovery",
  "venture_pmf_validation",
  "venture_acquisition_audit",
  "seo_keyword_difficulty",
  "seo_batch_keywords",
  "seo_link_budget",
  "traffic_domain_overview",
  "traffic_channel_breakdown",
  "traffic_geo_distribution",
  "traffic_competitor_comparison",
  "venture_activation_funnel",
  "venture_retention_curves",
  "venture_unit_economics",
  "venture_monetization_telemetry",
  "market_stripe_radar",
  "market_site_trajectory",
  "product_traction_score",
  "venture_pricing_experiment",
  "venture_growth_playbook",
  "venture_expansion_moat",
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
      description: "Business action across the 8 venture lifecycle stages: Stage 1 Ideation ('venture_market_validation', 'market_niche_discovery'), Stage 2 PMF ('venture_pmf_validation'), Stage 3 Acquisition ('venture_acquisition_audit', SEO/TrafficCV actions), Stage 4 Activation ('venture_activation_funnel'), Stage 5 Retention ('venture_retention_curves'), Stage 6 Unit Economics ('venture_unit_economics', 'venture_monetization_telemetry', 'market_stripe_radar', 'market_site_trajectory', 'product_traction_score'), Stage 7 Pricing ('venture_pricing_experiment'), Stage 8 Scale & Moats ('venture_growth_playbook', 'venture_expansion_moat'), and 'list_actions'.",
    },
    modality: {
      type: "string",
      enum: ["website", "app", "game", "shop"],
      description: "Commercial modality of the venture: 'website' (SaaS/Web App), 'app' (iOS/Android mobile/desktop app), 'game' (Steam/mobile/console game), 'shop' (E-Commerce D2C / TikTok Shop / Amazon FBA). Default is 'website'.",
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
      enum: ["subscription", "freemium", "iap", "ads", "one_time", "battle_pass", "ecommerce_cogs", "digital_download"],
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
    d1_retention: {
      type: "number",
      description: "Day 1 retention percentage.",
    },
    d7_retention: {
      type: "number",
      description: "Day 7 retention percentage.",
    },
    d30_retention: {
      type: "number",
      description: "Day 30 retention percentage.",
    },
    d90_retention: {
      type: "number",
      description: "Day 90 retention / repurchase percentage.",
    },
    price_points: {
      type: "array",
      items: { type: "number" },
      description: "Array of price points to test in pricing elasticity experiment.",
    },
    cogs: {
      type: "number",
      description: "Cost of Goods Sold in USD (for e-commerce/shop ventures).",
    },
    shipping_cost: {
      type: "number",
      description: "3PL Warehousing & Shipping cost per unit in USD.",
    },
    lead_time_days: {
      type: "number",
      description: "Supplier / factory reorder lead time in days.",
    },
    daily_demand_units: {
      type: "number",
      description: "Average daily demand / sales velocity in units.",
    },
    demand_std_dev: {
      type: "number",
      description: "Standard deviation of daily demand for safety stock calculation.",
    },
    service_level_percent: {
      type: "number",
      description: "Target inventory cycle service level percentage (e.g. 95 or 99).",
    },
    pmf_score: {
      type: "number",
      description: "Sean Ellis PMF score percentage (% very disappointed without product).",
    },
    smoke_test_ctr: {
      type: "number",
      description: "Smoke test conversion rate percentage.",
    },
    ttv_minutes: {
      type: "number",
      description: "Time-to-Value in minutes.",
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
            description: "MentalCraft Business & Venture 8-Stage Lifecycle Intelligence Engine across 4 modalities (Website, App, Game, Shop): Market validation, PMF survey, Acquisition SEO/ASO/Steam/TikTok, Activation funnel, D1/D7/D30/D90 Retention, Unit economics CAC/LTV/COGS/3PL, Price elasticity & AOV boost, Moats & Inventory ROP.",
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
