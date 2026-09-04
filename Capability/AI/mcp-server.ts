/**
 * Plugin/AI FastMCP Protocol Server
 */

import { writeSync } from "node:fs";
import { aiOperation, type AIInput, AI_ACTIONS } from "./operation.ts";

export const PROTOCOL_VERSION = "2024-11-05";
export const SERVER_NAME = "ai";
export const SERVER_VERSION = "1.0.0";

export const AI_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: { type: "string", enum: [...AI_ACTIONS] },
    prompt: { type: "string", description: "Direct prompt text for single-turn inference" },
    messages: {
      type: "array",
      description: "Array of chat messages with role and content",
      items: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["system", "user", "assistant", "tool"] },
          content: { type: "string" },
        },
      },
    },
    model: { type: "string", description: "Model ID (e.g. claude-3-7-sonnet, gpt-4o, gemini-2.5-pro, deepseek-r1)" },
    provider: { type: "string", enum: ["anthropic", "openai", "gemini", "deepseek", "groq", "cloudflare", "ollama"] },
    temperature: { type: "number", minimum: 0, maximum: 2 },
    maxTokens: { type: "integer", minimum: 1 },
    reasoningEffort: { type: "string", enum: ["low", "medium", "high"] },
    thinkingBudget: { type: "integer", minimum: 0, description: "Budget tokens for reasoning (Claude 3.7 / Gemini 2.5)" },
    systemPrompt: { type: "string" },
    apiKey: { type: "string", description: "BYOK provider API key" },
    sessionToken: { type: "string", description: "BYOS subscription session token" },
    subscriptionType: { type: "string", enum: ["claude-pro", "chatgpt-plus", "copilot", "gemini-advanced", "custom"] },
  },
} as const;

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc: "2.0"; id?: JsonRpcId; method: string; params?: unknown };

const AI_TOOL = {
  name: "ai",
  description:
    "Universal multi-model inference: BYOK, BYOS, Claude/OpenAI/Gemini/DeepSeek, reasoning budget, and structured outputs.",
  inputSchema: AI_INPUT_SCHEMA,
};

export async function handleAiMcpMessage(request: unknown): Promise<unknown> {
  if (!request || typeof request !== "object") return null;
  const req = request as JsonRpcRequest;
  if (req.jsonrpc !== "2.0") return null;

  if (req.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: req.id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      },
    };
  }

  if (req.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: req.id,
      result: { tools: [AI_TOOL] },
    };
  }

  if (req.method === "tools/call") {
    const params = req.params as { name?: string; arguments?: AIInput };
    if (params?.name !== "ai") {
      return {
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32601, message: `Tool '${params?.name}' not found on AI server` },
      };
    }

    try {
      const result = await aiOperation(params.arguments || ({ action: "status" } as AIInput));
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          isError: !result.ok,
        },
      };
    } catch (err: any) {
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }],
          isError: true,
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: req.id,
    error: { code: -32601, message: `Method '${req.method}' not implemented` },
  };
}

export function startAiMcpStdio(): void {
  process.stdin.resume();
  let buffer = "";

  process.stdin.on("data", async (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const req = JSON.parse(trimmed);
        const res = await handleAiMcpMessage(req);
        if (res) {
          writeSync(process.stdout.fd, `${JSON.stringify(res)}\n`);
        }
      } catch (err) {
        console.error("Failed to parse JSON-RPC line:", err);
      }
    }
  });
}

if (import.meta.main) {
  startAiMcpStdio();
}
