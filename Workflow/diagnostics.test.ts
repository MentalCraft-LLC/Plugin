import { describe, test, expect } from "bun:test";
import { runMentalCraftDiagnostics, formatDiagnosticReport } from "./diagnostics.ts";

describe("MentalCraft Systemic Diagnostic & Governance Engine", () => {
  test("runMentalCraftDiagnostics audits product and returns clean report", () => {
    const report = runMentalCraftDiagnostics();
    expect(report.productName).toBe("MentalCraft");
    expect(report.domain).toBe("mentalcraft.org");
    expect(report.targetMrrUsd).toBe(10050);
    expect(report.overallHealthScore).toBeGreaterThanOrEqual(80);
    expect(report.issues).toBeArray();

    const formatted = formatDiagnosticReport(report);
    expect(formatted).toContain("MentalCraft Systemic Diagnostic & Governance Report");
    expect(formatted).toContain("$10,050 MRR");
  });
});
