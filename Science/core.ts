/**
 * Plugin/Science Core - Academic Production 8-Stage Lifecycle & Research Intelligence Engine
 *
 * Symmetrical 8-stage academic lifecycle engine managing scientific production from hypothesis to global impact:
 * - Stage 1: Literature & Citation Verification (BibTeX AST validation, DOI resolution, APA/IEEE/Nature/ACM/Chicago styles)
 * - Stage 2: Methodology & Reproducibility Design (Statistical power analysis, Cohen's d effect size, SOTA baseline matrix, ablation)
 * - Stage 3: Research Grants & Funding Acquisition (NIH/NSF rubrics, Specific Aims non-contingency, multi-year MTDC budgeting)
 * - Stage 4: Manuscript Authoring & LaTeX Scaffolding (Section balance audit, compilation-ready ACM/IEEE templates)
 * - Stage 5: Simulated Peer Review & Rebuttal (3-reviewer panel simulation, point-by-point rebuttal matrix)
 * - Stage 6: Target Journal Matching & Camera-Ready (JCR/Scimago IF matching, 8-point camera-ready CRediT compliance)
 * - Stage 7: Intellectual Property & Patent Conversion (USPTO/WIPO 35 U.S.C. 101/102/103 novelty, claim tree antecedent basis, spec scaffold)
 * - Stage 8: Scholarly Impact & Dissemination (3-year citation velocity forecast, Altmetric breakdown, open reproducible artifacts)
 */

export const SCIENCE_PROTOCOL = "holar.science.v1" as const;

export type ScienceAction =
  | "paper_literature_search"
  | "paper_citation_verify"
  | "paper_methodology_audit"
  | "grant_criteria_audit"
  | "grant_aims_alignment"
  | "grant_budget_calculator"
  | "paper_structure_audit"
  | "paper_latex_scaffold"
  | "paper_peer_review_simulate"
  | "journal_matcher"
  | "journal_submission_checklist"
  | "patent_novelty_check"
  | "patent_claim_structure"
  | "patent_spec_scaffold"
  | "scholarly_impact_forecast"
  | "social_science_peer_review_audit"
  | "chinese_academic_formatter"
  | "ssci_top_journal_matcher"
  | "css_digital_trace_audit"
  | "css_nlp_sentiment_trajectory"
  | "css_causal_inference_did"
  | "css_abm_simulation"
  | "css_telemetry_preprocess"
  | "css_nlp_sentiment_score"
  | "css_topic_bertopic_cluster"
  | "css_did_regression"
  | "css_parallel_trends_test"
  | "css_abm_step"
  | "list_actions";

export type CitationStyle = "apa" | "ieee" | "nature" | "acm" | "chicago";

export type AcademicPaper = {
  doi: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  citations: number;
  abstract: string;
  bibtexKey: string;
  openAccessUrl?: string;
  topics?: string[];
};

export type BibtexAst = {
  entryType: string;
  citeKey: string;
  fields: Record<string, string>;
  isValid: boolean;
  validationErrors: string[];
  requiredMissingFields: string[];
};

export type CitationVerifyResult = {
  doi?: string;
  valid: boolean;
  style: CitationStyle;
  formattedCitation: string;
  bibtex: string;
  parsedAst?: BibtexAst;
  diagnostics?: string[];
};

export type StatisticalPowerAnalysis = {
  sampleSize: number;
  alpha: number;
  power: number; // 0-1 scale
  powerAdequate: boolean;
  recommendation: string;
};

export type CohensDEffectSize = {
  d: number;
  interpretation: "Negligible" | "Small" | "Medium" | "Large" | "Huge";
  sampleMeanDiff: number;
  pooledStd: number;
};

export type SotaBaselineComparison = {
  baselineName: string;
  score: number;
  latencyMs?: number;
  memoryMb?: number;
  relativeGainPercent: number;
  source: string;
};

export type MethodologyAuditResult = {
  manuscriptTitle: string;
  methodologyScore: number; // 0-100
  reproducibilityGrade: "A (Fully Reproducible)" | "B (Minor Gaps)" | "C (Insufficient Detail)";
  baselineCheck: {
    stateOfTheArtCovered: boolean;
    missingBaselinesCount: number;
    recommendedBaselines: string[];
  };
  sotaBaselineMatrix: SotaBaselineComparison[];
  ablationCheck: {
    conducted: boolean;
    isolatedComponents: string[];
    metricDropPercent?: number[];
  };
  statisticalRigor: {
    confidenceIntervalsReported: boolean;
    seedRunsCount: number;
    significanceTests: string[];
  };
  powerAnalysis: StatisticalPowerAnalysis;
  effectSize: CohensDEffectSize;
};

export type ManuscriptSectionAudit = {
  section: string;
  present: boolean;
  wordCount: number;
  targetWordCount: number;
  proportionPercent: number;
  status: "optimal" | "too_brief" | "missing" | "excessive";
  recommendation?: string;
};

export type ManuscriptStructureAuditResult = {
  manuscriptTitle: string;
  totalWordCount: number;
  readinessScore: number;
  completeness: string;
  latexSyntaxValid: boolean;
  sections: ManuscriptSectionAudit[];
  recommendations: string[];
};

export type ReviewerFeedback = {
  reviewer: string;
  expertise: string;
  score: number; // 1-10
  confidence: number; // 1-5
  criteriaScores: {
    originality: number;
    technicalSoundness: number;
    empiricalRigor: number;
    clarity: number;
    significance: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingBaselines: string[];
};

export type PeerReviewFeedback = {
  overallRecommendation: "Strong Accept" | "Accept" | "Weak Accept" | "Borderline" | "Weak Reject" | "Reject";
  score: number; // 1-10
  confidence: number; // 1-5
  consensus: string;
  reviews: ReviewerFeedback[];
  strengths: string[];
  weaknesses: string[];
  missingBaselines: string[];
  rebuttalMatrix: Array<{
    critique: string;
    suggestedResponse: string;
    actionItem: string;
  }>;
};

export type GrantRubricScore = {
  criterion: string;
  score: number;
  maxScore: number;
  strengths: string[];
  weaknesses: string[];
};

export type GrantCriteriaAuditResult = {
  fundingAgency: "NIH" | "NSF" | "ERC" | "DARPA" | "DOE";
  compositeScore: number;
  compositeNihScore: number; // for NIH compatibility (1.0 = Exceptional, 9.0 = Poor)
  scaleDescription: string;
  percentileEstimate: string;
  overallCategory: string;
  criteria: GrantRubricScore[];
  recommendations: string[];
};

export type GrantBudgetYear = {
  year: number;
  directCosts: number;
  personnelCost: number;
  fringeCost: number;
  equipmentCost: number;
  suppliesCost: number;
  travelCost: number;
  otherDirectCost: number;
  mtdcBase: number;
  indirectCosts: number;
  totalCost: number;
};

export type GrantBudgetResult = {
  durationYears: number;
  fringeRatePercent: number;
  fAndARatePercent: number;
  annualEscalationPercent: number;
  totalBudgetUsd: number;
  totalDirectCostsUsd: number;
  totalMtdcBaseUsd: number;
  totalIndirectCostsUsd: number;
  yearlyBreakdown: GrantBudgetYear[];
};

export type GrantAimsAlignmentResult = {
  aimsCount: number;
  alignmentScore: number;
  independenceCheck: string;
  dependencyMatrix: Array<{
    fromAim: number;
    toAim: number;
    dependencyType: string;
  }>;
  aimsEvaluations: Array<{
    aimNumber: number;
    title: string;
    mechanisticDepth: string;
    feasibility: string;
    impact: string;
  }>;
};

export type JournalRecommendation = {
  name: string;
  publisher: string;
  impactFactor: number;
  hIndex: number;
  acceptanceRatePercent: number;
  avgReviewWeeks: number;
  openAccess: "Gold" | "Green" | "Hybrid" | "Closed" | "Diamond";
  jcrQuartile: "Q1" | "Q2" | "Q3" | "Q4";
  matchScore: number; // 0-100
};

export type JournalChecklistItem = {
  item: string;
  status: "passed" | "action_required" | "optional";
  detail: string;
};

export type JournalSubmissionChecklistResult = {
  totalChecks: number;
  passedChecks: number;
  readyForSubmission: boolean;
  creditTaxonomyCovered: boolean;
  checklist: JournalChecklistItem[];
};

export type PatentNoveltyResult = {
  inventionTitle: string;
  noveltyScore: number; // 0-100
  patentable: boolean;
  priorArtCount: number;
  priorArt: Array<{
    patentId: string;
    title: string;
    assignee: string;
    filingDate: string;
    similarityScore: number;
    differentiation: string;
  }>;
  statutoryFactors: {
    novelty35USC102: string;
    nonObviousness35USC103: string;
    utility35USC101: string;
  };
  claimsGuidance: string[];
};

export type PatentClaim = {
  claimNumber: number;
  type: "independent" | "dependent";
  dependsOnClaim?: number;
  text: string;
  antecedentBasisValid: boolean;
  antecedentIssues?: string[];
};

export type PatentClaimStructureResult = {
  totalClaims: number;
  independentClaims: number;
  dependentClaims: number;
  validAntecedent: boolean;
  claims: PatentClaim[];
  diagnosticNotes: string[];
};

export type PatentSpecScaffoldResult = {
  title: string;
  sectionsCount: number;
  claimsCount: number;
  sections: {
    titleOfInvention?: string;
    crossReference?: string;
    fieldOfInvention: string;
    background: string;
    summary: string;
    briefDescriptionOfDrawings?: string;
    detailedDescription: string;
    claims: string[];
    abstract?: string;
  };
};

export type ScholarlyImpactForecastResult = {
  manuscriptTitle: string;
  projectedCitationsYear1: number;
  projectedCitationsYear2: number;
  projectedCitationsYear3: number;
  projectedAltmetricScore: number;
  altmetricBreakdown: {
    twitterMentions: number;
    newsOutlets: number;
    policyCitations: number;
    redditHackerNews: number;
    wikipediaCitations: number;
  };
  disseminationChannels: Array<{
    channel: string;
    impactTier: "High" | "Medium" | "Low";
    strategy: string;
  }>;
  reproducibleArtifactsChecklist: Array<{
    item: string;
    status: "Ready" | "Recommended";
  }>;
};

export type LatexScaffoldResult = {
  templateType: string;
  linesCount: number;
  latexCode: string;
  bibtexSample?: string;
  packagesIncluded?: string[];
};

export type SocialScienceReviewAuditResult = {
  manuscriptTitle: string;
  targetTier: "CSSCI_TOP" | "SSCI_Q1" | "HYBRID";
  targetJournals: string[];
  overallScore: number; // 0-100
  recommendation: "Strong Accept" | "Minor Revision" | "Major Revision" | "Reject & Resubmit" | "Reject";
  theoreticalConceptualization: {
    score: number; // 0-100
    paradigmDialogue: string;
    constructClarity: string;
    theoreticalContribution: "Incremental" | "Substantial" | "Paradigm-Shifting";
    strengths: string[];
    gaps: string[];
  };
  empiricalTriangulation: {
    triangulationGrade: "A (Complete Mixed-Methods)" | "B (Partial Triangulation)" | "C (Single-Method / Gaps)";
    quantitativeEvaluation: {
      sampleSizeN: number;
      targetSampleSizeMet: boolean; // N >= 1000
      samplingMethod: string;
      commonMethodBiasChecked: boolean;
      statisticalRigor: string;
    };
    qualitativeEvaluation: {
      interviewCountN: number;
      targetInterviewsMet: boolean; // N >= 30
      fieldworkDuration: string;
      theoreticalSaturationReached: boolean;
      codingMethodology: string;
    };
    convergenceAssessment: string;
  };
  ethicalReflexivity: {
    score: number; // 0-100
    irbApprovalOrExemption: boolean;
    informedConsentStatement: boolean;
    researcherPositionalityStated: boolean;
    anonymizationProtocol: string;
  };
  argumentEvidenceConsistency: {
    score: number; // 0-100
    identificationStrategy: string;
    endogeneityAddressed: boolean;
    rivalHypothesesRuledOut: boolean;
  };
  cssciReadiness: {
    chineseContextualization: string;
    journalFit: string[];
    ready: boolean;
    keyAdjustments: string[];
  };
  ssciReadiness: {
    globalTheoreticalGeneralizability: string;
    journalFit: string[];
    ready: boolean;
    keyAdjustments: string[];
  };
  rebuttalAndRevisionRoadmap: Array<{
    dimension: string;
    critique: string;
    revisionStrategy: string;
    actionableFix: string;
  }>;
};

export type Gbt7714ReferenceType = "J" | "M" | "C" | "D" | "R" | "N" | "EB/OL" | "P" | "S" | "G";

export type Gbt7714ReferenceItem = {
  index: number;
  referenceType: Gbt7714ReferenceType;
  formattedString: string;
  rawSource?: string;
};

export type ChineseHeadingItem = {
  level: 1 | 2 | 3 | 4 | 5;
  prefix: string; // e.g. "一、", "（一）", "1.", "（1）", "①"
  title: string;
  original?: string;
};

export type ChineseAcademicFormatterResult = {
  title: string;
  englishTitle?: string;
  clcCode: string; // 中图分类号, e.g. "C912.6", "G206", "B84"
  clcCategory: string; // e.g. "社会学 - 青年社会学", "信息与传播 - 新闻学与传播学"
  documentCode: "A" | "B" | "C" | "D" | "E"; // 文献标识码
  fundProjectFootnote?: string;
  authorBioFootnote?: string;
  headingHierarchyValid: boolean;
  formattedHeadingsCount: number;
  formattedHeadings: ChineseHeadingItem[];
  abstractStructure: {
    chineseAbstract: string;
    chineseKeywords: string[];
    englishAbstract?: string;
    englishKeywords?: string[];
  };
  referencesCount: number;
  gbt7714References: Gbt7714ReferenceItem[];
  formattedArticleMarkdown: string;
  complianceChecks: Array<{
    check: string;
    status: "passed" | "warning" | "failed";
    details: string;
  }>;
};

export type SsciTopJournalInfo = {
  name: string;
  publisher: string;
  impactFactor: number;
  jcrQuartile: "Q1" | "Q2";
  ssciRankCategory: string;
  acceptanceRatePercent: number;
  avgReviewWeeks: number;
  wordLimitMax: number;
  openAccess: "Gold" | "Green" | "Hybrid" | "Closed" | "Diamond";
  methodologyPreference: string;
  theoreticalScope: string;
  aimsAndScopeFit: number; // 0-100
  submissionRequirements: string[];
};

export type SsciJournalMatcherResult = {
  manuscriptTitle: string;
  fieldOfStudy: string;
  matchedCount: number;
  topTargetRecommendation: string;
  recommendations: Array<SsciTopJournalInfo & { matchScore: number; matchReasons: string[] }>;
  formattingGuidelines: {
    recommendedWordCount: string;
    citationStyle: string;
    dataAvailabilityRequirement: string;
    ethicsPreRegistrationNotice: string;
  };
};

export type TelemetryEvent = {
  eventId: string;
  userId: string;
  deviceId?: string;
  timestamp: number | string;
  eventType: string; // e.g. "session_start", "screen_unlock", "app_open", "notification_ack", "handoff", "task_complete"
  durationSeconds?: number;
  payload?: Record<string, unknown>;
};

export type TelemetryPreprocessResult = {
  totalEventsProcessed: number;
  validEvents: number;
  droppedAnomalies: number;
  uniqueUsers: number;
  sessionCount: number;
  meanInterSessionIntervalMinutes: number;
  burstinessIndex: number;
  processedTraces: Array<{
    userId: string;
    sessionDurationMinutes: number;
    burstEventsCount: number;
    interSessionIntervalHours: number;
  }>;
};

export type DigitalTraceAuditResult = {
  manuscriptTitle: string;
  totalEvents: number;
  uniqueHouseholds: number;
  observationDays: number;
  sessionMetrics: {
    meanSessionDurationMinutes: number;
    exponentialDecayAlpha: number;
    p95SessionDurationMinutes: number;
    dailyActiveSessionsPerUser: number;
  };
  screenTimeHandoff: {
    parentToChildHandoffCount: number;
    peakHandoffWindow: string;
    handoffLatencyMinutes: number;
    coUsePercentage: number;
  };
  platformDistribution: Record<string, number>;
  empiricalRigorMetrics: {
    powerAdequate: boolean;
    highDensitySampling: boolean;
    auditSummary: string;
  };
};

export type NlpSentimentScoreResult = {
  totalSnippets: number;
  meanValence: number;
  meanArousal: number;
  affectiveToInstrumentalRatio: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  scoredSnippets: Array<{
    text: string;
    valence: number;
    arousal: number;
    classification: "affective" | "instrumental" | "mixed";
  }>;
};

export type TopicClusterResult = {
  totalTopics: number;
  clusters: Array<{
    topicId: number;
    label: string;
    cTfIdfKeywords: string[];
    prevalence: number;
    coherenceScore: number;
    exemplaryQuotes: string[];
  }>;
  dynamicShift?: Array<{
    period: string;
    topicShifts: Record<string, number>;
  }>;
};

export type NlpSentimentTrajectoryResult = {
  corpusSize: number;
  totalConversations: number;
  dynamicTopicClusters: Array<{
    topicId: number;
    name: string;
    topTerms: string[];
    sharePercent: number;
    valenceShift: number;
  }>;
  valenceTrajectory: Array<{
    period: string;
    valenceMean: number;
    valenceStd: number;
    instrumentalDominanceRatio: number;
  }>;
  affectiveShift: {
    prePeriodAffectiveRatio: number;
    postPeriodAffectiveRatio: number;
    netDepletionDelta: number;
  };
  linguisticMarkers: Array<{
    marker: string;
    frequencyChangePercent: number;
    significancePValue: number;
  }>;
};

export type DidRegressionResult = {
  beta: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  confidenceInterval95: [number, number];
  rSquared: number;
  observationsN: number;
  treatmentUnitsN: number;
  controlUnitsN: number;
  fixedEffects: {
    entityFixed: boolean;
    timeFixed: boolean;
    covariatesIncluded: string[];
  };
  interpretation: string;
};

export type ParallelTrendsTestResult = {
  passedParallelTrends: boolean;
  leadLagEstimates: Array<{
    periodRelative: number;
    coefficient: number;
    se: number;
    pValue: number;
    significantAt05: boolean;
  }>;
  fStatisticPreTrends: number;
  fTestPValue: number;
  placeboTestPassed: boolean;
  placeboCoeff: number;
  placeboPValue: number;
  conclusion: string;
};

export type CausalInferenceDidResult = {
  modelSpecification: string;
  outcomeVariable: string;
  treatmentVariable: string;
  didEstimate: DidRegressionResult;
  parallelTrends: ParallelTrendsTestResult;
  covariateBalance: Array<{
    variable: string;
    treatedMean: number;
    controlMean: number;
    standardizedMeanDiff: number;
    balanced: boolean;
  }>;
  robustnessChecks: {
    placeboPolicyDatePassed: boolean;
    leaveOneOutStable: boolean;
    wildClusterBootstrapPValue: number;
  };
};

export type AbmAgentState = {
  id: number;
  state: "quiescent" | "engaged" | "saturated" | "fatigued" | "conflict";
  algorithmicNudgeLevel: number;
  parentalControlLevel: number;
  interactionCount: number;
  intimacyScore: number;
};

export type AbmStepResult = {
  step: number;
  populationSize: number;
  stateDistribution: Record<string, number>;
  meanIntimacyScore: number;
  conflictEventRate: number;
  transitionsOccurred: number;
  emergentFeedbackIndex: number;
};

export type AbmSimulationResult = {
  agentsCount: number;
  totalSimulationSteps: number;
  initialParameters: {
    feedbackStrength: number;
    interventionAdoptionRate: number;
    baselineIntimacy: number;
    decayLambda: number;
  };
  trajectory: Array<{
    step: number;
    engagedAgents: number;
    fatiguedAgents: number;
    conflictRate: number;
    averageIntimacy: number;
  }>;
  macroEmergenceSummary: {
    tippingPointStep: number;
    polarizationIndex: number;
    equilibriumState: string;
    theoreticalImplications: string[];
  };
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
  latex_template?: "acm" | "ieee" | "nature";
  methodology_data?: {
    sample_size?: number;
    treatment_mean?: number;
    control_mean?: number;
    pooled_std?: number;
    baselines?: Array<{ name: string; score: number; latency_ms?: number }>;
  };
  grant_abstract?: string;
  funding_agency?: "NIH" | "NSF" | "ERC" | "DARPA" | "DOE";
  direct_costs?: {
    personnel?: number;
    equipment?: number;
    supplies?: number;
    travel?: number;
    subawards_over_25k?: number;
    participant_support?: number;
    other?: number;
  };
  fringe_rate_percent?: number;
  indirect_rate_percent?: number;
  duration_years?: number;
  annual_escalation_percent?: number;
  aims?: string[];
  field_of_study?: string;
  desired_impact_factor_min?: number;
  target_review_weeks_max?: number;
  open_access_preference?: "Gold" | "Green" | "Hybrid" | "Closed" | "Diamond" | "Any";
  invention_title?: string;
  invention_summary?: string;
  claims_text?: string;
  claims_list?: Array<{
    claimNumber?: number;
    text: string;
    type?: "independent" | "dependent";
    dependsOnClaim?: number;
  }>;
  limit?: number;
  // Specialized Social Science Publication Parameters
  target_cssci_journal?: string;
  target_ssci_journal?: string;
  social_science_field?: "Sociology" | "Psychology" | "Communication" | "Management" | "Interdisciplinary" | string;
  empirical_data?: {
    survey_sample_size?: number;
    interview_count?: number;
    fieldwork_duration_months?: number;
    qualitative_method?: string;
    quantitative_method?: string;
    mixed_methods?: boolean;
    common_method_bias_checked?: boolean;
    theoretical_saturation?: boolean;
    sampling_strategy?: string;
  };
  chinese_paper?: {
    title?: string;
    english_title?: string;
    clc_code?: string;
    document_code?: "A" | "B" | "C" | "D" | "E";
    fund_project?: string;
    author_bio?: string;
    chinese_abstract?: string;
    chinese_keywords?: string[];
    english_abstract?: string;
    english_keywords?: string[];
    headings?: string[];
    raw_markdown?: string;
    references?: Array<{
      authors?: string[];
      title: string;
      journal?: string;
      publisher?: string;
      year: number | string;
      volume?: string;
      issue?: string;
      pages?: string;
      doi?: string;
      url?: string;
      type?: Gbt7714ReferenceType;
    } | string>;
  };
  word_count_limit_max?: number;
  // Computational Social Science (CSS) Parameters
  css_telemetry_events?: TelemetryEvent[];
  css_nlp_corpus?: Array<{
    text: string;
    timestamp?: string | number;
    speaker?: "parent" | "child" | string;
    period?: string;
  }>;
  css_snippets?: Array<{ text: string; id?: string | number }>;
  css_did_data?: {
    treated_post_mean?: number;
    treated_pre_mean?: number;
    control_post_mean?: number;
    control_pre_mean?: number;
    sample_size?: number;
    treatment_units?: number;
    control_units?: number;
    covariates_included?: string[];
    panels?: Array<{
      unit_id: string;
      period: number;
      treated: boolean;
      post: boolean;
      outcome: number;
      covariates?: Record<string, number>;
    }>;
  };
  css_event_study_leads?: Array<{
    periodRelative: number;
    coefficient: number;
    se: number;
  }>;
  css_abm_params?: {
    agent_count?: number;
    steps?: number;
    feedback_strength?: number;
    intervention_rate?: number;
    decay_lambda?: number;
    baseline_intimacy?: number;
  };
  css_abm_agents?: AbmAgentState[];
  css_step_number?: number;
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
      const data = result.data as { totalActions: number; actions: Array<{ name: string }> };
      return `Academic Lifecycle Actions (${data.totalActions}): ${data.actions.map((a) => a.name).join(", ")}`;
    }
    case "paper_literature_search": {
      const data = result.data as { total: number; papers: Array<{ title: string; year: number; citations: number }> };
      return `Literature Search: ${data.total} papers indexed (Top: "${data.papers[0]?.title ?? ""}", ${data.papers[0]?.citations ?? 0} citations)`;
    }
    case "paper_citation_verify": {
      const data = result.data as CitationVerifyResult;
      return data.valid ? `Citation Validated (${data.doi ?? "BibTeX"}): "${data.formattedCitation.slice(0, 60)}..."` : `Citation format invalid`;
    }
    case "paper_methodology_audit": {
      const data = result.data as MethodologyAuditResult;
      return `Methodology Audit: ${data.methodologyScore}/100 [Grade: ${data.reproducibilityGrade}] | Baselines: ${data.baselineCheck.stateOfTheArtCovered ? "SOTA Covered" : "Gaps Detected"}`;
    }
    case "paper_structure_audit": {
      const data = result.data as ManuscriptStructureAuditResult;
      return `Manuscript Readiness: ${data.readinessScore}/100 [${data.completeness}] (${data.totalWordCount} words)`;
    }
    case "paper_peer_review_simulate": {
      const data = result.data as PeerReviewFeedback;
      return `Peer Review Simulation: ${data.overallRecommendation} (${data.score}/10) | ${data.strengths.length} strengths, ${data.weaknesses.length} weaknesses, ${data.rebuttalMatrix.length} rebuttal items`;
    }
    case "paper_latex_scaffold": {
      const data = result.data as LatexScaffoldResult;
      return `LaTeX Scaffold Generated: [${data.templateType}] (${data.linesCount} lines, compilation-ready)`;
    }
    case "grant_criteria_audit": {
      const data = result.data as GrantCriteriaAuditResult;
      return `Grant Rubric Score: ${data.compositeNihScore.toFixed(1)}/9.0 [${data.overallCategory}] (${data.fundingAgency})`;
    }
    case "grant_budget_calculator": {
      const data = result.data as GrantBudgetResult;
      return `Grant Budget: $${data.totalBudgetUsd.toLocaleString()} total ($${data.totalDirectCostsUsd.toLocaleString()} direct, $${data.totalIndirectCostsUsd.toLocaleString()} F&A)`;
    }
    case "grant_aims_alignment": {
      const data = result.data as GrantAimsAlignmentResult;
      return `Specific Aims Alignment: ${data.alignmentScore}/100 (${data.aimsCount} aims evaluated, Independent)`;
    }
    case "journal_matcher": {
      const data = result.data as { matchedCount: number; recommendations: JournalRecommendation[] };
      return `Journal Matches (${data.matchedCount}): Top target '${data.recommendations[0]?.name ?? ""}' (IF: ${data.recommendations[0]?.impactFactor ?? 0})`;
    }
    case "journal_submission_checklist": {
      const data = result.data as JournalSubmissionChecklistResult;
      return `Submission Checklist: ${data.passedChecks}/${data.totalChecks} passed [${data.readyForSubmission ? "READY FOR SUBMISSION" : "ACTION ITEMS REMAINING"}]`;
    }
    case "patent_novelty_check": {
      const data = result.data as PatentNoveltyResult;
      return `Patent Novelty Score: ${data.noveltyScore}/100 (${data.priorArtCount} prior art references analyzed, ${data.patentable ? "PATENTABLE" : "PRIOR ART RISK"})`;
    }
    case "patent_claim_structure": {
      const data = result.data as PatentClaimStructureResult;
      return `Patent Claims: ${data.totalClaims} claims (${data.independentClaims} independent, Antecedent: ${data.validAntecedent ? "VALID" : "FLAW DETECTED"})`;
    }
    case "patent_spec_scaffold": {
      const data = result.data as PatentSpecScaffoldResult;
      return `Patent Spec Scaffolding: "${data.title}" (${data.sectionsCount} formal sections, ${data.claimsCount} claims)`;
    }
    case "scholarly_impact_forecast": {
      const data = result.data as ScholarlyImpactForecastResult;
      return `Scholarly Impact Forecast: ~${data.projectedCitationsYear3} citations (3-Year), Altmetric Score ~${data.projectedAltmetricScore}`;
    }
    case "social_science_peer_review_audit": {
      const data = result.data as SocialScienceReviewAuditResult;
      return `Social Science Peer Review: ${data.recommendation} (${data.overallScore}/100) [Triangulation: ${data.empiricalTriangulation.triangulationGrade}] | CSSCI: ${data.cssciReadiness.ready ? "Ready" : "Gaps"}, SSCI Q1: ${data.ssciReadiness.ready ? "Ready" : "Gaps"}`;
    }
    case "chinese_academic_formatter": {
      const data = result.data as ChineseAcademicFormatterResult;
      return `Chinese Academic Formatter: CLC [${data.clcCode} ${data.clcCategory}], 文献标识码 [${data.documentCode}], ${data.formattedHeadingsCount} headings, ${data.referencesCount} GB/T 7714 references formatted`;
    }
    case "ssci_top_journal_matcher": {
      const data = result.data as SsciJournalMatcherResult;
      return `SSCI Q1 Top Matches (${data.matchedCount}): Top target '${data.topTargetRecommendation}' (IF: ${data.recommendations[0]?.impactFactor ?? 0}, Review: ${data.recommendations[0]?.avgReviewWeeks ?? 0}w, Max: ${data.recommendations[0]?.wordLimitMax ?? 0} words)`;
    }
    case "css_digital_trace_audit": {
      const data = result.data as DigitalTraceAuditResult;
      return `Digital Trace Audit: ${data.totalEvents.toLocaleString()} events across ${data.uniqueHouseholds.toLocaleString()} households (${data.observationDays} days) | Decay α: ${data.sessionMetrics.exponentialDecayAlpha.toFixed(3)}, Co-Use: ${data.screenTimeHandoff.coUsePercentage}%`;
    }
    case "css_nlp_sentiment_trajectory": {
      const data = result.data as NlpSentimentTrajectoryResult;
      return `NLP Sentiment Trajectory: N=${data.corpusSize.toLocaleString()} snippets, ${data.dynamicTopicClusters.length} topic clusters | Affective ratio: ${data.affectiveShift.prePeriodAffectiveRatio.toFixed(2)} → ${data.affectiveShift.postPeriodAffectiveRatio.toFixed(2)} (Δ=${data.affectiveShift.netDepletionDelta.toFixed(2)})`;
    }
    case "css_causal_inference_did": {
      const data = result.data as CausalInferenceDidResult;
      return `Causal DID Estimation: β = ${data.didEstimate.beta.toFixed(3)} (SE = ${data.didEstimate.standardError.toFixed(3)}, t = ${data.didEstimate.tStatistic.toFixed(2)}, p < 0.001) | Parallel Trends: ${data.parallelTrends.passedParallelTrends ? "Passed" : "Failed"}, Placebo: ${data.parallelTrends.placeboTestPassed ? "Passed" : "Failed"}`;
    }
    case "css_abm_simulation": {
      const data = result.data as AbmSimulationResult;
      return `ABM Simulation: N=${data.agentsCount.toLocaleString()} agents over ${data.totalSimulationSteps} steps | Tipping Point: Step ${data.macroEmergenceSummary.tippingPointStep}, Polarization: ${data.macroEmergenceSummary.polarizationIndex.toFixed(3)} [${data.macroEmergenceSummary.equilibriumState}]`;
    }
    case "css_telemetry_preprocess": {
      const data = result.data as TelemetryPreprocessResult;
      return `Telemetry Preprocess: ${data.totalEventsProcessed} events (${data.validEvents} valid, ${data.droppedAnomalies} dropped) across ${data.uniqueUsers} users | Mean ISI: ${data.meanInterSessionIntervalMinutes.toFixed(1)}m, Burstiness: ${data.burstinessIndex.toFixed(2)}`;
    }
    case "css_nlp_sentiment_score": {
      const data = result.data as NlpSentimentScoreResult;
      return `NLP Sentiment Score: ${data.totalSnippets} snippets | Mean Valence: ${data.meanValence.toFixed(2)}, Arousal: ${data.meanArousal.toFixed(2)}, Affective/Instrumental: ${data.affectiveToInstrumentalRatio.toFixed(2)}`;
    }
    case "css_topic_bertopic_cluster": {
      const data = result.data as TopicClusterResult;
      return `BERTopic Dynamic Clustering: ${data.totalTopics} topics extracted | Top: "${data.clusters[0]?.label ?? ""}" (${((data.clusters[0]?.prevalence ?? 0) * 100).toFixed(1)}%, Coherence: ${data.clusters[0]?.coherenceScore.toFixed(2)})`;
    }
    case "css_did_regression": {
      const data = result.data as DidRegressionResult;
      return `DID Regression: β = ${data.beta.toFixed(3)} (SE = ${data.standardError.toFixed(3)}, t = ${data.tStatistic.toFixed(2)}, p = ${data.pValue < 0.001 ? "<0.001" : data.pValue.toFixed(3)}) | N = ${data.observationsN.toLocaleString()}, R² = ${data.rSquared.toFixed(3)}`;
    }
    case "css_parallel_trends_test": {
      const data = result.data as ParallelTrendsTestResult;
      return `Parallel Trends Test: ${data.passedParallelTrends ? "PASSED (Parallel pre-trends hold)" : "FAILED"} (F = ${data.fStatisticPreTrends.toFixed(2)}, p = ${data.fTestPValue.toFixed(3)}) | Placebo: ${data.placeboTestPassed ? "Passed" : "Failed"}`;
    }
    case "css_abm_step": {
      const data = result.data as AbmStepResult;
      return `ABM Step ${data.step}: N=${data.populationSize} | Intimacy: ${data.meanIntimacyScore.toFixed(2)}, Conflict Rate: ${(data.conflictEventRate * 100).toFixed(1)}%, Transitions: ${data.transitionsOccurred}`;
    }
  }
}

export const compactScienceResult = formatScienceSummary;
