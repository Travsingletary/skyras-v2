/**
 * File URL Endpoint
 *
 * GET /api/files/[id]/url - Get or refresh a file's access URL
 * Automatically handles signed URL expiration and regeneration
 */

import { NextRequest, NextResponse } from 'next/server';
import { URLService } from '@/lib/storage/URLService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'File ID is required',
        },
        { status: 400 }
      );
    }

    // Get valid URL (will regenerate if expired)
    const url = await URLService.getFileUrl(fileId);

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('[/api/files/[id]/url] Error:', error);

    const errorMessage = (error as Error).message;

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to get file URL: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
