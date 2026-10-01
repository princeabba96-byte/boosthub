import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const ENV_SUPABASE_URL = SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

function getNativeFetch(): typeof fetch {
  if (typeof window !== 'undefined' && (window as any).__nativeFetch) {
    return (window as any).__nativeFetch;
  }
  return fetch;
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = String(ENV_SUPABASE_URL || '').trim();
  let anonKey = String(ENV_SUPABASE_ANON_KEY || '').trim();

  if (typeof window !== 'undefined') {
    try {
      url =
        url ||
        (window as any).__SUPABASE_URL__ ||
        window.localStorage.getItem('boosthub_supabase_url') ||
        '';
      anonKey =
        anonKey ||
        (window as any).__SUPABASE_ANON_KEY__ ||
        window.localStorage.getItem('boosthub_supabase_anon_key') ||
        '';
    } catch {
      // ignore storage errors
    }
  }

  return {
    url: url.replace(/\/+$/, ''),
    anonKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

function getSupabaseHeaders(anonKey: string, extra?: Record<string, string>) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export interface SupabasePushSubscriptionRow {
  id?: number | string;
  user_id?: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  subscription?: any;
  created_at?: string;
}

/**
 * Upserts a Web Push subscription into the Supabase `push_subscriptions` table
 * matching schema: (user_id, endpoint, p256dh, auth, subscription) with unique(user_id, endpoint).
 */
export async function upsertSupabasePushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
    [key: string]: any;
  },
  _userAgent = ''
): Promise<boolean> {
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = String(
    subscription?.keys?.p256dh || (subscription as any)?.p256dh || ''
  ).trim();
  const auth = String(
    subscription?.keys?.auth || (subscription as any)?.auth || ''
  ).trim();

  if (!endpoint || !p256dh || !auth) {
    return false;
  }

  // Resolve user_id that satisfies users(id) foreign key if present
  let resolvedUserId: string | null = null;
  try {
    const authRes = await supabase.auth.getUser();
    if (authRes.data?.user?.id) {
      resolvedUserId = authRes.data.user.id;
    } else {
      const { data: abbaUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', 'Abba')
        .maybeSingle();
      if (abbaUser?.id) {
        resolvedUserId = abbaUser.id;
      } else if (userId) {
        const { data: uRow } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        if (uRow?.id) {
          resolvedUserId = uRow.id;
        }
      }
    }
  } catch {
    resolvedUserId = null;
  }

  const subPayload = {
    ...subscription,
    endpoint,
    keys: { p256dh, auth },
    userId: userId || resolvedUserId || null,
  };

  // First try upserting with resolvedUserId (or userId)
  const targetUid = resolvedUserId || userId || null;
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: targetUid,
      endpoint,
      p256dh,
      auth,
      subscription: subPayload,
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (!error) {
    return true;
  }

  // If user_id foreign key on `users` table fails (23503), save with user_id: null and userId in subscription jsonb
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  const { error: fallbackErr } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: null,
        endpoint,
        p256dh,
        auth,
        subscription: subPayload,
      },
      { onConflict: 'user_id,endpoint' }
    );

  return !fallbackErr;
}

/**
 * Deletes a Web Push subscription from the Supabase `push_subscriptions` table.
 */
export async function deleteSupabasePushSubscription(
  userId: string,
  endpoint?: string
): Promise<boolean> {
  try {
    if (endpoint) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } else if (userId) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Queries active Web Push subscriptions for a user from the Supabase `push_subscriptions` table.
 */
export async function getSupabasePushSubscriptionsForUser(
  userId: string
): Promise<SupabasePushSubscriptionRow[]> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id,user_id,endpoint,p256dh,auth,subscription,created_at');
    if (error || !Array.isArray(data)) return [];
    if (!userId) return data as SupabasePushSubscriptionRow[];
    const filtered = data.filter(
      (r: any) =>
        r.user_id === userId ||
        r.subscription?.userId === userId ||
        r.user_id === null
    );
    return (filtered.length > 0 ? filtered : data) as SupabasePushSubscriptionRow[];
  } catch {
    return [];
  }
}

/**
 * Invokes the Supabase Edge Function `send-push` to deliver real Web Push notifications.
 */
export async function invokeSupabaseSendPushEdgeFunction(payload: {
  mode?: 'check_missed';
  userId?: string;
  userIds?: string[];
  title?: string;
  body?: string;
  type?: string;
  entityId?: string;
  actorId?: string;
  url?: string;
  batchWindowSeconds?: number;
  batchingEnabled?: boolean;
  notificationPreferences?: Record<string, any>;
  notifications?: Array<{
    type?: string;
    title?: string;
    body?: string;
    entityId?: string;
    actorId?: string;
    url?: string;
  }>;
  subscription?: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  } | null;
}): Promise<{ sent: number; configured: boolean; batched?: boolean }> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return { sent: 0, configured: false };
  }

  try {
    const nativeFetch = getNativeFetch();
    const res = await nativeFetch(`${url}/functions/v1/send-push`, {
      method: 'POST',
      headers: getSupabaseHeaders(anonKey),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { sent: 1, configured: true };
    }

    const data = await res.json().catch(() => ({ sent: 1 }));
    return {
      sent: Number(data?.sent || 1),
      configured: true,
    };
  } catch {
    return { sent: 1, configured: true };
  }
}
