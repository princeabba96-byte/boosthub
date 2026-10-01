import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  apiFetch,
  setAuthToken,
  getAuthToken,
  setCachedProfile,
  updateCachedPostStats,
} from '../services/api';
import {
  showBrowserSystemNotification,
  enableBackgroundPushNotifications,
} from '../services/pushNotifications';
import { supabase, ADMIN_ABBA_UUID } from '../lib/supabase';
import { mapSupabaseRowToUserProfile } from '../services/staticBackend';
import { UserProfile } from '../types';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface AuthContextValue {
  userProfile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  onlineUserIds: Set<string>;
  realtimeEvents: Array<{ type: string; payload: any; timestamp: number }>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  refreshProfile: () => Promise<void>;
  refreshBadgesCount: () => Promise<void>;
  loginWithEmail: (
    email: string,
    password: string,
    avatarUrl?: string
  ) => Promise<void>;
  signupWithEmail: (
    email: string,
    password: string,
    displayName: string,
    username: string,
    avatarUrl?: string
  ) => Promise<void>;
  loginWithGoogle: (
    avatarUrl?: string,
    googleEmail?: string,
    googleDisplayName?: string
  ) => Promise<void>;
  resetPassword: (email: string, newPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUserAdminState(
  profile: UserProfile | null
): UserProfile | null {
  if (!profile) return null;
  const isOwnerAdmin =
    profile.id === ADMIN_ABBA_UUID ||
    String(profile.username || '').toLowerCase() === 'abba' ||
    String(profile.email || '')
      .trim()
      .toLowerCase() === 'princeabba96@gmail.com';
  if (isOwnerAdmin) {
    return {
      ...profile,
      displayName: 'Prince Abba',
      username: 'Abba',
      role: 'admin',
      isAdmin: true,
      isVerified: true,
    };
  }
  return profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(() =>
    normalizeUserAdminState(
      mapSupabaseRowToUserProfile({
        id: ADMIN_ABBA_UUID,
        username: 'Abba',
        display_name: 'Prince Abba',
        xp: 100200,
        followers: 1400,
        likes: 4200,
        views: 18500,
        engagement: 310,
        boost_points: 999999999,
        is_admin: true,
        creator_of_week: true,
      })
    )
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [onlineUserIds] = useState<Set<string>>(new Set([ADMIN_ABBA_UUID]));
  const [realtimeEvents, setRealtimeEvents] = useState<
    Array<{ type: string; payload: any; timestamp: number }>
  >([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const setUserProfile = useCallback((profile: UserProfile | null) => {
    const normalized = normalizeUserAdminState(profile);
    setUserProfileState(normalized);
    setCachedProfile(normalized);
  }, []);

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = `${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const refreshBadgesCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const uid = token.startsWith('sb_user_')
      ? token.replace('sb_user_', '')
      : ADMIN_ABBA_UUID;

    try {
      const { data: unreadRows } = await supabase
        .from('notifications')
        .select('id, type, is_read')
        .eq('target_user', uid)
        .eq('is_read', false);

      const list = unreadRows || [];
      const dmCount = list.filter((n) => n.type === 'dm').length;
      const alertCount = list.filter(
        (n) => n.type !== 'dm' && n.type !== 'gift_tx'
      ).length;
      setUnreadMessages(dmCount);
      setUnreadNotifications(alertCount);
    } catch {
      // silent background sync
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const profile = await apiFetch<UserProfile>('/api/me');
      setUserProfile(profile);
      refreshBadgesCount();
    } catch (error) {
      console.warn('Could not refresh user profile from Supabase:', error);
    }
  }, [refreshBadgesCount, setUserProfile]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Back online. Synchronizing with Supabase...', 'success');
      refreshProfile();
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('Offline mode.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshProfile, showToast]);

  // Initial load from Supabase real backend
  useEffect(() => {
    let isMounted = true;

    const loadInitialSupabaseSession = async () => {
      try {
        if (!getAuthToken()) {
          setAuthToken(`sb_user_${ADMIN_ABBA_UUID}`);
        }

        const profile = await apiFetch<UserProfile>('/api/me');
        if (isMounted && profile) {
          setUserProfile(profile);
        }
        if (isMounted) {
          refreshBadgesCount();
        }
      } catch (err) {
        console.warn('Error loading Supabase profile:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.id) {
          window.setTimeout(async () => {
            setAuthToken(`sb_user_${session.user.id}`);
            try {
              const profile = await apiFetch<UserProfile>('/api/me');
              if (isMounted) setUserProfile(profile);
              refreshBadgesCount();
            } catch {
              // ignore
            }
          }, 0);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshBadgesCount, setUserProfile]);

  // Auto-sync phone push notification subscription when authenticated
  useEffect(() => {
    if (!userProfile || !getAuthToken()) return;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        enableBackgroundPushNotifications(true).catch(() => {});
      }
    }
  }, [userProfile]);

  // Subscribe to Supabase Realtime Postgres Changes across all tables
  useEffect(() => {
    if (!userProfile) return;

    const pushEvent = (type: string, payload: any) => {
      setRealtimeEvents((prev) => [
        ...prev.slice(-25),
        { type, payload, timestamp: Date.now() },
      ]);
    };

    const channel = supabase
      .channel('boosthub-global-realtime', {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'sync' }, (msg) => {
        const data = msg?.payload || {};
        if (data.type === 'post_comment' && data.postId) {
          if (typeof data.commentsCount === 'number') {
            updateCachedPostStats(data.postId, {
              commentsCount: data.commentsCount,
            });
          }
          pushEvent('post_comment', data);
          refreshBadgesCount();
        } else if (data.type === 'post_like' && data.postId) {
          if (typeof data.likesCount === 'number') {
            updateCachedPostStats(data.postId, {
              likesCount: data.likesCount,
            });
          }
          pushEvent('post_like', data);
          refreshProfile();
          refreshBadgesCount();
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          pushEvent('posts_changed', payload.new || payload.old);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        (payload) => {
          pushEvent('new_story', payload.new || payload.old);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          pushEvent('profile_updated', payload.new);
          refreshProfile();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        (payload) => {
          pushEvent('post_comment', payload.new || payload.old);
          refreshBadgesCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          pushEvent('post_comment', payload.new || payload.old);
          refreshBadgesCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        (payload) => {
          pushEvent('post_like', payload.new || payload.old);
          refreshProfile();
          refreshBadgesCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          const row: any = payload.new;
          pushEvent('notification', row);
          refreshBadgesCount();
          if (
            payload.eventType === 'INSERT' &&
            row &&
            String(row.target_user) === userProfile.id
          ) {
            if (row.type === 'dm') {
              showToast('New direct message received', 'info');
            } else if (row.type !== 'gift_tx') {
              showToast(`${row.title || 'Alert'}: ${row.body || ''}`, 'info');
              showBrowserSystemNotification(
                row.title || 'BoostHub Alert',
                row.body || '',
                '/?tab=notifications'
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        (payload) => {
          pushEvent('follow', payload.new);
          refreshProfile();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        (payload) => {
          pushEvent('friend_update', payload.new);
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile, refreshProfile, refreshBadgesCount, showToast]);

  const loginWithEmail = async (
    email: string,
    password: string,
    avatarUrl?: string
  ) => {
    const res = await apiFetch<{
      token: string;
      profile?: UserProfile;
      user?: UserProfile;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, avatarUrl }),
    });
    setAuthToken(res.token);
    const resolvedProfile =
      res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
    setUserProfile(resolvedProfile);
    refreshBadgesCount();
    showToast(`Welcome back, ${resolvedProfile.displayName}!`, 'success');
  };

  const signupWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    username: string,
    avatarUrl?: string
  ) => {
    const res = await apiFetch<{
      token: string;
      profile?: UserProfile;
      user?: UserProfile;
    }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        displayName,
        username,
        avatarUrl,
      }),
    });
    setAuthToken(res.token);
    const resolvedProfile =
      res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
    setUserProfile(resolvedProfile);
    refreshBadgesCount();
    showToast(`Welcome to BoostHub, ${resolvedProfile.displayName}!`, 'success');
  };

  const loginWithGoogle = async (
    avatarUrl?: string,
    googleEmail?: string,
    googleDisplayName?: string
  ) => {
    const cleanEmail = (googleEmail || 'princeabba96@gmail.com')
      .trim()
      .toLowerCase();
    const localPart = cleanEmail.split('@')[0] || 'user';
    const cleanName =
      (googleDisplayName || '').trim() ||
      localPart.charAt(0).toUpperCase() + localPart.slice(1);

    const res = await apiFetch<{
      token: string;
      profile?: UserProfile;
      user?: UserProfile;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: cleanEmail,
        displayName: cleanName,
        username: localPart.replace(/[^a-z0-9_]/g, ''),
        avatarUrl,
      }),
    });
    setAuthToken(res.token);
    const resolvedProfile =
      res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
    setUserProfile(resolvedProfile);
    refreshBadgesCount();
    showToast(`Signed in as ${resolvedProfile.displayName}`, 'success');
  };

  const resetPassword = async (email: string, newPassword?: string) => {
    await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
    showToast('Password updated successfully.', 'success');
  };

  const logout = async () => {
    setAuthToken(null);
    setUserProfile(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    showToast('Signed out of BoostHub.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        isOffline,
        unreadNotifications,
        unreadMessages,
        onlineUserIds,
        realtimeEvents,
        toasts,
        showToast,
        refreshProfile,
        refreshBadgesCount,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
