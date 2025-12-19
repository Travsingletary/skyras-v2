/**
 * TTS Provider Factory
 *
 * Selects and returns the appropriate TTS provider based on:
 * 1. Environment variable TTS_PROVIDER
 * 2. Available API keys
 * 3. Fallback order: OpenAI → Web Speech API
 */

import type { TTSProvider, TTSProviderType, TTSConfig } from './types';
import { OpenAITTSProvider } from './providers/openai';
import { ElevenLabsTTSProvider } from './providers/elevenlabs';

// Singleton instances
let openaiProvider: OpenAITTSProvider | null = null;
let elevenlabsProvider: ElevenLabsTTSProvider | null = null;

export function getTTSProvider(preferredProvider?: TTSProviderType): TTSProvider {
  // Get preferred provider from env or parameter
  const envProvider = (process.env.TTS_PROVIDER || 'openai').toLowerCase() as TTSProviderType;
  const provider = preferredProvider || envProvider;

  // Try preferred provider first
  if (provider === 'elevenlabs') {
    if (!elevenlabsProvider) {
      elevenlabsProvider = new ElevenLabsTTSProvider();
    }
    if (elevenlabsProvider.isAvailable()) {
      return elevenlabsProvider;
    }
  }

  if (provider === 'openai') {
    if (!openaiProvider) {
      openaiProvider = new OpenAITTSProvider();
    }
    if (openaiProvider.isAvailable()) {
      return openaiProvider;
    }
  }

  // Fallback order: OpenAI → ElevenLabs
  if (!openaiProvider) {
    openaiProvider = new OpenAITTSProvider();
  }
  if (openaiProvider.isAvailable()) {
    return openaiProvider;
  }

  if (!elevenlabsProvider) {
    elevenlabsProvider = new ElevenLabsTTSProvider();
  }
  if (elevenlabsProvider.isAvailable()) {
    return elevenlabsProvider;
  }

  throw new Error('No TTS provider available. Configure OPENAI_API_KEY or ELEVENLABS_API_KEY');
}

export function getTTSConfig(): TTSConfig {
  return {
    provider: (process.env.TTS_PROVIDER || 'openai') as TTSProviderType,
    fallbackProvider: 'webspeech',
    defaultVoice: process.env.TTS_DEFAULT_VOICE || 'nova', // OpenAI's nova voice
    defaultSpeed: parseFloat(process.env.TTS_DEFAULT_SPEED || '1.0'),
  };
}

export * from './types';
