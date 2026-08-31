#!/usr/bin/env bun
/**
 * Plugin CLI Hub
 *
 * Fast developer command line utility for Holar plugin introspection,
 * direct action execution, health diagnostics, MCP stdio & HTTP launching,
 * interactive REPL console, and automatic documentation generation.
 */

import { BUILTIN_WORKFLOWS, type PluginId } from "./Workflow/core.ts";
import { executeHealthCheck, workflowOperation } from "./Workflow/operation.ts";
import { designOperation } from "./Design/operation.ts";
import { businessOperation } from "./Business/operation.ts";
import { scienceOperation } from "./Science/operation.ts";
import { createBrowserContextOperation } from "./Chrome/operation.ts";
import { createMessageOperation } from "./Message/operation.ts";
import { startGatewayMcpStdio, startGatewayMcpHttp } from "./gateway.ts";
import { createInterface } from "node:readline/promises";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const command = args[0] || "help";

const rawExecuteChrome = createBrowserContextOperation();
const executeChrome = async (input: any) => {
  return await rawExecuteChrome(input, undefined, { isProjectTrusted: () => true }, "cli_session", undefined);
};
const executeMessage = createMessageOperation();

export async function executePluginAction(plugin: string, action: string, jsonArgs: Record<string, unknown> = {}): Promise<unknown> {
  if (plugin === "design") {
    return await designOperation({ action: action as any, ...jsonArgs });
  } else if (plugin === "business") {
    return await businessOperation({ action: action as any, ...jsonArgs });
  } else if (plugin === "science") {
    return await scienceOperation({ action: action as any, ...jsonArgs });
  } else if (plugin === "workflow") {
    return await workflowOperation({ action: action as any, ...jsonArgs });
  } else if (plugin === "chrome") {
    return await executeChrome({ action: action as any, ...jsonArgs });
  } else if (plugin === "message") {
    return await executeMessage({ action: action as any, ...jsonArgs });
  } else {
    throw new Error(`Unknown plugin '${plugin}'. Available: business, science, design, workflow, chrome, message`);
  }
}

export function generateMarkdownCatalog(): string {
  const lines: string[] = [
    "# 📖 MentalCraft Capability & Plugin Catalog",
    "",
    "> Universal, Agent-Less & Host-Agnostic Intelligence Specifications (OpenRPC 1.3 Compatible)",
    "",
    "## 📦 Subsystems Overview",
    "",
    "| Subsystem | Actions | Protocol | Key Domain Scope |",
    "|---|---|---|---|",
    "| `Workflow` | 17 | `holar.workflow.v1` | Multi-plugin compound DAG execution, benchmark suite, OpenRPC/OpenAPI, health diagnostics, telemetry & circuit breaker |",
    "| `Business` | 21 | `holar.business.v1` | 8-Stage Venture Lifecycle (Websites, Apps, Games, Shops), PMF, SEO KD, ASO, Steam, Activation, Unit Economics, Moats |",
    "| `Science` | 16 | `holar.science.v1` | 8-Stage Academic Production Lifecycle: Literature, Methodology, Grants, Authoring, Peer Review, Journals, Patents, Impact |",
    "| `Design` | 10 | `holar.design.v1` | 5-layer hierarchy, tokens, Svelte 5 runes UI generation, on-demand subpaths |",
    "| `Chrome` | 38 | `holar.browser.v1` | Inactive tab driving, CDP inspection, HUD annotations, storage/cookie receipts |",
    "| `Message` | 4 | `holar.message.v1` | Multi-channel priority bus (Telegram > iMessage > Email) with mode-0600 isolation |",
    "",
    "---",
    "",
    "## 🚀 Compound Workflows",
    "",
  ];

  for (const wf of BUILTIN_WORKFLOWS) {
    lines.push(`### \`${wf.id}\` — ${wf.name}`);
    lines.push(`- **Description**: ${wf.description}`);
    lines.push(`- **Required Plugins**: \`${wf.requiredPlugins.join("` ➔ `")}\``);
    lines.push("- **Execution Steps**:");
    for (const s of wf.steps) {
      lines.push(`  ${s.step}. **[${s.plugin}]** \`${s.action}\`: ${s.description}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## 🛠️ CLI Quick Reference");
  lines.push("");
  lines.push("```bash");
  lines.push("# System Health & Diagnostics");
  lines.push("bun cli.ts health");
  lines.push("");
  lines.push("# Live Telemetry & Circuit Breaker Dashboard");
  lines.push("bun cli.ts metrics");
  lines.push("");
  lines.push("bun cli.ts repl");
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

async function startInteractiveRepl() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  console.log("\n⚡ MentalCraft Interactive Plugin REPL (Type 'help' for commands, 'exit' to quit)\n" + "=".repeat(75));

  try {
    while (true) {
      const line = (await rl.question("mentalcraft> ")).trim();
      if (!line) continue;
      if (line === "exit" || line === "quit" || line === "q") break;

      const parts = line.split(/\s+/);
      const sub = parts[0];

      try {
        if (sub === "help") {
          console.log(`
Available REPL Commands:
  list, ls                 List all plugins
  health, doctor           Run diagnostics
  metrics, telemetry       Show live latency & circuit breaker
  workflows, wf            List compound DAG pipelines
  run <workflow_id>        Execute workflow pipeline
  benchmark, bench         Run P50/P90/P99 latency benchmark suite
  export-specs, specs      Export OpenRPC 1.3.2 & OpenAPI 3.1.0 specifications
  openrpc, schema          Export OpenRPC 1.3.2 JSON spec
  openapi                  Export OpenAPI 3.1.0 JSON spec
  exec <p> <a> [json]      Execute single action (e.g. exec business traffic_domain_overview {"domain":"mentalcraft.org"})
  docs, catalog            Generate CATALOG.md documentation
  exit, quit               Exit the REPL
`);
        } else if (sub === "list" || sub === "ls") {
          await mainCommand("list");
        } else if (sub === "health" || sub === "doctor") {
          await mainCommand("health");
        } else if (sub === "metrics" || sub === "telemetry") {
          await mainCommand("metrics");
        } else if (sub === "bench" || sub === "benchmark") {
          await mainCommand("benchmark");
        } else if (sub === "specs" || sub === "export-specs") {
          await mainCommand("export-specs");
        } else if (sub === "openrpc" || sub === "schema") {
          await mainCommand("openrpc");
        } else if (sub === "openapi") {
          await mainCommand("openapi");
        } else if (sub === "workflows" || sub === "wf") {
          await mainCommand("workflows");
        } else if (sub === "run") {
          const wfId = parts[1] || "ecommerce_full_launch_pipeline";
          const res = await workflowOperation({ action: "run_workflow", workflow_id: wfId as any });
          console.log(JSON.stringify(res, null, 2));
        } else if (sub === "exec") {
          const p = parts[1];
          const a = parts[2];
          const jsonStr = parts.slice(3).join(" ");
          const parsed = jsonStr ? JSON.parse(jsonStr) : {};
          const res = await executePluginAction(p, a, parsed);
          console.log(JSON.stringify(res, null, 2));
        } else if (sub === "docs" || sub === "catalog") {
          const doc = generateMarkdownCatalog();
          writeFileSync(join(import.meta.dir, "CATALOG.md"), doc, "utf-8");
          console.log("✓ Generated CATALOG.md");
        } else {
          console.log(`Unknown command '${sub}'. Type 'help' for available commands.`);
        }
      } catch (err: any) {
        console.error(`✗ Error: ${err.message}`);
      }
    }
  } finally {
    rl.close();
  }
}

async function mainCommand(cmd: string) {
  switch (cmd) {
    case "list":
    case "ls": {
      console.log("\n📦 Holar Plugin Registry\n" + "=".repeat(60));
      const plugins = [
        { id: "workflow", name: "Workflow Orchestrator & Health Engine", actions: 17, desc: "Multi-plugin compound DAG execution, latency benchmark suite, OpenRPC/OpenAPI specs & pre-flight health diagnostics" },
        { id: "business", name: "Business & Market Intelligence", actions: 21, desc: "8-Stage Venture Lifecycle (Websites, Apps, Games, Shops), Gefei SEO KD, TrafficCV domain traffic & channels, Stripe Radar" },
        { id: "science", name: "Science & Research Intelligence", actions: 16, desc: "8-Stage Academic Production Lifecycle: Literature, Methodology, Grants, LaTeX, Peer Review, Journals, Patents" },
        { id: "design", name: "Design System & UI Intelligence", actions: 10, desc: "5-layer hierarchy, tokens, Svelte 5 runes UI generation, on-demand subpaths" },
        { id: "chrome", name: "Chrome Automation & Native Bridge", actions: 38, desc: "Inactive-tab driving, CDP, HUD annotations, Storage" },
        { id: "message", name: "Agent Message Bus", actions: 4, desc: "Multi-channel priority dispatching (Telegram > iMessage > Email)" },
        { id: "secret", name: "Local Credential Vault", actions: 2, desc: "Mode-0600 secure token vault" },
      ];
      for (const p of plugins) {
        console.log(`\n🔹 [${p.id.toUpperCase()}] ${p.name}`);
        console.log(`   Description: ${p.desc}`);
        console.log(`   Actions: ${p.actions} supported actions`);
      }
      console.log("\n" + "=".repeat(60));
      break;
    }

    case "workflows":
    case "wf": {
      console.log("\n🔄 Compound Cross-Plugin Workflows\n" + "=".repeat(60));
      for (const wf of BUILTIN_WORKFLOWS) {
        console.log(`\n🚀 ${wf.name} (${wf.id})`);
        console.log(`   Required Plugins: ${wf.requiredPlugins.join(" ➔ ")}`);
        console.log(`   Description: ${wf.description}`);
        console.log("   Steps:");
        for (const s of wf.steps) {
          console.log(`     ${s.step}. [${s.plugin}] ${s.action} - ${s.description}`);
        }
      }
      console.log("\n" + "=".repeat(60));
      break;
    }

    case "status":
    case "top":
    case "dash": {
      const report = await executeHealthCheck();
      const { getSystemTelemetry, getAllWorkflows } = require("./Workflow/operation.ts");
      const telemetry = getSystemTelemetry();
      const wfs = getAllWorkflows();

      console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║  ⚡ MentalCraft Universal Plugin Architecture — Live System Status              ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ Overall Health: ${report.overallStatus === "healthy" ? "🟢 HEALTHY" : "🟡 DEGRADED"} (Score: ${report.healthScore}/100) | Healthy Plugins: ${report.healthyPlugins}/${report.totalPlugins}   ║
║ Protocols: MCP Stdio, HTTP/SSE (Port 3890), OpenRPC 1.3, OpenAPI 3.1           ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ ACTIVE CAPABILITY SUBSYSTEMS (6 Modules / 106 Actions)                         ║
║  • Business  [${report.plugins.business.status === "healthy" ? "🟢 HEALTHY" : "🔴 DEGRADED"}] (21 actions) | 8-Stage Venture Lifecycle (Web/App/Game/Shop)║
║  • Science   [${report.plugins.science.status === "healthy" ? "🟢 HEALTHY" : "🔴 DEGRADED"}] (16 actions) | 8-Stage Academic Production Lifecycle       ║
║  • Design    [${report.plugins.design.status === "healthy" ? "🟢 HEALTHY" : "🔴 DEGRADED"}] (10 actions) | 5-Layer UI, Runes, Tokens, Presets     ║
║  • Workflow  [${report.plugins.workflow.status === "healthy" ? "🟢 HEALTHY" : "🔴 DEGRADED"}] (17 actions) | DAG Engine, OTel Spans, Batch, Benchmark  ║
║  • Chrome    [${report.plugins.chrome.status === "healthy" ? "🟢 HEALTHY" : "🔴 DEGRADED"}] (38 actions) | Tab HUD, Native Bridge, Session Vault  ║
║  • Message   [${report.plugins.message.status === "healthy" ? "🟢 HEALTHY" : "🔴 DEGRADED"}] ( 4 actions) | Telegram, iMessage, Email Secure Bus  ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ METRICS & TELEMETRY                                                            ║
║  Total Invocations: ${telemetry.totalInvocations} | Success Rate: ${telemetry.overallSuccessRate}% | Tracked Actions: ${Object.keys(telemetry.metricsByAction).length} ║
║  Registered Workflows: ${wfs.length} total (${BUILTIN_WORKFLOWS.length} Builtin, ${wfs.length - BUILTIN_WORKFLOWS.length} Custom)               ║
╚════════════════════════════════════════════════════════════════════════════════╝
`);
      break;
    }

    case "health":
    case "doctor": {
      const fixFlag = args.includes("--fix");
      if (fixFlag) {
        console.log("\n🔧 Running Automatic Diagnostics & Self-Repair...");
        const { installMcpSchemasToAgy } = require("./Workflow/operation.ts");
        const installRes = installMcpSchemasToAgy();
        console.log(`✓ Re-installed ${installRes.installedCount} tool schemas into Antigravity`);
      }

      const report = await executeHealthCheck();
      console.log("\n🩺 Plugin System Health & Diagnostics Dashboard\n" + "=".repeat(60));
      console.log(`Status: ${report.overallStatus === "healthy" ? "🟢 HEALTHY" : "🟡 DEGRADED"} (${report.healthScore}/100) | Healthy Plugins: ${report.healthyPlugins}/${report.totalPlugins}`);
      for (const [id, p] of Object.entries(report.plugins)) {
        console.log(`\n🔹 [${id.toUpperCase()}] ${p.name} [${p.status.toUpperCase()}] (${p.latencyMs}ms)`);
        for (const c of p.checks) {
          console.log(`   ${c.passed ? "✓" : "✗"} ${c.name}: ${c.detail}`);
        }
      }
      console.log("\n" + "=".repeat(60));
      break;
    }

    case "pipe": {
      const expr = args.slice(1).join(" ");
      if (!expr) {
        console.error("Usage: bun Plugin/cli.ts pipe \"plugin1.action1 -> plugin2.action2\"");
        process.exit(1);
      }

      const steps = expr.split("->").map((s) => s.trim());
      console.log(`\n🔗 Executing Piped Sequence: ${steps.join(" ➔ ")}\n` + "=".repeat(60));
      let currentData: any = {};

      for (let i = 0; i < steps.length; i++) {
        const [p, a] = steps[i].split(".");
        console.log(`▶ Stage ${i + 1}: ${p}.${a}`);
        const res = await executePluginAction(p, a, currentData) as any;
        currentData = res.data ?? res;
      }

      console.log("\n✓ Piped Pipeline Completed Successfully!");
      console.log(JSON.stringify(currentData, null, 2));
      console.log("=".repeat(60) + "\n");
      break;
    }

    case "run-workflow":
    case "rw": {
      const wfId = args[1] as any;
      if (!wfId) {
        console.error("Usage: bun Plugin/cli.ts run-workflow <workflow_id>");
        process.exit(1);
      }
      console.log(`\n🚀 Executing workflow '${wfId}'...`);
      const res = await workflowOperation({ action: "run_workflow", workflow_id: wfId });
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case "exec":
    case "run": {
      const plugin = args[1];
      const action = args[2];
      const jsonArgs = args[3] ? JSON.parse(args[3]) : {};

      if (!plugin || !action) {
        console.error("Usage: bun Plugin/cli.ts exec <plugin> <action> [json-args]");
        process.exit(1);
      }

      console.log(`\n⚡ Executing ${plugin}.${action}...`);
      const res = await executePluginAction(plugin, action, jsonArgs);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case "history": {
      const res = await workflowOperation({ action: "get_workflow_history" });
      console.log("\n📜 Workflow Run History\n" + "=".repeat(60));
      console.log(JSON.stringify(res.data, null, 2));
      console.log("\n" + "=".repeat(60));
      break;
    }

    case "export-config":
    case "config": {
      const target = (args[1] as any) ?? "claude_desktop";
      const res = await workflowOperation({ action: "export_config", client_target: target });
      const data = res.data as any;
      console.log(`\n📋 MCP Client Config [${target}]\n` + "=".repeat(60));
      console.log(JSON.stringify(data.configs, null, 2));
      console.log("\nInstructions:");
      for (const inst of data.commandInstructions) {
        console.log(`  - ${inst}`);
      }
      console.log("\n" + "=".repeat(60));
      break;
    }

    case "install-mcp":
    case "install": {
      const res = await workflowOperation({ action: "install_mcp_schemas" });
      const data = res.data as any;
      console.log("\n⚡ Auto-Installing MentalCraft MCP Schemas into Antigravity\n" + "=".repeat(60));
      console.log(`✓ Installed ${data.installedCount} tool schemas:`);
      for (const p of data.installedPaths) {
        console.log(`  - ${p}`);
      }
      console.log("\nAll subagents and AGY prompts now have native access to all 5 plugin servers!");
      console.log("=".repeat(60) + "\n");
      break;
    }

    case "export-specs":
    case "specs": {
      const outDirArg = args.find((a) => a.startsWith("--dir="));
      const outDir = outDirArg ? outDirArg.split("=")[1] : import.meta.dir;
      const rpcRes = await workflowOperation({ action: "export_openrpc_spec" });
      const apiRes = await workflowOperation({ action: "export_openapi_spec" });

      const rpcFile = join(outDir, "openrpc.json");
      const apiFile = join(outDir, "openapi.json");

      writeFileSync(rpcFile, JSON.stringify(rpcRes.data, null, 2), "utf-8");
      writeFileSync(apiFile, JSON.stringify(apiRes.data, null, 2), "utf-8");

      console.log("\n📋 Exported Interface Specifications\n" + "=".repeat(65));
      console.log(`✓ OpenRPC 1.3.2: ${rpcFile}`);
      console.log(`  (${(rpcRes.data as any).totalMethods} methods across ${(rpcRes.data as any).totalPlugins} plugins)`);
      console.log(`✓ OpenAPI 3.1.0: ${apiFile}`);
      console.log(`  (${Object.keys((apiRes.data as any).paths).length} REST paths registered)`);
      console.log("=".repeat(65) + "\n");
      break;
    }

    case "schema":
    case "openrpc": {
      const res = await workflowOperation({ action: "export_openrpc_spec" });
      console.log(JSON.stringify(res.data, null, 2));
      break;
    }

    case "openapi": {
      const res = await workflowOperation({ action: "export_openapi_spec" });
      console.log(JSON.stringify(res.data, null, 2));
      break;
    }

    case "docs":
    case "catalog": {
      const doc = generateMarkdownCatalog();
      const targetFile = join(import.meta.dir, "CATALOG.md");
      writeFileSync(targetFile, doc, "utf-8");
      console.log(`\n✓ Generated documentation catalog: ${targetFile}\n`);
      break;
    }

    case "benchmark":
    case "bench": {
      const iterArg = args.find((a) => a.startsWith("--iterations=") || a.startsWith("-n="));
      const iterations = iterArg ? parseInt(iterArg.split("=")[1], 10) : 200;

      console.log(`\n⚡ MentalCraft Multi-Subsystem Latency & Throughput Benchmark Suite (${iterations} iterations per action)\n` + "=".repeat(92));

      const res = await workflowOperation({ action: "benchmark", benchmark_options: { iterations } });
      const data = res.data as any;

      console.log("Subsystem   | Action / Target                          |  P50 (ms) |  P90 (ms) |  P99 (ms) | Throughput");
      console.log("------------+------------------------------------------+-----------+-----------+-----------+------------");

      for (const [subsystem, list] of Object.entries(data.subsystems) as any[]) {
        for (const item of list) {
          const subCol = subsystem.padEnd(11);
          const actCol = item.action.slice(0, 40).padEnd(40);
          const p50Col = item.p50Ms.toFixed(3).padStart(9);
          const p90Col = item.p90Ms.toFixed(3).padStart(9);
          const p99Col = item.p99Ms.toFixed(3).padStart(9);
          const opsCol = `${item.opsPerSec.toLocaleString()} ops/s`.padStart(11);
          console.log(`${subCol} | ${actCol} | ${p50Col} | ${p90Col} | ${p99Col} | ${opsCol}`);
        }
      }

      console.log("=".repeat(92));
      console.log(`Suite Summary: ${data.totalActionsTested} actions tested across ${data.totalSubsystems} subsystems | Total Ops: ${data.overallOpsPerSec.toLocaleString()} ops/sec`);
      console.log(`Percentiles  : P50 Avg: ${data.summary.avgP50Ms} ms | P90 Avg: ${data.summary.avgP90Ms} ms | P99 Avg: ${data.summary.avgP99Ms} ms`);
      console.log(`Peak Speed   : Fastest: ${data.summary.fastestAction.label} (${data.summary.fastestAction.opsPerSec.toLocaleString()} ops/sec, P50: ${data.summary.fastestAction.p50Ms}ms)`);
      console.log("=".repeat(92) + "\n");
      break;
    }

    case "spriteflow":
    case "sprite": {
      console.log("\n🚀 Executing SpriteFlow $10,000 MRR Zero-Cost Growth Pipeline...\n" + "=".repeat(80));
      const res = await workflowOperation({
        action: "run_workflow",
        workflow_id: "spriteflow_10k_mrr_growth_pipeline",
        parameters: { venture_name: "SpriteFlow" },
      });
      const data = res.data as any;
      console.log(`Pipeline: ${data.workflowName} (${data.stepsCount} steps completed in ${data.durationMs}ms)`);
      console.log("-".repeat(80));
      for (const s of data.stepResults) {
        console.log(`✓ Step ${s.step}: [${s.plugin}] ${s.action} (${s.durationMs}ms)`);
      }
      console.log("=".repeat(80) + "\n");
      break;
    }

    case "paper-audit":
    case "paper": {
      const title = args[1] || "算法代哺：数智社会的亲子关系变迁";
      console.log(`\n🎓 Executing Top Social Science Publication Pipeline for '${title}'...\n` + "=".repeat(80));
      const res = await workflowOperation({
        action: "run_workflow",
        workflow_id: "social_science_top_journal_pipeline",
        parameters: {
          manuscript_title: title,
          target_cssci_journal: "《中国社会科学》",
          target_ssci_journal: "Nature Human Behaviour",
        },
      });
      const data = res.data as any;
      console.log(`Pipeline: ${data.workflowName} (${data.stepsCount} steps completed in ${data.durationMs}ms)`);
      console.log("-".repeat(80));
      for (const s of data.stepResults) {
        console.log(`✓ Step ${s.step}: [${s.plugin}] ${s.action} (${s.durationMs}ms)`);
      }
      console.log("=".repeat(80) + "\n");
      break;
    }

    case "metrics":
    case "telemetry": {
      const res = await workflowOperation({ action: "get_metrics" });
      const data = res.data as any;
      console.log("\n📊 MentalCraft In-Process Telemetry & Circuit Breaker Dashboard\n" + "=".repeat(75));
      console.log(`Uptime: ${data.uptimeSeconds}s | Total Calls: ${data.totalInvocations} | Success Rate: ${data.overallSuccessRate}%`);
      console.log("-".repeat(75));
      const actions = Object.entries(data.metricsByAction);
      if (actions.length === 0) {
        console.log("No actions recorded yet. Run workflows or benchmarks to populate telemetry.");
      } else {
        for (const [name, m] of actions as any[]) {
          const stateIcon = m.circuitState === "CLOSED" ? "🟢" : m.circuitState === "HALF_OPEN" ? "🟡" : "🔴";
          console.log(`${stateIcon} ${name.padEnd(36)} | Calls: ${String(m.calls).padStart(4)} | Avg: ${m.avgDurationMs}ms | p95: ${m.p95DurationMs}ms | State: ${m.circuitState}`);
        }
      }
      console.log("=".repeat(75) + "\n");
      break;
    }

    case "trace":
    case "spans": {
      const res = await workflowOperation({ action: "export_trace" });
      console.log(JSON.stringify(res.data, null, 2));
      break;
    }

    case "graph":
    case "mermaid": {
      const wfId = (args[1] as any) ?? "launch_product_campaign";
      const res = await workflowOperation({ action: "export_mermaid_dag", workflow_id: wfId });
      const data = res.data as any;
      console.log(`\n📊 Mermaid DAG Graph [${wfId}]\n` + "=".repeat(60));
      console.log("```mermaid\n" + data.mermaidCode + "\n```");
      console.log("=".repeat(60) + "\n");
      break;
    }

    case "batch": {
      const jsonStr = args.slice(1).join(" ");
      if (!jsonStr) {
        console.error("Usage: bun Plugin/cli.ts batch '[{\"id\":\"t1\",\"plugin\":\"business\",\"action\":\"traffic_domain_overview\",\"parameters\":{\"domain\":\"example.com\"}}]'");
        process.exit(1);
      }
      const tasks = JSON.parse(jsonStr);
      console.log(`\n⚡ Running Batch Execution of ${tasks.length} concurrent tasks...\n` + "=".repeat(60));
      const res = await workflowOperation({ action: "batch_run", tasks });
      console.log(JSON.stringify(res.data, null, 2));
      console.log("=".repeat(60) + "\n");
      break;
    }

    case "repl":
    case "i": {
      await startInteractiveRepl();
      break;
    }

    case "serve": {
      const httpFlag = args.includes("--http");
      const portArg = args.find((a) => a.startsWith("--port="));
      const port = portArg ? parseInt(portArg.split("=")[1], 10) : 3890;

      if (httpFlag || portArg) {
        startGatewayMcpHttp(port);
      } else {
        console.error("Starting MentalCraft Gateway MCP Stdio Server...");
        startGatewayMcpStdio();
      }
      break;
    }

    case "help":
    default: {
      console.log(`
MentalCraft Plugin CLI Hub

Commands:
  list, ls                 List all registered capability plugins
  health, doctor           Run comprehensive diagnostics across all plugins
  workflows, wf            List compound cross-plugin automation workflows
  run-workflow <id>        Execute a compound workflow pipeline
  history                  View past workflow execution receipts
  export-config [client]   Generate MCP config JSON for Claude Desktop / Cursor
  export-specs [--dir=dir] Export OpenRPC 1.3.2 and OpenAPI 3.1.0 JSON specs
  install-mcp              Auto-install tool schemas to Antigravity MCP directory
  schema, openrpc          Export complete OpenRPC 1.3.2 JSON specification
  openapi                  Export complete OpenAPI 3.1.0 JSON specification
  docs, catalog            Generate Markdown CATALOG.md documentation
  benchmark, bench         Run P50/P90/P99 latency & ops/sec benchmark suite
  metrics, telemetry       Show live telemetry & circuit breaker status
  repl, i                  Launch interactive developer REPL shell
  exec <p> <a> [d]         Execute an action on a plugin directly
  serve [--http] [--port]  Launch master MCP server (Stdio or HTTP/SSE)
  help                     Show this help message
`);
      break;
    }
  }
}

if (import.meta.main) {
  mainCommand(command).catch(console.error);
}
