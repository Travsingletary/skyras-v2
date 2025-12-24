# Neutral Defaults - Mixed Results Demo

## Updated DEFAULT_SAMPLE_FILES Constant

**File:** `frontend/src/app/api/test/golden-path/route.ts`

```typescript
/**
 * System-owned neutral demo inputs for compliance testing.
 * Not real assets. These are generic sample filenames used when no input is provided.
 * Never saved as real assets and excluded from asset ownership logic.
 * 
 * Designed to show mixed results: 2 flagged + 2 clean
 * - video_demo_watermark.mp4 (flag: DEMO + WATERMARK)
 * - music_preview_track.wav (flag: PREVIEW)
 * - image_sample_render.png (clean: no keywords)
 * - final_export.mov (clean: no keywords)
 */
const DEFAULT_SAMPLE_FILES: Array<{ name: string; path: string }> = [
  { name: 'video_demo_watermark.mp4', path: 'videos/video_demo_watermark.mp4' },
  { name: 'music_preview_track.wav', path: 'music/music_preview_track.wav' },
  { name: 'image_sample_render.png', path: 'images/image_sample_render.png' },
  { name: 'final_export.mov', path: 'videos/final_export.mov' },
];
```

---

## Example Output JSON (Mixed Results: 2 Flagged + 2 Clean)

### Empty Input (Defaults Injected)

```json
{
  "agent": "cassidy",
  "action": "scanFilesForLicensing",
  "success": true,
  "output": "No files provided; used default sample filenames (4). Compliance scan completed: 2 file(s) flagged, 2 file(s) clean. Flagged 2 potential assets",
  "artifacts": [
    {
      "type": "metadata",
      "content": "{\"file_path\":\"videos/video_demo_watermark.mp4\",\"reason\":\"filename_contains_DEMO;filename_contains_WATERMARK\",\"inferred_type\":\"video\",\"source\":\"manual\"}",
      "metadata": {
        "file_path": "videos/video_demo_watermark.mp4",
        "reason": "filename_contains_DEMO;filename_contains_WATERMARK",
        "inferred_type": "video",
        "source": "manual"
      }
    },
    {
      "type": "metadata",
      "content": "{\"file_path\":\"music/music_preview_track.wav\",\"reason\":\"filename_contains_PREVIEW\",\"inferred_type\":\"music\",\"source\":\"manual\"}",
      "metadata": {
        "file_path": "music/music_preview_track.wav",
        "reason": "filename_contains_PREVIEW",
        "inferred_type": "music",
        "source": "manual"
      }
    }
  ],
  "warnings": [
    "Found 2 potentially unlicensed asset(s) requiring attention"
  ],
  "proof": [
    {
      "step": "cassidy_route",
      "status": "ROUTE_OK",
      "message": "Marcus routing to Cassidy for licensing scan",
      "timestamp": "2025-01-23T12:00:00.000Z"
    },
    {
      "step": "cassidy_guardrail",
      "status": "INFO",
      "message": "No files provided, using default sample filenames",
      "timestamp": "2025-01-23T12:00:00.100Z",
      "details": {
        "default_files_count": 4
      }
    },
    {
      "step": "cassidy_execution",
      "status": "AGENT_OK",
      "message": "Cassidy completed licensing scan",
      "timestamp": "2025-01-23T12:00:01.000Z",
      "details": {
        "total_files": 4,
        "flagged_count": 2,
        "clean_count": 2
      }
    },
    {
      "step": "compliance_scan_save",
      "status": "DB_OK",
      "message": "Compliance scan saved to compliance_scans table",
      "timestamp": "2025-01-23T12:00:01.500Z",
      "details": {
        "scan_id": "550e8400-e29b-41d4-a716-446655440000",
        "table": "compliance_scans",
        "flagged_count": 2,
        "clean_count": 2
      }
    },
    {
      "step": "compliance_complete",
      "status": "DONE",
      "message": "Compliance path completed successfully",
      "timestamp": "2025-01-23T12:00:01.500Z"
    }
  ],
  "metadata": {
    "scan_summary": "Flagged 2 potential assets",
    "flagged_count": 2,
    "clean_count": 2,
    "total_files": 4,
    "assets_saved": 0,
    "scan_saved": true,
    "scan_id": "550e8400-e29b-41d4-a716-446655440000",
    "scan_table": "compliance_scans",
    "used_defaults": true
  }
}
```

---

## Proof Semantics Confirmation

### ✅ Correct Status Usage

- **`cassidy_route`**: `ROUTE_OK` ✅ (Marcus routing decision)
- **`cassidy_guardrail`**: `INFO` ✅ (Defaults injection - informational)
- **`cassidy_execution`**: `AGENT_OK` ✅ (Agent execution)
- **`compliance_scan_save`**: `DB_OK` ✅ (Database operation)
- **`compliance_complete`**: `DONE` ✅ (Path completion)

**Key Point:** `ROUTE_OK` is reserved exclusively for Marcus routing decisions. Defaults injection uses `INFO` status.

---

## Output String Format

### With Defaults (Mixed Results)

```
No files provided; used default sample filenames (4). Compliance scan completed: 2 file(s) flagged, 2 file(s) clean. Flagged 2 potential assets
```

**Components:**
1. ✅ "No files provided; used default sample filenames (4)." - States defaults were used
2. ✅ "Compliance scan completed: 2 file(s) flagged, 2 file(s) clean." - Includes flagged/clean counts
3. ✅ "Flagged 2 potential assets" - Summary from scan result

### With Defaults (All Clean)

```
No files provided; used default sample filenames (4). Compliance scan completed: All 4 file(s) are clean. No licensing issues detected.
```

### User-Provided Files (No Defaults)

```
Compliance scan completed: 2 file(s) flagged, 2 file(s) clean. Flagged 2 potential assets
```

---

## File Breakdown

### Flagged Files (2)

1. **`video_demo_watermark.mp4`**
   - Keywords: `DEMO`, `WATERMARK`
   - Reason: `filename_contains_DEMO;filename_contains_WATERMARK`
   - Type: `video`
   - Source: `manual`

2. **`music_preview_track.wav`**
   - Keywords: `PREVIEW`
   - Reason: `filename_contains_PREVIEW`
   - Type: `music`
   - Source: `manual`

### Clean Files (2)

1. **`image_sample_render.png`**
   - No keywords detected
   - Type: `unknown` (PNG not in music/video/graphic detection)
   - Source: `manual`

2. **`final_export.mov`**
   - No keywords detected
   - Type: `video`
   - Source: `manual`

---

## Database Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-23T12:00:01.500Z",
  "project": "SkySky",
  "input_files_json": [
    {"name": "video_demo_watermark.mp4", "path": "videos/video_demo_watermark.mp4"},
    {"name": "music_preview_track.wav", "path": "music/music_preview_track.wav"},
    {"name": "image_sample_render.png", "path": "images/image_sample_render.png"},
    {"name": "final_export.mov", "path": "videos/final_export.mov"}
  ],
  "output_json": {
    "flagged": [
      {
        "file_path": "videos/video_demo_watermark.mp4",
        "reason": "filename_contains_DEMO;filename_contains_WATERMARK",
        "inferred_type": "video",
        "source": "manual"
      },
      {
        "file_path": "music/music_preview_track.wav",
        "reason": "filename_contains_PREVIEW",
        "inferred_type": "music",
        "source": "manual"
      }
    ],
    "clean": [
      {"name": "image_sample_render.png", "path": "images/image_sample_render.png"},
      {"name": "final_export.mov", "path": "videos/final_export.mov"}
    ],
    "counts": {
      "total": 4,
      "flagged": 2,
      "clean": 2
    },
    "summary": "Flagged 2 potential assets"
  },
  "flagged_count": 2,
  "clean_count": 2,
  "user_id": "public",
  "agent_source": "cassidy",
  "metadata": {
    "scenario": "compliance",
    "scan_timestamp": "2025-01-23T12:00:01.500Z",
    "is_sample": true,
    "source": "system_default",
    "used_due_to_empty_input": true
  }
}
```

---

## Status: ✅ COMPLETE

All micro-polish requirements met:
- ✅ DEFAULT_SAMPLE_FILES shows mixed results (2 flagged + 2 clean)
- ✅ Proof semantics correct: `INFO` status for defaults injection (not `ROUTE_OK`)
- ✅ Output string includes flagged/clean counts when defaults are used
- ✅ Neutral, generic filenames (no provider/project names)

