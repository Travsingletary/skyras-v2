'use client';

import { useState } from 'react';

interface VideoPlayerCardProps {
  videoUrl: string;
  jobId?: string;
  className?: string;
}

export function VideoPlayerCard({
  videoUrl,
  jobId,
  className,
}: VideoPlayerCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load video');
  };

  return (
    <div className={className}>
      <div className="relative rounded-lg bg-gray-100 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        {error ? (
          <div className="flex items-center justify-center p-8 text-red-600">
            {error}
          </div>
        ) : (
          <video
            src={videoUrl}
            controls
            className="w-full h-auto"
            onLoadedData={handleLoad}
            onError={handleError}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      {jobId && (
        <p className="mt-2 text-xs text-gray-500">Job ID: {jobId}</p>
      )}
    </div>
  );
}
