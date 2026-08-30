#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserClient } from "../core.ts";
import { runClarityProject } from "../workflows.ts";

const workspace = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

function targetFor(route) {
  const authority = JSON.parse(readFileSync(resolve(workspace, ".governance/contract/analytics.json"), "utf8"));
  const targets = (authority.targets ?? []).filter((target) => target.route === route);
  if (authority.status !== "active" || targets.length !== 1) throw new Error("analytics_target_not_authorized");
  return targets[0];
}

export async function runClarityTarget(route, options = {}) {
  const target = targetFor(route);
  return runClarityProject(
    new BrowserClient(),
    target.ga4_display_name,
    target.clarity_domain,
    options,
  );
}

if (import.meta.main) {
  const route = process.argv.find((value) => value.startsWith("Application/") || value.startsWith("Business/") || value.startsWith("Service/") || value.startsWith("Interface/"));
  if (!route) throw new Error("analytics_route_required");
  const result = await runClarityTarget(route, { acceptStandardTerms: process.argv.includes("--accept-standard-terms") });
  console.log(JSON.stringify(result, null, 2));
}
