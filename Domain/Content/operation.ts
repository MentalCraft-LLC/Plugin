/**
 * Plugin/Content Operation Dispatcher
 *
 * Implements sovereign action execution and human-readable formatting.
 */

import {
  type ContentCommand,
  type ContentResult,
  forgeWorldRules,
  architectCharacterProfile,
  composePlotBeats,
  renderSensoryProse,
  lintLoreConsistency,
  exportInteractiveInkScript,
  generatePasCopy,
  adaptOmnichannelContent,
  generateViralHooks,
  generateCampaignSprint,
} from "./core.ts";

function normalizeContentAction(action: string): string {
  switch (action) {
    case "forge_world_rules":
    case "worldbuilding":
    case "world_rules":
    case "story_worldbuilding":
      return "story_worldbuilding_forge";
    case "character_arc":
    case "character_profile":
    case "architect_character":
      return "story_character_arc_architect";
    case "plot_beats":
    case "plot_beat_composer":
    case "compose_plot":
      return "story_plot_beat_composer";
    case "sensory_prose":
    case "sensory_render":
      return "story_sensory_prose_render";
    case "lore_consistency":
    case "lore_linter":
    case "lint_lore":
      return "story_lore_consistency_linter";
    case "interactive_ink":
    case "ink_script":
    case "export_ink":
      return "story_interactive_ink_exporter";
    case "pas_copy":
    case "pas_copywriter":
    case "generate_pas":
      return "marketing_pas_copywriter";
    case "omnichannel":
    case "omnichannel_adapter":
    case "adapt_content":
      return "marketing_omnichannel_adapter";
    case "viral_hooks":
    case "viral_hook_generator":
      return "marketing_viral_hook_generator";
    case "campaign_playbook":
    case "campaign_sprint":
      return "marketing_campaign_playbook";
    default:
      return action;
  }
}

export async function contentOperation(input: ContentCommand): Promise<ContentResult> {
  try {
    const raw: any = (input as any).params ? { ...input, ...(input as any).params } : input;
    const action = normalizeContentAction(raw.action);

    switch (action) {
      case "story_worldbuilding_forge": {
        const title = raw.title || raw.story_title || raw.name || "Default World";
        const data = forgeWorldRules(title, {
          genre: raw.genre,
          coreThemes: raw.core_themes || raw.coreThemes,
        });
        return { success: true, action, data };
      }

      case "story_character_arc_architect": {
        const name = raw.name || raw.character_name || "Protagonist";
        const data = architectCharacterProfile(name, {
          archetype: raw.archetype,
          arcType: raw.arc_type || raw.arcType,
          ghostWound: raw.ghost_wound || raw.ghostWound,
        });
        return { success: true, action, data };
      }

      case "story_plot_beat_composer": {
        const storyTitle = raw.story_title || raw.title || "Untitled Story";
        const data = composePlotBeats(storyTitle, {
          framework: raw.framework,
          premise: raw.premise,
        });
        return { success: true, action, data };
      }

      case "story_sensory_prose_render": {
        const data = renderSensoryProse(raw.excerpt || raw.text || "", {
          focusSense: raw.focus_sense || raw.focusSense,
          atmosphere: raw.atmosphere,
        });
        return { success: true, action, data };
      }

      case "story_lore_consistency_linter": {
        const data = lintLoreConsistency(raw.manuscript_text || raw.text || "", raw.world_rules || raw.worldRules || []);
        return { success: true, action, data };
      }

      case "story_interactive_ink_exporter": {
        const storyTitle = raw.story_title || raw.title || "Interactive Script";
        const data = exportInteractiveInkScript(storyTitle, raw.branches || []);
        return { success: true, action, data };
      }

      case "marketing_pas_copywriter": {
        const productName = raw.product_name || raw.product || "Product";
        const data = generatePasCopy(productName, {
          targetAudience: raw.target_audience || raw.targetAudience,
          keyFeature: raw.key_feature || raw.keyFeature,
          metricProof: raw.metric_proof || raw.metricProof,
        });
        return { success: true, action, data };
      }

      case "marketing_omnichannel_adapter": {
        const productName = raw.product_name || raw.product || "Product";
        const data = adaptOmnichannelContent(productName, raw.source_topic || raw.sourceTopic || "Announcement");
        return { success: true, action, data };
      }

      case "marketing_viral_hook_generator": {
        const productName = raw.product_name || raw.product || "Product";
        const data = generateViralHooks(productName, {
          category: raw.hook_category || raw.hookCategory,
        });
        return { success: true, action, data };
      }

      case "marketing_campaign_playbook": {
        const productName = raw.product_name || raw.product || "Product";
        const campaignName = raw.campaign_name || raw.campaign || "Sprint Campaign";
        const data = generateCampaignSprint(productName, campaignName);
        return { success: true, action, data };
      }

      case "list_actions": {
        const actions = [
          "story_worldbuilding_forge",
          "story_character_arc_architect",
          "story_plot_beat_composer",
          "story_sensory_prose_render",
          "story_lore_consistency_linter",
          "story_interactive_ink_exporter",
          "marketing_pas_copywriter",
          "marketing_omnichannel_adapter",
          "marketing_viral_hook_generator",
          "marketing_campaign_playbook",
          "list_actions",
        ];
        return {
          success: true,
          action: "list_actions",
          data: {
            plugin: "content",
            actions,
            totalActions: actions.length,
            description: "MentalCraft Creative & Commercial Content Production Engine",
          },
        };
      }

      default: {
        return { success: false, action: raw.action || "unknown", error: `Unknown action: ${raw.action}` };
      }
    }
  } catch (err: any) {
    return { success: false, action: input.action, error: err.message || String(err) };
  }
}

export function formatContentSummary(result: ContentResult): string {
  if (!result.success) {
    return `❌ Content Operation Failed (${result.action}): ${result.error}`;
  }

  const { action, data } = result;
  switch (action) {
    case "story_worldbuilding_forge": {
      return `🪐 Worldbuilding Bible: ${data.title} (${data.genre.toUpperCase()}) | ${data.coreLaws.length} Laws | ${data.factions.length} Factions | Milestones: ${data.chronicleMilestones.length}`;
    }
    case "story_character_arc_architect": {
      return `🎭 Character Arc: ${data.name} (${data.archetype}) | Arc: ${data.arcType} | Want: ${data.want.slice(0, 30)}... | Need: ${data.need.slice(0, 30)}...`;
    }
    case "story_plot_beat_composer": {
      return `🎼 15 Plot Beats: ${data.storyTitle} (${data.framework}) | Total Beats: ${data.beats.length} | Midpoint: ${data.midpointShift.slice(0, 30)}...`;
    }
    case "story_sensory_prose_render": {
      return `✨ Sensory Prose: ${data.pacingMetrics.showVsTellRatio} | Variation: ${data.pacingMetrics.sentenceVariationScore}/100 | Cliches Eliminated: ${data.pacingMetrics.clichesEliminatedCount}`;
    }
    case "story_lore_consistency_linter": {
      return `🔍 Lore Consistency: ${data.consistencyScore}/100 | Contradictions: ${data.contradictionsDetected.length} | Unresolved Clues: ${data.unresolvedForeshadowing.filter((c) => c.status === "OPEN").length}`;
    }
    case "story_interactive_ink_exporter": {
      return `🎮 Interactive Story (.ink): ${data.title} | ${data.nodesCount} Nodes | ${data.branchesCount} Choice Branches | ${data.endingsCount} Endings`;
    }
    case "marketing_pas_copywriter": {
      return `📢 PAS Conversion Copy: ${data.productName} (${data.targetAudience}) | ${data.headlineVariations.length} Headlines | ${data.bulletProofs.length} Proofs`;
    }
    case "marketing_omnichannel_adapter": {
      return `🧵 Omnichannel Matrix: ${data.productName} | Channels: ${Object.keys(data.channels).join(", ")}`;
    }
    case "marketing_viral_hook_generator": {
      return `🎣 Viral Hooks: ${data.productName} | ${data.hooks.length} Hooks | ${data.highConvertingCtas.length} High-Converting CTAs`;
    }
    case "marketing_campaign_playbook": {
      return `🚀 Launch Sprint: ${data.campaignName} (14 Days) | Target Traffic: ${data.overallTargetKpis.estimatedTrafficPv} PV | Target MRR: $${data.overallTargetKpis.expectedMrrContributionUsd}`;
    }
  }
}
