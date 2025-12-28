import { NextRequest, NextResponse } from "next/server";
import { runSchedulerOnce } from "@/services/socialPostScheduler";

/**
 * API endpoint to manually trigger the social post scheduler
 * Can be called by cron jobs or manually
 * 
 * GET /api/social-posts/scheduler?batchSize=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const batchSize = parseInt(searchParams.get("batchSize") || "10", 10);

    await runSchedulerOnce(batchSize);

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









