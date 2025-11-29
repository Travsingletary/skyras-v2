"use client";

import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-zinc-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-800 mb-4">Page Not Found</h2>
        <p className="text-zinc-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
