import { describe, expect, test } from "bun:test";
import { businessOperation } from "../Business/operation.ts";
import { scienceOperation } from "../Science/operation.ts";
import { designOperation } from "../Design/operation.ts";
import { workflowOperation } from "../Workflow/operation.ts";
import { BUSINESS_PROTOCOL } from "../Business/core.ts";
import { SCIENCE_PROTOCOL } from "../Science/core.ts";
import { DESIGN_PROTOCOL } from "../Design/core.ts";
import { WORKFLOW_PROTOCOL } from "../Workflow/core.ts";
import { handleGatewayRpc } from "../gateway.ts";

describe("Golden Protocol & Contract Verification Across All 6 Plugins", () => {
  test("Business plugin contract conforms to strict output schema", async () => {
    const actions = [
      "list_actions",
      "traffic_domain_overview",
      "traffic_channel_breakdown",
      "traffic_competitor_comparison",
      "product_traction_score",
    ] as const;

    for (const action of actions) {
      const res = await businessOperation({ action, domain: "mentalcraft.org", competitors: ["a.com", "b.com"] } as any);
      expect(res.success).toBe(true);
      expect(res.protocol).toBe(BUSINESS_PROTOCOL);
      expect(res.timestamp).toBeDefined();
      expect(res.data).toBeDefined();
    }
  });

  test("Science plugin contract conforms to clinical psychometrics & safety schema", async () => {
    const scales = ["gad7", "phq9", "epds", "isi", "asrs"] as const;
    for (const scale of scales) {
      const res = await scienceOperation({ action: "score_scale", scale, answers: { q1: 1, q2: 2 } });
      expect(res.success).toBe(true);
      expect(res.protocol).toBe(SCIENCE_PROTOCOL);
      const data = res.data as any;
      expect(data.scale).toBe(scale);
      expect(typeof data.totalScore).toBe("number");
      expect(typeof data.severity).toBe("string");
    }

    const crisisRes = await scienceOperation({ action: "crisis_boundary_check", answers: { item9: 3 } });
    expect(crisisRes.success).toBe(true);
    const crisisData = crisisRes.data as any;
    expect(crisisData.crisisDetected).toBe(true);
    expect(crisisData.protocolAction).toBe("crisis_hotline_modal");
    expect(crisisData.hotlines[0].name).toContain("988");
  });

  test("Design plugin contract conforms to 5-layer design hierarchy and tokens", async () => {
    const layersRes = await designOperation({ action: "list_layers" });
    expect(layersRes.success).toBe(true);
    expect(layersRes.protocol).toBe(DESIGN_PROTOCOL);
    const layersData = layersRes.data as any;
    expect(layersData.layers.length).toBe(5);

    const presetsRes = await designOperation({ action: "domain_presets" });
    expect(presetsRes.success).toBe(true);
    const presetsData = presetsRes.data as any;
    expect(presetsData.total).toBe(5);

    const tokensRes = await designOperation({ action: "theme_tokens", token_category: "color" });
    expect(tokensRes.success).toBe(true);
    const tokensData = tokensRes.data as any;
    expect(tokensData.tokens.length).toBeGreaterThan(0);
  });

  test("Workflow orchestrator contract exports valid OpenRPC, OpenAPI, Mermaid, and OTel traces", async () => {
    const openrpcRes = await workflowOperation({ action: "export_schema_catalog" });
    expect(openrpcRes.success).toBe(true);
    expect(openrpcRes.protocol).toBe(WORKFLOW_PROTOCOL);
    expect((openrpcRes.data as any).openrpc).toBe("1.3.0");

    const openapiRes = await workflowOperation({ action: "export_openapi_catalog" });
    expect(openapiRes.success).toBe(true);
    expect((openapiRes.data as any).openapi).toBe("3.1.0");

    const mermaidRes = await workflowOperation({ action: "export_mermaid_dag" });
    expect(mermaidRes.success).toBe(true);
    expect((mermaidRes.data as any).mermaidCode).toContain("graph TD");

    const traceRes = await workflowOperation({ action: "export_trace" });
    expect(traceRes.success).toBe(true);
    expect((traceRes.data as any).format).toBe("OpenTelemetry_v1");
  });

  test("Master Gateway MCP handles concurrent multi-client requests", async () => {
    const clientRequests = [
      handleGatewayRpc({ jsonrpc: "2.0", id: 101, method: "tools/list" }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 102, method: "tools/call", params: { name: "workflow", arguments: { action: "health_check" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 103, method: "tools/call", params: { name: "design", arguments: { action: "list_layers" } } }),
      handleGatewayRpc({ jsonrpc: "2.0", id: 104, method: "tools/call", params: { name: "science", arguments: { action: "list_actions" } } }),
    ];

    const responses = await Promise.all(clientRequests);
    for (const r of responses) {
      expect(r.jsonrpc).toBe("2.0");
      expect(r.result).toBeDefined();
      expect(r.error).toBeUndefined();
    }
  });
});
