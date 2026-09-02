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

export async function contentOperation(input: ContentCommand): Promise<ContentResult> {
  try {
    switch (input.action) {
      case "story_worldbuilding_forge": {
        const data = forgeWorldRules(input.title, {
          genre: input.genre,
          coreThemes: input.core_themes,
        });
        return { success: true, action: input.action, data };
      }

      case "story_character_arc_architect": {
        const data = architectCharacterProfile(input.name, {
          archetype: input.archetype,
          arcType: input.arc_type,
          ghostWound: input.ghost_wound,
        });
        return { success: true, action: input.action, data };
      }

      case "story_plot_beat_composer": {
        const data = composePlotBeats(input.story_title, {
          framework: input.framework,
          premise: input.premise,
        });
        return { success: true, action: input.action, data };
      }

      case "story_sensory_prose_render": {
        const data = renderSensoryProse(input.excerpt, {
          focusSense: input.focus_sense,
          atmosphere: input.atmosphere,
        });
        return { success: true, action: input.action, data };
      }

      case "story_lore_consistency_linter": {
        const data = lintLoreConsistency(input.manuscript_text, input.world_rules);
        return { success: true, action: input.action, data };
      }

      case "story_interactive_ink_exporter": {
        const data = exportInteractiveInkScript(input.story_title, input.branches);
        return { success: true, action: input.action, data };
      }

      case "marketing_pas_copywriter": {
        const data = generatePasCopy(input.product_name, {
          targetAudience: input.target_audience,
          keyFeature: input.key_feature,
          metricProof: input.metric_proof,
        });
        return { success: true, action: input.action, data };
      }

      case "marketing_omnichannel_adapter": {
        const data = adaptOmnichannelContent(input.product_name, input.source_topic);
        return { success: true, action: input.action, data };
      }

      case "marketing_viral_hook_generator": {
        const data = generateViralHooks(input.product_name, {
          category: input.hook_category,
        });
        return { success: true, action: input.action, data };
      }

      case "marketing_campaign_playbook": {
        const data = generateCampaignSprint(input.product_name, input.campaign_name);
        return { success: true, action: input.action, data };
      }

      default: {
        return { success: false, action: (input as any).action || "unknown", error: `Unknown action: ${(input as any).action}` };
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
