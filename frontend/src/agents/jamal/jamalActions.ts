import { AgentRunResult } from "@/agents/core/BaseAgent";

/**
 * IMPORTANT LIMITATION: Jamal's publishing system is NOT FUNCTIONAL
 *
 * This module creates posting plans and drafts but DOES NOT actually publish
 * to any social media platforms. All platform API integrations (Instagram,
 * TikTok, LinkedIn, Twitter, Facebook, YouTube) are NOT implemented.
 *
 * Current capabilities:
 * - ✅ Generate posting plans with schedules
 * - ✅ Create content drafts
 * - ❌ Actual posting to platforms (NOT IMPLEMENTED)
 * - ❌ Platform API integrations (NOT IMPLEMENTED)
 *
 * See docs/AGENT_CAPABILITIES.md for details.
 */

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
    output: `Posting plan drafted for ${input.project} across ${platforms.join(", ")} with ${slots} slots.\n\n⚠️ NOTE: This is a draft plan only. Actual publishing to social media platforms is not yet implemented.`,
    notes: {
      plan,
      metadata: baseMetadata(input.project),
      warning: "Platform publishing APIs not implemented - this is a planning tool only",
    },
  };
}
