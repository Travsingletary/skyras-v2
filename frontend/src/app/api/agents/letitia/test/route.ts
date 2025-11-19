import { NextResponse } from "next/server";

import { createLetitiaAgent } from "@/agents/letitia";

export async function GET() {
  const letitia = createLetitiaAgent();
  await letitia.run({
    prompt: "System ping",
    metadata: { action: "saveAssetMetadata", payload: { project: "SkySky", name: "ping-note", tags: ["test"], metadata: { ok: true } } },
  });
  return NextResponse.json({ status: "ok", sample: "Letitia online" });
}
