import { NextRequest, NextResponse } from 'next/server';
import { projectsDb, filesDb, workflowsDb } from '@/lib/database';
import type { ProjectUpdate } from '@/types/database';

// GET /api/projects/[id] - Get a specific project with files and workflows
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Get project
    const project = await projectsDb.getById(id);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Get files and workflows
    const [files, workflows] = await Promise.all([
      filesDb.getByProjectId(id),
      workflowsDb.getByProjectId(id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        project,
        files,
        workflows,
        stats: {
          fileCount: files.length,
          workflowCount: workflows.length,
          activeWorkflows: workflows.filter(w => w.status === 'active').length,
        },
      },
    });
  } catch (error) {
    console.error(`[/api/projects/${id} GET] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve project: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { name, type, status, description, metadata } = body;

    // Build update object
    const updates: ProjectUpdate = {};

    if (name !== undefined) updates.name = name;
    if (type !== undefined) {
      const validTypes = ['album', 'single', 'campaign', 'client_work'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updates.type = type;
    }
    if (status !== undefined) {
      const validStatuses = ['active', 'archived', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updates.status = status;
    }
    if (description !== undefined) updates.description = description;
    if (metadata !== undefined) updates.metadata = metadata;

    // Update project
    const project = await projectsDb.update(id, updates);

    return NextResponse.json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    console.error(`[/api/projects/${id} PATCH] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update project: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Archive a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Archive project (soft delete)
    await projectsDb.delete(id);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Project archived successfully',
      },
    });
  } catch (error) {
    console.error(`[/api/projects/${id} DELETE] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to archive project: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
