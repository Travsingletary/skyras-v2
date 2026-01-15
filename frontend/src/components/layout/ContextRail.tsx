'use client';

import { GateStatusPanel } from './GateStatusPanel';
import { IntentSummaryPanel } from './IntentSummaryPanel';
import { RecentActionsPanel } from './RecentActionsPanel';
import { AgentRecommendationsPanel } from './AgentRecommendationsPanel';
import type { Project, Intent } from '@/types/database';
import type { ProjectGateStatus } from '@/lib/gateStatus';

interface ContextRailProps {
  projectId: string;
  project: Project | null;
  currentIntent: Intent;
  currentStep?: string;
  gateStatus: ProjectGateStatus | null;
}

export function ContextRail({
  projectId,
  project,
  currentIntent,
  currentStep,
  gateStatus,
}: ContextRailProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Context</h2>
      </div>

      <GateStatusPanel
        projectId={projectId}
        initialGateStatus={gateStatus}
      />

      <IntentSummaryPanel project={project} currentIntent={currentIntent} />

      <RecentActionsPanel
        projectId={projectId}
        currentIntent={currentIntent}
        currentStep={currentStep}
      />

      <AgentRecommendationsPanel
        projectId={projectId}
        currentIntent={currentIntent}
        currentStep={currentStep}
      />
    </div>
  );
}
