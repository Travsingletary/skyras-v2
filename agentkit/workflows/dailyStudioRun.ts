import { DailyGrowthResult, runDailyGrowthLoop } from "./dailyGrowthLoop";
import {
  SkySkyEpisodeInput,
  SkySkyEpisodePlan,
  planSkySkyEpisode,
} from "./skySkyEpisode";
import { memoryClient, saveRunHistory } from "../memory/memoryClient";

export interface DailyStudioRunInput {
  goal: string;
  includeSkySky?: boolean;
  skySkyLesson?: string;
  skySkyTheme?: string;
  project?: string;
}

export interface DailyStudioRunResult {
  goal: string;
  project: string;
  dailyPlan: DailyGrowthResult;
  skySkyEpisodePlan?: SkySkyEpisodePlan;
}

export async function runDailyStudioRun(
  input: DailyStudioRunInput,
): Promise<DailyStudioRunResult> {
  try {
    const project = input.project || "SkySky";
    const dailyPlan = await runDailyGrowthLoop(input.goal, { project });

    let skySkyEpisodePlan: SkySkyEpisodePlan | undefined;
    const shouldRunSkySky = input.includeSkySky !== false;

    if (shouldRunSkySky) {
      const episodeInput: SkySkyEpisodeInput = {
        lesson: input.skySkyLesson ?? "sharing",
        theme: input.skySkyTheme ?? "friendship",
        ageRange: "5-7",
      };
      skySkyEpisodePlan = await planSkySkyEpisode(episodeInput);
    }

    const result: DailyStudioRunResult = {
      goal: input.goal,
      project,
      dailyPlan,
      skySkyEpisodePlan,
    };

    const todayKey = new Date().toISOString().slice(0, 10);
    await memoryClient.save({
      id: `daily-studio:${todayKey}`,
      kind: "plan",
      key: `daily-studio:${todayKey}`,
      data: result,
    });

    await saveRunHistory({
      workflow: "dailyStudioRun",
      project,
      input,
      output: result,
      status: "success",
    });

    return result;
  } catch (err) {
    await saveRunHistory({
      workflow: "dailyStudioRun",
      project: input.project || "SkySky",
      input,
      output: null,
      status: "error",
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
