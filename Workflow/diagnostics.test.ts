import { describe, test, expect } from "bun:test";
import { runMentalCraftDiagnostics, formatDiagnosticReport } from "./diagnostics.ts";

describe("MentalCraft 10-Dimensional Full-Spectrum Diagnostic Engine", () => {
  test("runMentalCraftDiagnostics audits all 10 dimensions with code-level precision", () => {
    const report = runMentalCraftDiagnostics();
    expect(report.productName).toBe("MentalCraft");
    expect(report.domain).toBe("mentalcraft.org");
    expect(report.targetMrrUsd).toBe(10000);
    expect(report.overallHealthScore).toBe(100);
    expect(report.issues).toBeArray();

    // Verify all 10 dimensions are present
    const dims = report.dimensions;
    expect(dims.trafficAcquisition.passed).toBe(true);
    expect(dims.llmoSearchCitability.passed).toBe(true);
    expect(dims.conversionValueProp.passed).toBe(true);
    expect(dims.billingDelivery.passed).toBe(true);
    expect(dims.clinicalEeat.passed).toBe(true);
    expect(dims.ethicsPrivacyCompliance.passed).toBe(true);
    expect(dims.uxPerformanceA11y.passed).toBe(true);
    expect(dims.i18nLocalization.passed).toBe(true);
    expect(dims.practitionerWorkspace.passed).toBe(true);
    expect(dims.architectureResilience.passed).toBe(true);

    const formatted = formatDiagnosticReport(report);
    expect(formatted).toContain("10-Dimensional Full-Spectrum Diagnostic Report");
    expect(formatted).toContain("10 Full-Spectrum Audit Dimensions");
    expect(formatted).toContain("$10,000 MRR");
  });
});
