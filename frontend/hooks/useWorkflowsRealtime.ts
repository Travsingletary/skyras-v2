/**
 * useWorkflowsRealtime Hook
 *
 * Real-time subscription to all workflows for a user.
 * Automatically updates when workflows are created, updated, or deleted.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabaseFrontendClient } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Workflow } from '@/types/database';

interface UseWorkflowsRealtimeReturn {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe to real-time updates for all workflows of a user
 *
 * @param userId - The user ID to filter workflows by
 * @returns Object with workflows array, loading state, and error
 *
 * @example
 * ```tsx
 * const { workflows, loading, error } = useWorkflowsRealtime(userId);
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 *
 * return (
 *   <div>
 *     {workflows.map(wf => (
 *       <div key={wf.id}>{wf.name}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useWorkflowsRealtime(userId: string): UseWorkflowsRealtimeReturn {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseFrontendClient();

    // Initial fetch
    async function fetchWorkflows() {
      try {
        const res = await fetch(`/api/workflows?userId=${encodeURIComponent(userId)}`);
        const data = await res.json();

        if (data.success) {
          setWorkflows(data.data?.workflows || []);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch workflows');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();

    // Set up real-time subscription for this user's workflows
    const channel = supabase
      .channel(`workflows-${userId}`)
      // Subscribe to workflow inserts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflows',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Workflow inserted:', payload);
          setWorkflows((prev) => [...prev, payload.new as Workflow]);
        }
      )
      // Subscribe to workflow updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflows',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Workflow updated:', payload);
          setWorkflows((prev) =>
            prev.map((wf) =>
              wf.id === (payload.new as Workflow).id ? (payload.new as Workflow) : wf
            )
          );
        }
      )
      // Subscribe to workflow deletes
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workflows',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Workflow deleted:', payload);
          setWorkflows((prev) => prev.filter((wf) => wf.id !== (payload.old as Workflow).id));
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
  }, [userId]);

  return { workflows, loading, error };
}
