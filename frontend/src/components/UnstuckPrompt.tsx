"use client";

interface UnstuckPromptProps {
  onLogin: () => void;
}

export default function UnstuckPrompt({ onLogin }: UnstuckPromptProps) {
  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          Want to save this and get the next step when you come back?
        </h3>
        <p className="text-sm text-zinc-600 mb-4">
          Sign up to keep your progress and continue where you left off.
        </p>
        <button
          onClick={onLogin}
          className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Sign Up to Continue
        </button>
        <p className="text-xs text-zinc-500 mt-3">
          Or continue without saving (this action won't be remembered)
        </p>
      </div>
    </div>
  );
}
