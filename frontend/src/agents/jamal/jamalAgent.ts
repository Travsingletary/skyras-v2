import fs from "node:fs";
import path from "node:path";

import { AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import { generatePostingPlan, type PostingPlanInput } from "./jamalActions";

const PROMPT_PATH = path.join(process.cwd(), "src/agents/jamal/jamalSystemPrompt.md");

function loadPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, "utf-8");
  } catch {
    return "You are Jamal, the distribution lead.";
  }
}

const PROMPT = loadPrompt();

type JamalAction = "generatePostingPlan";

export class JamalAgent extends BaseAgent {
  constructor() {
    super({
      name: "jamal",
      memoryNamespace: "jamal_distribution",
      systemPrompt: PROMPT,
      logger: createLogger("JamalAgent"),
    });
  }

  protected async handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult> {
    const action = (input.metadata?.action as JamalAction | undefined) ?? "generatePostingPlan";
    const payload = input.metadata?.payload as PostingPlanInput | undefined;
    if (!payload) {
      throw new Error("Jamal requires a posting plan payload");
    }
    context.logger.info(`Jamal running action ${action}`, { project: payload.project });
    switch (action) {
      case "generatePostingPlan":
        return generatePostingPlan(context, payload);
      default:
        throw new Error(`Unsupported Jamal action: ${String(action)}`);
    }
  }
}

export function createJamalAgent() {
  return new JamalAgent();
}
