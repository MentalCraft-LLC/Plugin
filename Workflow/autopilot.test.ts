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
    expect(initial.mrrTargetUsd).toBe(10000);
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
    expect(oneMin.Prompt).toContain("1min Tick");
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

  test("advanceAutopilotCycle auto-advances through multi-objective backlog", async () => {
    const testVenture = "AutoBacklogVenture_" + Date.now();

    // Tick 1: MentalCraft & TractionRank
    const t1 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t1.success).toBe(true);
    expect(t1.objectiveId).toBe("mentalcraft_tractionrank");
    expect(t1.mrrCurrentUsd).toBe(10120);
    expect(t1.goalAchieved).toBe(true);
    expect(t1.nextObjectiveId).toBe("spriteflow_engine");

    // Tick 2: Automatically advances to SpriteFlow
    const t2 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t2.success).toBe(true);
    expect(t2.objectiveId).toBe("spriteflow_engine");
    expect(t2.mrrCurrentUsd).toBe(10480);
    expect(t2.nextObjectiveId).toBe("essay_dual_engine");

    // Tick 3: Automatically advances to Essay Suite
    const t3 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t3.success).toBe(true);
    expect(t3.objectiveId).toBe("essay_dual_engine");
    expect(t3.mrrCurrentUsd).toBe(20000);
    expect(t3.nextObjectiveId).toBe("science_academic_flywheel");

    const formatted = formatAutopilotSummary(t1);
    expect(formatted).toContain("Active Objective");
    expect(formatted).toContain("Auto-Advancing to Next Backlog Goal");
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

    // 3. Schedule Spec (1-min)
    const specRes = await workflowOperation({
      action: "autopilot_schedule_spec",
      venture_name: "MentalCraft",
      interval_minutes: 1,
    });
    expect(specRes.success).toBe(true);
    expect((specRes.data as any).CronExpression).toBe("* * * * *");
    expect(formatWorkflowSummary(specRes)).toContain("Autopilot Schedule Spec");
  });
});
