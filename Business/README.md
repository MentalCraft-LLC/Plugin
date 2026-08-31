# MentalCraft Business & Product Engineering Intelligence Plugin

The `business` plugin is the commercial capability engine for the MentalCraft and Holar ecosystem.

It provides autonomous agents with market intelligence, Google SEO difficulty formulas, backlink budgets, real Stripe checkout revenue leaderboards, competitor MRR trajectories, and product traction indexing.

---

## ⚡ Protocol Actions

| Action | Description | Key Parameters |
|---|---|---|
| `seo_keyword_difficulty` | Calculate Google SEO difficulty (KD 0-100), search volume, CPC, and SERP competition | `keyword`, `gl`, `hl` |
| `seo_batch_keywords` | Evaluate multiple keywords to generate a competitive opportunity matrix | `keywords`, `gl` |
| `seo_link_budget` | Calculate required backlink quantity and domain rating (DR) to outrank Top 10 | `keyword`, `gl` |
| `market_stripe_radar` | Retrieve Stripe Radar monthly revenue leaderboards (dark horses & surging SaaS) | `month` (e.g. `202607`) |
| `market_site_trajectory` | Track competitor domain historical billing and checkout referral trends | `domain` |
| `market_niche_discovery` | Filter real-revenue SaaS products by category, tag, or seed query | `query`, `month` |
| `product_traction_score` | Compute commercial viability, SEO feasibility, and competitive moat index | `product_name` |
| `list_actions` | List all available commercial intelligence capabilities | N/A |

---

## 🧪 Testing & Verification

```bash
bun test Business/
```
