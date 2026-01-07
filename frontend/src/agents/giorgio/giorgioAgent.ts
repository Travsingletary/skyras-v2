import fs from "node:fs";
import path from "node:path";

import { AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import {
  generateBrandConcept,
  generateCharacterSheet,
  generateCoverArtPrompt,
  generateSceneBeats,
  generateShotIdeas,
  generateSocialHook,
  generateSoraPrompt,
  generateScriptOutline,
  generateNanoBananaCharacterSheet,
  generateNanoBananaStoryboard,
  upscaleNanoBananaFrame,
  generateKlingVideo,
  generateLyricsFromStory,
  generateMusicFromLyrics,
  type CreativeInput,
} from "./giorgioActions";

const PROMPT_PATH = path.join(process.cwd(), "src/agents/giorgio/giorgioSystemPrompt.md");

function loadPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, "utf-8");
  } catch {
    return "You are Giorgio, a fearless creative.";
  }
}

const PROMPT = loadPrompt();

type GiorgioAction =
  | "generateSoraPrompt"
  | "generateScriptOutline"
  | "generateSceneBeats"
  | "generateCharacterSheet"
  | "generateSocialHook"
  | "generateShotIdeas"
  | "generateBrandConcept"
  | "generateCoverArtPrompt"
  | "generateNanoBananaCharacterSheet"
  | "generateNanoBananaStoryboard"
  | "upscaleNanoBananaFrame"
  | "generateKlingVideo"
  | "generateLyricsFromStory"
  | "generateMusicFromLyrics";

export class GiorgioAgent extends BaseAgent {
  constructor() {
    super({
      name: "giorgio",
      memoryNamespace: "creative_giorgio",
      systemPrompt: PROMPT,
      logger: createLogger("GiorgioAgent"),
    });
  }

  protected async handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult> {
    const action = (input.metadata?.action as GiorgioAction | undefined) ?? "generateScriptOutline";
    const payload = input.metadata?.payload as CreativeInput | undefined;
    if (!payload) {
      throw new Error("Giorgio actions require payload metadata");
    }

    // Extract workflowId from metadata if available
    const workflowId = input.metadata?.workflowId as string | undefined;

    context.logger.info(`Giorgio running action ${action}`, { project: payload.project, workflowId });

    // Add workflowId to payload for actions that need it
    const payloadWithWorkflow = { ...payload, workflowId };

    switch (action) {
      case "generateSoraPrompt":
        return generateSoraPrompt(context, payload);
      case "generateScriptOutline":
        return generateScriptOutline(context, payload);
      case "generateSceneBeats":
        return generateSceneBeats(context, payload);
      case "generateCharacterSheet":
        return generateCharacterSheet(context, payload);
      case "generateSocialHook":
        return generateSocialHook(context, payload);
      case "generateShotIdeas":
        return generateShotIdeas(context, payload);
      case "generateBrandConcept":
        return generateBrandConcept(context, payload);
      case "generateCoverArtPrompt":
        return generateCoverArtPrompt(context, payload);
      case "generateNanoBananaCharacterSheet":
        return generateNanoBananaCharacterSheet(context, payloadWithWorkflow);
      case "generateNanoBananaStoryboard":
        return generateNanoBananaStoryboard(context, payloadWithWorkflow);
      case "upscaleNanoBananaFrame":
        return upscaleNanoBananaFrame(context, payloadWithWorkflow);
      case "generateKlingVideo":
        return generateKlingVideo(context, payloadWithWorkflow);
      case "generateLyricsFromStory":
        return generateLyricsFromStory(context, payloadWithWorkflow);
      case "generateMusicFromLyrics":
        return generateMusicFromLyrics(context, payloadWithWorkflow);
      default:
        throw new Error(`Unsupported Giorgio action: ${String(action)}`);
    }
  }
}

export function createGiorgioAgent() {
  return new GiorgioAgent();
}
