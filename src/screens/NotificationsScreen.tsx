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
} from 'lucide-react';
import { NotificationItem } from '../types';
import { apiFetch } from '../services/api';
import {
  getBrowserPushPermissionState,
  enableBackgroundPushNotifications,
  disableBackgroundPushNotifications,
  triggerTestPushNotification,
} from '../services/pushNotifications';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { formatRelativeTime } from '../utils/format';

interface NotificationsScreenProps {
  onSelectUser: (userId: string) => void;
  onOpenNotification?: (notif: NotificationItem) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onSelectUser,
  onOpenNotification,
}) => {
  const { refreshBadgesCount, realtimeEvents, showToast } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  // Background Web Push state
  const [pushSupported, setPushSupported] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const [deviceCount, setDeviceCount] = useState(0);
  const [pushBusy, setPushBusy] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const loadNotifications = async () => {
    try {
      const list = await apiFetch<NotificationItem[]>('/api/notifications');
      setNotifications(list);
      await refreshBadgesCount();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const refreshPushState = async () => {
    const state = await getBrowserPushPermissionState();
    setPushSupported(state.supported);
    setPushPermission(state.permission);
    setPushSubscribed(state.subscribed);
    setDeviceCount(state.deviceCount);
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

  const handleEnablePush = async () => {
    setPushBusy(true);
    try {
      await enableBackgroundPushNotifications();
      await refreshPushState();
      showToast(
        'Background Push Notifications enabled! You will receive alerts even when BoostHub is closed.',
        'success'
      );
    } catch (err: any) {
      showToast(
        err.message || 'Could not enable push notifications.',
        'error'
      );
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    setPushBusy(true);
    try {
      await disableBackgroundPushNotifications();
      await refreshPushState();
      showToast('Background Push Notifications disabled for this device.', 'info');
    } catch {
      showToast('Failed to update push settings.', 'error');
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await triggerTestPushNotification();
      if (res.sent > 0) {
        showToast(
          'Test push notification sent! Check your device system tray.',
          'success'
        );
      } else {
        showToast(
          'Please enable Push Alerts on this device first to receive a test notification.',
          'info'
        );
      }
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
    if (onOpenNotification) {
      onOpenNotification(notif);
    } else if (notif.actorId) {
      onSelectUser(notif.actorId);
    }
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alerts for likes, comments, follows, friend requests,
            missions, and badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#0B1021] border border-white/10 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
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
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4 text-blue-400" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Background Web Push Notifications Card (Works Even When App Is Closed) */}
      <div className="bg-gradient-to-r from-[#0D152D] via-[#0F1B3D] to-[#141236] border border-blue-500/25 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                pushSubscribed
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
              }`}
            >
              {pushSubscribed ? (
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
                <span className="text-xs text-slate-400">
                  ·{' '}
                  {pushSubscribed
                    ? `Active (${deviceCount} ${deviceCount === 1 ? 'device' : 'devices'})`
                    : pushPermission === 'denied'
                      ? 'Blocked in Browser Settings'
                      : 'Not Enabled Yet'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receive instant phone notification tray alerts (right where your
                other mobile app notifications appear) whenever{' '}
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
            {!pushSubscribed ? (
              <button
                onClick={handleEnablePush}
                disabled={pushBusy || !pushSupported}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/25 whitespace-nowrap cursor-pointer"
              >
                <BellRing className="w-4 h-4" />
                <span>
                  {pushBusy ? 'Activating...' : 'Enable Push Alerts'}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSendTestPush}
                  disabled={testingPush}
                  className="px-3.5 py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingPush ? 'Sending...' : 'Send Test Push'}</span>
                </button>
                <button
                  onClick={handleDisablePush}
                  disabled={pushBusy}
                  className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Disable</span>
                </button>
              </>
            )}
          </div>
        </div>

        {pushSubscribed && (
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

      <div className="bg-[#0B1021] border border-white/10 rounded-3xl divide-y divide-white/5 overflow-hidden">
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
            <button
              key={n.id}
              onClick={() => handleMarkOneRead(n)}
              className={`w-full p-4 flex items-start gap-3.5 text-left transition-colors ${
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

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
