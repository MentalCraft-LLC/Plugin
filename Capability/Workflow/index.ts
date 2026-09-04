/**
 * MentalCraft Plugin Ecosystem - Unified Workflow & Core Engine SDK
 */

// Business Subsystem (Domain)
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
} from "../../Domain/Business/core.ts";
export { businessOperation, TrafficCvClient } from "../../Domain/Business/operation.ts";

// Science Subsystem (Domain)
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
} from "../../Domain/Science/core.ts";
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
} from "../../Domain/Science/operation.ts";

// Design Subsystem (Domain)
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
} from "../../Domain/Design/core.ts";
export { designOperation } from "../../Domain/Design/operation.ts";

// Content Subsystem (Domain)
export {
  CONTENT_PROTOCOL,
  type ContentAction,
  type ContentInput,
  type ContentResult,
} from "../../Domain/Content/core.ts";
export { contentOperation } from "../../Domain/Content/operation.ts";

// Infra Subsystem (Domain)
export {
  INFRA_PROTOCOL,
  type InfraAction,
  type InfraInput,
  type InfraResult,
  type InfraCanaryProbeInput,
  type InfraCanaryProbeOutput,
  type InfraD1SchemaAuditInput,
  type InfraD1SchemaAuditOutput,
  type InfraWorkerBundleAuditInput,
  type InfraWorkerBundleAuditOutput,
  type InfraStripeWebhookSimulateInput,
  type InfraStripeWebhookSimulateOutput,
} from "../../Domain/Infra/core.ts";
export {
  infraOperation,
  executeInfraCanaryProbe,
  executeInfraD1SchemaAudit,
  executeInfraWorkerBundleAudit,
  executeInfraStripeWebhookSimulate,
} from "../../Domain/Infra/operation.ts";

// Company Subsystem (Domain)
export {
  COMPANY_PROTOCOL,
  type CompanyAction,
  type CompanyInput,
  type CompanyResult,
  type CompanyEntityAuditInput,
  type CompanyEntityAuditOutput,
  type CompanyCapTableCalcInput,
  type CompanyCapTableCalcOutput,
  type CompanyIpAssignmentAuditInput,
  type CompanyIpAssignmentAuditOutput,
  type CompanyComplianceCheckInput,
  type CompanyComplianceCheckOutput,
} from "../../Domain/Company/core.ts";
export {
  companyOperation,
  executeCompanyEntityAudit,
  executeCompanyCapTableCalc,
  executeCompanyIpAssignmentAudit,
  executeCompanyComplianceCheck,
} from "../../Domain/Company/operation.ts";

// Workflow Subsystem (Capability)
export {
  WORKFLOW_PROTOCOL,
  BUILTIN_WORKFLOWS,
  formatWorkflowSummary,
  compactWorkflowResult,
  scheduleDagWaves,
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
  dispatchPluginAction,
  getCircuitState,
  resetCircuit,
  flushPersistedState,
} from "./operation.ts";
export {
  runMentalCraftDiagnostics,
  type DiagnosticReport,
  type DiagnosticIssue,
  type DimensionAuditResult,
  type DiagnosticDimensionKey,
} from "./diagnostics.ts";

// Browser Subsystem (Tool)
export {
  PROTOCOL as BROWSER_PROTOCOL,
  PROTOCOL as CHROME_PROTOCOL,
  compactBrowserResult,
  formatBrowserSummary,
} from "../../Tool/Browser/core.ts";
export {
  createBrowserContextOperation,
  type BrowserContextInput,
  type BrowserContextOperation,
} from "../../Tool/Browser/operation.ts";

// Message Subsystem (Tool)
export {
  createMessageOperation,
  type MessageInput,
  type MessageResult,
} from "../../Tool/Message/operation.ts";

// Secret Subsystem (Tool)
export {
  secretOperation,
} from "../../Tool/Secret/operation.ts";

// Gateway
export {
  handleGatewayRpc,
  startGatewayMcpHttp,
  startGatewayMcpStdio,
  protectStdioTransport,
  GATEWAY_TOOLS,
} from "./gateway.ts";

