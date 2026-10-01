import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  RefreshCw,
  Sparkles,
  Flame,
  Users,
  Compass,
  Target,
  CheckCircle2,
  PlusSquare,
  Play,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  PostItem,
  StoryItem,
  MissionItem,
  MainTab,
} from '../types';
import {
  apiFetch,
  getCachedFeed,
  setCachedFeed,
  getCachedStories,
  setCachedStories,
  getCachedMissions,
  setCachedMissions,
  updateCachedPostStats,
} from '../services/api';
import { supabase, ADMIN_ABBA_UUID } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import {
  StoryViewerModal,
  CreateStoryModal,
} from '../components/StoryModal';

interface SuggestedCreatorCard {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  verified: boolean;
  xp: number;
  followers_count: number;
  tag: string;
  isFollowing: boolean;
}

interface HomeScreenProps {
  onOpenComments: (post: PostItem) => void;
  onOpenShare: (post: PostItem) => void;
  onSelectUser: (userId: string) => void;
  onChangeTab: (tab: MainTab) => void;
  onSelectHashtag: (tag: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenComments,
  onOpenShare,
  onSelectUser,
  onChangeTab,
  onSelectHashtag,
}) => {
  const { userProfile, realtimeEvents, showToast } = useAuth();
  const [feedTab, setFeedTab] = useState<
    'recommended' | 'following' | 'friends' | 'trending'
  >('recommended');
  const [posts, setPosts] = useState<PostItem[]>(
    () => getCachedFeed('recommended') || []
  );
  const [stories, setStories] = useState<StoryItem[]>(
    () => getCachedStories() || []
  );
  const [missions, setMissions] = useState<MissionItem[]>(
    () => getCachedMissions() || []
  );
  const [suggestedCreators, setSuggestedCreators] = useState<
    SuggestedCreatorCard[]
  >([]);
  const [seeAllCreatorsOpen, setSeeAllCreatorsOpen] = useState(false);
  const [followBusyIds, setFollowBusyIds] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [viewerStoryIndex, setViewerStoryIndex] = useState<number | null>(null);
  const [creatingStory, setCreatingStory] = useState(false);

  const viewTimersRef = useRef<Map<string, number>>(new Map());

  const fetchStories = useCallback(async () => {
    try {
      const list = await apiFetch<StoryItem[]>('/api/stories');
      setStories(list);
      setCachedStories(list);
    } catch {
      // ignore
    }
  }, []);

  const fetchMissions = useCallback(async () => {
    try {
      const dash = await apiFetch<{ missions: MissionItem[] }>(
        '/api/creator-dashboard'
      );
      const topMissions = dash.missions.slice(0, 4);
      setMissions(topMissions);
      setCachedMissions(topMissions);
    } catch {
      // ignore
    }
  }, []);

  const fetchSuggestedCreators = useCallback(async () => {
    try {
      const currentUserId = userProfile?.id || ADMIN_ABBA_UUID;

      // 1. Primary query on users table for verified or high-XP creators (xp > 5000)
      const { data: usersRows, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .eq('verified', true)
        .or('xp.gt.5000')
        .limit(10);

      // 2. Also query profiles table where live Supabase creator accounts are stored
      const { data: profilesRows } = await supabase
        .from('profiles')
        .select('*')
        .or('is_admin.eq.true,creator_of_week.eq.true,xp.gt.5000')
        .order('xp', { ascending: false })
        .limit(10);

      // 3. Load current user's follows from Supabase follows table
      const { data: followsRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      const followingSet = new Set<string>(
        (followsRows || []).map((f: any) => String(f.following_id))
      );

      const rawRows: any[] =
        !usersErr && usersRows && usersRows.length > 0
          ? [...usersRows, ...(profilesRows || [])]
          : profilesRows || [];

      const seen = new Set<string>();
      const mapped: SuggestedCreatorCard[] = [];

      for (const r of rawRows) {
        const id = String(r.id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const isAbba =
          id === ADMIN_ABBA_UUID ||
          String(r.username || '').toLowerCase() === 'abba';
        let metaVerified = false;
        if (typeof r.join_reason === 'string' && r.join_reason.includes('{')) {
          try {
            const parsed = JSON.parse(r.join_reason);
            metaVerified = Boolean(parsed?.verified);
          } catch {
            // ignore
          }
        }

        const isVerified = Boolean(
          isAbba ||
            r.verified === true ||
            r.is_admin === true ||
            r.creator_of_week === true ||
            metaVerified
        );

        const xpVal = Number(r.xp ?? 0);
        if (!isVerified && xpVal <= 5000) continue;

        mapped.push({
          id,
          display_name: isAbba
            ? 'Prince Abba'
            : String(r.display_name || r.username || 'BoostHub Creator').trim(),
          username: isAbba ? 'Abba' : String(r.username || 'creator').trim(),
          avatar_url: String(r.avatar_url || r.profile_picture || ''),
          verified: isVerified,
          xp: xpVal,
          followers_count: Number(r.followers_count ?? r.followers ?? 0),
          tag: 'Creators',
          isFollowing: followingSet.has(id),
        });
      }

      setSuggestedCreators(mapped.slice(0, 10));
    } catch {
      // ignore
    }
  }, [userProfile?.id]);

  const handleFollowSuggestedCreator = async (creator: SuggestedCreatorCard) => {
    const currentUserId = userProfile?.id || ADMIN_ABBA_UUID;
    if (followBusyIds[creator.id]) return;

    setFollowBusyIds((prev) => ({ ...prev, [creator.id]: true }));
    const wasFollowing = creator.isFollowing;
    const nextFollowing = !wasFollowing;
    const nextFollowersCount = nextFollowing
      ? creator.followers_count + 1
      : Math.max(0, creator.followers_count - 1);

    setSuggestedCreators((prev) =>
      prev.map((c) =>
        c.id === creator.id
          ? {
              ...c,
              isFollowing: nextFollowing,
              followers_count: nextFollowersCount,
            }
          : c
      )
    );

    try {
      if (nextFollowing) {
        // Insert into follows table (follower_id = me, following_id = creator)
        const { data: existing } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', creator.id);

        if (!existing || existing.length === 0) {
          await supabase.from('follows').insert({
            follower_id: currentUserId,
            following_id: creator.id,
          });
        }

        // Increment followers_count in profiles / users
        await supabase
          .from('profiles')
          .update({ followers: nextFollowersCount })
          .eq('id', creator.id);
        await supabase
          .from('users')
          .update({ followers_count: nextFollowersCount })
          .eq('id', creator.id);
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', creator.id);

        await supabase
          .from('profiles')
          .update({ followers: nextFollowersCount })
          .eq('id', creator.id);
        await supabase
          .from('users')
          .update({ followers_count: nextFollowersCount })
          .eq('id', creator.id);
      }

      try {
        supabase.channel('boosthub-global-realtime').send({
          type: 'broadcast',
          event: 'sync',
          payload: {
            type: 'profile_updated',
            userId: creator.id,
            followersCount: nextFollowersCount,
          },
        });
      } catch {
        // ignore
      }

      showToast(
        nextFollowing
          ? `Following ${creator.display_name}`
          : `Unfollowed ${creator.display_name}`,
        'info'
      );
    } catch {
      setSuggestedCreators((prev) =>
        prev.map((c) =>
          c.id === creator.id
            ? {
                ...c,
                isFollowing: wasFollowing,
                followers_count: creator.followers_count,
              }
            : c
        )
      );
      showToast('Could not update follow status', 'error');
    } finally {
      setFollowBusyIds((prev) => ({ ...prev, [creator.id]: false }));
    }
  };

  const fetchPosts = useCallback(
    async (reset = false, silent = false) => {
      if (reset && !silent) {
        const cached = getCachedFeed(feedTab);
        if (cached && cached.length > 0) {
          setPosts(cached);
        } else {
          setLoading(true);
        }
      }

      try {
        const offset = reset ? 0 : posts.length;
        const limit = 12;
        const fresh = await apiFetch<PostItem[]>(
          `/api/posts?tab=${feedTab}&limit=${limit}&offset=${offset}`
        );
        if (reset) {
          setPosts(fresh);
          setCachedFeed(feedTab, fresh);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const merged = [
              ...prev,
              ...fresh.filter((p) => !existingIds.has(p.id)),
            ];
            setCachedFeed(feedTab, merged);
            return merged;
          });
        }
        setHasMore(fresh.length >= limit);
      } catch {
        // retain cached
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [feedTab, posts.length]
  );

  useEffect(() => {
    fetchPosts(true, false);
    fetchStories();
    fetchMissions();
    fetchSuggestedCreators();
  }, [feedTab]);

  // AUTO-PLAY ON SCROLL + 1 VIEW PER PERSON (IntersectionObserver threshold 0.6)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const postId = video.dataset.postId;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.dataset.inView = 'true';
            video.defaultMuted = true;
            video.muted = true;
            video.playsInline = true;
            video.play().catch(() => {});

            // Count 1 view per person after 3 seconds of viewing
            if (postId && !video.dataset.viewCounted) {
              const existingTimer = viewTimersRef.current.get(postId);
              if (existingTimer) {
                window.clearTimeout(existingTimer);
              }
              const timerId = window.setTimeout(async () => {
                if (!video.dataset.viewCounted && video.dataset.inView === 'true') {
                  try {
                    const authRes = await supabase.auth.getUser();
                    const activeUserId =
                      authRes.data?.user?.id ||
                      userProfile?.id ||
                      ADMIN_ABBA_UUID;

                    const { error } = await supabase
                      .from('post_views')
                      .insert({ post_id: postId, user_id: activeUserId });

                    if (!error) {
                      await supabase.rpc('increment_view', {
                        post_id_input: postId,
                      });
                      video.dataset.viewCounted = 'true';

                      // Fetch updated views count from Supabase posts row
                      const { data: updatedPost } = await supabase
                        .from('posts')
                        .select('views')
                        .eq('id', postId)
                        .maybeSingle();
                      if (updatedPost && typeof updatedPost.views === 'number') {
                        updateCachedPostStats(postId, {
                          viewsCount: updatedPost.views,
                        });
                      }
                    } else {
                      // Ensure 1 view per person is recorded via Supabase video_watch_history & posts.views
                      const watchRes = await apiFetch<{
                        ok?: boolean;
                        alreadyViewed?: boolean;
                        viewsCount?: number;
                      }>(`/api/posts/${postId}/watch`, {
                        method: 'POST',
                        body: JSON.stringify({
                          watchDurationSeconds: 3,
                          completionPercentage: 100,
                        }),
                      });
                      video.dataset.viewCounted = 'true';
                      if (typeof watchRes?.viewsCount === 'number') {
                        updateCachedPostStats(postId, {
                          viewsCount: watchRes.viewsCount,
                        });
                      }
                    }
                  } catch {
                    // ignore
                  }
                }
              }, 3000);
              viewTimersRef.current.set(postId, timerId);
            }
          } else {
            video.dataset.inView = 'false';
            video.pause();
            if (postId) {
              const existingTimer = viewTimersRef.current.get(postId);
              if (existingTimer) {
                window.clearTimeout(existingTimer);
                viewTimersRef.current.delete(postId);
              }
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const videos = document.querySelectorAll('video[data-post-id]');
    videos.forEach((v) => observer.observe(v));

    return () => {
      observer.disconnect();
      viewTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      viewTimersRef.current.clear();
    };
  }, [posts, userProfile?.id]);

  // REALTIME SYNC: supabase.channel('posts-feed') for posts, post_views, and follows
  useEffect(() => {
    const channel = supabase
      .channel('posts-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as any;
            if (updated.id) {
              updateCachedPostStats(updated.id, {
                viewsCount: Number(updated.views ?? 0),
                likesCount: Number(updated.likes ?? 0),
              });
            }
          }
          fetchPosts(true, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_views' },
        () => {
          fetchPosts(true, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        () => {
          fetchSuggestedCreators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, fetchSuggestedCreators]);

  // Listen to immediate local & remote post stat updates (likes, comments, saves, views)
  useEffect(() => {
    const handlePostStatSync = (e: Event) => {
      const custom = e as CustomEvent<{
        postId: string;
        patch: Partial<PostItem>;
      }>;
      if (!custom.detail) return;
      const { postId, patch } = custom.detail;
      setPosts((prev) =>
        prev.map((p) => (String(p.id) === String(postId) ? { ...p, ...patch } : p))
      );
    };
    window.addEventListener('boosthub:post-updated', handlePostStatSync);
    return () => {
      window.removeEventListener('boosthub:post-updated', handlePostStatSync);
    };
  }, []);

  // Strictly enforce 24-hour stories expiration in live UI & periodic background sync
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nowMs = Date.now();
      setStories((prev) => {
        const filtered = prev.filter((st) => {
          const createdMs = new Date(st.createdAt).getTime();
          const expiresMs = new Date(st.expiresAt).getTime();
          return (
            expiresMs > nowMs && nowMs - createdMs < 24 * 60 * 60 * 1000
          );
        });
        if (filtered.length !== prev.length) {
          setCachedStories(filtered);
        }
        return filtered;
      });
      fetchPosts(true, true);
      fetchStories();
    }, 6000);

    return () => window.clearInterval(timer);
  }, [feedTab, fetchStories]);

  // Listen to Supabase realtime changes on posts, likes, comments, and stories
  useEffect(() => {
    if (realtimeEvents.length === 0) return;
    const latest = realtimeEvents[realtimeEvents.length - 1];
    if (
      latest.type === 'new_post' ||
      latest.type === 'posts_changed' ||
      latest.type === 'post_like' ||
      latest.type === 'post_comment' ||
      latest.type === 'post_view' ||
      latest.type === 'profile_updated'
    ) {
      fetchPosts(true, true);
      fetchSuggestedCreators();
    } else if (
      latest.type === 'new_story' ||
      latest.type === 'story_update'
    ) {
      fetchStories();
    }
  }, [realtimeEvents, fetchStories, fetchSuggestedCreators]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPosts(true),
      fetchStories(),
      fetchMissions(),
      fetchSuggestedCreators(),
    ]);
    showToast('Feed refreshed', 'info');
  };

  const filterButtons: Array<{
    id: typeof feedTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'recommended', label: 'For You', icon: Sparkles },
    { id: 'following', label: 'Following', icon: Compass },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'trending', label: 'Trending', icon: Flame },
  ];

  const renderSuggestedCreatorsCarousel = (keyPrefix: string) => {
    if (suggestedCreators.length === 0) return null;

    return (
      <section
        key={keyPrefix}
        className="bg-[#0B1220] border border-white/[0.08] rounded-3xl p-4 space-y-3"
      >
        {/* Header: "Suggested Creators" bold white left, "See All >" blue link right */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Suggested Creators
          </h3>
          <button
            type="button"
            onClick={() => setSeeAllCreatorsOpen(true)}
            className="text-xs font-semibold text-[#2B8CFF] hover:underline inline-flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal scroll cards: width 140px, #131A2A, rounded 16px, padding 12px, centered */}
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-1">
          {suggestedCreators.map((creator) => (
            <div
              key={`${keyPrefix}-${creator.id}`}
              className="w-[140px] shrink-0 bg-[#131A2A] rounded-[16px] p-[12px] border border-white/[0.06] flex flex-col items-center text-center justify-between"
            >
              {/* Top: Circular avatar 60px with blue verified check if verified */}
              <button
                type="button"
                onClick={() => onSelectUser(creator.id)}
                className="relative w-[60px] h-[60px] rounded-full focus:outline-none group"
              >
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.display_name}
                    referrerPolicy="no-referrer"
                    className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#2B8CFF]/40 group-hover:border-[#2B8CFF] transition-colors"
                  />
                ) : (
                  <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#2B8CFF] to-blue-700 flex items-center justify-center text-white font-bold text-lg border-2 border-[#2B8CFF]/40">
                    {creator.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {creator.verified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0B1220] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[#2B8CFF] fill-[#2B8CFF]/20" />
                  </span>
                )}
              </button>

              {/* Middle: display_name bold white, @username gray, tag "Creators" small blue pill */}
              <div className="w-full mt-2 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSelectUser(creator.id)}
                  className="text-xs font-bold text-white hover:underline truncate w-full"
                >
                  {creator.display_name}
                </button>
                <span className="text-[11px] text-slate-400 truncate w-full mt-0.5">
                  @{creator.username}
                </span>
                <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-[#2B8CFF]/15 text-[#2B8CFF] border border-[#2B8CFF]/30 text-[10px] font-semibold">
                  {creator.tag}
                </span>
              </div>

              {/* Bottom: Blue "Follow" button full width, or gray "Following" */}
              <button
                type="button"
                disabled={Boolean(followBusyIds[creator.id])}
                onClick={() => handleFollowSuggestedCreator(creator)}
                className={`mt-3 w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  creator.isFollowing
                    ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                    : 'bg-[#2B8CFF] hover:bg-[#1a7ae8] text-white shadow-[0_0_12px_rgba(43,140,255,0.35)]'
                }`}
              >
                {creator.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1220] max-w-6xl mx-auto px-4 sm:px-6 py-5 flex gap-7">
      {/* Main Feed Column */}
      <div className="flex-1 min-w-0 max-w-2xl mx-auto space-y-5">
        {/* 24-Hour Stories Bar */}
        <section className="bg-[#131A2A] border border-white/[0.08] rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400">
              24-Hour Stories
            </h2>
            <button
              onClick={() => setCreatingStory(true)}
              className="text-xs font-medium text-[#2B8CFF] hover:text-blue-300 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Story
            </button>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-1">
            {/* Create Story Trigger Card */}
            <button
              onClick={() => setCreatingStory(true)}
              className="relative w-[112px] sm:w-[122px] h-[184px] rounded-2xl overflow-hidden bg-[#0B1220] border border-white/10 hover:border-[#2B8CFF]/50 shrink-0 group flex flex-col justify-between text-left transition-all"
            >
              <div className="relative flex-1 w-full bg-gradient-to-b from-[#2B8CFF]/20 via-[#0B1220] to-[#0B1220] flex items-center justify-center overflow-hidden">
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Avatar
                    src={userProfile?.avatarUrl}
                    name={userProfile?.displayName}
                    size="lg"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent" />
              </div>

              <div className="relative z-10 px-2.5 pb-3 pt-4 bg-[#0B1220] flex flex-col items-center text-center">
                <span className="-mt-7 mb-1.5 w-8 h-8 rounded-full bg-[#2B8CFF] group-hover:bg-blue-500 text-white flex items-center justify-center ring-4 ring-[#0B1220] shadow-md transition-colors">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-semibold text-white truncate w-full">
                  Create Story
                </span>
              </div>
            </button>

            {/* Rectangular Story Content Cards */}
            {stories.map((story, idx) => (
              <button
                key={story.id}
                onClick={() => setViewerStoryIndex(idx)}
                className={`relative w-[112px] sm:w-[122px] h-[184px] rounded-2xl overflow-hidden shrink-0 group text-left border transition-all ${
                  story.hasViewed
                    ? 'border-white/15 hover:border-white/30'
                    : 'border-[#2B8CFF]/80 shadow-[0_0_16px_rgba(43,140,255,0.25)] hover:border-cyan-400'
                }`}
              >
                {story.mediaType === 'video' ? (
                  <>
                    <video
                      src={story.mediaUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover bg-black group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || `${story.author.displayName}'s story`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover bg-black group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80 pointer-events-none" />

                <div className="absolute top-2.5 left-2.5 z-10">
                  <Avatar
                    src={story.author.avatarUrl}
                    name={story.author.displayName}
                    size="sm"
                    hasStory
                    storyViewed={story.hasViewed}
                  />
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                  <p className="text-[11px] font-semibold text-white truncate drop-shadow">
                    {story.author.displayName}
                  </p>
                  {story.caption && (
                    <p className="text-[10px] text-slate-200/90 truncate mt-0.5 drop-shadow">
                      {story.caption}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Interactive Feed Filter Bar: For You / Following / Friends / Trending */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-[#131A2A] border border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar">
            {filterButtons.map((btn) => {
              const Icon = btn.icon;
              const active = feedTab === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setFeedTab(btn.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#2B8CFF] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handlePullRefresh}
            disabled={refreshing}
            className="min-h-[40px] min-w-[40px] rounded-2xl bg-[#131A2A] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center shrink-0"
            title="Refresh Feed"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#2B8CFF]' : ''}`}
            />
          </button>
        </div>

        {/* Feed Posts List + Suggested Creators every 3 posts in For You feed */}
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#131A2A] border border-white/[0.08] rounded-3xl p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-20 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="h-4 w-4/5 bg-white/10 rounded" />
                <div className="h-56 w-full bg-white/5 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="space-y-5">
            <div className="bg-[#131A2A] border border-white/[0.08] rounded-3xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2B8CFF]/15 border border-[#2B8CFF]/30 text-[#2B8CFF] flex items-center justify-center mx-auto">
                <PlusSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  No posts in this feed yet
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Publish the first real post, photo, or Capshot video to kick
                  off the feed!
                </p>
              </div>
              <button
                onClick={() => onChangeTab('create')}
                className="px-5 py-2.5 rounded-2xl bg-[#2B8CFF] hover:bg-[#1a7ae8] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Post</span>
              </button>
            </div>
            {feedTab === 'recommended' &&
              renderSuggestedCreatorsCarousel('empty-feed-creators')}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, idx) => {
              const showSuggestedCreatorsHere =
                feedTab === 'recommended' &&
                ((idx + 1) % 3 === 0 ||
                  (posts.length < 3 && idx === posts.length - 1));

              return (
                <React.Fragment key={post.id}>
                  <PostCard
                    post={post}
                    onOpenComments={onOpenComments}
                    onOpenShare={onOpenShare}
                    onSelectUser={onSelectUser}
                    onSelectHashtag={onSelectHashtag}
                    onPostRemoved={(removedId) =>
                      setPosts((prev) => prev.filter((p) => p.id !== removedId))
                    }
                  />
                  {showSuggestedCreatorsHere &&
                    renderSuggestedCreatorsCarousel(`creators-after-${idx}`)}
                </React.Fragment>
              );
            })}

            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => fetchPosts(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[#131A2A] hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300"
                >
                  Load More Posts
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Desktop Rail: Active Missions & Personalization Signals */}
      <aside className="hidden xl:block w-80 shrink-0 space-y-5">
        <div className="bg-[#131A2A] border border-white/[0.08] rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2B8CFF]" />
              <span>Active Missions</span>
            </h3>
            <button
              onClick={() => onChangeTab('me')}
              className="text-xs text-[#2B8CFF] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {missions.map((m) => {
              const pct = Math.min(
                100,
                Math.round((m.progress / m.targetCount) * 100)
              );
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-[#0B1220] border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{m.title}</span>
                    {m.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-slate-400 tabular-nums">
                        {m.progress}/{m.targetCount}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2B8CFF] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 tabular-nums">
                    Reward: +{m.xpReward} XP · +{m.boostPointsReward} BP
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {userProfile?.interests && userProfile.interests.length > 0 && (
          <div className="bg-[#131A2A] border border-white/[0.08] rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Your Selected Interests
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {userProfile.interests.join(' · ')}
            </p>
          </div>
        )}
      </aside>

      {/* See All Suggested Creators Modal */}
      {seeAllCreatorsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSeeAllCreatorsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#0B1220] border border-white/15 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Suggested Creators
              </h3>
              <button
                type="button"
                onClick={() => setSeeAllCreatorsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-1">
              {suggestedCreators.map((creator) => (
                <div
                  key={`modal-${creator.id}`}
                  className="bg-[#131A2A] rounded-[16px] p-[12px] border border-white/[0.06] flex flex-col items-center text-center justify-between"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSeeAllCreatorsOpen(false);
                      onSelectUser(creator.id);
                    }}
                    className="relative w-[60px] h-[60px] rounded-full"
                  >
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.display_name}
                        referrerPolicy="no-referrer"
                        className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#2B8CFF]/40"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#2B8CFF] to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                        {creator.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {creator.verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0B1220] flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#2B8CFF] fill-[#2B8CFF]/20" />
                      </span>
                    )}
                  </button>

                  <div className="w-full mt-2 flex flex-col items-center">
                    <span className="text-xs font-bold text-white truncate w-full">
                      {creator.display_name}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate w-full mt-0.5">
                      @{creator.username}
                    </span>
                    <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-[#2B8CFF]/15 text-[#2B8CFF] border border-[#2B8CFF]/30 text-[10px] font-semibold">
                      {creator.tag}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(followBusyIds[creator.id])}
                    onClick={() => handleFollowSuggestedCreator(creator)}
                    className={`mt-3 w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      creator.isFollowing
                        ? 'bg-white/10 hover:bg-white/15 text-slate-300'
                        : 'bg-[#2B8CFF] hover:bg-[#1a7ae8] text-white'
                    }`}
                  >
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewerStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={viewerStoryIndex}
          onClose={() => setViewerStoryIndex(null)}
          onStoriesChanged={fetchStories}
        />
      )}

      {creatingStory && (
        <CreateStoryModal
          onClose={() => setCreatingStory(false)}
          onCreated={fetchStories}
        />
      )}
    </div>
  );
};
