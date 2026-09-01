import { describe, expect, test } from "bun:test";
import {
  interceptNetworkRequests,
  replayHarWaterfall,
  diagnoseWebVitalsRadar,
  generateStealthProfile,
  predictVisualAttention,
  synthesizeE2eTestSuite,
} from "./core.ts";
import { createBrowserContextOperation } from "./operation.ts";

describe("Plugin/Browser Advanced Next-Gen Intelligence Suite", () => {
  const browserOp = createBrowserContextOperation();
  const mockContext = { isProjectTrusted: () => true };

  test("Network Interception: matches routes, injects mock fixtures, and tracks simulated latency", () => {
    const res = interceptNetworkRequests("https://app.mentalcraft.org/dashboard", {
      rules: [
        {
          urlPattern: "/api/v1/custom/endpoint",
          method: "POST",
          statusCode: 201,
          responseBody: { created: true, id: "item_992" },
          delayMs: 60,
          failureRate: 0,
          enabled: true,
        },
      ],
    });

    expect(res.totalActiveRules).toBeGreaterThanOrEqual(1);
    expect(res.rules.some((r) => r.urlPattern === "/api/v1/custom/endpoint")).toBe(true);
    expect(res.summary.avgSimulatedDelayMs).toBeGreaterThanOrEqual(0);
    expect(res.diagnostics.length).toBeGreaterThan(0);
  });

  test("HAR Replay: replays offline HTTP waterfall and measures fidelity & bandwidth savings", () => {
    const har = replayHarWaterfall("https://app.mentalcraft.org/store", {
      offlineMode: true,
      simulateCache: true,
    });

    expect(har.totalEntries).toBeGreaterThanOrEqual(5);
    expect(har.offlineFidelityScore).toBeGreaterThanOrEqual(95);
    expect(har.bandwidthSavedKb).toBeGreaterThan(0);
    expect(har.summary.jsCount).toBeGreaterThan(0);
    expect(har.summary.cssCount).toBeGreaterThan(0);
    expect(har.summary.apiCount).toBeGreaterThan(0);
  });

  test("Web Vitals Radar: tracks real-time FPS, attributes LoAF jank, traces CLS sources, and decomposes INP", () => {
    const radar = diagnoseWebVitalsRadar("https://app.mentalcraft.org/checkout", {
      targetInteractionSelector: "button.checkout-submit",
    });

    expect(radar.fpsMetrics.targetFps).toBe(60);
    expect(radar.fpsMetrics.measuredFps).toBeGreaterThan(50);
    expect(radar.loafDiagnostics.totalLongFramesCount).toBeGreaterThan(0);
    expect(radar.loafDiagnostics.longAnimationFrames[0].jankSeverity).toBeDefined();
    expect(radar.clsRootCauseTracing.cumulativeLayoutShiftScore).toBeGreaterThanOrEqual(0);
    expect(radar.clsRootCauseTracing.shifts.length).toBeGreaterThan(0);
    expect(radar.clsRootCauseTracing.shifts[0].cause).toBe("UNSIZED_IMAGE");
    expect(radar.inpDecomposition.totalInpMs).toBeGreaterThan(0);
    expect(radar.inpDecomposition.targetElement).toBe("button.checkout-submit");
    expect(radar.performanceOptimizationAdvice.length).toBeGreaterThan(0);
  });

  test("Stealth Profile Guard: spoofs WebGL vendors, masks webdriver, and injects Canvas/Audio noise", () => {
    const stealthMac = generateStealthProfile("https://secure.example.com", "macos_m3_safari");
    expect(stealthMac.evasionScore).toBe(99);
    expect(stealthMac.appliedGuards.navigatorWebdriverMasked).toBe(true);
    expect(stealthMac.appliedGuards.webglVendorSpoofed.vendor).toContain("Apple");
    expect(stealthMac.cdpPreloadScript).toContain("navigator.webdriver");
    expect(stealthMac.botScoreEstimate.cloudflareTurnstilePassProb).toBeGreaterThanOrEqual(0.95);

    const stealthWin = generateStealthProfile("https://secure.example.com", "windows_geforce_chrome");
    expect(stealthWin.appliedGuards.webglVendorSpoofed.renderer).toContain("NVIDIA");
  });

  test("Visual Attention Saliency: predicts F-shaped reading fixations and above-the-fold CTA score", () => {
    const saliency = predictVisualAttention("https://landing.mentalcraft.org", {
      ctaSelector: "a.btn-hero-subscribe",
    });

    expect(saliency.attentionScore).toBeGreaterThan(80);
    expect(saliency.aboveTheFoldCtaClarityScore).toBeGreaterThan(90);
    expect(saliency.predictedReadingPattern).toBe("F_SHAPED");
    expect(saliency.fixationPath.length).toBe(4);
    expect(saliency.fixationPath[0].order).toBe(1);
    expect(saliency.fixationPath[1].isCtaButton).toBe(true);
    expect(saliency.prominentElementsRanking.length).toBeGreaterThanOrEqual(3);
  });

  test("Autonomous E2E Codegen: generates Playwright TypeScript suite with POM and Axe WCAG checks", () => {
    const e2e = synthesizeE2eTestSuite("Checkout Funnel", "https://shop.mentalcraft.org/cart", {
      framework: "playwright_ts",
      includeAxeAccessibility: true,
      includeVisualDiff: true,
    });

    expect(e2e.framework).toBe("playwright_ts");
    expect(e2e.generatedFiles.length).toBe(2);

    const pomFile = e2e.generatedFiles.find((f) => f.fileName.includes("Page"));
    expect(pomFile).toBeDefined();
    expect(pomFile?.code).toContain("export class CheckoutFunnelPage");
    expect(pomFile?.code).toContain("getByRole");

    const specFile = e2e.generatedFiles.find((f) => f.fileName.includes("spec"));
    expect(specFile).toBeDefined();
    expect(specFile?.code).toContain("AxeBuilder");
    expect(specFile?.code).toContain("toHaveScreenshot");
  });

  test("End-to-End Operation Dispatcher executes all 6 next-gen browser actions", async () => {
    const mockRes = await browserOp({ action: "network_mock_interceptor", url: "https://example.com" }, undefined, mockContext);
    expect(mockRes.totalActiveRules).toBeGreaterThan(0);

    const harRes = await browserOp({ action: "har_replay_mock", url: "https://example.com" }, undefined, mockContext);
    expect(harRes.offlineFidelityScore).toBeGreaterThan(90);

    const radarRes = await browserOp({ action: "web_vitals_radar", url: "https://example.com" }, undefined, mockContext);
    expect(radarRes.fpsMetrics.isSmooth60Fps).toBe(true);

    const stealthRes = await browserOp({ action: "stealth_profile_guard", url: "https://example.com", stealth_preset: "macos_m3_safari" } as any, undefined, mockContext);
    expect(stealthRes.evasionScore).toBe(99);

    const saliencyRes = await browserOp({ action: "attention_heatmap_predict", url: "https://example.com" }, undefined, mockContext);
    expect(saliencyRes.attentionScore).toBeGreaterThan(80);

    const e2eRes = await browserOp({ action: "e2e_spec_generator", url: "https://example.com", suite_name: "Login Journey" } as any, undefined, mockContext);
    expect(e2eRes.generatedFiles.length).toBe(2);
  });
});
