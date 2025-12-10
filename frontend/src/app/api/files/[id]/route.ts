import { NextRequest, NextResponse } from 'next/server';
import { filesDb, fileProcessingDb } from '@/lib/database';
import type { FileUpdate } from '@/types/database';

// GET /api/files/[id] - Get a specific file with processing results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Get file
    const file = await filesDb.getById(id);

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      );
    }

    // Get processing results
    const processing = await fileProcessingDb.getByFileId(id);

    return NextResponse.json({
      success: true,
      data: {
        file,
        processing,
        stats: {
          processingCount: processing.length,
          completedProcessing: processing.filter(p => p.status === 'completed').length,
          failedProcessing: processing.filter(p => p.status === 'failed').length,
        },
      },
    });
  } catch (error) {
    console.error(`[/api/files/${id} GET] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve file: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/files/[id] - Update file metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { projectId, processingStatus, processingResults, metadata } = body;

    // Build update object
    const updates: FileUpdate = {};

    if (projectId !== undefined) updates.project_id = projectId;
    if (processingStatus !== undefined) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(processingStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid processingStatus. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updates.processing_status = processingStatus;
    }
    if (processingResults !== undefined) updates.processing_results = processingResults;
    if (metadata !== undefined) updates.metadata = metadata;

    // Update file
    const file = await filesDb.update(id, updates);

    return NextResponse.json({
      success: true,
      data: {
        file,
      },
    });
  } catch (error) {
    console.error(`[/api/files/${id} PATCH] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update file: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/files/[id] - Mark file as deleted
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Mark file as failed/deleted (soft delete)
    await filesDb.delete(id);

    return NextResponse.json({
      success: true,
      data: {
        message: 'File marked as deleted successfully',
      },
    });
  } catch (error) {
    console.error(`[/api/files/${id} DELETE] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete file: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
