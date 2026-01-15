'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { projectsDb } from '@/lib/database';
import { checkProjectGateStatus } from '@/lib/gateStatus';
import type { Project, Intent } from '@/types/database';
import type { ProjectGateStatus } from '@/lib/gateStatus';
import { TopBar } from '@/components/layout/TopBar';
import { MainRow } from '@/components/layout/MainRow';
import { CommandSurface } from '@/components/layout/CommandSurface';
import { WorkspaceCanvas } from '@/components/layout/WorkspaceCanvas';
import { ContextRail } from '@/components/layout/ContextRail';
import { IntentSelector } from '@/components/project/IntentSelector';
import { PipelineSidebar } from '@/components/project/PipelineSidebar';
import { ReferencesView } from '@/components/project/views/ReferencesView';
import { StyleCardView } from '@/components/project/views/StyleCardView';
import { StoryboardView } from '@/components/project/views/StoryboardView';
import { StoryboardFramesReview } from '@/components/project/create/storyboard/StoryboardFramesReview';
import { VideoView } from '@/components/project/views/VideoView';
import { PlanIntentView } from '@/components/project/views/PlanIntentView';
import { ReleaseIntentView } from '@/components/project/views/ReleaseIntentView';
import { FinishIntentView } from '@/components/project/views/FinishIntentView';
import { GateBanner } from '@/components/project/GateBanner';

export default function ProjectWorkspace() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [gateStatus, setGateStatus] = useState<ProjectGateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Navigation state
  const [currentIntent, setCurrentIntent] = useState<Intent>('create');
  const [currentStep, setCurrentStep] = useState<string>('references');
  
  // Contextual chat state
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const { user } = await response.json();
        setUserId(user.id);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!projectId || !userId) return;

    const loadProject = async () => {
      try {
        setLoading(true);

        const projectData = await projectsDb.getById(projectId);
        if (!projectData) {
          setError('Project not found');
          return;
        }

        setProject(projectData);

        const status = await checkProjectGateStatus(projectId);
        setGateStatus(status);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, userId]);

  // Set default step when intent changes
  useEffect(() => {
    const defaultSteps: Record<Intent, string> = {
      create: 'references',
      finish: 'takes',
      release: 'assets',
      plan: 'brief',
    };

    setCurrentStep(defaultSteps[currentIntent]);
  }, [currentIntent]);

  const handleIntentChange = (intent: Intent) => {
    setCurrentIntent(intent);
  };

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  const handleDataUpdate = async () => {
    // Reload gate status when data changes
    if (!projectId) return;
    const status = await checkProjectGateStatus(projectId);
    setGateStatus(status);
  };

  const renderStepContent = () => {
    if (!userId) return null;

    // Create intent views
    if (currentIntent === 'create') {
      if (currentStep === 'references') {
        return (
          <ReferencesView projectId={projectId} userId={userId} onUpdate={handleDataUpdate} />
        );
      }
      if (currentStep === 'style-card') {
        return (
          <StyleCardView projectId={projectId} userId={userId} onUpdate={handleDataUpdate} />
        );
      }
      if (currentStep === 'storyboard') {
        return (
          <StoryboardFramesReview projectId={projectId} userId={userId} onUpdate={handleDataUpdate} />
        );
      }
      if (currentStep === 'video') {
        return (
          <VideoView projectId={projectId} userId={userId} />
        );
      }
    }

    // Plan intent view
    if (currentIntent === 'plan') {
      return (
        <PlanIntentView
          projectId={projectId}
          userId={userId}
          step={currentStep}
          onUpdate={handleDataUpdate}
        />
      );
    }

    // Release intent views
    if (currentIntent === 'release') {
      return (
        <ReleaseIntentView
          projectId={projectId}
          userId={userId}
          step={currentStep}
          onUpdate={handleDataUpdate}
        />
      );
    }

    // Finish intent view
    if (currentIntent === 'finish') {
      return (
        <FinishIntentView
          projectId={projectId}
          userId={userId}
          step={currentStep}
          onUpdate={handleDataUpdate}
        />
      );
    }

    // Fallback placeholder
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">
            {currentIntent}: {currentStep.replace('-', ' ')}
          </h2>
          <p className="text-gray-600">
            View content for {currentIntent} intent, {currentStep} step will be implemented here.
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (error || !project || !gateStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>
          <div className="text-red-600 mb-4">{error || 'Failed to load project'}</div>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar project={project} currentIntent={currentIntent} />
      <GateBanner gateStatus={gateStatus} currentIntent={currentIntent} />

      <MainRow
        commandSurface={
          <div className="flex flex-col h-full overflow-hidden">
            <IntentSelector
              currentIntent={currentIntent}
              onIntentChange={handleIntentChange}
            />
            <PipelineSidebar
              currentIntent={currentIntent}
              currentStep={currentStep}
              onStepChange={handleStepChange}
              gateStatus={gateStatus}
            />
            <div className="flex-1 min-h-0">
              <CommandSurface projectId={projectId} currentIntent={currentIntent} />
            </div>
          </div>
        }
        workspaceCanvas={
          <WorkspaceCanvas>
            {renderStepContent()}
            
            {/* Contextual Chat Panel */}
            <div
              className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
                showChat ? 'w-96 h-[600px]' : 'w-16 h-16'
              }`}
            >
              {showChat ? (
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Contextual Chat</h3>
                    <button
                      onClick={() => setShowChat(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        Chat about <strong>{currentIntent}</strong> intent, <strong>{currentStep}</strong> step
                      </p>
                      <p className="text-xs text-gray-500">
                        Ask questions or get help with this part of your project.
                      </p>
                    </div>
                    {/* Chat messages would go here */}
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                      Chat interface will be integrated here
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask a question..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowChat(true)}
                  className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  title="Open chat"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </WorkspaceCanvas>
        }
        contextRail={
          <ContextRail
            projectId={projectId}
            project={project}
            currentIntent={currentIntent}
            currentStep={currentStep}
            gateStatus={gateStatus}
          />
        }
      />
    </div>
  );
}
