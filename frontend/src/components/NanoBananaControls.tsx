'use client';

import { useState } from 'react';
import { Loader2, Image as ImageIcon, Film, Zap, WrenchIcon } from 'lucide-react';

type NanoBananaMode = 'character' | 'storyboard' | 'upscale' | 'drift';

interface NanoBananaControlsProps {
  projectId?: string;
  onGenerate?: (result: any) => void;
}

export function NanoBananaControls({ projectId, onGenerate }: NanoBananaControlsProps) {
  const [mode, setMode] = useState<NanoBananaMode>('character');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Character Sheet state
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [characterStyle, setCharacterStyle] = useState('realistic');

  // Storyboard state
  const [storyboardPrompt, setStoryboardPrompt] = useState('');
  const [frameCount, setFrameCount] = useState(9);
  const [storyboardResolution, setStoryboardResolution] = useState<'4k' | '2k' | '1080p'>('4k');
  const [characterSheetUrl, setCharacterSheetUrl] = useState('');

  // Upscale state
  const [imageToUpscale, setImageToUpscale] = useState('');
  const [upscaleResolution, setUpscaleResolution] = useState<'4k' | '8k'>('4k');

  // Drift Fix state
  const [driftImageUrl, setDriftImageUrl] = useState('');
  const [driftCharacterSheetUrl, setDriftCharacterSheetUrl] = useState('');
  const [driftIssue, setDriftIssue] = useState<'face' | 'props' | 'style'>('face');
  const [driftDescription, setDriftDescription] = useState('');

  const handleGenerateCharacter = async () => {
    if (!characterPrompt.trim()) {
      setError('Please enter a character prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/nanobanana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'character_sheet',
          prompt: characterPrompt,
          characterDescription,
          style: characterStyle,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        onGenerate?.(data);
      } else {
        setError(data.error || 'Failed to generate character sheet');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!storyboardPrompt.trim()) {
      setError('Please enter a storyboard prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/nanobanana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'storyboard',
          prompt: storyboardPrompt,
          characterSheetUrl: characterSheetUrl || undefined,
          frameCount,
          resolution: storyboardResolution,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        onGenerate?.(data);
      } else {
        setError(data.error || 'Failed to generate storyboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!imageToUpscale.trim()) {
      setError('Please provide an image URL to upscale');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/nanobanana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'upscale',
          imageUrl: imageToUpscale,
          targetResolution: upscaleResolution,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        onGenerate?.(data);
      } else {
        setError(data.error || 'Failed to upscale image');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixDrift = async () => {
    if (!driftImageUrl.trim() || !driftCharacterSheetUrl.trim()) {
      setError('Please provide both image URL and character sheet URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/nanobanana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fix_drift',
          imageUrl: driftImageUrl,
          characterSheetUrl: driftCharacterSheetUrl,
          issue: driftIssue,
          description: driftDescription || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        onGenerate?.(data);
      } else {
        setError(data.error || 'Failed to fix drift');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-zinc-200">
        <button
          onClick={() => setMode('character')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'character'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Character Sheet
        </button>
        <button
          onClick={() => setMode('storyboard')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'storyboard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <Film className="h-4 w-4" />
          Storyboard
        </button>
        <button
          onClick={() => setMode('upscale')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'upscale'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <Zap className="h-4 w-4" />
          Upscale
        </button>
        <button
          onClick={() => setMode('drift')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'drift'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <WrenchIcon className="h-4 w-4" />
          Fix Drift
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Character Sheet Panel */}
      {mode === 'character' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Character Prompt *
            </label>
            <textarea
              value={characterPrompt}
              onChange={(e) => setCharacterPrompt(e.target.value)}
              placeholder="Describe your character in detail (e.g., 'A brave knight with silver armor and a red cape')"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Additional Description (Optional)
            </label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="Additional details about personality, backstory, etc."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Style</label>
            <select
              value={characterStyle}
              onChange={(e) => setCharacterStyle(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="realistic">Realistic</option>
              <option value="anime">Anime</option>
              <option value="cartoon">Cartoon</option>
              <option value="3d">3D Render</option>
              <option value="pixar">Pixar Style</option>
              <option value="comic">Comic Book</option>
            </select>
          </div>

          <button
            onClick={handleGenerateCharacter}
            disabled={loading || !characterPrompt.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Character Sheet...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Generate Character Sheet
              </>
            )}
          </button>
        </div>
      )}

      {/* Storyboard Panel */}
      {mode === 'storyboard' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Storyboard Prompt *
            </label>
            <textarea
              value={storyboardPrompt}
              onChange={(e) => setStoryboardPrompt(e.target.value)}
              placeholder="Describe the story or scene (e.g., 'A hero's journey through a mystical forest, encountering magical creatures')"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Character Sheet URL (Optional)
            </label>
            <input
              type="text"
              value={characterSheetUrl}
              onChange={(e) => setCharacterSheetUrl(e.target.value)}
              placeholder="https://... (leave empty to use without character reference)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Use a previously generated character sheet for consistency
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Frame Count: {frameCount}
              </label>
              <input
                type="range"
                min="9"
                max="12"
                value={frameCount}
                onChange={(e) => setFrameCount(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-zinc-500">9-12 frames</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Resolution</label>
              <select
                value={storyboardResolution}
                onChange={(e) => setStoryboardResolution(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="4k">4K (3840x2160)</option>
                <option value="2k">2K (2560x1440)</option>
                <option value="1080p">1080p (1920x1080)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateStoryboard}
            disabled={loading || !storyboardPrompt.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Storyboard...
              </>
            ) : (
              <>
                <Film className="h-4 w-4" />
                Generate {frameCount}-Frame Storyboard
              </>
            )}
          </button>
        </div>
      )}

      {/* Upscale Panel */}
      {mode === 'upscale' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Image URL to Upscale *
            </label>
            <input
              type="text"
              value={imageToUpscale}
              onChange={(e) => setImageToUpscale(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Target Resolution
            </label>
            <select
              value={upscaleResolution}
              onChange={(e) => setUpscaleResolution(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4k">4K (3840x2160)</option>
              <option value="8k">8K (7680x4320)</option>
            </select>
          </div>

          <button
            onClick={handleUpscale}
            disabled={loading || !imageToUpscale.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upscaling to {upscaleResolution.toUpperCase()}...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Upscale to {upscaleResolution.toUpperCase()}
              </>
            )}
          </button>
        </div>
      )}

      {/* Drift Fix Panel */}
      {mode === 'drift' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Image URL with Drift *
            </label>
            <input
              type="text"
              value={driftImageUrl}
              onChange={(e) => setDriftImageUrl(e.target.value)}
              placeholder="https://... (image that needs fixing)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Character Sheet URL *
            </label>
            <input
              type="text"
              value={driftCharacterSheetUrl}
              onChange={(e) => setDriftCharacterSheetUrl(e.target.value)}
              placeholder="https://... (original character sheet for reference)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Issue Type
            </label>
            <select
              value={driftIssue}
              onChange={(e) => setDriftIssue(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="face">Face Inconsistency</option>
              <option value="props">Props/Objects Issue</option>
              <option value="style">Style Drift</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={driftDescription}
              onChange={(e) => setDriftDescription(e.target.value)}
              placeholder="Describe what's wrong (e.g., 'Face looks different from character sheet')"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <button
            onClick={handleFixDrift}
            disabled={loading || !driftImageUrl.trim() || !driftCharacterSheetUrl.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fixing Drift...
              </>
            ) : (
              <>
                <WrenchIcon className="h-4 w-4" />
                Fix Drift
              </>
            )}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="text-sm font-medium text-zinc-900 mb-3">Result</h3>
          <div className="space-y-2">
            {result.characterSheetUrl && (
              <div>
                <p className="text-xs font-medium text-zinc-700 mb-1">Character Sheet:</p>
                <a
                  href={result.characterSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {result.characterSheetUrl}
                </a>
              </div>
            )}
            {result.storyboardUrl && (
              <div>
                <p className="text-xs font-medium text-zinc-700 mb-1">Storyboard:</p>
                <a
                  href={result.storyboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {result.storyboardUrl}
                </a>
              </div>
            )}
            {result.upscaledUrl && (
              <div>
                <p className="text-xs font-medium text-zinc-700 mb-1">Upscaled Image:</p>
                <a
                  href={result.upscaledUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {result.upscaledUrl}
                </a>
              </div>
            )}
            {result.fixedUrl && (
              <div>
                <p className="text-xs font-medium text-zinc-700 mb-1">Fixed Image:</p>
                <a
                  href={result.fixedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {result.fixedUrl}
                </a>
              </div>
            )}
            {result.frames && result.frames.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-700 mb-1">
                  Storyboard Frames ({result.frames.length}):
                </p>
                <div className="space-y-1">
                  {result.frames.map((frame: any, idx: number) => (
                    <a
                      key={idx}
                      href={frame.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-600 hover:underline"
                    >
                      Frame {frame.index + 1}
                      {frame.description && `: ${frame.description}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
