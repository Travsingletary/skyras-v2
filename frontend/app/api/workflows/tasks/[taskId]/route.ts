import { NextRequest, NextResponse } from 'next/server';
import { workflowTasksDb, workflowsDb } from '@/lib/database';
import type { WorkflowTaskUpdate } from '@/types/database';

// GET /api/workflows/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  try {
    const task = await workflowTasksDb.getById(taskId);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/tasks/${taskId} GET] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve task: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/tasks/[taskId] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  try {
    const body = await request.json();
    const { title, description, status, position, dueDate, metadata } = body;

    // Get current task to check status change
    const currentTask = await workflowTasksDb.getById(taskId);
    if (!currentTask) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    // Build update object
    const updates: WorkflowTaskUpdate = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
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

      // Set completed_at if completing task
      if (status === 'completed' && currentTask.status !== 'completed') {
        updates.completed_at = new Date().toISOString();

        // Increment workflow completed_tasks count
        await workflowsDb.incrementCompletedTasks(currentTask.workflow_id);
      }
    }
    if (position !== undefined) updates.position = position;
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (metadata !== undefined) updates.metadata = metadata;

    // Update task
    const task = await workflowTasksDb.update(taskId, updates);

    return NextResponse.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/tasks/${taskId} PATCH] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update task: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/tasks/[taskId] - Skip a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  try {
    // Skip task (soft delete)
    await workflowTasksDb.delete(taskId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Task skipped successfully',
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/tasks/${taskId} DELETE] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to skip task: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
