'use client';

import { KlingVideoControls } from '@/components/KlingVideoControls';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function KlingToolsPage() {
  const handleGenerate = (result: any) => {
    console.log('Kling video generation complete:', result);
    // Could save to database, show in gallery, etc.
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Kling AI Video Generation
          </h1>
          <p className="text-zinc-600">
            Advanced AI-powered video creation with multiple models and post-production controls
          </p>
        </div>

        {/* Tools Card */}
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm p-6">
          <KlingVideoControls onGenerate={handleGenerate} />
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            About Kling AI Models
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Kling 2.5-turbo:</strong> Optimized for speed with excellent quality.
              Perfect for quick iterations and testing concepts. Fastest generation times.
            </div>
            <div>
              <strong>Kling 1.0:</strong> Balanced model prioritizing quality and consistency.
              Best for production-ready content where visual fidelity matters most.
            </div>
            <div>
              <strong>Kling 2.6:</strong> Latest model with cutting-edge capabilities.
              Advanced motion understanding and improved detail preservation.
            </div>
            <div>
              <strong>Text-to-Video:</strong> Create videos from scratch using detailed text descriptions.
              The AI interprets your prompt to generate complete scenes with motion.
            </div>
            <div>
              <strong>Image-to-Video:</strong> Animate existing images with controlled motion.
              Provide a starting image and describe how it should move or transform.
            </div>
            <div>
              <strong>Post-Production:</strong> Fine-tune your videos with professional controls
              for lighting (natural, studio, dramatic, golden hour), weather conditions
              (clear, rainy, foggy, snowy), and camera angles (eye-level, aerial, POV, dutch tilt).
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">
            Pro Tips
          </h2>
          <ul className="space-y-2 text-sm text-amber-800 list-disc list-inside">
            <li>Start with 5-second videos to test concepts before generating 10-second versions</li>
            <li>Use specific, descriptive prompts for better results (e.g., "A red sports car drifting around a corner at sunset" vs "A car moving")</li>
            <li>For image-to-video, describe the motion clearly (e.g., "Camera slowly zooms in while the subject turns their head to the right")</li>
            <li>Post-production controls work best when they complement your prompt rather than contradict it</li>
            <li>Different aspect ratios serve different platforms: 16:9 for YouTube, 9:16 for TikTok/Reels, 1:1 for Instagram feed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
