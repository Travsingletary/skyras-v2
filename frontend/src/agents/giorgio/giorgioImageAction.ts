/**
 * Giorgio Image Generation Action
 * Implements unified agent contract with graceful fallback
 */

import { AgentExecutionContext } from '@/agents/core/BaseAgent';
import {
  createAgentResponse,
  createProofMarker,
  type AgentResponse,
  type AgentArtifact,
} from '@/agents/core/AgentContract';
import { isImageGenerationAvailable } from '@/lib/featureFlags';
import { generateImage as generateImageProvider, isImageProviderConfigured } from './providers/imageProvider';
import type { GenerateImageInput } from './giorgioActions';

/**
 * Generate an image using Giorgio's image provider
 * Returns unified agent contract with graceful fallback if disabled/missing keys
 */
export async function generateImage(
  context: AgentExecutionContext,
  input: GenerateImageInput
): Promise<AgentResponse> {
  const proofMarkers = [];
  proofMarkers.push(createProofMarker('giorgio_image_start', 'AGENT_OK', 'Starting image generation'));

  // Build prompt from input
  const prompt = buildImagePrompt(input);
  const params = {
    prompt,
    aspectRatio: input.aspectRatio || 'square',
    stylePreset: input.stylePreset || input.style,
    seed: input.seed,
  };

  // Check if image generation is enabled and configured
  const isEnabled = isImageGenerationAvailable();
  const isConfigured = isImageProviderConfigured();

  if (!isEnabled || !isConfigured) {
    // Graceful fallback: return prompt package artifact
    const warnings: string[] = [];
    if (!isEnabled) {
      warnings.push('Image generation is disabled (GIORGIO_IMAGE_ENABLED=false)');
    }
    if (!isConfigured) {
      warnings.push('Image provider not configured (missing REPLICATE_API_TOKEN)');
    }

    const promptPackage = {
      prompt,
      params: {
        aspectRatio: params.aspectRatio,
        stylePreset: params.stylePreset,
        seed: params.seed,
      },
      provider: process.env.IMAGE_PROVIDER || 'replicate',
      recommendedSettings: {
        size: params.aspectRatio === 'square' ? '1024x1024' : '1536x1536',
        model: 'stability-ai/sdxl',
      },
    };

    const fallbackArtifact: AgentArtifact = {
      type: 'prompt_package',
      content: JSON.stringify(promptPackage, null, 2),
      metadata: {
        provider: process.env.IMAGE_PROVIDER || 'replicate',
        prompt,
        params: promptPackage.params,
        is_sample: false,
      },
    };

    proofMarkers.push(
      createProofMarker('giorgio_image_fallback', 'INFO', 'Image generation disabled/unconfigured, returning prompt package')
    );

    return createAgentResponse(
      'giorgio',
      'generateImage',
      `Image prompt package generated for ${input.project}. Image generation is disabled or not configured.`,
      {
        artifacts: [fallbackArtifact],
        warnings,
        proof: proofMarkers,
        metadata: {
          project: input.project,
          prompt,
          fallback_reason: !isEnabled ? 'disabled' : 'not_configured',
        },
      }
    );
  }

  // Attempt image generation
  try {
    proofMarkers.push(createProofMarker('giorgio_image_provider_call', 'AGENT_OK', 'Calling image provider'));
    
    const result = await generateImageProvider(params);

    if (result.error || !result.imageUrl) {
      // Provider error - return fallback
      const promptPackage = {
        prompt,
        params: {
          aspectRatio: params.aspectRatio,
          stylePreset: params.stylePreset,
          seed: params.seed,
        },
        provider: result.provider,
        recommendedSettings: {
          size: params.aspectRatio === 'square' ? '1024x1024' : '1536x1536',
          model: result.model,
        },
      };

      const fallbackArtifact: AgentArtifact = {
        type: 'prompt_package',
        content: JSON.stringify(promptPackage, null, 2),
        metadata: {
          provider: result.provider,
          prompt,
          params: promptPackage.params,
          is_sample: false,
          error: result.error,
        },
      };

      proofMarkers.push(
        createProofMarker('giorgio_image_provider_error', 'INFO', `Provider error: ${result.error || 'No image URL returned'}`)
      );

      return createAgentResponse(
        'giorgio',
        'generateImage',
        `Image generation failed for ${input.project}. Returning prompt package.`,
        {
          artifacts: [fallbackArtifact],
          warnings: [`Image generation failed: ${result.error || 'No image URL returned'}`],
          proof: proofMarkers,
          metadata: {
            project: input.project,
            prompt,
            provider: result.provider,
            error: result.error,
          },
        }
      );
    }

    // Success - return image artifact
    const imageArtifact: AgentArtifact = {
      type: 'image',
      content: result.imageUrl,
      url: result.imageUrl,
      metadata: {
        provider: result.provider,
        model: result.model,
        prompt,
        params: {
          aspectRatio: params.aspectRatio,
          stylePreset: params.stylePreset,
          seed: params.seed,
        },
        is_sample: false,
      },
    };

    proofMarkers.push(createProofMarker('giorgio_image_success', 'AGENT_OK', 'Image generated successfully'));

    return createAgentResponse(
      'giorgio',
      'generateImage',
      `Image generated for ${input.project} using ${result.provider}.`,
      {
        artifacts: [imageArtifact],
        proof: proofMarkers,
        metadata: {
          project: input.project,
          prompt,
          image_url: result.imageUrl,
          provider: result.provider,
          model: result.model,
        },
      }
    );
  } catch (error) {
    // Unexpected error - return fallback
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.logger.error('Image generation error', { error, input });

    const promptPackage = {
      prompt,
      params: {
        aspectRatio: params.aspectRatio,
        stylePreset: params.stylePreset,
        seed: params.seed,
      },
      provider: process.env.IMAGE_PROVIDER || 'replicate',
      recommendedSettings: {
        size: params.aspectRatio === 'square' ? '1024x1024' : '1536x1536',
        model: 'stability-ai/sdxl',
      },
    };

    const fallbackArtifact: AgentArtifact = {
      type: 'prompt_package',
      content: JSON.stringify(promptPackage, null, 2),
      metadata: {
        provider: process.env.IMAGE_PROVIDER || 'replicate',
        prompt,
        params: promptPackage.params,
        is_sample: false,
        error: errorMessage,
      },
    };

    proofMarkers.push(
      createProofMarker('giorgio_image_exception', 'ERROR', `Exception during image generation: ${errorMessage}`)
    );

    return createAgentResponse(
      'giorgio',
      'generateImage',
      `Image generation encountered an error for ${input.project}. Returning prompt package.`,
      {
        artifacts: [fallbackArtifact],
        warnings: [`Image generation error: ${errorMessage}`],
        proof: proofMarkers,
        metadata: {
          project: input.project,
          prompt,
          error: errorMessage,
        },
      }
    );
  }
}

/**
 * Build image prompt from creative input
 */
function buildImagePrompt(input: GenerateImageInput): string {
  const parts: string[] = [];
  
  if (input.context) {
    parts.push(input.context);
  } else if (input.project) {
    parts.push(input.project);
  }
  
  if (input.mood) {
    parts.push(`${input.mood} mood`);
  }
  
  if (input.style || input.stylePreset) {
    parts.push(`${input.style || input.stylePreset} style`);
  }
  
  if (input.characters && Array.isArray(input.characters) && input.characters.length > 0) {
    parts.push(`featuring ${input.characters.join(' and ')}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'A cinematic image';
}

