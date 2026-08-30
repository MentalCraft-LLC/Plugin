#!/usr/bin/env bun
import { installBrowserBridge, BrowserClient, PROTOCOL } from "../core.ts";

const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

installBrowserBridge();
const client = new BrowserClient();
if (!client.available()) throw new Error("browser_bridge_unavailable");
const queued = await client.request({ protocol: PROTOCOL, action: "repair" });
let status;
for (let attempt = 0; attempt < 20; attempt += 1) {
  await wait(500);
  try {
    status = await client.request({ protocol: PROTOCOL, action: "status" });
    if (status?.status === "ready") break;
  } catch { /* bounded reload window */ }
}
if (status?.status !== "ready") throw new Error("browser_repair_readback_failed");
console.log(JSON.stringify({ workflow: "browser-repair", queued, status }, null, 2));
