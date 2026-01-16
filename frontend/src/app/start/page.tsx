'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth as checkAuthStatus } from '@/lib/auth-utils';
import { projectsDb } from '@/lib/database';

export default function StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
          setTimeout(() => router.push('/login?next=/start'), 2000);
        } else if (result.authenticated && result.user) {
          setUserId(result.user.id);
          setError(null);
        } else {
          router.push('/login?next=/start');
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        setError('Unexpected authentication error. Redirecting to login...');
        setTimeout(() => router.push('/login?next=/start'), 2000);
      } finally {
        setLoading(false);
      }
    };

    performAuthCheck();
  }, [router]);

  const handleStartProject = async () => {
    if (!userId) return;

    try {
      setCreating(true);
      setError(null);

      // Create a new project with default values
      const newProject = await projectsDb.create({
        user_id: userId,
        name: 'New Project',
        type: 'campaign',
        status: 'active',
        mode: 'ad',
        metadata: {},
      });

      // Redirect directly to project workspace (Step 1: Project Foundation)
      router.push(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start a Project</h1>
            <p className="text-gray-600">
              Begin your guided content creation journey
            </p>
          </div>

          {error && userId && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleStartProject}
            disabled={creating || !userId}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating Project...' : 'Start a Project'}
          </button>

          <p className="mt-4 text-xs text-gray-500">
            You'll be guided through each step of your project
          </p>
        </div>
      </div>
    </div>
  );
}
