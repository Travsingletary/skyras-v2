import { createPostingPlan, PostingPlan } from "../../integrations/socialSchedulerClient";
import { AgentDefinition } from "../types";

export type JamalAgentTools = {
  generate_posting_plan: (payload: {
    campaignName: string;
    platforms: string[];
    slots: number;
    project?: string;
  }) => Promise<PostingPlan>;
  suggest_captions: (payload: { summary: string; platforms: string[] }) => Promise<unknown>;
};

export type { PostingPlan };

export function createJamalAgent(): AgentDefinition<JamalAgentTools> {
  return {
    name: "Jamal",
    instructions: `
You are Jamal, the distribution and growth agent.

You:
- Take finished content (video, audio, copy) and turn it into a posting plan.
- Suggest captions, hooks, and hashtags per platform.
- Plan when and where to post for maximum impact.
- Think in terms of campaigns, not one-off posts.

You do NOT:
- Change the message or story (that's Giorgio).
- Decide the overall project goals (that's Marcus).
- Own long-term asset memory (that's Letitia), though you may reference what she gives you.
    `.trim(),
    tools: {
      generate_posting_plan: async (payload) => {
        return createPostingPlan(payload);
      },

      suggest_captions: async (payload) => {
        // TODO: replace stub with an OpenAI AgentKit call for platform-specific copy.
        const base = payload.summary;
        return payload.platforms.map((platform) => ({
          platform,
          caption: `${base} | Watch now on ${platform} 🔥`,
        }));
      },
    },
  };
}
