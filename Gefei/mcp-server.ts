import { createGefeiOperation, type GefeiOperation } from "./operation.ts";
import { type GefeiConfig } from "./core.ts";

export const PROTOCOL_VERSION = "2024-11-05";
export const SERVER_NAME = "gefei";
export const SERVER_VERSION = "1.0.0";

export const GEFEI_TOOLS = [
  {
    name: "estimate_keyword_difficulty",
    description:
      "Estimate Google SEO keyword difficulty (KD 0-100), search volume, SERP top 10 competition, and backlink budget using Gefei SEO Toolbox (seo.web.cafe).",
    inputSchema: {
      type: "object",
      required: ["keyword"],
      additionalProperties: false,
      properties: {
        keyword: { type: "string", description: "Search keyword to analyze (e.g. 'ai photo editor', 'game engine svelte')." },
        gl: { type: "string", description: "Google country code: us, gb, ca, au, de, jp, sg, etc. Default is 'us'." },
        hl: { type: "string", description: "Google language code. Default is 'en'." },
        force: { type: "boolean", description: "Whether to skip cache and force live SERP recalculation." },
      },
    },
  },
  {
    name: "batch_keyword_difficulty",
    description:
      "Batch evaluate multiple keywords to generate a competitive keyword matrix with difficulty scores, search volumes, and ranking opportunity tiers.",
    inputSchema: {
      type: "object",
      required: ["keywords"],
      additionalProperties: false,
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "List of keywords to evaluate (e.g. ['svelte components', 'tailwind ui', 'agentic ide']).",
        },
        gl: { type: "string", description: "Google country code. Default is 'us'." },
        hl: { type: "string", description: "Google language code. Default is 'en'." },
      },
    },
  },
  {
    name: "get_stripe_insights",
    description:
      "Fetch Stripe Radar real-revenue checkout referral leaderboard insights (dark horses, surging Micro-SaaS, and fast-growing products).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        month: { type: "string", description: "Month in YYYYMM format (e.g. '202607'). Defaults to latest available." },
      },
    },
  },
  {
    name: "get_site_stripe_trajectory",
    description:
      "Retrieve historical Stripe checkout referral trajectory for a specific domain (monthly visits, growth rate, revenue tier, ranking).",
    inputSchema: {
      type: "object",
      required: ["domain"],
      additionalProperties: false,
      properties: {
        domain: { type: "string", description: "Target domain name (e.g. 'lovable.dev', 'cursor.com', 'v0.dev')." },
      },
    },
  },
  {
    name: "calculate_link_budget",
    description:
      "Calculate the exact domain rating (DR) and referring domain count required to outrank the lowest ranking homepage in SERP Top 10.",
    inputSchema: {
      type: "object",
      required: ["keyword"],
      additionalProperties: false,
      properties: {
        keyword: { type: "string", description: "Target search keyword." },
        gl: { type: "string", description: "Google country code. Default is 'us'." },
      },
    },
  },
  {
    name: "search_niche_ideas",
    description:
      "Filter real-revenue SaaS products on the Stripe Radar leaderboard by category, tag, or seed keyword.",
    inputSchema: {
      type: "object",
      required: ["query"],
      additionalProperties: false,
      properties: {
        query: { type: "string", description: "Category, keyword, or domain pattern to search for (e.g. 'ai', 'video', 'design', 'crm')." },
        month: { type: "string", description: "Month in YYYYMM format. Defaults to latest available." },
      },
    },
  },
] as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export function encodeMessage(message: object): Buffer {
  return Buffer.from(`${JSON.stringify(message)}\n`);
}

export function encodeFramedMessage(message: object): Buffer {
  const json = JSON.stringify(message);
  return Buffer.from(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

function indexOfHeaderEnd(buffer: Buffer): number {
  for (let i = 0; i < buffer.length - 3; i++) {
    if (
      buffer[i] === 0x0d &&
      buffer[i + 1] === 0x0a &&
      buffer[i + 2] === 0x0d &&
      buffer[i + 3] === 0x0a
    ) {
      return i;
    }
  }
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === 0x0a && buffer[i + 1] === 0x0a) return i;
  }
  return -1;
}

function separatorLength(buffer: Buffer, headerEnd: number): number {
  if (buffer[headerEnd] === 0x0d && buffer[headerEnd + 1] === 0x0a) return 4;
  return 2;
}

export function createMessageReader(onMessage: (value: unknown) => void): (chunk: Buffer) => void {
  let buffer = Buffer.alloc(0);
  return (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      if (buffer[0] === 0x7b) {
        const newline = buffer.indexOf(0x0a);
        if (newline < 0) return;
        const line = buffer.subarray(0, newline).toString("utf8").trim();
        buffer = buffer.subarray(newline + 1);
        if (line.length > 0) onMessage(JSON.parse(line));
        continue;
      }
      const headerEnd = indexOfHeaderEnd(buffer);
      if (headerEnd < 0) return;
      const header = buffer.subarray(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) throw new Error("MCP frame is missing Content-Length");
      const length = Number(match[1]);
      const start = headerEnd + separatorLength(buffer, headerEnd);
      if (buffer.length < start + length) return;
      const body = buffer.subarray(start, start + length).toString("utf8");
      buffer = buffer.subarray(start + length);
      onMessage(JSON.parse(body));
    }
  };
}

export class GefeiMcpServer {
  private execute: GefeiOperation;

  constructor(config?: GefeiConfig) {
    this.execute = createGefeiOperation(config);
  }

  async handleMessage(rawMessage: unknown): Promise<JsonRpcResponse | null> {
    if (typeof rawMessage !== "object" || rawMessage === null) {
      return {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Invalid Request: message must be an object" },
      };
    }

    const request = rawMessage as JsonRpcRequest;
    const id = request.id ?? null;

    if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32600, message: "Invalid Request: malformed jsonrpc header" },
      };
    }

    switch (request.method) {
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
              tools: { listChanged: false },
            },
            serverInfo: {
              name: SERVER_NAME,
              version: SERVER_VERSION,
            },
          },
        };
      }

      case "notifications/initialized": {
        return null;
      }

      case "ping": {
        return { jsonrpc: "2.0", id, result: {} };
      }

      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: GEFEI_TOOLS,
          },
        };
      }

      case "tools/call": {
        const params = (request.params || {}) as { name?: string; arguments?: Record<string, unknown> };
        const toolName = params.name;
        const args = params.arguments || {};

        if (!toolName) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing tool name" },
          };
        }

        try {
          let result: unknown;
          switch (toolName) {
            case "estimate_keyword_difficulty": {
              result = await this.execute({
                action: "estimate_keyword_difficulty",
                keyword: String(args.keyword || ""),
                gl: args.gl ? String(args.gl) : undefined,
                hl: args.hl ? String(args.hl) : undefined,
                force: Boolean(args.force),
              });
              break;
            }

            case "batch_keyword_difficulty": {
              result = await this.execute({
                action: "batch_keyword_difficulty",
                keywords: Array.isArray(args.keywords) ? args.keywords.map(String) : [],
                gl: args.gl ? String(args.gl) : undefined,
                hl: args.hl ? String(args.hl) : undefined,
              });
              break;
            }

            case "get_stripe_insights": {
              result = await this.execute({
                action: "get_stripe_insights",
                month: args.month ? String(args.month) : undefined,
              });
              break;
            }

            case "get_site_stripe_trajectory": {
              result = await this.execute({
                action: "get_site_stripe_trajectory",
                domain: String(args.domain || ""),
              });
              break;
            }

            case "calculate_link_budget": {
              result = await this.execute({
                action: "calculate_link_budget",
                keyword: String(args.keyword || ""),
                gl: args.gl ? String(args.gl) : undefined,
              });
              break;
            }

            case "search_niche_ideas": {
              result = await this.execute({
                action: "search_niche_ideas",
                query: String(args.query || ""),
                month: args.month ? String(args.month) : undefined,
              });
              break;
            }

            default:
              return {
                jsonrpc: "2.0",
                id,
                error: { code: -32601, message: `Tool not found: ${toolName}` },
              };
          }

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
        } catch (err: unknown) {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: err instanceof Error ? err.message : String(err),
                },
              ],
            },
          };
        }
      }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${request.method}` },
        };
    }
  }
}
