import { NextResponse } from "next/server";

import { createMarcusAgent } from "@/agents/marcus";

export async function GET() {
  const marcus = createMarcusAgent();
  await marcus.run({ prompt: "System check" });
  return NextResponse.json({ status: "ok", message: "Marcus online" });
}
