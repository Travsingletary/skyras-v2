'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Track your projects, files, workflows, and agent activity
            </p>
          </div>
          <Link
            href="/studio"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Back to Studio
          </Link>
        </header>

        {/* Dashboard */}
        {userId ? (
          <AnalyticsDashboard userId={userId} />
        ) : (
          <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
            <p className="text-zinc-600">Loading user session...</p>
          </div>
        )}
      </div>
    </div>
  );
}
