import fs from "node:fs";
import path from "node:path";

import { AgentDelegation, AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import {
  collectStudioNotes,
  logPlanToSupabase,
  runCatalogSave,
  runCreativeGeneration,
  runDistributionPlan,
  runLicensingAudit,
} from "./marcusActions";
import type {
  CatalogPayload,
  CreativeGenerationPayload,
  DistributionPayload,
  LicensingAuditFile,
} from "./marcusActions";

function loadSystemPrompt() {
  const promptPath = path.join(process.cwd(), "src/agents/marcus/marcusSystemPrompt.md");
  try {
    return fs.readFileSync(promptPath, "utf-8");
  } catch (err) {
    console.warn("Failed to load Marcus system prompt", err);
    return "You are Marcus, a helpful manager.";
  }
}

const SYSTEM_PROMPT = loadSystemPrompt();
const LICENSING_KEYWORDS = /(license|licensing|watermark|demo)/i;
const CREATIVE_KEYWORDS = /(idea|script|prompt|concept|scene|treatment|story|cover art|sora|skit|marketing hook|shot|outline)/i;
const DISTRIBUTION_KEYWORDS = /(post|posting plan|schedule|distribution|publish|rollout|slots)/i;
const CATALOG_KEYWORDS = /(catalog|tag|metadata|save asset|store asset)/i;

class MarcusAgent extends BaseAgent {
  constructor() {
    super({
      name: "Marcus",
      memoryNamespace: "marcus_manager",
      systemPrompt: SYSTEM_PROMPT,
      logger: createLogger("MarcusAgent"),
    });
  }

  protected async handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult> {
    context.logger.info("Handling request", { prompt: input.prompt });

    const notes = await collectStudioNotes(context);
    const supabaseLog = await logPlanToSupabase(context, {
      prompt: input.prompt,
      metadata: input.metadata ?? {},
    });

    const delegations: AgentDelegation[] = [];
    const outputLines = [
      `System prompt: ${SYSTEM_PROMPT.split('\n')[0]}`,
      `Notes: ${notes.summary}`,
      `Supabase: ${supabaseLog.summary}`,
    ];

    const notesPayload: Record<string, unknown> = {
      files: notes.data,
      supabase: supabaseLog.data,
    };

    const shouldAuditLicensing = LICENSING_KEYWORDS.test(input.prompt);
    if (shouldAuditLicensing) {
      const projectId = (input.metadata?.projectId as string | undefined) ?? (input.metadata?.project as string | undefined);
      const files = input.metadata?.files as LicensingAuditFile[] | undefined;
      if (projectId && Array.isArray(files) && files.length > 0) {
        const { delegation: complianceDelegation, result } = await runLicensingAudit(context, {
          projectId,
          files,
        });
        delegations.push(complianceDelegation);
        outputLines.push(result.output);
        notesPayload.licensing = result.notes ?? result;
      } else {
        outputLines.push("Licensing audit requested but missing projectId/files in metadata.");
      }
    }

    const shouldGenerateCreative = CREATIVE_KEYWORDS.test(input.prompt);
    if (shouldGenerateCreative) {
      const project =
        (input.metadata?.project as string | undefined) ??
        (input.metadata?.projectId as string | undefined) ??
        "SkySky";
      const creativePayload: CreativeGenerationPayload = {
        project,
        action: input.metadata?.creativeAction as string | undefined,
        context: (input.metadata?.context as string | undefined) ?? input.prompt,
        mood: input.metadata?.mood as string | undefined,
        style: input.metadata?.style as string | undefined,
        characters: input.metadata?.characters as string[] | undefined,
        beats: input.metadata?.beats as string[] | undefined,
      };

      try {
        const { delegation: creativeDelegation, result } = await runCreativeGeneration(context, creativePayload);
        delegations.push(creativeDelegation);
        outputLines.push(result.output);
        notesPayload.creative = result.notes ?? result;
      } catch (error) {
        outputLines.push(`Creative delegation failed: ${(error as Error).message}`);
      }
    }

    const shouldPlanDistribution = DISTRIBUTION_KEYWORDS.test(input.prompt);
    if (shouldPlanDistribution) {
      const distributionPayload: DistributionPayload = {
        project:
          (input.metadata?.project as string | undefined) ??
          (input.metadata?.projectId as string | undefined) ??
          "SkySky",
        campaignName: input.metadata?.campaignName as string | undefined,
        platforms: input.metadata?.platforms as string[] | undefined,
        slots: input.metadata?.slots as number | undefined,
        mood: input.metadata?.mood as string | undefined,
      };
      try {
        const { delegation: distributionDelegation, result } = await runDistributionPlan(context, distributionPayload);
        delegations.push(distributionDelegation);
        outputLines.push(result.output);
        notesPayload.distribution = result.notes ?? result;
      } catch (error) {
        outputLines.push(`Distribution delegation failed: ${(error as Error).message}`);
      }
    }

    const shouldCatalog = CATALOG_KEYWORDS.test(input.prompt);
    if (shouldCatalog) {
      const catalogPayload: CatalogPayload | null = (() => {
        const project =
          (input.metadata?.project as string | undefined) ??
          (input.metadata?.projectId as string | undefined) ??
          "SkySky";
        const name = input.metadata?.name as string | undefined;
        if (!name) return null;
        return {
          project,
          name,
          type: input.metadata?.type as string | undefined,
          tags: input.metadata?.tags as string[] | undefined,
          metadata: input.metadata?.metadata as Record<string, unknown> | undefined,
        };
      })();

      if (catalogPayload) {
        try {
          const { delegation: catalogDelegation, result } = await runCatalogSave(context, catalogPayload);
          delegations.push(catalogDelegation);
          outputLines.push(result.output);
          notesPayload.catalog = result.notes ?? result;
        } catch (error) {
          outputLines.push(`Catalog delegation failed: ${(error as Error).message}`);
        }
      } else {
        outputLines.push("Catalog request missing name/project in metadata.");
      }
    }

    return {
      output: outputLines.join('\n'),
      delegations,
      notes: notesPayload,
    };
  }
}

export function createMarcusAgent() {
  return new MarcusAgent();
}
