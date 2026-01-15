import React from 'react';
import { ControlPanel } from './ControlPanel';
import type { DashboardData } from '@/hooks/useDashboardData';

interface ContentPipelinePanelProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function ContentPipelinePanel({ data, loading, error }: ContentPipelinePanelProps) {
  const supported = data?.raw.content?.supported ?? false;
  const empty = !loading && !supported;

  return (
    <ControlPanel
      title="Content Pipeline"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage="No content pipeline feed connected"
    >
      <div className="text-center py-6">
        <p className="text-sm text-zinc-500 mb-2">No content pipeline feed connected</p>
        <p className="text-xs text-zinc-400">
          Content generation status endpoints are not available. This panel will show image/video/audio generation jobs when a status API is implemented.
        </p>
      </div>
    </ControlPanel>
  );
}
