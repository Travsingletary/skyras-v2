'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsDb } from '@/lib/database';
import { checkProjectGateStatus } from '@/lib/gateStatus';
import { checkAuth as checkAuthStatus } from '@/lib/auth-utils';
import type { Project } from '@/types/database';
import type { ProjectGateStatus } from '@/lib/gateStatus';

interface ProjectWithStatus extends Project {
  gateStatus?: ProjectGateStatus;
}

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check auth and get user ID with retry logic
    const performAuthCheck = async () => {
      try {
        const result = await checkAuthStatus(2);

        if (result.error) {
          console.error('Auth check failed:', result.error);
          setError(`Authentication error: ${result.error}. Redirecting to login...`);
          setTimeout(() => router.push('/login?next=/projects'), 2000);
        } else if (result.authenticated && result.user) {
          setUserId(result.user.id);
          setError(null);
        } else {
          router.push('/login?next=/projects');
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        setError('Unexpected authentication error. Redirecting to login...');
        setTimeout(() => router.push('/login?next=/projects'), 2000);
      }
    };

    performAuthCheck();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const loadProjects = async () => {
      try {
        setLoading(true);
        const userProjects = await projectsDb.getByUserId(userId);

        // Load gate status for each project
        const projectsWithStatus = await Promise.all(
          userProjects.map(async (project) => {
            try {
              const gateStatus = await checkProjectGateStatus(project.id);
              return { ...project, gateStatus };
            } catch (err) {
              console.error(`Failed to load gate status for project ${project.id}:`, err);
              return project;
            }
          })
        );

        setProjects(projectsWithStatus);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [userId]);

  const getStatusBadge = (gateStatus?: ProjectGateStatus) => {
    if (!gateStatus) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Unknown</span>;
    }

    if (gateStatus.status === 'ready') {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Ready</span>;
    } else if (gateStatus.status === 'in_progress') {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">In Progress</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Blocked</span>;
    }
  };

  const handleCreateProject = async () => {
    if (!userId) return;

    try {
      const newProject = await projectsDb.create({
        user_id: userId,
        name: 'New Project',
        type: 'campaign',
        status: 'active',
        mode: 'ad',
        metadata: {},
      });

      router.push(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your content creation projects
            </p>
          </div>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No projects yet. Create your first project to get started.</p>
            <button
              onClick={handleCreateProject}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  {getStatusBadge(project.gateStatus)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-medium text-gray-900 capitalize">{project.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{project.type.replace('_', ' ')}</span>
                  </div>
                </div>

                {project.gateStatus?.blockedReason && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-red-600 font-medium">
                      {project.gateStatus.blockedReason}
                    </p>
                    {project.gateStatus.nextAction && (
                      <p className="text-xs text-gray-600 mt-1">
                        {project.gateStatus.nextAction}
                      </p>
                    )}
                  </div>
                )}

                {project.gateStatus && (
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-600">References</div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.gateStatus.approvedReferenceCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Style Card</div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.gateStatus.hasApprovedStyleCard ? '✓' : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Frames</div>
                      <div className="text-sm font-medium text-gray-900">
                        {project.gateStatus.storyboardFrameCounts.approved}/{project.gateStatus.storyboardFrameCounts.total}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
