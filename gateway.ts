/**
 * MentalCraft Master Gateway MCP Server Entrypoint (Root Proxy)
 */

export {
  startGatewayMcpStdio,
  startGatewayMcpHttp,
  handleGatewayRpc,
  GATEWAY_TOOLS,
} from "./Capability/Workflow/gateway.ts";

import { startGatewayMcpHttp, startGatewayMcpStdio } from "./Capability/Workflow/gateway.ts";

if (import.meta.main) {
  const portArg = process.argv.find((a) => a.startsWith("--port="));
  if (portArg) {
    const port = parseInt(portArg.split("=")[1], 10);
    startGatewayMcpHttp(port);
  } else if (process.argv.includes("--http")) {
    startGatewayMcpHttp(3890);
  } else {
    startGatewayMcpStdio();
  }
}
