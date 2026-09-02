/**
 * Plugin/Infra Core - Global Edge Microservices & Data Infrastructure Protocol
 *
 * FastMCP protocol engine managing Cloudflare Workers, edge microservices, and distributed data:
 * - Module 1: Edge Canary Probes (sub-15ms latency benchmarks, health checks, route SLAs)
 * - Module 2: D1 & KV Schema Integrity (SQL migrations, foreign keys, indexes, data invariants)
 * - Module 3: Worker Bundle & Deployment Boundary (wrangler configurations, compatibility dates)
 * - Module 4: Monetization & Stripe Webhook Simulation (HMAC verification, event signatures)
 */

export const INFRA_PROTOCOL = "holar.infra.v1" as const;

export type InfraModule = "canary" | "d1" | "worker" | "monetization";

export type InfraAction =
  | "infra_canary_probe"
  | "infra_d1_schema_audit"
  | "infra_worker_bundle_audit"
  | "infra_stripe_webhook_simulate";

export interface InfraCanaryProbeInput {
  endpoints?: string[];
  mockResponses?: boolean;
}

export interface InfraCanaryProbeOutput {
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  testedCount: number;
  healthyCount: number;
  averageLatencyMs: number;
  services: {
    service: string;
    url: string;
    status: "PASS" | "FAIL";
    latencyMs: number;
    details: string;
  }[];
}

export interface InfraD1SchemaAuditInput {
  workspaceRoot?: string;
}

export interface InfraD1SchemaAuditOutput {
  status: "COMPLIANT" | "NON_COMPLIANT";
  auditedFiles: number;
  tablesFound: string[];
  indexesFound: string[];
  foreignKeysCompliant: boolean;
  diagnostics: string[];
}

export interface InfraWorkerBundleAuditInput {
  workspaceRoot?: string;
}

export interface InfraWorkerBundleAuditOutput {
  status: "VALID" | "INVALID";
  workersAudited: number;
  compatibilityGuarantees: boolean;
  results: {
    worker: string;
    configPath: string;
    compatibilityDate: string;
    valid: boolean;
    issues: string[];
  }[];
}

export interface InfraStripeWebhookSimulateInput {
  eventType?: string;
  secretKey?: string;
  payload?: Record<string, unknown>;
}

export interface InfraStripeWebhookSimulateOutput {
  verified: boolean;
  signatureValid: boolean;
  eventType: string;
  parsedEventId: string;
  handled: boolean;
  dispatchDetails: string;
}
