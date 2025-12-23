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
const CREATIVE_KEYWORDS = /(idea|script|prompt|concept|scene|treatment|story|cover art|sora|skit|marketing hook|shot|outline)/i;
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
    const outputLines: string[] = [];

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
        
        // PROOF SIGNAL: Add routing proof to prove full chain (User → Marcus → Giorgio → UI)
        const action = creativePayload.action ?? "generateScriptOutline";
        const proofPrefix = `ROUTE_OK: Marcus→Giorgio | FLOW_OK: `;
        const outputWithProof = result.output.startsWith(proofPrefix) ? result.output : `${proofPrefix}${result.output}`;
        
        // Server log proof (console.log for Vercel visibility)
        const logMessage = `ROUTE_OK agent=giorgio action=${action} project=${creativePayload.project}`;
        console.log(logMessage);
        context.logger.info("ROUTE_OK", { 
          agent: "giorgio", 
          action: action,
          project: creativePayload.project 
        });
        
        // Debug: Log the proof prefix being added
        console.log(`[PROOF] Adding prefix to output. Output length: ${result.output.length}, Prefix: ${proofPrefix.substring(0, 30)}...`);
        
        outputLines.push(outputWithProof);
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
        // Extract proof prefix if it exists in outputLines
        const proofLine = outputLines.find(line => line.includes("ROUTE_OK:"));
        const proofPrefix = proofLine ? proofLine.split("FLOW_OK:")[0] + "FLOW_OK: " : null;
        
        const wrapperPrompt = `I delegated the following tasks:\n\n${delegationSummary}\n\nNow explain to the user what happened, WHY it matters to their goals, and give them ONE clear next step. Keep it direct and action-oriented. IMPORTANT: If the delegation output starts with "ROUTE_OK: Marcus→Giorgio | FLOW_OK:", you MUST preserve this exact prefix at the start of your response.`;

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
          // CRITICAL: Ensure proof prefix is ALWAYS preserved in wrapped response
          // Extract proof prefix from outputLines if it exists
          const proofLine = outputLines.find(line => line.includes("ROUTE_OK:"));
          let wrappedOutput = textContent.text;
          
          if (proofLine) {
            // Extract the proof prefix (everything before the actual content)
            const proofPrefix = proofLine.split("FLOW_OK:")[0] + "FLOW_OK: ";
            console.log(`[PROOF] Found proof prefix in outputLines: ${proofPrefix.substring(0, 40)}...`);
            console.log(`[PROOF] Wrapped output before fix: ${wrappedOutput.substring(0, 100)}...`);
            
            // ALWAYS force prefix to be at the start, regardless of what AI did
            // Remove prefix if it appears anywhere in the response
            wrappedOutput = wrappedOutput.replace(new RegExp(proofPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
            // Trim any leading whitespace and add prefix at the start
            wrappedOutput = proofPrefix + wrappedOutput.trim();
            console.log(`[PROOF] FORCED prefix to start. Final output starts with: ${wrappedOutput.substring(0, 60)}...`);
          } else {
            console.log(`[PROOF] ERROR: No proof prefix found in outputLines! Available lines:`, outputLines.map(l => l.substring(0, 50)));
          }
          
          return {
            output: wrappedOutput,
            delegations,
            notes: notesPayload,
          };
        }
      } catch (error) {
        context.logger.error("Failed to wrap delegation results", { error });
        // Fall through to default output
      }
    }

    const finalOutput = outputLines.join('\n');
    console.log(`[PROOF] Final output length: ${finalOutput.length}, Contains ROUTE_OK: ${finalOutput.includes('ROUTE_OK:')}`);
    if (finalOutput.includes('ROUTE_OK:')) {
      console.log(`[PROOF] Final output starts with: ${finalOutput.substring(0, 60)}...`);
    }
    
    return {
      output: finalOutput,
      delegations,
      notes: notesPayload,
    };
  }
}

export function createMarcusAgent() {
  return new MarcusAgent();
}
