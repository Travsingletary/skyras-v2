import { runDailyStudioRun } from "../workflows/dailyStudioRun";

function getFlagValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function main() {
  const goal = process.argv[2] && !process.argv[2].startsWith("-")
    ? process.argv[2]
    : "Plan SkySky content for today.";
  const includeSkySky = process.argv.includes("--no-skysky") ? false : true;
  const lesson = getFlagValue("--lesson");
  const theme = getFlagValue("--theme");
  const project = getFlagValue("--project") || "SkySky";

  const result = await runDailyStudioRun({
    goal,
    includeSkySky,
    skySkyLesson: lesson,
    skySkyTheme: theme,
    project,
  });

  console.log(`Daily Studio Goal: ${result.goal} (${result.project})\n`);
  console.log("Daily Plan Tasks:");
  for (const task of result.dailyPlan.tasks) {
    console.log(`- [ ] (${task.owner}) ${task.description}`);
  }

  if (result.skySkyEpisodePlan) {
    console.log("\nSkySky Episode Beats:");
    for (const beat of result.skySkyEpisodePlan.beats) {
      console.log(`- ${beat.id}: [${beat.stage}] ${beat.name} (${beat.owner})`);
    }
  } else {
    console.log("\nSkySky episode planning skipped.");
  }
}

main().catch((err) => {
  console.error("Daily studio run failed:", err);
  process.exit(1);
});
