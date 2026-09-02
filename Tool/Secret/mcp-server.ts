/**
 * Plugin/Secret - FastMCP Server for Mode-0600 Local Credential Vault
 */

import { writeSync } from "node:fs";
import { secretOperation, type SecretInput, type SecretAction, type SecretTokenType } from "./operation.ts";

export const PROTOCOL_VERSION = "2024-11-05";
export const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
]);
export const SERVER_NAME = "secret";
export const SERVER_VERSION = "1.0.0";

export const SECRET_ACTIONS = ["write", "read", "mask", "rotate", "audit", "validate"] as const;

export const SECRET_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: { type: "string", enum: [...SECRET_ACTIONS], description: "Secret operation to perform." },
    path: { type: "string", description: "Target absolute path for secret file operations." },
    content: { type: "string", description: "Secret content to write or rotate." },
    secret: { type: "string", description: "Raw secret string to mask or validate." },
    tokenType: {
      type: "string",
      enum: ["stripe", "telegram", "github", "openai", "anthropic", "cloudflare", "generic"],
      description: "Optional token format type to validate.",
    },
    unmasked: { type: "boolean", description: "Whether to return unmasked content on read (default false for safety)." },
  },
} as const;

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc: "2.0"; id?: JsonRpcId; method: string; params?: unknown };

export const SECRET_TOOL = {
  name: "secret",
  description:
    "MentalCraft Mode-0600 Local Credential Vault. Write, read, rotate, audit, validate, and mask confidential tokens with atomic POSIX mode-0600 security.",
  inputSchema: SECRET_INPUT_SCHEMA,
};

export function encodeSecretMessage(message: object): Buffer {
  return Buffer.from(`${JSON.stringify(message)}\n`);
}

export function handleSecretRpc(request: JsonRpcRequest): object | null {
  const id = request.id;
  if (id === undefined || request.method.startsWith("notifications/")) {
    return null;
  }

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      },
    };
  }

  if (request.method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (request.method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: [SECRET_TOOL] } };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: SecretInput } | undefined;
    if (!params || params.name !== "secret") {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Tool not found: ${params?.name ?? "undefined"}` },
      };
    }

    try {
      const args = params.arguments || ({} as SecretInput);
      const res = secretOperation(args);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${request.method}` },
  };
}

export function startSecretMcpStdio(): void {
  let buffer = Buffer.alloc(0);
  process.stdin.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      const newline = buffer.indexOf(0x0a);
      if (newline < 0) return;
      const line = buffer.subarray(0, newline).toString("utf8").trim();
      buffer = buffer.subarray(newline + 1);
      if (line.length === 0) continue;
      try {
        const req = JSON.parse(line);
        const res = handleSecretRpc(req);
        if (res) writeSync(1, encodeSecretMessage(res));
      } catch (e: any) {
        writeSync(1, encodeSecretMessage({ jsonrpc: "2.0", id: null, error: { code: -32700, message: e.message } }));
      }
    }
  });
}

if (import.meta.main) {
  startSecretMcpStdio();
}
