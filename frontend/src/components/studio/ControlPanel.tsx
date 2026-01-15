import React from 'react';

interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
}

export function ControlPanel({
  title,
  children,
  actions,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
}: ControlPanelProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 bg-zinc-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-zinc-200 rounded animate-pulse w-1/2" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && empty && (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        </div>
      )}

      {!loading && !error && !empty && children}
    </div>
  );
}
