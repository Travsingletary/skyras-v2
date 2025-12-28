import { NextRequest, NextResponse } from "next/server";

import { getSupabaseClient } from "@/backend/supabaseClient";
import { getAuthenticatedUserId, logAuthIdentity } from "@/lib/auth";
import type { Workflow } from "@/types/database";

/**
 * GET /api/data/plans
 * 
 * Returns plan data from the workflows table, filtered by authenticated user.
 * 
 * Query parameters:
 * - project: Filter by project_id (optional)
 * 
 * Note: User identity is derived server-side from auth session (no userId parameter).
 * The studio_plans table does not exist. This endpoint uses the workflows table
 * which contains plan data in the plan_markdown field.
 */
export async function GET(request: NextRequest) {
  try {
    // Derive user identity from auth session (server-side only)
    const userId = await getAuthenticatedUserId();
    logAuthIdentity('/api/data/plans', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") || undefined;

    // Build filters for Supabase query (always filter by authenticated user)
    const filters: Record<string, unknown> = {
      user_id: userId,
    };

    // Query workflows table filtered by authenticated user
    const { data, error } = await supabase.from("workflows").select(filters);

    if (error) {
      console.error("[GET /api/data/plans] Database error:", error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Filter by project_id if provided (client-side filtering)
    let workflows = (data as Workflow[]) || [];
    const initialCount = workflows.length;
    
    if (project) {
      workflows = workflows.filter((w) => w.project_id === project);
    }

    // Sort by created_at descending
    workflows.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });

    // Server-side logging (sanity check - no markdown content, no sensitive data)
    const returnedCount = workflows.length;
    const projectFilterApplied = !!project;
    console.log(
      `[GET /api/data/plans] Returned ${returnedCount} plan(s) for authenticated user, ` +
      `project filter: ${projectFilterApplied ? `applied (${project})` : 'none'}`
    );

    // Transform workflows to plan format
    const plans = workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      type: workflow.type,
      status: workflow.status,
      plan: workflow.plan_markdown,
      summary: workflow.summary,
      user_id: workflow.user_id,
      project_id: workflow.project_id,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      agent_name: workflow.agent_name,
      total_tasks: workflow.total_tasks,
      completed_tasks: workflow.completed_tasks,
    }));

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("[GET /api/data/plans] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
