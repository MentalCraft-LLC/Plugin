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

import { workflowOperation } from "./operation.ts";
import { designOperation } from "../../Domain/Design/operation.ts";
import { businessOperation } from "../../Domain/Business/operation.ts";
import { scienceOperation } from "../../Domain/Science/operation.ts";
import { contentOperation } from "../../Domain/Content/operation.ts";
import { createBrowserContextOperation } from "../../Tool/Browser/operation.ts";
import { createMessageOperation } from "../../Tool/Message/operation.ts";
import { secretOperation } from "../../Tool/Secret/operation.ts";
import { infraOperation } from "../../Domain/Infra/operation.ts";
import { companyOperation } from "../../Domain/Company/operation.ts";

import { WORKFLOW_INPUT_SCHEMA } from "./mcp-server.ts";
import { DESIGN_INPUT_SCHEMA } from "../../Domain/Design/mcp-server.ts";
import { BUSINESS_INPUT_SCHEMA } from "../../Domain/Business/mcp-server.ts";
import { SCIENCE_INPUT_SCHEMA } from "../../Domain/Science/mcp-server.ts";
import { CONTENT_INPUT_SCHEMA } from "../../Domain/Content/mcp-server.ts";
import { BROWSER_INPUT_SCHEMA } from "../../Tool/Browser/mcp-server.ts";
import { MESSAGE_INPUT_SCHEMA } from "../../Tool/Message/mcp-server.ts";
import { SECRET_INPUT_SCHEMA } from "../../Tool/Secret/mcp-server.ts";
import { INFRA_INPUT_SCHEMA } from "../../Domain/Infra/mcp-server.ts";
import { COMPANY_INPUT_SCHEMA } from "../../Domain/Company/mcp-server.ts";

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
    name: "content",
    description: "MentalCraft Creative & Commercial Content Production Engine (Fiction Worldbuilding, Character Arcs, 15 Plot Beats, Sensory Prose, PAS Copywriting, Omnichannel Adapters).",
    inputSchema: CONTENT_INPUT_SCHEMA,
  },
  {
    name: "browser",
    description: "MentalCraft Browser Automation & Native Bridge. Inactive tab driving, screencasts, visual HUD, storage mutation, and CDP inspection.",
    inputSchema: BROWSER_INPUT_SCHEMA,
  },
  {
    name: "message",
    description: "MentalCraft Agent Message Bus. Unified messaging across Telegram, iMessage, and Email with local 0600 security.",
    inputSchema: MESSAGE_INPUT_SCHEMA,
  },
  {
    name: "secret",
    description: "MentalCraft Mode-0600 Local Credential Vault. Write, read, rotate, audit, validate, and mask confidential tokens with atomic POSIX mode-0600 security.",
    inputSchema: SECRET_INPUT_SCHEMA,
  },
  {
    name: "infra",
    description: "MentalCraft Edge Microservices & Data Infrastructure Engine (Canary Latency Benchmarks, D1 Schema Verification, Worker Bundles, Stripe Webhook Simulation).",
    inputSchema: INFRA_INPUT_SCHEMA,
  },
  {
    name: "company",
    description: "MentalCraft Corporate Governance & Entity Compliance Engine (Dual-Jurisdiction LLC/WFOE Verification, Cap Table Dilution Calculator, IP Assignment Audit, Annual Reports).",
    inputSchema: COMPANY_INPUT_SCHEMA,
  },
];

export async function handleGatewayRpc(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id;

  // JSON-RPC 2.0 Notification: requests without an id (or notifications/*) MUST NOT return a response
  if (id === undefined || request.method.startsWith("notifications/")) {
    return null;
  }

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

  if (request.method === "ping") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
    };
  }

  if (request.method === "resources/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { resources: [] },
    };
  }

  if (request.method === "prompts/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { prompts: [] },
    };
  }

  if (request.method === "logging/setLevel") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
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
      } else if (toolName === "content") {
        output = await contentOperation(args as any);
      } else if (toolName === "browser" || toolName === "chrome") {
        output = await executeChrome(args as any, undefined, { isProjectTrusted: () => true }, "gateway_session", undefined);
      } else if (toolName === "message") {
        output = await executeMessage(args as any);
      } else if (toolName === "secret") {
        const act = (args.action as string) || (args.content !== undefined ? "write" : "read");
        output = secretOperation({ ...args, action: act } as any);
      } else if (toolName === "infra") {
        output = await infraOperation(args.action as any, (args.params as any) || args);
      } else if (toolName === "company") {
        output = await companyOperation(args.action as any, (args.params as any) || args);
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

export function protectStdioTransport(): void {
  const toStderr = (...args: any[]) => {
    process.stderr.write(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n");
  };
  console.log = toStderr;
  console.info = toStderr;
  console.warn = toStderr;
  console.debug = toStderr;
}

export function startGatewayMcpStdio() {
  protectStdioTransport();
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
        if (res !== null && res !== undefined) {
          process.stdout.write(JSON.stringify(res) + "\n");
        }
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
        const { executeHealthCheck } = require("./operation.ts");
        const report = await executeHealthCheck("all");
        const status = report.overallStatus === "healthy" ? 200 : 503;
        return new Response(JSON.stringify(report, null, 2), { status, headers: corsHeaders });
      }

      if (url.pathname === "/metrics") {
        const { getSystemTelemetry } = require("./operation.ts");
        const telemetry = getSystemTelemetry();
        return new Response(JSON.stringify(telemetry, null, 2), { status: 200, headers: corsHeaders });
      }

      if (url.pathname === "/schema" || url.pathname === "/openrpc.json") {
        const res = await workflowOperation({ action: "export_schema_catalog" });
        return new Response(JSON.stringify(res.data, null, 2), { status: 200, headers: corsHeaders });
      }

      if (url.pathname === "/openapi.json" || url.pathname === "/openapi") {
        const res = await workflowOperation({ action: "export_openapi_catalog" });
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
