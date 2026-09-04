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

export type InfraModule = "canary" | "d1" | "worker" | "monetization" | "publish";

export type InfraAction =
  | "infra_canary_probe"
  | "infra_d1_schema_audit"
  | "infra_worker_bundle_audit"
  | "infra_stripe_webhook_simulate"
  | "infra_publish_dispatch"
  | "infra_wechat_webhook_simulate"
  | "infra_analytics_query"
  | "infra_analytics_beacon_verify"
  | "infra_experiment_route"
  | "infra_workflow_execute"
  | "infra_media_render"
  | "infra_media_image_generate"
  | "infra_media_video_clip"
  | "infra_media_workflow_execute"
  | "list_actions";

export const INFRA_ACTIONS: InfraAction[] = [
  "infra_canary_probe",
  "infra_d1_schema_audit",
  "infra_worker_bundle_audit",
  "infra_stripe_webhook_simulate",
  "infra_publish_dispatch",
  "infra_wechat_webhook_simulate",
  "infra_analytics_query",
  "infra_analytics_beacon_verify",
  "infra_experiment_route",
  "infra_workflow_execute",
  "infra_media_render",
  "infra_media_image_generate",
  "infra_media_video_clip",
  "infra_media_workflow_execute",
  "list_actions",
];

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

export interface InfraPublishDispatchInput {
  title: string;
  markdown: string;
  author?: string;
  destinations?: Array<{
    platform:
      | "wechat"
      | "xiaohongshu"
      | "zhihu"
      | "x"
      | "linkedin"
      | "juejin"
      | "medium"
      | "devto"
      | "reddit"
      | "bluesky";
    mode?: "draft" | "publish" | "preview" | "card_carousel" | "thread" | "pin" | "skeet";
  }>;
}

export interface InfraPublishDispatchOutput {
  jobId: string;
  status: "SUCCESS" | "FAILED";
  results: Array<{
    platform: string;
    status: string;
    postId?: string;
    url?: string;
  }>;
}

export interface InfraWeChatWebhookSimulateInput {
  content?: string;
  event?: "subscribe" | "unsubscribe" | "click";
  eventKey?: string;
}

export interface InfraWeChatWebhookSimulateOutput {
  matchedRule: string;
  replyText: string;
  latencyMs: number;
}

export interface InfraAnalyticsQueryInput {
  domain?: string;
  period?: "realtime" | "day" | "7d" | "30d" | "month";
  property?: "page" | "source" | "country" | "device";
}

export interface InfraAnalyticsQueryOutput {
  status: "SUCCESS" | "ERROR";
  domain: string;
  realtimeVisitors: number;
  stats: {
    visitors: number;
    pageviews: number;
    bounceRate: number;
    visitDuration: number;
    viewsPerVisit: number;
  };
  breakdown: Array<{
    property: string;
    visitors: number;
    percentage: number;
  }>;
}

export interface InfraAnalyticsBeaconVerifyInput {
  domain?: string;
}

export interface InfraAnalyticsBeaconVerifyOutput {
  domain: string;
  snippet: string;
  scriptEndpoint: string;
  ingestEndpoint: string;
  maxScriptSizeBytes: number;
  zeroPiiGuaranteed: boolean;
  compliant: boolean;
}

export interface InfraExperimentRouteInput {
  experimentId: string;
  subjectId: string;
  variants?: { key: string; name?: string; weight?: number }[];
}

export interface InfraExperimentRouteOutput {
  status: "ASSIGNED";
  experimentId: string;
  subjectId: string;
  assignedVariant: string;
  hashRatio: number;
}

export interface InfraWorkflowExecuteInput {
  workflowName: string;
  input: any;
  mockSleep?: boolean;
}

export interface InfraWorkflowExecuteOutput {
  status: "COMPLETED" | "FAILED";
  instanceId: string;
  workflowName: string;
  stepCount: number;
  output?: any;
  error?: string;
  durationMs: number;
}

export interface InfraMediaRenderInput {
  type: "card" | "code" | "formula";
  title?: string;
  subtitle?: string;
  bullets?: string[];
  theme?: "dark" | "light" | "paper" | "clay";
  aspectRatio?: "1:1" | "16:9" | "3:4" | "4:5";
  code?: string;
  language?: any;
  latex?: string;
}

export interface InfraMediaRenderOutput {
  status: "RENDERED";
  format: "svg";
  width: number;
  height: number;
  svgLength: number;
  svg: string;
}

export interface InfraMediaImageInput {
  prompt: string;
  seed?: number;
  style?: "swiss-grid" | "harmonic-waves" | "geometric-minimal" | "neural-mesh";
  theme?: "dark" | "light" | "paper" | "clay";
  aspectRatio?: "1:1" | "16:9" | "3:4" | "4:5";
  title?: string;
  signature?: string;
  useAiModel?: boolean;
  uploadToR2?: boolean;
}

export interface InfraMediaImageOutput {
  status: "GENERATED";
  format: "svg" | "png";
  width: number;
  height: number;
  svg?: string;
  r2Key?: string;
  r2Url?: string;
}

export interface InfraMediaVideoInput {
  title: string;
  durationSeconds?: number;
  theme?: "dark" | "light" | "paper" | "clay";
  aspectRatio?: "1:1" | "16:9" | "3:4" | "4:5";
  frames: Array<{
    timestampMs: number;
    title: string;
    subtitle?: string;
    badge?: string;
    elements?: string[];
  }>;
  uploadToR2?: boolean;
}

export interface InfraMediaVideoOutput {
  status: "GENERATED";
  format: "svg";
  frameCount: number;
  durationSeconds: number;
  animatedSvg: string;
  r2Key?: string;
  r2Url?: string;
}

export interface InfraMediaWorkflowActionInput {
  jobType: "card" | "code" | "formula" | "carousel" | "image" | "video";
  payload: any;
  rasterizeFormat?: "webp" | "png" | "pdf";
  targetR2Key?: string;
}

export interface InfraMediaWorkflowActionOutput {
  status: "COMPLETED" | "FAILED";
  instanceId: string;
  jobId: string;
  jobType: string;
  r2Key?: string;
  r2Url?: string;
  durationMs: number;
}


