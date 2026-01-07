import { AgentRunResult, AgentExecutionContext } from "@/agents/core/BaseAgent";

export interface CreativeInput {
  project: string;
  context?: string;
  mood?: string;
  characters?: string[];
  style?: string;
  tone?: string;
  beats?: string[];
}

function ensureProject(input: CreativeInput) {
  if (!input.project) {
    throw new Error("project is required for Giorgio actions");
  }
}

function baseMetadata(project: string, style?: string) {
  return {
    agent: "giorgio",
    project,
    style,
    timestamp: new Date().toISOString(),
  };
}

function createResponse(project: string, style: string | undefined, summary: string, creativity: Record<string, unknown>): AgentRunResult {
  return {
    output: summary,
    notes: {
      creativity,
      metadata: baseMetadata(project, style),
    },
  };
}

export async function generateSoraPrompt(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "sora_prompt",
    prompt: `Cinematic ${input.project} sequence in ${input.mood ?? "dynamic"} mood with ${input.context ?? "floating camera"}.`,
    visual_language: input.style ?? "neon-realism",
    beats: input.beats ?? ["Establish world", "Character focus", "Signature move"],
  };
  return createResponse(input.project, input.style, `Sora prompt drafted for ${input.project}.`, creativity);
}

export async function generateScriptOutline(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "script_outline",
    logline: input.context ?? `${input.project} hero overcomes internal conflict`,
    acts: [
      { act: 1, beat: "Inciting event disrupts daily rhythm" },
      { act: 2, beat: `Character confronts lesson about ${input.mood ?? "trust"}` },
      { act: 3, beat: "Resolution inspires the audience" },
    ],
  };
  return createResponse(input.project, input.style, `Script outline assembled for ${input.project}.`, creativity);
}

export async function generateSceneBeats(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "scene_beats",
    beats: [
      { label: "Hook", description: `Bold intro that anchors ${input.project}` },
      { label: "Conflict", description: input.context ?? "Tension between friends" },
      { label: "Release", description: "Signature pose or payoff moment" },
    ],
  };
  return createResponse(input.project, input.style, `Scene beats drafted for ${input.project}.`, creativity);
}

export async function generateCharacterSheet(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "character_sheet",
    name: input.characters?.[0] ?? `${input.project} Protagonist`,
    traits: ["curious", input.mood ?? "steady", "hyper-observant"],
    wardrobe: input.style ?? "chromed streetwear",
    voice: input.tone ?? "warm and witty",
  };
  return createResponse(input.project, input.style, `Character sheet mapped for ${input.project}.`, creativity);
}

export async function generateSocialHook(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "social_hook",
    hook: `POV: ${input.project} faces ${input.context ?? "their biggest creative rival"}.`,
    cta: "Drop your take in the comments",
    platform: input.style ?? "tiktok",
  };
  return createResponse(input.project, input.style, `Social hook written for ${input.project}.`, creativity);
}

export async function generateShotIdeas(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "shot_list",
    shots: [
      { angle: "low push-in", description: "Hero framed against luminous skyline" },
      { angle: "360 wrap", description: input.context ?? "Swirl around team during beat drop" },
      { angle: "macro", description: "Hands on tactile prop to show stakes" },
    ],
  };
  return createResponse(input.project, input.style, `Shot ideas generated for ${input.project}.`, creativity);
}

export async function generateBrandConcept(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "brand_concept",
    theme: input.mood ?? "hyper-optimistic futurism",
    pillars: ["Community", "Play", input.context ?? "Quiet confidence"],
    tagline: `${input.project}: ${input.style ?? "Keep rising"}`,
  };
  return createResponse(input.project, input.style, `Brand concept established for ${input.project}.`, creativity);
}

export async function generateCoverArtPrompt(_: unknown, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  const creativity = {
    type: "cover_art",
    description: `Cover art for ${input.project} with ${input.mood ?? "dream noir"} energy, ${input.context ?? "floating geometry"}.`,
    palette: input.style ?? "electric blues + rose gold",
  };
  return createResponse(input.project, input.style, `Cover art prompt summarized for ${input.project}.`, creativity);
}

export interface GenerateImageInput extends CreativeInput {
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  stylePreset?: string;
  seed?: number;
}

// Kling AI Video Generation Actions

export interface KlingVideoInput extends CreativeInput {
  imageUrl: string;
  duration?: number;
  aspectRatio?: string;
  klingModel?: '2.5-turbo' | '1.0' | '2.6';
  editOptions?: {
    lighting?: string;
    weather?: string;
    cameraAngle?: string;
    removeWatermark?: boolean;
    replaceCharacter?: string;
  };
}

export async function generateKlingVideo(context: AgentExecutionContext, input: KlingVideoInput & { workflowId?: string }): Promise<AgentRunResult> {
  ensureProject(input);
  
  if (!input.imageUrl) {
    throw new Error('imageUrl is required for Kling video generation');
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const videoUrl = apiBaseUrl 
    ? `${apiBaseUrl}/api/tools/generateVideo`
    : '/api/tools/generateVideo';

  try {
    const videoPrompt = `${input.context || input.project}${input.mood ? ` in a ${input.mood} mood` : ''}${input.style ? `, ${input.style} style` : ''}`;

    const response = await fetch(videoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        imageUrl: input.imageUrl,
        duration: input.duration || 5,
        aspectRatio: input.aspectRatio || '16:9',
        provider: 'kling',
        klingModel: input.klingModel || '2.5-turbo',
        editOptions: input.editOptions,
        projectId: input.project,
        workflowId: input.workflowId,
        agentName: 'giorgio',
        waitForCompletion: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kling video generation failed: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Kling video generation failed');
    }

    const creativity = {
      type: "kling_video",
      videoId: result.video.id,
      videoUrl: result.video.videoUrl,
      thumbnailUrl: result.video.thumbnailUrl,
      prompt: videoPrompt,
      duration: result.video.duration,
      model: result.video.model,
      provider: result.video.provider,
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Generated ${result.video.duration || 5}s video using Kling ${input.klingModel || '2.5-turbo'}. Video ready at: ${result.video.videoUrl}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Kling video generation failed", { error });
    return {
      output: `Failed to generate Kling video: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}

// NanoBanana Pro Actions

export interface NanoBananaCharacterSheetInput extends CreativeInput {
  characterDescription?: string;
  referenceImages?: string[];
}

export async function generateNanoBananaCharacterSheet(context: AgentExecutionContext, input: NanoBananaCharacterSheetInput & { workflowId?: string }): Promise<AgentRunResult> {
  ensureProject(input);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const nanobananaUrl = apiBaseUrl 
    ? `${apiBaseUrl}/api/tools/nanobanana`
    : '/api/tools/nanobanana';

  try {
    const response = await fetch(nanobananaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'characterSheet',
        prompt: input.context || input.project,
        characterDescription: input.characterDescription,
        referenceImages: input.referenceImages,
        style: input.style,
        projectId: input.project,
        workflowId: input.workflowId,
        agentName: 'giorgio',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Character sheet generation failed: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Character sheet generation failed');
    }

    const creativity = {
      type: "nanobanana_character_sheet",
      characterSheetUrl: result.characterSheetUrl,
      portraitUrl: result.portraitUrl,
      fullBodyUrl: result.fullBodyUrl,
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Generated character sheet for ${input.project}. Character sheet available at: ${result.characterSheetUrl}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Character sheet generation failed", { error });
    return {
      output: `Failed to generate character sheet: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}

export interface NanoBananaStoryboardInput extends CreativeInput {
  characterSheetUrl?: string;
  referenceImages?: string[];
  frameCount?: number;
  resolution?: '4k' | '2k' | '1080p';
}

export async function generateNanoBananaStoryboard(context: AgentExecutionContext, input: NanoBananaStoryboardInput & { workflowId?: string }): Promise<AgentRunResult> {
  ensureProject(input);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const nanobananaUrl = apiBaseUrl 
    ? `${apiBaseUrl}/api/tools/nanobanana`
    : '/api/tools/nanobanana';

  try {
    const response = await fetch(nanobananaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'storyboard',
        prompt: input.context || input.project,
        characterSheetUrl: input.characterSheetUrl,
        referenceImages: input.referenceImages,
        frameCount: input.frameCount || 9,
        resolution: input.resolution || '4k',
        style: input.style,
        projectId: input.project,
        workflowId: input.workflowId,
        agentName: 'giorgio',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Storyboard generation failed: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Storyboard generation failed');
    }

    const creativity = {
      type: "nanobanana_storyboard",
      storyboardUrl: result.storyboardUrl,
      frames: result.frames || [],
      frameCount: result.frames?.length || 0,
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Generated storyboard with ${result.frames?.length || 0} frames for ${input.project}. Storyboard available at: ${result.storyboardUrl}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Storyboard generation failed", { error });
    return {
      output: `Failed to generate storyboard: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}

export interface NanoBananaUpscaleInput extends CreativeInput {
  imageUrl: string;
  frameIndex?: number;
  targetResolution?: '4k' | '8k';
}

export async function upscaleNanoBananaFrame(context: AgentExecutionContext, input: NanoBananaUpscaleInput & { workflowId?: string }): Promise<AgentRunResult> {
  ensureProject(input);

  if (!input.imageUrl) {
    throw new Error('imageUrl is required for upscaling');
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const nanobananaUrl = apiBaseUrl 
    ? `${apiBaseUrl}/api/tools/nanobanana`
    : '/api/tools/nanobanana';

  try {
    const response = await fetch(nanobananaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upscale',
        imageUrl: input.imageUrl,
        frameIndex: input.frameIndex,
        targetResolution: input.targetResolution || '4k',
        projectId: input.project,
        workflowId: input.workflowId,
        agentName: 'giorgio',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Frame upscaling failed: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Frame upscaling failed');
    }

    const creativity = {
      type: "nanobanana_upscale",
      upscaledUrl: result.upscaledUrl,
      originalUrl: input.imageUrl,
      resolution: input.targetResolution || '4k',
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Upscaled frame to ${input.targetResolution || '4k'} for ${input.project}. Upscaled image available at: ${result.upscaledUrl}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Frame upscaling failed", { error });
    return {
      output: `Failed to upscale frame: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}

// Music Generation Actions

export interface LyricsInput extends CreativeInput {
  story?: string;
}

export async function generateLyricsFromStory(context: AgentExecutionContext, input: LyricsInput): Promise<AgentRunResult> {
  ensureProject(input);

  const { Anthropic } = await import('@anthropic-ai/sdk');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required for lyrics generation');
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const story = input.story || input.context || input.project;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: 'You are a creative songwriter. Generate lyrics that match the narrative arc and emotional tone of the story provided. Make the lyrics suitable for music generation.',
      messages: [
        {
          role: 'user',
          content: `Generate lyrics for a song based on this story: ${story}. The mood should be ${input.mood || 'uplifting'}.`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    const lyrics = textContent && textContent.type === 'text' ? textContent.text : 'No lyrics generated';

    const creativity = {
      type: "lyrics",
      lyrics,
      story,
      mood: input.mood,
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Generated lyrics for ${input.project}:\n\n${lyrics}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Lyrics generation failed", { error });
    return {
      output: `Failed to generate lyrics: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}

export interface MusicInput extends CreativeInput {
  lyrics: string;
  style?: string;
  durationSeconds?: number;
}

export async function generateMusicFromLyrics(context: AgentExecutionContext, input: MusicInput & { workflowId?: string }): Promise<AgentRunResult> {
  ensureProject(input);

  if (!input.lyrics) {
    throw new Error('lyrics is required for music generation');
  }

  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const sunoUrl = apiBaseUrl 
      ? `${apiBaseUrl}/api/tools/suno`
      : '/api/tools/suno';

    const response = await fetch(sunoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: input.context || input.project,
        lyrics: input.lyrics,
        style: input.style || 'pop',
        mood: input.mood,
        durationSeconds: input.durationSeconds || 60,
        projectId: input.project,
        workflowId: input.workflowId,
        agentName: 'giorgio',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Music generation failed: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Music generation failed');
    }

    const creativity = {
      type: "suno_music",
      fileUrl: result.music.fileUrl,
      audioUrl: result.music.audioUrl,
      qnapPath: result.music.qnapPath,
      lyrics: input.lyrics,
      style: input.style || 'pop',
      duration: input.durationSeconds || 60,
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Generated music for ${input.project} using Suno. Music available at: ${result.music.fileUrl || result.music.audioUrl}${result.music.qnapPath ? ` (QNAP: ${result.music.qnapPath})` : ''}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Music generation failed", { error });
    return {
      output: `Failed to generate music: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}
