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
    expect(probe.testedCount).toBe(8);
    expect(probe.healthyCount).toBe(8);
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
    expect(audit.workersAudited).toBe(8);
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

    const pub10 = await infraOperation({
      action: "publish",
      params: {
        title: "全域十端原生分发实测",
        markdown: "# 架构拆解",
        destinations: [
          { platform: "wechat" },
          { platform: "xiaohongshu" },
          { platform: "zhihu" },
          { platform: "juejin" },
          { platform: "x" },
          { platform: "linkedin" },
          { platform: "medium" },
          { platform: "devto" },
          { platform: "reddit" },
          { platform: "bluesky" },
        ],
      },
    });
    expect((pub10.result as any).results.length).toBe(10);

    const wx = await infraOperation({
      action: "wechat",
      params: { content: "【自动化】" },
    });
    expect(wx.action).toBe("infra_wechat_webhook_simulate");
    expect((wx.result as any).matchedRule).toBe("keyword_automation");
  });

  test("infraOperation executes infra_analytics_query and infra_analytics_beacon_verify", async () => {
    const query = await infraOperation({
      action: "analytics",
      params: { domain: "mentalcraft.org" },
    });
    expect(query.action).toBe("infra_analytics_query");
    const qData = query.result as any;
    expect(qData.status).toBe("SUCCESS");
    expect(qData.domain).toBe("mentalcraft.org");
    expect(qData.realtimeVisitors).toBeGreaterThanOrEqual(1);
    expect(qData.stats.visitors).toBeGreaterThanOrEqual(1);
    expect(qData.breakdown.length).toBeGreaterThan(0);

    const beacon = await infraOperation({
      action: "beacon",
      params: { domain: "mentalcraft.org" },
    });
    expect(beacon.action).toBe("infra_analytics_beacon_verify");
    const bData = beacon.result as any;
    expect(bData.snippet).toContain("analytics.mentalcraft.org/js/script.js");
    expect(bData.zeroPiiGuaranteed).toBe(true);
    expect(bData.compliant).toBe(true);

    const list = await infraOperation("list_actions");
    expect((list.result as any).totalActions).toBe(15);
  });

  test("infraOperation executes experiment route, workflow, and media actions", async () => {
    // 1. Experiment Route
    const exp = await infraOperation({
      action: "experiment",
      params: {
        experimentId: "exp_hero_cta",
        subjectId: "user_123",
        variants: [
          { key: "control", weight: 50 },
          { key: "variant_b", weight: 50 },
        ],
      },
    });
    expect(exp.action).toBe("infra_experiment_route");
    const expData = exp.result as any;
    expect(expData.status).toBe("ASSIGNED");
    expect(["control", "variant_b"]).toContain(expData.assignedVariant);

    // 2. Workflow Execute
    const wf = await infraOperation({
      action: "workflow",
      params: {
        workflowName: "test_pipeline",
        input: { job: "digest" },
        mockSleep: true,
      },
    });
    expect(wf.action).toBe("infra_workflow_execute");
    const wfData = wf.result as any;
    expect(wfData.status).toBe("COMPLETED");
    expect(wfData.stepCount).toBeGreaterThanOrEqual(1);

    // 3. Media Render
    const media = await infraOperation({
      action: "media",
      params: {
        type: "card",
        title: "Test Editorial Card",
        theme: "paper",
        aspectRatio: "16:9",
      },
    });
    expect(media.action).toBe("infra_media_render");
    const mData = media.result as any;
    expect(mData.status).toBe("RENDERED");
    expect(mData.format).toBe("svg");
    expect(mData.width).toBe(1200);
    expect(mData.svg).toContain("<svg");

    // 4. Media Image Generate
    const img = await infraOperation({
      action: "image",
      params: {
        prompt: "Autonomous FastMCP Matrix",
        style: "swiss-grid",
        theme: "paper",
      },
    });
    expect(img.action).toBe("infra_media_image_generate");
    const imgData = img.result as any;
    expect(imgData.status).toBe("GENERATED");
    expect(imgData.svg).toContain("Autonomous FastMCP Matrix");

    // 5. Media Video Clip
    const vid = await infraOperation({
      action: "video",
      params: {
        title: "Agent Storyboard Teaser",
        durationSeconds: 4,
        frames: [
          { timestampMs: 0, title: "Frame 1: Launch" },
          { timestampMs: 2000, title: "Frame 2: Orbit" },
        ],
      },
    });
    expect(vid.action).toBe("infra_media_video_clip");
    const vidData = vid.result as any;
    expect(vidData.status).toBe("GENERATED");
    expect(vidData.frameCount).toBe(2);
    expect(vidData.animatedSvg).toContain("@keyframes cycleFrames");

    // 6. Media Workflow Execute
    const mwf = await infraOperation({
      action: "media_workflow",
      params: {
        jobType: "image",
        payload: {
          prompt: "Durable Pipeline Generation",
          style: "harmonic-waves",
          theme: "dark",
        },
      },
    });
    expect(mwf.action).toBe("infra_media_workflow_execute");
    const mwfData = mwf.result as any;
    expect(mwfData.status).toBe("COMPLETED");
  });
});

