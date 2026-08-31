#!/usr/bin/env bun
/**
 * Plugin CLI Hub
 *
 * Fast developer command line utility for Holar plugin introspection,
 * direct action execution, health diagnostics, and MCP stdio launching.
 */

import { BUILTIN_WORKFLOWS, type PluginId } from "./Workflow/core.ts";
import { executeHealthCheck, workflowOperation } from "./Workflow/operation.ts";
import { designOperation } from "./Design/operation.ts";
import { businessOperation } from "./Business/operation.ts";
import { scienceOperation } from "./Science/operation.ts";
import { startGatewayMcpStdio } from "./gateway.ts";

const args = process.argv.slice(2);
const command = args[0] || "help";

async function main() {
  switch (command) {
    case "list":
    case "ls": {
      console.log("\n📦 Holar Plugin Registry\n" + "=".repeat(60));
      const plugins = [
        { id: "chrome", name: "Chrome Automation & Native Bridge", actions: 38, desc: "Inactive-tab driving, CDP, HUD annotations, Storage" },
        { id: "design", name: "Design System & UI Intelligence", actions: 10, desc: "5-layer hierarchy, tokens, Svelte 5 runes UI generation, on-demand subpaths" },
        { id: "business", name: "Business & Market Intelligence", actions: 11, desc: "Gefei SEO KD, TrafficCV domain traffic & channels, Stripe Radar leaderboards" },
        { id: "science", name: "Science & Research Intelligence", actions: 7, desc: "Clinical scoring (GAD-7/PHQ-9), 988 crisis safety, literature & patent novelty" },
        { id: "workflow", name: "Workflow Orchestrator & Health Engine", actions: 4, desc: "Multi-plugin compound DAG execution & pre-flight health diagnostics" },
        { id: "message", name: "Agent Message Bus", actions: 3, desc: "Multi-channel priority dispatching (Telegram > iMessage > Email)" },
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

    case "serve": {
      console.error("Starting MentalCraft Gateway MCP Stdio Server...");
      startGatewayMcpStdio();
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
  exec <p> <a> [d]         Execute an action on a plugin directly
  serve                    Launch the unified master MCP stdio server
  help                     Show this help message
`);
      break;
    }
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
