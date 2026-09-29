import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  UserPlus,
  UserCheck,
  MessageSquare,
  Share2,
  Ban,
  Flag,
  Settings,
  BarChart3,
  ShieldAlert,
  Award,
  Target,
  Camera,
  Bookmark,
  Grid,
  Video,
  Image as ImageIcon,
  Info,
  LogOut,
  X,
  Check,
  Sparkles,
  Trash2,
  EyeOff,
  ArrowLeft,
  BellRing,
  BellOff,
  Send,
  Gift,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import {
  BShopUserState,
  INTEREST_CATEGORIES,
  PostItem,
  UserProfile,
} from '../types';
import {
  getBShopItemByCode,
  getFrameRingClasses,
  getNameStyleClasses,
} from '../data/bshopCatalog';
import { apiFetch } from '../services/api';
import {
  getBrowserPushPermissionState,
  enableBackgroundPushNotifications,
  disableBackgroundPushNotifications,
  triggerTestPushNotification,
} from '../services/pushNotifications';
import { uploadMediaWithProgress } from '../storage/mediaUpload';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { CreatorDashboard } from '../components/CreatorDashboard';
import { formatCompactNumber, formatRelativeTime } from '../utils/format';

interface ProfileScreenProps {
  viewedUserId: string | null;
  onBackToMyProfile: () => void;
  onSelectUser: (userId: string) => void;
  onOpenComments: (post: PostItem) => void;
  onOpenShare: (post: PostItem) => void;
  onOpenMessageWith: (partner: UserProfile) => void;
  onOpenBShop?: (recipient?: UserProfile | null) => void;
  initialMainMode?: 'profile' | 'dashboard' | 'gifts' | 'settings' | 'admin';
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  viewedUserId,
  onBackToMyProfile,
  onSelectUser,
  onOpenComments,
  onOpenShare,
  onOpenMessageWith,
  onOpenBShop,
  initialMainMode,
}) => {
  const { userProfile, refreshProfile, logout, showToast } = useAuth();
  const targetUserId = viewedUserId || userProfile?.id || '';
  const isMe = targetUserId === userProfile?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostItem[]>([]);
  const [activeMainMode, setActiveMainMode] = useState<
    'profile' | 'dashboard' | 'gifts' | 'settings' | 'admin'
  >(initialMainMode || 'profile');
  const [myGiftsState, setMyGiftsState] = useState<BShopUserState | null>(null);
  const [updatingGiftSettings, setUpdatingGiftSettings] = useState(false);
  const [contentTab, setContentTab] = useState<
    'posts' | 'videos' | 'photos' | 'saved' | 'about'
  >('posts');

  // Followers / Following Modal
  const [followModalType, setFollowModalType] = useState<
    'followers' | 'following' | null
  >(null);
  const [followLists, setFollowLists] = useState<{
    followers: UserProfile[];
    following: UserProfile[];
  }>({ followers: [], following: [] });

  // Creator Dashboard Data
  const [dashboardData, setDashboardData] = useState<any | null>(null);

  // Settings State
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [whoCanMessage, setWhoCanMessage] = useState<
    'everyone' | 'friends' | 'nobody'
  >('everyone');
  const [commentControl, setCommentControl] = useState<
    'everyone' | 'followers' | 'nobody'
  >('everyone');
  const [isPrivate, setIsPrivate] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushDeviceCount, setPushDeviceCount] = useState(0);
  const [pushBusy, setPushBusy] = useState(false);

  // Admin Console Data
  const [adminData, setAdminData] = useState<any | null>(null);
  const [botTargetMode, setBotTargetMode] = useState<'all' | 'user'>('all');
  const [botSelectedUserId, setBotSelectedUserId] = useState<string>('');
  const [botMessageContent, setBotMessageContent] = useState<string>('');
  const [sendingBotMessage, setSendingBotMessage] = useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfileAndPosts = async () => {
    if (!targetUserId) return;
    try {
      const [prof, postsList] = await Promise.all([
        apiFetch<UserProfile>(`/api/profiles/${targetUserId}`),
        apiFetch<PostItem[]>(
          `/api/posts?tab=new&limit=50&offset=0&authorId=${encodeURIComponent(
            targetUserId
          )}`
        ),
      ]);
      setProfile(prof);
      setUserPosts(postsList);

      if (isMe && prof) {
        setEditDisplayName(prof.displayName);
        setEditUsername(prof.username);
        setEditBio(prof.bio || '');
        setWhoCanMessage(prof.whoCanMessage || 'everyone');
        setCommentControl(prof.commentControl || 'everyone');
        setIsPrivate(Boolean(prof.isPrivate));
        setNotificationsEnabled(prof.notificationsEnabled !== false);
        setEditInterests(prof.interests || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (initialMainMode && isMe) {
      setActiveMainMode(initialMainMode);
    } else {
      setActiveMainMode('profile');
    }
    setContentTab('posts');
    loadProfileAndPosts();
  }, [targetUserId, initialMainMode]);

  useEffect(() => {
    if (isMe && contentTab === 'saved') {
      apiFetch<PostItem[]>('/api/saved-posts')
        .then(setSavedPosts)
        .catch(() => {});
    }
  }, [isMe, contentTab]);

  useEffect(() => {
    if (isMe && activeMainMode === 'gifts') {
      apiFetch<BShopUserState>('/api/bshop/state')
        .then(setMyGiftsState)
        .catch(() => {});
    } else if (isMe && activeMainMode === 'settings') {
      apiFetch<UserProfile[]>('/api/blocked-users')
        .then(setBlockedUsers)
        .catch(() => {});
      getBrowserPushPermissionState()
        .then((st) => {
          setPushSubscribed(st.subscribed);
          setPushDeviceCount(st.deviceCount);
        })
        .catch(() => {});
    } else if (
      isMe &&
      activeMainMode === 'admin' &&
      userProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com'
    ) {
      apiFetch('/api/admin/overview')
        .then(setAdminData)
        .catch(() => {});
    }
  }, [isMe, activeMainMode, userProfile?.email]);

  const handleUpdateGiftSettings = async (payload: {
    giftPrivacy?: 'public' | 'showcase_only' | 'private';
    showcaseGifts?: string[];
  }) => {
    setUpdatingGiftSettings(true);
    try {
      const updated = await apiFetch<BShopUserState>('/api/bshop/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setMyGiftsState(updated);
      await refreshProfile();
      await loadProfileAndPosts();
      showToast('Gift preferences saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not update gift settings.', 'error');
    } finally {
      setUpdatingGiftSettings(false);
    }
  };

  const handleToggleShowcaseGift = async (giftCode: string) => {
    if (!myGiftsState) return;
    const current = myGiftsState.showcaseGifts || [];
    const exists = current.includes(giftCode);
    if (exists) {
      if (current.length <= 3) {
        showToast(
          'Your Gift Showcase displays between 3 and 6 favorite gifts.',
          'info'
        );
        return;
      }
      await handleUpdateGiftSettings({
        showcaseGifts: current.filter((c) => c !== giftCode),
      });
    } else {
      if (current.length >= 6) {
        showToast(
          'You can showcase up to 6 gifts. Unpin one first to add another.',
          'info'
        );
        return;
      }
      await handleUpdateGiftSettings({
        showcaseGifts: [...current, giftCode],
      });
    }
  };

  const openFollowModal = async (type: 'followers' | 'following') => {
    setFollowModalType(type);
    try {
      const lists = await apiFetch<{
        followers: UserProfile[];
        following: UserProfile[];
      }>(`/api/profiles/${targetUserId}/follows`);
      setFollowLists(lists);
    } catch {
      // ignore
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadMediaWithProgress(file, 'avatars');
      await apiFetch('/api/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({ avatarUrl: uploaded.url }),
      });
      await refreshProfile();
      await loadProfileAndPosts();
      showToast('Profile picture updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Avatar upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile) return;
    try {
      const res = await apiFetch<{ following: boolean }>(
        `/api/profiles/${profile.id}/follow`,
        { method: 'POST' }
      );
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: res.following,
              followersCount: res.following
                ? (prev.followersCount || 0) + 1
                : Math.max(0, (prev.followersCount || 0) - 1),
            }
          : prev
      );
    } catch {
      showToast('Failed to update follow status.', 'error');
    }
  };

  const handleFriendButton = async () => {
    if (!profile) return;
    const status = profile.friendshipStatus || 'none';
    const nextAction =
      status === 'friends'
        ? 'remove'
        : status === 'pending_received'
          ? 'accept'
          : status === 'pending_sent'
            ? 'cancel'
            : 'request';

    try {
      await apiFetch('/api/friends/action', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: profile.id,
          action: nextAction,
        }),
      });
      await loadProfileAndPosts();
      showToast('Friendship updated!', 'info');
    } catch {
      showToast('Failed to update friendship.', 'error');
    }
  };

  const handleBlockOrReportUser = async (type: 'block' | 'report') => {
    if (!profile) return;
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'user',
          targetId: profile.id,
          feedbackType: type,
          reason: `User profile ${type}`,
        }),
      });
      showToast(
        type === 'block'
          ? `Blocked @${profile.username}`
          : `Reported @${profile.username} to moderation`,
        'info'
      );
      if (type === 'block') {
        onBackToMyProfile();
      }
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiFetch('/api/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: editDisplayName,
          username: editUsername,
          bio: editBio,
          whoCanMessage,
          commentControl,
          isPrivate,
          notificationsEnabled,
          categories: editInterests,
        }),
      });
      await refreshProfile();
      await loadProfileAndPosts();
      showToast('Account & privacy settings saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not save settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAdminAction = async (action: string, payload: any) => {
    try {
      await apiFetch('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({ action, payload }),
      });
      const refreshed = await apiFetch('/api/admin/overview');
      setAdminData(refreshed);
      showToast('Moderation action applied.', 'success');
    } catch {
      showToast('Admin action failed.', 'error');
    }
  };

  const handleSendBoostBotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botMessageContent.trim()) {
      showToast('Please enter a message to send from BOOST BOT.', 'error');
      return;
    }
    if (botTargetMode === 'user' && !botSelectedUserId) {
      showToast('Please select a recipient user.', 'error');
      return;
    }
    setSendingBotMessage(true);
    try {
      const res = await apiFetch<any>('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_boost_bot_message',
          payload: {
            targetUserId: botTargetMode === 'all' ? 'all' : botSelectedUserId,
            content: botMessageContent.trim(),
          },
        }),
      });
      setBotMessageContent('');
      showToast(
        `BOOST BOT message delivered to ${res?.sentCount || 1} ${
          (res?.sentCount || 1) === 1 ? 'user' : 'users'
        }!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to send BOOST BOT message.', 'error');
    } finally {
      setSendingBotMessage(false);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  const filteredPosts =
    contentTab === 'videos'
      ? userPosts.filter(
          (p) => p.postType === 'video' || p.postType === 'capshot'
        )
      : contentTab === 'photos'
        ? userPosts.filter((p) => p.postType === 'photo')
        : contentTab === 'saved'
          ? savedPosts
          : userPosts;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {!isMe && (
        <button
          onClick={onBackToMyProfile}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Profile
        </button>
      )}

      {/* Profile Header Card */}
      <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                className={`rounded-full ${getFrameRingClasses(profile.equippedFrame)}`}
              >
                <Avatar
                  src={profile.avatarUrl}
                  name={profile.displayName}
                  size="xl"
                />
              </div>
              {isMe && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center ring-2 ring-[#0B1021]"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`font-display text-xl sm:text-2xl font-bold ${getNameStyleClasses(
                    profile.equippedNameStyle
                  )}`}
                >
                  {profile.displayName}
                </h1>
                {profile.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                )}
                {profile.equippedBadge &&
                  getBShopItemByCode(profile.equippedBadge) && (
                    <span className="text-xs text-amber-300 font-medium">
                      {getBShopItemByCode(profile.equippedBadge)?.icon}{' '}
                      {getBShopItemByCode(profile.equippedBadge)?.name}
                    </span>
                  )}
              </div>
              <p className="text-xs text-slate-400">
                @{profile.username} ·{' '}
                {profile.email?.trim().toLowerCase() === 'princeabba96@gmail.com'
                  ? 'admin'
                  : profile.role === 'admin'
                    ? 'user'
                    : profile.role}{' '}
                ·{' '}
                <span className="text-blue-400 tabular-nums">
                  {profile.xp} XP
                </span>
                {isMe && (
                  <>
                    {' '}
                    ·{' '}
                    <span className="text-purple-400 font-semibold tabular-nums">
                      {(profile.boostPoints || 0).toLocaleString()} BP
                    </span>
                  </>
                )}
              </p>
              {profile.bio && (
                <p className="text-sm text-slate-200 pt-1 max-w-md">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          {isMe ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMainMode('profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  activeMainMode === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveMainMode('gifts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  activeMainMode === 'gifts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-pink-400" /> 🎁 My Gifts
              </button>
              {onOpenBShop && (
                <button
                  onClick={() => onOpenBShop(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" /> 🛍️
                  B-Shop
                </button>
              )}
              <button
                onClick={() => setActiveMainMode('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  activeMainMode === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Creator Dashboard
              </button>
              <button
                onClick={() => setActiveMainMode('settings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  activeMainMode === 'settings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
              {(profile.isAdmin || profile.role === 'admin') &&
                profile.email?.trim().toLowerCase() ===
                  'princeabba96@gmail.com' && (
                  <button
                    onClick={() => setActiveMainMode('admin')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      activeMainMode === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Admin Console
                  </button>
                )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {onOpenBShop && (
                <button
                  onClick={() => onOpenBShop(profile)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-colors"
                >
                  <Gift className="w-4 h-4" /> Send Gift
                </button>
              )}
              <button
                onClick={handleToggleFollow}
                className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                  profile.isFollowing
                    ? 'bg-white/10 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {profile.isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </button>

              <button
                onClick={handleFriendButton}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white"
              >
                {profile.friendshipStatus === 'friends'
                  ? 'Friends ✓'
                  : profile.friendshipStatus === 'pending_received'
                    ? 'Accept Friend'
                    : profile.friendshipStatus === 'pending_sent'
                      ? 'Request Sent'
                      : 'Add Friend'}
              </button>

              <button
                onClick={() => onOpenMessageWith(profile)}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/?user=${profile.id}`
                  );
                  showToast('Profile link copied!', 'success');
                }}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center"
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleBlockOrReportUser('block')}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center"
                title="Block User"
              >
                <Ban className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleBlockOrReportUser('report')}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 flex items-center justify-center"
                title="Report User"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quantitative Metrics Row (Tabular Numerals) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-4 border-t border-white/10 text-center">
          <button
            onClick={() => openFollowModal('followers')}
            className="p-2 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCompactNumber(profile.followersCount)}
            </p>
            <p className="text-xs text-slate-400">Followers</p>
          </button>

          <button
            onClick={() => openFollowModal('following')}
            className="p-2 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCompactNumber(profile.followingCount)}
            </p>
            <p className="text-xs text-slate-400">Following</p>
          </button>

          <div className="p-2">
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCompactNumber(profile.friendsCount)}
            </p>
            <p className="text-xs text-slate-400">Friends</p>
          </div>

          <div className="p-2">
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCompactNumber(profile.likesReceivedCount)}
            </p>
            <p className="text-xs text-slate-400">Likes</p>
          </div>

          <div className="p-2">
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCompactNumber(profile.sharesReceivedCount)}
            </p>
            <p className="text-xs text-slate-400">Shares</p>
          </div>

          <div className="p-2">
            <p className="text-lg font-bold text-white tabular-nums">
              {formatCompactNumber(profile.viewsReceivedCount)}
            </p>
            <p className="text-xs text-slate-400">Views</p>
          </div>
        </div>

        {/* Public Profile ✨ Gift Showcase & 🎁 Gift Collection Summary */}
        {(isMe || (profile.giftPrivacy || 'public') !== 'private') && (
          <div className="pt-4 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* ✨ Gift Showcase (3–6 favorite/rare gifts) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-amber-300">
                  ✨ Gift Showcase
                </span>
                {isMe && (
                  <button
                    type="button"
                    onClick={() => setActiveMainMode('gifts')}
                    className="text-blue-400 hover:underline"
                  >
                    Customize
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                {(profile.showcaseGifts || 'crown,diamond,rocket,trophy')
                  .split(',')
                  .map((code) => code.trim())
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((code, idx, arr) => {
                    const item = getBShopItemByCode(code);
                    if (!item) return null;
                    return (
                      <React.Fragment key={code}>
                        <span className="font-medium text-white">
                          {item.icon} {item.name}
                        </span>
                        {idx < arr.length - 1 && (
                          <span aria-hidden="true" className="text-slate-600">
                            |
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
              </div>
            </div>

            {/* 🎁 Gift Collection Summary (Visible when giftPrivacy is public or viewing own profile) */}
            {(isMe || (profile.giftPrivacy || 'public') === 'public') &&
              profile.publicGiftCollection &&
              profile.publicGiftCollection.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-purple-300">
                      🎁 Gift Collection
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {profile.publicGiftCollection.reduce(
                        (s, g) => s + g.count,
                        0
                      )}{' '}
                      total received
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white tabular-nums">
                    {profile.publicGiftCollection.map((g) => (
                      <span
                        key={g.code}
                        title={`${g.name} (${g.rarity})`}
                        className="inline-flex items-center gap-1"
                      >
                        <span className="text-sm">{g.icon}</span>
                        <span className="font-semibold">{g.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </section>

      {/* MODE: 🎁 MY GIFTS (Collection, Showcase, Activity & Privacy) */}
      {isMe && activeMainMode === 'gifts' && (
        <div className="space-y-6">
          {/* Top Overview & B-Shop CTA */}
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-white">
                🎁 My Gifts & Showcase
              </h2>
              <p className="text-xs text-slate-400">
                Manage your received Gift Collection, choose 3–6 showcase gifts
                for your profile, review gift activity, and control gift
                privacy.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300 tabular-nums">
                <span>
                  Boost Points:{' '}
                  <strong className="text-purple-300">
                    {(
                      myGiftsState?.boostPoints ??
                      profile.boostPoints ??
                      0
                    ).toLocaleString()}{' '}
                    BP
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Total Gifts Received:{' '}
                  <strong className="text-white">
                    {myGiftsState?.giftCollection.reduce(
                      (s, g) => s + g.receivedCount,
                      0
                    ) || 0}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Gift Recognition Score:{' '}
                  <strong className="text-blue-400">
                    {(
                      myGiftsState?.giftRecognitionScore ??
                      profile.giftRecognitionScore ??
                      0
                    ).toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>

            {onOpenBShop && (
              <button
                type="button"
                onClick={() => onOpenBShop(null)}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Visit 🛍️ B-Shop</span>
              </button>
            )}
          </div>

          {/* ✨ Gift Showcase & 🔒 Gift Privacy Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white">
                  ✨ Gift Showcase (3–6 Favorite Gifts)
                </h3>
                <span className="text-xs text-slate-400 tabular-nums">
                  {myGiftsState?.showcaseGifts.length || 4} / 6 selected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Displayed prominently at the top of your profile. Tap any gift
                card below to pin or unpin it from your Showcase.
              </p>
              <div className="p-3.5 rounded-2xl bg-[#070B17] border border-white/10 flex flex-wrap items-center gap-2.5 text-sm text-white">
                {(
                  myGiftsState?.showcaseGifts || [
                    'crown',
                    'diamond',
                    'rocket',
                    'trophy',
                  ]
                ).map((code, idx, arr) => {
                  const item = getBShopItemByCode(code);
                  if (!item) return null;
                  return (
                    <React.Fragment key={code}>
                      <span className="font-semibold">
                        {item.icon} {item.name}
                      </span>
                      {idx < arr.length - 1 && (
                        <span aria-hidden="true" className="text-slate-600">
                          |
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Gift Privacy Setting</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Activity log is always private
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose what visitors see on your public profile. Individual
                sender transactions are never exposed publicly.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(
                  [
                    { id: 'public', label: 'Collection & Showcase' },
                    { id: 'showcase_only', label: 'Showcase Only' },
                    { id: 'private', label: 'Private (Only Me)' },
                  ] as const
                ).map((opt) => {
                  const active =
                    (myGiftsState?.giftPrivacy ||
                      profile.giftPrivacy ||
                      'public') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={updatingGiftSettings}
                      onClick={() =>
                        handleUpdateGiftSettings({ giftPrivacy: opt.id })
                      }
                      className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 🎁 Gift Collection Cards */}
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  🎁 Gift Collection
                </h3>
                <p className="text-xs text-slate-400">
                  Every virtual gift you have received or collected on BoostHub.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(myGiftsState?.giftCollection || []).map((card) => {
                const isPinned = (myGiftsState?.showcaseGifts || []).includes(
                  card.code
                );
                return (
                  <div
                    key={card.code}
                    className="bg-[#070B17] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span
                          className={
                            card.rarity === 'Mythic'
                              ? 'text-amber-300 font-semibold'
                              : card.rarity === 'Legendary'
                                ? 'text-cyan-300 font-semibold'
                                : card.rarity === 'Epic'
                                  ? 'text-purple-300 font-semibold'
                                  : card.rarity === 'Rare'
                                    ? 'text-blue-300 font-semibold'
                                    : 'text-slate-300'
                          }
                        >
                          {card.rarity}
                        </span>
                        <span className="font-bold text-white tabular-nums">
                          ×{card.receivedCount}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl select-none">
                          {card.icon}
                        </div>
                        <div>
                          <p className="font-display text-base font-bold text-white">
                            {card.name} ×{card.receivedCount}
                          </p>
                          <p className="text-[11px] text-slate-400 tabular-nums">
                            Total received: {card.receivedCount}
                            {card.ownedInInventoryCount > 0
                              ? ` · In bag: ×${card.ownedInInventoryCount}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 truncate">
                        {card.mostRecentSender ? (
                          <>
                            Most recent:{' '}
                            <button
                              type="button"
                              onClick={() =>
                                onSelectUser(card.mostRecentSender!.id)
                              }
                              className="text-blue-400 hover:underline font-medium"
                            >
                              {card.mostRecentSender.displayName}
                            </button>
                          </>
                        ) : (
                          'Not received yet'
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={updatingGiftSettings}
                      onClick={() => handleToggleShowcaseGift(card.code)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                        isPinned
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isPinned ? '✨ Pinned in Showcase' : 'Pin to Showcase'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔔 Gift Activity History */}
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                🔔 Gift Activity
              </h3>
              <p className="text-xs text-slate-400">
                Private chronological history of gifts you have received and
                sent.
              </p>
            </div>

            {!myGiftsState?.giftActivity ||
            myGiftsState.giftActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No gift activity yet. Visit B-Shop to send your first gift!
              </p>
            ) : (
              <div className="divide-y divide-white/10">
                {myGiftsState.giftActivity.map((act) => {
                  const plural =
                    act.quantity > 1
                      ? act.itemName === 'Trophy'
                        ? 'Trophies'
                        : `${act.itemName}s`
                      : act.itemName;
                  return (
                    <div
                      key={act.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                          {act.itemIcon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">
                            {act.direction === 'received' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelectUser(act.counterparty.id)
                                  }
                                  className="font-bold hover:text-blue-400"
                                >
                                  {act.counterparty.displayName}
                                </button>{' '}
                                sent you{' '}
                                <span className="font-semibold text-purple-300">
                                  {act.quantity > 1
                                    ? `${act.quantity} ${plural}`
                                    : `a ${act.itemName}`}
                                </span>
                              </>
                            ) : (
                              <>
                                You sent{' '}
                                <span className="font-semibold text-purple-300">
                                  {act.quantity > 1
                                    ? `${act.quantity} ${plural}`
                                    : `a ${act.itemName}`}
                                </span>{' '}
                                to{' '}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelectUser(act.counterparty.id)
                                  }
                                  className="font-bold hover:text-blue-400"
                                >
                                  {act.counterparty.displayName}
                                </button>
                              </>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{formatRelativeTime(act.createdAt)}</span>
                            {act.message && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-300 truncate">
                                  “{act.message}”
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-xs tabular-nums">
                        {act.direction === 'received' ? (
                          <span className="text-emerald-400 font-semibold">
                            +{act.recognitionEarned} Gift Score
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {act.bpSpent.toLocaleString()} BP
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 1: PROFILE CONTENT TABS + EMBEDDED CREATOR DASHBOARD */}
      {activeMainMode === 'profile' && (
        <div className="space-y-6">
          <CreatorDashboard
            profile={profile}
            isOwnProfile={isMe}
            onProfileUpdated={loadProfileAndPosts}
          />
          <div className="flex items-center gap-2 p-1 bg-[#0B1021] border border-white/10 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setContentTab('posts')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                contentTab === 'posts'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setContentTab('videos')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                contentTab === 'videos'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Videos
            </button>
            <button
              onClick={() => setContentTab('photos')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                contentTab === 'photos'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photos
            </button>
            {isMe && (
              <button
                onClick={() => setContentTab('saved')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                  contentTab === 'saved'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" /> Saved (Private)
              </button>
            )}
            <button
              onClick={() => setContentTab('about')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                contentTab === 'about'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" /> About
            </button>
          </div>

          {contentTab === 'about' ? (
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Bio</h3>
                <p className="text-xs text-slate-300 mt-1">
                  {profile.bio || 'No bio added yet.'}
                </p>
              </div>

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Selected Interests
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {profile.interests.join(' · ')}
                  </p>
                </div>
              )}

              {profile.badges && profile.badges.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Unlocked Badges
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.badges.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3"
                      >
                        <Award className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {b.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {b.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-10 text-center text-xs text-slate-400">
              No content in this section yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenComments={onOpenComments}
                  onOpenShare={onOpenShare}
                  onSelectUser={onSelectUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: CREATOR DASHBOARD, MISSIONS, BADGES & MONETIZATION */}
      {activeMainMode === 'dashboard' && (
        <CreatorDashboard
          profile={profile}
          isOwnProfile={isMe}
          onProfileUpdated={loadProfileAndPosts}
        />
      )}

      {/* MODE 3: SETTINGS, PRIVACY, BLOCKED USERS & LOGOUT */}
      {isMe && activeMainMode === 'settings' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-5"
          >
            <h2 className="font-display text-lg font-bold text-white">
              Account, Profile & Privacy Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) =>
                    setEditUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    )
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Bio</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Who Can Message Me
                </label>
                <select
                  value={whoCanMessage}
                  onChange={(e) => setWhoCanMessage(e.target.value as any)}
                  className="w-full bg-[#111830] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="nobody">No One</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Who Can Comment on My Posts
                </label>
                <select
                  value={commentControl}
                  onChange={(e) => setCommentControl(e.target.value as any)}
                  className="w-full bg-[#111830] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers Only</option>
                  <option value="nobody">No One</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-white/20 bg-white/5"
                />
                <span>Private Account</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="rounded border-white/20 bg-white/5"
                />
                <span>Enable Push & Realtime Notifications</span>
              </label>
            </div>

            {/* Background Web Push Device Subscription Card */}
            <div className="p-4 rounded-2xl bg-[#111830] border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">
                  Background Push Notifications (Even When BoostHub Is Closed) ·{' '}
                  <span className="text-blue-400">
                    {pushSubscribed
                      ? `Subscribed (${pushDeviceCount} device${pushDeviceCount === 1 ? '' : 's'})`
                      : 'Not Subscribed on This Device'}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Get instant alerts on your phone or desktop when someone likes your videos, comments, or follows you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!pushSubscribed ? (
                  <button
                    type="button"
                    disabled={pushBusy}
                    onClick={async () => {
                      setPushBusy(true);
                      try {
                        await enableBackgroundPushNotifications();
                        const st = await getBrowserPushPermissionState();
                        setPushSubscribed(st.subscribed);
                        setPushDeviceCount(st.deviceCount);
                        setNotificationsEnabled(true);
                        showToast('Background Push Notifications enabled!', 'success');
                      } catch (err: any) {
                        showToast(err.message || 'Could not enable push alerts.', 'error');
                      } finally {
                        setPushBusy(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{pushBusy ? 'Enabling...' : 'Enable on This Device'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={pushBusy}
                      onClick={async () => {
                        try {
                          await triggerTestPushNotification();
                          showToast('Test push sent! Check your notifications tray.', 'success');
                        } catch {
                          showToast('Failed to send test push.', 'error');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Push</span>
                    </button>
                    <button
                      type="button"
                      disabled={pushBusy}
                      onClick={async () => {
                        setPushBusy(true);
                        try {
                          await disableBackgroundPushNotifications();
                          const st = await getBrowserPushPermissionState();
                          setPushSubscribed(st.subscribed);
                          setPushDeviceCount(st.deviceCount);
                          showToast('Push disabled for this device.', 'info');
                        } finally {
                          setPushBusy(false);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Disable</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-2">
                Content Preferences & Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_CATEGORIES.map((cat) => {
                  const active = editInterests.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setEditInterests((prev) =>
                          prev.includes(cat)
                            ? prev.filter((c) => c !== cat)
                            : [...prev, cat]
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>

          {/* Blocked Users Section */}
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Blocked Users ({blockedUsers.length})
            </h3>
            {blockedUsers.length === 0 ? (
              <p className="text-xs text-slate-500">
                You haven't blocked any accounts.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((bu) => (
                  <div
                    key={bu.id}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={bu.avatarUrl}
                        name={bu.displayName}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-white">
                        {bu.displayName} (@{bu.username})
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        await apiFetch('/api/blocked-users/unblock', {
                          method: 'POST',
                          body: JSON.stringify({ targetUserId: bu.id }),
                        });
                        setBlockedUsers((prev) =>
                          prev.filter((u) => u.id !== bu.id)
                        );
                        showToast(`Unblocked @${bu.username}`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-white"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help, Terms, Privacy Policy & Logout */}
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-400">
              <p className="text-white font-semibold">
                BoostHub Data, Terms & Privacy Policy
              </p>
              <p>
                Your saved content is private to your account. Media is stored in
                permanent cloud storage.
              </p>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MODE 4: ADMIN MODERATION CONSOLE (Primary Admin: Prince Abba) */}
      {isMe &&
        (profile.isAdmin || profile.role === 'admin') &&
        profile.email?.trim().toLowerCase() === 'princeabba96@gmail.com' &&
        activeMainMode === 'admin' &&
        adminData && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/60 to-blue-950/60 border border-purple-500/30 rounded-3xl p-6 space-y-2">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                <span>BoostHub Administrator Console</span>
              </h2>
              <p className="text-xs text-slate-300">
                Primary Administrator: Prince Abba · Protected by database-level
                role authorization.
              </p>
            </div>

            {/* BOOST BOT Broadcast & Direct User Messaging */}
            <div className="bg-[#0B1021] border border-purple-500/30 rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-purple-400" />
                    <span>BOOST BOT Official Messenger</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Send official messages and phone push notifications to all
                    users or a selected user. Sender appears as{' '}
                    <strong className="text-white">BOOST BOT</strong> on top with
                    your message down below.
                  </p>
                </div>

                <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl self-start">
                  <button
                    type="button"
                    onClick={() => setBotTargetMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      botTargetMode === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Users ({adminData.users?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotTargetMode('user')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      botTargetMode === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Select a User
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendBoostBotMessage} className="space-y-4">
                {botTargetMode === 'user' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select Recipient User
                    </label>
                    <select
                      value={botSelectedUserId}
                      onChange={(e) => setBotSelectedUserId(e.target.value)}
                      className="w-full bg-[#070B17] border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Choose a user --</option>
                      {adminData.users
                        ?.filter((u: UserProfile) => u.id !== 'boost_bot_official')
                        .map((u: UserProfile) => (
                          <option key={u.id} value={u.id}>
                            {u.displayName} (@{u.username}) · {u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Message Content
                  </label>
                  <textarea
                    rows={3}
                    value={botMessageContent}
                    onChange={(e) => setBotMessageContent(e.target.value)}
                    placeholder="Write the message to send from BOOST BOT..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Live Preview of how users see the message */}
                <div className="p-4 rounded-2xl bg-[#070B17] border border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Recipient Preview (Messages & Phone Notification)
                  </span>
                  <div className="pt-1">
                    <p className="text-xs font-extrabold tracking-wide text-amber-300">
                      BOOST BOT
                    </p>
                    <p className="text-sm text-white whitespace-pre-wrap break-words mt-1">
                      {botMessageContent.trim() ||
                        'Your message will appear right here below BOOST BOT...'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingBotMessage || !botMessageContent.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-purple-600/25"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {sendingBotMessage
                      ? 'Sending as BOOST BOT...'
                      : botTargetMode === 'all'
                        ? 'Send as BOOST BOT to All Users'
                        : 'Send as BOOST BOT to Selected User'}
                  </span>
                </button>
              </form>
            </div>

            {/* Reports Queue */}
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Safety & Content Reports ({adminData.reports?.length || 0})
              </h3>
              {adminData.reports?.length === 0 ? (
                <p className="text-xs text-slate-500">No open reports.</p>
              ) : (
                <div className="space-y-2.5">
                  {adminData.reports.map((rep: any) => (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          Target: {rep.targetType} #{rep.targetId} · Status:{' '}
                          {rep.status}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          Reason: {rep.reason || 'Reported by user'} ·{' '}
                          {formatRelativeTime(rep.createdAt)}
                        </p>
                      </div>
                      {rep.status !== 'resolved' && (
                        <button
                          onClick={() =>
                            handleAdminAction('resolve_report', {
                              reportId: rep.id,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Management */}
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">
                User & Creator Management ({adminData.users?.length || 0})
              </h3>
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {adminData.users?.map((u: UserProfile) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={u.avatarUrl}
                        name={u.displayName}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {u.displayName} (@{u.username})
                        </p>
                        <p className="text-slate-400">
                          {u.email} · Role: {u.role}
                          {u.isSuspended ? ' · SUSPENDED' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {u.id !== 'boost_bot_official' && (
                        <button
                          onClick={() => {
                            setBotTargetMode('user');
                            setBotSelectedUserId(u.id);
                            window.scrollTo({ top: 240, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 font-semibold"
                        >
                          Message User
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleAdminAction('toggle_verify_user', {
                            userId: u.id,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-300"
                      >
                        {u.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() =>
                          handleAdminAction('set_user_role', {
                            userId: u.id,
                            role: u.role === 'creator' ? 'user' : 'creator',
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-200"
                      >
                        {u.role === 'creator' ? 'Set User' : 'Make Creator'}
                      </button>
                      {u.id !== profile.id && (
                        <button
                          onClick={() =>
                            handleAdminAction('toggle_suspend_user', {
                              userId: u.id,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300"
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Post Moderation */}
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Post & Video Moderation ({adminData.posts?.length || 0})
              </h3>
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {adminData.posts?.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        #{p.id} [{p.postType}] {p.caption || 'No caption'}
                      </p>
                      <p className="text-slate-400">
                        Views: {p.viewsCount} · Hidden: {p.isHidden ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          handleAdminAction('toggle_hide_post', {
                            postId: p.id,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-200 inline-flex items-center gap-1"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        {p.isHidden ? 'Unhide' : 'Hide'}
                      </button>
                      <button
                        onClick={() =>
                          handleAdminAction('delete_post', { postId: p.id })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Followers / Following Modal */}
      {followModalType && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white capitalize">
                {followModalType}
              </h3>
              <button
                onClick={() => setFollowModalType(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {(followModalType === 'followers'
                ? followLists.followers
                : followLists.following
              ).map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setFollowModalType(null);
                    onSelectUser(u.id);
                  }}
                  className="w-full p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] flex items-center gap-3 text-left"
                >
                  <Avatar
                    src={u.avatarUrl}
                    name={u.displayName}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                  </div>
                </button>
              ))}
              {(followModalType === 'followers'
                ? followLists.followers
                : followLists.following
              ).length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">
                  No users in this list yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
