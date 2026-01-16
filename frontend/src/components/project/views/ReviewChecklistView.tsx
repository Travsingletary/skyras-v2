'use client';

import { useEffect, useState } from 'react';
import { projectsDb, styleCardsDb, storyboardFramesDb } from '@/lib/database';
import type { Project } from '@/types/database';
import Link from 'next/link';

interface ReviewChecklistViewProps {
  projectId: string;
  userId: string;
  onContinue: () => void;
  onUpdate?: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'checking';
  linkTo?: { step: string; label: string };
  details?: string;
}

export function ReviewChecklistView({ projectId, userId, onContinue, onUpdate }: ReviewChecklistViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAndCheckProject();
  }, [projectId]);

  const loadAndCheckProject = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project
      const projectData = await projectsDb.getById(projectId);
      if (!projectData) {
        setError('Project not found');
        return;
      }
      setProject(projectData);

      // Build checklist
      const items: ChecklistItem[] = [];

      // 1. Foundation Complete
      const hasName = !!projectData.name && projectData.name.trim().length > 0;
      const hasIntent = !!projectData.metadata?.intent && projectData.metadata.intent.trim().length > 0;
      const foundationComplete = hasName && hasIntent;

      items.push({
        id: 'foundation',
        label: 'Foundation Complete',
        description: 'Project has name and intent defined',
        status: foundationComplete ? 'pass' : 'fail',
        linkTo: foundationComplete ? undefined : { step: 'foundation', label: 'Go to Foundation' },
        details: foundationComplete
          ? `Name: "${projectData.name}", Intent: "${projectData.metadata.intent}"`
          : 'Missing project name or intent',
      });

      // 2. Structure has >= 1 section
      const outline = projectData.metadata?.outline || [];
      const hasOutline = Array.isArray(outline) && outline.length > 0;

      items.push({
        id: 'structure',
        label: 'Structure Defined',
        description: 'Project has at least one content section',
        status: hasOutline ? 'pass' : 'fail',
        linkTo: hasOutline ? undefined : { step: 'structure', label: 'Go to Structure' },
        details: hasOutline
          ? `${outline.length} section${outline.length > 1 ? 's' : ''} defined`
          : 'No content sections created',
      });

      // 3. Approved Style Card exists
      const approvedStyleCard = await styleCardsDb.getApprovedByProjectId(projectId);
      const hasApprovedStyleCard = !!approvedStyleCard;

      items.push({
        id: 'style-card',
        label: 'Approved Style Card',
        description: 'Style Card has been created and approved',
        status: hasApprovedStyleCard ? 'pass' : 'fail',
        linkTo: hasApprovedStyleCard ? undefined : { step: 'style-card', label: 'Go to Style Card' },
        details: hasApprovedStyleCard
          ? 'Style Card approved'
          : 'Create and approve a Style Card',
      });

      // 4. Storyboard frames generated and all approved (REQUIRED: >= 1 frame)
      const storyboardFrames = await storyboardFramesDb.getByProjectId(projectId);
      const totalFrames = storyboardFrames?.length || 0;
      const approvedFrames = storyboardFrames?.filter(f => f.approval_status === 'approved').length || 0;

      let storyboardStatus: 'pass' | 'fail' = 'fail';
      let storyboardDetails = 'Generate at least 1 frame to proceed';

      if (totalFrames === 0) {
        // FAIL: No frames generated yet
        storyboardStatus = 'fail';
        storyboardDetails = 'Generate at least 1 frame to proceed';
      } else if (approvedFrames === totalFrames) {
        // PASS: All frames approved
        storyboardStatus = 'pass';
        storyboardDetails = `All ${totalFrames} frame${totalFrames > 1 ? 's' : ''} approved`;
      } else {
        // FAIL: Some frames unapproved
        storyboardStatus = 'fail';
        storyboardDetails = `Only ${approvedFrames} of ${totalFrames} frames approved`;
      }

      items.push({
        id: 'storyboard',
        label: 'Storyboard Frames Generated',
        description: 'At least 1 storyboard frame generated and all frames approved',
        status: storyboardStatus,
        linkTo: storyboardStatus === 'fail' ? { step: 'storyboard', label: 'Go to Storyboard' } : undefined,
        details: storyboardDetails,
      });

      setChecklist(items);
    } catch (err) {
      console.error('Failed to load review checklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const allChecksPassed = checklist.every(item => item.status === 'pass');
  const passedCount = checklist.filter(item => item.status === 'pass').length;
  const totalCount = checklist.length;

  const handleContinue = () => {
    if (!allChecksPassed) {
      setError('Please complete all checklist items before continuing');
      return;
    }
    onContinue();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading checklist...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Step 4
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Review</h1>
            <span className="ml-auto text-xs text-gray-400 font-mono" title="Build version">
              v2026.01.16-policy
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            Verify that all prerequisites are complete before moving to final video generation.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Checklist Progress
            </span>
            <span className="text-sm font-medium text-gray-700">
              {passedCount} / {totalCount} complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                allChecksPassed ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${(passedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-4 mb-8">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`border-2 rounded-lg p-6 transition-all ${
                item.status === 'pass'
                  ? 'border-green-500 bg-green-50'
                  : item.status === 'fail'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {item.status === 'pass' ? (
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : item.status === 'fail' ? (
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-400 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    {item.details && (
                      <p className="text-sm text-gray-700 font-medium">{item.details}</p>
                    )}
                  </div>
                </div>

                {/* Action Link */}
                {item.linkTo && (
                  <Link
                    href={`/projects/${projectId}?intent=create&step=${item.linkTo.step}`}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    {item.linkTo.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Banner */}
        {allChecksPassed ? (
          <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Ready to Continue!</h3>
                <p className="mt-1 text-sm text-green-700">
                  All prerequisites are complete. You can now proceed to Step 5 to generate and finalize your video.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">Action Required</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Complete all checklist items above before continuing. Use the action buttons to navigate to incomplete steps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={handleContinue}
            disabled={!allChecksPassed}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              allChecksPassed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
            title={allChecksPassed ? 'Continue to Step 5' : 'Complete all checklist items to continue'}
          >
            Continue to Step 5: Finish
          </button>
          {!allChecksPassed && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Complete {totalCount - passedCount} remaining item{totalCount - passedCount > 1 ? 's' : ''} to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
