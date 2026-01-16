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
          id: 'foundation',
          label: 'Foundation',
          locked: false,
        },
        {
          id: 'structure',
          label: 'Structure',
          locked: false,
        },
        {
          id: 'references',
          label: 'References',
          count: gateStatus.approvedReferenceCount,
          locked: false,
        },
        {
          id: 'build',
          label: 'Build',
          count: gateStatus.hasApprovedStyleCard && gateStatus.storyboardFrameCounts.total > 0 ? gateStatus.storyboardFrameCounts.approved : undefined,
          locked: false,
        },
        {
          id: 'review',
          label: 'Review',
          locked: !gateStatus.allStoryboardFramesApproved,
          lockReason: 'Approve all storyboard frames first',
        },
        {
          id: 'finish',
          label: 'Finish',
          locked: false,
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

  // Get step number offset based on intent (for visual numbering in guided process)
  const getStepNumberOffset = (intent: Intent): number => {
    switch (intent) {
      case 'create':
        return 1; // Step 1: Foundation, Step 2: Structure, Step 3: Build, Step 4: Review, Step 5: Finish
      case 'finish':
        return 6; // Step 6 (after Create's 5 steps: Foundation, Structure, Build, Review, Finish)
      case 'release':
        return 10; // Step 10 (after Create + Finish)
      case 'plan':
        return 16; // Step 16 (after Create + Finish + Release)
      default:
        return 1;
    }
  };

  const stepOffset = getStepNumberOffset(currentIntent);

  return (
    <div className="p-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Steps
        </h3>
      </div>
      <div className="space-y-1">
        {steps.map((step, index) => {
          const stepNumber = stepOffset + index;
          const isActive = currentStep === step.id;
          
          return (
            <button
              key={step.id}
              onClick={() => !step.locked && onStepChange(step.id)}
              disabled={step.locked}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : step.locked
                    ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={step.locked ? step.lockReason : undefined}
            >
              <div className="flex items-center gap-3">
                {/* Step Number Badge */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : step.locked
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                
                {/* Step Label and Count */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-sm font-medium truncate">{step.label}</span>
                  <div className="flex items-center space-x-2 ml-2">
                    {step.count !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {step.count}
                      </span>
                    )}
                    {step.locked && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
