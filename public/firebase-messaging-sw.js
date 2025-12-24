/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Note: Config values should be public (NEXT_PUBLIC_* env vars)
firebase.initializeApp({
  apiKey: 'AIzaSyBoZj2pG-7pLnz2cxrNlUCcrPpRM9EgyII',
  authDomain: 'skyras-ai-studio-7ac5c.firebaseapp.com',
  projectId: 'skyras-ai-studio-7ac5c',
  storageBucket: 'skyras-ai-studio-7ac5c.firebasestorage.app',
  messagingSenderId: '599024823912',
  appId: '1:599024823912:web:854698baab00c38c67d5dd',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Marcus Morning Meeting';
  const notificationOptions = {
    body: payload.notification?.body || 'Your daily plan is ready!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'morning-meeting', // Prevents duplicate notifications
    requireInteraction: true, // Notification stays until user interacts
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Plan',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Get action URL from notification data
  const actionUrl = data.action_url || '/morning-meeting';

  if (action === 'view' || !action) {
    // Open the app to the morning meeting page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(actionUrl) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
    );
  }
  // 'dismiss' action just closes the notification (already done above)
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting(); // Activate immediately
});
