import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { pushSubscriptions, profiles } from '../db/schema.ts';

interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
}

const VAPID_FILE_PATH = path.join(process.cwd(), '.vapid-keys.json');

function getOrGenerateVapidKeys(): VapidKeyPair {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  try {
    if (fs.existsSync(VAPID_FILE_PATH)) {
      const raw = fs.readFileSync(VAPID_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.publicKey && parsed?.privateKey) {
        return parsed;
      }
    }
  } catch {
    // regenerate below
  }

  const generated = webpush.generateVAPIDKeys();
  try {
    fs.writeFileSync(VAPID_FILE_PATH, JSON.stringify(generated, null, 2), 'utf-8');
  } catch {
    // ignore read-only fs
  }
  return generated;
}

const vapidKeys = getOrGenerateVapidKeys();

webpush.setVapidDetails(
  'mailto:princeabba96@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export function getPublicVapidKey(): string {
  return vapidKeys.publicKey;
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

  return { subscribed: true };
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
    publicKey: vapidKeys.publicKey,
  };
}

export async function sendPushNotificationToUser(
  targetUserId: string,
  payload: {
    title: string;
    body: string;
    type?: string;
    entityId?: string;
    url?: string;
  }
) {
  try {
    const profRows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, targetUserId));
    if (profRows.length > 0 && profRows[0].notificationsEnabled === false) {
      return { sent: 0 };
    }

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, targetUserId));

    if (subs.length === 0) return { sent: 0 };

    const message = JSON.stringify({
      title: payload.title || 'BoostHub',
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      type: payload.type || 'notification',
      entityId: payload.entityId || '',
      tag: `boosthub-${payload.type || 'notif'}-${Date.now()}`,
      url: payload.url || '/',
    });

    let sentCount = 0;
    for (const sub of subs) {
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
        // Remove expired or revoked push endpoints (404 / 410 Gone)
        if (err?.statusCode === 404 || err?.statusCode === 410) {
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
