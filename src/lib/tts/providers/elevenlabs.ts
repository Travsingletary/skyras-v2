/**
 * ElevenLabs Text-to-Speech Provider (Premium)
 *
 * Cost: Variable, higher than OpenAI
 * Quality: Premium, very natural voices
 * Voices: Custom voice IDs (e.g., 'EXAVITQu4vr4xnSDxMaL' for Bella)
 */

import type { TTSProvider, TTSOptions } from '../types';

export class ElevenLabsTTSProvider implements TTSProvider {
  name = 'ElevenLabs';
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getCostPer1000Chars(): number {
    return 3.0; // Estimated, varies by plan
  }

  async generateSpeech(options: TTSOptions): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = options;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs TTS failed: ${JSON.stringify(error)}`);
    }

    return await response.arrayBuffer();
  }
}
