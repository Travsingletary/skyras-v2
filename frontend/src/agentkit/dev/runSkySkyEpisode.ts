import { generateSkySkyEpisodeScript } from "../workflows/skySkyEpisode";

async function main() {
  const lesson = process.argv[2] || "telling the truth";
  const theme = process.argv[3];
  const result = await generateSkySkyEpisodeScript({ lesson, theme, ageRange: "5-7" });

  console.log("SkySky Episode Plan:\n");
  for (const beat of result.plan.beats) {
    console.log(`- ${beat.id}: [${beat.stage}] ${beat.name} (owner: ${beat.owner})\n  ${beat.description}`);
  }

  console.log("\nGenerated Script:\n");
  console.log(result.script);
}

main().catch((err) => {
  console.error("SkySky episode run failed:", err);
  process.exit(1);
});
