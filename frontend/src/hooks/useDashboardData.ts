import { useState, useEffect, useRef, useCallback } from 'react';

export interface NormalizedAgent {
  name: string;
  status: 'working' | 'available' | 'idle';
  currentTask?: { id: string; title: string } | null;
  queueDepth: number;
  counts: { pending: number; inProgress: number; completedToday: number };
}

export interface NormalizedWorkflow {
  id: string;
  name?: string;
  status: string;
  progress: number;
  updatedAt?: string;
  tasks?: Array<{ id: string; title: string; status: string }>;
}

export interface NormalizedGateProject {
  id: string;
  name?: string;
  statusBadge: 'Blocked' | 'In Progress' | 'Ready';
  blockedReason: string | null;
  nextAction: string | null;
  approvedReferenceCount?: number;
  storyboardFrameCounts?: { approved: number; needsRevision: number; total: number };
  updatedAt?: string;
}

export interface NormalizedTasks {
  pending: Array<{ id: string; name?: string; workflowId?: string; updatedAt?: string; status: string }>;
  inProgress: Array<{ id: string; name?: string; workflowId?: string; updatedAt?: string; status: string }>;
  recentCompleted: Array<{ id: string; name?: string; workflowId?: string; updatedAt?: string; status: string }>;
  summary: { pendingCount: number; inProgressCount: number; completedRecentCount: number };
}

export interface DashboardData {
  lastUpdated: string;
  raw: {
    agents?: { ok: boolean; data?: unknown; error?: string };
    workflows?: { ok: boolean; data?: unknown; error?: string };
    gates?: { ok: boolean; supported: boolean; data?: unknown; error?: string };
    content?: { ok: boolean; supported: boolean; data?: unknown; error?: string };
  };
  normalized: {
    agents: NormalizedAgent[];
    workflows: NormalizedWorkflow[];
    tasks: NormalizedTasks;
    gates: { projects: NormalizedGateProject[] } | null;
    content: null;
  };
  errors?: Array<{ source: string; message: string }>;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

const POLL_INTERVAL = 2500; // 2.5 seconds

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    // Skip if tab is hidden
    if (document.visibilityState === 'hidden') {
      return;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/studio/dashboard', {
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (abortController.signal.aborted) {
        return;
      }

      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }
      
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('[Dashboard] Fetch error:', err);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchData();
    }, POLL_INTERVAL);

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Resume polling when tab becomes visible
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        fetchData();
        intervalRef.current = setInterval(() => {
          fetchData();
        }, POLL_INTERVAL);
      }
      // When hidden, polling continues but fetchData will skip
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch,
  };
}
