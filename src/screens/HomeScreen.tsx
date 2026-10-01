import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  Sparkles,
  Flame,
  Users,
  Compass,
  Clock,
  Target,
  CheckCircle2,
  PlusSquare,
  Play,
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
} from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import {
  StoryViewerModal,
  CreateStoryModal,
} from '../components/StoryModal';

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
    'recommended' | 'following' | 'friends' | 'trending' | 'new'
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [viewerStoryIndex, setViewerStoryIndex] = useState<number | null>(null);
  const [creatingStory, setCreatingStory] = useState(false);

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

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (reset) {
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
    fetchPosts(true);
    fetchStories();
    fetchMissions();
  }, [feedTab]);

  // Listen to Supabase realtime changes on posts, likes, comments, and stories
  useEffect(() => {
    if (realtimeEvents.length === 0) return;
    const latest = realtimeEvents[realtimeEvents.length - 1];
    if (
      latest.type === 'new_post' ||
      latest.type === 'posts_changed' ||
      latest.type === 'post_like' ||
      latest.type === 'post_comment' ||
      latest.type === 'profile_updated'
    ) {
      fetchPosts(true);
    } else if (
      latest.type === 'new_story' ||
      latest.type === 'story_update'
    ) {
      fetchStories();
    }
  }, [realtimeEvents, fetchPosts, fetchStories]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(true), fetchStories(), fetchMissions()]);
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
    { id: 'new', label: 'Latest', icon: Clock },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex gap-7">
      {/* Main Feed Column */}
      <div className="flex-1 min-w-0 max-w-2xl mx-auto space-y-5">
        {/* 24-Hour Stories Bar */}
        <section className="bg-[#0B1021]/90 border border-white/[0.08] rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400">
              24-Hour Stories
            </h2>
            <button
              onClick={() => setCreatingStory(true)}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Story
            </button>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-1">
            {/* Create Story Trigger Card */}
            <button
              onClick={() => setCreatingStory(true)}
              className="relative w-[112px] sm:w-[122px] h-[184px] rounded-2xl overflow-hidden bg-[#11182E] border border-white/10 hover:border-blue-500/50 shrink-0 group flex flex-col justify-between text-left transition-all"
            >
              <div className="relative flex-1 w-full bg-gradient-to-b from-blue-600/20 via-[#0B1021] to-[#0B1021] flex items-center justify-center overflow-hidden">
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1021] via-transparent to-transparent" />
              </div>

              <div className="relative z-10 px-2.5 pb-3 pt-4 bg-[#0B1021] flex flex-col items-center text-center">
                <span className="-mt-7 mb-1.5 w-8 h-8 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center ring-4 ring-[#0B1021] shadow-md transition-colors">
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
                    : 'border-blue-500/80 shadow-[0_0_16px_rgba(10,132,255,0.25)] hover:border-cyan-400'
                }`}
              >
                {/* Story Content Preview (Picture shows normal; Video shows preview frame and plays when tapped) */}
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

                {/* Subtle top & bottom gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80 pointer-events-none" />

                {/* Normal Profile Picture Avatar in Top-Left */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <Avatar
                    src={story.author.avatarUrl}
                    name={story.author.displayName}
                    size="sm"
                    hasStory
                    storyViewed={story.hasViewed}
                  />
                </div>

                {/* Author Name & Optional Caption at Bottom */}
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

        {/* Interactive Feed Filter Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-[#0B1021] border border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar">
            {filterButtons.map((btn) => {
              const Icon = btn.icon;
              const active = feedTab === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setFeedTab(btn.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
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
            className="min-h-[40px] min-w-[40px] rounded-2xl bg-[#0B1021] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center shrink-0"
            title="Refresh Feed"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`}
            />
          </button>
        </div>

        {/* Feed Posts List */}
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#0B1021] border border-white/[0.08] rounded-3xl p-5 space-y-4 animate-pulse"
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
          <div className="bg-[#0B1021]/90 border border-white/[0.08] rounded-3xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
              <PlusSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                No posts in this feed yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                BoostHub never generates fake posts or fake accounts. Publish the
                first real post, photo, or Capshot video to kick off the feed!
              </p>
            </div>
            <button
              onClick={() => onChangeTab('create')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Post</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onSelectUser={onSelectUser}
                onSelectHashtag={onSelectHashtag}
                onPostRemoved={(removedId) =>
                  setPosts((prev) => prev.filter((p) => p.id !== removedId))
                }
              />
            ))}

            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => fetchPosts(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300"
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
        <div className="bg-[#0B1021]/90 border border-white/[0.08] rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Active Missions</span>
            </h3>
            <button
              onClick={() => onChangeTab('me')}
              className="text-xs text-blue-400 hover:underline"
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
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2"
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
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
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
          <div className="bg-[#0B1021]/90 border border-white/[0.08] rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Your Selected Interests
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {userProfile.interests.join(' · ')}
            </p>
          </div>
        )}
      </aside>

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
