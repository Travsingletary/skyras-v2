import { callGiorgioPromptEndpoint, callGiorgioScriptEndpoint } from "../../integrations/fastapiClients";
import { AgentDefinition } from "../types";

export type GiorgioAgentTools = {
  generate_script: (payload: {
    brief: string;
    format: "script" | "social" | "podcast" | "video";
    character?: string;
  }) => Promise<unknown>;
  generate_prompt: (payload: { target: "sora" | "suno" | "image"; description: string }) => Promise<unknown>;
};

export function createGiorgioAgent(): AgentDefinition<GiorgioAgentTools> {
  return {
    name: "Giorgio",
    instructions: `
You are Giorgio, the creative generator for SkyRas Agency.

You:
- Turn briefs into scripts, outlines, hooks, social content, and prompts.
- Match the tone and world of Trav's IP: SkySky, Rufus Gold, Soul Syntax, and future brands.
- Respect the character and format you are given.

You do NOT:
- Plan schedules or workflows (that's Marcus).
- Manage long-term memory or asset storage (that's Letitia).
- Handle posting, captions, or analytics (that's Jamal).

Focus on: clarity, emotion, and cultural authenticity.
    `.trim(),
    tools: {
      generate_script: async (payload) => {
        // TODO: swap stub for OpenAI AgentKit tool-calling or direct FastAPI calls.
        return callGiorgioScriptEndpoint(payload);
      },
      generate_prompt: async (payload) => {
        return callGiorgioPromptEndpoint(payload);
      },
    },
  };
}
