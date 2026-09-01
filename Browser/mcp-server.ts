import { spawnSync } from "node:child_process";
import { writeSync } from "node:fs";
import { createBrowserContextOperation, type BrowserContextInput, type BrowserContextOperation } from "./operation.ts";
import {
  BrowserClient,
  environmentSessionId,
  environmentSessionName,
  installBrowserBridge,
  loadAuthority,
  redactBrowserResult,
  safeSessionName,
} from "./core.ts";

export const PROTOCOL_VERSION = "2024-11-05";
export const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
]);
export const SERVER_NAME = "chrome";
export const SERVER_VERSION = "1.0.0";

export const CHROME_ACTIONS = [
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
  "drag_and_drop",
  "upload_file",
  "close_group",
] as const;

export const BROWSER_ACTIONS = CHROME_ACTIONS;

export const CHROME_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: { type: "string", enum: [...CHROME_ACTIONS] },
    url: { type: "string", minLength: 6, maxLength: 2000 },
    max_sections: { type: "integer", minimum: 1, maximum: 50 },
    role: {
      type: "string",
      enum: ["button", "link", "menuitem", "option", "tab", "combobox", "textbox", "checkbox", "radio", "switch"],
    },
    name: { type: "string", minLength: 1, maxLength: 200 },
    screen_x: { type: "integer", minimum: 1, maximum: 100000 },
    screen_y: { type: "integer", minimum: 1, maximum: 100000 },
    client_x: { type: "integer", minimum: 1, maximum: 100000 },
    client_y: { type: "integer", minimum: 1, maximum: 100000 },
    delta_x: { type: "integer", minimum: -100000, maximum: 100000 },
    delta_y: { type: "integer", minimum: -100000, maximum: 100000 },
    from_x: { type: "integer", minimum: 1, maximum: 100000 },
    from_y: { type: "integer", minimum: 1, maximum: 100000 },
    to_x: { type: "integer", minimum: 1, maximum: 100000 },
    to_y: { type: "integer", minimum: 1, maximum: 100000 },
    source_selector: { type: "string", minLength: 1, maxLength: 500 },
    target_selector: { type: "string", minLength: 1, maxLength: 500 },
    file_name: { type: "string", minLength: 1, maxLength: 255 },
    file_content: { type: "string", maxLength: 500000 },
    file_type: { type: "string", maxLength: 100 },
    base64: { type: "string", maxLength: 5000000 },
    key: {
      type: "string",
      enum: ["Tab", "Enter", "Escape", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"],
    },
    max_chars: { type: "integer", minimum: 1, maximum: 100000 },
    max_elements: { type: "integer", minimum: 1, maximum: 200 },
    context: {
      type: "string",
      enum: ["dialog", "form", "main", "header", "navigation", "page"],
    },
    field: { type: "string", minLength: 1, maxLength: 200 },
    value: { type: "string", minLength: 1, maxLength: 4000 },
    entries: { type: "object", additionalProperties: { type: "string" } },
    script: { type: "string", minLength: 1, maxLength: 50000 },
    selector: { type: "string", minLength: 1, maxLength: 500 },
    timeout_ms: { type: "integer", minimum: 100, maximum: 60000 },
    level: { type: "string", enum: ["info", "warn", "error"] },
    bypass_cache: { type: "boolean" },
    route: {
      type: "string",
      minLength: 10,
      maxLength: 200,
      pattern: "^(?:Application|Business|Service|Design)/[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*$",
    },
    source: {
      type: "string",
      enum: ["ga4_service_account", "clarity_domain", "clarity_project_name", "gsc_service_account"],
    },
    foregroundConfirmed: { type: "boolean" },
    ownerConfirmed: { type: "boolean" },
    long: { type: "boolean" },
    duration_ms: { type: "integer", minimum: 100, maximum: 30000 },
    width: { type: "integer", minimum: 1, maximum: 10000 },
    height: { type: "integer", minimum: 1, maximum: 10000 },
    color_scheme: { type: "string", enum: ["dark", "light", "no-preference"] },
    mobile: { type: "boolean" },
    device_scale_factor: { type: "number", minimum: 0.1, maximum: 10 },
    text: { type: "string", minLength: 1, maxLength: 500 },
    condition: { type: "string", enum: ["visible", "hidden", "text", "network_idle", "attached"] },
    position: { type: "string", enum: ["top", "bottom", "page_down", "page_up", "start", "end"] },
    modifiers: { type: "array", items: { type: "string", enum: ["Shift", "Alt", "Control", "Meta"] } },
    storage_type: { type: "string", enum: ["local", "session", "all"] },
    fps: { type: "integer", minimum: 1, maximum: 60 },
    mode: { type: "string", enum: ["start", "stop", "list", "add", "remove", "clear"] },
    categories: { type: "array", items: { type: "string", enum: ["performance", "accessibility", "best_practices", "seo", "pwa"] } },
    device_preset: { type: "string", enum: ["iphone_15_pro", "pixel_8", "ipad_pro", "desktop_4k", "laptop_1080p", "galaxy_s24"] },
    network_throttle: { type: "string", enum: ["offline", "slow_3g", "fast_3g", "4g", "wifi", "custom"] },
    cpu_throttling_rate: { type: "integer", enum: [1, 2, 4, 6] },
    reduced_motion: { type: "string", enum: ["reduce", "no-preference"] },
    geolocation: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        accuracy: { type: "number" },
      },
    },
    timezone_id: { type: "string" },
    locale: { type: "string" },
  },
} as const;

export const BROWSER_INPUT_SCHEMA = CHROME_INPUT_SCHEMA;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export type ChromeSetupReceipt = {
  extensionPath: string;
  extensionId: string;
  nativeManifestPath: string;
  copied: boolean;
};

export type ChromeMcpHandlers = {
  execute: BrowserContextOperation;
  setup: () => ChromeSetupReceipt;
  closeGroup: () => Promise<unknown>;
  sessionName?: string;
  ownerRoute?: string;
  trusted?: () => boolean;
};

const CHROME_TOOL = {
  name: "chrome",
  description:
    "Drive the Owner-installed Chrome profile through the local Native Messaging bridge. Host-agnostic MCP adapter over the Holar chrome operation: open, read sanitized text, inspect semantic controls, click, fill, capture local-only session or screenshot receipts, close this session's tab group. Only financial actions require ownerConfirmed=true; do not ask the Owner to confirm anything else. Never returns Cookie, password or pairing-token values.",
  inputSchema: CHROME_INPUT_SCHEMA,
};

const SETUP_TOOL = {
  name: "chrome_setup",
  description:
    "Install the local Native Messaging host and return the unpacked Chrome Extension path for a one-time Load unpacked step. Does not return the pairing token.",
  inputSchema: { type: "object", additionalProperties: false, properties: {} },
};

export function encodeMessage(message: object): Buffer {
  return Buffer.from(`${JSON.stringify(message)}\n`);
}

export function encodeFramedMessage(message: object): Buffer {
  const json = JSON.stringify(message);
  return Buffer.from(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

export function createMessageReader(onMessage: (value: unknown) => void): (chunk: Buffer) => void {
  let buffer = Buffer.alloc(0);
  return (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      if (buffer[0] === 0x7b) {
        const newline = buffer.indexOf(0x0a);
        if (newline < 0) return;
        const line = buffer.subarray(0, newline).toString("utf8").trim();
        buffer = buffer.subarray(newline + 1);
        if (line.length > 0) onMessage(JSON.parse(line));
        continue;
      }
      const headerEnd = indexOfHeaderEnd(buffer);
      if (headerEnd < 0) return;
      const header = buffer.subarray(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) throw new Error("MCP frame is missing Content-Length");
      const length = Number(match[1]);
      const start = headerEnd + separatorLength(buffer, headerEnd);
      if (buffer.length < start + length) return;
      const body = buffer.subarray(start, start + length).toString("utf8");
      buffer = buffer.subarray(start + length);
      onMessage(JSON.parse(body));
    }
  };
}

function indexOfHeaderEnd(buffer: Buffer): number {
  for (let index = 0; index < buffer.length - 1; index += 1) {
    if (
      index + 3 < buffer.length
      && buffer[index] === 0x0d
      && buffer[index + 1] === 0x0a
      && buffer[index + 2] === 0x0d
      && buffer[index + 3] === 0x0a
    ) {
      return index;
    }
    if (buffer[index] === 0x0a && buffer[index + 1] === 0x0a) return index;
  }
  return -1;
}

function separatorLength(buffer: Buffer, headerEnd: number): number {
  if (
    headerEnd + 3 < buffer.length
    && buffer[headerEnd] === 0x0d
    && buffer[headerEnd + 1] === 0x0a
    && buffer[headerEnd + 2] === 0x0d
    && buffer[headerEnd + 3] === 0x0a
  ) {
    return 4;
  }
  return 2;
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.jsonrpc === "2.0" && typeof candidate.method === "string";
}

function textResult(value: unknown, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(redactBrowserResult(value), null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

function authorityTrusted(): boolean {
  try {
    loadAuthority();
    return true;
  } catch {
    return false;
  }
}

export function createChromeMcpDispatcher(handlers: ChromeMcpHandlers) {
  const trusted = handlers.trusted ?? authorityTrusted;

  return async function dispatch(message: unknown): Promise<JsonRpcResponse | undefined> {
    if (!isJsonRpcRequest(message)) {
      return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } };
    }
    if (message.id === undefined) return undefined;

    if (message.method === "initialize") {
      const params = (message.params ?? {}) as { protocolVersion?: string };
      const requested = params.protocolVersion;
      const protocolVersion = requested && SUPPORTED_PROTOCOL_VERSIONS.has(requested)
        ? requested
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

    if (message.method === "ping") {
      return { jsonrpc: "2.0", id: message.id, result: {} };
    }

    if (message.method === "tools/list") {
      return { jsonrpc: "2.0", id: message.id, result: { tools: [CHROME_TOOL, SETUP_TOOL] } };
    }

    if (message.method === "tools/call") {
      const params = (message.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      try {
        if (params.name === "chrome_setup") {
          return { jsonrpc: "2.0", id: message.id, result: textResult(handlers.setup()) };
        }
        if (params.name !== "chrome") {
          return { jsonrpc: "2.0", id: message.id, result: textResult({ error: "unknown tool" }, true) };
        }
        const input = (params.arguments ?? {}) as BrowserContextInput & { action?: string };
        if (!CHROME_ACTIONS.includes(input.action as (typeof CHROME_ACTIONS)[number])) {
          return { jsonrpc: "2.0", id: message.id, result: textResult({ error: "unknown chrome action" }, true) };
        }
        if ((input.action as string) === "close_group") {
          return { jsonrpc: "2.0", id: message.id, result: textResult(await handlers.closeGroup()) };
        }
        const value = await handlers.execute(
          input,
          undefined,
          { isProjectTrusted: trusted },
          handlers.sessionName,
          handlers.ownerRoute,
        );
        return { jsonrpc: "2.0", id: message.id, result: textResult(value) };
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        return { jsonrpc: "2.0", id: message.id, result: textResult({ error: text }, true) };
      }
    }

    return { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } };
  };
}

export function installChromeSetup(): ChromeSetupReceipt {
  const installed = installBrowserBridge();
  const copied = spawnSync("pbcopy", [], {
    input: installed.extensionPath,
    encoding: "utf8",
    timeout: 5_000,
    maxBuffer: 16_384,
  });
  return {
    extensionPath: installed.extensionPath,
    extensionId: installed.extensionId,
    nativeManifestPath: installed.nativeManifestPath,
    copied: copied.status === 0,
  };
}

export function resolveBrowserSessionName(): string {
  return safeSessionName(
    environmentSessionName() ?? environmentSessionId(),
    `holar-mcp-${process.pid}`,
  );
}

export function createDefaultChromeMcpDispatcher() {
  const client = new BrowserClient();
  return createChromeMcpDispatcher({
    execute: createBrowserContextOperation(),
    setup: installChromeSetup,
    closeGroup: () => client.closeGroup(),
    sessionName: resolveBrowserSessionName(),
    ownerRoute: process.env.HOLAR_BROWSER_WORKSPACE,
  });
}

async function serveStdio(): Promise<void> {
  const dispatch = createDefaultChromeMcpDispatcher();
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
