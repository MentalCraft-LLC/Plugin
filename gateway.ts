/**
 * Plugin/Gateway - Master MCP Server & Unified Capability Hub
 *
 * Provides a single unified JSON-RPC 2.0 stdio & HTTP/SSE entry point aggregating all MentalCraft capability plugins:
 * - workflow (Cross-Plugin DAG Orchestrator & Health Diagnostics)
 * - business (SEO, TrafficCV & Revenue Intelligence)
 * - science (Psychometrics, Safety Protocols & Academic Intelligence)
 * - design (5-Layer Design System, Runes UI Generation & On-Demand Subpaths)
 * - chrome (Native Browser Automation, Inactive Tab Driving & HUD)
 * - message (Multi-Channel Priority Communication Bus)
 */

import { workflowOperation } from "./Workflow/operation.ts";
import { designOperation } from "./Design/operation.ts";
import { businessOperation } from "./Business/operation.ts";
import { scienceOperation } from "./Science/operation.ts";
import { createBrowserContextOperation } from "./Chrome/operation.ts";
import { createMessageOperation } from "./Message/operation.ts";

import { WORKFLOW_INPUT_SCHEMA } from "./Workflow/mcp-server.ts";
import { DESIGN_INPUT_SCHEMA } from "./Design/mcp-server.ts";
import { BUSINESS_INPUT_SCHEMA } from "./Business/mcp-server.ts";
import { SCIENCE_INPUT_SCHEMA } from "./Science/mcp-server.ts";
import { MESSAGE_INPUT_SCHEMA } from "./Message/mcp-server.ts";

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

const executeChrome = createBrowserContextOperation();
const executeMessage = createMessageOperation();

export const GATEWAY_TOOLS = [
  {
    name: "workflow",
    description: "MentalCraft Cross-Plugin Orchestrator & Health Diagnostics Engine. Execute compound pipelines and inspect system health.",
    inputSchema: WORKFLOW_INPUT_SCHEMA,
  },
  {
    name: "design",
    description: "MentalCraft Design System & UI Intelligence Engine (5-layer hierarchy, tokens, Svelte 5 runes generation, on-demand subpaths, domain presets).",
    inputSchema: DESIGN_INPUT_SCHEMA,
  },
  {
    name: "business",
    description: "MentalCraft Business & Product Engineering Intelligence Engine (Google SEO KD, Link Budgets, Stripe Radar Leaderboards, TrafficCV domain traffic analytics, MRR Trajectories).",
    inputSchema: BUSINESS_INPUT_SCHEMA,
  },
  {
    name: "science",
    description: "MentalCraft Science & Research Intelligence Engine (Clinical Scale Scoring GAD-7/PHQ-9, Suicidal Crisis Safety Protocol, Literature Discovery, Patent Novelty Audits).",
    inputSchema: SCIENCE_INPUT_SCHEMA,
  },
  {
    name: "chrome",
    description: "MentalCraft Browser Automation & Native Bridge. Inactive tab driving, screencasts, visual HUD, storage mutation, and CDP inspection.",
    inputSchema: {
      type: "object",
      required: ["action"],
      properties: {
        action: { type: "string", description: "Browser action to execute." },
        url: { type: "string", description: "Target URL." },
        selector: { type: "string", description: "DOM selector." },
        text: { type: "string", description: "Text to fill or match." },
      },
    },
  },
  {
    name: "message",
    description: "MentalCraft Agent Message Bus. Unified messaging across Telegram, iMessage, and Email with local 0600 security.",
    inputSchema: MESSAGE_INPUT_SCHEMA,
  },
];

export async function handleGatewayRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
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
          name: "mentalcraft-gateway-mcp",
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
        tools: GATEWAY_TOOLS,
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    try {
      let output: unknown;

      if (toolName === "workflow") {
        output = await workflowOperation(args as any);
      } else if (toolName === "design") {
        output = await designOperation(args as any);
      } else if (toolName === "business") {
        output = await businessOperation(args as any);
      } else if (toolName === "science") {
        output = await scienceOperation(args as any);
      } else if (toolName === "chrome") {
        output = await executeChrome(args as any);
      } else if (toolName === "message") {
        output = await executeMessage(args as any);
      } else {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName ?? "undefined"}`,
          },
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: typeof output === "string" ? output : JSON.stringify(output, null, 2),
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

export function startGatewayMcpStdio() {
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
        const res = await handleGatewayRpc(req);
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

export function startGatewayMcpHttp(port = 3890) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (url.pathname === "/health") {
        const { executeHealthCheck } = require("./Workflow/operation.ts");
        const report = await executeHealthCheck("all");
        const status = report.overallStatus === "healthy" ? 200 : 503;
        return new Response(JSON.stringify(report, null, 2), { status, headers: corsHeaders });
      }

      if (url.pathname === "/metrics") {
        const { getSystemTelemetry } = require("./Workflow/operation.ts");
        const telemetry = getSystemTelemetry();
        return new Response(JSON.stringify(telemetry, null, 2), { status: 200, headers: corsHeaders });
      }

      if (url.pathname === "/schema" || url.pathname === "/openrpc.json") {
        const res = await workflowOperation({ action: "export_schema_catalog" });
        return new Response(JSON.stringify(res.data, null, 2), { status: 200, headers: corsHeaders });
      }

      if (req.method === "POST" && (url.pathname === "/mcp" || url.pathname === "/")) {
        try {
          const body = (await req.json()) as JsonRpcRequest;
          const res = await handleGatewayRpc(body);
          return new Response(JSON.stringify(res), {
            headers: corsHeaders,
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }),
            { status: 400, headers: corsHeaders }
          );
        }
      }

      return new Response(
        JSON.stringify({
          service: "MentalCraft Gateway MCP Server",
          version: "1.0.0",
          endpoints: ["POST /mcp", "GET /health", "GET /metrics", "GET /schema"],
        }, null, 2),
        { status: 200, headers: corsHeaders }
      );
    },
  });

  console.log(`📡 MentalCraft Gateway HTTP MCP listening on http://localhost:${server.port}`);
  return server;
}

if (import.meta.main) {
  const portArg = process.argv.find((a) => a.startsWith("--port="));
  if (portArg) {
    const port = parseInt(portArg.split("=")[1], 10);
    startGatewayMcpHttp(port);
  } else if (process.argv.includes("--http")) {
    startGatewayMcpHttp(3890);
  } else {
    startGatewayMcpStdio();
  }
}
