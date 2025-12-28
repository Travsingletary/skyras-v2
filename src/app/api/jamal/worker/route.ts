import { NextRequest, NextResponse } from "next/server";
import { runWorkerOnce } from "@/services/jamalWorker";

/**
 * API endpoint to manually trigger the Jamal worker
 * GET /api/jamal/worker?batchSize=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const batchSize = parseInt(searchParams.get("batchSize") || "10", 10);

    await runWorkerOnce(batchSize);

    return NextResponse.json({
      success: true,
      message: "Worker run completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Worker error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








