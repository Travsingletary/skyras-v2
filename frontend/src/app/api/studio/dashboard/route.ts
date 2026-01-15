import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { projectsDb } from '@/lib/database';
import { computeProjectStatus } from '@/lib/gateStatus';
import type { Workflow } from '@/types/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface AgentStatus {
  agentName: string;
  status: 'working' | 'available' | 'idle';
  pendingTasks: number;
  inProgressTasks: number;
  completedToday: number;
  currentTask: {
    id: string;
    title: string;
    workflowId: string;
  } | null;
  nextTask: {
    id: string;
    title: string;
    workflowId: string;
  } | null;
}

interface AgentStatusResponse {
  success: boolean;
  data?: {
    agents: AgentStatus[];
    timestamp: string;
  };
  error?: string;
}

interface WorkflowListResponse {
  success: boolean;
  data?: {
    workflows: Workflow[];
    count: number;
  };
  error?: string;
}

interface ProjectGateStatus {
  status: 'ready' | 'blocked' | 'in_progress';
  statusBadge: 'Blocked' | 'In Progress' | 'Ready';
  blockedReason: string | null;
  nextAction: string | null;
  hasApprovedStyleCard: boolean;
  approvedReferenceCount: number;
  storyboardFrameCounts: {
    approved: number;
    needsRevision: number;
    total: number;
  };
  allStoryboardFramesApproved: boolean;
}

interface DashboardResponse {
  lastUpdated: string;
  raw: {
    agents?: { ok: boolean; data?: AgentStatusResponse; error?: string };
    workflows?: { ok: boolean; data?: WorkflowListResponse; error?: string };
    tasks?: { ok: boolean; data?: unknown };
    gates?: { ok: boolean; supported: boolean; data?: Array<{ projectId: string; projectName?: string; gateStatus: ProjectGateStatus }>; error?: string };
    content?: { ok: boolean; supported: boolean; data?: unknown; error?: string };
  };
  normalized: {
    agents: Array<{
      name: string;
      status: 'working' | 'available' | 'idle';
      currentTask?: { id: string; title: string } | null;
      queueDepth: number;
      counts: { pending: number; inProgress: number; completedToday: number };
    }>;
    workflows: Array<{
      id: string;
      name?: string;
      status: string;
      progress: number;
      updatedAt?: string;
      tasks?: Array<{ id: string; title: string; status: string }>;
    }>;
    tasks: {
      pending: Array<{ id: string; name?: string; workflowId?: string; updatedAt?: string; status: string }>;
      inProgress: Array<{ id: string; name?: string; workflowId?: string; updatedAt?: string; status: string }>;
      recentCompleted: Array<{ id: string; name?: string; workflowId?: string; updatedAt?: string; status: string }>;
      summary: { pendingCount: number; inProgressCount: number; completedRecentCount: number };
    };
    gates: {
      projects: Array<{
        id: string;
        name?: string;
        statusBadge: 'Blocked' | 'In Progress' | 'Ready';
        blockedReason: string | null;
        nextAction: string | null;
        approvedReferenceCount?: number;
        storyboardFrameCounts?: { approved: number; needsRevision: number; total: number };
        updatedAt?: string;
      }>;
    } | null;
    content: null;
  };
  errors?: Array<{ source: string; message: string }>;
}


export async function GET(request: NextRequest) {
  const errors: Array<{ source: string; message: string }> = [];
  const response: DashboardResponse = {
    lastUpdated: new Date().toISOString(),
    raw: {},
    normalized: {
      agents: [],
      workflows: [],
      tasks: {
        pending: [],
        inProgress: [],
        recentCompleted: [],
        summary: { pendingCount: 0, inProgressCount: 0, completedRecentCount: 0 },
      },
      gates: null,
      content: null,
    },
  };

  // Fetch agents status - call the route handler directly
  try {
    // Import the route handler logic
    const { workflowTasksDb, workflowsDb } = await import('@/lib/database');
    const { pollForTasks } = await import('@/lib/taskPoller');
    type AgentName = 'cassidy' | 'letitia' | 'giorgio' | 'jamal';
    
    const agents: AgentName[] = ['cassidy', 'letitia', 'giorgio', 'jamal'];
    const agentStatuses: AgentStatus[] = [];

    for (const agent of agents) {
      // Get pending tasks for this agent
      const pendingTasks = await pollForTasks(agent, 100);
      
      // Get in-progress tasks
      const allWorkflows = await workflowsDb.getByUserId('public') || [];
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

    const agentsData: AgentStatusResponse = {
      success: true,
      data: {
        agents: agentStatuses,
        timestamp: new Date().toISOString(),
      },
    };
    
    response.raw.agents = {
      ok: true,
      data: agentsData,
    };

    // Normalize agents
    if (agentsData.success && agentsData.data?.agents) {
      response.normalized.agents = agentsData.data.agents.map((agent) => ({
        name: agent.agentName,
        status: agent.status,
        currentTask: agent.currentTask ? {
          id: agent.currentTask.id,
          title: agent.currentTask.title,
        } : null,
        queueDepth: agent.pendingTasks + agent.inProgressTasks,
        counts: {
          pending: agent.pendingTasks,
          inProgress: agent.inProgressTasks,
          completedToday: agent.completedToday,
        },
      }));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push({ source: 'agents', message });
    response.raw.agents = {
      ok: false,
      error: message,
    };
  }

  // Fetch workflows (requires auth)
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      response.raw.workflows = {
        ok: false,
        error: 'Authentication required',
      };
      errors.push({ source: 'workflows', message: 'Authentication required' });
    } else {
      // Call the database directly (server-side)
      const { workflowsDb } = await import('@/lib/database');
      const workflows = await workflowsDb.getByUserId(userId) || [];
      
      const workflowsData: WorkflowListResponse = {
        success: true,
        data: {
          workflows,
          count: workflows.length,
        },
      };

      response.raw.workflows = {
        ok: true,
        data: workflowsData,
      };

      // Normalize workflows and fetch tasks (smart fetching)
      if (workflowsData.success && workflowsData.data?.workflows) {
        const workflows = workflowsData.data.workflows;
        const MAX_WORKFLOWS_FOR_TASKS = 3;
        const MAX_TASKS_TOTAL = 10;
        
        // Only fetch tasks if workflow count is small
        const shouldFetchTasks = workflows.length <= MAX_WORKFLOWS_FOR_TASKS;
        let totalTasksFetched = 0;
        
        response.normalized.workflows = await Promise.all(
          workflows.map(async (workflow) => {
            const progress = workflow.total_tasks > 0
              ? Math.round((workflow.completed_tasks / workflow.total_tasks) * 100)
              : 0;

            let tasks: Array<{ id: string; title: string; status: string }> | undefined = undefined;
            
            // Fetch tasks only if conditions are met
            if (shouldFetchTasks && totalTasksFetched < MAX_TASKS_TOTAL) {
              try {
                const { workflowTasksDb } = await import('@/lib/database');
                const workflowTasks = await workflowTasksDb.getByWorkflowId(workflow.id) || [];
                const remaining = MAX_TASKS_TOTAL - totalTasksFetched;
                const tasksToInclude = workflowTasks.slice(0, remaining);
                totalTasksFetched += tasksToInclude.length;
                
                tasks = tasksToInclude.map(task => ({
                  id: task.id,
                  title: task.title,
                  status: task.status,
                }));
              } catch (err) {
                console.warn(`Failed to fetch tasks for workflow ${workflow.id}:`, err);
                // Continue without tasks
              }
            }

            return {
              id: workflow.id,
              name: workflow.name,
              status: workflow.status,
              progress,
              updatedAt: workflow.updated_at,
              tasks,
            };
          })
        );
        
        // Build normalized tasks from workflows that have tasks
        const allTasks: Array<{ id: string; name?: string; workflowId: string; updatedAt?: string; status: string }> = [];
        for (const workflow of response.normalized.workflows) {
          if (workflow.tasks) {
            for (const task of workflow.tasks) {
              allTasks.push({
                id: task.id,
                name: task.title,
                workflowId: workflow.id,
                updatedAt: workflow.updatedAt,
                status: task.status,
              });
            }
          }
        }
        
        // Group tasks by status
        const pending = allTasks.filter(t => t.status === 'pending');
        const inProgress = allTasks.filter(t => t.status === 'in_progress');
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentCompleted = allTasks
          .filter(t => t.status === 'completed' && t.updatedAt && new Date(t.updatedAt) > oneDayAgo)
          .slice(0, 10); // Recent 10
        
        response.normalized.tasks = {
          pending,
          inProgress,
          recentCompleted,
          summary: {
            pendingCount: pending.length,
            inProgressCount: inProgress.length,
            completedRecentCount: recentCompleted.length,
          },
        };
        
        // Add tasks to raw section
        response.raw.tasks = {
          ok: true,
          data: allTasks,
        };
      } else {
        // No workflows, but still initialize tasks structure
        response.normalized.tasks = {
          pending: [],
          inProgress: [],
          recentCompleted: [],
          summary: { pendingCount: 0, inProgressCount: 0, completedRecentCount: 0 },
        };
        response.raw.tasks = {
          ok: true,
          data: [],
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push({ source: 'workflows', message });
    response.raw.workflows = {
      ok: false,
      error: message,
    };
    // Initialize tasks structure even on error
    response.normalized.tasks = {
      pending: [],
      inProgress: [],
      recentCompleted: [],
      summary: { pendingCount: 0, inProgressCount: 0, completedRecentCount: 0 },
    };
    response.raw.tasks = {
      ok: false,
      data: [],
    };
  }

  // Fetch projects and compute gate status (with parallelism limits)
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      response.raw.gates = {
        ok: false,
        supported: true,
        error: 'Authentication required',
      };
      response.normalized.gates = null;
      errors.push({ source: 'gates', message: 'Authentication required' });
    } else {
      const projects = await projectsDb.getByUserId(userId) || [];
      const MAX_PROJECTS_PER_POLL = 10;
      
      if (projects.length > 0) {
        const projectsToProcess = projects.slice(0, MAX_PROJECTS_PER_POLL);
        const gatesData: Array<{ projectId: string; projectName?: string; gateStatus: ProjectGateStatus; updatedAt?: string }> = [];
        
        // Compute gate status for each project (with parallelism limit)
        // Process in batches of 3 to avoid overwhelming the database
        const BATCH_SIZE = 3;
        for (let i = 0; i < projectsToProcess.length; i += BATCH_SIZE) {
          const batch = projectsToProcess.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (project) => {
              try {
                const gateStatus = await computeProjectStatus(project.id);
                gatesData.push({
                  projectId: project.id,
                  projectName: project.name,
                  gateStatus,
                  updatedAt: project.updated_at,
                });
              } catch (err) {
                console.warn(`Failed to compute gate status for project ${project.id}:`, err);
                // Continue with other projects
              }
            })
          );
        }
        
        // Add note if truncated
        if (projects.length > MAX_PROJECTS_PER_POLL) {
          errors.push({
            source: 'gates',
            message: `Showing first ${MAX_PROJECTS_PER_POLL} of ${projects.length} projects`,
          });
        }

        response.raw.gates = {
          ok: true,
          supported: true,
          data: gatesData,
        };

        // Normalize gates with new shape
        response.normalized.gates = {
          projects: gatesData.map((item) => ({
            id: item.projectId,
            name: item.projectName,
            statusBadge: item.gateStatus.statusBadge,
            blockedReason: item.gateStatus.blockedReason,
            nextAction: item.gateStatus.nextAction,
            approvedReferenceCount: item.gateStatus.approvedReferenceCount,
            storyboardFrameCounts: item.gateStatus.storyboardFrameCounts,
            updatedAt: item.updatedAt,
          })),
        };
      } else {
        response.raw.gates = {
          ok: true,
          supported: true,
          data: [],
        };
        response.normalized.gates = {
          projects: [],
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push({ source: 'gates', message });
    response.raw.gates = {
      ok: false,
      supported: true,
      error: message,
    };
    response.normalized.gates = null;
  }

  // Content pipeline - not supported
  response.raw.content = {
    ok: false,
    supported: false,
  };
  response.normalized.content = null;

  // Add errors if any
  if (errors.length > 0) {
    response.errors = errors;
  }

  return NextResponse.json(response);
}
