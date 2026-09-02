# Plugin Domain Repository

Private Canonical Domain Repository: **https://github.com/MentalCraft-LLC/Plugin**
GitHub (`MentalCraft-LLC/Plugin`) is the single source of truth.

---

## 🏛️ Domain Mandate & Role
**MCP Protocol Engines, Headless Browser Automation (CDP) & Autonomous DAG Workflows**

This repository is an autonomous constituent of the **5-Domain Canonical Ecosystem** under MentalCraft-LLC.

### 🌐 The 5 Canonical Domain Repositories
| Domain | Canonical GitHub Remote | Role in Ecosystem |
| :--- | :--- | :--- |
| **`Business`** | https://github.com/MentalCraft-LLC/Business | Commercial Ventures, Applications, Monetization & Billing Services |
| **`Design`** | https://github.com/MentalCraft-LLC/Design | Single-word Svelte 5 Runes Components & OKLCH Design Token System |
| **`Content`** | https://github.com/MentalCraft-LLC/Content | Creative Lore, 15-Beat Narratives & Psychological Conversion Copy |
| **`Plugin`** | https://github.com/MentalCraft-LLC/Plugin | MCP Protocol Engines, CDP Browser Automation & Compound Workflows |
| **`Science`** | https://github.com/MentalCraft-LLC/Science | Computational Social Science, Empirical Manuscripts, Grants & Patents |

---

## 🌀 Pentagonal Interlocking Flywheel Contract (20-Channel Network)

This repository operates strictly within a bidirectional compounding flywheel. **Unidirectional resource extraction is forbidden.**

### 📥 Inputs Consumed from Other Domains:
- **Business**:  Repetitive commercial operational flows (SEO audits, Stripe checks, domain health)
- **Design**:  Component specifications, token ASTs, and layout contract verification criteria
- **Content**:  Structured copywriting recipes, narrative curve beats, and prompt topologies
- **Science**:  Psychometric calculation formulas, crisis safety guardrails, and DOI/literature schemas

### 📤 Outputs Delivered to Other Domains:
- **To Business**:  Autonomous venture lifecycle telemetry, automated SEO keyword discovery, and Stripe monitoring
- **To Design**:  Automated UI generation, component schema validation, and headless CDP visual regression gates
- **To Content**:  High-throughput viral hook pipelines, batch keyword matrices, and multi-channel dispatch bots
- **To Science**:  Automated literature search, BibTeX validation, journal IF matching, and patent novelty checkers

---

## ⚖️ Non-Negotiable Core Governance Laws

1. **The 12 Universal Ecosystem Virtues Law (全域生态十二美德法则)**:
   All activities across Business, Design, Science, Plugin, and Content are strictly governed by the Twelve Virtues:
   **自由 · 组合 · 分层 · 渐进 · 优雅 · 自洽 · 克制 · 留白 · 流畅 · 简单 · 鲜活 · 溯源**
   (Freedom, Composability, Layering, Progressiveness, Elegance, Self-consistency, Restraint, Negative Space, Fluidity, Simplicity, Aliveness, Traceability).
2. **Single-Word Parent Component Law (父组件单一英文单词命名法则)**:
   Every exported parent component/root container in `@mentalcraft/design-svelte` and products must be a single, concise English noun (e.g. `Hero`, `Pricing`, `Aside`, `Thinking`, `Terminal`, `Source`, `Menu`, `Scroll`, `Attachment`). Compound multi-word parent names (`ThinkingBlock`, `CliTerminal`, etc.) are strictly prohibited. Sub-parts must use dot notation (`<Menu.Item>`, `<Scroll.Viewport>`, `<Hero.Proof>`).
3. **Five Canonical Domains Mutual Flywheel Law (一级目录五维互为飞轮法则)**:
   All 5 canonical domains form a fully connected $K_5$ directed graph (20 momentum channels). Every domain must continuously consume from and feedback into the other 4 domains. Verified via `bun Plugin/scripts/check-flywheel.ts`.
4. **Minimalism, Restraint, and Negative Space Law (极简 · 克制 · 留白法则)**:
   Form strictly serves function. Neutral canvas base with single-hue strategic accent, Swiss typographic scale, zero emojis, zero screaming copy, and generous negative space.
5. **Product Page-Layer Only Law (产品纯 Page 层消费法则)**:
   All product interfaces MUST compose canonical Page-level components from `@mentalcraft/design-svelte` (`<Landing>`, `<Workspace>`, `<Desktop>`, `<Navigation>`, `<Assessment>`, `<Dashboard>`, `<Settings>`). Ad-hoc base components and raw unstyled inputs are strictly prohibited.
6. **Browser Empirical Visual Grounding Law (浏览器实证视觉验收法则)**:
   Code changes must be verified not just with automated tests, but with visual empirical grounding using the `browser` toolchain (full-page screenshots, viewport emulation, and 60fps interaction recordings).
7. **Zero Git-Ignore of Domain Agents (零 Git 忽略盲区法则)**:
   The `.agents/` directory inside this repository must remain tracked in git so that cloud agents (Cursor Cloud, Jules, Grok, GitHub Actions) possess full operational skills upon checkout.
8. **Zero Local Ghost State Law (零本地幽灵状态法则)**:
   All cognitive rules, skills, governance docs, and audit scripts are 100% self-contained and tracked inside the 5 canonical git repositories. The root aggregator folder has zero local-only `.agents/` state.

---

## 🚀 Execution & Delivery Protocols

- **Local Development**: Push directly to `origin main`.
- **Cloud Agent**: Open branch + Pull Request (Cloud cannot assume solo main pushes).
- **Verification**: Run local tests and linters before committing (`bun test`, `bun run check`).
