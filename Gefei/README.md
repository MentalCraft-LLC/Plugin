# Gefei SEO & Market Intelligence Atomic MCP Plugin (`seo.web.cafe`)

Atomic Model Context Protocol (MCP) server providing deterministic SEO keyword difficulty estimation, SERP forensics, link budget calculations, and real-revenue Stripe checkout referral tracking.

---

## 🛠️ Atomic Tool Catalog

| Tool Name | Description | Key Parameters |
|---|---|---|
| `estimate_keyword_difficulty` | Estimate Google SEO keyword difficulty (0-100), search volume, CPC, SERP competitors, and backlink budget | `keyword`, `gl`, `hl`, `force` |
| `batch_keyword_difficulty` | Batch evaluate a list of keywords to construct a multi-dimensional keyword difficulty matrix | `keywords`, `gl`, `hl` |
| `get_stripe_insights` | Fetch Stripe Radar real-revenue leaderboard insights (dark horses, surging Micro-SaaS, and fast growers) | `month` (e.g. `"202607"`) |
| `get_site_stripe_trajectory` | Retrieve historical Stripe checkout referral trajectory for a specific domain | `domain` |
| `calculate_link_budget` | Compute exact target DR and required backlink domains to outrank weakest Top 10 SERP homepages | `keyword`, `gl` |
| `search_niche_ideas` | Filter and discover high-converting Micro-SaaS products by keyword, category, or tag | `query`, `month` |

---

## 🚀 Running the MCP Server

```bash
# Direct stdio invocation
bun Plugin/Gefei/serve.mjs

# Running test suites
bun test Plugin/Gefei/gefei.test.ts
```
