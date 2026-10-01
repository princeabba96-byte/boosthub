import { CommentItem, MissionItem, PostItem, StoryItem, UserProfile } from '../types';
import { handleStaticBackendRequest } from './staticBackend';
import { ADMIN_ABBA_UUID } from '../lib/supabase';

// Purge any legacy localStorage mock/cache keys so all devices show identical Supabase data
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (
        k &&
        (k.startsWith('boosthub_static_db') ||
          k.startsWith('boosthub_cached_') ||
          k === 'boosthub_auth_token')
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore storage access errors in restricted iframes
  }
}

let inMemoryAuthToken: string | null = `sb_user_${ADMIN_ABBA_UUID}`;
let inMemoryProfile: UserProfile | null = null;
const commentsMemoryCache = new Map<any, CommentItem[]>();
const feedMemoryCache = new Map<string, PostItem[]>();
let storiesMemoryCache: StoryItem[] | null = null;
let missionsMemoryCache: MissionItem[] | null = null;
const inFlightGetRequests = new Map<string, Promise<any>>();

export function setAuthToken(token: string | null) {
  inMemoryAuthToken = token;
  if (!token) {
    inMemoryProfile = null;
  }
}

export function getAuthToken(): string | null {
  return inMemoryAuthToken;
}

export function getCachedProfile(): UserProfile | null {
  if (!getAuthToken()) return null;
  return inMemoryProfile;
}

export function setCachedProfile(profile: UserProfile | null) {
  inMemoryProfile = profile;
}

export function getCachedComments(postId: any): CommentItem[] | null {
  return commentsMemoryCache.get(String(postId)) || null;
}

export function setCachedComments(postId: any, comments: CommentItem[]) {
  commentsMemoryCache.set(String(postId), comments);
}

export function getCachedFeed(tab: string): PostItem[] | null {
  const mem = feedMemoryCache.get(tab);
  return mem && mem.length > 0 ? mem : null;
}

export function setCachedFeed(tab: string, posts: PostItem[]) {
  feedMemoryCache.set(tab, posts);
}

export function getCachedStories(): StoryItem[] | null {
  return storiesMemoryCache;
}

export function setCachedStories(stories: StoryItem[]) {
  storiesMemoryCache = stories;
}

export function getCachedMissions(): MissionItem[] | null {
  return missionsMemoryCache;
}

export function setCachedMissions(missions: MissionItem[]) {
  missionsMemoryCache = missions;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const activeToken = getAuthToken() || `sb_user_${ADMIN_ABBA_UUID}`;

  // Route all data API requests directly to the real Supabase backend engine
  // so AI Studio preview, Chrome, and APK always read/write the exact same cloud data.
  if (path.startsWith('/api/') && path !== '/api/admin/github-pages-push') {
    const dedupeKey = method === 'GET' ? `${activeToken}:${path}` : '';
    if (dedupeKey && inFlightGetRequests.has(dedupeKey)) {
      return inFlightGetRequests.get(dedupeKey) as Promise<T>;
    }

    const promise = handleStaticBackendRequest<T>(
      path,
      method,
      options.body,
      activeToken
    ).finally(() => {
      if (dedupeKey) {
        inFlightGetRequests.delete(dedupeKey);
      }
    });

    if (dedupeKey) {
      inFlightGetRequests.set(dedupeKey, promise);
    }
    return promise;
  }

  const headersObj: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.headers) {
    const h = new Headers(options.headers);
    h.forEach((val, key) => {
      headersObj[key] = val;
    });
  }
  if (
    !headersObj['Content-Type'] &&
    !headersObj['content-type'] &&
    options.body &&
    typeof options.body === 'string'
  ) {
    headersObj['Content-Type'] = 'application/json';
  }
  if (activeToken) {
    headersObj['Authorization'] = `Bearer ${activeToken}`;
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers: headersObj,
  });

  if (!response.ok) {
    let errMessage = 'Something went wrong. Please try again.';
    try {
      const errJson = await response.json();
      if (errJson?.error) errMessage = errJson.error;
    } catch {
      // fallback
    }
    throw new Error(errMessage);
  }

  return (await response.json()) as T;
}
