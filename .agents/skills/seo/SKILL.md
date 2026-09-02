---
name: seo
description: Comprehensive SEO & market intelligence workflows powered by Gefei SEO Toolbox (seo.web.cafe). Use for keyword difficulty estimation, search volume discovery, competitor revenue & backlink analysis, and Stripe checkout referral tracking.
---

# SEO & Market Intelligence (Gefei SEO Engine)

This skill equips the agent with systematic SEO and monetization intelligence workflows powered by the Gefei SEO Toolbox (`seo.web.cafe`) and `Plugin/Gefei` / `Plugin/Business`.

---

## 🛠️ Atomic Tools & Actions (`Plugin/Gefei` & `Plugin/Business`)

1. `seo_keyword_difficulty`: Single keyword evaluation (KD, Volume, CPC, SERP competitors, Link Budget).
2. `seo_batch_keywords`: Batch evaluate multiple keywords for competitive matrix construction.
3. `market_stripe_radar`: Stripe Radar monthly revenue leaderboard (dark horses & surging Micro-SaaS).
4. `market_site_trajectory`: Specific domain historical billing checkout referral trajectory.
5. `seo_link_budget`: Backlink DR & referring domains formula to outrank Top 10 SERP homepages.
6. `application_pseo_matrix`: 100+ low-KD programmatic SEO keywords across engine ecosystems.
7. `traffic_domain_overview`: TrafficCV multi-channel overview and competitor benchmarking.

CLI command:
```bash
bun Plugin/cli.ts business call seo_keyword_difficulty --keyword "mental health screening"
bun Plugin/cli.ts business call application_pseo_matrix --engine_filter "Godot 4"
bun Plugin/cli.ts business call market_stripe_radar
```

---

## Standard Operating Procedures (SOPs)

### SOP 1: Niche Discovery & Real-Revenue Verification (Stripe Radar)
1. **Trigger**: When exploring new Micro-SaaS ideas or benchmarking an industry.
2. **Execution**:
   - Run `get_stripe_insights` or `search_niche_ideas` to extract recent dark horses (`darkhorse`) and surging products (`surged`).
   - Identify Micro-SaaS sites generating `>50K` monthly checkout visits.
   - Run `get_site_stripe_trajectory` on key competitors to inspect their historical billing trajectory.
3. **Output**: Deliver a structured breakdown of competitor MRR momentum, product positioning, and pricing strategy.

### SOP 2: Keyword Opportunity Matrix & Difficulty Scoring (KD Analysis)
1. **Trigger**: When planning site taxonomy, landing page copy, or article topic prioritization.
2. **Execution**:
   - Run `batch_keyword_difficulty` on seed terms.
   - Categorize keywords based on Gefei KD algorithm:
     - **🟢 Low-Hanging Fruit (KD < 35)**: Direct landing page / tool MVP candidates.
     - **🟡 Homepage Opportunity (KD 35-50)**: Keywords where low-DR homepages beat high-DR subpages.
     - **🔴 Red Ocean (KD > 70)**: Broad/saturated terms requiring significant authority.
   - Extract the `linkBudget` (target DR and required referring domains).
3. **Output**: Deliver a prioritized keyword matrix table with actionable ranking recommendations.

### SOP 3: Resource & Link Budget Planning
1. **Trigger**: When estimating launch timeline, domain requirements, or outreach/directory listing budgets.
2. **Execution**:
   - Run `calculate_link_budget` to analyze the SERP top 10 weakest ranking homepages (`ageYears`, `dr`, `pageType`).
   - Determine whether a dedicated brand homepage or directory backlinks are sufficient to crack Top 10.
