/**
 * Plugin/Business MCP Protocol Server
 *
 * Exposes the 'business' commercial intelligence tool over JSON-RPC 2.0 stdio stream.
 */

import { businessOperation } from "./operation.ts";
import { type BusinessInput } from "./core.ts";

export const BUSINESS_ACTIONS = [
  "seo_keyword_difficulty",
  "seo_batch_keywords",
  "seo_link_budget",
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
      description: "Business intelligence action: 'seo_keyword_difficulty' (Google KD 0-100 & volume), 'seo_batch_keywords' (matrix evaluation), 'seo_link_budget' (backlinks & DR formula), 'market_stripe_radar' (Stripe monthly revenue leaderboard), 'market_site_trajectory' (competitor MRR & checkout growth), 'market_niche_discovery' (white-space SaaS ideas), 'product_traction_score' (commercial viability index), 'list_actions'.",
    },
    keyword: {
      type: "string",
      description: "Search keyword to analyze (e.g. 'anxiety test online', 'ai photo enhancer').",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Array of keywords for batch evaluation.",
    },
    domain: {
      type: "string",
      description: "Competitor domain name for Stripe billing trajectory analysis.",
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
      description: "Google country code: us, gb, ca, au, de, jp, sg. Default is 'us'.",
    },
    hl: {
      type: "string",
      description: "Google language code: en, es, zh, etc. Default is 'en'.",
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
            description: "MentalCraft Business & Product Engineering Intelligence Engine. Google SEO KD calculation, link budgets, SERP competitor forensics, Stripe revenue leaderboards, and product traction indexing.",
            inputSchema: BUSINESS_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (params?.name !== "business") {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${params?.name ?? "undefined"}`,
        },
      };
    }

    try {
      const input = (params.arguments ?? {}) as unknown as BusinessInput;
      const result = await businessOperation(input);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
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

export function startBusinessMcpStdio() {
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
  startBusinessMcpStdio();
}
