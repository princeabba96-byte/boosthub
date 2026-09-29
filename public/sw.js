self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear any stale caches from older service worker versions so they never block page loads
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
    ])
  );
});

// Listen for incoming Web Push messages even when the BoostHub tab/app is closed
self.addEventListener('push', (event) => {
  let payload = {
    title: 'BoostHub',
    body: 'You have a new update on BoostHub!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'boosthub-notification',
    url: '/',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    tag: payload.tag || `boosthub-${Date.now()}`,
    renotify: true,
    vibrate: [150, 70, 150],
    data: {
      url: payload.url || '/',
      type: payload.type || 'general',
      entityId: payload.entityId || '',
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Open or focus BoostHub when the user taps a push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'PUSH_NOTIFICATION_CLICK',
              data: event.notification.data,
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
