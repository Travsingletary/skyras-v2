/**
 * useWorkflowRealtime Hook
 *
 * Real-time subscription to a single workflow and its tasks.
 * Automatically updates when workflow or tasks change in the database.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabaseFrontendClient } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { WorkflowTask, Workflow } from '@/types/database';

interface WorkflowWithTasks extends Workflow {
  tasks: WorkflowTask[];
}

interface UseWorkflowRealtimeReturn {
  workflow: WorkflowWithTasks | null;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe to real-time updates for a workflow and its tasks
 *
 * @param workflowId - The workflow ID to subscribe to
 * @returns Object with workflow data, loading state, and error
 *
 * @example
 * ```tsx
 * const { workflow, loading, error } = useWorkflowRealtime(workflowId);
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (!workflow) return <div>Workflow not found</div>;
 *
 * return <div>{workflow.name} - {workflow.tasks.length} tasks</div>;
 * ```
 */
export function useWorkflowRealtime(workflowId: string | null): UseWorkflowRealtimeReturn {
  const [workflow, setWorkflow] = useState<WorkflowWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!workflowId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseFrontendClient();

    // Initial fetch
    async function fetchWorkflow() {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();

        if (data.success) {
          setWorkflow({
            ...data.data.workflow,
            tasks: data.data.tasks || [],
          });
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch workflow');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();

    // Set up real-time subscription
    const channel = supabase
      .channel(`workflow-${workflowId}`)
      // Subscribe to workflow updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflows',
          filter: `id=eq.${workflowId}`,
        },
        (payload) => {
          console.log('[Realtime] Workflow update:', payload);
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...(payload.new as Workflow),
            };
          });
        }
      )
      // Subscribe to task inserts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_tasks',
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload) => {
          console.log('[Realtime] Task inserted:', payload);
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: [...prev.tasks, payload.new as WorkflowTask].sort(
                (a, b) => a.position - b.position
              ),
            };
          });
        }
      )
      // Subscribe to task updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_tasks',
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload) => {
          console.log('[Realtime] Task updated:', payload);
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: prev.tasks.map((task) =>
                task.id === (payload.new as WorkflowTask).id
                  ? (payload.new as WorkflowTask)
                  : task
              ),
            };
          });
        }
      )
      // Subscribe to task deletes
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workflow_tasks',
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload) => {
          console.log('[Realtime] Task deleted:', payload);
          setWorkflow((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: prev.tasks.filter((task) => task.id !== (payload.old as WorkflowTask).id),
            };
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [workflowId]);

  return { workflow, loading, error };
}
