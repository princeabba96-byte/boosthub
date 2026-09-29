import { CommentItem, MissionItem, PostItem, StoryItem, UserProfile } from '../types';

const AUTH_STORAGE_KEY = 'boosthub_auth_token';
const PROFILE_CACHE_KEY = 'boosthub_cached_profile_v1';
const FEED_CACHE_PREFIX = 'boosthub_cached_feed_v1_';
const STORIES_CACHE_KEY = 'boosthub_cached_stories_v1';
const MISSIONS_CACHE_KEY = 'boosthub_cached_missions_v1';

function readJsonStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore quota or restricted iframe storage errors
  }
}

function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

let inMemoryAuthToken: string | null = loadStoredToken();
let inMemoryProfile: UserProfile | null = readJsonStorage<UserProfile>(PROFILE_CACHE_KEY);
const commentsMemoryCache = new Map<number, CommentItem[]>();
const feedMemoryCache = new Map<string, PostItem[]>();
const inFlightGetRequests = new Map<string, Promise<any>>();

interface QueuedRequest {
  path: string;
  options: RequestInit;
}

const offlineQueue: QueuedRequest[] = [];

export function setAuthToken(token: string | null) {
  inMemoryAuthToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.localStorage.removeItem(PROFILE_CACHE_KEY);
        inMemoryProfile = null;
      }
    } catch {
      // ignore storage errors in restricted iframes
    }
  }
}

export function getAuthToken(): string | null {
  if (!inMemoryAuthToken) {
    inMemoryAuthToken = loadStoredToken();
  }
  return inMemoryAuthToken;
}

export function getCachedProfile(): UserProfile | null {
  if (!getAuthToken()) return null;
  if (!inMemoryProfile) {
    inMemoryProfile = readJsonStorage<UserProfile>(PROFILE_CACHE_KEY);
  }
  return inMemoryProfile;
}

export function setCachedProfile(profile: UserProfile | null) {
  inMemoryProfile = profile;
  writeJsonStorage(PROFILE_CACHE_KEY, profile);
}

export function getCachedComments(postId: number): CommentItem[] | null {
  return commentsMemoryCache.get(postId) || null;
}

export function setCachedComments(postId: number, comments: CommentItem[]) {
  commentsMemoryCache.set(postId, comments);
}

export function getCachedFeed(tab: string): PostItem[] | null {
  const mem = feedMemoryCache.get(tab);
  if (mem && mem.length > 0) return mem;
  const stored = readJsonStorage<PostItem[]>(`${FEED_CACHE_PREFIX}${tab}`);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    feedMemoryCache.set(tab, stored);
    return stored;
  }
  return null;
}

export function setCachedFeed(tab: string, posts: PostItem[]) {
  feedMemoryCache.set(tab, posts);
  // Persist top 15 lightweight feed items for instant cold-start rendering on slow networks
  writeJsonStorage(`${FEED_CACHE_PREFIX}${tab}`, posts.slice(0, 15));
}

export function getCachedStories(): StoryItem[] | null {
  return readJsonStorage<StoryItem[]>(STORIES_CACHE_KEY);
}

export function setCachedStories(stories: StoryItem[]) {
  writeJsonStorage(STORIES_CACHE_KEY, stories.slice(0, 20));
}

export function getCachedMissions(): MissionItem[] | null {
  return readJsonStorage<MissionItem[]>(MISSIONS_CACHE_KEY);
}

export function setCachedMissions(missions: MissionItem[]) {
  writeJsonStorage(MISSIONS_CACHE_KEY, missions);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    while (offlineQueue.length > 0) {
      const next = offlineQueue.shift();
      if (next) {
        try {
          await apiFetch(next.path, next.options);
        } catch {
          // Ignore failed replay
        }
      }
    }
  });
}

/**
 * Uses native XMLHttpRequest for same-origin `/api/*` endpoints so requests
 * execute immediately without waiting on iframe `window.fetch` shims.
 */
function xhrJsonRequest<T>(
  path: string,
  method: string,
  headersObj: Record<string, string>,
  body: BodyInit | null | undefined
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, path, true);
    xhr.withCredentials = true;
    xhr.timeout = 25000;

    Object.entries(headersObj).forEach(([k, v]) => {
      xhr.setRequestHeader(k, v);
    });

    xhr.onload = () => {
      const text = xhr.responseText || '';
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve((text ? JSON.parse(text) : {}) as T);
        } catch {
          resolve({} as T);
        }
      } else {
        let errMessage = 'Something went wrong. Please try again.';
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) errMessage = parsed.error;
        } catch {
          // fallback message
        }
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Request timed out on slow connection. Please try again.'));
    };

    xhr.send((body as XMLHttpRequestBodyInit) || null);
  });
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headersObj: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.headers) {
    const h = new Headers(options.headers);
    h.forEach((val, key) => {
      headersObj[key] = val;
    });
  }

  if (!headersObj['Content-Type'] && !headersObj['content-type'] && options.body && typeof options.body === 'string') {
    headersObj['Content-Type'] = 'application/json';
  }

  const activeToken = getAuthToken();
  if (activeToken) {
    headersObj['Authorization'] = `Bearer ${activeToken}`;
  }

  // Deduplicate identical concurrent GET requests so slow networks don't double-fetch
  const dedupeKey = method === 'GET' ? `${activeToken || 'anon'}:${path}` : '';
  if (dedupeKey && inFlightGetRequests.has(dedupeKey)) {
    return inFlightGetRequests.get(dedupeKey) as Promise<T>;
  }

  const execute = async (): Promise<T> => {
    try {
      if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined' && path.startsWith('/')) {
        return await xhrJsonRequest<T>(path, method, headersObj, options.body);
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
          // fallback message
        }
        throw new Error(errMessage);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      if (
        typeof navigator !== 'undefined' &&
        !navigator.onLine &&
        method !== 'GET'
      ) {
        offlineQueue.push({ path, options });
        throw new Error('You appear to be offline. Action queued for when connection returns.');
      }
      throw error;
    } finally {
      if (dedupeKey) {
        inFlightGetRequests.delete(dedupeKey);
      }
    }
  };

  const promise = execute();
  if (dedupeKey) {
    inFlightGetRequests.set(dedupeKey, promise);
  }
  return promise;
}
