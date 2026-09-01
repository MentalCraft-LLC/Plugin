/**
 * Plugin/Content Marketing & Growth Engine
 *
 * Implements high-converting PAS copywriting, omnichannel social media adaptation,
 * 3-second viral hook generation, and 14-day product launch campaign roadmaps.
 */

export type TargetAudiencePersona = "indie_game_dev" | "saas_founder" | "academic_researcher" | "creative_writer" | "indie_hacker";

export type PasCopyResult = {
  productName: string;
  targetAudience: TargetAudiencePersona;
  problem: string; // The acute everyday bottleneck
  agitation: string; // The emotional/financial cost of inaction
  solution: string; // The transformative mechanism & breakthrough
  headlineVariations: string[];
  bulletProofs: string[];
  callToAction: string;
};

export type OmnichannelPlatform = "twitter_x" | "reddit_hn" | "wechat_official" | "redbook_xiaohongshu" | "bilibili_youtube" | "product_hunt";

export type OmnichannelAdaptationResult = {
  productName: string;
  sourceTopic: string;
  channels: Record<
    OmnichannelPlatform,
    {
      formatName: string;
      primaryCopy: string;
      structureBreakdown: string[];
      optimalPublishTime: string;
      tagList: string[];
    }
  >;
};

export type ViralHookResult = {
  productName: string;
  hookCategory: "curiosity_gap" | "contrarian_truth" | "pain_relief" | "stat_shock" | "founder_confession";
  hooks: Array<{
    text: string;
    psychologicalTrigger: string;
    estimatedRetentionSeconds: number;
    recommendedMediaType: "text_thread" | "short_video" | "duotone_carousel";
  }>;
  highConvertingCtas: string[];
};

export type CampaignSprintResult = {
  campaignName: string;
  productName: string;
  durationDays: 14;
  phases: Array<{
    dayRange: string;
    phaseName: string;
    deliverables: string[];
    primaryChannels: string[];
    targetKpiMetric: string;
  }>;
  overallTargetKpis: {
    targetSignupsOrStars: number;
    estimatedTrafficPv: number;
    targetConversionRatePercent: number;
    expectedMrrContributionUsd: number;
  };
};

/**
 * Stage 1: PAS (Problem-Agitate-Solve) Copywriting Forge
 */
export function generatePasCopy(
  productName: string,
  options: {
    targetAudience?: TargetAudiencePersona;
    keyFeature?: string;
    metricProof?: string;
  } = {}
): PasCopyResult {
  const audience = options.targetAudience || "indie_game_dev";
  const proof = options.metricProof || "显存占用降低 80%，打包耗时仅 0.12 秒";

  const pasProfiles: Record<TargetAudiencePersona, { problem: string; agitation: string; solution: string }> = {
    indie_game_dev: {
      problem: "游戏即将上架 Steam，低配显卡玩家频繁反馈掉帧卡顿，排查发现零散碎图把 2D 显存彻底撑爆了？",
      agitation: "在 Photoshop 里一张张手动拼合贴图不仅枯燥耗时，一旦动画帧有所增减就得全部推倒重来，熬夜改 BUG 濒临崩溃。",
      solution: `${productName} 采用工业级 MaxRects 启发式打包算法，一键生成标准 2 的幂次方（POT）图集，原生导出 Godot 4 .tres 与 Unity 精灵动画元数据，${proof}，零门槛开箱即用。`,
    },
    saas_founder: {
      problem: "产品上线第一周，付费转化率迟迟无法突破 1%，冷启动流量获取成本越来越高？",
      agitation: "烧光积蓄买广告投放只会引来羊毛党，没有清晰的价值阶梯与自传播机制，每一次推广都是纯粹的现金流失血。",
      solution: `${productName} 提供全套 PLG 自增长飞轮与 pSEO 程序化流量引擎，通过高意向关键词矩阵与病毒式工具裂变，零买量实现持续稳定的自然客流转化。`,
    },
    academic_researcher: {
      problem: "耗时半年的实证研究稿件，因文献排版格式不合规与统计功效不足被顶刊直接 Desk Reject？",
      agitation: "反复修改 BibTeX 与 APA/GB/T 格式浪费宝贵科研时间，缺乏严谨的因果推断平行趋势检验更容易被审稿人精准狙击。",
      solution: `${productName} 内置计算社会科学（CSS）全套实证质检与多期 DID 因果估计管线，自动导出符合 GB/T 7714-2015 与 Nature/ACM 标准的相机就绪稿件。`,
    },
    creative_writer: {
      problem: "长篇小说写到 10 万字突然卡文，前后战力崩坏，人物性格逐渐沦为千篇一律的工具人？",
      agitation: "吃书漏洞被热心读者当众指出不仅打击创作信心，全盘重写大纲更可能让连载彻底断更夭折。",
      solution: `${productName} 提供 15 节拍架构引擎与防吃书世界观审校器，基于 Want vs Need 心理矩阵实时锁定人物声音指纹，让每一个场景都充满感官张力。`,
    },
    indie_hacker: {
      problem: "一个人既要写前端、后端，还要兼顾设计、写文案与多平台分发，精力彻底被撕碎？",
      agitation: "产品再好，没有宣发就只能死在 GitHub 仓库的角落里；花几天写的一篇推文却因为开头无趣而无人问津。",
      solution: `${productName} 一键打通从代码开发、Svelte 5 组件生成、双色调社媒卡片到全渠道文案分发的全链路闭环，让独立开发者拥有顶尖团队的交付效率。`,
    },
  };

  const profile = pasProfiles[audience] || pasProfiles.indie_game_dev;

  return {
    productName,
    targetAudience: audience,
    problem: profile.problem,
    agitation: profile.agitation,
    solution: profile.solution,
    headlineVariations: [
      `告别低效折磨：用 ${productName} 将核心耗时从 3 小时压缩至 0.12 秒`,
      `为什么聪明的创作者不再手动硬干？深度解析 ${productName} 的效率黑魔法`,
      `从濒临放弃到顺畅交付：${productName} 如何帮你攻克最棘手的工作流瓶颈`,
    ],
    bulletProofs: [
      "⚡ 毫秒级启发式算法处理，吞吐量高达 67,000+ ops/sec",
      "🛡️ 本地 0600 隐私安全保障，无云端数据泄露风险",
      "📦 完美兼容主流工程生态，原生导出标准代码与资源清单",
    ],
    callToAction: `立即体验 ${productName}，开启零摩擦创作流 ➔ 访问官网体验 Demo`,
  };
}

/**
 * Stage 2: Omnichannel Content Adaptation Matrix
 */
export function adaptOmnichannelContent(
  productName: string,
  sourceTopic: string
): OmnichannelAdaptationResult {
  return {
    productName,
    sourceTopic,
    channels: {
      twitter_x: {
        formatName: "Twitter/X 递进式 Thread (7条)",
        primaryCopy: `1/7 做独立开发最痛苦的不是写代码，而是那些重复又琐碎的非核心杂活。\n\n今天开源了我们打磨已久的 ${productName}——一个专为极客创作者设计的自动化引擎。\n\n🧵 深度拆解它是如何帮你省下 80% 机械劳动的：👇`,
        structureBreakdown: ["Hook推文", "痛点共鸣", "算法底层突破", "真实基准对比", "安装/体验方式", "开源倡议与Star引导"],
        optimalPublishTime: "周二至周四 20:30 - 22:00 (UTC+8) 或 09:00 (EST)",
        tagList: ["#IndieHacker", "#BuildInPublic", "#OpenSource", "#DevTools"],
      },
      reddit_hn: {
        formatName: "Show HN / Reddit 技术复盘长帖",
        primaryCopy: `Show HN: ${productName} – Fast, sovereign automation engine written in TypeScript/Bun\n\nHi HN, we built ${productName} because existing tools were either bloated electron wrappers or cloud-dependent SaaS with privacy concerns. Here is how we achieved sub-millisecond execution using pure algorithms and local mode-0600 security:`,
        structureBreakdown: ["痛点来源与研发动机", "为什么不采用现有方案", "技术架构图与算法实现", "基准跑分数据表格", "开源地址与代码交流"],
        optimalPublishTime: "周二 / 周三 08:00 EST",
        tagList: ["Show HN", "r/gamedev", "r/indiehackers", "r/programming"],
      },
      wechat_official: {
        formatName: "微信公众号深度技术长文",
        primaryCopy: `《从 0 到 10,000 用户：我们如何用一套纯算法引擎颠覆传统创作流》\n\n导语：在大模型充斥着陈词滥调的今天，真正的生产力革命往往发生在底层数据结构与纯粹算法的交汇处……`,
        structureBreakdown: ["引言与行业现状反思", "三幕式研发故事", "硬核原理解析与动图展示", "用户真实评价与指标跃迁", "文末行动召唤与读者互动"],
        optimalPublishTime: "周一 / 周三 21:00",
        tagList: ["独立开发", "开源项目", "效能工具", "技术干货"],
      },
      redbook_xiaohongshu: {
        formatName: "小红书高信息密度图文笔记",
        primaryCopy: `🔥独立开发者私藏神器！彻底告别加班拼图的快乐谁懂啊😭\n\n作为一个全栈独立开发者，这个工具直接把我从深夜改图的噩梦里拯救出来了！\n\n✨核心亮点：\n1️⃣ 一键打包 POT 图集，显存暴降 80%\n2️⃣ 原生适配 Godot 4 / Unity\n3️⃣ 纯本地运行，不吃电脑内存\n\n💻 软件名：${productName}\n赶紧收藏起来，下次做项目绝对用得上！`,
        structureBreakdown: ["痛点大字头图", "3个硬核功能对比图", "操作简易步骤展示", "文末互动提问"],
        optimalPublishTime: "周六 / 周日 12:30 或 21:30",
        tagList: ["#独立开发", "#游戏开发", "#效率神器", "#程序员日常"],
      },
      bilibili_youtube: {
        formatName: "Bilibili / YouTube 视频大纲与分镜",
        primaryCopy: `【硬核实测】做游戏贴图显存爆了？教你用纯算法一键降维打击！\n\n[00:00] 3秒开场痛点：Steam玩家卡顿差评现场\n[00:45] 传统方案到底错在哪里？\n[01:30] 核心演示：导入 100 张碎图 ➔ 0.12秒瞬间合成\n[03:15] 源码原理解析：MaxRects 算法如何工作\n[05:00] 免费体验与获取指南`,
        structureBreakdown: ["痛点冲击", "传统痛点", "核心奇观演示", "原理拆解", "结尾号召"],
        optimalPublishTime: "周五 18:00 或 周六 11:00",
        tagList: ["独立游戏", "游戏开发", "计算机视觉", "编程教程"],
      },
      product_hunt: {
        formatName: "Product Hunt 发布宣言 (Maker Pitch)",
        primaryCopy: `🐱 Hi Product Hunt! We are excited to launch ${productName}.\n\nBuilt for creators who value speed, privacy, and craftsmanship. Zero cloud lock-in, sub-millisecond execution, and 100% sovereign code.\n\nWe'd love to hear your feedback! 🚀`,
        structureBreakdown: ["产品一句话定位", "解决的核心三大痛点", "主要功能特性清单", "限时社区专属福利", "创作者致谢与留言区互动"],
        optimalPublishTime: "周二 00:01 PST",
        tagList: ["Developer Tools", "Productivity", "Open Source", "Design Tools"],
      },
    },
  };
}

/**
 * Stage 3: Viral Attention Hook Generator
 */
export function generateViralHooks(
  productName: string,
  options: {
    category?: ViralHookResult["hookCategory"];
  } = {}
): ViralHookResult {
  const cat = options.category || "curiosity_gap";

  const hooks: ViralHookResult["hooks"] = [
    {
      text: `“90% 的创作者都在为这个繁琐步骤浪费生命，直到他们发现了 ${productName}……”`,
      psychologicalTrigger: "利用好奇心差距（Curiosity Gap）激发探索欲",
      estimatedRetentionSeconds: 4.8,
      recommendedMediaType: "short_video",
    },
    {
      text: `“别再盲目依赖笨重的商业全家桶了，单兵作战只需要这一套轻量级引擎。”`,
      psychologicalTrigger: "反直觉真理（Contrarian Truth）挑战固有认知",
      estimatedRetentionSeconds: 5.2,
      recommendedMediaType: "text_thread",
    },
    {
      text: `“从 1200MB 显存瞬间压缩到 240MB，我们在底层到底动了什么手脚？”`,
      psychologicalTrigger: "数据冲击力（Stat Shock）引发硬核求知欲",
      estimatedRetentionSeconds: 6.0,
      recommendedMediaType: "duotone_carousel",
    },
  ];

  return {
    productName,
    hookCategory: cat,
    hooks,
    highConvertingCtas: [
      "👉 点击主页链接，免安装直接体验 Web 在线 Demo",
      "⭐ 前往 GitHub 为开源仓库点亮 Star，解锁完整离线版",
      "💬 在评论区留下你的工作流痛点，免费领取全套工程模版",
    ],
  };
}

/**
 * Stage 4: 14-Day Product Launch Campaign Sprint Playbook
 */
export function generateCampaignSprint(
  productName: string,
  campaignName: string = "V1.0 全球首发破晓战役"
): CampaignSprintResult {
  return {
    campaignName,
    productName,
    durationDays: 14,
    phases: [
      {
        dayRange: "Day 1 - Day 3",
        phaseName: "前瞻预热与痛点共鸣 (Teaser & Pain Agitation)",
        deliverables: ["发布 3 篇痛点悬念短推文", "在特定技术社群发起痛点问卷调查", "搭建专属 Landing Page 并开放早期候补名单 (Waitlist)"],
        primaryChannels: ["Twitter/X", "Reddit r/gamedev", "小红书"],
        targetKpiMetric: "收集 500+ Waitlist 预约订阅",
      },
      {
        dayRange: "Day 4 - Day 7",
        phaseName: "技术硬核复盘与开源爆发 (Technical Deep Dive & Open Source Show)",
        deliverables: ["发布 Show HN 与 Reddit 深度架构长文", "在 Bilibili/YouTube 上线 0.12 秒奇观演示视频", "发布 GitHub 1.0 Release 标签"],
        primaryChannels: ["Hacker News", "GitHub", "Bilibili"],
        targetKpiMetric: "GitHub 斩获 1,000+ Stars，HN 冲上首页前 10",
      },
      {
        dayRange: "Day 8 - Day 10",
        phaseName: "全网矩阵分发与权威发酵 (Omnichannel Blitz & Case Studies)",
        deliverables: ["发布 3 篇真实客户蜕变案例 (Case Study)", "微信公众号与知乎同步上线深度专栏", "上线 Product Hunt 官方发布页面"],
        primaryChannels: ["Product Hunt", "微信公众号", "知乎"],
        targetKpiMetric: "Product Hunt 跻身当日 Top 3 Product of the Day",
      },
      {
        dayRange: "Day 11 - Day 14",
        phaseName: "转化促成与社区长效留存 (Conversion & Community Moat)",
        deliverables: ["举办线上 Discord/微信 创作者 AMA 交流会", "向早期用户推送专属终身优惠购买链接", "发布 90 天后续功能演进路线图 (Roadmap)"],
        primaryChannels: ["Email List", "Discord / 微信社群", "官网"],
        targetKpiMetric: "达成 $5,000+ 首批付费转化，留存率 > 45%",
      },
    ],
    overallTargetKpis: {
      targetSignupsOrStars: 2500,
      estimatedTrafficPv: 45000,
      targetConversionRatePercent: 4.2,
      expectedMrrContributionUsd: 10000,
    },
  };
}
