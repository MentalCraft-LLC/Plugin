#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserClient } from "../core.ts";
import { chooseGa4Objective, runGa4Account, runGa4DistinctAccount } from "../workflows.ts";

const workspace = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

function targetFor(route) {
  const authority = JSON.parse(readFileSync(resolve(workspace, ".governance/contract/analytics.json"), "utf8"));
  const targets = (authority.targets ?? []).filter((target) => target.route === route);
  if (authority.status !== "active" || targets.length !== 1) throw new Error("analytics_target_not_authorized");
  return targets[0];
}

export async function runGa4Target(route, options = {}) {
  const target = targetFor(route);
  const client = new BrowserClient();
  const accountName = target.ga4_account_display_name ?? target.ga4_display_name;
  const workflowOptions = {
    ...options,
    ...(target.ga4_company_size && !options.companySize ? { companySize: target.ga4_company_size } : {}),
    ...(target.ga4_business_activity && !options.businessActivity ? { businessActivity: target.ga4_business_activity } : {}),
    ...(target.ga4_objective && !options.objectiveName ? { objectiveName: target.ga4_objective } : {}),
  };
  const account = target.ga4_account_display_name
    ? await runGa4DistinctAccount(client, accountName, { ...workflowOptions, createDistinctAccount: true })
    : await runGa4Account(client, target.ga4_display_name, workflowOptions);
  if (!workflowOptions.objectiveName || account.status === "blocked" || account.phase === "created") return account;
  const objective = await chooseGa4Objective(client, workflowOptions.objectiveName, workflowOptions);
  return {
    workflow: "ga4-bootstrap",
    status: objective.status,
    phase: objective.phase,
    ...(objective.reason ? { reason: objective.reason } : {}),
    account,
    objective,
    control_count: objective.control_count,
  };
}

if (import.meta.main) {
  const route = process.argv.find((value) => value.startsWith("Application/") || value.startsWith("Business/") || value.startsWith("Service/") || value.startsWith("Design/"));
  if (!route) throw new Error("analytics_route_required");
  const objectiveArg = process.argv.find((value) => value.startsWith("--objective="));
  const result = await runGa4Target(route, {
    acceptStandardTerms: process.argv.includes("--accept-standard-terms"),
    acceptOwnerAuthorizedTerms: process.argv.includes("--accept-owner-authorized-terms"),
    ...(objectiveArg ? { objectiveName: objectiveArg.slice("--objective=".length) } : {}),
  });
  console.log(JSON.stringify(result, null, 2));
}
