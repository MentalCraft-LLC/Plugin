#!/usr/bin/env bun
/**
 * Plugin/scripts/verify-all.ts
 *
 * Master Cross-Domain Verification Pipeline:
 * Concurrently evaluates all 5 canonical domain quality gates:
 * 1. Cross-Domain: Pentagonal Interlocking Flywheel Connectivity (20 Channels)
 * 2. Governance: Master Workspace Compliance & Zero Ghost State (34 Rules)
 * 3. Business: Design System Mandatory Consumption (11 Applications)
 * 4. Design: Svelte 5 Component System & Token Consistency Check (405 Components)
 * 5. Science: Academic Paper & Research Rigor Audit
 * 6. Content: Creative & Growth Content Pipelines Audit
 * 7. Plugin: Subsystems FastMCP Protocol Health (10/10 Subsystems)
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../../..");

interface VerificationStep {
	name: string;
	domain: string;
	command: string[];
	cwd: string;
}

const steps: VerificationStep[] = [
	{
		name: "42-Channel Heptagonal Flywheel Connectivity",
		domain: "Cross-Domain",
		command: ["bun", resolve(rootDir, "Plugin/.agents/scripts/check-flywheel.ts")],
		cwd: rootDir,
	},
	{
		name: "Workspace Compliance & Zero Ghost State",
		domain: "Governance",
		command: ["bun", resolve(rootDir, "Plugin/.agents/scripts/audit-workspace.ts")],
		cwd: rootDir,
	},
	{
		name: "Business Domain Lifecycle & Design Consumption",
		domain: "Business",
		command: ["bun", "run", "verify"],
		cwd: resolve(rootDir, "Business"),
	},
	{
		name: "Design Domain Svelte 5 Contract Verification",
		domain: "Design",
		command: ["bun", "run", "verify"],
		cwd: resolve(rootDir, "Design"),
	},
	{
		name: "Science Domain Academic Rigor & Manuscripts",
		domain: "Science",
		command: ["bun", "run", "verify"],
		cwd: resolve(rootDir, "Science"),
	},
	{
		name: "Content Domain Narrative & Copywriting Pipelines",
		domain: "Content",
		command: ["bun", "run", "verify"],
		cwd: resolve(rootDir, "Content"),
	},
	{
		name: "Plugin Subsystems FastMCP Health (10/10)",
		domain: "Plugin",
		command: ["bun", resolve(rootDir, "Plugin/Capability/Workflow/cli.ts"), "health"],
		cwd: resolve(rootDir, "Plugin"),
	},
	{
		name: "Infra Domain Microservices & Edge Contracts",
		domain: "Infra",
		command: ["bun", "run", "check"],
		cwd: resolve(rootDir, "Infra"),
	},
	{
		name: "Company Domain Entities & Legal Governance",
		domain: "Company",
		command: ["bun", "run", "check"],
		cwd: resolve(rootDir, "Company"),
	},
];

console.log("\n=========================================================================================");
console.log(" 🚀 Holar Unified 7-Domain Master Verification Pipeline (9 Master Gates)");
console.log("=========================================================================================\n");

console.log("Domain       | Gate / Verification Name                 | Status  | Execution Latency");
console.log("-------------+------------------------------------------+---------+------------------");

let allPassed = true;
let totalMs = 0;

for (const step of steps) {
	const start = performance.now();
	const res = spawnSync(step.command[0], step.command.slice(1), {
		cwd: step.cwd,
		encoding: "utf8",
	});
	const elapsed = Math.round(performance.now() - start);
	totalMs += elapsed;

	const passed = res.status === 0;
	if (!passed) allPassed = false;

	const domain = step.domain.padEnd(12, " ");
	const name = step.name.slice(0, 40).padEnd(40, " ");
	const status = passed ? "🟢 PASS" : "🔴 FAIL";
	const latency = `${elapsed}ms`.padStart(10, " ");

	console.log(`${domain} | ${name} | ${status} | ${latency}`);
}

console.log("-------------+------------------------------------------+---------+------------------");
console.log(`\nOverall Result: ${allPassed ? `🟢 ALL ${steps.length} GATES PASSED (100%)` : "🔴 VERIFICATION FAILED"} | Total Latency: ${totalMs}ms\n`);

if (!allPassed) {
	process.exit(1);
}
