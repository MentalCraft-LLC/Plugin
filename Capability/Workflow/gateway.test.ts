import { describe, expect, it } from "bun:test";
import { GATEWAY_TOOLS, handleGatewayRpc } from "./gateway.ts";

describe("Plugin Master Gateway MCP Server", () => {
  it("exposes all 10 canonical subsystem tools in GATEWAY_TOOLS", () => {
    const toolNames = GATEWAY_TOOLS.map((t) => t.name);
    expect(toolNames).toContain("workflow");
    expect(toolNames).toContain("design");
    expect(toolNames).toContain("business");
    expect(toolNames).toContain("science");
    expect(toolNames).toContain("content");
    expect(toolNames).toContain("browser");
    expect(toolNames).toContain("message");
    expect(toolNames).toContain("secret");
    expect(toolNames).toContain("infra");
    expect(toolNames).toContain("company");
    expect(GATEWAY_TOOLS.length).toBe(10);
  });

  it("handles initialize method compliant with MCP 2024-11-05", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });

    expect(res).not.toBeNull();
    expect(res?.id).toBe(1);
    expect((res?.result as any)?.protocolVersion).toBe("2024-11-05");
    expect((res?.result as any)?.serverInfo?.name).toBe("mentalcraft-gateway-mcp");
  });

  it("handles tools/list returning all 10 tools", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });

    expect(res).not.toBeNull();
    expect(res?.id).toBe(2);
    const tools = (res?.result as any)?.tools;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(10);
  });

  it("returns null for notifications per JSON-RPC 2.0", async () => {
    const notification1 = await handleGatewayRpc({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });
    expect(notification1).toBeNull();

    const notification2 = await handleGatewayRpc({
      jsonrpc: "2.0",
      method: "some/event",
    });
    expect(notification2).toBeNull();
  });

  it("returns -32601 error for unknown methods", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "unknown/method",
    });

    expect(res?.error?.code).toBe(-32601);
  });

  it("returns -32601 error for unknown tool in tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "nonexistent_tool",
        arguments: {},
      },
    });

    expect(res?.error?.code).toBe(-32601);
  });

  it("handles workflow health check via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "workflow",
        arguments: {
          action: "health",
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
    const content = (res?.result as any)?.content;
    expect(Array.isArray(content)).toBe(true);
    expect(content[0]?.type).toBe("text");
  });

  it("handles secret mask action via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "secret",
        arguments: {
          action: "mask",
          secret: "sk_test_51Mzxyz1234567890",
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles company compliance action via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "company",
        arguments: {
          action: "company_compliance_check",
          params: {
            workspaceRoot: "/Users/laiyongzhang/Documents/Holar",
          },
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles infra canary action via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "infra",
        arguments: {
          action: "infra_canary_probe",
          params: {},
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles browser status action via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "browser",
        arguments: {
          action: "status",
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles design catalog action via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "design",
        arguments: {
          action: "get_component_catalog",
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles business market validation via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "business",
        arguments: {
          action: "venture_market_validation",
          params: { modality: "website" },
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles science patent check via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "science",
        arguments: {
          action: "patent_novelty_check",
          params: {
            title: "Multi-Modal Sensor Synthesis",
            independent_claims: ["A method comprising..."],
          },
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });

  it("handles content worldbuilding via tools/call", async () => {
    const res = await handleGatewayRpc({
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: {
        name: "content",
        arguments: {
          action: "forge_world_rules",
          params: {
            genre: "solarpunk",
            coreLaw: "Clean energy equilibrium",
          },
        },
      },
    });

    expect(res?.error).toBeUndefined();
    expect(res?.result).toBeDefined();
  });
});
