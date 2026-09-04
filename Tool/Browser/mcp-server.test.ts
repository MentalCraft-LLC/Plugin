import { describe, expect, test } from "bun:test";
import {
  CHROME_ACTIONS,
  CHROME_INPUT_SCHEMA,
  createChromeMcpDispatcher,
  createMessageReader,
  encodeFramedMessage,
  encodeMessage,
  PROTOCOL_VERSION,
  resolveBrowserSessionName,
} from "./mcp-server.ts";

function unusedCloseGroup() {
  return Promise.resolve({ status: "group_closed" });
}

function collectFrames(buffer: Buffer): unknown[] {
  const messages: unknown[] = [];
  const read = createMessageReader((value) => messages.push(value));
  read(buffer);
  return messages;
}

describe("Browser MCP adapter", () => {
  test("public action list matches the chrome Tool ABI", () => {
    expect([...CHROME_ACTIONS]).toEqual([
      "status",
      "repair",
      "hot_reload",
      "reload_page",
      "open",
      "controls",
      "read_text",
      "read_markdown",
      "read_styles",
      "read_scripts",
      "disassemble",
      "read_console",
      "read_network",
      "read_storage",
      "set_storage",
      "clear_storage",
      "read_cookies",
      "clear_cookies",
      "performance_metrics",
      "wait_for",
      "inspect_element",
      "evaluate_script",
      "click",
      "hover",
      "scroll",
      "press_key",
      "fill_public",
      "fill_form",
      "fill_local",
      "press_enter",
      "select_combobox",
      "cdp_click",
      "cdp_scroll",
      "cdp_hover",
      "cdp_key",
      "capture_ga4_measurement_id",
      "capture_clarity_token",
      "capture_session",
      "capture_screenshot",
      "capture_video",
      "record_video",
      "capture_pdf",
      "semantic_snapshot",
      "annotate",
      "emulate",
      "lighthouse_audit",
      "performance_trace",
      "heap_analysis",
      "network_waterfall",
      "security_audit",
      "emulate_profile",
      "accessibility_tree",
      "smart_selector_heal",
      "visual_regression_diff",
      "journey_record_and_replay",
      "session_isolation_vault",
      "inp_interaction_vitals",
      "persona_emulation",
      "extract_structured_data",
      "chaos_resilience_test",
      "batch_tab_orchestration",
      "drag_and_drop",
      "upload_file",
      "close_group",
      "network_mock_interceptor",
      "har_replay_mock",
      "web_vitals_radar",
      "stealth_profile_guard",
      "attention_heatmap_predict",
      "e2e_spec_generator",
      "memory_leak_tracer",
      "responsive_matrix_linter",
      "security_sandbox_audit",
      "dom_race_profiler",
      "lighthouse_ci_budget",
      "list_actions",
    ]);
    expect(CHROME_INPUT_SCHEMA.required).toEqual(["action"]);
    expect(CHROME_INPUT_SCHEMA.additionalProperties).toBe(false);
  });

  test("reads newline JSON and Content-Length frames", () => {
    expect(collectFrames(encodeMessage({ jsonrpc: "2.0", id: 1, method: "ping" }))).toEqual([
      { jsonrpc: "2.0", id: 1, method: "ping" },
    ]);
    expect(collectFrames(encodeFramedMessage({ jsonrpc: "2.0", id: 2, method: "ping" }))).toEqual([
      { jsonrpc: "2.0", id: 2, method: "ping" },
    ]);
    expect(collectFrames(Buffer.from('Content-Length: 40\n\n{"jsonrpc":"2.0","id":3,"method":"ping"}'))).toEqual([
      { jsonrpc: "2.0", id: 3, method: "ping" },
    ]);
  });

  test("initialize and tools/list expose browser plus setup", async () => {
    const dispatch = createChromeMcpDispatcher({
      execute: async () => ({ status: "unused" }),
      setup: () => ({
        extensionPath: "/tmp/extension",
        extensionId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        nativeManifestPath: "/tmp/native.json",
        copied: true,
      }),
      closeGroup: unusedCloseGroup,
    });
    const initialized = await dispatch({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "test" } },
    });
    expect(initialized?.result).toMatchObject({
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: { name: "browser" },
      capabilities: { tools: { listChanged: false } },
    });
    const listed = await dispatch({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (listed?.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name);
    expect(tools).toEqual(["browser", "browser_setup"]);
  });

  test("tools/call still accepts the chrome alias", async () => {
    const calls: unknown[] = [];
    const dispatch = createChromeMcpDispatcher({
      execute: async (params) => {
        calls.push(params);
        return { status: "ready" };
      },
      setup: () => {
        throw new Error("setup should not run");
      },
      closeGroup: unusedCloseGroup,
    });
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "chrome", arguments: { action: "status" } },
    });
    expect(calls).toEqual([{ action: "status" }]);
    expect((response?.result as { isError?: boolean }).isError).toBeUndefined();
  });

  test("tools/call reuses the shared chrome operation and redacts secrets", async () => {
    const calls: unknown[] = [];
    const dispatch = createChromeMcpDispatcher({
      execute: async (params, _signal, context, sessionName) => {
        calls.push({ params, trusted: context.isProjectTrusted(), sessionName });
        return { status: "ready", cookies: "secret-cookie", token: "ya29.not-for-model" };
      },
      setup: () => {
        throw new Error("setup should not run");
      },
      closeGroup: unusedCloseGroup,
      sessionName: "grok-session",
      trusted: () => true,
    });
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "browser", arguments: { action: "status" } },
    });
    expect(calls).toEqual([
      { params: { action: "status" }, trusted: true, sessionName: "grok-session" },
    ]);
    const text = (response?.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain("[REDACTED]");
    expect(text).not.toContain("secret-cookie");
    expect(text).not.toContain("ya29.not-for-model");
    expect((response?.result as { isError?: boolean }).isError).toBeUndefined();
  });

  test("setup receipt never includes a pairing token", async () => {
    const dispatch = createChromeMcpDispatcher({
      execute: async () => ({ status: "unused" }),
      setup: () => ({
        extensionPath: "/tmp/holar-chrome/extension",
        extensionId: "jfmmobajkjgocbpbbfopblikdjoaeogo",
        nativeManifestPath: "/tmp/native.json",
        copied: false,
      }),
      closeGroup: unusedCloseGroup,
    });
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "browser_setup", arguments: {} },
    });
    const text = (response?.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain("/tmp/holar-chrome/extension");
    expect(text).not.toMatch(/pairing|token|auth/i);
  });

  test("financial confirmation stays fail-closed", async () => {
    const dispatch = createChromeMcpDispatcher({
      execute: async () => {
        throw new Error("financial_confirmation_required");
      },
      setup: () => {
        throw new Error("setup should not run");
      },
      closeGroup: unusedCloseGroup,
      trusted: () => true,
    });
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "browser",
        arguments: { action: "click", url: "https://checkout.stripe.com/pay", name: "Pay" },
      },
    });
    expect((response?.result as { isError: boolean }).isError).toBe(true);
    expect((response?.result as { content: Array<{ text: string }> }).content[0].text).toContain(
      "financial_confirmation_required",
    );
  });

  test("notifications do not produce a response", async () => {
    const dispatch = createChromeMcpDispatcher({
      execute: async () => ({ status: "unused" }),
      setup: () => {
        throw new Error("setup should not run");
      },
      closeGroup: unusedCloseGroup,
    });
    const response = await dispatch({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(response).toBeUndefined();
  });

  test("close_group does not go through the page operation", async () => {
    let closed = 0;
    const dispatch = createChromeMcpDispatcher({
      execute: async () => {
        throw new Error("execute should not run");
      },
      setup: () => {
        throw new Error("setup should not run");
      },
      closeGroup: async () => {
        closed += 1;
        return { status: "group_closed", closed_tab_count: 2 };
      },
    });
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "browser", arguments: { action: "close_group" } },
    });
    expect(closed).toBe(1);
    expect((response?.result as { content: Array<{ text: string }> }).content[0].text).toContain("group_closed");
  });

  test("session name prefers the generic Session environment", () => {
    const keys = ["HOLAR_SESSION_ID", "HOLAR_SESSION_NAME", "HOLAR_BROWSER_SESSION"] as const;
    const prior = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];
    process.env.HOLAR_SESSION_NAME = "Holar Session";
    try {
      expect(resolveBrowserSessionName()).toBe("Holar Session");
    } finally {
      for (const key of keys) {
        const value = prior[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  test("workspace MCP entry points at the host-agnostic launcher", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const here = fileURLToPath(new URL(".", import.meta.url));
    const manifest = JSON.parse(readFileSync(resolve(here, "../../../.mcp.json"), "utf8")) as {
      mcpServers: { browser: { command: string; args: string[] } };
    };
    expect(manifest.mcpServers.browser.command).toBe("bun");
    expect(manifest.mcpServers.browser.args).toEqual(["Plugin/Tool/Browser/serve.mjs"]);
    expect(readFileSync(resolve(here, "./serve.mjs"), "utf8")).toContain("locateServer");
  });
});
