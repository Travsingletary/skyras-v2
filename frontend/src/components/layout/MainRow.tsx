'use client';

interface MainRowProps {
  commandSurface: React.ReactNode;
  workspaceCanvas: React.ReactNode;
  contextRail: React.ReactNode;
}

export function MainRow({ commandSurface, workspaceCanvas, contextRail }: MainRowProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* CommandSurface - Left */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {commandSurface}
      </aside>

      {/* WorkspaceCanvas - Center */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {workspaceCanvas}
      </main>

      {/* ContextRail - Right */}
      <aside className="w-80 border-l border-gray-200 bg-white flex flex-col">
        {contextRail}
      </aside>
    </div>
  );
}
