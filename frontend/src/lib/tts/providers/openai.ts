/**
 * OpenAI Text-to-Speech Provider
 *
 * Cost: ~$15 per 1M characters (1.5 cents per 1000 chars)
 * Quality: High quality, natural voices
 * Voices: alloy, echo, fable, onyx, nova, shimmer
 */

import type { TTSProvider, TTSOptions } from '../types';

export class OpenAITTSProvider implements TTSProvider {
  name = 'OpenAI TTS';
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getCostPer1000Chars(): number {
    return 1.5; // $0.015 per 1000 characters
  }

  async generateSpeech(options: TTSOptions): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { text, voiceId = 'nova', model = 'tts-1', speed = 1.0 } = options;

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model, // 'tts-1' or 'tts-1-hd'
        voice: voiceId, // alloy, echo, fable, onyx, nova, shimmer
        input: text,
        speed, // 0.25 to 4.0
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS failed: ${response.status} - ${error}`);
    }

    return await response.arrayBuffer();
  }
}
