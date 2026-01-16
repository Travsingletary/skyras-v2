# Step 5: Finish - Design Specification

**Status:** ✅ Implemented
**Component:** `FinishView.tsx`
**Purpose:** Generate, review, approve, and export final video

---

## Overview

Step 5 (Finish) is where video generation, approval, and completion occur. Users generate videos from their approved storyboard frames, review the output, approve the final version, and complete the project.

## Core Responsibility

**Dominant Objects:**
1. Video Generation (trigger and monitor)
2. Video Preview & Approval
3. Project Completion

## 1. Wireframe

### Main View (Ready to Generate)

```
┌─────────────────────────────────────────────────────┐
│ [Step 5] Finish                                      │
│ Generate your final video, review, and approve...   │
├─────────────────────────────────────────────────────┤
│ Video Generation                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓ Ready to Generate Video                       │ │
│ │   All prerequisites complete.                    │ │
│ │   Generate your final video output.              │ │
│ │                                   [Generate Video]│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Generated Videos                                     │
│ (No videos generated yet. Generate your first...)    │
├─────────────────────────────────────────────────────┤
│ [Complete Project] (disabled)                        │
│ Approve a video to complete the project              │
└─────────────────────────────────────────────────────┘
```

### With Generated Video (Unapproved)

```
┌─────────────────────────────────────────────────────┐
│ [Step 5] Finish                                      │
│ Generate your final video, review, and approve...   │
├─────────────────────────────────────────────────────┤
│ Video Generation                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓ Ready to Generate Video                       │ │
│ │   Generate additional videos if needed.          │ │
│ │                                   [Generate Video]│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Generated Videos                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Video 01/16/2026                    [Ready]      │ │
│ │ Provider: Kling AI                               │ │
│ │ Status: completed                                │ │
│ │                                                  │ │
│ │ [Video Preview Player]                           │ │
│ │ ───────────────────────────────────────          │ │
│ │                                                  │ │
│ │ [Approve] [Download] [Regenerate]                │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [Complete Project] (disabled)                        │
│ Approve a video to complete the project              │
└─────────────────────────────────────────────────────┘
```

### With Approved Video

```
┌─────────────────────────────────────────────────────┐
│ [Step 5] Finish                                      │
│ Generate your final video, review, and approve...   │
├─────────────────────────────────────────────────────┤
│ Video Generation                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓ Ready to Generate Video                       │ │
│ │   Generate additional videos if needed.          │ │
│ │                                   [Generate Video]│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Generated Videos                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Video 01/16/2026            [✓ Approved]         │ │
│ │ Provider: Kling AI                               │ │
│ │ Status: completed                                │ │
│ │                                                  │ │
│ │ [Video Preview Player]                           │ │
│ │ ───────────────────────────────────────────────  │ │
│ │                                                  │ │
│ │ [Download] [Regenerate]                          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [Complete Project ✓] (enabled)                       │
└─────────────────────────────────────────────────────┘
```

### Video Generation Blocked

```
┌─────────────────────────────────────────────────────┐
│ [Step 5] Finish                                      │
│ Generate your final video, review, and approve...   │
├─────────────────────────────────────────────────────┤
│ Video Generation                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✗ Video Generation Blocked                      │ │
│ │   Video generation blocked: Create storyboard    │ │
│ │   frames first.                                  │ │
│ │   Go back to Step 4 to complete prerequisites.   │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Generated Videos                                     │
│ (No videos generated yet.)                           │
├─────────────────────────────────────────────────────┤
│ [Complete Project] (disabled)                        │
│ Approve a video to complete the project              │
└─────────────────────────────────────────────────────┘
```

## 2. Video States

### Video Card States

| State | Badge | Actions | Visual |
|-------|-------|---------|--------|
| **Generating** | Blue "Generating..." | None (wait) | Blue border, no preview |
| **Completed** | Yellow "Ready" | Approve, Download, Regenerate | Gray border, video player |
| **Approved** | Green "✓ Approved" | Download, Regenerate | Green border, video player |
| **Failed** | Red "Failed" | Retry | Red border, error message |

### Video Generation Gate

**Enabled when:**
- `canGenerateVideo()` returns `{ allowed: true }`
- Requires: All storyboard frames approved

**Disabled when:**
- No storyboard frames exist
- Some frames are unapproved
- Shows block reason

## 3. User Actions

### Generate Video

**Button:** "Generate Video" (green)
**Enabled when:** Gate check passes
**Action:**
1. Call `/api/tools/generateVideo` with project ID
2. Create video job (async)
3. Store video metadata in `project.metadata.generatedVideos`
4. Show "Generating..." status
5. Poll for completion (every 5 seconds)

### Approve Video

**Button:** "Approve" (green)
**Enabled when:** Video status = completed
**Action:**
1. Update video metadata: `approved: true, approved_by: userId, approved_at: timestamp`
2. Enable "Complete Project" button
3. Change badge to "✓ Approved"
4. Remove "Approve" button

### Download Video

**Button:** "Download" (gray border)
**Enabled when:** Video URL exists and status = completed
**Action:** Open video URL in new tab

### Regenerate Video

**Button:** "Regenerate" (gray border)
**Enabled when:** Video status = completed
**Action:**
1. Unapprove all existing videos
2. Generate new video
3. Reset approval state

### Retry (Failed Video)

**Button:** "Retry" (blue)
**Enabled when:** Video status = failed
**Action:** Same as "Generate Video"

### Complete Project

**Button:** "Complete Project ✓" (purple)
**Enabled when:** At least one video approved and status = completed
**Action:**
1. Call `onComplete()` callback
2. Optionally mark project status as "completed"
3. Show success message or redirect

## 4. Video Polling

**Trigger:** When any video has status = 'generating'
**Interval:** 5 seconds
**Action:**
1. Reload video data from database
2. Update UI with new status
3. Stop polling when all videos are completed/failed

**Implementation:**
```typescript
useEffect(() => {
  if (videos.some(v => v.status === 'generating')) {
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }
}, [videos, projectId]);
```

## 5. Data Sources

### Video Clips Table
```typescript
interface VideoClip {
  id: string;
  project_id: string;
  user_id: string;
  video_url?: string;
  thumbnail_url?: string;
  status: 'completed' | 'generating' | 'failed';
  provider?: string;
  error_message?: string;
  metadata?: {
    approved?: boolean;
    approved_by?: string;
    approved_at?: string;
    prompt?: string;
  };
}
```

**Query:** `videoClipsDb.getByProjectId(projectId)`

### Project Metadata (Alternative)
```typescript
project.metadata.generatedVideos = [
  {
    id: string;
    created_at: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    status: 'succeeded' | 'running' | 'pending' | 'failed';
    provider?: string;
    prompt?: string;
    approved?: boolean;
    approved_by?: string;
    approved_at?: string;
    error?: string;
  }
]
```

**Query:** `projectsDb.getById(projectId)`

### Combined Approach
- Load from both `video_clips` table and `project.metadata.generatedVideos`
- Merge and sort by `created_at` (newest first)
- Normalize status values

## 6. Gating Logic

### Video Generation Gate

**Function:** `canGenerateVideo(projectId)`
**Returns:** `{ allowed: boolean; reason?: string }`

**Pass when:**
- Storyboard frames exist (`totalFrames > 0`)
- All frames are approved (`approvedFrames === totalFrames`)

**Fail when:**
- No storyboard frames: "Video generation blocked: Create storyboard frames first."
- Some frames unapproved: "Video generation blocked: Only X of Y storyboard frames are approved. Approve all frames first."

### Complete Project Gate

**Enabled when:**
- At least one video has `approved === true`
- That video has `status === 'completed'`
- Video URL exists

**Disabled when:**
- No videos exist
- No approved videos
- Approved video is still generating

## 7. Error Handling

### Video Generation Failed
- Show error message in video card
- Display "Failed" badge (red)
- Show "Retry" button
- Keep other videos visible

### Network Error
- Show error banner at top
- Keep existing videos visible
- Allow retry

### Missing Prerequisites
- Show block message
- Link back to Step 4
- Disable "Generate Video" button

## 8. Implementation Details

### Component
**File:** `frontend/src/components/project/views/FinishView.tsx`

**Props:**
```typescript
interface FinishViewProps {
  projectId: string;
  userId: string;
  onComplete?: () => void;
  onUpdate?: () => void;
}
```

### State Management
```typescript
const [videos, setVideos] = useState<VideoWithApproval[]>([]);
const [canGenerate, setCanGenerate] = useState(false);
const [blockReason, setBlockReason] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [generating, setGenerating] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Video Model
```typescript
interface VideoWithApproval {
  id: string;
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  status: 'completed' | 'generating' | 'failed';
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  provider?: string;
  prompt?: string;
  error?: string;
}
```

## 9. API Integration

### Generate Video
**Endpoint:** `POST /api/tools/generateVideo`
**Request:**
```json
{
  "prompt": "Generate video from approved storyboard frames for project {projectId}",
  "projectId": "...",
  "duration": 5,
  "aspectRatio": "16:9",
  "waitForCompletion": false
}
```

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "...",
    "videoUrl": "...",
    "thumbnailUrl": "...",
    "provider": "kling",
    "prompt": "..."
  },
  "status": "pending",
  "taskId": "..."
}
```

## 10. Visual Design

### Colors
- **Step Badge:** Purple (`bg-purple-100 text-purple-700`)
- **Generate Button:** Green (`bg-green-600`)
- **Approve Button:** Green (`bg-green-600`)
- **Complete Button:** Purple (`bg-purple-600`)
- **Download/Regenerate:** Gray border (`border-gray-300`)

### Video Card
- **Default:** White background, gray border
- **Approved:** Green border (`border-green-500`), green tint background
- **Generating:** Blue badge, gray border
- **Failed:** Red badge, red border

### Complete Button
- **Disabled:** Gray (`bg-gray-300 text-gray-600`)
- **Enabled:** Purple (`bg-purple-600 text-white`)

## 11. Edge Cases

| Scenario | Behavior |
|----------|----------|
| No storyboard frames | Block video generation, show message |
| Generate multiple videos | Show all in list, allow approving any |
| Video still generating | Show progress, disable complete button |
| User approves then regenerates | Keep approval, generate new video |
| All videos failed | Allow retry, disable complete |
| Network error during generation | Show error, allow retry |

## 12. Step Flow

```
Step 4: Review (Checklist Pass) → Step 5: Finish
                                       ↓
                                 [Generate Video]
                                       ↓
                                 [Monitor Status]
                                       ↓
                                 [Review Preview]
                                       ↓
                                  [Approve Video]
                                       ↓
                                [Complete Project]
```

## 13. Testing Checklist

- [ ] Generate video → Shows "Generating..." → Completes
- [ ] Approve video → Enables complete button
- [ ] Download video → Opens in new tab
- [ ] Regenerate video → Unapproves and generates new
- [ ] Complete project → Calls onComplete callback
- [ ] Block generation when no frames
- [ ] Block generation when frames unapproved
- [ ] Handle generation failure gracefully
- [ ] Poll for status updates
- [ ] Display multiple videos correctly

## 14. Constraints Compliance

✅ **No new backend logic**
- Uses existing `/api/tools/generateVideo` endpoint
- Uses existing video clips database
- Uses existing `canGenerateVideo()` gate function

✅ **Relocates video logic from Step 4**
- All video generation moved from ReviewView
- All video approval moved from ReviewView
- Step 4 is now purely checklist

✅ **Focused view**
- No sidebars during Step 5
- Single unified view
- Video generation + approval in one place

✅ **Step language maintained**
- Step 5: Finish (video generation + completion)

---

**Created:** 2026-01-16
**Related:** STEP_4_REVIEW_DESIGN.md
**Component:** FinishView.tsx
