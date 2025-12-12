import { NextResponse } from "next/server";

import { createMarcusAgent } from "@/agents/marcus";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const marcus = createMarcusAgent();
  await marcus.run({ prompt: "System check" });
  return NextResponse.json({ status: "ok", message: "Marcus online" });
}
