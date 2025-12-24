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
  generateRunwayVideo,
  generateScriptOutline,
  generateImage,
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
  | "generateRunwayVideo"
  | "generateImage"
  | "generateScriptOutline"
  | "generateSceneBeats"
  | "generateCharacterSheet"
  | "generateSocialHook"
  | "generateShotIdeas"
  | "generateBrandConcept"
  | "generateCoverArtPrompt";

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

    context.logger.info(`Giorgio running action ${action}`, { project: payload.project });

    switch (action) {
      case "generateSoraPrompt":
        return generateSoraPrompt(context, payload);
      case "generateRunwayVideo":
        return generateRunwayVideo(context, payload);
      case "generateImage":
        return generateImage(context, payload);
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
      default:
        throw new Error(`Unsupported Giorgio action: ${String(action)}`);
    }
  }
}

export function createGiorgioAgent() {
  return new GiorgioAgent();
}
