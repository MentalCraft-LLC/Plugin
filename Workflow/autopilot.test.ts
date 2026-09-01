import { describe, test, expect } from "bun:test";
import {
  advanceAutopilotCycle,
  loadAutopilotCheckpoint,
  saveAutopilotCheckpoint,
  generateScheduleSpec,
  formatAutopilotSummary,
  AUTOPILOT_OBJECTIVES,
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
    expect(initial.liveMrrUsd).toBe(0);
    expect(initial.mrrGapUsd).toBe(10120);
    expect(initial.tickCount).toBe(0);
    expect(initial.activeObjectiveIndex).toBe(0);
    expect(initial.history).toBeArray();
  });

  test("generateScheduleSpec produces correct 1-min and multi-interval Cron expressions", () => {
    const goal: AutopilotGoalConfig = {
      ventureName: "MentalCraft",
      targetMrrUsd: 10000,
    };

    // 1-min cron
    const oneMin = generateScheduleSpec(goal, 1);
    expect(oneMin.CronExpression).toBe("* * * * *");
    expect(oneMin.Prompt).toContain("1-Min Tick");
    expect(oneMin.TimerCondition).toBe("never");

    // 3-min cron
    const threeMin = generateScheduleSpec(goal, 3);
    expect(threeMin.CronExpression).toBe("*/3 * * * *");

    // Hourly
    const hourly = generateScheduleSpec(goal, 60);
    expect(hourly.CronExpression).toBe("0 * * * *");

    // Daily
    const daily = generateScheduleSpec(goal, 1440);
    expect(daily.CronExpression).toBe("0 9 * * *");
  });

  test("advanceAutopilotCycle measures realistic live MRR and tracks Goal-Gap", async () => {
    const testVenture = "RealTelemetryVenture_" + Date.now();

    // Default pre-launch state (0 live paying subscribers)
    const t1 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t1.success).toBe(true);
    expect(t1.objectiveId).toBe("mentalcraft_tractionrank");
    expect(t1.liveMrrUsd).toBe(0);
    expect(t1.targetMrrUsd).toBe(10120);
    expect(t1.mrrGapUsd).toBe(10120);
    expect(t1.progressPercent).toBe(0);
    expect(t1.goalAchieved).toBe(false);
    expect(t1.newPhase).toBe("CONVERSION_OPTIMIZATION");

    // When actual paying subscribers are converted
    const t2 = await advanceAutopilotCycle({
      ventureName: testVenture,
      liveProSubs: 350,
      liveSponsorSubs: 25,
      liveApiSubs: 5,
    });
    expect(t2.success).toBe(true);
    expect(t2.liveMrrUsd).toBe(10120);
    expect(t2.mrrGapUsd).toBe(0);
    expect(t2.progressPercent).toBe(100);
    expect(t2.goalAchieved).toBe(true);
    expect(t2.newPhase).toBe("GOAL_STABILIZED");

    const formatted = formatAutopilotSummary(t1);
    expect(formatted).toContain("Live MRR (Realized)");
    expect(formatted).toContain("MRR Gap Remaining");
    expect(formatted).toContain("$10,120");
  });

  test("workflowOperation dispatches autopilot_step, autopilot_status, and autopilot_schedule_spec", async () => {
    const vName = "WorkflowDispatchTest_" + Date.now();
    // 1. Step with realistic gap
    const stepRes = await workflowOperation({
      action: "autopilot_step",
      goal: {
        ventureName: vName,
        targetMrrUsd: 10000,
      },
    });
    expect(stepRes.success).toBe(true);
    expect((stepRes.data as any).liveMrrUsd).toBe(0);
    expect((stepRes.data as any).mrrGapUsd).toBe(10120);

    // 2. Status
    const statusRes = await workflowOperation({
      action: "autopilot_status",
      venture_name: vName,
    });
    expect(statusRes.success).toBe(true);
    expect((statusRes.data as any).ventureName).toBe(vName);

    // 3. Schedule Spec (1-min)
    const specRes = await workflowOperation({
      action: "autopilot_schedule_spec",
      venture_name: vName,
      interval_minutes: 1,
    });
    expect(specRes.success).toBe(true);
    expect((specRes.data as any).CronExpression).toBe("* * * * *");
    expect(formatWorkflowSummary(specRes)).toContain("Autopilot Schedule Spec");
  });
});
