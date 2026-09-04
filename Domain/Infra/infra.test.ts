import { describe, expect, test } from "bun:test";
import {
  executeInfraCanaryProbe,
  executeInfraD1SchemaAudit,
  executeInfraWorkerBundleAudit,
  executeInfraStripeWebhookSimulate,
  infraOperation,
} from "./operation.ts";
import { INFRA_PROTOCOL } from "./core.ts";

describe("Plugin/Infra FastMCP Protocol Engine", () => {
  test("executeInfraCanaryProbe returns sub-15ms edge health status", async () => {
    const probe = await executeInfraCanaryProbe();
    expect(probe.status).toBe("HEALTHY");
    expect(probe.testedCount).toBe(4);
    expect(probe.healthyCount).toBe(4);
    expect(probe.averageLatencyMs).toBeLessThanOrEqual(15);
  });

  test("executeInfraD1SchemaAudit discovers D1 migrations and tables", () => {
    const audit = executeInfraD1SchemaAudit();
    expect(audit.status).toBe("COMPLIANT");
    expect(audit.tablesFound.length).toBeGreaterThanOrEqual(2);
    expect(audit.foreignKeysCompliant).toBe(true);
  });

  test("executeInfraWorkerBundleAudit validates Cloudflare Worker configs", () => {
    const audit = executeInfraWorkerBundleAudit();
    expect(audit.status).toBe("VALID");
    expect(audit.workersAudited).toBe(4);
    expect(audit.compatibilityGuarantees).toBe(true);
  });

  test("executeInfraStripeWebhookSimulate verifies HMAC signature flow", () => {
    const sim = executeInfraStripeWebhookSimulate();
    expect(sim.verified).toBe(true);
    expect(sim.signatureValid).toBe(true);
    expect(sim.handled).toBe(true);
  });

  test("infraOperation dispatches with INFRA_PROTOCOL", async () => {
    const res = await infraOperation("infra_canary_probe");
    expect(res.protocol).toBe(INFRA_PROTOCOL);
    expect(res.action).toBe("infra_canary_probe");
  });

  test("infraOperation supports action aliases and nested parameter objects", async () => {
    const res = await infraOperation({
      action: "canary",
      params: {},
    });
    expect(res.action).toBe("infra_canary_probe");
    expect((res.result as any).status).toBe("HEALTHY");

    const d1 = await infraOperation({
      action: "d1",
      params: {},
    });
    expect(d1.action).toBe("infra_d1_schema_audit");
    expect((d1.result as any).status).toBe("COMPLIANT");

    const pub = await infraOperation({
      action: "publish",
      params: {
        title: "FastMCP 跨平台分发测试",
        markdown: "# 内容",
        destinations: [{ platform: "wechat", mode: "draft" }],
      },
    });
    expect(pub.action).toBe("infra_publish_dispatch");
    expect((pub.result as any).status).toBe("SUCCESS");

    const wx = await infraOperation({
      action: "wechat",
      params: { content: "【自动化】" },
    });
    expect(wx.action).toBe("infra_wechat_webhook_simulate");
    expect((wx.result as any).matchedRule).toBe("keyword_automation");
  });
});
