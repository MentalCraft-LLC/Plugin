/**
 * Plugin/Infra FastMCP Server
 */

import { INFRA_PROTOCOL, type InfraAction } from "./core.ts";
import { infraOperation } from "./operation.ts";

export const INFRA_INPUT_SCHEMA = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: [
        "infra_canary_probe",
        "infra_d1_schema_audit",
        "infra_worker_bundle_audit",
        "infra_stripe_webhook_simulate",
      ],
      description: "Infra action to perform",
    },
    params: {
      type: "object",
      description: "Action-specific parameters",
    },
  },
  required: ["action"],
} as const;

export async function handleInfraMcpCall(params: {
  action: InfraAction;
  params?: Record<string, unknown>;
}) {
  return await infraOperation(params.action, params.params || {});
}

if (import.meta.main) {
  console.log(`[Plugin/Infra] FastMCP Server initialized with protocol ${INFRA_PROTOCOL}`);
}
