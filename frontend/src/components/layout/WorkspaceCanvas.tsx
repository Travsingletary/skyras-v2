'use client';

interface WorkspaceCanvasProps {
  children: React.ReactNode;
}

export function WorkspaceCanvas({ children }: WorkspaceCanvasProps) {
  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
}
