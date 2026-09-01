/**
 * MentalCraft Plugin Ecosystem - Unified Workflow & Core Engine SDK
 */

// Business Subsystem
export {
  BUSINESS_PROTOCOL,
  formatBusinessSummary,
  compactBusinessResult,
  type BusinessAction,
  type BusinessModality,
  type BusinessInput,
  type BusinessResult,
  type MarketValidationResult,
  type PmfValidationResult,
  type AcquisitionAuditResult,
  type ActivationFunnelResult,
  type UnitEconomicsResult,
  type RetentionCurvesResult,
  type MonetizationTelemetryResult,
  type PricingExperimentResult,
  type GrowthPlaybookResult,
  type ExpansionMoatResult,
  type KeywordDifficultyResult,
  type StripeSiteInsight,
  type TrafficCvDomainOverview,
  type TrafficCvChannelBreakdown,
  type TractionScoreResult,
  type SpriteFlowMrrEngineResult,
  type SpriteFlowPseoMatrixResult,
  type ZeroCostViralLoopsResult,
  type PseoKeywordEntry,
} from "../Business/core.ts";
export { businessOperation, TrafficCvClient } from "../Business/operation.ts";

// Science Subsystem
export {
  SCIENCE_PROTOCOL,
  formatScienceSummary,
  compactScienceResult,
  type ScienceAction,
  type ScienceInput,
  type ScienceResult,
  type AcademicPaper,
  type CitationStyle,
  type BibtexAst,
  type CitationVerifyResult,
  type StatisticalPowerAnalysis,
  type CohensDEffectSize,
  type SotaBaselineComparison,
  type MethodologyAuditResult,
  type ManuscriptSectionAudit,
  type ManuscriptStructureAuditResult,
  type LatexScaffoldResult,
  type ReviewerFeedback,
  type PeerReviewFeedback,
  type GrantRubricScore,
  type GrantCriteriaAuditResult,
  type GrantBudgetYear,
  type GrantBudgetResult,
  type GrantAimsAlignmentResult,
  type JournalRecommendation,
  type JournalChecklistItem,
  type JournalSubmissionChecklistResult,
  type SocialScienceReviewAuditResult,
  type ChineseAcademicFormatterResult,
  type SsciJournalMatcherResult,
  type SsciTopJournalInfo,
  type PatentNoveltyResult,
  type PatentClaim,
  type PatentClaimStructureResult,
  type PatentSpecScaffoldResult,
  type ScholarlyImpactForecastResult,
} from "../Science/core.ts";
export {
  scienceOperation,
  parseBibtexToAst,
  formatCitationFromFields,
  computeStatisticalPower,
  computeCohensD,
  validateClaimAntecedentBasis,
  performSocialScienceReviewAudit,
  formatChineseAcademicPaper,
  matchSsciTopJournals,
} from "../Science/operation.ts";

// Design Subsystem
export {
  DESIGN_PROTOCOL,
  COMPONENT_CATALOG,
  DESIGN_TOKENS,
  DOMAIN_PRESETS,
  DUOTONE_RECIPES,
  SUBSTRATES,
  formatDesignSummary,
  compactDesignResult,
  type DesignAction,
  type DesignInput,
  type DesignResult,
  type ComponentSpec,
  type TokenDefinition,
  type DomainPreset,
  type DuotonePaletteId,
  type SubstrateId,
  type EditorialManifest,
} from "../Design/core.ts";
export { designOperation } from "../Design/operation.ts";

// Workflow Subsystem
export {
  WORKFLOW_PROTOCOL,
  BUILTIN_WORKFLOWS,
  formatWorkflowSummary,
  compactWorkflowResult,
  type WorkflowAction,
  type WorkflowId,
  type WorkflowStep,
  type WorkflowDefinition,
  type WorkflowInput,
  type WorkflowResult,
  type WorkflowRunReceipt,
  type SystemHealthReport,
  type PluginHealthReport,
  type ExportConfigResult,
} from "./core.ts";
export {
  workflowOperation,
  executeHealthCheck,
  getAllWorkflows,
  installMcpSchemasToAgy,
  validateWorkflowDag,
  exportMermaidDag,
  exportOpenApiCatalog,
  batchExecute,
  withRetry,
  redactSensitiveData,
} from "./operation.ts";

// Chrome Subsystem
export {
  PROTOCOL as CHROME_PROTOCOL,
  compactBrowserResult,
  formatBrowserSummary,
} from "../Chrome/core.ts";
export {
  createBrowserContextOperation,
  type BrowserContextInput,
  type BrowserContextOperation,
} from "../Chrome/operation.ts";

// Message Subsystem
export {
  createMessageOperation,
  type MessageInput,
  type MessageResult,
} from "../Message/operation.ts";

// Gateway
export {
  handleGatewayRpc,
  startGatewayMcpHttp,
  GATEWAY_TOOLS,
} from "./gateway.ts";
