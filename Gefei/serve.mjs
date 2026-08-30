#!/usr/bin/env bun

import { createMessageReader, encodeMessage, GefeiMcpServer } from "./mcp-server.ts";

const server = new GefeiMcpServer();

const reader = createMessageReader(async (message) => {
  const response = await server.handleMessage(message);
  if (response !== null) {
    process.stdout.write(encodeMessage(response));
  }
});

process.stdin.on("data", (chunk) => {
  reader(chunk);
});

process.stdin.on("end", () => {
  process.exit(0);
});
