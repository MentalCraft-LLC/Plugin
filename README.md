# 🔌 MentalCraft Plugin & FastMCP Protocol Engine Network

Canonical tooling, FastMCP protocol engines, browser automation bridges, and workflow orchestrators for the 7 canonical domains.

---

## 📦 10 FastMCP Subsystems

| Plugin Directory | Scope & Domain | Key Protocol Capabilities |
|---|---|---|
| [`Workflow/`](./Workflow) | Cross-Domain Orchestrator & Telemetry | Compound DAG pipelines, 9-gate master verification runner, and system-wide health auditing |
| [`Business/`](./Business) | Business Intelligence & Growth Engine | Google SEO KD (0-100), link budget formulas, Stripe Radar revenue leaderboards, MRR trajectories, TractionRank |
| [`Design/`](./Design) | Design System & UI Intelligence Engine | 5-layer hierarchy, component catalog inspection, token export, Svelte 5 runes UI generation, domain presets |
| [`Science/`](./Science) | Academic Production & Research Intelligence | Clinical psychometric scoring (GAD-7, PHQ-9), suicidal safety protocol, literature discovery, patent novelty audits, grant rubrics |
| [`Content/`](./Content) | Creative & Commercial Content Engine | Fiction worldbuilding, character arcs, 15 plot beats, sensory prose, PAS copy decks, viral hooks, omnichannel matrices |
| [`Infra/`](./Infra) | Edge Microservices & Data Infrastructure | Microservice canary health pinging, D1 schema & migration audits, Cloudflare Worker bundle verification, Stripe webhook simulation |
| [`Company/`](./Company) | Corporate Governance, Equity & Compliance | Dual-jurisdiction entity verification (Wyoming & Hangzhou), Cap Table & ESOP dilution modeling, IP chain of custody, compliance checks |
| [`Browser/`](./Browser) | Browser Automation & CDP Native Bridge | Inactive-tab driving, screencast/WebP recording, semantic snapshots, visual annotations, Web Vitals profiling, CDP actions |
| [`Message/`](./Message) | Agent Message Bus | Multi-channel priority dispatch (Telegram > iMessage > Email) with zero-harness POSIX isolation |
| [`Secret/`](./Secret) | Local Credential Vault | Mode-0600 filesystem credentials, zero-leakage token redacting, cryptographic receipts, and rotation |

---

## 🛠️ Testing & Master Gateway Verification

```bash
# Run all plugin tests
bun test

# Run Master MCP Gateway
bun run gateway.ts

# Inspect 10/10 plugin health dashboard
bun Workflow/cli.ts health

# Run master verification pipeline (9 Gates)
bun .agents/scripts/verify-all.ts
```
