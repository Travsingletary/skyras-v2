interface SunoTrackRequest {
  prompt: string;
  style?: string;
  mood?: string;
  durationSeconds?: number;
}

interface SunoTrackResponse {
  success: boolean;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

// TODO: replace stubbed response with a real Suno API call.
export async function requestSunoTrack(payload: SunoTrackRequest): Promise<SunoTrackResponse> {
  if (!process.env.SUNO_API_KEY) {
    return { success: false, error: "Missing SUNO_API_KEY" };
  }

  return {
    success: true,
    fileUrl: `suno://drafts/${encodeURIComponent(payload.prompt).slice(0, 24)}`,
    metadata: {
      ...payload,
      generatedAt: new Date().toISOString(),
    },
  };
}
