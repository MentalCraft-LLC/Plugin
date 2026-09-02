/**
 * Plugin/Company FastMCP Server
 */

import { COMPANY_PROTOCOL, type CompanyAction } from "./core.ts";
import { companyOperation } from "./operation.ts";

export const COMPANY_INPUT_SCHEMA = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: [
        "company_entity_audit",
        "company_cap_table_calc",
        "company_ip_assignment_audit",
        "company_compliance_check",
      ],
      description: "Company action to perform",
    },
    params: {
      type: "object",
      description: "Action-specific parameters",
    },
  },
  required: ["action"],
} as const;

export async function handleCompanyMcpCall(params: {
  action: CompanyAction;
  params?: Record<string, unknown>;
}) {
  return await companyOperation(params.action, params.params || {});
}

if (import.meta.main) {
  console.log(`[Plugin/Company] FastMCP Server initialized with protocol ${COMPANY_PROTOCOL}`);
}
