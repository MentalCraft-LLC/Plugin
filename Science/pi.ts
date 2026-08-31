/**
 * Plugin/Science Pi Host Adapter
 *
 * Terminal rendering and CLI tool integration for Pi agent environments.
 */

import { Type } from "typebox";
import { scienceOperation } from "./operation.ts";
import { SCIENCE_ACTIONS } from "./mcp-server.ts";
import type { ScienceInput, ScienceResult, ClinicalScaleResult, CrisisEvaluationResult } from "./core.ts";

const StringEnum = (values: readonly string[]) =>
  Type.Union(values.map((v) => Type.Literal(v)));

export function compactScienceResult(result: ScienceResult): string {
  if (!result.success) {
    return `✗ Science ${result.action} failed: ${(result.diagnostics ?? []).join("; ")}`;
  }

  switch (result.action) {
    case "list_actions": {
      const data = result.data as { actions: Array<{ name: string }> };
      return `Science Actions (${data.actions.length}): ${data.actions.map((a) => a.name).join(", ")}`;
    }
    case "score_scale": {
      const data = result.data as ClinicalScaleResult;
      return `${data.scaleName}: ${data.totalScore}/${data.maxScore} points [${data.severity}] ${data.crisisFlag ? "⚠️ CRISIS" : "✓"}`;
    }
    case "crisis_boundary_check": {
      const data = result.data as CrisisEvaluationResult;
      return data.crisisDetected
        ? `⚠️ CRISIS DETECTED [Urgency: ${data.urgencyLevel}] → Dispatched ${data.hotlines[0].name}`
        : `✓ Crisis check passed: No self-harm ideation detected`;
    }
    case "search_literature": {
      const data = result.data as { total: number; papers: Array<{ title: string; year: number }> };
      return `Literature: ${data.total} peer-reviewed papers (e.g. "${data.papers[0]?.title ?? ""}", ${data.papers[0]?.year ?? ""})`;
    }
    case "verify_citation": {
      const data = result.data as { valid: boolean; doi: string };
      return data.valid ? `Citation Validated (DOI: ${data.doi})` : `Invalid Citation Syntax`;
    }
    case "patent_novelty_check": {
      const data = result.data as { noveltyScore: number; potentialPriorArt: unknown[] };
      return `Patent Novelty Score: ${data.noveltyScore}/100 (${data.potentialPriorArt.length} prior art references analyzed)`;
    }
    case "grant_criteria_audit": {
      const data = result.data as { score: number };
      return `Grant Proposal Rigor Score: ${data.score}/100 (NIH/NSF aligned)`;
    }
  }
}

export const scienceTool = {
  name: "science",
  label: "Science Intelligence",
  description: "MentalCraft Science & Research Intelligence Engine. Clinical scale scoring (GAD-7, PHQ-9), suicidal ideation safety protocol, academic literature discovery, patent novelty audits, and research grant rubric verification.",
  parameters: Type.Object(
    {
      action: StringEnum(SCIENCE_ACTIONS),
      scale: Type.Optional(StringEnum(["gad7", "phq9", "epds", "isi", "asrs"] as const)),
      answers: Type.Optional(Type.Record(Type.String(), Type.Union([Type.Number(), Type.String()]))),
      query: Type.Optional(Type.String({ description: "Academic literature search query." })),
      doi: Type.Optional(Type.String({ description: "DOI string." })),
      bibtex: Type.Optional(Type.String({ description: "BibTeX citation." })),
      invention_summary: Type.Optional(Type.String({ description: "Patent invention summary." })),
      grant_proposal_abstract: Type.Optional(Type.String({ description: "Grant abstract." })),
      limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
    },
    { additionalProperties: false }
  ),
  async execute(_toolCallId: string, params: ScienceInput) {
    const res = await scienceOperation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
      details: res,
    };
  },
};
