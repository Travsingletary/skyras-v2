import { NextRequest, NextResponse } from "next/server";

import { getSupabaseClient } from "@/backend/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") || undefined;
    const status = searchParams.getAll("status");

    const filters: Record<string, unknown> = {};
    if (project) filters.project_id = project;
    if (status.length) filters.status = status;

    const response = await supabase.from("media_licensing").select(filters);
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
