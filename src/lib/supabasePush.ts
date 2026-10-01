import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

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
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

/**
 * Upserts a real Web Push subscription into the Supabase `push_subscriptions` table.
 */
export async function upsertSupabasePushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  },
  userAgent = ''
): Promise<boolean> {
  if (
    !userId ||
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    throw new Error(
      'Invalid Web Push subscription: endpoint, p256dh, and auth keys are required.'
    );
  }

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return false;

  const nativeFetch = getNativeFetch();
  const res = await nativeFetch(
    `${url}/rest/v1/push_subscriptions?on_conflict=endpoint`,
    {
      method: 'POST',
      headers: getSupabaseHeaders(anonKey, {
        Prefer: 'resolution=merge-duplicates,return=representation',
      }),
      body: JSON.stringify({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent.slice(0, 250),
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Failed to save push subscription to Supabase push_subscriptions (${res.status}): ${errText}`
    );
  }

  return true;
}

/**
 * Deletes a Web Push subscription from the Supabase `push_subscriptions` table.
 */
export async function deleteSupabasePushSubscription(
  userId: string,
  endpoint?: string
): Promise<boolean> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return false;

  const nativeFetch = getNativeFetch();
  const query = endpoint
    ? `endpoint=eq.${encodeURIComponent(endpoint)}`
    : `user_id=eq.${encodeURIComponent(userId)}`;

  const res = await nativeFetch(`${url}/rest/v1/push_subscriptions?${query}`, {
    method: 'DELETE',
    headers: getSupabaseHeaders(anonKey),
  });

  return res.ok;
}

/**
 * Queries active Web Push subscriptions for a user from the Supabase `push_subscriptions` table.
 */
export async function getSupabasePushSubscriptionsForUser(
  userId: string
): Promise<SupabasePushSubscriptionRow[]> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !userId) return [];

  const nativeFetch = getNativeFetch();
  const res = await nativeFetch(
    `${url}/rest/v1/push_subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&select=id,user_id,endpoint,p256dh,auth,user_agent`,
    {
      method: 'GET',
      headers: getSupabaseHeaders(anonKey),
    }
  );

  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

/**
 * Invokes the Supabase Edge Function `send-push` to deliver real Web Push notifications
 * using VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT stored in Supabase Secrets.
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

  const nativeFetch = getNativeFetch();
  const res = await nativeFetch(`${url}/functions/v1/send-push`, {
    method: 'POST',
    headers: getSupabaseHeaders(anonKey),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error ||
        `Supabase send-push Edge Function returned status ${res.status}`
    );
  }

  const data = await res.json().catch(() => ({ sent: 0 }));
  return {
    sent: Number(data?.sent || 0),
    configured: true,
  };
}
