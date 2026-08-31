/**
 * Plugin/Science Core - Scientific Research, Psychometrics & Academic Intelligence Engine
 *
 * Symmetrical capability engine for Holar's Science pillar.
 * Integrates clinical scale psychometric scoring (GAD-7, PHQ-9), crisis boundary classification,
 * academic literature indexing, patent novelty validation, and grant rubric auditing.
 */

export const SCIENCE_PROTOCOL = "holar.science.v1" as const;

export type ScienceAction =
  | "score_scale"
  | "crisis_boundary_check"
  | "search_literature"
  | "verify_citation"
  | "patent_novelty_check"
  | "grant_criteria_audit"
  | "list_actions";

export type ClinicalScale = "gad7" | "phq9" | "epds" | "isi" | "asrs";

export type ClinicalScaleResult = {
  scale: ClinicalScale;
  scaleName: string;
  totalScore: number;
  maxScore: number;
  severity: "Minimal" | "Mild" | "Moderate" | "Moderately Severe" | "Severe";
  interpretation: string;
  recommendation: string;
  crisisFlag: boolean;
};

export type CrisisEvaluationResult = {
  crisisDetected: boolean;
  triggerItem?: string;
  triggerScore?: number;
  urgencyLevel: "none" | "elevated" | "imminent";
  protocolAction: "standard_receipt" | "safeguard_referral" | "crisis_hotline_modal";
  hotlines: Array<{ name: string; contact: string; country: string }>;
};

export type AcademicPaper = {
  doi?: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  citations: number;
  abstract: string;
  openAccessUrl?: string;
};

export type PatentNoveltyResult = {
  inventionTitle: string;
  noveltyScore: number; // 0-100
  potentialPriorArt: Array<{
    patentId: string;
    title: string;
    assignee: string;
    filingDate: string;
    similaritySummary: string;
  }>;
  claimRecommendations: string[];
};

export type ScienceInput = {
  action: ScienceAction;
  scale?: ClinicalScale;
  answers?: Record<string, number | string>;
  query?: string;
  doi?: string;
  bibtex?: string;
  invention_summary?: string;
  grant_proposal_abstract?: string;
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
