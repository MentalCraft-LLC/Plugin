#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { loadAuthority, authorityTarget, loadLocalConfig, readClarityToken } from "../../analytics/core.ts";
import { BrowserClient } from "../core.ts";
import { runClarityProject, runClarityToken } from "../workflows.ts";

export async function runClarityTokenTarget(route, tokenName = "spiral-analytics-export") {
  const authority = loadAuthority();
  const target = authorityTarget(authority, route);
  const local = loadLocalConfig().targets[route]?.clarity;
  if (!local) throw new Error("clarity_local_target_missing");
  if (existsSync(local.tokenFile)) {
    readClarityToken(local.tokenFile);
    return {
      workflow: "clarity-token",
      status: "ready",
      phase: "stored",
      project_id_present: true,
      token_present: true,
      token_value_returned: false,
    };
  }
  const client = new BrowserClient();
  const project = await runClarityProject(client, target.ga4_display_name, target.clarity_domain, { acceptStandardTerms: true });
  if (project.status !== "ready") return { workflow: "clarity-token", ...project };
  const settings = await client.request({
    protocol: "spiral.browser.v1",
    action: "open_clarity_settings",
    url: "https://clarity.microsoft.com/projects",
  });
  if (settings?.action !== "open_clarity_settings" || settings?.value_returned !== false) {
    return { workflow: "clarity-token", status: "blocked", phase: "settings", reason: "settings_control_missing", control_count: project.control_count };
  }
  await new Promise((resolve) => setTimeout(resolve, 750));
  return runClarityToken(client, route, local.projectId, tokenName, true);
}

if (import.meta.main) {
  const route = process.argv.find((value) => value.startsWith("Application/") || value.startsWith("Business/") || value.startsWith("Service/") || value.startsWith("Interface/"));
  if (!route) throw new Error("analytics_route_required");
  console.log(JSON.stringify(await runClarityTokenTarget(route), null, 2));
}
