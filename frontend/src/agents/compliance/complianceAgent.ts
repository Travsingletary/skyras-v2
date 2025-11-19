import fs from "node:fs";
import path from "node:path";

import { AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import {
  listUnlicensedAssets,
  markAssetLicensed,
  scanFilesForLicensing,
  type ListAssetsInput,
  type MarkLicensedInput,
  type ScanFilesInput,
} from "./complianceActions";

const PROMPT_PATH = path.join(process.cwd(), "src/agents/compliance/complianceSystemPrompt.md");

function loadPrompt() {
  try {
    return fs.readFileSync(PROMPT_PATH, "utf-8");
  } catch {
    return "You are Cassidy, the Compliance Agent.";
  }
}

const PROMPT = loadPrompt();

type ComplianceAction = "scanFilesForLicensing" | "listUnlicensedAssets" | "markAssetLicensed";

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super({
      name: "compliance",
      memoryNamespace: "compliance_agent",
      systemPrompt: PROMPT,
      logger: createLogger("ComplianceAgent"),
    });
  }

  protected async handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult> {
    const action = (input.metadata?.action as ComplianceAction | undefined) ?? "scanFilesForLicensing";
    const payload = input.metadata?.payload;

    context.logger.info(`Running compliance action: ${action}`);

    switch (action) {
      case "scanFilesForLicensing": {
        if (!payload) {
          throw new Error("scanFilesForLicensing payload required");
        }
        const result = await scanFilesForLicensing(context, payload as ScanFilesInput);
        return {
          output: result.summary,
          notes: { suspicious: result.data },
        };
      }
      case "listUnlicensedAssets": {
        if (!payload) {
          throw new Error("listUnlicensedAssets payload required");
        }
        const result = await listUnlicensedAssets(context, payload as ListAssetsInput);
        return {
          output: result.summary,
          notes: { assets: result.data },
        };
      }
      case "markAssetLicensed": {
        if (!payload) {
          throw new Error("markAssetLicensed payload required");
        }
        const result = await markAssetLicensed(context, payload as MarkLicensedInput);
        return {
          output: result.summary,
          notes: { assets: result.data },
        };
      }
      default:
        throw new Error(`Unsupported compliance action: ${String(action)}`);
    }
  }
}

export function createComplianceAgent() {
  return new ComplianceAgent();
}
