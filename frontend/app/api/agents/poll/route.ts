import { NextRequest, NextResponse } from 'next/server';
import { pollAndExecute, type AgentName } from '@/lib/taskPoller';

/**
 * POST /api/agents/poll - Trigger agent to poll for and execute pending tasks
 * 
 * Body:
 * - agentName: 'cassidy' | 'letitia' | 'giorgio' | 'jamal'
 * - maxTasks: number (optional, default: 5)
 * - autoExecute: boolean (optional, default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentName, maxTasks = 5, autoExecute = true } = body;

    if (!agentName) {
      return NextResponse.json(
        {
          success: false,
          error: 'agentName is required (cassidy, letitia, giorgio, or jamal)',
        },
        { status: 400 }
      );
    }

    const validAgents: AgentName[] = ['cassidy', 'letitia', 'giorgio', 'jamal'];
    if (!validAgents.includes(agentName)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid agentName. Must be one of: ${validAgents.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (autoExecute) {
      // Poll and execute tasks
      const results = await pollAndExecute({
        agentName,
        maxConcurrentTasks: maxTasks,
        autoExecute: true,
      });

      return NextResponse.json({
        success: true,
        data: {
          agentName,
          tasksProcessed: results.length,
          results: results.map(r => ({
            taskId: r.taskId,
            success: r.success,
            error: r.error,
          })),
        },
      });
    } else {
      // Just poll for tasks (don't execute)
      const { pollForTasks } = await import('@/lib/taskPoller');
      const tasks = await pollForTasks(agentName, maxTasks);

      return NextResponse.json({
        success: true,
        data: {
          agentName,
          tasksFound: tasks.length,
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            workflowId: t.workflow_id,
          })),
        },
      });
    }
  } catch (error) {
    console.error('[/api/agents/poll POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to poll tasks: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}


