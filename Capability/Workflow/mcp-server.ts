/**
 * Plugin/Workflow MCP Protocol Server
 *
 * Exposes the 'workflow' cross-plugin orchestrator & health diagnostics tool over JSON-RPC 2.0 stdio.
 */

import { workflowOperation } from "./operation.ts";
import { type WorkflowInput } from "./core.ts";

export const WORKFLOW_ACTIONS = [
  "plan_dynamic_workflow",
  "run_dynamic_workflow",
  "list_workflows",
  "run_workflow",
  "register_workflow",
  "get_workflow_history",
  "export_config",
  "install_mcp_schemas",
  "sync_mcp",
  "export_schema_catalog",
  "export_openapi_catalog",
  "export_openrpc_spec",
  "export_openapi_spec",
  "benchmark",
  "get_metrics",
  "export_trace",
  "export_mermaid_dag",
  "batch_run",
  "health_check",
  "dry_run",
  "check_flywheel",
  "audit_workspace",
  "run_diagnostics",
  "reset_circuit",
  "get_circuit",
  "autopilot_step",
  "autopilot_status",
  "autopilot_schedule_spec",
  "autopilot_run",
] as const;

export const WORKFLOW_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: WORKFLOW_ACTIONS,
      description: "Workflow action: 'list_workflows' (catalog of pipelines), 'run_workflow' (live execution), 'register_workflow' (define custom DAG), 'get_workflow_history' (past execution receipts), 'export_config' (generate MCP client JSON configs), 'install_mcp_schemas' (install to Antigravity), 'sync_mcp' (auto-heal & sync all 11 FastMCP servers and schemas), 'export_schema_catalog' / 'export_openrpc_spec' (OpenRPC 1.3.2 specification), 'export_openapi_catalog' / 'export_openapi_spec' (OpenAPI 3.1.0 specification), 'benchmark' (P50/P90/P99 latency & ops/sec suite across all 10 subsystems), 'get_metrics' (live telemetry and circuit breaker state), 'get_circuit' (inspect circuit state), 'reset_circuit' (reset circuit breaker), 'export_trace' (OTel spans export), 'export_mermaid_dag' (Mermaid diagram), 'batch_run' (pooled parallel execution), 'health_check' (system diagnostics), 'dry_run' (plan graph inspection), 'run_diagnostics' (10-dimensional product health audit), 'autopilot_step' (autonomous sprint cycle).",
    },
    workflow_id: {
      type: "string",
      description: "Target workflow identifier.",
    },
    target_action: {
      type: "string",
      description: "Target action key for circuit breaker query or reset (e.g. 'business.venture_market_validation').",
    },
    target_plugin: {
      type: "string",
      enum: ["browser", "chrome", "design", "business", "science", "content", "message", "secret", "infra", "company", "workflow", "all"],
      description: "Target plugin for health check.",
    },
    client_target: {
      type: "string",
      enum: ["claude_desktop", "cursor", "antigravity", "all"],
      description: "Target IDE or agent client for export_config.",
    },
    custom_workflow: {
      type: "object",
      description: "Custom workflow definition object containing id, name, description, requiredPlugins, and steps.",
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "plugin", "action"],
        properties: {
          id: { type: "string" },
          plugin: { type: "string" },
          action: { type: "string" },
          parameters: { type: "object" },
        },
      },
      description: "List of concurrent tasks for batch_run action.",
    },
    concurrency: {
      type: "integer",
      description: "Maximum concurrency pool limit for batch_run.",
    },
    parameters: {
      type: "object",
      description: "Optional custom parameters passed to workflow pipeline steps.",
    },
    benchmark_options: {
      type: "object",
      description: "Options for benchmark execution (iterations, warmupIterations, subsystems).",
      properties: {
        iterations: { type: "integer", description: "Number of benchmark iterations per target." },
        warmupIterations: { type: "integer", description: "Number of warmup iterations." },
        subsystems: {
          type: "array",
          items: { type: "string" },
          description: "Subsystems to include in benchmark.",
        },
      },
    },
  },
} as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export async function handleWorkflowRpc(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id;

  // JSON-RPC 2.0 Notification: requests without an id (or notifications/*) MUST NOT return a response
  if (id === undefined || request.method.startsWith("notifications/")) {
    return null;
  }

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "mentalcraft-workflow-mcp",
          version: "1.0.0",
        },
      },
    };
  }

  if (request.method === "ping") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
    };
  }

  if (request.method === "resources/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { resources: [] },
    };
  }

  if (request.method === "prompts/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { prompts: [] },
    };
  }

  if (request.method === "logging/setLevel") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
    };
  }

  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "workflow",
            description: "MentalCraft Cross-Plugin Orchestrator & Health Diagnostics Engine. Executes end-to-end multi-plugin compound pipelines (Business + Design + Science + Chrome + Message) and runs system-wide integrity health checks.",
            inputSchema: WORKFLOW_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (params?.name !== "workflow") {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${params?.name ?? "undefined"}`,
        },
      };
    }

    try {
      const input = (params.arguments ?? {}) as unknown as WorkflowInput;
      const result = await workflowOperation(input);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`,
    },
  };
}

export function startWorkflowMcpStdio() {
  let buffer = "";
  process.stdin.setEncoding("utf-8");

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const req = JSON.parse(trimmed) as JsonRpcRequest;
        const res = await handleWorkflowRpc(req);
        if (res !== null && res !== undefined) {
          process.stdout.write(JSON.stringify(res) + "\n");
        }
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          }) + "\n"
        );
      }
    }
  });
}

if (import.meta.main) {
  startWorkflowMcpStdio();
}
