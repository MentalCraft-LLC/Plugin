/**
 * Plugin/Workflow Pi Host Adapter
 *
 * Terminal rendering and CLI tool integration for Pi agent environments.
 */

import { Type } from "typebox";
import { workflowOperation } from "./operation.ts";
import { WORKFLOW_ACTIONS } from "./mcp-server.ts";
import type { WorkflowInput, WorkflowResult, SystemHealthReport } from "./core.ts";

const StringEnum = (values: readonly string[]) =>
  Type.Union(values.map((v) => Type.Literal(v)));

export function compactWorkflowResult(result: WorkflowResult): string {
  if (!result.success) {
    return `✗ Workflow ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_workflows": {
      const data = result.data as { total: number; workflows: Array<{ name: string; id: string }> };
      return `Workflows (${data.total}): ${data.workflows.map((w) => w.id).join(", ")}`;
    }
    case "health_check": {
      const data = result.data as SystemHealthReport;
      return `System Health: ${data.healthScore}/100 [${data.overallStatus.toUpperCase()}] (${data.healthyPlugins}/${data.totalPlugins} plugins healthy)`;
    }
    case "dry_run": {
      const data = result.data as { workflow: { name: string }; plan: Array<{ plugin: string; action: string }> };
      return `Dry Run [${data.workflow.name}]: Plan ${data.plan.map((p) => `${p.plugin}.${p.action}`).join(" ➔ ")}`;
    }
    case "run_workflow": {
      const data = result.data as { name: string; executedStepsCount: number };
      return `✓ Workflow [${data.name}]: All ${data.executedStepsCount} steps completed successfully`;
    }
  }
}

export const workflowTool = {
  name: "workflow",
  label: "Workflow Orchestrator",
  description: "MentalCraft Cross-Plugin Orchestrator & Health Diagnostics Engine. Executes end-to-end multi-plugin compound pipelines (Business + Design + Science + Chrome + Message) and runs system-wide integrity health checks.",
  parameters: Type.Object(
    {
      action: StringEnum(WORKFLOW_ACTIONS),
      workflow_id: Type.Optional(
        StringEnum([
          "launch_product_campaign",
          "clinical_study_to_screener",
          "automated_revenue_monitor",
          "design_system_audit_pipeline",
        ] as const)
      ),
      target_plugin: Type.Optional(StringEnum(["chrome", "design", "business", "science", "message", "secret", "all"] as const)),
      parameters: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    },
    { additionalProperties: false }
  ),
  async execute(_toolCallId: string, params: WorkflowInput) {
    const res = await workflowOperation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      details: res,
    };
  },
};
