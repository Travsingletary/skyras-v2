/**
 * Firebase Admin SDK for server-side push notifications
 * Handles sending push notifications to user devices
 */

import * as admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { pushNotificationTokensDb } from '@/lib/database';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Should be called once on server startup
 * 
 * Supports two methods:
 * 1. FIREBASE_SERVICE_ACCOUNT_FILE - Path to service account JSON file (for local development)
 * 2. FIREBASE_SERVICE_ACCOUNT - Base64-encoded service account JSON (for production)
 */
function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  let serviceAccount: admin.ServiceAccount;

  try {
    // Method 1: Try file path first (convenient for local development)
    const serviceAccountFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
    if (serviceAccountFilePath) {
      const fullPath = path.isAbsolute(serviceAccountFilePath)
        ? serviceAccountFilePath
        : path.join(process.cwd(), serviceAccountFilePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Firebase service account file not found: ${fullPath}`);
      }

      const serviceAccountJson = fs.readFileSync(fullPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountJson);
      console.log(`[Firebase Admin] Loaded service account from file: ${fullPath}`);
    } 
    // Method 2: Try base64-encoded env var (for production)
    else {
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccountBase64) {
        throw new Error(
          'Firebase service account not configured. Please set either:\n' +
          '  - FIREBASE_SERVICE_ACCOUNT_FILE (path to JSON file) for local development\n' +
          '  - FIREBASE_SERVICE_ACCOUNT (base64-encoded JSON) for production'
        );
      }

      // Decode base64 service account
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(serviceAccountJson);
      console.log('[Firebase Admin] Loaded service account from base64 env var');
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('[Firebase Admin] Initialized successfully');

    return firebaseApp;
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
    throw new Error(`Firebase Admin initialization failed: ${(error as Error).message}`);
  }
}

/**
 * Get Firebase Admin app instance
 */
export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
}

/**
 * Send push notification to a single user
 * Sends to all active devices registered for the user
 *
 * @param userId - User ID
 * @param notification - Notification content
 * @returns Number of successful sends
 */
export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{ successCount: number; failureCount: number }> {
  try {
    // Get user's active FCM tokens
    const tokens = await pushNotificationTokensDb.getByUserId(userId, true);

    if (tokens.length === 0) {
      console.log(`[Firebase Admin] No active push tokens for user ${userId}`);
      return { successCount: 0, failureCount: 0 };
    }

    const fcmTokens = tokens.map(t => t.fcm_token);

    console.log(`[Firebase Admin] Sending push to ${fcmTokens.length} device(s) for user ${userId}`);

    // Prepare message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: fcmTokens,
    };

    // Send to all devices
    const app = getFirebaseApp();
    const response = await app.messaging().sendEachForMulticast(message);

    console.log(`[Firebase Admin] Push sent: ${response.successCount} success, ${response.failureCount} failure`);

    // Handle failed tokens (deactivate invalid tokens)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          const fcmToken = fcmTokens[idx];

          // Check if token is invalid
          if (
            error?.code === 'messaging/invalid-registration-token' ||
            error?.code === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(fcmToken);
            console.log(`[Firebase Admin] Invalid token, will deactivate: ${fcmToken.substring(0, 20)}...`);
          } else {
            console.error(`[Firebase Admin] Failed to send to token ${fcmToken.substring(0, 20)}...:`, error);
          }
        }
      });

      // Deactivate invalid tokens
      for (const token of failedTokens) {
        try {
          await pushNotificationTokensDb.deactivateByFcmToken(token);
        } catch (error) {
          console.error(`[Firebase Admin] Failed to deactivate token:`, error);
        }
      }
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error(`[Firebase Admin] Error sending push notification:`, error);
    throw error;
  }
}

/**
 * Send Morning Meeting notification
 * Specialized notification for daily plan generation
 *
 * @param userId - User ID
 * @param planId - Daily plan ID
 * @param dailyBrief - Brief summary of the day (1-2 sentences)
 */
export async function sendMorningMeetingNotification(
  userId: string,
  planId: string,
  dailyBrief: string
): Promise<{ successCount: number; failureCount: number }> {
  return sendPushNotification(userId, {
    title: 'Marcus Morning Meeting',
    body: dailyBrief,
    data: {
      type: 'morning_meeting',
      plan_id: planId,
      action_url: '/morning-meeting',
    },
  });
}

/**
 * Test push notification
 * For development and testing purposes
 *
 * @param userId - User ID
 */
export async function sendTestNotification(userId: string): Promise<{ successCount: number; failureCount: number }> {
  return sendPushNotification(userId, {
    title: 'Test Notification',
    body: 'This is a test notification from SkyRas.',
    data: {
      type: 'test',
    },
  });
}
