#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function locateServer() {
  const beside = resolve(dirname(fileURLToPath(import.meta.url)), "mcp-server.ts");
  if (existsSync(beside)) return beside;
  let current = process.cwd();
  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = resolve(current, ".extension/mcp/chrome/mcp-server.ts");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Holar chrome MCP server is not on this path");
}

const server = locateServer();
const workspace = resolve(dirname(server), "../../..");
const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  cwd: workspace,
  env: {
    ...process.env,
    HOLAR_BROWSER_WORKSPACE: process.env.HOLAR_BROWSER_WORKSPACE ?? workspace,
  },
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
