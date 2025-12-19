import Anthropic from "@anthropic-ai/sdk";
import { AgentDelegation, AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import {
  collectStudioNotes,
  createWorkflow,
  fetchLinkContent,
  runCatalogSave,
  runCreativeGeneration,
  runDistributionPlan,
  runLicensingAudit,
} from "./marcusActions";
import { autoExecuteWorkflow } from "@/lib/autoExecute";
import type {
  CatalogPayload,
  CreativeGenerationPayload,
  DistributionPayload,
  LicensingAuditFile,
  LinkFetchPayload,
  WorkflowCreationPayload,
} from "./marcusActions";
import { getMarcusPreferences, formatPreferencesContext } from "./marcusPreferences";
import { MARCUS_SYSTEM_PROMPT } from "./marcusSystemPrompt";

const SYSTEM_PROMPT = MARCUS_SYSTEM_PROMPT;
const LICENSING_KEYWORDS = /(license|licensing|watermark|demo)/i;
const CREATIVE_KEYWORDS = /(idea|script|prompt|concept|scene|treatment|story|cover art|sora|skit|marketing hook|shot|outline|video|film|cinematic|runway)/i;
const VIDEO_KEYWORDS = /(video|film|cinematic|runway|generate video|make video|create video|video clip)/i;
const DISTRIBUTION_KEYWORDS = /(post|posting plan|schedule|distribution|publish|rollout|slots)/i;
const CATALOG_KEYWORDS = /(catalog|tag|metadata|save asset|store asset)/i;
const WORKFLOW_KEYWORDS = /(create workflow|make workflow|new workflow|workflow plan|build workflow|generate workflow)/i;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

class MarcusAgent extends BaseAgent {
  private anthropic: Anthropic | null = null;

  constructor() {
    super({
      name: "Marcus",
      memoryNamespace: "marcus_manager",
      systemPrompt: SYSTEM_PROMPT,
      logger: createLogger("MarcusAgent"),
    });

    // Initialize Anthropic client if API key is available and valid
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey.startsWith('sk-ant-') && apiKey.length > 20) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Generate an AI response using Claude for general chat queries
   *
   * This method integrates Marcus Prime Directives and user preferences
   * to provide personalized, action-oriented responses.
   */
  private async generateAIResponse(prompt: string, context: AgentExecutionContext, userId?: string): Promise<string> {
    if (!this.anthropic) {
      return "I'm currently in keyword-based mode. For full AI chat capabilities, please configure ANTHROPIC_API_KEY in your environment.";
    }

    try {
      // Load user preferences (currently hard-coded for Trav, future: load from Supabase)
      const preferences = getMarcusPreferences(userId);
      const preferencesContext = formatPreferencesContext(preferences);

      // Combine system prompt with user-specific context
      const enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${preferencesContext}`;

      // Load conversation history from memory (last 10 exchanges = 20 messages)
      const history = await context.memory.history(20);

      // Convert memory records to Anthropic message format
      const conversationMessages = history.map((record) => ({
        role: record.role,
        content: record.content,
      }));

      // Add current prompt as the latest user message
      conversationMessages.push({
        role: "user" as const,
        content: prompt,
      });

      context.logger.debug("Generating AI response with preferences and memory", {
        userId: preferences.userId,
        maxTasks: preferences.taskStyle.maxTasksPerResponse,
        historyLength: history.length,
        totalMessages: conversationMessages.length
      });

      const message = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: enhancedSystemPrompt,
        messages: conversationMessages,
      });

      const textContent = message.content.find((block) => block.type === "text");
      return textContent && textContent.type === "text" ? textContent.text : "No response generated.";
    } catch (error) {
      context.logger.error("AI response generation failed", { error });
      return `I encountered an error generating a response: ${(error as Error).message}`;
    }
  }

  protected async handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult> {
    context.logger.info("Handling request", { prompt: input.prompt });

    const notes = await collectStudioNotes(context);

    const delegations: AgentDelegation[] = [];
    const outputLines = [
      `System prompt: ${SYSTEM_PROMPT.split('\n')[0]}`,
      `Notes: ${notes.summary}`,
    ];

    const notesPayload: Record<string, unknown> = {
      files: notes.data,
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
    const shouldGenerateVideo = VIDEO_KEYWORDS.test(input.prompt);
    
    if (shouldGenerateCreative || shouldGenerateVideo) {
      const project =
        (input.metadata?.project as string | undefined) ??
        (input.metadata?.projectId as string | undefined) ??
        "SkySky";
      
      // Determine action: video generation or other creative work
      const action = shouldGenerateVideo 
        ? "generateRunwayVideo"
        : (input.metadata?.creativeAction as string | undefined) ?? "generateScriptOutline";
      
      const creativePayload: CreativeGenerationPayload = {
        project,
        action,
        context: (input.metadata?.context as string | undefined) ?? input.prompt,
        mood: input.metadata?.mood as string | undefined,
        style: input.metadata?.style as string | undefined,
        characters: input.metadata?.characters as string[] | undefined,
        beats: input.metadata?.beats as string[] | undefined,
        // Video-specific options
        imageUrl: input.metadata?.imageUrl as string | undefined,
        duration: input.metadata?.duration as number | undefined,
        aspectRatio: input.metadata?.aspectRatio as string | undefined,
        model: input.metadata?.model as string | undefined,
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

    // Check for workflow creation requests
    const shouldCreateWorkflow = WORKFLOW_KEYWORDS.test(input.prompt);
    if (shouldCreateWorkflow) {
      const userId = (input.metadata?.userId as string | undefined);
      if (!userId) {
        outputLines.push("Workflow creation requested but userId is missing in metadata.");
      } else {
        try {
          // Extract workflow details from prompt or metadata
          const workflowPayload: WorkflowCreationPayload = {
            userId,
            projectId: (input.metadata?.projectId as string | undefined) || 
                      (input.metadata?.project as string | undefined),
            name: (input.metadata?.workflowName as string | undefined) || 
                  `Workflow ${new Date().toLocaleDateString()}`,
            type: (input.metadata?.workflowType as WorkflowCreationPayload["type"]) || "custom",
            planMarkdown: input.metadata?.planMarkdown as string | undefined,
            summary: input.metadata?.workflowSummary as string | undefined,
            agentName: "marcus",
            tasks: input.metadata?.workflowTasks as WorkflowCreationPayload["tasks"] | undefined,
          };

          const workflowResult = await createWorkflow(context, workflowPayload);
          outputLines.push(workflowResult.summary);
          notesPayload.workflow = workflowResult.data;
        } catch (error) {
          outputLines.push(`Workflow creation failed: ${(error as Error).message}`);
        }
      }
    }

    // Check for URLs in the prompt and fetch them
    const urls = input.prompt.match(URL_PATTERN);
    let fetchedLinks = false;
    if (urls && urls.length > 0) {
      fetchedLinks = true;
      for (const url of urls) {
        try {
          const linkPayload: LinkFetchPayload = {
            url,
            context: input.prompt,
          };
          const fetchResult = await fetchLinkContent(context, linkPayload);
          outputLines.push(fetchResult.summary);
          notesPayload[`link_${urls.indexOf(url)}`] = fetchResult.data;
        } catch (error) {
          outputLines.push(`Failed to fetch ${url}: ${(error as Error).message}`);
        }
      }
    }

    // If no specific keywords matched, generate AI response for general chat
    const hasSpecificAction = shouldAuditLicensing || shouldGenerateCreative || shouldPlanDistribution || shouldCatalog || shouldCreateWorkflow || fetchedLinks;
    if (!hasSpecificAction) {
      context.logger.info("No specific action keywords detected, generating AI response");
      const userId = input.metadata?.userId as string | undefined;
      const aiResponse = await this.generateAIResponse(input.prompt, context, userId);
      return {
        output: aiResponse,
        delegations,
        notes: notesPayload,
      };
    }

    // AUTO-EXECUTE: If delegations occurred, create workflow and trigger execution
    if (delegations.length > 0) {
      const userId = (input.metadata?.userId as string | undefined) || 'public';
      const projectId = (input.metadata?.projectId as string | undefined) || 
                       (input.metadata?.project as string | undefined);
      
      try {
        context.logger.info("Auto-executing workflow from delegations", {
          delegationCount: delegations.length,
          userId,
        });

        // Extract workflow name from prompt or use default
        const workflowName = input.metadata?.workflowName as string | undefined ||
                            `Workflow: ${delegations.map(d => d.task).join(', ')}`;
        
        const summary = `Auto-executed workflow with ${delegations.length} task(s)`;

        // Auto-execute: Create workflow, tasks, and trigger execution
        const executionResult = await autoExecuteWorkflow(
          delegations,
          userId,
          projectId,
          workflowName,
          summary
        );

        context.logger.info("Auto-execution completed", {
          workflowId: executionResult.workflowId,
          tasksCreated: executionResult.tasksCreated,
          agentsTriggered: executionResult.agentsTriggered,
        });

        // Add execution results to notes
        notesPayload.autoExecution = {
          workflowId: executionResult.workflowId,
          tasksCreated: executionResult.tasksCreated,
          agentsTriggered: executionResult.agentsTriggered,
          executionResults: executionResult.executionResults,
        };

        // Update output to include execution status
        const executionStatus = executionResult.executionResults
          .map(r => `${r.agentName}: ${r.success ? '✓' : '✗'}`)
          .join(', ');
        outputLines.push(`\n[Auto-executed] Workflow ${executionResult.workflowId} created with ${executionResult.tasksCreated} task(s). Agents triggered: ${executionStatus}`);
      } catch (error) {
        context.logger.error("Auto-execution failed", { error });
        outputLines.push(`\n[Warning] Failed to auto-execute workflow: ${(error as Error).message}`);
        // Don't fail the entire request - delegations still happened
      }
    }

    // If delegations occurred, wrap results with AI-enhanced explanation
    // This applies Prime Directives to delegation results
    if (delegations.length > 0 && this.anthropic) {
      const userId = input.metadata?.userId as string | undefined;
      const preferences = getMarcusPreferences(userId);
      const preferencesContext = formatPreferencesContext(preferences);
      const enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${preferencesContext}`;

      try {
        // Load conversation history for context-aware wrapping
        const history = await context.memory.history(20);
        const conversationMessages = history.map((record) => ({
          role: record.role,
          content: record.content,
        }));

        const delegationSummary = outputLines.join('\n');
        const wrapperPrompt = `I delegated the following tasks and auto-executed them:\n\n${delegationSummary}\n\nNow explain to the user what happened, WHY it matters to their goals, and give them ONE clear next step. Keep it direct and action-oriented. Mention that the work is already in progress.`;

        // Add wrapper prompt as latest user message
        conversationMessages.push({
          role: "user" as const,
          content: wrapperPrompt,
        });

        const message = await this.anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 512,
          system: enhancedSystemPrompt,
          messages: conversationMessages,
        });

        const textContent = message.content.find((block) => block.type === "text");
        if (textContent && textContent.type === "text") {
          return {
            output: textContent.text,
            delegations,
            notes: notesPayload,
          };
        }
      } catch (error) {
        context.logger.error("Failed to wrap delegation results", { error });
        // Fall through to default output
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
