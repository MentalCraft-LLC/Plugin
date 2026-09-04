import { describe, it, expect } from "bun:test";
import { aiOperation, AI_ACTIONS } from "./operation.ts";
import { handleAiMcpMessage } from "./mcp-server.ts";

describe("Plugin/Capability/AI FastMCP Capability Suite", () => {
  it("list_actions returns all registered AI actions", async () => {
    const res = await aiOperation({ action: "list_actions" });
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ actions: AI_ACTIONS });
  });

  it("models returns supported foundation models across providers", async () => {
    const res = await aiOperation({ action: "models" });
    expect(res.ok).toBe(true);
    const data = res.data as { models: any[] };
    expect(data.models.length).toBeGreaterThan(5);
    const modelIds = data.models.map((m) => m.id);
    expect(modelIds).toContain("claude-3-7-sonnet-20250219");
    expect(modelIds).toContain("gpt-4o");
    expect(modelIds).toContain("deepseek-reasoner");
  });

  it("status returns provider & subscription capabilities", async () => {
    const res = await aiOperation({ action: "status" });
    expect(res.ok).toBe(true);
    const data = res.data as any;
    expect(data.supportedProviders).toContain("anthropic");
    expect(data.supportedSubscriptions).toContain("claude-pro");
  });

  it("validate_key masks and checks provider keys", async () => {
    const res = await aiOperation({
      action: "validate_key",
      provider: "anthropic",
      apiKey: "sk-ant-api03-12345678901234567890",
    });
    expect(res.ok).toBe(true);
    expect((res.data as any).maskedKey).toContain("••••");
  });

  it("validate_subscription validates BYOS session tokens", async () => {
    const res = await aiOperation({
      action: "validate_subscription",
      subscriptionType: "claude-pro",
      sessionToken: "session_token_example_12345",
    });
    expect(res.ok).toBe(true);
    expect((res.data as any).maskedToken).toContain("••••");
  });

  it("chat performs single-turn mock inference in test environment", async () => {
    const res = await aiOperation({
      action: "chat",
      prompt: "What are the 12 universal ecosystem virtues?",
      provider: "anthropic",
      apiKey: "sk-ant-api03-12345678901234567890",
      model: "claude-3-7-sonnet-20250219",
      thinkingBudget: 2048,
    });
    expect(res.ok).toBe(true);
    const data = res.data as any;
    expect(data.content).toBeDefined();
    expect(data.text).toBeDefined();
    expect(data.model).toBe("claude-3-7-sonnet-20250219");
    expect(data.provider).toBe("anthropic");
  });

  it("handleAiMcpMessage responds to FastMCP protocol lifecycle", async () => {
    const initRes = (await handleAiMcpMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
    })) as any;
    expect(initRes.result.serverInfo.name).toBe("ai");

    const toolsRes = (await handleAiMcpMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    })) as any;
    expect(toolsRes.result.tools[0].name).toBe("ai");

    const callRes = (await handleAiMcpMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "ai",
        arguments: { action: "models" },
      },
    })) as any;
    expect(callRes.result.isError).toBe(false);
  });
});
