/**
 * Conflict detection for daily plan blocks
 * Checks for time overlaps with existing calendar events
 */

/**
 * Block with conflict information
 */
interface BlockWithConflict {
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  task_ids: string[];
  has_conflict: boolean;
  alternate_slots: Array<{ start_time: string; end_time: string }>;
}

/**
 * Existing calendar event
 */
interface CalendarEvent {
  summary: string;
  start_time: string;
  end_time: string;
}

/**
 * Detect conflicts between proposed blocks and existing calendar events
 *
 * @param userId - User ID
 * @param planDate - Plan date (YYYY-MM-DD)
 * @param blocks - Proposed time blocks
 * @param existingEvents - Existing calendar events for the day
 * @returns Blocks with conflict information
 */
export async function detectConflicts(
  userId: string,
  planDate: string,
  blocks: Array<{
    start_time: string;
    end_time: string;
    title: string;
    description: string;
    task_ids: string[];
  }>,
  existingEvents: CalendarEvent[]
): Promise<BlockWithConflict[]> {
  console.log(`[Conflict Detector] Checking ${blocks.length} blocks against ${existingEvents.length} events`);

  const blocksWithConflicts: BlockWithConflict[] = [];

  for (const block of blocks) {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);

    // Check for overlaps with existing events
    const conflicts = existingEvents.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      return hasTimeOverlap(blockStart, blockEnd, eventStart, eventEnd);
    });

    const hasConflict = conflicts.length > 0;

    // Generate alternate time slots if there's a conflict
    const alternateSlots = hasConflict
      ? generateAlternateSlots(blockStart, blockEnd, existingEvents, planDate)
      : [];

    blocksWithConflicts.push({
      ...block,
      has_conflict: hasConflict,
      alternate_slots: alternateSlots,
    });

    if (hasConflict) {
      console.log(
        `[Conflict Detector] Block "${block.title}" conflicts with ${conflicts.length} event(s):`,
        conflicts.map(c => c.summary).join(', ')
      );
    }
  }

  const conflictCount = blocksWithConflicts.filter(b => b.has_conflict).length;
  console.log(`[Conflict Detector] Found ${conflictCount} blocks with conflicts`);

  return blocksWithConflicts;
}

/**
 * Check if two time ranges overlap
 */
function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  // Two ranges overlap if:
  // - start1 is between start2 and end2, OR
  // - end1 is between start2 and end2, OR
  // - start2 is between start1 and end1, OR
  // - end2 is between start1 and end1
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start2 >= start1 && start2 < end1) ||
    (end2 > start1 && end2 <= end1)
  );
}

/**
 * Generate alternate time slots for a conflicting block
 * Strategy: Shift by +2 hours and +4 hours
 */
function generateAlternateSlots(
  blockStart: Date,
  blockEnd: Date,
  existingEvents: CalendarEvent[],
  planDate: string
): Array<{ start_time: string; end_time: string }> {
  const alternates: Array<{ start_time: string; end_time: string }> = [];
  const duration = blockEnd.getTime() - blockStart.getTime(); // Duration in milliseconds

  // Try shifting by +2 hours
  const alt1Start = new Date(blockStart.getTime() + 2 * 60 * 60 * 1000);
  const alt1End = new Date(alt1Start.getTime() + duration);

  if (isWithinWorkingHours(alt1Start, alt1End) && !hasAnyConflict(alt1Start, alt1End, existingEvents)) {
    alternates.push({
      start_time: alt1Start.toISOString(),
      end_time: alt1End.toISOString(),
    });
  }

  // Try shifting by +4 hours
  const alt2Start = new Date(blockStart.getTime() + 4 * 60 * 60 * 1000);
  const alt2End = new Date(alt2Start.getTime() + duration);

  if (isWithinWorkingHours(alt2Start, alt2End) && !hasAnyConflict(alt2Start, alt2End, existingEvents)) {
    alternates.push({
      start_time: alt2Start.toISOString(),
      end_time: alt2End.toISOString(),
    });
  }

  // Try shifting by -2 hours (earlier in the day)
  const alt3Start = new Date(blockStart.getTime() - 2 * 60 * 60 * 1000);
  const alt3End = new Date(alt3Start.getTime() + duration);

  if (isWithinWorkingHours(alt3Start, alt3End) && !hasAnyConflict(alt3Start, alt3End, existingEvents)) {
    alternates.push({
      start_time: alt3Start.toISOString(),
      end_time: alt3End.toISOString(),
    });
  }

  return alternates;
}

/**
 * Check if time slot is within typical working hours (8am - 7pm)
 */
function isWithinWorkingHours(start: Date, end: Date): boolean {
  const startHour = start.getHours();
  const endHour = end.getHours();

  // Must start at or after 8am and end by 7pm
  return startHour >= 8 && endHour <= 19;
}

/**
 * Check if a time slot conflicts with any existing events
 */
function hasAnyConflict(
  start: Date,
  end: Date,
  existingEvents: CalendarEvent[]
): boolean {
  return existingEvents.some(event => {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    return hasTimeOverlap(start, end, eventStart, eventEnd);
  });
}
