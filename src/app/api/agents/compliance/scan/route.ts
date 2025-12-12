import { NextRequest, NextResponse } from "next/server";

import { createComplianceAgent } from "@/agents/compliance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = body?.projectId;
    const files = body?.files;
    if (!projectId || !Array.isArray(files)) {
      return NextResponse.json({ success: false, error: "projectId and files[] are required" }, { status: 400 });
    }

    const compliance = createComplianceAgent();
    const result = await compliance.run({
      prompt: `Licensing scan for project ${projectId}`,
      metadata: { action: "scanFilesForLicensing", payload: { projectId, files } },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
