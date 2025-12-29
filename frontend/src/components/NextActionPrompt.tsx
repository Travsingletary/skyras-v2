"use client";

interface NextActionPromptProps {
  onStartAction: () => void;
  loading?: boolean;
  hasWorkflows?: boolean;
}

export default function NextActionPrompt({ 
  onStartAction, 
  loading = false,
  hasWorkflows = false 
}: NextActionPromptProps) {
  if (hasWorkflows) {
    // If user has workflows, show a simple prompt to continue
    return (
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">
            What would you like to work on?
          </h2>
          <p className="text-sm text-zinc-600 mb-4">
            Tell us what you need help with, and we'll give you one clear next step.
          </p>
          <button
            onClick={onStartAction}
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Get Started"}
          </button>
        </div>
      </div>
    );
  }

  // First-time user: simple, clear prompt
  return (
    <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-zinc-900 mb-3">
          Welcome to SkyRas
        </h2>
        <p className="text-sm text-zinc-600 mb-6">
          We help you reduce creative overwhelm by giving you one clear next action.
        </p>
        <p className="text-base font-medium text-zinc-900 mb-6">
          What do you need help with right now?
        </p>
        <button
          onClick={onStartAction}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? "Loading..." : "Tell Me What to Do Next"}
        </button>
      </div>
    </div>
  );
}
