#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserClient } from "../core.ts";
import { captureClarityProjectId, runClarityProject } from "../workflows.ts";

const workspace = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

function targetFor(route) {
  const authority = JSON.parse(readFileSync(resolve(workspace, ".governance/contract/analytics.json"), "utf8"));
  const targets = (authority.targets ?? []).filter((target) => target.route === route);
  if (authority.status !== "active" || targets.length !== 1) throw new Error("analytics_target_not_authorized");
  return targets[0];
}

export async function runClarityIdTarget(route) {
  const target = targetFor(route);
  const client = new BrowserClient();
  const project = await runClarityProject(client, target.ga4_display_name, target.clarity_domain, { acceptStandardTerms: true });
  if (project.status !== "ready") return project;
  return {
    workflow: "clarity-project-id",
    ...(await captureClarityProjectId(client, route, target.ga4_display_name, target.clarity_domain)),
  };
}

if (import.meta.main) {
  const route = process.argv.find((value) => value.startsWith("Application/") || value.startsWith("Business/") || value.startsWith("Service/") || value.startsWith("Design/"));
  if (!route) throw new Error("analytics_route_required");
  console.log(JSON.stringify(await runClarityIdTarget(route), null, 2));
}
