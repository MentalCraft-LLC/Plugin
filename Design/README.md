# MentalCraft Design System & UI Intelligence Plugin

The `design` plugin is a first-class declarative MCP tool and design automation engine for the MentalCraft ecosystem.

It bridges the headless Svelte 5 component architecture in `Design/Svelte` (`infra-ui-svelte`) with autonomous coding agents (Cursor, Antigravity, Pi, Claude Desktop) and real-time browser inspection (`Plugin/Chrome`).

---

## 🏛️ 5-Layer Design Hierarchy

| Layer | Level | Scope | Governance Rule |
|---|---|---|---|
| `foundation` | 1 | Layout, Tokens, Elevation, Motion, Gestures, Focus, Scroll | Consumes only native CSS and headless runtimes. |
| `component` | 2 | Single-part parts (Button, Input, Card, Avatar, Badge) | Consumes only foundation. Strict variants & A11y roles. |
| `composite` | 3 | Multi-part patterns (Dialog, Drawer, Kanban, Chart, Pricing) | Composes components and foundation; zero business logic. |
| `block` | 4 | Domain tools & content blocks (Screener, Questionnaire, Auth) | Reusable across products; accepts typed domain parameters. |
| `template` | 5 | Whole-page archetypes (Information, Transaction, Operation) | Top of hierarchy; coordinates blocks and layouts. |

---

## ⚡ Protocol Actions

| Action | Description | Key Parameters |
|---|---|---|
| `list_layers` | Read the 5-layer hierarchy and architectural governance rules | N/A |
| `catalog` | Query components in the design system catalog | `layer`, `category`, `prompt`, `limit` |
| `inspect_component` | Read complete schema, props, slots, variants, and example code | `component_id` (e.g. `button`, `screener`, `kanban`) |
| `theme_tokens` | Query and export design tokens (colors, spacing, radius, typography) | `token_category` (`color`, `spacing`, `radius`, etc.) |
| `generate_ui` | Synthesize accessible Svelte 5 runes code based on verified recipes | `intent` (`marketing_hero`, `auth_form`, `screener`, `pricing_table`) |
| `audit_ui` | Audit Svelte/HTML template code against tokens and A11y standards | `template_code` |
| `bridge_chrome` | Map Chrome DOM elements from `chrome.inspect_element` to design components | `chrome_element` |
| `resolve_imports` | Calculate optimal on-demand subpaths (`import Button from 'infra-ui-svelte/component/interaction/button'`) & tree-shaking bundle savings | `components`, `prompt`, `template_code` |
| `domain_presets` | List and scaffold pre-bundled domain packs (`clinical`, `chat_ai`, `analytics`, `commerce`, `auth`) | `preset_name` |
| `bundle_optimize` | Refactor monolithic barrel imports into cherry-picked subpaths and prune unused components | `template_code` |

---

## 🧪 Testing & Verification

```bash
# Run Design plugin test suite
bun test Design/
```
