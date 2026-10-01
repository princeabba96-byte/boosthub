import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_BATCH_WINDOW_SECONDS = 60;

interface PendingPushEvent {
  id?: number | string;
  source: 'notification' | 'message' | 'direct';
  userId: string;
  actorId?: string;
  actorName?: string;
  type: string;
  title?: string;
  body?: string;
  entityId?: string;
  url?: string;
  isVideo?: boolean;
}

function sanitizeVapidSubject(raw?: string | null): string {
  if (!raw) return 'mailto:princeabba96@gmail.com';
  const emailMatch = raw.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );
  if (emailMatch) {
    return `mailto:${emailMatch[1]}`;
  }
  const trimmed = raw.replace(/[\[\]"'<>\\,\s]/g, '');
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return 'mailto:princeabba96@gmail.com';
}

function sanitizeVapidKey(raw?: string | null): string {
  if (!raw) return '';
  return raw.replace(/[^A-Za-z0-9\-_]/g, '').trim();
}

function buildDeepLinkUrl(
  type?: string,
  entityId?: string,
  actorId?: string,
  explicitUrl?: string
): string {
  if (explicitUrl && explicitUrl.trim()) {
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

function formatFacebookStyleNotification(item: {
  type?: string;
  title?: string;
  body?: string;
  actorName?: string;
  isVideo?: boolean;
}): { title: string; body: string } {
  const actor = item.actorName || 'Someone';
  const type = String(item.type || '').toLowerCase();

  if (item.body && item.title && item.title !== 'BoostHub') {
    return { title: item.title, body: item.body };
  }

  switch (type) {
    case 'like':
      return {
        title: 'BoostHub',
        body: item.body || `${actor} liked your post`,
      };
    case 'comment':
    case 'reply':
      return {
        title: 'BoostHub',
        body:
          item.body ||
          `${actor} commented on your ${item.isVideo ? 'video' : 'post'}`,
      };
    case 'follow':
      return {
        title: 'BoostHub',
        body:
          item.body ||
          (item.actorName
            ? `${actor} started following you`
            : 'You have a new follower'),
      };
    case 'message':
      return {
        title: 'BoostHub',
        body:
          item.body ||
          (item.actorName
            ? `${actor} sent you a message`
            : 'You received a new message'),
      };
    case 'friend_request':
      return {
        title: 'BoostHub',
        body: item.body || `${actor} sent you a friend request`,
      };
    case 'friend_accept':
      return {
        title: 'BoostHub',
        body: item.body || `${actor} accepted your friend request`,
      };
    case 'mention':
      return {
        title: 'BoostHub',
        body: item.body || `${actor} mentioned you in a post`,
      };
    default:
      return {
        title: item.title || 'BoostHub',
        body: item.body || 'You have a new notification on BoostHub',
      };
  }
}

/**
 * Batches 1 or more pending notification events for a single user into either:
 * - A single specific Facebook-style notification (if count === 1)
 * - A single summary push notification (if count > 1) to prevent notification flooding
 */
function buildBatchedPushPayloadForUser(
  userId: string,
  events: PendingPushEvent[]
): {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  type: string;
  entityId: string;
  actorId: string;
  url: string;
  batchedCount: number;
} {
  if (events.length === 1) {
    const ev = events[0];
    const formatted = formatFacebookStyleNotification({
      type: ev.type,
      title: ev.title,
      body: ev.body,
      actorName: ev.actorName,
      isVideo: ev.isVideo,
    });
    const targetUrl = buildDeepLinkUrl(
      ev.type,
      ev.entityId,
      ev.actorId,
      ev.url
    );
    return {
      title: formatted.title,
      body: formatted.body,
      icon: '/boosthub/icons/icon-192x192.png',
      badge: '/boosthub/icons/icon-192x192.png',
      tag: `boosthub-${ev.type || 'notif'}-${ev.id || Date.now()}`,
      type: ev.type || 'notification',
      entityId: ev.entityId || '',
      actorId: ev.actorId || '',
      url: targetUrl,
      batchedCount: 1,
    };
  }

  // Multiple notifications within the short window -> summarize into a single push message
  let likes = 0;
  let comments = 0;
  let mentions = 0;
  let follows = 0;
  let messages = 0;
  let friends = 0;
  let gifts = 0;
  let others = 0;

  const postIds = new Set<string>();
  const messageSenderIds = new Set<string>();

  for (const ev of events) {
    const t = String(ev.type || '').toLowerCase();
    if (t === 'like') {
      likes++;
      if (ev.entityId) postIds.add(ev.entityId);
    } else if (t === 'comment' || t === 'reply') {
      comments++;
      if (ev.entityId) postIds.add(ev.entityId);
    } else if (t === 'mention') {
      mentions++;
      if (ev.entityId) postIds.add(ev.entityId);
    } else if (t === 'follow') {
      follows++;
    } else if (t === 'message' || t === 'boost_bot') {
      messages++;
      if (ev.actorId || ev.entityId) {
        messageSenderIds.add(String(ev.actorId || ev.entityId));
      }
    } else if (t === 'friend_request' || t === 'friend_accept') {
      friends++;
    } else if (t === 'gift') {
      gifts++;
    } else {
      others++;
    }
  }

  const total = events.length;
  let summaryBody = `You have ${total} new notifications on BoostHub`;
  let summaryType = 'summary';
  let summaryEntityId = '';
  let summaryActorId = '';
  let summaryUrl = '/boosthub/?tab=notifications';

  // Case A: All updates are Likes
  if (likes === total) {
    summaryType = 'like';
    if (postIds.size === 1) {
      summaryEntityId = Array.from(postIds)[0];
      summaryBody = `${total} people liked your post`;
      summaryUrl = `/boosthub/?tab=home&post=${encodeURIComponent(
        summaryEntityId
      )}`;
    } else {
      summaryBody = `You have ${total} new likes on your posts`;
    }
  }
  // Case B: All updates are Comments / Replies
  else if (comments === total) {
    summaryType = 'comment';
    if (postIds.size === 1) {
      summaryEntityId = Array.from(postIds)[0];
      summaryBody = `${total} new comments on your post`;
      summaryUrl = `/boosthub/?tab=home&post=${encodeURIComponent(
        summaryEntityId
      )}&comments=1`;
    } else {
      summaryBody = `You have ${total} new comments on your posts`;
    }
  }
  // Case B2: All updates are Mentions
  else if (mentions === total) {
    summaryType = 'mention';
    summaryBody = `You were mentioned ${total} times on BoostHub`;
  }
  // Case C: All updates are Followers
  else if (follows === total) {
    summaryType = 'follow';
    summaryBody = `You have ${total} new followers`;
  }
  // Case D: All updates are Messages
  else if (messages === total) {
    summaryType = 'message';
    if (messageSenderIds.size === 1) {
      summaryActorId = Array.from(messageSenderIds)[0];
      summaryEntityId = summaryActorId;
      summaryBody = `You received ${total} new messages`;
      summaryUrl = `/boosthub/?messages=${encodeURIComponent(summaryActorId)}`;
    } else {
      summaryBody = `You have ${total} unread messages from ${messageSenderIds.size} chats`;
      summaryUrl = '/boosthub/?tab=friends';
    }
  }
  // Case E: All updates are Friend Requests / Accepts
  else if (friends === total) {
    summaryType = 'friend_request';
    summaryBody = `You have ${total} new friend requests`;
    summaryUrl = '/boosthub/?tab=friends';
  }
  // Case F: All updates are Gifts
  else if (gifts === total) {
    summaryType = 'gift';
    summaryBody = `You received ${total} new gifts!`;
    summaryUrl = '/boosthub/?tab=me&mode=gifts';
  }
  // Case G: Mixed updates across categories -> concise breakdown
  else {
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
    if (friends > 0) {
      parts.push(
        `${friends} friend ${friends === 1 ? 'request' : 'requests'}`
      );
    }
    if (gifts > 0) parts.push(`${gifts} ${gifts === 1 ? 'gift' : 'gifts'}`);
    if (others > 0) parts.push(`${others} other`);

    summaryBody = `You have ${total} new updates: ${parts.join(', ')}`;
  }

  return {
    title: 'BoostHub',
    body: summaryBody,
    icon: '/boosthub/icons/icon-192x192.png',
    badge: '/boosthub/icons/icon-192x192.png',
    // Stable tag per user so rapid bursts replace/update the existing summary notification in place
    tag: `boosthub-summary-${userId}`,
    type: summaryType,
    entityId: summaryEntityId,
    actorId: summaryActorId,
    url: summaryUrl,
    batchedCount: total,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = sanitizeVapidKey(Deno.env.get('VAPID_PUBLIC_KEY'));
    const vapidPrivateKey = sanitizeVapidKey(Deno.env.get('VAPID_PRIVATE_KEY'));
    const vapidSubject = sanitizeVapidSubject(Deno.env.get('VAPID_SUBJECT'));

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({
          error:
            'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY in Supabase Edge Function secrets.',
          sent: 0,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
          sent: 0,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));

    // =========================================================================
    // MODE 1: Recurring Cron Job (`mode === 'check_missed'`)
    // Groups all missed notifications & offline messages per user and sends
    // a single batched summary push message if a user has multiple updates.
    // =========================================================================
    if (body.mode === 'check_missed' || body.cron === true) {
      const { data: allSubs } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth');

      if (!allSubs || allSubs.length === 0) {
        return new Response(
          JSON.stringify({ ok: true, mode: 'check_missed', sent: 0 }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const subsByUser = new Map<
        string,
        Array<{ endpoint: string; p256dh: string; auth: string }>
      >();
      for (const s of allSubs) {
        if (!s.user_id || !s.endpoint || !s.p256dh || !s.auth) continue;
        const list = subsByUser.get(s.user_id) || [];
        list.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
        subsByUser.set(s.user_id, list);
      }

      const subscribedUserIds = Array.from(subsByUser.keys());
      const eventsByUser = new Map<string, PendingPushEvent[]>();
      const processedNotifIds: Array<number | string> = [];
      const processedMsgIds: Array<number | string> = [];

      // 1A. Collect missed rows in `notifications` table (is_read = false, push_sent = false)
      const { data: missedNotifs } = await supabase
        .from('notifications')
        .select('id, user_id, actor_id, type, title, body, entity_id, created_at')
        .in('user_id', subscribedUserIds)
        .eq('is_read', false)
        .eq('push_sent', false)
        .order('created_at', { ascending: true })
        .limit(250);

      if (missedNotifs && missedNotifs.length > 0) {
        for (const notif of missedNotifs) {
          const list = eventsByUser.get(notif.user_id) || [];
          list.push({
            id: notif.id,
            source: 'notification',
            userId: notif.user_id,
            actorId: notif.actor_id || '',
            type: notif.type || 'notification',
            title: notif.title || 'BoostHub',
            body: notif.body || '',
            entityId: notif.entity_id || '',
          });
          eventsByUser.set(notif.user_id, list);
          processedNotifIds.push(notif.id);
        }
      }

      // 1B. Collect missed rows in `messages` table (is_read = false, push_sent = false)
      const { data: missedMessages } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at')
        .in('receiver_id', subscribedUserIds)
        .eq('is_read', false)
        .eq('push_sent', false)
        .order('created_at', { ascending: true })
        .limit(250);

      if (missedMessages && missedMessages.length > 0) {
        for (const msg of missedMessages) {
          const list = eventsByUser.get(msg.receiver_id) || [];
          list.push({
            id: msg.id,
            source: 'message',
            userId: msg.receiver_id,
            actorId: String(msg.sender_id || ''),
            type: 'message',
            title: 'BoostHub',
            body: msg.content
              ? `You received a new message: "${String(msg.content).slice(0, 80)}"`
              : 'You received a new message',
            entityId: String(msg.sender_id || ''),
          });
          eventsByUser.set(msg.receiver_id, list);
          processedMsgIds.push(msg.id);
        }
      }

      let totalSent = 0;
      let batchedUsersCount = 0;
      const staleEndpoints: string[] = [];

      // 1C. Send at most ONE push (individual or batched summary) per user per window
      for (const [targetUid, userEvents] of eventsByUser.entries()) {
        if (userEvents.length === 0) continue;
        if (userEvents.length > 1) batchedUsersCount++;

        const pushPayload = buildBatchedPushPayloadForUser(
          targetUid,
          userEvents
        );
        const payloadStr = JSON.stringify(pushPayload);
        const userSubs = subsByUser.get(targetUid) || [];

        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payloadStr
            );
            totalSent++;
          } catch (err: any) {
            const code = err?.statusCode || err?.status;
            if (code === 401 || code === 403 || code === 404 || code === 410) {
              staleEndpoints.push(sub.endpoint);
            }
          }
        }
      }

      if (processedNotifIds.length > 0) {
        await supabase
          .from('notifications')
          .update({
            push_sent: true,
            push_sent_at: new Date().toISOString(),
          })
          .in('id', processedNotifIds);
      }

      if (processedMsgIds.length > 0) {
        await supabase
          .from('messages')
          .update({
            push_sent: true,
            push_sent_at: new Date().toISOString(),
          })
          .in('id', processedMsgIds);
      }

      if (staleEndpoints.length > 0) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .in('endpoint', staleEndpoints);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          mode: 'check_missed',
          sent: totalSent,
          usersNotified: eventsByUser.size,
          batchedUsersCount,
          eventsCoalesced: processedNotifIds.length + processedMsgIds.length,
          removedStale: staleEndpoints.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =========================================================================
    // MODE 2: Direct / Event-Driven Push Dispatch with Short-Window Batching
    // If a user receives multiple updates within a short window (default 60s),
    // coalesce them into a single summary push message to prevent flooding.
    // =========================================================================
    const userId: string | undefined = body.userId || body.user_id;
    const userIds: string[] | undefined = Array.isArray(body.userIds)
      ? body.userIds
      : undefined;
    const subscriptionPayload = body.subscription;
    const prefs =
      body.notificationPreferences &&
      typeof body.notificationPreferences === 'object'
        ? body.notificationPreferences
        : {};
    const isEventAllowedByPrefs = (type?: string): boolean => {
      const clean = String(type || 'notification').toLowerCase();
      if (clean === 'test') return true;
      if ((clean === 'like' || clean === 'share') && prefs.likes === false)
        return false;
      if ((clean === 'comment' || clean === 'reply') && prefs.comments === false)
        return false;
      if (clean === 'mention' && prefs.mentions === false) return false;
      if (clean === 'follow' && prefs.follows === false) return false;
      if (clean === 'message' && prefs.messages === false) return false;
      if (
        (clean === 'friend_request' || clean === 'friend_accept') &&
        prefs.friendRequests === false
      )
        return false;
      if ((clean === 'gift' || clean === 'badge') && prefs.gifts === false)
        return false;
      if (clean === 'boost_bot' && prefs.boostBot === false) return false;
      return true;
    };

    if (!isEventAllowedByPrefs(body.type)) {
      return new Response(
        JSON.stringify({
          ok: true,
          sent: 0,
          skippedByPreference: true,
          type: body.type,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const rawWindowSeconds =
      body.batchingEnabled === false || body.batchWindowSeconds === 0
        ? 0
        : Number(body.batchWindowSeconds ?? DEFAULT_BATCH_WINDOW_SECONDS);
    const batchWindowSeconds = Math.max(0, rawWindowSeconds);
    const windowCutoffIso = new Date(
      Date.now() - Math.max(5, batchWindowSeconds) * 1000
    ).toISOString();

    let finalPayloadObj: ReturnType<typeof buildBatchedPushPayloadForUser>;

    if (
      userId &&
      userId !== 'all' &&
      batchWindowSeconds > 0 &&
      String(body.type || '').toLowerCase() !== 'test'
    ) {
      const windowEvents: PendingPushEvent[] = [];
      const unsentNotifIds: Array<number | string> = [];
      const unsentMsgIds: Array<number | string> = [];

      // Query recent unread notifications for this user within the short window
      const { data: recentNotifs } = await supabase
        .from('notifications')
        .select(
          'id, user_id, actor_id, type, title, body, entity_id, push_sent, created_at'
        )
        .eq('user_id', userId)
        .eq('is_read', false)
        .gte('created_at', windowCutoffIso)
        .order('created_at', { ascending: true })
        .limit(50);

      if (recentNotifs && recentNotifs.length > 0) {
        for (const n of recentNotifs) {
          windowEvents.push({
            id: n.id,
            source: 'notification',
            userId,
            actorId: n.actor_id || '',
            type: n.type || 'notification',
            title: n.title || 'BoostHub',
            body: n.body || '',
            entityId: n.entity_id || '',
          });
          if (!n.push_sent) unsentNotifIds.push(n.id);
        }
      }

      // Query recent unread messages for this user within the short window
      const { data: recentMsgs } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, push_sent, created_at')
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .gte('created_at', windowCutoffIso)
        .order('created_at', { ascending: true })
        .limit(50);

      if (recentMsgs && recentMsgs.length > 0) {
        for (const m of recentMsgs) {
          windowEvents.push({
            id: m.id,
            source: 'message',
            userId,
            actorId: String(m.sender_id || ''),
            type: 'message',
            title: 'BoostHub',
            body: m.content
              ? `You received a new message: "${String(m.content).slice(0, 80)}"`
              : 'You received a new message',
            entityId: String(m.sender_id || ''),
          });
          if (!m.push_sent) unsentMsgIds.push(m.id);
        }
      }

      // Also include any pending notifications Passed in `body.notifications` array
      if (Array.isArray(body.notifications) && body.notifications.length > 0) {
        for (const item of body.notifications) {
          windowEvents.push({
            source: 'direct',
            userId,
            actorId: item.actorId || '',
            actorName: item.actorName || '',
            type: item.type || 'notification',
            title: item.title || 'BoostHub',
            body: item.body || '',
            entityId: item.entityId || '',
            url: item.url || '',
            isVideo: item.isVideo,
          });
        }
      } else {
        // Deduplicate current incoming event if not already represented in DB rows
        const incomingType = String(body.type || 'notification');
        const incomingEntity = String(body.entityId || '');
        const incomingActor = String(body.actorId || '');
        const alreadyInWindow = windowEvents.some(
          (e) =>
            e.type === incomingType &&
            e.entityId === incomingEntity &&
            e.actorId === incomingActor
        );
        if (!alreadyInWindow || windowEvents.length === 0) {
          windowEvents.push({
            source: 'direct',
            userId,
            actorId: incomingActor,
            actorName: body.actorName,
            type: incomingType,
            title: body.title,
            body: body.body,
            entityId: incomingEntity,
            url: body.url,
            isVideo: body.isVideo,
          });
        }
      }

      finalPayloadObj = buildBatchedPushPayloadForUser(userId, windowEvents);

      if (unsentNotifIds.length > 0) {
        await supabase
          .from('notifications')
          .update({
            push_sent: true,
            push_sent_at: new Date().toISOString(),
          })
          .in('id', unsentNotifIds);
      }

      if (unsentMsgIds.length > 0) {
        await supabase
          .from('messages')
          .update({
            push_sent: true,
            push_sent_at: new Date().toISOString(),
          })
          .in('id', unsentMsgIds);
      }
    } else {
      finalPayloadObj = buildBatchedPushPayloadForUser(userId || 'broadcast', [
        {
          source: 'direct',
          userId: userId || 'all',
          actorId: body.actorId || '',
          actorName: body.actorName,
          type: body.type || 'notification',
          title: body.title,
          body: body.body,
          entityId: body.entityId || '',
          url: body.url,
          isVideo: body.isVideo,
        },
      ]);
    }

    const notificationPayload = JSON.stringify({
      ...finalPayloadObj,
      icon: body.icon || finalPayloadObj.icon,
      badge: body.badge || finalPayloadObj.badge,
      tag: body.tag || finalPayloadObj.tag,
    });

    let subscriptions: Array<{
      id?: number | string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }> = [];

    if (userId === 'all') {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth');
      if (error) throw error;
      subscriptions = data || [];
    } else if (userIds && userIds.length > 0) {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .in('user_id', userIds);
      if (error) throw error;
      subscriptions = data || [];
    } else if (userId) {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', userId);
      if (error) throw error;
      subscriptions = data || [];
    }

    if (
      subscriptionPayload?.endpoint &&
      subscriptionPayload?.keys?.p256dh &&
      subscriptionPayload?.keys?.auth
    ) {
      const exists = subscriptions.some(
        (s) => s.endpoint === subscriptionPayload.endpoint
      );
      if (!exists) {
        subscriptions.push({
          endpoint: subscriptionPayload.endpoint,
          p256dh: subscriptionPayload.keys.p256dh,
          auth: subscriptionPayload.keys.auth,
        });
      }
    }

    let sent = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subscriptions) {
      if (!sub.endpoint || !sub.p256dh || !sub.auth) continue;
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
        sent++;
      } catch (err: any) {
        const statusCode = err?.statusCode || err?.status;
        if (
          statusCode === 401 ||
          statusCode === 403 ||
          statusCode === 404 ||
          statusCode === 410
        ) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error('Web Push delivery error:', err);
        }
      }
    }

    if (staleEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        batched: finalPayloadObj.batchedCount > 1,
        batchedCount: finalPayloadObj.batchedCount,
        summaryBody: finalPayloadObj.body,
        totalTargeted: subscriptions.length,
        removedStale: staleEndpoints.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err?.message || 'Failed to send Web Push notification',
        sent: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
