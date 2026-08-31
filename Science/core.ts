/**
 * Plugin/Science Core - Academic Production Lifecycle & Research Intelligence Engine
 *
 * Symmetrical capability engine managing the full lifecycle of academic and scientific production:
 * 1. Paper: Literature discovery, DOI/BibTeX citation verification, manuscript structure audit, peer-review simulation.
 * 2. Grant: NIH/NSF/ERC rubric evaluation, multi-year budget calculation, specific aims alignment.
 * 3. Journal: Journal matching (Impact Factor, acceptance rate), camera-ready submission checklist.
 * 4. Patent: Novelty audits, USPTO/WIPO prior art discovery, claim tree hierarchy structuring.
 */

export const SCIENCE_PROTOCOL = "holar.science.v1" as const;

export type ScienceAction =
  | "paper_literature_search"
  | "paper_citation_verify"
  | "paper_structure_audit"
  | "paper_peer_review_simulate"
  | "grant_criteria_audit"
  | "grant_budget_calculator"
  | "grant_aims_alignment"
  | "journal_matcher"
  | "journal_submission_checklist"
  | "patent_novelty_check"
  | "patent_claim_structure"
  | "list_actions";

export type AcademicPaper = {
  doi: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  citations: number;
  abstract: string;
  openAccessUrl?: string;
};

export type CitationStyle = "apa" | "ieee" | "nature" | "acm" | "chicago";

export type ManuscriptSectionAudit = {
  section: string;
  present: boolean;
  wordCount: number;
  status: "optimal" | "too_brief" | "missing" | "excessive";
  recommendation?: string;
};

export type PeerReviewFeedback = {
  overallRecommendation: "Strong Accept" | "Accept" | "Weak Accept" | "Borderline" | "Weak Reject" | "Reject";
  score: number; // 1-10
  confidence: number; // 1-5
  strengths: string[];
  weaknesses: string[];
  missingBaselines: string[];
  rebuttalGuidance: string[];
};

export type GrantRubricScore = {
  criterion: "Significance" | "Innovation" | "Approach" | "Investigators" | "Environment";
  score: number; // NIH 1-9 scale (1 = Exceptional, 9 = Poor)
  strengths: string[];
  weaknesses: string[];
};

export type JournalRecommendation = {
  name: string;
  publisher: string;
  impactFactor: number;
  hIndex: number;
  acceptanceRatePercent: number;
  avgReviewWeeks: number;
  openAccess: "Gold" | "Green" | "Hybrid" | "Closed";
  matchScore: number; // 0-100
};

export type PatentClaim = {
  claimNumber: number;
  type: "independent" | "dependent";
  dependsOnClaim?: number;
  text: string;
  antecedentBasisValid: boolean;
};

export type ScienceInput = {
  action: ScienceAction;
  query?: string;
  doi?: string;
  bibtex?: string;
  citation_style?: CitationStyle;
  manuscript_text?: string;
  manuscript_title?: string;
  sections?: Record<string, string>;
  grant_abstract?: string;
  funding_agency?: "NIH" | "NSF" | "ERC" | "DARPA" | "DOE";
  direct_costs?: {
    personnel?: number;
    equipment?: number;
    supplies?: number;
    travel?: number;
    other?: number;
  };
  indirect_rate_percent?: number;
  duration_years?: number;
  aims?: string[];
  field_of_study?: string;
  desired_impact_factor_min?: number;
  invention_title?: string;
  invention_summary?: string;
  claims_text?: string;
  limit?: number;
};

export type ScienceResult = {
  protocol: typeof SCIENCE_PROTOCOL;
  action: ScienceAction;
  success: boolean;
  timestamp: string;
  data: unknown;
  diagnostics?: string[];
};

export function formatScienceSummary(result: ScienceResult): string {
  if (!result.success) {
    return `✗ Science ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_actions": {
      const data = result.data as { actions: Array<{ name: string }> };
      return `Academic Lifecycle Actions (${data.actions.length}): ${data.actions.map((a) => a.name).join(", ")}`;
    }
    case "paper_literature_search": {
      const data = result.data as { total: number; papers: Array<{ title: string; year: number; citations: number }> };
      return `Literature Search: ${data.total} papers indexed (Top: "${data.papers[0]?.title ?? ""}", ${data.papers[0]?.citations ?? 0} citations)`;
    }
    case "paper_citation_verify": {
      const data = result.data as { valid: boolean; doi?: string; formattedCitation: string };
      return data.valid ? `Citation Validated (${data.doi ?? "BibTeX"}): "${data.formattedCitation.slice(0, 60)}..."` : `Citation format invalid`;
    }
    case "paper_structure_audit": {
      const data = result.data as { totalWordCount: number; readinessScore: number; completeness: string };
      return `Manuscript Readiness: ${data.readinessScore}/100 [${data.completeness}] (${data.totalWordCount} words)`;
    }
    case "paper_peer_review_simulate": {
      const data = result.data as PeerReviewFeedback;
      return `Peer Review Simulation: ${data.overallRecommendation} (${data.score}/10) | ${data.strengths.length} strengths, ${data.weaknesses.length} weaknesses`;
    }
    case "grant_criteria_audit": {
      const data = result.data as { compositeNihScore: number; overallCategory: string };
      return `Grant Rubric Score: ${data.compositeNihScore.toFixed(1)}/9.0 [${data.overallCategory}]`;
    }
    case "grant_budget_calculator": {
      const data = result.data as { totalBudgetUsd: number; totalDirectCostsUsd: number; totalIndirectCostsUsd: number };
      return `Grant Budget: $${data.totalBudgetUsd.toLocaleString()} total ($${data.totalDirectCostsUsd.toLocaleString()} direct, $${data.totalIndirectCostsUsd.toLocaleString()} F&A)`;
    }
    case "grant_aims_alignment": {
      const data = result.data as { aimsCount: number; alignmentScore: number };
      return `Specific Aims Alignment: ${data.alignmentScore}/100 (${data.aimsCount} aims evaluated)`;
    }
    case "journal_matcher": {
      const data = result.data as { matchedCount: number; recommendations: JournalRecommendation[] };
      return `Journal Matches (${data.matchedCount}): Top target '${data.recommendations[0]?.name ?? ""}' (IF: ${data.recommendations[0]?.impactFactor ?? 0})`;
    }
    case "journal_submission_checklist": {
      const data = result.data as { passedChecks: number; totalChecks: number; readyForSubmission: boolean };
      return `Submission Checklist: ${data.passedChecks}/${data.totalChecks} passed [${data.readyForSubmission ? "READY FOR SUBMISSION" : "ACTION ITEMS REMAINING"}]`;
    }
    case "patent_novelty_check": {
      const data = result.data as { noveltyScore: number; priorArtCount: number; patentable: boolean };
      return `Patent Novelty Score: ${data.noveltyScore}/100 (${data.priorArtCount} prior art references analyzed, ${data.patentable ? "PATENTABLE" : "PRIOR ART RISK"})`;
    }
    case "patent_claim_structure": {
      const data = result.data as { totalClaims: number; independentClaims: number; validAntecedent: boolean };
      return `Patent Claims: ${data.totalClaims} claims (${data.independentClaims} independent, Antecedent: ${data.validAntecedent ? "VALID" : "FLAW DETECTED"})`;
    }
  }
}

export const compactScienceResult = formatScienceSummary;
