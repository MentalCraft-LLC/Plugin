/**
 * Plugin/Design MCP Protocol Server
 *
 * Exposes the 'design' tool over JSON-RPC 2.0 stdio stream to any MCP-compliant harness
 * (Cursor, Antigravity, Pi, Claude Desktop, etc.).
 */

import { designOperation } from "./operation.ts";
import { type DesignInput, DESIGN_PROTOCOL } from "./core.ts";

export const DESIGN_ACTIONS = [
  "catalog",
  "inspect_component",
  "theme_tokens",
  "generate_ui",
  "audit_ui",
  "bridge_chrome",
  "list_layers",
  "resolve_imports",
  "domain_presets",
  "bundle_optimize",
  "generate_editorial",
] as const;

export const DESIGN_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: DESIGN_ACTIONS,
      description: "Design action: 'catalog' (list components), 'inspect_component' (deep schema/props/example), 'theme_tokens' (colors, spacing, radius), 'generate_ui' (Svelte 5 runes recipe), 'audit_ui' (A11y/Token linter), 'bridge_chrome' (DOM to component mapper), 'list_layers' (5-layer architecture), 'resolve_imports' (calculate on-demand subpaths & savings), 'domain_presets' (clinical, chat_ai, analytics, commerce, auth, ecommerce_pdp, ecommerce_checkout, academic_manuscript_viewer, venture_telemetry_dashboard), 'bundle_optimize' (refactor monolithic imports), 'generate_editorial' (single-ink and controlled duotone print visual generation with Recipe Manifest).",
    },
    layer: {
      type: "string",
      enum: ["foundation", "component", "composite", "block", "template"],
      description: "Filter catalog by architectural layer.",
    },
    category: {
      type: "string",
      enum: ["interaction", "input", "display", "feedback", "overlay", "navigation", "layout", "scaffold", "status", "media", "conversation", "commerce", "document", "marketing", "tool"],
      description: "Filter catalog by component category.",
    },
    component_id: {
      type: "string",
      description: "Target component ID (e.g. 'button', 'card', 'dialog', 'screener', 'kanban', 'hero').",
    },
    components: {
      type: "array",
      items: { type: "string" },
      description: "List of component names for on-demand subpath resolution.",
    },
    preset_name: {
      type: "string",
      enum: [
        "clinical",
        "chat_ai",
        "analytics",
        "commerce",
        "auth",
        "ecommerce_pdp",
        "ecommerce_checkout",
        "academic_manuscript_viewer",
        "venture_telemetry_dashboard",
      ],
      description: "Target domain preset pack.",
    },
    token_category: {
      type: "string",
      enum: ["color", "typography", "spacing", "radius", "shadow", "elevation", "motion", "breakpoint"],
      description: "Filter design tokens by category.",
    },
    intent: {
      type: "string",
      enum: [
        "marketing_hero",
        "auth_form",
        "screener",
        "chat_stream",
        "settings_panel",
        "pricing_table",
        "ecommerce_pdp",
        "ecommerce_checkout",
        "academic_manuscript_viewer",
        "venture_telemetry_dashboard",
        "custom",
      ],
      description: "Intent for UI generation recipe.",
    },
    prompt: {
      type: "string",
      description: "Free-form search term, component name, or UI generation description.",
    },
    template_code: {
      type: "string",
      description: "Svelte or HTML code snippet to audit against design system standards or optimize imports.",
    },
    chrome_element: {
      type: "object",
      description: "DOM element metadata from Chrome inspector for design system bridging.",
      properties: {
        tag: { type: "string" },
        id: { type: "string" },
        className: { type: "string" },
        role: { type: "string" },
        rect: {
          type: "object",
          properties: {
            width: { type: "number" },
            height: { type: "number" },
          },
        },
      },
      required: ["tag"],
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      description: "Maximum number of catalog items to return.",
    },
    theme: {
      type: "string",
      description: "Subject theme for editorial visual generation (e.g. 'Late Night Convenience Store', 'Nature Research Figure').",
    },
    palette: {
      type: "string",
      enum: [
        "cobalt_terracotta",
        "powder_signal",
        "botanical_oxblood",
        "charcoal_signal",
        "electric_carbon",
        "mint_charcoal",
        "ultramarine_safety",
        "cyan_brick",
        "tangerine_slate",
      ],
      description: "Duotone ink palette recipe for editorial print generation.",
    },
    substrate: {
      type: "string",
      enum: ["neutral_white", "cool_gray", "pale_beige"],
      description: "Paper substrate background tone.",
    },
    ratio: {
      type: "string",
      description: "Aspect ratio for editorial visual (e.g. '3:4', '1:1', '16:9', '4:3').",
    },
    exact_text: {
      type: "string",
      description: "Preserved display text phrase (2-8 words).",
    },
    mode: {
      type: "string",
      enum: ["controlled_two_ink", "pure_one_ink", "overprint_duotone"],
      description: "Print reproduction mode.",
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

export async function handleDesignRpc(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
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
          name: "mentalcraft-design-mcp",
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
            name: "design",
            description: "MentalCraft Design System & UI Intelligence Engine. Query components, inspect props/slots, export tokens, generate accessible Svelte 5 runes UI, and audit templates.",
            inputSchema: DESIGN_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (params?.name !== "design") {
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
      const input = (params.arguments ?? {}) as unknown as DesignInput;
      const result = await designOperation(input);
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

export function startDesignMcpStdio() {
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
        const res = await handleDesignRpc(req);
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
  startDesignMcpStdio();
}
