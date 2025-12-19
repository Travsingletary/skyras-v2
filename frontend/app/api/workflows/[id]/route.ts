import { NextRequest, NextResponse } from 'next/server';
import { workflowsDb, workflowTasksDb } from '@/lib/database';
import type { WorkflowUpdate } from '@/types/database';

// GET /api/workflows/[id] - Get a specific workflow with tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Get workflow
    const workflow = await workflowsDb.getById(id);

    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        },
        { status: 404 }
      );
    }

    // Get tasks
    const tasks = await workflowTasksDb.getByWorkflowId(id);

    return NextResponse.json({
      success: true,
      data: {
        workflow,
        tasks,
        stats: {
          totalTasks: workflow.total_tasks,
          completedTasks: workflow.completed_tasks,
          progress: workflow.total_tasks > 0
            ? Math.round((workflow.completed_tasks / workflow.total_tasks) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/${id} GET] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve workflow: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/[id] - Update a workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const body = await request.json();
    const { name, type, status, planMarkdown, summary, metadata } = body;

    // Build update object
    const updates: WorkflowUpdate = {};

    if (name !== undefined) updates.name = name;
    if (type !== undefined) {
      const validTypes = ['licensing', 'creative', 'distribution', 'cataloging', 'custom'];
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
      const validStatuses = ['active', 'completed', 'paused', 'cancelled'];
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
    if (planMarkdown !== undefined) updates.plan_markdown = planMarkdown;
    if (summary !== undefined) updates.summary = summary;
    if (metadata !== undefined) updates.metadata = metadata;

    // Update workflow
    const workflow = await workflowsDb.update(id, updates);

    return NextResponse.json({
      success: true,
      data: {
        workflow,
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/${id} PATCH] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update workflow: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Cancel a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Cancel workflow (soft delete)
    await workflowsDb.delete(id);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Workflow cancelled successfully',
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/${id} DELETE] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to cancel workflow: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
