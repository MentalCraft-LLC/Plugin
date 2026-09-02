import { describe, expect, test } from "bun:test";
import {
  executeCompanyEntityAudit,
  executeCompanyCapTableCalc,
  executeCompanyIpAssignmentAudit,
  executeCompanyComplianceCheck,
  companyOperation,
} from "./operation.ts";
import { COMPANY_PROTOCOL } from "./core.ts";

describe("Plugin/Company FastMCP Protocol Engine", () => {
  test("executeCompanyEntityAudit audits dual-jurisdiction entities", () => {
    const audit = executeCompanyEntityAudit();
    expect(audit.status).toBe("COMPLIANT");
    expect(audit.auditedCount).toBe(3);
    expect(audit.entities.some((e) => e.jurisdiction.includes("Wyoming"))).toBe(true);
    expect(audit.entities.some((e) => e.jurisdiction.includes("Hangzhou"))).toBe(true);
  });

  test("executeCompanyCapTableCalc models founder equity and ESOP dilution", () => {
    const cap = executeCompanyCapTableCalc({
      founderShares: 8500000,
      esopPoolPercentage: 15,
      newInvestmentUsd: 1000000,
      preMoneyValuationUsd: 4000000,
    });
    expect(cap.postMoneyValuationUsd).toBe(5000000);
    expect(cap.investorOwnershipPercent).toBe(20);
    expect(cap.esopPoolPercent).toBe(15);
    expect(cap.founderOwnershipPercent).toBe(68);
  });

  test("executeCompanyIpAssignmentAudit validates intellectual property chain", () => {
    const ip = executeCompanyIpAssignmentAudit();
    expect(ip.status).toBe("COMPLIANT");
    expect(ip.softwareRepositoriesAssigned).toBe(7);
    expect(ip.ipChainVerified).toBe(true);
  });

  test("executeCompanyComplianceCheck validates good standing & annual reports", () => {
    const comp = executeCompanyComplianceCheck();
    expect(comp.status).toBe("GOOD_STANDING");
    expect(comp.registeredAgentActive).toBe(true);
    expect(comp.annualReportCompliant).toBe(true);
  });

  test("companyOperation dispatches with COMPANY_PROTOCOL", async () => {
    const res = await companyOperation("company_entity_audit");
    expect(res.protocol).toBe(COMPANY_PROTOCOL);
    expect(res.action).toBe("company_entity_audit");
  });
});
