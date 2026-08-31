/**
 * MentalCraft Plugin Ecosystem - Root Unified SDK
 *
 * Exposes all 6 core capability engines, protocols, types, and dispatcher operations
 * with 100% Agent-Less and host-agnostic guarantees.
 */

// Business Pillar (8-Stage Venture Lifecycle across Websites, Apps, Games, SEO, ASO, Steam, Stripe)
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
} from "./Business/core.ts";
export { businessOperation, TrafficCvClient } from "./Business/operation.ts";

// Science Pillar (8-Stage Academic Production Lifecycle across Paper, Grant, Journal, and Patent)
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
  type PatentNoveltyResult,
  type PatentClaim,
  type PatentClaimStructureResult,
  type PatentSpecScaffoldResult,
  type ScholarlyImpactForecastResult,
} from "./Science/core.ts";
export {
  scienceOperation,
  parseBibtexToAst,
  formatCitationFromFields,
  computeStatisticalPower,
  computeCohensD,
  validateClaimAntecedentBasis,
} from "./Science/operation.ts";

// Design Pillar (5-Layer Architecture, Svelte 5 Runes UI, On-Demand Subpaths, Tokens)
export {
  DESIGN_PROTOCOL,
  COMPONENT_CATALOG,
  DESIGN_TOKENS,
  DOMAIN_PRESETS,
  formatDesignSummary,
  compactDesignResult,
  type DesignAction,
  type DesignInput,
  type DesignResult,
  type ComponentSpec,
  type TokenDefinition,
  type DomainPreset,
} from "./Design/core.ts";
export { designOperation } from "./Design/operation.ts";

// Workflow Pillar (Cross-Plugin DAG Orchestrator, Health Probes, OpenRPC Catalogs)
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
} from "./Workflow/core.ts";
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
} from "./Workflow/operation.ts";

// Chrome Subsystem (Browser Automation & Native Messaging Bridge)
export {
  PROTOCOL as CHROME_PROTOCOL,
  compactBrowserResult,
  formatBrowserSummary,
} from "./Chrome/core.ts";
export {
  createBrowserContextOperation,
  type BrowserContextInput,
  type BrowserContextOperation,
} from "./Chrome/operation.ts";

// Message Subsystem (Multi-Channel Priority Communication Bus)
export {
  createMessageOperation,
  type MessageInput,
  type MessageResult,
} from "./Message/operation.ts";

// Master MCP Gateway
export {
  handleGatewayRpc,
  startGatewayMcpHttp,
  GATEWAY_TOOLS,
} from "./gateway.ts";
