import { describe, test, expect } from "bun:test";
import {
  advanceAutopilotCycle,
  loadAutopilotCheckpoint,
  saveAutopilotCheckpoint,
  generateScheduleSpec,
  formatAutopilotSummary,
  AUTOPILOT_OBJECTIVES,
  TARGET_MENTALCRAFT_MRR,
  type AutopilotGoalConfig,
} from "./autopilot.ts";
import { workflowOperation } from "./operation.ts";
import { formatWorkflowSummary } from "./core.ts";

describe("MentalCraft $10,000 MRR 5-Pillar Autopilot Engine", () => {
  test("loadAutopilotCheckpoint returns a clean default state for new venture", () => {
    const initial = loadAutopilotCheckpoint("TestMentalCraft_" + Date.now());
    expect(initial.version).toBe("1.0.0");
    expect(initial.currentPhase).toBe("IDLE");
    expect(initial.goalAchieved).toBe(false);
    expect(initial.liveMrrUsd).toBe(0);
    expect(initial.mrrGapUsd).toBe(TARGET_MENTALCRAFT_MRR);
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
    expect(oneMin.Prompt).toContain("10,000 MRR");
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

  test("advanceAutopilotCycle measures realistic live MRR and cycles 5 MentalCraft pillars", async () => {
    const testVenture = "MentalCraftPillarVenture_" + Date.now();

    // Pillar 1: SEO & LLMO
    const t1 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t1.success).toBe(true);
    expect(t1.objectiveId).toBe("mentalcraft_seo_llmo");
    expect(t1.liveMrrUsd).toBe(0);
    expect(t1.targetMrrUsd).toBe(TARGET_MENTALCRAFT_MRR);
    expect(t1.mrrGapUsd).toBe(TARGET_MENTALCRAFT_MRR);
    expect(t1.progressPercent).toBe(0);
    expect(t1.goalAchieved).toBe(false);
    expect(t1.newPhase).toBe("CONVERSION_OPTIMIZATION");

    // Pillar 2: EEAT
    const t2 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t2.success).toBe(true);
    expect(t2.objectiveId).toBe("mentalcraft_eeat_clinical");
    expect(t2.targetMrrUsd).toBe(TARGET_MENTALCRAFT_MRR);

    // Pillar 3: Funnel
    const t3 = await advanceAutopilotCycle({ ventureName: testVenture });
    expect(t3.success).toBe(true);
    expect(t3.objectiveId).toBe("mentalcraft_funnel_conversion");
    expect(t3.targetMrrUsd).toBe(TARGET_MENTALCRAFT_MRR);

    // When 350 Pro @ $19 + 17 Clinic @ $200 are achieved
    const tAchieved = await advanceAutopilotCycle({
      ventureName: testVenture,
      liveProSubs: 350,
      liveClinicSubs: 17,
    });
    expect(tAchieved.success).toBe(true);
    expect(tAchieved.liveMrrUsd).toBeGreaterThanOrEqual(10000);
    expect(tAchieved.mrrGapUsd).toBe(0);
    expect(tAchieved.progressPercent).toBeGreaterThanOrEqual(100);
    expect(tAchieved.goalAchieved).toBe(true);
    expect(tAchieved.newPhase).toBe("GOAL_STABILIZED");

    const formatted = formatAutopilotSummary(t1);
    expect(formatted).toContain("Active Growth Pillar");
    expect(formatted).toContain("mentalcraft.org");
    expect(formatted).toContain("$10,000 MRR Goal");
  });

  test("workflowOperation dispatches autopilot_step, autopilot_status, and autopilot_schedule_spec", async () => {
    const vName = "MentalCraftOperationTest_" + Date.now();
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
    expect((stepRes.data as any).mrrGapUsd).toBe(TARGET_MENTALCRAFT_MRR);

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

  test("computeAdaptiveRespiration correctly transitions through SURGE, GROWTH, CRUISE, and REST gears", () => {
    const { computeAdaptiveRespiration } = require("./autopilot.ts");

    // 1. SURGE on error
    const surge = computeAdaptiveRespiration({ hasErrors: true });
    expect(surge.gear).toBe("SURGE");
    expect(surge.delaySeconds).toBe(10);
    expect(surge.reason).toContain("🔴 [SURGE]");

    // 2. GROWTH on active work
    const growth = computeAdaptiveRespiration({ hasActiveWork: true });
    expect(growth.gear).toBe("GROWTH");
    expect(growth.delaySeconds).toBe(30);
    expect(growth.reason).toContain("🟡 [GROWTH]");

    // 3. CRUISE on initial clean state
    const cruise = computeAdaptiveRespiration({ idleStreak: 0 });
    expect(cruise.gear).toBe("CRUISE");
    expect(cruise.delaySeconds).toBe(60);
    expect(cruise.reason).toContain("🟢 [CRUISE]");

    // 4. REST on extended clean streak
    const rest = computeAdaptiveRespiration({ idleStreak: 5 });
    expect(rest.gear).toBe("REST");
    expect(rest.delaySeconds).toBe(300);
    expect(rest.reason).toContain("⚪ [REST]");
  });
});
