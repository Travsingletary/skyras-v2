'use client';

import { NanoBananaControls } from '@/components/NanoBananaControls';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NanoBananaToolsPage() {
  const handleGenerate = (result: any) => {
    console.log('NanoBanana generation complete:', result);
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
            NanoBanana Pro Tools
          </h1>
          <p className="text-zinc-600">
            Advanced character sheet generation, storyboards, upscaling, and drift fixing
          </p>
        </div>

        {/* Tools Card */}
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm p-6">
          <NanoBananaControls onGenerate={handleGenerate} />
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            About NanoBanana Pro
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Character Sheets:</strong> Generate consistent character designs with multiple
              angles and poses. Perfect for maintaining visual consistency across your project.
            </div>
            <div>
              <strong>Storyboards:</strong> Create 9-12 frame storyboards for your scenes. Use with
              character sheets for consistent character appearance throughout.
            </div>
            <div>
              <strong>Upscaling:</strong> Enhance images to 4K or 8K resolution while preserving
              detail and quality.
            </div>
            <div>
              <strong>Drift Fixing:</strong> Correct inconsistencies in generated images by
              referencing your original character sheets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
