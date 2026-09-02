/**
 * Plugin/Company Core - Corporate Governance, Legal Entities, Equity & Compliance Protocol
 *
 * FastMCP protocol engine managing MentalCraft LLC and subsidiary corporate structures:
 * - Module 1: Legal Operating Entities & Jurisdictional Verification (Wyoming LLC, Hangzhou R&D)
 * - Module 2: Cap Table, Founder Equity & ESOP Dilution (Vesting schedules, Option Pools)
 * - Module 3: Intellectual Property & Software Assignment (Patents, Copyrights, Trademarks)
 * - Module 4: Corporate Secretarial & Annual Compliance (Registered Agent, Annual Reports)
 */

export const COMPANY_PROTOCOL = "holar.company.v1" as const;

export type CompanyModule = "entity" | "equity" | "ip" | "compliance";

export type CompanyAction =
  | "company_entity_audit"
  | "company_cap_table_calc"
  | "company_ip_assignment_audit"
  | "company_compliance_check";

export interface CompanyEntityAuditInput {
  workspaceRoot?: string;
}

export interface CompanyEntityAuditOutput {
  status: "COMPLIANT" | "NON_COMPLIANT";
  auditedCount: number;
  entities: {
    entityName: string;
    jurisdiction: string;
    role: string;
    status: "ACTIVE" | "PENDING" | "INACTIVE";
    details: string;
  }[];
}

export interface CompanyCapTableCalcInput {
  founderShares?: number;
  esopPoolPercentage?: number;
  newInvestmentUsd?: number;
  preMoneyValuationUsd?: number;
}

export interface CompanyCapTableCalcOutput {
  totalShares: number;
  founderShares: number;
  founderOwnershipPercent: number;
  esopShares: number;
  esopPoolPercent: number;
  postMoneyValuationUsd: number;
  investorOwnershipPercent: number;
  dilutionSummary: string;
}

export interface CompanyIpAssignmentAuditInput {
  workspaceRoot?: string;
}

export interface CompanyIpAssignmentAuditOutput {
  status: "COMPLIANT" | "DEFICIENT";
  patentsAssigned: number;
  softwareRepositoriesAssigned: number;
  ipChainVerified: boolean;
  diagnostics: string[];
}

export interface CompanyComplianceCheckInput {
  entity?: string;
}

export interface CompanyComplianceCheckOutput {
  status: "GOOD_STANDING" | "ACTION_REQUIRED";
  registeredAgentActive: boolean;
  annualReportCompliant: boolean;
  taxPassThroughStatus: string;
  nextFilingDeadline: string;
  actionItems: string[];
}
