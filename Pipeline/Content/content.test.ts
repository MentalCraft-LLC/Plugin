import { describe, test, expect } from "bun:test";
import {
  forgeWorldRules,
  architectCharacterProfile,
  composePlotBeats,
  renderSensoryProse,
  lintLoreConsistency,
  exportInteractiveInkScript,
} from "./modules/story.ts";
import {
  generatePasCopy,
  adaptOmnichannelContent,
  generateViralHooks,
  generateCampaignSprint,
} from "./modules/marketing.ts";
import { contentOperation, formatContentSummary } from "./operation.ts";
import { handleContentMcpMessage } from "./mcp-server.ts";

describe("Plugin/Content Creative & Commercial Engine", () => {
  // Story Tests
  test("forgeWorldRules generates complete world laws, factions, and chronicle", () => {
    const res = forgeWorldRules("心智纪元：算法裂变", { genre: "cyberpunk" });
    expect(res.title).toBe("心智纪元：算法裂变");
    expect(res.genre).toBe("cyberpunk");
    expect(res.coreLaws.length).toBeGreaterThanOrEqual(2);
    expect(res.factions.length).toBeGreaterThanOrEqual(2);
    expect(res.chronicleMilestones.length).toBeGreaterThanOrEqual(3);
    expect(res.themeStatement).toContain("心智纪元：算法裂变");
  });

  test("architectCharacterProfile designs Want vs Need psychology and voice fingerprint", () => {
    const char = architectCharacterProfile("陆沉", {
      archetype: "暗网义体维修师",
      arcType: "positive_change",
    });
    expect(char.name).toBe("陆沉");
    expect(char.want).toBeDefined();
    expect(char.need).toBeDefined();
    expect(char.fatalFlaw).toBeDefined();
    expect(char.voiceFingerprint.dialogueRhythm).toBeDefined();
    expect(char.keyRelationships.length).toBeGreaterThanOrEqual(2);
  });

  test("composePlotBeats constructs 15-beat Save the Cat narrative outline", () => {
    const plot = composePlotBeats("深空回响", {
      framework: "save_the_cat_15",
    });
    expect(plot.storyTitle).toBe("深空回响");
    expect(plot.beats.length).toBe(15);
    expect(plot.beats[0].beatName).toContain("开场画面");
    expect(plot.beats[8].beatName).toContain("中点");
    expect(plot.beats[10].beatName).toContain("失去一切");
    expect(plot.midpointShift).toBeDefined();
    expect(plot.allIsLostMoment).toBeDefined();
  });

  test("renderSensoryProse applies multi-layered sensory immersion and Show Don't Tell", () => {
    const prose = renderSensoryProse("他走进雨夜的街道，感觉很危险。");
    expect(prose.enhancedProse.length).toBeGreaterThan(50);
    expect(prose.sensoryLayersApplied.visualLightAndShadow).toBeDefined();
    expect(prose.sensoryLayersApplied.tactileTextureAndTemperature).toBeDefined();
    expect(prose.pacingMetrics.sentenceVariationScore).toBeGreaterThan(80);
    expect(prose.pacingMetrics.clichesEliminatedCount).toBeGreaterThan(0);
  });

  test("lintLoreConsistency detects lore violations and tracks foreshadowing", () => {
    const clean = lintLoreConsistency("主角消耗了一管钐冷凝液，在废墟中艰难前行。");
    expect(clean.lorePassed).toBe(true);
    expect(clean.consistencyScore).toBe(100);
    expect(clean.unresolvedForeshadowing.length).toBeGreaterThanOrEqual(2);

    const violating = lintLoreConsistency("主角没有任何消耗，瞬间移动到了千里之外。");
    expect(violating.lorePassed).toBe(false);
    expect(violating.contradictionsDetected.length).toBeGreaterThan(0);
    expect(violating.contradictionsDetected[0].severity).toBe("CRITICAL");
  });

  test("exportInteractiveInkScript compiles branching narrative into standard Ink script", () => {
    const ink = exportInteractiveInkScript("黑客决断");
    expect(ink.format).toBe("ink");
    expect(ink.sourceCode).toContain("VAR humanity_score");
    expect(ink.sourceCode).toContain("-> true_ending");
    expect(ink.nodesCount).toBe(6);
    expect(ink.endingsCount).toBe(2);
  });

  // Marketing Tests
  test("generatePasCopy crafts targeted Problem-Agitate-Solve copy deck", () => {
    const copy = generatePasCopy("SpriteFlow", {
      targetAudience: "indie_game_dev",
    });
    expect(copy.productName).toBe("SpriteFlow");
    expect(copy.targetAudience).toBe("indie_game_dev");
    expect(copy.problem).toContain("显存");
    expect(copy.agitation).toContain("Photoshop");
    expect(copy.solution).toContain("MaxRects");
    expect(copy.headlineVariations.length).toBe(3);
    expect(copy.bulletProofs.length).toBe(3);
  });

  test("adaptOmnichannelContent outputs tailored copy for X, Reddit, WeChat, and Product Hunt", () => {
    const adapted = adaptOmnichannelContent("SpriteFlow", "2D 贴图打包与显存优化");
    expect(adapted.channels.twitter_x).toBeDefined();
    expect(adapted.channels.reddit_hn).toBeDefined();
    expect(adapted.channels.wechat_official).toBeDefined();
    expect(adapted.channels.redbook_xiaohongshu).toBeDefined();
    expect(adapted.channels.bilibili_youtube).toBeDefined();
    expect(adapted.channels.twitter_x.formatName).toContain("Thread");
    expect(adapted.channels.twitter_x.primaryCopy).toContain("SpriteFlow");
    expect(adapted.channels.reddit_hn.primaryCopy).toContain("Show HN");
  });

  test("generateViralHooks creates 3-second attention grabbers and CTAs", () => {
    const hooks = generateViralHooks("SpriteFlow");
    expect(hooks.productName).toBe("SpriteFlow");
    expect(hooks.hooks.length).toBeGreaterThanOrEqual(3);
    expect(hooks.highConvertingCtas.length).toBeGreaterThanOrEqual(3);
  });

  test("generateCampaignSprint structures 14-day product launch roadmap", () => {
    const campaign = generateCampaignSprint("SpriteFlow");
    expect(campaign.durationDays).toBe(14);
    expect(campaign.phases.length).toBe(4);
    expect(campaign.overallTargetKpis.targetSignupsOrStars).toBe(2500);
    expect(campaign.overallTargetKpis.expectedMrrContributionUsd).toBe(10000);
  });

  // Operation & MCP Server Tests
  test("contentOperation executes all actions cleanly with summary formatting", async () => {
    const res1 = await contentOperation({
      action: "story_worldbuilding_forge",
      title: "赛博异化",
      genre: "cyberpunk",
    });
    expect(res1.success).toBe(true);
    expect(formatContentSummary(res1)).toContain("Worldbuilding Bible");

    const res2 = await contentOperation({
      action: "marketing_pas_copywriter",
      product_name: "SpriteFlow",
      target_audience: "indie_game_dev",
    });
    expect(res2.success).toBe(true);
    expect(formatContentSummary(res2)).toContain("PAS Conversion Copy");
  });

  test("handleContentMcpMessage responds to initialize, tools/list, and tools/call", async () => {
    const initRes = await handleContentMcpMessage({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(initRes.result.serverInfo.name).toBe("mentalcraft-content");

    const listRes = await handleContentMcpMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listRes.result.tools[0].name).toBe("content");

    const callRes = await handleContentMcpMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "content",
        arguments: {
          action: "marketing_viral_hook_generator",
          product_name: "SpriteFlow",
        },
      },
    });
    expect(callRes.result.isError).toBe(false);
    expect(callRes.result.content[0].text).toContain("Viral Hooks");
  });
});
