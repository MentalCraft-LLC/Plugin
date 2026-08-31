import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
let browserExtension: any;
let compactBrowserResult: any;
try {
  const mod = await import("./pi.ts");
  browserExtension = mod.default;
  compactBrowserResult = mod.compactBrowserResult;
} catch {
  // Optional pi extension dependencies not installed in standard workspace
}
import { createBrowserContextOperation } from "./operation.ts";
import {
  BrowserClient,
  MAX_BROWSER_RESPONSE_CHARS,
  PROTOCOL,
  environmentSessionId,
  environmentSessionName,
  extensionIdentity,
  installBrowserBridge,
  loadAuthority,
  redactBrowserResult,
  safeBrowserUrl,
  safeControlName,
  safePublicMultiline,
  safePublicValue,
  safeSessionId,
  safeSessionName,
  safeOwnerRoute,
} from "./core.ts";

const here = dirname(fileURLToPath(import.meta.url));
const temporary: string[] = [];
const SESSION_ENV_KEYS = [
  "HOLAR_SESSION_ID",
  "HOLAR_SESSION_NAME",
  "GROK_SESSION_ID",
  "PI_SESSION_ID",
  "PI_SESSION_NAME",
  "HOLAR_BROWSER_SESSION",
] as const;

function replaceSessionEnv(values: Partial<Record<(typeof SESSION_ENV_KEYS)[number], string>> = {}): () => void {
  const prior = Object.fromEntries(SESSION_ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of SESSION_ENV_KEYS) {
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
  return () => {
    for (const key of SESSION_ENV_KEYS) {
      const value = prior[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

function temp(): string {
  const path = mkdtempSync(join(tmpdir(), "spiral-browser-"));
  temporary.push(path);
  return path;
}

describe("Browser Context Extension", () => {
  test("routes every consumer through one trusted shared operation", async () => {
    const requests: Array<{ command: Record<string, unknown>; sessionName?: string }> = [];
    const operation = createBrowserContextOperation({
      client: {
        available: () => true,
        async request(command, _signal, sessionName) {
          requests.push({ command: command as unknown as Record<string, unknown>, sessionName });
          return { status: "ready" };
        },
      },
    });
    await operation(
      { action: "fill_public", url: "https://example.com/app", field: "prompt", value: "hello" },
      undefined,
      { isProjectTrusted: () => true },
      "Advisor session",
    );
    await operation(
      {
        action: "fill_public",
        url: "https://example.com/app",
        field: "prompt",
        value: "Advisor prompt\nwith context",
        publicTextMode: "advisor_prompt",
      },
      undefined,
      { isProjectTrusted: () => true },
      "Advisor session",
    );
    await operation(
      {
        action: "read_text",
        url: "https://example.com/app",
        max_chars: 6000,
        readTextMode: "advisor_reply",
        ownerConfirmed: true,
      },
      undefined,
      { isProjectTrusted: () => true },
      "Advisor session",
    );
    await operation(
      { action: "read_styles", url: "https://example.com/app" },
      undefined,
      { isProjectTrusted: () => true },
      "Advisor session",
    );
    await operation(
      { action: "read_scripts", url: "https://example.com/app" },
      undefined,
      { isProjectTrusted: () => true },
      "Advisor session",
    );
    await operation(
      { action: "controls", url: "https://example.com/app", ownerConfirmed: true },
      undefined,
      { isProjectTrusted: () => true },
      "Advisor session",
    );
    expect(requests).toEqual([
      {
        command: expect.objectContaining({ action: "fill", field: "prompt", value: "hello", multiline_public: false }),
        sessionName: "Advisor session",
      },
      {
        command: expect.objectContaining({
          action: "fill",
          field: "prompt",
          value: "Advisor prompt\nwith context",
          multiline_public: true,
        }),
        sessionName: "Advisor session",
      },
      {
        command: expect.objectContaining({ action: "read_text", max_chars: 6000, read_mode: "advisor_reply", owner_confirmed: true }),
        sessionName: "Advisor session",
      },
      {
        command: expect.objectContaining({ action: "read_styles" }),
        sessionName: "Advisor session",
      },
      {
        command: expect.objectContaining({ action: "read_scripts" }),
        sessionName: "Advisor session",
      },
      {
        command: expect.objectContaining({ action: "controls", owner_confirmed: true }),
        sessionName: "Advisor session",
      },
    ]);
    await expect(operation(
      { action: "open", url: "https://example.com" },
      undefined,
      { isProjectTrusted: () => false },
    )).rejects.toThrow("trusted project");
  });

  test("authorizes every non-financial action without Owner confirmation", async () => {
    const requests: Array<Record<string, unknown>> = [];
    const operation = createBrowserContextOperation({
      client: {
        available: () => true,
        async request(command) {
          requests.push(command as unknown as Record<string, unknown>);
          return { status: "ready" };
        },
      },
    });
    await operation(
      { action: "click", url: "https://example.com/app", role: "button", name: "Continue" },
      undefined,
      { isProjectTrusted: () => true },
    );
    await operation(
      { action: "capture_screenshot", url: "https://example.com/app" },
      undefined,
      { isProjectTrusted: () => true },
    );
    expect(requests[0]).toMatchObject({ action: "click", owner_confirmed: true, foreground_confirmed: false });
    expect(requests[1]).toMatchObject({ action: "capture_screenshot", foreground_confirmed: true });
    await expect(operation(
      { action: "click", url: "https://checkout.stripe.com/pay", role: "button", name: "Pay" },
      undefined,
      { isProjectTrusted: () => true },
    )).rejects.toThrow("financial_confirmation_required");
  });

  test("semantic_snapshot routes a compact element budget", async () => {
    const requests: Array<{ command: Record<string, unknown> }> = [];
    const operation = createBrowserContextOperation({
      client: {
        available: () => true,
        async request(command, _signal, _sessionName) {
          requests.push({ command: command as unknown as Record<string, unknown> });
          return { status: "ready" };
        },
      },
    });
    await operation(
      { action: "semantic_snapshot", url: "https://example.com/app", max_elements: 40, ownerConfirmed: true },
      undefined,
      { isProjectTrusted: () => true },
      "test-session",
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].command).toMatchObject({
      protocol: "spiral.browser.v1",
      action: "semantic_snapshot",
      url: "https://example.com/app",
      max_elements: 40,
    });
  });


  test("performs one trusted click on the exact managed tab and restores both foreground leases", async () => {
    const commands: Array<Record<string, unknown>> = [];
    let clicks = 0;
    let restores = 0;
    const operation = createBrowserContextOperation({
      platform: "darwin",
      acquireTrustedForeground: () => ({
        foreground() { return { ok: true }; },
        click() { clicks += 1; return { ok: true }; },
        restore() { restores += 1; return { ok: true }; },
      }),
      client: {
        available: () => true,
        async request(command) {
          commands.push(command as unknown as Record<string, unknown>);
          if (command.action === "click") {
            return { status: "trusted_click_required", diagnostics: { screen_x: 120, screen_y: 240 } };
          }
          if (command.action === "activate") return { status: "activated", tab_active: true };
          if (command.action === "restore_background") return { status: "restored", tab_active: false };
          throw new Error("unexpected command");
        },
      },
    });
    const result = await operation(
      { action: "click", url: "https://example.com/app", role: "button", name: "Continue", foregroundConfirmed: true },
      undefined,
      { isProjectTrusted: () => true },
      "Browser session",
      "Application/Example",
    ) as any;
    expect(commands.map((command) => command.action)).toEqual(["click", "activate", "restore_background"]);
    expect(commands[0]).toMatchObject({ foreground_confirmed: true });
    expect(clicks).toBe(1);
    expect(restores).toBe(1);
    expect(result.trusted_click).toMatchObject({ ok: true, browser_restored: true, foreground_restored: true });
  });

  test("converts the click through an empirically measured window scale, never trusting browser screen geometry", async () => {
    // Browser reports a bogus screen point and a CSS viewport; the host must
    // measure the real window bounds and scale the CSS point into global
    // screen points (Hackintosh/scaled displays lie about screenX and dpr).
    const clicked: Array<{ x: number; y: number }> = [];
    const operation = createBrowserContextOperation({
      platform: "darwin",
      acquireTrustedForeground: () => ({
        foreground() { return { ok: true }; },
        click(x, y) { clicked.push({ x, y }); return { ok: true }; },
        measureWindow() { return { x: 300, y: 100, width: 1440, height: 900 }; },
        restore() { return { ok: true }; },
      }),
      client: {
        available: () => true,
        async request(command) {
          if (command.action === "click") {
            // Bogus screen point (wrong screen), correct CSS point + viewport.
            return { status: "trusted_click_required", diagnostics: { screen_x: 5000, screen_y: 5000, client_x: 200, client_y: 150, viewport_width: 720, viewport_height: 450 } };
          }
          if (command.action === "activate") return { status: "activated", tab_active: true };
          if (command.action === "restore_background") return { status: "restored", tab_active: false };
          throw new Error("unexpected command");
        },
      },
    });
    const result = await operation(
      { action: "click", url: "https://example.com/app", role: "button", name: "Continue", foregroundConfirmed: true },
      undefined,
      { isProjectTrusted: () => true },
      "Browser session",
      "Application/Example",
    ) as any;
    expect(clicked).toEqual([{ x: 700, y: 400 }]); // 300 + 200*2, 100 + 150*2
    expect(result.trusted_click).toMatchObject({ ok: true, x: 700, y: 400 });
  });

  test("fails closed when window measurement returns zero bounds (Chrome not foreground)", async () => {
    const clicked: Array<{ x: number; y: number }> = [];
    const operation = createBrowserContextOperation({
      platform: "darwin",
      acquireTrustedForeground: () => ({
        foreground() { return { ok: true }; },
        click(x, y) { clicked.push({ x, y }); return { ok: true }; },
        measureWindow() { return { x: 0, y: 0, width: 0, height: 0 }; },
        restore() { return { ok: true }; },
      }),
      client: {
        available: () => true,
        async request(command) {
          if (command.action === "click") {
            return { status: "trusted_click_required", diagnostics: { client_x: 100, client_y: 200, viewport_width: 500, viewport_height: 1000 } };
          }
          if (command.action === "activate") return { status: "activated", tab_active: true };
          if (command.action === "restore_background") return { status: "restored", tab_active: false };
          throw new Error("unexpected command");
        },
      },
    });
    const result = await operation(
      { action: "click", url: "https://example.com/app", role: "button", name: "Continue", foregroundConfirmed: true },
      undefined,
      { isProjectTrusted: () => true },
      "Browser session",
      "Application/Example",
    ) as any;
    expect(clicked).toHaveLength(0);
    expect(result.trusted_click).toMatchObject({ attempted: true, ok: false });
    expect(result.trusted_click.error).toContain("window bounds unavailable");
  });

  test("attempts recovery when foreground activation fails after partial bridge mutation", async () => {
    const commands: string[] = [];
    let foregroundRestores = 0;
    const operation = createBrowserContextOperation({
      platform: "darwin",
      acquireTrustedForeground: () => ({
        click() { throw new Error("must not click"); },
        restore() { foregroundRestores += 1; return { ok: true }; },
      }),
      client: {
        available: () => true,
        async request(command) {
          commands.push(command.action);
          if (command.action === "click") return { status: "trusted_click_required", diagnostics: { screen_x: 1, screen_y: 2 } };
          if (command.action === "activate") throw new Error("partial activation failure");
          if (command.action === "restore_background") return { status: "restored", tab_active: false };
          throw new Error("unexpected command");
        },
      },
    });
    const result = await operation(
      { action: "click", url: "https://example.com/app", role: "button", name: "Continue", foregroundConfirmed: true },
      undefined,
      { isProjectTrusted: () => true },
    ) as any;
    expect(commands).toEqual(["click", "activate", "restore_background"]);
    expect(foregroundRestores).toBe(1);
    expect(result.trusted_click).toMatchObject({ ok: false, browser_restored: true, foreground_restored: true });
  });

  test("loads exact existing-profile Browser Context authority", () => {
    const authority = loadAuthority();
    expect(authority.origins).toEqual(["http://*/*", "https://*/*"]);
    expect(authority.scope.existing_chrome_profile).toBe(true);
    expect(authority.scope.background_tabs).toBe(true);
    expect(authority.scope.managed_tab_group).toBe(true);
    expect(authority.scope.session_named_tab_group).toBe(true);
    expect(authority.scope.local_secret_capture).toBe(true);
    expect(authority.scope.self_repair).toBe(true);
    expect(authority.scope.broad_http_https).toBe(true);
    expect(authority.scope.cookie_read_or_export).toBe(true);
    expect(authority.scope.cookie_local_handling).toBe(true);
    expect(authority.scope.focus_steal).toBe(false);
    expect(authority.scope.popup_ui).toBe(false);
    expect(authority.scope.remote_debugging).toBe(false);
  });

  test("uses a stable minimal Manifest V3 identity without popup or surveillance permissions", () => {
    const identity = extensionIdentity();
    expect(identity.id).toBe("jfmmobajkjgocbpbbfopblikdjoaeogo");
    expect(identity.manifest.manifest_version).toBe(3);
    expect(identity.manifest.name).toBe("Holar Browser Context");
    expect(identity.manifest.version).toBe("1.2.63");
    expect(identity.manifest.action).toEqual({ default_title: "Grant foreground screenshot" });
    expect(identity.manifest.permissions).toEqual(["nativeMessaging", "storage", "activeTab", "cookies", "tabs", "tabGroups", "debugger"]);
    expect(identity.manifest.permissions).not.toContain("history");
    expect(identity.manifest.host_permissions).toEqual(["http://*/*", "https://*/*"]);
    expect(identity.manifest.content_scripts[0].matches).toEqual(["http://*/*", "https://*/*"]);
    expect(identity.manifest.content_scripts[0].js).toEqual(["text.js", "long-capture.js", "annotation.js", "content.js"]);
    expect(identity.manifest.content_scripts[0].all_frames).toBe(true);
  });

  test("installs a private paired Native Messaging bridge without exposing its token", () => {
    const home = temp();
    const installed = installBrowserBridge({
      home,
      workspace: "/tmp/Holar Fixture",
      nodePath: "/usr/local/bin/node fixture",
      extensionRoot: here,
      token: "a".repeat(64),
    });
    const tokenPath = join(home, ".config/holar/browser/pairing-token");
    const wrapperPath = join(home, ".config/holar/browser/native-host");
    const native = JSON.parse(readFileSync(installed.nativeManifestPath, "utf8"));
    const wrapper = readFileSync(wrapperPath, "utf8");
    expect(installed.extensionId).toBe("jfmmobajkjgocbpbbfopblikdjoaeogo");
    expect(native.allowed_origins).toEqual(["chrome-extension://jfmmobajkjgocbpbbfopblikdjoaeogo/"]);
    expect(native.description).toBe("Holar bounded Browser Context bridge");
    expect(native.path).toBe(wrapperPath);
    expect(wrapper).toContain("HOLAR_BROWSER_WORKSPACE='/tmp/Holar Fixture'");
    expect(wrapper).toContain("'/usr/local/bin/node fixture'");
    expect(wrapper).not.toContain("a".repeat(64));
    expect(statSync(tokenPath).mode & 0o077).toBe(0);
    expect(statSync(wrapperPath).mode & 0o077).toBe(0);
    expect(statSync(installed.nativeManifestPath).mode & 0o077).toBe(0);
  });

  test("allows all normal web origins with semantic non-identity controls", () => {
    expect(safeBrowserUrl("https://analytics.google.com/analytics/web/#/admin")).toBe("https://analytics.google.com/analytics/web/#/admin");
    expect(safeBrowserUrl("https://analytics.google.com/analytics/web/#/a403133714p548068459/admin")).toBe("https://analytics.google.com/analytics/web/#/a403133714p548068459/admin");
    expect(safeBrowserUrl("https://clarity.microsoft.com/projects?view=all")).toBe("https://clarity.microsoft.com/projects?view=all");
    expect(safeBrowserUrl("https://accounts.google.com/")).toBe("https://accounts.google.com/");
    expect(safeBrowserUrl("http://example.com/#section")).toBe("http://example.com/#section");
    expect(() => safeBrowserUrl("file:///tmp/private")).toThrow("target policy");
    expect(safeControlName("Account access management")).toBe("Account access management");
    expect(safeControlName("开始衡量")).toBe("开始衡量");
    expect(safeControlName("Google 产品和服务")).toBe("Google 产品和服务");
    expect(() => safeControlName("someone@example.com")).toThrow("invalid");
    expect(safePublicValue("example.test")).toBe("example.test");
    expect(() => safePublicValue("someone@example.com")).toThrow("invalid");
    expect(safePublicMultiline("Advisor prompt\nwith bounded context")).toContain("\n");
    expect(() => safePublicMultiline("Contact someone@example.com")).toThrow("invalid");
    expect(safeSessionId("019fbb8b-b830-7c04-8828-3faf44f1cd03")).toBe("019fbb8b-b830-7c04-8828-3faf44f1cd03");
    expect(safeSessionId("bad")).toBe("holar-default");
    expect(safeSessionName("  Example Session   browser  ")).toBe("Example Session browser");
    expect(safeSessionName("someone@example.com")).toBe("[identity]");
    expect(safeSessionName(undefined)).toBe("Holar Session");
    // Unique fallback seed: a Session without a name still gets a distinct
    // tab-group title (never a shared "Holar Session" that merges Sessions).
    expect(safeSessionName(undefined, "holar-019fbb8b")).toBe("holar-019fbb8b");
    expect(safeSessionName(undefined, "holar-019fbb8b")).not.toBe(safeSessionName(undefined, "holar-019f1111"));
  });

  test("redacts any accidental identity, token, or credential field", () => {
    const safe = redactBrowserResult({
      label: "Invite someone@example.com",
      path: "/projects/view/xvqs8cz2ys/gettingstarted#/a123p456/admin",
      access_token: "ya29.fixture-access-token-value",
      cookies: [{ name: "sid", value: "private-cookie" }],
      session: { value: "private-session" },
      nested: { value: "private", status: "ready" },
      provider_label: "Example Analytics 123456789 star_border",
    });
    expect(safe).toEqual({
      label: "Invite [identity]",
      path: "/projects/view/[provider-id]/gettingstarted#/provider-id/admin",
      access_token: "[REDACTED]",
      cookies: "[REDACTED]",
      session: "[REDACTED]",
      nested: { value: "[REDACTED]", status: "ready" },
      provider_label: "Example Analytics [provider-id] star_border",
    });
    const longText = redactBrowserResult({ text: `${"safe ".repeat(180)}someone@example.com` }) as { text: string };
    expect(longText.text.length).toBeGreaterThan(500);
    expect(longText.text).toEndWith("[identity]");
    const billing = redactBrowserResult({ text: [
      "Workers Paid", "Active", "Payment method", "••••", "••••", "••••", "4242", "Jane Example", "Expires 12/2030",
      "Billing email", "owner@example.test", "Billing address", "Jane Example", "123 Example Street", "Sample City, CA 12345",
      "Invoices", "Aug 1, 2026", "Invoice", "INV-ABC123", "US$5.00", "Paid",
    ].join("\n") }) as { text: string };
    expect(billing.text).toContain("Workers Paid\nActive");
    expect(billing.text).toContain("Aug 1, 2026\nInvoice\n[invoice-id]\nUS$5.00\nPaid");
    for (const privateValue of ["4242", "Jane Example", "owner@example.test", "123 Example Street", "Sample City"]) {
      expect(billing.text).not.toContain(privateValue);
    }
    expect(redactBrowserResult({ text: "**Configuration:**\n**Type**: MX\n**Value**: public" }))
      .toEqual({ text: "**Configuration:**\n**Type**: MX\n**Value**: public" });
  });

  test("bounds and redacts long single-node public text without flattening it", () => {
    const source = readFileSync(resolve(here, "extension/text.js"), "utf8");
    const sandbox: Record<string, unknown> = {};
    runInNewContext(source, sandbox);
    const bound = sandbox.spiralBoundPublicText as (raw: unknown, maxChars: number) => string;
    expect(typeof bound).toBe("function");
    const raw = `heading\nsomeone@example.com\nya29.abcdefghijkl\n${"long-node-line\n".repeat(600)}tail`;
    const value = bound(raw, 6000);
    expect(value).toHaveLength(6000);
    expect(value).toStartWith("heading\n[identity]\n[secret]\n");
    expect(value).toContain("long-node-line\nlong-node-line");
    expect(value.length).toBeGreaterThan(160);
    expect(bound("x".repeat(100100), 100000)).toHaveLength(100000);
    expect(bound("x", 100001)).toBe("");
  });

  test("summarizes Browser Context results for collapsed Pi rendering", () => {
    expect(compactBrowserResult({
      status: "ready",
      origin: "https://dashboard.stripe.com",
      controls: [{ role: "button" }, { role: "link" }],
      diagnostics: { iframe_count: 1 },
      tab_active: false,
      focus_changed: false,
    })).toBe("ready · dashboard.stripe.com · 2 controls · 1 iframe · inactive tab · focus unchanged");
    expect(compactBrowserResult({ status: "reload_queued", managed_tab_count: 0 }))
      .toBe("reload_queued · 0 managed tabs");
    expect(compactBrowserResult(undefined)).toBe("Browser operation completed");
  });

  test("pairs with a user-only Unix socket and sanitizes the native result", async () => {
    const root = temp();
    const socketPath = join(root, "control.sock");
    const tokenPath = join(root, "pairing-token");
    writeFileSync(tokenPath, `${"b".repeat(64)}\n`, { mode: 0o600 });
    chmodSync(tokenPath, 0o600);
    let observedAuth = false;
    let observedSession: unknown;
    const server = createServer((socket) => {
      socket.setEncoding("utf8");
      let input = "";
      socket.on("data", (chunk) => {
        input += chunk;
        if (!input.includes("\n")) return;
        const request = JSON.parse(input.trim());
        observedAuth = request.auth === "b".repeat(64);
        observedSession = request.command.session;
        socket.end(`${JSON.stringify({
          ok: true,
          result: { status: "ready", label: "Add someone@example.com", token: "private" },
        })}\n`);
      });
    });
    await new Promise<void>((resolvePromise) => server.listen(socketPath, resolvePromise));
    const client = new BrowserClient(socketPath, tokenPath, 2_000);
    const restore = replaceSessionEnv({ PI_SESSION_ID: "019fbb8b-b830-7c04-8828-3faf44f1cd03" });
    let result: unknown;
    try {
      result = await client.request(
        { protocol: PROTOCOL, action: "status" },
        undefined,
        "Example Session browser",
        "Business/Product/Application",
      );
    } finally {
      restore();
    }
    expect(observedAuth).toBe(true);
    expect(observedSession).toMatchObject({
      id: "019fbb8b-b830-7c04-8828-3faf44f1cd03",
      name: "Example Session browser",
      workspace: "Business/Product/Application",
    });
    expect(safeOwnerRoute("Business/Product/Application")).toBe("Business/Product/Application");
    expect(safeOwnerRoute("/tmp/Holar Fixture")).toBe("holar fixture");
    expect(typeof observedSession.workspace).toBe("string");
    expect((observedSession.workspace ?? "").length).toBeGreaterThan(0);
    expect((observedSession.workspace ?? "").length).toBeLessThanOrEqual(200);
    expect(result).toEqual({ status: "ready", label: "Add [identity]", token: "[REDACTED]" });
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
  });

  test("names concurrent Sessions from GROK_SESSION_ID when Pi id is absent", async () => {
    const root = temp();
    const socketPath = join(root, "control.sock");
    const tokenPath = join(root, "pairing-token");
    writeFileSync(tokenPath, `${"d".repeat(64)}\n`, { mode: 0o600 });
    chmodSync(tokenPath, 0o600);
    let observedSession: Record<string, unknown> = {};
    const server = createServer((socket) => {
      socket.setEncoding("utf8");
      let input = "";
      socket.on("data", (chunk) => {
        input += chunk;
        if (!input.includes("\n")) return;
        const request = JSON.parse(input.trim()) as { command?: { session?: Record<string, unknown> } };
        observedSession = request.command?.session ?? {};
        socket.end(`${JSON.stringify({ ok: true, result: { status: "ready" } })}\n`);
      });
    });
    await new Promise<void>((resolvePromise) => server.listen(socketPath, resolvePromise));
    const client = new BrowserClient(socketPath, tokenPath, 2_000);
    const restore = replaceSessionEnv({ GROK_SESSION_ID: "01a013b7-1a0b-7f83-a851-ed6ac3ecde4a" });
    try {
      await client.request({ protocol: PROTOCOL, action: "status" });
    } finally {
      restore();
    }
    expect(observedSession).toMatchObject({
      id: "01a013b7-1a0b-7f83-a851-ed6ac3ecde4a",
      name: "01a013b7-1a0b-7f83-a851-ed6ac3ecde4a",
    });
    expect(observedSession.id).not.toBe("holar-default");
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
  });

  test("reads a generic Session id before host-specific ids", () => {
    const restore = replaceSessionEnv({
      HOLAR_SESSION_ID: "01a013b7-1a0b-7f83-a851-ed6ac3ecde4a",
      HOLAR_SESSION_NAME: "Holar Session",
      PI_SESSION_ID: "019fbb8b-b830-7c04-8828-3faf44f1cd03",
      PI_SESSION_NAME: "Pi Session",
    });
    try {
      expect(environmentSessionId()).toBe("01a013b7-1a0b-7f83-a851-ed6ac3ecde4a");
      expect(environmentSessionName()).toBe("Holar Session");
    } finally {
      restore();
    }
  });

  test("accepts declared long text and rejects responses beyond the transport envelope", async () => {
    const root = temp();
    const socketPath = join(root, "control.sock");
    const tokenPath = join(root, "pairing-token");
    writeFileSync(tokenPath, "c".repeat(64), { mode: 0o600 });
    let requestCount = 0;
    const server = createServer((socket) => {
      socket.on("error", () => {});
      socket.once("data", () => {
        requestCount += 1;
        const text = requestCount === 1 ? "x".repeat(100000) : "x".repeat(MAX_BROWSER_RESPONSE_CHARS + 1);
        socket.end(`${JSON.stringify({ ok: true, result: { action: "read_text", text } })}\n`);
      });
    });
    await new Promise<void>((resolvePromise) => server.listen(socketPath, resolvePromise));
    const client = new BrowserClient(socketPath, tokenPath, 5_000);
    const accepted = await client.request({ protocol: PROTOCOL, action: "read_text", url: "https://example.test", max_chars: 100000 }) as { text: string };
    expect(accepted.text).toHaveLength(100000);
    await expect(client.request(
      { protocol: PROTOCOL, action: "read_text", url: "https://example.test", max_chars: 100000 },
    )).rejects.toThrow("exceeded the bounded limit");
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
  });

  test("browser runtime statically preserves focus, popup, secret-redaction, input-only debugger, and evaluation boundaries", () => {
    const index = readFileSync(resolve(here, "pi.ts"), "utf8");
    const worker = readFileSync(resolve(here, "extension/worker.js"), "utf8");
    const content = readFileSync(resolve(here, "extension/content.js"), "utf8");
    const challenge = readFileSync(resolve(here, "extension/challenge.js"), "utf8");
    const foregroundScreenshot = readFileSync(resolve(here, "extension/foreground-screenshot.js"), "utf8");
    const activateTab = readFileSync(resolve(here, "extension/activate-tab.js"), "utf8");
    const operation = readFileSync(resolve(here, "operation.ts"), "utf8");
    const host = readFileSync(resolve(here, "host.mjs"), "utf8");
    const secret = readFileSync(resolve(here, "secret.mjs"), "utf8");
    expect(worker).toContain("active: false");
    expect(worker).not.toContain("chrome.tabs.create({ url: target.toString(), active: true");
    expect(worker).toContain("chrome.tabs.update(tab.id, { active: true");
    expect(worker).not.toContain("active_tab_changed");
    expect(worker).toContain("tab_outside_managed_group");
    expect(worker).not.toContain("managed_tab_activated");
    expect(worker).toContain("foreignTabIsActiveInWindow");
    expect(worker).toContain("collapsed: foreignActive");
    expect(worker).toContain("command.allow_active === true || readOnly");
    expect(operation).toContain("allow_active: allowActive");
    expect(worker).toContain("chrome.action.onClicked");
    expect(worker).toContain("foregroundScreenshotGrant");
    expect(worker).toContain("if (candidate.active) continue");
    expect(worker).toContain("await chrome.tabs.remove(tab.id)");
    expect(worker).toContain("chrome.tabs.reload(tab.id");
    expect(worker).toContain("if (port) return;");
    expect(worker).toContain('command.action === "open"');
    expect(worker).toContain('command.action === "terms_diagnostics"');
    expect(worker).toContain('command.action === "select_ga4_target"');
    expect(worker).toContain('command.action === "select_ga4_objective"');
    expect(worker).toContain('command.action === "open_clarity_project"');
    expect(worker).toContain('command.action === "open_clarity_settings"');
    expect(worker).toContain('command.action === "capture_ga4_measurement_id"');
    expect(worker).toContain('command.action === "capture_clarity_project_id"');
    expect(worker).toContain('command.action === "clarity_project_identity"');
    expect(worker).toContain('command.action === "accept_standard_terms"');
    expect(worker).toContain('command.action === "accept_owner_authorized_terms"');
    expect(worker).toContain("connection.postMessage");
    expect(worker).toContain("chrome.windows.update(tab.windowId, { focused: true })");
    expect(worker).not.toContain("chrome.debugger.sendCommand(.*Runtime.evaluate");
    expect(readFileSync(resolve(here, "extension/managed-screenshot.js"), "utf8")).toContain("chrome.debugger.attach");
    expect(worker).not.toContain("Input.dispatchMouseEvent");
    expect(worker).not.toContain("Input.dispatchKeyEvent");
    expect(worker).toContain('command.action === "evaluate_script"');
    expect(worker).not.toContain("Network.enable");
    expect(worker).not.toContain("DOM.enable");
    expect(readFileSync(resolve(here, "extension/managed-screenshot.js"), "utf8")).toContain("Page.captureScreenshot");
    expect(readFileSync(resolve(here, "extension/managed-screenshot.js"), "utf8")).toContain("captureVisibleTab");
    expect(readFileSync(resolve(here, "extension/managed-screenshot.js"), "utf8")).not.toContain("Runtime.evaluate");
    expect(worker).toContain("cdp_click_requires_owner_confirmation");
    expect(worker).toContain("cdp_scroll_requires_owner_confirmation");
    expect(worker).toContain("cdp_key_requires_owner_confirmation");
    expect(worker).toContain('action: "point_click"');
    expect(worker).toContain('action: "wheel"');
    expect(worker).toContain("cdp_scroll_delta_invalid");
    expect(worker).toContain("cdp_hover_requires_owner_confirmation");
    expect(worker).toContain('action: "hover"');
    expect(worker).toContain("cdp_hover_point_invalid");
    expect(content).toContain("dispatchTrustedPageInput");
    expect(content).toContain('message.action === "hover"');
    expect(worker).toContain("reapIdleGroups");
    expect(worker).toContain("IDLE_REAP_MS");
    expect(worker).toContain('key.startsWith("lastActivity:")');
    expect(operation).toContain('params.action === "cdp_hover"');
    expect(operation).toContain('params.action === "cdp_scroll"');
    expect(operation).toContain("client coordinates are required for a CDP hover");
    expect(operation).toContain("delta coordinates are required for a CDP scroll");
    expect(readFileSync(resolve(here, "extension/managed-screenshot.js"), "utf8")).not.toContain("Runtime.evaluate");
    expect(content).toContain("dispatchTrustedPageInput");
    expect(worker).toContain("chrome.runtime.reload()");
    expect(worker).toContain("runtime_version: 127");
    expect(worker).toContain("reloaded_tab_count");
    expect(worker).not.toContain("closed_background_tab_count");
    expect(worker).toContain('importScripts("challenge.js", "foreground-screenshot.js", "managed-screenshot.js", "activate-tab.js")');
    expect(worker).toContain('command.action === "activate"');
    expect(activateTab).toContain("activate_foreground_confirmation_required");
    expect(activateTab).toContain("activate_target_mismatch");
    expect(activateTab).not.toContain("windows.update");
    expect(activateTab).not.toContain("tabs.update");
    expect(operation).toContain("params.foregroundConfirmed === true");
    expect(operation).toContain('action: "restore_background"');
    // Trusted OS click raises Chrome to frontmost ONLY inside the
    // owner-confirmed foreground path; no arbitrary focus operation exists.
    // The OS machinery lives in the plugin's own os-lease module (the
    // computer extension was retired with the 2026-08 surface demolition).
    expect(operation).toContain('import { acquireChromeOsLease } from "./os-lease.ts";');
    expect(operation).toContain('return lease.foreground("Google Chrome");');
    expect(operation).toContain('return lease.measureWindow("Google Chrome");');
    expect(operation).toContain('return lease.click({ x, y });');
    expect(operation).toContain('if (!raised.ok) throw new Error');
    expect(content).toContain('status: "trusted_click_required"');
    expect(content).toContain("Native click() so Svelte/React delegated handlers");
    expect(content).toContain("function controlArea(element)");
    expect(content).toContain("function innermostTextTarget(element, expected)");
    expect(content).toContain("// Deepen a container candidate");
    expect(content).toContain("click point lands on the real");
    expect(content).toContain("function rankSameName(candidates)");
    expect(content).toContain("// Deterministic tie-break for same-name controls");
    expect(content).toContain("deepen EVERY");
    expect(content).toContain("const targets = partial.map((element) => innermostTextTarget(element, expected));");
    expect(content).toContain("// Off-canvas clones (collapsed slide-out panels) must never win");
    expect(content).toContain("const exactVisible = exact.filter(onScreenMatch);");
    expect(content).toContain("const onScreenMatch = (element) => {");
    expect(content).toContain("function documentTextTarget(expected)");
    expect(content).toContain("// Bare-text fallback: SPA nav items often carry no interactive semantics");
    expect(content).toContain("const isRoot = current === document.documentElement || current.nodeType === 11;");
    expect(content).toContain("if (current.shadowRoot) queue.push(current.shadowRoot);");
    expect(content).toContain("// Hover pre-sequence: a real pointer stream always begins with");
    expect(content).toContain('["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove", "pointermove"]');
    expect(content).toContain("same-page text only, on-screen only");
    expect(content).toContain("// On-screen means truly rendered: rect inside the viewport AND not");
    expect(content).toContain('style.opacity !== "0"');
    expect(content).toContain("const visibleTargets = targets.filter(onScreenMatch);");
    expect(content).toContain("// SPA placeholders (javascript:void, \"#\") never navigate");
    expect(content).toContain("element instanceof HTMLAnchorElement && message.foreground_confirmed !== true");
    expect(content).toContain("rawHref && !/^(?:javascript:|#)/i.test(rawHref)");
    expect(content).toContain("never execute the javascript: payload");
    expect(content).toContain("// Collapsed slide-out panels sit off-canvas");
    expect(content).toContain("box.right > 0 && box.bottom > 0");
    expect(worker).toContain("// Report the managed window's own bounds");
    expect(worker).toContain("window_bounds: windowBounds");
    expect(worker).toContain("const targetWindow = await chrome.windows.get(tab.windowId, { populate: false });");
    expect(operation).toContain("// Prefer the managed window's own bounds reported by the worker");
    expect(operation).toContain("const reported = activation.window_bounds as");
    expect(content).toContain('if (!nativeClicked && elementRole(element) !== "option")');
    expect(content).toContain("a trailing synthetic");
    expect(content).toContain("!element.closest('[role=\"combobox\"]')");
    expect(content).toContain("before a later semantic option click");
    expect(content).toContain('message.action === "select_combobox"');
    expect(content).toContain('for (const key of ["ArrowDown", "Enter"])');
    expect(content).toContain("visually hidden combobox input");
    expect(content).toContain("select\\.\\.\\.");
    expect(content).toContain("input_readonly: input.readOnly === true");
    expect(content).toContain("Non-searchable selects keep a readOnly input");
    expect(content).toContain("open it synthetically first");
    expect(content).toContain("Coordinate click: locate the exact point");
    expect(content).toContain("control_screen_x");
    expect(content).toContain("nearest visible non-input ancestor");
    expect(operation).toContain("name or screen coordinates are required");
    expect(worker).toContain("screen_x: command.screen_x");
    expect(worker).toContain('command.action === "select_combobox"');
    expect(operation).toContain('params.action === "select_combobox"');
    expect(index).toContain('"select_combobox"');
    expect(worker).not.toContain("foreground_human_required");
    expect(worker).toContain("human_boundary");
    expect(worker).toContain('owner_authorized_terms: true');
    expect(worker).toContain('human_boundary_mutated: false');
    expect(operation).toContain("const ownerConfirmed = financial ? params.ownerConfirmed === true : true");
    expect(operation).toContain('params.action === "controls" ? { owner_confirmed: ownerConfirmed } : {}');
    expect(worker).toContain('} else if (command.action === "click") {\n    result = await sendToContent(state.tab.id, {');
    expect(worker).toContain("navigationStarted ? await waitComplete");
    expect(worker).toContain('STORAGE_PREFIX = "managedTabIds:"');
    expect(worker).toContain('GROUP_PREFIX = "managedTabGroupId:"');
    expect(worker).not.toContain("migrateLegacySession");
    expect(worker).not.toContain("LEGACY_STORAGE_KEY");
    expect(worker).not.toContain("LEGACY_GROUP_KEY");
    expect(worker).toContain("title: groupTitle(session)");
    expect(worker).toContain("return session.name;");
    expect(worker).toContain("${STORAGE_PREFIX}${session.id}");
    expect(worker).toContain("${GROUP_PREFIX}${session.id}");
    expect(worker).not.toContain('const FLEET = "holar"');
    expect(worker).not.toContain("The tab-group strictly mirrors the Session name");
    expect(worker).not.toContain("session.workspace} · ${session.name}");
    expect(worker).not.toContain('GROUP_TITLE = "Spiral Analytics"');
    expect(index).toContain('const BROWSER_TOOL = "chrome";');
    expect(index).toContain('registerBrowserTool(pi, BROWSER_TOOL, "chrome"');
    expect(index).not.toContain("chrome_context");
    expect(index).toContain("永不兼容");
    expect(index).not.toContain("browser_background");
    expect(index).toContain("pi.getSessionName()");
    expect(worker).toContain("chrome.tabs.group");
    expect(worker).toContain("chrome.tabs.move");
    expect(worker).toContain("const ids = await managedTabIds(session)");
    expect(worker).toContain("chrome.tabGroups.update");
    expect(worker).toContain("collapsed: true");
    expect(content).toContain("content_version: 111");
    expect(content).toContain("multiline_public");
    expect(content).toContain('child.type === "password"');
    expect(content).toContain("spiralBoundPublicText");
    expect(content).toContain('expected === "prompt" && role === "textbox" && candidates.length === 1');
    expect(content).toContain('expected === "send" && role === "button"');
    expect(content).toContain("element instanceof HTMLElement && element.isContentEditable");
    expect(content).toContain('document.execCommand("insertText", false, value)');
    expect(content).toContain("element.replaceChildren(document.createTextNode(value))");
    expect(content).toContain("multilinePublic ? 8000 : 500");
    expect(worker).toContain("multiline_public: command.multiline_public === true");
    expect(worker).toContain('read_mode: command.read_mode === "advisor_reply" ? "advisor_reply" : undefined');
    expect(content).toContain('mode === "advisor_reply"');
    expect(content).toContain('controlElements().filter((element) => elementRole(element) === "textbox" && elementContext(element) === "main")');
    expect(content).toContain('composers[0].closest("main, [role=\'main\']")');
    expect(host).toContain('key === "text" && typeof item === "string"');
    expect(content).toContain("announceStripeFrame");
    expect(content).toContain("binary_controls");
    expect(content).toContain('kind: "stripe_frame_ready"');
    expect(worker).toContain("stripe_frame_ready");
    expect(worker).toContain("pageFromFrames");
    expect(worker).toContain("embedded_frame_diagnostics");
    expect(worker).toContain("actions_supported: false");
    expect(worker).toContain("{ frameId }");
    expect(content).toContain("form_errors");
    expect(content).toContain('key: "Enter"');
    expect(content).toContain('action: "press_enter"');
    expect(content).toContain('element.target = "_self"');
    expect(content).toContain("cross_origin_navigation_blocked");
    expect(content).toContain("same_tab_navigation_dispatched");
    expect(content).toContain("GA_BEHAVIOR_OBJECTIVE");
    expect(content).toContain("GA_OBJECTIVES");
    expect(content).toContain("knownGaObjective");
    expect(content).toContain("GA_SMALL_BUSINESS");
    expect(content).toContain("label.innerText");
    expect(content).toContain("radio_semantics");
    expect(content).toContain("selection_semantics");
    expect(content).toContain("GA_DATA_SHARING_ID");
    expect(content).toContain("checkbox_semantics");
    expect(content).toContain("function interactable");
    expect(content).toContain('includes(element.type)');
    expect(content).toContain("new InputEvent");
    expect(content).toContain("value_length_after");
    expect(content).toContain("clarityTokenCandidate");
    expect(host).toContain("storeGa4MeasurementId");
    expect(host).toContain("storeClarityToken");
    expect(host).toContain("storeScreenshot");
    expect(host).toContain("storeSession");
    expect(host).toContain('redactBrowserString } from "./modules/redaction.mjs"');
    expect(host).toContain("managedSession");
    expect(host).toContain("session_invalid");
    expect(host).toContain('const workspace = String(value.workspace ?? "")');
    expect(host).toContain("session_workspace_invalid");
    expect(host).toContain("return { id, name, workspace }");
    expect(secret).toContain('token_value_returned: false');
    expect(host).not.toContain("console.log");
    expect(secret).not.toContain("console.log");
    expect(content).toContain("normalized.find((value) => SAFE_CONTROL_TERM.test(value))");
    expect(content).toContain("function formDiagnostics");
    expect(content).toContain('element.getAttribute("aria-labelledby")');
    expect(content).toContain('element.hasAttribute("data-testid")');
    expect(content).toContain("EQUIVALENT_FORM_OPENER");
    expect(content).toContain("function termsControlText");
    expect(content).toContain("function elementContext");
    expect(content).toContain("message.context");
    expect(content).toContain('"[role=checkbox]"');
    expect(content).toContain('"[role=switch]"');
    expect(content).toContain('"slat, [tabindex], [data-testid], [data-value], [aria-selected]"');
    expect(content).toContain("objective_candidates");
    expect(challenge).toContain("spiralDetectHumanBoundary");
    expect(challenge).toContain("resumable: true");
    expect(foregroundScreenshot).toContain("spiralCaptureForegroundScreenshot");
    expect(foregroundScreenshot).toContain("captureVisibleTab");
    expect(foregroundScreenshot).toContain("OffscreenCanvas");
    expect(foregroundScreenshot).toContain('capture_mode: "full_page"');
    expect(foregroundScreenshot).toContain("screenshot_foreground_confirmation_required");
    expect(worker).toContain("spiralCaptureManagedScreenshot");
    expect(worker).toContain("spiralCaptureManagedLongScreenshot");
    expect(content).toContain("spiralLongRead");
    expect(content).toContain("spiralPrimaryScroller");
    expect(content).toContain("spiralWaitScroll");
    expect(worker).toContain("hung && longRunning");
    expect(worker).toContain("awakenBackgroundPage");
    expect(worker).not.toContain("revealManagedTab");
    expect(worker).toContain("Page.setWebLifecycleState");
    expect(worker).toContain("Emulation.setFocusEmulationEnabled");
    expect(worker).toContain("Page.startScreencast");
    expect(worker).toContain("100_000");
    expect(readFileSync(resolve(here, "extension/long-capture.js"), "utf8")).toContain("spiralWaitScroll");
    expect(readFileSync(resolve(here, "extension/long-capture.js"), "utf8")).toContain("TOP_HOLD_MS");
    expect(readFileSync(resolve(here, "extension/long-capture.js"), "utf8")).toContain("spiralCompactTurnText");
    expect(readFileSync(resolve(here, "extension/long-capture.js"), "utf8")).toContain("USER_TURN_CHARS");
    expect(readFileSync(resolve(here, "extension/long-capture.js"), "utf8")).toContain("spiralComposeConversation");
    expect(content).toContain('message.action === "annotate"');
    expect(worker).toContain("annotate");
    expect(readFileSync(resolve(here, "extension/annotation.js"), "utf8")).toContain("spiralAnnotationStart");
    expect(readFileSync(resolve(here, "extension/annotation.js"), "utf8")).toContain("spiralAnnotationSubmit");
    expect(readFileSync(resolve(here, "extension/annotation.js"), "utf8")).toContain("spiralAnnotationFinish");
    expect(worker).toContain("annotation_submit");
    expect(worker).toContain("owner_submit");
    expect(worker).toContain("if (!port) connect()");
    expect(readFileSync(resolve(here, "extension/long-capture.js"), "utf8")).toContain("spiralLongRead");
    expect(content).toContain('message.action === "screenshot_metrics"');
    expect(content).toContain('message.action === "screenshot_scroll"');
    expect(content).toContain('message.action === "screenshot_restore"');
    expect(content).toContain("element.shadowRoot");
    expect(index).toContain("capture_ga4_measurement_id");
    expect(index).toContain("capture_session");
    expect(index).toContain("capture_screenshot");
    expect(index).toContain("foregroundConfirmed");
    expect(worker).toContain("chrome.cookies.getAll");
    expect(content).not.toContain("document.cookie");
    expect(content).not.toContain("new Function");
    expect(content).not.toContain("outerHTML");
  });

  test("pins the public Browser Context Tool ABI with screenshot guidance", () => {
    if (!browserExtension) return;
    let tool: Record<string, unknown> | undefined;
    browserExtension({
      registerTool: (value: Record<string, unknown>) => { tool = value; },
      registerCommand: () => {},
      on: () => {},
    } as never);
    expect(tool).toBeDefined();
    const surface = {
      name: tool?.name,
      label: tool?.label,
      description: tool?.description,
      promptSnippet: tool?.promptSnippet,
      promptGuidelines: tool?.promptGuidelines,
      parameters: tool?.parameters,
    };
    expect(createHash("sha256").update(JSON.stringify(surface)).digest("hex"))
      .toBe("46c95f4bf50fe55921d3bad21056523d97c7773b3baeb86cd16b39b17d7e93f4");
  });

  test("registers one canonical Browser Context Tool with compact rendering and one setup command", () => {
    if (!browserExtension) return;
    const tools: Array<{
      name: string;
      label: string;
      promptSnippet?: string;
      promptGuidelines?: string[];
      renderCall?: unknown;
      renderResult?: unknown;
    }> = [];
    const commands: string[] = [];
    browserExtension({
      registerTool: (tool: { name: string; label: string; promptSnippet?: string; promptGuidelines?: string[] }) => tools.push(tool),
      registerCommand: (name: string) => commands.push(name),
      on: () => {},
    } as never);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      name: "chrome",
      label: "Browser Context",
      promptSnippet: "Universal web information gathering through the Owner Chrome profile",
    });
    expect(tools[0].promptGuidelines?.every(
      (guideline) =>
        guideline.includes("chrome") ||
        guideline.startsWith("capture_") ||
        guideline.startsWith("Any control") ||
        guideline.includes("spends no money") ||
        guideline.includes("standing authority") ||
        guideline.includes("no per-step Owner instruction") ||
        guideline.includes("read_text") ||
        guideline.includes("virtualized") ||
        guideline.includes("long=true") ||
        guideline.includes("Session's tab-group") ||
        guideline.includes("annotate") ||
        guideline.includes("design-mode") ||
        guideline.includes("foregroundConfirmed") ||
        guideline.includes("trusted-input") ||
        guideline.includes("bridge source") ||
        guideline.includes("financial actions") ||
        guideline.includes("Owner directive"),
    )).toBe(true);
    expect(typeof tools[0].renderCall).toBe("function");
    expect(typeof tools[0].renderResult).toBe("function");
    expect(commands).toEqual(["browser-setup"]);
  });
});
