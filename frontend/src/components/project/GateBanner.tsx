import type { ProjectGateStatus } from '@/lib/gateStatus';

interface GateBannerProps {
  gateStatus: ProjectGateStatus;
  currentIntent: 'create' | 'finish' | 'release' | 'plan';
}

/**
 * GateBanner component that shows blocker information and next action
 * In Plan intent: Shows informational banner only (never blocks editing)
 * In other intents: Shows blocking/informational banner as appropriate
 */
export function GateBanner({ gateStatus, currentIntent }: GateBannerProps) {
  // Don't show banner if status is ready and there's no blocker
  if (gateStatus.status === 'ready' && !gateStatus.blockedReason) {
    return null;
  }

  // In Plan intent: Show informational banner (non-blocking) for any readiness gaps
  // Never block editing, but inform user of project status
  const isPlanIntent = currentIntent === 'plan';
  const isNonBlocking = isPlanIntent && gateStatus.status === 'blocked';

  const getBannerStyles = () => {
    // In Plan intent with blocked status: Use neutral info styling instead of red
    if (isNonBlocking) {
      return 'bg-gray-50 border-gray-200 text-gray-700';
    }
    if (gateStatus.status === 'blocked') {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (gateStatus.status === 'in_progress') {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    }
    return 'bg-green-50 border-green-200 text-green-800';
  };

  const getIconColor = () => {
    // In Plan intent with blocked status: Use neutral icon color
    if (isNonBlocking) {
      return 'text-gray-600';
    }
    if (gateStatus.status === 'blocked') {
      return 'text-red-600';
    }
    if (gateStatus.status === 'in_progress') {
      return 'text-blue-600';
    }
    return 'text-green-600';
  };

  const getIcon = () => {
    // In Plan intent with blocked status: Use info icon instead of error icon
    if (isNonBlocking) {
      return (
        <svg
          className={`w-5 h-5 mt-0.5 mr-2 ${getIconColor()}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (gateStatus.status === 'blocked') {
      return (
        <svg
          className={`w-5 h-5 mt-0.5 mr-2 ${getIconColor()}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (gateStatus.status === 'in_progress') {
      return (
        <svg
          className={`w-5 h-5 mt-0.5 mr-2 ${getIconColor()}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg
        className={`w-5 h-5 mt-0.5 mr-2 ${getIconColor()}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className={`mt-4 p-3 border rounded-lg ${getBannerStyles()}`}>
      <div className="flex items-start">
        {getIcon()}
        <div className="flex-1">
          {isNonBlocking && (
            <p className="text-xs font-medium mb-1 uppercase tracking-wide">Project Readiness</p>
          )}
          {gateStatus.blockedReason && (
            <p className="text-sm font-medium">{gateStatus.blockedReason}</p>
          )}
          {gateStatus.nextAction && (
            <p className={`text-sm mt-1 ${isNonBlocking ? 'opacity-75' : 'opacity-90'}`}>
              {isNonBlocking ? `Note: ${gateStatus.nextAction}` : gateStatus.nextAction}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
