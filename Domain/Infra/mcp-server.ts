/**
 * Plugin/Infra MCP Protocol Server
 *
 * Exposes the 'infra' tool over JSON-RPC 2.0 stdio.
 */

import { infraOperation } from "./operation.ts";
import { type InfraAction, INFRA_ACTIONS } from "./core.ts";

export { INFRA_ACTIONS };

export const INFRA_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: INFRA_ACTIONS,
      description: "Infra action to perform",
    },
    params: {
      type: "object",
      description: "Action-specific parameters",
    },
  },
} as const;

export async function handleInfraMcpCall(params: {
  action: InfraAction;
  params?: Record<string, unknown>;
}) {
  return await infraOperation(params.action, params.params || {});
}

type JsonRpcId = string | number | null;
type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};
type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export async function handleInfraRpc(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id;
  if (id === undefined || request.method.startsWith("notifications/")) return null;

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "mentalcraft-infra-mcp", version: "1.0.0" },
      },
    };
  }

  if (request.method === "ping") return { jsonrpc: "2.0", id, result: {} };
  if (request.method === "resources/list") return { jsonrpc: "2.0", id, result: { resources: [] } };
  if (request.method === "prompts/list") return { jsonrpc: "2.0", id, result: { prompts: [] } };
  if (request.method === "logging/setLevel") return { jsonrpc: "2.0", id, result: {} };

  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "infra",
            description:
              "MentalCraft Edge Infrastructure Engine (Canary probes, D1 schema audit, Worker bundle audit, Stripe webhook simulation).",
            inputSchema: INFRA_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (params?.name !== "infra") {
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${params?.name ?? "undefined"}` } };
    }
    try {
      const args = params.arguments ?? {};
      const result = await infraOperation(args.action as InfraAction, (args.params as Record<string, unknown>) || args);
      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${request.method}` } };
}

import { protectStdioTransport } from "../../stdio.ts";

export function startInfraMcpStdio() {
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
        const res = await handleInfraRpc(req);
        if (res !== null && res !== undefined) process.stdout.write(JSON.stringify(res) + "\n");
      } catch {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n");
      }
    }
  });
}

if (import.meta.main) {
  startInfraMcpStdio();
}
