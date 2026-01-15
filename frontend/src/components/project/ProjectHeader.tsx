import type { Project, Intent } from '@/types/database';
import type { ProjectGateStatus } from '@/lib/gateStatus';
import { GateBanner } from './GateBanner';

interface ProjectHeaderProps {
  project: Project;
  currentIntent: Intent;
  gateStatus: ProjectGateStatus;
}

export function ProjectHeader({ project, currentIntent, gateStatus }: ProjectHeaderProps) {
  const getStatusColor = () => {
    if (gateStatus.status === 'ready') return 'bg-green-100 text-green-800';
    if (gateStatus.status === 'in_progress') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-600 capitalize">{project.mode} Mode</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 capitalize">{currentIntent} Intent</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {gateStatus.statusBadge}
            </div>
          </div>
        </div>

        <GateBanner gateStatus={gateStatus} currentIntent={currentIntent} />
      </div>
    </div>
  );
}






