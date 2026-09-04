/**
 * MentalCraft FastMCP Protocol Network Root Index
 *
 * Universal, Agent-Less & Host-Agnostic Protocol Engine Suite for Holar Ecosystem.
 */

// Master Gateway MCP Server
export {
  startGatewayMcpStdio,
  startGatewayMcpHttp,
  handleGatewayRpc,
  GATEWAY_TOOLS,
  protectStdioTransport,
} from "./Capability/Workflow/gateway.ts";

// Canonical Pipeline Operations (5 High-Dimension Value Pipelines)
export { businessOperation, type BusinessInput } from "./Pipeline/Business/operation.ts";
export { scienceOperation, type ScienceInput } from "./Pipeline/Science/operation.ts";
export { contentOperation, type ContentInput } from "./Pipeline/Content/operation.ts";
export { companyOperation, type CompanyAction } from "./Pipeline/Company/operation.ts";
export { designOperation, type DesignInput } from "./Pipeline/Design/operation.ts";

// Canonical Capability Operations (5 Atomic Perception & Action Primitives + Infra Probe)
export { createBrowserContextOperation, type BrowserContextInput } from "./Capability/Browser/operation.ts";
export { createMessageOperation, type MessageInput, type MessageOperationInput } from "./Capability/Message/operation.ts";
export { secretOperation, type SecretInput } from "./Capability/Secret/operation.ts";
export { aiOperation, type AIInput, type AIAction } from "./Capability/AI/operation.ts";
export { infraOperation, type InfraAction } from "./Capability/Infra/operation.ts";

// Capability Workflow Orchestration
export * from "./Capability/Workflow/index.ts";
