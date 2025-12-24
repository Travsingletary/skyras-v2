# Neutral Default Filenames - Implementation Summary

## Constant Definition

**File:** `frontend/src/app/api/test/golden-path/route.ts`

```typescript
/**
 * System-owned neutral demo inputs for compliance testing.
 * Not real assets. These are generic sample filenames used when no input is provided.
 * Never saved as real assets and excluded from asset ownership logic.
 */
const DEFAULT_SAMPLE_FILES: Array<{ name: string; path: string }> = [
  { name: 'video_demo_watermark.mp4', path: 'videos/video_demo_watermark.mp4' },
  { name: 'music_preview_track.wav', path: 'music/music_preview_track.wav' },
  { name: 'image_sample_render.png', path: 'images/image_sample_render.png' },
  { name: 'project_template_preview.aep', path: 'templates/project_template_preview.aep' },
];
```

**UI Constant:** `frontend/src/app/agent-console/page.tsx`

```typescript
// System-owned neutral demo inputs for compliance testing
const DEFAULT_SAMPLE_FILES = [
  'video_demo_watermark.mp4',
  'music_preview_track.wav',
  'image_sample_render.png',
  'project_template_preview.aep',
];
```

---

## Neutral Filenames

### Before (Provider-Specific)
- `Runway_DEMO_watermark_preview.mp4` (Runway-specific)
- `artlist_song_license.pdf` (Artlist-specific)
- `final_master_v3.mov` (Project-specific)
- `motionarray_PREVIEW_template.aep` (MotionArray-specific)

### After (Neutral Generic)
- `video_demo_watermark.mp4` (Generic video)
- `music_preview_track.wav` (Generic audio)
- `image_sample_render.png` (Generic image)
- `project_template_preview.aep` (Generic template)

**Key Characteristics:**
- ✅ No provider names (Runway, Artlist, MotionArray, etc.)
- ✅ No project-specific identifiers
- ✅ Generic descriptive names only
- ✅ System-owned, not user assets

---

## Metadata Flags

**File:** `frontend/src/app/api/test/golden-path/route.ts`

When defaults are used, compliance scan records include:

```typescript
metadata: {
  scenario: 'compliance',
  scan_timestamp: new Date().toISOString(),
  is_sample: true,                    // Flag: these are sample files
  source: 'system_default',           // Flag: source is system, not user
  used_due_to_empty_input: true,      // Flag: defaults were injected
}
```

When user provides files:

```typescript
metadata: {
  scenario: 'compliance',
  scan_timestamp: new Date().toISOString(),
  is_sample: false,
  source: 'user_input',
  used_due_to_empty_input: false,
}
```

---

## Asset Ownership Protection

**File:** `frontend/src/app/api/test/golden-path/route.ts`

Default sample files are **never saved as real assets**:

```typescript
// Step 4: Optionally save flagged files as assets (only if asset_id is provided in input)
// IMPORTANT: Never save default sample files as real assets
const savedAssets = [];
if (input.asset_id && suspiciousFiles.length > 0 && !usedDefaults) {
  // ... asset saving logic ...
  
  for (const file of suspiciousFiles) {
    // Skip default sample files - never save as real assets
    const isDefaultFile = DEFAULT_SAMPLE_FILES.some(
      (df) => df.name === file.file_path || df.path === file.file_path
    );
    if (isDefaultFile) {
      console.log('[Compliance Path] Skipping default sample file from asset save:', file.file_path);
      continue;
    }
    // ... save real assets only ...
  }
}
```

**Protection Layers:**
1. ✅ `!usedDefaults` check prevents asset saving when defaults are used
2. ✅ `isDefaultFile` check prevents individual default files from being saved
3. ✅ Default files excluded from asset ownership logic entirely

---

## Updated Example JSON

### Empty Input (Defaults Injected)

```json
{
  "agent": "cassidy",
  "action": "scanFilesForLicensing",
  "success": true,
  "output": "No files provided; used default sample filenames (4). Compliance scan completed: All 4 file(s) are clean. No licensing issues detected.",
  "artifacts": [],
  "proof": [
    {
      "step": "cassidy_route",
      "status": "ROUTE_OK",
      "message": "Marcus routing to Cassidy for licensing scan"
    },
    {
      "step": "cassidy_guardrail",
      "status": "INFO",
      "message": "No files provided, using default sample filenames",
      "details": { "default_files_count": 4 }
    },
    {
      "step": "cassidy_execution",
      "status": "AGENT_OK",
      "message": "Cassidy completed licensing scan",
      "details": {
        "total_files": 4,
        "flagged_count": 0,
        "clean_count": 4
      }
    },
    {
      "step": "compliance_scan_save",
      "status": "DB_OK",
      "message": "Compliance scan saved to compliance_scans table",
      "details": {
        "scan_id": "550e8400-e29b-41d4-a716-446655440000",
        "table": "compliance_scans"
      }
    },
    {
      "step": "compliance_complete",
      "status": "DONE",
      "message": "Compliance path completed successfully"
    }
  ],
  "metadata": {
    "scan_summary": "Flagged 0 potential assets",
    "flagged_count": 0,
    "clean_count": 4,
    "total_files": 4,
    "assets_saved": 0,
    "scan_saved": true,
    "scan_id": "550e8400-e29b-41d4-a716-446655440000",
    "scan_table": "compliance_scans",
    "used_defaults": true
  }
}
```

### Database Record (Defaults Used)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-23T12:00:01.500Z",
  "project": "SkySky",
  "input_files_json": [
    {"name": "video_demo_watermark.mp4", "path": "videos/video_demo_watermark.mp4"},
    {"name": "music_preview_track.wav", "path": "music/music_preview_track.wav"},
    {"name": "image_sample_render.png", "path": "images/image_sample_render.png"},
    {"name": "project_template_preview.aep", "path": "templates/project_template_preview.aep"}
  ],
  "output_json": {
    "flagged": [],
    "clean": [
      {"name": "video_demo_watermark.mp4", "path": "videos/video_demo_watermark.mp4"},
      {"name": "music_preview_track.wav", "path": "music/music_preview_track.wav"},
      {"name": "image_sample_render.png", "path": "images/image_sample_render.png"},
      {"name": "project_template_preview.aep", "path": "templates/project_template_preview.aep"}
    ],
    "counts": {
      "total": 4,
      "flagged": 0,
      "clean": 4
    },
    "summary": "Flagged 0 potential assets"
  },
  "flagged_count": 0,
  "clean_count": 4,
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

## Confirmation: Neutral and System-Only

### ✅ Neutral Filenames
- No provider names (Runway, Artlist, MotionArray, etc.)
- No project-specific identifiers
- Generic descriptive names only
- Suitable for any project or context

### ✅ System-Owned
- Defined in single constant: `DEFAULT_SAMPLE_FILES`
- Comment clearly states: "System-owned neutral demo inputs. Not real assets."
- Never saved as real assets
- Excluded from asset ownership logic

### ✅ Metadata Flags
- `is_sample: true` - Marks as sample files
- `source: "system_default"` - Indicates system origin
- `used_due_to_empty_input: true` - Tracks why defaults were used

### ✅ Asset Protection
- `!usedDefaults` check prevents saving when defaults are used
- `isDefaultFile` check prevents individual default files from being saved
- Default files explicitly skipped in asset saving logic

---

## Changed Files

1. **frontend/src/app/api/test/golden-path/route.ts**
   - Added `DEFAULT_SAMPLE_FILES` constant
   - Updated default files to neutral names
   - Added metadata flags to scan records
   - Added asset protection logic

2. **frontend/src/app/agent-console/page.tsx**
   - Added `DEFAULT_SAMPLE_FILES` constant
   - Updated default input to use neutral filenames
   - Updated placeholder text

3. **docs/COMPLIANCE_EMPTY_FILES_FIX.md**
   - Updated examples to use neutral filenames

---

## Status: ✅ COMPLETE

All requirements met:
- ✅ Neutral, generic default filenames (no provider/project names)
- ✅ Single constant with clear comment
- ✅ Metadata flags: `is_sample`, `source`, `used_due_to_empty_input`
- ✅ Defaults never saved as real assets
- ✅ Excluded from asset ownership logic

