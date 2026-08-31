import { describe, expect, test } from "bun:test";
import { scienceOperation } from "./operation.ts";
import { handleScienceRpc } from "./mcp-server.ts";
import { SCIENCE_PROTOCOL, compactScienceResult } from "./core.ts";

describe("Plugin/Science Academic Production Lifecycle Engine", () => {
  test("list_actions returns all 14 academic actions across Paper, Grant, Journal, and Patent", async () => {
    const res = await scienceOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(SCIENCE_PROTOCOL);
    const data = res.data as any;
    expect(data.totalActions).toBe(14);
    expect(data.pillars.paper.length).toBe(5);
    expect(data.pillars.grant.length).toBe(3);
    expect(data.pillars.journal.length).toBe(2);
    expect(data.pillars.patent.length).toBe(3);
  });

  test("Paper pillar: literature search returns indexed peer-reviewed papers with bibtexKeys", async () => {
    const res = await scienceOperation({ action: "paper_literature_search", query: "agent workflow" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.total).toBeGreaterThan(0);
    expect(data.papers[0].doi).toBeDefined();
    expect(data.papers[0].bibtexKey).toBeDefined();
  });

  test("Paper pillar: citation verify validates DOI syntax and formats APA/IEEE/Nature styles", async () => {
    const res = await scienceOperation({ action: "paper_citation_verify", doi: "10.1038/s41586-024-07521-3", citation_style: "apa" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.valid).toBe(true);
    expect(data.formattedCitation).toContain("Nature Machine Intelligence");
    expect(data.bibtex).toContain("@article");
  });

  test("Paper pillar: structure audit checks manuscript completeness and word count", async () => {
    const res = await scienceOperation({
      action: "paper_structure_audit",
      manuscript_title: "Deterministic Host-Agnostic AI Plugin Protocol",
      sections: {
        Abstract: "A comprehensive abstract...",
        Introduction: "Detailed introduction...",
        "Related Work": "Extensive literature...",
        Methodology: "Formal mathematical formulation...",
        Experiments: "Rigorous benchmarking...",
        Discussion: "Limitations and future work...",
        References: "Complete references list...",
      },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.readinessScore).toBe(100);
    expect(data.sections.length).toBe(7);
  });

  test("Paper pillar: peer review simulate provides reviewer scoring and rebuttal matrix", async () => {
    const res = await scienceOperation({ action: "paper_peer_review_simulate" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.score).toBeGreaterThanOrEqual(8.0);
    expect(data.overallRecommendation).toBe("Strong Accept");
    expect(data.reviews.length).toBe(3);
    expect(data.rebuttalMatrix.length).toBeGreaterThanOrEqual(3);
    expect(data.rebuttalMatrix[0].suggestedResponse).toBeDefined();
  });

  test("Paper pillar: latex scaffold generates compilation-ready ACM/IEEE manuscript code", async () => {
    const res = await scienceOperation({
      action: "paper_latex_scaffold",
      manuscript_title: "Universal Host-Neutral Plugin Protocol",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.latexCode).toContain("\\documentclass");
    expect(data.latexCode).toContain("Universal Host-Neutral Plugin Protocol");
    expect(data.linesCount).toBeGreaterThan(20);
  });

  test("Grant pillar: criteria audit evaluates NIH/NSF review rubrics", async () => {
    const res = await scienceOperation({ action: "grant_criteria_audit", funding_agency: "NIH" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.compositeNihScore).toBeLessThanOrEqual(2.0); // 1.0 = Exceptional
    expect(data.criteria.length).toBe(5);
  });

  test("Grant pillar: budget calculator computes multi-year direct, MTDC, and F&A indirect costs", async () => {
    const res = await scienceOperation({
      action: "grant_budget_calculator",
      duration_years: 3,
      fringe_rate_percent: 28,
      indirect_rate_percent: 52,
      direct_costs: { personnel: 200000, equipment: 40000, supplies: 10000, travel: 10000 },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.durationYears).toBe(3);
    expect(data.totalBudgetUsd).toBeGreaterThan(0);
    expect(data.fringeRatePercent).toBe(28);
  });

  test("Grant pillar: aims alignment validates specific aims independence and dependency matrix", async () => {
    const res = await scienceOperation({
      action: "grant_aims_alignment",
      aims: [
        "Aim 1: Topological DAG formulation",
        "Aim 2: Zero-eval runtime implementation",
        "Aim 3: Multi-domain empirical validation",
      ],
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.aimsCount).toBe(3);
    expect(data.alignmentScore).toBe(95);
    expect(data.dependencyMatrix.length).toBeGreaterThan(0);
  });

  test("Journal pillar: journal matcher finds top venues by Impact Factor", async () => {
    const res = await scienceOperation({ action: "journal_matcher", desired_impact_factor_min: 5.0 });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.matchedCount).toBeGreaterThan(0);
    expect(data.recommendations[0].impactFactor).toBeGreaterThanOrEqual(5.0);
  });

  test("Journal pillar: submission checklist audits camera-ready requirements", async () => {
    const res = await scienceOperation({ action: "journal_submission_checklist" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.totalChecks).toBe(8);
    expect(data.readyForSubmission).toBe(true);
  });

  test("Patent pillar: novelty check evaluates 35 USC statutory factors and prior art", async () => {
    const res = await scienceOperation({
      action: "patent_novelty_check",
      invention_title: "DETERMINISTIC AGENT-LESS EXECUTION PIPELINES",
      invention_summary: "A method for DAG dependency verification and zero-eval parameter interpolation.",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.noveltyScore).toBeGreaterThanOrEqual(80);
    expect(data.priorArtCount).toBeGreaterThan(0);
    expect(data.statutoryFactors.novelty35USC102).toContain("Passed");
  });

  test("Patent pillar: claim structure checks independent/dependent hierarchy and antecedent basis", async () => {
    const res = await scienceOperation({ action: "patent_claim_structure" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.totalClaims).toBe(3);
    expect(data.independentClaims).toBe(1);
    expect(data.validAntecedent).toBe(true);
  });

  test("Patent pillar: spec scaffold builds complete specification structure", async () => {
    const res = await scienceOperation({
      action: "patent_spec_scaffold",
      invention_title: "SYSTEM AND METHOD FOR DETERMINISTIC AGENT-LESS EXECUTION PIPELINES",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.sectionsCount).toBe(5);
    expect(data.claimsCount).toBe(3);
    expect(data.sections.fieldOfInvention).toBeDefined();
    expect(data.sections.detailedDescription).toBeDefined();
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    const initRes = await handleScienceRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-science-mcp");

    const listRes = await handleScienceRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools[0].name).toBe("science");

    const callRes = await handleScienceRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "science",
        arguments: { action: "paper_literature_search", query: "agent" },
      },
    });
    expect(callRes.result.content[0].text).toContain("Autonomous Agent Architectures");
  });

  test("compactScienceResult formats clean terminal summary", async () => {
    const res = await scienceOperation({ action: "paper_literature_search", query: "agent" });
    const summary = compactScienceResult(res);
    expect(summary).toContain("Literature Search");
    expect(summary).toContain("papers indexed");
  });
});
