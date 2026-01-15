'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StudioError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Studio Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">SkyRas Studio Control Room</h1>
            <p className="text-sm text-zinc-600">
              Error occurred
            </p>
          </div>
        </header>

        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-red-900 mb-3">Something went wrong</h2>
          <div className="bg-white rounded-lg p-4 border border-red-100 mb-4">
            <p className="text-sm text-red-700 font-mono mb-2">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/studio"
              className="rounded-lg bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Reload page
            </Link>
          </div>
        </div>

        {/* Build Stamp - Fixed bottom-left */}
        <div className="fixed bottom-4 left-4 text-xs text-zinc-400 font-mono bg-white/80 backdrop-blur-sm px-2 py-1 rounded border border-zinc-200">
          STUDIO_CONTROL_ROOM_V1 — 2026-01-08
        </div>
      </div>
    </div>
  );
}
