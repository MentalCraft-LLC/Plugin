import { writeSync } from "node:fs";
import { createMessageOperation, type MessageInput } from "./operation.ts";

export const PROTOCOL_VERSION = "2024-11-05";
export const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
]);
export const SERVER_NAME = "message";
export const SERVER_VERSION = "1.0.0";

export const MESSAGE_ACTIONS = ["send", "send_photo", "poll", "status", "bootstrap"] as const;

export const MESSAGE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: { type: "string", enum: [...MESSAGE_ACTIONS] },
    text: { type: "string", minLength: 1, maxLength: 4000 },
    photoPath: { type: "string", description: "Path to image or screenshot to deliver as WebP" },
    caption: { type: "string", description: "Optional caption for the photo" },
    channel: { type: "string", enum: ["telegram", "imessage", "email"] },
    chatId: { type: ["number", "string"] },
  },
} as const;

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc: "2.0"; id?: JsonRpcId; method: string; params?: unknown };

const MESSAGE_TOOL = {
  name: "message",
  description:
    "Unified Owner messaging: send, poll, status, or bootstrap over telegram, imessage and email. Credentials stay in local 0600 configs.",
  inputSchema: MESSAGE_INPUT_SCHEMA,
};

export function encodeMessage(message: object): Buffer {
  return Buffer.from(`${JSON.stringify(message)}\n`);
}

export function createMessageReader(onMessage: (value: unknown) => void): (chunk: Buffer) => void {
  let buffer = Buffer.alloc(0);
  return (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      const newline = buffer.indexOf(0x0a);
      if (newline < 0) return;
      const line = buffer.subarray(0, newline).toString("utf8").trim();
      buffer = buffer.subarray(newline + 1);
      if (line.length > 0) onMessage(JSON.parse(line));
    }
  };
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return Boolean(value) && typeof value === "object" && (value as JsonRpcRequest).jsonrpc === "2.0";
}

function textResult(value: unknown, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

export function createMessageMcpDispatcher(execute = createMessageOperation()) {
  return async (message: unknown) => {
    if (!isJsonRpcRequest(message) || message.id === undefined) return undefined;
    if (message.method === "initialize") {
      const params = (message.params ?? {}) as { protocolVersion?: string };
      const protocolVersion = params.protocolVersion && SUPPORTED_PROTOCOL_VERSIONS.has(params.protocolVersion)
        ? params.protocolVersion
        : PROTOCOL_VERSION;
      return {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        },
      };
    }
    if (message.method === "ping") return { jsonrpc: "2.0", id: message.id, result: {} };
    if (message.method === "tools/list") {
      return { jsonrpc: "2.0", id: message.id, result: { tools: [MESSAGE_TOOL] } };
    }
    if (message.method === "tools/call") {
      const params = (message.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      try {
        if (params.name !== "message") {
          return { jsonrpc: "2.0", id: message.id, result: textResult({ error: "unknown tool" }, true) };
        }
        const input = (params.arguments ?? {}) as MessageInput;
        if (!MESSAGE_ACTIONS.includes(input.action)) {
          return { jsonrpc: "2.0", id: message.id, result: textResult({ error: "unknown message action" }, true) };
        }
        const value = await execute(input);
        return { jsonrpc: "2.0", id: message.id, result: textResult(value) };
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        return { jsonrpc: "2.0", id: message.id, result: textResult({ error: text }, true) };
      }
    }
    return { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } };
  };
}

async function serveStdio(): Promise<void> {
  const dispatch = createMessageMcpDispatcher();
  const write = (message: object) => {
    writeSync(1, encodeMessage(message));
  };
  const read = createMessageReader((value) => {
    void dispatch(value).then((response) => {
      if (response) write(response);
    }).catch((error) => {
      const id = isJsonRpcRequest(value) ? value.id ?? null : null;
      write({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: error instanceof Error ? error.message : String(error) },
      });
    });
  });
  for await (const chunk of process.stdin) {
    read(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
}

if (import.meta.main) {
  void serveStdio();
}
