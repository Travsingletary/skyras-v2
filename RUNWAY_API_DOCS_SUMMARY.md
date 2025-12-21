# Runway ML API Documentation Summary

Quick reference for Runway ML API integration.

## Base URL
```
https://api.dev.runwayml.com
```

## Authentication
```http
Authorization: Bearer YOUR_API_KEY
X-Runway-Version: 2024-11-06
```

## Video Generation Endpoints

### Text-to-Video
```http
POST /v1/text_to_video
```

**Parameters:**
- `model`: "gen3a_turbo", "gen3a", "veo3.1", "veo3.1_fast", "veo3"
- `promptText`: String (max 1000 chars)
- `ratio`: "1280:720", "720:1280", "1024:1024", etc.
- `duration`: 4, 6, or 8 seconds (varies by model)

**Response:**
```json
{
  "id": "task_abc123"
}
```

### Image-to-Video
```http
POST /v1/image_to_video
```

**Parameters:**
- `model`: "gen4_turbo", "gen3a_turbo", "veo3.1", etc.
- `promptImage`: HTTPS URL, Runway URI, or data URI
- `promptText`: Optional description
- `ratio`: Output resolution
- `duration`: 2-10 seconds (model dependent)
- `seed`: Optional for reproducibility

**Response:**
```json
{
  "id": "task_abc123"
}
```

## Task Status

### Check Task Progress
```http
GET /v1/tasks/{id}
```

**Response:**
```json
{
  "id": "task_abc123",
  "status": "SUCCEEDED",
  "output": [
    "https://delivery.dev.runwayml.com/video.mp4"
  ]
}
```

**Status Values:**
- `PENDING`: Task queued
- `RUNNING`: Generating video
- `SUCCEEDED`: Complete, video available in `output` array
- `FAILED`: Generation failed, check `failure` field
- `CANCELLED`: Task was cancelled

## Models

### Gen-3 Alpha Turbo (Recommended)
- Fast generation (~30-60 seconds)
- Good quality
- Cost-effective
- ID: `gen3a_turbo`

### Gen-3 Alpha
- Slower (~2-5 minutes)
- Highest quality
- More expensive
- ID: `gen3a`

### Gen-4 Turbo
- Latest model
- Improved quality and speed
- ID: `gen4_turbo`

## Rate Limits

Check [Runway pricing page](https://runwayml.com/pricing) for current limits.

## Error Codes

- `401`: Invalid API key
- `429`: Rate limit exceeded
- `400`: Invalid parameters
- `500`: Server error

## Best Practices

1. **Poll with delays**: Wait 2-3 seconds between status checks
2. **Set timeouts**: Don't poll forever (max 5 minutes recommended)
3. **Handle failures**: Check `status` and `failure` fields
4. **Cache videos**: Download and store videos, Runway URLs are temporary
5. **Optimize prompts**: Be specific and descriptive for best results

## Resources

- Full API Docs: https://docs.dev.runwayml.com/
- API Reference: https://docs.dev.runwayml.com/api/
- Pricing: https://runwayml.com/pricing
