# MentalCraft Business & Product Engineering Intelligence Plugin

The `business` plugin is the commercial capability engine for the MentalCraft and Holar ecosystem.

It provides autonomous agents with market intelligence, Google SEO difficulty formulas, backlink budgets, real Stripe checkout revenue leaderboards, competitor MRR trajectories, and product traction indexing.

---

## 🌐 Multi-Provider Architecture

The plugin dynamically routes across multiple premier intelligence providers:
- **`gefei`**: Google SEO Keyword Difficulty (KD 0-100), link budget formulas, and Stripe Radar monthly revenue leaderboards.
- **`trafficcv`**: Web traffic estimation, visitor acquisition channels (Organic/Direct/Referral), geographic breakdown, and multi-domain competitor benchmarking.
- **`traction_rank`**: Multidimensional commercial traction index for Holar products.

---

## ⚡ Protocol Actions

| Action | Provider | Description | Key Parameters |
|---|---|---|---|
| `seo_keyword_difficulty` | `gefei` | Calculate Google SEO difficulty (KD 0-100), search volume, CPC, and SERP competition | `keyword`, `gl`, `hl` |
| `seo_batch_keywords` | `gefei` | Evaluate multiple keywords to generate a competitive opportunity matrix | `keywords`, `gl` |
| `seo_link_budget` | `gefei` | Calculate required backlink quantity and domain rating (DR) to outrank Top 10 | `keyword`, `gl` |
| `market_stripe_radar` | `gefei` | Retrieve Stripe Radar monthly revenue leaderboards (dark horses & surging SaaS) | `month` (e.g. `202607`) |
| `market_site_trajectory` | `gefei` | Track competitor domain historical billing and checkout referral trends | `domain` |
| `market_niche_discovery` | `gefei` | Filter real-revenue SaaS products by category, tag, or seed query | `query`, `month` |
| `traffic_domain_overview` | `trafficcv` | Retrieve domain monthly visits, unique visitors, duration, bounce rate, and global rank | `domain` |
| `traffic_channel_breakdown` | `trafficcv` | Decompose traffic channels (Direct, Organic Search, Referral, Social, Paid) | `domain` |
| `traffic_geo_distribution` | `trafficcv` | Analyze visitor geographic distribution across top countries | `domain` |
| `traffic_competitor_comparison` | `trafficcv` | Benchmark traffic, organic share, and rank across multiple competitor domains | `domains` |
| `product_traction_score` | `auto` | Compute commercial viability, SEO feasibility, and competitive moat index | `product_name` |
| `list_actions` | `auto` | List all available commercial intelligence capabilities & providers | N/A |

---

## 🧪 Testing & Verification

```bash
bun test Business/
```
