import { describe, expect, test } from "bun:test";
import { scienceOperation } from "./operation.ts";
import { handleScienceRpc } from "./mcp-server.ts";
import { SCIENCE_PROTOCOL, compactScienceResult } from "./core.ts";

describe("Plugin/Science Intelligence Engine", () => {
  test("list_actions returns all psychometric & research actions", async () => {
    const res = await scienceOperation({ action: "list_actions" });
    expect(res.success).toBe(true);
    expect(res.protocol).toBe(SCIENCE_PROTOCOL);
    const data = res.data as { actions: Array<{ name: string }> };
    expect(data.actions.length).toBe(6);
    expect(data.actions.map((a) => a.name)).toContain("score_scale");
    expect(data.actions.map((a) => a.name)).toContain("crisis_boundary_check");
  });

  test("score_scale calculates GAD-7 anxiety severity accurately", async () => {
    // Severe anxiety score (18 / 21)
    const severeRes = await scienceOperation({
      action: "score_scale",
      scale: "gad7",
      answers: { q1: 3, q2: 3, q3: 3, q4: 2, q5: 3, q6: 2, q7: 2 },
    });
    expect(severeRes.success).toBe(true);
    const severeData = severeRes.data as any;
    expect(severeData.totalScore).toBe(18);
    expect(severeData.severity).toBe("Severe");
    expect(severeData.crisisFlag).toBe(false);

    // Minimal anxiety score (2 / 21)
    const minRes = await scienceOperation({
      action: "score_scale",
      scale: "gad7",
      answers: { q1: 1, q2: 0, q3: 1, q4: 0, q5: 0, q6: 0, q7: 0 },
    });
    expect(minRes.success).toBe(true);
    const minData = minRes.data as any;
    expect(minData.totalScore).toBe(2);
    expect(minData.severity).toBe("Minimal");
  });

  test("score_scale PHQ-9 detects Item 9 self-harm crisis flag", async () => {
    const res = await scienceOperation({
      action: "score_scale",
      scale: "phq9",
      answers: { q1: 2, q2: 2, q3: 2, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 2 },
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.totalScore).toBe(13);
    expect(data.severity).toBe("Moderate");
    expect(data.crisisFlag).toBe(true);
    expect(data.recommendation).toContain("CRITICAL");
  });

  test("crisis_boundary_check dispatches 988 emergency hotline protocol", async () => {
    const crisis = await scienceOperation({
      action: "crisis_boundary_check",
      answers: { q9: 2 },
    });
    expect(crisis.success).toBe(true);
    const cData = crisis.data as any;
    expect(cData.crisisDetected).toBe(true);
    expect(cData.urgencyLevel).toBe("imminent");
    expect(cData.protocolAction).toBe("crisis_hotline_modal");
    expect(cData.hotlines.some((h: any) => h.contact.includes("988"))).toBe(true);
  });

  test("patent_novelty_check validates claim differentiation", async () => {
    const res = await scienceOperation({
      action: "patent_novelty_check",
      invention_summary: "Ephemeral single-use cryptographic tokenized screening link generator",
    });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.noveltyScore).toBeGreaterThanOrEqual(80);
    expect(data.claimRecommendations.length).toBeGreaterThan(0);
  });

  test("MCP Protocol server handles initialize, tools/list, and tools/call", async () => {
    // 1. initialize
    const initRes = await handleScienceRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.id).toBe(1);
    expect((initRes.result as any).serverInfo.name).toBe("mentalcraft-science-mcp");

    // 2. tools/list
    const listRes = await handleScienceRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const tools = (listRes.result as any).tools;
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe("science");

    // 3. tools/call
    const callRes = await handleScienceRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "science",
        arguments: { action: "score_scale", scale: "gad7", answers: { q1: 1, q2: 2 } },
      },
    });
    expect(callRes.id).toBe(3);
    const content = (callRes.result as any).content;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.action).toBe("score_scale");
    expect(parsed.success).toBe(true);
  });

  test("compactScienceResult formats readable terminal summary", async () => {
    const res = await scienceOperation({
      action: "score_scale",
      scale: "gad7",
      answers: { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 },
    });
    const log = compactScienceResult(res);
    expect(log).toContain("GAD-7");
    expect(log).toContain("21/21");
    expect(log).toContain("Severe");
  });
});
