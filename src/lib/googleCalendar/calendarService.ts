/**
 * Google Calendar API service
 * Handles calendar event CRUD operations
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from './oauth';
import type { DailyPlanBlock } from '@/types/database';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep helper for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute operation with exponential backoff retry
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on auth errors (403, 401)
      if (error.code === 403 || error.code === 401) {
        throw error;
      }

      // Retry on rate limit (429) or server errors (5xx)
      const shouldRetry = error.code === 429 || (error.code >= 500 && error.code < 600);

      if (!shouldRetry || attempt === maxRetries) {
        break;
      }

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.log(`[Calendar] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error(`${context} failed after ${maxRetries + 1} attempts`);
}

/**
 * Create a Google Calendar event from a daily plan block
 *
 * @param userId - User ID
 * @param block - Daily plan block to create event for
 * @returns Google Calendar event ID
 */
export async function createEvent(userId: string, block: DailyPlanBlock): Promise<string> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: block.title,
    description: block.description || '',
    start: {
      dateTime: block.start_time,
      timeZone: 'America/Los_Angeles', // TODO: Get from user preferences
    },
    end: {
      dateTime: block.end_time,
      timeZone: 'America/Los_Angeles',
    },
    extendedProperties: {
      private: {
        skyras_block_id: block.id,
        skyras_plan_id: block.plan_id,
        skyras_task_ids: JSON.stringify(block.task_ids),
        skyras_managed: 'true', // Flag to identify our events
      },
    },
    colorId: '9', // Blue color
  };

  const result = await withRetry(
    async () => {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      return response;
    },
    `Create event "${block.title}"`
  );

  if (!result.data.id) {
    throw new Error('Failed to create calendar event: no event ID returned');
  }

  console.log(`[Calendar] Created event for block ${block.id}: ${result.data.id}`);

  return result.data.id;
}

/**
 * Update an existing Google Calendar event
 *
 * @param userId - User ID
 * @param eventId - Google Calendar event ID
 * @param updates - Partial block data to update
 */
export async function updateEvent(
  userId: string,
  eventId: string,
  updates: Partial<Pick<DailyPlanBlock, 'title' | 'description' | 'start_time' | 'end_time'>>
): Promise<void> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  // Fetch existing event to preserve data
  const existingEvent = await withRetry(
    async () => {
      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId,
      });
      return response;
    },
    `Fetch event ${eventId}`
  );

  const event: any = {
    summary: updates.title ?? existingEvent.data.summary,
    description: updates.description ?? existingEvent.data.description,
  };

  if (updates.start_time) {
    event.start = {
      dateTime: updates.start_time,
      timeZone: 'America/Los_Angeles',
    };
  }

  if (updates.end_time) {
    event.end = {
      dateTime: updates.end_time,
      timeZone: 'America/Los_Angeles',
    };
  }

  await withRetry(
    async () => {
      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });
    },
    `Update event ${eventId}`
  );

  console.log(`[Calendar] Updated event: ${eventId}`);
}

/**
 * Delete a Google Calendar event
 *
 * @param userId - User ID
 * @param eventId - Google Calendar event ID
 */
export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  await withRetry(
    async () => {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });
    },
    `Delete event ${eventId}`
  );

  console.log(`[Calendar] Deleted event: ${eventId}`);
}

/**
 * Fetch all calendar events for a specific date
 * Used for conflict detection
 *
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Array of calendar events
 */
export async function getEventsForDay(userId: string, date: string): Promise<CalendarEvent[]> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  // Parse date and get start/end of day in Pacific time
  const startOfDay = new Date(`${date}T00:00:00-08:00`);
  const endOfDay = new Date(`${date}T23:59:59-08:00`);

  const result = await withRetry(
    async () => {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response;
    },
    `Fetch events for ${date}`
  );

  const events: CalendarEvent[] = [];

  if (result.data.items) {
    for (const item of result.data.items) {
      // Skip all-day events
      if (!item.start?.dateTime || !item.end?.dateTime) {
        continue;
      }

      events.push({
        id: item.id || '',
        summary: item.summary || 'Untitled Event',
        description: item.description,
        start_time: item.start.dateTime,
        end_time: item.end.dateTime,
        is_skyras_managed: item.extendedProperties?.private?.skyras_managed === 'true',
        skyras_block_id: item.extendedProperties?.private?.skyras_block_id,
      });
    }
  }

  console.log(`[Calendar] Fetched ${events.length} events for ${date}`);

  return events;
}

/**
 * Delete all SkyRas-managed events for a specific date
 * Used when user rejects a plan
 *
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format
 */
export async function deleteSkyRasEventsForDay(userId: string, date: string): Promise<number> {
  const events = await getEventsForDay(userId, date);
  const skyrasEvents = events.filter(e => e.is_skyras_managed);

  let deletedCount = 0;

  for (const event of skyrasEvents) {
    try {
      await deleteEvent(userId, event.id);
      deletedCount++;
    } catch (error) {
      console.error(`[Calendar] Failed to delete event ${event.id}:`, error);
      // Continue deleting other events
    }
  }

  console.log(`[Calendar] Deleted ${deletedCount} SkyRas events for ${date}`);

  return deletedCount;
}

/**
 * Calendar event type returned by getEventsForDay
 */
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_skyras_managed: boolean;
  skyras_block_id?: string;
}
