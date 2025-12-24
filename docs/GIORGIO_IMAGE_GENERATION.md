# Giorgio Image Generation — Graceful + Demo-Safe Implementation

## Overview

Giorgio's image generation feature is implemented with graceful fallback to ensure it never hard-fails. If image generation is disabled or API keys are missing, the system returns a clean "prompt package" artifact instead of throwing errors.

## Environment Variables

### Required for Image Generation

```bash
# Enable image generation feature
GIORGIO_IMAGE_ENABLED=true

# Choose provider (replicate or runway)
IMAGE_PROVIDER=replicate

# Provider-specific keys
REPLICATE_API_TOKEN=your-replicate-api-token
```

### Defaults (Demo-Safe)

```bash
# Default: Image generation disabled
GIORGIO_IMAGE_ENABLED=false

# Default: Use Replicate
IMAGE_PROVIDER=replicate
```

## Feature Flags

The system checks two conditions:
1. `GIORGIO_IMAGE_ENABLED=true` (must be explicitly enabled)
2. Provider API key exists (`REPLICATE_API_TOKEN` for replicate, `RUNWAY_API_KEY` for runway)

If either condition fails, the system returns a fallback prompt package artifact.

## Unified Agent Contract

All image generation responses follow the unified agent contract:

```typescript
{
  agent: "giorgio",
  action: "generateImage",
  success: true,
  output: string,
  artifacts: AgentArtifact[],
  warnings?: string[],
  proof: ProofMarker[],
  metadata?: Record<string, unknown>
}
```

## Example JSON Outputs

### A) Image Success (Generated)

```json
{
  "agent": "giorgio",
  "action": "generateImage",
  "success": true,
  "output": "Image generated for SkySky using replicate.",
  "artifacts": [
    {
      "type": "image",
      "content": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "metadata": {
        "provider": "replicate",
        "model": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
        "params": {
          "aspectRatio": "square",
          "stylePreset": "neon-realism",
          "seed": null
        },
        "is_sample": false
      }
    }
  ],
  "proof": [
    {
      "step": "giorgio_image_start",
      "status": "AGENT_OK",
      "message": "Starting image generation",
      "timestamp": "2025-01-24T13:46:59.000Z"
    },
    {
      "step": "giorgio_image_provider_call",
      "status": "AGENT_OK",
      "message": "Calling image provider",
      "timestamp": "2025-01-24T13:46:59.100Z"
    },
    {
      "step": "giorgio_image_success",
      "status": "AGENT_OK",
      "message": "Image generated successfully",
      "timestamp": "2025-01-24T13:47:15.000Z"
    }
  ],
  "metadata": {
    "project": "SkySky",
    "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
    "image_url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "provider": "replicate",
    "model": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
  }
}
```

### B) Fallback Due to Disabled Feature

```json
{
  "agent": "giorgio",
  "action": "generateImage",
  "success": true,
  "output": "Image prompt package generated for SkySky. Image generation is disabled or not configured.",
  "artifacts": [
    {
      "type": "prompt_package",
      "content": "{\n  \"prompt\": \"A cinematic sequence, dynamic mood, neon-realism style\",\n  \"params\": {\n    \"aspectRatio\": \"square\",\n    \"stylePreset\": \"neon-realism\",\n    \"seed\": null\n  },\n  \"provider\": \"replicate\",\n  \"recommendedSettings\": {\n    \"size\": \"1024x1024\",\n    \"model\": \"stability-ai/sdxl\"\n  }\n}",
      "metadata": {
        "provider": "replicate",
        "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
        "params": {
          "aspectRatio": "square",
          "stylePreset": "neon-realism",
          "seed": null
        },
        "is_sample": false
      }
    }
  ],
  "warnings": [
    "Image generation is disabled (GIORGIO_IMAGE_ENABLED=false)"
  ],
  "proof": [
    {
      "step": "giorgio_image_start",
      "status": "AGENT_OK",
      "message": "Starting image generation",
      "timestamp": "2025-01-24T13:46:59.000Z"
    },
    {
      "step": "giorgio_image_fallback",
      "status": "INFO",
      "message": "Image generation disabled/unconfigured, returning prompt package",
      "timestamp": "2025-01-24T13:46:59.100Z"
    }
  ],
  "metadata": {
    "project": "SkySky",
    "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
    "fallback_reason": "disabled"
  }
}
```

### C) Fallback Due to Missing API Key

```json
{
  "agent": "giorgio",
  "action": "generateImage",
  "success": true,
  "output": "Image prompt package generated for SkySky. Image generation is disabled or not configured.",
  "artifacts": [
    {
      "type": "prompt_package",
      "content": "{\n  \"prompt\": \"A cinematic sequence, dynamic mood, neon-realism style\",\n  \"params\": {\n    \"aspectRatio\": \"square\",\n    \"stylePreset\": \"neon-realism\",\n    \"seed\": null\n  },\n  \"provider\": \"replicate\",\n  \"recommendedSettings\": {\n    \"size\": \"1024x1024\",\n    \"model\": \"stability-ai/sdxl\"\n  }\n}",
      "metadata": {
        "provider": "replicate",
        "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
        "params": {
          "aspectRatio": "square",
          "stylePreset": "neon-realism",
          "seed": null
        },
        "is_sample": false
      }
    }
  ],
  "warnings": [
    "Image provider not configured (missing REPLICATE_API_TOKEN)"
  ],
  "proof": [
    {
      "step": "giorgio_image_start",
      "status": "AGENT_OK",
      "message": "Starting image generation",
      "timestamp": "2025-01-24T13:46:59.000Z"
    },
    {
      "step": "giorgio_image_fallback",
      "status": "INFO",
      "message": "Image generation disabled/unconfigured, returning prompt package",
      "timestamp": "2025-01-24T13:46:59.100Z"
    }
  ],
  "metadata": {
    "project": "SkySky",
    "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
    "fallback_reason": "not_configured"
  }
}
```

### D) Fallback Due to Provider Error

```json
{
  "agent": "giorgio",
  "action": "generateImage",
  "success": true,
  "output": "Image generation failed for SkySky. Returning prompt package.",
  "artifacts": [
    {
      "type": "prompt_package",
      "content": "{\n  \"prompt\": \"A cinematic sequence, dynamic mood, neon-realism style\",\n  \"params\": {\n    \"aspectRatio\": \"square\",\n    \"stylePreset\": \"neon-realism\",\n    \"seed\": null\n  },\n  \"provider\": \"replicate\",\n  \"recommendedSettings\": {\n    \"size\": \"1024x1024\",\n    \"model\": \"stability-ai/sdxl\"\n  }\n}",
      "metadata": {
        "provider": "replicate",
        "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
        "params": {
          "aspectRatio": "square",
          "stylePreset": "neon-realism",
          "seed": null
        },
        "is_sample": false,
        "error": "Replicate API error: 429 - Rate limit exceeded"
      }
    }
  ],
  "warnings": [
    "Image generation failed: Replicate API error: 429 - Rate limit exceeded"
  ],
  "proof": [
    {
      "step": "giorgio_image_start",
      "status": "AGENT_OK",
      "message": "Starting image generation",
      "timestamp": "2025-01-24T13:46:59.000Z"
    },
    {
      "step": "giorgio_image_provider_call",
      "status": "AGENT_OK",
      "message": "Calling image provider",
      "timestamp": "2025-01-24T13:46:59.100Z"
    },
    {
      "step": "giorgio_image_provider_error",
      "status": "INFO",
      "message": "Provider error: Replicate API error: 429 - Rate limit exceeded",
      "timestamp": "2025-01-24T13:47:00.000Z"
    }
  ],
  "metadata": {
    "project": "SkySky",
    "prompt": "A cinematic sequence, dynamic mood, neon-realism style",
    "provider": "replicate",
    "error": "Replicate API error: 429 - Rate limit exceeded"
  }
}
```

## Database Persistence

### Always Saved

1. **agent_runs** table:
   - `scenario`: "creative"
   - `action`: "generateImage" (if image was requested)
   - `response_json`: Full response
   - `success`: true (always, even for fallbacks)
   - `proof_markers`: Complete proof trail

2. **assets** table:
   - **If image generated**: `type="image"`, `content=imageUrl`, tags: `["image", "giorgio", "creative"]`
   - **If fallback**: `type="prompt_package"`, `content=JSON.stringify(promptPackage)`, tags: `["image_prompt", "fallback", "giorgio", "creative"]`

## UI Features

### Agent Console (`/agent-console`)

1. **Toggle**: "Include image generation" checkbox (only shown for creative scenario)
2. **Badges**:
   - `GENERATED` (green) - Image was successfully generated
   - `FALLBACK` (yellow) - Prompt package returned instead
3. **Display**:
   - Images shown inline when generated
   - Prompt packages shown as copyable JSON
   - All artifacts are copyable

## Changed Files

1. `frontend/src/lib/featureFlags.ts` - Added `GIORGIO_IMAGE_ENABLED` and `IMAGE_PROVIDER` flags
2. `frontend/src/agents/core/AgentContract.ts` - Added `prompt_package` artifact type
3. `frontend/src/agents/giorgio/providers/imageProvider.ts` - New provider module
4. `frontend/src/agents/giorgio/giorgioImageAction.ts` - New unified contract implementation
5. `frontend/src/agents/giorgio/giorgioActions.ts` - Added `GenerateImageInput` interface
6. `frontend/src/app/api/test/golden-path/route.ts` - Updated creative path to support `includeImage`
7. `frontend/src/app/agent-console/page.tsx` - Added toggle and enhanced artifact display
8. `frontend/env.example` - Added new env vars

## Testing

### Test Image Generation (Enabled)

1. Set `GIORGIO_IMAGE_ENABLED=true` and `REPLICATE_API_TOKEN=your-token`
2. Go to `/agent-console`
3. Select "Creative" scenario
4. Check "Include image generation"
5. Click "Run"
6. Should see `GENERATED` badge and image displayed

### Test Fallback (Disabled)

1. Set `GIORGIO_IMAGE_ENABLED=false` (or omit `REPLICATE_API_TOKEN`)
2. Go to `/agent-console`
3. Select "Creative" scenario
4. Check "Include image generation"
5. Click "Run"
6. Should see `FALLBACK` badge and prompt package JSON

### Test via cURL

```bash
# Image generation enabled
curl -X POST http://localhost:3000/api/test/golden-path \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "creative",
    "userId": "public",
    "project": "SkySky",
    "input": {
      "context": "A cinematic sequence",
      "mood": "dynamic",
      "includeImage": true
    }
  }'
```

## Constraints Met

✅ Never hard-fails (always returns success with fallback)  
✅ Single provider (Replicate only for MVP)  
✅ No async queues/video generation  
✅ Missing keys don't cause 500s  
✅ Always saves to database (agent_runs + assets)  
✅ Unified agent contract throughout

