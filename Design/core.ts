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
  | "tool";

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
  | "bundle_optimize";

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
  {
    id: "button",
    name: "Button",
    layer: "component",
    category: "interaction",
    description: "Accessible interactive trigger with primary, secondary, ghost, line, glass, and plain variants.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/component/interaction/button",
    estimatedSizeKb: 1.8,
    variants: ["primary", "secondary", "ghost", "line", "glass", "plain"],
    props: [
      { name: "variant", type: "'primary' | 'secondary' | 'ghost' | 'line' | 'glass' | 'plain'", required: false, default: "'ghost'", description: "Visual variant of the button" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Disabled state" },
      { name: "state", type: "'idle' | 'busy'", required: false, default: "'idle'", description: "Busy loading state" },
      { name: "type", type: "'button' | 'submit' | 'reset'", required: false, default: "'button'", description: "HTML button type" },
      { name: "label", type: "string", required: false, description: "Accessible text label" },
    ],
    slots: ["children"],
    a11yRole: "button",
    example: `<Button variant="primary" onclick={() => alert('Clicked')}>Confirm</Button>`,
  },
  {
    id: "card",
    name: "Card",
    layer: "component",
    category: "scaffold",
    description: "Elevated content container with standard border, radius, padding and hover elevation.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/component/scaffold/card",
    estimatedSizeKb: 1.2,
    variants: ["flat", "outline", "elevated", "glass"],
    props: [
      { name: "variant", type: "'flat' | 'outline' | 'elevated' | 'glass'", required: false, default: "'outline'", description: "Card elevation style" },
      { name: "padding", type: "'none' | 'sm' | 'md' | 'lg'", required: false, default: "'md'", description: "Inner padding scale" },
    ],
    slots: ["children"],
    a11yRole: "region",
    example: `<Card padding="md">\n  <h3 class="text-title-3 font-semibold">Card Title</h3>\n  <p class="text-muted">Card body content</p>\n</Card>`,
  },
  {
    id: "input",
    name: "Input",
    layer: "component",
    category: "input",
    description: "Standard text entry with clear affordance, focus ring, leading/trailing icons, and validation state.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/component/input/text",
    estimatedSizeKb: 1.5,
    props: [
      { name: "value", type: "string", required: false, description: "Bound text value" },
      { name: "placeholder", type: "string", required: false, description: "Hint placeholder" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Disabled state" },
      { name: "type", type: "string", required: false, default: "'text'", description: "Input type (text, password, email)" },
      { name: "error", type: "string", required: false, description: "Validation error message" },
    ],
    a11yRole: "textbox",
    example: `<Input bind:value={email} placeholder="name@example.com" type="email" />`,
  },
  {
    id: "dialog",
    name: "Dialog",
    layer: "composite",
    category: "overlay",
    description: "Modal dialog with focus lock, escape key dismissal, and backdrop blur.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/overlay/dialog",
    estimatedSizeKb: 3.4,
    props: [
      { name: "open", type: "boolean", required: true, description: "Controlled open state" },
      { name: "title", type: "string", required: true, description: "Accessible modal title" },
      { name: "description", type: "string", required: false, description: "Modal subtitle or purpose" },
    ],
    slots: ["trigger", "content", "actions"],
    a11yRole: "dialog",
    example: `<Dialog open={isOpen} title="Confirm Action" description="This action cannot be undone.">\n  <Button onclick={confirm}>Proceed</Button>\n</Dialog>`,
  },
  {
    id: "screener",
    name: "Screener",
    layer: "block",
    category: "tool",
    description: "Practitioner screening link generator, link table, and quota indicator.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/block/tool/screener",
    estimatedSizeKb: 6.8,
    props: [
      { name: "scale", type: "'gad7' | 'phq9' | 'combined'", required: true, description: "Assessment scale" },
      { name: "quotaUsed", type: "number", required: true, description: "Number of links used this cycle" },
      { name: "quotaTotal", type: "number", required: true, description: "Total quota allowed" },
      { name: "pro", type: "boolean", required: true, description: "Subscription status" },
    ],
    example: `<Screener scale="gad7" quotaUsed={2} quotaTotal={10} pro={false} />`,
  },
  {
    id: "questionnaire",
    name: "Questionnaire",
    layer: "block",
    category: "tool",
    description: "Validated clinical assessment flow with single/multi-stage progression and crisis handling.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/block/tool/questionnaire",
    estimatedSizeKb: 7.2,
    props: [
      { name: "title", type: "string", required: true, description: "Assessment title" },
      { name: "description", type: "string", required: true, description: "Prompt instructions" },
      { name: "items", type: "Array<QuestionnaireItem>", required: true, description: "Questions array" },
      { name: "onAnswer", type: "(itemId: string, value: string | string[]) => void", required: true, description: "Item answer handler" },
      { name: "onSubmit", type: "(answers: Record<string, string | string[]>) => void", required: true, description: "Submission handler" },
    ],
    example: `<Questionnaire title="GAD-7" description="Over the last 2 weeks..." items={items} onAnswer={handleAnswer} onSubmit={handleSubmit} />`,
  },
  {
    id: "hero",
    name: "Hero",
    layer: "composite",
    category: "marketing",
    description: "Marketing landing hero section with headline, badge, call-to-action buttons, and visual media.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/marketing/hero",
    estimatedSizeKb: 3.1,
    props: [
      { name: "title", type: "string", required: true, description: "Headline text" },
      { name: "subtitle", type: "string", required: false, description: "Supporting narrative" },
      { name: "badge", type: "string", required: false, description: "Pre-headline pill badge" },
      { name: "primaryAction", type: "{ label: string; href?: string; onclick?: () => void }", required: false, description: "Primary CTA button" },
    ],
    example: `<Hero title="Clinical-grade screening in seconds" subtitle="Send private links without accounts." badge="Free for 10 links/mo" />`,
  },
  {
    id: "pricing",
    name: "Pricing",
    layer: "composite",
    category: "commerce",
    description: "Transparent pricing tier grid with feature checklists, billing cycle toggles, and CTA triggers.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/commerce/pricing",
    estimatedSizeKb: 4.5,
    props: [
      { name: "plans", type: "Array<PricingPlan>", required: true, description: "List of pricing tiers" },
      { name: "onSelectPlan", type: "(planId: string) => void", required: true, description: "Plan checkout callback" },
    ],
    example: `<Pricing plans={pricingTiers} onSelectPlan={handleCheckout} />`,
  },
  {
    id: "kanban",
    name: "Kanban",
    layer: "composite",
    category: "interaction",
    description: "Accessible drag-and-drop board with columns, cards, keyboard reordering, and drop indicators.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/interaction/kanban",
    estimatedSizeKb: 8.4,
    props: [
      { name: "columns", type: "Array<KanbanColumn>", required: true, description: "Kanban columns and items" },
      { name: "onCardMove", type: "(cardId: string, toColumnId: string, index: number) => void", required: true, description: "Card reposition handler" },
    ],
    example: `<Kanban columns={boardColumns} onCardMove={handleCardMove} />`,
  },
  {
    id: "chart",
    name: "Chart",
    layer: "composite",
    category: "display",
    description: "SVG-based accessible compound visualization container with Cartesian scales and spring animations.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart",
    estimatedSizeKb: 5.6,
    primitives: [
      "chart_axis",
      "chart_grid",
      "chart_rule",
      "chart_line",
      "chart_area",
      "chart_bar",
      "chart_point",
      "chart_arc",
      "chart_radar",
      "chart_candlestick",
      "chart_funnel",
      "chart_treemap",
      "chart_sparkline",
      "chart_legend",
      "chart_tooltip",
    ],
    props: [
      { name: "data", type: "Array<Record<string, unknown>>", required: true, description: "Data series" },
      { name: "xKey", type: "string", required: false, default: "'x'", description: "Horizontal domain field" },
      { name: "yKey", type: "string", required: false, default: "'y'", description: "Vertical range field" },
      { name: "height", type: "number", required: false, default: "240", description: "Chart canvas height in px" },
    ],
    example: `<Chart data={data}>\n  <Chart.Grid />\n  <Chart.Axis orientation="bottom" />\n  <Chart.Axis orientation="left" />\n  <Chart.Line />\n  <Chart.Tooltip />\n</Chart>`,
  },
  {
    id: "chart_axis",
    name: "ChartAxis",
    layer: "component",
    category: "display",
    description: "Cartesian or polar coordinate axis line with tick marks, interval subdivision, and formatted value labels.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-axis",
    estimatedSizeKb: 1.4,
    parentComposite: "chart",
    props: [
      { name: "orientation", type: "'bottom' | 'left' | 'top' | 'right'", required: true, description: "Axis placement edge" },
      { name: "ticks", type: "number", required: false, default: "5", description: "Target number of division ticks" },
      { name: "format", type: "(val: unknown) => string", required: false, description: "Label formatting function" },
    ],
    a11yRole: "presentation",
    example: `<Chart.Axis orientation="bottom" ticks={6} />`,
  },
  {
    id: "chart_grid",
    name: "ChartGrid",
    layer: "component",
    category: "display",
    description: "Cartesian background reference gridlines supporting solid, dashed, and sub-tick styling.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-grid",
    estimatedSizeKb: 0.8,
    parentComposite: "chart",
    props: [
      { name: "x", type: "boolean", required: false, default: "true", description: "Enable vertical gridlines" },
      { name: "y", type: "boolean", required: false, default: "true", description: "Enable horizontal gridlines" },
      { name: "dashed", type: "boolean", required: false, default: "true", description: "Use dashed hairline stroke" },
    ],
    a11yRole: "presentation",
    example: `<Chart.Grid dashed={true} />`,
  },
  {
    id: "chart_rule",
    name: "ChartRule",
    layer: "component",
    category: "display",
    description: "Target baseline, SLA threshold, or break-even statistical indicator line across coordinate space.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-rule",
    estimatedSizeKb: 0.9,
    parentComposite: "chart",
    props: [
      { name: "y", type: "number", required: false, description: "Horizontal constant value" },
      { name: "x", type: "number | string", required: false, description: "Vertical constant value" },
      { name: "label", type: "string", required: false, description: "Text annotation label" },
    ],
    a11yRole: "presentation",
    example: `<Chart.Rule y={10000} label="Target $10k MRR" />`,
  },
  {
    id: "chart_line",
    name: "ChartLine",
    layer: "component",
    category: "display",
    description: "SVG monotonic cubic spline or linear continuous line series with stroke-width and gradient fill.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-line",
    estimatedSizeKb: 1.6,
    parentComposite: "chart",
    props: [
      { name: "curve", type: "'linear' | 'monotone' | 'step'", required: false, default: "'monotone'", description: "Spline interpolation" },
      { name: "color", type: "string", required: false, default: "'primary'", description: "Theme token stroke color" },
      { name: "strokeWidth", type: "number", required: false, default: "2", description: "Line pixel width" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Line curve="monotone" color="primary" strokeWidth={2.5} />`,
  },
  {
    id: "chart_area",
    name: "ChartArea",
    layer: "component",
    category: "display",
    description: "Continuous area under curve with vertical linear gradient opacity falloff to zero baseline.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-area",
    estimatedSizeKb: 1.2,
    parentComposite: "chart",
    props: [
      { name: "curve", type: "'linear' | 'monotone'", required: false, default: "'monotone'", description: "Spline curve style" },
      { name: "opacity", type: "number", required: false, default: "0.2", description: "Peak fill opacity" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Area curve="monotone" opacity={0.25} />`,
  },
  {
    id: "chart_bar",
    name: "ChartBar",
    layer: "component",
    category: "display",
    description: "Discrete rectangular column/bar geometry with top corner rounding and stacked cohort support.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-bar",
    estimatedSizeKb: 1.5,
    parentComposite: "chart",
    props: [
      { name: "radius", type: "number", required: false, default: "4", description: "Top corner border radius" },
      { name: "stacked", type: "boolean", required: false, default: "false", description: "Stack multiple series" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Bar radius={6} />`,
  },
  {
    id: "chart_point",
    name: "ChartPoint",
    layer: "component",
    category: "display",
    description: "Discrete scatter marker supporting circle, diamond, square, and sized bubble marks.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-point",
    estimatedSizeKb: 0.9,
    parentComposite: "chart",
    variants: ["circle", "diamond", "square", "bubble"],
    props: [
      { name: "variant", type: "'circle' | 'diamond' | 'square' | 'bubble'", required: false, default: "'circle'", description: "Marker shape" },
      { name: "size", type: "number", required: false, default: "6", description: "Point diameter in px" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Point variant="diamond" size={8} />`,
  },
  {
    id: "chart_arc",
    name: "ChartArc",
    layer: "component",
    category: "display",
    description: "Polar coordinate pie and donut slice geometry with corner radius and angle pad spacing.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-arc",
    estimatedSizeKb: 1.8,
    parentComposite: "chart",
    props: [
      { name: "innerRadius", type: "number", required: false, default: "0", description: "Inner cutout radius for donut" },
      { name: "padAngle", type: "number", required: false, default: "0.02", description: "Angular separation between slices" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Arc innerRadius={60} padAngle={0.03} />`,
  },
  {
    id: "chart_sparkline",
    name: "ChartSparkline",
    layer: "component",
    category: "display",
    description: "Ultra-dense inline micro-trend sparkline for tables, cards, and compact metric badges.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-sparkline",
    estimatedSizeKb: 1.1,
    parentComposite: "chart",
    props: [
      { name: "data", type: "Array<number>", required: true, description: "Numeric sequence" },
      { name: "height", type: "number", required: false, default: "28", description: "Height in px" },
      { name: "showEndpoints", type: "boolean", required: false, default: "true", description: "Highlight first/last points" },
    ],
    a11yRole: "graphics-symbol",
    example: `<Chart.Sparkline data={[12, 18, 15, 24, 38]} height={24} />`,
  },
  {
    id: "chart_legend",
    name: "ChartLegend",
    layer: "component",
    category: "display",
    description: "Interactive series legend with toggle visibility checkboxes and color dot indicators.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-legend",
    estimatedSizeKb: 0.7,
    parentComposite: "chart",
    props: [
      { name: "position", type: "'top' | 'bottom' | 'right'", required: false, default: "'top'", description: "Legend alignment" },
    ],
    a11yRole: "list",
    example: `<Chart.Legend position="top" />`,
  },
  {
    id: "chart_tooltip",
    name: "ChartTooltip",
    layer: "component",
    category: "display",
    description: "Spring-physics floating detail popover tracking nearest active data point coordinates.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/display/chart/chart-tooltip",
    estimatedSizeKb: 1.3,
    parentComposite: "chart",
    props: [
      { name: "snap", type: "boolean", required: false, default: "true", description: "Snap to nearest point x-coord" },
    ],
    a11yRole: "tooltip",
    example: `<Chart.Tooltip snap={true} />`,
  },
  {
    id: "badge",
    name: "Badge",
    layer: "component",
    category: "status",
    description: "Compact status pill and numerical counter badge with multiple semantic tone variants.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/component/feedback/badge",
    estimatedSizeKb: 1.1,
    variants: ["default", "primary", "success", "warning", "destructive", "outline", "pill"],
    props: [
      { name: "variant", type: "'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline' | 'pill'", required: false, default: "'default'", description: "Visual style variant" },
      { name: "size", type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: "Scale size" },
      { name: "pulse", type: "boolean", required: false, default: "false", description: "Animated urgency pulse indicator" },
    ],
    slots: ["children"],
    a11yRole: "status",
    example: `<Badge variant="success" pulse={true}>⚡ In Stock</Badge>`,
  },
  {
    id: "drawer",
    name: "Drawer",
    layer: "composite",
    category: "overlay",
    description: "Slideout panel sheet anchored to screen edges with backdrop dismissal and focus management.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/overlay/drawer",
    estimatedSizeKb: 3.8,
    variants: ["right", "left", "bottom", "top"],
    props: [
      { name: "open", type: "boolean", required: true, description: "Controlled open/close state" },
      { name: "position", type: "'right' | 'left' | 'bottom' | 'top'", required: false, default: "'right'", description: "Slideout anchor edge" },
      { name: "title", type: "string", required: true, description: "Accessible drawer header title" },
      { name: "onClose", type: "() => void", required: true, description: "Close request handler" },
    ],
    slots: ["header", "children", "footer"],
    a11yRole: "dialog",
    example: `<Drawer open={isCartOpen} title="Express Checkout" onClose={() => isCartOpen = false}>\n  <p>Itemized cart items...</p>\n</Drawer>`,
  },
  {
    id: "table",
    name: "Table",
    layer: "composite",
    category: "display",
    description: "Accessible compound data table container supporting sorting, selection, and responsive virtual scroll.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table",
    estimatedSizeKb: 4.2,
    primitives: [
      "table_head",
      "table_header_cell",
      "table_body",
      "table_row",
      "table_cell",
      "table_footer",
      "table_caption",
    ],
    props: [
      { name: "rows", type: "Array<Record<string, unknown>>", required: false, description: "Data records" },
      { name: "selectable", type: "boolean", required: false, default: "false", description: "Row multi-selection" },
      { name: "reorderable", type: "boolean", required: false, default: "false", description: "Drag row reordering" },
    ],
    example: `<Table>\n  <Table.Head>\n    <Table.Row>\n      <Table.HeaderCell sortable>Name</Table.HeaderCell>\n      <Table.HeaderCell align="right">MRR</Table.HeaderCell>\n    </Table.Row>\n  </Table.Head>\n  <Table.Body>\n    {#each rows as row}\n      <Table.Row>\n        <Table.Cell>{row.name}</Table.Cell>\n        <Table.Cell align="right" mono>\${row.mrr}</Table.Cell>\n      </Table.Row>\n    {/each}\n  </Table.Body>\n</Table>`,
  },
  {
    id: "table_head",
    name: "TableHead",
    layer: "component",
    category: "display",
    description: "Semantic <thead> container wrapper with sticky header positioning and border separation.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table/table-head",
    estimatedSizeKb: 0.5,
    parentComposite: "table",
    slots: ["children"],
    a11yRole: "rowgroup",
    example: `<Table.Head><Table.Row>...</Table.Row></Table.Head>`,
  },
  {
    id: "table_header_cell",
    name: "TableHeaderCell",
    layer: "component",
    category: "display",
    description: "Semantic <th> header cell with interactive sort order indicators, column resizing grip, and alignment.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table/table-header-cell",
    estimatedSizeKb: 1.4,
    parentComposite: "table",
    props: [
      { name: "sortable", type: "boolean", required: false, default: "false", description: "Interactive sort trigger" },
      { name: "align", type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: "Text alignment" },
    ],
    slots: ["children"],
    a11yRole: "columnheader",
    example: `<Table.HeaderCell sortable align="left">Customer</Table.HeaderCell>`,
  },
  {
    id: "table_body",
    name: "TableBody",
    layer: "component",
    category: "display",
    description: "Semantic <tbody> container with zebra row alternation, empty state placeholder, and selection state.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table/table-body",
    estimatedSizeKb: 0.7,
    parentComposite: "table",
    slots: ["children"],
    a11yRole: "rowgroup",
    example: `<Table.Body>{#each items as item}...{/each}</Table.Body>`,
  },
  {
    id: "table_row",
    name: "TableRow",
    layer: "component",
    category: "display",
    description: "Semantic <tr> table row container with active selection checkbox, hover highlights, and expansion trigger.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table/table-row",
    estimatedSizeKb: 0.9,
    parentComposite: "table",
    props: [
      { name: "selected", type: "boolean", required: false, default: "false", description: "Selected row highlight" },
      { name: "disabled", type: "boolean", required: false, default: "false", description: "Non-interactive row" },
    ],
    slots: ["children"],
    a11yRole: "row",
    example: `<Table.Row selected={isSelected}>...</Table.Row>`,
  },
  {
    id: "table_cell",
    name: "TableCell",
    layer: "component",
    category: "display",
    description: "Semantic <td> data cell with monospace tabular number font features, text alignment, and truncation.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table/table-cell",
    estimatedSizeKb: 0.8,
    parentComposite: "table",
    props: [
      { name: "align", type: "'left' | 'center' | 'right'", required: false, default: "'left'", description: "Cell alignment" },
      { name: "mono", type: "boolean", required: false, default: "false", description: "Monospace tabular numbers" },
      { name: "truncate", type: "boolean", required: false, default: "false", description: "Ellipsis overflow clipping" },
    ],
    slots: ["children"],
    a11yRole: "cell",
    example: `<Table.Cell align="right" mono>\$19.00</Table.Cell>`,
  },
  {
    id: "table_footer",
    name: "TableFooter",
    layer: "component",
    category: "display",
    description: "Semantic <tfoot> summary row container with top border and bold accumulator alignment.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/composite/data/table/table-footer",
    estimatedSizeKb: 0.5,
    parentComposite: "table",
    slots: ["children"],
    a11yRole: "rowgroup",
    example: `<Table.Footer><Table.Row>...</Table.Row></Table.Footer>`,
  },
  {
    id: "avatar",
    name: "Avatar",
    layer: "component",
    category: "display",
    description: "User profile thumbnail with initials fallback, online presence dot, and image loading state.",
    importPath: "infra-ui-svelte",
    subpath: "infra-ui-svelte/component/display/avatar",
    estimatedSizeKb: 1.3,
    props: [
      { name: "src", type: "string", required: false, description: "Image source URL" },
      { name: "name", type: "string", required: true, description: "Full name for alt text and fallback initials" },
      { name: "size", type: "'sm' | 'md' | 'lg' | 'xl'", required: false, default: "'md'", description: "Avatar dimension" },
      { name: "status", type: "'online' | 'offline' | 'busy' | 'away'", required: false, description: "Status indicator dot" },
    ],
    a11yRole: "img",
    example: `<Avatar name="Satoshi Nakamoto" size="md" status="online" />`,
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
    snippet: `import { Screener, Questionnaire } from "infra-ui-svelte";\n// Dedicated clinical screening workflow`,
  },
  {
    id: "chat_ai",
    name: "AI Conversation & Real-Time Stream Pack",
    description: "Optimized for streaming LLM chat, message timeline, prompt inputs, and typing indicators.",
    recommendedComponents: ["Card", "Input", "Button", "Dialog"],
    tokensFocus: ["--color-primary", "--motion-base", "--radius-lg"],
    snippet: `import { Card, Input, Button, Dialog } from "infra-ui-svelte";\n// Conversational streaming workspace`,
  },
  {
    id: "analytics",
    name: "BI Dashboard & Metrics Pack",
    description: "Data visualization, metric summary cards, trend indicators, and data tables.",
    recommendedComponents: ["Chart", "Card", "Button", "Table"],
    tokensFocus: ["--font-title-1", "--color-primary", "--color-border"],
    snippet: `import { Chart, Card, Table } from "infra-ui-svelte";\n// High-density analytics telemetry`,
  },
  {
    id: "commerce",
    name: "Monetization & Subscription Checkout Pack",
    description: "Pricing comparison grids, subscription status pills, and billing receipts.",
    recommendedComponents: ["Pricing", "Card", "Button", "Badge"],
    tokensFocus: ["--color-primary", "--radius-md", "--font-title-2"],
    snippet: `import { Pricing, Button, Card, Badge } from "infra-ui-svelte";\n// Zero-friction checkout funnel`,
  },
  {
    id: "auth",
    name: "Identity & Access Guard Pack",
    description: "Magic-link login card, single-sign-on triggers, and user verification modals.",
    recommendedComponents: ["Card", "Input", "Button", "Dialog"],
    tokensFocus: ["--radius-md", "--color-primary", "--color-surface"],
    snippet: `import { Card, Input, Button } from "infra-ui-svelte";\n// Passwordless secure signin`,
  },
  {
    id: "ecommerce_pdp",
    name: "E-Commerce High-Converting PDP Pack",
    description: "High-converting product detail page with reactive variant matrix, dynamic inventory urgency, pricing formulas, and instant 1-click checkout.",
    recommendedComponents: ["Card", "Button", "Badge", "Input"],
    tokensFocus: ["--color-primary", "--color-destructive", "--radius-md", "--font-title-1"],
    snippet: `import { Card, Button, Badge } from "infra-ui-svelte";\n// High-conversion Svelte 5 Runes Product Detail Page`,
  },
  {
    id: "ecommerce_checkout",
    name: "E-Commerce Express Checkout Slideout Pack",
    description: "Frictionless express slideout checkout with Apple/Shop Pay fast actions, itemized cart summary ledger, and dynamic promo code calculation.",
    recommendedComponents: ["Drawer", "Card", "Button", "Input", "Badge"],
    tokensFocus: ["--color-primary", "--color-surface-raised", "--radius-lg", "--font-title-2"],
    snippet: `import { Drawer, Card, Button, Input, Badge } from "infra-ui-svelte";\n// Express 1-tap checkout slideout drawer`,
  },
  {
    id: "academic_manuscript_viewer",
    name: "Academic Manuscript & Citation Intelligence Pack",
    description: "Research paper metadata card, LaTeX mathematical formula viewer, 1-click BibTeX citation generator, and 3-reviewer score radar badge.",
    recommendedComponents: ["Card", "Badge", "Button", "Chart"],
    tokensFocus: ["--font-title-2", "--color-foreground", "--color-surface-raised", "--radius-sm"],
    snippet: `import { Card, Badge, Button, Chart } from "infra-ui-svelte";\n// Peer-reviewed academic manuscript & BibTeX viewer`,
  },
  {
    id: "venture_telemetry_dashboard",
    name: "Venture Telemetry & SaaS Growth Metrics Pack",
    description: "Executive venture metrics, MRR/ARR growth rate cards, D1/D7/D30 cohort retention heatmap table, and interactive price elasticity simulation curve.",
    recommendedComponents: ["Card", "Chart", "Badge", "Button", "Table"],
    tokensFocus: ["--color-primary", "--color-success", "--font-title-1", "--space-md"],
    snippet: `import { Card, Chart, Badge, Button, Table } from "infra-ui-svelte";\n// SaaS venture telemetry & retention heatmap dashboard`,
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
  }
}

export const compactDesignResult = formatDesignSummary;

