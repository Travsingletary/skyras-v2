/**
 * Approval service for morning meeting plans
 * Orchestrates plan approval and calendar synchronization
 */

import { dailyPlansDb, dailyPlanBlocksDb } from '@/lib/database';
import { createEvent } from '@/lib/googleCalendar/calendarService';
import { isConnected as isGoogleCalendarConnected } from '@/lib/googleCalendar/oauth';

/**
 * Approval result
 */
interface ApprovalResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  errors: Array<{ blockId: string; error: string }>;
}

/**
 * Approve a daily plan and sync to Google Calendar
 *
 * @param planId - Daily plan ID
 * @param userId - User ID (for calendar access)
 * @returns Approval result with sync statistics
 */
export async function approvePlan(planId: string, userId: string): Promise<ApprovalResult> {
  console.log(`[Approval Service] Approving plan ${planId} for user ${userId}`);

  // Update plan status to approved
  await dailyPlansDb.approve(planId);

  // Get all blocks for this plan
  const blocks = await dailyPlanBlocksDb.getByPlanId(planId);

  if (blocks.length === 0) {
    console.log(`[Approval Service] No blocks to sync for plan ${planId}`);
    return {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      errors: [],
    };
  }

  // Check if user has Google Calendar connected
  const calendarConnected = await isGoogleCalendarConnected(userId);

  if (!calendarConnected) {
    console.log(`[Approval Service] User ${userId} does not have Google Calendar connected`);
    return {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      errors: [],
    };
  }

  // Sync blocks to Google Calendar
  const result = await syncBlocksToCalendar(userId, blocks);

  console.log(
    `[Approval Service] Sync complete: ${result.syncedCount} synced, ${result.failedCount} failed, ${result.conflictCount} conflicts`
  );

  return result;
}

/**
 * Reject a daily plan
 * Marks plan as rejected and does NOT sync to calendar
 *
 * @param planId - Daily plan ID
 */
export async function rejectPlan(planId: string): Promise<void> {
  console.log(`[Approval Service] Rejecting plan ${planId}`);

  await dailyPlansDb.reject(planId);

  console.log(`[Approval Service] Plan ${planId} rejected`);
}

/**
 * Sync blocks to Google Calendar
 * Skips blocks that have conflicts
 */
async function syncBlocksToCalendar(
  userId: string,
  blocks: Array<{
    id: string;
    start_time: string;
    end_time: string;
    title: string;
    description?: string;
    has_conflict: boolean;
    sync_status: string;
    [key: string]: any;
  }>
): Promise<ApprovalResult> {
  let syncedCount = 0;
  let failedCount = 0;
  let conflictCount = 0;
  const errors: Array<{ blockId: string; error: string }> = [];

  for (const block of blocks) {
    // Skip blocks that have conflicts
    if (block.has_conflict) {
      console.log(`[Approval Service] Skipping block ${block.id} due to conflict`);
      await dailyPlanBlocksDb.updateSyncStatus(block.id, 'conflict');
      conflictCount++;
      continue;
    }

    // Skip blocks already synced
    if (block.sync_status === 'synced' && block.google_event_id) {
      console.log(`[Approval Service] Block ${block.id} already synced`);
      syncedCount++;
      continue;
    }

    try {
      // Create event in Google Calendar
      const googleEventId = await createEvent(userId, block as any);

      // Update block with event ID and sync status
      await dailyPlanBlocksDb.updateSyncStatus(block.id, 'synced', googleEventId);

      syncedCount++;
      console.log(`[Approval Service] Synced block ${block.id} -> Google event ${googleEventId}`);
    } catch (error) {
      console.error(`[Approval Service] Failed to sync block ${block.id}:`, error);

      // Update block status to failed
      await dailyPlanBlocksDb.updateSyncStatus(block.id, 'failed');

      failedCount++;
      errors.push({
        blockId: block.id,
        error: (error as Error).message,
      });
    }
  }

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
    conflictCount,
    errors,
  };
}

/**
 * Delete a plan and its blocks
 * Also removes synced calendar events
 *
 * @param planId - Daily plan ID
 * @param userId - User ID (for calendar access)
 */
export async function deletePlan(planId: string, userId: string): Promise<void> {
  console.log(`[Approval Service] Deleting plan ${planId}`);

  // Get blocks to delete associated calendar events
  const blocks = await dailyPlanBlocksDb.getByPlanId(planId);

  // Check if calendar is connected
  const calendarConnected = await isGoogleCalendarConnected(userId);

  // Delete calendar events for synced blocks
  if (calendarConnected) {
    const { deleteEvent } = await import('@/lib/googleCalendar/calendarService');

    for (const block of blocks) {
      if (block.sync_status === 'synced' && block.google_event_id) {
        try {
          await deleteEvent(userId, block.google_event_id);
          console.log(`[Approval Service] Deleted Google event ${block.google_event_id}`);
        } catch (error) {
          console.error(`[Approval Service] Failed to delete Google event:`, error);
          // Continue deleting other events
        }
      }
    }
  }

  // Delete blocks (CASCADE will handle this, but explicit is better)
  await dailyPlanBlocksDb.deleteByPlanId(planId);

  // Delete plan
  await dailyPlansDb.delete(planId);

  console.log(`[Approval Service] Deleted plan ${planId} and ${blocks.length} blocks`);
}
