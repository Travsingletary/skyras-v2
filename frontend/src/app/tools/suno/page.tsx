'use client';

import { SunoControls } from '@/components/SunoControls';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SunoToolsPage() {
  const handleGenerate = (result: any) => {
    console.log('Suno music generation complete:', result);
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
            Suno AI Music Generation
          </h1>
          <p className="text-zinc-600">
            Create custom music tracks and songs with AI-powered composition
          </p>
        </div>

        {/* Tools Card */}
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm p-6">
          <SunoControls onGenerate={handleGenerate} />
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            About Suno AI Music
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>AI Composition Mode:</strong> Let AI create original music based on your
              description. Perfect for background music, soundtracks, and instrumental pieces.
              Simply describe the vibe, instruments, and feel you want.
            </div>
            <div>
              <strong>Lyrics Mode:</strong> Generate complete songs with vocals based on your
              lyrics. Provide your lyrics and song description, and Suno will compose the music
              and perform the vocals to match your words.
            </div>
            <div>
              <strong>Music Styles:</strong> Choose from 12 different genres including Pop, Rock,
              Electronic, Classical, Jazz, Hip-Hop, Ambient, Cinematic, Folk, Indie, R&B, and
              Country. Each style brings unique instrumentation and production characteristics.
            </div>
            <div>
              <strong>Mood Control:</strong> Set the emotional tone with 10 different moods
              ranging from Happy and Uplifting to Melancholic and Dramatic. The AI adjusts tempo,
              harmony, and dynamics to match.
            </div>
            <div>
              <strong>Flexible Duration:</strong> Generate tracks from 30 seconds up to 3 minutes
              in 15-second increments. Perfect for everything from short jingles to full-length
              songs.
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50 p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-3">
            Common Use Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-purple-800">
            <div>
              <strong className="block mb-1">Video Soundtracks:</strong>
              Create custom background music that perfectly matches your video content's mood and
              pacing.
            </div>
            <div>
              <strong className="block mb-1">Podcast Intros/Outros:</strong>
              Generate unique theme music that represents your podcast's brand and personality.
            </div>
            <div>
              <strong className="block mb-1">Commercial Jingles:</strong>
              Produce catchy, memorable tunes for advertising and marketing campaigns.
            </div>
            <div>
              <strong className="block mb-1">Game Audio:</strong>
              Create atmospheric music for different game levels, menus, and cutscenes.
            </div>
            <div>
              <strong className="block mb-1">Social Media Content:</strong>
              Add original music to your posts, stories, and reels without copyright concerns.
            </div>
            <div>
              <strong className="block mb-1">Meditation & Wellness:</strong>
              Generate calming, ambient soundscapes for relaxation and mindfulness content.
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">
            Pro Tips
          </h2>
          <ul className="space-y-2 text-sm text-amber-800 list-disc list-inside">
            <li>
              Be specific in your music description - mention instruments, tempo, and references
              (e.g., "Fast-paced electronic with driving bass like Daft Punk")
            </li>
            <li>
              For lyrics mode, structure your lyrics clearly with verse/chorus labels to help the
              AI understand the song structure
            </li>
            <li>
              Combine multiple moods by mentioning them in your description (e.g., "mysterious yet
              uplifting")
            </li>
            <li>
              Start with shorter durations (30-60s) to test concepts before generating longer
              tracks
            </li>
            <li>
              Experiment with unusual style/mood combinations for unique sounds (e.g., "aggressive
              classical" or "calm hip-hop")
            </li>
            <li>
              Use cinematic style for epic, sweeping soundtracks and ambient for background music
              that won't distract from dialogue
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
