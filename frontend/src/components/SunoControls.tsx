'use client';

import { useState } from 'react';
import { Loader2, Music, FileText, Sparkles } from 'lucide-react';

type MusicStyle =
  | 'pop'
  | 'rock'
  | 'electronic'
  | 'classical'
  | 'jazz'
  | 'hip-hop'
  | 'ambient'
  | 'cinematic'
  | 'folk'
  | 'indie'
  | 'r&b'
  | 'country';

type MusicMood =
  | 'happy'
  | 'sad'
  | 'energetic'
  | 'calm'
  | 'dramatic'
  | 'uplifting'
  | 'melancholic'
  | 'mysterious'
  | 'romantic'
  | 'aggressive';

interface SunoControlsProps {
  onGenerate?: (result: any) => void;
}

export function SunoControls({ onGenerate }: SunoControlsProps) {
  const [mode, setMode] = useState<'prompt' | 'lyrics'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState<MusicStyle>('pop');
  const [mood, setMood] = useState<MusicMood>('happy');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the music you want');
      return;
    }

    if (mode === 'lyrics' && !lyrics.trim()) {
      setError('Please enter lyrics for the song');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestBody: any = {
        prompt,
        style,
        mood,
        durationSeconds: duration,
      };

      if (mode === 'lyrics') {
        requestBody.lyrics = lyrics;
      }

      const response = await fetch('/api/tools/suno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.music) {
        setResult(data.music);
        onGenerate?.(data.music);
      } else {
        setError(data.error || 'Failed to generate music');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const musicStyles: Array<{ value: MusicStyle; label: string; description: string }> = [
    { value: 'pop', label: 'Pop', description: 'Catchy, mainstream' },
    { value: 'rock', label: 'Rock', description: 'Guitars, drums, energy' },
    { value: 'electronic', label: 'Electronic', description: 'Synths, beats, digital' },
    { value: 'classical', label: 'Classical', description: 'Orchestra, piano, strings' },
    { value: 'jazz', label: 'Jazz', description: 'Smooth, improvised' },
    { value: 'hip-hop', label: 'Hip-Hop', description: 'Beats, rap-ready' },
    { value: 'ambient', label: 'Ambient', description: 'Atmospheric, relaxing' },
    { value: 'cinematic', label: 'Cinematic', description: 'Epic, storytelling' },
    { value: 'folk', label: 'Folk', description: 'Acoustic, traditional' },
    { value: 'indie', label: 'Indie', description: 'Alternative, unique' },
    { value: 'r&b', label: 'R&B', description: 'Soulful, groovy' },
    { value: 'country', label: 'Country', description: 'Twang, storytelling' },
  ];

  const musicMoods: Array<{ value: MusicMood; label: string }> = [
    { value: 'happy', label: 'Happy' },
    { value: 'sad', label: 'Sad' },
    { value: 'energetic', label: 'Energetic' },
    { value: 'calm', label: 'Calm' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'uplifting', label: 'Uplifting' },
    { value: 'melancholic', label: 'Melancholic' },
    { value: 'mysterious', label: 'Mysterious' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'aggressive', label: 'Aggressive' },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Generation Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('prompt')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              mode === 'prompt'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Composition
          </button>
          <button
            onClick={() => setMode('lyrics')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              mode === 'lyrics'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            With Lyrics
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Music Description */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Music Description *
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'prompt'
              ? 'Describe the music you want (e.g., "Upbeat summer vibes with tropical guitars and steel drums")'
              : 'Describe the song style and theme (e.g., "Heartfelt ballad about lost love")'
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Lyrics Input (only in lyrics mode) */}
      {mode === 'lyrics' && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Song Lyrics *
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Enter your song lyrics here...&#10;&#10;Verse 1:&#10;...&#10;&#10;Chorus:&#10;..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={8}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Tip: Structure your lyrics with verse/chorus labels for best results
          </p>
        </div>
      )}

      {/* Style Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Music Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {musicStyles.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                style === s.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="font-semibold">{s.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mood Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Mood
        </label>
        <div className="grid grid-cols-5 gap-2">
          {musicMoods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                mood === m.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Slider */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Duration: {duration}s ({Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')})
        </label>
        <input
          type="range"
          min="30"
          max="180"
          step="15"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>30s</span>
          <span>1 min</span>
          <span>2 min</span>
          <span>3 min</span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim() || (mode === 'lyrics' && !lyrics.trim())}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Music (this may take a few minutes)...
          </>
        ) : (
          <>
            <Music className="h-4 w-4" />
            Generate {duration}s Music Track
          </>
        )}
      </button>

      {/* Result Display */}
      {result && !loading && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-3">
            Music Generated Successfully!
          </h3>
          {result.audioUrl && (
            <div className="space-y-3">
              <audio
                src={result.audioUrl}
                controls
                className="w-full"
                controlsList="nodownload"
              />
              <div className="flex items-center justify-between">
                <a
                  href={result.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open in new tab
                </a>
                {result.metadata && (
                  <div className="text-xs text-green-700">
                    {result.metadata.style} • {result.metadata.mood} •{' '}
                    {result.metadata.duration}s
                  </div>
                )}
              </div>
              {result.qnapPath && (
                <p className="text-xs text-green-700">
                  Saved to storage: {result.qnapPath}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
