export interface PostingSlot {
  platform: string;
  time: string;
  contentType: string;
  note?: string;
}

export interface PostingPlan {
  campaignName: string;
  project?: string;
  slots: PostingSlot[];
}

// TODO: Replace with a real Socialite / platform scheduler integration once ready.
export async function createPostingPlan(payload: {
  platforms: string[];
  campaignName: string;
  slots: number;
  project?: string;
}): Promise<PostingPlan> {
  const now = new Date();
  const slots = payload.platforms.map((platform, idx) => ({
    platform,
    time: new Date(now.getTime() + idx * 60 * 60 * 1000).toISOString(),
    contentType: idx % 2 === 0 ? "clip" : "story",
    note: `Slot ${idx + 1} for ${payload.campaignName}`,
  }));

  return {
    campaignName: payload.campaignName,
    project: payload.project,
    slots: slots.slice(0, payload.slots),
  };
}
