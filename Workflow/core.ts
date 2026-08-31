/**
 * Plugin/Workflow Core - Cross-Plugin Orchestration, Health & Diagnostics Engine
 *
 * Symmetrical capability engine for coordinating multi-plugin DAG pipelines,
 * pre-flight health diagnostics, custom pipeline registration, and IDE configuration exports.
 */

export const WORKFLOW_PROTOCOL = "holar.workflow.v1" as const;

export type PluginId = "chrome" | "design" | "business" | "science" | "message" | "secret" | "workflow";

export type HealthStatus = "healthy" | "degraded" | "unreachable";

export type PluginHealthReport = {
  pluginId: PluginId;
  name: string;
  status: HealthStatus;
  latencyMs: number;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
};

export type SystemHealthReport = {
  timestamp: string;
  overallStatus: HealthStatus;
  healthScore: number; // 0-100
  totalPlugins: number;
  healthyPlugins: number;
  plugins: Record<PluginId, PluginHealthReport>;
};

export type WorkflowId =
  | "launch_product_campaign"
  | "academic_paper_to_journal_submission"
  | "grant_proposal_lifecycle"
  | "patent_invention_pipeline"
  | "venture_growth_lifecycle"
  | "shop_ecommerce_lifecycle"
  | "ecommerce_full_launch_pipeline"
  | "academic_manuscript_complete_lifecycle"
  | "startup_pmf_and_scale_sprint"
  | "spriteflow_10k_mrr_growth_pipeline"
  | "social_science_top_journal_pipeline"
  | "zero_cost_bootstrap_engine"
  | "automated_revenue_monitor"
  | "design_system_audit_pipeline"
  | (string & {});

export type WorkflowStep = {
  step: number;
  plugin: PluginId;
  action: string;
  description: string;
  dependsOn?: number[];
  parameters?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  id: WorkflowId;
  name: string;
  description: string;
  requiredPlugins: PluginId[];
  steps: WorkflowStep[];
  concurrencyMode?: "sequential" | "concurrent_dag";
};

export type WorkflowSpan = {
  name: string;
  plugin: PluginId;
  action: string;
  step: number;
  startOffsetMs: number;
  durationMs: number;
  status: "OK" | "ERROR";
};

export type WorkflowRunReceipt = {
  runId: string;
  workflowId: WorkflowId;
  workflowName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  success: boolean;
  stepsCount: number;
  executionMode: "sequential" | "concurrent_dag";
  stepResults: Array<{
    step: number;
    plugin: PluginId;
    action: string;
    success: boolean;
    durationMs: number;
    data: unknown;
  }>;
  spans?: WorkflowSpan[];
};

export type ClientTargetConfig = "claude_desktop" | "cursor" | "antigravity" | "pi" | "all";

export type ExportConfigResult = {
  target: ClientTargetConfig;
  configs: Record<string, unknown>;
  commandInstructions: string[];
};

export const BUILTIN_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "launch_product_campaign",
    name: "Autonomous Product Campaign Launch",
    description: "Commercial validation: Keyword research & Stripe revenue benchmark → Svelte 5 landing page UI → Chrome live visual/vitals audit.",
    requiredPlugins: ["business", "design", "chrome"],
    steps: [
      { step: 1, plugin: "business", action: "seo_keyword_difficulty", description: "Evaluate search volume & low-hanging fruit ranking opportunities." },
      { step: 2, plugin: "business", action: "market_stripe_radar", description: "Benchmark revenue tiers of top competitors in the niche." },
      { step: 3, plugin: "design", action: "generate_ui", description: "Synthesize Svelte 5 Runes marketing hero and pricing table." },
      { step: 4, plugin: "design", action: "audit_ui", description: "Audit generated code against A11y and OKLCH color tokens." },
      { step: 5, plugin: "chrome", action: "navigate", description: "Load the deployed preview page in an isolated browser context." },
      { step: 6, plugin: "chrome", action: "profile_vitals", description: "Verify LCP, CLS, and FID performance scores." },
    ],
  },
  {
    id: "academic_paper_to_journal_submission",
    name: "Academic Paper to Journal Submission Pipeline",
    description: "Academic lifecycle: Literature discovery & citation verification → Manuscript structure audit → Target journal matching → Camera-ready checklist.",
    requiredPlugins: ["science"],
    steps: [
      { step: 1, plugin: "science", action: "paper_literature_search", description: "Search prior literature and identify state-of-the-art benchmarks." },
      { step: 2, plugin: "science", action: "paper_citation_verify", description: "Verify DOI citations and generate valid BibTeX records." },
      { step: 3, plugin: "science", action: "paper_structure_audit", description: "Audit manuscript section completeness and word count." },
      { step: 4, plugin: "science", action: "journal_matcher", description: "Match target journal venues based on Impact Factor and acceptance rates." },
      { step: 5, plugin: "science", action: "journal_submission_checklist", description: "Perform camera-ready submission compliance checklist." },
    ],
  },
  {
    id: "grant_proposal_lifecycle",
    name: "NIH/NSF Research Grant Proposal & Budgeting Pipeline",
    description: "Grant lifecycle: 5-dimension rubric criteria audit → Specific Aims independence matrix → Multi-year MTDC budget calculation.",
    requiredPlugins: ["science"],
    steps: [
      { step: 1, plugin: "science", action: "grant_criteria_audit", description: "Evaluate grant proposal against NIH/NSF review rubrics (1.0-9.0 score)." },
      { step: 2, plugin: "science", action: "grant_aims_alignment", description: "Verify Specific Aims independence and funding priority alignment." },
      { step: 3, plugin: "science", action: "grant_budget_calculator", description: "Calculate multi-year direct costs, fringe benefits, and F&A indirect expenses." },
    ],
  },
  {
    id: "patent_invention_pipeline",
    name: "Patent Novelty & Claim Specification Pipeline",
    description: "Patent lifecycle: USPTO/WIPO prior art search & novelty scoring → Independent/dependent claim tree structure → Patent specification scaffolding.",
    requiredPlugins: ["science"],
    steps: [
      { step: 1, plugin: "science", action: "patent_novelty_check", description: "Search prior art databases and compute 35 U.S.C. statutory factor scores." },
      { step: 2, plugin: "science", action: "patent_claim_structure", description: "Validate independent and dependent claims tree and antecedent basis." },
      { step: 3, plugin: "science", action: "patent_spec_scaffold", description: "Scaffold formal patent specification document with preferred embodiments." },
    ],
  },
  {
    id: "venture_growth_lifecycle",
    name: "Full-Cycle Business Venture Growth & Unit Economics Engine",
    description: "Venture lifecycle: Market TAM/SAM/SOM validation → Multi-channel acquisition audit → CAC/LTV unit economics → D1/D7/D30 retention curves → Price elasticity → 90-day playbook.",
    requiredPlugins: ["business"],
    steps: [
      { step: 1, plugin: "business", action: "venture_market_validation", description: "Validate venture viability, TAM/SAM/SOM market size, and monetization model." },
      { step: 2, plugin: "business", action: "venture_acquisition_audit", description: "Audit primary acquisition channel across SEO (Web), ASO (App), or Steam (Game)." },
      { step: 3, plugin: "business", action: "venture_unit_economics", description: "Model CAC, LTV, LTV/CAC ratio, payback months, and gross margins." },
      { step: 4, plugin: "business", action: "venture_retention_curves", description: "Model D1/D7/D30 cohort retention curves against industry benchmarks." },
      { step: 5, plugin: "business", action: "venture_pricing_experiment", description: "Simulate price elasticity curve to maximize expected revenue per visitor." },
      { step: 6, plugin: "business", action: "venture_growth_playbook", description: "Synthesize 90-day execution sprint roadmap." },
    ],
  },
  {
    id: "shop_ecommerce_lifecycle",
    name: "Full-Cycle E-Commerce & Shop Commercialization Pipeline",
    description: "Shop lifecycle: E-commerce TAM/SAM/SOM → TikTok/Amazon acquisition audit → Cart/Checkout activation funnel → COGS/3PL unit economics → 30/60/90-day repurchase retention → Volume tiering → Inventory ROP safety stock.",
    requiredPlugins: ["business"],
    steps: [
      { step: 1, plugin: "business", action: "venture_market_validation", description: "Validate e-commerce market size, sourcing feasibility, and omnichannel strategy." },
      { step: 2, plugin: "business", action: "venture_acquisition_audit", description: "Audit TikTok Shop creator affiliates, Google Shopping, and Amazon PPC ROAS." },
      { step: 3, plugin: "business", action: "venture_activation_funnel", description: "Audit Add-to-Cart (ATC), Initiate Checkout, and abandonment recovery flows." },
      { step: 4, plugin: "business", action: "venture_unit_economics", description: "Calculate COGS, 3PL shipping, gateway fees, blended ROAS, and net margin." },
      { step: 5, plugin: "business", action: "venture_retention_curves", description: "Track 30/60/90-day repurchase retention and VIP customer lifetime value." },
      { step: 6, plugin: "business", action: "venture_pricing_experiment", description: "Optimize bundle packaging, volume tiering, and AOV boost elasticity." },
      { step: 7, plugin: "business", action: "venture_expansion_moat", description: "Calculate inventory reorder point (ROP), safety stock, and 3PL moats." },
      { step: 8, plugin: "business", action: "venture_growth_playbook", description: "Generate 90-day omnichannel e-commerce launch sprint roadmap." },
    ],
  },
  {
    id: "ecommerce_full_launch_pipeline",
    name: "End-to-End E-Commerce Full Launch Pipeline",
    description: "Full-cycle e-commerce launch: Market validation (Shop) ➔ Svelte 5 PDP UI synthesis ➔ COGS/3PL unit economics ➔ Inventory ROP safety stock ➔ Telegram launch alert.",
    requiredPlugins: ["business", "design", "message"],
    steps: [
      { step: 1, plugin: "business", action: "venture_market_validation", description: "Validate e-commerce market viability, TAM/SAM/SOM, and omnichannel sourcing strategy." },
      { step: 2, plugin: "design", action: "generate_ui", description: "Synthesize high-converting e-commerce PDP (Product Detail Page) Svelte 5 component with runes." },
      { step: 3, plugin: "business", action: "venture_unit_economics", description: "Calculate COGS, 3PL warehousing, merchant gateway fees, blended ROAS, and net margin." },
      { step: 4, plugin: "business", action: "venture_expansion_moat", description: "Calculate inventory Reorder Point (ROP = LTD + SS), safety stock, and supply chain moats." },
      { step: 5, plugin: "message", action: "send", description: "Dispatch automated launch readiness and inventory notification to Telegram channel." },
    ],
  },
  {
    id: "academic_manuscript_complete_lifecycle",
    name: "Academic Manuscript Complete Lifecycle Pipeline",
    description: "Full-cycle academic production: Citation verify & BibTeX ➔ Methodology Cohen's d audit ➔ LaTeX scaffold ➔ Multi-reviewer peer review simulation ➔ Target journal matcher ➔ Camera-ready checklist.",
    requiredPlugins: ["science"],
    steps: [
      { step: 1, plugin: "science", action: "paper_citation_verify", description: "Verify DOI citations, bibliography integrity, and generate valid BibTeX records." },
      { step: 2, plugin: "science", action: "paper_methodology_audit", description: "Audit empirical methodology, sample size power, Cohen's d effect size, and baseline controls." },
      { step: 3, plugin: "science", action: "paper_latex_scaffold", description: "Scaffold publication-ready LaTeX manuscript structure and SIGCONF/IEEE templates." },
      { step: 4, plugin: "science", action: "paper_peer_review_simulate", description: "Simulate rigorous 3-reviewer peer review with constructive critiques, scores, and accept probability." },
      { step: 5, plugin: "science", action: "journal_matcher", description: "Match target journal venues based on Impact Factor, review turnaround time, and Open Access model." },
      { step: 6, plugin: "science", action: "journal_submission_checklist", description: "Verify camera-ready submission compliance, reproducibility checklist, and ethics declarations." },
    ],
  },
  {
    id: "startup_pmf_and_scale_sprint",
    name: "Startup PMF Validation & Scale Sprint Pipeline",
    description: "Full-cycle startup sprint: Sean Ellis PMF survey ➔ Activation funnel audit ➔ D1/D7/D30 retention curves ➔ Pricing elasticity experiment ➔ 90-day growth playbook.",
    requiredPlugins: ["business"],
    steps: [
      { step: 1, plugin: "business", action: "venture_pmf_validation", description: "Calculate Sean Ellis 40% PMF score and qualitative user feedback clusters." },
      { step: 2, plugin: "business", action: "venture_activation_funnel", description: "Audit visitor-to-signup and signup-to-activation conversion bottlenecks and Time-to-Value." },
      { step: 3, plugin: "business", action: "venture_retention_curves", description: "Evaluate D1, D7, and D30 cohort retention curves against SaaS industry benchmarks." },
      { step: 4, plugin: "business", action: "venture_pricing_experiment", description: "Simulate price elasticity curve to optimize Average Revenue Per User (ARPU) and revenue per visitor." },
      { step: 5, plugin: "business", action: "venture_growth_playbook", description: "Synthesize 90-day execution sprint roadmap with sequenced acquisition, activation, and monetization milestones." },
    ],
  },
  {
    id: "automated_revenue_monitor",
    name: "Automated Competitor Revenue & Alert Monitor",
    description: "Track Stripe billing trajectory and dispatch milestone notifications to Telegram.",
    requiredPlugins: ["business", "message"],
    steps: [
      { step: 1, plugin: "business", action: "market_site_trajectory", description: "Fetch latest month-over-month checkout referral growth." },
      { step: 2, plugin: "message", action: "send", description: "Dispatch encrypted summary message to designated bot channel." },
    ],
  },
  {
    id: "spriteflow_10k_mrr_growth_pipeline",
    name: "SpriteFlow $10,000 MRR Zero-Cost Growth Pipeline",
    description: "End-to-end $10k MRR growth pipeline: 120-keyword pSEO matrix → 12-month cohort MRR economics → Svelte 5 pricing funnel → 5 zero-cost viral loops (K=1.25).",
    requiredPlugins: ["business", "design"],
    steps: [
      { step: 1, plugin: "business", action: "spriteflow_pseo_matrix", description: "Generate 120 curated low-KD programmatic SEO keyword targets across Godot, Unity, Aseprite." },
      { step: 2, plugin: "business", action: "spriteflow_mrr_engine", description: "Model $10,000 MRR milestone with 420 Pro ($19/mo) + 25 Studio ($79/mo) cohorts and LTV $542.86." },
      { step: 3, plugin: "design", action: "generate_ui", description: "Generate high-converting Svelte 5 pricing table and checkout funnel." },
      { step: 4, plugin: "business", action: "zero_cost_viral_loops", description: "Synthesize 5 zero-cost viral loops (GitHub bridge, Itch.io packs, Reddit/HN deep dives, tutorials)." },
      { step: 5, plugin: "business", action: "venture_monetization_telemetry", description: "Track real-time Stripe telemetry and churn decay." },
    ],
  },
  {
    id: "social_science_top_journal_pipeline",
    name: "Top Social Science Journal (CSSCI & SSCI Q1) Publication Pipeline",
    description: "Publication pipeline: CSSCI/SSCI peer review audit → GB/T 7714 & Chinese heading formatting → SSCI Q1 journal matching → 3-reviewer panel simulation & rebuttal matrix.",
    requiredPlugins: ["science"],
    steps: [
      { step: 1, plugin: "science", action: "social_science_peer_review_audit", description: "Audit theoretical conceptualization, empirical triangulation, and ethical reflexivity." },
      { step: 2, plugin: "science", action: "chinese_academic_formatter", description: "Format manuscript to GB/T 7714-2015 citation and Chinese hierarchical heading standards." },
      { step: 3, plugin: "science", action: "ssci_top_journal_matcher", description: "Match top SSCI Q1 journals (Nature Human Behaviour, Computers in Human Behavior, New Media & Society)." },
      { step: 4, plugin: "science", action: "paper_peer_review_simulate", description: "Simulate 3-reviewer diverse blind review panel and generate score matrix." },
      { step: 5, plugin: "science", action: "journal_submission_checklist", description: "Perform 8-point camera-ready pre-submission compliance audit." },
    ],
  },
  {
    id: "zero_cost_bootstrap_engine",
    name: "Zero-Cost Bootstrap & Organic PLG Engine ($0 Spend)",
    description: "Zero paid marketing engine: Viral K-factor loops → Programmatic SEO difficulty ranking → Organic domain traffic forensics → Telemetry monitoring.",
    requiredPlugins: ["business"],
    steps: [
      { step: 1, plugin: "business", action: "zero_cost_viral_loops", description: "Deploy 5 self-sustaining viral loops (GitHub, Itch.io, Reddit/HN, Bilibili, Web sandbox)." },
      { step: 2, plugin: "business", action: "seo_batch_keywords", description: "Rank low-KD high-intent organic search terms for programmatic expansion." },
      { step: 3, plugin: "business", action: "product_traction_score", description: "Calculate multidimensional product traction and viral affordance." },
      { step: 4, plugin: "business", action: "venture_growth_playbook", description: "Generate 90-day zero-cost organic sprint roadmap." },
    ],
  },
  {
    id: "design_system_audit_pipeline",
    name: "Design System & A11y Compliance Pipeline",
    description: "Audit template code for tokens, resolve minimal subpath imports, and verify DOM tokens via Chrome.",
    requiredPlugins: ["design", "chrome"],
    steps: [
      { step: 1, plugin: "design", action: "audit_ui", description: "Lint template code against hardcoded hex and raw buttons." },
      { step: 2, plugin: "design", action: "resolve_imports", description: "Calculate optimal tree-shaken on-demand subpaths." },
      { step: 3, plugin: "chrome", action: "inspect_element", description: "Verify live DOM element against design tokens." },
    ],
  },
];

export type ActionMetric = {
  calls: number;
  successes: number;
  failures: number;
  totalDurationMs: number;
  avgDurationMs: number;
  p95DurationMs: number;
  circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
};

export type SystemTelemetryReport = {
  timestamp: string;
  uptimeSeconds: number;
  totalInvocations: number;
  overallSuccessRate: number;
  metricsByAction: Record<string, ActionMetric>;
};

export type SubsystemBenchmarkResult = {
  subsystem: PluginId;
  action: string;
  label: string;
  iterations: number;
  totalDurationMs: number;
  opsPerSec: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
};

export type BenchmarkSuiteResult = {
  timestamp: string;
  totalSubsystems: number;
  totalActionsTested: number;
  totalIterations: number;
  totalDurationMs: number;
  overallOpsPerSec: number;
  subsystems: Record<string, SubsystemBenchmarkResult[]>;
  summary: {
    fastestAction: { label: string; p50Ms: number; opsPerSec: number };
    slowestAction: { label: string; p50Ms: number; opsPerSec: number };
    avgP50Ms: number;
    avgP90Ms: number;
    avgP99Ms: number;
  };
};

export type WorkflowAction =
  | "list_workflows"
  | "run_workflow"
  | "register_workflow"
  | "get_workflow_history"
  | "export_config"
  | "install_mcp_schemas"
  | "export_schema_catalog"
  | "export_openapi_catalog"
  | "export_openrpc_spec"
  | "export_openapi_spec"
  | "benchmark"
  | "get_metrics"
  | "export_trace"
  | "export_mermaid_dag"
  | "batch_run"
  | "health_check"
  | "dry_run";

export type WorkflowInput = {
  action: WorkflowAction;
  workflow_id?: WorkflowId;
  target_plugin?: PluginId | "all";
  custom_workflow?: {
    id: string;
    name: string;
    description: string;
    requiredPlugins: PluginId[];
    steps: WorkflowStep[];
  };
  tasks?: Array<{ id: string; plugin: PluginId; action: string; parameters?: Record<string, unknown> }>;
  concurrency?: number;
  client_target?: ClientTargetConfig;
  parameters?: Record<string, unknown>;
  benchmark_options?: {
    iterations?: number;
    warmupIterations?: number;
    subsystems?: PluginId[];
  };
};

export type WorkflowResult = {
  protocol: typeof WORKFLOW_PROTOCOL;
  action: WorkflowAction;
  success: boolean;
  timestamp: string;
  data: unknown;
  diagnostics?: string[];
};

export function formatWorkflowSummary(result: WorkflowResult): string {
  if (!result.success) {
    return `✗ Workflow ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_workflows": {
      const data = result.data as { total: number; workflows: Array<{ name: string; id: string }> };
      return `Workflows (${data.total}): ${data.workflows.map((w) => w.id).join(", ")}`;
    }
    case "health_check": {
      const data = result.data as SystemHealthReport;
      return `System Health: ${data.healthScore}/100 [${data.overallStatus.toUpperCase()}] (${data.healthyPlugins}/${data.totalPlugins} plugins healthy)`;
    }
    case "dry_run": {
      const data = result.data as { workflow: { name: string }; plan: Array<{ plugin: string; action: string }> };
      return `Dry Run [${data.workflow.name}]: Plan ${data.plan.map((p) => `${p.plugin}.${p.action}`).join(" ➔ ")}`;
    }
    case "register_workflow": {
      const data = result.data as any;
      return `✓ Registered Workflow "${data.name}" (${data.registeredId}) with ${data.stepsCount} steps`;
    }
    case "get_workflow_history": {
      const data = result.data as any;
      return `Workflow History: ${data.totalRuns} total runs recorded`;
    }
    case "export_config": {
      const data = result.data as any;
      return `Exported MCP Client Config for [${data.target}]: ${Object.keys(data.configs.mcpServers ?? {}).length} servers configured`;
    }
    case "install_mcp_schemas": {
      const data = result.data as any;
      return `✓ Installed ${data.installedCount} MCP schemas to Antigravity directory (${data.installedPaths.length} tools registered)`;
    }
    case "export_schema_catalog":
    case "export_openrpc_spec": {
      const data = result.data as any;
      return `OpenRPC ${data.openrpc ?? "1.3.2"}: ${data.methods?.length ?? data.totalMethods ?? 0} methods across ${data.totalPlugins ?? data.servers?.length ?? 6} subsystems`;
    }
    case "export_openapi_catalog":
    case "export_openapi_spec": {
      const data = result.data as any;
      return `OpenAPI ${data.openapi ?? "3.1.0"}: ${Object.keys(data.paths ?? {}).length} paths registered (${data.info?.title})`;
    }
    case "benchmark": {
      const data = result.data as BenchmarkSuiteResult;
      return `⚡ Latency Benchmark: ${data.totalActionsTested} actions across ${data.totalSubsystems} subsystems (${data.overallOpsPerSec.toLocaleString()} ops/sec | avg P50: ${data.summary.avgP50Ms}ms | avg P99: ${data.summary.avgP99Ms}ms)`;
    }
    case "get_metrics": {
      const data = result.data as any;
      return `Telemetry: ${data.totalInvocations} total calls (${data.overallSuccessRate}% success) | ${Object.keys(data.metricsByAction).length} actions tracked`;
    }
    case "export_trace": {
      const data = result.data as any;
      return `Trace Export: ${data.tracesCount} traces, ${data.totalSpans} spans formatted (${data.format})`;
    }
    case "export_mermaid_dag": {
      const data = result.data as any;
      return `Mermaid Graph [${data.workflowId}]: ${data.nodesCount} nodes, ${data.edgesCount} edges generated`;
    }
    case "batch_run": {
      const data = result.data as any;
      return `✓ Batch Execution: ${data.successful}/${data.total} tasks succeeded (${data.durationMs}ms)`;
    }
    case "run_workflow": {
      const data = result.data as any;
      return `✓ Workflow [${data.workflowName ?? data.name}]: All ${data.stepsCount ?? data.executedStepsCount} steps completed (${data.durationMs ?? 0}ms)`;
    }
  }
}

export const compactWorkflowResult = formatWorkflowSummary;

