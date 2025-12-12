import { NextRequest, NextResponse } from "next/server";

import { getSupabaseClient } from "@/backend/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") || undefined;
    const tags = searchParams.getAll("tag");

    const filters: Record<string, unknown> = {};
    if (project) filters.project_id = project;
    if (tags.length) filters.tags = tags;

    const response = await supabase.from("assets").select(filters);
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
