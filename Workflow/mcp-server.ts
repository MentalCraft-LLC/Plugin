/**
 * Plugin/Workflow MCP Protocol Server
 *
 * Exposes the 'workflow' cross-plugin orchestrator & health diagnostics tool over JSON-RPC 2.0 stdio.
 */

import { workflowOperation } from "./operation.ts";
import { type WorkflowInput } from "./core.ts";

export const WORKFLOW_ACTIONS = [
  "list_workflows",
  "run_workflow",
  "health_check",
  "dry_run",
] as const;

export const WORKFLOW_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: WORKFLOW_ACTIONS,
      description: "Workflow action: 'list_workflows' (catalog of multi-plugin pipelines), 'run_workflow' (live sequential execution), 'health_check' (pre-flight diagnostics), 'dry_run' (plan graph inspection).",
    },
    workflow_id: {
      type: "string",
      enum: [
        "launch_product_campaign",
        "clinical_study_to_screener",
        "automated_revenue_monitor",
        "design_system_audit_pipeline",
      ],
      description: "Target workflow identifier.",
    },
    target_plugin: {
      type: "string",
      enum: ["chrome", "design", "business", "science", "message", "secret", "all"],
      description: "Target plugin for health check.",
    },
    parameters: {
      type: "object",
      description: "Optional custom parameters passed to workflow pipeline steps.",
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

export async function handleWorkflowRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = request.id ?? null;

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
        process.stdout.write(JSON.stringify(res) + "\n");
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
