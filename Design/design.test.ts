import { describe, expect, test } from "bun:test";
import { designOperation } from "./operation.ts";
import { handleDesignRpc } from "./mcp-server.ts";
import { compactDesignResult } from "./pi.ts";
import { DESIGN_PROTOCOL, COMPONENT_CATALOG, DESIGN_TOKENS } from "./core.ts";

describe("Design System & UI Intelligence Engine", () => {
  test("list_layers returns 5-layer hierarchy and governance rules", async () => {
    const res = await designOperation({ action: "list_layers" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(DESIGN_PROTOCOL);
    const data = res.data as { layers: Array<{ name: string; level: number }> };
    expect(data.layers.length).toBe(5);
    expect(data.layers.map((l) => l.name)).toEqual([
      "foundation",
      "component",
      "composite",
      "block",
      "template",
    ]);
  });

  test("catalog lists components and filters by layer and category", async () => {
    const all = await designOperation({ action: "catalog" });
    expect(all.success).toBe(true);
    const allData = all.data as { total: number; components: Array<{ id: string; name: string }> };
    expect(allData.total).toBe(COMPONENT_CATALOG.length);

    // Filter by layer
    const componentsOnly = await designOperation({ action: "catalog", layer: "component" });
    const compData = componentsOnly.data as { total: number; components: Array<{ layer: string }> };
    expect(compData.components.every((c) => c.layer === "component")).toBe(true);

    // Search by prompt
    const buttonSearch = await designOperation({ action: "catalog", prompt: "button" });
    const searchData = buttonSearch.data as { total: number; components: Array<{ id: string }> };
    expect(searchData.components.some((c) => c.id === "button")).toBe(true);
  });

  test("inspect_component returns schema, props, variants and example code", async () => {
    const res = await designOperation({ action: "inspect_component", component_id: "button" });
    expect(res.success).toBe(true);
    const data = res.data as {
      component: { name: string; variants: string[]; a11yRole: string; example: string };
      quickImport: string;
    };
    expect(data.component.name).toBe("Button");
    expect(data.component.variants).toContain("primary");
    expect(data.component.variants).toContain("line");
    expect(data.component.a11yRole).toBe("button");
    expect(data.quickImport).toBe("import { Button } from 'infra-ui-svelte';");
    expect(data.component.example).toContain("<Button");

    // Graceful error on non-existent component
    const missing = await designOperation({ action: "inspect_component", component_id: "non_existent_xyz" });
    expect(missing.success).toBe(false);
    expect(missing.diagnostics?.[0]).toContain("not found in catalog");
  });

  test("theme_tokens exports design token dictionary and CSS variables", async () => {
    const res = await designOperation({ action: "theme_tokens" });
    expect(res.success).toBe(true);
    const data = res.data as { total: number; tokens: typeof DESIGN_TOKENS; cssRoot: string };
    expect(data.total).toBe(DESIGN_TOKENS.length);
    expect(data.cssRoot).toContain(":root {");
    expect(data.cssRoot).toContain("--color-primary:");
    expect(data.cssRoot).toContain("--radius-md:");

    // Filter by color category
    const colors = await designOperation({ action: "theme_tokens", token_category: "color" });
    const colorData = colors.data as { tokens: Array<{ category: string }> };
    expect(colorData.tokens.every((t) => t.category === "color")).toBe(true);
  });

  test("generate_ui synthesizes clean, accessible Svelte 5 runes code", async () => {
    const marketing = await designOperation({ action: "generate_ui", intent: "marketing_hero" });
    expect(marketing.success).toBe(true);
    const mData = marketing.data as { requiredImports: string[]; svelteSnippet: string };
    expect(mData.requiredImports).toContain("Hero");
    expect(mData.svelteSnippet).toContain("<script lang=\"ts\">");
    expect(mData.svelteSnippet).toContain("infra-ui-svelte");
    expect(mData.svelteSnippet).toContain("<Hero");

    const auth = await designOperation({ action: "generate_ui", intent: "auth_form" });
    expect(auth.success).toBe(true);
    const aData = auth.data as { requiredImports: string[]; svelteSnippet: string };
    expect(aData.requiredImports).toContain("Card");
    expect(aData.requiredImports).toContain("Input");
    expect(aData.svelteSnippet).toContain("let email = $state");
  });

  test("audit_ui checks code against token usage, A11y labels and touch targets", async () => {
    const badCode = `
      <div style="background-color: #ff0000;">
        <button class="h-4 w-4">Click</button>
        <input type="text" />
      </div>
    `;
    const res = await designOperation({ action: "audit_ui", template_code: badCode });
    expect(res.success).toBe(true);
    const data = res.data as { score: number; compliant: boolean; diagnostics: string[]; suggestions: string[] };
    expect(data.compliant).toBe(false);
    expect(data.score).toBeLessThan(100);
    expect(data.diagnostics.some((d) => d.includes("hardcoded HEX"))).toBe(true);
    expect(data.diagnostics.some((d) => d.includes("raw HTML <button>"))).toBe(true);
    expect(data.diagnostics.some((d) => d.includes("missing both 'id'"))).toBe(true);

    // Clean code audit
    const goodCode = `<Card padding="md"><Button variant="primary" label="Submit">Submit</Button></Card>`;
    const cleanRes = await designOperation({ action: "audit_ui", template_code: goodCode });
    const cleanData = cleanRes.data as { score: number; compliant: boolean };
    expect(cleanData.compliant).toBe(true);
    expect(cleanData.score).toBe(100);
  });

  test("bridge_chrome maps Chrome DOM elements back to Design System components", async () => {
    const buttonElement = {
      tag: "BUTTON",
      id: "submit-btn",
      className: "btn-primary custom-style",
      role: "button",
      rect: { width: 120, height: 40 },
    };
    const res = await designOperation({ action: "bridge_chrome", chrome_element: buttonElement });
    expect(res.success).toBe(true);
    const data = res.data as {
      matchedDesignComponent: { name: string; layer: string; suggestedReplacement: string } | null;
      tokenMappings: Record<string, string>;
    };
    expect(data.matchedDesignComponent?.name).toBe("Button");
    expect(data.matchedDesignComponent?.suggestedReplacement).toBe("<Button />");
    expect(data.tokenMappings.font).toBe("var(--font-body)");
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    // 1. initialize
    const initRes = await handleDesignRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.id).toBe(1);
    expect((initRes.result as { serverInfo: { name: string } }).serverInfo.name).toBe("mentalcraft-design-mcp");

    // 2. tools/list
    const listRes = await handleDesignRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (listRes.result as { tools: Array<{ name: string }> }).tools;
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe("design");

    // 3. tools/call
    const callRes = await handleDesignRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "design",
        arguments: { action: "catalog" },
      },
    });
    expect(callRes.id).toBe(3);
    const content = (callRes.result as { content: Array<{ text: string }> }).content;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.action).toBe("catalog");
    expect(parsed.success).toBe(true);
  });

  test("resolve_imports calculates on-demand subpaths and tree-shaking savings", async () => {
    const res = await designOperation({
      action: "resolve_imports",
      components: ["Button", "Input", "Card"],
    });
    expect(res.success).toBe(true);
    const data = res.data as {
      matchedComponents: Array<{ name: string; subpath: string; sizeKb: number }>;
      barrelStatement: string;
      subpathStatements: string;
      metrics: { estimatedOnDemandKb: number; treeShakingSavings: string };
    };
    expect(data.matchedComponents.length).toBe(3);
    expect(data.subpathStatements).toContain("infra-ui-svelte/component/interaction/button");
    expect(data.subpathStatements).toContain("infra-ui-svelte/component/input/text");
    expect(data.metrics.estimatedOnDemandKb).toBeLessThan(10);
    expect(data.metrics.treeShakingSavings).toContain("%");
  });

  test("domain_presets returns pre-bundled domain packs like clinical and chat", async () => {
    // List all
    const allPresets = await designOperation({ action: "domain_presets" });
    expect(allPresets.success).toBe(true);
    const allData = allPresets.data as { total: number; presets: Array<{ id: string }> };
    expect(allData.total).toBe(5);

    // Get clinical preset
    const clinical = await designOperation({ action: "domain_presets", preset_name: "clinical" });
    expect(clinical.success).toBe(true);
    const cData = clinical.data as { preset: { name: string; recommendedComponents: string[] }; subpathImports: string };
    expect(cData.preset.name).toContain("Clinical");
    expect(cData.preset.recommendedComponents).toContain("Screener");
    expect(cData.subpathImports).toContain("infra-ui-svelte/block/tool/screener");
  });

  test("bundle_optimize prunes unused components and converts to subpaths", async () => {
    const codeWithUnused = `
      <script>
        import { Button, Dialog, Card, Kanban } from "infra-ui-svelte";
      </script>
      <Card>
        <Button>Click</Button>
      </Card>
    `;
    const res = await designOperation({ action: "bundle_optimize", template_code: codeWithUnused });
    expect(res.success).toBe(true);
    const data = res.data as {
      optimized: boolean;
      removedUnused: string[];
      retainedComponents: string[];
      optimizedCode: string;
    };
    expect(data.optimized).toBe(true);
    expect(data.removedUnused).toContain("Dialog");
    expect(data.removedUnused).toContain("Kanban");
    expect(data.retainedComponents).toContain("Button");
    expect(data.retainedComponents).toContain("Card");
    expect(data.optimizedCode).toContain("infra-ui-svelte/component/interaction/button");
    expect(data.optimizedCode).toContain("infra-ui-svelte/component/scaffold/card");
  });

  test("Pi compactDesignResult formats readable concise terminal logs", async () => {
    const res = await designOperation({ action: "catalog" });
    const log = compactDesignResult(res);
    expect(log).toContain("Catalog (10 components):");
    expect(log).toContain("Button");
  });
});
