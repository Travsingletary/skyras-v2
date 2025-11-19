import { NextRequest, NextResponse } from "next/server";

import { createMarcusAgent } from "@/agents/marcus";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const agent = (payload?.agent as string | undefined) ?? "marcus";
  const message = (payload?.message as string | undefined) ?? "";

  if (agent !== "marcus") {
    return NextResponse.json({ error: "Unsupported agent" }, { status: 400 });
  }

  try {
    const marcus = createMarcusAgent();
    const result = await marcus.run({ prompt: message, metadata: payload?.metadata });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
