import { CommentItem, MissionItem, PostItem, StoryItem, UserProfile } from '../types';
import { handleStaticBackendRequest } from './staticBackend';

const SESSION_TOKEN_KEY = 'boosthub_session_token';

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

let inMemoryAuthToken: string | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(SESSION_TOKEN_KEY);
      if (saved && saved.startsWith('sb_user_')) {
        return saved;
      }
    } catch {
      // ignore
    }
  }
  return null;
})();

let inMemoryProfile: UserProfile | null = null;
const commentsMemoryCache = new Map<any, CommentItem[]>();
const feedMemoryCache = new Map<string, PostItem[]>();
let storiesMemoryCache: StoryItem[] | null = null;
let missionsMemoryCache: MissionItem[] | null = null;
const inFlightGetRequests = new Map<string, Promise<any>>();

export function clearAllUserCaches() {
  inMemoryProfile = null;
  commentsMemoryCache.clear();
  feedMemoryCache.clear();
  storiesMemoryCache = null;
  missionsMemoryCache = null;
  inFlightGetRequests.clear();
}

export function setAuthToken(token: string | null) {
  const prevToken = inMemoryAuthToken;
  inMemoryAuthToken = token;
  if (prevToken !== token) {
    clearAllUserCaches();
  }
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        window.localStorage.setItem(SESSION_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch {
      // ignore
    }
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

export function updateCachedPostStats(
  postId: string | number,
  patch: Partial<PostItem>
) {
  const targetId = String(postId);
  feedMemoryCache.forEach((list, tab) => {
    const updated = list.map((p) =>
      String(p.id) === targetId ? { ...p, ...patch } : p
    );
    feedMemoryCache.set(tab, updated);
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('boosthub:post-updated', {
        detail: { postId: targetId, patch },
      })
    );
  }
}

export function clearAllFeedCaches() {
  feedMemoryCache.clear();
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const activeToken = getAuthToken();

  // Route all data API requests directly to the real Supabase backend engine
  if (path.startsWith('/api/') && path !== '/api/admin/github-pages-push') {
    const dedupeKey = method === 'GET' ? `${activeToken || 'anon'}:${path}` : '';
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
