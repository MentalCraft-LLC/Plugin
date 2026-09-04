/**
 * Plugin/AI - Universal FastMCP Multi-Model AI Inference Capability
 *
 * Wraps @mentalcraft/infra-ai client supporting:
 * - BYOK (Bring Your Own Key) across Anthropic, OpenAI, Gemini, DeepSeek
 * - BYOS (Bring Your Own Subscription) for Claude Pro, ChatGPT Plus, Copilot
 * - TanStack AI universal adapters, thinking budget & JSON Schema outputs
 * - Privacy-first telemetry linkage with Infra/Analytics
 */

import { AIClient } from "../../../Infra/AI/src/client.ts";
import { MODEL_REGISTRY } from "../../../Infra/AI/src/adapters/catalog.ts";
import { maskApiKey, validateBYOK } from "../../../Infra/AI/src/byok.ts";
import { maskBYOSToken, validateBYOS } from "../../../Infra/AI/src/byos.ts";
import type { AIProvider, BYOSSubscriptionType, AIMessage } from "../../../Infra/AI/src/types.ts";

export const AI_PROTOCOL = "holar.ai.v1" as const;

export type AIAction =
  | "chat"
  | "models"
  | "status"
  | "validate_key"
  | "validate_subscription"
  | "list_actions";

export const AI_ACTIONS: AIAction[] = [
  "chat",
  "models",
  "status",
  "validate_key",
  "validate_subscription",
  "list_actions",
];

export interface AIInput {
  action: AIAction;
  prompt?: string;
  messages?: AIMessage[];
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: "low" | "medium" | "high";
  thinkingBudget?: number;
  systemPrompt?: string;
  responseFormat?: {
    type: "text" | "json_object" | "json_schema";
    schema?: Record<string, unknown>;
  };
  apiKey?: string;
  sessionToken?: string;
  subscriptionType?: BYOSSubscriptionType;
}

export async function aiOperation(input: AIInput): Promise<{
  protocol: string;
  action: AIAction;
  ok: boolean;
  data?: unknown;
  error?: string;
}> {
  const client = new AIClient();

  switch (input.action) {
    case "list_actions":
      return {
        protocol: AI_PROTOCOL,
        action: input.action,
        ok: true,
        data: { actions: AI_ACTIONS },
      };

    case "models": {
      const models = await client.models();
      return {
        protocol: AI_PROTOCOL,
        action: input.action,
        ok: true,
        data: { models },
      };
    }

    case "status": {
      return {
        protocol: AI_PROTOCOL,
        action: input.action,
        ok: true,
        data: {
          supportedProviders: ["anthropic", "openai", "gemini", "deepseek", "groq", "cloudflare", "ollama"],
          supportedSubscriptions: ["claude-pro", "chatgpt-plus", "copilot", "gemini-advanced"],
          totalCatalogModels: MODEL_REGISTRY.length,
          timestamp: new Date().toISOString(),
        },
      };
    }

    case "validate_key": {
      if (!input.provider || !input.apiKey) {
        return {
          protocol: AI_PROTOCOL,
          action: input.action,
          ok: false,
          error: "Missing required 'provider' or 'apiKey'",
        };
      }
      const val = validateBYOK({ provider: input.provider, apiKey: input.apiKey });
      return {
        protocol: AI_PROTOCOL,
        action: input.action,
        ok: val.valid,
        data: {
          provider: input.provider,
          valid: val.valid,
          reason: val.reason,
          maskedKey: maskApiKey(input.apiKey),
        },
      };
    }

    case "validate_subscription": {
      if (!input.subscriptionType || !input.sessionToken) {
        return {
          protocol: AI_PROTOCOL,
          action: input.action,
          ok: false,
          error: "Missing required 'subscriptionType' or 'sessionToken'",
        };
      }
      const val = validateBYOS({ subscriptionType: input.subscriptionType, sessionToken: input.sessionToken });
      return {
        protocol: AI_PROTOCOL,
        action: input.action,
        ok: val.valid,
        data: {
          subscriptionType: input.subscriptionType,
          valid: val.valid,
          reason: val.reason,
          maskedToken: maskBYOSToken(input.sessionToken),
        },
      };
    }

    case "chat": {
      const messages: AIMessage[] = input.messages
        ? [...input.messages]
        : input.prompt
          ? [{ role: "user", content: input.prompt }]
          : [];

      if (messages.length === 0) {
        return {
          protocol: AI_PROTOCOL,
          action: input.action,
          ok: false,
          error: "Either 'prompt' or non-empty 'messages' is required for chat",
        };
      }

      try {
        const response = await client.chat({
          messages,
          model: input.model,
          provider: input.provider,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          reasoning: input.thinkingBudget
            ? { enabled: true, budgetTokens: input.thinkingBudget }
            : input.reasoningEffort
              ? { enabled: true, effort: input.reasoningEffort }
              : undefined,
          systemPrompt: input.systemPrompt,
          responseFormat: input.responseFormat,
          byok: input.apiKey && input.provider ? { provider: input.provider, apiKey: input.apiKey } : undefined,
          byos: input.sessionToken && input.subscriptionType
            ? { subscriptionType: input.subscriptionType, sessionToken: input.sessionToken }
            : undefined,
        });

        return {
          protocol: AI_PROTOCOL,
          action: input.action,
          ok: true,
          data: {
            ...response,
            content: response.text, // Ergonomic alias for agents
          },
        };
      } catch (err: any) {
        return {
          protocol: AI_PROTOCOL,
          action: input.action,
          ok: false,
          error: err?.message || String(err),
        };
      }
    }

    default:
      return {
        protocol: AI_PROTOCOL,
        action: input.action,
        ok: false,
        error: `Unknown AI action '${input.action}'. Valid: ${AI_ACTIONS.join(", ")}`,
      };
  }
}
