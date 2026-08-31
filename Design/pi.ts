/**
 * Plugin/Design Pi Host Adapter
 *
 * Terminal rendering and CLI tool integration for Pi agent environments.
 */

import { Type } from "typebox";
import { designOperation } from "./operation.ts";
import { DESIGN_ACTIONS, type JsonRpcRequest } from "./mcp-server.ts";
import type { DesignInput, DesignResult } from "./core.ts";

const StringEnum = (values: readonly string[]) =>
  Type.Union(values.map((v) => Type.Literal(v)));

export function compactDesignResult(result: DesignResult): string {
  if (!result.success) {
    return `✗ ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_layers": {
      const data = result.data as { layers: Array<{ name: string; level: number; description: string }> };
      return `Layers (${data.layers.length}): ${data.layers.map((l) => `${l.level}.${l.name}`).join(" → ")}`;
    }
    case "catalog": {
      const data = result.data as { total: number; components: Array<{ name: string; layer: string }> };
      return `Catalog (${data.total} components): ${data.components.slice(0, 8).map((c) => c.name).join(", ")}${data.total > 8 ? ` +${data.total - 8} more` : ""}`;
    }
    case "inspect_component": {
      const data = result.data as { component: { name: string; layer: string; category: string; example: string }; quickImport: string };
      return `Component <${data.component.name}> [${data.component.layer}/${data.component.category}]: ${data.quickImport}`;
    }
    case "theme_tokens": {
      const data = result.data as { total: number; category: string };
      return `Tokens: ${data.total} ${data.category} variables loaded`;
    }
    case "generate_ui": {
      const data = result.data as { intent: string; requiredImports: string[]; svelteSnippet: string };
      return `Generated ${data.intent} UI with [${data.requiredImports.join(", ")}] (${data.svelteSnippet.split("\n").length} lines)`;
    }
    case "audit_ui": {
      const data = result.data as { score: number; compliant: boolean; diagnosticsCount: number };
      return `Audit Score: ${data.score}/100 ${data.compliant ? "✓ Compliant" : `(${data.diagnosticsCount} issues)`}`;
    }
    case "bridge_chrome": {
      const data = result.data as { matchedDesignComponent: { name: string; layer: string } | null };
      return data.matchedDesignComponent
        ? `Matched DOM element → <${data.matchedDesignComponent.name}> [${data.matchedDesignComponent.layer}]`
        : `No direct component match for DOM element`;
    }
    case "resolve_imports": {
      const data = result.data as { matchedComponents: Array<{ name: string; sizeKb: number }>; metrics: { treeShakingSavings: string; estimatedOnDemandKb: number } };
      return `On-Demand Imports: ${data.matchedComponents.length} components (${data.metrics.estimatedOnDemandKb} KB, ${data.metrics.treeShakingSavings} savings)`;
    }
    case "domain_presets": {
      const data = result.data as { total?: number; preset?: { name: string } };
      return data.preset
        ? `Preset: ${data.preset.name}`
        : `Domain Presets (${data.total} packs available)`;
    }
    case "bundle_optimize": {
      const data = result.data as { optimized: boolean; retainedComponents?: string[]; removedUnused?: string[] };
      return data.optimized
        ? `Bundle Optimized: Retained [${(data.retainedComponents ?? []).join(", ")}], Removed [${(data.removedUnused ?? []).join(", ")}]`
        : `Bundle check: Already optimal`;
    }
  }
}

export const designTool = {
  name: "design",
  label: "Design System",
  description: "MentalCraft Design System & UI Intelligence Engine. Query components, inspect props/slots, export tokens, generate accessible Svelte 5 runes UI, and audit templates.",
  parameters: Type.Object(
    {
      action: StringEnum(DESIGN_ACTIONS),
      layer: Type.Optional(StringEnum(["foundation", "component", "composite", "block", "template"] as const)),
      category: Type.Optional(Type.String()),
      component_id: Type.Optional(Type.String()),
      components: Type.Optional(Type.Array(Type.String())),
      preset_name: Type.Optional(StringEnum(["clinical", "chat_ai", "analytics", "commerce", "auth"] as const)),
      token_category: Type.Optional(StringEnum(["color", "typography", "spacing", "radius", "shadow", "elevation", "motion", "breakpoint"] as const)),
      intent: Type.Optional(StringEnum(["marketing_hero", "auth_form", "screener", "chat_stream", "settings_panel", "pricing_table", "custom"] as const)),
      prompt: Type.Optional(Type.String()),
      template_code: Type.Optional(Type.String()),
      limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    },
    { additionalProperties: false }
  ),
  async execute(_toolCallId: string, params: DesignInput) {
    const res = await designOperation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      details: res,
    };
  },
};
