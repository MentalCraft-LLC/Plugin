# Cross-Domain Pentagonal Interlocking Flywheel Governance Framework

Canonical governance protocol for the Holar autonomous enterprise ecosystem under `MentalCraft-LLC`.

---

## 1. Top-Level Architectural Sovereignty

The ecosystem is composed of **5 independent canonical domain repositories** with GitHub (`MentalCraft-LLC/<Owner>`) as the single source of truth:

| Domain Repository | Scope & Mandate |
| :--- | :--- |
| **`Business`** | Commercial ventures, high-converting applications, billing infrastructure, and service layers. |
| **`Design`** | Single-word Svelte 5 runes design system, OKLCH design tokens, duotone visual renderer, and layout contracts. |
| **`Content`** | Creative narrative lore, 15-beat story structures, and omnichannel psychological conversion copy decks. |
| **`Plugin`** | MCP protocol engines, headless browser automation with CDP, DAG workflows, and market intelligence engines. |
| **`Science`** | Computational social science empirical manuscripts, NIH/NSF grant rubrics, journal submissions, and patents. |

The root `.agents/` directory functions strictly as an operational coordination hub. **Zero submodule pollution is enforced**: domain-specific logic, tests, and skills must remain exclusively inside their respective owner repositories.

---

## 2. 🏛️ 一级目录五维互为飞轮全互联网络 (Pentagonal Interlocking Flywheel Network)

5 大一级目录绝非孤立模块，而是构成一个完全互联的有向飞轮图（$K_5$ 拓扑，共包含 $5 \times 4 = 20$ 条动量双向传导回路）：

```
                       [ Science (学术实证) ]
                            ▲        ▲
                          ╱   ╲    ╱   ╲
                        ╱       ╳       ╲
                      ╱       ╱   ╲       ╲
                    ▼       ▼       ▼       ▼
    [ Design (设计系统) ] ◀──────────────▶ [ Content (叙事文案) ]
            ▲                                      ▲
            │ ╲                                  ╱ │
            │   ╲                              ╱   │
            │     ▼                          ▼     │
            │  [ Business (商业变现) ] ◀───────────┤
            │         ▲                  ▲         │
            ▼         │                  │         ▼
          [ Plugin (协议网关与自动化引擎) ] ────────┘
```

### 2.1 商业 (`Business`) 动量辐射回路
1. **➔ `Science` (实证数据之源)**：商业应用产生真实、匿名、纵向的数字化用户行为轨迹与交互数据，为 Science 计算社会学与心理测量学研究提供真实样本支持。
2. **➔ `Design` (真实场景压力测试)**：支付漏斗、移动端断点、自适应输入等复杂的真实商业交互倒逼 Design 系统演进，提炼更高泛化能力的 Svelte 5 通用原语。
3. **➔ `Content` (精准受众痛点画像)**：真实转化率指标、付费客群画像与高频跳出痛点，为 Content 提供最具共鸣的受众心理动因与故事素材。
4. **➔ `Plugin` (自动化业务需求源泉)**：商业运营中重复出现的获客、竞对追踪、账单校验等需求，直接沉淀为 Plugin 的标准 MCP 工具与 DAG 编排节点。

### 2.2 科学 (`Science`) 动量辐射回路
5. **➔ `Business` (不可动摇的信任资产)**：同行评审论文、IRB 伦理标准、CARF/MBC 质控与专利布局，为 Business 产品提供顶级 EEAT 权威信任背书，极大提升转化率与企业采购意愿。
6. **➔ `Content` (硬核真理与知识锚点)**：严谨的科学事实、临床机制模型与统计结论，作为 Content 创作深度科普、硬核爆款故事与高可信度文案的坚实知识锚。
7. **➔ `Design` (认知工效学量化依据)**：眼动规律、注意广度、认知负荷与无障碍量化指标，为 Design 系统的 OKLCH 色彩感知、留白呼吸节律与字体排印提供科学实验依据。
8. **➔ `Plugin` (严谨算法与伦理红线)**：心理测量量表计分算法（GAD-7/PHQ-9）、危机干预协议与专利新颖性检索算法，直接转化为 Plugin 的确定性核心算法库与伦理防火墙。

### 2.3 内容 (`Content`) 动量辐射回路
9. **➔ `Business` (获客降本与爆发转化)**：15 节拍产品故事、高转化 PAS 文案与 3 秒吸睛钩子，直接降低 Business 获客成本（CAC），提高首屏价值主张传递效率与 LTV。
10. **➔ `Design` (品牌调性与排版节律)**：叙事基调与语言的情感温度指导 Design 的主题氛围（Tokens）、排版节奏阶梯（Swiss Typography）与界面微交互的阻尼感。
11. **➔ `Science` (学术成果破圈传播)**：将晦涩严密的学术手稿转化为通俗生动的公众科学解读、媒体通稿与图文摘要（Visual Abstract），十倍放大 Science 论文的 Altmetric 得分与社会影响力。
12. **➔ `Plugin` (结构化文案配方模型)**：经由市场验证有效的文案框架（PAS、AIDA、StoryBrand）与提示词拓扑，固化为 Plugin/Content 的自动化 MCP 批量生成工具。

### 2.4 设计 (`Design`) 动量辐射回路
13. **➔ `Business` (顶级质感与无摩擦体验)**：极简、克制、留白的 60fps 统一设计语言与全套页面级组件，赋予 Business 产品苹果级的工匠质感与 0 摩擦操作体验，极大缩短 Time-to-Value。
14. **➔ `Content` (视觉容器与审美呈现)**：丰富的版式模板、信息图表基元（Radar/Spark/Chart）、引用与引言容器，让 Content 创作的优质叙事以极具现代审美的形式呈现。
15. **➔ `Science` (学术出版级高精可视化)**：专为学术论文定制的高精数据可视化组件、矢量图表（Figure）、学术海报（Poster）与演示舞台（Stage/Slide），赋能 Science 产出顶刊标准图表。
16. **➔ `Plugin` (机器可读的设计元数据)**：50+ 组件契约规范、26+ OKLCH 令牌字典与 9 大领域预设包，直接暴露给 Plugin/Design 作为智能体自动组装 UI 和执行视知觉巡检的知识库。

### 2.5 插件 (`Plugin`) 动量辐射回路
17. **➔ `Business` (自主无人化商业巡航)**：8 阶段商业周期引擎、Gefei SEO KD 测算、Stripe Radar 营收分析与多通道自动化执行，让 1 个人即可实现 Business 矩阵的工业化无人值守运营。
18. **➔ `Design` (自动化设计守卫与演进)**：自动化设计契约测试、CDP 浏览器视觉走查、无障碍色差校验与组件自动提炼提升脚本，保障 Design 体系 0 视觉倒退与 0 编译缺陷。
19. **➔ `Content` (智能化内容流水线)**：自动化 15 节拍故事生成、SEO 关键词长尾矩阵批量拓展与跨平台分发机器人，为 Content 带来工业级高产出的自动化管道。
20. **➔ `Science` (科研全流程自动化加速)**：自动化文献检索、DOI 格式化、期刊影响因子精准匹配与 USPTO/WIPO 专利先验比对，将 Science 从选题到投稿的机械工时压缩 90%。

---

## 3. 闭环治理守则 (Closed-Loop Governance Laws)

1. **单向消费禁止律 (No Unidirectional Silos)**: 任何领域仓库不得单向索取资源而不向体系反馈增益。新模式必须抽象化回流，新成果必须共享至协议网关。
2. **产品纯 Page 层消费律 (Product Page-Layer Only Law)**: 业务端只组装 `@mentalcraft/design-svelte` 提供的权威 Page 级构件；缺位构件必须在 Design/Svelte 泛化并通过测试后引入。
3. **极简·克制·留白审美律 (Minimalism, Restraint, and Negative Space)**: 形式严格服务功能，严格中性底色与单色点睛，瑞士排版字阶，零 Emoji 与零噪点装饰。
4. **实证视觉走查律 (Empirical Visual Grounding)**: 拒绝终端盲编，必须借助 `browser` 自动化工具链进行全屏长截图与交互动效实测验收。
