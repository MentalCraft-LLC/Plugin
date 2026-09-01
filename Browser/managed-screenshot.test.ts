import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const jpeg = Buffer.from("viewport-jpeg").toString("base64");

function fixture(tab: Record<string, unknown>, options: { alreadyAttached?: boolean; empty?: boolean; documentHeight?: number; viewportHeight?: number; grow?: number } = {}) {
  const calls: string[] = [];
  const viewportHeight = options.viewportHeight ?? 800;
  const documentHeight = options.documentHeight ?? 1_800;
  class FakeCanvas {
    width: number;
    height: number;
    context = { fillStyle: "", fillRect: () => {}, drawImage: () => {} };
    constructor(width: number, height: number) { this.width = width; this.height = height; }
    getContext() { return this.context; }
    async convertToBlob() { return new Blob(["bounded-jpeg"], { type: "image/jpeg" }); }
  }
  const sandbox: Record<string, any> = {
    URL,
    setTimeout,
    Blob,
    Uint8Array,
    OffscreenCanvas: FakeCanvas,
    btoa: (value: string) => Buffer.from(value, "binary").toString("base64"),
    fetch: async () => ({ ok: true, blob: async () => new Blob(["tile"], { type: "image/jpeg" }) }),
    createImageBitmap: async () => ({ width: 1_000, height: viewportHeight, close: () => {} }),
    chrome: {
      tabs: {
        get: async () => tab,
        query: async () => [{ id: 8 }],
        update: async () => { calls.push("tabs.update"); },
        sendMessage: async (_tabId: number, message: Record<string, any>) => {
          calls.push(String(message.action));
          if (message.action === "screenshot_metrics") {
            return { ok: true, result: { viewport_height: viewportHeight, document_height: documentHeight } };
          }
          if (message.action === "screenshot_scroll") {
            const grown = options.grow && calls.filter((value) => value === "screenshot_scroll").length === 1
              ? documentHeight + options.grow
              : documentHeight + (options.grow && message.y > 0 ? options.grow : 0);
            return { ok: true, result: { scroll_y: message.y, document_height: grown || documentHeight } };
          }
          if (message.action === "screenshot_restore") return { ok: true, result: { status: "restored" } };
          return { ok: false, error: "unexpected_action" };
        },
        captureVisibleTab: async () => {
          calls.push("captureVisibleTab");
          return `data:image/jpeg;base64,${jpeg}`;
        },
      },
      windows: {
        getLastFocused: async () => ({ id: 1 }),
      },
      debugger: {
        attach: async () => {
          calls.push("attach");
          if (options.alreadyAttached) throw new Error("Another debugger is already attached");
        },
        detach: async () => { calls.push("detach"); },
        sendCommand: async (_target: unknown, method: string) => {
          calls.push(method);
          if (method !== "Page.captureScreenshot") throw new Error(`unexpected ${method}`);
          if (options.empty) return { data: "" };
          return { data: jpeg };
        },
      },
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(resolve(here, "./extension/managed-screenshot.js"), "utf8"), sandbox);
  return {
    capture: sandbox.spiralCaptureManagedScreenshot as (tabId: number, url: string) => Promise<Record<string, unknown>>,
    captureLong: sandbox.spiralCaptureManagedLongScreenshot as (tabId: number, url: string) => Promise<Record<string, unknown>>,
    calls,
  };
}

describe("managed inactive-tab screenshot path", () => {
  test("captures an already-visible managed tab without attaching the debugger", async () => {
    const flow = fixture({
      id: 7,
      url: "http://127.0.0.1:5173/composite/sequence/carousel",
      active: true,
      windowId: 1,
    });
    const result = await flow.capture(7, "http://127.0.0.1:5173/composite/sequence/carousel");
    expect(result).toMatchObject({
      status: "captured",
      capture_mode: "viewport",
      tab_active: true,
      focus_changed: false,
      popup_opened: false,
    });
    expect(String(result.data_url)).toBe(`data:image/jpeg;base64,${jpeg}`);
    expect(flow.calls).toEqual(["captureVisibleTab"]);
  });

  test("captures an inactive managed tab through Page.captureScreenshot without activating it", async () => {
    const flow = fixture({ id: 7, url: "http://127.0.0.1:5173/composite/sequence/carousel", active: false, windowId: 1 });
    const result = await flow.capture(7, "http://127.0.0.1:5173/composite/sequence/carousel");
    expect(result).toMatchObject({
      status: "captured",
      capture_mode: "viewport",
      tab_active: false,
      focus_changed: false,
      popup_opened: false,
    });
    expect(String(result.data_url)).toBe(`data:image/jpeg;base64,${jpeg}`);
    expect(flow.calls).toEqual(["attach", "Page.captureScreenshot", "detach"]);
  });

  test("fails closed on origin mismatch and empty payloads", async () => {
    const mismatch = fixture({ id: 7, url: "https://example.com/other", active: false });
    await expect(mismatch.capture(7, "https://example.com/app")).rejects.toThrow("screenshot_target_mismatch");
    const empty = fixture({ id: 7, url: "https://example.com/app", active: false, windowId: 1 }, { empty: true });
    await expect(empty.capture(7, "https://example.com/app")).rejects.toThrow("screenshot_capture_empty");
  });

  test("long capture tiles the primary scroller and restores it", async () => {
    const flow = fixture({
      id: 7,
      url: "https://gemini.google.com/app/thread",
      active: true,
      windowId: 1,
    });
    const result = await flow.captureLong(7, "https://gemini.google.com/app/thread");
    expect(result).toMatchObject({
      status: "captured",
      capture_mode: "long",
      truncated: false,
      tab_active: true,
    });
    expect(Number(result.tile_count)).toBeGreaterThan(1);
    expect(flow.calls.filter((value) => value === "screenshot_scroll").length).toBeGreaterThan(1);
    expect(flow.calls).toContain("screenshot_restore");
  });

  test("extends tiles when the conversation scroller grows during capture", async () => {
    const flow = fixture({
      id: 7,
      url: "https://gemini.google.com/app/thread",
      active: true,
      windowId: 1,
    }, { documentHeight: 800, viewportHeight: 800, grow: 800 });
    const result = await flow.captureLong(7, "https://gemini.google.com/app/thread");
    expect(result).toMatchObject({
      status: "captured",
      capture_mode: "long",
    });
    expect(Number(result.tile_count)).toBeGreaterThan(1);
    expect(Number(result.document_height)).toBe(1_600);
  });
});
