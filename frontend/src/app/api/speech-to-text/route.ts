import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

/**
 * Speech-to-Text API endpoint using OpenAI Whisper
 *
 * Accepts either:
 * 1. FormData with 'audio' file (legacy, goes through backend)
 * 2. JSON with 'storagePath' (preferred, fetches from Supabase Storage)
 *
 * Returns transcribed text
 */
export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:11',message:'STT POST entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
  // #endregion
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:16',message:'OpenAI API key check',data:{hasApiKey:!!apiKey,apiKeyLength:apiKey?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    if (!apiKey) {
      console.error('[STT] OPENAI_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        },
        { status: 500 }
      );
    }

    // Check content type to determine request format
    const contentType = request.headers.get('content-type') || '';
    let audioBuffer: Buffer;
    let audioFileName = 'audio.webm';
    let audioType = 'audio/webm';

    if (contentType.includes('application/json')) {
      // NEW: Fetch audio from Supabase Storage
      const { storagePath } = await request.json();

      if (!storagePath) {
        return NextResponse.json(
          {
            success: false,
            error: 'storagePath is required when using JSON',
          },
          { status: 400 }
        );
      }

      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Supabase not configured',
          },
          { status: 503 }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Download audio from storage
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .download(storagePath);

      if (error || !data) {
        console.error('[STT] Error downloading from storage:', error);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to download audio: ${error?.message || 'Unknown error'}`,
          },
          { status: 500 }
        );
      }

      // Convert Blob to Buffer
      audioBuffer = Buffer.from(await data.arrayBuffer());
      audioFileName = storagePath.split('/').pop() || 'audio.webm';
      audioType = data.type || 'audio/webm';

      console.log('[STT] Fetched audio from storage:', storagePath, `(${audioBuffer.length} bytes)`);
    } else {
      // LEGACY: Get audio file from FormData
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:30',message:'Audio file check',data:{hasAudioFile:!!audioFile,fileName:audioFile?.name,fileSize:audioFile?.size,fileType:audioFile?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (!audioFile) {
        return NextResponse.json(
          {
            success: false,
            error: 'No audio file provided. Please include an "audio" field in the FormData or "storagePath" in JSON.',
          },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const audioBlob = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(audioBlob);
      audioFileName = audioFile.name || 'audio.webm';
      audioType = audioFile.type || 'audio/webm';
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:122',message:'Before OpenAI API call',data:{bufferSize:audioBuffer.length,audioType,audioFileName,isFromStorage:contentType.includes('application/json')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    // Create FormData for OpenAI API
    const openaiFormData = new FormData();
    const audioBlobForOpenAI = new Blob([audioBuffer], { type: audioType });
    openaiFormData.append('file', audioBlobForOpenAI, audioFileName);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'en'); // Optional: specify language for better accuracy

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:60',message:'OpenAI API response',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STT] OpenAI API error:', response.status, errorText);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:66',message:'OpenAI API error',data:{status:response.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json(
        {
          success: false,
          error: `OpenAI Whisper API error: ${response.status} - ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const transcript = data.text || '';
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:78',message:'STT success',data:{hasTranscript:!!transcript,transcriptLength:transcript.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      success: true,
      transcript: transcript.trim(),
    });
  } catch (error) {
    console.error('[STT] Error:', error);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/9cfbb0b0-8eff-4990-9d74-321dfceaf911',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/speech-to-text/route.ts:88',message:'STT catch error',data:{errorMessage:(error as Error)?.message,errorName:(error as Error)?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(
      {
        success: false,
        error: `Speech-to-text failed: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

