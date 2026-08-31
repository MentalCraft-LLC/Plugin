/**
 * Plugin/Workflow Core - Cross-Plugin Orchestration, Health & Diagnostics Engine
 *
 * Symmetrical capability engine for coordinating multi-plugin DAG pipelines,
 * pre-flight health diagnostics, custom pipeline registration, and IDE configuration exports.
 */

export const WORKFLOW_PROTOCOL = "holar.workflow.v1" as const;

export type PluginId = "chrome" | "design" | "business" | "science" | "message" | "secret" | "workflow";

export type HealthStatus = "healthy" | "degraded" | "unreachable";

export type PluginHealthReport = {
  pluginId: PluginId;
  name: string;
  status: HealthStatus;
  latencyMs: number;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
};

export type SystemHealthReport = {
  timestamp: string;
  overallStatus: HealthStatus;
  healthScore: number; // 0-100
  totalPlugins: number;
  healthyPlugins: number;
  plugins: Record<PluginId, PluginHealthReport>;
};

export type WorkflowId =
  | "launch_product_campaign"
  | "clinical_study_to_screener"
  | "automated_revenue_monitor"
  | "design_system_audit_pipeline"
  | (string & {});

export type WorkflowStep = {
  step: number;
  plugin: PluginId;
  action: string;
  description: string;
  dependsOn?: number[];
  parameters?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  id: WorkflowId;
  name: string;
  description: string;
  requiredPlugins: PluginId[];
  steps: WorkflowStep[];
  concurrencyMode?: "sequential" | "concurrent_dag";
};

export type WorkflowSpan = {
  name: string;
  plugin: PluginId;
  action: string;
  step: number;
  startOffsetMs: number;
  durationMs: number;
  status: "OK" | "ERROR";
};

export type WorkflowRunReceipt = {
  runId: string;
  workflowId: WorkflowId;
  workflowName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  success: boolean;
  stepsCount: number;
  executionMode: "sequential" | "concurrent_dag";
  stepResults: Array<{
    step: number;
    plugin: PluginId;
    action: string;
    success: boolean;
    durationMs: number;
    data: unknown;
  }>;
  spans?: WorkflowSpan[];
};

export type ClientTargetConfig = "claude_desktop" | "cursor" | "antigravity" | "pi" | "all";

export type ExportConfigResult = {
  target: ClientTargetConfig;
  configs: Record<string, unknown>;
  commandInstructions: string[];
};

export const BUILTIN_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "launch_product_campaign",
    name: "Autonomous Product Campaign Launch",
    description: "Commercial validation: Keyword research & Stripe revenue benchmark → Svelte 5 landing page UI → Chrome live visual/vitals audit.",
    requiredPlugins: ["business", "design", "chrome"],
    steps: [
      { step: 1, plugin: "business", action: "seo_keyword_difficulty", description: "Evaluate search volume & low-hanging fruit ranking opportunities." },
      { step: 2, plugin: "business", action: "market_stripe_radar", description: "Benchmark revenue tiers of top competitors in the niche." },
      { step: 3, plugin: "design", action: "generate_ui", description: "Synthesize Svelte 5 Runes marketing hero and pricing table." },
      { step: 4, plugin: "design", action: "audit_ui", description: "Audit generated code against A11y and OKLCH color tokens." },
      { step: 5, plugin: "chrome", action: "navigate", description: "Load the deployed preview page in an isolated browser context." },
      { step: 6, plugin: "chrome", action: "profile_vitals", description: "Verify LCP, CLS, and FID performance scores." },
    ],
  },
  {
    id: "clinical_study_to_screener",
    name: "Clinical Scale to Interactive Screener Pipeline",
    description: "Scientific validation: Psychometric scoring & crisis boundary check → Scaffold Svelte 5 Screener block → Responsive audit.",
    requiredPlugins: ["science", "design", "chrome"],
    steps: [
      { step: 1, plugin: "science", action: "score_scale", description: "Verify scale severity algorithms and clinical cutoffs." },
      { step: 2, plugin: "science", action: "crisis_boundary_check", description: "Ensure 988 emergency hotline safeguard protocol is active." },
      { step: 3, plugin: "design", action: "domain_presets", description: "Scaffold the 'clinical' domain preset with Screener and Questionnaire." },
      { step: 4, plugin: "design", action: "resolve_imports", description: "Optimize on-demand imports for sub-15KB client footprint." },
      { step: 5, plugin: "chrome", action: "inspect_element", description: "Audit live DOM focus rings, touch targets, and mobile ergonomics." },
    ],
  },
  {
    id: "automated_revenue_monitor",
    name: "Automated Competitor Revenue & Alert Monitor",
    description: "Track Stripe billing trajectory and dispatch milestone notifications to Telegram.",
    requiredPlugins: ["business", "message"],
    steps: [
      { step: 1, plugin: "business", action: "market_site_trajectory", description: "Fetch latest month-over-month checkout referral growth." },
      { step: 2, plugin: "message", action: "send", description: "Dispatch encrypted summary message to designated bot channel." },
    ],
  },
  {
    id: "design_system_audit_pipeline",
    name: "Design System & A11y Compliance Pipeline",
    description: "Audit template code for tokens, resolve minimal subpath imports, and verify DOM tokens via Chrome.",
    requiredPlugins: ["design", "chrome"],
    steps: [
      { step: 1, plugin: "design", action: "audit_ui", description: "Lint template code against hardcoded hex and raw buttons." },
      { step: 2, plugin: "design", action: "resolve_imports", description: "Calculate optimal tree-shaken on-demand subpaths." },
      { step: 3, plugin: "chrome", action: "inspect_element", description: "Verify live DOM element against design tokens." },
    ],
  },
];

export type ActionMetric = {
  calls: number;
  successes: number;
  failures: number;
  totalDurationMs: number;
  avgDurationMs: number;
  p95DurationMs: number;
  circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
};

export type SystemTelemetryReport = {
  timestamp: string;
  uptimeSeconds: number;
  totalInvocations: number;
  overallSuccessRate: number;
  metricsByAction: Record<string, ActionMetric>;
};

export type WorkflowAction =
  | "list_workflows"
  | "run_workflow"
  | "register_workflow"
  | "get_workflow_history"
  | "export_config"
  | "install_mcp_schemas"
  | "export_schema_catalog"
  | "export_openapi_catalog"
  | "get_metrics"
  | "export_trace"
  | "export_mermaid_dag"
  | "batch_run"
  | "health_check"
  | "dry_run";

export type WorkflowInput = {
  action: WorkflowAction;
  workflow_id?: WorkflowId;
  target_plugin?: PluginId | "all";
  custom_workflow?: {
    id: string;
    name: string;
    description: string;
    requiredPlugins: PluginId[];
    steps: WorkflowStep[];
  };
  tasks?: Array<{ id: string; plugin: PluginId; action: string; parameters?: Record<string, unknown> }>;
  concurrency?: number;
  client_target?: ClientTargetConfig;
  parameters?: Record<string, unknown>;
};

export type WorkflowResult = {
  protocol: typeof WORKFLOW_PROTOCOL;
  action: WorkflowAction;
  success: boolean;
  timestamp: string;
  data: unknown;
  diagnostics?: string[];
};

export function formatWorkflowSummary(result: WorkflowResult): string {
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
    case "register_workflow": {
      const data = result.data as any;
      return `✓ Registered Workflow "${data.name}" (${data.registeredId}) with ${data.stepsCount} steps`;
    }
    case "get_workflow_history": {
      const data = result.data as any;
      return `Workflow History: ${data.totalRuns} total runs recorded`;
    }
    case "export_config": {
      const data = result.data as any;
      return `Exported MCP Client Config for [${data.target}]: ${Object.keys(data.configs.mcpServers ?? {}).length} servers configured`;
    }
    case "install_mcp_schemas": {
      const data = result.data as any;
      return `✓ Installed ${data.installedCount} MCP schemas to Antigravity directory (${data.installedPaths.length} tools registered)`;
    }
    case "export_schema_catalog": {
      const data = result.data as any;
      return `OpenRPC Catalog: ${data.totalTools} tools, ${data.totalMethods} methods across ${data.totalPlugins} plugins`;
    }
    case "export_openapi_catalog": {
      const data = result.data as any;
      return `OpenAPI 3.1: ${Object.keys(data.paths).length} endpoints, ${data.info.title}`;
    }
    case "get_metrics": {
      const data = result.data as any;
      return `Telemetry: ${data.totalInvocations} total calls (${data.overallSuccessRate}% success) | ${Object.keys(data.metricsByAction).length} actions tracked`;
    }
    case "export_trace": {
      const data = result.data as any;
      return `Trace Export: ${data.tracesCount} traces, ${data.totalSpans} spans formatted (${data.format})`;
    }
    case "export_mermaid_dag": {
      const data = result.data as any;
      return `Mermaid Graph [${data.workflowId}]: ${data.nodesCount} nodes, ${data.edgesCount} edges generated`;
    }
    case "batch_run": {
      const data = result.data as any;
      return `✓ Batch Execution: ${data.successful}/${data.total} tasks succeeded (${data.durationMs}ms)`;
    }
    case "run_workflow": {
      const data = result.data as any;
      return `✓ Workflow [${data.workflowName ?? data.name}]: All ${data.stepsCount ?? data.executedStepsCount} steps completed (${data.durationMs ?? 0}ms)`;
    }
  }
}

export const compactWorkflowResult = formatWorkflowSummary;

