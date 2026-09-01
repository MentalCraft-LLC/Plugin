#!/usr/bin/env bun
/**
 * Plugin/gateway.ts - Root Entrypoint for MentalCraft Master MCP Gateway Server
 */

import { startGatewayMcpStdio } from "./Workflow/gateway.ts";

if (import.meta.main) {
  startGatewayMcpStdio();
}

export * from "./Workflow/gateway.ts";
