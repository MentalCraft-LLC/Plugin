import { createDefaultChromeMcpDispatcher } from "../mcp-server.ts";

async function main() {
  const dispatch = createDefaultChromeMcpDispatcher();

  console.log("Checking Chrome status...");
  const statusRes = await dispatch({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "chrome", arguments: { action: "status" } },
  });
  console.log("Status:", statusRes?.result?.content?.[0]?.text);

  console.log("Navigating to Timeline / Changelog block...");
  const openRes = await dispatch({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "chrome",
      arguments: {
        action: "open",
        url: "http://localhost:5173/foundation/layout",
      },
    },
  });
  console.log("Opened:", openRes?.result?.content?.[0]?.text);

  console.log("Capturing semantic snapshot of layout foundation...");
  const snapRes = await dispatch({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "chrome",
      arguments: {
        action: "semantic_snapshot",
      },
    },
  });
  console.log("Snapshot complete.");
}

main().catch(console.error);
