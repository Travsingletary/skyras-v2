import fs from "node:fs";
import path from "node:path";

import { AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import {
  generateDrafts,
  schedulePost,
  reactivePublish,
  getPosts,
  approvePost,
  getSettings,
  updateSettings,
  handleFileUpload,
  type GenerateDraftsInput,
  type SchedulePostInput,
  type ReactivePublishInput,
  type ManageSettingsInput,
} from "./jamalActionsV2";
import type { SocialPlatform } from "@/lib/socialPostingClient";
import type { TriggerEvent } from "@/lib/jamal/publishingQueue";

const PROMPT_PATH = path.join(process.cwd(), "src/agents/jamal/jamalSystemPrompt.md");

function loadPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, "utf-8");
  } catch {
    return "You are Jamal, the distribution lead.";
  }
}

const PROMPT = loadPrompt();

type JamalAction =
  | "generateDrafts"
  | "schedulePost"
  | "reactivePublish"
  | "getPosts"
  | "approvePost"
  | "getSettings"
  | "updateSettings"
  | "handleFileUpload";

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
    const action = (input.metadata?.action as JamalAction | undefined) ?? "generateDrafts";
    const payload = input.metadata?.payload as
      | GenerateDraftsInput
      | SchedulePostInput
      | ReactivePublishInput
      | ManageSettingsInput
      | { userId: string; mode?: "scheduled" | "reactive"; status?: string; platform?: SocialPlatform; projectId?: string }
      | { postId: string; userId: string; notes?: string }
      | { fileId: string; userId: string; contentItemId?: string }
      | undefined;

    context.logger.info(`Jamal running action ${action}`, { payload });

    switch (action) {
      case "generateDrafts": {
        if (!payload || !("contentItemId" in payload)) {
          throw new Error("Jamal requires generateDrafts payload with contentItemId, userId, platforms, and scheduledAt");
        }
        return generateDrafts(context, payload as GenerateDraftsInput);
      }
      case "schedulePost": {
        if (!payload || !("caption" in payload)) {
          throw new Error("Jamal requires schedulePost payload with contentItemId, userId, caption, platform, and scheduledAt");
        }
        return schedulePost(context, payload as SchedulePostInput);
      }
      case "reactivePublish": {
        if (!payload || !("contentItemId" in payload)) {
          throw new Error("Jamal requires reactivePublish payload with contentItemId and userId");
        }
        return reactivePublish(context, payload as ReactivePublishInput);
      }
      case "getPosts": {
        if (!payload || !("userId" in payload)) {
          throw new Error("Jamal requires getPosts payload with userId");
        }
        return getPosts(context, payload as { userId: string; mode?: "scheduled" | "reactive"; status?: string; platform?: SocialPlatform; projectId?: string });
      }
      case "approvePost": {
        if (!payload || !("postId" in payload)) {
          throw new Error("Jamal requires approvePost payload with postId and userId");
        }
        return approvePost(context, payload as { postId: string; userId: string; notes?: string });
      }
      case "getSettings": {
        if (!payload || !("userId" in payload)) {
          throw new Error("Jamal requires getSettings payload with userId");
        }
        return getSettings(context, payload as { userId: string });
      }
      case "updateSettings": {
        if (!payload || !("userId" in payload)) {
          throw new Error("Jamal requires updateSettings payload with userId");
        }
        return updateSettings(context, payload as ManageSettingsInput);
      }
      case "handleFileUpload": {
        if (!payload || !("fileId" in payload)) {
          throw new Error("Jamal requires handleFileUpload payload with fileId and userId");
        }
        return handleFileUpload(context, payload as { fileId: string; userId: string; contentItemId?: string });
      }
      default:
        throw new Error(`Unsupported Jamal action: ${String(action)}`);
    }
  }
}

export function createJamalAgent() {
  return new JamalAgent();
}
