import { NextRequest, NextResponse } from "next/server";

import { getSupabaseClient } from "@/backend/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") || undefined;

    const filters: Record<string, unknown> = {};
    if (project) filters.project_id = project;

    // studio_plans table does not exist - return empty result
    // TODO: Migrate to workflows table if plan data is needed
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
