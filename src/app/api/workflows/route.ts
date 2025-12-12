import { NextRequest, NextResponse } from 'next/server';
import { workflowsDb, workflowTasksDb } from '@/lib/database';
import type { WorkflowInsert, WorkflowTaskInsert } from '@/types/database';

// GET /api/workflows - List workflows for a user or project
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
    let workflows;

    if (projectId) {
      workflows = await workflowsDb.getByProjectId(projectId);
    } else if (userId) {
      workflows = await workflowsDb.getByUserId(userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        workflows: workflows || [],
        count: workflows?.length || 0,
      },
    });
  } catch (error) {
    console.error('[/api/workflows GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve workflows: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a new workflow with tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      projectId,
      name,
      type,
      planMarkdown,
      summary,
      agentName,
      tasks,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required',
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'name is required',
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'type is required (licensing, creative, distribution, cataloging, custom)',
        },
        { status: 400 }
      );
    }

    // Validate type
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

    // Create workflow
    const workflowData: WorkflowInsert = {
      user_id: userId,
      project_id: projectId || undefined,
      name,
      type,
      status: 'active',
      plan_markdown: planMarkdown || undefined,
      summary: summary || undefined,
      agent_name: agentName || 'marcus',
      total_tasks: tasks?.length || 0,
      completed_tasks: 0,
      metadata: {},
    };

    const workflow = await workflowsDb.create(workflowData);

    // Create tasks if provided
    let createdTasks = [];
    if (tasks && tasks.length > 0) {
      const taskData: WorkflowTaskInsert[] = tasks.map((task: any, index: number) => ({
        workflow_id: workflow.id,
        title: task.title,
        description: task.description || undefined,
        status: 'pending',
        position: task.position !== undefined ? task.position : index,
        due_date: task.dueDate || undefined,
        metadata: task.metadata || {},
      }));

      createdTasks = await workflowTasksDb.createMany(taskData);
    }

    return NextResponse.json({
      success: true,
      data: {
        workflow,
        tasks: createdTasks,
      },
    });
  } catch (error) {
    console.error('[/api/workflows POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create workflow: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
