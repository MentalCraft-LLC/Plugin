# MentalCraft Science & Research Intelligence Plugin

The `science` plugin is the academic and psychometric capability engine for the MentalCraft and Holar ecosystem.

It provides autonomous agents with standardized psychometric scoring formulas (GAD-7, PHQ-9), suicidal ideation crisis boundary protocols, peer-reviewed literature discovery, patent novelty audits, and research grant rubric verifications.

---

## ⚡ Protocol Actions

| Action | Description | Key Parameters |
|---|---|---|
| `score_scale` | Standardized clinical psychometric scoring for GAD-7, PHQ-9, EPDS, ISI, ASRS | `scale`, `answers` |
| `crisis_boundary_check` | Algorithmic self-harm/suicide risk assessment with emergency hotline dispatch | `answers` |
| `search_literature` | Query academic corpora for clinical validation benchmarks and meta-analyses | `query`, `limit` |
| `verify_citation` | Validate academic citation syntax and metadata completeness (DOI, BibTeX) | `doi`, `bibtex` |
| `patent_novelty_check` | Evaluate invention claims against prior art databases (USPTO, CNIPA, WIPO) | `invention_summary` |
| `grant_criteria_audit` | Audit research grant proposals against NIH / NSF scoring rubrics | `grant_proposal_abstract` |
| `list_actions` | List all available scientific intelligence capabilities | N/A |

---

## 🧪 Testing & Verification

```bash
bun test Science/
```
