import { AgentRunResult } from "@/agents/core/BaseAgent";

export interface PostingPlanInput {
  project: string;
  campaignName?: string;
  platforms?: string[];
  slots?: number;
  mood?: string;
  notes?: string;
}

function baseMetadata(project: string) {
  return {
    agent: "jamal",
    project,
    timestamp: new Date().toISOString(),
  };
}

function createSlots(platforms: string[], slots: number, campaign: string) {
  const now = new Date();
  return Array.from({ length: slots }).map((_, idx) => {
    const when = new Date(now.getTime() + idx * 60 * 60 * 1000).toISOString();
    const platform = platforms[idx % platforms.length];
    return {
      platform,
      time: when,
      contentType: idx % 2 === 0 ? "clip" : "story",
      note: `Campaign ${campaign} slot ${idx + 1}`,
    };
  });
}

export async function generatePostingPlan(_: unknown, input: PostingPlanInput): Promise<AgentRunResult> {
  if (!input.project) {
    throw new Error("project is required for posting plan");
  }
  const platforms = input.platforms?.length ? input.platforms : ["instagram", "tiktok"];
  const slots = input.slots ?? 3;
  const campaign = input.campaignName ?? `${input.project} Launch`;
  const plan = {
    campaignName: campaign,
    project: input.project,
    platforms,
    slots: createSlots(platforms, slots, campaign),
    mood: input.mood ?? "upbeat",
    notes: input.notes,
  };

  return {
    output: `Posting plan drafted for ${input.project} across ${platforms.join(", ")} with ${slots} slots.`,
    notes: {
      plan,
      metadata: baseMetadata(input.project),
    },
  };
}
