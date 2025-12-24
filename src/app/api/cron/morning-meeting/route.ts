/**
 * Vercel Cron endpoint for Marcus Morning Meeting
 * Runs daily at 7:30am PT to generate plans and send push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDailyPlanForUser } from '@/lib/morningMeeting/planGenerator';
import { sendMorningMeetingNotification } from '@/lib/firebase/admin';

// This endpoint is called by Vercel Cron
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not set');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron] Invalid authorization');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Morning Meeting job started');

  try {
    // TODO: Get list of active users from database
    // For now, using a hardcoded list or env var
    const targetUsersRaw = process.env.MORNING_MEETING_USERS || 'public';
    const targetUsers = targetUsersRaw.split(',').map(u => u.trim());

    const results: Array<{
      userId: string;
      success: boolean;
      planId?: string;
      pushSent?: boolean;
      error?: string;
    }> = [];

    for (const userId of targetUsers) {
      try {
        console.log(`[Cron] Generating plan for user: ${userId}`);

        // Generate daily plan
        const { plan, blocks } = await generateDailyPlanForUser(userId);

        // Send push notification
        let pushSent = false;
        try {
          const pushResult = await sendMorningMeetingNotification(
            userId,
            plan.id,
            plan.daily_brief || 'Your daily plan is ready!'
          );

          pushSent = pushResult.successCount > 0;

          console.log(
            `[Cron] Push notification sent to ${pushResult.successCount} device(s) for user ${userId}`
          );
        } catch (pushError) {
          console.error(`[Cron] Failed to send push notification for user ${userId}:`, pushError);
          // Continue even if push fails
        }

        results.push({
          userId,
          success: true,
          planId: plan.id,
          pushSent,
        });

        console.log(`[Cron] Successfully generated plan ${plan.id} for user ${userId}`);
      } catch (error) {
        console.error(`[Cron] Failed to generate plan for user ${userId}:`, error);

        results.push({
          userId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(
      `[Cron] Morning Meeting job completed: ${successCount} success, ${failureCount} failure`
    );

    return NextResponse.json({
      success: true,
      message: `Generated plans for ${successCount} user(s)`,
      results,
    });
  } catch (error) {
    console.error('[Cron] Morning Meeting job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
