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
  clearAllUserCaches,
} from '../services/api';
import {
  showBrowserSystemNotification,
  enableBackgroundPushNotifications,
} from '../services/pushNotifications';
import {
  supabase,
  ADMIN_ABBA_UUID,
  ADMIN_ABBA_ALT_UUID,
} from '../lib/supabase';
import { getBShopItemByCode } from '../data/bshopCatalog';
import { BShopUserState, UserProfile } from '../types';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface AuthContextValue {
  userProfile: UserProfile | null;
  balance: number;
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
  purchaseBShopItem: (
    itemCode: string,
    quantity?: number
  ) => Promise<{
    state: BShopUserState;
    unboxedReward?: {
      code: string;
      name: string;
      icon: string;
      rarity: string;
      quantity: number;
    } | null;
    newBalance: number;
    message: string;
  }>;
  sendBShopGift: (params: {
    receiverId: string;
    itemCode: string;
    quantity?: number;
    message?: string;
    useInventory?: boolean;
    ownedCount?: number;
  }) => Promise<{
    state: BShopUserState;
    newBalance: number;
    message: string;
  }>;
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
    (profile.id === ADMIN_ABBA_UUID || profile.id === ADMIN_ABBA_ALT_UUID) &&
    (String(profile.username || '').toLowerCase() === 'abba' ||
      String(profile.email || '')
        .trim()
        .toLowerCase() === 'princeabba96@gmail.com');
  if (isOwnerAdmin) {
    return {
      ...profile,
      displayName: 'Prince Abba',
      username: 'Abba',
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      professionalMode: true,
      monetizationEligible: true,
      boostPoints: 999999999,
      balance: 999999999,
    };
  }
  const syncedBp = Number(profile.balance ?? profile.boostPoints ?? 0);
  return {
    ...profile,
    boostPoints: syncedBp,
    balance: syncedBp,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAuthToken()));
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
    if (!token || !token.startsWith('sb_user_')) return;
    const uid = token.replace('sb_user_', '').trim();
    if (!uid) return;

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

  // Initial load from Supabase real backend for the currently signed-in account
  useEffect(() => {
    let isMounted = true;

    const loadInitialSupabaseSession = async () => {
      try {
        const currentTok = getAuthToken();
        if (!currentTok) {
          if (isMounted) {
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }

        const profile = await apiFetch<UserProfile>('/api/me');
        if (isMounted && profile && profile.id) {
          setUserProfile(profile);
          refreshBadgesCount();
        } else if (isMounted) {
          setAuthToken(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.warn('Error loading Supabase profile:', err);
        if (isMounted) {
          setAuthToken(null);
          setUserProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialSupabaseSession();

    return () => {
      isMounted = false;
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

  // Subscribe to Supabase Realtime Postgres Changes across all tables + background notification lock-screen delivery
  useEffect(() => {
    if (!userProfile) return;

    const seenNotifIds = new Set<string>();
    const mountIso = new Date(Date.now() - 5000).toISOString();

    const pushEvent = (type: string, payload: any) => {
      setRealtimeEvents((prev) => [
        ...prev.slice(-25),
        { type, payload, timestamp: Date.now() },
      ]);
    };

    const deliverIncomingNotificationRow = (row: any) => {
      if (!row || !row.id) return;
      const rowId = String(row.id);
      if (seenNotifIds.has(rowId)) return;
      seenNotifIds.add(rowId);

      if (row.type === 'gift_tx' || row.type === 'test_rt') return;

      const isForMe =
        String(row.target_user) === userProfile.id ||
        String(row.actor_user) === userProfile.id;
      if (!isForMe) return;

      const notifType = String(row.type || 'notification').toLowerCase();
      let deepLink = '?tab=notifications';
      if (notifType === 'like' || notifType === 'share' || notifType === 'mention') {
        deepLink = row.post_id
          ? `?tab=home&post=${encodeURIComponent(String(row.post_id))}`
          : '?tab=notifications';
      } else if (notifType === 'comment' || notifType === 'reply') {
        deepLink = row.post_id
          ? `?tab=home&post=${encodeURIComponent(String(row.post_id))}&comments=1`
          : '?tab=notifications';
      } else if (notifType === 'follow') {
        deepLink = row.actor_user
          ? `?tab=me&profile=${encodeURIComponent(String(row.actor_user))}`
          : '?tab=notifications';
      } else if (notifType === 'friend_request' || notifType === 'friend_accept') {
        deepLink = '?tab=friends';
      } else if (notifType === 'dm' || notifType === 'message' || notifType === 'boost_bot') {
        deepLink = row.actor_user
          ? `?messages=${encodeURIComponent(String(row.actor_user))}`
          : '?tab=friends';
      } else if (notifType === 'gift' || notifType === 'badge') {
        deepLink = '?tab=me&mode=gifts';
      }

      if (String(row.target_user) === userProfile.id) {
        if (notifType === 'dm') {
          showToast(`${row.title || 'New Message'}: ${row.body || ''}`, 'info');
        } else {
          showToast(`${row.title || 'Alert'}: ${row.body || ''}`, 'info');
        }
      }

      showBrowserSystemNotification(
        row.title || 'BoostHub Alert',
        row.body || 'You have a new notification on BoostHub',
        deepLink,
        `boosthub-notif-${rowId}`,
        {
          type: notifType,
          entityId: String(row.post_id || row.actor_user || ''),
          actorId: String(row.actor_user || ''),
        }
      );
    };

    // Seed existing notifications so only new notifications fire lock-screen alerts
    supabase
      .from('notifications')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        (data || []).forEach((n: any) => {
          if (n?.id) seenNotifIds.add(String(n.id));
        });
      });

    const pollTimer = window.setInterval(async () => {
      try {
        const { data: recentRows } = await supabase
          .from('notifications')
          .select('*')
          .gt('created_at', mountIso)
          .order('created_at', { ascending: false })
          .limit(10);
        if (recentRows && recentRows.length > 0) {
          for (const r of [...recentRows].reverse()) {
            if (!seenNotifIds.has(String(r.id))) {
              deliverIncomingNotificationRow(r);
              pushEvent('notification', r);
              refreshBadgesCount();
            }
          }
        }
      } catch {
        // ignore transient network error
      }
    }, 4000);

    const channel = supabase
      .channel('boosthub-global-realtime', {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'sync' }, (msg) => {
        const data = msg?.payload || {};
        if (data.type === 'notification_created' && data.notification) {
          deliverIncomingNotificationRow(data.notification);
          pushEvent('notification', data.notification);
          refreshBadgesCount();
        } else if (data.type === 'post_comment' && data.postId) {
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
        } else if (data.type === 'post_view' && data.postId) {
          if (typeof data.viewsCount === 'number') {
            updateCachedPostStats(data.postId, {
              viewsCount: data.viewsCount,
            });
          }
          pushEvent('post_view', data);
        } else if (data.type === 'follow_update') {
          pushEvent('follow_update', data);
          refreshProfile();
          refreshBadgesCount();
        } else if (
          data.type === 'balance_updated' &&
          data.userId === userProfile.id &&
          typeof data.balance === 'number'
        ) {
          setUserProfileState((prev) =>
            prev
              ? {
                  ...prev,
                  boostPoints: data.balance,
                  balance: data.balance,
                  xp: typeof data.xp === 'number' ? data.xp : prev.xp,
                }
              : prev
          );
          pushEvent('balance_updated', data);
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const newRow: any = payload.new;
          if (newRow?.id && typeof newRow.views === 'number') {
            updateCachedPostStats(newRow.id, {
              viewsCount: Number(newRow.views),
            });
          }
          pushEvent('posts_changed', payload.new || payload.old);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_views' },
        (payload) => {
          pushEvent('post_view', payload.new || payload.old);
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
          if (payload.eventType === 'INSERT' && row) {
            deliverIncomingNotificationRow(row);
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
      window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [userProfile, refreshProfile, refreshBadgesCount, showToast]);

  const loginWithEmail = async (
    email: string,
    password: string,
    avatarUrl?: string
  ) => {
    clearAllUserCaches();
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
    showToast(`Welcome, ${resolvedProfile.displayName}!`, 'success');
  };

  const signupWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    username: string,
    avatarUrl?: string
  ) => {
    clearAllUserCaches();
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
    const rawEmail = (googleEmail || '').trim().toLowerCase();
    if (!rawEmail) {
      const err: any = new Error('NEEDS_GOOGLE_EMAIL');
      err.code = 'NEEDS_GOOGLE_EMAIL';
      throw err;
    }
    clearAllUserCaches();
    const cleanEmail = rawEmail;
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
        isGoogleAuth: true,
      }),
    });
    setAuthToken(res.token);
    const resolvedProfile =
      res.profile || res.user || (await apiFetch<UserProfile>('/api/me'));
    setUserProfile(resolvedProfile);
    refreshBadgesCount();
    showToast(`Signed in as ${resolvedProfile.displayName} (${cleanEmail})`, 'success');
  };

  const resetPassword = async (email: string, newPassword?: string) => {
    await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
    showToast('Password updated successfully.', 'success');
  };

  const purchaseBShopItem = useCallback(
    async (itemCode: string, quantity = 1) => {
      const item = getBShopItemByCode(itemCode);
      if (!item) {
        throw new Error('Selected item was not found in B-Shop.');
      }
      const cleanQty = Math.max(1, Math.min(50, Number(quantity) || 1));
      const totalCost = item.costBp * cleanQty;
      const snapshotProfile = userProfile;
      const isOwnerAdmin =
        snapshotProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com';
      const currentBalance = isOwnerAdmin
        ? 999999999
        : Number(
            snapshotProfile?.balance ?? snapshotProfile?.boostPoints ?? 0
          );

      if (!isOwnerAdmin && currentBalance < totalCost) {
        throw new Error(
          `Not enough Boost Points! You need ${totalCost.toLocaleString()} BP (you have ${currentBalance.toLocaleString()} BP).`
        );
      }

      // Optimistic balance decrement in central state prior to Supabase transaction commit
      if (snapshotProfile && !isOwnerAdmin) {
        const optimisticBalance = Math.max(0, currentBalance - totalCost);
        setUserProfile({
          ...snapshotProfile,
          boostPoints: optimisticBalance,
          balance: optimisticBalance,
        });
      }

      try {
        const res = await apiFetch<{
          state: BShopUserState;
          unboxedReward?: {
            code: string;
            name: string;
            icon: string;
            rarity: string;
            quantity: number;
          } | null;
          newBalance?: number;
          message: string;
        }>('/api/bshop/buy', {
          method: 'POST',
          body: JSON.stringify({ itemCode: item.code, quantity: cleanQty }),
        });

        const committedBalance = isOwnerAdmin
          ? 999999999
          : Number(
              res.newBalance ??
                res.state?.balance ??
                res.state?.boostPoints ??
                Math.max(0, currentBalance - totalCost)
            );

        if (snapshotProfile) {
          setUserProfile({
            ...snapshotProfile,
            boostPoints: committedBalance,
            balance: committedBalance,
            xp: res.state?.xp ?? snapshotProfile.xp,
            equippedFrame:
              res.state?.equippedFrame ?? snapshotProfile.equippedFrame,
            equippedBadge:
              res.state?.equippedBadge ?? snapshotProfile.equippedBadge,
            equippedNameStyle:
              res.state?.equippedNameStyle ?? snapshotProfile.equippedNameStyle,
          });
        }
        await refreshProfile();

        return {
          state: {
            ...res.state,
            boostPoints: committedBalance,
            balance: committedBalance,
          },
          unboxedReward: res.unboxedReward || null,
          newBalance: committedBalance,
          message: res.message,
        };
      } catch (err) {
        // Roll back optimistic central state if Supabase transaction fails
        if (snapshotProfile) {
          setUserProfile(snapshotProfile);
        }
        throw err;
      }
    },
    [refreshProfile, setUserProfile, userProfile]
  );

  const sendBShopGift = useCallback(
    async (params: {
      receiverId: string;
      itemCode: string;
      quantity?: number;
      message?: string;
      useInventory?: boolean;
      ownedCount?: number;
    }) => {
      const item = getBShopItemByCode(params.itemCode);
      if (!item) {
        throw new Error('Selected gift was not found in B-Shop.');
      }
      const cleanQty = Math.max(1, Math.min(99, Number(params.quantity) || 1));
      const snapshotProfile = userProfile;
      const isOwnerAdmin =
        snapshotProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com';
      const currentBalance = isOwnerAdmin
        ? 999999999
        : Number(
            snapshotProfile?.balance ?? snapshotProfile?.boostPoints ?? 0
          );

      const owned = Math.max(0, Number(params.ownedCount || 0));
      const fromInv =
        !isOwnerAdmin && params.useInventory ? Math.min(owned, cleanQty) : 0;
      const toBuyQty = Math.max(0, cleanQty - fromInv);
      const bpCost = isOwnerAdmin ? 0 : item.costBp * toBuyQty;

      if (!isOwnerAdmin && currentBalance < bpCost) {
        throw new Error(
          `Not enough Boost Points! Sending ${item.icon} ${item.name} ×${cleanQty} requires ${bpCost.toLocaleString()} BP (you have ${currentBalance.toLocaleString()} BP).`
        );
      }

      if (snapshotProfile && !isOwnerAdmin && bpCost > 0) {
        const optimisticBalance = Math.max(0, currentBalance - bpCost);
        setUserProfile({
          ...snapshotProfile,
          boostPoints: optimisticBalance,
          balance: optimisticBalance,
        });
      }

      try {
        const res = await apiFetch<{
          state: BShopUserState;
          newBalance?: number;
          message: string;
        }>('/api/bshop/send-gift', {
          method: 'POST',
          body: JSON.stringify({
            receiverId: params.receiverId,
            itemCode: item.code,
            quantity: cleanQty,
            message: params.message || '',
            useInventory: Boolean(params.useInventory),
          }),
        });

        const committedBalance = isOwnerAdmin
          ? 999999999
          : Number(
              res.newBalance ??
                res.state?.balance ??
                res.state?.boostPoints ??
                Math.max(0, currentBalance - bpCost)
            );

        if (snapshotProfile) {
          setUserProfile({
            ...snapshotProfile,
            boostPoints: committedBalance,
            balance: committedBalance,
            xp: res.state?.xp ?? snapshotProfile.xp,
          });
        }
        await refreshProfile();

        return {
          state: {
            ...res.state,
            boostPoints: committedBalance,
            balance: committedBalance,
          },
          newBalance: committedBalance,
          message: res.message,
        };
      } catch (err) {
        if (snapshotProfile) {
          setUserProfile(snapshotProfile);
        }
        throw err;
      }
    },
    [refreshProfile, setUserProfile, userProfile]
  );

  const logout = async () => {
    clearAllUserCaches();
    setAuthToken(null);
    setUserProfile(null);
    setUnreadMessages(0);
    setUnreadNotifications(0);
    showToast('Signed out of BoostHub.', 'info');
  };

  const resolvedBalance =
    userProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com'
      ? 999999999
      : Number(userProfile?.balance ?? userProfile?.boostPoints ?? 0);

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        balance: resolvedBalance,
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
        purchaseBShopItem,
        sendBShopGift,
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
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
