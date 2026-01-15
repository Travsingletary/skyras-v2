'use client';

interface RecentAction {
  id: string;
  action: string;
  timestamp: string;
  intent?: string;
  step?: string;
}

interface RecentActionsPanelProps {
  projectId: string;
  currentIntent?: string;
  currentStep?: string;
}

export function RecentActionsPanel({ projectId, currentIntent, currentStep }: RecentActionsPanelProps) {
  // Static placeholder actions for now
  // In the future, this could be hooked to an event emitter or action log
  const placeholderActions: RecentAction[] = [
    {
      id: '1',
      action: 'Project loaded',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      action: `Navigated to ${currentIntent || 'create'} intent`,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      intent: currentIntent,
    },
  ];

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Actions</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {placeholderActions.length === 0 ? (
          <div className="text-xs text-gray-500 py-4 text-center">
            No recent actions
          </div>
        ) : (
          placeholderActions.map((action) => (
            <div
              key={action.id}
              className="bg-gray-50 rounded p-2 border border-gray-200 text-xs"
            >
              <div className="text-gray-900 font-medium mb-1">{action.action}</div>
              <div className="text-gray-500">{formatTimestamp(action.timestamp)}</div>
              {action.step && (
                <div className="text-gray-400 mt-1">Step: {action.step}</div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400 italic">
        Action tracking will be enhanced in a future update
      </div>
    </div>
  );
}
