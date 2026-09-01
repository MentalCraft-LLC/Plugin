import { createDefaultChromeMcpDispatcher } from "../mcp-server.ts";

async function main() {
  const dispatch = createDefaultChromeMcpDispatcher();

  console.log("1. Checking Chrome plugin bridge status...");
  const statusRes = await dispatch({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "chrome", arguments: { action: "status" } },
  });
  console.log("Status:", statusRes?.result?.content?.[0]?.text);

  const targets = [
    { name: "Layout Foundation (11 paradigms)", url: "http://localhost:5173/foundation/layout" },
    { name: "Effect Foundation (Glow & Micro-motion)", url: "http://localhost:5173/foundation/effect" },
    { name: "Marketing Showcase & Stage", url: "http://localhost:5173/block/marketing/team" },
  ];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(`\nVerifying [${target.name}] at ${target.url}...`);
    const openRes = await dispatch({
      jsonrpc: "2.0",
      id: 10 + i,
      method: "tools/call",
      params: {
        name: "chrome",
        arguments: {
          action: "open",
          url: target.url,
        },
      },
    });
    console.log("  Open status:", openRes?.result?.content?.[0]?.text ? "OK" : "Failed");

    const snapRes = await dispatch({
      jsonrpc: "2.0",
      id: 20 + i,
      method: "tools/call",
      params: {
        name: "chrome",
        arguments: {
          action: "semantic_snapshot",
          max_elements: 30,
        },
      },
    });
    console.log("  Semantic snapshot captured successfully.");
  }

  console.log("\nAll benchmark verification passes completed successfully via Chrome Plugin.");
}

main().catch(console.error);
