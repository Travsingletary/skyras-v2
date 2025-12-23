import { AgentRunResult, AgentExecutionContext } from "@/agents/core/BaseAgent";
import { Anthropic } from "@anthropic-ai/sdk";

export interface CreativeInput {
  project: string;
  context?: string;
  mood?: string;
  characters?: string[];
  style?: string;
  tone?: string;
  beats?: string;
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

async function generateWithAI(
  context: AgentExecutionContext,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "AI generation requires ANTHROPIC_API_KEY. Falling back to template response.";
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    return textContent && textContent.type === "text" ? textContent.text : "No response generated";
  } catch (error) {
    context.logger.error("AI generation failed", { error });
    return `AI generation failed: ${(error as Error).message}`;
  }
}

export async function generateScriptOutline(context: AgentExecutionContext, input: CreativeInput): Promise<AgentRunResult> {
  ensureProject(input);
  
  const systemPrompt = `You are Giorgio, the creative engine for SkyRas Agency. You're bold, imaginative, and deeply understand Trav's creative vision. When brainstorming, be conversational, throw out wild ideas, ask questions, and build on what others say. This is a real creative session - be spontaneous and authentic.`;
  
  const prompt = `Generate a script outline for ${input.project}${input.context ? ` about: ${input.context}` : ''}${input.mood ? ` with a ${input.mood} mood` : ''}${input.characters?.length ? ` featuring: ${input.characters.join(', ')}` : ''}${input.beats?.length ? ` with these beats: ${input.beats.join(', ')}` : ''}.

Be creative, specific, and conversational. Think out loud. What's the hook? What makes this interesting? What's the emotional core?`;

  const aiOutput = await generateWithAI(context, prompt, systemPrompt);
  
  const creativity = {
    type: "script_outline",
    generated: aiOutput,
    project: input.project,
    mood: input.mood,
    style: input.style,
  };
  
  return createResponse(input.project, input.style, aiOutput, creativity);
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

export async function generateImage(context: AgentExecutionContext, input: CreativeInput & { size?: "512x512" | "1024x1024" | "1536x1536" }): Promise<AgentRunResult> {
  ensureProject(input);
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const imageUrl = apiBaseUrl 
    ? `${apiBaseUrl}/api/tools/generateImage`
    : '/api/tools/generateImage';

  try {
    // Build the image prompt from the creative input
    const imagePrompt = `${input.context || input.project}${input.mood ? `, ${input.mood} mood` : ''}${input.style ? `, ${input.style} style` : ''}${input.characters && Array.isArray(input.characters) && input.characters.length ? `, featuring ${input.characters.join(' and ')}` : ''}`;

    const response = await fetch(imageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        prompt: imagePrompt,
        style: input.style,
        size: input.size || '1024x1024',
        projectId: input.project,
        agentName: 'giorgio',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image generation failed: HTTP ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error || 'Image generation failed');
    }

    const creativity = {
      type: "generated_image",
      fileUrl: result.file_url,
      prompt: imagePrompt,
      size: result.width && result.height ? `${result.width}x${result.height}` : input.size || '1024x1024',
      model: result.model_name,
      provider: result.provider,
      costEstimate: result.cost_estimate,
      project: input.project,
    };

    return createResponse(
      input.project,
      input.style,
      `Generated image for ${input.project} using ${result.provider || 'image generation'}. Image available at: ${result.file_url}`,
      creativity
    );
  } catch (error) {
    context.logger.error("Image generation failed", { error });
    return {
      output: `Failed to generate image: ${(error as Error).message}`,
      notes: {
        error: (error as Error).message,
        metadata: baseMetadata(input.project, input.style),
      },
    };
  }
}
