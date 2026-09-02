---
name: autopilot
description: "Stateful autonomous goal-gap advancement and execution engine: Manages state machine transitions, MRR pacing, dataset and outreach batch generation, cron schedule generation, and automated verification loops."
---

# Autopilot & Autonomous Self-Advancement Engine (`autopilot-engine`)

> **Core Doctrine**: Models are reactive; autonomous advancement requires state machines, goal-gap telemetry, and scheduled chronos.

This skill equips agents with the systematic methodology to run long-running commercial ventures, manage goal checkpoints, schedule recurring chronos via Antigravity `schedule`, and execute multi-phase feedback loops until commercial goals ($10,000 MRR) are achieved and stabilized.

---

## 1. The Autonomous Feedback Loop Architecture

```
            ┌─────────────────────────────────────────┐
            │   1. Telemetry & MRR Pacing Inspection  │
            │   (Stripe MRR, Growth Pacing Simulator) │
            └────────────────────┬────────────────────┘
                                 ▼
            ┌─────────────────────────────────────────┐
            │   2. 5 Intrinsic Growth Loops Advancement│
            │   (Client-to-B, Kiosk, Badge, Superbill)│
            └────────────────────┬────────────────────┘
                                 ▼
            ┌─────────────────────────────────────────┐
            │   3. 4 Cross-Domain Feedback Harvesting │
            │   (Design, Microservices, Content, Sci) │
            └────────────────────┬────────────────────┘
                                 ▼
            ┌─────────────────────────────────────────┐
            │   4. Search, pSEO & LLMO Ingestion Ping │
            │   (Sitemap, llms.txt, Cutoff Benchmarks)│
            └────────────────────┬────────────────────┘
                                 ▼
            ┌─────────────────────────────────────────┐
            │   5. Verification & Git Main Sync       │
            │   (Test 0 Fail, Design 0 Error, Push)   │
            └────────────────────┬────────────────────┘
                                 ▼
                     [Goal Met & Stabilized?]
                     /                      \
               YES (Keep Warm)          NO (Pace & Continue)
```

---

## 2. CLI & MCP Tool Actions

Use `Plugin/Workflow` actions or CLI:

```bash
# 1. Execute single autonomous step
bun Plugin/Workflow/cli.ts autopilot --venture=MentalCraft --target-mrr=10000

# 2. Check current state machine checkpoint
bun Plugin/Workflow/cli.ts autopilot status --venture=MentalCraft

# 3. Generate Antigravity Schedule cron spec
bun Plugin/Workflow/cli.ts autopilot cron --venture=MentalCraft --interval=60
```

---

## 3. Antigravity Scheduling Pattern

When orchestrating long-running execution without user intervention:

1. Obtain schedule spec:
   ```typescript
   const spec = generateScheduleSpec({ ventureName: "MentalCraft", targetMrrUsd: 10000 }, 60);
   ```
2. Invoke Antigravity `schedule` tool:
   - `CronExpression`: `"0 * * * *" // Hourly` or `"0 9 * * *" // Daily`
   - `Prompt`: High-priority inspection prompt
   - `TimerCondition`: `"never"`

3. In every cycle, read checkpoint from `~/.config/mentalcraft/autopilot_<venture>_checkpoint.json`, compute new metric gap, execute required sub-actions, advance the state machine, and commit changes.
