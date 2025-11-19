import { AgentRunResult } from "@/agents/core/BaseAgent";

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
