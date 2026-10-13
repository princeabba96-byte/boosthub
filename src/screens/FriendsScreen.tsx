import React, { useEffect, useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Check,
  X,
  Plus,
  Shield,
  Pin,
  Trash2,
  Heart,
  Send,
  ArrowLeft,
  Upload,
  Share2,
  Image as ImageIcon,
  Video,
  Camera,
  Lock,
  Clock,
  Flame,
  Sparkles,
  Settings,
  MessageCircle,
} from 'lucide-react';
import {
  CommunityItem,
  CommunityPost,
  CommunityMember,
  CommunityChatMessage,
  INTEREST_CATEGORIES,
  UserProfile,
} from '../types';
import { apiFetch } from '../services/api';
import { uploadMediaWithProgress } from '../storage/mediaUpload';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { formatRelativeTime } from '../utils/format';

interface FriendsScreenProps {
  onSelectUser: (userId: string) => void;
  onOpenMessageWith: (partner: UserProfile) => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  onSelectUser,
  onOpenMessageWith,
}) => {
  const { userProfile, showToast, realtimeEvents } = useAuth();
  const [section, setSection] = useState<
    'friends' | 'requests' | 'suggestions' | 'communities'
  >('friends');

  const [friends, setFriends] = useState<
    Array<{ friendshipId: any; profile: UserProfile }>
  >([]);
  const [pendingReceived, setPendingReceived] = useState<
    Array<{ friendshipId: any; profile: UserProfile }>
  >([]);
  const [pendingSent, setPendingSent] = useState<
    Array<{ friendshipId: any; profile: UserProfile }>
  >([]);
  const [suggestions, setSuggestions] = useState<
    Array<{ profile: UserProfile; mutualFriendsCount: number }>
  >([]);
  const [loadingFriends, setLoadingFriends] = useState<boolean>(true);

  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<CommunityItem | null>(null);
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  // New Community Form
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commCategory, setCommCategory] = useState('Creators');
  const [commPrivacy, setCommPrivacy] = useState<'public' | 'private'>('public');
  const [commRules, setCommRules] = useState(
    '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.'
  );
  const [commImageUrl, setCommImageUrl] = useState('');
  const [uploadingCommImg, setUploadingCommImg] = useState(false);
  const commFileRef = useRef<HTMLInputElement>(null);

  // Active Community Tabs & State
  const [commTab, setCommTab] = useState<'posts' | 'chat' | 'members' | 'requests' | 'rules'>('posts');
  const [commPostText, setCommPostText] = useState('');
  const [commPostMediaUrl, setCommPostMediaUrl] = useState('');
  const [commPostMediaType, setCommPostMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadingPostMedia, setUploadingPostMedia] = useState(false);
  const commPostFileRef = useRef<HTMLInputElement>(null);

  // Community Chat
  const [commChatText, setCommChatText] = useState('');
  const [commChatMediaUrl, setCommChatMediaUrl] = useState('');
  const [uploadingChatMedia, setUploadingChatMedia] = useState(false);
  const commChatFileRef = useRef<HTMLInputElement>(null);

  // Admin Profile Picture Edit
  const [updatingCommAvatar, setUpdatingCommAvatar] = useState(false);
  const commAvatarFileRef = useRef<HTMLInputElement>(null);

  const [editingRules, setEditingRules] = useState(false);
  const [rulesDraft, setRulesDraft] = useState('');

  const normalizeTargetUserId = (uid?: string): string => {
    if (!uid) return '';
    const clean = String(uid).trim().toLowerCase();
    if (
      clean === 'eaada352-5704-4566-a7a7-88df80853ada' ||
      clean === 'abba' ||
      clean === 'princeabba' ||
      clean === 'bh_5c82dc8e3aa243a28413'
    ) {
      return 'eaada352-5704-4566-a7a7-88df80853ada';
    }
    if (
      clean === 'boost_bot' ||
      clean === 'boost_bot_official' ||
      clean === '00000000-0000-4000-8000-000000000001'
    ) {
      return '00000000-0000-4000-8000-000000000001';
    }
    return clean;
  };

  const normalizeFriendshipList = (
    raw: any
  ): Array<{ friendshipId: any; profile: UserProfile }> => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item: any, idx: number) => {
        const profile = item?.profile || item;
        if (!profile || typeof profile !== 'object' || !profile.id) return null;
        return {
          friendshipId: item?.friendshipId ?? item?.id ?? idx + 1,
          profile: profile as UserProfile,
        };
      })
      .filter(Boolean) as Array<{ friendshipId: any; profile: UserProfile }>;
  };

  const normalizeSuggestionsList = (
    raw: any
  ): Array<{ profile: UserProfile; mutualFriendsCount: number }> => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item: any) => {
        const profile = item?.profile || item;
        if (!profile || typeof profile !== 'object' || !profile.id) return null;
        return {
          profile: profile as UserProfile,
          mutualFriendsCount: Number(item?.mutualFriendsCount ?? 1),
        };
      })
      .filter(Boolean) as Array<{
      profile: UserProfile;
      mutualFriendsCount: number;
    }>;
  };

  const loadFriendsData = async () => {
    try {
      const res = await apiFetch<any>('/api/friends');
      const dataFriends = normalizeFriendshipList(
        res?.friends ?? (Array.isArray(res) ? res : [])
      );
      const dataReceived = normalizeFriendshipList(
        res?.pendingReceived ?? res?.incomingRequests ?? []
      );
      const dataSent = normalizeFriendshipList(
        res?.pendingSent ?? res?.outgoingRequests ?? []
      );
      const dataSuggestions = normalizeSuggestionsList(res?.suggestions ?? []);

      setFriends(dataFriends || []);
      setPendingReceived(dataReceived || []);
      setPendingSent(dataSent || []);
      setSuggestions(dataSuggestions || []);
    } catch {
      setFriends((prev) => prev || []);
      setPendingReceived((prev) => prev || []);
      setPendingSent((prev) => prev || []);
      setSuggestions((prev) => prev || []);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadCommunities = async () => {
    try {
      const list = await apiFetch<CommunityItem[]>('/api/communities');
      setCommunities(Array.isArray(list) ? list : []);
    } catch {
      setCommunities((prev) => prev || []);
    }
  };

  const loadCommunityDetail = async (id: any) => {
    if (!id) return;
    try {
      const detail = await apiFetch<any>(`/api/communities/${id}`);
      if (detail && typeof detail === 'object') {
        const commData = detail.community || detail;
        const currentUserId = normalizeTargetUserId(userProfile?.id);
        const isOwner = normalizeTargetUserId(String(commData.creatorId || commData.owner_id)) === currentUserId;
        const activeMembers = Array.isArray(detail.members) ? detail.members : (commData.members || []);
        const myMem = activeMembers.find(
          (m: any) => normalizeTargetUserId(String(m.userId || m.user_id)) === currentUserId
        );
        const isMem = Boolean(isOwner || commData.isMember || detail.isMember || myMem?.status === 'active');
        const role = isOwner ? 'admin' : (commData.myRole || detail.myRole || myMem?.role || null);

        setActiveCommunity({
          ...commData,
          ...detail,
          id: commData.id || detail.id || id,
          name: commData.name || detail.name || 'Community',
          imageUrl: commData.imageUrl || detail.imageUrl || commData.avatar_url || '',
          description: commData.description || detail.description || '',
          category: commData.category || detail.category || 'Creators',
          rules: commData.rules || detail.rules || '',
          privacy: commData.privacy || detail.privacy || 'public',
          creatorId: commData.creatorId || detail.creatorId,
          isMember: isMem,
          membershipStatus: isOwner ? 'active' : (commData.membershipStatus || detail.membershipStatus || (isMem ? 'active' : 'none')),
          myRole: role,
          membersCount: Math.max(1, activeMembers.length),
          postsCount: typeof commData.postsCount === 'number' ? commData.postsCount : (Array.isArray(detail.posts) ? detail.posts.length : 0),
          members: activeMembers,
          posts: Array.isArray(detail.posts) ? detail.posts : (commData.posts || []),
          chatMessages: Array.isArray(detail.chatMessages) ? detail.chatMessages : (commData.chatMessages || []),
          pendingRequests: Array.isArray(detail.pendingRequests) ? detail.pendingRequests : (commData.pendingRequests || []),
        });
        setRulesDraft(commData.rules || detail.rules || '');
      }
    } catch {
      // Fallback gracefully to existing community item in state
      const cached = communities.find((c) => String(c.id) === String(id));
      if (cached) {
        setActiveCommunity(cached);
      } else {
        showToast('Failed to load community.', 'error');
      }
    }
  };

  useEffect(() => {
    loadFriendsData();
    loadCommunities();
  }, []);

  useEffect(() => {
    const events = Array.isArray(realtimeEvents) ? realtimeEvents : [];
    if ((events || []).length === 0) return;
    const latest = events[(events || []).length - 1];
    if (!latest) return;
    if (latest.type === 'friend_update') {
      loadFriendsData();
    } else if (latest.type === 'community_activity') {
      loadCommunities();
      if (activeCommunity?.id) {
        loadCommunityDetail(activeCommunity.id);
      }
    }
  }, [realtimeEvents]);

  const handleFriendAction = async (
    targetUserId: string,
    action: 'request' | 'accept' | 'decline' | 'cancel' | 'remove'
  ) => {
    try {
      await apiFetch('/api/friends/action', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, action }),
      });
      await loadFriendsData();
      const messagesMap = {
        request: 'Friend request sent!',
        accept: 'Friend request accepted!',
        decline: 'Request declined.',
        cancel: 'Friend request cancelled.',
        remove: 'Removed from friends.',
      };
      showToast(messagesMap[action], 'info');
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) return;
    try {
      const created = await apiFetch<CommunityItem>('/api/communities', {
        method: 'POST',
        body: JSON.stringify({
          name: commName.trim(),
          description: commDesc.trim(),
          category: commCategory,
          imageUrl: commImageUrl,
          rules: commRules,
          privacy: commPrivacy,
        }),
      });
      setCommName('');
      setCommDesc('');
      setCommImageUrl('');
      setCommPrivacy('public');
      setCreatingCommunity(false);
      await loadCommunities();
      if (created?.id) {
        await loadCommunityDetail(created.id);
      }
      showToast(`Community "${created.name}" created! You are set as Admin.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not create community.', 'error');
    }
  };

  const handleCommunityAction = async (
    communityId: any,
    action: string,
    payload?: any
  ) => {
    if (!communityId) return;
    try {
      await apiFetch(`/api/communities/${communityId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, payload }),
      });
      await loadCommunities();
      if (activeCommunity?.id === communityId) {
        await loadCommunityDetail(communityId);
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const handleUploadCommunityAvatar = async (file: File) => {
    if (!activeCommunity?.id) return;
    setUpdatingCommAvatar(true);
    try {
      let finalUrl = '';
      try {
        const up = await uploadMediaWithProgress(file, 'communities');
        finalUrl = up.url;
      } catch {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      await handleCommunityAction(activeCommunity.id, 'update_profile_picture', {
        imageUrl: finalUrl,
      });
      showToast('Community profile picture updated from gallery!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update community picture.', 'error');
    } finally {
      setUpdatingCommAvatar(false);
    }
  };

  const handleUploadPostMedia = async (file: File) => {
    setUploadingPostMedia(true);
    try {
      const isVid = file.type.startsWith('video/');
      let url = '';
      try {
        const up = await uploadMediaWithProgress(file, isVid ? 'videos' : 'posts');
        url = up.url;
      } catch {
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      setCommPostMediaUrl(url);
      setCommPostMediaType(isVid ? 'video' : 'image');
      showToast(isVid ? 'Video attached from gallery!' : 'Photo attached from gallery!', 'success');
    } catch {
      showToast('Failed to attach media.', 'error');
    } finally {
      setUploadingPostMedia(false);
    }
  };

  const handleCreateCommunityPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commPostText.trim() && !commPostMediaUrl) return;
    if (!activeCommunity?.id) return;
    try {
      await handleCommunityAction(activeCommunity.id, 'post', {
        content: commPostText.trim(),
        mediaUrl: commPostMediaUrl,
        mediaType: commPostMediaType || (commPostMediaUrl ? 'image' : 'post'),
      });
      setCommPostText('');
      setCommPostMediaUrl('');
      setCommPostMediaType(null);
      showToast('Posted to community!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to post.', 'error');
    }
  };

  const handleSendCommunityChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commChatText.trim() && !commChatMediaUrl) return;
    if (!activeCommunity?.id) return;
    try {
      await handleCommunityAction(activeCommunity.id, 'chat', {
        content: commChatText.trim(),
        mediaUrl: commChatMediaUrl,
      });
      setCommChatText('');
      setCommChatMediaUrl('');
      showToast('Message sent to community chat!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to send message.', 'error');
    }
  };

  const safeFriends = Array.isArray(friends) ? friends : [];
  const safePendingReceived = Array.isArray(pendingReceived)
    ? pendingReceived
    : [];
  const safePendingSent = Array.isArray(pendingSent) ? pendingSent : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const safeCommunities = Array.isArray(communities) ? communities : [];

  if (loadingFriends || !friends) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-medium">
          Loading Friends & Communities...
        </p>
      </div>
    );
  }

  try {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header & Sub-Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Friends & Communities
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Connect with friends, manage requests, and collaborate inside creator
              communities.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#0B1021] border border-white/10 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setSection('friends');
                setActiveCommunity(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                section === 'friends'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Friends ({(safeFriends || []).length})
            </button>
            <button
              onClick={() => {
                setSection('requests');
                setActiveCommunity(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                section === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Requests ({(safePendingReceived || []).length})
            </button>
            <button
              onClick={() => {
                setSection('suggestions');
                setActiveCommunity(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                section === 'suggestions'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suggestions
            </button>
            <button
              onClick={() => setSection('communities')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                section === 'communities'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Communities ({(safeCommunities || []).length})
            </button>
          </div>
        </div>

        {/* SECTION 1: FRIENDS LIST */}
        {section === 'friends' && (
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">
              Your Friends ({(safeFriends || []).length})
            </h2>
            {(safeFriends || []).length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-white">
                  No friends yet
                </p>
                <p className="text-xs text-slate-400">
                  You haven't connected with friends yet.
                </p>
                <button
                  onClick={() => setSection('suggestions')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Explore Friend Suggestions
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(safeFriends || []).map(({ profile }, idx) => {
                  if (!profile) return null;
                  return (
                    <div
                      key={profile.id || idx}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => profile.id && onSelectUser(profile.id)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                      >
                        <Avatar
                          src={profile.avatarUrl}
                          name={profile.displayName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {profile.displayName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            @{profile.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenMessageWith(profile)}
                          className="min-h-[40px] px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </button>
                        <button
                          onClick={() =>
                            profile.id && handleFriendAction(profile.id, 'remove')
                          }
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center"
                          title="Remove Friend"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PENDING & SENT REQUESTS */}
        {section === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">
                Received Friend Requests ({(safePendingReceived || []).length})
              </h2>
              {(safePendingReceived || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No pending incoming requests.
                </p>
              ) : (
                <div className="space-y-3">
                  {(safePendingReceived || []).map(({ profile }, idx) => {
                    if (!profile) return null;
                    return (
                      <div
                        key={profile.id || idx}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => profile.id && onSelectUser(profile.id)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer"
                        >
                          <Avatar
                            src={profile.avatarUrl}
                            name={profile.displayName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {profile.displayName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              @{profile.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              profile.id && handleFriendAction(profile.id, 'accept')
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() =>
                              profile.id && handleFriendAction(profile.id, 'decline')
                            }
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs inline-flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">
                Sent Requests ({(safePendingSent || []).length})
              </h2>
              {(safePendingSent || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No outgoing friend requests.
                </p>
              ) : (
                <div className="space-y-3">
                  {(safePendingSent || []).map(({ profile }, idx) => {
                    if (!profile) return null;
                    return (
                      <div
                        key={profile.id || idx}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => profile.id && onSelectUser(profile.id)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer"
                        >
                          <Avatar
                            src={profile.avatarUrl}
                            name={profile.displayName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {profile.displayName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              @{profile.username}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            profile.id && handleFriendAction(profile.id, 'cancel')
                          }
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-medium"
                        >
                          Cancel Request
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: SUGGESTIONS */}
        {section === 'suggestions' && (
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">
              Suggested Creators
            </h2>
            {(safeSuggestions || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No additional user suggestions right now.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(safeSuggestions || []).map((item, idx) => {
                  const profile = item?.profile || (item as any);
                  if (!profile || !profile.id) return null;
                  const mutualFriendsCount = item?.mutualFriendsCount ?? 0;
                  return (
                    <div
                      key={profile.id || idx}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => onSelectUser(profile.id)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                      >
                        <Avatar
                          src={profile.avatarUrl}
                          name={profile.displayName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {profile.displayName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            @{profile.username} ·{' '}
                            <span className="tabular-nums">
                              {mutualFriendsCount} mutual friends
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFriendAction(profile.id, 'request')}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add Friend
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* SECTION 4: COMMUNITIES */}
      {section === 'communities' && !activeCommunity && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              BoostHub Communities
            </h2>
            <button
              onClick={() => setCreatingCommunity((c) => !c)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Community
            </button>
          </div>

          {creatingCommunity && (
            <form
              onSubmit={handleCreateCommunity}
              className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Create a New Community
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  Creator is Admin
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Community Name
                  </label>
                  <input
                    type="text"
                    required
                    value={commName}
                    onChange={(e) => setCommName(e.target.value)}
                    placeholder="e.g. BoostHub Creators Aba"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={commCategory}
                    onChange={(e) => setCommCategory(e.target.value)}
                    className="w-full bg-[#111830] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    {INTEREST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Privacy & Access Setting
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCommPrivacy('public')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      commPrivacy === 'public'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Public Community
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Anyone can join and view posts, pictures, and discussions immediately.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommPrivacy('private')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      commPrivacy === 'private'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Private Community (Approval Required)
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Others must request to join. Non-members cannot see posts until approved by admin.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  placeholder="What is this community about?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Community Profile Picture / Cover (From Gallery)
                </label>
                <input
                  ref={commFileRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCommImg(true);
                    try {
                      let url = '';
                      try {
                        const up = await uploadMediaWithProgress(file, 'communities');
                        url = up.url;
                      } catch {
                        url = await new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                      }
                      setCommImageUrl(url);
                      showToast('Community profile picture uploaded from gallery!', 'success');
                    } catch {
                      showToast('Picture upload failed.', 'error');
                    } finally {
                      setUploadingCommImg(false);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => commFileRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1.5 border border-white/10"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    {uploadingCommImg
                      ? 'Uploading from Gallery...'
                      : commImageUrl
                        ? 'Change Profile Picture'
                        : 'Select Profile Picture from Gallery'}
                  </button>
                  {commImageUrl && (
                    <div className="relative">
                      <img
                        src={commImageUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-blue-500/50"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Community Rules
                </label>
                <textarea
                  rows={3}
                  value={commRules}
                  onChange={(e) => setCommRules(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreatingCommunity(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Create Community
                </button>
              </div>
            </form>
          )}

          {(safeCommunities || []).length === 0 ? (
            <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-10 text-center space-y-3">
              <Users className="w-8 h-8 text-blue-400 mx-auto" />
              <p className="text-sm font-semibold text-white">
                No communities created yet
              </p>
              <p className="text-xs text-slate-400">
                Create the first community above to gather creators and members!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(safeCommunities || []).map((comm) => (
                <div
                  key={comm.id}
                  className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      src={comm.imageUrl}
                      name={comm.name}
                      size="lg"
                      onClick={() => loadCommunityDetail(comm.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => loadCommunityDetail(comm.id)}
                          className="text-base font-bold text-white hover:underline text-left truncate block"
                        >
                          {comm.name}
                        </button>
                        {comm.privacy === 'private' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {comm.category} ·{' '}
                        <span className="tabular-nums">
                          {comm.membersCount || 1} members
                        </span>{' '}
                        ·{' '}
                        <span className="tabular-nums">
                          {comm.postsCount || 0} posts
                        </span>
                      </p>
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                        {comm.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <button
                      onClick={() => loadCommunityDetail(comm.id)}
                      className="text-xs font-semibold text-blue-400 hover:underline"
                    >
                      Open Community →
                    </button>
                    <button
                      onClick={() =>
                        handleCommunityAction(
                          comm.id,
                          comm.isMember
                            ? 'leave'
                            : comm.privacy === 'private'
                              ? 'request_join'
                              : 'join'
                        )
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                        comm.isMember
                          ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                          : comm.membershipStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {comm.isMember
                        ? 'Joined'
                        : comm.membershipStatus === 'pending'
                          ? 'Pending'
                          : comm.privacy === 'private'
                            ? 'Request to Join'
                            : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE COMMUNITY DETAIL VIEW */}
      {section === 'communities' && activeCommunity && (
        <div className="space-y-5">
          <input
            ref={commAvatarFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadCommunityAvatar(file);
            }}
            className="hidden"
          />

          <button
            onClick={() => setActiveCommunity(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Communities
          </button>

          {/* Community Header Card */}
          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar
                    src={activeCommunity.imageUrl}
                    name={activeCommunity.name}
                    size="xl"
                  />
                  {activeCommunity.myRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => commAvatarFileRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-110"
                      title="Select community profile picture from gallery"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl font-bold text-white">
                      {activeCommunity.name}
                    </h2>
                    {activeCommunity.privacy === 'private' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private (Approval Required)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" /> Public
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeCommunity.category} ·{' '}
                    <span className="tabular-nums">
                      {activeCommunity.members?.length || activeCommunity.membersCount || 1} members
                    </span>
                    {activeCommunity.myRole && (
                      <span className="text-blue-300 font-semibold">
                        {' '}· Role: {activeCommunity.myRole === 'admin' ? 'Group Admin 🛡️' : activeCommunity.myRole}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-200 mt-2">
                    {activeCommunity.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activeCommunity.myRole === 'admin' && (
                  <button
                    onClick={() => commAvatarFileRef.current?.click()}
                    disabled={updatingCommAvatar}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white inline-flex items-center gap-1.5 border border-white/10"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    {updatingCommAvatar ? 'Updating Picture...' : 'Change Picture from Gallery'}
                  </button>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/?community=${activeCommunity.id}`
                    );
                    showToast('Community invite link copied!', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white inline-flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Invite
                </button>

                <button
                  onClick={() =>
                    handleCommunityAction(
                      activeCommunity.id,
                      activeCommunity.isMember
                        ? 'leave'
                        : activeCommunity.privacy === 'private'
                          ? 'request_join'
                          : 'join'
                    )
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    activeCommunity.isMember
                      ? 'bg-white/10 text-white hover:bg-rose-600/20 hover:text-rose-300'
                      : activeCommunity.membershipStatus === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                  disabled={!activeCommunity.isMember && activeCommunity.membershipStatus === 'pending'}
                >
                  {activeCommunity.isMember
                    ? 'Leave Community'
                    : activeCommunity.membershipStatus === 'pending'
                      ? '⏳ Request Pending Admin Review'
                      : activeCommunity.privacy === 'private'
                        ? 'Request to Join Community'
                        : 'Join Community'}
                </button>
              </div>
            </div>
          </div>

          {/* ACCESS CONTROL: RESTRICT NON-MEMBERS */}
          {!activeCommunity.isMember ? (
            <div className="bg-[#0B1021] border border-amber-500/20 rounded-3xl p-10 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Members-Only Community
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                  {activeCommunity.privacy === 'private'
                    ? 'This community is set as private by the creator. You must request to join and be approved by the admin before you can see posts, photos, videos, or chat.'
                    : 'Posts, media uploads, and community chat are reserved for members. Join below to participate and view all community discussions.'}
                </p>
              </div>

              <div className="pt-2">
                {activeCommunity.membershipStatus === 'pending' ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Join request pending admin approval</span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleCommunityAction(
                        activeCommunity.id,
                        activeCommunity.privacy === 'private' ? 'request_join' : 'join'
                      )
                    }
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2"
                  >
                    {activeCommunity.privacy === 'private' ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Request to Join Community</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Join Community to View Posts & Chat</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Display Public Community Rules */}
              <div className="pt-6 border-t border-white/5 text-left max-w-lg mx-auto">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Shield className="w-3.5 h-3.5 text-blue-400" /> Community Rules
                </h4>
                <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {activeCommunity.rules || '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.'}
                </p>
              </div>
            </div>
          ) : (
            /* MEMBER CONTENT VIEW WITH TABS: FEED, CHAT, MEMBERS, REQUESTS, RULES */
            <div className="space-y-4">
              {/* Internal Community Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                <button
                  onClick={() => setCommTab('posts')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shrink-0 ${
                    commTab === 'posts'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Feed & Media</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {(activeCommunity.posts || []).length}
                  </span>
                </button>

                <button
                  onClick={() => setCommTab('chat')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shrink-0 ${
                    commTab === 'chat'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Community Chat</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {(activeCommunity.chatMessages || []).length}
                  </span>
                </button>

                <button
                  onClick={() => setCommTab('members')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shrink-0 ${
                    commTab === 'members'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Members</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                    {(activeCommunity.members || []).length}
                  </span>
                </button>

                {(activeCommunity.myRole === 'admin' || activeCommunity.myRole === 'moderator') && (
                  <button
                    onClick={() => setCommTab('requests')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shrink-0 ${
                      commTab === 'requests'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Join Requests</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      (activeCommunity.pendingRequests || []).length > 0
                        ? 'bg-amber-500 text-black font-extrabold'
                        : 'bg-white/20 text-white'
                    }`}>
                      {(activeCommunity.pendingRequests || []).length}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setCommTab('rules')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shrink-0 ${
                    commTab === 'rules'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Rules</span>
                </button>
              </div>

              {/* TAB 1: FEED POSTS & MEDIA */}
              {commTab === 'posts' && (
                <div className="space-y-4">
                  {/* Member Post Composer (Pictures, Videos & Text) */}
                  <form
                    onSubmit={handleCreateCommunityPost}
                    className="bg-[#0B1021] border border-white/10 rounded-3xl p-4 space-y-3 shadow-md"
                  >
                    <textarea
                      rows={2}
                      value={commPostText}
                      onChange={(e) => setCommPostText(e.target.value)}
                      placeholder="Share photos, videos, or ideas with the community..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />

                    {/* Media Preview if attached */}
                    {commPostMediaUrl && (
                      <div className="relative inline-block rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                        {commPostMediaType === 'video' ? (
                          <video
                            src={commPostMediaUrl}
                            controls
                            className="max-h-48 rounded-2xl"
                          />
                        ) : (
                          <img
                            src={commPostMediaUrl}
                            alt="Attached preview"
                            className="max-h-48 rounded-2xl object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCommPostMediaUrl('');
                            setCommPostMediaType(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <input
                        ref={commPostFileRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadPostMedia(file);
                        }}
                        className="hidden"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => commPostFileRef.current?.click()}
                          disabled={uploadingPostMedia}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 inline-flex items-center gap-1.5 border border-white/5"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{uploadingPostMedia ? 'Uploading...' : 'Photo / Video from Gallery'}</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={(!commPostText.trim() && !commPostMediaUrl) || uploadingPostMedia}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" /> Post
                      </button>
                    </div>
                  </form>

                  {/* Posts List */}
                  <div className="space-y-3">
                    {(activeCommunity.posts || []).length === 0 ? (
                      <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-10 text-center space-y-2 text-slate-400">
                        <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-sm font-semibold text-white">No community posts yet</p>
                        <p className="text-xs">Be the first member to share a post, picture, or video above!</p>
                      </div>
                    ) : (
                      (activeCommunity.posts || []).map((p: any) => {
                        const canMod =
                          activeCommunity.myRole === 'admin' ||
                          activeCommunity.myRole === 'moderator';
                        const isAuthor = p.userId === userProfile?.id;
                        const reactionEmojis = ['❤️', '🔥', '👏', '😂', '💡'];

                        return (
                          <div
                            key={p.id}
                            className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-3 shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={p.author?.avatarUrl}
                                  name={p.author?.displayName}
                                  size="sm"
                                />
                                <div>
                                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{p.author?.displayName}</span>
                                    {p.userId === activeCommunity.creatorId && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                                        Admin
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {formatRelativeTime(p.createdAt)}
                                    {p.isPinned && ' · 📌 Pinned'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {canMod && (
                                  <button
                                    onClick={() =>
                                      handleCommunityAction(activeCommunity.id, 'pin_post', {
                                        postId: p.id,
                                      })
                                    }
                                    className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                    {p.isPinned ? 'Unpin' : 'Pin'}
                                  </button>
                                )}
                                {(canMod || isAuthor) && (
                                  <button
                                    onClick={() =>
                                      handleCommunityAction(activeCommunity.id, 'delete_post', {
                                        postId: p.id,
                                      })
                                    }
                                    className="text-xs text-rose-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                )}
                              </div>
                            </div>

                            {p.content && (
                              <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                                {p.content}
                              </p>
                            )}

                            {/* Render Attached Picture or Video */}
                            {p.mediaUrl && (
                              <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                                {p.mediaType === 'video' ? (
                                  <video
                                    src={p.mediaUrl}
                                    controls
                                    className="max-h-96 w-full object-contain rounded-2xl"
                                  />
                                ) : (
                                  <img
                                    src={p.mediaUrl}
                                    alt="Community media"
                                    className="max-h-96 w-full object-cover rounded-2xl"
                                  />
                                )}
                              </div>
                            )}

                            {/* Reactions Bar (Members can react with emoji) */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {reactionEmojis.map((emoji) => {
                                  const count = p.reactions?.[emoji] || 0;
                                  const isSelected = p.myReaction === emoji;
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        handleCommunityAction(activeCommunity.id, 'react_post', {
                                          postId: p.id,
                                          emoji,
                                        })
                                      }
                                      className={`px-2 py-1 rounded-xl text-xs flex items-center gap-1 border transition-all ${
                                        isSelected
                                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      {count > 0 && <span className="text-[10px] tabular-nums">{count}</span>}
                                    </button>
                                  );
                                })}
                              </div>

                              <span className="text-[11px] text-slate-400">
                                {p.likesCount || 0} reactions
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE COMMUNITY CHAT */}
              {commTab === 'chat' && (
                <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span>Live Community Group Chat</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Chat directly with all members of {activeCommunity.name}.
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {(activeCommunity.chatMessages || []).length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No chat messages yet. Send the first message to the group!
                      </div>
                    ) : (
                      (activeCommunity.chatMessages || []).map((msg: any) => {
                        const isMe = msg.userId === userProfile?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMe && (
                              <Avatar
                                src={msg.author?.avatarUrl}
                                name={msg.author?.displayName}
                                size="xs"
                              />
                            )}
                            <div className={`max-w-[75%] rounded-2xl p-3 text-xs space-y-1 ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white/10 text-slate-100 rounded-tl-none'
                            }`}>
                              {!isMe && (
                                <p className="text-[10px] font-bold text-blue-300">
                                  {msg.author?.displayName}
                                </p>
                              )}
                              {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                              {msg.mediaUrl && (
                                <img
                                  src={msg.mediaUrl}
                                  alt="Chat media"
                                  className="max-h-40 rounded-xl object-cover mt-1"
                                />
                              )}
                              <p className="text-[9px] text-white/50 text-right">
                                {formatRelativeTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Composer */}
                  <form
                    onSubmit={handleSendCommunityChat}
                    className="pt-2 border-t border-white/5 flex items-center gap-2"
                  >
                    <input
                      ref={commChatFileRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingChatMedia(true);
                        try {
                          let url = '';
                          try {
                            const up = await uploadMediaWithProgress(file, 'messages');
                            url = up.url;
                          } catch {
                            url = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(reader.result as string);
                              reader.readAsDataURL(file);
                            });
                          }
                          setCommChatMediaUrl(url);
                          showToast('Photo attached to chat!', 'success');
                        } catch {
                          showToast('Failed to attach photo.', 'error');
                        } finally {
                          setUploadingChatMedia(false);
                        }
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => commChatFileRef.current?.click()}
                      disabled={uploadingChatMedia}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                      title="Attach photo from gallery"
                    >
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    </button>

                    <input
                      type="text"
                      value={commChatText}
                      onChange={(e) => setCommChatText(e.target.value)}
                      placeholder="Type a message to the community..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={!commChatText.trim() && !commChatMediaUrl}
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: MEMBERS */}
              {commTab === 'members' && (
                <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span>Community Members</span>
                    <span className="text-xs text-slate-400">
                      {(activeCommunity.members || []).length} total
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {(activeCommunity.members || []).map((m: any, idx: number) => {
                      const memberProfile = m?.profile || m;
                      const isOwner = (m?.userId || memberProfile?.id) === activeCommunity.creatorId;
                      return (
                        <div
                          key={m?.id || memberProfile?.id || idx}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={memberProfile?.avatarUrl}
                              name={memberProfile?.displayName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                <span>{memberProfile?.displayName || 'Member'}</span>
                                {isOwner && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                                    Creator / Admin
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                @{memberProfile?.username || 'user'} · Role: {m?.role || 'member'}
                              </p>
                            </div>
                          </div>

                          {activeCommunity.myRole === 'admin' &&
                            (m?.userId || memberProfile?.id) !== userProfile?.id && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleCommunityAction(activeCommunity.id, 'set_role', {
                                      targetUserId: m?.userId || memberProfile?.id,
                                      role: m?.role === 'moderator' ? 'member' : 'moderator',
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] text-blue-300 font-semibold"
                                >
                                  {m?.role === 'moderator' ? 'Demote' : 'Make Mod'}
                                </button>
                                <button
                                  onClick={() =>
                                    handleCommunityAction(activeCommunity.id, 'remove_member', {
                                      targetUserId: m?.userId || memberProfile?.id,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-300 font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: JOIN REQUESTS (ADMIN & MOD) */}
              {commTab === 'requests' && (
                <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Pending Join Requests
                    </span>
                    <span className="text-xs text-slate-400">
                      {(activeCommunity.pendingRequests || []).length} waiting
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {(activeCommunity.pendingRequests || []).length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-400">
                        No pending join requests right now.
                      </div>
                    ) : (
                      (activeCommunity.pendingRequests || []).map((req: any) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={req.profile?.avatarUrl}
                              name={req.profile?.displayName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {req.profile?.displayName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                @{req.profile?.username} · Requested {formatRelativeTime(req.requestedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleCommunityAction(activeCommunity.id, 'approve_request', {
                                  targetUserId: req.userId,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleCommunityAction(activeCommunity.id, 'reject_request', {
                                  targetUserId: req.userId,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: RULES */}
              {commTab === 'rules' && (
                <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-400" /> Community Rules
                    </h3>
                    {activeCommunity.myRole === 'admin' && (
                      <button
                        onClick={() => setEditingRules((e) => !e)}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        {editingRules ? 'Cancel' : 'Edit Rules'}
                      </button>
                    )}
                  </div>

                  {editingRules ? (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={rulesDraft}
                        onChange={(e) => setRulesDraft(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
                      />
                      <button
                        onClick={async () => {
                          await handleCommunityAction(activeCommunity.id, 'update_community', {
                            rules: rulesDraft,
                          });
                          setEditingRules(false);
                          showToast('Community rules updated.', 'success');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        Save Rules
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {activeCommunity.rules || '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    );
  } catch {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-8 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">No friends yet</p>
          <p className="text-xs text-slate-400">
            Connect with creators and friends across BoostHub.
          </p>
          <button
            onClick={() => {
              setFriends([]);
              setPendingReceived([]);
              setPendingSent([]);
              setSuggestions([]);
              loadFriendsData();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Reload Friends
          </button>
        </div>
      </div>
    );
  }
};
