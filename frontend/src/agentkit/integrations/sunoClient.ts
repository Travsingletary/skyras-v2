interface SunoTrackRequest {
  prompt: string;
  style?: string;
  mood?: string;
  durationSeconds?: number;
  lyrics?: string; // Optional lyrics for song generation
}

interface SunoTrackResponse {
  success: boolean;
  fileUrl?: string;
  audioUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

const SUNO_API_KEY = process.env.SUNO_API_KEY || '';
const SUNO_API_BASE_URL = process.env.SUNO_API_BASE_URL || 'https://api.suno.ai/v1';

/**
 * Generate music track using Suno API
 */
export async function requestSunoTrack(payload: SunoTrackRequest): Promise<SunoTrackResponse> {
  if (!SUNO_API_KEY) {
    return { success: false, error: "Missing SUNO_API_KEY" };
  }

  try {
    const { prompt, style = 'pop', mood, durationSeconds = 60, lyrics } = payload;

    // Build the full prompt
    let fullPrompt = prompt;
    if (lyrics) {
      fullPrompt = `${prompt} - ${style} song, ${durationSeconds} seconds, ${lyrics}`;
    } else if (mood) {
      fullPrompt = `${prompt} - ${style} style, ${mood} mood, ${durationSeconds} seconds`;
    }

    // Call Suno API
    const response = await fetch(`${SUNO_API_BASE_URL}/music/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        style: style,
        duration: durationSeconds,
        quality: 'high',
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Suno API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const audioUrl = data.audio_url || data.url;

    if (!audioUrl) {
      return {
        success: false,
        error: 'No audio URL returned from Suno API',
      };
    }

    // Download and store audio if needed
    // For now, return the URL - storage can be handled by the caller
    return {
      success: true,
      fileUrl: audioUrl,
      audioUrl: audioUrl,
      metadata: {
        prompt: fullPrompt,
        style,
        mood,
        duration: durationSeconds,
        generatedAt: new Date().toISOString(),
        hasLyrics: !!lyrics,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling Suno API',
    };
  }
}
