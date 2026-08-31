/**
 * Plugin/Gateway - Master MCP Server & Cross-Plugin Orchestrator
 *
 * Provides a single unified JSON-RPC 2.0 stdio entry point aggregating all 6 MentalCraft plugins:
 * - chrome, design, business, science, message
 * - plus 'plugin_registry', 'plugin_workflow', and 'plugin_health' for meta-introspection and multi-step execution.
 */

import { PLUGIN_REGISTRY, COMPOUND_WORKFLOWS, type PluginId, type CompoundWorkflowId } from "./registry.ts";
import { runPluginHealthCheck } from "./health.ts";
import { designOperation } from "./Design/operation.ts";
import { businessOperation } from "./Business/operation.ts";
import { scienceOperation } from "./Science/operation.ts";
import { DESIGN_INPUT_SCHEMA } from "./Design/mcp-server.ts";
import { BUSINESS_INPUT_SCHEMA } from "./Business/mcp-server.ts";
import { SCIENCE_INPUT_SCHEMA } from "./Science/mcp-server.ts";

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

export const GATEWAY_TOOLS = [
  {
    name: "plugin_registry",
    description: "Introspect all registered MentalCraft plugins, actions, architecture pillars, and capabilities.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        plugin_id: {
          type: "string",
          enum: ["chrome", "design", "business", "science", "message", "secret", "all"],
          description: "Target plugin to inspect or 'all' for complete catalog.",
        },
      },
    },
  },
  {
    name: "plugin_health",
    description: "Run comprehensive diagnostic and health checks across all plugins or a specific target.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        target: {
          type: "string",
          enum: ["chrome", "design", "business", "science", "message", "secret", "all"],
          description: "Plugin to check or 'all'.",
        },
      },
    },
  },
  {
    name: "plugin_workflow",
    description: "Execute or inspect pre-configured cross-plugin compound workflows.",
    inputSchema: {
      type: "object",
      required: ["workflow_id"],
      additionalProperties: false,
      properties: {
        workflow_id: {
          type: "string",
          enum: ["launch_product_campaign", "clinical_study_to_screener", "automated_revenue_monitor", "list"],
          description: "Compound workflow identifier.",
        },
        dry_run: {
          type: "boolean",
          description: "If true, returns workflow plan without executing external actions.",
        },
        parameters: {
          type: "object",
          description: "Optional custom parameters passed into the workflow steps.",
        },
      },
    },
  },
  {
    name: "design",
    description: "MentalCraft Design System & UI Intelligence Engine (5-layer hierarchy, tokens, Svelte 5 runes generation, on-demand subpaths, domain presets).",
    inputSchema: DESIGN_INPUT_SCHEMA,
  },
  {
    name: "business",
    description: "MentalCraft Business & Product Engineering Intelligence Engine (Google SEO KD, Link Budgets, Stripe Radar Leaderboards, MRR Trajectories).",
    inputSchema: BUSINESS_INPUT_SCHEMA,
  },
  {
    name: "science",
    description: "MentalCraft Science & Research Intelligence Engine (Clinical Scale Scoring GAD-7/PHQ-9, Suicidal Crisis Safety Protocol, Literature Discovery, Patent Novelty Audits).",
    inputSchema: SCIENCE_INPUT_SCHEMA,
  },
];

export async function handleGatewayRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
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
          name: "mentalcraft-gateway-mcp",
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
        tools: GATEWAY_TOOLS,
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    try {
      let output: unknown;

      if (toolName === "plugin_registry") {
        const target = (args.plugin_id as string) ?? "all";
        if (target === "all") {
          output = {
            total: Object.keys(PLUGIN_REGISTRY).length,
            plugins: Object.values(PLUGIN_REGISTRY),
          };
        } else {
          output = {
            plugin: PLUGIN_REGISTRY[target as PluginId] ?? null,
          };
        }
      } else if (toolName === "plugin_health") {
        const target = (args.target as PluginId | "all") ?? "all";
        output = await runPluginHealthCheck(target);
      } else if (toolName === "plugin_workflow") {
        const wfId = args.workflow_id as CompoundWorkflowId | "list";
        if (wfId === "list") {
          output = {
            total: COMPOUND_WORKFLOWS.length,
            workflows: COMPOUND_WORKFLOWS,
          };
        } else {
          const wf = COMPOUND_WORKFLOWS.find((w) => w.id === wfId);
          if (!wf) {
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: `Workflow '${wfId}' not found.` },
            };
          }

          if (args.dry_run) {
            output = {
              workflow: wf,
              status: "dry_run_ready",
              steps: wf.pipelineSteps,
            };
          } else {
            // Live sequential execution of multi-plugin pipeline
            const stepResults: Array<{ step: number; plugin: string; action: string; success: boolean; result: unknown }> = [];

            if (wfId === "clinical_study_to_screener") {
              // Step 1: Science scoring
              const r1 = await scienceOperation({ action: "score_scale", scale: "gad7", answers: { q1: 2, q2: 3, q3: 2 } });
              stepResults.push({ step: 1, plugin: "science", action: "score_scale", success: r1.success, result: r1.data });

              // Step 2: Science crisis check
              const r2 = await scienceOperation({ action: "crisis_boundary_check", answers: { q9: 0 } });
              stepResults.push({ step: 2, plugin: "science", action: "crisis_boundary_check", success: r2.success, result: r2.data });

              // Step 3: Design domain preset
              const r3 = await designOperation({ action: "domain_presets", preset_name: "clinical" });
              stepResults.push({ step: 3, plugin: "design", action: "domain_presets", success: r3.success, result: r3.data });

              // Step 4: Design on-demand imports
              const r4 = await designOperation({ action: "resolve_imports", components: ["Screener", "Questionnaire", "Button", "Card"] });
              stepResults.push({ step: 4, plugin: "design", action: "resolve_imports", success: r4.success, result: r4.data });
            } else if (wfId === "launch_product_campaign") {
              // Step 1: Business SEO
              const r1 = await businessOperation({ action: "seo_keyword_difficulty", keyword: (args.parameters as any)?.keyword ?? "anxiety screener online" });
              stepResults.push({ step: 1, plugin: "business", action: "seo_keyword_difficulty", success: r1.success, result: r1.data });

              // Step 2: Design UI synthesis
              const r2 = await designOperation({ action: "generate_ui", intent: "marketing_hero" });
              stepResults.push({ step: 2, plugin: "design", action: "generate_ui", success: r2.success, result: r2.data });

              // Step 3: Design audit
              const r3 = await designOperation({ action: "audit_ui", template_code: (r2.data as any).svelteSnippet });
              stepResults.push({ step: 3, plugin: "design", action: "audit_ui", success: r3.success, result: r3.data });
            } else {
              const r1 = await businessOperation({ action: "market_site_trajectory", domain: (args.parameters as any)?.domain ?? "lovable.dev" });
              stepResults.push({ step: 1, plugin: "business", action: "market_site_trajectory", success: r1.success, result: r1.data });
            }

            output = {
              workflow: wf,
              status: "completed",
              executedStepsCount: stepResults.length,
              stepResults,
            };
          }
        }
      } else if (toolName === "design") {
        output = await designOperation(args as any);
      } else if (toolName === "business") {
        output = await businessOperation(args as any);
      } else if (toolName === "science") {
        output = await scienceOperation(args as any);
      } else {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName ?? "undefined"}`,
          },
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
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

export function startGatewayMcpStdio() {
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
        const res = await handleGatewayRpc(req);
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
  startGatewayMcpStdio();
}
