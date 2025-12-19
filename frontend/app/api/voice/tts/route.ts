import { NextRequest, NextResponse } from 'next/server';
import { getTTSProvider } from '@/lib/tts';

/**
 * POST /api/voice/tts - Text-to-Speech (Provider Agnostic)
 *
 * Supports: OpenAI TTS (default), ElevenLabs (premium)
 * Provider selection: TTS_PROVIDER env var (openai|elevenlabs)
 *
 * Body:
 * - text: string (required) - Text to convert to speech
 * - voiceId: string (optional) - Voice ID (depends on provider)
 * - provider: string (optional) - Override provider (openai|elevenlabs)
 * - speed: number (optional) - Speech speed (0.25-4.0 for OpenAI)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      voiceId,
      provider: requestedProvider,
      speed
    } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Text is required',
        },
        { status: 400 }
      );
    }

    // Get TTS provider (with optional override)
    const ttsProvider = getTTSProvider(requestedProvider);

    if (!ttsProvider.isAvailable()) {
      console.warn('[TTS] No TTS provider available');
      return NextResponse.json(
        {
          success: false,
          error: 'Text-to-speech is not configured. Please set OPENAI_API_KEY or ELEVENLABS_API_KEY.',
        },
        { status: 503 }
      );
    }

    console.log('[TTS] Using provider:', ttsProvider.name);
    console.log('[TTS] Cost per 1000 chars:', `$${(ttsProvider.getCostPer1000Chars() / 100).toFixed(4)}`);

    // Generate speech using provider
    // Only pass voiceId/speed if explicitly provided, let provider use its defaults otherwise
    const audioData = await ttsProvider.generateSpeech({
      text,
      ...(voiceId && { voiceId }),
      ...(speed && { speed }),
    });

    // Handle both ArrayBuffer and ReadableStream
    if (audioData instanceof ReadableStream) {
      return new NextResponse(audioData, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-TTS-Provider': ttsProvider.name,
          'X-TTS-Cost-Per-1K': ttsProvider.getCostPer1000Chars().toString(),
        },
      });
    }

    // ArrayBuffer
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        'X-TTS-Provider': ttsProvider.name,
        'X-TTS-Cost-Per-1K': ttsProvider.getCostPer1000Chars().toString(),
      },
    });
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Text-to-speech failed',
      },
      { status: 500 }
    );
  }
}

