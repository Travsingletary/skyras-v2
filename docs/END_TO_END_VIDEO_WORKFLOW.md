# End-to-End Video Production Workflow

Complete guide to the NanoBanana Pro + Kling AI video production pipeline.

## Overview

This workflow implements the complete video production pipeline demonstrated in the video:
**Story → Music → Character → Storyboard → Video**

## Workflow Phases

### Phase 1: Story & Music Foundation

**Goal**: Lock the why before generating visuals.

1. **Story Concept** (Atlas/Existing Agents)
   - Start with a story concept
   - Short narrative, not a full script

2. **Lyrics Generation** (Giorgio)
   - Story → Lyrics using AI (Claude)
   - Lyrics match narrative arc and emotional tone

3. **Music Generation** (Giorgio + Suno)
   - Lyrics → Music using Suno
   - Style selection (e.g., Afrobeats/Motown blend)
   - Music becomes emotional timing reference

**Key Insight**: Music drives pacing, mood, and shot selection. Visuals follow rhythm.

### Phase 2: Character & Prop Lock-In (NanoBanana Pro)

**Goal**: Eliminate character and prop drift.

1. **Character Pose Sheet** (Giorgio + NanoBanana Pro)
   - Side-by-side layout: close-up portrait + full-body view
   - Anchors identity across all shots
   - Reference images for character inspiration
   - Upscale references for high-quality anchors

**Result**: Every shot is now constrained by the same visual DNA.

### Phase 3: Storyboard Generation (NanoBanana Pro)

**Goal**: Replace manual shot-by-shot prompting.

1. **Storyboard Contact Sheet** (Giorgio + NanoBanana Pro)
   - Single storyboard prompt
   - Generates 9-12 frames at once (configurable)
   - Each frame = different angle, pose, lighting, action
   - All shots remain consistent
   - Generate at maximum resolution (4K)

**Why this is powerful**:
- Speed: 9 cinematic shots at once
- Variety: angles you wouldn't think to prompt manually
- Consistency: same character + props throughout

### Phase 4: Frame Selection & Upscaling

**Goal**: Turn storyboards into production-ready assets.

1. **Select Strong Frames** (Manual or AI-driven)
   - Choose frames that work best for motion
   - Consider pacing and rhythm from music

2. **Upscale Selected Frames** (Giorgio + NanoBanana Pro)
   - Upscale specific frames to 4K or 8K
   - Produces clean, sharp images
   - Fix drift if it happens (re-apply character sheet)

**Outcome**: High-resolution, consistent stills ready for video generation.

### Phase 5: Video Generation (Kling AI)

**Goal**: Add motion, realism, and polish.

1. **Choose Kling Model** (Based on need)
   - **Kling 2.5 Turbo**: Motion-only shots (fastest)
   - **Kling 1.0**: Editing power (lighting, weather, outfits)
   - **Kling 2.6**: Baked-in voices + sound design

2. **Generate Videos** (Giorgio + Kling AI)
   - Image-to-video from upscaled frames
   - Post-production editing inside Kling:
     - Change lighting
     - Swap weather
     - Adjust camera angles
     - Remove watermarks
     - Replace characters if needed

**Key Shift**: Kling becomes a post-production tool, not just a generator.

### Phase 6: Final Assembly

**Goal**: Bring everything together.

1. **Audio Strategy**
   - Use Kling 2.6 for baked-in audio (dialogue + sound design)
   - Optional: Voice replacement with ElevenLabs
   - Or cut around weak acting

2. **Final Edit** (External tool like CapCut)
   - Replace placeholders with real shots
   - Refine pacing
   - Sync with music
   - Prep for final export

## Using the Workflow in SkyRas

### Via Workflow Template

```typescript
import { createNanoBananaKlingWorkflow } from '@/lib/workflow/templates/nanobananaKlingWorkflow';

const delegations = createNanoBananaKlingWorkflow({
  project: 'My Video Project',
  story: 'A hero overcomes internal conflict...',
  mood: 'uplifting',
  style: 'cinematic',
  characters: ['Protagonist'],
  frameCount: 9,
  klingModel: '2.5-turbo',
  duration: 5,
  aspectRatio: '16:9',
});
```

### Via Atlas Conversation

Simply describe your video project to Atlas:

```
"I want to create a video about [story]. 
Generate the complete workflow: story → music → character → storyboard → video."
```

Atlas will:
1. Process the story concept
2. Delegate to Giorgio for each phase
3. Orchestrate the complete workflow
4. Track progress through all phases

### Individual Phases

You can also run individual phases:

```typescript
import { createPhaseWorkflow } from '@/lib/workflow/templates/nanobananaKlingWorkflow';

// Just music generation
const musicDelegations = createPhaseWorkflow('music', config);

// Just character sheet
const characterDelegations = createPhaseWorkflow('character', config);

// Just storyboard
const storyboardDelegations = createPhaseWorkflow('storyboard', config);

// Just video
const videoDelegations = createPhaseWorkflow('video', config);
```

## Workflow Dependencies

The workflow respects dependencies:

1. **Music** depends on **Lyrics**
2. **Storyboard** depends on **Character Sheet**
3. **Video** depends on **Upscaled Frames**
4. **Upscale** depends on **Storyboard**

The system automatically sequences tasks based on these dependencies.

## Asset Relationships

All assets are linked:
- Character sheets → Storyboards
- Storyboards → Upscaled frames
- Upscaled frames → Videos
- Music → Videos (for timing reference)

This enables:
- Traceability from story to final video
- Iterative refinement
- Asset reuse across projects

## Best Practices

1. **Lock constraints early**: Character sheet before storyboard
2. **Generate in batches**: Use storyboard contact sheets, not single shots
3. **4K resolution**: Essential for video generation quality
4. **Music first**: Let music drive pacing and shot selection
5. **Fix drift early**: Address consistency issues before upscaling
6. **Model selection**: Choose the right Kling model for your needs

## Troubleshooting

### Character Drift
- Re-generate character sheet with clearer references
- Use `fixDrift` action to re-apply character consistency
- Ensure character sheet is used in storyboard generation

### Low Quality Videos
- Ensure storyboard frames are generated at 4K
- Upscale frames before video generation
- Check that upscaled frames are actually used

### Music Timing Issues
- Generate music first to establish pacing
- Use music duration to guide video length
- Sync video cuts with music beats

### Provider Failures
- System automatically falls back to Runway if Kling fails
- Check API keys are configured correctly
- Verify provider priority in environment variables

## Integration Points

- **Atlas**: Story concept processing, workflow initiation
- **Giorgio**: All creative generation actions
- **Workflow System**: Task orchestration, dependency management
- **File Processing**: Asset upload and storage
- **Supabase Storage**: All generated assets stored here

## Next Steps

1. Configure API keys (Kling, NanoBanana, Suno)
2. Test individual phases
3. Run complete workflow
4. Refine based on results
5. Iterate and improve

For detailed API documentation, see:
- `docs/KLING_AI_INTEGRATION.md`
- `docs/NANOBANANA_PRO_INTEGRATION.md`
- `RUNWAY_INTEGRATION.md`
