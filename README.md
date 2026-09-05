# 🔌 [DEPRECATED & ARCHIVED] MentalCraft Plugin

> [!IMPORTANT]
> **This standalone repository is officially DEPRECATED and ARCHIVED.**
> In accordance with the **Zero Entropy & Compounding Return Governance Axioms** and the **Six Canonical Domains ($K_6$) Network Architecture**, all plugin capabilities, FastMCP protocol engines, stdio transport guards, and multi-channel buses have been natively consolidated into **`MentalCraft-LLC/Infra`**:
> - **FastMCP Protocol Engine & Master Gateway**: [`Infra/Plugin`](https://github.com/MentalCraft-LLC/Infra/tree/main/Plugin) (`@mentalcraft/infra-plugin`)
> - **Creative Multimodal Synthesis Engine**: [`Infra/Generate`](https://github.com/MentalCraft-LLC/Infra/tree/main/Generate) (`@mentalcraft/infra-generate`)
> - **Durable Workflows & Orchestration**: [`Infra/Workflow`](https://github.com/MentalCraft-LLC/Infra/tree/main/Workflow) (`@mentalcraft/infra-workflow`)
> - **Perception & Action Primitives**: [`Infra/Browser`](https://github.com/MentalCraft-LLC/Infra/tree/main/Browser), [`Infra/Message`](https://github.com/MentalCraft-LLC/Infra/tree/main/Message), [`Infra/Secret`](https://github.com/MentalCraft-LLC/Infra/tree/main/Secret), [`Infra/AI`](https://github.com/MentalCraft-LLC/Infra/tree/main/AI)
>
> All active development and tool invocations now target `Infra`. This tree is preserved for historical reference and immutable lineage.

---

## 🏛️ 三层正交架构 (Capability · Tool · Domain)

Plugin 遵循严格的单单词分层法则与单向依赖公理：
- **`Capability` (复合编排层)** ➔ 组合调度 `Domain` 与 `Tool`；
- **`Domain` (领域协议层)** ➔ 1:1 镜像另外 6 大一级域，提供领域语义与机器可读协议；
- **`Tool` (原生工具层)** ➔ 纯粹的原生环境副作用驱动（系统/网络/硬件），零业务领域依赖。

```
Plugin/
├── Capability/       # 复合能力与中枢编排层
│   └── Workflow/     # DAG 调度器、JIT 动态编排、9大门禁 Runner、Master Gateway
├── Tool/             # 底层原生环境交互层 (零业务依赖)
│   ├── Browser/      # Chrome CDP 原生桥接、全页长截图、60fps WebP 录屏
│   ├── Message/      # 跨通道即时通讯总线 (Telegram / iMessage / Email)
│   └── Secret/       # Mode-0600 本地机密保险箱、Token 凭证单向脱敏
└── Domain/           # 6大领域专属 MCP 协议引擎 (镜像 Canonical Domains)
    ├── Business/     # 8阶段商业生命周期、Google SEO KD、Stripe Radar、MRR 轨迹
    ├── Design/       # 5层设计分层、OKLCH Token、Svelte 5 组件生成
    ├── Science/      # 心理测量学评分 (GAD-7/PHQ-9)、危机红线、论文审稿、专利审查
    ├── Content/      # 15节拍故事法、沉浸感描写、PAS 高转化营销文案、全域分发
    ├── Infra/        # 边缘微服务探针心跳、D1 表结构校验、Worker 打包审计
    └── Company/      # 双重法人治理架构、期权池稀释模型、IP 知识产权确权
```

---

## 📦 10 大 FastMCP 子系统一览

| 类别 | 子目录 | 职责与领域 | 核心协议能力 |
|---|---|---|---|
| **Capability** | [`Capability/Workflow/`](./Capability/Workflow) | 复合流程编排与中枢网关 | Compound DAG 流水线、JIT 动态编排、全域 9 门禁 Runner、OTel 追踪 |
| **Tool** | [`Tool/Browser/`](./Tool/Browser) | 浏览器自动化与 CDP 桥接 | 后台标签页静默驱动、全页 WebP 长截图、60fps 动效录屏、DOM 快照 |
| **Tool** | [`Tool/Message/`](./Tool/Message) | 智能体即时通讯总线 | 多通道优先级分发 (Telegram > iMessage > Email)，零 Harness 隔离 |
| **Tool** | [`Tool/Secret/`](./Tool/Secret) | 本地密钥凭证保险箱 | POSIX mode-0600 安全文件库、单向脱敏、密钥轮转收据 |
| **Domain** | [`Domain/Business/`](./Domain/Business) | 商业增长与商业智能协议 | Google SEO KD (0-100)、Stripe Radar 收入流水、MRR 轨迹模型 |
| **Domain** | [`Domain/Design/`](./Domain/Design) | 设计系统与 UI 智能协议 | 5 层组件体系、Token 字典检索、Svelte 5 Runes 原生代码生成 |
| **Domain** | [`Domain/Science/`](./Domain/Science) | 学术研究与心理测量协议 | 临床量表计分 (GAD-7/PHQ-9)、自杀危机红线、LaTeX 生成、专利新颖性审查 |
| **Domain** | [`Domain/Content/`](./Domain/Content) | 创意与商业文案协议 | 15 步救猫咪故事大纲、PAS 营销文案库、多平台适配矩阵 |
| **Domain** | [`Domain/Infra/`](./Domain/Infra) | 边缘微服务与数据底座协议 | 边缘金丝雀探针、D1 迁移审计、Worker bundle 验证、Stripe Webhook 模拟 |
| **Domain** | [`Domain/Company/`](./Domain/Company) | 法人治理与合规运营协议 | 双主体法人审计 (怀俄明/上海)、股权稀释模型、知识产权链条确权 |

---

## 🛠️ 本地验证与 Master Gateway

```bash
# 运行全量子系统单元测试
bun test

# 启动 Master MCP Gateway (提供统一 FastMCP 接入点)
bun run gateway.ts

# 查看 10/10 子系统健康诊断看板
bun Capability/Workflow/cli.ts health

# 运行全域 9 大最高统治级门禁
bun .agents/scripts/verify-all.ts
```
