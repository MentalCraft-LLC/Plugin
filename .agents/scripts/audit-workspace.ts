#!/usr/bin/env bun
/**
 * .agents/scripts/audit-workspace.ts
 *
 * Master Cross-Domain Health & Governance Audit Script for Holar Ecosystem.
 * Audits all 5 Canonical Domain Repositories, Design System bindings,
 * Git hygiene, and Plugin MCP health.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = resolve(import.meta.dirname, "../../..");
const domains = ["Business", "Design", "Content", "Plugin", "Science", "Infra", "Company"] as const;

interface CheckResult {
	category: string;
	item: string;
	passed: boolean;
	detail: string;
}

const results: CheckResult[] = [];

function check(category: string, item: string, condition: boolean, detail: string) {
	results.push({ category, item, passed: condition, detail });
}

console.log("\n============================================================");
console.log(" 🌐 Holar Master Workspace & Governance Audit");
console.log("============================================================\n");

// 1. Audit 5 Canonical Repositories Git Status
for (const domain of domains) {
	const domainPath = join(rootDir, domain);
	const exists = existsSync(domainPath);
	check("Topology", `${domain} directory`, exists, exists ? "Directory present" : "MISSING");

	if (exists) {
		const gitRes = spawnSync("git", ["-C", domainPath, "status", "--porcelain"], { encoding: "utf8" });
		const clean = gitRes.stdout.trim().length === 0;
		const filesCount = gitRes.stdout.trim().split("\n").filter(Boolean).length;
		check("Git Hygiene", `${domain} git status`, clean, clean ? "Working tree clean" : `Changes pending: ${filesCount} files`);
	}
}

// 2. Audit Business Applications Design System Bindings
const appsDir = join(rootDir, "Business", "Application");
if (existsSync(appsDir)) {
	const entries = readdirSync(appsDir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "archive") {
			const appDir = join(appsDir, entry.name);
			const appPkgPath = join(appDir, "package.json");
			const sveltekitPkgPath = join(appDir, "sveltekit", "package.json");
			const svelteConfigPath = join(appDir, "svelte.config.js");
			const viteConfigPath = join(appDir, "vite.config.ts");

			let combinedConfigs = "";
			for (const p of [appPkgPath, sveltekitPkgPath, svelteConfigPath, viteConfigPath]) {
				if (existsSync(p)) {
					combinedConfigs += readFileSync(p, "utf8");
				}
			}

			const hasDesign =
				combinedConfigs.includes("@mentalcraft/design-svelte") ||
				combinedConfigs.includes("@mentalcraft/design-token");
			const hasLegacyInfraUi = combinedConfigs.includes("infra-ui-svelte");
			const hasRelPathFragility = combinedConfigs.includes("file:../../Design/Svelte");

			const compliant = hasDesign && !hasLegacyInfraUi;
			const detail = hasLegacyInfraUi
				? "FATAL: Obsolete infra-ui-svelte detected (Zero Compatibility)"
				: hasDesign
					? "Design system bound (@mentalcraft)"
					: "No design system dependency";

			check("Design System", `${entry.name} binding`, compliant, detail);
			check("Path Stability", `${entry.name} relative path`, !hasRelPathFragility, !hasRelPathFragility ? "Stable path" : "Fragile ../../ path detected");
		}
	}
}

// 3. Audit Plugin MCP Health
const pluginCli = join(rootDir, "Plugin", "Workflow", "cli.ts");
if (existsSync(pluginCli)) {
	const healthRes = spawnSync("bun", [pluginCli, "health"], { encoding: "utf8" });
	const healthy = healthRes.status === 0 && healthRes.stdout.includes("HEALTHY (100/100)");
	check("MCP Gateway", "Plugin Subsystems Health", healthy, healthy ? "8/8 Subsystems 100/100 Healthy" : "Health check failed");
}

// 4. Audit Zero Ghost State (Root .agents absence)
const rootAgentsPath = join(rootDir, ".agents");
const hasRootAgents = existsSync(rootAgentsPath);
check("Ghost State", "Root .agents absence", !hasRootAgents, !hasRootAgents ? "Clean: 0 local ghost state" : "Legacy .agents still present at root");

// 5. Audit Meta-State Consolidation (scripts, docs, skills inside .agents)
for (const domain of domains) {
	const domainPath = join(rootDir, domain);
	if (existsSync(domainPath)) {
		const bareScripts = existsSync(join(domainPath, "scripts"));
		const bareDocs = existsSync(join(domainPath, "docs"));
		const bareSkills = existsSync(join(domainPath, "skills"));
		const hasBare = bareScripts || bareDocs || bareSkills;
		check(
			"Meta-State",
			`${domain} .agents`,
			!hasBare,
			!hasBare
				? "scripts/docs/skills in .agents"
				: `Bare: ${[bareScripts && "scripts", bareDocs && "docs", bareSkills && "skills"].filter(Boolean).join(", ")}`
		);
	}
}

// 6. Audit Distributed Skill Network Integrity
const requiredDomainSkills: Record<string, string[]> = {
	Business: ["demand", "teardown", "positioning", "name", "architecture", "build", "launch", "operation", "scale", "locale", "growth", "feedback"],
	Company: ["company"],
	Content: ["story", "marketing"],
	Design: ["design", "disassemble"],
	Infra: ["infra"],
	Plugin: ["plugin"],
	Science: ["paper", "empirical", "grant", "patent", "journal"],
};

for (const domain of domains) {
	const domainSkillsDir = join(rootDir, domain, ".agents", "skills");
	const domainSpecific = requiredDomainSkills[domain] || [];
	const allRequired = ["tone", "flywheel", "governance", "seo", "autopilot", ...domainSpecific];
	const missing: string[] = [];
	const broken: string[] = [];

	for (const skill of allRequired) {
		const skillMd = join(domainSkillsDir, skill, "SKILL.md");
		if (!existsSync(skillMd)) {
			missing.push(skill);
		} else {
			try {
				const content = readFileSync(skillMd, "utf8");
				if (!content.includes("name:") || !content.includes("description:")) {
					broken.push(skill);
				}
			} catch {
				broken.push(skill);
			}
		}
	}

	const passed = missing.length === 0 && broken.length === 0;
	const detail = passed
		? `${allRequired.length}/${allRequired.length} skills valid`
		: `Issues: ${missing.length ? "missing: " + missing.join(",") : ""} ${broken.length ? "broken: " + broken.join(",") : ""}`.trim();
	check("Skill Network", `${domain} skills`, passed, detail);
}


// Print Symmetrical Results Table
console.log(
	"Category        | Check Target                   | Status  | Detail"
);
console.log(
	"----------------+--------------------------------+---------+--------------------------------------"
);

let passedCount = 0;
for (const r of results) {
	const cat = r.category.padEnd(15, " ");
	const item = r.item.slice(0, 30).padEnd(30, " ");
	const status = r.passed ? "🟢 PASS" : "🔴 FAIL";
	const detail = r.detail.split("\n")[0].slice(0, 38);
	if (r.passed) passedCount++;
	console.log(`${cat} | ${item} | ${status} | ${detail}`);
}

console.log("----------------+--------------------------------+---------+--------------------------------------");
const score = Math.round((passedCount / results.length) * 100);
console.log(`\nAudit Summary: ${passedCount}/${results.length} checks passed | Overall Compliance Score: ${score}%\n`);
