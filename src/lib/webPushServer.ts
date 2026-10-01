import * as dotenv from 'dotenv';
import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { pushSubscriptions, profiles } from '../db/schema.ts';
import { supabase } from './supabase.ts';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationBatchFrequency,
  NotificationPreferences,
} from '../types/index.ts';

dotenv.config({ override: true });

const DEFAULT_VAPID_PUBLIC_KEY =
  'BCLWPiFzL_20dC_qTCyZVHb0nYp0sV2tPvCP8yhgRrxZUcfaWJhhtAxZsIcB3NaSB8ebv20905tJRcKzqFevkIk';
const DEFAULT_VAPID_SUBJECT = 'mailto:princeabba96@gmail.com';

function sanitizeVapidSubject(raw?: string): string {
  if (!raw) return DEFAULT_VAPID_SUBJECT;
  // Clean up any brackets, quotes, or whitespace around mailto: <email>
  const emailMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return `mailto:${emailMatch[1]}`;
  }
  const trimmed = raw.replace(/[\[\]"'<>\\,\s]/g, '');
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return DEFAULT_VAPID_SUBJECT;
}

function sanitizeVapidKey(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/[^A-Za-z0-9\-_]/g, '').trim();
}

const vapidSubject = sanitizeVapidSubject(process.env.VAPID_SUBJECT);
const vapidPublicKey =
  sanitizeVapidKey(process.env.VAPID_PUBLIC_KEY) || DEFAULT_VAPID_PUBLIC_KEY;
const vapidPrivateKey = sanitizeVapidKey(process.env.VAPID_PRIVATE_KEY);

let isWebPushConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isWebPushConfigured = true;
  } catch (err) {
    console.error('Failed to initialize Web Push VAPID configuration:', err);
  }
} else {
  console.warn(
    'VAPID_PRIVATE_KEY is not set in server environment variables. Server-initiated Web Push dispatch is disabled until VAPID_PRIVATE_KEY is provided.'
  );
}

export function getPublicVapidKey(): string {
  return vapidPublicKey;
}

export function getWebPushConfigurationState() {
  return {
    configured: isWebPushConfigured,
    subject: vapidSubject,
    publicKey: vapidPublicKey,
  };
}

export async function saveUserPushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  },
  userAgent = ''
) {
  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    throw new Error('Invalid Web Push subscription payload.');
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent.slice(0, 250),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent.slice(0, 250),
      },
    });

  await db
    .update(profiles)
    .set({ notificationsEnabled: true, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  return {
    subscribed: true,
    userId,
    publicKey: vapidPublicKey,
  };
}

export async function removeUserPushSubscription(
  userId: string,
  endpoint?: string
) {
  if (endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  } else {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }
  return { unsubscribed: true };
}

export async function getUserPushSubscriptionStatus(userId: string) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  return {
    subscribed: subs.length > 0,
    deviceCount: subs.length,
    publicKey: vapidPublicKey,
    configured: isWebPushConfigured,
  };
}

function buildServerDeepLinkUrl(
  type?: string,
  entityId?: string,
  actorId?: string,
  explicitUrl?: string
): string {
  if (explicitUrl && explicitUrl !== './' && explicitUrl !== '/') {
    return explicitUrl;
  }
  const cleanType = String(type || 'notification').toLowerCase();
  if (cleanType === 'like' || cleanType === 'share' || cleanType === 'mention') {
    return entityId
      ? `/boosthub/?tab=home&post=${encodeURIComponent(entityId)}`
      : '/boosthub/?tab=notifications';
  }
  if (cleanType === 'comment' || cleanType === 'reply') {
    return entityId
      ? `/boosthub/?tab=home&post=${encodeURIComponent(entityId)}&comments=1`
      : '/boosthub/?tab=notifications';
  }
  if (cleanType === 'follow') {
    const profileId = actorId || entityId || '';
    return profileId
      ? `/boosthub/?tab=me&profile=${encodeURIComponent(profileId)}`
      : '/boosthub/?tab=notifications';
  }
  if (cleanType === 'friend_request' || cleanType === 'friend_accept') {
    return '/boosthub/?tab=friends';
  }
  if (cleanType === 'message' || cleanType === 'boost_bot') {
    const partnerId = actorId || entityId || '';
    return partnerId
      ? `/boosthub/?messages=${encodeURIComponent(partnerId)}`
      : '/boosthub/?tab=friends';
  }
  if (cleanType === 'gift') {
    return '/boosthub/?tab=me&mode=gifts';
  }
  return '/boosthub/?tab=notifications';
}

const recentUserPushWindow = new Map<
  string,
  Array<{
    type: string;
    body: string;
    entityId?: string;
    actorId?: string;
    timestamp: number;
  }>
>();

const userNotificationPrefsStore = new Map<string, NotificationPreferences>();

export function getServerUserNotificationPreferences(
  userId: string
): NotificationPreferences {
  const stored = userNotificationPrefsStore.get(userId);
  if (!stored) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...stored,
  };
}

export function setServerUserNotificationPreferences(
  userId: string,
  partial: Partial<NotificationPreferences>
): NotificationPreferences {
  const current = getServerUserNotificationPreferences(userId);
  const updated: NotificationPreferences = {
    likes: typeof partial.likes === 'boolean' ? partial.likes : current.likes,
    comments:
      typeof partial.comments === 'boolean'
        ? partial.comments
        : current.comments,
    mentions:
      typeof partial.mentions === 'boolean'
        ? partial.mentions
        : current.mentions,
    follows:
      typeof partial.follows === 'boolean' ? partial.follows : current.follows,
    messages:
      typeof partial.messages === 'boolean'
        ? partial.messages
        : current.messages,
    friendRequests:
      typeof partial.friendRequests === 'boolean'
        ? partial.friendRequests
        : current.friendRequests,
    gifts: typeof partial.gifts === 'boolean' ? partial.gifts : current.gifts,
    boostBot:
      typeof partial.boostBot === 'boolean'
        ? partial.boostBot
        : current.boostBot,
    batchingEnabled:
      typeof partial.batchingEnabled === 'boolean'
        ? partial.batchingEnabled
        : current.batchingEnabled,
    batchFrequency:
      partial.batchFrequency === 'instant' ||
      partial.batchFrequency === 'short_1m' ||
      partial.batchFrequency === 'standard_5m' ||
      partial.batchFrequency === 'digest_15m'
        ? partial.batchFrequency
        : current.batchFrequency,
    batchWindowSeconds:
      typeof partial.batchWindowSeconds === 'number'
        ? partial.batchWindowSeconds
        : current.batchWindowSeconds,
  };
  userNotificationPrefsStore.set(userId, updated);
  return updated;
}

function getBatchWindowMsFromPrefs(prefs: NotificationPreferences): number {
  if (!prefs.batchingEnabled || prefs.batchFrequency === 'instant') {
    return 0;
  }
  const freq: NotificationBatchFrequency = prefs.batchFrequency || 'short_1m';
  if (freq === 'short_1m') return 60_000;
  if (freq === 'standard_5m') return 300_000;
  if (freq === 'digest_15m') return 900_000;
  return 60_000;
}

function isServerNotificationTypeAllowed(
  prefs: NotificationPreferences,
  rawType?: string
): boolean {
  const t = String(rawType || 'notification').toLowerCase();
  if (t === 'test') return true;
  if (t === 'like' || t === 'share') return prefs.likes !== false;
  if (t === 'comment' || t === 'reply') return prefs.comments !== false;
  if (t === 'mention') return prefs.mentions !== false;
  if (t === 'follow') return prefs.follows !== false;
  if (t === 'message') return prefs.messages !== false;
  if (t === 'friend_request' || t === 'friend_accept') {
    return prefs.friendRequests !== false;
  }
  if (t === 'gift' || t === 'badge') return prefs.gifts !== false;
  if (t === 'boost_bot') return prefs.boostBot !== false;
  return true;
}

export async function sendPushNotificationToUser(
  targetUserId: string,
  payload: {
    title: string;
    body: string;
    type?: string;
    entityId?: string;
    actorId?: string;
    url?: string;
  }
) {
  if (!isWebPushConfigured) {
    return { sent: 0 };
  }

  try {
    const profRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, targetUserId));
    if (profRows.length > 0 && profRows[0].notificationsEnabled === false) {
      return { sent: 0 };
    }

    const userPrefs = getServerUserNotificationPreferences(targetUserId);
    if (!isServerNotificationTypeAllowed(userPrefs, payload.type)) {
      return { sent: 0, skippedByPreference: true };
    }

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, targetUserId));

    if (subs.length === 0) return { sent: 0 };

    const now = Date.now();
    const isTest = String(payload.type || '').toLowerCase() === 'test';
    const batchWindowMs = getBatchWindowMsFromPrefs(userPrefs);
    const history =
      batchWindowMs > 0
        ? (recentUserPushWindow.get(targetUserId) || []).filter(
            (item) => now - item.timestamp <= batchWindowMs
          )
        : [];

    if (!isTest && batchWindowMs > 0) {
      history.push({
        type: String(payload.type || 'notification').toLowerCase(),
        body: payload.body,
        entityId: payload.entityId,
        actorId: payload.actorId,
        timestamp: now,
      });
      recentUserPushWindow.set(targetUserId, history);
    }

    let finalTitle = payload.title || 'BoostHub';
    let finalBody = payload.body;
    let finalType = payload.type || 'notification';
    let finalEntityId = payload.entityId || '';
    let finalActorId = payload.actorId || '';
    let finalTag = `boosthub-${payload.type || 'notif'}-${now}`;
    let targetUrl = buildServerDeepLinkUrl(
      payload.type,
      payload.entityId,
      payload.actorId,
      payload.url
    );

    if (!isTest && batchWindowMs > 0 && history.length > 1) {
      let likes = 0;
      let comments = 0;
      let mentions = 0;
      let follows = 0;
      let messages = 0;
      let others = 0;
      for (const h of history) {
        if (h.type === 'like') likes++;
        else if (h.type === 'comment' || h.type === 'reply') comments++;
        else if (h.type === 'mention') mentions++;
        else if (h.type === 'follow') follows++;
        else if (h.type === 'message' || h.type === 'boost_bot') messages++;
        else others++;
      }
      const total = history.length;
      if (likes === total) {
        finalBody = `You have ${total} new likes on your posts`;
      } else if (comments === total) {
        finalBody = `You have ${total} new comments on your posts`;
      } else if (mentions === total) {
        finalBody = `You were mentioned ${total} times`;
      } else if (follows === total) {
        finalBody = `You have ${total} new followers`;
      } else if (messages === total) {
        finalBody = `You received ${total} new messages`;
        targetUrl = '/boosthub/?tab=friends';
      } else {
        const parts: string[] = [];
        if (likes > 0) parts.push(`${likes} ${likes === 1 ? 'like' : 'likes'}`);
        if (comments > 0) {
          parts.push(`${comments} ${comments === 1 ? 'comment' : 'comments'}`);
        }
        if (mentions > 0) {
          parts.push(`${mentions} ${mentions === 1 ? 'mention' : 'mentions'}`);
        }
        if (follows > 0) {
          parts.push(
            `${follows} new ${follows === 1 ? 'follower' : 'followers'}`
          );
        }
        if (messages > 0) {
          parts.push(`${messages} ${messages === 1 ? 'message' : 'messages'}`);
        }
        if (others > 0) parts.push(`${others} other`);
        finalBody = `You have ${total} new updates: ${parts.join(', ')}`;
        targetUrl = '/boosthub/?tab=notifications';
      }
      finalTitle = 'BoostHub';
      finalType = 'summary';
      finalTag = `boosthub-summary-${targetUserId}`;
    }

    const message = JSON.stringify({
      title: finalTitle,
      body: finalBody,
      icon: '/boosthub/icons/icon-192x192.png',
      badge: '/boosthub/icons/icon-192x192.png',
      type: finalType,
      entityId: finalEntityId,
      actorId: finalActorId,
      tag: finalTag,
      url: targetUrl,
    });

    let sentCount = 0;
    for (const sub of subs) {
      if (sub.endpoint.startsWith('https://push.boosthub.app/device/')) {
        continue;
      }
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          message
        );
        sentCount++;
      } catch (err: any) {
        // Remove expired, mismatched-VAPID, or revoked push endpoints (401 / 403 / 404 / 410)
        if (
          err?.statusCode === 401 ||
          err?.statusCode === 403 ||
          err?.statusCode === 404 ||
          err?.statusCode === 410
        ) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    return { sent: sentCount };
  } catch (err) {
    console.warn('Could not dispatch Web Push notification:', err);
    return { sent: 0 };
  }
}

const processedSupabaseNotifIds = new Set<string>();
let bridgeStarted = false;

export async function dispatchSupabaseNotificationToWebPush(row: any) {
  if (!isWebPushConfigured || !row || !row.id) return { sent: 0 };
  const rowId = String(row.id);
  if (processedSupabaseNotifIds.has(rowId)) return { sent: 0 };
  processedSupabaseNotifIds.add(rowId);

  if (row.type === 'gift_tx' || row.type === 'test_rt') {
    return { sent: 0 };
  }

  try {
    const { data: allSubs } = await supabase
      .from('push_subscriptions')
      .select('*');
    const subsList = allSubs || [];
    if (subsList.length === 0) return { sent: 0 };

    const targetUid = String(row.target_user || '');
    const matchingSubs = subsList.filter((s: any) => {
      const uid = String(s.user_id || s.subscription?.userId || '');
      return uid === targetUid;
    });

    const effectiveSubs = matchingSubs.length > 0 ? matchingSubs : subsList;
    const notifType = String(row.type || 'notification').toLowerCase();
    const targetUrl = buildServerDeepLinkUrl(
      notifType,
      row.post_id ? String(row.post_id) : undefined,
      row.actor_user ? String(row.actor_user) : undefined
    );

    const payloadStr = JSON.stringify({
      title: row.title || 'BoostHub',
      body: row.body || 'You have a new notification on BoostHub',
      icon: '/boosthub/icons/icon-192x192.png',
      badge: '/boosthub/icons/icon-192x192.png',
      type: notifType,
      entityId: String(row.post_id || row.actor_user || ''),
      actorId: String(row.actor_user || ''),
      tag: `boosthub-notif-${rowId}`,
      url: targetUrl,
    });

    let sent = 0;
    for (const s of effectiveSubs) {
      const endpoint = String(s.endpoint || s.subscription?.endpoint || '');
      const p256dh = String(s.p256dh || s.subscription?.keys?.p256dh || '');
      const auth = String(s.auth || s.subscription?.keys?.auth || '');
      if (!endpoint || !p256dh || !auth) continue;

      try {
        await webpush.sendNotification(
          {
            endpoint,
            keys: { p256dh, auth },
          },
          payloadStr
        );
        sent++;
      } catch (err: any) {
        if (
          err?.statusCode === 401 ||
          err?.statusCode === 403 ||
          err?.statusCode === 404 ||
          err?.statusCode === 410
        ) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id);
        }
      }
    }

    return { sent };
  } catch {
    return { sent: 0 };
  }
}

export function startSupabaseRealtimePushBridge() {
  if (bridgeStarted || !isWebPushConfigured) return;
  bridgeStarted = true;

  const startIso = new Date(Date.now() - 5000).toISOString();

  supabase
    .from('notifications')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(50)
    .then(({ data }) => {
      (data || []).forEach((n: any) => {
        if (n?.id) processedSupabaseNotifIds.add(String(n.id));
      });
    });

  supabase
    .channel('server-supabase-push-bridge')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        if (payload?.new) {
          dispatchSupabaseNotificationToWebPush(payload.new).catch(() => {});
        }
      }
    )
    .subscribe();

  setInterval(async () => {
    try {
      const { data: recent } = await supabase
        .from('notifications')
        .select('*')
        .gt('created_at', startIso)
        .order('created_at', { ascending: false })
        .limit(10);
      for (const r of recent || []) {
        if (r?.id && !processedSupabaseNotifIds.has(String(r.id))) {
          await dispatchSupabaseNotificationToWebPush(r);
        }
      }
    } catch {
      // ignore transient network errors
    }
  }, 4000);
}
