/**
 * Marcus Morning Meeting Plan Generator
 * Generates daily plans using Marcus AI with context from tasks and calendar
 */

import { MarcusAgent } from '@/agents/marcus/marcusAgent';
import { dailyPlansDb, dailyPlanBlocksDb, workflowTasksDb } from '@/lib/database';
import { isConnected as isGoogleCalendarConnected } from '@/lib/googleCalendar/oauth';
import { getEventsForDay } from '@/lib/googleCalendar/calendarService';
import { detectConflicts } from './conflictDetector';
import { getMarcusPreferences } from '@/agents/marcus/marcusPreferences';
import type { DailyPlan, DailyPlanBlock, WorkflowTask } from '@/types/database';

/**
 * Marcus response format for daily plans
 */
interface MarcusPlanResponse {
  daily_brief: string;
  minimum_day_fallback: string;
  blocks: Array<{
    start_time: string;
    end_time: string;
    title: string;
    description: string;
    task_ids: string[];
  }>;
}

/**
 * Generate daily plan for a user using Marcus AI
 *
 * @param userId - User ID
 * @param targetDate - Date for plan (YYYY-MM-DD format), defaults to tomorrow
 * @returns Created daily plan with blocks
 */
export async function generateDailyPlanForUser(
  userId: string,
  targetDate?: string
): Promise<{ plan: DailyPlan; blocks: DailyPlanBlock[] }> {
  // Calculate target date (tomorrow by default)
  const planDate = targetDate || getTomorrowDate();

  console.log(`[Plan Generator] Generating plan for user ${userId}, date: ${planDate}`);

  // Check if plan already exists (idempotency)
  const existingPlan = await dailyPlansDb.getByUserAndDate(userId, planDate);
  if (existingPlan) {
    console.log(`[Plan Generator] Plan already exists for ${planDate}, returning existing plan`);
    const blocks = await dailyPlanBlocksDb.getByPlanId(existingPlan.id);
    return { plan: existingPlan, blocks };
  }

  // Step 1: Gather context
  const context = await gatherPlanningContext(userId, planDate);

  // Step 2: Generate plan with Marcus
  const marcusResponse = await callMarcusForPlan(userId, planDate, context);

  // Step 3: Detect conflicts (if calendar connected)
  let blocksWithConflicts = marcusResponse.blocks;
  if (context.calendarConnected) {
    blocksWithConflicts = await detectConflicts(userId, planDate, marcusResponse.blocks, context.existingEvents);
  }

  // Step 4: Store plan in database
  const plan = await dailyPlansDb.create({
    user_id: userId,
    plan_date: planDate,
    status: 'draft',
    daily_brief: marcusResponse.daily_brief,
    minimum_day_fallback: marcusResponse.minimum_day_fallback,
    metadata: {
      generated_at: new Date().toISOString(),
      task_count: context.pendingTasks.length,
      has_conflicts: blocksWithConflicts.some(b => b.has_conflict),
    },
  });

  // Step 5: Store blocks
  const blockInserts = blocksWithConflicts.map(block => ({
    plan_id: plan.id,
    start_time: block.start_time,
    end_time: block.end_time,
    title: block.title,
    description: block.description,
    task_ids: block.task_ids,
    sync_status: 'pending' as const,
    has_conflict: block.has_conflict,
    alternate_slots: block.alternate_slots,
    metadata: {},
  }));

  const blocks = await dailyPlanBlocksDb.createMany(blockInserts);

  console.log(`[Plan Generator] Created plan ${plan.id} with ${blocks.length} blocks`);

  return { plan, blocks };
}

/**
 * Get tomorrow's date in YYYY-MM-DD format (Pacific Time)
 */
function getTomorrowDate(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format as YYYY-MM-DD in Pacific time
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Gather all context needed for planning
 */
async function gatherPlanningContext(userId: string, planDate: string) {
  console.log(`[Plan Generator] Gathering context for ${userId}`);

  // Fetch pending workflow tasks
  const allTasks = await workflowTasksDb.getByUserId(userId);
  const pendingTasks = allTasks.filter(
    t => t.status === 'pending' || t.status === 'in_progress'
  );

  // Check if user has Google Calendar connected
  const calendarConnected = await isGoogleCalendarConnected(userId);

  // Fetch existing calendar events if connected
  let existingEvents: Array<{ summary: string; start_time: string; end_time: string }> = [];
  if (calendarConnected) {
    try {
      const events = await getEventsForDay(userId, planDate);
      existingEvents = events.map(e => ({
        summary: e.summary,
        start_time: e.start_time,
        end_time: e.end_time,
      }));
      console.log(`[Plan Generator] Found ${existingEvents.length} existing calendar events`);
    } catch (error) {
      console.error(`[Plan Generator] Failed to fetch calendar events:`, error);
      // Continue without calendar events
    }
  }

  // Get user preferences
  const preferences = await getMarcusPreferences(userId);

  return {
    pendingTasks,
    existingEvents,
    calendarConnected,
    preferences,
  };
}

/**
 * Call Marcus AI to generate daily plan
 */
async function callMarcusForPlan(
  userId: string,
  planDate: string,
  context: {
    pendingTasks: WorkflowTask[];
    existingEvents: Array<{ summary: string; start_time: string; end_time: string }>;
    preferences: any;
  }
): Promise<MarcusPlanResponse> {
  console.log(`[Plan Generator] Calling Marcus AI for plan generation`);

  // Build prompt for Marcus
  const prompt = buildMarcusPrompt(planDate, context);

  // Create Marcus agent
  const marcus = new MarcusAgent(userId);

  try {
    // Call Marcus with prompt
    const response = await marcus.run({
      prompt,
      metadata: {
        type: 'morning_meeting_plan',
        plan_date: planDate,
      },
    });

    // Parse JSON response
    const planData = parseMarkusResponse(response.output);

    // Validate plan
    validatePlan(planData);

    return planData;
  } catch (error) {
    console.error(`[Plan Generator] Marcus generation failed:`, error);

    // Fallback to default plan
    return generateFallbackPlan(planDate, context);
  }
}

/**
 * Build prompt for Marcus
 */
function buildMarcusPrompt(
  planDate: string,
  context: {
    pendingTasks: WorkflowTask[];
    existingEvents: Array<{ summary: string; start_time: string; end_time: string }>;
    preferences: any;
  }
): string {
  const { pendingTasks, existingEvents, preferences } = context;

  // Format tasks for prompt
  const tasksText = pendingTasks.length > 0
    ? pendingTasks
        .slice(0, 10) // Limit to top 10 tasks
        .map((t, i) => `${i + 1}. ${t.title}${t.description ? ` - ${t.description}` : ''}`)
        .join('\n')
    : 'No pending tasks';

  // Format existing events
  const eventsText = existingEvents.length > 0
    ? existingEvents
        .map(e => {
          const start = new Date(e.start_time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Los_Angeles',
          });
          const end = new Date(e.end_time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Los_Angeles',
          });
          return `- ${start} - ${end}: ${e.summary}`;
        })
        .join('\n')
    : 'No existing calendar events';

  // Get active projects
  const projects = preferences?.projects
    ?.map((p: any) => `- ${p.name}: ${p.description}`)
    .join('\n') || 'No active projects';

  return `# Morning Meeting Plan for ${planDate}

You are creating a daily plan for tomorrow. This is NOT a workflow - it's a single-day time-block schedule.

## CONTEXT

**Pending Tasks:**
${tasksText}

**Existing Calendar Events:**
${eventsText}

**Active Projects:**
${projects}

**User Preferences:**
- Max tasks per response: ${preferences?.taskStyle?.maxTasksPerResponse || 1}
- Priority format: WHY before WHAT
- Communication: Direct, no-BS, action-oriented

## YOUR TASK

Create a daily plan with:
1. **Daily Brief** (1-2 sentences): WHY this plan matters, what it accomplishes
2. **Time Blocks** (3-5 blocks): Specific time slots for work, accounting for existing events
3. **Minimum Day Fallback**: If user feels overwhelmed, what's the ONE thing they MUST do?

## OUTPUT FORMAT

Return your response as valid JSON (and ONLY JSON, no markdown code blocks):

{
  "daily_brief": "One sentence explaining WHY this day matters and what it achieves.",
  "minimum_day_fallback": "The single most important thing to accomplish.",
  "blocks": [
    {
      "start_time": "2025-12-23T09:00:00-08:00",
      "end_time": "2025-12-23T11:00:00-08:00",
      "title": "Deep work: X",
      "description": "Focus on Y because Z",
      "task_ids": ["task-uuid-if-applicable"]
    }
  ]
}

**CRITICAL RULES:**
- Return ONLY valid JSON, no markdown code blocks, no explanatory text
- Each block should be 1-3 hours
- Avoid overlapping with existing events (check times carefully)
- Don't overschedule - respect energy levels
- Align with user's priorities and active projects
- Use Pacific Time (America/Los_Angeles timezone)
- task_ids should be UUIDs from the pending tasks list above (or empty array)
- Start times should be realistic (9am-6pm generally)

Generate the plan now:`;
}

/**
 * Parse Marcus response (expecting JSON)
 */
function parseMarkusResponse(output: string): MarcusPlanResponse {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = output.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : output.trim();

    const parsed = JSON.parse(jsonString);

    return {
      daily_brief: parsed.daily_brief || '',
      minimum_day_fallback: parsed.minimum_day_fallback || '',
      blocks: parsed.blocks || [],
    };
  } catch (error) {
    console.error(`[Plan Generator] Failed to parse Marcus response:`, error);
    console.error('Raw output:', output);
    throw new Error('Marcus returned invalid JSON');
  }
}

/**
 * Validate plan structure
 */
function validatePlan(plan: MarcusPlanResponse): void {
  if (!plan.daily_brief || plan.daily_brief.length < 10) {
    throw new Error('Invalid plan: daily_brief too short');
  }

  if (!plan.minimum_day_fallback || plan.minimum_day_fallback.length < 5) {
    throw new Error('Invalid plan: minimum_day_fallback too short');
  }

  if (!Array.isArray(plan.blocks) || plan.blocks.length === 0) {
    throw new Error('Invalid plan: no blocks provided');
  }

  // Validate each block
  for (const block of plan.blocks) {
    if (!block.start_time || !block.end_time || !block.title) {
      throw new Error('Invalid block: missing required fields');
    }

    // Validate times
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid block: invalid date format');
    }

    if (end <= start) {
      throw new Error('Invalid block: end_time must be after start_time');
    }

    // Ensure task_ids is an array
    if (!Array.isArray(block.task_ids)) {
      block.task_ids = [];
    }
  }
}

/**
 * Generate fallback plan if Marcus fails
 */
function generateFallbackPlan(
  planDate: string,
  context: { pendingTasks: WorkflowTask[] }
): MarcusPlanResponse {
  console.log(`[Plan Generator] Using fallback plan`);

  const tomorrow = new Date(planDate + 'T00:00:00-08:00');
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  return {
    daily_brief: 'Focus on making meaningful progress on your most important work.',
    minimum_day_fallback: 'Complete at least one high-priority task.',
    blocks: [
      {
        start_time: `${year}-${month}-${day}T09:00:00-08:00`,
        end_time: `${year}-${month}-${day}T11:00:00-08:00`,
        title: 'Deep work session',
        description: 'Focus on your most important task without interruptions.',
        task_ids: context.pendingTasks.length > 0 ? [context.pendingTasks[0].id] : [],
      },
      {
        start_time: `${year}-${month}-${day}T13:00:00-08:00`,
        end_time: `${year}-${month}-${day}T15:00:00-08:00`,
        title: 'Focused work',
        description: 'Continue making progress on priority tasks.',
        task_ids: context.pendingTasks.length > 1 ? [context.pendingTasks[1].id] : [],
      },
    ],
  };
}
