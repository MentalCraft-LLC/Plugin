# MentalCraft Design System & UI Intelligence Plugin

The `design` plugin is a first-class declarative MCP tool and design automation engine for the MentalCraft ecosystem.

It bridges the headless Svelte 5 component architecture in `Design/Svelte` (`infra-ui-svelte`) with autonomous coding agents (Cursor, Antigravity, Pi, Claude Desktop) and real-time browser inspection (`Plugin/Chrome`).

---

## 🏛️ 5-Layer Design Hierarchy

| Layer | Level | Scope | Governance Rule |
|---|---|---|---|
| `foundation` | 1 | Layout, Tokens, Elevation, Motion, Gestures, Focus, Scroll | Consumes only native CSS and headless runtimes. |
| `component` | 2 | Single-part parts (Button, Input, Card, Badge, Table, Avatar) | Consumes only foundation. Strict variants & A11y roles. |
| `composite` | 3 | Multi-part patterns (Dialog, Drawer, Kanban, Chart, Pricing, Hero) | Composes components and foundation; zero business logic. |
| `block` | 4 | Domain tools & content blocks (Screener, Questionnaire, Auth) | Reusable across products; accepts typed domain parameters. |
| `template` | 5 | Whole-page archetypes (Information, Transaction, Operation) | Top of hierarchy; coordinates blocks and layouts. |

---

## 📦 Verified Component Catalog & Compound Suites

### 1. High-Level Components & Composites

| Component | Layer | Category | Estimated Size | Primary Variants / Features | Import Subpath |
|---|---|---|---|---|---|
| `Button` | `component` | `interaction` | 1.8 KB | `primary`, `secondary`, `ghost`, `line`, `glass`, `plain` | `infra-ui-svelte/component/interaction/button` |
| `Card` | `component` | `scaffold` | 1.2 KB | `flat`, `outline`, `elevated`, `glass` | `infra-ui-svelte/component/scaffold/card` |
| `Input` | `component` | `input` | 1.5 KB | `text`, `email`, `password`, with validation state | `infra-ui-svelte/component/input/text` |
| `Badge` | `component` | `status` | 1.1 KB | `default`, `primary`, `success`, `warning`, `destructive`, `outline`, `pill`, `pulse` | `infra-ui-svelte/component/feedback/badge` |
| `Avatar` | `component` | `display` | 1.3 KB | `sm`, `md`, `lg`, `xl`, initials fallback, online presence dot | `infra-ui-svelte/component/display/avatar` |
| `Dialog` | `composite` | `overlay` | 3.4 KB | Focus trap, escape dismiss, backdrop blur | `infra-ui-svelte/composite/overlay/dialog` |
| `Drawer` | `composite` | `overlay` | 3.8 KB | `right`, `left`, `bottom`, `top`, backdrop dismiss | `infra-ui-svelte/composite/overlay/drawer` |
| `Hero` | `composite` | `marketing` | 3.1 KB | Headline, pill badge, CTA triggers, media slot | `infra-ui-svelte/composite/marketing/hero` |
| `Pricing` | `composite` | `commerce` | 4.5 KB | Feature matrix, tier cards, checkout callbacks | `infra-ui-svelte/composite/commerce/pricing` |
| `Kanban` | `composite` | `interaction` | 8.4 KB | Drag & drop, keyboard reordering, column drop zones | `infra-ui-svelte/composite/interaction/kanban` |
| `Table` | `composite` | `display` | 4.2 KB | Compound data table composed of 7 underlying primitives | `infra-ui-svelte/composite/data/table` |
| `Chart` | `composite` | `display` | 5.6 KB | Compound visualization container composed of 15 primitives | `infra-ui-svelte/composite/display/chart` |
| `Screener` | `block` | `tool` | 6.8 KB | GAD-7, PHQ-9, quota indicator, private links | `infra-ui-svelte/block/tool/screener` |
| `Questionnaire` | `block` | `tool` | 7.2 KB | Multi-stage progression, crisis banners, scoring receipt | `infra-ui-svelte/block/tool/questionnaire` |

---

### 2. Table Underlying Primitive Suite (`Table.*`)

| Primitive ID | Name | Role | Key Props / Capabilities |
|---|---|---|---|
| `table_head` | `Table.Head` | `<thead>` Container | Sticky positioning, border divider |
| `table_header_cell` | `Table.HeaderCell` | `<th>` Column Header | Interactive sort arrows, column resize grip, text alignment |
| `table_body` | `Table.Body` | `<tbody>` Data Container | Zebra striping, reactive row selection state, empty states |
| `table_row` | `Table.Row` | `<tr>` Row Container | Active selection checkbox, hover highlights, expandable sub-rows |
| `table_cell` | `Table.Cell` | `<td>` Data Cell | Monospace tabular numbers (`fontFeature: tnum`), alignment, heatmap |
| `table_footer` | `Table.Footer` | `<tfoot>` Summary Row | Top border, bold accumulator metrics |

---

### 3. Chart Underlying Primitive Suite (`Chart.*`)

| Primitive ID | Name | Role | Key Props / Capabilities |
|---|---|---|---|
| `chart_axis` | `Chart.Axis` | Coordinate Axes | X/Y placement (`bottom`/`left`), tick subdivisions, value formatters |
| `chart_grid` | `Chart.Grid` | Cartesian Gridlines | Solid/dashed reference lines, sub-tick grid alignments |
| `chart_rule` | `Chart.Rule` | Threshold Baseline | Constant reference indicator line (e.g. target $10k MRR) |
| `chart_line` | `Chart.Line` | Spline Line Mark | SVG monotonic cubic spline, gradient strokes, line widths |
| `chart_area` | `Chart.Area` | Area Fill Mark | Continuous polygon area with vertical gradient opacity falloff |
| `chart_bar` | `Chart.Bar` | Column / Bar Mark | Rounded rectangular geometry, stacked cohort series support |
| `chart_point` | `Chart.Point` | Discrete Scatter Points | Circle, diamond, square, and sized bubble marks |
| `chart_arc` | `Chart.Arc` | Polar Slices | Pie and donut slice geometry with corner radius and pad angle |
| `chart_radar` | `Chart.Radar` | Multiaxial Web | Polygonal polar area for multi-dimensional trait mapping |
| `chart_candlestick`| `Chart.Candlestick`| Financial OHLC Mark | Box-and-whisker geometry for price volatility tracking |
| `chart_funnel` | `Chart.Funnel` | Conversion Stages | Stepped trapezoid geometry with step drop-off ratios |
| `chart_treemap` | `Chart.Treemap` | Hierarchical Partition| 2D squarified spatial area for category breakdown |
| `chart_sparkline`| `Chart.Sparkline`| Inline Micro-Trend | Ultra-dense sparkline with highlighted start/end endpoints |
| `chart_legend` | `Chart.Legend` | Series Guide | Interactive visibility toggle checkboxes and color indicators |
| `chart_tooltip`| `Chart.Tooltip` | Hover Popover | Spring-physics floating popover tracking nearest active data point |

---

## 🎨 Domain Presets

The plugin provides 9 specialized domain packs for zero-latency scaffolding:

1. `clinical`: Psychiatric screening (GAD-7, PHQ-9), crisis alert banners, and score severity receipt.
2. `chat_ai`: Streaming LLM conversation, message timelines, typing indicators, and prompt inputs.
3. `analytics`: Business intelligence dashboards, KPI metrics, trend indicators, and telemetry tables.
4. `commerce`: Monetization comparison grids, subscription status pills, and billing receipts.
5. `auth`: Passwordless magic-link authentication, SSO buttons, and access guard dialogs.
6. `ecommerce_pdp`: High-converting product detail page with Svelte 5 Runes (`$state`, `$derived`), variant selector, inventory urgency badge, and 1-click buy button.
7. `ecommerce_checkout`: Express checkout slideout drawer with 1-tap Apple Pay / Shop Pay, itemized cart summary, and reactive promo code calculator.
8. `academic_manuscript_viewer`: Research paper card with LaTeX mathematical formula renderer, 1-click BibTeX citation copy receipt, and 3-reviewer score radar badge.
9. `venture_telemetry_dashboard`: Executive venture metrics (MRR/ARR YoY growth rate), D1/D7/D30 cohort retention heatmap matrix, and dynamic price elasticity simulation curve.

---

## 🚀 Svelte 5 Runes UI Generation Recipes

### 1. High-Converting E-Commerce PDP (`intent: "ecommerce_pdp"`)
Features Svelte 5 `$state` and `$derived` runes, reactive color/size variant selection, real-time stock urgency counter, and 1-click express checkout:

```svelte
<script lang="ts">
  import { Card, Button, Badge } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let selectedVariantId = $state("v_midnight");
  let selectedSizeId = $state("standard");
  let quantity = $state(1);
  let isPurchasing = $state(false);

  let selectedVariant = $derived(variants.find((v) => v.id === selectedVariantId));
  let unitPrice = $derived(basePrice + selectedSize.priceMod);
  let totalPrice = $derived(unitPrice * quantity);
  let isLowStock = $derived(selectedVariant.stock > 0 && selectedVariant.stock <= 5);
</script>
```

### 2. Express Checkout Slideout Drawer (`intent: "ecommerce_checkout"`)
Features slideout `<Drawer>`, 1-tap `Pay` and `Shop Pay` triggers, itemized cart ledger, and live promo discount calculations:

```svelte
<script lang="ts">
  import { Drawer, Card, Button, Input, Badge } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let isOpen = $state(true);
  let appliedPromo = $state<string | null>("HOLAR20");
  let subtotal = $derived(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  let discountAmount = $derived(Math.round(subtotal * discountRate * 100) / 100);
  let orderTotal = $derived(Math.max(0, subtotal - discountAmount + shippingCost + estimatedTax));
</script>
```

### 3. Academic Manuscript & Citation Intelligence (`intent: "academic_manuscript_viewer"`)
Features peer-reviewed paper card, LaTeX mathematical formula renderer, 1-click BibTeX citation receipt, and 3-reviewer score radar badge:

```svelte
<script lang="ts">
  import { Card, Badge, Button, Chart } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let averageReviewScore = $derived(
    Math.round((reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length) * 10) / 10
  );
</script>
```

### 4. Venture Telemetry & Growth Engine (`intent: "venture_telemetry_dashboard"`)
Features MRR/ARR growth metrics cards, D1/D7/D30 cohort retention decay heatmap table, and interactive price elasticity simulation curve:

```svelte
<script lang="ts">
  import { Card, Chart, Badge, Button } from "infra-ui-svelte";
  import "infra-ui-svelte/styles.css";

  let simPrice = $state(49);
  let audienceScale = $state(10000);

  let estimatedConversionPct = $derived(
    Math.max(0.8, Math.min(12.0, Math.round((6.5 * Math.pow(simPrice / 29, -1.15)) * 10) / 10))
  );
  let projectedMonthlyRevenue = $derived(projectedPaidUsers * simPrice);
  let projectedAnnualARR = $derived(projectedMonthlyRevenue * 12);
</script>
```

---

## ⚡ Protocol Actions

| Action | Description | Key Parameters |
|---|---|---|
| `list_layers` | Read the 5-layer hierarchy and architectural governance rules | N/A |
| `catalog` | Query components in the design system catalog | `layer`, `category`, `prompt`, `limit` |
| `inspect_component` | Read complete schema, props, slots, variants, and example code | `component_id` (e.g. `button`, `badge`, `drawer`, `table`, `screener`) |
| `theme_tokens` | Query and export design tokens (colors, spacing, radius, typography) | `token_category` (`color`, `spacing`, `radius`, etc.) |
| `generate_ui` | Synthesize accessible Svelte 5 runes code based on verified recipes | `intent` (`ecommerce_pdp`, `ecommerce_checkout`, `academic_manuscript_viewer`, `venture_telemetry_dashboard`, `marketing_hero`, `auth_form`, `screener`, `pricing_table`) |
| `audit_ui` | Audit Svelte/HTML template code against tokens and A11y standards | `template_code` |
| `bridge_chrome` | Map Chrome DOM elements from `chrome.inspect_element` to design components | `chrome_element` |
| `resolve_imports` | Calculate optimal on-demand subpaths (`import Button from 'infra-ui-svelte/component/interaction/button'`) & tree-shaking bundle savings | `components`, `prompt`, `template_code` |
| `domain_presets` | List and scaffold pre-bundled domain packs (`clinical`, `chat_ai`, `analytics`, `commerce`, `auth`, `ecommerce_pdp`, `ecommerce_checkout`, `academic_manuscript_viewer`, `venture_telemetry_dashboard`) | `preset_name` |
| `bundle_optimize` | Refactor monolithic barrel imports into cherry-picked subpaths and prune unused components | `template_code` |

---

## 🧪 Testing & Verification

```bash
# Run Design plugin test suite
cd /Users/laiyongzhang/Documents/Holar/Plugin/Design && bun test design.test.ts
```
