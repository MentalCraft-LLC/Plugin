import { describe, expect, test } from "bun:test";
import {
  runLighthouseAudit,
  analyzePerformanceTrace,
  analyzeHeapMemory,
  analyzeNetworkWaterfall,
  auditSecurityAndConsole,
  resolveEmulationProfile,
  buildAccessibilityTree,
  DEVICE_PRESETS,
  NETWORK_PRESETS,
} from "./modules/devtools.ts";
import { createBrowserContextOperation } from "./operation.ts";

describe("Plugin/Browser DevTools Superset Engine", () => {
  const mockContext = { isProjectTrusted: () => true };
  const browserOp = createBrowserContextOperation();

  test("runLighthouseAudit generates mobile-first 5-category audit scores and mobile ergonomics", () => {
    // Default Mobile Audit
    const report = runLighthouseAudit("https://example.com/pricing");
    expect(report.url).toBe("https://example.com/pricing");
    expect(report.formFactor).toBe("mobile");
    expect(report.emulationSettings.cpuThrottlingRate).toBe(4);
    expect(report.emulationSettings.networkThrottle).toContain("Fast 3G / 4G");
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);

    expect(report.categoryScores.performance).toBeDefined();
    expect(report.categoryScores.accessibility).toBeDefined();
    expect(report.categoryScores.best_practices).toBeDefined();
    expect(report.categoryScores.seo).toBeDefined();
    expect(report.categoryScores.pwa).toBeDefined();

    expect(report.webVitals.fcpMs).toBeGreaterThan(0);
    expect(report.webVitals.lcpMs).toBeGreaterThanOrEqual(report.webVitals.fcpMs);
    expect(report.webVitals.clsScore).toBeGreaterThanOrEqual(0);
    expect(report.webVitals.tbtMs).toBeGreaterThanOrEqual(0);
    expect(report.webVitals.inpMs).toBeGreaterThan(0);

    // Mobile Ergonomics
    expect(report.mobileErgonomicsSummary).toBeDefined();
    expect(report.mobileErgonomicsSummary?.viewportConfigured).toBe(true);
    expect(report.mobileErgonomicsSummary?.tapTargetsScore).toBeGreaterThanOrEqual(0);

    expect(report.audits.length).toBeGreaterThan(12);
    const tapAudit = report.audits.find((a) => a.id === "tap-targets");
    expect(tapAudit).toBeDefined();
    expect(tapAudit?.isMobileSpecific).toBe(true);

    expect(report.passedCount + report.failedCount).toBe(report.totalAudits);
    expect(Array.isArray(report.remediationPriorityList)).toBe(true);

    // Desktop Audit
    const desktopReport = runLighthouseAudit("https://example.com/pricing", { formFactor: "desktop" });
    expect(desktopReport.formFactor).toBe("desktop");
    expect(desktopReport.emulationSettings.cpuThrottlingRate).toBe(1);
  });

  test("analyzePerformanceTrace profiles navigation timeline and Web Vitals ratings", () => {
    const trace = analyzePerformanceTrace("https://example.com/dashboard");
    expect(trace.url).toBe("https://example.com/dashboard");

    const t = trace.timingBreakdown;
    expect(t.dnsLookupMs).toBeGreaterThan(0);
    expect(t.tcpConnectMs).toBeGreaterThan(0);
    expect(t.tlsHandshakeMs).toBeGreaterThan(0);
    expect(t.domContentLoadedMs).toBeGreaterThan(0);
    expect(t.totalPageLoadMs).toBeGreaterThan(t.domContentLoadedMs);

    expect(["GOOD", "NEEDS_IMPROVEMENT", "POOR"]).toContain(trace.webVitalsAssessment.lcp.rating);
    expect(["GOOD", "NEEDS_IMPROVEMENT", "POOR"]).toContain(trace.webVitalsAssessment.cls.rating);
    expect(["GOOD", "NEEDS_IMPROVEMENT", "POOR"]).toContain(trace.webVitalsAssessment.fcp.rating);

    expect(trace.resourceMetrics.totalRequests).toBeGreaterThan(5);
    expect(trace.resourceMetrics.totalTransferSizeKb).toBeGreaterThan(0);
    expect(trace.resourceMetrics.byType.script).toBeDefined();
    expect(trace.resourceMetrics.byType.image).toBeDefined();
    expect(trace.bottlenecks.length).toBeGreaterThan(0);
    expect(trace.recommendations.length).toBeGreaterThan(0);
  });

  test("analyzeHeapMemory audits V8 heap footprint, detached DOM nodes and listener leaks", () => {
    const mem = analyzeHeapMemory("https://example.com/canvas-app");
    expect(mem.heapMetrics.usedJSHeapSizeMb).toBeGreaterThan(0);
    expect(mem.heapMetrics.totalJSHeapSizeMb).toBeGreaterThanOrEqual(mem.heapMetrics.usedJSHeapSizeMb);
    expect(mem.heapMetrics.heapUtilizationPercent).toBeGreaterThan(0);
    expect(["LOW", "MODERATE", "HIGH", "CRITICAL"]).toContain(mem.leakRiskLevel);

    expect(mem.domTreeMetrics.totalElements).toBeGreaterThan(100);
    expect(mem.domTreeMetrics.maxDomDepth).toBeGreaterThan(5);
    expect(mem.eventListenersEstimate.totalGlobalListeners).toBeGreaterThan(0);
    expect(mem.diagnostics.length).toBeGreaterThan(0);
  });

  test("analyzeNetworkWaterfall tracks request timings, compression savings, and anomalies", () => {
    const net = analyzeNetworkWaterfall("https://example.com/store");
    expect(net.summary.totalRequests).toBeGreaterThan(10);
    expect(net.summary.totalTransferredKb).toBeGreaterThan(0);
    expect(net.summary.totalDecodedKb).toBeGreaterThan(0);
    expect(net.summary.cacheHitRatePercent).toBeGreaterThanOrEqual(0);

    expect(net.requests.length).toBe(net.summary.totalRequests);
    const firstReq = net.requests[0];
    expect(firstReq.resourceType).toBe("document");
    expect(firstReq.timing.ttfbMs).toBeGreaterThanOrEqual(0);
    expect(firstReq.timing.contentDownloadMs).toBeGreaterThanOrEqual(0);
    expect(net.optimizationChecklist.length).toBeGreaterThan(0);
  });

  test("auditSecurityAndConsole inspects security headers, cookie flags and console logs", () => {
    const sec = auditSecurityAndConsole("https://example.com/secure-portal");
    expect(sec.protocol).toBe("https");
    expect(sec.securityScore).toBeGreaterThanOrEqual(50);
    expect(sec.headersEvaluation.csp).toBeDefined();
    expect(sec.headersEvaluation.hsts).toBeDefined();
    expect(sec.headersEvaluation.xFrameOptions).toBeDefined();
    expect(sec.consoleForensics).toBeDefined();
    expect(sec.actionableHardeningSteps.length).toBeGreaterThan(0);
  });

  test("resolveEmulationProfile configures device presets, throttling, and environment overrides", () => {
    const iphone = resolveEmulationProfile("iphone_15_pro", {
      networkThrottle: "slow_3g",
      cpuThrottlingRate: 4,
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    expect(iphone.deviceName).toBe("Apple iPhone 15 Pro");
    expect(iphone.viewport.width).toBe(393);
    expect(iphone.viewport.height).toBe(852);
    expect(iphone.viewport.hasTouch).toBe(true);
    expect(iphone.networkThrottling.preset).toBe("slow_3g");
    expect(iphone.networkThrottling.latencyMs).toBe(400);
    expect(iphone.cpuThrottlingRate).toBe(4);
    expect(iphone.environment.colorScheme).toBe("dark");
    expect(iphone.environment.reducedMotion).toBe("reduce");

    const desktop = resolveEmulationProfile("desktop_4k");
    expect(desktop.viewport.width).toBe(3840);
    expect(desktop.viewport.isMobile).toBe(false);
  });

  test("buildAccessibilityTree synthesizes hierarchical accessibility semantic structure", () => {
    const ax = buildAccessibilityTree("https://example.com/app");
    expect(ax.role).toBe("RootWebArea");
    expect(ax.children && ax.children.length).toBeGreaterThan(0);
    const header = ax.children?.find((c) => c.role === "banner");
    expect(header).toBeDefined();
    const main = ax.children?.find((c) => c.role === "main");
    expect(main).toBeDefined();
  });

  test("createBrowserContextOperation dispatches all 7 DevTools superset actions smoothly", async () => {
    const auditRes = await browserOp({ action: "lighthouse_audit", url: "https://example.com" }, undefined, mockContext);
    expect((auditRes as any).overallScore).toBeDefined();

    const traceRes = await browserOp({ action: "performance_trace", url: "https://example.com" }, undefined, mockContext);
    expect((traceRes as any).timingBreakdown).toBeDefined();

    const heapRes = await browserOp({ action: "heap_analysis", url: "https://example.com" }, undefined, mockContext);
    expect((heapRes as any).heapMetrics).toBeDefined();

    const netRes = await browserOp({ action: "network_waterfall", url: "https://example.com" }, undefined, mockContext);
    expect((netRes as any).summary).toBeDefined();

    const secRes = await browserOp({ action: "security_audit", url: "https://example.com" }, undefined, mockContext);
    expect((secRes as any).securityScore).toBeDefined();

    const emuRes = await browserOp({ action: "emulate_profile", url: "https://example.com", device_preset: "pixel_8" }, undefined, mockContext);
    expect((emuRes as any).deviceName).toBe("Google Pixel 8");

    const axRes = await browserOp({ action: "accessibility_tree", url: "https://example.com" }, undefined, mockContext);
    expect((axRes as any).role).toBe("RootWebArea");
  });
});
