import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));

function load() {
  const sandbox: Record<string, any> = { setTimeout, Event, globalThis: {} };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(resolve(here, "./extension/long-capture.js"), "utf8"), sandbox);
  return sandbox;
}

function bound(raw: string, max = 100000) {
  return String(raw ?? "").slice(0, max);
}

function record(tag: string, text: string, extra: Record<string, unknown> = {}) {
  return { tagName: tag.toUpperCase(), innerText: text, textContent: text, children: [], getAttribute: () => null, ...extra };
}

describe("long capture", () => {
  test("prefers an infinite chat scroller over the document", () => {
    const api = load();
    const chat = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history-scroll-container",
      clientHeight: 400,
      scrollHeight: 4_000,
      children: [],
    };
    const doc = {
      scrollingElement: { tagName: "HTML", clientHeight: 800, scrollHeight: 800, children: [] },
      documentElement: { tagName: "HTML", clientHeight: 800, scrollHeight: 800, children: [] },
      querySelectorAll: () => [chat],
    };
    const win = {
      document: doc,
      getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }),
    };
    const scroller = api.spiralPrimaryScroller(doc, win);
    expect(scroller).toBe(chat);
    expect(api.spiralScrollerVirtualized(chat, win)).toBe(true);
    expect(api.spiralShouldLongRead(undefined, chat, win)).toBe(true);
    expect(api.spiralShouldLongRead(false, chat, win)).toBe(false);
  });

  test("sweeps virtualized turns, restores scroll, and flags load errors", async () => {
    const api = load();
    const turns = [
      record("user-query", "first turn"),
      record("model-response", "first answer"),
      record("user-query", "later turn"),
      record("model-response", "later answer"),
    ];
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 200,
      scrollHeight: 800,
      scrollTop: 400,
      children: turns,
      querySelectorAll() {
        const index = Math.min(turns.length - 1, Math.floor(Number(this.scrollTop) / 200));
        return [turns[index]];
      },
    };
    const doc = {
      body: { innerText: "无法连接\n重新加载\n", textContent: "无法连接\n重新加载\n" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.capture_mode).toBe("conversation");
    expect(result.text).toContain("first turn");
    expect(result.text).toContain("later answer");
    expect(result.records).toBe(4);
    expect(result.turns.map((turn) => turn.role)).toEqual(["user", "model", "user", "model"]);
    expect(result.load_error).toBe(true);
    expect(result.complete).toBe(false);
    expect(scroller.scrollTop).toBe(400);
  });

  test("stops when the scroller reaches the bottom, not after a timed settle", async () => {
    const api = load();
    const turns = [
      record("user-query", "alpha"),
      record("user-query", "beta"),
      record("user-query", "gamma"),
    ];
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      children: turns,
      querySelectorAll() {
        const index = Math.min(turns.length - 1, Math.floor(Number(this.scrollTop) / 100));
        return [turns[index]];
      },
    };
    const doc = {
      body: { innerText: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.text).toContain("alpha");
    expect(result.text).toContain("gamma");
    expect(result.records).toBe(3);
    expect(result.complete).toBe(true);
    expect(result.steps).toBeLessThan(20);
  });

  test("stays at the top while scrollHeight grows before sweeping down", async () => {
    const api = load();
    const oldest = record("user-query", "oldest turn");
    const newest = record("user-query", "newest turn");
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 100,
      scrollHeight: 200,
      scrollTop: 100,
      querySelectorAll() {
        if (this.scrollHeight >= 400 && Number(this.scrollTop) <= 1) return [oldest];
        if (Number(this.scrollTop) >= 200) return [newest];
        return [newest];
      },
    };
    const doc = {
      body: { innerText: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {
        if (Number(scroller.scrollTop) <= 1 && scroller.scrollHeight < 400) scroller.scrollHeight += 100;
      },
    });
    expect(result.text).toContain("oldest turn");
    expect(result.text).toContain("newest turn");
  });

  test("does not let the document root steal turns from an inner chat scroller", () => {
    const api = load();
    const turn = record("user-query", "hello");
    const chat = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 400,
      scrollHeight: 4_000,
      children: [],
      querySelectorAll: () => [turn],
    };
    const html = {
      tagName: "HTML",
      className: "",
      clientHeight: 800,
      scrollHeight: 800,
      children: [],
      querySelectorAll: () => [turn],
    };
    const doc = {
      scrollingElement: html,
      documentElement: html,
      querySelectorAll: () => [chat],
    };
    const win = {
      document: doc,
      getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }),
    };
    expect(api.spiralPrimaryScroller(doc, win)).toBe(chat);
  });

  test("prefers the chat-history scroller that holds turns over a sidenav scroller", () => {
    const api = load();
    const sidenav = {
      tagName: "INFINITE-SCROLLER",
      className: "conversations-list",
      clientHeight: 800,
      scrollHeight: 8_000,
      children: [],
      querySelectorAll: () => [],
    };
    const chat = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history enable-lm-fast-follows",
      clientHeight: 800,
      scrollHeight: 4_000,
      children: [],
      querySelectorAll: (selector: string) => (String(selector).includes("user-query") ? [record("user-query", "hello")] : []),
    };
    const doc = {
      scrollingElement: { tagName: "HTML", clientHeight: 800, scrollHeight: 800, children: [] },
      documentElement: { tagName: "HTML", clientHeight: 800, scrollHeight: 800, children: [] },
      querySelectorAll: () => [sidenav, chat],
    };
    const win = {
      document: doc,
      getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }),
    };
    expect(api.spiralPrimaryScroller(doc, win)).toBe(chat);
    expect(api.spiralConversationCount(chat)).toBe(1);
    expect(api.spiralConversationCount(sidenav)).toBe(0);
  });

  test("snapshot-only when long is false", () => {
    const api = load();
    const scroller = { tagName: "INFINITE-SCROLLER", className: "chat-history", clientHeight: 200, scrollHeight: 2000, children: [] };
    expect(api.spiralShouldLongRead(false, scroller, {})).toBe(false);
  });

  test("does not re-read innerText of already harvested nodes", async () => {
    const api = load();
    let reads = 0;
    const counted = (tag: string, text: string) => ({
      tagName: tag.toUpperCase(),
      children: [],
      get textContent() {
        reads += 1;
        return text;
      },
    });
    const first = counted("user-query", "first turn");
    const later = counted("user-query", "later turn");
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      querySelectorAll() {
        return Number(this.scrollTop) < 100 ? [first] : [first, later];
      },
    };
    const doc = {
      body: { innerText: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.text).toContain("first turn");
    expect(result.text).toContain("later turn");
    expect(reads).toBe(2);
  });

  test("skips nested article turns inside a model response", async () => {
    const api = load();
    const inner = record("article", "inner quote");
    const outer = record("model-response", "outer answer inner quote", {
      contains: (node: unknown) => node === inner,
    });
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 200,
      scrollHeight: 200,
      scrollTop: 0,
      querySelectorAll: () => [outer, inner],
    };
    const doc = {
      body: { innerText: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.turns.map((turn: { role: string }) => turn.role)).toEqual(["model"]);
    expect(result.records).toBe(1);
    expect(result.text).toContain("outer answer");
  });

  test("never harvests document turns when an inner chat scroller exists", async () => {
    const api = load();
    const sidebar = record("user-query", "sidebar other chat");
    const chatTurn = record("user-query", "real turn");
    const chat = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      querySelectorAll: () => [chatTurn],
    };
    const html = {
      tagName: "HTML",
      className: "",
      clientHeight: 800,
      scrollHeight: 800,
      querySelectorAll: () => [sidebar, chatTurn],
    };
    const doc = {
      body: { innerText: "" },
      documentElement: html,
      scrollingElement: html,
      querySelectorAll: () => [chat],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller: chat,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.text).toContain("real turn");
    expect(result.text).not.toContain("sidebar other chat");
  });

  test("maps data-message-author-role to user and model", async () => {
    const api = load();
    const user = record("DIV", "hello from the user", {
      getAttribute: (name: string) => (name === "data-message-author-role" ? "user" : null),
    });
    const model = record("DIV", "hello from the model", {
      getAttribute: (name: string) => (name === "data-message-author-role" ? "assistant" : null),
    });
    expect(api.spiralTurnRole(user)).toBe("user");
    expect(api.spiralTurnRole(model)).toBe("model");
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 200,
      scrollHeight: 200,
      scrollTop: 0,
      querySelectorAll: () => [user, model],
    };
    const doc = {
      body: { innerText: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.turns.map((turn: { role: string }) => turn.role)).toEqual(["user", "model"]);
  });

  test("wakes a hidden document without changing visibility of the host tab", () => {
    const api = load();
    const doc: Record<string, unknown> = { hidden: true, visibilityState: "hidden", events: [] as string[] };
    doc.dispatchEvent = (event: { type?: string }) => {
      (doc.events as string[]).push(String(event?.type || ""));
      return true;
    };
    const win = { events: [] as string[], dispatchEvent: (event: { type?: string }) => {
      (win.events as string[]).push(String(event?.type || ""));
      return true;
    } };
    expect(api.spiralWakeDocument(doc, win)).toBe(true);
    expect(doc.hidden).toBe(false);
    expect(doc.visibilityState).toBe("visible");
    expect(doc.events).toContain("visibilitychange");
  });

  test("collapses doubled Gemini user-query text", () => {
    const api = load();
    expect(api.spiralCompactTurnText("你说 所以内核我们应该基于pi？ 所以内核我们应该基于pi？"))
      .toBe("你说 所以内核我们应该基于pi？");
    expect(api.spiralCompactTurnText("You said hello world hello world")).toBe("You said hello world");
  });

  test("keeps the newest turns when the text budget is tight", async () => {
    const api = load();
    const oldest = record("user-query", `ancient ${"x".repeat(400)}`);
    const newest = record("user-query", "tuango is the product name");
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      querySelectorAll() {
        return Number(this.scrollTop) < 100 ? [oldest] : [newest];
      },
    };
    const doc = {
      body: { innerText: "", textContent: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 80,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.text).toContain("tuango is the product name");
    expect(result.turns[result.turns.length - 1].text).toContain("tuango is the product name");
    expect(result.truncated).toBe(true);
  });

  test("keeps later user turns after a huge model reply fills the text budget", async () => {
    const api = load();
    const model = record("model-response", "M".repeat(20_000));
    const later = record("user-query", "after the essay");
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 200,
      scrollHeight: 200,
      scrollTop: 0,
      querySelectorAll: () => [model, later],
    };
    const doc = {
      body: { innerText: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 800,
      settleMs: 0,
      wait: async () => {},
    });
    expect(result.turns.map((turn: { role: string }) => turn.role)).toEqual(["model", "user"]);
    expect(result.turns[1].text).toContain("after the essay");
    expect(result.turns[0].text.length).toBeLessThanOrEqual(1_800);
    expect(result.truncated).toBe(true);
    expect(result.complete).toBe(true);
  });

  test("hidden documents skip timer waits and still sweep", async () => {
    const api = load();
    const turns = [
      record("user-query", "hidden first"),
      record("user-query", "hidden last"),
    ];
    const scroller = {
      tagName: "INFINITE-SCROLLER",
      className: "chat-history",
      clientHeight: 100,
      scrollHeight: 200,
      scrollTop: 0,
      querySelectorAll() {
        const index = Math.min(turns.length - 1, Math.floor(Number(this.scrollTop) / 100));
        return [turns[index]];
      },
    };
    const doc = {
      hidden: true,
      body: { textContent: "" },
      documentElement: {},
      scrollingElement: scroller,
      querySelectorAll: () => [scroller],
    };
    const started = Date.now();
    const result = await api.spiralLongRead({
      document: doc,
      window: { document: doc, getComputedStyle: () => ({ overflowY: "auto", overflow: "auto" }) },
      scroller,
      boundPublicText: bound,
      maxChars: 20000,
      settleMs: 0,
    });
    expect(Date.now() - started).toBeLessThan(200);
    expect(result.text).toContain("hidden first");
    expect(result.text).toContain("hidden last");
    expect(result.scroller.hidden).toBe(true);
    expect(result.complete).toBe(true);
  });

  test("waitScroll stays until scrollTop matches the request", async () => {
    const api = load();
    const scroller: Record<string, unknown> = {
      clientHeight: 100,
      scrollHeight: 400,
      _top: 0,
      _requested: 0,
    };
    Object.defineProperty(scroller, "scrollTop", {
      get() { return Number(scroller._top) || 0; },
      set(value: number) { scroller._requested = value; },
    });
    let frames = 0;
    const geo = await api.spiralWaitScroll(scroller, 200, async () => {
      frames += 1;
      if (frames >= 3) scroller._top = scroller._requested;
    }, 1000);
    expect(geo.top).toBe(200);
    expect(frames).toBeGreaterThanOrEqual(3);
  });
});
