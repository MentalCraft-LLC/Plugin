/**
 * Plugin/Design Core - Declarative Design System & UI Intelligence Engine
 *
 * Symmetrical with Plugin/Chrome and Plugin/Gefei.
 * Provides the single source of truth for component schemas, 5-layer taxonomy,
 * design token dictionaries, A11y verification rules, and Chrome inspector bridges.
 */

export const DESIGN_PROTOCOL = "holar.design.v1" as const;

export type DesignLayer =
  | "foundation"
  | "component"
  | "composite"
  | "block"
  | "template";

export type ComponentCategory =
  | "interaction"
  | "input"
  | "display"
  | "feedback"
  | "overlay"
  | "navigation"
  | "layout"
  | "scaffold"
  | "status"
  | "media"
  | "conversation"
  | "commerce"
  | "document"
  | "marketing"
  | "tool"
  | "workflow"
  | "panel";

export type ComponentSpec = {
  id: string;
  name: string;
  layer: DesignLayer;
  category: ComponentCategory;
  description: string;
  importPath: string;
  subpath: string;
  estimatedSizeKb: number;
  variants?: string[];
  primitives?: string[];
  parentComposite?: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description: string;
  }>;
  slots?: string[];
  a11yRole?: string;
  example: string;
};

export type DesignTokenCategory =
  | "color"
  | "typography"
  | "spacing"
  | "radius"
  | "shadow"
  | "elevation"
  | "motion"
  | "breakpoint";

export type TokenDefinition = {
  name: string;
  cssVariable: string;
  value: string;
  category: DesignTokenCategory;
  description: string;
};

export type DomainPresetId =
  | "clinical"
  | "chat_ai"
  | "analytics"
  | "commerce"
  | "auth"
  | "ecommerce_pdp"
  | "ecommerce_checkout"
  | "academic_manuscript_viewer"
  | "venture_telemetry_dashboard";

export type DomainPreset = {
  id: DomainPresetId;
  name: string;
  description: string;
  recommendedComponents: string[];
  tokensFocus: string[];
  snippet: string;
};

export type UIIntent =
  | "marketing_hero"
  | "auth_form"
  | "screener"
  | "chat_stream"
  | "settings_panel"
  | "pricing_table"
  | "ecommerce_pdp"
  | "ecommerce_checkout"
  | "academic_manuscript_viewer"
  | "venture_telemetry_dashboard"
  | "custom";

export type DuotonePaletteId =
  | "cobalt_terracotta"
  | "powder_signal"
  | "botanical_oxblood"
  | "charcoal_signal"
  | "electric_carbon"
  | "mint_charcoal"
  | "ultramarine_safety"
  | "cyan_brick"
  | "tangerine_slate";

export type SubstrateId = "neutral_white" | "cool_gray" | "pale_beige";

export type EditorialManifest = {
  subject: string;
  intent: string;
  exact_text: string;
  ratio: string;
  substrate: { id: SubstrateId; name: string; hex: string };
  mode: "controlled_two_ink" | "pure_one_ink" | "overprint_duotone";
  palette: DuotonePaletteId;
  dominant_ink: { name: string; hex: string; role: string; area_percent: number };
  accent_ink?: { name: string; hex: string; role: string; area_percent: number };
  empty_paper_percent: number;
  focal_event: string;
  release_zone: string;
  type_hierarchy: { display: string; support: string };
  mechanical_process: string;
  imperfections: string[];
  generation_prompt: string;
  svg_preview_snippet: string;
};

export const DUOTONE_RECIPES: Record<DuotonePaletteId, { name: string; dominant: { name: string; hex: string }; accent: { name: string; hex: string }; useFor: string }> = {
  cobalt_terracotta: { name: "Cobalt + Terracotta", dominant: { name: "Cobalt", hex: "#2148B8" }, accent: { name: "Terracotta", hex: "#C65F38" }, useFor: "Travel, lifestyle, cultural commentary, editorial publication" },
  powder_signal: { name: "Powder Blue + Signal Red", dominant: { name: "Powder Blue", hex: "#9EB8D3" }, accent: { name: "Signal Red", hex: "#C83232" }, useFor: "Information-dense guides, public announcements, infographics" },
  botanical_oxblood: { name: "Botanical Green + Oxblood", dominant: { name: "Botanical Green", hex: "#008A4B" }, accent: { name: "Oxblood", hex: "#8F3434" }, useFor: "Academic paper figures, botanical journals, natural science archives" },
  charcoal_signal: { name: "Charcoal + Signal Red", dominant: { name: "Charcoal", hex: "#30343A" }, accent: { name: "Signal Red", hex: "#C83232" }, useFor: "Architecture, empirical research reports, conceptual art posters" },
  electric_carbon: { name: "Electric Blue + Carbon", dominant: { name: "Electric Blue", hex: "#173AE3" }, accent: { name: "Carbon", hex: "#242321" }, useFor: "High-contrast cultural events, indie tech, night exhibitions" },
  mint_charcoal: { name: "Mint Green + Charcoal", dominant: { name: "Mint Green", hex: "#5EB783" }, accent: { name: "Charcoal", hex: "#302D2E" }, useFor: "Long-form essays, quiet observations, field notes" },
  ultramarine_safety: { name: "Ultramarine + Safety Orange", dominant: { name: "Ultramarine", hex: "#263E99" }, accent: { name: "Safety Orange", hex: "#E55D2B" }, useFor: "Youth culture, movement, physical sports, active urban subjects" },
  cyan_brick: { name: "Cyan + Brick Red", dominant: { name: "Cyan", hex: "#159DDA" }, accent: { name: "Brick Red", hex: "#B64032" }, useFor: "SpriteFlow game dev tools, product catalogs, playful info systems" },
  tangerine_slate: { name: "Tangerine + Slate Blue", dominant: { name: "Tangerine", hex: "#E46C2D" }, accent: { name: "Slate Blue", hex: "#4773A5" }, useFor: "Festivals, creative markets, oversized typographic posters" },
};

export const SUBSTRATES: Record<SubstrateId, { name: string; hex: string; useFor: string }> = {
  neutral_white: { name: "Neutral White", hex: "#FAFAF7", useFor: "Contemporary editorial, technology, cultural events, crisp branding" },
  cool_gray: { name: "Cool Gray", hex: "#E9E9E5", useFor: "Architecture, empirical research, charcoal systems, restrained branding" },
  pale_beige: { name: "Pale Beige", hex: "#F5F1E8", useFor: "Tactile, food, travel, intimate literature, archival publication" },
};

export type DesignAction =
  | "catalog"
  | "inspect_component"
  | "theme_tokens"
  | "generate_ui"
  | "audit_ui"
  | "bridge_chrome"
  | "list_layers"
  | "resolve_imports"
  | "domain_presets"
  | "bundle_optimize"
  | "generate_editorial";

export type DesignInput = {
  action: DesignAction;
  layer?: DesignLayer;
  category?: ComponentCategory;
  component_id?: string;
  components?: string[];
  preset_name?: DomainPresetId;
  token_category?: DesignTokenCategory;
  intent?: UIIntent;
  prompt?: string;
  template_code?: string;
  theme?: string;
  palette?: DuotonePaletteId;
  substrate?: SubstrateId;
  ratio?: string;
  exact_text?: string;
  mode?: "controlled_two_ink" | "pure_one_ink" | "overprint_duotone";
  chrome_element?: {
    tag: string;
    id?: string;
    className?: string;
    role?: string;
    rect?: { width: number; height: number };
    computedStyles?: Record<string, string>;
  };
  limit?: number;
};

export type DesignResult = {
  protocol: typeof DESIGN_PROTOCOL;
  action: DesignAction;
  success: boolean;
  timestamp: string;
  data: unknown;
  diagnostics?: string[];
};

/** Verified Design System Catalog Index */
export const COMPONENT_CATALOG: ComponentSpec[] = [
  // --- 1. INTERACTION & ACTION FAMILY ---
  {
    id: "button",
    name: "Button",
    layer: "component",
    category: "interaction",
    description: "Accessible interactive trigger with primary, secondary, ghost, line, glass, plain, destructive, and outline variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/interaction/button",
    estimatedSizeKb: 1.8,
    variants: ["primary", "secondary", "ghost", "line", "glass", "plain", "destructive", "outline"],
    props: [
      { name: "variant", type: "'primary' | 'secondary' | 'ghost' | 'line' | 'glass' | 'plain' | 'destructive' | 'outline'", required: false, default: "'ghost'", description: "Visual variant of the button" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Disabled state" },
      { name: "state", type: "'idle' | 'busy'", required: false, default: "'idle'", description: "Busy loading state" },
      { name: "type", type: "'button' | 'submit' | 'reset'", required: false, default: "'button'", description: "HTML button type" },
      { name: "label", type: "string", required: false, description: "Accessible text label" },
    ],
    slots: ["children"],
    a11yRole: "button",
    example: `<Button variant="primary" onclick={() => alert('Clicked')}>Confirm</Button>`,
  },

  // --- 2. INPUT, FORM & ENTRY FAMILY ---
  {
    id: "input",
    name: "Input",
    layer: "component",
    category: "input",
    description: "Standard text entry with line, ghost, plain, bordered, and filled appearance variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/input/text",
    estimatedSizeKb: 1.5,
    variants: ["line", "ghost", "plain", "bordered", "filled"],
    props: [
      { name: "variant", type: "'line' | 'ghost' | 'plain' | 'bordered' | 'filled'", required: false, default: "'line'", description: "Input appearance style" },
      { name: "value", type: "string", required: false, description: "Bound text value" },
      { name: "placeholder", type: "string", required: false, description: "Hint placeholder" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Disabled state" },
      { name: "type", type: "string", required: false, default: "'text'", description: "Input type (text, password, email)" },
      { name: "error", type: "string", required: false, description: "Validation error message" },
    ],
    a11yRole: "textbox",
    example: `<Input bind:value={email} placeholder="name@example.com" type="email" variant="line" />`,
  },
  {
    id: "slider",
    name: "Slider",
    layer: "component",
    category: "input",
    description: "Tactile high-precision slider sharing the universal input family variants with diamond/round thumb geometries.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/input/slider",
    estimatedSizeKb: 1.6,
    variants: ["line", "ghost", "plain", "bordered", "filled"],
    props: [
      { name: "variant", type: "'line' | 'ghost' | 'plain' | 'bordered' | 'filled'", required: false, default: "'bordered'", description: "Surface appearance style" },
      { name: "geometry", type: "'diamond' | 'round' | 'minimal'", required: false, default: "'diamond'", description: "Thumb geometry" },
      { name: "value", type: "number", required: true, description: "Current numeric value" },
      { name: "min", type: "number", required: false, default: "0", description: "Minimum range bound" },
      { name: "max", type: "number", required: false, default: "100", description: "Maximum range bound" },
      { name: "step", type: "number", required: false, default: "1", description: "Stepping interval" },
    ],
    a11yRole: "slider",
    example: `<Slider bind:value={width} min={220} max={300} label="Width" unit="px" variant="bordered" />`,
  },

  // --- 3. SURFACE, SCAFFOLD & CONTAINER FAMILY ---
  {
    id: "card",
    name: "Card",
    layer: "component",
    category: "scaffold",
    description: "Elevated content container with flat, outline, elevated, glass, and interactive variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/scaffold/card",
    estimatedSizeKb: 1.2,
    variants: ["flat", "outline", "elevated", "glass", "interactive"],
    props: [
      { name: "variant", type: "'flat' | 'outline' | 'elevated' | 'glass' | 'interactive'", required: false, default: "'outline'", description: "Card elevation style" },
      { name: "padding", type: "'none' | 'sm' | 'md' | 'lg'", required: false, default: "'md'", description: "Inner padding scale" },
    ],
    slots: ["children"],
    a11yRole: "region",
    example: `<Card padding="md" variant="outline">\n  <h3 class="text-title-3 font-semibold">Card Title</h3>\n  <p class="text-muted">Card body content</p>\n</Card>`,
  },
  {
    id: "accordion",
    name: "Accordion",
    layer: "composite",
    category: "panel",
    description: "Collapsible panel suite sharing container family variants (flat, outline, elevated, glass, interactive).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/panel/accordion",
    estimatedSizeKb: 2.8,
    primitives: ["item", "trigger", "content"],
    variants: ["flat", "outline", "elevated", "glass", "interactive"],
    props: [
      { name: "variant", type: "'flat' | 'outline' | 'elevated' | 'glass' | 'interactive'", required: false, default: "'outline'", description: "Container visual style" },
      { name: "type", type: "'single' | 'multiple'", required: false, default: "'single'", description: "Allow multiple panels open" },
    ],
    example: `<Accordion type="single" variant="outline">\n  <Accordion.Item value="item-1">\n    <Accordion.Trigger>What is MentalCraft?</Accordion.Trigger>\n    <Accordion.Content>MentalCraft is an autonomous psychology platform.</Accordion.Content>\n  </Accordion.Item>\n</Accordion>`,
  },
  {
    id: "column",
    name: "Column",
    layer: "component",
    category: "workflow",
    description: "Vertical lane container sharing container family variants (flat, outline, elevated, glass, interactive).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/kanban/column",
    estimatedSizeKb: 1.6,
    parentComposite: "kanban",
    variants: ["flat", "outline", "elevated", "glass", "interactive"],
    props: [
      { name: "variant", type: "'flat' | 'outline' | 'elevated' | 'glass' | 'interactive'", required: false, default: "'flat'", description: "Column styling" },
      { name: "id", type: "string", required: true, description: "Column identifier" },
      { name: "title", type: "string", required: true, description: "Column title" },
      { name: "count", type: "number", required: false, description: "Item counter badge" },
    ],
    slots: ["children", "header"],
    a11yRole: "region",
    example: `<Kanban.Column id="in_progress" title="In Progress" count={4} variant="flat">...</Kanban.Column>`,
  },

  // --- 4. OVERLAY, DIALOG & MODAL FAMILY ---
  {
    id: "dialog",
    name: "Dialog",
    layer: "composite",
    category: "overlay",
    description: "Modal dialog sharing overlay family variants (standard, sheet, fullscreen, alert, glass).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/overlay/dialog",
    estimatedSizeKb: 3.4,
    variants: ["standard", "sheet", "fullscreen", "alert", "glass"],
    props: [
      { name: "variant", type: "'standard' | 'sheet' | 'fullscreen' | 'alert' | 'glass'", required: false, default: "'standard'", description: "Dialog presentation style" },
      { name: "open", type: "boolean", required: true, description: "Controlled open state" },
      { name: "title", type: "string", required: true, description: "Accessible modal title" },
      { name: "description", type: "string", required: false, description: "Modal subtitle or purpose" },
    ],
    slots: ["trigger", "content", "actions"],
    a11yRole: "dialog",
    example: `<Dialog open={isOpen} title="Confirm Action" description="This action cannot be undone." variant="standard">\n  <Button onclick={confirm}>Proceed</Button>\n</Dialog>`,
  },
  {
    id: "drawer",
    name: "Drawer",
    layer: "composite",
    category: "overlay",
    description: "Slideout panel sheet sharing overlay family variants (standard, sheet, fullscreen, alert, glass).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/overlay/drawer",
    estimatedSizeKb: 3.8,
    variants: ["standard", "sheet", "fullscreen", "alert", "glass"],
    props: [
      { name: "variant", type: "'standard' | 'sheet' | 'fullscreen' | 'alert' | 'glass'", required: false, default: "'sheet'", description: "Presentation style" },
      { name: "position", type: "'right' | 'left' | 'bottom' | 'top'", required: false, default: "'right'", description: "Slideout anchor edge" },
      { name: "open", type: "boolean", required: true, description: "Controlled open/close state" },
      { name: "title", type: "string", required: true, description: "Accessible drawer header title" },
      { name: "onClose", type: "() => void", required: true, description: "Close request handler" },
    ],
    slots: ["header", "children", "footer"],
    a11yRole: "dialog",
    example: `<Drawer open={isCartOpen} title="Express Checkout" variant="sheet" onClose={() => isCartOpen = false}>\n  <p>Itemized cart items...</p>\n</Drawer>`,
  },
  {
    id: "command",
    name: "Command",
    layer: "composite",
    category: "workflow",
    description: "Keyboard-first ⌘K spotlight command search modal sharing overlay family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/command",
    estimatedSizeKb: 5.4,
    primitives: ["input", "list", "item", "group", "shortcut"],
    variants: ["standard", "sheet", "fullscreen", "alert", "glass"],
    props: [
      { name: "variant", type: "'standard' | 'sheet' | 'fullscreen' | 'alert' | 'glass'", required: false, default: "'glass'", description: "Command palette layout style" },
      { name: "open", type: "boolean", required: true, description: "Controlled modal open state" },
      { name: "placeholder", type: "string", required: false, default: "'Type a command or search...'", description: "Search placeholder" },
    ],
    example: `<Command open={isOpen} variant="glass">\n  <Command.Input placeholder="Search actions..." />\n  <Command.List>\n    <Command.Group heading="Actions">\n      <Command.Item shortcut="⌘B">Build Project</Command.Item>\n    </Command.Group>\n  </Command.List>\n</Command>`,
  },

  // --- 5. FEEDBACK, STATUS & BADGE FAMILY ---
  {
    id: "badge",
    name: "Badge",
    layer: "component",
    category: "status",
    description: "Compact status pill sharing feedback family tones (default, primary, success, warning, destructive, info, outline, pill).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/feedback/badge",
    estimatedSizeKb: 1.1,
    variants: ["default", "primary", "success", "warning", "destructive", "info", "outline", "pill"],
    props: [
      { name: "variant", type: "'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' | 'pill'", required: false, default: "'default'", description: "Visual style variant" },
      { name: "size", type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: "Scale size" },
      { name: "pulse", type: "boolean", required: false, default: "false", description: "Animated urgency pulse indicator" },
    ],
    slots: ["children"],
    a11yRole: "status",
    example: `<Badge variant="success" pulse={true}>⚡ In Stock</Badge>`,
  },
  {
    id: "toast",
    name: "Toast",
    layer: "composite",
    category: "feedback",
    description: "Floating non-disruptive feedback notification sharing feedback family tones.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/overlay/toast",
    estimatedSizeKb: 3.2,
    primitives: ["provider", "item", "action", "close"],
    variants: ["default", "primary", "success", "warning", "destructive", "info", "outline", "pill"],
    props: [
      { name: "variant", type: "'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' | 'pill'", required: false, default: "'info'", description: "Toast tone variant" },
      { name: "duration", type: "number", required: false, default: "4000", description: "Auto-dismiss duration in ms" },
      { name: "position", type: "'bottom-right' | 'top-right' | 'bottom-center' | 'top-center'", required: false, default: "'bottom-right'", description: "Screen corner alignment" },
    ],
    example: `<Toast.Provider>\n  <Toast variant="success" title="Link Copied" description="Shareable URL copied to clipboard." />\n</Toast.Provider>`,
  },
  {
    id: "metric",
    name: "Metric",
    layer: "component",
    category: "display",
    description: "KPI metric visual sharing feedback family tone accents.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/display/metric",
    estimatedSizeKb: 1.7,
    variants: ["default", "primary", "success", "warning", "destructive", "info", "outline", "pill"],
    props: [
      { name: "variant", type: "'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' | 'pill'", required: false, default: "'default'", description: "Accent tone" },
      { name: "value", type: "string | number", required: true, description: "Primary metric display value" },
      { name: "label", type: "string", required: true, description: "Metric descriptive label" },
      { name: "delta", type: "number", required: false, description: "Percentage change (+12.4%)" },
      { name: "prefix", type: "string", required: false, description: "Unit prefix (e.g. '$')" },
      { name: "suffix", type: "string", required: false, description: "Unit suffix (e.g. '/mo')" },
    ],
    a11yRole: "status",
    example: `<Metric value="10,000" prefix="$" suffix="/mo" label="Monthly Recurring Revenue" delta={24.5} variant="success" />`,
  },

  // --- 6. DATA VISUALIZATION & CHART FAMILY ---
  {
    id: "chart",
    name: "Chart",
    layer: "composite",
    category: "display",
    description: "SVG-based compound visualization container supporting all 9 major chart series modes.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart",
    estimatedSizeKb: 5.6,
    variants: ["line", "area", "bar", "donut", "radar", "candlestick", "funnel", "treemap", "sparkline"],
    primitives: [
      "axis",
      "grid",
      "rule",
      "line",
      "area",
      "bar",
      "point",
      "arc",
      "radar",
      "candlestick",
      "funnel",
      "treemap",
      "sparkline",
      "legend",
      "tooltip",
    ],
    props: [
      { name: "variant", type: "'line' | 'area' | 'bar' | 'donut' | 'radar' | 'candlestick' | 'funnel' | 'treemap' | 'sparkline'", required: false, default: "'line'", description: "Primary chart series visual" },
      { name: "data", type: "Array<Record<string, unknown>>", required: true, description: "Data series" },
      { name: "xKey", type: "string", required: false, default: "'x'", description: "Horizontal domain field" },
      { name: "yKey", type: "string", required: false, default: "'y'", description: "Vertical range field" },
      { name: "height", type: "number", required: false, default: "240", description: "Chart canvas height in px" },
    ],
    example: `<Chart data={data} variant="line">\n  <Chart.Grid />\n  <Chart.Axis orientation="bottom" />\n  <Chart.Axis orientation="left" />\n  <Chart.Line />\n  <Chart.Tooltip />\n</Chart>`,
  },
  {
    id: "line",
    name: "Line",
    layer: "component",
    category: "display",
    description: "Continuous line series sharing stroke family variants (solid, dashed, gradient, glow, minimal).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-line",
    estimatedSizeKb: 1.6,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'solid'", description: "Line presentation style" },
      { name: "curve", type: "'linear' | 'monotone' | 'step'", required: false, default: "'monotone'", description: "Spline interpolation" },
      { name: "color", type: "string", required: false, default: "'primary'", description: "Theme token stroke color" },
      { name: "strokeWidth", type: "number", required: false, default: "2", description: "Line pixel width" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Line curve="monotone" variant="glow" strokeWidth={2.5} />`,
  },
  {
    id: "area",
    name: "Area",
    layer: "component",
    category: "display",
    description: "Area under curve sharing stroke/fill family variants (solid, dashed, gradient, glow, minimal).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-area",
    estimatedSizeKb: 1.2,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'gradient'", description: "Area fill mode" },
      { name: "curve", type: "'linear' | 'monotone'", required: false, default: "'monotone'", description: "Spline curve style" },
      { name: "opacity", type: "number", required: false, default: "0.2", description: "Peak fill opacity" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Area curve="monotone" variant="gradient" opacity={0.25} />`,
  },
  {
    id: "axis",
    name: "Axis",
    layer: "component",
    category: "display",
    description: "Coordinate axis sharing stroke family variants (solid, dashed, gradient, glow, minimal).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-axis",
    estimatedSizeKb: 1.4,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'solid'", description: "Axis line stroke style" },
      { name: "orientation", type: "'bottom' | 'left' | 'top' | 'right'", required: true, description: "Axis placement edge" },
      { name: "ticks", type: "number", required: false, default: "5", description: "Target number of division ticks" },
      { name: "format", type: "(val: unknown) => string", required: false, description: "Label formatting function" },
    ],
    a11yRole: "presentation",
    example: `<Chart.Axis orientation="bottom" ticks={6} variant="solid" />`,
  },
  {
    id: "grid",
    name: "Grid",
    layer: "component",
    category: "display",
    description: "Cartesian background reference gridlines sharing stroke family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-grid",
    estimatedSizeKb: 0.8,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'dashed'", description: "Grid line stroke style" },
      { name: "x", type: "boolean", required: false, default: "true", description: "Enable vertical gridlines" },
      { name: "y", type: "boolean", required: false, default: "true", description: "Enable horizontal gridlines" },
    ],
    a11yRole: "presentation",
    example: `<Chart.Grid variant="dashed" />`,
  },
  {
    id: "rule",
    name: "Rule",
    layer: "component",
    category: "display",
    description: "Threshold reference indicator line sharing stroke family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-rule",
    estimatedSizeKb: 0.9,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'dashed'", description: "Rule stroke style" },
      { name: "y", type: "number", required: false, description: "Horizontal constant value" },
      { name: "x", type: "number | string", required: false, description: "Vertical constant value" },
      { name: "label", type: "string", required: false, description: "Text annotation label" },
    ],
    a11yRole: "presentation",
    example: `<Chart.Rule y={10000} label="Target $10k MRR" variant="dashed" />`,
  },
  {
    id: "sparkline",
    name: "Sparkline",
    layer: "component",
    category: "display",
    description: "Inline micro-trend sparkline sharing stroke family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-sparkline",
    estimatedSizeKb: 1.1,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'solid'", description: "Micro-trend stroke style" },
      { name: "data", type: "Array<number>", required: true, description: "Numeric sequence" },
      { name: "height", type: "number", required: false, default: "28", description: "Height in px" },
      { name: "showEndpoints", type: "boolean", required: false, default: "true", description: "Highlight first/last points" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Sparkline data={[12, 18, 15, 24, 38]} height={24} variant="solid" />`,
  },
  {
    id: "bar",
    name: "Bar",
    layer: "component",
    category: "display",
    description: "Discrete rectangular column/bar geometry with top corner rounding and stacked cohort support.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-bar",
    estimatedSizeKb: 1.5,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'solid'", description: "Bar column style" },
      { name: "radius", type: "number", required: false, default: "4", description: "Top corner border radius" },
      { name: "stacked", type: "boolean", required: false, default: "false", description: "Stack multiple series" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Bar radius={6} variant="solid" />`,
  },
  {
    id: "arc",
    name: "Arc",
    layer: "component",
    category: "display",
    description: "Polar coordinate pie and donut slice geometry sharing stroke/fill family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-arc",
    estimatedSizeKb: 1.8,
    parentComposite: "chart",
    variants: ["solid", "dashed", "gradient", "glow", "minimal"],
    props: [
      { name: "variant", type: "'solid' | 'dashed' | 'gradient' | 'glow' | 'minimal'", required: false, default: "'solid'", description: "Polar slice style" },
      { name: "innerRadius", type: "number", required: false, default: "0", description: "Inner cutout radius for donut" },
      { name: "padAngle", type: "number", required: false, default: "0.02", description: "Angular separation between slices" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Arc innerRadius={60} padAngle={0.03} variant="solid" />`,
  },
  {
    id: "legend",
    name: "Legend",
    layer: "component",
    category: "display",
    description: "Interactive series legend sharing container family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-legend",
    estimatedSizeKb: 0.7,
    parentComposite: "chart",
    variants: ["flat", "outline", "elevated", "glass", "interactive"],
    props: [
      { name: "variant", type: "'flat' | 'outline' | 'elevated' | 'glass' | 'interactive'", required: false, default: "'flat'", description: "Legend layout style" },
      { name: "position", type: "'top' | 'bottom' | 'right'", required: false, default: "'top'", description: "Legend alignment" },
    ],
    a11yRole: "list",
    example: `<Chart.Legend position="top" variant="flat" />`,
  },
  {
    id: "tooltip",
    name: "Tooltip",
    layer: "component",
    category: "display",
    description: "Spring-physics floating detail popover sharing overlay family variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-tooltip",
    estimatedSizeKb: 1.3,
    parentComposite: "chart",
    variants: ["standard", "sheet", "fullscreen", "alert", "glass"],
    props: [
      { name: "variant", type: "'standard' | 'sheet' | 'fullscreen' | 'alert' | 'glass'", required: false, default: "'glass'", description: "Popover surface style" },
      { name: "snap", type: "boolean", required: false, default: "true", description: "Snap to nearest point x-coord" },
    ],
    a11yRole: "tooltip",
    example: `<Chart.Tooltip snap={true} variant="glass" />`,
  },

  // --- 7. MARKER & GEOMETRY SHAPE FAMILY ---
  {
    id: "point",
    name: "Point",
    layer: "component",
    category: "display",
    description: "Discrete scatter marker sharing shape geometry variants (circle, diamond, square, ring, pill).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/chart/chart-point",
    estimatedSizeKb: 0.9,
    parentComposite: "chart",
    variants: ["circle", "diamond", "square", "ring", "pill"],
    props: [
      { name: "variant", type: "'circle' | 'diamond' | 'square' | 'ring' | 'pill'", required: false, default: "'circle'", description: "Marker shape" },
      { name: "size", type: "number", required: false, default: "6", description: "Point diameter in px" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Point variant="diamond" size={8} />`,
  },
  {
    id: "swatch",
    name: "Swatch",
    layer: "component",
    category: "decoration",
    description: "Interactive color token chip sharing shape geometry variants (circle, diamond, square, ring, pill).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/decoration/swatch",
    estimatedSizeKb: 1.1,
    variants: ["circle", "diamond", "square", "ring", "pill"],
    props: [
      { name: "variant", type: "'circle' | 'diamond' | 'square' | 'ring' | 'pill'", required: false, default: "'pill'", description: "Swatch chip geometry" },
      { name: "color", type: "string", required: true, description: "CSS color value (e.g. 'oklch(0.991 0 0)')" },
      { name: "label", type: "string", required: false, description: "Display label override" },
    ],
    a11yRole: "button",
    example: `<Swatch color="oklch(0.991 0 0)" label="oklch(0.991 0 0)" variant="pill" />`,
  },
  {
    id: "avatar",
    name: "Avatar",
    layer: "component",
    category: "display",
    description: "User profile thumbnail sharing shape geometry variants (circle, diamond, square, ring, pill).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/component/display/avatar",
    estimatedSizeKb: 1.3,
    variants: ["circle", "diamond", "square", "ring", "pill"],
    props: [
      { name: "variant", type: "'circle' | 'diamond' | 'square' | 'ring' | 'pill'", required: false, default: "'circle'", description: "Avatar frame geometry" },
      { name: "src", type: "string", required: false, description: "Image source URL" },
      { name: "name", type: "string", required: true, description: "Full name for alt text and fallback initials" },
      { name: "size", type: "'sm' | 'md' | 'lg' | 'xl'", required: false, default: "'md'", description: "Avatar dimension" },
      { name: "status", type: "'online' | 'offline' | 'busy' | 'away'", required: false, description: "Status indicator dot" },
    ],
    a11yRole: "img",
    example: `<Avatar name="Satoshi Nakamoto" size="md" status="online" variant="circle" />`,
  },

  // --- 8. TABLE & DATA GRID FAMILY ---
  {
    id: "table",
    name: "Table",
    layer: "composite",
    category: "display",
    description: "Accessible compound data table container sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table",
    estimatedSizeKb: 4.2,
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    primitives: [
      "head",
      "header",
      "body",
      "row",
      "cell",
      "footer",
      "caption",
    ],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Visual table layout style" },
      { name: "rows", type: "Array<Record<string, unknown>>", required: false, description: "Data records" },
      { name: "selectable", type: "boolean", required: false, default: "false", description: "Row multi-selection" },
      { name: "reorderable", type: "boolean", required: false, default: "false", description: "Drag row reordering" },
    ],
    example: `<Table variant="zebra">\n  <Table.Head>\n    <Table.Row>\n      <Table.Header sortable>Name</Table.Header>\n      <Table.Header align="right">MRR</Table.Header>\n    </Table.Row>\n  </Table.Head>\n  <Table.Body>\n    {#each rows as row}\n      <Table.Row>\n        <Table.Cell>{row.name}</Table.Cell>\n        <Table.Cell align="right" mono>\${row.mrr}</Table.Cell>\n      </Table.Row>\n    {/each}\n  </Table.Body>\n</Table>`,
  },
  {
    id: "head",
    name: "Head",
    layer: "component",
    category: "display",
    description: "Semantic <thead> container wrapper sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table/table-head",
    estimatedSizeKb: 0.5,
    parentComposite: "table",
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Head positioning and boundary style" },
    ],
    slots: ["children"],
    a11yRole: "rowgroup",
    example: `<Table.Head variant="standard"><Table.Row>...</Table.Row></Table.Head>`,
  },
  {
    id: "header",
    name: "Header",
    layer: "component",
    category: "display",
    description: "Semantic <th> header cell sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table/table-header-cell",
    estimatedSizeKb: 1.4,
    parentComposite: "table",
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Header interaction style" },
      { name: "sortable", type: "boolean", required: false, default: "false", description: "Interactive sort trigger" },
      { name: "align", type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: "Text alignment" },
    ],
    slots: ["children"],
    a11yRole: "columnheader",
    example: `<Table.Header sortable align="left" variant="standard">Customer</Table.Header>`,
  },
  {
    id: "body",
    name: "Body",
    layer: "component",
    category: "display",
    description: "Semantic <tbody> container sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table/table-body",
    estimatedSizeKb: 0.7,
    parentComposite: "table",
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Body rows styling" },
    ],
    slots: ["children"],
    a11yRole: "rowgroup",
    example: `<Table.Body variant="standard">{#each items as item}...{/each}</Table.Body>`,
  },
  {
    id: "row",
    name: "Row",
    layer: "component",
    category: "display",
    description: "Semantic <tr> table row container sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table/table-row",
    estimatedSizeKb: 0.9,
    parentComposite: "table",
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Row state style" },
      { name: "selected", type: "boolean", required: false, default: "false", description: "Selected row highlight" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Non-interactive row" },
    ],
    slots: ["children"],
    a11yRole: "row",
    example: `<Table.Row selected={isSelected} variant="standard">...</Table.Row>`,
  },
  {
    id: "cell",
    name: "Cell",
    layer: "component",
    category: "display",
    description: "Semantic <td> data cell sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table/table-cell",
    estimatedSizeKb: 0.8,
    parentComposite: "table",
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Cell data formatter" },
      { name: "align", type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: "Cell alignment" },
      { name: "mono", type: "boolean", required: false, default: "false", description: "Monospace tabular numbers" },
      { name: "truncate", type: "boolean", required: false, default: "false", description: "Ellipsis overflow clipping" },
    ],
    slots: ["children"],
    a11yRole: "cell",
    example: `<Table.Cell align="right" mono variant="standard">\$19.00</Table.Cell>`,
  },
  {
    id: "footer",
    name: "Footer",
    layer: "component",
    category: "display",
    description: "Semantic <tfoot> summary row container sharing table family structural variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/data/table/table-footer",
    estimatedSizeKb: 0.5,
    parentComposite: "table",
    variants: ["standard", "compact", "zebra", "bordered", "glass", "matrix"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'zebra' | 'bordered' | 'glass' | 'matrix'", required: false, default: "'standard'", description: "Footer accumulator layout" },
    ],
    slots: ["children"],
    a11yRole: "rowgroup",
    example: `<Table.Footer variant="standard"><Table.Row>...</Table.Row></Table.Footer>`,
  },

  // --- 9. NAVIGATION & TAB FAMILY ---
  {
    id: "tabs",
    name: "Tabs",
    layer: "composite",
    category: "navigation",
    description: "Accessible navigational tab bar coordinating views with pill, underline, segment, vertical, bubble, and bordered variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/route/tabs",
    estimatedSizeKb: 2.4,
    primitives: ["list", "trigger", "content"],
    variants: ["pill", "underline", "segment", "vertical", "bubble", "bordered"],
    props: [
      { name: "value", type: "string", required: true, description: "Active tab identifier" },
      { name: "variant", type: "'pill' | 'underline' | 'segment' | 'vertical' | 'bubble' | 'bordered'", required: false, default: "'underline'", description: "Indicator style" },
    ],
    example: `<Tabs bind:value={activeTab} variant="pill">\n  <Tabs.List>\n    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>\n    <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="overview">Overview content...</Tabs.Content>\n</Tabs>`,
  },

  // --- 10. DESIGN ENGINEERING & DECORATION FAMILY ---
  {
    id: "blueprint",
    name: "Blueprint",
    layer: "component",
    category: "decoration",
    description: "Design engineering bounding box with 4 corner anchors, dashed leaders, dimension badges, and x-height rules.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/decoration/blueprint",
    estimatedSizeKb: 1.4,
    variants: ["primary", "accent", "tint", "monochrome", "grid"],
    props: [
      { name: "variant", type: "'primary' | 'accent' | 'tint' | 'monochrome' | 'grid'", required: false, default: "'primary'", description: "Semantic token theme color and style" },
      { name: "label", type: "string", required: false, description: "Dimension or token label (e.g. '294 × 58')" },
      { name: "xHeight", type: "boolean", required: false, default: "false", description: "Show cyan typography x-height baselines" },
    ],
    slots: ["children"],
    a11yRole: "presentation",
    example: `<Blueprint label="294 × 58" xHeight={true} variant="primary">\n  <h1 class="text-6xl font-medium">Interfaces</h1>\n</Blueprint>`,
  },
  {
    id: "ruler",
    name: "Ruler",
    layer: "block",
    category: "tool",
    description: "Interactive canvas dimension toolbar card with zoom level and 8px grid snapping indicator.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/block/tool/ruler",
    estimatedSizeKb: 1.8,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'editorial'", description: "Presentation theme" },
      { name: "width", type: "number | string", required: false, default: "1280", description: "Canvas width" },
      { name: "height", type: "number | string", required: false, default: "800", description: "Canvas height" },
      { name: "unit", type: "string", required: false, default: "'px'", description: "Measurement unit" },
      { name: "zoom", type: "string", required: false, default: "'100%'", description: "Zoom ratio" },
      { name: "snapGrid", type: "boolean", required: false, default: "true", description: "Snap to 8px grid" },
    ],
    a11yRole: "region",
    example: `<Ruler width={1440} height={900} unit="px" zoom="150%" snapGrid={true} variant="editorial" />`,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    layer: "component",
    category: "effect",
    description: "Interactive ambient cursor-tracking lighting effect illuminating cards and surface borders on hover.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/effect/spotlight",
    estimatedSizeKb: 1.2,
    variants: ["radial", "cone", "linear", "ambient", "border_only"],
    props: [
      { name: "variant", type: "'radial' | 'cone' | 'linear' | 'ambient' | 'border_only'", required: false, default: "'radial'", description: "Spotlight dispersion profile" },
      { name: "size", type: "number", required: false, default: "400", description: "Spotlight radius in px" },
      { name: "color", type: "string", required: false, description: "Radial gradient color" },
    ],
    slots: ["children"],
    a11yRole: "presentation",
    example: `<Spotlight variant="radial">\n  <Card>Hover me to see ambient lighting</Card>\n</Spotlight>`,
  },
  {
    id: "noise",
    name: "Noise",
    layer: "component",
    category: "effect",
    description: "Tactile SVG fractal noise overlay sharing texture profile variants (subtle, film, paper, heavy, grain).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/effect/noise",
    estimatedSizeKb: 0.8,
    variants: ["subtle", "film", "paper", "heavy", "grain"],
    props: [
      { name: "variant", type: "'subtle' | 'film' | 'paper' | 'heavy' | 'grain'", required: false, default: "'subtle'", description: "Texture profile" },
      { name: "opacity", type: "number", required: false, default: "0.035", description: "Texture opacity ratio" },
    ],
    a11yRole: "presentation",
    example: `<Noise variant="paper" />`,
  },

  // --- 11. WORKFLOW & SEQUENCING FAMILY ---
  {
    id: "kanban",
    name: "Kanban",
    layer: "composite",
    category: "interaction",
    description: "Drag-and-drop board sharing workflow family layout variants (standard, compact, matrix, glass, retro).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/interaction/kanban",
    estimatedSizeKb: 8.4,
    variants: ["standard", "compact", "matrix", "glass", "retro"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'matrix' | 'glass' | 'retro'", required: false, default: "'standard'", description: "Board theme" },
      { name: "columns", type: "Array<KanbanColumn>", required: true, description: "Kanban columns and items" },
      { name: "onCardMove", type: "(cardId: string, toColumnId: string, index: number) => void", required: true, description: "Card reposition handler" },
    ],
    example: `<Kanban columns={boardColumns} onCardMove={handleCardMove} variant="standard" />`,
  },
  {
    id: "timeline",
    name: "Timeline",
    layer: "composite",
    category: "workflow",
    description: "Event sequence tracker sharing workflow family layout variants (standard, compact, matrix, glass, retro).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/timeline",
    estimatedSizeKb: 3.6,
    primitives: ["item", "point", "track", "content"],
    variants: ["standard", "compact", "matrix", "glass", "retro"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'matrix' | 'glass' | 'retro'", required: false, default: "'standard'", description: "Layout style" },
      { name: "orientation", type: "'vertical' | 'horizontal'", required: false, default: "'vertical'", description: "Layout axis" },
    ],
    example: `<Timeline variant="standard">\n  <Timeline.Item status="completed">\n    <Timeline.Point />\n    <Timeline.Content title="Step 1: Market Validation" time="10:00" />\n  </Timeline.Item>\n</Timeline>`,
  },
  {
    id: "terminal",
    name: "Terminal",
    layer: "composite",
    category: "workflow",
    description: "Developer CLI console sharing workflow family layout variants (standard, compact, matrix, glass, retro).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/terminal",
    estimatedSizeKb: 6.2,
    primitives: ["prompt", "output", "cursor", "header"],
    variants: ["standard", "compact", "matrix", "glass", "retro"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'matrix' | 'glass' | 'retro'", required: false, default: "'glass'", description: "Visual window style" },
      { name: "title", type: "string", required: false, default: "'bash'", description: "Terminal titlebar text" },
      { name: "height", type: "number | string", required: false, default: "320", description: "Container height" },
    ],
    example: `<Terminal variant="glass">\n  <Terminal.Header title="holar-cli v2.0" />\n  <Terminal.Output text="Starting engine..." />\n  <Terminal.Prompt command="bun test" />\n</Terminal>`,
  },
  {
    id: "prompt",
    name: "Prompt",
    layer: "component",
    category: "workflow",
    description: "Command prompt input line sharing workflow family layout variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/terminal/prompt",
    estimatedSizeKb: 1.2,
    parentComposite: "terminal",
    variants: ["standard", "compact", "matrix", "glass", "retro"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'matrix' | 'glass' | 'retro'", required: false, default: "'standard'", description: "Prompt glyph style" },
      { name: "command", type: "string", required: false, description: "Executed command text" },
      { name: "cwd", type: "string", required: false, default: "'~'", description: "Current working directory label" },
    ],
    example: `<Terminal.Prompt cwd="~/Holar/Plugin" command="bun cli.ts docs" variant="standard" />`,
  },
  {
    id: "output",
    name: "Output",
    layer: "component",
    category: "workflow",
    description: "Monospace stdout stream viewer sharing workflow family layout variants.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/terminal/output",
    estimatedSizeKb: 1.5,
    parentComposite: "terminal",
    variants: ["standard", "compact", "matrix", "glass", "retro"],
    props: [
      { name: "variant", type: "'standard' | 'compact' | 'matrix' | 'glass' | 'retro'", required: false, default: "'standard'", description: "Stream output tint" },
      { name: "text", type: "string", required: true, description: "Console output string" },
      { name: "status", type: "'success' | 'error' | 'info'", required: false, default: "'info'", description: "Status tint" },
    ],
    example: `<Terminal.Output text="✓ 255 pass across 26 files (0 errors)" status="success" variant="standard" />`,
  },
  {
    id: "item",
    name: "Item",
    layer: "component",
    category: "workflow",
    description: "Step milestone event node sharing execution status variants (pending, active, completed, failed, skipped).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/workflow/timeline/item",
    estimatedSizeKb: 1.1,
    parentComposite: "timeline",
    variants: ["pending", "active", "completed", "failed", "skipped"],
    props: [
      { name: "variant", type: "'pending' | 'active' | 'completed' | 'failed' | 'skipped'", required: false, default: "'pending'", description: "Milestone status visual" },
      { name: "status", type: "'pending' | 'active' | 'completed' | 'failed'", required: false, default: "'pending'", description: "Step completion state" },
    ],
    slots: ["children"],
    example: `<Timeline.Item status="completed" variant="completed">...</Timeline.Item>`,
  },

  // --- 12. PAGE ARCHETYPES & COMPOSITE SANDBOXES FAMILY ---
  {
    id: "showcase",
    name: "Showcase",
    layer: "template",
    category: "scaffold",
    description: "Turnkey showcase page sharing page family archetypes (magazine, lab, minimal, dark_matrix, editorial).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/page/showcase",
    estimatedSizeKb: 4.8,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'magazine'", description: "Showcase styling theme" },
      { name: "title", type: "string", required: false, default: "'Interfaces Magazine'", description: "Showcase headline title" },
    ],
    example: `<Showcase title="Interfaces Magazine" variant="magazine" />`,
  },
  {
    id: "hero",
    name: "Hero",
    layer: "composite",
    category: "marketing",
    description: "Landing hero section sharing page family archetypes (magazine, lab, minimal, dark_matrix, editorial).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/marketing/hero",
    estimatedSizeKb: 3.1,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'editorial'", description: "Hero visual presentation" },
      { name: "title", type: "string", required: true, description: "Headline text" },
      { name: "subtitle", type: "string", required: false, description: "Supporting narrative" },
      { name: "badge", type: "string", required: false, description: "Pre-headline pill badge" },
      { name: "primaryAction", type: "{ label: string; href?: string; onclick?: () => void }", required: false, description: "Primary CTA button" },
    ],
    example: `<Hero title="Clinical-grade screening in seconds" subtitle="Send private links without accounts." badge="Free for 10 links/mo" variant="magazine" />`,
  },
  {
    id: "pricing",
    name: "Pricing",
    layer: "composite",
    category: "commerce",
    description: "Pricing comparison grid sharing page family archetypes (magazine, lab, minimal, dark_matrix, editorial).",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/commerce/pricing",
    estimatedSizeKb: 4.5,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'editorial'", description: "Pricing display mode" },
      { name: "plans", type: "Array<PricingPlan>", required: true, description: "List of pricing tiers" },
      { name: "onSelectPlan", type: "(planId: string) => void", required: true, description: "Plan checkout callback" },
    ],
    example: `<Pricing plans={pricingTiers} onSelectPlan={handleCheckout} variant="editorial" />`,
  },
  {
    id: "screener",
    name: "Screener",
    layer: "block",
    category: "tool",
    description: "Practitioner screening link generator sharing page family archetypes.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/block/tool/screener",
    estimatedSizeKb: 6.8,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'editorial'", description: "Screener layout variant" },
      { name: "scale", type: "'gad7' | 'phq9' | 'combined'", required: true, description: "Assessment scale" },
      { name: "quotaUsed", type: "number", required: true, description: "Number of links used this cycle" },
      { name: "quotaTotal", type: "number", required: true, description: "Total quota allowed" },
      { name: "pro", type: "boolean", required: true, description: "Subscription status" },
    ],
    example: `<Screener scale="gad7" quotaUsed={2} quotaTotal={10} pro={false} variant="editorial" />`,
  },
  {
    id: "questionnaire",
    name: "Questionnaire",
    layer: "block",
    category: "tool",
    description: "Clinical assessment flow sharing page family archetypes.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/block/tool/questionnaire",
    estimatedSizeKb: 7.2,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'editorial'", description: "Progression mode" },
      { name: "title", type: "string", required: true, description: "Assessment title" },
      { name: "description", type: "string", required: true, description: "Prompt instructions" },
      { name: "items", type: "Array<QuestionnaireItem>", required: true, description: "Questions array" },
      { name: "onAnswer", type: "(itemId: string, value: string | string[]) => void", required: true, description: "Item answer handler" },
      { name: "onSubmit", type: "(answers: Record<string, string | string[]>) => void", required: true, description: "Submission handler" },
    ],
    example: `<Questionnaire title="GAD-7" description="Over the last 2 weeks..." items={items} onAnswer={handleAnswer} onSubmit={handleSubmit} variant="editorial" />`,
  },
  {
    id: "comparison",
    name: "Comparison",
    layer: "composite",
    category: "display",
    description: "Split-view design engineering sandbox sharing page family archetypes.",
    importPath: "@mentalcraft/design-svelte",
    subpath: "@mentalcraft/design-svelte/composite/display/comparison",
    estimatedSizeKb: 2.2,
    variants: ["magazine", "lab", "minimal", "dark_matrix", "editorial"],
    props: [
      { name: "variant", type: "'magazine' | 'lab' | 'minimal' | 'dark_matrix' | 'editorial'", required: false, default: "'lab'", description: "Comparison layout mode" },
      { name: "title", type: "string", required: false, description: "Experiment title" },
      { name: "beforeLabel", type: "string", required: false, default: "'Default'", description: "Before tag text" },
      { name: "afterLabel", type: "string", required: false, default: "'Optimized'", description: "After tag text" },
    ],
    slots: ["before", "after", "controls"],
    example: `<Comparison title="Typography Balance Test" variant="lab">\n  {#snippet before()}...\n  {#snippet after()}...\n  {#snippet controls()}...\n</Comparison>`,
  },
];

/** Domain-Specific Plug-and-Play Design Slices */
export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: "clinical",
    name: "Mental Health & Clinical Assessment Pack",
    description: "Specialized for psychiatric screening (GAD-7, PHQ-9), crisis alert banners, and score severity breakdown.",
    recommendedComponents: ["Screener", "Questionnaire", "Card", "Button"],
    tokensFocus: ["--color-destructive", "--color-success", "--color-surface-raised"],
    snippet: `import { Screener, Questionnaire } from "@mentalcraft/design-svelte";\n// Dedicated clinical screening workflow`,
  },
  {
    id: "chat_ai",
    name: "AI Conversation & Real-Time Stream Pack",
    description: "Optimized for streaming LLM chat, message timeline, prompt inputs, and typing indicators.",
    recommendedComponents: ["Card", "Input", "Button", "Dialog"],
    tokensFocus: ["--color-primary", "--motion-base", "--radius-lg"],
    snippet: `import { Card, Input, Button, Dialog } from "@mentalcraft/design-svelte";\n// Conversational streaming workspace`,
  },
  {
    id: "analytics",
    name: "BI Dashboard & Metrics Pack",
    description: "Data visualization, metric summary cards, trend indicators, and data tables.",
    recommendedComponents: ["Chart", "Card", "Button", "Table"],
    tokensFocus: ["--font-title-1", "--color-primary", "--color-border"],
    snippet: `import { Chart, Card, Table } from "@mentalcraft/design-svelte";\n// High-density analytics telemetry`,
  },
  {
    id: "commerce",
    name: "Monetization & Subscription Checkout Pack",
    description: "Pricing comparison grids, subscription status pills, and billing receipts.",
    recommendedComponents: ["Pricing", "Card", "Button", "Badge"],
    tokensFocus: ["--color-primary", "--radius-md", "--font-title-2"],
    snippet: `import { Pricing, Button, Card, Badge } from "@mentalcraft/design-svelte";\n// Zero-friction checkout funnel`,
  },
  {
    id: "auth",
    name: "Identity & Access Guard Pack",
    description: "Magic-link login card, single-sign-on triggers, and user verification modals.",
    recommendedComponents: ["Card", "Input", "Button", "Dialog"],
    tokensFocus: ["--radius-md", "--color-primary", "--color-surface"],
    snippet: `import { Card, Input, Button } from "@mentalcraft/design-svelte";\n// Passwordless secure signin`,
  },
  {
    id: "ecommerce_pdp",
    name: "E-Commerce High-Converting PDP Pack",
    description: "High-converting product detail page with reactive variant matrix, dynamic inventory urgency, pricing formulas, and instant 1-click checkout.",
    recommendedComponents: ["Card", "Button", "Badge", "Input"],
    tokensFocus: ["--color-primary", "--color-destructive", "--radius-md", "--font-title-1"],
    snippet: `import { Card, Button, Badge } from "@mentalcraft/design-svelte";\n// High-conversion Svelte 5 Runes Product Detail Page`,
  },
  {
    id: "ecommerce_checkout",
    name: "E-Commerce Express Checkout Slideout Pack",
    description: "Frictionless express slideout checkout with Apple/Shop Pay fast actions, itemized cart summary ledger, and dynamic promo code calculation.",
    recommendedComponents: ["Drawer", "Card", "Button", "Input", "Badge"],
    tokensFocus: ["--color-primary", "--color-surface-raised", "--radius-lg", "--font-title-2"],
    snippet: `import { Drawer, Card, Button, Input, Badge } from "@mentalcraft/design-svelte";\n// Express 1-tap checkout slideout drawer`,
  },
  {
    id: "academic_manuscript_viewer",
    name: "Academic Manuscript & Citation Intelligence Pack",
    description: "Research paper metadata card, LaTeX mathematical formula viewer, 1-click BibTeX citation generator, and 3-reviewer score radar badge.",
    recommendedComponents: ["Card", "Badge", "Button", "Chart"],
    tokensFocus: ["--font-title-2", "--color-foreground", "--color-surface-raised", "--radius-sm"],
    snippet: `import { Card, Badge, Button, Chart } from "@mentalcraft/design-svelte";\n// Peer-reviewed academic manuscript & BibTeX viewer`,
  },
  {
    id: "venture_telemetry_dashboard",
    name: "Venture Telemetry & SaaS Growth Metrics Pack",
    description: "Executive venture metrics, MRR/ARR growth rate cards, D1/D7/D30 cohort retention heatmap table, and interactive price elasticity simulation curve.",
    recommendedComponents: ["Card", "Chart", "Badge", "Button", "Table"],
    tokensFocus: ["--color-primary", "--color-success", "--font-title-1", "--space-md"],
    snippet: `import { Card, Chart, Badge, Button, Table } from "@mentalcraft/design-svelte";\n// SaaS venture telemetry & retention heatmap dashboard`,
  },
];

/** Design System Tokens */
export const DESIGN_TOKENS: TokenDefinition[] = [
  // Colors (OKLCH System)
  { name: "primary", cssVariable: "--color-primary", value: "oklch(0.55 0.20 250)", category: "color", description: "Primary brand accent" },
  { name: "primary-hover", cssVariable: "--color-primary-hover", value: "oklch(0.52 0.20 250)", category: "color", description: "Primary hover state (∓3% lightness)" },
  { name: "surface", cssVariable: "--color-surface", value: "oklch(0.98 0.005 250)", category: "color", description: "Base page and card surface" },
  { name: "surface-raised", cssVariable: "--color-surface-raised", value: "oklch(1 0 0)", category: "color", description: "Raised overlay and modal surface" },
  { name: "foreground", cssVariable: "--color-foreground", value: "oklch(0.15 0.01 250)", category: "color", description: "Primary text and icons" },
  { name: "muted", cssVariable: "--color-muted", value: "oklch(0.50 0.01 250)", category: "color", description: "Secondary helper text" },
  { name: "border", cssVariable: "--color-border", value: "oklch(0.90 0.005 250)", category: "color", description: "Subtle card and divider border" },
  { name: "destructive", cssVariable: "--color-destructive", value: "oklch(0.58 0.22 25)", category: "color", description: "Error, danger, and self-harm alert" },
  { name: "success", cssVariable: "--color-success", value: "oklch(0.62 0.18 145)", category: "color", description: "Positive confirmation state" },
  
  // Radius (iOS Modulus)
  { name: "radius-xs", cssVariable: "--radius-xs", value: "4px", category: "radius", description: "Tag and pill radius" },
  { name: "radius-sm", cssVariable: "--radius-sm", value: "6px", category: "radius", description: "Input and button radius" },
  { name: "radius-md", cssVariable: "--radius-md", value: "10px", category: "radius", description: "Card and dropdown radius" },
  { name: "radius-lg", cssVariable: "--radius-lg", value: "16px", category: "radius", description: "Modal and container radius" },
  { name: "radius-full", cssVariable: "--radius-full", value: "9999px", category: "radius", description: "Avatar and badge pill radius" },

  // Spacing (4px modulus)
  { name: "space-xs", cssVariable: "--space-xs", value: "4px", category: "spacing", description: "Micro gap" },
  { name: "space-sm", cssVariable: "--space-sm", value: "8px", category: "spacing", description: "Compact element spacing" },
  { name: "space-md", cssVariable: "--space-md", value: "16px", category: "spacing", description: "Default component padding" },
  { name: "space-lg", cssVariable: "--space-lg", value: "24px", category: "spacing", description: "Section gap" },
  { name: "space-xl", cssVariable: "--space-xl", value: "32px", category: "spacing", description: "Major container spacing" },

  // Typography
  { name: "title-1", cssVariable: "--font-title-1", value: "2rem / 1.2", category: "typography", description: "Page heading" },
  { name: "title-2", cssVariable: "--font-title-2", value: "1.5rem / 1.3", category: "typography", description: "Section heading" },
  { name: "title-3", cssVariable: "--font-title-3", value: "1.125rem / 1.4", category: "typography", description: "Card title" },
  { name: "body", cssVariable: "--font-body", value: "0.875rem / 1.5", category: "typography", description: "Standard paragraph text" },
  { name: "caption", cssVariable: "--font-caption", value: "0.75rem / 1.4", category: "typography", description: "Helper footnotes and timestamps" },

  // Motion & Animation
  { name: "motion-fast", cssVariable: "--motion-fast", value: "150ms ease-out", category: "motion", description: "Hover and button click states" },
  { name: "motion-base", cssVariable: "--motion-base", value: "250ms cubic-bezier(0.16, 1, 0.3, 1)", category: "motion", description: "Modal dialog and drawer transitions" },
];

export function formatDesignSummary(result: DesignResult): string {
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
      const data = result.data as { optimizedImports: string[]; metrics: { originalEstimatedKb: number; optimizedKb: number; reductionPercent: number } };
      return `Bundle Optimized: ${data.metrics.reductionPercent}% size reduction (${data.metrics.originalEstimatedKb} KB → ${data.metrics.optimizedKb} KB)`;
    }
    case "generate_editorial": {
      const data = result.data as { manifest: EditorialManifest };
      return `Generated Editorial Visual (${data.manifest.mode}): ${data.manifest.palette} on ${data.manifest.substrate.name} [Subject: ${data.manifest.subject}]`;
    }
  }
}

export const compactDesignResult = formatDesignSummary;

