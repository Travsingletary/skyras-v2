import { memoryClient } from "../../memory/memoryClient";
import {
  callGiorgioScriptEndpoint,
  callLetitiaSaveAsset,
  callLetitiaSearchAssets,
} from "../../integrations/fastapiClients";
import { openai } from "../../openaiClient";
import { AgentDefinition } from "../types";

export type MarcusAgentTools = {
  plan_day: (payload: {
    goal: string;
    context?: string;
  }) => Promise<{ goal: string; tasks: Array<{ id: string; description: string; owner: string; tool?: string; params?: Record<string, unknown> }> }>;
  request_script_from_giorgio: (payload: {
    brief: string;
    format: "script" | "social" | "podcast" | "video";
    character?: string;
  }) => Promise<unknown>;
  query_assets_from_letitia: (payload: { query: string; tags?: string[] }) => Promise<unknown>;
  save_asset_via_letitia: (payload: {
    id?: string;
    type: string;
    tags: string[];
    metadata: Record<string, unknown>;
  }) => Promise<unknown>;
};

export function createMarcusAgent(): AgentDefinition<MarcusAgentTools> {
  return {
    name: "Marcus",
    instructions: `
You are Marcus, the orchestrator for SkyRas Agency.

Your job:
- Turn Trav's goals into concrete, small tasks.
- Delegate creative work to Giorgio (never do writing or prompts yourself).
- Ask Letitia for context, assets, and style rules.
- Queue Jamal for distribution planning once a piece is ready.

Rules:
- Think like a project manager, not an artist.
- Every plan should be realistic, small, and tied to a clear outcome.
- Prefer 1–3 high-impact tasks over long chaotic lists.
    `.trim(),
    tools: {
      plan_day: async ({ goal, context }) => {
        let tasks: Array<{ id: string; description: string; owner: string; tool?: string; params?: Record<string, unknown> }> = [];
        try {
          tasks = await planWithOpenAI(goal, context);
        } catch (err) {
          if (err instanceof Error && err.message.includes("OPENAI_API_KEY")) {
            throw err;
          }
          console.warn("Marcus planner falling back to defaults:", err);
          tasks = buildFallbackTasks(goal);
        }

        await memoryClient.save({
          id: `plan:${Date.now()}`,
          kind: "plan",
          key: `daily:${new Date().toISOString().slice(0, 10)}`,
          data: { goal, context, tasks },
        });

        return { goal, tasks };
      },

      request_script_from_giorgio: async (payload) => {
        return callGiorgioScriptEndpoint(payload);
      },

      query_assets_from_letitia: async (payload) => {
        return callLetitiaSearchAssets(payload);
      },

      save_asset_via_letitia: async (payload) => {
        return callLetitiaSaveAsset(payload);
      },
    },
  };
}

const OWNER_TOOL_MAP: Record<string, { tool: string; defaultParams: Record<string, unknown> }> = {
  Giorgio: { tool: "generate_script", defaultParams: { format: "script" } },
  Letitia: { tool: "save_asset_metadata", defaultParams: { type: "plan", tags: ["daily-growth"] } },
  Jamal: { tool: "generate_posting_plan", defaultParams: { platforms: ["instagram", "tiktok"], slots: 3 } },
};

function buildFallbackTasks(goal: string) {
  const base: Array<{
    id: string;
    description: string;
    owner: string;
    tool: string;
    params: Record<string, unknown>;
  }> = [
    {
      id: "giorgio-script",
      description: `Ask Giorgio to generate a script for: "${goal}"`,
      owner: "Giorgio",
      tool: "generate_script",
      params: { format: "script", brief: goal },
    },
    {
      id: "letitia-catalog",
      description: `Have Letitia catalog new assets related to: "${goal}"`,
      owner: "Letitia",
      tool: "save_asset_metadata",
      params: { type: "plan", tags: ["daily-growth", goal], metadata: { goal } },
    },
    {
      id: "jamal-plan",
      description: `Have Jamal sketch a posting plan if content is created for: "${goal}"`,
      owner: "Jamal",
      tool: "generate_posting_plan",
      params: { campaignName: goal, platforms: ["instagram", "tiktok"], slots: 3 },
    },
  ];

  if (goal.toLowerCase().includes("skysky")) {
    base.push({
      id: "skysky-episode",
      description: `Plan and script a SkySky episode around: "${goal}"`,
      owner: "Giorgio",
      tool: "generate_script",
      params: { format: "script", brief: `SkySky episode around goal: ${goal}`, character: "SkySky" },
    });
  }

  return base;
}

const plannerModel = process.env.OPENAI_PLANNER_MODEL || "gpt-4o-mini";

async function planWithOpenAI(goal: string, context?: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const completion = await openai.chat.completions.create({
    model: plannerModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are Marcus, an operations lead. Produce JSON matching {\"tasks\":[{id,description,owner,tool,params}]}. Owners must be Giorgio, Letitia, or Jamal. Choose the correct tool (generate_script, save_asset_metadata, generate_posting_plan) and include params for that tool.",
      },
      {
        role: "user",
        content: `Goal: ${goal}\nContext: ${context || "n/a"}\nReturn 2-4 tasks in the JSON format.`,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Planner returned no content");
  }

  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.tasks)) {
    throw new Error("Planner response missing tasks array");
  }

  return parsed.tasks.map((task: any, index: number) => {
    const owner = typeof task.owner === "string" && OWNER_TOOL_MAP[task.owner] ? task.owner : "Giorgio";
    const mapping = OWNER_TOOL_MAP[owner];
    const params = { ...mapping.defaultParams, ...(task.params || {}) } as Record<string, unknown>;
    if (mapping.tool === "generate_posting_plan" && !params.campaignName) {
      params.campaignName = goal;
    }
    if (mapping.tool === "generate_script" && !params.brief) {
      params.brief = goal;
    }
    return {
      id: task.id || `auto-${index + 1}`,
      description: task.description || `Follow up on goal: ${goal}`,
      owner,
      tool: task.tool || mapping.tool,
      params,
    };
  });
}
