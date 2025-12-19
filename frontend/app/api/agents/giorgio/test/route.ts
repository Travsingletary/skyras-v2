import { NextResponse } from "next/server";

import { createGiorgioAgent } from "@/agents/giorgio";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const giorgio = createGiorgioAgent();
  await giorgio.run({
    prompt: "System ping",
    metadata: { action: "generateScriptOutline", payload: { project: "SkySky", context: "Heartbeat" } },
  });
  return NextResponse.json({ status: "ok", sample: "Giorgio online" });
}
