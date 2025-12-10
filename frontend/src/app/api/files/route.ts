import { NextRequest, NextResponse } from 'next/server';
import { filesDb } from '@/lib/database';

// GET /api/files - List files for a user or project
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');

  if (!userId && !projectId) {
    return NextResponse.json(
      {
        success: false,
        error: 'userId or projectId parameter is required',
      },
      { status: 400 }
    );
  }

  try {
    let files;

    if (projectId) {
      files = await filesDb.getByProjectId(projectId);
    } else if (userId) {
      files = await filesDb.getByUserId(userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        files: files || [],
        count: files?.length || 0,
      },
    });
  } catch (error) {
    console.error('[/api/files GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve files: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
