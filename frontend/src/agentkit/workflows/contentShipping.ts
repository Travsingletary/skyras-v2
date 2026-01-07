import { createJamalAgent, PostingPlan } from "../agents/jamal/jamalAgent";
import { DailyStudioRunResult } from "./dailyStudioRun";
import { saveRunHistory } from "../memory/memoryClient";

export interface ContentShippingInput {
  studioRun: DailyStudioRunResult;
  project?: string;
  platforms?: string[];
  slots?: number;
}

export interface ContentShippingResult {
  project: string;
  postingPlan: PostingPlan;
}

export async function generateContentShippingPlan(
  input: ContentShippingInput,
): Promise<ContentShippingResult> {
  const project = input.project || input.studioRun.project || "SkySky";
  const platforms = input.platforms || ["instagram", "tiktok"];
  const slots = input.slots ?? 3;
  const payload = { ...input, project, platforms, slots };

  try {
    const jamal = createJamalAgent();
    const postingPlan = await jamal.tools.generate_posting_plan({
      campaignName: input.studioRun.goal,
      platforms,
      slots,
      project,
    });

    const result: ContentShippingResult = {
      project,
      postingPlan,
    };

    await saveRunHistory({
      workflow: "contentShipping",
      project,
      input: payload,
      output: result,
      status: "success",
    });

    return result;
  } catch (err) {
    await saveRunHistory({
      workflow: "contentShipping",
      project,
      input: payload,
      output: null,
      status: "error",
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
