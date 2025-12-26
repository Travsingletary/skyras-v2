# Giorgio Image Generation Verification Results

## Test Plan

Three scenarios tested:
- **A**: `GIORGIO_IMAGE_ENABLED=false`
- **B**: `GIORGIO_IMAGE_ENABLED=true` but missing `REPLICATE_API_TOKEN`
- **C**: `GIORGIO_IMAGE_ENABLED=true` with valid `REPLICATE_API_TOKEN`

## Manual Testing Instructions

Since environment variables need to be set at runtime, manual testing is required:

### Test A: Disabled Feature

1. Set environment variable: `GIORGIO_IMAGE_ENABLED=false`
2. Make API call:
```bash
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

**Expected Result:**
- `success: true`
- `warnings: ["Image generation is disabled (GIORGIO_IMAGE_ENABLED=false)"]`
- `artifacts: [{ type: "prompt_package", ... }]`
- `proof` includes `DB_OK` status
- Status code: 200 (not 500)

### Test B: Missing Provider Keys

1. Set environment variable: `GIORGIO_IMAGE_ENABLED=true`
2. Unset or leave empty: `REPLICATE_API_TOKEN`
3. Make same API call as Test A

**Expected Result:**
- `success: true`
- `warnings: ["Image provider not configured (missing REPLICATE_API_TOKEN)"]`
- `artifacts: [{ type: "prompt_package", ... }]`
- `proof` includes `DB_OK` status
- Status code: 200 (not 500)

### Test C: Valid Configuration

1. Set environment variables:
   - `GIORGIO_IMAGE_ENABLED=true`
   - `REPLICATE_API_TOKEN=your-valid-token`
   - `IMAGE_PROVIDER=replicate`
2. Make same API call as Test A

**Expected Result:**
- `success: true`
- No warnings (or warnings only if provider fails)
- `artifacts: [{ type: "image", url: "data:image/png;base64,...", ... }]`
- `proof` includes `DB_OK` status
- Status code: 200 (not 500)

## Database Verification

After each test, verify database records:

```sql
-- Check agent_runs
SELECT id, scenario, success, created_at 
FROM agent_runs 
WHERE scenario = 'creative' 
ORDER BY created_at DESC 
LIMIT 3;

-- Check assets (should have prompt asset always, image asset only in Test C)
SELECT type, name, tags, created_at 
FROM assets 
WHERE project = 'SkySky' 
  AND agent_source = 'letitia'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:**
- **Test A & B**: 1 prompt asset + 1 prompt_package asset (or just prompt_package)
- **Test C**: 1 prompt asset + 1 image asset

## Verification Checklist

For each test, verify:

- [ ] `success === true` (never false)
- [ ] Warnings present in A/B (if applicable)
- [ ] Artifacts:
  - [ ] A/B: `prompt_package` type
  - [ ] C: `image` type
- [ ] Proof trail includes `DB_OK` status
- [ ] HTTP status: 200 (not 500)
- [ ] Database: Prompt asset saved (all tests)
- [ ] Database: Image asset saved (Test C only)
- [ ] Database: Prompt package asset saved (Tests A/B)

## Notes

- The system should **never** return 500 errors
- All responses should have `success: true` even when image generation fails
- Fallback prompt packages should always be returned when image generation is unavailable
- Database records should be created for all artifacts



