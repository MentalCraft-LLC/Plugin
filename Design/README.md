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

### 1. Universal Component Families & Unified Variant Vocabularies

To ensure maximum cognitive ergonomics, interoperability, and predictable composition, **all components in the same functional family share identical visual variant sets**:

| Family / Category | Component Members | Unified Variant Vocabulary | Design Intent & Visual Semantics |
|---|---|---|---|
| **Action & Interaction** | `Button` | `primary`, `secondary`, `ghost`, `line`, `glass`, `plain`, `destructive`, `outline` | Universal interactive button triggers and links |
| **Input & Form** | `Input`, `Slider` | `line`, `ghost`, `plain`, `bordered`, `filled` | High-precision text and range data entry |
| **Scaffold & Container** | `Card`, `Accordion`, `Column` | `flat`, `outline`, `elevated`, `glass`, `interactive` | Surface boundaries, structural elevation, and hover lift |
| **Overlay & Modal** | `Dialog`, `Drawer`, `Command` | `standard`, `sheet`, `fullscreen`, `alert`, `glass` | Centered dialogs, edge sheets, ⌘K command spotlight |
| **Feedback & Tone** | `Badge`, `Toast`, `Metric` | `default`, `primary`, `success`, `warning`, `destructive`, `info`, `outline`, `pill` | Semantic alert tones, status badges, and KPI delta metrics |
| **Data Grid & Table** | `Table`, `Head`, `Header`, `Body`, `Row`, `Cell`, `Footer` | `standard`, `compact`, `zebra`, `bordered`, `glass`, `matrix` | Tabular financial datasets and monospace alignment |
| **Chart Spline & Stroke** | `Line`, `Area`, `Axis`, `Grid`, `Rule`, `Sparkline`, `Bar`, `Arc` | `solid`, `dashed`, `gradient`, `glow`, `minimal` | Vector chart lines, threshold markers, and gridlines |
| **Shape & Geometry** | `Point`, `Swatch`, `Avatar` | `circle`, `diamond`, `square`, `ring`, `pill` | Discrete scatter markers, color tokens, and user avatars |
| **Workflow & Sequencing** | `Kanban`, `Timeline`, `Terminal`, `Prompt`, `Output` | `standard`, `compact`, `matrix`, `glass`, `retro` | Developer CLI tools, event sequences, and task boards |
| **Step Execution** | `Item` | `pending`, `active`, `completed`, `failed`, `skipped` | Pipeline progression and async milestone nodes |
| **Design Engineering** | `Blueprint`, `Ruler`, `Spotlight` | `blue`, `cyan`, `pink`, `amber`, `monochrome`, `grid` | Technical layout inspection boxes and ambient lights |
| **Texture & Grain** | `Noise` | `subtle`, `film`, `paper`, `heavy`, `grain` | Zero-layout-shift tactile SVG grain overlays |
| **Page Archetypes** | `Showcase`, `Hero`, `Pricing`, `Screener`, `Questionnaire`, `Comparison` | `magazine`, `lab`, `minimal`, `dark_matrix`, `editorial` | Top-tier publication page templates and interactive sandboxes |

---

### 2. Table Underlying Primitive Suite (`Table.*`)

| Primitive ID | Name | Role | Full Visual Variants Matrix | Key Capabilities |
|---|---|---|---|---|
| `head` | `Head` (`Table.Head`) | `<thead>` Container | `sticky`, `static`, `floating`, `underlined` | Sticky positioning, border divider |
| `header` | `Header` (`Table.Header`) | `<th>` Column Header | `sortable`, `resizable`, `center`, `right`, `left` | Interactive sort arrows, column resize grip, text alignment |
| `body` | `Body` (`Table.Body`) | `<tbody>` Data Container | `standard`, `zebra`, `striped`, `empty_placeholder` | Zebra striping, reactive row selection state, empty states |
| `row` | `Row` (`Table.Row`) | `<tr>` Row Container | `standard`, `selectable`, `expandable`, `highlighted`, `disabled` | Active selection checkbox, hover highlights, expandable sub-rows |
| `cell` | `Cell` (`Table.Cell`) | `<td>` Data Cell | `text`, `numeric_mono`, `badge`, `sparkline`, `avatar`, `action` | Monospace tabular numbers (`fontFeature: tnum`), alignment, heatmap |
| `footer` | `Footer` (`Table.Footer`) | `<tfoot>` Summary Row | `summary`, `pagination`, `totals`, `sticky` | Top border, bold accumulator metrics |

---

### 3. Chart Underlying Primitive Suite (`Chart.*`)

| Primitive ID | Name | Role | Key Props / Capabilities |
|---|---|---|---|
| `axis` | `Axis` (`Chart.Axis`) | Coordinate Axes | X/Y placement (`bottom`/`left`), tick subdivisions, value formatters |
| `grid` | `Grid` (`Chart.Grid`) | Cartesian Gridlines | Solid/dashed reference lines, sub-tick grid alignments |
| `rule` | `Rule` (`Chart.Rule`) | Threshold Baseline | Constant reference indicator line (e.g. target $10k MRR) |
| `line` | `Line` (`Chart.Line`) | Spline Line Mark | SVG monotonic cubic spline, gradient strokes, line widths |
| `area` | `Area` (`Chart.Area`) | Area Fill Mark | Continuous polygon area with vertical gradient opacity falloff |
| `bar` | `Bar` (`Chart.Bar`) | Column / Bar Mark | Rounded rectangular geometry, stacked cohort series support |
| `point` | `Point` (`Chart.Point`) | Discrete Scatter Points | Circle, diamond, square, and sized bubble marks |
| `arc` | `Arc` (`Chart.Arc`) | Polar Slices | Pie and donut slice geometry with corner radius and pad angle |
| `radar` | `Radar` (`Chart.Radar`) | Multiaxial Web | Polygonal polar area for multi-dimensional trait mapping |
| `candlestick` | `Candlestick` (`Chart.Candlestick`)| Financial OHLC Mark | Box-and-whisker geometry for price volatility tracking |
| `funnel` | `Funnel` (`Chart.Funnel`) | Conversion Stages | Stepped trapezoid geometry with step drop-off ratios |
| `treemap` | `Treemap` (`Chart.Treemap`) | Hierarchical Partition| 2D squarified spatial area for category breakdown |
| `sparkline` | `Sparkline` (`Chart.Sparkline`)| Inline Micro-Trend | Ultra-dense sparkline with highlighted start/end endpoints |
| `legend` | `Legend` (`Chart.Legend`) | Series Guide | Interactive visibility toggle checkboxes and color indicators |
| `tooltip` | `Tooltip` (`Chart.Tooltip`) | Hover Popover | Spring-physics floating popover tracking nearest active data point |

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
