'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, AlertCircle, Settings, Image, Video, HardDrive, RefreshCw } from 'lucide-react';

interface ProviderStatus {
  name: string;
  configured: boolean;
  priority: number;
  capabilities: string[];
  envVars: string[];
}

interface ProvidersData {
  image: ProviderStatus[];
  video: ProviderStatus[];
  storage: ProviderStatus[];
  imagePriority: string;
  videoPriority: string;
  storagePriority: string;
}

export default function ProvidersSettingsPage() {
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/providers');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (category: string, providerName: string) => {
    const key = `${category}-${providerName}`;
    setTesting(key);
    try {
      const response = await fetch('/api/settings/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, provider: providerName }),
      });
      const data = await response.json();
      setTestResults({
        ...testResults,
        [key]: { success: data.success, message: data.message },
      });
    } catch (error) {
      setTestResults({
        ...testResults,
        [key]: { success: false, message: 'Test failed' },
      });
    } finally {
      setTesting(null);
    }
  };

  const renderProviderCard = (
    category: 'image' | 'video' | 'storage',
    provider: ProviderStatus
  ) => {
    const key = `${category}-${provider.name}`;
    const testResult = testResults[key];
    const isConfigured = provider.configured;

    return (
      <div
        key={provider.name}
        className={`rounded-lg border-2 p-4 ${
          isConfigured
            ? 'border-green-200 bg-green-50'
            : 'border-zinc-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-zinc-900 capitalize">
              {provider.name}
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              Priority: #{provider.priority}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-zinc-400" />
            )}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <p className="text-xs font-medium text-zinc-600 mb-1">
              Capabilities:
            </p>
            <div className="flex flex-wrap gap-1">
              {provider.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-600 mb-1">
              Required Environment Variables:
            </p>
            <div className="space-y-1">
              {provider.envVars.map((envVar) => (
                <div key={envVar} className="flex items-center gap-2 text-xs">
                  <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono">
                    {envVar}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => testProvider(category, provider.name)}
            disabled={!isConfigured || testing === key}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-blue-600 text-blue-700 hover:bg-blue-50"
          >
            {testing === key ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Settings className="h-3 w-3" />
                Test Connection
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-2 p-2 rounded text-xs ${
              testResult.success
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-600">Loading provider status...</p>
        </div>
      </div>
    );
  }

  if (!providers) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-900 font-medium">Failed to load providers</p>
          <button
            onClick={fetchProviderStatus}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
            Provider Settings
          </h1>
          <p className="text-zinc-600">
            Configure and manage AI providers for image, video, and storage
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Provider Fallback Works</p>
              <p>
                When you request generation, the system tries providers in priority order.
                If the first provider fails or is not configured, it automatically falls
                back to the next one. You can control the order via environment variables.
              </p>
            </div>
          </div>
        </div>

        {/* Image Providers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-zinc-700" />
            <h2 className="text-xl font-bold text-zinc-900">Image Generation</h2>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-3">
            <p className="text-xs text-zinc-600 mb-1">Current Priority Order:</p>
            <code className="text-sm font-mono bg-zinc-100 px-2 py-1 rounded">
              IMAGE_PROVIDER_PRIORITY = {providers.imagePriority}
            </code>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.image.map((provider) => renderProviderCard('image', provider))}
          </div>
        </div>

        {/* Video Providers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-zinc-700" />
            <h2 className="text-xl font-bold text-zinc-900">Video Generation</h2>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-3">
            <p className="text-xs text-zinc-600 mb-1">Current Priority Order:</p>
            <code className="text-sm font-mono bg-zinc-100 px-2 py-1 rounded">
              VIDEO_PROVIDER_PRIORITY = {providers.videoPriority}
            </code>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.video.map((provider) => renderProviderCard('video', provider))}
          </div>
        </div>

        {/* Storage Providers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5 text-zinc-700" />
            <h2 className="text-xl font-bold text-zinc-900">Storage</h2>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 mb-3">
            <p className="text-xs text-zinc-600 mb-1">Current Default Provider:</p>
            <code className="text-sm font-mono bg-zinc-100 px-2 py-1 rounded">
              DEFAULT_STORAGE_PROVIDER = {providers.storagePriority}
            </code>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.storage.map((provider) => renderProviderCard('storage', provider))}
          </div>
        </div>

        {/* Configuration Instructions */}
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">
            Configuration Instructions
          </h3>
          <div className="space-y-3 text-sm text-amber-800">
            <p>
              To configure providers, add the required environment variables to your{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-100">.env.local</code> file:
            </p>
            <div className="space-y-2">
              <div>
                <strong>Priority Configuration:</strong>
                <pre className="mt-1 p-2 rounded bg-amber-100 overflow-x-auto text-xs">
{`IMAGE_PROVIDER_PRIORITY=runway,stable-diffusion
VIDEO_PROVIDER_PRIORITY=opentune,fal-pika,kling,runway
DEFAULT_STORAGE_PROVIDER=supabase`}
                </pre>
              </div>
              <div>
                <strong>API Keys:</strong>
                <pre className="mt-1 p-2 rounded bg-amber-100 overflow-x-auto text-xs">
{`RUNWAY_API_KEY=your-runway-key
OPENTUNE_API_KEY=your-opentune-key
FAL_KEY=your-fal-key
KLING_API_KEY=your-kling-key
STABLE_DIFFUSION_API_KEY=your-sd-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key`}
                </pre>
              </div>
            </div>
            <p className="text-xs">
              After updating environment variables, restart your development server for changes to take effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
