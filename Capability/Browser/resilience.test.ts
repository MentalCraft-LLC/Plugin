import { describe, expect, test } from "bun:test";
import {
  auditAccessibilityPersonas,
  extractStructuredData,
  simulateChaosResilience,
  orchestrateBatchTabs,
} from "./modules/resilience.ts";
import { createBrowserContextOperation } from "./operation.ts";

describe("Plugin/Browser Advanced Resilience & Persona Engine", () => {
  const mockContext = { isProjectTrusted: () => true };
  const browserOp = createBrowserContextOperation();

  test("auditAccessibilityPersonas stresses screen reader, high-contrast, and RTL navigation", () => {
    // Screen reader persona
    const sr = auditAccessibilityPersonas("https://example.com/app", "screen_reader_blind");
    expect(sr.personaId).toBe("screen_reader_blind");
    expect(sr.accessibilityScore).toBeGreaterThanOrEqual(20);
    expect(sr.accessibilityScore).toBeLessThanOrEqual(100);
    expect(sr.focusableElementsCount).toBeGreaterThan(0);
    expect(sr.passedCheckpoints.length).toBeGreaterThan(0);
    expect(Array.isArray(sr.remediationPlan)).toBe(true);

    // High contrast persona
    const hc = auditAccessibilityPersonas("https://example.com/app", "low_vision_high_contrast");
    expect(hc.personaName).toContain("High Contrast");

    // RTL Persona
    const rtl = auditAccessibilityPersonas("https://example.com/app", "international_rtl_reader");
    expect(rtl.personaId).toBe("international_rtl_reader");
  });

  test("extractStructuredData extracts JSON-LD, OpenGraph, and E-Commerce / Article schemas", () => {
    // E-Commerce URL
    const ecom = extractStructuredData("https://shop.example.com/pdp/spriteflow-pro");
    expect(ecom.inferredType).toBe("Product");
    expect(ecom.eCommerceDetails?.price).toBeGreaterThan(0);
    expect(ecom.eCommerceDetails?.currency).toBe("USD");
    expect(ecom.jsonLd.length).toBeGreaterThan(0);
    expect(ecom.openGraph["og:title"]).toBeDefined();
    expect(ecom.twitterCard["twitter:card"]).toBe("summary_large_image");

    // Article URL
    const art = extractStructuredData("https://research.example.com/paper/algorithmic-parenting");
    expect(art.inferredType).toBe("Article");
    expect(art.articleDetails?.headline).toBeDefined();
    expect(art.articleDetails?.author).toBeDefined();
  });

  test("simulateChaosResilience evaluates fault tolerance under network spikes and flaky APIs", () => {
    const chaos500 = simulateChaosResilience("https://api.example.com/v1", "flaky_api_intermittent_500");
    expect(chaos500.scenario).toBe("flaky_api_intermittent_500");
    expect(chaos500.resilienceScore).toBeGreaterThanOrEqual(0);
    expect(chaos500.diagnostics.length).toBeGreaterThan(0);
    expect(chaos500.actionableHardeningSteps.length).toBeGreaterThan(0);

    const offline = simulateChaosResilience("https://api.example.com/v1", "offline_disconnect_recovery");
    expect(offline.uiStateDuringChaos).toBe("OFFLINE_BANNER_DISPLAYED");
  });

  test("orchestrateBatchTabs executes parallel pooled audits across multiple URLs", () => {
    const urls = [
      "https://example.com/home",
      "https://example.com/pricing",
      "https://example.com/docs",
      "https://example.com/blog",
    ];

    const batch = orchestrateBatchTabs(urls, 4);
    expect(batch.totalUrls).toBe(4);
    expect(batch.concurrencyPoolSize).toBe(4);
    expect(batch.successfulTabsCount).toBe(4);
    expect(batch.failedTabsCount).toBe(0);
    expect(batch.results.length).toBe(4);
    expect(batch.aggregatedSummary.avgPerformanceScore).toBeGreaterThan(0);
    expect(batch.aggregatedSummary.avgSecurityScore).toBeGreaterThan(0);
    expect(batch.aggregatedSummary.fastestUrl).toBeDefined();
  });

  test("createBrowserContextOperation dispatches all 4 resilience actions smoothly", async () => {
    const personaRes = await browserOp(
      { action: "persona_emulation", url: "https://example.com", persona_id: "screen_reader_blind" },
      undefined,
      mockContext
    );
    expect((personaRes as any).accessibilityScore).toBeDefined();

    const dataRes = await browserOp(
      { action: "extract_structured_data", url: "https://shop.example.com/item" },
      undefined,
      mockContext
    );
    expect((dataRes as any).inferredType).toBeDefined();

    const chaosRes = await browserOp(
      { action: "chaos_resilience_test", url: "https://example.com", chaos_scenario: "flaky_api_intermittent_500" },
      undefined,
      mockContext
    );
    expect((chaosRes as any).resilienceScore).toBeDefined();

    const batchRes = await browserOp(
      { action: "batch_tab_orchestration", url: "https://example.com", urls: ["https://example.com/1", "https://example.com/2"] },
      undefined,
      mockContext
    );
    expect((batchRes as any).totalUrls).toBe(2);
  });
});
