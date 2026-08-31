import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));

function load(chromeRuntime?: { response?: unknown; lastError?: unknown }) {
  const sandbox: Record<string, any> = {
    setTimeout,
    document: {
      createElement: () => ({
        setAttribute: () => {},
        style: { cssText: "" },
        appendChild: () => {},
        querySelectorAll: () => [],
        addEventListener: () => {},
        remove: () => {},
        isConnected: false,
      }),
      documentElement: { appendChild: () => {} },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    window: {
      innerWidth: 800,
      innerHeight: 600,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  };
  if (chromeRuntime) {
    sandbox.chrome = {
      runtime: {
        get lastError() {
          return chromeRuntime.lastError;
        },
        sendMessage: (_payload: unknown, callback: (response: unknown) => void) => {
          queueMicrotask(() => callback(chromeRuntime.response));
        },
      },
    };
  }
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(resolve(here, "./extension/annotation.js"), "utf8"), sandbox);
  return sandbox;
}

function button(name: string, extra: Record<string, unknown> = {}) {
  const attrs: Record<string, string> = {
    "aria-label": name,
    "data-slot": "submit",
  };
  return {
    tagName: "BUTTON",
    id: "",
    className: "trigger",
    nodeType: 1,
    innerText: name,
    textContent: name,
    parentElement: {
      tagName: "DIV",
      id: "composer",
      className: "",
      children: [],
      parentElement: null,
      getAttribute: () => null,
    },
    attributes: [
      { name: "aria-label", value: name },
      { name: "data-slot", value: "submit" },
    ],
    getAttribute: (key: string) => attrs[key] ?? null,
    setAttribute: (key: string, value: string) => {
      attrs[key] = value;
    },
    getBoundingClientRect: () => ({ x: 10, y: 20, top: 20, left: 10, width: 80, height: 32 }),
    ...extra,
  };
}

describe("annotation design mode", () => {
  test("describes a control without leaking secrets in notes", () => {
    const api = load();
    const described = api.spiralDescribeElement(button("Save"), 0);
    expect(described).toMatchObject({
      id: "an-1",
      tag: "button",
      element: "button",
      name: "Save",
      slot: "submit",
    });
    expect(described.xpath).toContain("button.trigger");
    expect(api.spiralAnnotationBoundNote("use  user@example.com  for copy")).toBe("use  [identity]  for copy");
  });

  test("maps a React fiber to Cursor component fields", () => {
    const api = load();
    function Button() {}
    const element = button("480p", {
      __reactFiber$test: {
        type: Button,
        elementType: Button,
        memoizedProps: { label: "480p", disabled: false },
        return: null,
      },
    });
    const described = api.spiralDescribeElement(element, 0);
    expect(described.component).toBe("Button");
    expect(described.className).toBe("trigger");
    expect(JSON.parse(described.componentPropsJson)).toMatchObject({ label: "480p", disabled: false });
    expect(api.spiralAnnotationIdentityCards(described)).toEqual({
      element: "button",
      component: "Button",
      className: "trigger",
    });
    expect(api.spiralAnnotationOverlayFields(api.spiralAnnotationIdentityCards(described), false).map((field) => field.key)).toEqual([
      "element",
      "component",
    ]);
    expect(api.spiralAnnotationOverlayFields(api.spiralAnnotationIdentityCards(described), true).map((field) => field.key)).toEqual([
      "element",
      "component",
      "class",
    ]);
    expect(api.spiralAnnotationHoverLabelFor(element)).toBe("button · Button");
    api.spiralAnnotationSetClassVisible(true);
    expect(api.spiralAnnotationHoverLabelFor(element)).toBe("button · Button · trigger");
    expect(described.color).toBe("#3a96dd");
  });

  test("pins notes, lists them, and clears the set", () => {
    const api = load();
    const added = api.spiralAnnotationAdd(button("Save"), "make this the primary action");
    expect(added.status).toBe("added");
    expect(added.annotation.note).toBe("make this the primary action");
    expect(added.annotation.xpath).toContain("button");
    const listed = api.spiralAnnotationList();
    expect(listed.count).toBe(1);
    expect(listed.annotations[0].name).toBe("Save");
    api.spiralAnnotationAdd(button("Cancel"), "softer destructive style");
    expect(api.spiralAnnotationList().count).toBe(2);
    expect(api.spiralAnnotationList().annotations[1].color).toBe("#7c5cff");
    api.spiralAnnotationRemove("an-1");
    expect(api.spiralAnnotationList().annotations[0].id).toBe("an-1");
    expect(api.spiralAnnotationList().annotations[0].name).toBe("Cancel");
    expect(api.spiralAnnotationClear()).toMatchObject({ status: "cleared", count: 0 });
  });

  test("pins follow the element after the scroller moves", () => {
    const api = load();
    const box = { x: 10, y: 20, top: 20, left: 10, width: 80, height: 32, bottom: 52, right: 90 };
    const el = button("Save", {
      isConnected: true,
      getBoundingClientRect: () => box,
    });
    api.spiralAnnotationAdd(el, "keep");
    box.y = -200;
    box.top = -200;
    box.bottom = -168;
    const hidden = api.spiralAnnotationSync();
    expect(hidden.annotations[0].rect.y).toBe(-200);
    expect(hidden.annotations[0].visible).toBe(false);
    box.y = 140;
    box.top = 140;
    box.bottom = 172;
    const shown = api.spiralAnnotationSync();
    expect(shown.annotations[0].rect.y).toBe(140);
    expect(shown.annotations[0].visible).toBe(true);
  });

  test("outline color matches the chip badge color", () => {
    const api = load();
    const first = button("Save");
    const one = api.spiralAnnotationAdd(first, "one");
    expect(one.annotation.color).toBe("#3a96dd");
    expect(api.spiralAnnotationColorForElement(first)).toBe("#3a96dd");
    expect(api.spiralAnnotationColorForElement(button("Next"))).toBe("#7c5cff");
    const two = api.spiralAnnotationAdd(button("Cancel"), "two");
    expect(two.annotation.color).toBe("#7c5cff");
  });

  test("Option+click is armed without mode=start", () => {
    const api = load();
    expect(api.spiralAnnotationShouldPick({ altKey: true, button: 0 })).toBe(true);
    expect(api.spiralAnnotationShouldPick({ altKey: false, button: 0 })).toBe(false);
    expect(api.spiralAnnotationShouldPick({ altKey: true, button: 2 })).toBe(false);
    const added = api.spiralAnnotationPick(button("Quality"));
    expect(added.status).toBe("added");
    expect(added.annotation.note).toBe("");
    expect(added.annotation.element).toBe("button");
    api.spiralAnnotationStop();
    expect(api.spiralAnnotationShouldPick({ altKey: true, button: 0 })).toBe(false);
    api.spiralAnnotationStart();
    expect(api.spiralAnnotationShouldPick({ altKey: true, button: 0 })).toBe(true);
  });

  test("composes a sendable design-mode message", () => {
    const api = load();
    api.spiralAnnotationAdd(button("480p"), "");
    const submitted = api.spiralAnnotationSubmit("make this the primary control");
    expect(submitted.status).toBe("submitted");
    expect(submitted.message.startsWith("make this the primary control")).toBe(true);
    expect(submitted.message).not.toContain("Design mode from Chrome");
    expect(submitted.message).toContain("make this the primary control");
    expect(submitted.message).toContain("element=button");
    expect(submitted.message).toContain("component=Submit");
    expect(submitted.message).toContain("class=trigger");
    expect(submitted.message).toContain("xpath=");
    expect(api.spiralAnnotationSubmit("")).toMatchObject({ status: "submitted", count: 1 });
    api.spiralAnnotationClear();
    expect(api.spiralAnnotationSubmit("nothing selected")).toMatchObject({ status: "empty" });
  });

  test("successful send exits design mode", async () => {
    const api = load({ response: { ok: true, result: { delivered: true } } });
    api.spiralAnnotationAdd(button("Save"), "");
    expect(api.spiralAnnotationList().picking).toBe(true);
    expect(api.spiralAnnotationSubmit("fix the topbar").status).toBe("submitted");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.spiralAnnotationList()).toMatchObject({ picking: false, count: 0, prompt: "" });
  });

  test("failed send stays in design mode", async () => {
    const api = load({ response: { ok: false } });
    api.spiralAnnotationAdd(button("Save"), "");
    api.spiralAnnotationSubmit("fix the topbar");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.spiralAnnotationList().picking).toBe(true);
    expect(api.spiralAnnotationList().count).toBe(1);
  });

  test("hides a pin clipped by an inner scroller", () => {
    const api = load();
    const parent = {
      parentElement: null,
      getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 120, right: 400, x: 0, y: 0, width: 400, height: 120 }),
    };
    api.window.getComputedStyle = (element: { getBoundingClientRect?: unknown }) => (
      element === parent
        ? { overflow: "auto", overflowY: "auto", overflowX: "hidden" }
        : { overflow: "visible", overflowY: "visible", overflowX: "visible" }
    );
    const box = { x: 10, y: 200, top: 200, left: 10, width: 80, height: 32, bottom: 232, right: 90 };
    const el = button("Save", {
      isConnected: true,
      parentElement: parent,
      getBoundingClientRect: () => box,
    });
    api.spiralAnnotationAdd(el, "keep");
    const listed = api.spiralAnnotationSync();
    expect(listed.annotations[0].visible).toBe(false);
  });

  test("walks to the slotted host so the overlay shows class", () => {
    const api = load();
    const host = button("Save", { className: "clickable variant-ghost" });
    const inner = {
      tagName: "SPAN",
      id: "",
      className: "",
      nodeType: 1,
      innerText: "Save",
      textContent: "Save",
      parentElement: host,
      attributes: [],
      getAttribute: () => null,
      setAttribute: () => {},
      getBoundingClientRect: () => ({ x: 12, y: 22, top: 22, left: 12, width: 40, height: 16 }),
    };
    host.children = [inner];
    const target = api.spiralAnnotationTarget(inner);
    expect(target).toBe(host);
    expect(api.spiralAnnotationIdentityCards({
      tag: "button",
      slot: "submit",
      className: "clickable variant-ghost",
    })).toEqual({
      element: "button",
      component: "Submit",
      className: "clickable variant-ghost",
    });
    expect(api.spiralAnnotationHoverLabelFor(target)).not.toContain("variant-ghost");
    api.spiralAnnotationSetClassVisible(true);
    expect(api.spiralAnnotationHoverLabelFor(target)).toContain("variant-ghost");
    const added = api.spiralAnnotationAdd(target, "");
    expect(added.annotation.className).toContain("variant-ghost");
    expect(api.spiralAnnotationChipLabel(added.annotation)).toContain("variant-ghost");
  });

  test("source exits design mode after a delivered send", () => {
    const source = readFileSync(resolve(here, "./extension/annotation.js"), "utf8");
    expect(source).toContain("spiralAnnotationFinish");
    expect(source).toContain("Sent to the agent");
    const worker = readFileSync(resolve(here, "./extension/worker.js"), "utf8");
    expect(worker).toContain("if (!port) connect()");
  });

  test("caps the annotation set", () => {
    const api = load();
    for (let index = 0; index < 24; index += 1) {
      api.spiralAnnotationAdd(button(`B${index}`), `note ${index}`);
    }
    expect(() => api.spiralAnnotationAdd(button("overflow"), "too many")).toThrow("annotation_limit");
  });

  test("calculates 4px modulus discipline and smart CSS selectors in annotation extra", () => {
    const api = load();
    const target = button("Confirm", {
      getBoundingClientRect: () => ({ x: 0, y: 0, top: 0, left: 0, width: 96, height: 40 }),
    });
    const described = api.spiralDescribeElement(target, 0);
    const extra = JSON.parse(described.extra);
    expect(extra.selector).toBe("button[data-slot=\"submit\"]");
    expect(extra.token_discipline).toEqual({
      modulus_4px_width: true,
      modulus_4px_height: true,
      touch_target_accessible: true,
    });
  });
});
