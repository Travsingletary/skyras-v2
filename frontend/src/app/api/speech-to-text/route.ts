/**
 * Speech-to-Text API Route
 *
 * Transcribes audio files using OpenAI Whisper API
 * More reliable than browser Web Speech API - works in all browsers
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Whisper can take time for long audio

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let audioBuffer: Buffer;
    let fileName = `audio-${Date.now()}.webm`;
    let mimeType = 'audio/webm';

    // Handle FormData (direct audio upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;

      if (!audioFile) {
        return NextResponse.json(
          { success: false, error: 'No audio file provided' },
          { status: 400 }
        );
      }

      fileName = audioFile.name;
      mimeType = audioFile.type;
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

      console.log(`[STT] Received audio file: ${fileName} (${audioBuffer.length} bytes)`);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid content type. Use multipart/form-data' },
        { status: 400 }
      );
    }

    // Verify OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('[STT] OPENAI_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Speech-to-text service not configured' },
        { status: 503 }
      );
    }

    // Send to OpenAI Whisper API
    console.log(`[STT] Sending to OpenAI Whisper...`);

    const formData = new FormData();

    // Create a File object from the buffer
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Optional: specify language
    formData.append('response_format', 'json');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('[STT] OpenAI Whisper error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Transcription failed' },
        { status: 500 }
      );
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text || '';

    console.log(`[STT] Transcription complete: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`);

    return NextResponse.json({
      success: true,
      transcript,
      duration: whisperData.duration,
    });

  } catch (error) {
    console.error('[STT] Error processing audio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
