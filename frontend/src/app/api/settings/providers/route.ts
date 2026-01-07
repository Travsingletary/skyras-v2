/**
 * Provider Settings API
 * Returns status of all configured providers
 */

import { NextResponse } from 'next/server';

interface ProviderInfo {
  name: string;
  configured: boolean;
  priority: number;
  capabilities: string[];
  envVars: string[];
}

export async function GET() {
  try {
    // Image providers
    const imagePriority = process.env.IMAGE_PROVIDER_PRIORITY || 'runway,stable-diffusion';
    const imageProviders = imagePriority.split(',').map((p) => p.trim());

    const imageProvidersData: ProviderInfo[] = [
      {
        name: 'runway',
        configured: !!process.env.RUNWAY_API_KEY,
        priority: imageProviders.indexOf('runway') + 1,
        capabilities: ['text-to-image', 'image-editing'],
        envVars: ['RUNWAY_API_KEY'],
      },
      {
        name: 'stable-diffusion',
        configured: !!process.env.STABLE_DIFFUSION_API_KEY || !!process.env.REPLICATE_API_KEY,
        priority: imageProviders.indexOf('stable-diffusion') + 1,
        capabilities: ['text-to-image', 'image-editing', 'controlnet'],
        envVars: ['STABLE_DIFFUSION_API_KEY', 'REPLICATE_API_KEY (alternative)'],
      },
    ];

    // Video providers
    const videoPriority = process.env.VIDEO_PROVIDER_PRIORITY || 'kling,runway';
    const videoProviders = videoPriority.split(',').map((p) => p.trim());

    const videoProvidersData: ProviderInfo[] = [
      {
        name: 'kling',
        configured: !!process.env.KLING_API_KEY,
        priority: videoProviders.indexOf('kling') + 1,
        capabilities: ['text-to-video', 'image-to-video', 'post-production', '3-models'],
        envVars: ['KLING_API_KEY'],
      },
      {
        name: 'runway',
        configured: !!process.env.RUNWAY_API_KEY,
        priority: videoProviders.indexOf('runway') + 1,
        capabilities: ['text-to-video', 'gen-2', 'gen-3'],
        envVars: ['RUNWAY_API_KEY'],
      },
    ];

    // Storage providers
    const storagePriority = process.env.DEFAULT_STORAGE_PROVIDER || 'supabase';

    const storageProvidersData: ProviderInfo[] = [
      {
        name: 'supabase',
        configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        priority: 1,
        capabilities: ['public-urls', 'signed-urls', 'rls', 'metadata'],
        envVars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      },
      {
        name: 'qnap',
        configured: !!(process.env.QNAP_HOST && process.env.QNAP_USERNAME && process.env.QNAP_PASSWORD),
        priority: 2,
        capabilities: ['nas-storage', 'local-network', 'high-capacity'],
        envVars: ['QNAP_HOST', 'QNAP_USERNAME', 'QNAP_PASSWORD', 'QNAP_SHARE'],
      },
      {
        name: 's3',
        configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET),
        priority: 3,
        capabilities: ['scalable', 'cdn', 'versioning', 'lifecycle'],
        envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'AWS_REGION'],
      },
      {
        name: 'local',
        configured: !!process.env.LOCAL_STORAGE_PATH,
        priority: 4,
        capabilities: ['local-filesystem', 'no-api-calls', 'development'],
        envVars: ['LOCAL_STORAGE_PATH'],
      },
    ];

    return NextResponse.json({
      image: imageProvidersData,
      video: videoProvidersData,
      storage: storageProvidersData,
      imagePriority,
      videoPriority,
      storagePriority,
    });
  } catch (error) {
    console.error('[Providers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider status' },
      { status: 500 }
    );
  }
}
