'use client';

import { useState } from 'react';
import { Loader2, Video, Image as ImageIcon, Sparkles } from 'lucide-react';

type KlingModel = '2.5-turbo' | '1.0' | '2.6';
type GenerationMode = 'text' | 'image';

interface KlingVideoControlsProps {
  onGenerate?: (result: any) => void;
}

export function KlingVideoControls({ onGenerate }: KlingVideoControlsProps) {
  const [model, setModel] = useState<KlingModel>('2.5-turbo');
  const [mode, setMode] = useState<GenerationMode>('text');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Post-production settings
  const [enablePostProd, setEnablePostProd] = useState(false);
  const [lighting, setLighting] = useState('natural');
  const [weather, setWeather] = useState('clear');
  const [cameraAngle, setCameraAngle] = useState('eye-level');

  const handleGenerate = async () => {
    if (mode === 'text' && !prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (mode === 'image' && (!prompt.trim() || !imageUrl.trim())) {
      setError('Please provide both a prompt and image URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestBody: any = {
        prompt,
        model,
        duration,
        aspectRatio,
      };

      if (mode === 'image') {
        requestBody.imageUrl = imageUrl;
      }

      if (enablePostProd) {
        requestBody.postProduction = {
          lighting,
          weather,
          cameraAngle,
        };
      }

      const response = await fetch('/api/tools/generateVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success || data.videoUrl) {
        setResult(data);
        onGenerate?.(data);
      } else {
        setError(data.error || 'Failed to generate video');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Kling AI Model
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['2.5-turbo', '1.0', '2.6'] as KlingModel[]).map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                model === m
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="font-semibold">Kling {m}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {m === '2.5-turbo' && 'Fast'}
                {m === '1.0' && 'Quality'}
                {m === '2.6' && 'Latest'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Generation Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              mode === 'text'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Text to Video
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              mode === 'image'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Image to Video
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          {mode === 'text' ? 'Video Description' : 'Motion Description'} *
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'text'
              ? 'Describe the video you want to create...'
              : 'Describe how the image should move or animate...'
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Image URL (for image-to-video mode) */}
      {mode === 'image' && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Source Image URL *
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Duration and Aspect Ratio */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Duration: {duration}s
          </label>
          <input
            type="range"
            min="5"
            max="10"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-zinc-500">5s or 10s</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Aspect Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="3:4">3:4 (Portrait)</option>
          </select>
        </div>
      </div>

      {/* Post-Production Controls */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-zinc-700">
            Post-Production Editing
          </label>
          <button
            onClick={() => setEnablePostProd(!enablePostProd)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              enablePostProd
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 text-zinc-700'
            }`}
          >
            {enablePostProd ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {enablePostProd && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Lighting
              </label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="natural">Natural</option>
                <option value="studio">Studio</option>
                <option value="dramatic">Dramatic</option>
                <option value="soft">Soft</option>
                <option value="golden-hour">Golden Hour</option>
                <option value="blue-hour">Blue Hour</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Weather
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="clear">Clear</option>
                <option value="rainy">Rainy</option>
                <option value="foggy">Foggy</option>
                <option value="snowy">Snowy</option>
                <option value="cloudy">Cloudy</option>
                <option value="stormy">Stormy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Camera Angle
              </label>
              <select
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="eye-level">Eye Level</option>
                <option value="low">Low Angle</option>
                <option value="high">High Angle</option>
                <option value="aerial">Aerial</option>
                <option value="dutch">Dutch Tilt</option>
                <option value="pov">POV</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim() || (mode === 'image' && !imageUrl.trim())}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Video (this may take a few minutes)...
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            Generate {duration}s Video
          </>
        )}
      </button>

      {/* Result Display */}
      {result && !loading && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-3">
            Video Generated Successfully!
          </h3>
          {result.videoUrl && (
            <div className="space-y-2">
              <video
                src={result.videoUrl}
                controls
                className="w-full rounded-lg"
              />
              <a
                href={result.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block"
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
