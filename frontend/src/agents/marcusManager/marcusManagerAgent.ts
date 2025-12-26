/**
 * Marcus the Manager - Strict Project Manager for YouTube Music Growth
 * 
 * Responsibilities:
 * - Maintain ONE active priority at a time
 * - Respond in strict format: next task, why it matters, checklist
 * - Handle scope creep by adding to backlog
 * - Delegate to Giorgio with bounded requests
 * - Override other agents when priorities conflict
 */

import { BaseAgent, AgentRunInput, AgentRunResult, AgentExecutionContext } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import { MARCUS_MANAGER_SYSTEM_PROMPT } from "./marcusManagerSystemPrompt";
import {
  getMarcusManagerState,
  saveMarcusManagerState,
  addToBacklog,
  addChecklistItem,
  updateChecklistItem,
  type MarcusManagerState,
  type ChecklistItem,
} from "./marcusManagerActions";
import { createGiorgioAgent } from "@/agents/giorgio";

// Keywords that indicate scope creep / new ideas
const SCOPE_CREEP_KEYWORDS = [
  /new (feature|idea|project|initiative|plan)/i,
  /also (want|need|should|could)/i,
  /what about/i,
  /maybe we (could|should)/i,
  /in the future/i,
  /later we/i,
  /another (thing|idea|feature)/i,
];

// Keywords that indicate task completion
const COMPLETION_KEYWORDS = [
  /done|completed|finished|accomplished/i,
  /check(ed|off|mark)/i,
  /finished with/i,
];

export interface GiorgioDelegation {
  delegate_to: "Giorgio";
  request: string;
  constraints: string;
}

export class MarcusManagerAgent extends BaseAgent {
  constructor() {
    super({
      name: "Marcus the Manager",
      memoryNamespace: "marcus_manager",
      systemPrompt: MARCUS_MANAGER_SYSTEM_PROMPT,
      logger: createLogger("MarcusManagerAgent"),
    });
  }

  /**
   * Main handler for user messages
   */
  protected async handleRun(
    input: AgentRunInput,
    context: AgentExecutionContext
  ): Promise<AgentRunResult> {
    const userId = (input.metadata?.userId as string) || 'public';
    const userMessage = input.prompt.trim();

    // Get current state
    let state = await getMarcusManagerState(context, userId);

    // Check for scope creep
    const isScopeCreep = this.detectScopeCreep(userMessage, state);
    
    if (isScopeCreep) {
      return this.handleScopeCreep(context, userId, userMessage, state);
    }

    // Check for task completion
    const completedTask = this.detectTaskCompletion(userMessage, state);
    if (completedTask) {
      state = await this.handleTaskCompletion(context, userId, completedTask, state);
    }

    // Check for Giorgio delegation request
    const delegationRequest = this.detectDelegationRequest(userMessage);
    if (delegationRequest) {
      return this.handleGiorgioDelegation(context, delegationRequest, state);
    }

    // Check if we need to set initial priority
    if (!state.active_priority) {
      return this.handleInitialPriority(context, userId, userMessage);
    }

    // Normal response: next task, why it matters, checklist
    return this.generateStrictResponse(context, userId, userMessage, state);
  }

  /**
   * Detect if user message contains scope creep
   */
  private detectScopeCreep(message: string, state: MarcusManagerState): boolean {
    if (!state.active_priority) return false;
    
    return SCOPE_CREEP_KEYWORDS.some(pattern => pattern.test(message));
  }

  /**
   * Handle scope creep by adding to backlog and redirecting
   */
  private async handleScopeCreep(
    context: AgentExecutionContext,
    userId: string,
    message: string,
    state: MarcusManagerState
  ): Promise<AgentRunResult> {
    // Extract the idea from the message
    const idea = message.replace(/^(also|what about|maybe|in the future|later)/i, '').trim();
    
    // Add to backlog
    await addToBacklog(context, userId, idea || message);

    // Generate response
    const output = `Noted. Added to backlog.\n\nBack to active_priority: ${state.active_priority}\n\n${this.formatStrictResponse(state)}`;

    return {
      output,
      notes: {
        scope_creep_detected: true,
        added_to_backlog: true,
        active_priority: state.active_priority,
      },
    };
  }

  /**
   * Detect task completion in user message
   */
  private detectTaskCompletion(
    message: string,
    state: MarcusManagerState
  ): ChecklistItem | null {
    if (!COMPLETION_KEYWORDS.some(pattern => pattern.test(message))) {
      return null;
    }

    // Try to match checklist item by text
    const lowerMessage = message.toLowerCase();
    const matchingItem = state.checklist.find(item => 
      !item.completed && lowerMessage.includes(item.text.toLowerCase().substring(0, 20))
    );

    return matchingItem || null;
  }

  /**
   * Handle task completion
   */
  private async handleTaskCompletion(
    context: AgentExecutionContext,
    userId: string,
    item: ChecklistItem,
    state: MarcusManagerState
  ): Promise<MarcusManagerState> {
    // Mark item as completed
    await updateChecklistItem(context, userId, item.id, { completed: true });

    // Update last completed task
    await saveMarcusManagerState(context, userId, {
      last_completed_task: item.text,
      last_completed_at: new Date().toISOString(),
    });

    // Return updated state
    return await getMarcusManagerState(context, userId);
  }

  /**
   * Detect if user is requesting Giorgio delegation
   */
  private detectDelegationRequest(message: string): GiorgioDelegation | null {
    const delegationPatterns = [
      /(ask|tell|delegate to|have) giorgio/i,
      /giorgio (should|can|will|needs to)/i,
      /generate (prompt|script|idea|concept)/i,
    ];

    if (!delegationPatterns.some(pattern => pattern.test(message))) {
      return null;
    }

    // Extract request and constraints
    const requestMatch = message.match(/(?:generate|create|write|make)\s+(.+?)(?:\.|$)/i);
    const request = requestMatch ? requestMatch[1].trim() : message;

    // Default constraints
    const constraints = "Timebox: 5 minutes. Format: Text output only.";

    return {
      delegate_to: "Giorgio",
      request,
      constraints,
    };
  }

  /**
   * Handle delegation to Giorgio
   */
  private async handleGiorgioDelegation(
    context: AgentExecutionContext,
    delegation: GiorgioDelegation,
    state: MarcusManagerState
  ): Promise<AgentRunResult> {
    try {
      const giorgio = createGiorgioAgent();
      
      // Create bounded request for Giorgio
      const giorgioInput: AgentRunInput = {
        prompt: `${delegation.request}. Constraints: ${delegation.constraints}`,
        metadata: {
          project: state.active_priority || 'YouTube Music Growth',
          source: 'marcus_manager',
        },
      };

      const giorgioResult = await giorgio.run(giorgioInput);

      // Marcus decides what to do with the output
      const output = `GIORGIO OUTPUT:\n${giorgioResult.output}\n\nNEXT: Review output and determine next task based on active priority: ${state.active_priority || 'Not set'}\n\n${this.formatStrictResponse(state)}`;

      return {
        output,
        notes: {
          delegation: delegation,
          giorgio_output: giorgioResult.output,
          active_priority: state.active_priority,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        output: `Delegation to Giorgio failed: ${errorMessage}\n\n${this.formatStrictResponse(state)}`,
        notes: {
          delegation_error: errorMessage,
        },
      };
    }
  }

  /**
   * Handle initial priority setting
   */
  private async handleInitialPriority(
    context: AgentExecutionContext,
    userId: string,
    message: string
  ): Promise<AgentRunResult> {
    // Extract priority from message or use message as priority
    const priority = message.length > 100 ? message.substring(0, 100) + '...' : message;
    
    // Set initial priority and create first task
    const todayTask = this.extractNextTask(message) || "Review current YouTube channel analytics and identify top growth opportunity";
    const whyItMatters = this.generateWhyItMatters(priority, todayTask);
    const checklist = this.generateChecklist(priority, todayTask);

    await saveMarcusManagerState(context, userId, {
      active_priority: priority,
      today_task: todayTask,
      why_it_matters: whyItMatters,
      checklist,
    });

    const state = await getMarcusManagerState(context, userId);

    return {
      output: `Priority set: ${priority}\n\n${this.formatStrictResponse(state)}`,
      notes: {
        initial_priority_set: true,
        active_priority: priority,
      },
    };
  }

  /**
   * Generate strict response format
   */
  private async generateStrictResponse(
    context: AgentExecutionContext,
    userId: string,
    userMessage: string,
    state: MarcusManagerState
  ): Promise<AgentRunResult> {
    // Update today_task if needed (based on user message or state)
    let todayTask = state.today_task;
    let whyItMatters = state.why_it_matters;
    let checklist = state.checklist;

    // If no today_task or checklist is empty/completed, generate new ones
    if (!todayTask || checklist.every(item => item.completed)) {
      todayTask = this.extractNextTask(userMessage) || this.generateNextTask(state);
      whyItMatters = this.generateWhyItMatters(state.active_priority || 'YouTube Music Growth', todayTask);
      checklist = this.generateChecklist(state.active_priority || 'YouTube Music Growth', todayTask);

      await saveMarcusManagerState(context, userId, {
        today_task: todayTask,
        why_it_matters: whyItMatters,
        checklist,
      });

      state = await getMarcusManagerState(context, userId);
    }

    return {
      output: this.formatStrictResponse(state),
      notes: {
        active_priority: state.active_priority,
        today_task: todayTask,
        checklist_count: checklist.length,
      },
    };
  }

  /**
   * Format strict response according to requirements
   */
  private formatStrictResponse(state: MarcusManagerState): string {
    const lines: string[] = [];

    lines.push('---');
    lines.push(`NEXT TASK: ${state.today_task || 'No task set'}`);
    lines.push('');
    lines.push(`WHY IT MATTERS: ${state.why_it_matters || 'Task importance not set'}`);
    lines.push('');
    lines.push("TODAY'S CHECKLIST:");
    
    if (state.checklist.length === 0) {
      lines.push('- [ ] No checklist items yet');
    } else {
      state.checklist.forEach(item => {
        const checkbox = item.completed ? '[x]' : '[ ]';
        lines.push(`- ${checkbox} ${item.text}`);
      });
    }

    lines.push('---');

    if (state.active_priority) {
      lines.push(`\nActive Priority: ${state.active_priority}`);
    }

    if (state.backlog.length > 0) {
      lines.push(`\nBacklog: ${state.backlog.length} item(s) pending`);
    }

    return lines.join('\n');
  }

  /**
   * Extract next task from user message
   */
  private extractNextTask(message: string): string | null {
    // Look for task indicators
    const taskPatterns = [
      /(?:need to|should|must|will|going to)\s+(.+?)(?:\.|$)/i,
      /(?:task|next|focus on|work on)\s*:?\s*(.+?)(?:\.|$)/i,
    ];

    for (const pattern of taskPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Generate next task based on state
   */
  private generateNextTask(state: MarcusManagerState): string {
    if (!state.active_priority) {
      return "Set your active priority for YouTube music growth";
    }

    // Generate task based on priority
    const priority = state.active_priority.toLowerCase();
    
    if (priority.includes('analytics') || priority.includes('metrics')) {
      return "Review YouTube Analytics dashboard and identify top-performing content patterns";
    } else if (priority.includes('content') || priority.includes('video')) {
      return "Plan next video release: concept, script outline, and production timeline";
    } else if (priority.includes('music') || priority.includes('release')) {
      return "Review music release schedule and coordinate with distribution plan";
    } else if (priority.includes('audience') || priority.includes('engagement')) {
      return "Analyze audience comments and engagement metrics to identify content opportunities";
    } else if (priority.includes('collaboration') || priority.includes('partnership')) {
      return "Research potential collaboration opportunities with other YouTube music creators";
    }

    return `Work on: ${state.active_priority}`;
  }

  /**
   * Generate "why it matters" paragraph
   */
  private generateWhyItMatters(priority: string, task: string): string {
    return `This task directly supports ${priority}. Completing it will move us closer to measurable YouTube growth metrics. Focus here prevents distraction and ensures progress on our single active priority.`;
  }

  /**
   * Generate checklist (5-10 items)
   */
  private generateChecklist(priority: string, task: string): ChecklistItem[] {
    const baseItems = [
      { text: `Review current status related to: ${priority}`, id: '1' },
      { text: `Break down "${task}" into actionable steps`, id: '2' },
      { text: 'Identify any blockers or dependencies', id: '3' },
      { text: 'Set specific completion criteria', id: '4' },
      { text: 'Allocate time and resources needed', id: '5' },
    ];

    // Add priority-specific items
    const priorityItems: Record<string, string[]> = {
      'analytics': [
        'Export key metrics from YouTube Analytics',
        'Compare current period vs previous period',
        'Identify top 3 performing videos',
      ],
      'content': [
        'Draft video concept and hook',
        'Outline script structure',
        'Plan visual elements and music',
      ],
      'music': [
        'Review release calendar',
        'Coordinate with distribution channels',
        'Prepare promotional materials',
      ],
      'audience': [
        'Review recent comments and feedback',
        'Analyze engagement patterns',
        'Identify content requests from audience',
      ],
    };

    const lowerPriority = priority.toLowerCase();
    let additionalItems: string[] = [];
    
    for (const [key, items] of Object.entries(priorityItems)) {
      if (lowerPriority.includes(key)) {
        additionalItems = items;
        break;
      }
    }

    const allItems = [...baseItems, ...additionalItems.map((text, idx) => ({ text, id: String(baseItems.length + idx + 1) }))];
    
    // Return 5-10 items
    const selectedItems = allItems.slice(0, Math.min(10, Math.max(5, allItems.length)));

    return selectedItems.map((item, idx) => ({
      id: `checklist_${Date.now()}_${idx}`,
      text: item.text,
      completed: false,
      created_at: new Date().toISOString(),
    }));
  }
}

/**
 * Factory function to create Marcus Manager agent
 */
export function createMarcusManagerAgent(): MarcusManagerAgent {
  return new MarcusManagerAgent();
}

