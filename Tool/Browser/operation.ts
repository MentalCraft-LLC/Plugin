import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { requiresFinancialConfirmation } from "./modules/finance.ts";
import {
  BrowserClient,
  DEFAULT_TARGET_POLICY,
  PROTOCOL,
  SOCKET_PATH,
  capabilityAllowed,
  authorityRoute,
  installBrowserBridge,
  loadAuthority,
  safeBrowserUrl,
  safeControlName,
  safeForegroundUrl,
  safePublicMultiline,
  safePublicValue,
  type BrowserAuthority,
  type BrowserCommand,
} from "./core.ts";
import { acquireChromeOsLease } from "./os-lease.ts";
import {
  runLighthouseAudit,
  analyzePerformanceTrace,
  analyzeHeapMemory,
  analyzeNetworkWaterfall,
  auditSecurityAndConsole,
  resolveEmulationProfile,
  buildAccessibilityTree,
} from "./modules/devtools.ts";
import {
  smartHealSelector,
  analyzeVisualRegression,
  synthesizeUserJourney,
  manageSessionVault,
  monitorInteractionVitals,
} from "./modules/intelligence.ts";
import {
  auditAccessibilityPersonas,
  extractStructuredData,
  simulateChaosResilience,
  orchestrateBatchTabs,
} from "./modules/resilience.ts";
import { interceptNetworkRequests, replayHarWaterfall } from "./modules/network_mock.ts";
import { diagnoseWebVitalsRadar } from "./modules/web_vitals_radar.ts";
import { generateStealthProfile } from "./modules/stealth.ts";
import { predictVisualAttention } from "./modules/saliency.ts";
import { synthesizeE2eTestSuite } from "./modules/e2e_codegen.ts";
import { traceMemoryLeaks } from "./modules/memory_tracer.ts";
import { auditResponsiveMatrix } from "./modules/responsive_matrix.ts";
import { auditSecuritySandbox } from "./modules/security_sandbox.ts";
import { profileDomRaceConditions } from "./modules/dom_race.ts";
import { evaluateLighthouseCiBudget } from "./modules/lighthouse_budget.ts";

export type BrowserContextInput = {
  action: "status" | "repair" | "hot_reload" | "reload_page" | "open" | "controls" | "read_text" | "read_markdown" | "read_styles" | "read_scripts" | "disassemble" | "read_console" | "read_network" | "read_storage" | "set_storage" | "clear_storage" | "read_cookies" | "clear_cookies" | "performance_metrics" | "wait_for" | "inspect_element" | "evaluate_script" | "click" | "hover" | "scroll" | "press_key" | "drag_and_drop" | "upload_file" | "fill_public" | "fill_form" | "fill_local" | "press_enter" | "select_combobox" | "cdp_click" | "cdp_scroll" | "cdp_hover" | "cdp_key" | "capture_ga4_measurement_id" | "capture_clarity_token" | "capture_session" | "capture_screenshot" | "capture_video" | "record_video" | "capture_pdf" | "semantic_snapshot" | "annotate" | "emulate" | "lighthouse_audit" | "performance_trace" | "heap_analysis" | "network_waterfall" | "security_audit" | "emulate_profile" | "accessibility_tree" | "smart_selector_heal" | "visual_regression_diff" | "journey_record_and_replay" | "session_isolation_vault" | "inp_interaction_vitals" | "persona_emulation" | "extract_structured_data" | "chaos_resilience_test" | "batch_tab_orchestration" | "network_mock_interceptor" | "har_replay_mock" | "web_vitals_radar" | "stealth_profile_guard" | "attention_heatmap_predict" | "e2e_spec_generator" | "memory_leak_tracer" | "responsive_matrix_linter" | "security_sandbox_audit" | "dom_race_profiler" | "lighthouse_ci_budget";
  mode?: "start" | "stop" | "list" | "add" | "remove" | "clear";
  url?: string;
  max_sections?: number;
  role?: "button" | "link" | "menuitem" | "option" | "tab" | "combobox" | "textbox" | "checkbox" | "radio" | "switch";
  name?: string;
  screen_x?: number;
  screen_y?: number;
  client_x?: number;
  client_y?: number;
  delta_x?: number;
  delta_y?: number;
  key?: string;
  max_chars?: number;
  /** Semantic-snapshot element budget (default 60). */
  max_elements?: number;
  /** Internal-only; absent from the chrome Tool schema. */
  readTextMode?: "advisor_reply";
  context?: "dialog" | "form" | "main" | "header" | "navigation" | "page";
  field?: string;
  value?: string;
  entries?: Record<string, string>;
  script?: string;
  selector?: string;
  timeout_ms?: number;
  level?: "info" | "warn" | "error";
  bypass_cache?: boolean;
  /** Internal-only; absent from the chrome Tool schema. */
  publicTextMode?: "advisor_prompt";
  route?: string;
  source?: "ga4_service_account" | "clarity_domain" | "clarity_project_name" | "gsc_service_account";
  foregroundConfirmed?: boolean;
  ownerConfirmed?: boolean;
  long?: boolean;
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
  categories?: ("performance" | "accessibility" | "best_practices" | "seo" | "pwa")[];
  form_factor?: "mobile" | "desktop";
  device_preset?: "iphone_15_pro" | "pixel_8" | "ipad_pro" | "desktop_4k" | "laptop_1080p" | "galaxy_s24";
  network_throttle?: "offline" | "slow_3g" | "fast_3g" | "4g" | "wifi" | "custom";
  cpu_throttling_rate?: 1 | 2 | 4 | 6;
  reduced_motion?: "reduce" | "no-preference";
  geolocation?: { latitude: number; longitude: number; accuracy: number };
  timezone_id?: string;
  locale?: string;
  baseline_url?: string;
  tolerance_percentage?: number;
  data_testid?: string;
  parent_container_selector?: string;
  tag_name?: string;
  accessible_name?: string;
  journey_name?: string;
  steps?: Array<{
    step: number;
    type: "navigate" | "click" | "fill" | "hover" | "press_key" | "assert_text" | "assert_visible" | "wait_for";
    selector?: string;
    url?: string;
    value?: string;
    key?: string;
    expectedText?: string;
    timeoutMs?: number;
    description: string;
  }>;
  profile_id?: string;
  cookies?: Array<{ name: string; value: string; domain: string; path: string; secure: boolean; httpOnly: boolean }>;
  local_storage?: Record<string, string>;
  session_storage?: Record<string, string>;
  persona_id?: "screen_reader_blind" | "low_vision_high_contrast" | "motor_impaired_keyboard_only" | "cognitive_overload_distraction_free" | "international_rtl_reader";
  chaos_scenario?: "flaky_api_intermittent_500" | "extreme_latency_spike_5000ms" | "offline_disconnect_recovery" | "packet_loss_50_percent" | "rate_limit_429_backoff";
  urls?: string[];
  concurrency_pool_size?: number;
};

export type BrowserOperationContext = {
  isProjectTrusted(): boolean;
};

export type BrowserContextOperation = (
  params: BrowserContextInput,
  signal?: AbortSignal,
  context?: BrowserOperationContext,
  sessionName?: string,
  ownerRoute?: string,
) => Promise<unknown>;

type BrowserClientLike = Pick<BrowserClient, "available" | "request" | "closeGroup">;
type TrustedForegroundLease = {
  click(x: number, y: number): { ok: boolean; error?: string };
  /** Measure the frontmost Chrome window bounds via System Events (global
   *  screen points). Never trusts browser-reported screen geometry, which
   *  drifts on scaled or Hackintosh displays. */
  measureWindow(): { x: number; y: number; width: number; height: number } | { error: string };
  /** Bring Google Chrome to the macOS frontmost position (window focus via
   *  chrome.windows.update does not change the frontmost app on macOS). */
  foreground(): { ok: boolean; error?: string };
  restore(): { ok: boolean; error?: string };
};

function automationError(result: ReturnType<typeof spawnSync>): string {
  return String(result.stderr || result.stdout || "osascript failed").trim().slice(0, 120);
}

function automationEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ["HOME", "PATH", "LANG", "LC_ALL", "TMPDIR", "USER"]) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return env;
}

function acquireTrustedForegroundLease(): TrustedForegroundLease {
  // OS-level input machinery lives in the computer extension (real CGEvent
  // mouse stream, System Events activation and measurement, frontmost
  // restore). Chrome only adapts the app-specific interface here; see
  // tool/computer/operation.ts for the shared implementation.
  const lease = acquireChromeOsLease();
  return {
    click(x, y) {
      return lease.click({ x, y });
    },
    measureWindow() {
      return lease.measureWindow("Google Chrome");
    },
    foreground() {
      return lease.foreground("Google Chrome");
    },
    restore() {
      return lease.restore();
    },
  };
}

function requireTrusted(trusted: boolean): void {
  if (!trusted) throw new Error("Browser Context operation requires a trusted project");
}

/**
 * One shared browser operation behind every consumer. Tool registration owns
 * only the public ABI; other workflows may reuse this implementation.
 */
export function createBrowserContextOperation(options: {
  authority?: BrowserAuthority;
  client?: BrowserClientLike;
  acquireTrustedForeground?: () => TrustedForegroundLease;
  platform?: NodeJS.Platform;
} = {}): BrowserContextOperation {
  const authority = options.authority ?? loadAuthority();
  const client = options.client ?? new BrowserClient();
  const acquireTrustedForeground = options.acquireTrustedForeground ?? acquireTrustedForegroundLease;
  const platform = options.platform ?? process.platform;

  return async (rawParams, signal, context = { isProjectTrusted: () => true }, sessionName = "browser_session", ownerRoute) => {
    const params: any = (rawParams as any).params ? { ...rawParams, ...(rawParams as any).params } : rawParams;
    requireTrusted(context?.isProjectTrusted ? context.isProjectTrusted() : true);
    if (params.action === "status" || params.action === "repair") {
      if (params.action === "repair") installBrowserBridge();
      if (!client.available()) {
        return {
          installed_host: existsSync(SOCKET_PATH.replace(/control\.sock$/, "native-host")),
          extension_connected: false,
          setup: "Run /browser-setup once, then load the copied unpacked Extension path in the intended Chrome profile.",
          focus_operations: false,
          popup_ui: false,
        };
      }
      return client.request({ protocol: PROTOCOL, action: params.action }, signal, sessionName, ownerRoute);
    }

    const effectiveUrl = params.url || "https://example.com";
    const url = params.action === "capture_screenshot" ? safeForegroundUrl(effectiveUrl) : safeBrowserUrl(effectiveUrl);
    const financial = requiresFinancialConfirmation(params.action, url, [params.name, params.field]);
    if (financial && params.ownerConfirmed !== true) {
      throw new Error("financial_confirmation_required");
    }
    const ownerConfirmed = financial ? params.ownerConfirmed === true : true;
    const allowActive = params.ownerConfirmed === true;

    let command: BrowserCommand;
    if (params.action === "read_text") {
      command = {
        protocol: PROTOCOL,
        action: "read_text",
        url,
        max_chars: params.max_chars ?? 20000,
        read_mode: params.readTextMode,
        long: params.long,
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    } else if (params.action === "semantic_snapshot") {
      command = {
        protocol: PROTOCOL,
        action: "semantic_snapshot",
        url,
        max_elements: params.max_elements,
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    } else if (params.action === "read_markdown") {
      command = { protocol: PROTOCOL, action: "read_markdown", url, max_chars: params.max_chars, allow_active: allowActive };
    } else if (params.action === "read_styles") {
      command = { protocol: PROTOCOL, action: "read_styles", url, allow_active: allowActive };
    } else if (params.action === "disassemble") {
      command = { protocol: PROTOCOL, action: "disassemble", url, max_sections: params.max_sections, allow_active: true };
    } else if (params.action === "read_scripts") {
      command = { protocol: PROTOCOL, action: "read_scripts", url, allow_active: allowActive };
    } else if (params.action === "read_console") {
      command = { protocol: PROTOCOL, action: "read_console", url, level: params.level, allow_active: allowActive };
    } else if (params.action === "read_network") {
      command = { protocol: PROTOCOL, action: "read_network", url, allow_active: allowActive };
    } else if (params.action === "read_storage") {
      command = { protocol: PROTOCOL, action: "read_storage", url, key: params.key ?? params.name, storage_type: params.storage_type, allow_active: allowActive };
    } else if (params.action === "set_storage") {
      command = { protocol: PROTOCOL, action: "set_storage", url, key: params.key ?? params.name, value: params.value, storage_type: params.storage_type, allow_active: allowActive };
    } else if (params.action === "clear_storage") {
      command = { protocol: PROTOCOL, action: "clear_storage", url, key: params.key ?? params.name, storage_type: params.storage_type, allow_active: allowActive };
    } else if (params.action === "read_cookies") {
      command = { protocol: PROTOCOL, action: "read_cookies", url, allow_active: allowActive };
    } else if (params.action === "clear_cookies") {
      command = { protocol: PROTOCOL, action: "clear_cookies", url, allow_active: allowActive };
    } else if (params.action === "performance_metrics") {
      command = { protocol: PROTOCOL, action: "performance_metrics", url, allow_active: allowActive };
    } else if (params.action === "hover") {
      command = {
        protocol: PROTOCOL,
        action: "hover",
        url,
        selector: params.selector,
        field: params.field ?? params.name,
        role: params.role,
        context: params.context,
        client_x: params.client_x,
        client_y: params.client_y,
        allow_active: allowActive,
      };
    } else if (params.action === "scroll") {
      command = {
        protocol: PROTOCOL,
        action: "scroll",
        url,
        selector: params.selector,
        position: params.position,
        delta_x: params.delta_x,
        delta_y: params.delta_y,
        allow_active: allowActive,
      };
    } else if (params.action === "press_key") {
      command = {
        protocol: PROTOCOL,
        action: "press_key",
        url,
        key: params.key,
        selector: params.selector,
        modifiers: params.modifiers,
        allow_active: allowActive,
      };
    } else if (params.action === "wait_for") {
      command = {
        protocol: PROTOCOL,
        action: "wait_for",
        url,
        selector: params.selector,
        script: params.script,
        text: params.text,
        condition: params.condition,
        timeout_ms: params.timeout_ms,
        allow_active: allowActive,
      };
    } else if (params.action === "emulate") {
      command = {
        protocol: PROTOCOL,
        action: "emulate",
        url,
        width: params.width,
        height: params.height,
        color_scheme: params.color_scheme,
        mobile: params.mobile,
        device_scale_factor: params.device_scale_factor,
        allow_active: allowActive,
      };
    } else if (params.action === "drag_and_drop") {
      command = {
        protocol: PROTOCOL,
        action: "drag_and_drop",
        url,
        source_selector: params.source_selector ?? params.selector,
        target_selector: params.target_selector,
        from_x: params.from_x,
        from_y: params.from_y,
        to_x: params.to_x,
        to_y: params.to_y,
        allow_active: allowActive,
      };
    } else if (params.action === "upload_file") {
      command = {
        protocol: PROTOCOL,
        action: "upload_file",
        url,
        selector: params.selector,
        file_name: params.file_name,
        file_content: params.file_content,
        file_type: params.file_type,
        base64: params.base64,
        files: params.files,
        allow_active: allowActive,
      };
    } else if (params.action === "lighthouse_audit") {
      return runLighthouseAudit(url, { categories: params.categories, formFactor: params.form_factor });
    } else if (params.action === "performance_trace") {
      return analyzePerformanceTrace(url);
    } else if (params.action === "heap_analysis") {
      return analyzeHeapMemory(url);
    } else if (params.action === "network_waterfall") {
      return analyzeNetworkWaterfall(url);
    } else if (params.action === "security_audit") {
      return auditSecurityAndConsole(url);
    } else if (params.action === "emulate_profile") {
      return resolveEmulationProfile(params.device_preset, {
        networkThrottle: params.network_throttle,
        cpuThrottlingRate: params.cpu_throttling_rate,
        colorScheme: params.color_scheme,
        reducedMotion: params.reduced_motion,
        geolocation: params.geolocation,
        timezoneId: params.timezone_id,
        locale: params.locale,
      });
    } else if (params.action === "accessibility_tree") {
      return buildAccessibilityTree(url);
    } else if (params.action === "smart_selector_heal") {
      return smartHealSelector(params.selector || "button", {
        text: params.text || params.name,
        role: params.role,
        accessibleName: params.accessible_name || params.name,
        tagName: params.tag_name,
        dataTestId: params.data_testid,
        parentContainerSelector: params.parent_container_selector,
      });
    } else if (params.action === "visual_regression_diff") {
      return analyzeVisualRegression(params.baseline_url || url, url, {
        tolerancePercentage: params.tolerance_percentage,
      });
    } else if (params.action === "journey_record_and_replay") {
      return synthesizeUserJourney(params.journey_name || "User Journey", params.steps || [
        { step: 1, type: "navigate", url, description: "Navigate to landing page" },
        { step: 2, type: "assert_visible", selector: "main", description: "Verify main container renders" },
      ]);
    } else if (params.action === "session_isolation_vault") {
      return manageSessionVault(
        params.mode === "add" ? "snapshot" : params.mode === "clear" ? "clear" : params.mode === "list" ? "list" : "restore",
        params.profile_id || "default",
        {
          url,
          cookies: params.cookies,
          localStorage: params.local_storage,
          sessionStorage: params.session_storage,
        }
      );
    } else if (params.action === "inp_interaction_vitals") {
      return monitorInteractionVitals(url);
    } else if (params.action === "persona_emulation") {
      return auditAccessibilityPersonas(url, params.persona_id);
    } else if (params.action === "extract_structured_data") {
      return extractStructuredData(url);
    } else if (params.action === "chaos_resilience_test") {
      return simulateChaosResilience(url, params.chaos_scenario);
    } else if (params.action === "batch_tab_orchestration") {
      return orchestrateBatchTabs(params.urls || [url], params.concurrency_pool_size || 4);
    } else if (params.action === "network_mock_interceptor") {
      return interceptNetworkRequests(url, { action: params.mode === "clear" ? "clear" : params.mode === "list" ? "list" : "set", rules: params.rules });
    } else if (params.action === "har_replay_mock") {
      return replayHarWaterfall(url, { harPath: params.har_path, offlineMode: params.offline_mode, simulateCache: params.simulate_cache });
    } else if (params.action === "web_vitals_radar") {
      return diagnoseWebVitalsRadar(url, { sampleWindowMs: params.sample_window_ms, targetInteractionSelector: params.selector });
    } else if (params.action === "stealth_profile_guard") {
      return generateStealthProfile(url, params.stealth_preset || "macos_m3_safari", { spoofWebgl: params.spoof_webgl, injectCanvasNoise: params.inject_canvas_noise });
    } else if (params.action === "attention_heatmap_predict") {
      return predictVisualAttention(url, { ctaSelector: params.selector, viewport: params.viewport });
    } else if (params.action === "e2e_spec_generator") {
      return synthesizeE2eTestSuite(params.suite_name || "Enterprise Web Journey", url, {
        framework: params.e2e_framework || "playwright_ts",
        steps: params.steps,
        includeAxeAccessibility: params.include_axe_accessibility,
        includeVisualDiff: params.include_visual_diff,
      });
    } else if (params.action === "memory_leak_tracer") {
      return traceMemoryLeaks(url, { iterations: params.iterations, actionSelector: params.selector });
    } else if (params.action === "responsive_matrix_linter") {
      return auditResponsiveMatrix(url, { presets: params.presets });
    } else if (params.action === "security_sandbox_audit") {
      return auditSecuritySandbox(url, { checkStorage: params.check_storage, checkIframes: params.check_iframes });
    } else if (params.action === "dom_race_profiler") {
      return profileDomRaceConditions(url, { sampleWindowMs: params.sample_window_ms });
    } else if (params.action === "lighthouse_ci_budget") {
      return evaluateLighthouseCiBudget(url, { customBudgets: params.custom_budgets });
    } else if (params.action === "annotate") {
      const mode = params.mode ?? "list";
      const note = mode === "add" && params.value ? safePublicMultiline(params.value) : params.value;
      command = {
        protocol: PROTOCOL,
        action: "annotate",
        url,
        mode,
        value: note,
        name: params.name ? safeControlName(params.name) : undefined,
        field: params.field,
        role: params.role,
        context: params.context,
        client_x: params.client_x,
        client_y: params.client_y,
        allow_active: true,
      };
    } else if (params.action === "inspect_element") {
      command = {
        protocol: PROTOCOL,
        action: "inspect_element",
        url,
        selector: params.selector,
        field: params.field ?? params.name,
        role: params.role,
        context: params.context,
        allow_active: allowActive,
      };
    } else if (params.action === "evaluate_script") {
      if (!params.script) throw new Error("script is required for evaluate_script");
      command = { protocol: PROTOCOL, action: "evaluate_script", url, script: params.script, allow_active: allowActive };
    } else if (params.action === "reload_page") {
      command = { protocol: PROTOCOL, action: "reload_page", url, bypass_cache: params.bypass_cache, allow_active: allowActive };
    } else if (params.action === "hot_reload") {
      command = { protocol: PROTOCOL, action: "hot_reload", url, allow_active: allowActive };
    } else if (params.action === "open" || params.action === "controls") {
      command = {
        protocol: PROTOCOL,
        action: params.action,
        url,
        allow_active: allowActive,
        ...(params.action === "controls" ? { owner_confirmed: ownerConfirmed } : {}),
      };
    } else if (params.action === "click") {
      if (!params.name && !params.selector && (params.screen_x === undefined || params.screen_y === undefined)) {
        throw new Error("name or screen coordinates are required for a browser click");
      }
      command = {
        protocol: PROTOCOL,
        action: "click",
        url,
        role: params.role,
        name: params.name ? safeControlName(params.name) : undefined,
        selector: params.selector,
        context: params.context,
        screen_x: params.screen_x,
        screen_y: params.screen_y,
        owner_confirmed: ownerConfirmed,
        foreground_confirmed: params.foregroundConfirmed === true,
        allow_active: allowActive,
      };
      // A foreground-confirmed click is located without first dispatching a
      // synthetic event. The bridge then focuses the exact managed tab, the
      // host emits exactly one trusted click, and both Chrome and the prior
      // foreground application are restored in finally blocks.
      const clickResult = await client.request(command, signal, sessionName, ownerRoute) as Record<string, unknown>;
      const diagnostics = (clickResult as { diagnostics?: Record<string, unknown> }).diagnostics;
      const sx = typeof diagnostics?.screen_x === "number" && Number.isFinite(diagnostics.screen_x) && Math.abs(diagnostics.screen_x) <= 100_000
        ? diagnostics.screen_x
        : undefined;
      const sy = typeof diagnostics?.screen_y === "number" && Number.isFinite(diagnostics.screen_y) && Math.abs(diagnostics.screen_y) <= 100_000
        ? diagnostics.screen_y
        : undefined;
      // Pure CSS viewport coordinates reported by the content script; the
      // host converts them to global screen points with an empirically
      // measured window scale (never trusts browser screen geometry).
      const clientX = typeof diagnostics?.client_x === "number" && Number.isFinite(diagnostics.client_x)
        ? diagnostics.client_x
        : undefined;
      const clientY = typeof diagnostics?.client_y === "number" && Number.isFinite(diagnostics.client_y)
        ? diagnostics.client_y
        : undefined;
      const viewportWidth = typeof diagnostics?.viewport_width === "number" && Number.isFinite(diagnostics.viewport_width) && diagnostics.viewport_width > 0
        ? diagnostics.viewport_width
        : undefined;
      const viewportHeight = typeof diagnostics?.viewport_height === "number" && Number.isFinite(diagnostics.viewport_height) && diagnostics.viewport_height > 0
        ? diagnostics.viewport_height
        : undefined;
      const trustedRequired = clickResult.status === "trusted_click_required";
      if (trustedRequired && platform === "darwin" && params.foregroundConfirmed === true) {
        let lease: TrustedForegroundLease;
        try {
          lease = acquireTrustedForeground();
        } catch (error) {
          clickResult.trusted_click = { attempted: true, ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "automation unavailable" };
          return clickResult;
        }
        let activationAttempted = false;
        let activated = false;
        let trusted: { ok: boolean; error?: string } = { ok: false, error: "activate failed" };
        let bridgeRestore: { ok: boolean; error?: string } = { ok: true };
        let px = sx ?? 0;
        let py = sy ?? 0;
        try {
          activationAttempted = true;
          const activation = await client.request(
            { protocol: PROTOCOL, action: "activate", url, foreground_confirmed: true },
            signal,
            sessionName,
            ownerRoute,
          ) as Record<string, unknown>;
          activated = activation.status === "activated" && activation.tab_active === true;
          if (!activated) throw new Error("activate_target_not_foreground");
          // chrome.windows.update(focused) does not raise Chrome above other
          // apps on macOS; System Events needs Chrome as the frontmost app to
          // enumerate its windows. Fail closed if it cannot be raised.
          const raised = lease.foreground();
          if (!raised.ok) throw new Error(raised.error ?? "chrome foreground failed");
          // Chrome needs a beat to become the frontmost process before
          // System Events can enumerate its windows; retry the measurement
          // because activation timing varies under load. Only CSS points
          // need a window measurement; raw screen points are used as-is.
          // Prefer the managed window's own bounds reported by the worker
          // over "largest Chrome window" enumeration: the active managed tab
          // may live in a smaller window than an unrelated Chrome window.
          if (clientX !== undefined && clientY !== undefined && viewportWidth !== undefined && viewportHeight !== undefined) {
            const reported = activation.window_bounds as { width?: number; height?: number; left?: number; top?: number } | undefined;
            let measured = (reported !== undefined && Number.isFinite(reported.width) && (reported.width ?? 0) > 0
              && Number.isFinite(reported.height) && (reported.height ?? 0) > 0
              && Number.isFinite(reported.left) && Number.isFinite(reported.top))
              ? { x: reported.left as number, y: reported.top as number, width: reported.width as number, height: reported.height as number }
              : undefined;
            for (let attempt = 0; attempt < 3 && !measured; attempt += 1) {
              const candidate = lease.measureWindow();
              if (!("error" in candidate)) measured = candidate;
              else await new Promise((resolve) => setTimeout(resolve, 400));
            }
            if (!measured) throw new Error("window bounds unavailable");
            if (measured.width <= 0 || measured.height <= 0 || measured.width > 10_000 || measured.height > 10_000) {
              // Fail closed: a zero/implausible window bounds means Chrome was
              // not foregrounded (other apps cover it, windows minimized).
              // Clicking at a stale/derived point is worse than failing.
              throw new Error("window bounds unavailable (Chrome not foreground?)");
            }
            // Empirical scale: real window width (global points) over the
            // CSS viewport width reported by the page. Correct even when the
            // browser's devicePixelRatio or screenX lies (scaled/Hackintosh).
            const scaleX = measured.width / viewportWidth;
            const scaleY = measured.height / viewportHeight;
            px = measured.x + clientX * scaleX;
            py = measured.y + clientY * scaleY;
          } else if (sx === undefined || sy === undefined) {
            throw new Error("click point unavailable");
          }
          trusted = lease.click(px, py);
        } catch (error) {
          trusted = { ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "trusted click failed" };
        } finally {
          if (activationAttempted) {
            try {
              const restored = await client.request(
                { protocol: PROTOCOL, action: "restore_background", url },
                undefined,
                sessionName,
                ownerRoute,
              ) as Record<string, unknown>;
              if (restored.status !== "restored" || restored.tab_active !== false) bridgeRestore = { ok: false, error: "browser background restoration failed" };
            } catch (error) {
              bridgeRestore = { ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "browser background restoration failed" };
            }
          }
          let appRestore: { ok: boolean; error?: string };
          try {
            appRestore = lease.restore();
          } catch (error) {
            appRestore = { ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "foreground restoration failed" };
          }
          clickResult.trusted_click = {
            attempted: true,
            ok: trusted.ok,
            ...(trusted.error ? { error: trusted.error } : {}),
            x: Math.round(px),
            y: Math.round(py),
            ...(sx !== undefined && Math.abs(sx - px) > 1 ? { css_point: [Math.round(sx), Math.round(sy ?? 0)] } : {}),
            browser_restored: bridgeRestore.ok,
            foreground_restored: appRestore.ok,
            ...(!bridgeRestore.ok ? { restoration_error: bridgeRestore.error } : {}),
            ...(!appRestore.ok ? { foreground_restoration_error: appRestore.error } : {}),
          };
        }
      }
      return clickResult;
    } else if (params.action === "press_enter") {
      if (!params.field && !params.selector) throw new Error("field or selector is required for a bounded Enter action");
      command = {
        protocol: PROTOCOL,
        action: "press_enter",
        url,
        field: params.field ? safeControlName(params.field) : undefined,
        selector: params.selector,
        context: params.context,
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    } else if (params.action === "select_combobox") {
      if ((!params.field && !params.selector) || !params.value) throw new Error("field (or selector) and value are required for a searchable combobox selection");
      command = {
        protocol: PROTOCOL,
        action: "select_combobox",
        url,
        field: params.field ? safeControlName(params.field) : undefined,
        selector: params.selector,
        value: safePublicValue(params.value),
        context: params.context,
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    } else if (params.action === "cdp_key") {
      if (typeof params.key !== "string" || !["Tab", "Enter", "Escape", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(params.key)) {
        throw new Error("a bounded key is required for a CDP key dispatch");
      }
      // Owner directive 2026-08-12: automation is never obstructed except by
      // financial actions. CDP input (trusted, no money) needs no per-step
      // confirmation.
      command = {
        protocol: PROTOCOL,
        action: "cdp_key",
        url,
        key: params.key,
        owner_confirmed: true,
        allow_active: true,
      };
    } else if (params.action === "cdp_click") {
      if (params.client_x === undefined || params.client_y === undefined) {
        throw new Error("client coordinates are required for a CDP click");
      }
      command = {
        protocol: PROTOCOL,
        action: "cdp_click",
        url,
        client_x: params.client_x,
        client_y: params.client_y,
        owner_confirmed: true,
        allow_active: true,
      };
    } else if (params.action === "cdp_hover") {
      if (params.client_x === undefined || params.client_y === undefined) {
        throw new Error("client coordinates are required for a CDP hover");
      }
      command = {
        protocol: PROTOCOL,
        action: "cdp_hover",
        url,
        client_x: params.client_x,
        client_y: params.client_y,
        owner_confirmed: true,
        allow_active: true,
      };
    } else if (params.action === "cdp_scroll") {
      if (params.delta_x === undefined && params.delta_y === undefined) {
        throw new Error("delta coordinates are required for a CDP scroll");
      }
      command = {
        protocol: PROTOCOL,
        action: "cdp_scroll",
        url,
        delta_x: params.delta_x ?? 0,
        delta_y: params.delta_y ?? 0,
        client_x: params.client_x,
        client_y: params.client_y,
        owner_confirmed: true,
        allow_active: true,
      };
    } else if (params.action === "capture_session") {
      if (!capabilityAllowed(DEFAULT_TARGET_POLICY, "session_read")) throw new Error("session_capability_not_authorized");
      command = { protocol: PROTOCOL, action: "capture_session", url };
    } else if (params.action === "capture_screenshot") {
      if (!capabilityAllowed(DEFAULT_TARGET_POLICY, "screenshot")) throw new Error("screenshot_capability_not_authorized");
      command = { protocol: PROTOCOL, action: "capture_screenshot", url, selector: params.selector, foreground_confirmed: true, long: params.long === true };
    } else if (params.action === "capture_pdf") {
      command = { protocol: PROTOCOL, action: "capture_pdf", url };
    } else if (params.action === "capture_ga4_measurement_id") {
      if (!params.route) throw new Error("route is required for GA4 measurement ID capture");
      const route = authorityRoute(authority, params.route);
      const target = (authority.targets ?? []).find((item) => item.route === route) as Record<string, unknown> | undefined;
      if (!target) throw new Error("analytics_target_not_authorized");
      let domain: string;
      try { domain = new URL(String(target.origin)).hostname; } catch { throw new Error("analytics_target_origin_invalid"); }
      command = {
        protocol: PROTOCOL,
        action: "capture_ga4_measurement_id",
        url,
        route,
        stream_name: String(target.ga4_stream_name ?? target.ga4_display_name ?? ""),
        domain,
        identity_verified: false,
      };
    } else if (params.action === "capture_clarity_token") {
      if (!params.route) throw new Error("route is required for Clarity token capture");
      command = { protocol: PROTOCOL, action: "capture_clarity_token", url, route: authorityRoute(authority, params.route) };
    } else if (params.action === "fill_form") {
      if (!params.entries || typeof params.entries !== "object") {
        throw new Error("entries object is required for fill_form");
      }
      command = {
        protocol: PROTOCOL,
        action: "fill_form",
        url,
        entries: params.entries,
        context: params.context,
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    } else if (params.action === "fill_public") {
      if ((!params.field && !params.selector) || !params.value) throw new Error("field (or selector) and value are required for a public browser fill");
      const multiline = params.publicTextMode === "advisor_prompt";
      command = {
        protocol: PROTOCOL,
        action: "fill",
        url,
        field: params.field ? safeControlName(params.field) : undefined,
        selector: params.selector,
        value: multiline ? safePublicMultiline(params.value) : safePublicValue(params.value),
        multiline_public: multiline,
        context: params.context,
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    } else {
      if (!params.field || !params.source || !params.route) {
        throw new Error("field, source, and route are required for a local browser fill");
      }
      command = {
        protocol: PROTOCOL,
        action: "fill_local",
        url,
        field: safeControlName(params.field),
        context: params.context,
        source: params.source,
        route: authorityRoute(authority, params.route),
        owner_confirmed: ownerConfirmed,
        allow_active: allowActive,
      };
    }
    return client.request(command, signal, sessionName, ownerRoute);
  };
}
