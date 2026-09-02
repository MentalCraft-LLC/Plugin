import { describe, expect, test } from "bun:test";
import {
  MESSAGE_ACTIONS,
  MESSAGE_INPUT_SCHEMA,
  PROTOCOL_VERSION,
  createMessageMcpDispatcher,
  createMessageReader,
  encodeMessage,
} from "./mcp-server.ts";

function collectLines(buffer: Buffer): unknown[] {
  const messages: unknown[] = [];
  const read = createMessageReader((value) => messages.push(value));
  read(buffer);
  return messages;
}

describe("Message MCP adapter", () => {
  test("public action list matches the message operation", () => {
    expect([...MESSAGE_ACTIONS]).toEqual(["send", "send_photo", "poll", "status", "bootstrap"]);
    expect(MESSAGE_INPUT_SCHEMA.required).toEqual(["action"]);
    expect(MESSAGE_INPUT_SCHEMA.additionalProperties).toBe(false);
  });

  test("reads newline JSON", () => {
    expect(collectLines(encodeMessage({ jsonrpc: "2.0", id: 1, method: "ping" }))).toEqual([
      { jsonrpc: "2.0", id: 1, method: "ping" },
    ]);
  });

  test("initialize and tools/list expose message", async () => {
    const dispatch = createMessageMcpDispatcher(async () => ({ ok: true }));
    const init = await dispatch({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    expect(init?.result).toEqual({
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "message", version: "1.0.0" },
    });
    const list = await dispatch({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (list?.result as { tools: Array<{ name: string }> }).tools;
    expect(tools.map((item) => item.name)).toEqual(["message"]);
  });

  test("tools/call delegates to the host-neutral operation", async () => {
    let received: unknown;
    const dispatch = createMessageMcpDispatcher(async (input) => {
      received = input;
      return { ok: true, channel: "telegram" };
    });
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "message", arguments: { action: "send", text: "hello" } },
    });
    expect(received).toEqual({ action: "send", text: "hello" });
    const text = (response?.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain("telegram");
    expect((response?.result as { isError?: boolean }).isError).toBeUndefined();
  });

  test("bootstrap stays local-only on the MCP path", async () => {
    const dispatch = createMessageMcpDispatcher();
    const response = await dispatch({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "message", arguments: { action: "bootstrap", channel: "telegram" } },
    });
    const text = (response?.result as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain("bootstrap_local_only");
  });
});
