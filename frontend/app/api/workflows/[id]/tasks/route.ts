import { NextRequest, NextResponse } from 'next/server';
import { workflowTasksDb, workflowsDb } from '@/lib/database';
import type { WorkflowTaskInsert, WorkflowTaskUpdate } from '@/types/database';

// GET /api/workflows/[id]/tasks - Get all tasks for a workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const tasks = await workflowTasksDb.getByWorkflowId(id);

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        count: tasks.length,
        stats: {
          pending: tasks.filter(t => t.status === 'pending').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          skipped: tasks.filter(t => t.status === 'skipped').length,
        },
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/${id}/tasks GET] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve tasks: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// POST /api/workflows/[id]/tasks - Create a new task in workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: workflowId } = params;

  try {
    const body = await request.json();
    const { title, description, position, dueDate, metadata } = body;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: 'title is required',
        },
        { status: 400 }
      );
    }

    // Create task
    const taskData: WorkflowTaskInsert = {
      workflow_id: workflowId,
      title,
      description: description || undefined,
      status: 'pending',
      position: position !== undefined ? position : 0,
      due_date: dueDate || undefined,
      metadata: metadata || {},
    };

    const task = await workflowTasksDb.create(taskData);

    // Update workflow total_tasks count
    const workflow = await workflowsDb.getById(workflowId);
    if (workflow) {
      await workflowsDb.update(workflowId, {
        total_tasks: workflow.total_tasks + 1,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    console.error(`[/api/workflows/${workflowId}/tasks POST] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create task: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
