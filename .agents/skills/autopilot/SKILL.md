---
name: autopilot
description: "Stateful autonomous goal-gap advancement and execution engine: Manages state machine transitions, MRR pacing, dataset and outreach batch generation, cron schedule generation, and automated verification loops."
---

# Autopilot & Autonomous Self-Advancement Engine (`autopilot-engine`)

> **Core Doctrine**: Models are reactive; autonomous advancement requires state machines, goal-gap telemetry, and scheduled chronos.
> 
> **面对仓库的站立法则**: 无论何时、无论何人，先过此门再写。目标：减少熵增 · 增加复利。原则：自由 · 组合 · 分层 · 渐进 · 优雅 · 自洽 · 克制 · 留白 · 流畅 · 简单 · 鲜活 · 溯源。十二条缺一即停，先收再写。
>
> **Master Governance Axiom (治理宪章)**:
> 1. **减少熵增 (Anti-Entropy)**: 绝不容忍孤岛、过时别名、无消费者的新实体与隐蔽技术债。
> 2. **增加复利 (Compounding Returns)**: 每一个产出均需沉淀为可被飞轮复用的资产，拒绝一次性复制。
> 3. **十二美德**: 自由 · 组合 · 分层 · 渐进 · 优雅 · 自洽 · 克制 · 留白 · 流畅 · 简单 · 鲜活 · 溯源。Ln 只依赖 Ln-1；第一面只给最小完整路径；不写备用未用变体；形式只服务功能。
> 4. **原则驱动自愈 (Autonomous Remediation)**: 持续比对现状与站立法则，主动形成新任务并反哺全域；凡违背，立即收束。

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
