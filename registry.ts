/**
 * Plugin Registry & Metadata Hub
 *
 * Central registry coordinating all 6 first-class capability plugins:
 * - Chrome (Browser Automation & Visual HUD)
 * - Design (5-Layer Design System & UI Intelligence)
 * - Business (SEO, Stripe Radar & Traction Scoring)
 * - Science (Psychometrics, Crisis Safety & Academic Research)
 * - Message (Inter-Agent Multi-Channel Bus)
 * - Secret (Local Credential Vault)
 */

export type PluginId = "chrome" | "design" | "business" | "science" | "message" | "secret";

export type PluginDescriptor = {
  id: PluginId;
  name: string;
  version: string;
  pillar: "Core Tooling" | "Business & Product" | "Science & Research" | "Agent Infrastructure";
  description: string;
  actionsCount: number;
  actions: string[];
  mcpToolName: string;
  hasPiAdapter: boolean;
  hasMcpServer: boolean;
};

export const PLUGIN_REGISTRY: Record<PluginId, PluginDescriptor> = {
  chrome: {
    id: "chrome",
    name: "Chrome Automation & Native Bridge",
    version: "1.0.0",
    pillar: "Core Tooling",
    description: "Inactive-tab driving, screencast/video recording, semantic snapshots, visual annotations, Web Vitals profiling, and CDP actions.",
    actionsCount: 38,
    actions: [
      "launch", "navigate", "click", "fill", "inspect_element", "take_screenshot",
      "drag_and_drop", "upload_file", "set_storage", "read_storage", "clear_storage",
      "eval_script", "emulate_device", "watch_console", "watch_network", "profile_vitals"
    ],
    mcpToolName: "chrome",
    hasPiAdapter: true,
    hasMcpServer: true,
  },
  design: {
    id: "design",
    name: "Design System & UI Intelligence",
    version: "1.0.0",
    pillar: "Core Tooling",
    description: "5-layer architecture governance, component schema catalog, OKLCH token export, Svelte 5 runes UI generation, on-demand subpaths, and domain presets.",
    actionsCount: 10,
    actions: [
      "list_layers", "catalog", "inspect_component", "theme_tokens", "generate_ui",
      "audit_ui", "bridge_chrome", "resolve_imports", "domain_presets", "bundle_optimize"
    ],
    mcpToolName: "design",
    hasPiAdapter: true,
    hasMcpServer: true,
  },
  business: {
    id: "business",
    name: "Business & Market Intelligence",
    version: "1.0.0",
    pillar: "Business & Product",
    description: "Multi-provider commercial intelligence (Gefei SEO + TrafficCV + Traction Rank): Google KD 0-100, TrafficCV web traffic visits, channels, geo, Stripe Radar revenue leaderboards, and product traction indexing.",
    actionsCount: 11,
    actions: [
      "seo_keyword_difficulty", "seo_batch_keywords", "seo_link_budget",
      "market_stripe_radar", "market_site_trajectory", "market_niche_discovery",
      "traffic_domain_overview", "traffic_channel_breakdown", "traffic_geo_distribution",
      "traffic_competitor_comparison", "product_traction_score", "list_actions"
    ],
    mcpToolName: "business",
    hasPiAdapter: true,
    hasMcpServer: true,
  },
  science: {
    id: "science",
    name: "Science & Research Intelligence",
    version: "1.0.0",
    pillar: "Science & Research",
    description: "Clinical psychometric scoring (GAD-7, PHQ-9), suicidal ideation crisis safety protocol, academic literature discovery, patent novelty audits, and grant rubrics.",
    actionsCount: 7,
    actions: [
      "score_scale", "crisis_boundary_check", "search_literature",
      "verify_citation", "patent_novelty_check", "grant_criteria_audit", "list_actions"
    ],
    mcpToolName: "science",
    hasPiAdapter: true,
    hasMcpServer: true,
  },
  message: {
    id: "message",
    name: "Agent Message Bus",
    version: "1.0.0",
    pillar: "Agent Infrastructure",
    description: "Multi-channel priority dispatching (Telegram > iMessage > Email), cross-session bot rename self-healing, and atomic mailbox polling.",
    actionsCount: 3,
    actions: ["send", "poll", "status"],
    mcpToolName: "message",
    hasPiAdapter: true,
    hasMcpServer: true,
  },
  secret: {
    id: "secret",
    name: "Local Credential Vault",
    version: "1.0.0",
    pillar: "Agent Infrastructure",
    description: "Zero-leakage local filesystem authority verification with mode-0600 isolation.",
    actionsCount: 2,
    actions: ["read_credential", "verify_vault"],
    mcpToolName: "secret",
    hasPiAdapter: false,
    hasMcpServer: false,
  },
};

export type CompoundWorkflowId =
  | "launch_product_campaign"
  | "clinical_study_to_screener"
  | "automated_revenue_monitor";

export type CompoundWorkflow = {
  id: CompoundWorkflowId;
  name: string;
  description: string;
  participatingPlugins: PluginId[];
  pipelineSteps: Array<{
    step: number;
    plugin: PluginId;
    action: string;
    description: string;
  }>;
};

export const COMPOUND_WORKFLOWS: CompoundWorkflow[] = [
  {
    id: "launch_product_campaign",
    name: "Autonomous Product Campaign Launch",
    description: "End-to-end commercial validation: Keyword research & Stripe benchmark → Svelte 5 landing page UI → Chrome live audit.",
    participatingPlugins: ["business", "design", "chrome"],
    pipelineSteps: [
      { step: 1, plugin: "business", action: "seo_keyword_difficulty", description: "Evaluate search volume & low-hanging fruit ranking opportunities." },
      { step: 2, plugin: "business", action: "market_stripe_radar", description: "Benchmark revenue tiers of top competitors in the niche." },
      { step: 3, plugin: "design", action: "generate_ui", description: "Synthesize Svelte 5 Runes marketing hero and pricing table." },
      { step: 4, plugin: "design", action: "audit_ui", description: "Audit generated code against A11y and OKLCH color tokens." },
      { step: 5, plugin: "chrome", action: "navigate", description: "Load the deployed preview page in an isolated browser context." },
      { step: 6, plugin: "chrome", action: "profile_vitals", description: "Verify LCP, CLS, and FID performance scores." },
    ],
  },
  {
    id: "clinical_study_to_screener",
    name: "Clinical Scale to Interactive Screener Pipeline",
    description: "Scientific validation: Psychometric scoring & crisis boundary check → Scaffold Svelte 5 Screener block → Responsive audit.",
    participatingPlugins: ["science", "design", "chrome"],
    pipelineSteps: [
      { step: 1, plugin: "science", action: "score_scale", description: "Verify scale severity algorithms and clinical cutoffs." },
      { step: 2, plugin: "science", action: "crisis_boundary_check", description: "Ensure 988 emergency hotline safeguard protocol is active." },
      { step: 3, plugin: "design", action: "domain_presets", description: "Scaffold the 'clinical' domain preset with Screener and Questionnaire." },
      { step: 4, plugin: "design", action: "resolve_imports", description: "Optimize on-demand imports for sub-15KB client footprint." },
      { step: 5, plugin: "chrome", action: "inspect_element", description: "Audit live DOM focus rings, touch targets, and mobile ergonomics." },
    ],
  },
  {
    id: "automated_revenue_monitor",
    name: "Automated Competitor Revenue & Alert Monitor",
    description: "Track Stripe billing trajectory and dispatch milestone notifications to Telegram.",
    participatingPlugins: ["business", "message"],
    pipelineSteps: [
      { step: 1, plugin: "business", action: "market_site_trajectory", description: "Fetch latest month-over-month checkout referral growth." },
      { step: 2, plugin: "message", action: "send", description: "Dispatch encrypted summary message to designated bot channel." },
    ],
  },
];
