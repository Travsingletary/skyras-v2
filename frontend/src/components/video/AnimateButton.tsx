'use client';

import { useState } from 'react';

// Generate UUID for client request ID
function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface AnimateButtonProps {
  imageId?: string;
  imageUrl?: string;
  sourceImagePath?: string;
  onJobCreated?: (jobId: string) => void;
  className?: string;
}

export function AnimateButton({
  imageId,
  imageUrl,
  sourceImagePath,
  onJobCreated,
  className,
}: AnimateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnimate = async () => {
    setLoading(true);
    setError(null);

    // Generate client request ID to prevent duplicate requests
    const clientRequestId = generateUUID();

    try {
      const response = await fetch('/api/video/animate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          sourceImageUrl: imageUrl,
          sourceImagePath,
          clientRequestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Daily quota exceeded. ${data.details?.remaining || 0} animations remaining.`);
        } else {
          setError(data.error || 'Failed to start animation');
        }
        return;
      }

      if (data.success && data.data?.jobId) {
        onJobCreated?.(data.data.jobId);
      } else {
        setError('Failed to create animation job');
      }
    } catch (err) {
      console.error('[AnimateButton] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start animation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleAnimate}
        disabled={loading || (!imageId && !imageUrl && !sourceImagePath)}
        className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 font-medium hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Animating...' : 'Animate'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
