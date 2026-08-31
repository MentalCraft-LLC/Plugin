import { keyHint, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { spawnSync } from "node:child_process";
import { Type } from "typebox";
import { installBrowserBridge, redactBrowserResult } from "./core.ts";
import { createBrowserContextOperation } from "./operation.ts";
import { HolarStore, defaultHolarStorePath } from "../../.extension/governance/store.ts";
import { resolveWorkspaceRoot } from "../../.extension/governance/runtime.ts";

const routeSchema = Type.String({ minLength: 10, maxLength: 200, pattern: "^Business/[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)+$" });
const urlSchema = Type.String({ minLength: 10, maxLength: 1000, pattern: "^https?://" });
const controlSchema = Type.String({ minLength: 1, maxLength: 120 });
const roleSchema = StringEnum(["button", "link", "menuitem", "option", "tab", "combobox", "textbox", "checkbox", "radio", "switch"] as const);
const contextSchema = StringEnum(["dialog", "form", "main", "header", "navigation", "page"] as const);
const sourceSchema = StringEnum(["ga4_service_account", "clarity_domain", "clarity_project_name", "gsc_service_account"] as const);

const BROWSER_TOOL = "chrome";

function textResult(value: unknown) {
  const safe = redactBrowserResult(value);
  return { content: [{ type: "text" as const, text: JSON.stringify(safe, null, 2) }], details: { result: safe } };
}

function browserHost(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  try { return new URL(raw).hostname; } catch { return undefined; }
}

function browserResultObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function compactBrowserResult(value: unknown): string {
  const result = browserResultObject(value);
  if (!result) return "Browser operation completed";
  const diagnostics = browserResultObject(result.diagnostics);
  const controls = Array.isArray(result.controls) ? result.controls : undefined;
  const parts: string[] = [];
  if (typeof result.status === "string") parts.push(result.status);
  const host = browserHost(result.origin);
  if (host) parts.push(host);
  if (controls) parts.push(`${controls.length} control${controls.length === 1 ? "" : "s"}`);
  const iframeCount = diagnostics?.iframe_count;
  if (typeof iframeCount === "number" && iframeCount > 0) {
    parts.push(`${iframeCount} iframe${iframeCount === 1 ? "" : "s"}`);
  }
  if (typeof result.managed_tab_count === "number") parts.push(`${result.managed_tab_count} managed tabs`);
  if (result.tab_active === false) parts.push("inactive tab");
  if (result.focus_changed === false) parts.push("focus unchanged");
  return parts.length > 0 ? parts.join(" · ") : "Browser operation completed";
}

function requireTrusted(trusted: boolean): void {
  if (!trusted) throw new Error("Browser Context operation requires a trusted project");
}

export default function browserExtension(pi: ExtensionAPI): void {
  const executeBrowserContext = createBrowserContextOperation();
  // Single source of truth: the workspace binding record supplies the
  // governance zone (ownerRoute) for every managed tab-group. Cached at
  // session_start so teardown also closes the exact group.
  let ownerRoute: string | undefined;
  pi.on("session_start", async (_event, ctx) => {
    const store = await HolarStore.open({ databasePath: defaultHolarStorePath() });
    try {
      const id = ctx.sessionManager.getSessionId() ?? "unknown";
      ownerRoute = store.getBinding(id, resolveWorkspaceRoot(ctx.cwd))?.ownerRoute;
    } finally {
      store.close();
    }
  });

  // Canonical name is "chrome" — one tool, one name, no compat aliases
  // (Philosophy: 永不兼容 · 一步到位).
  registerBrowserTool(pi, BROWSER_TOOL, "chrome", executeBrowserContext, () => ownerRoute);

  pi.registerCommand("browser-setup", {
    description: "Install the local Native Messaging bridge and copy the one-time unpacked Chrome Extension path",
    handler: async (_args, ctx) => {
      requireTrusted(ctx.isProjectTrusted());
      const installed = installBrowserBridge();
      const copied = spawnSync("pbcopy", [], { input: installed.extensionPath, encoding: "utf8", timeout: 5_000, maxBuffer: 16_384 });
      if (copied.status !== 0) {
        ctx.ui.notify(`Bridge installed, but the Extension path could not be copied: ${installed.extensionPath}`, "warning");
        return;
      }
      ctx.ui.notify(
        "Native bridge installed and Extension path copied. One time only: in the intended Chrome profile, open chrome://extensions, enable Developer mode, choose Load unpacked, and paste the copied path. The Extension has no popup and future tabs remain inactive.",
        "info",
      );
    },
  });
}

function registerBrowserTool(
  pi: ExtensionAPI,
  name: string,
  displayName: string,
  executeBrowserContext: ReturnType<typeof createBrowserContextOperation>,
  ownerRouteOf: () => string | undefined,
): void {
  pi.registerTool({
    name,
    label: "Browser Context",
    description: "Drive this Session's Chrome tab-group: open, read_text, click, fill. Secrets stay local. Spending money stops closed.",
    promptSnippet: "Universal web information gathering through the Owner Chrome profile",
    promptGuidelines: [
      "chrome uses this Session's tab-group only. Concurrent Sessions keep separate groups. read_text is redacted. No per-step Owner instruction except financial actions.",
      "read_text auto-sweeps virtualized threads and infinite scrollers; pass long=true to force a full document sweep. capture_screenshot long=true stitches a long image. Stay inside this Session's tab-group.",
      "annotate is armed on every page: Option+click selects; Send injects an Owner user message into the watching session and exits design mode. mode=list returns xpath/component/textContent.",
      "Any control that spends money stops with financial_confirmation_required (Owner directive 2026-08-12).",
      "Never put Cookie, session or credential values in parameters, chat, logs or evidence. Use repair when the bridge source drifts.",
    ],
    parameters: Type.Object({
      action: StringEnum([
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
        "read_console",
        "read_network",
        "read_storage",
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
        "capture_pdf",
        "semantic_snapshot",
        "annotate",
        "emulate",
      ] as const),
      url: Type.Optional(urlSchema),
      role: Type.Optional(roleSchema),
      name: Type.Optional(controlSchema),
      screen_x: Type.Optional(Type.Integer({ minimum: 1, maximum: 100000 })),
      screen_y: Type.Optional(Type.Integer({ minimum: 1, maximum: 100000 })),
      client_x: Type.Optional(Type.Integer({ minimum: 1, maximum: 100000 })),
      client_y: Type.Optional(Type.Integer({ minimum: 1, maximum: 100000 })),
      delta_x: Type.Optional(Type.Integer({ minimum: -100000, maximum: 100000 })),
      delta_y: Type.Optional(Type.Integer({ minimum: -100000, maximum: 100000 })),
      key: Type.Optional(StringEnum(["Tab", "Enter", "Escape", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"] as const)),
      max_chars: Type.Optional(Type.Integer({ minimum: 1, maximum: 100000 })),
      max_elements: Type.Optional(Type.Integer({ minimum: 1, maximum: 200, description: "Semantic-snapshot element budget (default 60)" })),
      context: Type.Optional(contextSchema),
      field: Type.Optional(controlSchema),
      value: Type.Optional(Type.String({ minLength: 1, maxLength: 4000 })),
      entries: Type.Optional(Type.Record(Type.String(), Type.String())),
      script: Type.Optional(Type.String({ minLength: 1, maxLength: 50000 })),
      selector: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
      timeout_ms: Type.Optional(Type.Integer({ minimum: 100, maximum: 60000 })),
      level: Type.Optional(StringEnum(["info", "warn", "error"] as const)),
      bypass_cache: Type.Optional(Type.Boolean()),
      route: Type.Optional(routeSchema),
      source: Type.Optional(sourceSchema),
      foregroundConfirmed: Type.Optional(Type.Boolean()),
      ownerConfirmed: Type.Optional(Type.Boolean()),
      long: Type.Optional(Type.Boolean()),
      width: Type.Optional(Type.Integer({ minimum: 1, maximum: 10000 })),
      height: Type.Optional(Type.Integer({ minimum: 1, maximum: 10000 })),
      color_scheme: Type.Optional(StringEnum(["dark", "light", "no-preference"] as const)),
      mobile: Type.Optional(Type.Boolean()),
      device_scale_factor: Type.Optional(Type.Number({ minimum: 0.1, maximum: 10 })),
      text: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
      condition: Type.Optional(StringEnum(["visible", "hidden", "text", "network_idle", "attached"] as const)),
      position: Type.Optional(StringEnum(["top", "bottom", "page_down", "page_up", "start", "end"] as const)),
      modifiers: Type.Optional(Type.Array(StringEnum(["Shift", "Alt", "Control", "Meta"] as const))),
      mode: Type.Optional(StringEnum(["start", "stop", "list", "add", "remove", "clear"] as const)),
    }, { additionalProperties: false }),
    executionMode: "sequential",
    renderCall(args, theme) {
      const host = browserHost(args.url);
      let text = theme.fg("toolTitle", theme.bold(`${displayName} `));
      text += theme.fg("muted", String(args.action ?? "operation"));
      if (host) text += ` ${theme.fg("dim", host)}`;
      return new Text(text, 0, 0);
    },
    renderResult(result, { expanded, isPartial }, theme, context) {
      if (isPartial) return new Text(theme.fg("warning", "Working…"), 0, 0);
      const details = browserResultObject(result.details);
      const value = details?.result;
      if (expanded) {
        return new Text(theme.fg("toolOutput", JSON.stringify(value ?? {}, null, 2)), 0, 0);
      }
      const status = context.isError ? theme.fg("error", "✗") : theme.fg("success", "✓");
      const hint = keyHint("app.tools.expand", "to expand");
      return new Text(`${status} ${theme.fg("muted", compactBrowserResult(value))} ${theme.fg("dim", `(${hint})`)}`, 0, 0);
    },
    async execute(_id, params, signal, _onUpdate, ctx) {
      return textResult(await executeBrowserContext(params, signal, ctx, pi.getSessionName(), ownerRouteOf()));
    },
  });
}
