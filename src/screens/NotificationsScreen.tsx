import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Award,
  Target,
  Sparkles,
  CheckCheck,
  Send,
  Smartphone,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  Calendar,
  Gift,
} from 'lucide-react';
import { NotificationItem } from '../types';
import { apiFetch } from '../services/api';
import {
  getBrowserPushPermissionState,
  disableBackgroundPushNotifications,
  triggerTestPushNotification,
  ensureServiceWorkerRegistration,
} from '../services/pushNotifications';
import { supabase, ADMIN_ABBA_UUID } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { formatRelativeTime } from '../utils/format';

interface NotificationsScreenProps {
  onSelectUser: (userId: string) => void;
  onOpenNotification?: (notif: NotificationItem) => void;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onSelectUser,
  onOpenNotification,
}) => {
  const { userProfile, refreshBadgesCount, realtimeEvents, showToast } =
    useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  // Background Web Push state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const getDeletedIdsSet = (): Set<string> => {
    try {
      const key = `boosthub_deleted_notifs_${userProfile?.id || 'guest'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return new Set(JSON.parse(raw));
      }
    } catch {}
    return new Set();
  };

  const loadNotifications = async () => {
    try {
      const list = await apiFetch<NotificationItem[]>('/api/notifications');
      const deletedSet = getDeletedIdsSet();
      const filtered = Array.isArray(list)
        ? list.filter((n) => !deletedSet.has(String(n.id)))
        : [];
      setNotifications(filtered);
      await refreshBadgesCount();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const refreshPushState = async () => {
    try {
      const state = await getBrowserPushPermissionState();
      if (state.subscribed) {
        setPushEnabled(true);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    refreshPushState();
  }, []);

  useEffect(() => {
    if (realtimeEvents.length > 0) {
      loadNotifications();
    }
  }, [realtimeEvents]);

  async function enablePush() {
    try {
      setIsActivating(true);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Permission denied', 'error');
        setIsActivating(false);
        return;
      }

      await ensureServiceWorkerRegistration();
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey =
        (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ||
        'BCLWPiFzL_20dC_qTCyZVHb0nYp0sV2tPvCP8yhgRrxZUcfaWJhhtAxZsIcB3NaSB8ebv20905tJRcKzqFevkIk';

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey
          ) as unknown as BufferSource,
        });
      }

      const subJson = subscription.toJSON();
      const { p256dh, auth } = subJson.keys || {};

      // Resolve user_id from supabase.auth or users('Abba')
      const authUserRes = await supabase.auth.getUser();
      const abbaUserRes = await supabase
        .from('users')
        .select('id')
        .eq('username', 'Abba')
        .maybeSingle();

      const resolvedUserId =
        authUserRes.data.user?.id ||
        abbaUserRes.data?.id ||
        userProfile?.id ||
        null;

      // SAVE CORRECTLY - Table has endpoint, p256dh, auth, subscription
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: resolvedUserId,
          endpoint: subscription.endpoint,
          p256dh: p256dh || '',
          auth: auth || '',
          subscription: subJson,
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (error) {
        // Fallback if resolvedUserId is in profiles table and not yet in users table
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
        const { error: fallbackError } = await supabase
          .from('push_subscriptions')
          .upsert(
            {
              user_id: null,
              endpoint: subscription.endpoint,
              p256dh: p256dh || '',
              auth: auth || '',
              subscription: {
                ...subJson,
                userId: userProfile?.id || ADMIN_ABBA_UUID,
              },
            },
            { onConflict: 'user_id,endpoint' }
          );
        if (fallbackError) throw fallbackError;
      }

      try {
        window.localStorage.setItem('boosthub_push_enabled', 'true');
      } catch {
        // ignore
      }

      setPushEnabled(true);
      showToast('Push Enabled!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed: ' + (err?.message || 'Could not enable push'), 'error');
    } finally {
      setIsActivating(false);
    }
  }

  const handleDisablePush = async () => {
    setIsActivating(true);
    try {
      await disableBackgroundPushNotifications();
      setPushEnabled(false);
      showToast('Push notifications disabled for this device.', 'info');
    } catch {
      showToast('Failed to update push settings.', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    try {
      await triggerTestPushNotification();
      showToast(
        'Test push notification sent! Check your device system tray.',
        'success'
      );
    } catch (err: any) {
      showToast(
        err.message || 'Failed to send test push notification.',
        'error'
      );
    } finally {
      setTestingPush(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshBadgesCount();
      showToast('All notifications marked as read', 'info');
    } catch {
      showToast('Failed to update notifications.', 'error');
    }
  };

  const handleDeleteNotification = async (
    notificationId: string | number,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const idStr = String(notificationId);
    try {
      const key = `boosthub_deleted_notifs_${userProfile?.id || 'guest'}`;
      try {
        const deletedSet = getDeletedIdsSet();
        deletedSet.add(idStr);
        localStorage.setItem(key, JSON.stringify(Array.from(deletedSet)));
      } catch {}

      await apiFetch('/api/notifications/delete', {
        method: 'POST',
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) => prev.filter((n) => String(n.id) !== idStr));
      if (selectedNotif && String(selectedNotif.id) === idStr) {
        setSelectedNotif(null);
      }
      await refreshBadgesCount();
      showToast('Notification deleted.', 'info');
    } catch {
      showToast('Could not delete notification.', 'error');
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      const key = `boosthub_deleted_notifs_${userProfile?.id || 'guest'}`;
      try {
        const deletedSet = getDeletedIdsSet();
        notifications.forEach((n) => deletedSet.add(String(n.id)));
        localStorage.setItem(key, JSON.stringify(Array.from(deletedSet)));
      } catch {}

      await apiFetch('/api/notifications/delete', {
        method: 'POST',
        body: JSON.stringify({ notificationId: 'all' }),
      });
      setNotifications([]);
      setSelectedNotif(null);
      await refreshBadgesCount();
      showToast('All notifications cleared.', 'info');
    } catch {
      showToast('Could not clear notifications.', 'error');
    }
  };

  const handleMarkOneRead = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await apiFetch('/api/notifications/read', {
          method: 'POST',
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        await refreshBadgesCount();
      } catch {
        // ignore
      }
    }
    // Open detailed view modal so user sees full message details!
    setSelectedNotif(notif);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
      case 'story_reaction':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'comment':
      case 'reply':
      case 'story_reply':
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'follow':
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-purple-400" />;
      case 'mission':
        return <Target className="w-4 h-4 text-amber-400" />;
      case 'badge':
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  const displayed =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="min-h-full bg-[#0B1220] max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-5 rounded-3xl">
      {/* Top: BoostHub header, Notifications title, subtitle & All / Unread / Mark all read */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">
            BoostHub
          </span>
          <h1 className="font-display text-2xl font-bold text-white">
            Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alerts for likes, comments, follows, friend requests,
            missions, and badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#131A2A] border border-white/10 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-3 py-2 rounded-xl bg-[#131A2A] hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4 text-blue-400" />
            <span>Mark all read</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="px-3 py-2 rounded-xl bg-[#131A2A] hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 disabled:opacity-40 text-xs font-medium text-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            title="Delete all notifications"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        </div>
      </div>

      {/* Background Push Notifications card: dark #131A2A with blue icon */}
      <div className="bg-[#131A2A] border border-blue-500/25 rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border bg-blue-600/20 border-blue-500/30 text-blue-400">
              {pushEnabled ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Background Push Notifications
                </h2>
                <span
                  className={`text-xs font-semibold ${
                    pushEnabled ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  · {pushEnabled ? 'Enabled ✓' : 'Not Enabled Yet'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receive instant phone notification tray alerts whenever{' '}
                <strong className="text-amber-300">BOOST BOT</strong> messages
                you, or someone{' '}
                <strong className="text-white">likes your videos</strong>,{' '}
                <strong className="text-white">comments</strong>,{' '}
                <strong className="text-white">follows you</strong>, or{' '}
                <strong className="text-white">messages you</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={enablePush}
              disabled={isActivating}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 shadow-lg whitespace-nowrap cursor-pointer transition-all ${
                pushEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
              } disabled:opacity-50`}
            >
              <BellRing className="w-4 h-4" />
              <span>
                {isActivating
                  ? 'Activating...'
                  : pushEnabled
                    ? 'Push Enabled ✓'
                    : 'Enable Push Alerts'}
              </span>
            </button>

            {pushEnabled && (
              <>
                <button
                  onClick={handleSendTestPush}
                  disabled={testingPush}
                  className="px-3.5 py-2.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingPush ? 'Sending...' : 'Send Test Push'}</span>
                </button>
                <button
                  onClick={handleDisablePush}
                  disabled={isActivating}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Disable</span>
                </button>
              </>
            )}
          </div>
        </div>

        {pushEnabled && (
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Web Push Service Worker registered. Background alerts for video
                likes, follows, and comments are live.
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Notifications List / Empty State */}
      <div className="bg-[#131A2A] border border-white/10 rounded-3xl divide-y divide-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading notifications...
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-medium text-white">
              No notifications to display
            </p>
            <p className="text-xs text-slate-400">
              When others interact with your posts, stories, or profile, you'll
              see it here immediately.
            </p>
          </div>
        ) : (
          displayed.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkOneRead(n)}
              className={`w-full p-4 flex items-start gap-3.5 text-left transition-colors cursor-pointer ${
                n.isRead
                  ? 'hover:bg-white/[0.02]'
                  : 'bg-blue-600/10 hover:bg-blue-600/15'
              }`}
            >
              {n.actor ? (
                <Avatar
                  src={n.actor.avatarUrl}
                  name={n.actor.displayName}
                  size="md"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getIcon(n.type)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-extrabold tracking-wide truncate ${
                      n.title === 'BOOST BOT' ||
                      n.actorId === 'boost_bot_official'
                        ? 'text-amber-300'
                        : 'text-white'
                    }`}
                  >
                    {n.title === 'BOOST BOT' ||
                    n.actorId === 'boost_bot_official'
                      ? 'BOOST BOT'
                      : n.title}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap break-words">
                  {n.body}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                )}
                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(n.id, e)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/25 transition-all cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Details Modal (Tapping notification shows full details) */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0E1526] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  {getIcon(selectedNotif.type)}
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">
                    {selectedNotif.type.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-slate-400">
                    {formatRelativeTime(selectedNotif.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sender / Actor Info */}
            {selectedNotif.actor && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={selectedNotif.actor.avatarUrl}
                    name={selectedNotif.actor.displayName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate inline-flex items-center gap-1.5">
                      <span>{selectedNotif.actor.displayName}</span>
                      {selectedNotif.actor.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      @{selectedNotif.actor.username}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotif(null);
                    onSelectUser(selectedNotif.actor!.id);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            )}

            {/* Notification Title & Full Body */}
            <div className="space-y-2">
              <h3
                className={`text-base font-extrabold tracking-wide ${
                  selectedNotif.title === 'BOOST BOT' ||
                  selectedNotif.actorId === 'boost_bot_official'
                    ? 'text-amber-300'
                    : 'text-white'
                }`}
              >
                {selectedNotif.title}
              </h3>
              <div className="p-4 rounded-2xl bg-[#070B16] border border-white/10 text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                {selectedNotif.body}
              </div>
            </div>

            {/* Type-specific highlight */}
            {selectedNotif.type === 'gift' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shrink-0">
                  🎁
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-300">
                    Virtual Gift Received
                  </p>
                  <p className="text-slate-300 mt-0.5">
                    This gift adds directly to your creator recognition points and Boost Points.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => handleDeleteNotification(selectedNotif.id, e)}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/35 text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Notification</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedNotif.postId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotif(null);
                      if (onOpenNotification) {
                        onOpenNotification(selectedNotif);
                      } else {
                        window.location.search = `?tab=home&post=${encodeURIComponent(
                          String(selectedNotif.postId)
                        )}`;
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Post</span>
                  </button>
                )}
                {(selectedNotif.title === 'BOOST BOT' ||
                  selectedNotif.actorId === 'boost_bot_official') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotif(null);
                      window.location.search = '?messages=boost_bot_official';
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open Chat</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
