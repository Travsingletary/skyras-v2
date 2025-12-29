import Anthropic from "@anthropic-ai/sdk";
import { AgentDelegation, AgentExecutionContext, AgentRunInput, AgentRunResult, BaseAgent } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import {
  collectStudioNotes,
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
} from "./marcusActions";
import { getMarcusPreferences, formatPreferencesContext } from "./marcusPreferences";
import { MARCUS_SYSTEM_PROMPT } from "./marcusSystemPrompt";

const SYSTEM_PROMPT = MARCUS_SYSTEM_PROMPT;
const LICENSING_KEYWORDS = /(license|licensing|watermark|demo)/i;
const CREATIVE_KEYWORDS = /(idea|script|prompt|concept|scene|treatment|story|cover art|sora|skit|marketing hook|shot|outline)/i;
const DISTRIBUTION_KEYWORDS = /(post|posting plan|schedule|distribution|publish|rollout|slots)/i;
const CATALOG_KEYWORDS = /(catalog|tag|metadata|save asset|store asset)/i;
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
        
        // Format agent output as readable report (not raw JSON)
        const action = creativePayload.action ?? "generateScriptOutline";
        const actionDisplay = action.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        
        // Format Giorgio's output as a clean report
        let agentReport = `I routed this to: Giorgio (${actionDisplay})\n\n`;
        
        // Extract readable content from result
        if (result.notes?.creativity) {
          const creativity = result.notes.creativity;
          if (creativity.type === 'script_outline' && creativity.acts) {
            agentReport += `**Script Outline:**\n`;
            if (creativity.logline) {
              agentReport += `Logline: ${creativity.logline}\n\n`;
            }
            agentReport += `**Acts:**\n`;
            creativity.acts.forEach((act: any, idx: number) => {
              agentReport += `Act ${act.act || idx + 1}: ${act.beat || 'TBD'}\n`;
            });
          } else {
            // Fallback: use output text
            agentReport += result.output || 'Giorgio completed the task.';
          }
        } else {
          // Use output text directly
          agentReport += result.output || 'Giorgio completed the task.';
        }
        
        outputLines.push(agentReport);
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
    const hasSpecificAction = shouldAuditLicensing || shouldGenerateCreative || shouldPlanDistribution || shouldCatalog || fetchedLinks;
    if (!hasSpecificAction) {
      context.logger.info("No specific action keywords detected, generating AI response");
      const userId = input.metadata?.userId as string | undefined;
      
      // Enhance prompt to enforce Phase 1 requirement
      const phase1Prompt = `${input.prompt}\n\nCRITICAL: Your response must be EXACTLY ONE sentence that is a DO statement. No explanations, no context, no "WHY it matters" sections. Give ONE concrete action the user can do RIGHT NOW. Start with an action verb (Open, Write, Email, Create, etc.).`;
      
      const aiResponse = await this.generateAIResponse(phase1Prompt, context, userId);
      
      // PHASE 1 POST-PROCESSING: Extract single action sentence only
      // Remove "WHY This Matters" sections and all explanations
      let cleanedResponse = aiResponse.replace(/\*\*WHY.*?\*\*/gi, '').replace(/WHY.*?Matters?:?/gi, '');
      cleanedResponse = cleanedResponse.replace(/\*\*.*?\*\*/g, ''); // Remove bold formatting
      
      // Split into sentences
      const sentences = cleanedResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Find first sentence that starts with an action verb
      const actionVerbs = /^(open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|do|make|take|get|put|move|copy|paste|cut|draft|prepare|organize|list|prioritize|choose|select|pick|decide|focus|work|begin)/i;
      const actionSentence = sentences.find(s => actionVerbs.test(s.trim()));
      
      let finalResponse: string;
      if (actionSentence) {
        finalResponse = actionSentence.trim() + '.';
      } else if (sentences.length > 0) {
        // Fallback: use first sentence, but strip if it's too long or contains explanations
        let firstSentence = sentences[0].trim();
        if (firstSentence.length > 150 || /(?:why|because|matters|important|crucial|key|essential)/i.test(firstSentence)) {
          // Try to find any sentence with an action verb
          const anyAction = sentences.find(s => /(?:open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|do|make|take|get|put|move|copy|paste|cut)/i.test(s));
          finalResponse = anyAction ? anyAction.trim() + '.' : firstSentence.substring(0, 100) + '.';
        } else {
          finalResponse = firstSentence + '.';
        }
      } else {
        // Last resort: use cleaned response but limit length
        finalResponse = cleanedResponse.substring(0, 100).trim() + '.';
      }
      
      return {
        output: finalResponse,
        delegations,
        notes: notesPayload,
      };
    }

    // CRITICAL: Marcus owns final response construction
    // All agent outputs flow through here - we construct the final response with proof prefix
    let finalResponseText: string;

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
        
        // Build routing header from delegations
        const routingHeaders: string[] = [];
        for (const delegation of delegations) {
          const actionDisplay = (delegation.action || 'task').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
          routingHeaders.push(`${delegation.agent} (${actionDisplay})`);
        }
        const routingHeader = routingHeaders.length > 0 
          ? `I routed this to: ${routingHeaders.join(', ')}\n\n`
          : '';
        
        const wrapperPrompt = `${routingHeader}${delegationSummary}\n\nCRITICAL: Your response must be EXACTLY ONE sentence that is a DO statement. No explanations, no context, no "WHY it matters" sections.

Give the user ONE clear next step they can do RIGHT NOW. Start with an action verb.

Requirements:
- CONCRETE: Specific action, not abstract (e.g., "Write the first sentence of your blog post" not "Start writing")
- SPECIFIC: Clear what to do, not general (e.g., "Email your client at john@example.com with subject 'Project Update'" not "Reach out to your contact")
- SMALL: ONE step only, not multiple (e.g., "Open your notes app and write down 3 ideas" not "Set up your workspace, organize files, and start writing")
- IMMEDIATELY ACTIONABLE: Can do it now, not later (e.g., "Create a new file called 'drafts.md' in your project folder" not "Plan your content strategy")

CRITICAL RULES:
- ✅ DO: "Open your calendar and block 2 hours for writing"
- ✅ DO: "Write the first paragraph of your blog post about [topic]"
- ❌ DON'T: Include "WHY it matters" or explanations
- ❌ DON'T: Give advice like "You should consider..."
- ❌ DON'T: Give multi-step plans
- ❌ DON'T: Include context or background information

Your response must be ONLY the next action. Nothing else.`;

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
        let rawResponse = textContent && textContent.type === "text" ? textContent.text : outputLines.join('\n');
        
        // PHASE 1 POST-PROCESSING: Extract single action sentence only
        // Remove "WHY This Matters" sections and all explanations
        rawResponse = rawResponse.replace(/\*\*WHY.*?\*\*/gi, '').replace(/WHY.*?Matters?:?/gi, '');
        rawResponse = rawResponse.replace(/\*\*.*?\*\*/g, ''); // Remove bold formatting
        
        // Split into sentences
        const sentences = rawResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Find first sentence that starts with an action verb
        const actionVerbs = /^(open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|do|make|take|get|put|move|copy|paste|cut|draft|prepare|organize|list|prioritize|choose|select|pick|decide|focus|work|begin)/i;
        const actionSentence = sentences.find(s => actionVerbs.test(s.trim()));
        
        if (actionSentence) {
          finalResponseText = actionSentence.trim() + '.';
        } else if (sentences.length > 0) {
          // Fallback: use first sentence, but strip if it's too long or contains explanations
          let firstSentence = sentences[0].trim();
          if (firstSentence.length > 150 || /(?:why|because|matters|important|crucial|key|essential)/i.test(firstSentence)) {
            // Try to find any sentence with an action verb
            const anyAction = sentences.find(s => /(?:open|write|email|create|send|call|schedule|block|set|add|remove|delete|update|edit|start|finish|complete|submit|post|publish|draft|save|upload|download|go|click|type|fill|do|make|take|get|put|move|copy|paste|cut)/i.test(s));
            finalResponseText = anyAction ? anyAction.trim() + '.' : firstSentence.substring(0, 100) + '.';
          } else {
            finalResponseText = firstSentence + '.';
          }
        } else {
          // Last resort: use raw response but limit length
          finalResponseText = rawResponse.substring(0, 100).trim() + '.';
        }
      } catch (error) {
        context.logger.error("Failed to wrap delegation results", { error });
        // Fall through to default output
        finalResponseText = outputLines.join('\n');
      }
    } else {
      // No AI wrapping - use outputLines directly
      finalResponseText = outputLines.join('\n');
    }

    // CRITICAL: Ensure proof prefix is ALWAYS present when routing to Giorgio
    // This is the SINGLE point where final response is constructed
    const creativeDelegation = delegations.find(d => d.agent === "giorgio");
    if (creativeDelegation) {
      const proofPrefix = `ROUTE_OK: Marcus→Giorgio | FLOW_OK: `;
      
      // Server log proof (console.log for Vercel visibility)
      const action = creativeDelegation.action || "unknown";
      const logMessage = `ROUTE_OK agent=giorgio action=${action} project=${creativeDelegation.project || "unknown"}`;
      console.log(logMessage);
      context.logger.info("ROUTE_OK", { 
        agent: "giorgio", 
        action: action,
        project: creativeDelegation.project 
      });
      
      // Remove any existing prefix (in case it was added earlier or by AI)
      finalResponseText = finalResponseText.replace(/ROUTE_OK:\s*Marcus→Giorgio\s*\|\s*FLOW_OK:\s*/gi, '').trim();
      
      // ALWAYS add prefix at the start - this is the definitive proof
      finalResponseText = proofPrefix + finalResponseText;
      
      console.log(`[PROOF] Final response constructed with prefix. Length: ${finalResponseText.length}, Starts with: ${finalResponseText.substring(0, 60)}...`);
    } else {
      console.log(`[PROOF] No giorgio delegation - no proof prefix needed. Delegations:`, delegations.map(d => `${d.agent}:${d.action}`));
    }
    
    // Return final response - Marcus owns this
    return {
      output: finalResponseText,
      delegations,
      notes: notesPayload,
    };
  }
}

export function createMarcusAgent() {
  return new MarcusAgent();
}
