/**
 * MentalCraft Plugin Ecosystem - Root Unified SDK
 *
 * Exposes all 6 core capability engines, protocols, types, and dispatcher operations
 * with 100% Agent-Less and host-agnostic guarantees.
 */

// Business Pillar (SEO, TrafficCV, Stripe Radar, Traction Index)
export {
  BUSINESS_PROTOCOL,
  TrafficCvClient,
  formatBusinessSummary,
  compactBusinessResult,
  type BusinessAction,
  type BusinessInput,
  type BusinessResult,
  type KeywordDifficultyResult,
  type StripeSiteInsight,
  type TrafficCvDomainOverview,
  type TrafficCvChannelBreakdown,
  type TractionScoreResult,
} from "./Business/core.ts";
export { businessOperation } from "./Business/operation.ts";

// Science Pillar (Clinical Scales, 988 Crisis Protocols, Literature & Patents)
export {
  SCIENCE_PROTOCOL,
  formatScienceSummary,
  compactScienceResult,
  type ScienceAction,
  type ScienceInput,
  type ScienceResult,
  type ClinicalScale,
  type ClinicalScaleResult,
  type CrisisEvaluationResult,
  type PatentNoveltyResult,
} from "./Science/core.ts";
export { scienceOperation } from "./Science/operation.ts";

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
  startGatewayMcpStdio,
  startGatewayMcpHttp,
  GATEWAY_TOOLS,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from "./gateway.ts";
