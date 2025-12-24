/**
 * Register FCM token for push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationTokensDb } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fcmToken, deviceType } = body;

    if (!userId || !fcmToken) {
      return NextResponse.json(
        { success: false, error: 'userId and fcmToken are required' },
        { status: 400 }
      );
    }

    // Validate device type
    const validDeviceTypes = ['web', 'ios', 'android'];
    if (deviceType && !validDeviceTypes.includes(deviceType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid deviceType' },
        { status: 400 }
      );
    }

    // Check if token already exists
    const existingToken = await pushNotificationTokensDb.getByFcmToken(fcmToken);

    if (existingToken) {
      // Reactivate if it was deactivated
      if (!existingToken.is_active) {
        await pushNotificationTokensDb.update(existingToken.id, {
          is_active: true,
          device_type: deviceType || existingToken.device_type,
        });

        console.log(`[/api/push/register] Reactivated token for user ${userId}`);
      } else {
        console.log(`[/api/push/register] Token already registered for user ${userId}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Token already registered',
      });
    }

    // Create new token record
    const token = await pushNotificationTokensDb.create({
      user_id: userId,
      fcm_token: fcmToken,
      device_type: deviceType || 'web',
      is_active: true,
      metadata: {},
    });

    console.log(`[/api/push/register] Registered new token for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Push notification token registered',
      data: {
        tokenId: token.id,
      },
    });
  } catch (error) {
    console.error('[/api/push/register POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to register token: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
