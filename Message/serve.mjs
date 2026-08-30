#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function locateServer() {
  const beside = resolve(dirname(fileURLToPath(import.meta.url)), "mcp-server.ts");
  if (existsSync(beside)) return beside;
  throw new Error("Holar message MCP server is not on this path");
}

const server = locateServer();
const workspace = resolve(dirname(server), "../..");
const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  cwd: workspace,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
