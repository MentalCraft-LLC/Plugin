import { describe, expect, test } from "bun:test";
import { CHROME_ACTIONS, CHROME_INPUT_SCHEMA } from "./mcp-server.ts";
import { BrowserContextInput } from "./operation.ts";

describe("Extension Upgrades & DevTools Superpowers", () => {
  test("CHROME_ACTIONS includes emulate and all core capabilities", () => {
    expect(CHROME_ACTIONS).toContain("emulate");
    expect(CHROME_ACTIONS).toContain("click");
    expect(CHROME_ACTIONS).toContain("hover");
    expect(CHROME_ACTIONS).toContain("inspect_element");
    expect(CHROME_ACTIONS).toContain("evaluate_script");
    expect(CHROME_ACTIONS).toContain("wait_for");
    expect(CHROME_ACTIONS).toContain("capture_screenshot");
  });

  test("CHROME_INPUT_SCHEMA supports selector, script up to 50k, emulation and smart wait parameters", () => {
    const props = CHROME_INPUT_SCHEMA.properties as Record<string, { type: string; maxLength?: number; enum?: string[] }>;
    expect(props.selector).toBeDefined();
    expect(props.selector.type).toBe("string");
    expect(props.script.maxLength).toBe(50000);
    expect(props.width).toBeDefined();
    expect(props.height).toBeDefined();
    expect(props.color_scheme).toBeDefined();
    expect(props.color_scheme.enum).toEqual(["dark", "light", "no-preference"]);
    expect(props.condition).toBeDefined();
    expect(props.condition.enum).toEqual(["visible", "hidden", "text", "network_idle", "attached"]);
    expect(props.text).toBeDefined();
    expect(props.session_name).toBeDefined();
    expect(props.session_name.type).toBe("string");
    expect(props.tab_group_name).toBeDefined();
    expect(props.tab_group_name.type).toBe("string");
  });

  test("BrowserContextInput and CHROME_INPUT_SCHEMA support session_name and tab_group_name", () => {
    const input: BrowserContextInput = {
      action: "open",
      url: "https://example.com",
      session_name: "test-session",
      tab_group_name: "test-session",
    };
    expect(input.session_name).toBe("test-session");
    expect(input.tab_group_name).toBe("test-session");
  });

  test("BrowserContextInput permits selector without name for click, fill, press_enter, select_combobox", () => {
    const clickWithSelector: BrowserContextInput = {
      action: "click",
      selector: "button.submit-button[data-slot='confirm']",
    };
    expect(clickWithSelector.selector).toBe("button.submit-button[data-slot='confirm']");

    const fillWithSelector: BrowserContextInput = {
      action: "fill_public",
      selector: "input[type='search']",
      value: "hello world",
    };
    expect(fillWithSelector.selector).toBe("input[type='search']");

    const enterWithSelector: BrowserContextInput = {
      action: "press_enter",
      selector: "form input",
    };
    expect(enterWithSelector.selector).toBe("form input");

    const comboboxWithSelector: BrowserContextInput = {
      action: "select_combobox",
      selector: "#region-select",
      value: "Asia",
    };
    expect(comboboxWithSelector.selector).toBe("#region-select");
  });

  test("BrowserContextInput supports emulate parameters", () => {
    const emulateMobileDark: BrowserContextInput = {
      action: "emulate",
      width: 375,
      height: 812,
      mobile: true,
      color_scheme: "dark",
      device_scale_factor: 3,
    };
    expect(emulateMobileDark.width).toBe(375);
    expect(emulateMobileDark.height).toBe(812);
    expect(emulateMobileDark.color_scheme).toBe("dark");
    expect(emulateMobileDark.mobile).toBe(true);
  });

  test("BrowserContextInput supports wait_for smart conditions", () => {
    const waitForNetworkIdle: BrowserContextInput = {
      action: "wait_for",
      condition: "network_idle",
      timeout_ms: 10000,
    };
    expect(waitForNetworkIdle.condition).toBe("network_idle");

    const waitForSelectorVisible: BrowserContextInput = {
      action: "wait_for",
      selector: ".modal-dialog",
      condition: "visible",
      timeout_ms: 3000,
    };
    expect(waitForSelectorVisible.selector).toBe(".modal-dialog");

    const waitForTextContains: BrowserContextInput = {
      action: "wait_for",
      text: "Operation Completed",
      condition: "text",
    };
    expect(waitForTextContains.text).toBe("Operation Completed");
  });

  test("BrowserContextInput supports inspect_element with selector or field", () => {
    const inspectBySelector: BrowserContextInput = {
      action: "inspect_element",
      selector: "#main-cta",
    };
    expect(inspectBySelector.selector).toBe("#main-cta");

    const inspectByField: BrowserContextInput = {
      action: "inspect_element",
      field: "Submit",
      role: "button",
    };
    expect(inspectByField.field).toBe("Submit");
    expect(inspectByField.role).toBe("button");
  });

  test("BrowserContextInput supports scroll positions and press_key modifiers", () => {
    const scrollBottom: BrowserContextInput = {
      action: "scroll",
      position: "bottom",
    };
    expect(scrollBottom.position).toBe("bottom");

    const scrollElement: BrowserContextInput = {
      action: "scroll",
      selector: "#target-section",
    };
    expect(scrollElement.selector).toBe("#target-section");

    const keyCombo: BrowserContextInput = {
      action: "press_key",
      key: "Enter",
      modifiers: ["Control", "Shift"],
      selector: "input.search",
    };
    expect(keyCombo.key).toBe("Enter");
    expect(keyCombo.modifiers).toEqual(["Control", "Shift"]);
    expect(keyCombo.selector).toBe("input.search");
  });

  test("BrowserContextInput supports drag_and_drop and upload_file", () => {
    const dragAction: BrowserContextInput = {
      action: "drag_and_drop",
      source_selector: ".kanban-card[data-id='c-1']",
      target_selector: ".kanban-column[data-status='done']",
    };
    expect(dragAction.source_selector).toBe(".kanban-card[data-id='c-1']");
    expect(dragAction.target_selector).toBe(".kanban-column[data-status='done']");

    const uploadAction: BrowserContextInput = {
      action: "upload_file",
      selector: "input[type='file']",
      file_name: "test-data.json",
      file_content: '{"hello": "world"}',
      file_type: "application/json",
    };
    expect(uploadAction.selector).toBe("input[type='file']");
    expect(uploadAction.file_name).toBe("test-data.json");
    expect(uploadAction.file_content).toBe('{"hello": "world"}');
  });

  test("BrowserContextInput supports set_storage and storage_type", () => {
    const setStorageAction: BrowserContextInput = {
      action: "set_storage",
      key: "theme_preference",
      value: "dark",
      storage_type: "local",
    };
    expect(setStorageAction.action).toBe("set_storage");
    expect(setStorageAction.key).toBe("theme_preference");
    expect(setStorageAction.value).toBe("dark");
    expect(setStorageAction.storage_type).toBe("local");

    const readStorageAction: BrowserContextInput = {
      action: "read_storage",
      key: "auth_token",
      storage_type: "session",
    };
    expect(readStorageAction.key).toBe("auth_token");
    expect(readStorageAction.storage_type).toBe("session");
  });
});
