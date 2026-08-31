/**
 * Plugin/Science MCP Protocol Server
 *
 * Exposes the 'science' 8-stage academic production lifecycle tool over JSON-RPC 2.0 stdio stream.
 */

import { scienceOperation } from "./operation.ts";
import { type ScienceInput } from "./core.ts";

export const SCIENCE_ACTIONS = [
  "paper_literature_search",
  "paper_citation_verify",
  "paper_methodology_audit",
  "grant_criteria_audit",
  "grant_aims_alignment",
  "grant_budget_calculator",
  "paper_structure_audit",
  "paper_latex_scaffold",
  "paper_peer_review_simulate",
  "journal_matcher",
  "journal_submission_checklist",
  "patent_novelty_check",
  "patent_claim_structure",
  "patent_spec_scaffold",
  "scholarly_impact_forecast",
  "social_science_peer_review_audit",
  "chinese_academic_formatter",
  "ssci_top_journal_matcher",
  "css_digital_trace_audit",
  "css_nlp_sentiment_trajectory",
  "css_causal_inference_did",
  "css_abm_simulation",
  "css_telemetry_preprocess",
  "css_nlp_sentiment_score",
  "css_topic_bertopic_cluster",
  "css_did_regression",
  "css_parallel_trends_test",
  "css_abm_step",
  "list_actions",
] as const;

export const SCIENCE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: SCIENCE_ACTIONS,
      description:
        "Science intelligence action across the 8 academic production lifecycle stages and Computational Social Science (CSS) modules: Stage 1 Literature ('paper_literature_search', 'paper_citation_verify'), Stage 2 Methodology ('paper_methodology_audit', 'css_digital_trace_audit', 'css_nlp_sentiment_trajectory', 'css_causal_inference_did', 'css_abm_simulation', 'css_telemetry_preprocess', 'css_nlp_sentiment_score', 'css_topic_bertopic_cluster', 'css_did_regression', 'css_parallel_trends_test', 'css_abm_step'), Stage 3 Grants ('grant_criteria_audit', 'grant_aims_alignment', 'grant_budget_calculator'), Stage 4 Authoring ('paper_structure_audit', 'paper_latex_scaffold', 'chinese_academic_formatter'), Stage 5 Peer Review ('paper_peer_review_simulate', 'social_science_peer_review_audit'), Stage 6 Journal Submission ('journal_matcher', 'journal_submission_checklist', 'ssci_top_journal_matcher'), Stage 7 Intellectual Property ('patent_novelty_check', 'patent_claim_structure', 'patent_spec_scaffold'), Stage 8 Scholarly Impact ('scholarly_impact_forecast'), and 'list_actions'.",
    },
    query: {
      type: "string",
      description: "Academic literature search query.",
    },
    doi: {
      type: "string",
      description: "Digital Object Identifier (DOI) for citation verification.",
    },
    bibtex: {
      type: "string",
      description: "Raw BibTeX entry string to validate and parse.",
    },
    citation_style: {
      type: "string",
      enum: ["apa", "ieee", "nature", "acm", "chicago"],
      description: "Citation formatting style.",
    },
    manuscript_title: {
      type: "string",
      description: "Title of manuscript for audit, review simulation, LaTeX scaffolding, or impact forecast.",
    },
    manuscript_text: {
      type: "string",
      description: "Full manuscript text or markdown.",
    },
    sections: {
      type: "object",
      description: "Key-value dictionary mapping section names to text.",
    },
    latex_template: {
      type: "string",
      enum: ["acm", "ieee", "nature"],
      description: "LaTeX template type to generate ('acm' for SIGCONF, 'ieee' for Transactions/Journals).",
    },
    methodology_data: {
      type: "object",
      description: "Methodology parameters (sample_size, treatment_mean, control_mean, pooled_std, baselines).",
    },
    grant_abstract: {
      type: "string",
      description: "Grant proposal abstract.",
    },
    funding_agency: {
      type: "string",
      enum: ["NIH", "NSF", "ERC", "DARPA", "DOE"],
      description: "Target funding agency.",
    },
    direct_costs: {
      type: "object",
      description: "Direct costs breakdown (personnel, equipment, supplies, travel, subawards_over_25k, participant_support, other).",
    },
    fringe_rate_percent: {
      type: "number",
      description: "Personnel fringe benefits rate percentage (default: 28%).",
    },
    indirect_rate_percent: {
      type: "number",
      description: "F&A indirect cost rate percentage (default: 52%).",
    },
    duration_years: {
      type: "integer",
      description: "Project duration in years.",
    },
    annual_escalation_percent: {
      type: "number",
      description: "Annual cost-of-living and merit escalation rate percentage (default: 3%).",
    },
    aims: {
      type: "array",
      items: { type: "string" },
      description: "Specific Aims statements.",
    },
    field_of_study: {
      type: "string",
      description: "Scientific field of study.",
    },
    desired_impact_factor_min: {
      type: "number",
      description: "Minimum target journal Impact Factor.",
    },
    target_review_weeks_max: {
      type: "number",
      description: "Maximum acceptable average review turnaround time in weeks.",
    },
    open_access_preference: {
      type: "string",
      enum: ["Gold", "Green", "Hybrid", "Closed", "Diamond", "Any"],
      description: "Open Access publication model preference.",
    },
    invention_title: {
      type: "string",
      description: "Title of invention for patent novelty audit or spec scaffolding.",
    },
    invention_summary: {
      type: "string",
      description: "Invention summary or patent claim narrative.",
    },
    claims_text: {
      type: "string",
      description: "Draft patent claims text.",
    },
    claims_list: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claimNumber: { type: "integer" },
          text: { type: "string" },
          type: { type: "string", enum: ["independent", "dependent"] },
          dependsOnClaim: { type: "integer" },
        },
      },
      description: "List of structured patent claims for antecedent basis verification.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      description: "Max results to return.",
    },
    target_cssci_journal: {
      type: "string",
      description: "Target Chinese CSSCI journal name (e.g., '《中国社会科学》', '《社会学研究》', '《心理学报》', '《管理世界》', '《新闻与传播研究》').",
    },
    target_ssci_journal: {
      type: "string",
      description: "Target SSCI Q1 journal name (e.g., 'Nature Human Behaviour', 'Computers in Human Behavior', 'New Media & Society').",
    },
    social_science_field: {
      type: "string",
      description: "Social science field of study ('Sociology', 'Psychology', 'Communication', 'Management', 'Interdisciplinary').",
    },
    empirical_data: {
      type: "object",
      description: "Empirical triangulation metadata (survey_sample_size, interview_count, fieldwork_duration_months, mixed_methods, common_method_bias_checked, theoretical_saturation).",
    },
    chinese_paper: {
      type: "object",
      description: "Chinese academic manuscript structure (title, english_title, clc_code, document_code, fund_project, author_bio, headings, chinese_abstract, chinese_keywords, references).",
    },
    word_count_limit_max: {
      type: "integer",
      description: "Maximum allowable manuscript word count for SSCI matching.",
    },
    css_telemetry_events: {
      type: "array",
      items: { type: "object" },
      description: "Digital telemetry event traces for preprocessing or digital trace audit (eventId, userId, timestamp, eventType, durationSeconds).",
    },
    css_nlp_corpus: {
      type: "array",
      items: { type: "object" },
      description: "Conversational corpus for BERTopic dynamic topic modeling & sentiment valence trajectory.",
    },
    css_snippets: {
      type: "array",
      items: { type: "object" },
      description: "Text snippets for atomic NLP sentiment scoring or BERTopic topic clustering.",
    },
    css_did_data: {
      type: "object",
      description: "Difference-in-Differences panel and estimation data (treated_post_mean, treated_pre_mean, control_post_mean, control_pre_mean, sample_size, panels).",
    },
    css_event_study_leads: {
      type: "array",
      items: { type: "object" },
      description: "Event-study lead and lag coefficients for pre-treatment parallel trends testing.",
    },
    css_abm_params: {
      type: "object",
      description: "Agent-Based Modeling parameters (agent_count, steps, feedback_strength, intervention_rate, decay_lambda, baseline_intimacy).",
    },
    css_abm_agents: {
      type: "array",
      items: { type: "object" },
      description: "Current agent population states for discrete ABM simulation step.",
    },
    css_step_number: {
      type: "integer",
      description: "Discrete step number for ABM simulation step.",
    },
  },
} as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export async function handleScienceRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = request.id ?? null;

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "mentalcraft-science-mcp",
          version: "1.0.0",
        },
      },
    };
  }

  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "science",
            description:
              "MentalCraft Academic Production 8-Stage Lifecycle & Research Intelligence Engine (Literature, Methodology, Grant rubrics, Manuscript authoring, Peer review simulation, Journal IF matching, Patent claims, Scholarly impact).",
            inputSchema: SCIENCE_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    const toolName = params?.name;
    const args = params?.arguments ?? {};

    if (toolName !== "science") {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${toolName ?? "undefined"}`,
        },
      };
    }

    try {
      const output = await scienceOperation(args as unknown as ScienceInput);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
            },
          ],
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`,
    },
  };
}

export function startScienceMcpServer() {
  let buffer = "";
  process.stdin.setEncoding("utf-8");

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const req = JSON.parse(trimmed) as JsonRpcRequest;
        const res = await handleScienceRpc(req);
        process.stdout.write(JSON.stringify(res) + "\n");
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          }) + "\n"
        );
      }
    }
  });
}

if (import.meta.main) {
  startScienceMcpServer();
}
