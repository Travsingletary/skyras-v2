import fs from "node:fs";
import path from "node:path";

import { AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import { findAssets, listAssets, saveAssetMetadata, type FindAssetsInput, type ListAssetsInput, type SaveAssetInput } from "./letitiaActions";

const PROMPT_PATH = path.join(process.cwd(), "src/agents/letitia/letitiaSystemPrompt.md");

function loadPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, "utf-8");
  } catch {
    return "You are Letitia, the Asset Librarian.";
  }
}

const PROMPT = loadPrompt();

type LetitiaAction = "saveAssetMetadata" | "listAssets" | "findAssets";

export class LetitiaAgent extends BaseAgent {
  constructor() {
    super({
      name: "letitia",
      memoryNamespace: "letitia_assets",
      systemPrompt: PROMPT,
      logger: createLogger("LetitiaAgent"),
    });
  }

  protected async handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult> {
    const action = (input.metadata?.action as LetitiaAction | undefined) ?? "saveAssetMetadata";
    const payload = input.metadata?.payload;
    if (!payload) {
      throw new Error("Letitia requires a payload");
    }

    switch (action) {
      case "saveAssetMetadata":
        return saveAssetMetadata(context, payload as SaveAssetInput);
      case "listAssets":
        return listAssets(context, payload as ListAssetsInput);
      case "findAssets":
        return findAssets(context, payload as FindAssetsInput);
      default:
        throw new Error(`Unsupported Letitia action: ${String(action)}`);
    }
  }
}

export function createLetitiaAgent() {
  return new LetitiaAgent();
}
