import { NextResponse } from "next/server";

import { createJamalAgent } from "@/agents/jamal";

export async function GET() {
  const jamal = createJamalAgent();
  await jamal.run({
    prompt: "System ping",
    metadata: { action: "generatePostingPlan", payload: { project: "SkySky", campaignName: "Ping" } },
  });
  return NextResponse.json({ status: "ok", sample: "Jamal online" });
}
