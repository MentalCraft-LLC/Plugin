#!/usr/bin/env bun
/**
 * Plugin/Content MCP Protocol Server
 *
 * Exposes Content Story & Marketing tools over standard MCP JSON-RPC 2.0 stdio.
 */

import { contentOperation, formatContentSummary } from "./operation.ts";
import type { ContentCommand } from "./core.ts";

export const CONTENT_INPUT_SCHEMA = {
  type: "object",
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: [
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
      ],
      description: "Content Story & Marketing action to execute",
    },
    // Story Parameters
    title: { type: "string", description: "World or story title" },
    story_title: { type: "string", description: "Story title for outline or script" },
    genre: { type: "string", enum: ["hard_scifi", "cyberpunk", "dark_fantasy", "mystery_thriller", "realism", "mythological"] },
    core_themes: { type: "array", items: { type: "string" } },
    name: { type: "string", description: "Character name" },
    archetype: { type: "string", description: "Character archetype" },
    arc_type: { type: "string", enum: ["positive_change", "tragic_corruption", "steadfast_flat", "disillusionment"] },
    ghost_wound: { type: "string", description: "Past trauma or ghost wound" },
    framework: { type: "string", enum: ["save_the_cat_15", "heros_journey_12", "dan_harmon_circle", "three_act_mystery"] },
    premise: { type: "string", description: "Core story premise" },
    excerpt: { type: "string", description: "Draft text excerpt to enhance with sensory details" },
    focus_sense: { type: "string", enum: ["visual", "tactile", "auditory", "olfactory", "all"] },
    atmosphere: { type: "string", enum: ["noir_gritty", "lyrical_melancholy", "kinetic_tension"] },
    manuscript_text: { type: "string", description: "Manuscript text to check for lore contradictions" },
    world_rules: { type: "array", items: { type: "object" } },
    branches: { type: "array", items: { type: "object" } },

    // Marketing Parameters
    product_name: { type: "string", description: "Target product or service name" },
    target_audience: { type: "string", enum: ["indie_game_dev", "saas_founder", "academic_researcher", "creative_writer", "indie_hacker"] },
    key_feature: { type: "string" },
    metric_proof: { type: "string" },
    source_topic: { type: "string", description: "Core topic or insight to adapt into multi-channel posts" },
    hook_category: { type: "string", enum: ["curiosity_gap", "contrarian_truth", "pain_relief", "stat_shock", "founder_confession"] },
    campaign_name: { type: "string", description: "Product launch campaign name" },
  },
};

export async function handleContentMcpMessage(request: any): Promise<any> {
  const { id, method, params } = request;

  // JSON-RPC 2.0 Notification: requests without an id (or notifications/*) MUST NOT return a response
  if (id === undefined || (typeof method === "string" && method.startsWith("notifications/"))) {
    return null;
  }

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "mentalcraft-content",
          version: "1.0.0",
          description: "MentalCraft Creative & Commercial Content Production Engine (Story, Worldbuilding, Character Arcs, 15 Plot Beats, PAS Copywriting, Omnichannel Adapters).",
        },
      },
    };
  }

  if (method === "ping") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
    };
  }

  if (method === "resources/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { resources: [] },
    };
  }

  if (method === "prompts/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { prompts: [] },
    };
  }

  if (method === "logging/setLevel") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "content",
            description: "MentalCraft Content Engine: Fiction novel worldbuilding, character arcs, plot beats, sensory prose, PAS marketing copy, and multi-channel launch matrices.",
            inputSchema: CONTENT_INPUT_SCHEMA,
          },
        ],
      },
    };
  }

  if (method === "tools/call") {
    const args = params?.arguments ?? {};
    const res = await contentOperation(args as ContentCommand);
    const text = formatContentSummary(res);
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `${text}\n\n\`\`\`json\n${JSON.stringify(res, null, 2)}\n\`\`\``,
          },
        ],
        isError: !res.success,
      },
    };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

import { protectStdioTransport } from "../../stdio.ts";

export function startContentMcpServer() {
  protectStdioTransport();
  let buffer = "";
  process.stdin.setEncoding("utf-8");

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const req = JSON.parse(trimmed);
        const res = await handleContentMcpMessage(req);
        if (res !== null && res !== undefined) {
          process.stdout.write(JSON.stringify(res) + "\n");
        }
      } catch (err: any) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error", data: String(err) } }) + "\n");
      }
    }
  });
}

if (import.meta.main) {
  startContentMcpServer();
}
