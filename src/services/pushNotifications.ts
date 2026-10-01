import { apiFetch, getCachedProfile } from './api';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationBatchFrequency,
  NotificationPreferences,
} from '../types';
import {
  isSupabaseConfigured,
  upsertSupabasePushSubscription,
  deleteSupabasePushSubscription,
  getSupabasePushSubscriptionsForUser,
  invokeSupabaseSendPushEdgeFunction,
} from '../lib/supabasePush';

const NOTIF_PREFS_STORAGE_PREFIX = 'boosthub_notif_prefs_v1_';

export function resolveBatchWindowSeconds(
  frequency: NotificationBatchFrequency,
  batchingEnabled = true
): number {
  if (!batchingEnabled || frequency === 'instant') return 0;
  if (frequency === 'short_1m') return 60;
  if (frequency === 'standard_5m') return 300;
  if (frequency === 'digest_15m') return 900;
  return 60;
}

export function normalizeNotificationPreferences(
  raw?: Partial<NotificationPreferences> | null
): NotificationPreferences {
  const merged: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(raw || {}),
  };
  merged.batchWindowSeconds = resolveBatchWindowSeconds(
    merged.batchFrequency,
    merged.batchingEnabled
  );
  return merged;
}

export function getUserNotificationPreferences(
  userId?: string
): NotificationPreferences {
  const uid = userId || getCachedProfile()?.id || 'default';
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(
        `${NOTIF_PREFS_STORAGE_PREFIX}${uid}`
      );
      if (stored) {
        return normalizeNotificationPreferences(JSON.parse(stored));
      }
    } catch {
      // ignore storage errors
    }
  }
  const cachedPrefs = getCachedProfile()?.notificationPreferences;
  return normalizeNotificationPreferences(cachedPrefs);
}

export function setLocalNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
  userId?: string
): NotificationPreferences {
  const uid = userId || getCachedProfile()?.id || 'default';
  const current = getUserNotificationPreferences(uid);
  const updated = normalizeNotificationPreferences({
    ...current,
    ...prefs,
  });
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `${NOTIF_PREFS_STORAGE_PREFIX}${uid}`,
        JSON.stringify(updated)
      );
    } catch {
      // ignore
    }
  }
  return updated;
}

export const saveUserNotificationPreferences = setLocalNotificationPreferences;

export function isNotificationTypeAllowed(
  type: string | undefined,
  prefs: NotificationPreferences
): boolean {
  const clean = String(type || 'notification').toLowerCase();
  if (clean === 'test') return true;
  if (clean === 'like' || clean === 'share') return prefs.likes !== false;
  if (clean === 'comment' || clean === 'reply') return prefs.comments !== false;
  if (clean === 'mention') return prefs.mentions !== false;
  if (clean === 'follow') return prefs.follows !== false;
  if (clean === 'message') return prefs.messages !== false;
  if (clean === 'friend_request' || clean === 'friend_accept') {
    return prefs.friendRequests !== false;
  }
  if (clean === 'gift' || clean === 'badge') return prefs.gifts !== false;
  if (clean === 'boost_bot') return prefs.boostBot !== false;
  return true;
}

export const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY) ||
  'BCLWPiFzL_20dC_qTCyZVHb0nYp0sV2tPvCP8yhgRrxZUcfaWJhhtAxZsIcB3NaSB8ebv20905tJRcKzqFevkIk';

function sanitizePublicKey(raw?: string): string {
  const cleaned = String(raw || '')
    .replace(/[^A-Za-z0-9\-_]/g, '')
    .trim();
  return cleaned || VAPID_PUBLIC_KEY;
}

export function getServiceWorkerScope(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.startsWith('/boosthub') ? '/boosthub/' : '/';
}

export function getServiceWorkerScriptUrl(): string {
  return `${getServiceWorkerScope()}sw.js`;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const clean = sanitizePublicKey(base64String);
  const padding = '='.repeat((4 - (clean.length % 4)) % 4);
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function areApplicationServerKeysEqual(
  existingBuffer: ArrayBuffer | null | undefined,
  expectedArray: Uint8Array
): boolean {
  if (!existingBuffer) return false;
  const existingBytes = new Uint8Array(existingBuffer);
  if (existingBytes.length !== expectedArray.length) return false;
  for (let i = 0; i < existingBytes.length; i++) {
    if (existingBytes[i] !== expectedArray[i]) return false;
  }
  return true;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  const scope = getServiceWorkerScope();
  const swUrl = getServiceWorkerScriptUrl();

  let reg =
    (await navigator.serviceWorker.getRegistration(scope)) ||
    (await navigator.serviceWorker.getRegistration());

  if (!reg) {
    reg = await navigator.serviceWorker.register(swUrl, { scope });
  }
  await navigator.serviceWorker.ready;
  return reg;
}

/**
 * Displays a notification in the phone's native OS notification shade/tray
 * using ServiceWorkerRegistration.showNotification() when permission is granted.
 */
export async function showBrowserSystemNotification(
  title: string,
  body: string,
  url = '?tab=notifications'
) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const scope = getServiceWorkerScope();
  const resolvedUrl = url.startsWith('http')
    ? url
    : url.startsWith('/boosthub/')
      ? url
      : `${scope}${url.replace(/^(\.\/|\/)/, '')}`;

  const notifOptions: any = {
    body,
    icon: `${scope}icons/icon-192x192.png`,
    badge: `${scope}icons/icon-192x192.png`,
    tag: `boosthub-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: resolvedUrl },
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await ensureServiceWorkerRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch {
      // Fallback to standard Notification constructor below
    }
  }

  try {
    new Notification(title, notifOptions);
  } catch {
    // ignore
  }
}

export async function getBrowserPushPermissionState(): Promise<{
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  deviceCount: number;
  publicKey?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      subscribed: false,
      deviceCount: 0,
      publicKey: VAPID_PUBLIC_KEY,
    };
  }

  const perm: NotificationPermission = Notification.permission;
  if (perm !== 'granted') {
    return {
      supported: true,
      permission: perm,
      subscribed: false,
      deviceCount: 0,
      publicKey: VAPID_PUBLIC_KEY,
    };
  }

  let browserSub: PushSubscription | null = null;
  try {
    const scope = getServiceWorkerScope();
    const reg =
      (await navigator.serviceWorker.getRegistration(scope)) ||
      (await navigator.serviceWorker.getRegistration());
    if (reg) {
      browserSub = await reg.pushManager.getSubscription();
    }
  } catch {
    browserSub = null;
  }

  const currentUserId = getCachedProfile()?.id || '';

  // 1. Check Supabase push_subscriptions table if configured
  if (isSupabaseConfigured() && currentUserId) {
    try {
      const rows = await getSupabasePushSubscriptionsForUser(currentUserId);
      const hasMatchingBrowserSub = Boolean(
        browserSub && rows.some((r) => r.endpoint === browserSub?.endpoint)
      );
      const isSubscribed = Boolean(browserSub && (hasMatchingBrowserSub || rows.length > 0));
      return {
        supported: true,
        permission: perm,
        subscribed: isSubscribed,
        deviceCount: rows.length || (browserSub ? 1 : 0),
        publicKey: VAPID_PUBLIC_KEY,
      };
    } catch {
      // Fall through to backend API check
    }
  }

  // 2. Check backend /api/push/status
  try {
    const serverStatus = await apiFetch<{
      subscribed: boolean;
      deviceCount: number;
      publicKey?: string;
    }>('/api/push/status');

    const isSubscribed = Boolean(browserSub && serverStatus?.subscribed);
    return {
      supported: true,
      permission: perm,
      subscribed: isSubscribed,
      deviceCount: isSubscribed ? Math.max(serverStatus?.deviceCount || 1, 1) : 0,
      publicKey: sanitizePublicKey(serverStatus?.publicKey),
    };
  } catch {
    return {
      supported: true,
      permission: perm,
      subscribed: Boolean(browserSub),
      deviceCount: browserSub ? 1 : 0,
      publicKey: VAPID_PUBLIC_KEY,
    };
  }
}

export async function enableBackgroundPushNotifications(
  silentIfAlreadyGranted = false
): Promise<{
  subscribed: boolean;
  permission: NotificationPermission;
}> {
  if (!isPushNotificationSupported()) {
    throw new Error(
      'Web Push notifications are not supported in this browser.'
    );
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    throw new Error(
      'Notification permission was not granted. Please allow notifications in your browser settings.'
    );
  }

  const registration = await ensureServiceWorkerRegistration();
  if (!registration || !registration.pushManager) {
    throw new Error(
      'Service Worker PushManager is unavailable on this page.'
    );
  }

  let publicKey = VAPID_PUBLIC_KEY;
  try {
    const keyRes = await apiFetch<{ publicKey?: string }>(
      '/api/push/vapid-public-key'
    );
    publicKey = sanitizePublicKey(keyRes?.publicKey);
  } catch {
    publicKey = VAPID_PUBLIC_KEY;
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  let subscription = await registration.pushManager.getSubscription();

  // If an existing subscription uses an old/mismatched VAPID key, unsubscribe and create a fresh one
  if (
    subscription &&
    !areApplicationServerKeysEqual(
      subscription.options?.applicationServerKey,
      applicationServerKey
    )
  ) {
    try {
      await subscription.unsubscribe();
    } catch {
      // ignore
    }
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });
  }

  const subJson = subscription.toJSON();
  if (!subJson?.endpoint || !subJson?.keys?.p256dh || !subJson?.keys?.auth) {
    throw new Error(
      'Browser returned an incomplete PushSubscription without encryption keys.'
    );
  }

  const currentUserId = getCachedProfile()?.id || '';

  // Save to Supabase push_subscriptions table if configured
  if (isSupabaseConfigured() && currentUserId) {
    await upsertSupabasePushSubscription(
      currentUserId,
      {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      },
      navigator.userAgent
    );
  }

  // Also save via backend API (/api/push/subscribe)
  await apiFetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      subscription: subJson,
      userAgent: navigator.userAgent,
    }),
  });

  if (!silentIfAlreadyGranted) {
    await showBrowserSystemNotification(
      'BoostHub',
      'Real Web Push notifications are enabled for your account!'
    );
  }

  return {
    subscribed: true,
    permission,
  };
}

export async function disableBackgroundPushNotifications(): Promise<void> {
  let endpoint: string | undefined;

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const scope = getServiceWorkerScope();
      const reg =
        (await navigator.serviceWorker.getRegistration(scope)) ||
        (await navigator.serviceWorker.getRegistration());
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        endpoint = sub.endpoint;
        await sub.unsubscribe();
      }
    } catch {
      // ignore
    }
  }

  const currentUserId = getCachedProfile()?.id || '';
  if (isSupabaseConfigured() && currentUserId) {
    await deleteSupabasePushSubscription(currentUserId, endpoint).catch(
      () => {}
    );
  }

  await apiFetch('/api/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
}

/**
 * Sends a real Web Push notification to a target user (or 'all' users) via the
 * Supabase Edge Function (`send-push`) when configured, or via `/api/push/*`.
 */
export async function dispatchRealPushNotification(payload: {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  type?: string;
  entityId?: string;
  actorId?: string;
  url?: string;
  batchWindowSeconds?: number;
  notificationPreferences?: Partial<NotificationPreferences>;
}): Promise<{ sent: number }> {
  const targetUid = payload.userId && payload.userId !== 'all' ? payload.userId : undefined;
  const prefs = payload.notificationPreferences
    ? normalizeNotificationPreferences(payload.notificationPreferences)
    : getUserNotificationPreferences(targetUid);

  if (!isNotificationTypeAllowed(payload.type, prefs)) {
    return { sent: 0 };
  }

  const effectiveBatchWindow =
    typeof payload.batchWindowSeconds === 'number'
      ? payload.batchWindowSeconds
      : prefs.batchWindowSeconds;

  const scope = getServiceWorkerScope();
  const normalizedUrl = payload.url
    ? payload.url.startsWith('http') || payload.url.startsWith('/boosthub/')
      ? payload.url
      : `${scope}${payload.url.replace(/^(\.\/|\/)/, '')}`
    : `${scope}?tab=notifications`;

  if (isSupabaseConfigured()) {
    try {
      const edgeRes = await invokeSupabaseSendPushEdgeFunction({
        ...payload,
        url: normalizedUrl,
        batchWindowSeconds: effectiveBatchWindow,
        batchingEnabled: prefs.batchingEnabled && effectiveBatchWindow > 0,
        notificationPreferences: prefs,
      });
      if (edgeRes.configured) {
        return { sent: edgeRes.sent };
      }
    } catch (err) {
      console.warn('Supabase send-push Edge Function error:', err);
    }
  }

  return { sent: 0 };
}

export async function triggerTestPushNotification(): Promise<{ sent: number }> {
  const state = await getBrowserPushPermissionState();
  if (!state.subscribed) {
    throw new Error(
      'Push notifications are not enabled on this device yet. Click "Enable on This Device" first.'
    );
  }

  const currentUserId = getCachedProfile()?.id || '';
  const scope = getServiceWorkerScope();

  let currentSubJson: any = null;
  try {
    const reg = await ensureServiceWorkerRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) currentSubJson = sub.toJSON();
  } catch {
    // ignore
  }

  if (isSupabaseConfigured() && currentUserId) {
    const edgeRes = await invokeSupabaseSendPushEdgeFunction({
      userId: currentUserId,
      title: 'BOOST BOT',
      body: 'Your real Web Push notifications are connected and active on BoostHub!',
      type: 'test',
      url: `${scope}?tab=notifications`,
      subscription: currentSubJson,
    });
    if (edgeRes.sent > 0) {
      return { sent: edgeRes.sent };
    }
  }

  const res = await apiFetch<{ sent: number }>('/api/push/test', {
    method: 'POST',
  });
  return { sent: Number(res?.sent || 0) };
}
