import { describe, expect, test } from "bun:test";
import {
  scienceOperation,
  parseBibtexToAst,
  formatCitationFromFields,
  computeStatisticalPower,
  computeCohensD,
  validateClaimAntecedentBasis,
  formatChineseHeadingHierarchy,
  formatGbt7714Reference,
  parseClcCategory,
  INDEXED_SSCI_JOURNALS_DB,
} from "./operation.ts";
import { handleScienceRpc, SCIENCE_INPUT_SCHEMA } from "./mcp-server.ts";
import { SCIENCE_PROTOCOL, compactScienceResult, formatScienceSummary } from "./core.ts";

describe("Plugin/Science 8-Stage Academic Production Lifecycle Engine", () => {
  // Discovery & Inventory
  test("list_actions returns all 19 academic actions across the 8 production stages", async () => {
    const res = await scienceOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(SCIENCE_PROTOCOL);
    const data = res.data as any;
    expect(data.totalActions).toBe(19);
    expect(data.stages.stage1_literature.length).toBe(2);
    expect(data.stages.stage2_methodology.length).toBe(1);
    expect(data.stages.stage3_grants.length).toBe(3);
    expect(data.stages.stage4_authoring.length).toBe(3);
    expect(data.stages.stage5_peer_review.length).toBe(2);
    expect(data.stages.stage6_journal_submission.length).toBe(3);
    expect(data.stages.stage7_intellectual_property.length).toBe(3);
    expect(data.stages.stage8_scholarly_impact.length).toBe(1);
  });

  // Stage 1: Literature Discovery & Citation Verification
  describe("Stage 1: Literature & Citation Verification", () => {
    test("paper_literature_search returns indexed peer-reviewed papers with bibtexKeys", async () => {
      const res = await scienceOperation({ action: "paper_literature_search", query: "agent workflow" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.total).toBeGreaterThan(0);
      expect(data.papers[0].doi).toBeDefined();
      expect(data.papers[0].bibtexKey).toBeDefined();
      expect(data.papers[0].authors.length).toBeGreaterThan(0);
    });

    test("paper_literature_search filters by topic keywords", async () => {
      const res = await scienceOperation({ action: "paper_literature_search", query: "bioinformatics" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.papers.some((p: any) => p.venue.includes("Bioinformatics"))).toBe(true);
    });

    test("paper_citation_verify validates DOI syntax and formats APA style", async () => {
      const res = await scienceOperation({ action: "paper_citation_verify", doi: "10.1038/s41586-024-07521-3", citation_style: "apa" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.valid).toBe(true);
      expect(data.formattedCitation).toContain("Nature Machine Intelligence");
      expect(data.formattedCitation).toContain("https://doi.org/");
      expect(data.bibtex).toContain("@article");
    });

    test("paper_citation_verify formats IEEE, Nature, ACM, and Chicago styles", async () => {
      const styles = ["ieee", "nature", "acm", "chicago"] as const;
      for (const style of styles) {
        const res = await scienceOperation({ action: "paper_citation_verify", doi: "10.1038/s41586-024-07521-3", citation_style: style });
        expect(res.success).toBe(true);
        const data = res.data as any;
        expect(data.style).toBe(style);
        expect(data.formattedCitation.length).toBeGreaterThan(20);
      }
    });

    test("parseBibtexToAst parses valid BibTeX and validates required fields", () => {
      const rawBib = `@article{zhang2025autonomous,
        author = {Zhang, Laiyong and Chen, Wei},
        title = {Autonomous Agent Architectures for Scientific Discovery},
        journal = {Nature Machine Intelligence},
        year = {2025},
        volume = {7},
        pages = {142--158},
        doi = {10.1038/s41586-024-07521-3}
      }`;

      const ast = parseBibtexToAst(rawBib);
      expect(ast.isValid).toBe(true);
      expect(ast.entryType).toBe("article");
      expect(ast.citeKey).toBe("zhang2025autonomous");
      expect(ast.fields.journal).toBe("Nature Machine Intelligence");
      expect(ast.fields.year).toBe("2025");
      expect(ast.validationErrors.length).toBe(0);
    });

    test("parseBibtexToAst detects invalid syntax and missing required fields", () => {
      const invalidBib = `@article{broken_key,
        author = {Anonymous}
      }`;

      const ast = parseBibtexToAst(invalidBib);
      expect(ast.isValid).toBe(false);
      expect(ast.requiredMissingFields).toContain("title");
      expect(ast.requiredMissingFields).toContain("journal");
      expect(ast.requiredMissingFields).toContain("year");
    });

    test("paper_citation_verify processes raw bibtex input with AST validation", async () => {
      const rawBib = `@inproceedings{mentalcraft2024layered,
        author = {MentalCraft Research Lab},
        title = {Layered Design Token Hierarchy for Accessible Svelte 5 User Interfaces},
        booktitle = {ACM Conference on Human Factors in Computing Systems (CHI)},
        year = {2024},
        doi = {10.1145/3613904.3642100}
      }`;

      const res = await scienceOperation({ action: "paper_citation_verify", bibtex: rawBib, citation_style: "ieee" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.parsedAst).toBeDefined();
      expect(data.parsedAst.entryType).toBe("inproceedings");
      expect(data.formattedCitation).toContain("Layered Design Token Hierarchy");
    });
  });

  // Stage 2: Methodology & Reproducibility Design
  describe("Stage 2: Methodology & Reproducibility Design", () => {
    test("paper_methodology_audit evaluates baseline coverage, effect size, and statistical power", async () => {
      const res = await scienceOperation({
        action: "paper_methodology_audit",
        manuscript_title: "Deterministic Host-Agnostic Agent Plugin Architecture",
        methodology_data: {
          sample_size: 1000,
          treatment_mean: 98.4,
          control_mean: 76.2,
          pooled_std: 14.1,
        },
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.methodologyScore).toBeGreaterThanOrEqual(90);
      expect(data.reproducibilityGrade).toContain("Fully Reproducible");
      expect(data.baselineCheck.stateOfTheArtCovered).toBe(true);
      expect(data.sotaBaselineMatrix.length).toBeGreaterThanOrEqual(3);
      expect(data.powerAnalysis.powerAdequate).toBe(true);
      expect(data.powerAnalysis.power).toBeGreaterThan(0.8);
      expect(data.effectSize.interpretation).toBe("Huge"); // d = 1.57 >= 1.2
      expect(data.ablationCheck.conducted).toBe(true);
      expect(data.ablationCheck.isolatedComponents.length).toBe(3);
    });

    test("computeCohensD accurately categorizes effect sizes", () => {
      expect(computeCohensD(10, 9.8, 2.0).interpretation).toBe("Negligible"); // d = 0.1
      expect(computeCohensD(10, 9.3, 2.0).interpretation).toBe("Small"); // d = 0.35
      expect(computeCohensD(10, 8.8, 2.0).interpretation).toBe("Medium"); // d = 0.6
      expect(computeCohensD(10, 8.0, 2.0).interpretation).toBe("Large"); // d = 1.0
      expect(computeCohensD(10, 6.0, 2.0).interpretation).toBe("Huge"); // d = 2.0
    });

    test("computeStatisticalPower computes statistical power across sample sizes", () => {
      const highPower = computeStatisticalPower(500, 0.8, 0.05);
      expect(highPower).toBeGreaterThan(0.99);

      const lowPower = computeStatisticalPower(10, 0.2, 0.05);
      expect(lowPower).toBeLessThan(0.8);
    });
  });

  // Stage 3: Research Grants & Funding Acquisition
  describe("Stage 3: Research Grants & Funding Acquisition", () => {
    test("grant_criteria_audit evaluates NIH 5-dimension review rubrics", async () => {
      const res = await scienceOperation({ action: "grant_criteria_audit", funding_agency: "NIH" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.fundingAgency).toBe("NIH");
      expect(data.compositeNihScore).toBeLessThanOrEqual(2.0); // 1.0 = Exceptional
      expect(data.criteria.length).toBe(5);
      expect(data.criteria[0].criterion).toBe("Significance");
      expect(data.criteria[1].criterion).toBe("Innovation");
    });

    test("grant_criteria_audit evaluates NSF Intellectual Merit & Broader Impacts", async () => {
      const res = await scienceOperation({ action: "grant_criteria_audit", funding_agency: "NSF" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.fundingAgency).toBe("NSF");
      expect(data.compositeScore).toBeGreaterThanOrEqual(4.5); // 5.0 = Superior
      expect(data.criteria.some((c: any) => c.criterion === "Intellectual Merit")).toBe(true);
      expect(data.criteria.some((c: any) => c.criterion === "Broader Impacts")).toBe(true);
    });

    test("grant_aims_alignment validates specific aims independence and dependency matrix", async () => {
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
      expect(data.independenceCheck).toContain("Passed");
      expect(data.dependencyMatrix.length).toBe(2);
      expect(data.aimsEvaluations.length).toBe(3);
    });

    test("grant_budget_calculator computes multi-year direct, MTDC, and F&A indirect costs", async () => {
      const res = await scienceOperation({
        action: "grant_budget_calculator",
        duration_years: 3,
        fringe_rate_percent: 28,
        indirect_rate_percent: 52,
        annual_escalation_percent: 3,
        direct_costs: {
          personnel: 200000,
          equipment: 40000,
          supplies: 10000,
          travel: 10000,
          subawards_over_25k: 0,
          participant_support: 0,
          other: 5000,
        },
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.durationYears).toBe(3);
      expect(data.totalBudgetUsd).toBeGreaterThan(0);
      expect(data.totalDirectCostsUsd).toBeGreaterThan(0);
      expect(data.totalIndirectCostsUsd).toBeGreaterThan(0);
      expect(data.totalMtdcBaseUsd).toBeLessThan(data.totalDirectCostsUsd); // MTDC excludes equipment
      expect(data.fringeRatePercent).toBe(28);
      expect(data.fAndARatePercent).toBe(52);
      expect(data.yearlyBreakdown.length).toBe(3);
      expect(data.yearlyBreakdown[0].equipmentCost).toBe(40000);
    });
  });

  // Stage 4: Manuscript Authoring & LaTeX Structuring
  describe("Stage 4: Manuscript Authoring & LaTeX Scaffolding", () => {
    test("paper_structure_audit checks section completeness, word count, and proportions", async () => {
      const res = await scienceOperation({
        action: "paper_structure_audit",
        manuscript_title: "Deterministic Host-Agnostic AI Plugin Protocol",
        sections: {
          Abstract: "A comprehensive abstract covering deterministic tool execution and host-agnostic protocols with zero overhead...",
          Introduction: "Detailed introduction on autonomous AI agent workflows and modern tool use paradigms...",
          "Related Work": "Extensive literature review on workflow engines, Model Context Protocol, and agent DAGs...",
          Methodology: "Formal mathematical formulation of Kahn's topological sort and AST-based parameter template resolution...",
          Experiments: "Rigorous empirical benchmarking across 1,000 runs verifying sub-millisecond execution...",
          Discussion: "Limitations and future work including distributed cross-host networking and thread pools...",
          References: "Complete references list indexing peer-reviewed literature in Nature, IEEE, and ACM...",
        },
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.readinessScore).toBe(100);
      expect(data.completeness).toBe("Ready for Submission");
      expect(data.sections.length).toBe(7);
      expect(data.latexSyntaxValid).toBe(true);
    });

    test("paper_latex_scaffold generates compilation-ready ACM and IEEE manuscript code", async () => {
      const acmRes = await scienceOperation({
        action: "paper_latex_scaffold",
        manuscript_title: "Universal Host-Neutral Plugin Protocol",
        latex_template: "acm",
      });
      expect(acmRes.success).toBe(true);
      const acmData = acmRes.data as any;
      expect(acmData.latexCode).toContain("\\documentclass[sigconf,nonacm]{acmart}");
      expect(acmData.latexCode).toContain("Universal Host-Neutral Plugin Protocol");
      expect(acmData.linesCount).toBeGreaterThan(20);
      expect(acmData.packagesIncluded).toContain("microtype");

      const ieeeRes = await scienceOperation({
        action: "paper_latex_scaffold",
        manuscript_title: "Universal Host-Neutral Plugin Protocol",
        latex_template: "ieee",
      });
      expect(ieeeRes.success).toBe(true);
      const ieeeData = ieeeRes.data as any;
      expect(ieeeData.latexCode).toContain("\\documentclass[journal,compsoc]{IEEEtran}");
      expect(ieeeData.latexCode).toContain("IEEEkeywords");
    });

    test("chinese_academic_formatter formats paper according to GB/T 7714-2015, CLC, and hierarchical headings", async () => {
      const res = await scienceOperation({
        action: "chinese_academic_formatter",
        chinese_paper: {
          title: "算法中介与数字劳动者的主体性建构：基于多案例扎根理论的经验研究",
          english_title: "Algorithmic Mediation and the Subjectivity Construction of Digital Laborers",
          clc_code: "C912.6",
          document_code: "A",
          fund_project: "*基金项目：国家社会科学基金重大项目（项目编号：22&ZD188）",
          author_bio: "作者简介：张来勇，MentalCraft计算社会学实验室研究员。",
          headings: [
            "# 问题提出与文献回顾",
            "## 算法治理与劳动过程理论脉络",
            "### 既有研究的解释限度",
            "# 研究设计与数据收集",
            "## 案例选择与实地调查过程",
          ],
        },
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.clcCode).toBe("C912.6");
      expect(data.clcCategory).toContain("社会学");
      expect(data.documentCode).toBe("A");
      expect(data.headingHierarchyValid).toBe(true);
      expect(data.formattedHeadingsCount).toBe(5);
      expect(data.formattedHeadings[0].prefix).toBe("一、");
      expect(data.formattedHeadings[1].prefix).toBe("（一）");
      expect(data.formattedHeadings[2].prefix).toBe("1.");
      expect(data.formattedHeadings[3].prefix).toBe("二、");
      expect(data.gbt7714References.length).toBeGreaterThanOrEqual(4);
      expect(data.gbt7714References[0].formattedString).toContain("[1]");
      expect(data.gbt7714References[0].formattedString).toContain("[M]");
      expect(data.formattedArticleMarkdown).toContain("【中图分类号】C912.6");
      expect(data.formattedArticleMarkdown).toContain("【文献标识码】A");
      expect(data.formattedArticleMarkdown).toContain("### 参考文献");
      expect(data.complianceChecks.every((c: any) => c.status === "passed")).toBe(true);
    });

    test("formatChineseHeadingHierarchy standardizes 5-tier Chinese headings 一、（一）、1、（1）、①", () => {
      const headings = [
        "引言与理论脉络",
        "# 一、研究问题",
        "## （一）概念界定",
        "### 1. 核心变量操作化",
        "#### （1）量表信效度",
        "##### ① 探索性因子分析",
      ];
      const formatted = formatChineseHeadingHierarchy(headings);
      expect(formatted.length).toBe(6);
      expect(formatted[0].prefix).toBe("一、");
      expect(formatted[1].prefix).toBe("二、");
      expect(formatted[2].prefix).toBe("（一）");
      expect(formatted[3].prefix).toBe("1.");
      expect(formatted[4].prefix).toBe("（1）");
      expect(formatted[5].prefix).toBe("①");
    });

    test("formatGbt7714Reference formats journals, monographs, conferences, dissertations, and electronic resources", () => {
      const jRef = formatGbt7714Reference({
        authors: ["邱泽奇", "张树沁", "刘世定", "阮荣平"],
        title: "从数字鸿沟到红利差异——互联网资本的视角",
        journal: "中国社会科学",
        year: 2016,
        issue: "10",
        pages: "93-115",
        type: "J",
      }, 1);
      expect(jRef.referenceType).toBe("J");
      expect(jRef.formattedString).toContain("[1] 邱泽奇, 张树沁, 刘世定, 等. 从数字鸿沟到红利差异——互联网资本的视角[J]. 中国社会科学, 2016(10): 93-115.");

      const mRef = formatGbt7714Reference({
        authors: ["周雪光"],
        title: "中国国家治理的制度逻辑：一个组织学研究",
        publisher: "北京: 读书·新知·三联书店",
        year: 2017,
        type: "M",
      }, 2);
      expect(mRef.referenceType).toBe("M");
      expect(mRef.formattedString).toContain("[2] 周雪光. 中国国家治理的制度逻辑：一个组织学研究[M]. 北京: 读书·新知·三联书店, 2017.");
    });

    test("parseClcCategory maps Chinese Library Classification codes accurately", () => {
      expect(parseClcCategory("C912.6").category).toContain("社会学");
      expect(parseClcCategory("G206").category).toContain("信息与传播");
      expect(parseClcCategory("B849").category).toContain("心理学");
      expect(parseClcCategory("F270").category).toContain("经济管理");
    });
  });

  // Stage 5: Simulated Peer Review & Rebuttal
  describe("Stage 5: Simulated Peer Review & Rebuttal", () => {
    test("paper_peer_review_simulate provides 3-reviewer scoring and point-by-point rebuttal matrix", async () => {
      const res = await scienceOperation({ action: "paper_peer_review_simulate" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.score).toBeGreaterThanOrEqual(8.0);
      expect(data.overallRecommendation).toBe("Strong Accept");
      expect(data.reviews.length).toBe(3);
      expect(data.reviews[0].criteriaScores.originality).toBeGreaterThanOrEqual(8);
      expect(data.rebuttalMatrix.length).toBeGreaterThanOrEqual(3);
      expect(data.rebuttalMatrix[0].critique).toBeDefined();
      expect(data.rebuttalMatrix[0].suggestedResponse).toBeDefined();
      expect(data.rebuttalMatrix[0].actionItem).toBeDefined();
    });

    test("social_science_peer_review_audit audits CSSCI top & SSCI Q1 manuscripts with triangulation", async () => {
      const res = await scienceOperation({
        action: "social_science_peer_review_audit",
        manuscript_title: "数字技术赋能中国式基层社会治理的理论逻辑与实证检验",
        target_cssci_journal: "《社会学研究》",
        target_ssci_journal: "New Media & Society",
        empirical_data: {
          survey_sample_size: 1450,
          interview_count: 42,
          fieldwork_duration_months: 18,
          mixed_methods: true,
          common_method_bias_checked: true,
          theoretical_saturation: true,
        },
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.overallScore).toBeGreaterThanOrEqual(90);
      expect(data.recommendation).toBe("Strong Accept");
      expect(data.empiricalTriangulation.triangulationGrade).toBe("A (Complete Mixed-Methods)");
      expect(data.empiricalTriangulation.quantitativeEvaluation.targetSampleSizeMet).toBe(true);
      expect(data.empiricalTriangulation.qualitativeEvaluation.targetInterviewsMet).toBe(true);
      expect(data.cssciReadiness.ready).toBe(true);
      expect(data.cssciReadiness.journalFit).toContain("《中国社会科学》");
      expect(data.ssciReadiness.ready).toBe(true);
      expect(data.rebuttalAndRevisionRoadmap.length).toBeGreaterThanOrEqual(4);
    });

    test("social_science_peer_review_audit flags gaps when empirical triangulation sample sizes are below threshold", async () => {
      const res = await scienceOperation({
        action: "social_science_peer_review_audit",
        manuscript_title: "Preliminary Study on Digital Community Platforms",
        empirical_data: {
          survey_sample_size: 200,
          interview_count: 8,
          mixed_methods: false,
          common_method_bias_checked: false,
          theoretical_saturation: false,
        },
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.empiricalTriangulation.triangulationGrade).toBe("C (Single-Method / Gaps)");
      expect(data.empiricalTriangulation.quantitativeEvaluation.targetSampleSizeMet).toBe(false);
      expect(data.empiricalTriangulation.qualitativeEvaluation.targetInterviewsMet).toBe(false);
      expect(data.recommendation).not.toBe("Strong Accept");
    });
  });

  // Stage 6: Target Journal Matching & Camera-Ready Submission
  describe("Stage 6: Target Journal Matching & Camera-Ready", () => {
    test("journal_matcher finds top venues by Impact Factor and review speed", async () => {
      const res = await scienceOperation({
        action: "journal_matcher",
        desired_impact_factor_min: 5.0,
        target_review_weeks_max: 15,
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.matchedCount).toBeGreaterThan(0);
      expect(data.recommendations[0].impactFactor).toBeGreaterThanOrEqual(5.0);
      expect(data.recommendations[0].jcrQuartile).toBe("Q1");
    });

    test("journal_submission_checklist audits 8-point camera-ready requirements", async () => {
      const res = await scienceOperation({ action: "journal_submission_checklist" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.totalChecks).toBe(8);
      expect(data.passedChecks).toBe(8);
      expect(data.readyForSubmission).toBe(true);
      expect(data.creditTaxonomyCovered).toBe(true);
    });

    test("ssci_top_journal_matcher matches top SSCI Q1 journals with exact IF, word limits, and review turnaround", async () => {
      const res = await scienceOperation({
        action: "ssci_top_journal_matcher",
        manuscript_title: "Human-AI Interaction Dynamics in Sociotechnical Platforms",
        social_science_field: "Communication & Human-Computer Behavior",
        desired_impact_factor_min: 5.0,
        target_review_weeks_max: 12,
        word_count_limit_max: 8500,
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.matchedCount).toBeGreaterThan(0);
      expect(data.recommendations[0].jcrQuartile).toBe("Q1");
      expect(data.recommendations[0].impactFactor).toBeGreaterThanOrEqual(5.0);
      expect(data.recommendations[0].avgReviewWeeks).toBeLessThanOrEqual(12);
      expect(data.formattingGuidelines.citationStyle).toContain("APA 7th");
      expect(data.formattingGuidelines.dataAvailabilityRequirement).toContain("Zenodo");
    });

    test("INDEXED_SSCI_JOURNALS_DB contains premier venues with exact metadata", () => {
      expect(INDEXED_SSCI_JOURNALS_DB.some((j) => j.name === "Nature Human Behaviour" && j.impactFactor === 21.4)).toBe(true);
      expect(INDEXED_SSCI_JOURNALS_DB.some((j) => j.name === "Computers in Human Behavior" && j.impactFactor === 9.0)).toBe(true);
      expect(INDEXED_SSCI_JOURNALS_DB.some((j) => j.name === "New Media & Society" && j.impactFactor === 5.8)).toBe(true);
      expect(INDEXED_SSCI_JOURNALS_DB.some((j) => j.name === "Information, Communication & Society" && j.impactFactor === 4.8)).toBe(true);
    });
  });

  // Stage 7: Intellectual Property & Patent Conversion
  describe("Stage 7: Intellectual Property & Patent Conversion", () => {
    test("patent_novelty_check evaluates 35 U.S.C. 101/102/103 statutory factors and prior art", async () => {
      const res = await scienceOperation({
        action: "patent_novelty_check",
        invention_title: "DETERMINISTIC AGENT-LESS EXECUTION PIPELINES",
        invention_summary: "A method for DAG dependency verification and zero-eval parameter interpolation.",
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.noveltyScore).toBeGreaterThanOrEqual(80);
      expect(data.patentable).toBe(true);
      expect(data.priorArtCount).toBeGreaterThan(0);
      expect(data.statutoryFactors.novelty35USC102).toContain("Passed");
      expect(data.statutoryFactors.nonObviousness35USC103).toContain("Passed");
      expect(data.statutoryFactors.utility35USC101).toContain("Passed");
      expect(data.claimsGuidance.length).toBeGreaterThan(0);
    });

    test("patent_claim_structure checks independent/dependent hierarchy and antecedent basis", async () => {
      const res = await scienceOperation({ action: "patent_claim_structure" });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.totalClaims).toBe(3);
      expect(data.independentClaims).toBe(1);
      expect(data.dependentClaims).toBe(2);
      expect(data.validAntecedent).toBe(true);
    });

    test("validateClaimAntecedentBasis detects missing antecedent basis in defective claims", () => {
      const defectiveClaims = [
        {
          claimNumber: 1,
          type: "independent" as const,
          text: "A computer-implemented method comprising: receiving a data packet; and processing the data packet.",
        },
        {
          claimNumber: 2,
          type: "dependent" as const,
          dependsOnClaim: 1,
          text: "The method of claim 1, wherein said neural network classifier optimizes the processing speed.",
        },
      ];

      const validation = validateClaimAntecedentBasis(defectiveClaims);
      expect(validation.valid).toBe(false);
      expect(validation.claimsWithIssues[1].antecedentBasisValid).toBe(false);
      expect(validation.diagnostics.length).toBeGreaterThan(0);
    });

    test("patent_spec_scaffold builds complete specification structure", async () => {
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
      expect(data.sections.claims.length).toBe(3);
      expect(data.sections.summary).toBeDefined();
    });
  });

  // Stage 8: Scholarly Impact & Dissemination
  describe("Stage 8: Scholarly Impact & Dissemination", () => {
    test("scholarly_impact_forecast projects 3-year citation trajectory and dissemination strategy", async () => {
      const res = await scienceOperation({
        action: "scholarly_impact_forecast",
        manuscript_title: "Universal Host-Neutral Plugin Protocol",
      });
      expect(res.success).toBe(true);
      const data = res.data as any;
      expect(data.projectedCitationsYear1).toBe(35);
      expect(data.projectedCitationsYear2).toBe(95);
      expect(data.projectedCitationsYear3).toBe(180);
      expect(data.projectedAltmetricScore).toBe(88);
      expect(data.altmetricBreakdown.twitterMentions).toBeGreaterThan(0);
      expect(data.disseminationChannels.length).toBe(4);
      expect(data.reproducibleArtifactsChecklist.length).toBe(4);
    });
  });

  // MCP Protocol Server Tests
  describe("MCP Protocol Server & Summary Formatting", () => {
    test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
      const initRes = await handleScienceRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
      expect(initRes.result.serverInfo.name).toBe("mentalcraft-science-mcp");

      const listRes = await handleScienceRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
      expect(listRes.result.tools[0].name).toBe("science");
      expect(SCIENCE_INPUT_SCHEMA.properties.action.enum.length).toBe(19);

      const callRes = await handleScienceRpc({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "science",
          arguments: { action: "scholarly_impact_forecast", manuscript_title: "Agent Architecture" },
        },
      });
      expect(callRes.result.content[0].text).toContain("projectedCitationsYear3");

      const ssciCallRes = await handleScienceRpc({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "science",
          arguments: { action: "ssci_top_journal_matcher", social_science_field: "Communication" },
        },
      });
      expect(ssciCallRes.result.content[0].text).toContain("Nature Human Behaviour");
    });

    test("MCP Protocol server rejects unknown tools and invalid methods", async () => {
      const badToolRes = await handleScienceRpc({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "invalid_tool", arguments: {} },
      });
      expect(badToolRes.error).toBeDefined();
      expect(badToolRes.error?.code).toBe(-32601);

      const badMethodRes = await handleScienceRpc({
        jsonrpc: "2.0",
        id: 6,
        method: "unknown_method",
      });
      expect(badMethodRes.error?.code).toBe(-32601);
    });

    test("compactScienceResult / formatScienceSummary formats clean terminal summaries across actions", async () => {
      const actions = [
        "list_actions",
        "paper_literature_search",
        "paper_citation_verify",
        "paper_methodology_audit",
        "paper_structure_audit",
        "paper_latex_scaffold",
        "chinese_academic_formatter",
        "paper_peer_review_simulate",
        "social_science_peer_review_audit",
        "journal_matcher",
        "journal_submission_checklist",
        "ssci_top_journal_matcher",
        "grant_criteria_audit",
        "grant_budget_calculator",
        "grant_aims_alignment",
        "patent_novelty_check",
        "patent_claim_structure",
        "patent_spec_scaffold",
        "scholarly_impact_forecast",
      ] as const;

      for (const act of actions) {
        const res = await scienceOperation({ action: act });
        const summary = compactScienceResult(res);
        expect(typeof summary).toBe("string");
        expect(summary.length).toBeGreaterThan(10);
      }

      // Test failure formatting
      const failSummary = formatScienceSummary({
        protocol: SCIENCE_PROTOCOL,
        action: "paper_citation_verify",
        success: false,
        timestamp: new Date().toISOString(),
        data: null,
        diagnostics: ["Network timeout"],
      });
      expect(failSummary).toContain("✗ Science paper_citation_verify failed");
    });
  });
});
