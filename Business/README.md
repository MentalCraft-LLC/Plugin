# MentalCraft Business: Venture Lifecycle Intelligence Engine

The `business` plugin manages the entire lifecycle of commercial ventures across all 3 key modalities:
- **Websites (SaaS / Web Apps / Content / E-Commerce)**: Google SERP SEO KD (0-100), TrafficCV domain forensics, Stripe checkout MRR trajectories.
- **Mobile & Desktop Apps (iOS / Android / macOS / Windows)**: App Store Optimization (ASO), category rank tracking, In-App Purchase (IAP) & subscription modeling.
- **Games (Steam / Mobile / WebGL / Console)**: Steam wishlists velocity, organic discovery tags, D1/D7/D30 player retention curves, ARPDAU and battle pass economics.

---

## 🏛️ The 5 Venture Lifecycle Stages

| Stage | Action | Modality | Scope & Description | Key Parameters |
|---|---|---|---|---|
| **Stage 1: Validation** | `venture_market_validation` | `website` \| `app` \| `game` | TAM/SAM/SOM market sizing, competitor density, viability score (0-100), and monetization fit | `venture_name`, `modality` |
| **Stage 2: Acquisition** | `venture_acquisition_audit` | `website` \| `app` \| `game` | Multi-channel discovery audit: SEO (Web), ASO (App), Steam Wishlists & Next Fest (Game) | `venture_name`, `modality`, `domain` |
| **Stage 3: Financials** | `venture_unit_economics` | `website` \| `app` \| `game` | CAC, LTV, LTV/CAC ratio, payback period, gross margin, MRR/ARR, and ARPDAU unit economics | `cac`, `arpu`, `modality` |
| **Stage 4: Retention** | `venture_retention_curves` | `website` \| `app` \| `game` | D1/D7/D14/D30 cohort retention curves, DAU/MAU stickiness ratio, and churn analysis | `d1_retention`, `dau`, `mau`, `modality` |
| **Stage 5: Monetization** | `venture_monetization_telemetry` | `website` \| `app` \| `game` | Live billing stream telemetry across Stripe, Apple App Store, Google Play, and Steam | `venture_name`, `modality` |

---

## ⚡ Specialized Modular Actions

| Action | Provider | Description | Key Parameters |
|---|---|---|---|
| `seo_keyword_difficulty` | `gefei` | Google SEO KD (0-100), search volume, CPC, and SERP competition | `keyword`, `gl`, `hl` |
| `seo_batch_keywords` | `gefei` | Multi-keyword opportunity matrix evaluation | `keywords`, `gl` |
| `seo_link_budget` | `gefei` | Calculate required backlink quantity and domain rating (DR) | `keyword`, `gl` |
| `traffic_domain_overview` | `trafficcv` | Domain monthly visits, unique visitors, duration, bounce rate, and global rank | `domain` |
| `traffic_channel_breakdown` | `trafficcv` | Decompose traffic channels (Direct, Organic Search, Referral, Social, Paid) | `domain` |
| `traffic_geo_distribution` | `trafficcv` | Visitor geographic distribution across top countries | `domain` |
| `traffic_competitor_comparison` | `trafficcv` | Multi-domain traffic benchmark | `domains` |
| `market_stripe_radar` | `gefei` | Stripe Radar monthly revenue leaderboards (dark horses & surging SaaS) | `month` (e.g. `202607`) |
| `market_site_trajectory` | `gefei` | Competitor domain historical billing and checkout referral trends | `domain` |
| `market_niche_discovery` | `gefei` | Filter real-revenue SaaS products by category, tag, or seed query | `query`, `month` |
| `product_traction_score` | `auto` | Multidimensional product viability and commercial traction index | `product_name` |
| `list_actions` | `auto` | List all 16 venture lifecycle capabilities | N/A |

---

## 🧪 Testing & Verification

```bash
bun test Business/
```
