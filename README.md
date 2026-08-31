# MentalCraft Plugin & MCP Engine Architecture

First-class plugins, browser automation tools, market intelligence engines, and Model Context Protocol (MCP) servers for the MentalCraft ecosystem.

---

## 📦 Subsystems

| Plugin Directory | Description | Key Capabilities |
|---|---|---|
| [`Chrome/`](./Chrome) | Chrome Browser Automation & Native Bridge | Inactive-tab driving, screencast/video recording, semantic snapshots, visual annotations, Web Vitals profiling, CDP actions |
| [`Design/`](./Design) | Design System & UI Intelligence Engine | 5-layer hierarchy, component catalog inspection, token export, Svelte 5 runes UI generation, A11y auditing, Chrome bridge |
| [`Gefei/`](./Gefei) | Gefei SEO & Market Intelligence | Keyword difficulty scoring (KD 0-100), link budget calculators, Stripe Radar revenue tracking, niche discovery |
| [`Message/`](./Message) | Agent Message Bus | High-performance inter-agent message dispatching and mailbox synchronization |
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
