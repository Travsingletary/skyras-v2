'use client';

import { useState, useEffect } from 'react';

interface JobStatusIndicatorProps {
  jobId: string;
  onComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

interface JobData {
  id: string;
  status: JobStatus;
  error?: string;
  signedVideoUrl?: string;
}

export function JobStatusIndicator({
  jobId,
  onComplete,
  onError,
  className,
}: JobStatusIndicatorProps) {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/video/jobs/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch job status');
        }

        if (data.success && data.data) {
          const jobData = data.data as JobData;
          setJob(jobData);
          setLoading(false);

          // Handle completion
          if (jobData.status === 'succeeded' && jobData.signedVideoUrl) {
            onComplete?.(jobData.signedVideoUrl);
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            return;
          }

          // Handle error
          if (jobData.status === 'failed') {
            onError?.(jobData.error || 'Animation failed');
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            return;
          }

          // Continue polling if still in progress
          if (jobData.status === 'queued' || jobData.status === 'running') {
            if (!pollInterval) {
              pollInterval = setInterval(fetchJobStatus, 3000); // Poll every 3 seconds
            }
          }
        }
      } catch (err) {
        console.error('[JobStatusIndicator] Error:', err);
        setLoading(false);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    // Initial fetch
    fetchJobStatus();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [jobId, onComplete, onError]);

  if (loading && !job) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const getStatusBadge = () => {
    switch (job.status) {
      case 'queued':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            <div className="mr-1 h-2 w-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            Running
          </span>
        );
      case 'succeeded':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            ✓ Complete
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            ✗ Failed
          </span>
        );
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {job.error && (
          <p className="text-sm text-red-600">{job.error}</p>
        )}
      </div>
    </div>
  );
}
