import { getSupabaseClient, SupabaseClientLike } from "@/backend/supabaseClient";
import { createLogger, Logger } from "@/lib/logger";
import { workflowTasksDb, workflowsDb } from "@/lib/database";
import type { WorkflowTask } from "@/types/database";

type TableRow = Record<string, unknown>;

export interface AgentRunInput {
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRunResult {
  output: string;
  delegations?: AgentDelegation[];
  notes?: Record<string, unknown>;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (input: unknown, context: AgentExecutionContext) => Promise<unknown>;
}

export interface AgentDelegation {
  agent: string;
  task: string;
  status: "pending" | "completed" | "failed";
}

export interface AgentExecutionContext {
  supabase: SupabaseClientLike;
  memory: AgentMemory;
  logger: Logger;
  delegateTo: (agent: string, task: string) => AgentDelegation;
}

interface AgentOptions {
  name: string;
  memoryNamespace: string;
  tools?: AgentTool[];
  systemPrompt?: string;
  logger?: Logger;
}

interface MemoryRecord {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __AGENT_MEMORY__: Record<string, MemoryRecord[]> | undefined;
}

function getMemoryStore() {
  if (!globalThis.__AGENT_MEMORY__) {
    globalThis.__AGENT_MEMORY__ = {};
  }
  return globalThis.__AGENT_MEMORY__;
}

export class AgentMemory {
  constructor(
    private namespace: string,
    private supabase: SupabaseClientLike,
    userId?: string,
    conversationId?: string
  ) {
    // Store as instance properties for access in methods
    (this as any).userId = userId;
    (this as any).conversationId = conversationId;
  }

  private records(): MemoryRecord[] {
    const store = getMemoryStore();
    if (!store[this.namespace]) {
      store[this.namespace] = [];
    }
    return store[this.namespace]!;
  }

  async append(record: Omit<MemoryRecord, "timestamp">) {
    const timestamp = new Date().toISOString();
    const memoryRecord = { ...record, timestamp };

    // Add to in-memory store for immediate access
    this.records().push(memoryRecord);

    // Persist to database if userId and conversationId are available
    const userId = (this as any).userId;
    const conversationId = (this as any).conversationId;
    if (userId && conversationId) {
      try {
        // Ensure conversation exists (upsert by id)
        const { error: convError } = await this.supabase
          .from("conversations")
          .upsert({
            id: conversationId,
            user_id: userId,
            agent_name: this.namespace.split("_")[0] || "marcus",
            updated_at: new Date().toISOString(),
          });

        if (convError) {
          console.error("[AgentMemory] Failed to upsert conversation:", convError);
        }

        // Insert message (using existing messages table)
        const { error: msgError } = await this.supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: record.role,
            content: record.content,
            metadata: {},
          });

        if (msgError) {
          console.error("[AgentMemory] Failed to persist message:", msgError);
        }
      } catch (error) {
        console.error("[AgentMemory] Error persisting to database:", error);
        // Continue without failing - in-memory store still works
      }
    }
  }

  async history(limit = 20): Promise<MemoryRecord[]> {
    // Try to load from database first if userId and conversationId are available
    const userId = (this as any).userId;
    const conversationId = (this as any).conversationId;
    if (userId && conversationId) {
      try {
        const { data: messages, error } = await this.supabase
          .from("messages")
          .select({ conversation_id: conversationId });

        if (!error && messages && messages.length > 0) {
          // Sort by created_at and limit
          const sorted = messages
            .sort((a: TableRow, b: TableRow) => {
              const aTime = a.created_at ? new Date(a.created_at as string).getTime() : 0;
              const bTime = b.created_at ? new Date(b.created_at as string).getTime() : 0;
              return aTime - bTime;
            })
            .slice(-limit);

          // Convert database records to MemoryRecord format
          return sorted.map((msg: TableRow) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content as string,
            timestamp: msg.created_at as string,
          }));
        }
      } catch (error) {
        console.error("[AgentMemory] Error loading from database:", error);
        // Fall through to in-memory store
      }
    }

    // Fallback to in-memory store
    return this.records().slice(-limit);
  }
}

export abstract class BaseAgent {
  protected readonly logger: Logger;
  protected readonly supabase: SupabaseClientLike;
  protected readonly memory: AgentMemory;
  private readonly tools: Map<string, AgentTool> = new Map();
  private readonly systemPrompt?: string;
  private userId?: string;
  private conversationId?: string;

  constructor(private readonly options: AgentOptions) {
    this.logger = options.logger ?? createLogger(options.name);
    this.supabase = getSupabaseClient();
    this.memory = new AgentMemory(options.memoryNamespace, this.supabase);
    this.systemPrompt = options.systemPrompt;

    options.tools?.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Set user and conversation context for persistent memory
   */
  setContext(userId?: string, conversationId?: string) {
    this.userId = userId;
    this.conversationId = conversationId;
    // Update memory context
    (this.memory as any).userId = userId;
    (this.memory as any).conversationId = conversationId;
  }

  protected registerTool(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  protected getTool(name: string) {
    return this.tools.get(name);
  }

  protected delegateTo(agent: string, task: string): AgentDelegation {
    this.logger.info(`Delegating task to ${agent}`, { task });
    return { agent, task, status: "pending" };
  }

  /**
   * Get pending workflow tasks assigned to this agent
   */
  async getPendingTasks(agentName: string, limit = 10): Promise<WorkflowTask[]> {
    try {
      // Get all pending tasks
      const allTasks = await workflowTasksDb.getByWorkflowId(""); // This won't work, need to query differently
      
      // Since we can't easily filter by agent_name in the current DB structure,
      // we'll need to get tasks from active workflows and filter client-side
      // For now, return empty array - this will be improved with a proper query
      return [];
    } catch (error) {
      this.logger.error("Failed to fetch pending tasks", { error });
      return [];
    }
  }

  /**
   * Execute a workflow task and update its status
   */
  async executeWorkflowTask(task: WorkflowTask): Promise<AgentRunResult> {
    try {
      // Mark task as in_progress
      await workflowTasksDb.update(task.id, {
        status: "in_progress",
      });

      // Get file metadata if task references a file
      let fileMetadata;
      if (task.metadata && typeof task.metadata === 'object' && 'fileId' in task.metadata) {
        const { filesDb } = await import("@/lib/database");
        const file = await filesDb.getById(task.metadata.fileId as string);
        if (file) {
          fileMetadata = {
            fileName: file.original_name,
            fileType: file.file_type,
            fileUrl: file.public_url,
            fileSize: file.file_size,
          };
        }
      }

      // Build prompt from task
      const prompt = `${task.title}\n\n${task.description || ''}`;
      
      // Extract action and payload from task metadata
      const taskMetadata = task.metadata as Record<string, unknown> || {};
      const action = taskMetadata.action as string | undefined;
      const payload = taskMetadata.payload as Record<string, unknown> || {
        project: taskMetadata.project as string || 'SkySky',
        ...(fileMetadata && {
          fileId: taskMetadata.fileId as string,
          fileName: fileMetadata.fileName,
          fileUrl: fileMetadata.fileUrl,
        }),
      };

      // Execute the agent
      const context: AgentExecutionContext = {
        supabase: this.supabase,
        memory: this.memory,
        logger: this.logger,
        delegateTo: (agent, task) => this.delegateTo(agent, task),
      };

      const result = await this.handleRun({
        prompt,
        metadata: {
          action,
          payload,
          taskId: task.id,
          workflowId: task.workflow_id,
          fileMetadata,
        },
      }, context);

      // Update task as completed
      await workflowTasksDb.update(task.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        metadata: {
          ...taskMetadata,
          results: result.notes || {},
          output: result.output,
        },
      });

      // Update workflow completed_tasks count
      const workflow = await workflowsDb.getById(task.workflow_id);
      if (workflow) {
        await workflowsDb.update(task.workflow_id, {
          completed_tasks: workflow.completed_tasks + 1,
        });
      }

      return result;
    } catch (error) {
      this.logger.error("Failed to execute workflow task", { error, taskId: task.id });
      
      // Mark task as failed (using 'skipped' status since 'failed' may not be in TaskStatus)
      await workflowTasksDb.update(task.id, {
        status: "skipped" as any, // Using skipped as fallback for failed state
        metadata: {
          ...(task.metadata as Record<string, unknown> || {}),
          error: error instanceof Error ? error.message : 'Unknown error',
          failed: true,
        },
      });

      throw error;
    }
  }

  protected abstract handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult>;

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    if (!input.prompt || !input.prompt.trim()) {
      throw new Error("Prompt is required for agent execution");
    }

    // Set context from metadata if available
    const userId = input.metadata?.userId as string | undefined;
    const conversationId = input.metadata?.conversationId as string | undefined;
    if (userId || conversationId) {
      this.setContext(userId, conversationId);
    }

    await this.memory.append({ role: "user", content: input.prompt });

    const context: AgentExecutionContext = {
      supabase: this.supabase,
      memory: this.memory,
      logger: this.logger,
      delegateTo: (agent, task) => this.delegateTo(agent, task),
    };

    const result = await this.handleRun(input, context);

    await this.memory.append({ role: "assistant", content: result.output });

    if (this.systemPrompt) {
      this.logger.debug("System prompt in use", { promptLength: this.systemPrompt.length });
    }

    return result;
  }
}
