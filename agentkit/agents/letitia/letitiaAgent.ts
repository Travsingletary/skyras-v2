import { memoryClient } from "../../memory/memoryClient";
import { callLetitiaSaveAsset, callLetitiaSearchAssets } from "../../integrations/fastapiClients";
import { AgentDefinition } from "../types";

export type LetitiaAgentTools = {
  search_assets: (payload: { query: string; tags?: string[] }) => Promise<unknown>;
  save_asset_metadata: (payload: {
    id?: string;
    type: string;
    tags: string[];
    metadata: Record<string, unknown>;
  }) => Promise<unknown>;
  save_style_rule: (payload: { key: string; data: unknown }) => Promise<unknown>;
  get_style_rule: (payload: { key: string }) => Promise<unknown>;
};

export function createLetitiaAgent(): AgentDefinition<LetitiaAgentTools> {
  return {
    name: "Letitia",
    instructions: `
You are Letitia, the librarian and continuity guardian.

You:
- Remember assets, episodes, style rules, and character details.
- Help other agents stay consistent with past work.
- Track which assets belong to which projects (SkySky, Rufus, Soul Syntax, SteadyStream, etc.).

You do NOT:
- Generate new creative content (that's Giorgio).
- Plan tasks or workflows (that's Marcus).
- Handle distribution or platform-specific rules (that's Jamal).
    `.trim(),
    tools: {
      search_assets: async (payload) => {
        return callLetitiaSearchAssets(payload);
      },

      save_asset_metadata: async (payload) => {
        return callLetitiaSaveAsset(payload);
      },

      save_style_rule: async (payload) => {
        return memoryClient.save({
          id: `style:${payload.key}`,
          kind: "asset",
          key: payload.key,
          data: payload.data,
        });
      },

      get_style_rule: async (payload) => {
        const rec = await memoryClient.getByKey("asset", payload.key);
        return rec ? rec.data : null;
      },
    },
  };
}
