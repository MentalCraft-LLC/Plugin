#!/usr/bin/env bun
/**
 * Plugin CLI Hub
 *
 * Fast developer command line utility for Holar plugin introspection,
 * direct action execution, health verification, and MCP stdio launching.
 */

import { PLUGIN_REGISTRY, COMPOUND_WORKFLOWS, type PluginId } from "./registry.ts";
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
      for (const [id, p] of Object.entries(PLUGIN_REGISTRY)) {
        console.log(`\n🔹 [${id.toUpperCase()}] ${p.name} (v${p.version})`);
        console.log(`   Pillar: ${p.pillar}`);
        console.log(`   Description: ${p.description}`);
        console.log(`   Actions (${p.actionsCount}): ${p.actions.slice(0, 5).join(", ")}${p.actions.length > 5 ? "..." : ""}`);
      }
      console.log("\n" + "=".repeat(60));
      break;
    }

    case "workflows":
    case "wf": {
      console.log("\n🔄 Compound Cross-Plugin Workflows\n" + "=".repeat(60));
      for (const wf of COMPOUND_WORKFLOWS) {
        console.log(`\n🚀 ${wf.name} (${wf.id})`);
        console.log(`   Plugins: ${wf.participatingPlugins.join(" ➔ ")}`);
        console.log(`   Description: ${wf.description}`);
        console.log("   Steps:");
        for (const s of wf.pipelineSteps) {
          console.log(`     ${s.step}. [${s.plugin}] ${s.action} - ${s.description}`);
        }
      }
      console.log("\n" + "=".repeat(60));
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
        res = await designOperation({ action, ...jsonArgs });
      } else if (plugin === "business") {
        res = await businessOperation({ action, ...jsonArgs });
      } else if (plugin === "science") {
        res = await scienceOperation({ action, ...jsonArgs });
      } else {
        console.error(`Execution for '${plugin}' not directly supported in CLI quick-exec.`);
        process.exit(1);
      }
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    case "health":
    case "doctor": {
      const { runPluginHealthCheck } = await import("./health.ts");
      const report = await runPluginHealthCheck();
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
  list, ls          List all registered capability plugins
  health, doctor    Run comprehensive diagnostics across all 6 plugins
  workflows, wf     List compound cross-plugin automation workflows
  exec <p> <a> [d]  Execute an action on a plugin directly
  serve             Launch the unified master MCP stdio server
  help              Show this help message
`);
      break;
    }
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
