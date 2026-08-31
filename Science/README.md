# MentalCraft Science: Academic Production Lifecycle Engine

The `science` plugin manages the entire lifecycle of scientific research and academic production across the four core MentalCraft science repositories:
- **`Science/Paper`**: Authoring, literature search, DOI citation verification, manuscript structure auditing, and peer-review simulation.
- **`Science/Grant`**: NIH/NSF review rubrics, multi-year budget modeling, and Specific Aims architecture.
- **`Science/Journal`**: Target journal ranking and Impact Factor matching, camera-ready submission compliance checklists.
- **`Science/Patent`**: Novelty analysis, USPTO/WIPO prior art search, and claim tree structure validation.

---

## ⚡ Protocol Actions (11 Actions across 4 Pillars)

| Pillar | Action | Description | Key Parameters |
|---|---|---|---|
| **Paper** | `paper_literature_search` | Search peer-reviewed papers, arXiv preprints, DOIs, and citation counts | `query`, `limit` |
| **Paper** | `paper_citation_verify` | Validate DOI syntax, parse BibTeX records, format APA/IEEE/Nature styles | `doi`, `bibtex`, `citation_style` |
| **Paper** | `paper_structure_audit` | Audit manuscript section completeness (Abstract, Intro, Method, etc.) & word counts | `sections`, `manuscript_title` |
| **Paper** | `paper_peer_review_simulate` | Simulate a rigorous 3-reviewer panel with scoring, weaknesses, and rebuttal guide | `manuscript_title`, `manuscript_text` |
| **Grant** | `grant_criteria_audit` | Audit grant proposal against NIH/NSF 5-dimension review rubrics (1.0-9.0 score) | `grant_abstract`, `funding_agency` |
| **Grant** | `grant_budget_calculator` | Calculate multi-year direct and indirect (F&A) costs with personnel effort | `direct_costs`, `indirect_rate_percent`, `duration_years` |
| **Grant** | `grant_aims_alignment` | Validate Specific Aims independence, mechanistic depth, and funding priority fit | `aims` |
| **Journal** | `journal_matcher` | Match research manuscripts to top journals by Impact Factor and review speed | `desired_impact_factor_min`, `field_of_study` |
| **Journal** | `journal_submission_checklist` | Comprehensive pre-submission camera-ready audit (IRB, CRediT, Data/Code statements) | N/A |
| **Patent** | `patent_novelty_check` | USPTO/WIPO prior art search, claim differentiation, and 0-100 novelty score | `invention_title`, `invention_summary` |
| **Patent** | `patent_claim_structure` | Validate independent and dependent claims tree, checking antecedent basis | `claims_text` |
| **Core** | `list_actions` | List all available academic production lifecycle capabilities | N/A |

---

## 🧪 Testing & Verification

```bash
bun test Science/
```
