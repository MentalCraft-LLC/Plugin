#!/usr/bin/env bun
/**
 * .agents/scripts/sync-domains.ts
 *
 * Master Domain Synchronizer:
 * 1. Synchronizes Level 0 universal skills (tone, flywheel, governance, seo, autopilot)
 *    from .agents/skills/ into each canonical domain repository (Business, Design, Content, Plugin, Science, Infra, Company).
 * 2. Injects authoritative multi-domain flywheel laws and GitHub remote coordinates into each repository's AGENTS.md.
 * 3. Verifies zero git-ignore blind spots for .agents/.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "../../..");
const domains = ["Business", "Design", "Content", "Plugin", "Science", "Infra", "Company"] as const;
const universalSkills = ["tone", "flywheel", "governance", "seo", "autopilot"] as const;

console.log("\n============================================================");
console.log(" 🔄 Holar Cross-Domain Cloud Synchronization Engine (7-Domain Network)");
console.log("============================================================\n");

// 1. Sync universal skills into each domain repo
for (const domain of domains) {
	const targetSkillsDir = join(rootDir, domain, ".agents", "skills");
	mkdirSync(targetSkillsDir, { recursive: true });

	for (const skill of universalSkills) {
		const src = join(rootDir, "Plugin", ".agents", "skills", skill);
		const dest = join(targetSkillsDir, skill);
		if (domain !== "Plugin" && existsSync(src)) {
			cpSync(src, dest, { recursive: true });
		}
	}
	console.log(`✅ [SKILLS]: Synced universal skills into ${domain}/.agents/skills/`);
}

// 2. Define Flywheel Domain Manifests for each AGENTS.md
const domainManifests: Record<typeof domains[number], { title: string; role: string; consumes: string[]; produces: string[] }> = {
	Business: {
		title: "Business Domain Repository",
		role: "Commercial Ventures, Enterprise Applications, Revenue Monetization & Market Expansion Engine",
		consumes: [
			"Design: Canonical Svelte 5 Page components (<Landing>, <Workspace>, <Desktop>, etc.) and design tokens",
			"Science: Peer-reviewed evidence citations, IRB ethics safeguards, and CARF/MBC quality credentials",
			"Content: 15-beat product launch narratives, high-converting PAS copy decks, and viral hooks",
			"Plugin: 12-stage venture lifecycle engine, Gefei SEO KD, Stripe Radar telemetry, and batch DAG workflows",
			"Infra: Low-latency distributed auth session resolution (<15ms), Stripe monetization webhooks, and analytics ingestion",
			"Company: Legal LLC operating shields, bank accounts, Stripe merchant onboarding, and international tax entity structures",
		],
		produces: [
			"To Science: Anonymized high-frequency empirical user interaction traces and psychometric distribution datasets",
			"To Design: Real-world conversion funnel pressure tests, mobile breakpoints, and UX edge-case discoveries",
			"To Content: Real customer audience personas, drop-off friction points, and willingness-to-pay signals",
			"To Plugin: Concrete commercial workflow automation specifications (billing sync, SEO monitoring, cold outreach)",
			"To Infra: High-volume edge traffic, transactional throughput, and edge resilience requirements",
			"To Company: Commercial cash flows, paying subscriber cohorts, and venture equity valuation growth",
		],
	},
	Design: {
		title: "Design Domain Repository",
		role: "Single-Word Svelte 5 Design System, OKLCH Tokens & Ergonomic Visual Aesthetics",
		consumes: [
			"Business: Real product edge-cases, conversion funnel layouts, and multi-viewport responsive challenges",
			"Science: Cognitive ergonomics empirical benchmarks, eye-tracking findings, and cognitive load thresholds",
			"Content: Brand tonal values, sensory narrative atmospheres, and Swiss typography rhythm requirements",
			"Plugin: Component catalog verification, automated visual testing, and token export inspection scripts",
			"Infra: Edge latency telemetry and server status data for dashboard indicators and performance bars",
			"Company: Official corporate identity marks, typography guidelines, and trademark badge vector standards",
		],
		produces: [
			"To Business: Canonical Page-level components with 60fps interaction smoothness, zero-friction TTV, and premium feel",
			"To Content: Rich typographic containers, callouts, snippets, and accessible data charts for storytelling",
			"To Science: Publication-grade figures, academic posters, and interactive presentation slide engines",
			"To Plugin: 50+ component contracts, 26+ OKLCH tokens, and 9 domain presets for automated UI generation",
			"To Infra: Standardized edge administrative UI components, telemetry widgets, and console designs",
			"To Company: Executive pitch deck templates, investor presentation visuals, and official entity marks",
		],
	},
	Content: {
		title: "Content Domain Repository",
		role: "Narrative Worldbuilding, Psychological Copywriting & Distribution Engines",
		consumes: [
			"Business: Customer persona profiles, conversion analytics, churn friction data, and product positioning",
			"Science: Peer-reviewed clinical mechanisms, empirical findings, and academic literature truth anchors",
			"Design: Swiss typography standards, layout containers, visual marks, and responsive cards",
			"Plugin: Automated 15-beat story generators, viral hook algorithms, and multi-channel dispatch bots",
			"Infra: 99.99% uptime metrics, edge network coverage stats, and security infrastructure specifications",
			"Company: Core corporate mission statements, authentic founder origin stories, and executive authority quotes",
		],
		produces: [
			"To Business: High-converting landing copy, viral vectors, onboarding email sequences, and CAC reduction assets",
			"To Design: Atmospheric brand tone definitions, emotional color guidance, and sensory prose rhythm benchmarks",
			"To Science: Public science translation, visual abstracts, media releases, and Altmetric citation boosters",
			"To Plugin: Validated copywriting formulas (PAS, AIDA, StoryBrand) and prompt engineering templates",
			"To Infra: Developer documentation, API quickstart guides, and incident communication templates",
			"To Company: Corporate annual letters, brand narratives, investor vision memos, and press releases",
		],
	},
	Plugin: {
		title: "Plugin Domain Repository",
		role: "MCP Protocol Engines, Headless Browser Automation (CDP) & Autonomous DAG Workflows",
		consumes: [
			"Business: Repetitive commercial operational flows (SEO audits, Stripe checks, domain health)",
			"Design: Component specifications, token ASTs, and layout contract verification criteria",
			"Content: Structured copywriting recipes, narrative curve beats, and prompt topologies",
			"Science: Psychometric calculation formulas, crisis safety guardrails, and DOI/literature schemas",
			"Infra: Live operational health endpoints, FastMCP database access tools, and Cloudflare Worker telemetry",
			"Company: Authorized organization API credentials, token management policies, and compliance guardrails",
		],
		produces: [
			"To Business: Autonomous venture lifecycle telemetry, automated SEO keyword discovery, and Stripe monitoring",
			"To Design: Automated UI generation, component schema validation, and headless CDP visual regression gates",
			"To Content: High-throughput viral hook pipelines, batch keyword matrices, and multi-channel dispatch bots",
			"To Science: Automated literature search, BibTeX validation, journal IF matching, and patent novelty checkers",
			"To Infra: FastMCP microservice orchestration, automated synthetic canary probes, and deploy workflows",
			"To Company: Automated cap table reconciliations, legal entity compliance check scripts, and contract archiving",
		],
	},
	Science: {
		title: "Science Domain Repository",
		role: "Computational Social Science Empirical Research, Grants, Journals & Patents",
		consumes: [
			"Business: Large-scale anonymized empirical telemetry, user behavior logs, and digital interaction traces",
			"Design: Scientific visualization components (Radar, Figures, Posters, Presentation Slides)",
			"Content: Public science communication frameworks, accessible lay summaries, and visual abstracts",
			"Plugin: Automated citation verification, literature discovery engines, and NIH/NSF rubric audits",
			"Infra: Zero-knowledge psychometric data pipelines, encrypted audit logs, and reproducible compute runtimes",
			"Company: Formal IRB sponsor entities, research grant application credentials, and patent filing rights",
		],
		produces: [
			"To Business: Peer-reviewed publications, APA/MBC credentials, and unassailable EEAT authority trust proof",
			"To Content: Verified scientific truths, clinical evidence, and cognitive mechanism models for copywriting",
			"To Design: Quantitative cognitive ergonomics, visual fatigue data, and attention span benchmarks",
			"To Plugin: Deterministic psychometric scoring formulas, suicide crisis safety filters, and patent novelty algorithms",
			"To Infra: HIPAA/IRB privacy encryption algorithms, psychometric calibration logic, and audit standards",
			"To Company: Defensible patent portfolios, peer-reviewed academic prestige, and deep tech IP valuation",
		],
	},
	Infra: {
		title: "Infra Domain Repository",
		role: "Global Edge Microservices, Cloudflare Workers, Auth, Event, Monetization & Data Infrastructure",
		consumes: [
			"Business: Application authentication requirements, checkout session flows, and webhook event payloads",
			"Science: Computational data residency, IRB privacy encryption protocols, and telemetry audit requests",
			"Design: Administrative dashboard layout contracts, tokenized UI specifications, and dark mode variables",
			"Plugin: FastMCP protocol definitions, automated synthetic canary probes, and deploy workflows",
			"Company: Master Cloudflare/Stripe organization credentials, enterprise compliance mandates, and domain DNS ownership",
			"Content: System status page copy, uptime guarantees, and disaster recovery communication playbooks",
		],
		produces: [
			"To Business: Low-latency distributed auth session resolution (<15ms), Stripe monetization webhooks, and analytics ingestion",
			"To Science: Zero-knowledge psychometric data pipelines, encrypted audit logs, and reproducible compute runtimes",
			"To Plugin: Live operational health endpoints, FastMCP database access tools, and Cloudflare Worker telemetry",
			"To Design: High-throughput event ingestion for telemetry visualization and performance benchmarks",
			"To Company: Immutable SOC2/GDPR audit traces, Cloudflare resource usage telemetry, and financial transaction ledgers",
			"To Content: 99.99% uptime metrics, edge network coverage stats, and security infrastructure whitepapers",
		],
	},
	Company: {
		title: "Company Domain Repository",
		role: "Corporate Governance, Legal Entities, Equity, Compliance, Intellectual Property & Capital Operations",
		consumes: [
			"Business: Operating cash flows, subscriber MRR reports, customer contracts, and entity allocation shares",
			"Science: Patent disclosure documents, university affiliation agreements, and scientific advisory board appointments",
			"Infra: Enterprise cloud cost allocations, Cloudflare/Stripe master account usage, and SOC2 audit reports",
			"Content: Corporate brand story, investor decks, regulatory disclosures, and trademark guidelines",
			"Design: Official corporate identity marks, typography guidelines, and trademark badge vector standards",
			"Plugin: Automated cap table reconciliations, legal entity compliance check scripts, and contract archiving",
		],
		produces: [
			"To Business: Legal LLC operating shields, bank accounts, Stripe merchant onboarding, and international tax entity structures",
			"To Science: Formal IRB sponsor entities, research grant application credentials, and patent filing rights",
			"To Infra: Authorized enterprise account leases, Cloudflare/Stripe legal master agreements, and corporate compliance policies",
			"To Content: Core corporate mission statements, authentic founder origin stories, and executive authority quotes",
			"To Design: Approved trademark assets, corporate color trademarks, and official brand lockups",
			"To Plugin: Authorized organization API credentials, token management policies, and compliance guardrails",
		],
	},
};

// 3. Write self-contained AGENTS.md into each repository
for (const domain of domains) {
	const manifest = domainManifests[domain];
	const agentsMdPath = join(rootDir, domain, "AGENTS.md");

	const content = `# ${manifest.title}

Private Canonical Domain Repository: **https://github.com/MentalCraft-LLC/${domain}**
GitHub (\`MentalCraft-LLC/${domain}\`) is the single source of truth.

---

## 🏛️ Domain Mandate & Role
**${manifest.role}**

This repository is an autonomous constituent of the **7-Domain Canonical Ecosystem** under MentalCraft-LLC.

### 🌐 The 7 Canonical Domain Repositories
| Domain | Canonical GitHub Remote | Role in Ecosystem |
| :--- | :--- | :--- |
| **\`Business\`** | https://github.com/MentalCraft-LLC/Business | Commercial Ventures, Applications, Monetization & Billing Services |
| **\`Design\`** | https://github.com/MentalCraft-LLC/Design | Single-word Svelte 5 Runes Components & OKLCH Design Token System |
| **\`Content\`** | https://github.com/MentalCraft-LLC/Content | Creative Lore, 15-Beat Narratives & Psychological Conversion Copy |
| **\`Plugin\`** | https://github.com/MentalCraft-LLC/Plugin | MCP Protocol Engines, CDP Browser Automation & Compound Workflows |
| **\`Science\`** | https://github.com/MentalCraft-LLC/Science | Computational Social Science, Empirical Manuscripts, Grants & Patents |
| **\`Infra\`** | https://github.com/MentalCraft-LLC/Infra | Global Edge Microservices, Cloudflare Workers (Auth, Event, Monetization, KV, D1) |
| **\`Company\`** | https://github.com/MentalCraft-LLC/Company | Corporate Governance, Legal Entities, Equity, Compliance & Capital |

---

## 🌀 Heptagonal Interlocking Flywheel Contract (42-Channel Network)

This repository operates strictly within a bidirectional compounding flywheel. **Unidirectional resource extraction is forbidden.**

### 📥 Inputs Consumed from Other Domains:
${manifest.consumes.map((c) => `- **${c.split(":")[0]}**: ${c.split(":")[1]}`).join("\n")}

### 📤 Outputs Delivered to Other Domains:
${manifest.produces.map((p) => `- **${p.split(":")[0]}**: ${p.split(":")[1]}`).join("\n")}

---

## ⚖️ Non-Negotiable Core Governance Laws

**Standing Filter** — 无论何时、无论何人、面对本仓库，先过此门再写。
目标：减少熵增 · 增加复利。原则：自由 · 组合 · 分层 · 渐进 · 优雅 · 自洽 · 克制 · 留白 · 流畅 · 简单 · 鲜活 · 溯源。
无消费者的新实体、第二真理源、跨层跳跃、第一面摊开深能力、备用未用变体、叠装饰：一律不写。十二条缺一即停，先收再写。

1. **The 12 Universal Ecosystem Virtues Law (全域生态十二美德法则)**:
   All activities across Business, Design, Science, Plugin, Content, Infra, and Company are strictly governed by the Twelve Virtues:
   **自由 · 组合 · 分层 · 渐进 · 优雅 · 自洽 · 克制 · 留白 · 流畅 · 简单 · 鲜活 · 溯源**
   (Freedom, Composability, Layering, Progressiveness, Elegance, Self-consistency, Restraint, Negative Space, Fluidity, Simplicity, Aliveness, Traceability).
2. **Single-Word Parent Component Law (父组件单一英文单词命名法则)**:
   Every exported parent component/root container in \`@mentalcraft/design-svelte\` and products must be a single, concise English noun (e.g. \`Hero\`, \`Pricing\`, \`Aside\`, \`Thinking\`, \`Terminal\`, \`Source\`, \`Menu\`, \`Scroll\`, \`Attachment\`). Compound multi-word parent names (\`ThinkingBlock\`, \`CliTerminal\`, etc.) are strictly prohibited. Sub-parts must use dot notation (\`<Menu.Item>\`, \`<Scroll.Viewport>\`, \`<Hero.Proof>\`).
3. **Seven Canonical Domains Mutual Flywheel Law (一级目录七维互为飞轮法则)**:
   All 7 canonical domains form a fully connected $K_7$ directed graph (42 momentum channels). Every domain must continuously consume from and feedback into the other 6 domains. Verified via \`bun Plugin/.agents/scripts/check-flywheel.ts\`.
4. **Minimalism, Restraint, and Negative Space Law (极简 · 克制 · 留白法则)**:
   Form strictly serves function. Neutral canvas base with single-hue strategic accent, Swiss typographic scale, zero emojis, zero screaming copy, and generous negative space.
5. **Product Page-Layer Only Law (产品纯 Page 层消费法则)**:
   All product interfaces MUST compose canonical Page-level components from \`@mentalcraft/design-svelte\` (\`<Landing>\`, \`<Workspace>\`, \`<Desktop>\`, \`<Navigation>\`, \`<Assessment>\`, \`<Dashboard>\`, \`<Settings>\`). Ad-hoc base components and raw unstyled inputs are strictly prohibited.
6. **Browser Empirical Visual Grounding Law (浏览器实证视觉验收法则)**:
   Code changes must be verified not just with automated tests, but with visual empirical grounding using the \`browser\` toolchain (full-page screenshots, viewport emulation, and 60fps interaction recordings).
7. **Zero Git-Ignore of Domain Agents (零 Git 忽略盲区法则)**:
   The \`.agents/\` directory inside this repository must remain tracked in git so that cloud agents (Cursor Cloud, Jules, Grok, GitHub Actions) possess full operational skills upon checkout.
8. **Zero Local Ghost State Law (零本地幽灵状态法则)**:
   All cognitive rules, skills, governance docs, and audit scripts are 100% self-contained and tracked inside the 7 canonical git repositories. The root aggregator folder has zero local-only \`.agents/\` state.
9. **Google Auth & Google One Click Mandatory Law (Google 认证核心法则)**:
   All products introducing user systems MUST support Google OAuth 2.0 and Google One Tap (GIS SDK with FedCM) through the canonical \`<Google>\` compound component.
10. **Canonical Infra Backend & Design Frontend Law (通用后端统一走 Infra 与通用前端统一走 Design 法则)**:
    All shared backend microservices (Auth, Monetization, Event, KV/D1) MUST be unified under \`Infra/\`. Business products consume them via standardized HTTP/RPC clients. All shared frontend UI components, tokens, and page structures MUST be unified under \`Design/\` (\`@mentalcraft/design-svelte\`, \`@mentalcraft/design-token\`). Ad-hoc duplicate servers or un-tokenized private CSS are strictly prohibited.
11. **The .agents Meta-State Consolidation Law (.agents 元状态收敛法则)**:
    All operational scripts, architecture docs, and decision skills in each domain MUST be strictly consolidated inside \`<Domain>/.agents/\` (\`scripts/\`, \`docs/\`, \`skills/\`). Bare scripts, docs, or skills at repo roots are strictly prohibited.

---

## 🚀 Execution & Delivery Protocols

- **Local Development**: Push directly to \`origin main\`.
- **Cloud Agent**: Open branch + Pull Request (Cloud cannot assume solo main pushes).
- **Verification**: Run local tests and linters before committing (\`bun test\`, \`bun run check\`).
`;

	writeFileSync(agentsMdPath, content, "utf8");
	console.log(`✅ [AGENTS.md]: Generated authoritative self-contained AGENTS.md for ${domain}/AGENTS.md`);
}

console.log("\n============================================================");
console.log(" ✨ Cross-domain synchronization complete! All 7 repos cloud-ready.");
console.log("============================================================\n");
