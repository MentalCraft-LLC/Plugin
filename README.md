# MentalCraft Plugin & MCP Engine Architecture

First-class plugins, browser automation tools, market intelligence engines, and Model Context Protocol (MCP) servers for the MentalCraft ecosystem.

---

## 📦 Subsystems

| Plugin Directory | Description | Key Capabilities |
|---|---|---|
| [`Business/`](./Business) | Commercial & Market Intelligence Engine | Google SEO KD (0-100), link budget formulas, Stripe Radar real revenue leaderboards, competitor MRR trajectories, product traction index |
| [`Chrome/`](./Chrome) | Chrome Browser Automation & Native Bridge | Inactive-tab driving, screencast/video recording, semantic snapshots, visual annotations, Web Vitals profiling, CDP actions |
| [`Design/`](./Design) | Design System & UI Intelligence Engine | 5-layer hierarchy, component catalog inspection, token export, Svelte 5 runes UI generation, on-demand subpaths, domain presets |
| [`Gefei/`](./Gefei) | Gefei SEO Toolbox Client | Low-level client and bridge for seo.web.cafe endpoints |
| [`Message/`](./Message) | Agent Message Bus | High-performance inter-agent message dispatching and mailbox synchronization |
| [`Science/`](./Science) | Science & Research Intelligence Engine | Clinical psychometric scoring (GAD-7, PHQ-9), suicidal ideation safety protocol, academic literature discovery, patent novelty audits, grant rubrics |
| [`Secret/`](./Secret) | Local Credential Vault | Zero-leakage token redacting and local filesystem authority verification |

---

## 🛠️ Testing & Verification

```bash
# Run all plugin tests
bun test

# Run Chrome browser automation tests
bun test Chrome/

# Run Gefei SEO intelligence tests
bun test Gefei/
```
