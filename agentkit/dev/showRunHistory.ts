import { getRunHistory } from "../memory/memoryClient";

async function main() {
  const workflow = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : undefined;
  const projectFlagIndex = process.argv.indexOf("--project");
  const project = projectFlagIndex !== -1 ? process.argv[projectFlagIndex + 1] : undefined;
  const runs = await getRunHistory(workflow, project);

  if (runs.length === 0) {
    console.log("No run history found.");
    return;
  }

  for (const run of runs) {
    console.log(`Workflow: ${run.workflow}`);
    console.log(`Status:   ${run.status}`);
    console.log(`Started:  ${run.startedAt}`);
    console.log(`Finished: ${run.finishedAt}`);
    if (run.errorMessage) {
      console.log(`Error:    ${run.errorMessage}`);
    }
    console.log("---");
  }
}

main().catch((err) => {
  console.error("Failed to show run history:", err);
  process.exit(1);
});
