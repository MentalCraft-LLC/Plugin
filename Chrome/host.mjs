#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { appendFileSync, chmodSync, existsSync, lstatSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { clarityLocalTarget, storeClarityProject, storeClarityToken, storeGa4MeasurementId } from "./secret.mjs";
import { storeScreenshot } from "./screenshot.mjs";
import { storeSession } from "./session.mjs";
import { redactBrowserString } from "./modules/redaction.mjs";

const PROTOCOL = "spiral.browser.v1";
const MAX_MESSAGE = 1_048_576;
const HOST_DIR = dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = resolve(homedir(), ".config/holar/browser");
const SOCKET_PATH = resolve(LOCAL_DIR, "control.sock");
const TOKEN_PATH = resolve(LOCAL_DIR, "pairing-token");
const ANALYTICS_CONFIG = resolve(homedir(), ".config/holar/analytics/config.json");
const GSC_CONFIG = resolve(homedir(), ".pi/agent/gsc/config.json");
const WORKSPACE = resolve(process.env.HOLAR_BROWSER_WORKSPACE || process.cwd());
const ANALYTICS_AUTHORITY = resolve(WORKSPACE, ".governance/contract/analytics.json");
const SENSITIVE_KEY = /^(?:secret|token|password|credential|private[_-]?key|cookies?|session|authorization|value|access[_-]?token|refresh[_-]?token)$/i;

function readPrivate(path) {
  let stat;
  try { stat = lstatSync(path); } catch { throw new Error("private_file_invalid"); }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16_000 || (stat.mode & 0o077) !== 0) throw new Error("private_file_invalid");
  return readFileSync(path, "utf8").trim();
}

function readJson(path, privateFile) {
  let stat;
  try { stat = lstatSync(path); } catch { throw new Error("local_file_invalid"); }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1_000_000 || (privateFile && (stat.mode & 0o077) !== 0)) {
    throw new Error("local_file_invalid");
  }
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { throw new Error("local_file_invalid"); }
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function sanitize(value) {
  if (Array.isArray(value)) return value.slice(0, 200).map(sanitize);
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? redactBrowserString(value, 500) : value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : key === "text" && typeof item === "string"
        ? redactBrowserString(item, 100000)
        : sanitize(item),
  ]));
}

function managedSession(value) {
  if (!value || typeof value !== "object") throw new Error("session_invalid");
  const id = String(value.id ?? "").trim();
  const name = String(value.name ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  const workspace = String(value.workspace ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!/^[a-z0-9][a-z0-9_-]{7,79}$/i.test(id) || !name || name.length > 80) {
    throw new Error("session_invalid");
  }
  if (!workspace || workspace.length > 200) throw new Error("session_workspace_invalid");
  return { id, name, workspace };
}

function localValue(command) {
  const route = String(command.route ?? "");
  if (!/^Business\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)+$/.test(route)) throw new Error("route_not_authorized");
  const local = readJson(ANALYTICS_CONFIG, true);
  const authority = readJson(ANALYTICS_AUTHORITY, false);
  if (local.schema !== "spiral.analytics.local.v1" || authority.provider !== "analytics" || authority.status !== "active") {
    throw new Error("route_not_authorized");
  }
  const target = Array.isArray(authority.targets) ? authority.targets.filter((item) => item.route === route) : [];
  if (target.length !== 1) throw new Error("route_not_authorized");
  if (command.source === "ga4_service_account") {
    const value = local.targets?.[route]?.google?.serviceAccount;
    if (!/^[a-z][a-z0-9-]+@[a-z][a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(value ?? "")) throw new Error("local_value_unavailable");
    return value;
  }
  if (command.source === "gsc_service_account") {
    const gsc = readJson(GSC_CONFIG, true);
    const keyPath = String(gsc.keyPath ?? "");
    if (!keyPath) throw new Error("local_value_unavailable");
    const key = readJson(keyPath, true);
    const value = key?.client_email;
    if (!/^[a-z][a-z0-9-]+@[a-z][a-z0-9-]+(?:\.iam)?\.gserviceaccount\.com$/.test(value ?? "")) throw new Error("local_value_unavailable");
    return value;
  }
  if (command.source === "clarity_domain") {
    const value = String(target[0].clarity_domain ?? "");
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) throw new Error("local_value_unavailable");
    return value;
  }
  if (command.source === "clarity_project_name") {
    const value = String(target[0].ga4_display_name ?? "");
    if (!value || value.length > 100 || /[\r\n\0]/.test(value)) throw new Error("local_value_unavailable");
    return value;
  }
  throw new Error("local_value_source_invalid");
}

function prepareCommand(command) {
  if (!command || command.protocol !== PROTOCOL) throw new Error("protocol_invalid");
  const session = managedSession(command.session);
  if (command.action === "capture_clarity_project_id") {
    if (!String(command.route ?? "")) throw new Error("clarity_capture_route_invalid");
    let url;
    try { url = new URL(String(command.url)); } catch { throw new Error("clarity_capture_url_invalid"); }
    if (url.origin !== "https://clarity.microsoft.com" || url.username || url.password) {
      throw new Error("clarity_capture_url_invalid");
    }
    return {
      protocol: PROTOCOL,
      action: "capture_clarity_project_id",
      url: url.toString(),
      route: String(command.route ?? ""),
      project_name: String(command.project_name ?? ""),
      domain: String(command.domain ?? ""),
      identity_verified: command.identity_verified === true,
      session,
    };
  }
  if (command.action === "capture_ga4_measurement_id") {
    if (!String(command.route ?? "")) throw new Error("ga4_capture_route_invalid");
    let url;
    try { url = new URL(String(command.url)); } catch { throw new Error("ga4_capture_url_invalid"); }
    if (url.origin !== "https://analytics.google.com" || url.username || url.password) {
      throw new Error("ga4_capture_url_invalid");
    }
    return {
      protocol: PROTOCOL,
      action: "capture_ga4_measurement_id",
      url: url.toString(),
      route: String(command.route ?? ""),
      stream_name: String(command.stream_name ?? ""),
      domain: String(command.domain ?? ""),
      identity_verified: command.identity_verified === true,
      session,
    };
  }
  if (command.action === "capture_clarity_token") {
    clarityLocalTarget(String(command.route ?? ""), ANALYTICS_AUTHORITY, ANALYTICS_CONFIG);
    let url;
    try { url = new URL(String(command.url)); } catch { throw new Error("clarity_capture_url_invalid"); }
    if (url.origin !== "https://clarity.microsoft.com" || url.username || url.password) {
      throw new Error("clarity_capture_url_invalid");
    }
    return { protocol: PROTOCOL, action: "capture_clarity_token", url: url.toString(), session };
  }
  if (command.action === "read_text") {
    if (!Number.isInteger(command.max_chars) || command.max_chars < 1 || command.max_chars > 100000) {
      throw new Error("max_chars must be an integer from 1 to 100000");
    }
    return { ...command, session };
  }
  if (command.action === "read_styles" || command.action === "disassemble") {
    return { ...command, session };
  }
  if (command.action !== "fill_local") return { ...command, session };
  return {
    protocol: PROTOCOL,
    action: "fill",
    url: command.url,
    field: command.field,
    context: command.context,
    value: localValue(command),
    owner_confirmed: command.owner_confirmed === true,
    session,
  };
}

function nativeWrite(value) {
  const body = Buffer.from(JSON.stringify(value));
  if (body.length > MAX_MESSAGE) throw new Error("native_message_too_large");
  const header = Buffer.allocUnsafe(4);
  header.writeUInt32LE(body.length, 0);
  process.stdout.write(header);
  process.stdout.write(body);
}

let nativeBuffer = Buffer.alloc(0);
let extensionReady = false;
const pending = new Map();

function bunBinary() {
  const candidates = [
    process.env.BUN_INSTALL ? resolve(process.env.BUN_INSTALL, "bin/bun") : "",
    resolve(homedir(), ".bun/bin/bun"),
    "/opt/homebrew/bin/bun",
    "/usr/local/bin/bun",
  ].filter(Boolean);
  return candidates.find((path) => existsSync(path)) || "bun";
}

function copyClipboard(text) {
  try {
    spawnSync("pbcopy", {
      input: text,
      encoding: "utf8",
      timeout: 2_000,
      maxBuffer: 16_384,
    });
  } catch {}
}

function writeInbox(payload) {
  const snapshot = resolve(LOCAL_DIR, "last-annotation.json");
  const queue = resolve(LOCAL_DIR, "annotation-inbox.jsonl");
  const temporary = `${snapshot}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(payload)}\n`, { mode: 0o600 });
  chmodSync(temporary, 0o600);
  renameSync(temporary, snapshot);
  chmodSync(snapshot, 0o600);
  appendFileSync(queue, `${JSON.stringify(payload)}\n`, { mode: 0o600 });
  chmodSync(queue, 0o600);
}

function handleOwnerSubmit(value) {
  const id = typeof value.id === "string" ? value.id : "";
  const message = String(value.message ?? "").trim().slice(0, 2_000);
  const target = String(value.target ?? "").trim().slice(0, 80);
  const url = String(value.url ?? "").trim().slice(0, 300);
  if (!id || !message) {
    nativeWrite({ kind: "owner_submit_result", id, ok: false, error: "message_empty" });
    return;
  }
  copyClipboard(message);
  let queued = false;
  try {
    writeInbox({
      protocol: PROTOCOL,
      kind: "annotation",
      at: new Date().toISOString(),
      url,
      target,
      message,
    });
    queued = true;
  } catch {}
  const ran = spawnSync(bunBinary(), [resolve(HOST_DIR, "owner-message.mjs")], {
    input: JSON.stringify({ workspace: WORKSPACE, target, message }),
    encoding: "utf8",
    timeout: 8_000,
    maxBuffer: 16_384,
    env: { ...process.env, HOLAR_BROWSER_WORKSPACE: WORKSPACE },
  });
  let routed = false;
  try {
    const parsed = JSON.parse(String(ran.stdout || "").trim() || "{}");
    routed = parsed.ok === true;
  } catch {}
  nativeWrite({
    kind: "owner_submit_result",
    id,
    ok: queued || routed,
    result: {
      copied: true,
      delivered: queued || routed,
      queued,
      routed,
      status: queued || routed ? "delivered" : "copied",
    },
  });
}

function handleNative(value) {
  if (value?.kind === "ready" && value.protocol === PROTOCOL) {
    extensionReady = true;
    return;
  }
  if (value?.kind === "owner_submit") {
    handleOwnerSubmit(value);
    return;
  }
  if (value?.kind !== "response" || typeof value.id !== "string") return;
  const request = pending.get(value.id);
  if (!request) return;
  pending.delete(value.id);
  clearTimeout(request.timer);
  let response;
  if (value.ok && request.command?.action === "capture_clarity_project_id") {
    try {
      response = {
        ok: true,
        result: storeClarityProject(
          request.command.route,
          value.result?.secret,
          ANALYTICS_AUTHORITY,
          ANALYTICS_CONFIG,
        ),
      };
    } catch (error) {
      response = { ok: false, error: error instanceof Error ? error.message : "clarity_project_capture_failed" };
    }
  } else if (value.ok && request.command?.action === "capture_clarity_token") {
    try {
      response = {
        ok: true,
        result: storeClarityToken(
          request.command.route,
          value.result?.secret,
          ANALYTICS_AUTHORITY,
          ANALYTICS_CONFIG,
        ),
      };
    } catch (error) {
      response = { ok: false, error: error instanceof Error ? error.message : "clarity_capture_failed" };
    }
  } else if (value.ok && request.command?.action === "capture_ga4_measurement_id") {
    try {
      response = {
        ok: true,
        result: storeGa4MeasurementId(
          request.command.route,
          value.result?.secret,
          ANALYTICS_AUTHORITY,
          ANALYTICS_CONFIG,
        ),
      };
    } catch (error) {
      response = { ok: false, error: error instanceof Error ? error.message : "ga4_measurement_capture_failed" };
    }
  } else if (value.ok && request.command?.action === "capture_screenshot") {
    try {
      const receipt = storeScreenshot(value.result?.data_url);
      const boundedNumber = (input, maximum) => Number.isSafeInteger(input) && input >= 0 && input <= maximum ? input : undefined;
      response = {
        ok: true,
        result: {
          ...receipt,
          capture_mode: value.result?.capture_mode === "full_page" ? "full_page" : "viewport",
          document_height: boundedNumber(value.result?.document_height, 2_000_000),
          captured_height: boundedNumber(value.result?.captured_height, 24_000),
          output_width: boundedNumber(value.result?.output_width, 1_600),
          output_height: boundedNumber(value.result?.output_height, 30_000),
          tile_count: boundedNumber(value.result?.tile_count, 32),
          truncated: value.result?.truncated === true,
        },
      };
    } catch (error) {
      response = { ok: false, error: error instanceof Error ? error.message : "screenshot_store_failed" };
    }
  } else if (value.ok && request.command?.action === "capture_session") {
    try {
      response = { ok: true, result: storeSession(request.command.url, value.result?.cookies) };
    } catch (error) {
      response = { ok: false, error: error instanceof Error ? error.message : "session_store_failed" };
    }
  } else {
    response = value.ok
      ? { ok: true, result: sanitize(value.result) }
      : { ok: false, error: sanitize(String(value.error ?? "browser_failure")) };
  }
  request.socket.end(`${JSON.stringify(response)}\n`);
}

process.stdin.on("data", (chunk) => {
  nativeBuffer = Buffer.concat([nativeBuffer, chunk]);
  while (nativeBuffer.length >= 4) {
    const length = nativeBuffer.readUInt32LE(0);
    if (length < 2 || length > MAX_MESSAGE) process.exit(2);
    if (nativeBuffer.length < length + 4) return;
    const body = nativeBuffer.subarray(4, length + 4);
    nativeBuffer = nativeBuffer.subarray(length + 4);
    try { handleNative(JSON.parse(body.toString("utf8"))); }
    catch { /* malformed extension messages are ignored */ }
  }
});

process.stdin.on("end", () => process.exit(0));

const pairingToken = readPrivate(TOKEN_PATH);
if (!/^[a-f0-9]{64}$/.test(pairingToken)) process.exit(3);
if (existsSync(SOCKET_PATH)) rmSync(SOCKET_PATH, { force: true });

const server = createServer((socket) => {
  socket.setEncoding("utf8");
  let input = "";
  socket.on("data", (chunk) => {
    input += chunk;
    if (input.length > 65_536) {
      socket.destroy();
      return;
    }
    if (!input.includes("\n")) return;
    socket.removeAllListeners("data");
    let request;
    try { request = JSON.parse(input.slice(0, input.indexOf("\n"))); }
    catch { socket.end('{"ok":false,"error":"request_invalid"}\n'); return; }
    if (request.protocol !== PROTOCOL || !secureEqual(request.auth, pairingToken) || typeof request.id !== "string" || request.id.length > 120) {
      socket.end('{"ok":false,"error":"request_unauthorized"}\n');
      return;
    }
    if (!extensionReady) {
      socket.end('{"ok":false,"error":"extension_not_ready"}\n');
      return;
    }
    if (pending.has(request.id)) {
      socket.end('{"ok":false,"error":"request_duplicate"}\n');
      return;
    }
    let command;
    try { command = prepareCommand(request.command); }
    catch (error) {
      socket.end(`${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "command_invalid" })}\n`);
      return;
    }
    const timer = setTimeout(() => {
      pending.delete(request.id);
      socket.end('{"ok":false,"error":"browser_timeout"}\n');
    }, 120_000);
    pending.set(request.id, { socket, timer, command: request.command });
    nativeWrite({ kind: "command", id: request.id, command });
  });
});

server.listen(SOCKET_PATH, () => chmodSync(SOCKET_PATH, 0o600));

function cleanup() {
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.socket.destroy();
  }
  pending.clear();
  server.close();
  rmSync(SOCKET_PATH, { force: true });
}
process.on("SIGTERM", () => { cleanup(); process.exit(0); });
process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("exit", () => rmSync(SOCKET_PATH, { force: true }));
