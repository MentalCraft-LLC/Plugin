import { describe, expect, test } from "bun:test";
import {
  smartHealSelector,
  analyzeVisualRegression,
  synthesizeUserJourney,
  manageSessionVault,
  monitorInteractionVitals,
} from "./modules/intelligence.ts";
import { createBrowserContextOperation } from "./operation.ts";

describe("Plugin/Browser Intelligence & Resilience Engine", () => {
  const mockContext = { isProjectTrusted: () => true };
  const browserOp = createBrowserContextOperation();

  test("smartHealSelector synthesizes multi-tier resilient fallback selectors with confidence scores", () => {
    // Case 1: With data-testid
    const res1 = smartHealSelector(".broken-obfuscated-btn-123", {
      dataTestId: "submit-checkout-btn",
      text: "Complete Purchase",
      role: "button",
    });
    expect(res1.healedSelector).toBe('[data-testid="submit-checkout-btn"]');
    expect(res1.confidenceScore).toBeGreaterThanOrEqual(0.95);
    expect(res1.strategyUsed).toBe("EXACT_DATA_TESTID");
    expect(res1.fallbackCandidates.length).toBeGreaterThanOrEqual(4);

    // Case 2: Without test-id, using ARIA role & accessible name
    const res2 = smartHealSelector(".css-hash-btn", {
      role: "button",
      accessibleName: "Sign In",
      tagName: "button",
    });
    expect(res2.healedSelector).toContain('role="button"');
    expect(res2.confidenceScore).toBeGreaterThanOrEqual(0.9);
    expect(res2.strategyUsed).toBe("ARIA_ROLE_AND_NAME");

    // Case 3: Text content fallback
    const res3 = smartHealSelector("#btn-signup", {
      text: "Start Free Trial",
      tagName: "a",
    });
    expect(res3.healedSelector).toContain(':has-text("Start Free Trial")');
    expect(res3.strategyUsed).toBe("TEXT_CONTENT_FUZZY");
  });

  test("analyzeVisualRegression computes SSIM score, pixel deltas, and drift bounding boxes", () => {
    const resMatch = analyzeVisualRegression("https://example.com/home", "https://example.com/home");
    expect(resMatch.ssimScore).toBe(1.0);
    expect(resMatch.pixelDiffPercentage).toBe(0);
    expect(resMatch.diffStatus).toBe("MATCH");
    expect(resMatch.diffBoxes.length).toBe(0);

    const resDrift = analyzeVisualRegression("https://example.com/v1", "https://example.com/v2");
    expect(resDrift.ssimScore).toBeGreaterThanOrEqual(0.7);
    expect(resDrift.pixelDiffPercentage).toBeGreaterThanOrEqual(0);
    expect(["MATCH", "MINOR_DRIFT", "LAYOUT_SHIFT", "CRITICAL_REGRESSION"]).toContain(resDrift.diffStatus);
    expect(resDrift.summary).toContain("SSIM Index");
  });

  test("synthesizeUserJourney compiles recorded interactions into Playwright and Puppeteer E2E scripts", () => {
    const journey = synthesizeUserJourney("E-Commerce Checkout Flow", [
      { step: 1, type: "navigate", url: "https://shop.example.com/pdp", description: "Open Product Detail Page" },
      { step: 2, type: "click", selector: 'button[data-testid="add-to-cart"]', description: "Click Add to Cart" },
      { step: 3, type: "fill", selector: 'input[name="coupon"]', value: "SUMMER2026", description: "Apply Discount Coupon" },
      { step: 4, type: "click", selector: 'button[type="submit"]', description: "Submit Checkout Form" },
      { step: 5, type: "assert_text", selector: ".order-status", expectedText: "Order Confirmed", description: "Verify order confirmation" },
    ]);

    expect(journey.journeyName).toBe("E-Commerce Checkout Flow");
    expect(journey.stepCount).toBe(5);
    expect(journey.assertionsCount).toBe(1);
    expect(journey.estimatedDurationMs).toBeGreaterThan(0);

    // Playwright assertions
    expect(journey.playwrightCode).toContain("@playwright/test");
    expect(journey.playwrightCode).toContain("await page.goto('https://shop.example.com/pdp');");
    expect(journey.playwrightCode).toContain("await page.locator('button[data-testid=\"add-to-cart\"]').click();");
    expect(journey.playwrightCode).toContain("await expect(page.locator('.order-status')).toContainText('Order Confirmed');");

    // Puppeteer assertions
    expect(journey.puppeteerCode).toContain("puppeteer.launch()");
    expect(journey.puppeteerCode).toContain("await page.goto('https://shop.example.com/pdp');");
    expect(journey.puppeteerCode).toContain("await page.click('button[data-testid=\"add-to-cart\"]');");
  });

  test("manageSessionVault manages isolated multi-identity session states", () => {
    // 1. Snapshot Admin Profile
    const snapAdmin = manageSessionVault("snapshot", "admin_user", {
      url: "https://dashboard.example.com",
      localStorage: { "role": "admin", "token": "adm_secret_token" },
    });
    expect(snapAdmin.success).toBe(true);
    expect(snapAdmin.snapshot?.profileId).toBe("admin_user");
    expect(snapAdmin.totalProfilesCount).toBeGreaterThanOrEqual(1);

    // 2. Snapshot Guest Profile
    const snapGuest = manageSessionVault("snapshot", "guest_user", {
      url: "https://dashboard.example.com",
      localStorage: { "role": "guest" },
    });
    expect(snapGuest.success).toBe(true);

    // 3. List Profiles
    const listRes = manageSessionVault("list");
    expect(listRes.availableProfiles).toContain("admin_user");
    expect(listRes.availableProfiles).toContain("guest_user");

    // 4. Restore Admin Profile
    const restoreAdmin = manageSessionVault("restore", "admin_user");
    expect(restoreAdmin.success).toBe(true);
    expect(restoreAdmin.snapshot?.localStorage.role).toBe("admin");

    // 5. Restore Non-Existent Profile
    const restoreMissing = manageSessionVault("restore", "non_existent");
    expect(restoreMissing.success).toBe(false);

    // 6. Clear Profile
    const clearRes = manageSessionVault("clear", "guest_user");
    expect(clearRes.success).toBe(true);
  });

  test("monitorInteractionVitals measures INP latency breakdown and identifies slow interactions", () => {
    const inp = monitorInteractionVitals("https://example.com/interactive-grid");
    expect(inp.inpScoreMs).toBeGreaterThan(0);
    expect(["GOOD", "NEEDS_IMPROVEMENT", "POOR"]).toContain(inp.rating);
    expect(inp.targetMs).toBe(200);

    const b = inp.breakdown;
    expect(b.inputDelayMs).toBeGreaterThan(0);
    expect(b.processingDurationMs).toBeGreaterThan(0);
    expect(b.presentationDelayMs).toBeGreaterThan(0);
    expect(inp.optimizations.length).toBeGreaterThan(0);
  });

  test("createBrowserContextOperation dispatches all 5 intelligence actions smoothly", async () => {
    const healRes = await browserOp(
      { action: "smart_selector_heal", url: "https://example.com", selector: ".old-btn", data_testid: "new-btn", role: "button" },
      undefined,
      mockContext
    );
    expect((healRes as any).healedSelector).toBeDefined();

    const diffRes = await browserOp(
      { action: "visual_regression_diff", url: "https://example.com/v2", baseline_url: "https://example.com/v1" },
      undefined,
      mockContext
    );
    expect((diffRes as any).ssimScore).toBeDefined();

    const journeyRes = await browserOp(
      { action: "journey_record_and_replay", url: "https://example.com", journey_name: "Login Flow" },
      undefined,
      mockContext
    );
    expect((journeyRes as any).playwrightCode).toBeDefined();

    const vaultRes = await browserOp(
      { action: "session_isolation_vault", url: "https://example.com", mode: "list" },
      undefined,
      mockContext
    );
    expect((vaultRes as any).totalProfilesCount).toBeGreaterThanOrEqual(0);

    const inpRes = await browserOp(
      { action: "inp_interaction_vitals", url: "https://example.com" },
      undefined,
      mockContext
    );
    expect((inpRes as any).inpScoreMs).toBeGreaterThan(0);
  });
});
