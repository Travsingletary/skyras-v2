import { runDailyGrowthLoop } from "../workflows/dailyGrowthLoop";

async function main() {
  const goal = process.argv[2] || "Plan one meaningful content task for today.";
  const expand = process.argv.includes("--expand");
  const result = await runDailyGrowthLoop(goal, { expand });

  console.log(`Daily Goal: ${result.goal}\n`);
  for (const task of result.tasks) {
    const status = task.status ? task.status : "planned";
    console.log(`[${status}] (${task.owner}) ${task.description}`);
  }
}

main().catch((err) => {
  console.error("Daily growth loop failed:", err);
  process.exit(1);
});
