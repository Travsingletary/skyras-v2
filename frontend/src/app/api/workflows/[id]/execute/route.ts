import { NextRequest, NextResponse } from 'next/server';
import { workflowsDb, workflowTasksDb, filesDb } from '@/lib/database';
import { simulateTaskProcessing, type AgentName } from '@/lib/agentProcessor';
import {
  saveManifest,
  isQnapAvailable,
  getManifest,
} from '@/backend/storage/qnapStorage';

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

    // Create or update manifest on QNAP if available
    if (workflow.project_id) {
      try {
        const qnapAvailable = await isQnapAvailable();
        if (qnapAvailable) {
          // Check if manifest already exists
          let existingManifest = await getManifest(workflow.project_id, workflowId);
          
          if (!existingManifest) {
            // Create initial manifest
            await saveManifest(workflow.project_id, workflowId, {
              workflowId,
              project: workflow.project_id,
              workflowName: workflow.name,
              workflowType: workflow.type,
              createdAt: workflow.created_at,
              updatedAt: workflow.updated_at,
              status: workflow.status,
            });
          }
        }
      } catch (error) {
        console.error('[WorkflowExecute] Failed to create/update manifest:', error);
        // Don't fail workflow execution if manifest creation fails
      }
    }

    // Get all pending tasks
    const tasks = await workflowTasksDb.getByWorkflowId(workflowId);
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending tasks to execute',
        data: { executedCount: 0 },
      });
    }

    // Execute tasks sequentially (respecting dependencies)
    const results = [];
    for (const task of pendingTasks) {
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

      // Process task
      const taskContext = {
        taskId: task.id,
        workflowId: task.workflow_id,
        title: task.title,
        description: task.description,
        agentName: task.agent_name as AgentName,
        fileMetadata,
      };

      const result = await simulateTaskProcessing(taskContext);

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
      
      // Update manifest status if QNAP is available
      if (workflow.project_id) {
        try {
          const qnapAvailable = await isQnapAvailable();
          if (qnapAvailable) {
            const manifest = await getManifest(workflow.project_id, workflowId);
            if (manifest) {
              await saveManifest(workflow.project_id, workflowId, {
                ...manifest,
                status: 'completed',
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error('[WorkflowExecute] Failed to update manifest status:', error);
          // Don't fail if manifest update fails
        }
      }
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
