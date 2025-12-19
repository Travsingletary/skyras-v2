# Runway API Documentation Summary

**Official Documentation**: https://docs.dev.runwayml.com/  
**API Signup**: https://dev.runwayml.com/  
**Last Updated**: Based on web research and common API patterns

---

## Overview

Runway provides an API for integrating AI video generation, image editing, and other creative AI models into applications. The API uses RESTful endpoints with Bearer token authentication.

---

## Authentication

### API Key
- **Location**: Obtain from https://dev.runwayml.com/ account settings
- **Format**: Bearer token in Authorization header
- **Header**: `Authorization: Bearer {API_KEY}`

### Base URL
- **Production**: `https://api.runwayml.com/v1` (verify in official docs)
- **Alternative**: May use `https://api.runwayml.com` or versioned endpoints

---

## Video Generation API

### Endpoint: Generate Video

**POST** `/video/generations` (or `/v1/video/generations`)

#### Request Body

```json
{
  "prompt": "A cinematic shot of a futuristic cityscape at sunset",
  "image_url": "https://example.com/image.jpg",  // Optional: for image-to-video
  "duration": 5,  // Duration in seconds (1-10)
  "aspect_ratio": "16:9",  // Options: "16:9", "9:16", "1:1", "4:5"
  "model": "gen3a_turbo",  // Options: "gen3a_turbo", "gen3a", "gen4"
  "seed": 12345  // Optional: for reproducible results
}
```

#### Response

```json
{
  "id": "generation_abc123",
  "status": "pending",
  "video_url": null,  // Available when status is "completed"
  "thumbnail_url": null,
  "duration": 5,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Note**: Actual field names may differ. Common variations:
- `id` vs `generation_id` vs `video_id`
- `video_url` vs `url` vs `output_url`
- `aspect_ratio` vs `aspectRatio` vs `ratio`

---

### Endpoint: Check Video Status

**GET** `/video/generations/{id}` (or `/v1/video/generations/{id}`)

#### Response

```json
{
  "id": "generation_abc123",
  "status": "processing",  // "pending" | "processing" | "completed" | "failed"
  "progress": 45,  // Percentage (0-100)
  "video_url": "https://cdn.runwayml.com/videos/abc123.mp4",
  "thumbnail_url": "https://cdn.runwayml.com/thumbnails/abc123.jpg",
  "duration": 5,
  "error": null  // Error message if status is "failed"
}
```

---

## Models

### Available Models

1. **gen3a_turbo**
   - Fast generation
   - Lower quality
   - Good for quick iterations

2. **gen3a**
   - Standard quality
   - Balanced speed/quality

3. **gen4** (if available)
   - Highest quality
   - Slower generation
   - Best results

**Note**: Verify actual model names in official docs. May be:
- `gen-3-alpha-turbo`
- `gen-3-alpha`
- `gen-4`
- Or other naming conventions

---

## Aspect Ratios

Supported aspect ratios (verify in docs):
- `16:9` - Widescreen (default)
- `9:16` - Vertical/portrait
- `1:1` - Square
- `4:5` - Instagram post format

---

## Status Values

Video generation status progression:
1. `pending` - Request received, queued
2. `processing` - Video being generated
3. `completed` - Video ready, URL available
4. `failed` - Generation failed, check error field

---

## Error Handling

### Common Error Responses

```json
{
  "error": {
    "code": "INVALID_PROMPT",
    "message": "Prompt contains prohibited content",
    "type": "validation_error"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `402` - Payment Required (quota exceeded)
- `429` - Rate Limit Exceeded
- `500` - Server Error

---

## Rate Limits

- **Free Tier**: Limited requests per day/month
- **Paid Tier**: Higher limits
- **Headers**: Check `X-RateLimit-*` headers for current limits

---

## SDKs

Runway provides official SDKs:

### Node.js SDK
```bash
npm install @runwayml/sdk
```

### Python SDK
```bash
pip install runwayml
```

**Recommendation**: Use official SDKs if available for better type safety and error handling.

---

## Implementation Notes

### Current Implementation Assumptions

The current implementation in `src/lib/runway.ts` assumes:

1. **Endpoint Structure**:
   - POST `/video/generations` for creating videos
   - GET `/video/generations/{id}` for checking status

2. **Request Format**:
   - Snake_case field names (`aspect_ratio`, `image_url`)
   - Bearer token authentication
   - JSON request/response

3. **Response Format**:
   - `id` field for video ID
   - `status` field for generation status
   - `video_url` when completed

### Verification Required

**⚠️ IMPORTANT**: The actual API may differ. Verify:

1. **Base URL**: Check if it's `/v1/` or root level
2. **Endpoints**: Actual endpoint paths may differ
3. **Field Names**: May use camelCase instead of snake_case
4. **Model Names**: Exact model identifiers
5. **Response Structure**: Actual response format

---

## Testing Checklist

When you get your API key, test:

- [ ] Authentication works (401 if invalid key)
- [ ] Video generation endpoint accepts requests
- [ ] Status endpoint returns correct format
- [ ] Polling works until completion
- [ ] Error responses are handled correctly
- [ ] Rate limits are respected

---

## Example cURL Commands

### Generate Video
```bash
curl -X POST https://api.runwayml.com/v1/video/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cinematic shot of a futuristic city",
    "duration": 5,
    "aspect_ratio": "16:9",
    "model": "gen3a_turbo"
  }'
```

### Check Status
```bash
curl -X GET https://api.runwayml.com/v1/video/generations/{id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Next Steps

1. **Get API Key**: Sign up at https://dev.runwayml.com/
2. **Read Official Docs**: https://docs.dev.runwayml.com/
3. **Test Endpoints**: Use cURL or Postman to verify structure
4. **Update Implementation**: Adjust `src/lib/runway.ts` based on actual API
5. **Add Error Handling**: Handle specific error codes from Runway

---

## Resources

- **Official Docs**: https://docs.dev.runwayml.com/
- **API Signup**: https://dev.runwayml.com/
- **Support**: Check Runway's support channels for API questions
- **SDK Docs**: Check SDK documentation for type-safe implementations

---

## Current Implementation Status

✅ **Implemented**:
- Basic API structure
- Video generation request
- Status polling
- Error handling framework
- Integration with Giorgio agent

⚠️ **Needs Verification**:
- Exact endpoint URLs
- Request/response format
- Field naming conventions
- Model identifiers
- Error response structure

---

**Last Verified**: Not yet verified against official API  
**Action Required**: Test with actual API key and update implementation as needed
