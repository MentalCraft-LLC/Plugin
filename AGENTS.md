# Workspace

Local folder of 7 independent canonical domain repositories. **GitHub (`MentalCraft-LLC/<Owner>`) is the only source of truth.**
This root folder is not a git repository. Do not use Origin or any other remote host for Owner trees.

### 🏛️ The 7 Canonical Domain Repositories
| Directory | Remote | Scope & Purpose |
|---|---|---|
| **`Plugin`** | https://github.com/MentalCraft-LLC/Plugin | Core Tooling, MCP Protocol Engines, Extensions, and Workflows |
| **`Design`** | https://github.com/MentalCraft-LLC/Design | Design System, Svelte Components, OKLCH Tokens, and Duotone Renderers |
| **`Business`** | https://github.com/MentalCraft-LLC/Business | Commercial Ventures across 3 Verticals: `Health`, `Education`, `Utility` |
| **`Science`** | https://github.com/MentalCraft-LLC/Science | Academic Research (Paper Manuscripts, Grants, Journals, Patents) |
| **`Content`** | https://github.com/MentalCraft-LLC/Content | Creative & Commercial Content Production (`Story`, `Marketing`) |
| **`Infra`** | https://github.com/MentalCraft-LLC/Infra | Global Edge Microservices, Cloudflare Workers (Auth, Event, Monetization, KV, D1) |
| **`Company`** | https://github.com/MentalCraft-LLC/Company | Corporate Governance, Legal Entities, Equity, Compliance, and Capital Operations |

### 🌌 核心治理公理：复杂系统生态法则 (Core Ecosystem Governance Axioms)
1. **减少熵增法则 (Law of Anti-Entropy)**: 工作本质是对复杂系统的持续治理。坚决剔除一切孤岛状态、非必要装饰、过时命名与隐蔽技术债。每一个模块、依赖与配置文件都必须具备单一真理源，时刻保持系统处于最高秩序度。
2. **制造复利法则 (Law of Compounding Returns)**: 拒绝一次性消耗型劳动。每一行代码、每一个组件、每一份文案、每一个实验都必须成为可被全域复用的生产要素，注入 $K_7$ 互为飞轮网络，在时间维度上持续产生加速度与复利。
3. **全域生态四大巅峰融合与十二美德宪章 (The Notion · Claude · Aside · Grok Tetrad & The 12 Universal Ecosystem Virtues)**:
   - **Notion 的自由积木**: 模块组合、清晰分层、渐进展开（Progressive Disclosure），零死胡同控制权；
   - **Claude 的人文纸张**: 温润纸质底色（`canvas`）、陶土微暖点睛、光学克制、极度耐看且零视觉疲劳；
   - **Aside (`aside.com`) 的智能体驾驶舱**: 极简两翼收敛工作区、高精度微边框（`border-glass`）、微拟物悬浮、原生手感与从容留白；
   - **Grok (`grok.com`) 的鲜活认知溯源**: 毫秒级流动响应流、DeepSearch 思维探索链、实时事实来源胶囊、清脆触觉拨片；
   - **全域生态十二美德 (The 12 Universal Ecosystem Virtues)**: **自由 · 组合 · 分层 · 渐进 · 优雅 · 自洽 · 克制 · 留白 · 流畅 · 简单 · 鲜活 · 溯源**。
   - **全域适用公理**: 十二美德不仅是 UI 设计系统的灵魂，更是 Business 商业漏斗、Science 学术论文、Plugin 协议架构、Content 叙事传播与 Autopilot 自治自愈的统一元宪章。
4. **父组件单一英文单词命名法则 (Single-Word Parent Component Law)**:
   - 设计系统与产品中的每一个对外暴露的父组件/根容器，必须严格使用单个、简洁的英文名词命名（如 `Hero`, `Pricing`, `Aside`, `Thinking`, `Terminal`, `Source`, `Menu`, `Scroll`, `Attachment`）。
   - 一律禁止拼凑又臭又长的复合名词（如 `ThinkingBlock`, `CliTerminal`, `AttachmentChip`, `ScrollArea`, `ContextMenu`）。复合子部件一律通过点记法挂载（如 `<Menu.Item>`, `<Scroll.Viewport>`, `<Hero.Proof>`）。
5. **Autopilot 原则驱动自愈法则 (Principle-Driven Autopilot & Remediation Law)**:
   - **目标反哺**: Autopilot 并非机械定时器，而是基于核心原则与商业/学术目标，自主推演并拆解新任务，通过 42 条飞轮通道持续向各领域反哺动能；
   - **违背即重构**: 任何代码、依赖、设计或流程一旦违背「减少熵增、制造复利、生态十二美德、单单词命名」，Autopilot 必须立即触发优化重构，直至系统重归自洽与优雅。
6. **插件零 Harness 依赖公理 (The Harness-Free Plugin Law / Agent-Agnostic Axiom)**:
   - **零宿主耦合**: 全域所有 `Plugin/*`（Message, Browser, Secret, Workflow, Search, Cloudflare 等）**绝对禁止依赖任何特定的 Agent 宿主（Harness）、私有会话租约（Session Lease Locks）或专有环境套件（如 Pi、特定 CLI 容器）**；
   - **自洽独立与标准化**: 每一个插件必须是 100% 自包含的纯协议引擎（FastMCP 标准、POSIX 规范、标准 XDG 路径 `~/.config/holar/*` 与通用环境变量），任何智能体（Antigravity、Cursor、Jules、Grok、Claude、CI/CD 或纯原生命令行）均可零侵入直接无缝调用；
   - **坚决剔除专有孤岛**: 严禁在任何 Plugin 中硬编码专有 harness 目录（如 `~/.pi/...`）或强行要求外部 harness 提供心跳租约；违背者视为严重系统熵增，必须立即剔除重构。

**Zero Local Ghost State**: All cognitive rules, skills, governance docs, and audit scripts are 100% self-contained and tracked inside the 7 canonical git repositories. The root aggregator folder has zero local-only `.agents/` state.

### 🧠 Distributed Self-Contained Skill Network
1. **Universal Cross-Domain Skills (`<Domain>/.agents/skills/`)**: Every domain repo houses the core universal decision skills (`tone`, `flywheel`, `governance`, `seo`, `autopilot`), ensuring cloud agents (Cursor Cloud, Jules, Grok) possess complete decision autonomy upon single-repo checkout.
2. **Domain Sovereignty Skills & Tooling**:
   - `Business`: Full 12-Stage Venture OS (`demand`, `teardown`, `positioning`, `name`, `architecture`, `build`, `launch`, `operation`, `scale`, `locale`, `growth`, `feedback`).
   - `Science`: Academic manuscript, empirical CSS methods, and IP creation (`paper`, `empirical`, `grant`, `patent`, `journal`).
   - `Plugin`: MCP protocol engines, cross-domain audit suites (`.agents/scripts/check-flywheel.ts`, `.agents/scripts/audit-workspace.ts`), and workflows (`plugin`).
   - `Design`: Svelte 5 component engineering and 60fps teardown (`design`, `disassemble`).
   - `Content`: Worldbuilding lore and growth distribution (`story`, `marketing`).
   - `Infra`: Global Cloudflare edge microservices and data pipelines (`infra`).
   - `Company`: Corporate legal entities, founder equity, capital allocations, and compliance (`company`).
3. **Single-Word Naming Standard**: Every skill and design component must be a single, concise English noun.

### 🎨 Design System Mandatory Consumption & Feedback Flywheel
1. **Mandatory Consumption**: Every frontend product under `Business/*` MUST bind `@mentalcraft/design-svelte` and `@mentalcraft/design-token` aliases and consume canonical design tokens (`--color-*`, `--radius-sm`, `--font-*`) in its root layout. Ad-hoc un-tokenized CSS, raw unstyled form controls (`<input type="range">`, `<textarea>`), and local copy-paste base UI components are strictly forbidden.
2. **Navigation + Landing Page Architecture**: Products MUST adopt a high-clarity **Navigation + Landing** top-level architecture. The initial arrival surface must be an airy, restrained **Landing** (Hero, 30-second low-friction action, 3-step workflow, outcome proof) with low intrinsic cognitive load, progressively disclosing deep specialized tooling inside dedicated **Workbench** views.
3. **Bidirectional Feedback Flywheel**: When a product develops an effective UI pattern (e.g. `Ladder`, `Band`, `Timeline`), the pattern MUST be extracted, generalized, and promoted into `Design/Svelte` as a canonical single-word primitive/composite with 0 diagnostic errors and documented in `Design/DESIGN.md`, then re-imported back into the product.
4. **Automated Governance Verification**: All frontend products MUST maintain automated CI scripts (e.g. `bun run check:growth-feedback`, `bun run check:design-system`) in their `check` lifecycle to prevent regressions.
5. **Deep Cultural Localization Law**: Every product MUST support all target languages natively. Internationalization is not mechanical word-for-word translation; it must deeply reflect local socio-cultural context, local clinical/professional regulatory credentials, local health insurance frameworks, and official local crisis hotlines.
6. **Hero Above-the-Fold Triad Law**: Every product's marketing/landing page above the fold MUST deliver the high-converting triad:
   - (1) **Clear Value Proposition (明确价值主张)**: Instantly answers what acute pain is solved, for whom, and the outcome;
   - (2) **Proof of Trust (权威信任证明)**: Evidence-based citations, zero-knowledge privacy badges, compliance standards (APA/MBC/CARF), and real outcome metrics;
   - (3) **Clear Action Path (清晰行动路径)**: Low-friction primary CTA (e.g., 30s 0-account instant action) paired with secondary transparent commercial plan link.
7. **Product Page-Layer Only Law (产品纯 Page 层消费法则)**: All product routes under `Business/*` MUST strictly compose canonical Page-level components from `@mentalcraft/design-svelte` (`<Landing>`, `<Workspace>`, `<Desktop>`, `<Navigation>`, `<Assessment>`, `<Dashboard>`, `<Settings>`). If the Page layer is insufficient to express a required layout or view structure, agents MUST NOT craft ad-hoc page scaffolds; instead, agents MUST strengthen or add the canonical single-word page component in `Design/Svelte/src/lib/page/`, verify with contract tests, export it, and import it into the product.
8. **Minimalism, Restraint, and Negative Space Law (极简 · 克制 · 留白法则)**:
   - (1) **极简 (Minimalism)**: 形式严格服务于功能。坚决剔除一切非必要装饰、冗余边框、花哨渐变与噪点装饰，每一像素都必须具备明确的认知与交互意图；
   - (2) **克制 (Restraint)**: 色彩克制（以纯净中性色为底，单色相主色精准点睛），排版克制（严格瑞士字阶，零 Emoji，零咆哮体），密度克制（严禁信息轰炸）；
   - (3) **留白 (Whitespace / Negative Space)**: 呼吸感与阅读节奏至上。通过大方从容的负空间引导用户视线，让核心价值主张与行动路径自然成为焦点。
9. **Browser Empirical Visual Grounding, Design Disassembly & WebP Motion Teardown Law (浏览器实证视觉验收、设计拆解与 WebP 默认法则)**:
   - (1) **拒绝盲编与臆断**: 页面开发与重构不仅要在终端完成 `bun test` 单元测试与类型检查，更必须启动本地服务，通过 `browser` 插件工具（长截图、多端断点模拟、动效录制）进行实证视觉验收，严禁使用侵入式抢夺焦点的 dev-tools；
   - (2) **多端长截图与像素级组件拆解**: 在拆解学习标杆产品设计（Notion, Claude, Aside, Grok, Linear 等）时，必须对目标产品的每一种页面形态（Landing, Workspace, Desktop, Dialog, Preference 等）在不同断点下进行全页长截图，对每一个组件进行像素级解构（Token, 盒模型, 留白排版, 触态交互）；
   - (3) **60fps 动效录屏与 WebP 逐帧分解**: 对弹簧动力学阻尼、抽屉展开与核心微交互，使用性能与画质兼具的动态 WebP 格式（通过 `ffmpeg` / `img2webp`）录屏，以便逐帧像素级拆解过渡曲线与手感，并将其反哺到设计系统；
   - (4) **WebSearch 优先捷径法则**: 若目标产品的设计系统规范、CSS 变量字典与组件 API 本身即可通过 `websearch` 深度检索并获取官方高保真规格，则优先通过 `websearch` 快速吸收，免去重复录屏走查的认知与算力开销；
   - (5) **WebP 默认与 Telegram 直达**: 所有视觉走查截图与动效演示**一律强制默认采用 WebP 格式**（极致高压缩、零视觉失真），并由 `Plugin/.agents/scripts/send-telegram-screenshot.ts` 自动直推至 Telegram，实现阶段性成果实时透传与即时介入；
   - (6) **实证闭环交付与双向反哺**: 拆解出的优秀交互范式必须抽象为单单词组件沉淀至 `@mentalcraft/design-svelte` 并完成契约测试，只有在视觉走查与自动化测试双重通过后，方可确认交付并同步远端。
10. **Seven First-Level Canonical Domains Mutual Flywheel Law (一级目录七维互为飞轮法则)**:
    - (1) **全互联完全图网络 ($K_7$ Topology)**: 7 大一级领域仓库（`Business`, `Design`, `Content`, `Plugin`, `Science`, `Infra`, `Company`）构成互为因果、相互复利的有向完全图，涵盖 $7 \times 6 = 42$ 条动量传导回路；
    - (2) **单向孤岛绝对禁止 (No Siloed Domains)**: 任何领域不得单向索取资源。
      - `Infra`（微服务与边缘计算）为 `Business` 提供极速认证、支付与事件分发，为 `Science` 提供高安全实证数据底座，为 `Company` 提供合规操作痕迹；
      - `Company`（法人实体与资本架构）为 `Business` 提供全球法人与银行账户，为 `Science` 提供国家与大学合规申报资质，为 `Infra` 承担合规责任与云资产采购；
      - `Business` 的真实商业流水反哺 `Company` 估值并给 `Infra` 提供性能压测；
      - `Design` 的规范统领 `Infra` 管理后台与 `Company` 投资者门户；
      - `Plugin` 的 FastMCP 协议全面接管 `Infra` 的运维自动化；
      - `Content` 塑造 `Company` 的品牌故事与公开信；
      - `Science` 为 `Company` 沉淀高价值专利与论文无形资产；
    - (3) **自动化连通度巡检 (Automated Verifiability)**: 全域动量回路必须保持 100% 连通与实证可查，通过 `bun Plugin/.agents/scripts/check-flywheel.ts` 实施自动化阻断门禁。
11. **Google Auth & Google One Click Mandatory Authentication Law (Google Auth 与 Google One Click 核心认证法则)**:
    - (1) **零阻力即刻登入**: 全域产品如果包含或引入用户体系（Account / Signin / Signup / Member / Subscription），**必须且强制支持 Google Auth (OAuth 2.0 / OpenID Connect) 与 Google One Click (Google One Tap GIS SDK / FedCM 兼容)**；
    - (2) **静默感知与转化兜底**: 页面首次加载或到达身份临界点时，静默触发 Google One Click 浮层，一键秒级完成身份认证与账号绑定；辅以居中/突出的 Google Auth 品牌按钮，将注册转化损耗降至物理极限；
    - (3) **单单词组件承载**: 设计系统中必须由单单词组件 `<Google>`（包含 `<Google.Button>` 与 `<Google.OneTap>`）统一提供官方高保真规范封装，并天然挂载至 `<Signin.Google>`, `<Signin.OneTap>`, `<Signup.Google>`, `<Signup.OneTap>`，严禁各业务重复手写非标认证按钮。
12. **通用后端服务统一走 Infra 与通用前端设计统一走 Design 绝对真理源公理 (Canonical Infra Backend & Design Frontend Law)**:
    - (1) **通用后端服务统一走 Infra**: 全域所有通用后端微服务（用户鉴权与会话管理 `Auth`、计费与订阅通道 `Monetization`、事件流与行为埋点 `Event`、全局分布式数据 `KV / D1`、速率限制、异步任务队列、验证码防护与通知分发等），**必须 100% 抽象并收敛于一级目录 `Infra/`**。通过轻量极速 **TypeScript + Hono** 边缘微服务与 Cloudflare Workers (D1, KV) 进行无冷启动统一交付；全域实现 100% 纯 TypeScript 技术栈统一（前端 Svelte 5 + 工具 FastMCP + 后端 Hono），彻底消灭跨语言孤岛与 WASM 编译开销；严禁任何业务应用（`Business/*`）自建私有后端服务器或重复手写孤岛逻辑。各前端业务一律通过轻量 HTTP/RPC 客户端调用 `Infra` 统一标准接口；
    - (2) **通用前端设计统一走 Design**: 全域所有通用前端设计资产（父组件单单词语义组件、Page 层模板、OKLCH 视觉变量、微边框微拟物容器、60fps 动效过渡与 Google 认证复合组件），**必须 100% 抽象并沉淀于一级目录 `Design/`**（`@mentalcraft/design-svelte` 与 `@mentalcraft/design-token`）。严禁任何前端产品重复手写未经标准化的局部基础组件、未收敛的表单控件或私有硬编码 CSS；任何通用交互范式一经发明，必须立即抽离至 `Design` 并通过契约测试后反哺全域。
13. **.agents 元状态收敛公理 (The .agents Meta-State Consolidation Axiom)**:
    - (1) **元状态绝对收敛**: 每一个一级领域仓库中，所有的操作与巡检脚本（`scripts/`）、架构规范文档（`docs/`）以及自主决策技能（`skills/`），**必须且绝对统一收敛于各仓库根目录下的 `.agents/` 目录内**（即 `<Domain>/.agents/scripts/`, `<Domain>/.agents/docs/`, `<Domain>/.agents/skills/`）；
    - (2) **根目录零零碎孤岛**: 严禁在任何仓库根目录下散落裸露的 `scripts/`、`docs/` 或 `skills/` 目录。保持根目录极度清爽自洽，根目录仅容纳对外暴露的核心工程代码（如 `Health/`, `Education/`, `Utility/`, `Svelte/`, `Token/`, `Workflow/`, `Paper/`, `Auth/`, `Entity/`）及配置文件。
14. **逐级链式组件依赖公理与三元核心交互架构法则 (Chained Layer Hierarchy & Triad Page Architecture Law)**:
    - (1) **严格逐级链式依赖 ($L_n \to L_{n-1}$)**: 高层次组件只能依赖于低一层次的组件，坚决禁止跨层跳跃调用。Layer 4（业务路由）只能消费 Layer 3（Page）；Layer 3（Page）只能消费 Layer 2（Composite/Block）；Layer 2 只能消费 Layer 1（Component Primitives）；Layer 1 只能消费 Layer 0（Tokens & Behaviors）。如果无法通过低层次组件实现效果，必须且只能优化低层次组件，形成逐层复利反哺。
    - (2) **三元核心页面架构 (Navigation + Main + Artifact)**: 全域所有产品的核心交互统一构想为三元 Page 构成：`Navigation`（响应式导航）、`Main`（响应式推理与对话流）、`Artifact`（响应式产物舞台）。桌面端呈现为三栏收敛展开（带快捷键与拖拽手柄）；移动端呈现为连续水平滑轨（以 `Main` 为中枢基准面，支持 `Navigation`（右滑） $\longleftrightarrow$ `Main` $\longleftrightarrow$ `Artifact`（左滑）直觉手势穿梭）。
    - (3) **插件决定 Artifact (Plugin Determines Artifact)**: 所有的运行态产物（Browser 浏览器实机、Timeline 工作流连线、Plugin 探针、Code Diff、文档）一律由对应插件驱动并收敛呈现于 `Artifact`，严禁在 `Main` 消息流中堆砌僵硬孤岛大卡片。


Open the exact product or capability under its Owner. Do not invent a root write lease over Owner trees.

GitHub Actions are disabled on all Owner repos (quota). Validate locally or in Cursor Cloud Agents.

**Local:** push Owner `main` directly. **Cloud Agent:** branch + PR (Cloud cannot assume solo main pushes).
