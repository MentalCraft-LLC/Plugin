import { describe, expect, test } from "bun:test";
import { designOperation } from "./operation.ts";
import { handleDesignRpc } from "./mcp-server.ts";
import {
  DESIGN_PROTOCOL,
  COMPONENT_CATALOG,
  DESIGN_TOKENS,
  DOMAIN_PRESETS,
  compactDesignResult,
} from "./core.ts";

describe("MentalCraft Design System & UI Intelligence Engine", () => {
  test("list_layers returns 5-layer hierarchy and governance rules", async () => {
    const res = await designOperation({ action: "list_layers" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(DESIGN_PROTOCOL);
    const data = res.data as { layers: Array<{ name: string; level: number; description: string }> };
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
    expect(allData.total).toBeGreaterThanOrEqual(14);

    // Filter by layer
    const componentsOnly = await designOperation({ action: "catalog", layer: "component" });
    const compData = componentsOnly.data as { total: number; components: Array<{ layer: string }> };
    expect(compData.components.every((c) => c.layer === "component")).toBe(true);

    // Filter by category
    const statusOnly = await designOperation({ action: "catalog", category: "status" });
    const statusData = statusOnly.data as { total: number; components: Array<{ id: string }> };
    expect(statusData.components.some((c) => c.id === "badge")).toBe(true);

    // Search by prompt
    const drawerSearch = await designOperation({ action: "catalog", prompt: "drawer" });
    const searchData = drawerSearch.data as { total: number; components: Array<{ id: string }> };
    expect(searchData.components.some((c) => c.id === "drawer")).toBe(true);
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

    // Inspect Badge
    const badgeRes = await designOperation({ action: "inspect_component", component_id: "badge" });
    expect(badgeRes.success).toBe(true);
    const badgeData = badgeRes.data as { component: { name: string; a11yRole: string; variants: string[] } };
    expect(badgeData.component.name).toBe("Badge");
    expect(badgeData.component.variants).toContain("destructive");

    // Inspect Drawer
    const drawerRes = await designOperation({ action: "inspect_component", component_id: "drawer" });
    expect(drawerRes.success).toBe(true);
    const drawerData = drawerRes.data as { component: { name: string; layer: string } };
    expect(drawerData.component.name).toBe("Drawer");
    expect(drawerData.component.layer).toBe("composite");

    // Inspect Chart Composite and its underlying single-word primitives
    const chartRes = await designOperation({ action: "inspect_component", component_id: "chart" });
    expect(chartRes.success).toBe(true);
    const chartData = chartRes.data as any;
    expect(chartData.component.layer).toBe("composite");
    expect(chartData.resolvedPrimitives.length).toBeGreaterThanOrEqual(10);
    expect(chartData.resolvedPrimitives.map((p: any) => p.name)).toContain("Axis");
    expect(chartData.resolvedPrimitives.map((p: any) => p.name)).toContain("Grid");
    expect(chartData.resolvedPrimitives.map((p: any) => p.name)).toContain("Line");
    expect(chartData.resolvedPrimitives.map((p: any) => p.name)).toContain("Tooltip");

    // Inspect Table Composite and its underlying single-word primitives
    const tableRes = await designOperation({ action: "inspect_component", component_id: "table" });
    expect(tableRes.success).toBe(true);
    const tableData = tableRes.data as any;
    expect(tableData.component.layer).toBe("composite");
    expect(tableData.resolvedPrimitives.length).toBeGreaterThanOrEqual(5);
    expect(tableData.resolvedPrimitives.map((p: any) => p.name)).toContain("Cell");
    expect(tableData.resolvedPrimitives.map((p: any) => p.name)).toContain("Row");
    expect(tableData.resolvedPrimitives.map((p: any) => p.name)).toContain("Header");

    // Inspect individual single-word primitive linking back to parent composite
    const cellRes = await designOperation({ action: "inspect_component", component_id: "cell" });
    expect(cellRes.success).toBe(true);
    const cellData = cellRes.data as any;
    expect(cellData.component.layer).toBe("component");
    expect(cellData.component.name).toBe("Cell");
    expect(cellData.parentComposite.name).toBe("Table");

    const axisRes = await designOperation({ action: "inspect_component", component_id: "axis" });
    expect(axisRes.success).toBe(true);
    const axisData = axisRes.data as any;
    expect(axisData.component.layer).toBe("component");
    expect(axisData.component.name).toBe("Axis");
    expect(axisData.parentComposite.name).toBe("Chart");

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

  test("generate_ui synthesizes clean, accessible Svelte 5 runes code for marketing and auth", async () => {
    const marketing = await designOperation({ action: "generate_ui", intent: "marketing_hero" });
    expect(marketing.success).toBe(true);
    const mData = marketing.data as { requiredImports: string[]; svelteSnippet: string };
    expect(mData.requiredImports).toContain("Hero");
    expect(mData.svelteSnippet).toContain('<script lang="ts">');
    expect(mData.svelteSnippet).toContain("infra-ui-svelte");
    expect(mData.svelteSnippet).toContain("<Hero");

    const auth = await designOperation({ action: "generate_ui", intent: "auth_form" });
    expect(auth.success).toBe(true);
    const aData = auth.data as { requiredImports: string[]; svelteSnippet: string };
    expect(aData.requiredImports).toContain("Card");
    expect(aData.requiredImports).toContain("Input");
    expect(aData.svelteSnippet).toContain("let email = $state");
  });

  test("generate_ui generates high-converting ecommerce_pdp with Svelte 5 runes, variant picker, urgency badge, and 1-click buy", async () => {
    const res = await designOperation({ action: "generate_ui", intent: "ecommerce_pdp" });
    expect(res.success).toBe(true);
    const data = res.data as { requiredImports: string[]; svelteSnippet: string; intent: string };
    expect(data.intent).toBe("ecommerce_pdp");
    expect(data.requiredImports).toContain("Card");
    expect(data.requiredImports).toContain("Button");
    expect(data.requiredImports).toContain("Badge");

    // Svelte 5 Runes Verification
    expect(data.svelteSnippet).toContain("let selectedVariantId = $state");
    expect(data.svelteSnippet).toContain("let selectedSizeId = $state");
    expect(data.svelteSnippet).toContain("let quantity = $state");
    expect(data.svelteSnippet).toContain("let isPurchasing = $state");
    expect(data.svelteSnippet).toContain("let selectedVariant = $derived");
    expect(data.svelteSnippet).toContain("let selectedSize = $derived");
    expect(data.svelteSnippet).toContain("let unitPrice = $derived");
    expect(data.svelteSnippet).toContain("let totalPrice = $derived");
    expect(data.svelteSnippet).toContain("let isLowStock = $derived");

    // UI Features Verification
    expect(data.svelteSnippet).toContain("Color:");
    expect(data.svelteSnippet).toContain("selectedVariantId = variant.id");
    expect(data.svelteSnippet).toContain("Edition & Bundle");
    expect(data.svelteSnippet).toContain("⚡ Only");
    expect(data.svelteSnippet).toContain("items left in stock – order soon");
    expect(data.svelteSnippet).toContain("⚡ Buy Now with 1-Click");
    expect(data.svelteSnippet).toContain("handleOneClickBuy");
    expect(data.svelteSnippet).toContain("Save");
  });

  test("generate_ui generates express ecommerce_checkout slideout with Apple/Shop Pay, itemized cart, and promo code", async () => {
    const res = await designOperation({ action: "generate_ui", intent: "ecommerce_checkout" });
    expect(res.success).toBe(true);
    const data = res.data as { requiredImports: string[]; svelteSnippet: string; intent: string };
    expect(data.intent).toBe("ecommerce_checkout");
    expect(data.requiredImports).toContain("Drawer");
    expect(data.requiredImports).toContain("Button");
    expect(data.requiredImports).toContain("Input");
    expect(data.requiredImports).toContain("Badge");

    // Slideout drawer & express pay checks
    expect(data.svelteSnippet).toContain("<Drawer");
    expect(data.svelteSnippet).toContain("position=\"right\"");
    expect(data.svelteSnippet).toContain("Pay");
    expect(data.svelteSnippet).toContain("Shop Pay");

    // Cart calculations and runes
    expect(data.svelteSnippet).toContain("let isOpen = $state");
    expect(data.svelteSnippet).toContain("let appliedPromo = $state");
    expect(data.svelteSnippet).toContain("let subtotal = $derived");
    expect(data.svelteSnippet).toContain("let discountAmount = $derived");
    expect(data.svelteSnippet).toContain("let estimatedTax = $derived");
    expect(data.svelteSnippet).toContain("let orderTotal = $derived");

    // Promo code validation & Itemized cart
    expect(data.svelteSnippet).toContain("applyPromoCode");
    expect(data.svelteSnippet).toContain("Itemized Cart");
    expect(data.svelteSnippet).toContain("updateQuantity");
    expect(data.svelteSnippet).toContain("Complete Order");
  });

  test("generate_ui generates academic_manuscript_viewer with LaTeX formula renderer, BibTeX citation card, and 3-reviewer score radar badge", async () => {
    const res = await designOperation({ action: "generate_ui", intent: "academic_manuscript_viewer" });
    expect(res.success).toBe(true);
    const data = res.data as { requiredImports: string[]; svelteSnippet: string; intent: string };
    expect(data.intent).toBe("academic_manuscript_viewer");
    expect(data.requiredImports).toContain("Card");
    expect(data.requiredImports).toContain("Badge");
    expect(data.requiredImports).toContain("Button");

    // Academic manuscript metadata
    expect(data.svelteSnippet).toContain("NeurIPS 2026");
    expect(data.svelteSnippet).toContain("DOI:");
    expect(data.svelteSnippet).toContain("Latent Dynamic Attention Kernels");
    expect(data.svelteSnippet).toContain("Stanford AI Lab");

    // LaTeX Formula Renderer
    expect(data.svelteSnippet).toContain("LaTeX Mathematical Formulation");
    expect(data.svelteSnippet).toContain("copyLatex");
    expect(data.svelteSnippet).toContain("showRawLatex");

    // BibTeX Citation Card
    expect(data.svelteSnippet).toContain("BibTeX Citation Receipt");
    expect(data.svelteSnippet).toContain("@inproceedings{rostova2026latent");
    expect(data.svelteSnippet).toContain("copyBibTeX");
    expect(data.svelteSnippet).toContain("copiedBibtex");

    // 3-Reviewer Score Radar Badge
    expect(data.svelteSnippet).toContain("Originality");
    expect(data.svelteSnippet).toContain("Technical Rigor");
    expect(data.svelteSnippet).toContain("Clarity & Reproducibility");
    expect(data.svelteSnippet).toContain("averageReviewScore = $derived");
    expect(data.svelteSnippet).toContain("Peer Review:");
  });

  test("generate_ui generates venture_telemetry_dashboard with MRR/ARR growth metrics, D1/D7/D30 cohort retention heatmap table, and price elasticity curve widget", async () => {
    const res = await designOperation({ action: "generate_ui", intent: "venture_telemetry_dashboard" });
    expect(res.success).toBe(true);
    const data = res.data as { requiredImports: string[]; svelteSnippet: string; intent: string };
    expect(data.intent).toBe("venture_telemetry_dashboard");
    expect(data.requiredImports).toContain("Card");
    expect(data.requiredImports).toContain("Badge");
    expect(data.requiredImports).toContain("Button");

    // MRR / ARR Metrics
    expect(data.svelteSnippet).toContain("Current MRR");
    expect(data.svelteSnippet).toContain("ARR Growth YoY");
    expect(data.svelteSnippet).toContain("Net Revenue Retention");
    expect(data.svelteSnippet).toContain("Quick Ratio");
    expect(data.svelteSnippet).toContain("CAC Payback Period");

    // D1 / D7 / D30 Cohort Retention Matrix
    expect(data.svelteSnippet).toContain("Cohort Retention Decay Matrix");
    expect(data.svelteSnippet).toContain("Day 1");
    expect(data.svelteSnippet).toContain("Day 7");
    expect(data.svelteSnippet).toContain("Day 14");
    expect(data.svelteSnippet).toContain("Day 30");
    expect(data.svelteSnippet).toContain("getHeatmapBg");

    // Price Elasticity Curve Widget & Runes
    expect(data.svelteSnippet).toContain("Dynamic Price Elasticity Simulation Curve");
    expect(data.svelteSnippet).toContain("let simPrice = $state");
    expect(data.svelteSnippet).toContain("let audienceScale = $state");
    expect(data.svelteSnippet).toContain("let estimatedConversionPct = $derived");
    expect(data.svelteSnippet).toContain("let projectedMonthlyRevenue = $derived");
    expect(data.svelteSnippet).toContain("let projectedAnnualARR = $derived");
    expect(data.svelteSnippet).toContain("isOptimalPrice = $derived");
    expect(data.svelteSnippet).toContain("Optimal Revenue Band");
  });

  test("generate_ui generates kanban_board, terminal_cli, and command_palette_modal with rich variants", async () => {
    // Kanban Board
    const kanban = await designOperation({ action: "generate_ui", intent: "kanban_board" });
    expect(kanban.success).toBe(true);
    const kData = kanban.data as any;
    expect(kData.requiredImports).toContain("Card");
    expect(kData.requiredImports).toContain("Badge");
    expect(kData.svelteSnippet).toContain("Sprint Production Board");
    expect(kData.svelteSnippet).toContain("let columns = $state");
    expect(kData.svelteSnippet).toContain("Backlog");
    expect(kData.svelteSnippet).toContain("In Progress");

    // Terminal CLI
    const terminal = await designOperation({ action: "generate_ui", intent: "terminal_cli" });
    expect(terminal.success).toBe(true);
    const tData = terminal.data as any;
    expect(tData.svelteSnippet).toContain("holar@antigravity");
    expect(tData.svelteSnippet).toContain("Node/Bun v1.3.14");
    expect(tData.svelteSnippet).toContain("let lines = $state");

    // Command Palette Modal
    const cmd = await designOperation({ action: "generate_ui", intent: "command_palette_modal" });
    expect(cmd.success).toBe(true);
    const cData = cmd.data as any;
    expect(cData.requiredImports).toContain("Dialog");
    expect(cData.requiredImports).toContain("Input");
    expect(cData.svelteSnippet).toContain("Type a command or search actions (⌘K)");
    expect(cData.svelteSnippet).toContain("filtered = $derived");
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

    // Badge DOM matching
    const badgeElement = { tag: "span", className: "badge-pill status-active", role: "status" };
    const badgeMatch = await designOperation({ action: "bridge_chrome", chrome_element: badgeElement });
    expect((badgeMatch.data as { matchedDesignComponent: { name: string } }).matchedDesignComponent?.name).toBe("Badge");

    // Drawer DOM matching
    const drawerElement = { tag: "aside", className: "slideout-panel drawer-right", role: "complementary" };
    const drawerMatch = await designOperation({ action: "bridge_chrome", chrome_element: drawerElement });
    expect((drawerMatch.data as { matchedDesignComponent: { name: string } }).matchedDesignComponent?.name).toBe("Drawer");

    // Table DOM matching
    const tableElement = { tag: "table", className: "cohort-retention-table", role: "table" };
    const tableMatch = await designOperation({ action: "bridge_chrome", chrome_element: tableElement });
    expect((tableMatch.data as { matchedDesignComponent: { name: string } }).matchedDesignComponent?.name).toBe("Table");
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

    // 3. tools/call with ecommerce_pdp intent
    const callRes = await handleDesignRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "design",
        arguments: { action: "generate_ui", intent: "ecommerce_pdp" },
      },
    });
    expect(callRes.id).toBe(3);
    const content = (callRes.result as { content: Array<{ text: string }> }).content;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.action).toBe("generate_ui");
    expect(parsed.success).toBe(true);
    expect(parsed.data.svelteSnippet).toContain("selectedVariant");

    // 4. tools/call with venture_telemetry_dashboard
    const ventureCall = await handleDesignRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "design",
        arguments: { action: "generate_ui", intent: "venture_telemetry_dashboard" },
      },
    });
    const vContent = (ventureCall.result as { content: Array<{ text: string }> }).content;
    const vParsed = JSON.parse(vContent[0].text);
    expect(vParsed.data.svelteSnippet).toContain("Current MRR");
  });

  test("resolve_imports calculates on-demand subpaths and tree-shaking savings", async () => {
    const res = await designOperation({
      action: "resolve_imports",
      components: ["Button", "Input", "Card", "Badge", "Drawer"],
    });
    expect(res.success).toBe(true);
    const data = res.data as {
      matchedComponents: Array<{ name: string; subpath: string; sizeKb: number }>;
      barrelStatement: string;
      subpathStatements: string;
      metrics: { estimatedOnDemandKb: number; treeShakingSavings: string };
    };
    expect(data.matchedComponents.length).toBe(5);
    expect(data.subpathStatements).toContain("infra-ui-svelte/component/interaction/button");
    expect(data.subpathStatements).toContain("infra-ui-svelte/component/input/text");
    expect(data.subpathStatements).toContain("infra-ui-svelte/component/feedback/badge");
    expect(data.subpathStatements).toContain("infra-ui-svelte/composite/overlay/drawer");
    expect(data.metrics.estimatedOnDemandKb).toBeLessThan(15);
    expect(data.metrics.treeShakingSavings).toContain("%");
  });

  test("domain_presets returns all 9 pre-bundled domain packs and handles individual preset lookups", async () => {
    // List all
    const allPresets = await designOperation({ action: "domain_presets" });
    expect(allPresets.success).toBe(true);
    const allData = allPresets.data as { total: number; presets: Array<{ id: string }> };
    expect(allData.total).toBe(9);
    expect(allData.total).toBe(DOMAIN_PRESETS.length);

    // Verify all preset IDs
    const presetIds = allData.presets.map((p) => p.id);
    expect(presetIds).toContain("clinical");
    expect(presetIds).toContain("chat_ai");
    expect(presetIds).toContain("analytics");
    expect(presetIds).toContain("commerce");
    expect(presetIds).toContain("auth");
    expect(presetIds).toContain("ecommerce_pdp");
    expect(presetIds).toContain("ecommerce_checkout");
    expect(presetIds).toContain("academic_manuscript_viewer");
    expect(presetIds).toContain("venture_telemetry_dashboard");

    // Get ecommerce_pdp preset
    const pdp = await designOperation({ action: "domain_presets", preset_name: "ecommerce_pdp" });
    expect(pdp.success).toBe(true);
    const pdpData = pdp.data as { preset: { name: string; recommendedComponents: string[] }; subpathImports: string };
    expect(pdpData.preset.name).toContain("PDP");
    expect(pdpData.preset.recommendedComponents).toContain("Badge");
    expect(pdpData.subpathImports).toContain("infra-ui-svelte/component/feedback/badge");

    // Get ecommerce_checkout preset
    const chk = await designOperation({ action: "domain_presets", preset_name: "ecommerce_checkout" });
    expect(chk.success).toBe(true);
    const chkData = chk.data as { preset: { name: string; recommendedComponents: string[] }; subpathImports: string };
    expect(chkData.preset.name).toContain("Checkout");
    expect(chkData.preset.recommendedComponents).toContain("Drawer");
    expect(chkData.subpathImports).toContain("infra-ui-svelte/composite/overlay/drawer");

    // Get academic_manuscript_viewer preset
    const acad = await designOperation({ action: "domain_presets", preset_name: "academic_manuscript_viewer" });
    expect(acad.success).toBe(true);
    const acadData = acad.data as { preset: { name: string } };
    expect(acadData.preset.name).toContain("Academic");

    // Get venture_telemetry_dashboard preset
    const vent = await designOperation({ action: "domain_presets", preset_name: "venture_telemetry_dashboard" });
    expect(vent.success).toBe(true);
    const ventData = vent.data as { preset: { name: string } };
    expect(ventData.preset.name).toContain("Venture Telemetry");
  });

  test("bundle_optimize prunes unused components and converts to subpaths", async () => {
    const codeWithUnused = `
      <script>
        import { Button, Dialog, Card, Kanban, Badge } from "infra-ui-svelte";
      </script>
      <Card>
        <Badge>Active</Badge>
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
    expect(data.retainedComponents).toContain("Badge");
    expect(data.optimizedCode).toContain("infra-ui-svelte/component/interaction/button");
    expect(data.optimizedCode).toContain("infra-ui-svelte/component/scaffold/card");
    expect(data.optimizedCode).toContain("infra-ui-svelte/component/feedback/badge");
  });

  test("Pi compactDesignResult formats readable concise terminal logs", async () => {
    const res = await designOperation({ action: "catalog" });
    const log = compactDesignResult(res);
    expect(log).toContain(`Catalog (${COMPONENT_CATALOG.length} components):`);
    expect(log).toContain("Button");
  });
});
