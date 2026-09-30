const CACHE_NAME = 'boosthub-pwa-v9';
const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './apple-touch-icon.png',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
          )
        ),
    ])
  );
});

// Network-first fetch with cache fallback for PWA offline support
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response &&
          response.status === 200 &&
          event.request.url.startsWith(self.location.origin) &&
          !event.request.url.includes('/api/')
        ) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        })
      )
  );
});

// Listen for incoming Web Push messages even when BoostHub is closed
self.addEventListener('push', (event) => {
  let payload = {
    title: 'BoostHub',
    body: 'You have a new update on BoostHub!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-192x192.png',
    tag: 'boosthub-notification',
    url: './',
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
    icon: payload.icon || './icons/icon-192x192.png',
    badge: payload.badge || './icons/icon-192x192.png',
    tag: payload.tag || `boosthub-${Date.now()}`,
    renotify: true,
    vibrate: [150, 70, 150],
    data: {
      url: payload.url || './',
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
    (event.notification.data && event.notification.data.url) || './';

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
