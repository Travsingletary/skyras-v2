import { NextRequest, NextResponse } from 'next/server';
import { workflowsDb, workflowTasksDb, filesDb } from '@/lib/database';
import { processTask, simulateTaskProcessing, type AgentName } from '@/lib/agentProcessor';
import { getReadyTasks } from '@/lib/taskDependencies';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: workflowId } = params;
    const body = await request.json();
    const { simulate = true } = body;

    // Get workflow
    const workflow = await workflowsDb.getById(workflowId);
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Get ready tasks (dependencies satisfied)
    const readyTasks = await getReadyTasks(workflowId);

    if (readyTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No ready tasks to execute (may be waiting on dependencies)',
        data: { executedCount: 0 },
      });
    }

    // Execute tasks sequentially (dependencies already satisfied)
    const results = [];
    for (const task of readyTasks) {
      // Mark as in_progress
      await workflowTasksDb.update(task.id, {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });

      // Get file metadata if needed
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

      // Get agent_name from task (column or metadata)
      const agentName = (task as any).agent_name || 
                       (task.metadata as any)?.agent_name || 
                       workflow.agent_name as AgentName;

      // Process task
      const taskContext = {
        taskId: task.id,
        workflowId: task.workflow_id,
        title: task.title,
        description: task.description,
        agentName,
        fileMetadata,
        action: (task.metadata as any)?.action,
        payload: (task.metadata as any)?.payload,
      };

      // Use real agent processing (not simulation)
      const result = simulate 
        ? await simulateTaskProcessing(taskContext)
        : await processTask(taskContext);

      // Update task
      if (result.success) {
        await workflowTasksDb.update(task.id, {
          status: 'completed',
          results: result.results,
          completed_at: new Date().toISOString(),
        });
        results.push({ taskId: task.id, success: true });
      } else {
        await workflowTasksDb.update(task.id, {
          status: 'failed',
          error_message: result.error || 'Task processing failed',
        });
        results.push({ taskId: task.id, success: false, error: result.error });
      }
    }

    // Check if all tasks are completed
    const updatedTasks = await workflowTasksDb.getByWorkflowId(workflowId);
    const allCompleted = updatedTasks.every(t =>
      t.status === 'completed' || t.status === 'skipped' || t.status === 'failed'
    );

    // Update workflow status if all tasks are done
    if (allCompleted) {
      await workflowsDb.update(workflowId, { status: 'completed' });
    }

    return NextResponse.json({
      success: true,
      data: {
        executedCount: results.length,
        results,
        workflowStatus: allCompleted ? 'completed' : 'active',
      },
    });
  } catch (error) {
    console.error('[/api/workflows/[id]/execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Workflow execution failed: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
