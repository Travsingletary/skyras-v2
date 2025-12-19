import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/voice/voices - Get available ElevenLabs voices
 */
export async function GET(request: NextRequest) {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'ElevenLabs API key not configured',
        },
        { status: 503 }
      );
    }

    // Call ElevenLabs API to get voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Voices] ElevenLabs API error:', response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `ElevenLabs API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      voices: data.voices || [],
    });
  } catch (error) {
    console.error('[Voices] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch voices',
      },
      { status: 500 }
    );
  }
}


