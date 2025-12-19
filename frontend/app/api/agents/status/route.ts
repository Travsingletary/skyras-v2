import { NextRequest, NextResponse } from 'next/server';
import { workflowTasksDb, workflowsDb } from '@/lib/database';
import { pollForTasks, type AgentName } from '@/lib/taskPoller';

/**
 * GET /api/agents/status - Get status for all agents or a specific agent
 * 
 * Query params:
 * - agentName: optional, filter by specific agent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName') as AgentName | null;

    const agents: AgentName[] = ['cassidy', 'letitia', 'giorgio', 'jamal'];
    const agentStatuses = [];

    for (const agent of agents) {
      if (agentName && agent !== agentName) {
        continue;
      }

      // Get pending tasks for this agent
      const pendingTasks = await pollForTasks(agent, 100);
      
      // Get in-progress tasks
      const allWorkflows = await workflowsDb.getByUserId('public');
      const inProgressTasks: any[] = [];
      
      for (const workflow of allWorkflows) {
        if (workflow.status === 'active') {
          const tasks = await workflowTasksDb.getByWorkflowId(workflow.id);
          const agentTasks = tasks.filter(task => {
            const taskAgentName = (task as any).agent_name || (task.metadata as any)?.agent_name;
            return taskAgentName === agent && task.status === 'in_progress';
          });
          inProgressTasks.push(...agentTasks);
        }
      }

      // Get completed tasks count (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      let completedCount = 0;
      for (const workflow of allWorkflows) {
        const tasks = await workflowTasksDb.getByWorkflowId(workflow.id);
        const agentTasks = tasks.filter(task => {
          const taskAgentName = (task as any).agent_name || (task.metadata as any)?.agent_name;
          return taskAgentName === agent && 
                 task.status === 'completed' &&
                 task.completed_at &&
                 new Date(task.completed_at) > oneDayAgo;
        });
        completedCount += agentTasks.length;
      }

      agentStatuses.push({
        agentName: agent,
        status: inProgressTasks.length > 0 ? 'working' : pendingTasks.length > 0 ? 'available' : 'idle',
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        completedToday: completedCount,
        currentTask: inProgressTasks[0] ? {
          id: inProgressTasks[0].id,
          title: inProgressTasks[0].title,
          workflowId: inProgressTasks[0].workflow_id,
        } : null,
        nextTask: pendingTasks[0] ? {
          id: pendingTasks[0].id,
          title: pendingTasks[0].title,
          workflowId: pendingTasks[0].workflow_id,
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        agents: agentStatuses,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[/api/agents/status GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get agent status: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

