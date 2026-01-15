'use client';

import type { Project, Intent } from '@/types/database';

interface TopBarProps {
  project: Project;
  currentIntent: Intent;
}

export function TopBar({ project, currentIntent }: TopBarProps) {
  const getEnvBadge = () => {
    // Next.js exposes NODE_ENV in client components
    const env = process.env.NODE_ENV || 'development';
    const colors = {
      development: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      production: 'bg-green-100 text-green-800 border-green-300',
      test: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[env as keyof typeof colors] || colors.development;
  };

  const getIntentLabel = (intent: Intent) => {
    const labels: Record<Intent, string> = {
      plan: 'Plan',
      create: 'Create',
      finish: 'Finish',
      release: 'Release',
    };
    return labels[intent];
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {getIntentLabel(currentIntent)}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Agent Status Placeholder */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <span>Agent Status</span>
        </div>

        {/* Environment Badge */}
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getEnvBadge()}`}>
          {process.env.NODE_ENV || 'dev'}
        </span>
      </div>
    </div>
  );
}
