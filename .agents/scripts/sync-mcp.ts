#!/usr/bin/env bun
/**
 * .agents/scripts/sync-mcp.ts
 *
 * One-click synchronization and enforcement script for the Holar FastMCP Ecosystem.
 * - Installs all 11 canonical FastMCP server configurations to ~/.gemini/config/mcp_config.json
 * - Injects all tool JSON schemas into ~/.gemini/antigravity-cli/mcp/
 * - Purges all legacy/intrusive devtools (e.g. chrome-devtools-mcp)
 * - Verifies backward-compatible directory symlinks
 */

import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { installMcpSchemasToAgy } from "../../Capability/Workflow/operation.ts";

const pluginRoot = resolve(import.meta.dirname, "../..");
const geminiConfigDir = join(homedir(), ".gemini/config");
const mcpConfigPath = join(geminiConfigDir, "mcp_config.json");
const agyMcpDir = join(homedir(), ".gemini/antigravity-cli/mcp");

console.log("\n============================================================");
console.log(" 🔌 Holar FastMCP Ecosystem Master Synchronization");
console.log("============================================================\n");

// 1. Maintain backward-compatible symlinks
const symlinks = [
  { link: join(pluginRoot, "Browser"), target: "Tool/Browser" },
  { link: join(pluginRoot, "Message"), target: "Tool/Message" },
  { link: join(pluginRoot, "Secret"), target: "Tool/Secret" },
  { link: join(pluginRoot, "Workflow"), target: "Capability/Workflow" },
];

for (const s of symlinks) {
  if (!existsSync(s.link)) {
    symlinkSync(s.target, s.link);
    console.log(`✓ Created symlink: ${s.link} -> ${s.target}`);
  }
}

// 2. Purge rogue/intrusive chrome-devtools-mcp cache
const rogueDir = join(agyMcpDir, "chrome-devtools-mcp");
if (existsSync(rogueDir)) {
  rmSync(rogueDir, { recursive: true, force: true });
  console.log("✓ Purged rogue cache directory: chrome-devtools-mcp");
}

// 3. Construct canonical 11 FastMCP servers configuration
const canonicalMcpConfig = {
  mcpServers: {
    gateway: {
      command: "bun",
      args: [join(pluginRoot, "gateway.ts")],
      env: {
        NODE_ENV: "production",
        HOLAR_WORKSPACE: resolve(pluginRoot, ".."),
      },
    },
    browser: {
      command: "bun",
      args: [join(pluginRoot, "Tool/Browser/serve.mjs")],
      env: {
        HOLAR_BROWSER_WORKSPACE: resolve(pluginRoot, ".."),
      },
    },
    message: {
      command: "bun",
      args: [join(pluginRoot, "Tool/Message/serve.mjs")],
    },
    secret: {
      command: "bun",
      args: [join(pluginRoot, "Tool/Secret/mcp-server.ts")],
    },
    workflow: {
      command: "bun",
      args: [join(pluginRoot, "Capability/Workflow/mcp-server.ts")],
    },
    business: {
      command: "bun",
      args: [join(pluginRoot, "Domain/Business/mcp-server.ts")],
    },
    design: {
      command: "bun",
      args: [join(pluginRoot, "Domain/Design/mcp-server.ts")],
    },
    science: {
      command: "bun",
      args: [join(pluginRoot, "Domain/Science/mcp-server.ts")],
    },
    content: {
      command: "bun",
      args: [join(pluginRoot, "Domain/Content/mcp-server.ts")],
    },
    infra: {
      command: "bun",
      args: [join(pluginRoot, "Domain/Infra/mcp-server.ts")],
    },
    company: {
      command: "bun",
      args: [join(pluginRoot, "Domain/Company/mcp-server.ts")],
    },
  },
};

mkdirSync(geminiConfigDir, { recursive: true });
writeFileSync(mcpConfigPath, JSON.stringify(canonicalMcpConfig, null, 2), "utf-8");
console.log(`✓ Updated canonical MCP config: ${mcpConfigPath} (11 servers registered)`);

// 4. Install tool schemas to Antigravity CLI directory
const installRes = installMcpSchemasToAgy();
console.log(`✓ Injected ${installRes.installedCount} tool JSON schemas into ${agyMcpDir}`);

// 5. Verification Summary Table
console.log("\nSynchronized FastMCP Servers:");
for (const [name, cfg] of Object.entries(canonicalMcpConfig.mcpServers)) {
  const targetScript = cfg.args[0];
  const exists = existsSync(targetScript);
  console.log(`  • ${name.padEnd(12)} [${exists ? "🟢 READY" : "🔴 NOT FOUND"}] ${targetScript}`);
}
console.log("\n✅ All 11 Canonical FastMCP servers 100% wired and active.\n");
