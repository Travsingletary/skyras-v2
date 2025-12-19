/**
 * TTS Provider Types
 *
 * Abstraction layer for Text-to-Speech providers to enable
 * easy switching between OpenAI, ElevenLabs, and Web Speech API
 */

export interface TTSOptions {
  text: string;
  voiceId?: string;
  model?: string;
  speed?: number;
}

export interface TTSProvider {
  name: string;

  /**
   * Generate speech from text
   * @returns Audio buffer or stream
   */
  generateSpeech(options: TTSOptions): Promise<ArrayBuffer | ReadableStream>;

  /**
   * Check if provider is available (has API key, etc.)
   */
  isAvailable(): boolean;

  /**
   * Get estimated cost per 1000 characters (in cents)
   */
  getCostPer1000Chars(): number;
}

export type TTSProviderType = 'openai' | 'elevenlabs' | 'webspeech';

export interface TTSConfig {
  provider: TTSProviderType;
  fallbackProvider?: TTSProviderType;
  defaultVoice?: string;
  defaultSpeed?: number;
}
