import { NextRequest, NextResponse } from "next/server";
import { runSchedulerOnce } from "@/services/jamalScheduler";

/**
 * API endpoint to manually trigger the scheduled posts processor
 * GET /api/jamal/scheduler
 */
export async function GET(request: NextRequest) {
  try {
    await runSchedulerOnce();

    return NextResponse.json({
      success: true,
      message: "Scheduler run completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scheduler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








