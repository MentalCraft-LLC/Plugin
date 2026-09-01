/**
 * Plugin/Content Core Definitions & Types
 *
 * Sovereign, Host-Agnostic Content & Narrative Engineering Protocol
 */

export * from "./modules/story.ts";
export * from "./modules/marketing.ts";

import type {
  WorldbuildingGenre,
  WorldRuleResult,
  CharacterArcType,
  CharacterProfileResult,
  PlotBeatFramework,
  PlotArchitectureResult,
  SensoryProseResult,
  LoreConsistencyLintResult,
  InteractiveInkResult,
} from "./modules/story.ts";

import type {
  TargetAudiencePersona,
  PasCopyResult,
  OmnichannelPlatform,
  OmnichannelAdaptationResult,
  ViralHookResult,
  CampaignSprintResult,
} from "./modules/marketing.ts";

export type ContentAction =
  | "story_worldbuilding_forge"
  | "story_character_arc_architect"
  | "story_plot_beat_composer"
  | "story_sensory_prose_render"
  | "story_lore_consistency_linter"
  | "story_interactive_ink_exporter"
  | "marketing_pas_copywriter"
  | "marketing_omnichannel_adapter"
  | "marketing_viral_hook_generator"
  | "marketing_campaign_playbook";

export type ContentCommand =
  | {
      action: "story_worldbuilding_forge";
      title: string;
      genre?: WorldbuildingGenre;
      core_themes?: string[];
    }
  | {
      action: "story_character_arc_architect";
      name: string;
      archetype?: string;
      arc_type?: CharacterArcType;
      ghost_wound?: string;
    }
  | {
      action: "story_plot_beat_composer";
      story_title: string;
      framework?: PlotBeatFramework;
      premise?: string;
    }
  | {
      action: "story_sensory_prose_render";
      excerpt: string;
      focus_sense?: "visual" | "tactile" | "auditory" | "olfactory" | "all";
      atmosphere?: "noir_gritty" | "lyrical_melancholy" | "kinetic_tension";
    }
  | {
      action: "story_lore_consistency_linter";
      manuscript_text: string;
      world_rules?: Array<{ rule: string; scope: string }>;
    }
  | {
      action: "story_interactive_ink_exporter";
      story_title: string;
      branches?: Array<{ nodeName: string; text: string; choices: Array<{ choiceText: string; targetNode: string }> }>;
    }
  | {
      action: "marketing_pas_copywriter";
      product_name: string;
      target_audience?: TargetAudiencePersona;
      key_feature?: string;
      metric_proof?: string;
    }
  | {
      action: "marketing_omnichannel_adapter";
      product_name: string;
      source_topic: string;
    }
  | {
      action: "marketing_viral_hook_generator";
      product_name: string;
      hook_category?: ViralHookResult["hookCategory"];
    }
  | {
      action: "marketing_campaign_playbook";
      product_name: string;
      campaign_name?: string;
    };

export type ContentResult =
  | { success: true; action: "story_worldbuilding_forge"; data: WorldRuleResult }
  | { success: true; action: "story_character_arc_architect"; data: CharacterProfileResult }
  | { success: true; action: "story_plot_beat_composer"; data: PlotArchitectureResult }
  | { success: true; action: "story_sensory_prose_render"; data: SensoryProseResult }
  | { success: true; action: "story_lore_consistency_linter"; data: LoreConsistencyLintResult }
  | { success: true; action: "story_interactive_ink_exporter"; data: InteractiveInkResult }
  | { success: true; action: "marketing_pas_copywriter"; data: PasCopyResult }
  | { success: true; action: "marketing_omnichannel_adapter"; data: OmnichannelAdaptationResult }
  | { success: true; action: "marketing_viral_hook_generator"; data: ViralHookResult }
  | { success: true; action: "marketing_campaign_playbook"; data: CampaignSprintResult }
  | { success: false; error: string; action: string };
