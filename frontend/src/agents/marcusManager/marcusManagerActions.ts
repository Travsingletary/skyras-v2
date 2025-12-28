/**
 * Marcus the Manager - State Management Actions
 * Handles persistence of project management state
 */

import { AgentExecutionContext } from "@/agents/core/BaseAgent";

export interface MarcusManagerState {
  active_priority: string | null;
  today_task: string | null;
  why_it_matters: string | null;
  checklist: ChecklistItem[];
  backlog: BacklogItem[];
  last_completed_task: string | null;
  last_completed_at: string | null;
  next_review_time: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface BacklogItem {
  id: string;
  idea: string;
  added_at: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

/**
 * Get or create Marcus Manager state for a user
 */
export async function getMarcusManagerState(
  context: AgentExecutionContext,
  userId: string = 'public'
): Promise<MarcusManagerState> {
  try {
    // Use SupabaseClientLike wrapper API (select with filters object, returns array)
    const { data: rows, error } = await context.supabase
      .from('marcus_manager_state')
      .select({ user_id: userId });

    if (error) {
      console.error('[getMarcusManagerState] Supabase query error:', {
        table: 'marcus_manager_state',
        user_id: userId,
        error_code: (error as any)?.code,
        error_message: error.message,
      });
      throw new Error(`Failed to get Marcus Manager state: ${error.message}`);
    }

    // Handle array result (get first matching row)
    const data = rows?.[0] || null;

    if (data) {
      return {
        active_priority: data.active_priority || null,
        today_task: data.today_task || null,
        why_it_matters: data.why_it_matters || null,
        checklist: (data.checklist as ChecklistItem[]) || [],
        backlog: (data.backlog as BacklogItem[]) || [],
        last_completed_task: data.last_completed_task || null,
        last_completed_at: data.last_completed_at || null,
        next_review_time: data.next_review_time || null,
        metadata: (data.metadata as Record<string, unknown>) || {},
      };
    }
  } catch (error) {
    // Log query context (no secrets, no payload bodies)
    console.error('[getMarcusManagerState] Query failed:', {
      table: 'marcus_manager_state',
      user_id: userId,
      error_type: error instanceof Error ? error.constructor.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Create default state
  const defaultState: MarcusManagerState = {
    active_priority: null,
    today_task: null,
    why_it_matters: null,
    checklist: [],
    backlog: [],
    last_completed_task: null,
    last_completed_at: null,
    next_review_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    metadata: {},
  };

  return defaultState;
}

/**
 * Save Marcus Manager state
 */
export async function saveMarcusManagerState(
  context: AgentExecutionContext,
  userId: string,
  state: Partial<MarcusManagerState>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (state.active_priority !== undefined) updateData.active_priority = state.active_priority;
  if (state.today_task !== undefined) updateData.today_task = state.today_task;
  if (state.why_it_matters !== undefined) updateData.why_it_matters = state.why_it_matters;
  if (state.checklist !== undefined) updateData.checklist = state.checklist;
  if (state.backlog !== undefined) updateData.backlog = state.backlog;
  if (state.last_completed_task !== undefined) updateData.last_completed_task = state.last_completed_task;
  if (state.last_completed_at !== undefined) updateData.last_completed_at = state.last_completed_at;
  if (state.next_review_time !== undefined) updateData.next_review_time = state.next_review_time;
  if (state.metadata !== undefined) updateData.metadata = state.metadata;

  const { error } = await context.supabase
    .from('marcus_manager_state')
    .upsert({
      user_id: userId,
      ...updateData,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    throw new Error(`Failed to save Marcus Manager state: ${error.message}`);
  }
}

/**
 * Add item to backlog
 */
export async function addToBacklog(
  context: AgentExecutionContext,
  userId: string,
  idea: string,
  priority?: 'low' | 'medium' | 'high',
  category?: string
): Promise<BacklogItem> {
  const state = await getMarcusManagerState(context, userId);
  
  const backlogItem: BacklogItem = {
    id: `backlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    idea,
    added_at: new Date().toISOString(),
    priority: priority || 'medium',
    category,
  };

  const updatedBacklog = [...state.backlog, backlogItem];

  await saveMarcusManagerState(context, userId, {
    backlog: updatedBacklog,
  });

  return backlogItem;
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(
  context: AgentExecutionContext,
  userId: string,
  itemId: string,
  updates: Partial<ChecklistItem>
): Promise<void> {
  const state = await getMarcusManagerState(context, userId);
  
  const updatedChecklist = state.checklist.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  );

  await saveMarcusManagerState(context, userId, {
    checklist: updatedChecklist,
  });
}

/**
 * Add checklist item
 */
export async function addChecklistItem(
  context: AgentExecutionContext,
  userId: string,
  text: string
): Promise<ChecklistItem> {
  const state = await getMarcusManagerState(context, userId);
  
  const checklistItem: ChecklistItem = {
    id: `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    completed: false,
    created_at: new Date().toISOString(),
  };

  const updatedChecklist = [...state.checklist, checklistItem];

  await saveMarcusManagerState(context, userId, {
    checklist: updatedChecklist,
  });

  return checklistItem;
}

