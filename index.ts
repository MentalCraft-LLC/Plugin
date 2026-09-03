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
} from "./Capability/Workflow/gateway.ts";

// Canonical Domain Operations
export { businessOperation, type BusinessInput } from "./Domain/Business/operation.ts";
export { designOperation, type DesignInput } from "./Domain/Design/operation.ts";
export { scienceOperation, type ScienceInput } from "./Domain/Science/operation.ts";
export { contentOperation, type ContentInput } from "./Domain/Content/operation.ts";
export { infraOperation, type InfraAction } from "./Domain/Infra/operation.ts";
export { companyOperation, type CompanyAction } from "./Domain/Company/operation.ts";

// Canonical Tool Operations
export { createBrowserContextOperation, type BrowserContextInput } from "./Tool/Browser/operation.ts";
export { createMessageOperation, type MessageInput, type MessageOperationInput } from "./Tool/Message/operation.ts";
export { secretOperation, type SecretInput } from "./Tool/Secret/operation.ts";

// Capability Workflow Orchestration
export * from "./Capability/Workflow/index.ts";
