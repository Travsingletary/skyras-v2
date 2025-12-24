/**
 * Firebase Client SDK for browser push notifications
 * Handles requesting permission, registering tokens, and receiving messages
 */

'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Get Firebase configuration from environment variables
 */
function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * Initialize Firebase client app
 */
function initializeFirebase(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  const config = getFirebaseConfig();

  // Validate config
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      'Missing Firebase configuration. Please set NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }

  firebaseApp = initializeApp(config);
  console.log('[Firebase Client] Initialized');

  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 * Only works in browser environment with service worker
 */
function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (messaging) {
    return messaging;
  }

  try {
    const app = initializeFirebase();
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('[Firebase Client] Failed to get messaging instance:', error);
    return null;
  }
}

/**
 * Request notification permission and register FCM token
 * Returns FCM token if successful
 *
 * @param userId - User ID to register token for
 * @returns FCM token or null if permission denied
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.warn('[Firebase Client] Cannot request permission on server side');
    return null;
  }

  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('[Firebase Client] Browser does not support notifications');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('[Firebase Client] Notification permission denied');
      return null;
    }

    console.log('[Firebase Client] Notification permission granted');

    // Get FCM token
    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) {
      throw new Error('Failed to get messaging instance');
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set');
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(),
    });

    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    console.log('[Firebase Client] FCM token obtained:', token.substring(0, 20) + '...');

    // Register token with backend
    await registerTokenWithBackend(userId, token);

    return token;
  } catch (error) {
    console.error('[Firebase Client] Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 *
 * @param userId - User ID
 * @param fcmToken - FCM token
 */
async function registerTokenWithBackend(userId: string, fcmToken: string): Promise<void> {
  try {
    const response = await fetch('/api/push/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        fcmToken,
        deviceType: 'web',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to register token');
    }

    console.log('[Firebase Client] Token registered with backend');
  } catch (error) {
    console.error('[Firebase Client] Failed to register token with backend:', error);
    throw error;
  }
}

/**
 * Setup foreground message listener
 * Handles push notifications when app is open
 *
 * @param onMessageReceived - Callback when message is received
 */
export function setupForegroundMessageListener(
  onMessageReceived: (payload: any) => void
): (() => void) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    console.warn('[Firebase Client] Cannot setup message listener');
    return null;
  }

  console.log('[Firebase Client] Setting up foreground message listener');

  const unsubscribe = onMessage(messagingInstance, (payload) => {
    console.log('[Firebase Client] Message received:', payload);

    // Show browser notification
    if (payload.notification) {
      const { title, body } = payload.notification;

      new Notification(title || 'Notification', {
        body: body || '',
        icon: '/icon-192x192.png', // Your app icon
        data: payload.data,
      });
    }

    // Call user callback
    onMessageReceived(payload);
  });

  return unsubscribe;
}

/**
 * Check if notifications are supported and permission is granted
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return Notification.permission;
}

/**
 * Initialize Firebase and service worker
 * Should be called on app startup
 */
export async function initializeFirebaseMessaging(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isNotificationSupported()) {
    console.warn('[Firebase Client] Notifications not supported in this browser');
    return;
  }

  try {
    // Initialize Firebase
    initializeFirebase();

    // Register service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[Firebase Client] Service worker registered:', registration.scope);
    }
  } catch (error) {
    console.error('[Firebase Client] Failed to initialize:', error);
  }
}
