import type { Intent } from '@/types/database';
import type { ProjectGateStatus } from '@/lib/gateStatus';

interface PipelineStep {
  id: string;
  label: string;
  count?: number;
  locked?: boolean;
  lockReason?: string;
}

interface PipelineSidebarProps {
  currentIntent: Intent;
  currentStep: string;
  onStepChange: (step: string) => void;
  gateStatus: ProjectGateStatus;
}

const getStepsForIntent = (intent: Intent, gateStatus: ProjectGateStatus): PipelineStep[] => {
  switch (intent) {
    case 'create':
      return [
        {
          id: 'references',
          label: 'References',
          count: gateStatus.approvedReferenceCount,
          locked: false,
        },
        {
          id: 'style-card',
          label: 'Style Card',
          count: gateStatus.hasApprovedStyleCard ? 1 : 0,
          locked: gateStatus.approvedReferenceCount === 0,
          lockReason: 'Add approved references first',
        },
        {
          id: 'storyboard',
          label: 'Storyboard',
          count: gateStatus.storyboardFrameCounts.approved,
          locked: !gateStatus.hasApprovedStyleCard,
          lockReason: 'Approve Style Card first',
        },
        {
          id: 'video',
          label: 'Video',
          locked: !gateStatus.allStoryboardFramesApproved,
          lockReason: 'Approve all storyboard frames first',
        },
      ];

    case 'finish':
      return [
        {
          id: 'takes',
          label: 'Takes',
        },
        {
          id: 'assembly',
          label: 'Assembly',
        },
        {
          id: 'look-and-feel',
          label: 'Look & Feel',
        },
        {
          id: 'final-cut',
          label: 'Final Cut',
        },
      ];

    case 'release':
      return [
        {
          id: 'assets',
          label: 'Assets',
        },
        {
          id: 'narrative',
          label: 'Narrative',
        },
        {
          id: 'formats',
          label: 'Formats',
        },
        {
          id: 'schedule',
          label: 'Schedule',
        },
        {
          id: 'distribution',
          label: 'Distribution',
        },
        {
          id: 'campaign-pack',
          label: 'Campaign Pack',
        },
      ];

    case 'plan':
      return [
        {
          id: 'goals',
          label: 'Goals',
        },
        {
          id: 'brief',
          label: 'Brief',
        },
        {
          id: 'roadmap',
          label: 'Roadmap',
        },
        {
          id: 'risks',
          label: 'Risks',
        },
      ];

    default:
      return [];
  }
};

export function PipelineSidebar({ currentIntent, currentStep, onStepChange, gateStatus }: PipelineSidebarProps) {
  const steps = getStepsForIntent(currentIntent, gateStatus);

  return (
    <div className="p-4">
      <div className="space-y-1">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => !step.locked && onStepChange(step.id)}
            disabled={step.locked}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors relative ${
              currentStep === step.id
                ? 'bg-gray-900 text-white'
                : step.locked
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={step.locked ? step.lockReason : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{step.label}</span>
              <div className="flex items-center space-x-2">
                {step.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    currentStep === step.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {step.count}
                  </span>
                )}
                {step.locked && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
