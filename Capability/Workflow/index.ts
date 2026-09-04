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
} from "../../Pipeline/Business/core.ts";
export { businessOperation, TrafficCvClient } from "../../Pipeline/Business/operation.ts";

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
} from "../../Pipeline/Science/core.ts";
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
} from "../../Pipeline/Science/operation.ts";

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
} from "../../Pipeline/Design/core.ts";
export { designOperation } from "../../Pipeline/Design/operation.ts";

// Content Subsystem (Domain)
export {
  CONTENT_PROTOCOL,
  type ContentAction,
  type ContentInput,
  type ContentResult,
} from "../../Pipeline/Content/core.ts";
export { contentOperation } from "../../Pipeline/Content/operation.ts";

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
} from "../Infra/core.ts";
export {
  infraOperation,
  executeInfraCanaryProbe,
  executeInfraD1SchemaAudit,
  executeInfraWorkerBundleAudit,
  executeInfraStripeWebhookSimulate,
} from "../Infra/operation.ts";

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
} from "../../Pipeline/Company/core.ts";
export {
  companyOperation,
  executeCompanyEntityAudit,
  executeCompanyCapTableCalc,
  executeCompanyIpAssignmentAudit,
  executeCompanyComplianceCheck,
} from "../../Pipeline/Company/operation.ts";

// Workflow Subsystem (Capability)
export {
  WORKFLOW_PROTOCOL,
  BUILTIN_WORKFLOWS,
  formatWorkflowSummary,
  compactWorkflowResult,
  scheduleDagWaves,
  evaluateStepCondition,
  evaluateStepAssertions,
  getNestedProperty,
  type WorkflowAction,
  type WorkflowId,
  type WorkflowStep,
  type WorkflowStepCondition,
  type WorkflowStepAssertion,
  type WorkflowStepRollback,
  type WorkflowEvent,
  type WorkflowEventType,
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
  runWithConcurrencyLimit,
  getCachedWorkflowResult,
  setCachedWorkflowResult,
  clearWorkflowCache,
} from "./operation.ts";
export {
  runMentalCraftDiagnostics,
  type DiagnosticReport,
  type DiagnosticIssue,
  type DimensionAuditResult,
  type DiagnosticDimensionKey,
} from "./diagnostics.ts";

// Browser Subsystem (Capability)
export {
  PROTOCOL as BROWSER_PROTOCOL,
  PROTOCOL as CHROME_PROTOCOL,
  compactBrowserResult,
  formatBrowserSummary,
} from "../Browser/core.ts";
export {
  createBrowserContextOperation,
  type BrowserContextInput,
  type BrowserContextOperation,
} from "../Browser/operation.ts";

// Message Subsystem (Capability)
export {
  createMessageOperation,
  type MessageInput,
  type MessageResult,
} from "../Message/operation.ts";

// Secret Subsystem (Capability)
export {
  secretOperation,
} from "../Secret/operation.ts";

// AI Subsystem (Capability)
export {
  AI_PROTOCOL,
  aiOperation,
  type AIAction,
  type AIInput,
} from "../AI/index.ts";

// Gateway
export {
  handleGatewayRpc,
  startGatewayMcpHttp,
  startGatewayMcpStdio,
  protectStdioTransport,
  GATEWAY_TOOLS,
} from "./gateway.ts";

