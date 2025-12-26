/**
 * Atlas - PM Agent
 * Primary decision-maker and traffic controller for all work
 * 
 * Identity: Calm, direct, authoritative
 * Authority: First agent invoked, only one who can set priorities
 */

import { BaseAgent, AgentRunInput, AgentRunResult, AgentExecutionContext } from "@/agents/core/BaseAgent";
import { createLogger } from "@/lib/logger";
import { ATLAS_SYSTEM_PROMPT } from "./atlasSystemPrompt";
import {
  getMarcusManagerState,
  saveMarcusManagerState,
  addToBacklog,
  addChecklistItem,
  updateChecklistItem,
  type MarcusManagerState,
  type ChecklistItem,
} from "@/agents/marcusManager/marcusManagerActions";

// Keywords that indicate scope creep / new ideas
const SCOPE_CREEP_KEYWORDS = [
  /new (feature|idea|project|initiative|plan)/i,
  /also (want|need|should|could)/i,
  /what about/i,
  /maybe we (could|should)/i,
  /in the future/i,
  /later we/i,
  /another (thing|idea|feature)/i,
  /additionally/i,
  /plus/i,
];

// Keywords that indicate task completion
const COMPLETION_KEYWORDS = [
  /done|completed|finished|accomplished/i,
  /check(ed|off|mark)/i,
  /finished with/i,
];

export class AtlasAgent extends BaseAgent {
  constructor() {
    super({
      name: "Atlas",
      memoryNamespace: "atlas_pm",
      systemPrompt: ATLAS_SYSTEM_PROMPT,
      logger: createLogger("AtlasAgent"),
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

    // Check if we need to set initial priority
    if (!state.active_priority) {
      return this.handleInitialPriority(context, userId, userMessage);
    }

    // Normal response: next task, why it matters, checklist
    return this.generateAtlasResponse(context, userId, userMessage, state);
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
    const idea = message.replace(/^(also|what about|maybe|in the future|later|additionally|plus)/i, '').trim();
    
    // Add to backlog
    await addToBacklog(context, userId, idea || message);

    // Generate response redirecting to priority
    const output = this.formatAtlasResponse(
      state.today_task || `Continue work on: ${state.active_priority}`,
      state.why_it_matters || `This maintains focus on ${state.active_priority}.`,
      state.checklist
    );

    return {
      output: `Noted. Added to backlog.\n\n${output}`,
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
    const todayTask = this.extractNextTask(message) || this.generateNextTask(priority);
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
      output: this.formatAtlasResponse(todayTask, whyItMatters, checklist),
      notes: {
        initial_priority_set: true,
        active_priority: priority,
      },
    };
  }

  /**
   * Generate Atlas response format
   */
  private async generateAtlasResponse(
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
      todayTask = this.extractNextTask(userMessage) || this.generateNextTask(state.active_priority || 'Current work');
      whyItMatters = this.generateWhyItMatters(state.active_priority || 'Current work', todayTask);
      checklist = this.generateChecklist(state.active_priority || 'Current work', todayTask);

      await saveMarcusManagerState(context, userId, {
        today_task: todayTask,
        why_it_matters: whyItMatters,
        checklist,
      });

      state = await getMarcusManagerState(context, userId);
    }

    return {
      output: this.formatAtlasResponse(todayTask, whyItMatters, checklist),
      notes: {
        active_priority: state.active_priority,
        today_task: todayTask,
        checklist_count: checklist.length,
      },
    };
  }

  /**
   * Format Atlas response according to mandatory structure
   */
  private formatAtlasResponse(
    nextTask: string,
    whyItMatters: string,
    checklist: ChecklistItem[]
  ): string {
    const lines: string[] = [];

    // 1. Single next task (one sentence, no options)
    lines.push(nextTask);
    lines.push('');

    // 2. Why it matters (one short paragraph)
    lines.push(whyItMatters);
    lines.push('');

    // 3. Today checklist (5–10 concrete, actionable items)
    if (checklist.length === 0) {
      lines.push('No checklist items yet.');
    } else {
      checklist.forEach(item => {
        const checkbox = item.completed ? '[x]' : '[ ]';
        lines.push(`${checkbox} ${item.text}`);
      });
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
   * Generate next task based on priority
   */
  private generateNextTask(priority: string): string {
    if (!priority || priority === 'Current work') {
      return "Set your active priority to begin work.";
    }

    // Generate task based on priority keywords
    const lowerPriority = priority.toLowerCase();
    
    if (lowerPriority.includes('analytics') || lowerPriority.includes('metrics')) {
      return "Review analytics dashboard and identify top-performing content patterns.";
    } else if (lowerPriority.includes('content') || lowerPriority.includes('video')) {
      return "Plan next video release: concept, script outline, and production timeline.";
    } else if (lowerPriority.includes('music') || lowerPriority.includes('release')) {
      return "Review music release schedule and coordinate with distribution plan.";
    } else if (lowerPriority.includes('audience') || lowerPriority.includes('engagement')) {
      return "Analyze audience comments and engagement metrics to identify content opportunities.";
    } else if (lowerPriority.includes('collaboration') || lowerPriority.includes('partnership')) {
      return "Research potential collaboration opportunities with other creators.";
    } else if (lowerPriority.includes('growth') || lowerPriority.includes('subscriber')) {
      return "Review channel growth metrics and identify top growth opportunity.";
    }

    return `Work on: ${priority}`;
  }

  /**
   * Generate "why it matters" paragraph (short, no fluff)
   */
  private generateWhyItMatters(priority: string, task: string): string {
    return `This task directly supports ${priority}. Completing it moves us forward. Focus here prevents distraction.`;
  }

  /**
   * Generate checklist (5-10 concrete, actionable items)
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
        'Export key metrics from analytics dashboard',
        'Compare current period vs previous period',
        'Identify top 3 performing items',
      ],
      'content': [
        'Draft content concept and hook',
        'Outline structure',
        'Plan visual elements',
      ],
      'music': [
        'Review release calendar',
        'Coordinate with distribution channels',
        'Prepare promotional materials',
      ],
      'audience': [
        'Review recent comments and feedback',
        'Analyze engagement patterns',
        'Identify content requests',
      ],
      'growth': [
        'Review subscriber growth trends',
        'Identify top traffic sources',
        'Analyze conversion metrics',
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
 * Factory function to create Atlas agent
 */
export function createAtlasAgent(): AtlasAgent {
  return new AtlasAgent();
}

