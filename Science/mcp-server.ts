/**
 * Plugin/Science MCP Protocol Server
 *
 * Exposes the 'science' academic production lifecycle tool over JSON-RPC 2.0 stdio stream.
 */

import { scienceOperation } from "./operation.ts";
import { type ScienceInput } from "./core.ts";

export const SCIENCE_ACTIONS = [
  "paper_literature_search",
  "paper_citation_verify",
  "paper_structure_audit",
  "paper_peer_review_simulate",
  "paper_latex_scaffold",
  "grant_criteria_audit",
  "grant_budget_calculator",
  "grant_aims_alignment",
  "journal_matcher",
  "journal_submission_checklist",
  "patent_novelty_check",
  "patent_claim_structure",
  "patent_spec_scaffold",
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
      description: "Science intelligence action across the 4 academic production pillars: Paper ('paper_literature_search', 'paper_citation_verify', 'paper_structure_audit', 'paper_peer_review_simulate', 'paper_latex_scaffold'), Grant ('grant_criteria_audit', 'grant_budget_calculator', 'grant_aims_alignment'), Journal ('journal_matcher', 'journal_submission_checklist'), Patent ('patent_novelty_check', 'patent_claim_structure', 'patent_spec_scaffold'), and 'list_actions'.",
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
      description: "Raw BibTeX entry string to validate.",
    },
    citation_style: {
      type: "string",
      enum: ["apa", "ieee", "nature", "acm", "chicago"],
      description: "Citation formatting style.",
    },
    manuscript_title: {
      type: "string",
      description: "Title of manuscript for audit, review simulation, or LaTeX scaffolding.",
    },
    manuscript_text: {
      type: "string",
      description: "Full manuscript text or markdown.",
    },
    sections: {
      type: "object",
      description: "Key-value dictionary mapping section names to text.",
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
      description: "Direct costs breakdown (personnel, equipment, supplies, travel, other).",
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
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      description: "Max results to return.",
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
            description: "MentalCraft Academic Production Lifecycle & Research Intelligence Engine (Paper authoring & peer review simulation, Grant rubrics & budget models, Journal IF matching, Patent prior art novelty audits).",
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
