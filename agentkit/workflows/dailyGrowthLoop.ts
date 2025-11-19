/**
 * Daily growth loop workflow stub. AgentKit orchestration will load this to decide
 * how Marcus, Giorgio, Letitia, and Jamal coordinate each day.
 */
import { createMarcusAgent } from "../agents/marcus/marcusAgent";
import { createGiorgioAgent } from "../agents/giorgio/giorgioAgent";
import { createLetitiaAgent } from "../agents/letitia/letitiaAgent";
import { createJamalAgent } from "../agents/jamal/jamalAgent";
import { saveRunHistory } from "../memory/memoryClient";

export interface GrowthLoopStep {
  name: string;
  description: string;
  owner: "marcus" | "giorgio" | "letitia" | "jamal";
  tool: string;
}

export interface DailyGrowthLoopWorkflow {
  id: string;
  summary: string;
  steps: GrowthLoopStep[];
}

export interface DailyGrowthTask {
  id: string;
  description: string;
  owner: string;
  status?: "planned" | "in_progress" | "completed" | "failed";
  tool?: string;
  params?: Record<string, unknown>;
}

export interface DailyGrowthResult {
  goal: string;
  tasks: DailyGrowthTask[];
}

export interface DailyGrowthOptions {
  expand?: boolean;
  project?: string;
}

export const dailyGrowthLoop: DailyGrowthLoopWorkflow = {
  id: "daily_growth_loop_v1",
  summary: "Stub describing how agents collaborate during daily planning/execution.",
  steps: [
    {
      name: "plan_day",
      description: "Marcus gathers goals and drafts 1-3 high-impact tasks.",
      owner: "marcus",
      tool: "plan_day",
    },
    {
      name: "create_assets",
      description: "Giorgio produces core creative outputs based on Marcus's plan.",
      owner: "giorgio",
      tool: "generate_script",
    },
    {
      name: "catalog_assets",
      description: "Letitia tags and stores new assets plus updates style rules.",
      owner: "letitia",
      tool: "save_asset_metadata",
    },
    {
      name: "prepare_distribution",
      description: "Jamal schedules content drops and crafts platform-specific copy.",
      owner: "jamal",
      tool: "generate_posting_plan",
    },
  ],
};

/**
 * Minimal daily loop executor that wires the four agents together.
 * This intentionally keeps logic simple—later we can swap in full AgentKit planners.
 */
export async function runDailyGrowthLoop(
  goal: string,
  options: DailyGrowthOptions = {},
): Promise<DailyGrowthResult> {
  const project = options.project || "SkySky";
  const inputPayload = { goal, options };

  try {
    const marcus = createMarcusAgent();
    const result = await marcus.tools.plan_day({ goal });
    const tasks: DailyGrowthTask[] = Array.isArray((result as any).tasks)
      ? (result as any).tasks
      : [];

    if (options.expand) {
      const giorgio = createGiorgioAgent();
      const letitia = createLetitiaAgent();
      const jamal = createJamalAgent();

      for (const task of tasks) {
        if (!task.tool) {
          task.status = "planned";
          continue;
        }

        try {
          switch (task.tool) {
            case "generate_script":
              await giorgio.tools.generate_script({
                brief: String(task.params?.brief ?? task.description),
                format: (task.params?.format as "script" | "social" | "podcast" | "video") || "script",
                character: task.params?.character as string | undefined,
              });
              task.status = "completed";
              break;
            case "save_asset_metadata":
              await letitia.tools.save_asset_metadata({
                type: String(task.params?.type ?? "note"),
                tags: (task.params?.tags as string[]) || ["daily-loop"],
                metadata: (task.params?.metadata as Record<string, unknown>) || {
                  description: task.description,
                },
              });
              task.status = "completed";
              break;
            case "generate_posting_plan":
              await jamal.tools.generate_posting_plan({
                campaignName: String(task.params?.campaignName ?? goal),
                platforms: (task.params?.platforms as string[]) || ["instagram", "youtube"],
                slots: Number(task.params?.slots ?? 2),
              });
              task.status = "completed";
              break;
            default:
              task.status = "planned";
              break;
          }
        } catch (err) {
          console.warn(`Expanded run failed for task ${task.id}:`, err);
          task.status = "failed";
        }
      }
    }

    const output: DailyGrowthResult = { goal, tasks };
    await saveRunHistory({
      workflow: "dailyGrowthLoop",
      project,
      input: inputPayload,
      output,
      status: "success",
    });
    return output;
  } catch (err) {
    await saveRunHistory({
      workflow: "dailyGrowthLoop",
      project,
      input: inputPayload,
      output: null,
      status: "error",
      errorMessage: (err as Error).message,
    });
    throw err;
  }
}
