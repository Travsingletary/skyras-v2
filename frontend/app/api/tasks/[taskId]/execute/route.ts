import { NextRequest, NextResponse } from 'next/server';
import { workflowTasksDb, filesDb } from '@/lib/database';
import { processTask, simulateTaskProcessing, type AgentName } from '@/lib/agentProcessor';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const body = await request.json();
    const { simulate = true } = body; // Default to simulation mode

    // Get task details
    const task = await workflowTasksDb.getById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if task is already completed
    if (task.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Task already completed',
        data: { task },
      });
    }

    // Mark task as in_progress
    await workflowTasksDb.update(taskId, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    // Get file metadata if task references a file
    let fileMetadata;
    if (task.metadata?.fileId) {
      const file = await filesDb.getById(task.metadata.fileId);
      if (file) {
        fileMetadata = {
          fileName: file.original_name,
          fileType: file.file_type,
          fileUrl: file.public_url,
          fileSize: file.file_size,
        };
      }
    }

    // Process the task
    const taskContext = {
      taskId: task.id,
      workflowId: task.workflow_id,
      title: task.title,
      description: task.description,
      agentName: task.agent_name as AgentName,
      fileMetadata,
    };

    const result = simulate
      ? await simulateTaskProcessing(taskContext)
      : await processTask(taskContext);

    // Update task with results
    if (result.success) {
      await workflowTasksDb.update(taskId, {
        status: 'completed',
        results: result.results,
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          task: await workflowTasksDb.getById(taskId),
          results: result.results,
        },
      });
    } else {
      await workflowTasksDb.update(taskId, {
        status: 'failed',
        error_message: result.error || 'Task processing failed',
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Task processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[/api/tasks/[taskId]/execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Task execution failed: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
