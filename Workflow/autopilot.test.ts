import { describe, test, expect } from "bun:test";
import {
  advanceAutopilotCycle,
  loadAutopilotCheckpoint,
  saveAutopilotCheckpoint,
  generateScheduleSpec,
  formatAutopilotSummary,
  type AutopilotGoalConfig,
} from "./autopilot.ts";
import { workflowOperation } from "./operation.ts";
import { formatWorkflowSummary } from "./core.ts";

describe("Workflow Autopilot & Autonomous Self-Advancement Engine", () => {
  test("loadAutopilotCheckpoint returns a clean default state for new venture", () => {
    const initial = loadAutopilotCheckpoint("TestVenture_" + Date.now());
    expect(initial.version).toBe("1.0.0");
    expect(initial.currentPhase).toBe("IDLE");
    expect(initial.goalAchieved).toBe(false);
    expect(initial.mrrTargetUsd).toBe(10000);
    expect(initial.tickCount).toBe(0);
    expect(initial.history).toBeArray();
  });

  test("generateScheduleSpec produces correct Cron expressions and Prompts", () => {
    const goal: AutopilotGoalConfig = {
      ventureName: "MentalCraft",
      targetMrrUsd: 10000,
    };

    const hourly = generateScheduleSpec(goal, 60);
    expect(hourly.CronExpression).toBe("0 * * * *");
    expect(hourly.Prompt).toContain("MentalCraft");
    expect(hourly.Prompt).toContain("10,000 MRR");
    expect(hourly.TimerCondition).toBe("never");

    const daily = generateScheduleSpec(goal, 1440);
    expect(daily.CronExpression).toBe("0 9 * * *");

    const halfHourly = generateScheduleSpec(goal, 30);
    expect(halfHourly.CronExpression).toBe("*/30 * * * *");
  });

  test("advanceAutopilotCycle executes full step and transitions phase", async () => {
    const goal: AutopilotGoalConfig = {
      ventureName: "MentalCraft",
      targetMrrUsd: 10000,
      proTargetSubs: 350,
      sponsorTargetSubs: 25,
      apiTargetSubs: 5,
    };

    const result = await advanceAutopilotCycle(goal, { persist: false });
    expect(result.success).toBe(true);
    expect(result.tick).toBeGreaterThanOrEqual(1);
    expect(result.mrrCurrentUsd).toBe(10120);
    expect(result.goalAchieved).toBe(true);
    expect(result.newPhase).toBe("GOAL_STABILIZED");
    expect(result.executedActions).toContain("metrics_telemetry_inspected");
    expect(result.executedActions).toContain("five_pillars_audited");
    expect(result.executedActions).toContain("dataset_and_badges_verified");
    expect(result.executedActions).toContain("founder_outreach_verified");
    expect(result.executedActions).toContain("sitemap_and_llmo_verified");

    const formatted = formatAutopilotSummary(result);
    expect(formatted).toContain("Autopilot Cycle");
    expect(formatted).toContain("GOAL ACHIEVED & STABILIZED");
    expect(formatted).toContain("2,454 verified domains");
    expect(formatted).toContain("5,634 generated");
  });

  test("workflowOperation dispatches autopilot_step, autopilot_status, and autopilot_schedule_spec", async () => {
    // 1. Step
    const stepRes = await workflowOperation({
      action: "autopilot_step",
      goal: {
        ventureName: "MentalCraft",
        targetMrrUsd: 10000,
      },
    });
    expect(stepRes.success).toBe(true);
    expect((stepRes.data as any).goalAchieved).toBe(true);
    expect(formatWorkflowSummary(stepRes)).toContain("Autopilot");

    // 2. Status
    const statusRes = await workflowOperation({
      action: "autopilot_status",
      venture_name: "MentalCraft",
    });
    expect(statusRes.success).toBe(true);
    expect((statusRes.data as any).ventureName).toBe("MentalCraft");
    expect(formatWorkflowSummary(statusRes)).toContain("Autopilot Status");

    // 3. Schedule Spec
    const specRes = await workflowOperation({
      action: "autopilot_schedule_spec",
      venture_name: "MentalCraft",
      interval_minutes: 60,
    });
    expect(specRes.success).toBe(true);
    expect((specRes.data as any).CronExpression).toBe("0 * * * *");
    expect(formatWorkflowSummary(specRes)).toContain("Autopilot Schedule Spec");
  });
});
