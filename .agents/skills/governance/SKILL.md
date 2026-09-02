---
name: governance
description: "Guidelines and ethical rules governing the Dual Academic-Commercial Flywheel: Synergizing $10,000 MRR commercial software ventures with top-tier social science empirical publications under strict IRB and research ethics safeguards."
---

# Dual-Flywheel Governance & Research Ethics (`dual-flywheel-governance`)

> **Core Doctrine**: Academic rigor empowers commercial trust; commercial digital traces empower empirical discovery. Research ethics and participant dignity are non-negotiable boundaries.

This skill governs the interaction between **`Business` (Commercial SaaS & Revenue)** and **`Science` (Academic Empirical Papers & Grants)** across the Holar ecosystem.

---

## 1. The Dual-Flywheel Architecture

```
                  ┌─────────────────────────────────────────┐
                  │    Academic Top Publications (Science)  │
                  │   SSCI Q1 / CSSCI / Nature Submissions  │
                  └───────────────────┬─────────────────────┘
                                      │ Authoritative Science Backing
       De-Identified Empirical Traces │ Zero-CAC Organic Trust & Citations
                                      ▼
                  ┌─────────────────────────────────────────┐
                  │   Commercial SaaS Engines (Business)    │
                  │    MentalCraft $10,000 MRR Platform     │
                  └─────────────────────────────────────────┘
```

1. **Academic $\rightarrow$ Commercial**:
   - Scientific validation of screening scales (GAD-7, PHQ-9, AP-Scale) provides clinical trust.
   - Published empirical papers act as authoritative content marketing, generating organic inbound traffic ($0 CAC).
2. **Commercial $\rightarrow$ Academic**:
   - Digital trace interactions and psychometric survey completions provide real-world computational social science datasets ($N \ge 100,000$).
   - Commercial platform user experience drives high survey completion rates (>85%).

---

## 2. Research Ethics & Compliance Safeguards (IRB & PIPL/GDPR)

Whenever academic research connects with commercial user products, the following 5 rules **must always be enforced**:

1. **Informed Consent (双轨知情同意)**:
   - Users must explicitly opt-in to academic data inclusion via clear, non-coercive checkboxes.
   - Opting out of research must NEVER degrade core commercial software functionality.
2. **De-Identification & Anonymization (去标识化与差分隐私)**:
   - PII (names, phone numbers, IP addresses, emails) must be stripped at the client or edge ingestion point before saving to academic research stores.
   - Dynamic hashing ($k$-anonymity $\ge 5$, $l$-diversity) must be used on behavioral digital trace logs.
3. **Safety & Crisis Referral Gating (危机阻断与分级转介)**:
   - For psychological screening tools (e.g. PHQ-9 item 9 $\ge 1$ or GAD-7 $\ge 15$), automatic commercial paywalls are **strictly prohibited from blocking emergency crisis intervention hotline access**.
   - Immediate 24/7 hotline numbers (`010-82951332`) and Tier-3 medical center referrals must be displayed instantly.
4. **Data Isolation (商业库与学术库物理隔离)**:
   - Commercial billing records (`auth-db`, `monetization`) and academic anonymized matrices (`Paper/data/`) reside in strictly segregated datastores.
5. **Reproducibility with Open Science (开放科学与代码归档)**:
   - All empirical econometric and NLP code must be runnable via automated tests (`bun test`) and archive-ready with Zenodo/OSF DOI bindings.
