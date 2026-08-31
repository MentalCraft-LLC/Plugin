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

const executeChrome = createBrowserContextOperation();
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
    "| `Workflow` | 9 | `holar.workflow.v1` | Multi-plugin compound DAG execution, health diagnostics, telemetry & circuit breaker |",
    "| `Business` | 11 | `holar.business.v1` | Google SEO KD (0-100), link budgets, TrafficCV traffic forensics, Stripe Radar leaderboards |",
    "| `Science` | 7 | `holar.science.v1` | Clinical psychometrics (GAD-7/PHQ-9), 988 suicide safety, literature & patent novelty |",
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
  lines.push("# Execute Compound Workflow");
  lines.push("bun cli.ts run-workflow clinical_study_to_screener");
  lines.push("");
  lines.push("# Microsecond Benchmark Suite");
  lines.push("bun cli.ts bench");
  lines.push("");
  lines.push("# Interactive Developer REPL");
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
  bench                    Run microsecond benchmark suite
  exec <p> <a> [json]      Execute single action (e.g. exec business traffic_domain_overview {"domain":"mentalcraft.org"})
  docs                     Generate CATALOG.md documentation
  exit, quit               Exit the REPL
`);
        } else if (sub === "list" || sub === "ls") {
          await mainCommand("list");
        } else if (sub === "health" || sub === "doctor") {
          await mainCommand("health");
        } else if (sub === "metrics" || sub === "telemetry") {
          await mainCommand("metrics");
        } else if (sub === "bench") {
          await mainCommand("bench");
        } else if (sub === "workflows" || sub === "wf") {
          await mainCommand("workflows");
        } else if (sub === "run") {
          const wfId = parts[1] || "clinical_study_to_screener";
          const res = await workflowOperation({ action: "run_workflow", workflow_id: wfId as any });
          console.log(JSON.stringify(res, null, 2));
        } else if (sub === "exec") {
          const p = parts[1];
          const a = parts[2];
          const jsonStr = parts.slice(3).join(" ");
          const parsed = jsonStr ? JSON.parse(jsonStr) : {};
          const res = await executePluginAction(p, a, parsed);
          console.log(JSON.stringify(res, null, 2));
        } else if (sub === "docs") {
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
        { id: "workflow", name: "Workflow Orchestrator & Health Engine", actions: 9, desc: "Multi-plugin compound DAG execution & pre-flight health diagnostics" },
        { id: "business", name: "Business & Market Intelligence", actions: 11, desc: "Gefei SEO KD, TrafficCV domain traffic & channels, Stripe Radar leaderboards" },
        { id: "science", name: "Science & Research Intelligence", actions: 7, desc: "Clinical scoring (GAD-7/PHQ-9), 988 crisis safety, literature & patent novelty" },
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

    case "health":
    case "doctor": {
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

    case "schema":
    case "openrpc": {
      const res = await workflowOperation({ action: "export_schema_catalog" });
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

    case "bench": {
      console.log("\n⚡ Benchmarking In-Process Plugin Execution Performance (1,000 iterations each)\n" + "=".repeat(70));
      const targets = [
        { name: "Science: score_scale (GAD-7)", fn: () => scienceOperation({ action: "score_scale", scale: "gad7", answers: { q1: 3, q2: 2, q3: 3 } }) },
        { name: "Science: crisis_boundary_check", fn: () => scienceOperation({ action: "crisis_boundary_check", answers: { item9: 2 } }) },
        { name: "Business: traffic_domain_overview", fn: () => businessOperation({ action: "traffic_domain_overview", domain: "mentalcraft.org" }) },
        { name: "Business: product_traction_score", fn: () => businessOperation({ action: "product_traction_score", domain: "mentalcraft.org" }) },
        { name: "Design: catalog query", fn: () => designOperation({ action: "catalog", layer: "component" }) },
        { name: "Design: generate_ui (Runes)", fn: () => designOperation({ action: "generate_ui", intent: "screener" }) },
        { name: "Design: resolve_imports (AST)", fn: () => designOperation({ action: "resolve_imports", components: ["Button", "Card", "Dialog"] }) },
        { name: "Workflow: dry_run pipeline", fn: () => workflowOperation({ action: "dry_run", workflow_id: "launch_product_campaign" }) },
      ];

      const iterations = 1000;
      for (const t of targets) {
        for (let i = 0; i < 50; i++) await t.fn();

        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          await t.fn();
        }
        const totalMs = performance.now() - start;
        const avgMs = totalMs / iterations;
        const opsPerSec = Math.round((iterations / totalMs) * 1000);

        console.log(`🔹 ${t.name.padEnd(42)} | ${avgMs.toFixed(3)} ms/op | ${opsPerSec.toLocaleString().padStart(9)} ops/sec`);
      }
      console.log("=".repeat(70) + "\n");
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
  install-mcp              Auto-install tool schemas to Antigravity MCP directory
  schema, openrpc          Export complete OpenRPC 1.3 JSON specification
  docs, catalog            Generate Markdown CATALOG.md documentation
  bench                    Run microsecond benchmark performance suite
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
