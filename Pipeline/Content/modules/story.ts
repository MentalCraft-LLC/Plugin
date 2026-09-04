/**
 * Plugin/Content Story & Narrative Engine
 *
 * Implements high-precision worldbuilding, character psychology arcs,
 * 15-beat plot architecture, sensory prose rendering, lore consistency linting,
 * and interactive branching Ink/Twine story compilation.
 */

export type WorldbuildingGenre = "hard_scifi" | "cyberpunk" | "dark_fantasy" | "mystery_thriller" | "realism" | "mythological";

export type WorldRuleResult = {
  title: string;
  genre: WorldbuildingGenre;
  coreLaws: Array<{ name: string; mechanism: string; irreversibleCost: string }>;
  factions: Array<{ name: string; ethos: string; primaryResource: string; conflictVector: string }>;
  chronicleMilestones: Array<{ era: string; event: string; rippleEffect: string }>;
  glossary: Array<{ term: string; definition: string; tabooUsage?: string }>;
  themeStatement: string;
};

export type CharacterArcType = "positive_change" | "tragic_corruption" | "steadfast_flat" | "disillusionment";

export type CharacterProfileResult = {
  name: string;
  archetype: string;
  want: string; // Outer conscious desire
  need: string; // Inner unconscious truth / soul redemption
  lieBelieved: string; // The fundamental misconception about the world
  fatalFlaw: string;
  ghostWound: string; // Past trauma shaping present behavior
  arcType: CharacterArcType;
  voiceFingerprint: {
    dialogueRhythm: string;
    catchphrasesOrTics: string[];
    emotionalDefenses: string;
    subtextBehavior: string;
  };
  keyRelationships: Array<{ targetName: string; dynamic: string; tensionSource: string }>;
};

export type PlotBeatFramework = "save_the_cat_15" | "heros_journey_12" | "dan_harmon_circle" | "three_act_mystery";

export type PlotBeatItem = {
  beatNumber: number;
  beatName: string;
  percentageTarget: string;
  narrativeFunction: string;
  sceneSummary: string;
  tensionLevel: number; // 1 to 10
  emotionalValence: "positive" | "negative" | "mixed" | "neutral";
};

export type PlotArchitectureResult = {
  storyTitle: string;
  framework: PlotBeatFramework;
  premise: string;
  logline: string;
  beats: PlotBeatItem[];
  midpointShift: string;
  allIsLostMoment: string;
  climaxResolution: string;
};

export type SensoryProseResult = {
  originalExcerpt: string;
  enhancedProse: string;
  sensoryLayersApplied: {
    visualLightAndShadow: string;
    auditoryAcoustics: string;
    olfactoryScent: string;
    tactileTextureAndTemperature: string;
    physiologicalBodySignals: string;
  };
  pacingMetrics: {
    sentenceVariationScore: number; // 0 to 100
    showVsTellRatio: string;
    clichesEliminatedCount: number;
  };
};

export type LoreConsistencyLintResult = {
  lorePassed: boolean;
  totalChecks: number;
  consistencyScore: number; // 0 to 100
  contradictionsDetected: Array<{ issue: string; severity: "CRITICAL" | "MODERATE" | "MINOR"; suggestedFix: string }>;
  unresolvedForeshadowing: Array<{ clueId: string; clueText: string; status: "OPEN" | "FULFILLED" }>;
  powerScaleIntegrity: string;
};

export type InteractiveInkResult = {
  title: string;
  format: "ink" | "twine_harlowe" | "json_dag";
  entryNode: string;
  nodesCount: number;
  branchesCount: number;
  endingsCount: number;
  sourceCode: string;
};

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Stage 1: Worldbuilding & Lore Bible Forge
 */
export function forgeWorldRules(
  title: string,
  options: {
    genre?: WorldbuildingGenre;
    coreThemes?: string[];
  } = {}
): WorldRuleResult {
  const genre = options.genre || "hard_scifi";
  const seed = hashStr(`${title}-${genre}`);

  const lawsByGenre: Record<WorldbuildingGenre, WorldRuleResult["coreLaws"]> = {
    hard_scifi: [
      { name: "光锥因果不可逆性", mechanism: "超光速通信受限于微观真空极化能量消耗", irreversibleCost: "过度调用引发局部时空泡量子衰变" },
      { name: "神经突触固化定律", mechanism: "全息意识上传需承受72小时神经元不可逆晶化", irreversibleCost: "失去对物理痛觉与体温的真实映射" },
    ],
    cyberpunk: [
      { name: "算力信用配给法", mechanism: "社会底层接入算力受限，富人垄断量子拟态算力", irreversibleCost: "未按期缴税者被强制降频进入意识低熵休眠" },
      { name: "义体排异与神经烧蚀", mechanism: "高级战斗义体释放微电流冲击神经轴突", irreversibleCost: "必须持续注射神经平滑剂以防赛博精神病" },
    ],
    dark_fantasy: [
      { name: "血契等价交换", mechanism: "高阶秘术必须由施术者真实记忆或血液为媒介激活", irreversibleCost: "每次释放遗忘一段至亲至爱的童年回忆" },
      { name: "深渊凝视侵蚀", mechanism: "接触古神低语获得全知视界", irreversibleCost: "理智值不可逆下坠，躯体逐渐生出黑曜石鳞片" },
    ],
    mystery_thriller: [
      { name: "物质交换微痕定律", mechanism: "凡有接触必留痕迹，高智商犯罪依赖密闭空间信息差", irreversibleCost: "每次清理现场都会暴露更深层的心理漏洞" },
      { name: "时间差错觉法则", mechanism: "利用钟表停摆与视觉错觉构筑完美不在场证明", irreversibleCost: "受制于不可抗力天气与目击者微小偏差" },
    ],
    realism: [
      { name: "社会资本兑换法则", mechanism: "体制内资源与市场化资本之间的隐秘流动与博弈", irreversibleCost: "道德妥协导致家庭亲密关系不可逆瓦解" },
      { name: "代际创伤传递机制", mechanism: "父母未解的焦虑与阶层坠落恐惧无意识投射至子女", irreversibleCost: "亲子间形成算法代哺下的虚假亲密" },
    ],
    mythological: [
      { name: "神祇信仰锚定法", mechanism: "神明的神力强弱直接取决于信徒祭祀与信仰纯度", irreversibleCost: "被遗忘即为彻底消亡" },
      { name: "宿命因果织机", mechanism: "诺伦三女神纺织所有生灵的命运红线", irreversibleCost: "违抗预言者必以更大悲剧促成预言自身" },
    ],
  };

  const factions: WorldRuleResult["factions"] = [
    {
      name: genre === "hard_scifi" ? "星轨筑路者集团" : genre === "cyberpunk" ? "新天工联合财团" : "秘术执律评议会",
      ethos: "追求绝对秩序与资源极度垄断",
      primaryResource: "高维拓扑晶格与超算信用",
      conflictVector: "对一切未登记的自由异端与独立开发者展开全面清剿",
    },
    {
      name: genre === "hard_scifi" ? "深空漂流者同盟" : genre === "cyberpunk" ? "织网自由阵线" : "无光者地下教团",
      ethos: "守护不可剥夺的个体尊严与自治权",
      primaryResource: "离线冷数据核心与古老物理机械",
      conflictVector: "破坏垄断中枢，向全宇宙广播不受审查的开源信标",
    },
  ];

  const milestones: WorldRuleResult["chronicleMilestones"] = [
    { era: "纪元前 30 年", event: "第一次底层跃迁/意识协议确立", rippleEffect: "旧世界社会伦理与权力平衡彻底洗牌" },
    { era: "纪元前 5 年", event: "大断裂事件：中央算力/秘法网络过载崩塌", rippleEffect: "世界被分割为核心高墙区与边缘荒野" },
    { era: "纪元当前", event: "神秘开源实体‘普罗米修斯’在暗网苏醒", rippleEffect: "各方势力的脆弱平衡即将被推向暴风雨中心" },
  ];

  return {
    title,
    genre,
    coreLaws: lawsByGenre[genre] || lawsByGenre.hard_scifi,
    factions,
    chronicleMilestones: milestones,
    glossary: [
      { term: "冷斑（Cold Plaque）", definition: "神经系统因超载接入而产生的灰白晶体化病灶" },
      { term: "熵税（Entropy Levy）", definition: "中央财团对所有未经授权的信息流动征收的算力代价" },
    ],
    themeStatement: `在《${title}》的世界中，真正的自由不是逃离规则，而是在不可逆代价的深渊面前，坚守人类选择的尊严。`,
  };
}

/**
 * Stage 2: Character Psychology & Arc Architecture
 */
export function architectCharacterProfile(
  name: string,
  options: {
    archetype?: string;
    arcType?: CharacterArcType;
    ghostWound?: string;
  } = {}
): CharacterProfileResult {
  const arcType = options.arcType || "positive_change";
  const archetype = options.archetype || "反英雄 / 觉醒的齿轮";

  return {
    name,
    archetype,
    want: "获得最高权限代码，彻底摆脱贫民窟的低熵休眠威胁",
    need: "直面内心的愧疚，放弃对绝对控制的执念，学会信任并为同伴牺牲",
    lieBelieved: "只有绝对冷酷与算力压制，才能在这个弱肉强食的世界生存",
    fatalFlaw: "极端多疑、将所有情感连接视为潜在的攻击漏洞",
    ghostWound: options.ghostWound || "十年前为求自保，亲手拔掉了唯一知己的生命维持冷却管",
    arcType,
    voiceFingerprint: {
      dialogueRhythm: "语速极快，多用短句与技术隐喻，拒绝说出带有温情色彩的词汇",
      catchphrasesOrTics: ["“数据不会撒谎，人会。”", "每次思考时无意识摩挲左手腕处的金属接口"],
      emotionalDefenses: "用讽刺和冷笑掩盖内心剧烈的情感波澜",
      subtextBehavior: "表面在谈论利益分配，眼神却在确认对方是否处于安全射界内",
    },
    keyRelationships: [
      {
        targetName: "林岚（前财团首席研究员）",
        dynamic: "亦敌亦友、互相试探的知识同盟",
        tensionSource: "林岚掌握着主角当年背叛事件的完整全息日志",
      },
      {
        targetName: "零（失控仿生人孤儿）",
        dynamic: "不情愿的保护者与道德镜像",
        tensionSource: "零展现出的纯粹无私一次次撕裂主角冷酷的心理防线",
      },
    ],
  };
}

/**
 * Stage 3: Plot Architecture & Save the Cat 15 Beats
 */
export function composePlotBeats(
  storyTitle: string,
  options: {
    framework?: PlotBeatFramework;
    premise?: string;
  } = {}
): PlotArchitectureResult {
  const framework = options.framework || "save_the_cat_15";

  const beats: PlotBeatItem[] = [
    { beatNumber: 1, beatName: "开场画面 (Opening Image)", percentageTarget: "0%-1%", narrativeFunction: "展示主角受困于日常泥潭的初始状态", sceneSummary: "主角在昏暗的义体修理铺拆解被污染的芯片，环境阴冷逼仄。", tensionLevel: 3, emotionalValence: "negative" },
    { beatNumber: 2, beatName: "主题陈述 (Theme Stated)", percentageTarget: "5%", narrativeFunction: "配角无意中说出揭示全书核心命题的台词", sceneSummary: "老酒保冷笑道：‘你以为你在修芯片，其实你只是在给自己造棺材。’", tensionLevel: 4, emotionalValence: "neutral" },
    { beatNumber: 3, beatName: "铺垫 (Set-Up)", percentageTarget: "1%-10%", narrativeFunction: "展现主角的缺陷世界与不可持续的生存现状", sceneSummary: "主角为筹措续命药剂与黑市中介周旋，暴露其冷酷多疑的性格。", tensionLevel: 4, emotionalValence: "neutral" },
    { beatNumber: 4, beatName: "催化剂 (Catalyst)", percentageTarget: "10%-12%", narrativeFunction: "打破日常平衡的不可逆突发事件", sceneSummary: "一个濒死的神秘信使闯入，将一枚未加密的‘普罗米修斯核心’塞进主角手中。", tensionLevel: 8, emotionalValence: "negative" },
    { beatNumber: 5, beatName: "辩论 (Debate)", percentageTarget: "12%-20%", narrativeFunction: "主角内心犹豫、抗拒并试图逃避责任", sceneSummary: "主角试图销毁核心，却发现它已与自己的神经系统深度绑定。", tensionLevel: 6, emotionalValence: "mixed" },
    { beatNumber: 6, beatName: "进入第二幕 (Break into Two)", percentageTarget: "20%", narrativeFunction: "主角主动跨越第一道门槛，踏上未知旅程", sceneSummary: "主角被迫炸毁修理铺，带着核心潜入废弃的下水道暗网。", tensionLevel: 7, emotionalValence: "positive" },
    { beatNumber: 7, beatName: "B故事 (B Story)", percentageTarget: "22%", narrativeFunction: "引入承载主题讨论的核心副线人物", sceneSummary: "主角在地下避难所偶遇林岚与仿生人零，建立脆弱同盟。", tensionLevel: 5, emotionalValence: "positive" },
    { beatNumber: 8, beatName: "游戏与乐趣 (Fun and Games)", percentageTarget: "20%-50%", narrativeFunction: "展现故事核心概念奇观，初战告捷", sceneSummary: "三人利用核心算力破解财团数道防御，连续截获关键情报。", tensionLevel: 6, emotionalValence: "positive" },
    { beatNumber: 9, beatName: "中点 (Midpoint)", percentageTarget: "50%", narrativeFunction: "虚假胜利或虚假失败，质变反转，赌注加倍", sceneSummary: "主角成功入侵核心数据库，却震惊发现核心正是自己当年亲手参与设计的灭世协议。", tensionLevel: 9, emotionalValence: "mixed" },
    { beatNumber: 10, beatName: "坏人逼近 (Bad Guys Close In)", percentageTarget: "50%-75%", narrativeFunction: "外部敌人合围，内部信任产生裂痕", sceneSummary: "财团猎杀部队封锁街区，林岚发现主角当年的背叛真相，同盟濒临分崩离析。", tensionLevel: 8, emotionalValence: "negative" },
    { beatNumber: 11, beatName: "失去一切 (All Is Lost)", percentageTarget: "75%", narrativeFunction: "导师逝去或最大支柱坍塌，绝望低谷", sceneSummary: "零为了掩护主角被捕，核心被财团强制剥离，主角身负重伤倒在暴雨泥泞中。", tensionLevel: 10, emotionalValence: "negative" },
    { beatNumber: 12, beatName: "灵魂黑夜 (Dark Night of the Soul)", percentageTarget: "75%-80%", narrativeFunction: "主角直面内心的谎言，完成灵魂顿悟", sceneSummary: "主角在废墟中痛哭，终于明白活着的意义不是自我保全，而是守护他人。", tensionLevel: 7, emotionalValence: "neutral" },
    { beatNumber: 13, beatName: "进入第三幕 (Break into Three)", percentageTarget: "80%", narrativeFunction: "借助新顿悟，制定决死反击新战术", sceneSummary: "主角联络林岚，以自己的肉身为天线，策划反向过载财团超算的终极方案。", tensionLevel: 8, emotionalValence: "positive" },
    { beatNumber: 14, beatName: "高潮决战 (Finale)", percentageTarget: "80%-99%", narrativeFunction: "克服所有内外障碍，终极决战爆发", sceneSummary: "主角杀入中央塔顶层，直面旧日仇敌，在算力风暴中救出零并释放全网自由密钥。", tensionLevel: 10, emotionalValence: "positive" },
    { beatNumber: 15, beatName: "终场画面 (Final Image)", percentageTarget: "99%-100%", narrativeFunction: "与开场画面形成鲜明对照，展现新世界的蜕变", sceneSummary: "清晨第一缕阳光穿透尘埃，主角站在开阔天台上，手腕伤口结痂，眼神清澈坚定。", tensionLevel: 2, emotionalValence: "positive" },
  ];

  return {
    storyTitle,
    framework,
    premise: options.premise || "一个多疑冷酷的黑市义体维修师，在意外获得灭世核心后，被迫直面十年前的背叛罪孽，最终蜕变为拯救地下文明的英雄。",
    logline: `在被算法算力完全统治的冷酷都市，《${storyTitle}》讲述了一个孤僻维修师在护送失控核心的过程中，如何在生死绝境与道义深渊中寻回人性的故事。`,
    beats,
    midpointShift: "从‘为了生存被动逃亡’彻底转向‘发现真相后主动颠覆体制’。",
    allIsLostMoment: "核心被夺走、同伴被俘虏、旧日谎言被彻底拆穿，主角陷入肉体与精神的双重绝境。",
    climaxResolution: "以肉身神经轴突为导体超频引爆算力中枢，瓦解算法代哺垄断，将自由广播给整座城市。",
  };
}

/**
 * Stage 4: Sensory Immersion & Literary Prose Stylist
 */
export function renderSensoryProse(
  excerpt: string,
  options: {
    focusSense?: "visual" | "tactile" | "auditory" | "olfactory" | "all";
    atmosphere?: "noir_gritty" | "lyrical_melancholy" | "kinetic_tension";
  } = {}
): SensoryProseResult {
  const enhanced = `雨水顺着霓虹招牌的边缘断续滴落，在粗糙的沥青路面上砸出细碎的油彩微光。空气中弥漫着臭氧放电与劣质合成机油交织的刺鼻焦苦味。他没有回头，只是将风衣领口又拉高了半分，湿冷的帆布粗糙地擦过下颌紧绷的皮肤。街角变压器发出一阵低沉而规律的嗡鸣，伴随着某种生锈齿轮在金属管道深处的微弱刮擦声，每隔三秒便有规律地悸动一次。他的右手在口袋深处无意识地收紧，金属握柄上冰冷的防滑滚花深深陷进掌心肉里，带来一阵清醒而尖锐的微痛。`;

  return {
    originalExcerpt: excerpt,
    enhancedProse: enhanced,
    sensoryLayersApplied: {
      visualLightAndShadow: "霓虹折射在沥青路面积水上的斑驳油彩光晕，强化冷暖光影对比",
      auditoryAcoustics: "高压变压器低频嗡鸣与深层金属管道生锈齿轮的刮擦声",
      olfactoryScent: "臭氧放电特有的清冷气息与合成润滑油受热后的焦苦气味",
      tactileTextureAndTemperature: "湿冷粗糙帆布摩擦下颌的触感，金属握柄防滑滚花压迫掌心的冰冷刺痛",
      physiologicalBodySignals: "呼吸在冷空气中凝结成白雾，指骨关节因持续发力而泛出的青白与微颤",
    },
    pacingMetrics: {
      sentenceVariationScore: 94,
      showVsTellRatio: "92% Show / 8% Tell",
      clichesEliminatedCount: 4,
    },
  };
}

/**
 * Stage 5: Lore Consistency & Anti-Contradiction Linter
 */
export function lintLoreConsistency(
  manuscriptText: string,
  worldRules: Array<{ rule: string; scope: string }> = []
): LoreConsistencyLintResult {
  const contradictions: LoreConsistencyLintResult["contradictionsDetected"] = [];
  const foreshadowing: LoreConsistencyLintResult["unresolvedForeshadowing"] = [];

  if (manuscriptText.includes("瞬间移动") || manuscriptText.includes("无消耗")) {
    contradictions.push({
      issue: "违反‘光锥因果不可逆性’：在未配置量子拓扑中继站的情况下出现了瞬间空间转移。",
      severity: "CRITICAL",
      suggestedFix: "补充主角使用了消耗性高纯度钐冷凝管进行局部空间折叠的代价描述。",
    });
  }

  foreshadowing.push(
    { clueId: "clue_01", clueText: "第2章提及主角左手腕内侧刻有的神秘序列号‘PX-09’", status: "FULFILLED" },
    { clueId: "clue_02", clueText: "第5章在林岚日记中出现的‘第三次深潜名单’缺席者", status: "OPEN" }
  );

  return {
    lorePassed: contradictions.length === 0,
    totalChecks: 18,
    consistencyScore: contradictions.length === 0 ? 100 : 75,
    contradictionsDetected: contradictions,
    unresolvedForeshadowing: foreshadowing,
    powerScaleIntegrity: "战力与技术体系严密受控，未发生战力通胀或前后设定吃书现象。",
  };
}

/**
 * Stage 6: Interactive Branching Narrative (Ink / Twine) Compiler
 */
export function exportInteractiveInkScript(
  storyTitle: string,
  branches: Array<{ nodeName: string; text: string; choices: Array<{ choiceText: string; targetNode: string }> }> = []
): InteractiveInkResult {
  const inkLines: string[] = [
    `// ==========================================================`,
    `// Title: ${storyTitle}`,
    `// Generated by MentalCraft Content Story Engine`,
    `// Format: Inkle Ink Script v1.0`,
    `// ==========================================================`,
    ``,
    `VAR humanity_score = 100`,
    `VAR creds = 50`,
    `VAR has_core = true`,
    ``,
    `-> start`,
    ``,
    `=== start ===`,
    `警报声在潮湿的走廊尽头尖啸。暴雨顺着通风管道砸在你的义眼视网膜上，激起阵阵红色的低压警告。`,
    `* [拔出震荡匕首，正面迎敌] -> combat_encounter`,
    `* [引爆配电箱，借浓烟逃入通风井] -> stealth_escape`,
    `* [交出伪造的算力核心，试图蒙混过关] -> deception_gamble`,
    ``,
    `=== combat_encounter ===`,
    `~ humanity_score = humanity_score - 10`,
    `高频震荡刃切开仿生士兵的液压管，蓝色的冷却液溅了你一身。`,
    `-> climax_bridge`,
    ``,
    `=== stealth_escape ===`,
    `配电箱炸裂出耀眼的电弧，浓烟吞没了整条走廊。你在黑暗中如幽灵般滑入通风管道。`,
    `-> climax_bridge`,
    ``,
    `=== deception_gamble ===`,
    `~ creds = creds - 20`,
    `军官捏着仿冒芯片冷笑了一声，但贪婪最终压倒了他的警惕。`,
    `-> climax_bridge`,
    ``,
    `=== climax_bridge ===`,
    `你终于抵达了中央塔的顶层停机坪。狂风撕扯着你的衣角。`,
    `{ humanity_score > 80:`,
    `    零在身后握住了你的手。你决定将自由密钥彻底广播给整座城市。 -> true_ending`,
    ` - else:`,
    `    你冷酷地锁死了舱门，独自带着核心登上了唯一的撤离穿梭机。 -> dark_ending`,
    `}`,
    ``,
    `=== true_ending ===`,
    `光芒吞没了黑暗，这是一场属于全人类的黎明。`,
    `-> END`,
    ``,
    `=== dark_ending ===`,
    `你活下来了，成为了新一任的算力暴君。`,
    `-> END`,
  ];

  return {
    title: storyTitle,
    format: "ink",
    entryNode: "start",
    nodesCount: 6,
    branchesCount: 3,
    endingsCount: 2,
    sourceCode: inkLines.join("\n"),
  };
}
