"use client";

interface AuthLoadingProps {
  message?: string;
}

export default function AuthLoading({ message = "Loading..." }: AuthLoadingProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-zinc-600">{message}</p>
      </div>
    </div>
  );
}