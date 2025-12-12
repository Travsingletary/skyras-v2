import { getSupabaseClient, SupabaseClientLike } from "@/backend/supabaseClient";
import { createLogger, Logger } from "@/lib/logger";

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
  constructor(private namespace: string) {}

  private records(): MemoryRecord[] {
    const store = getMemoryStore();
    if (!store[this.namespace]) {
      store[this.namespace] = [];
    }
    return store[this.namespace]!;
  }

  async append(record: Omit<MemoryRecord, "timestamp">) {
    this.records().push({ ...record, timestamp: new Date().toISOString() });
  }

  async history(limit = 20) {
    return this.records().slice(-limit);
  }
}

export abstract class BaseAgent {
  protected readonly logger: Logger;
  protected readonly supabase: SupabaseClientLike;
  protected readonly memory: AgentMemory;
  private readonly tools: Map<string, AgentTool> = new Map();
  private readonly systemPrompt?: string;

  constructor(private readonly options: AgentOptions) {
    this.logger = options.logger ?? createLogger(options.name);
    this.supabase = getSupabaseClient();
    this.memory = new AgentMemory(options.memoryNamespace);
    this.systemPrompt = options.systemPrompt;

    options.tools?.forEach((tool) => this.registerTool(tool));
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

  protected abstract handleRun(input: AgentRunInput, context: AgentExecutionContext): Promise<AgentRunResult>;

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    if (!input.prompt || !input.prompt.trim()) {
      throw new Error("Prompt is required for agent execution");
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
