import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createConnection } from "node:net";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALLOWED_ORIGINS,
  DEFAULT_TARGET_POLICY,
  capabilityAllowed,
  safeForegroundUrl,
  safeTargetUrl,
  type BrowserCapability,
  type TargetPolicy,
} from "./modules/policy.ts";
import { redactBrowserString } from "./modules/redaction.mjs";

export { ALLOWED_ORIGINS, DEFAULT_TARGET_POLICY, capabilityAllowed, safeForegroundUrl, safeTargetUrl } from "./modules/policy.ts";
export type { BrowserCapability, TargetPolicy } from "./modules/policy.ts";
export { GENERIC_ADAPTER, registerSiteAdapter, resolveSiteAdapter } from "./modules/adapters.ts";
export type { SiteAdapter } from "./modules/adapters.ts";
export * from "./modules/devtools.ts";
export * from "./modules/intelligence.ts";
export * from "./modules/resilience.ts";
export * from "./modules/network_mock.ts";
export * from "./modules/web_vitals_radar.ts";
export * from "./modules/stealth.ts";
export * from "./modules/saliency.ts";
export * from "./modules/e2e_codegen.ts";
export * from "./modules/memory_tracer.ts";
export * from "./modules/responsive_matrix.ts";
export * from "./modules/security_sandbox.ts";
export * from "./modules/dom_race.ts";
export * from "./modules/lighthouse_budget.ts";

export const PROTOCOL = "spiral.browser.v1";
export const NATIVE_HOST = "com.onespiral.browser";
export const LOCAL_DIR = resolve(homedir(), ".config/holar/browser");
export const SOCKET_PATH = resolve(LOCAL_DIR, "control.sock");
export const PAIRING_TOKEN_PATH = resolve(LOCAL_DIR, "pairing-token");
export const MAX_BROWSER_RESPONSE_CHARS = 1_048_576;

const EXTENSION_ROOT = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(EXTENSION_ROOT, "../..");
const AUTHORITY_PATH = resolve(EXTENSION_ROOT, "authority.json");
const MANIFEST_PATH = resolve(EXTENSION_ROOT, "extension/manifest.json");
const HOST_PATH = resolve(EXTENSION_ROOT, "host.mjs");
const ROUTE = /^(?:Application|Business|Service|Design)\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const TOKEN = /\b(?:ya29\.[A-Za-z0-9._~-]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g;
const SENSITIVE_KEY = /^(?:secret|token|password|credential|cookies?|session|authorization|private[_-]?key|access[_-]?token|refresh[_-]?token|value)$/i;

export type BrowserAuthority = {
  schema: "spiral.browser-authority.v1";
  status: "active";
  scope: Record<string, boolean>;
  origins: string[];
  targets: Array<{ route: string; analytics_authority: string }>;
  guards: string[];
  decision: string;
};

export type BrowserInstall = {
  extensionId: string;
  extensionPath: string;
  nativeManifestPath: string;
  socketPath: string;
  pairingTokenCreated: boolean;
};

export type BrowserCommand = {
  protocol: typeof PROTOCOL;
  action: "status" | "repair" | "close_group" | "open" | "controls" | "read_text" | "read_markdown" | "read_styles" | "read_scripts" | "disassemble" | "read_console" | "read_network" | "read_storage" | "set_storage" | "clear_storage" | "read_cookies" | "clear_cookies" | "performance_metrics" | "wait_for" | "inspect_element" | "evaluate_script" | "reload_page" | "hot_reload" | "click" | "hover" | "scroll" | "press_key" | "drag_and_drop" | "upload_file" | "fill" | "fill_form" | "fill_local" | "press_enter" | "select_combobox" | "cdp_click" | "cdp_scroll" | "cdp_hover" | "cdp_key" | "activate" | "restore_background" | "terms_diagnostics" | "accept_standard_terms" | "accept_owner_authorized_terms" | "select_ga4_target" | "select_ga4_objective" | "open_clarity_project" | "open_clarity_settings" | "clarity_project_identity" | "capture_clarity_project_id" | "capture_clarity_token" | "capture_ga4_measurement_id" | "capture_screenshot" | "capture_pdf" | "capture_session" | "semantic_snapshot" | "annotate" | "emulate" | "lighthouse_audit" | "performance_trace" | "heap_analysis" | "network_waterfall" | "security_audit" | "emulate_profile" | "accessibility_tree" | "smart_selector_heal" | "visual_regression_diff" | "journey_record_and_replay" | "session_isolation_vault" | "inp_interaction_vitals" | "persona_emulation" | "extract_structured_data" | "chaos_resilience_test" | "batch_tab_orchestration" | "network_mock_interceptor" | "har_replay_mock" | "web_vitals_radar" | "stealth_profile_guard" | "attention_heatmap_predict" | "e2e_spec_generator" | "memory_leak_tracer" | "responsive_matrix_linter" | "security_sandbox_audit" | "dom_race_profiler" | "lighthouse_ci_budget";
  long?: boolean;
  max_sections?: number;
  mode?: "start" | "stop" | "list" | "add" | "remove" | "clear";
  screen_x?: number;
  screen_y?: number;
  client_x?: number;
  client_y?: number;
  delta_x?: number;
  delta_y?: number;
  key?: string;
  allow_active?: boolean;
  url?: string;
  max_elements?: number;
  foreground_confirmed?: boolean;
  navigate?: boolean;
  owner_confirmed?: boolean;
  owner_terms_delegated?: boolean;
  provider?: "ga4" | "clarity";
  target_name?: string;
  objective_name?: string;
  project_name?: string;
  stream_name?: string;
  domain?: string;
  identity_verified?: boolean;
  max_chars?: number;
  read_mode?: "advisor_reply";
  role?: string;
  name?: string;
  context?: "dialog" | "form" | "main" | "header" | "navigation" | "page";
  field?: string;
  value?: string;
  entries?: Record<string, string>;
  script?: string;
  selector?: string;
  timeout_ms?: number;
  level?: "info" | "warn" | "error";
  bypass_cache?: boolean;
  multiline_public?: boolean;
  route?: string;
  source?: "ga4_service_account" | "clarity_domain" | "clarity_project_name" | "gsc_service_account";
  width?: number;
  height?: number;
  color_scheme?: "dark" | "light";
  mobile?: boolean;
  device_scale_factor?: number;
  text?: string;
  condition?: string;
  position?: "top" | "bottom" | "page_down" | "page_up" | "start" | "end";
  modifiers?: ("Shift" | "Alt" | "Control" | "Meta")[];
  source_selector?: string;
  target_selector?: string;
  from_x?: number;
  from_y?: number;
  to_x?: number;
  to_y?: number;
  file_name?: string;
  file_content?: string;
  file_type?: string;
  base64?: string;
  files?: Array<{ name: string; type?: string; content?: string; base64?: string }>;
  storage_type?: "local" | "session" | "all";
};

export function loadAuthority(path = AUTHORITY_PATH): BrowserAuthority {
  const authority = JSON.parse(readFileSync(path, "utf8")) as BrowserAuthority;
  if (
    authority.schema !== "spiral.browser-authority.v1"
    || authority.status !== "active"
    || authority.scope.persistent_across_sessions !== true
    || authority.scope.existing_chrome_profile !== true
    || authority.scope.background_tabs !== true
    || authority.scope.managed_tab_group !== true
    || authority.scope.session_named_tab_group !== true
    || authority.scope.local_secret_capture !== true
    || authority.scope.self_repair !== true
    || authority.scope.broad_http_https !== true
    || authority.scope.cookie_read_or_export !== true
    || authority.scope.cookie_local_handling !== true
    || authority.scope.password_read_or_export !== false
    || authority.scope.remote_debugging !== false
    || authority.scope.focus_steal !== false
    || authority.scope.popup_ui !== false
    || authority.scope.per_session_confirmation !== false
    || JSON.stringify(authority.origins) !== JSON.stringify(ALLOWED_ORIGINS)
    || !Array.isArray(authority.targets)
    || authority.targets.length === 0
    || authority.targets.some((target) => !ROUTE.test(target.route))
  ) throw new Error("Browser Context standing authority is absent or invalid");
  return authority;
}

export function authorityRoute(authority: BrowserAuthority, route: string): string {
  if (authority.targets.filter((target) => target.route === route).length !== 1) {
    throw new Error("Browser route is outside standing authority");
  }
  return route;
}

export function extensionIdFromKey(key: string): string {
  let der: Buffer;
  try { der = Buffer.from(key, "base64"); } catch { throw new Error("Chrome Extension key is invalid"); }
  if (der.length < 128) throw new Error("Chrome Extension key is invalid");
  const digest = createHash("sha256").update(der).digest().subarray(0, 16);
  let id = "";
  for (const byte of digest) id += String.fromCharCode(97 + (byte >> 4), 97 + (byte & 15));
  return id;
}

export function extensionIdentity(manifestPath = MANIFEST_PATH): { id: string; manifest: Record<string, any> } {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const id = extensionIdFromKey(String(manifest.key ?? ""));
  const action = manifest.action;
  const foregroundAction = action === undefined || (
    action
    && typeof action === "object"
    && action.default_title === "Grant foreground screenshot"
    && !action.default_popup
    && Object.keys(action).every((key) => key === "default_title")
  );
  if (
    manifest.manifest_version !== 3
    || !foregroundAction
    || JSON.stringify(manifest.permissions) !== JSON.stringify(["nativeMessaging", "storage", "activeTab", "cookies", "tabs", "tabGroups", "debugger", "scripting"])
    || JSON.stringify(manifest.host_permissions) !== JSON.stringify(["http://*/*", "https://*/*"])
    || JSON.stringify(manifest.content_scripts?.[0]?.matches) !== JSON.stringify(["http://*/*", "https://*/*"])
    || manifest.content_scripts?.[0]?.all_frames !== true
    || manifest.permissions?.includes("history")
  ) throw new Error("Chrome Extension manifest violates the universal browser boundary");
  return { id, manifest };
}

function privateMode(path: string, maxBytes = 16_000): boolean {
  try {
    const stat = lstatSync(path);
    return stat.isFile() && !stat.isSymbolicLink() && stat.size <= maxBytes && (stat.mode & 0o077) === 0;
  } catch {
    return false;
  }
}

function atomicWrite(path: string, content: string, mode: number): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.tmp-${process.pid}-${randomBytes(8).toString("hex")}`;
  try {
    writeFileSync(temporary, content, { mode, flag: "wx" });
    chmodSync(temporary, mode);
    renameSync(temporary, path);
    chmodSync(path, mode);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function installBrowserBridge(options: {
  home?: string;
  workspace?: string;
  nodePath?: string;
  extensionRoot?: string;
  token?: string;
} = {}): BrowserInstall {
  const home = resolve(options.home ?? homedir());
  const workspace = resolve(options.workspace ?? WORKSPACE_ROOT);
  const extensionRoot = resolve(options.extensionRoot ?? EXTENSION_ROOT);
  const local = resolve(home, ".config/holar/browser");
  const tokenPath = resolve(local, "pairing-token");
  const wrapperPath = resolve(local, "native-host");
  const socketPath = resolve(local, "control.sock");
  const nativeManifestPath = resolve(home, "Library/Application Support/Google/Chrome/NativeMessagingHosts/com.onespiral.browser.json");
  const manifestPath = resolve(extensionRoot, "extension/manifest.json");
  const hostPath = resolve(extensionRoot, "host.mjs");
  const identity = extensionIdentity(manifestPath);
  let pairingTokenCreated = false;
  if (!existsSync(tokenPath)) {
    const token = options.token ?? randomBytes(32).toString("hex");
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Browser pairing token is invalid");
    atomicWrite(tokenPath, `${token}\n`, 0o600);
    pairingTokenCreated = true;
  } else {
    if (!privateMode(tokenPath)) throw new Error("Browser pairing token is invalid");
    const token = readFileSync(tokenPath, "utf8").trim();
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Browser pairing token is invalid");
  }
  const wrapper = [
    "#!/bin/sh",
    `export HOLAR_BROWSER_WORKSPACE=${shellQuote(workspace)}`,
    `exec ${shellQuote(options.nodePath ?? process.execPath)} ${shellQuote(hostPath)}`,
    "",
  ].join("\n");
  atomicWrite(wrapperPath, wrapper, 0o700);
  const nativeManifest = {
    name: NATIVE_HOST,
    description: "Holar bounded Browser Context bridge",
    path: wrapperPath,
    type: "stdio",
    allowed_origins: [`chrome-extension://${identity.id}/`],
  };
  atomicWrite(nativeManifestPath, `${JSON.stringify(nativeManifest, null, 2)}\n`, 0o600);
  return {
    extensionId: identity.id,
    extensionPath: resolve(extensionRoot, "extension"),
    nativeManifestPath,
    socketPath,
    pairingTokenCreated,
  };
}

export function readPairingToken(path = PAIRING_TOKEN_PATH): string {
  if (!privateMode(path)) throw new Error("Browser pairing token file is unsafe");
  const token = readFileSync(path, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Browser pairing token is invalid");
  return token;
}

export function safeBrowserUrl(raw: string, policy: TargetPolicy = DEFAULT_TARGET_POLICY): string {
  return safeTargetUrl(raw, policy);
}

export function safeControlName(raw: string): string {
  const value = String(raw ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  if (!value || value.length > 120 || EMAIL.test(value) || TOKEN.test(value)) {
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    throw new Error("Browser control name is invalid");
  }
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  return value;
}

export function safePublicValue(raw: string): string {
  const value = String(raw ?? "").trim();
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  if (!value || value.length > 200 || /[\r\n]/.test(value) || EMAIL.test(value) || TOKEN.test(value)) {
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    throw new Error("Browser public form value is invalid");
  }
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  return value;
}

/** Internal multiline public text; never exposed by the chrome Tool ABI. */
export function safePublicMultiline(raw: string): string {
  const value = String(raw ?? "").trim();
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  if (
    !value
    || value.length > 8000
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    || EMAIL.test(value)
    || TOKEN.test(value)
  ) {
    EMAIL.lastIndex = 0;
    TOKEN.lastIndex = 0;
    throw new Error("Browser multiline public text is invalid");
  }
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  return value;
}

export function safeSessionId(raw: unknown, sessionName?: string): string {
  const value = String(raw ?? "").trim();
  if (/^[a-z0-9][a-z0-9_-]{7,79}$/i.test(value)) {
    return value;
  }
  if (sessionName && typeof sessionName === "string" && sessionName.trim()) {
    const slug = sessionName.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (slug.length >= 8 && slug.length <= 79) {
      return slug;
    }
    const hash = createHash("sha256").update(sessionName.trim()).digest("hex").slice(0, 16);
    const candidate = slug ? `${slug.slice(0, 20)}-${hash}` : `session-${hash}`;
    return candidate.slice(0, 79);
  }
  return "holar-default";
}

export function environmentSessionId(): string | undefined {
  return process.env.HOLAR_SESSION_ID
    || process.env.SESSION_ID
    || process.env.HOLAR_BROWSER_SESSION
    || undefined;
}

export function environmentSessionName(): string | undefined {
  return process.env.HOLAR_SESSION_NAME
    || undefined;
}

export function safeWorkspaceName(raw: unknown): string {
  const value = String(raw ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  const segments = value.split(/[\\/]+/).filter(Boolean);
  const base = segments.at(-1) ?? "holar";
  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .slice(0, 200);
}

/** Preserve an exact governance Owner route; fall back only for legacy paths. */
export function safeOwnerRoute(raw: unknown): string {
  const value = String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (value === "." || /^[A-Za-z][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)*$/.test(value)) {
    return value.slice(0, 200);
  }
  return safeWorkspaceName(value);
}

export function safeSessionName(raw: unknown, fallbackSeed = "Holar Session"): string {
  const normalized = String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  const redacted = normalized.replace(EMAIL, "[identity]").replace(TOKEN, "[secret]").trim();
  EMAIL.lastIndex = 0;
  TOKEN.lastIndex = 0;
  if (redacted) return redacted.slice(0, 80);
  // Unique fallback instead of a shared "Holar Session": every Session must
  // have a distinct tab-group name (session-name = tab-group-name). A shared
  // fallback would merge unrelated Sessions into one visible group when a
  // Session runs an older tool surface that does not pass its real name.
  return fallbackSeed.slice(0, 80);
}

export function redactBrowserResult(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 200).map(redactBrowserResult);
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? redactBrowserString(value, 500) : value;
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : key === "text" && typeof item === "string"
        ? redactBrowserString(item, 100000)
        : redactBrowserResult(item),
  ]));
}

export class BrowserClient {
  constructor(
    private readonly socketPath = SOCKET_PATH,
    private readonly tokenPath = PAIRING_TOKEN_PATH,
    private readonly timeoutMs = 120_000,
  ) {}

  available(): boolean {
    return existsSync(this.socketPath) && existsSync(this.tokenPath);
  }

  /** Close this Session's managed tab-group: every managed tab + group storage. (tab-group-name === session-name) */
  closeGroup(signal?: AbortSignal, sessionName?: string, ownerRoute?: string): Promise<unknown> {
    return this.request({ protocol: PROTOCOL, action: "close_group" }, signal, sessionName, ownerRoute);
  }

  request(command: BrowserCommand, signal?: AbortSignal, sessionName?: string, ownerRoute?: string): Promise<unknown> {
    if (signal?.aborted) return Promise.reject(new Error("Background browser request cancelled"));
    const auth = readPairingToken(this.tokenPath);
    const id = randomBytes(16).toString("hex");
    const effectiveSessionName = safeSessionName(
      sessionName ?? environmentSessionName() ?? environmentSessionId(),
      "Holar Session",
    );
    const sessionId = safeSessionId(environmentSessionId(), sessionName ?? effectiveSessionName);
    const session = {
      id: sessionId,
      name: effectiveSessionName,
      // Single source of truth: the workspace binding record supplies the
      // governance zone (ownerRoute). Consumers never derive their own name
      // from paths or environment variables.
      workspace: safeOwnerRoute(ownerRoute ?? process.env.HOLAR_BROWSER_WORKSPACE ?? process.cwd()),
    };
    return new Promise((resolvePromise, rejectPromise) => {
      const socket = createConnection(this.socketPath);
      let settled = false;
      let response = "";
      let responseBytes = 0;
      const finish = (error?: Error, value?: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        socket.destroy();
        if (error) rejectPromise(error);
        else resolvePromise(redactBrowserResult(value));
      };
      const abort = () => finish(new Error("Background browser request cancelled"));
      const timer = setTimeout(() => finish(new Error("Background browser request timed out")), this.timeoutMs);
      signal?.addEventListener("abort", abort, { once: true });
      socket.setEncoding("utf8");
      socket.on("connect", () => {
        socket.write(`${JSON.stringify({ protocol: PROTOCOL, auth, id, command: { ...command, session } })}\n`);
      });
      socket.on("data", (chunk) => {
        responseBytes += Buffer.byteLength(chunk, "utf8");
        if (responseBytes > MAX_BROWSER_RESPONSE_CHARS) {
          finish(new Error("Background browser response exceeded the bounded limit"));
          return;
        }
        response += chunk;
      });
      socket.on("end", () => {
        if (settled) return;
        let parsed: any;
        try { parsed = JSON.parse(response.trim()); } catch { finish(new Error("Background browser returned an invalid response")); return; }
        if (!parsed.ok) finish(new Error(`Background browser failed: ${redactBrowserString(String(parsed.error ?? "unknown"), 200)}`));
        else finish(undefined, parsed.result);
      });
      socket.on("error", () => finish(new Error("Background browser bridge is unavailable")));
      socket.on("close", () => {
        if (!settled) finish(new Error("Background browser bridge closed before returning a response"));
      });
    });
  }
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
  else if (result.action === "inspect_element" && result.found) {
    parts.push(String(result.tag || "element"));
    if (result.name) parts.push(`"${result.name}"`);
  } else if (result.action === "evaluate_script") {
    parts.push(result.success ? "evaluated" : "error");
  }
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

export const formatBrowserSummary = compactBrowserResult;

