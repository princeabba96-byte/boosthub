const CACHE_NAME = 'boosthub-pwa-v27';

function getBasePath() {
  try {
    if (self.registration && self.registration.scope) {
      const scopePath = new URL(self.registration.scope).pathname;
      return scopePath.endsWith('/') ? scopePath : scopePath + '/';
    }
  } catch (e) {}
  return self.location.pathname.startsWith('/boosthub') ? '/boosthub/' : '/';
}

function resolveScopedUrl(rawUrl) {
  const basePath = getBasePath();
  if (!rawUrl || rawUrl === './' || rawUrl === '/') {
    return basePath;
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  if (rawUrl.startsWith('/boosthub/')) {
    return basePath === '/boosthub/'
      ? rawUrl
      : rawUrl.replace(/^\/boosthub\//, basePath);
  }
  if (rawUrl.startsWith('./')) {
    return basePath + rawUrl.slice(2);
  }
  if (rawUrl.startsWith('/')) {
    return basePath + rawUrl.slice(1);
  }
  return basePath + rawUrl;
}

function buildTargetUrlFromData(data) {
  const basePath = getBasePath();
  if (!data) return basePath + '?tab=notifications';

  if (data.url && data.url !== './' && data.url !== '/') {
    return resolveScopedUrl(data.url);
  }

  const type = String(data.type || '').toLowerCase();
  const entityId = String(data.entityId || '');
  const actorId = String(data.actorId || '');

  if (type === 'like' || type === 'share') {
    return entityId
      ? `${basePath}?tab=home&post=${encodeURIComponent(entityId)}`
      : `${basePath}?tab=notifications`;
  }
  if (type === 'comment' || type === 'reply' || type === 'mention') {
    return entityId
      ? `${basePath}?tab=home&post=${encodeURIComponent(entityId)}&comments=1`
      : `${basePath}?tab=notifications`;
  }
  if (type === 'follow') {
    const profileId = actorId || entityId;
    return profileId
      ? `${basePath}?tab=me&profile=${encodeURIComponent(profileId)}`
      : `${basePath}?tab=notifications`;
  }
  if (type === 'friend_request' || type === 'friend_accept') {
    return `${basePath}?tab=friends`;
  }
  if (type === 'message' || type === 'boost_bot') {
    const partnerId = actorId || entityId;
    return partnerId
      ? `${basePath}?messages=${encodeURIComponent(partnerId)}`
      : `${basePath}?tab=friends`;
  }
  if (type === 'gift') {
    return `${basePath}?tab=me&mode=gifts`;
  }
  return `${basePath}?tab=notifications`;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  const basePath = getBasePath();
  const appShellUrls = [
    basePath,
    basePath + 'index.html',
    basePath + 'manifest.json',
    basePath + 'icons/icon-192x192.png',
    basePath + 'icons/icon-512x512.png',
    basePath + 'apple-touch-icon.png',
    basePath + 'icon.svg',
  ];
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(appShellUrls))
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
  if (!event.request.url.startsWith(self.location.origin)) return;
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
            const basePath = getBasePath();
            return (
              caches.match(basePath + 'index.html') ||
              caches.match('./index.html')
            );
          }
          return undefined;
        })
      )
  );
});

// Listen for incoming Web Push messages even when BoostHub is completely closed
self.addEventListener('push', (event) => {
  const basePath = getBasePath();
  let payload = {
    title: 'BoostHub',
    body: 'You have a new notification on BoostHub',
    icon: basePath + 'icons/icon-192x192.png',
    badge: basePath + 'icons/icon-192x192.png',
    tag: 'boosthub-notification',
    type: 'notification',
    entityId: '',
    actorId: '',
    url: '',
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

  const targetUrl = buildTargetUrlFromData(payload);

  const options = {
    body: payload.body,
    icon: resolveScopedUrl(payload.icon || basePath + 'icons/icon-192x192.png'),
    badge: resolveScopedUrl(
      payload.badge || basePath + 'icons/icon-192x192.png'
    ),
    tag: payload.tag || `boosthub-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open BoostHub',
      },
    ],
    data: {
      url: targetUrl,
      type: payload.type || 'notification',
      entityId: payload.entityId || '',
      actorId: payload.actorId || '',
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'BoostHub', options)
  );
});

// Open or focus BoostHub when the user taps a push notification and navigate to the post/profile/message/notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = buildTargetUrlFromData(data);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'PUSH_NOTIFICATION_CLICK',
              data: {
                ...data,
                url: targetUrl,
              },
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
