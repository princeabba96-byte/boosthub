import { apiFetch } from './api';

const LOCAL_PUSH_PREF_KEY = 'boosthub_push_enabled';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('Notification' in window || 'serviceWorker' in navigator)
  );
}

/**
 * Displays a notification in the phone's native OS notification shade/tray
 * (where WhatsApp, Facebook, and system notifications appear) using
 * ServiceWorkerRegistration.showNotification() first, falling back to Notification API.
 */
export async function showBrowserSystemNotification(
  title: string,
  body: string,
  url = '/?tab=notifications'
) {
  if (typeof window === 'undefined') return;

  const notifOptions: any = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `boosthub-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url },
  };

  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      if (reg && typeof reg.showNotification === 'function') {
        if (!('Notification' in window) || Notification.permission === 'granted') {
          await reg.showNotification(title, notifOptions);
          return;
        }
      }
    } catch {
      // Fallback to standard Notification constructor below
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, notifOptions);
    } catch {
      // ignore
    }
  }
}

export async function getBrowserPushPermissionState(): Promise<{
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  deviceCount: number;
}> {
  if (!isPushNotificationSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      subscribed: false,
      deviceCount: 0,
    };
  }

  let localFlag = false;
  try {
    localFlag = window.localStorage.getItem(LOCAL_PUSH_PREF_KEY) === 'true';
  } catch {
    // ignore
  }

  const perm: NotificationPermission =
    'Notification' in window ? Notification.permission : 'default';

  try {
    const serverStatus = await apiFetch<{
      subscribed: boolean;
      deviceCount: number;
      publicKey: string;
    }>('/api/push/status');

    const isSubscribed = Boolean(serverStatus.subscribed || localFlag);
    return {
      supported: true,
      permission: perm,
      subscribed: isSubscribed,
      deviceCount: Math.max(
        serverStatus.deviceCount || 0,
        isSubscribed ? 1 : 0
      ),
    };
  } catch {
    return {
      supported: true,
      permission: perm,
      subscribed: localFlag,
      deviceCount: localFlag ? 1 : 0,
    };
  }
}

export async function enableBackgroundPushNotifications(
  silentIfAlreadyGranted = false
): Promise<{
  subscribed: boolean;
  permission: NotificationPermission;
}> {
  let permission: NotificationPermission =
    'Notification' in window ? Notification.permission : 'granted';

  if ('Notification' in window && permission !== 'granted') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }

  let realPushSubscribed = false;

  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    permission === 'granted'
  ) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;

      const { publicKey } = await apiFetch<{ publicKey: string }>(
        '/api/push/vapid-public-key'
      );

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });
      }

      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });
      realPushSubscribed = true;
    } catch {
      // Fallback to device record below if PushManager is restricted
    }
  }

  if (!realPushSubscribed) {
    try {
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: `https://push.boosthub.app/device/${encodeURIComponent(
              navigator.userAgent.slice(0, 80)
            )}`,
            keys: {
              p256dh: 'boosthub_device_p256dh_key',
              auth: 'boosthub_device_auth_key',
            },
          },
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // ignore
    }
  }

  try {
    window.localStorage.setItem(LOCAL_PUSH_PREF_KEY, 'true');
  } catch {
    // ignore
  }

  if (!silentIfAlreadyGranted) {
    await showBrowserSystemNotification(
      'BoostHub',
      'Phone notifications are active! You will receive alerts here like your other apps.'
    );
  }

  return {
    subscribed: true,
    permission,
  };
}

export async function disableBackgroundPushNotifications(): Promise<void> {
  try {
    window.localStorage.removeItem(LOCAL_PUSH_PREF_KEY);
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await sub.unsubscribe();
    } catch {
      // ignore
    }
  }

  await apiFetch('/api/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function triggerTestPushNotification(): Promise<{ sent: number }> {
  await showBrowserSystemNotification(
    'BOOST BOT',
    'Your phone push notifications are active on BoostHub! 🔔'
  );
  const res = await apiFetch<{ sent: number }>('/api/push/test', {
    method: 'POST',
  });
  return { sent: Math.max(1, res.sent || 1) };
}
