/**
 * Plugin/Science MCP Protocol Server
 *
 * Exposes the 'science' psychometric & academic intelligence tool over JSON-RPC 2.0 stdio stream.
 */

import { scienceOperation } from "./operation.ts";
import { type ScienceInput } from "./core.ts";

export const SCIENCE_ACTIONS = [
  "score_scale",
  "crisis_boundary_check",
  "search_literature",
  "verify_citation",
  "patent_novelty_check",
  "grant_criteria_audit",
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
      description: "Science intelligence action: 'score_scale' (GAD-7/PHQ-9 clinical scoring), 'crisis_boundary_check' (self-harm/suicide risk assessment), 'search_literature' (academic meta-analyses), 'verify_citation' (DOI/BibTeX validation), 'patent_novelty_check' (prior art search), 'grant_criteria_audit' (NIH/NSF rubric scoring), 'list_actions'.",
    },
    scale: {
      type: "string",
      enum: ["gad7", "phq9", "epds", "isi", "asrs"],
      description: "Clinical psychometric scale type.",
    },
    answers: {
      type: "object",
      description: "Key-value map of scale question responses (e.g. { q1: 2, q2: 3, q9: 1 }).",
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
    invention_summary: {
      type: "string",
      description: "Invention summary or patent claim narrative.",
    },
    grant_proposal_abstract: {
      type: "string",
      description: "Research grant proposal abstract for rubric auditing.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 50,
      description: "Max literature results to return.",
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
            description: "MentalCraft Science & Research Intelligence Engine. Clinical scale scoring (GAD-7, PHQ-9), suicidal ideation safety protocol, academic literature discovery, patent novelty audits, and research grant rubric verification.",
            inputSchema: SCIENCE_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
    if (params?.name !== "science") {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${params?.name ?? "undefined"}`,
        },
      };
    }

    try {
      const input = (params.arguments ?? {}) as unknown as ScienceInput;
      const result = await scienceOperation(input);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
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

export function startScienceMcpStdio() {
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
  startScienceMcpStdio();
}
