#!/usr/bin/env bun
/**
 * Plugin CLI Hub
 *
 * Fast developer command line utility for Holar plugin introspection,
 * direct action execution, health diagnostics, MCP stdio & HTTP launching,
 * and auto-registration into Antigravity/Claude/Cursor environments.
 */

import { BUILTIN_WORKFLOWS, type PluginId } from "./Workflow/core.ts";
import { executeHealthCheck, workflowOperation } from "./Workflow/operation.ts";
import { designOperation } from "./Design/operation.ts";
import { businessOperation } from "./Business/operation.ts";
import { scienceOperation } from "./Science/operation.ts";
import { createBrowserContextOperation } from "./Chrome/operation.ts";
import { createMessageOperation } from "./Message/operation.ts";
import { startGatewayMcpStdio, startGatewayMcpHttp } from "./gateway.ts";

const args = process.argv.slice(2);
const command = args[0] || "help";

const executeChrome = createBrowserContextOperation();
const executeMessage = createMessageOperation();

async function main() {
  switch (command) {
    case "list":
    case "ls": {
      console.log("\n📦 Holar Plugin Registry\n" + "=".repeat(60));
      const plugins = [
        { id: "workflow", name: "Workflow Orchestrator & Health Engine", actions: 8, desc: "Multi-plugin compound DAG execution & pre-flight health diagnostics" },
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
      const plugin = args[1] as PluginId;
      const action = args[2];
      const jsonArgs = args[3] ? JSON.parse(args[3]) : {};

      if (!plugin || !action) {
        console.error("Usage: bun Plugin/cli.ts exec <plugin> <action> [json-args]");
        process.exit(1);
      }

      console.log(`\n⚡ Executing ${plugin}.${action}...`);
      let res: unknown;
      if (plugin === "design") {
        res = await designOperation({ action: action as any, ...jsonArgs });
      } else if (plugin === "business") {
        res = await businessOperation({ action: action as any, ...jsonArgs });
      } else if (plugin === "science") {
        res = await scienceOperation({ action: action as any, ...jsonArgs });
      } else if (plugin === "workflow" as any) {
        res = await workflowOperation({ action: action as any, ...jsonArgs });
      } else if (plugin === "chrome" as any) {
        res = await executeChrome({ action: action as any, ...jsonArgs });
      } else if (plugin === "message" as any) {
        res = await executeMessage({ action: action as any, ...jsonArgs });
      } else {
        console.error(`Execution for '${plugin}' not directly supported in CLI quick-exec.`);
        process.exit(1);
      }
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
        // Warmup
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
  exec <p> <a> [d]         Execute an action on a plugin directly
  serve [--http] [--port]  Launch master MCP server (Stdio or HTTP/SSE)
  help                     Show this help message
`);
      break;
    }
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
