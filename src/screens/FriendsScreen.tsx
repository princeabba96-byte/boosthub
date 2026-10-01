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
} from 'lucide-react';
import {
  CommunityItem,
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
  const [activeCommunity, setActiveCommunity] = useState<any | null>(null);
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  // New Community Form
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commCategory, setCommCategory] = useState('Creators');
  const [commRules, setCommRules] = useState(
    '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.'
  );
  const [commImageUrl, setCommImageUrl] = useState('');
  const [uploadingCommImg, setUploadingCommImg] = useState(false);
  const commFileRef = useRef<HTMLInputElement>(null);

  // Active Community Post Composer
  const [commPostText, setCommPostText] = useState('');
  const [editingRules, setEditingRules] = useState(false);
  const [rulesDraft, setRulesDraft] = useState('');

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

  const loadCommunityDetail = async (id: number) => {
    try {
      const detail = await apiFetch(`/api/communities/${id}`);
      if (detail && typeof detail === 'object') {
        setActiveCommunity({
          ...detail,
          posts: Array.isArray(detail.posts) ? detail.posts : [],
          members: Array.isArray(detail.members) ? detail.members : [],
        });
        setRulesDraft(detail.rules || '');
      }
    } catch {
      showToast('Failed to load community.', 'error');
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
        }),
      });
      setCommName('');
      setCommDesc('');
      setCommImageUrl('');
      setCreatingCommunity(false);
      await loadCommunities();
      await loadCommunityDetail(created.id);
      showToast(`Community "${created.name}" created!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not create community.', 'error');
    }
  };

  const handleCommunityAction = async (
    communityId: number,
    action: string,
    payload?: any
  ) => {
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
              People You May Know
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
              <h3 className="text-sm font-semibold text-white">
                Create a New Community
              </h3>
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
                    placeholder="e.g. BoostHub Tech Builders"
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
                  Community Rules
                </label>
                <textarea
                  rows={3}
                  value={commRules}
                  onChange={(e) => setCommRules(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <input
                  ref={commFileRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCommImg(true);
                    try {
                      const up = await uploadMediaWithProgress(
                        file,
                        'communities'
                      );
                      setCommImageUrl(up.url);
                      showToast('Community cover uploaded!', 'success');
                    } catch {
                      showToast('Cover upload failed.', 'error');
                    } finally {
                      setUploadingCommImg(false);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => commFileRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingCommImg
                    ? 'Uploading Cover...'
                    : commImageUrl
                      ? 'Cover Uploaded ✓'
                      : 'Upload Cover Image'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Launch Community
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
                      <button
                        onClick={() => loadCommunityDetail(comm.id)}
                        className="text-base font-bold text-white hover:underline text-left truncate block"
                      >
                        {comm.name}
                      </button>
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
                          comm.isMember ? 'leave' : 'join'
                        )
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                        comm.isMember
                          ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {comm.isMember ? 'Joined' : 'Join'}
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
          <button
            onClick={() => setActiveCommunity(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Communities
          </button>

          <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={activeCommunity.imageUrl}
                  name={activeCommunity.name}
                  size="xl"
                />
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {activeCommunity.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeCommunity.category} ·{' '}
                    <span className="tabular-nums">
                      {activeCommunity.members?.length || 1} members
                    </span>
                    {activeCommunity.myRole && (
                      <span> · Your role: {activeCommunity.myRole}</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-200 mt-2">
                    {activeCommunity.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                      activeCommunity.isMember ? 'leave' : 'join'
                    )
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                    activeCommunity.isMember
                      ? 'bg-white/10 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {activeCommunity.isMember ? 'Leave' : 'Join Community'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Community Posts Column */}
            <div className="lg:col-span-2 space-y-4">
              {activeCommunity.isMember && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commPostText.trim()) return;
                    await handleCommunityAction(activeCommunity.id, 'post', {
                      content: commPostText.trim(),
                    });
                    setCommPostText('');
                    showToast('Posted to community!', 'success');
                  }}
                  className="bg-[#0B1021] border border-white/10 rounded-3xl p-4 flex gap-3"
                >
                  <input
                    type="text"
                    value={commPostText}
                    onChange={(e) => setCommPostText(e.target.value)}
                    placeholder="Share something with the community..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white"
                  />
                  <button
                    type="submit"
                    disabled={!commPostText.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {(activeCommunity.posts || []).length === 0 ? (
                  <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-8 text-center text-xs text-slate-400">
                    No community posts yet. Start the first discussion!
                  </div>
                ) : (
                  (activeCommunity.posts || []).map((p: any) => {
                    const canMod =
                      activeCommunity.myRole === 'admin' ||
                      activeCommunity.myRole === 'moderator';
                    return (
                      <div
                        key={p.id}
                        className="bg-[#0B1021] border border-white/10 rounded-3xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={p.author?.avatarUrl}
                              name={p.author?.displayName}
                              size="sm"
                            />
                            <div>
                              <p className="text-xs font-semibold text-white">
                                {p.author?.displayName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatRelativeTime(p.createdAt)}
                                {p.isPinned && ' · Pinned'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {canMod && (
                              <button
                                onClick={() =>
                                  handleCommunityAction(
                                    activeCommunity.id,
                                    'pin_post',
                                    { postId: p.id }
                                  )
                                }
                                className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1"
                              >
                                <Pin className="w-3.5 h-3.5" />
                                {p.isPinned ? 'Unpin' : 'Pin'}
                              </button>
                            )}
                            {(canMod || p.userId === userProfile?.id) && (
                              <button
                                onClick={() =>
                                  handleCommunityAction(
                                    activeCommunity.id,
                                    'delete_post',
                                    { postId: p.id }
                                  )
                                }
                                className="text-xs text-rose-400 hover:underline inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-100 whitespace-pre-wrap">
                          {p.content}
                        </p>

                        <div className="pt-2 border-t border-white/5 flex items-center gap-4 text-xs text-slate-400">
                          <button
                            onClick={() =>
                              handleCommunityAction(
                                activeCommunity.id,
                                'like_post',
                                { postId: p.id }
                              )
                            }
                            className="inline-flex items-center gap-1.5 hover:text-pink-400"
                          >
                            <Heart className="w-4 h-4" />
                            <span className="tabular-nums">
                              {p.likesCount || 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Community Rules & Member Moderation Sidebar */}
            <div className="space-y-4">
              <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-400" /> Community Rules
                  </h3>
                  {activeCommunity.myRole === 'admin' && (
                    <button
                      onClick={() => setEditingRules((e) => !e)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      {editingRules ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>

                {editingRules ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={rulesDraft}
                      onChange={(e) => setRulesDraft(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                    <button
                      onClick={async () => {
                        await handleCommunityAction(
                          activeCommunity.id,
                          'update_rules',
                          { rules: rulesDraft }
                        );
                        setEditingRules(false);
                        showToast('Community rules updated.', 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                    >
                      Save Rules
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {activeCommunity.rules}
                  </p>
                )}
              </div>

              <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Members ({(activeCommunity.members || []).length})
                </h3>
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {(activeCommunity.members || []).map((m: any, idx: number) => {
                    const memberProfile = m?.profile || m;
                    return (
                      <div
                        key={m?.id || memberProfile?.id || idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            src={memberProfile?.avatarUrl}
                            name={memberProfile?.displayName}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">
                              {memberProfile?.displayName || 'Member'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {m?.role || 'member'}
                            </p>
                          </div>
                        </div>

                        {activeCommunity.myRole === 'admin' &&
                          (m?.userId || memberProfile?.id) !== userProfile?.id && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleCommunityAction(
                                    activeCommunity.id,
                                    'set_role',
                                    {
                                      targetUserId: m?.userId || memberProfile?.id,
                                      role:
                                        m?.role === 'moderator'
                                          ? 'member'
                                          : 'moderator',
                                    }
                                  )
                                }
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-blue-300"
                              >
                                {m?.role === 'moderator' ? 'Demote' : 'Make Mod'}
                              </button>
                              <button
                                onClick={() =>
                                  handleCommunityAction(
                                    activeCommunity.id,
                                    'remove_member',
                                    { targetUserId: m?.userId || memberProfile?.id }
                                  )
                                }
                                className="px-2 py-1 rounded bg-rose-500/10 text-[10px] text-rose-300"
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
            </div>
          </div>
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
