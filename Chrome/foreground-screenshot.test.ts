import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));

function fixture(
  grant: Record<string, unknown>,
  active: Record<string, unknown>,
  options: { documentHeight?: number; viewportHeight?: number; switchAfter?: number } = {},
) {
  const calls: string[] = [];
  let captures = 0;
  class FakeCanvas {
    width: number;
    height: number;
    context = { fillStyle: "", fillRect: () => {}, drawImage: () => {} };
    constructor(width: number, height: number) { this.width = width; this.height = height; }
    getContext() { return this.context; }
    async convertToBlob() { return new Blob(["bounded-jpeg"], { type: "image/jpeg" }); }
  }
  const viewportHeight = options.viewportHeight ?? 800;
  const documentHeight = options.documentHeight ?? 1_800;
  const sandbox: Record<string, any> = {
    URL,
    Blob,
    Uint8Array,
    OffscreenCanvas: FakeCanvas,
    btoa: (value: string) => Buffer.from(value, "binary").toString("base64"),
    fetch: async () => ({ ok: true, blob: async () => new Blob(["tile"], { type: "image/jpeg" }) }),
    createImageBitmap: async () => ({ width: 1_000, height: viewportHeight, close: () => {} }),
    chrome: {
      storage: { session: { get: async () => ({ foregroundScreenshotGrant: grant }) } },
      tabs: {
        query: async () => {
          if (options.switchAfter !== undefined && captures >= options.switchAfter) return [{ ...active, id: 99 }];
          return [active];
        },
        sendMessage: async (_tabId: number, message: Record<string, any>) => {
          calls.push(String(message.action));
          if (message.action === "screenshot_metrics") {
            return { ok: true, result: { viewport_height: viewportHeight, document_height: documentHeight } };
          }
          if (message.action === "screenshot_scroll") {
            return { ok: true, result: { scroll_y: message.y, document_height: documentHeight } };
          }
          if (message.action === "screenshot_restore") return { ok: true, result: { status: "restored" } };
          return { ok: false, error: "unexpected_action" };
        },
        captureVisibleTab: async () => {
          captures += 1;
          return "data:image/jpeg;base64,dGlsZQ==";
        },
      },
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(resolve(here, "./extension/foreground-screenshot.js"), "utf8"), sandbox);
  return {
    capture: sandbox.spiralCaptureForegroundScreenshot as (url: string, confirmed: boolean) => Promise<Record<string, unknown>>,
    calls,
    captures: () => captures,
  };
}

describe("foreground full-page screenshot path", () => {
  test("tiles, stitches and restores an explicitly granted active normal-web tab", async () => {
    const flow = fixture(
      { tab_id: 7, origin: "https://example.com", pathname: "/", granted_at: Date.now() },
      { id: 7, url: "https://example.com/", windowId: 3 },
    );
    const result = await flow.capture("https://example.com/", true);
    expect(result).toMatchObject({
      status: "captured",
      capture_mode: "full_page",
      document_height: 1_800,
      captured_height: 1_800,
      output_width: 1_000,
      output_height: 1_800,
      tile_count: 3,
      truncated: false,
      tab_active: true,
      focus_changed: false,
      popup_opened: false,
    });
    expect(String(result.data_url)).toStartWith("data:image/jpeg;base64,");
    expect(flow.captures()).toBe(3);
    expect(flow.calls.filter((value) => value === "screenshot_scroll")).toHaveLength(3);
    expect(flow.calls.at(-1)).toBe("screenshot_restore");
  });

  test("fails closed without explicit foreground confirmation or grant", async () => {
    const flow = fixture({}, { id: 7, url: "https://example.com/", windowId: 3 });
    await expect(flow.capture("https://example.com/", false)).rejects.toThrow("confirmation_required");
    await expect(flow.capture("https://example.com/", true)).rejects.toThrow("grant_missing");
  });

  test("aborts and restores when the active target changes during tiling", async () => {
    const flow = fixture(
      { tab_id: 7, origin: "https://example.com", pathname: "/", granted_at: Date.now() },
      { id: 7, url: "https://example.com/", windowId: 3 },
      { switchAfter: 1 },
    );
    await expect(flow.capture("https://example.com/", true)).rejects.toThrow("no_longer_active");
    expect(flow.calls.at(-1)).toBe("screenshot_restore");
  });
});
