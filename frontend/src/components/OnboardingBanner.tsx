"use client";

interface OnboardingBannerProps {
  onRunDemo: () => void;
  loading?: boolean;
}

export default function OnboardingBanner({ onRunDemo, loading = false }: OnboardingBannerProps) {
  return (
    <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">
            Welcome to SkyRas v2
          </h2>
          <ul className="space-y-2 text-sm text-zinc-700 mb-4">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>AI agents work together to handle creative content, compliance, distribution, and cataloging</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Marcus orchestrates tasks and delegates to specialized agents (Giorgio, Cassidy, Jamal, Letitia)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Workflows track your projects and plans automatically as you interact with agents</span>
            </li>
          </ul>
          <button
            onClick={onRunDemo}
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running demo...
              </>
            ) : (
              <>
                🚀 Run Demo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
