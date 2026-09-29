import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from '../lib/firebase';
import {
  apiFetch,
  setAuthToken,
  getAuthToken,
  getCachedProfile,
  setCachedProfile,
} from '../services/api';
import {
  showBrowserSystemNotification,
  enableBackgroundPushNotifications,
} from '../services/pushNotifications';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialCachedProfile = getCachedProfile();
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(initialCachedProfile);
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialCachedProfile) return false;
    if (!getAuthToken()) return false;
    return true;
  });
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [realtimeEvents, setRealtimeEvents] = useState<
    Array<{ type: string; payload: any; timestamp: number }>
  >([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const setUserProfile = useCallback((profile: UserProfile | null) => {
    setUserProfileState(profile);
    setCachedProfile(profile);
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
    if (!getAuthToken()) return;
    try {
      const [notifs, convs] = await Promise.all([
        apiFetch<any[]>('/api/notifications'),
        apiFetch<any[]>('/api/messages/conversations'),
      ]);
      setUnreadNotifications(notifs.filter((n) => !n.isRead).length);
      setUnreadMessages(
        convs.reduce((sum, c) => sum + (Number(c?.unreadCount) || 0), 0)
      );
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
      console.warn('Could not refresh user profile:', error);
    }
  }, [refreshBadgesCount, setUserProfile]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Back online. Synchronizing...', 'success');
      refreshProfile();
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('Offline mode: viewing cached content.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshProfile, showToast]);

  // Restore persisted session or Firebase Auth session
  useEffect(() => {
    let isMounted = true;

    const restoreFromStoredToken = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const profile = await apiFetch<UserProfile>('/api/me');
          if (isMounted) {
            setUserProfile(profile);
          }
          refreshBadgesCount();
        } catch (err: any) {
          if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
            setAuthToken(null);
            if (isMounted) setUserProfile(null);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (getAuthToken()) {
      restoreFromStoredToken();
    }

    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1500);

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            setAuthToken(idToken);
            const profile = await apiFetch<UserProfile>('/api/me');
            if (isMounted) {
              setUserProfile(profile);
            }
            refreshBadgesCount();
          } catch (err) {
            console.warn('Could not restore Firebase user session:', err);
          } finally {
            if (isMounted) setLoading(false);
          }
        } else if (!getAuthToken()) {
          if (isMounted) setLoading(false);
        }
      });
    } catch {
      restoreFromStoredToken();
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
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

  // Connect to Realtime SSE Stream when authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (!userProfile || !token) return;

    const handleCustomRealtime = (ev: Event) => {
      const data = (ev as CustomEvent)?.detail;
      if (!data) return;
      setRealtimeEvents((prev) => [...prev.slice(-25), data]);
      if (data.type === 'boost_bot_message') {
        setUnreadMessages((c) => c + 1);
        setUnreadNotifications((c) => c + 1);
        const msgText = data.payload?.content || 'New message from BOOST BOT';
        showToast(`BOOST BOT: ${msgText}`, 'info');
      }
    };

    window.addEventListener('boosthub:realtime', handleCustomRealtime);

    const isStaticHost =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('.github.io') ||
        window.location.hostname.endsWith('.pages.dev') ||
        window.location.hostname.endsWith('.netlify.app'));

    if (isStaticHost) {
      return () => {
        window.removeEventListener('boosthub:realtime', handleCustomRealtime);
      };
    }

    const eventSource = new EventSource(
      `/api/realtime/stream?token=${encodeURIComponent(token)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected' && Array.isArray(data.onlineUserIds)) {
          setOnlineUserIds(new Set(data.onlineUserIds));
          return;
        }
        if (data.type === 'presence' && data.payload?.userId) {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            if (data.payload.online) next.add(data.payload.userId);
            return next;
          });
          return;
        }

        setRealtimeEvents((prev) => [...prev.slice(-25), data]);

        if (data.type === 'boost_bot_message') {
          setUnreadMessages((c) => c + 1);
          setUnreadNotifications((c) => c + 1);
          const msgText = data.payload?.content || 'New message from BOOST BOT';
          showToast(`BOOST BOT: ${msgText}`, 'info');
          showBrowserSystemNotification(
            'BOOST BOT',
            msgText,
            '/?messages=boost_bot_official'
          );
          return;
        }

        if (
          data.type === 'direct_message' &&
          data.payload?.receiverId === userProfile.id
        ) {
          if (data.payload?.senderId === 'boost_bot_official') {
            return;
          }
          setUnreadMessages((c) => c + 1);
          showToast('New message received', 'info');
          showBrowserSystemNotification(
            'New Message on BoostHub ✉️',
            data.payload?.content || 'Sent you a message',
            '/?tab=friends'
          );
        } else if (
          data.type === 'friend_update' ||
          data.type === 'follow' ||
          data.type === 'post_like' ||
          data.type === 'post_comment'
        ) {
          refreshBadgesCount();
        }
      } catch {
        // ignore malformed frame
      }
    };

    return () => {
      window.removeEventListener('boosthub:realtime', handleCustomRealtime);
      eventSource.close();
    };
  }, [userProfile, refreshBadgesCount, showToast]);

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
    const resolvedProfile =
      res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
    setAuthToken(res.token);
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
    const resolvedProfile =
      res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
    setAuthToken(res.token);
    setUserProfile(resolvedProfile);
    refreshBadgesCount();
    showToast(
      resolvedProfile?.onboardingCompleted
        ? `Welcome back, ${resolvedProfile.displayName}!`
        : 'Account created! Complete your interests to start.',
      'success'
    );
  };

  const loginWithGoogle = async (
    avatarUrl?: string,
    googleEmail?: string,
    googleDisplayName?: string
  ) => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      setAuthToken(idToken);
      if (avatarUrl && avatarUrl.trim()) {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatarUrl: avatarUrl.trim() }),
        });
      }
      const profile = await apiFetch<UserProfile>('/api/me');
      setUserProfile(profile);
      refreshBadgesCount();
      showToast(`Signed in as ${profile.displayName}`, 'success');
    } catch (err: any) {
      const errMsg = String(err?.code || err?.message || '');
      if (
        errMsg.includes('unauthorized-domain') ||
        errMsg.includes('operation-not-supported') ||
        errMsg.includes('popup-blocked') ||
        (typeof window !== 'undefined' &&
          window.location.hostname.endsWith('.github.io'))
      ) {
        const cleanEmail = (googleEmail || '').trim().toLowerCase();
        if (!cleanEmail) {
          const promptErr: any = new Error('NEEDS_GOOGLE_EMAIL');
          promptErr.code = 'NEEDS_GOOGLE_EMAIL';
          throw promptErr;
        }
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
        const resolvedProfile =
          res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
        setAuthToken(res.token);
        setUserProfile(resolvedProfile);
        refreshBadgesCount();
        showToast(`Signed in as ${resolvedProfile.displayName}`, 'success');
        return;
      }
      throw err;
    }
  };

  const resetPassword = async (email: string, newPassword?: string) => {
    if (newPassword) {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword }),
      });
    } else {
      await sendPasswordResetEmail(auth, email);
    }
    showToast('Password updated successfully. You can now sign in.', 'success');
  };

  const logout = async () => {
    setAuthToken(null);
    setUserProfile(null);
    try {
      await signOut(auth);
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
