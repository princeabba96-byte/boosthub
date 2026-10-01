import React, { useEffect, useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  ChevronUp,
  ChevronDown,
  UserPlus,
  UserCheck,
  Flag,
  ThumbsDown,
  Video,
  Plus,
} from 'lucide-react';
import { PostItem, MainTab } from '../types';
import { apiFetch, updateCachedPostStats } from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { formatCompactNumber } from '../utils/format';
import {
  parseStudioUrlHash,
  buildCssFilterString,
  StudioFloatingOverlays,
} from '../components/StudioMediaEditor';

interface CapshotsScreenProps {
  onOpenComments: (post: PostItem) => void;
  onOpenShare: (post: PostItem) => void;
  onSelectUser: (userId: string) => void;
  onChangeTab: (tab: MainTab) => void;
}

export const CapshotsScreen: React.FC<CapshotsScreenProps> = ({
  onOpenComments,
  onOpenShare,
  onSelectUser,
  onChangeTab,
}) => {
  const { userProfile, realtimeEvents, showToast } = useAuth();
  const [capshots, setCapshots] = useState<PostItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [capshotTime, setCapshotTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverAudioRef = useRef<HTMLAudioElement>(null);
  const watchStartRef = useRef<number>(Date.now());
  const touchStartYRef = useRef<number | null>(null);
  const likeBusyRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    apiFetch<PostItem[]>('/api/capshots?limit=30&offset=0')
      .then((list) => {
        setCapshots(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handlePostStatSync = (e: Event) => {
      const custom = e as CustomEvent<{
        postId: string;
        patch: Partial<PostItem>;
      }>;
      if (!custom.detail) return;
      const { postId, patch } = custom.detail;
      setCapshots((prev) =>
        prev.map((c) => (String(c.id) === String(postId) ? { ...c, ...patch } : c))
      );
    };
    window.addEventListener('boosthub:post-updated', handlePostStatSync);
    return () => {
      window.removeEventListener('boosthub:post-updated', handlePostStatSync);
    };
  }, []);

  useEffect(() => {
    if (realtimeEvents.length === 0) return;
    const latest = realtimeEvents[realtimeEvents.length - 1];
    if (
      latest.type === 'post_like' ||
      latest.type === 'post_comment' ||
      latest.type === 'posts_changed'
    ) {
      apiFetch<PostItem[]>('/api/capshots?limit=30&offset=0')
        .then((list) => {
          setCapshots(list);
        })
        .catch(() => {});
    }
  }, [realtimeEvents]);

  const currentVideo = capshots[currentIndex];
  const nextVideo = capshots[currentIndex + 1];

  // Record watch duration & completion percentage when switching videos
  const flushWatchMetrics = (post: PostItem | undefined, skipped: boolean) => {
    if (!post) return;
    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - watchStartRef.current) / 1000)
    );
    const vidEl = videoRef.current;
    const duration = vidEl?.duration || 15;
    const pct = Math.min(100, Math.round((elapsedSec / duration) * 100));

    apiFetch(`/api/posts/${post.id}/watch`, {
      method: 'POST',
      body: JSON.stringify({
        watchDurationSeconds: elapsedSec,
        completionPercentage: pct,
        skipped,
      }),
    }).catch(() => {});
  };

  useEffect(() => {
    watchStartRef.current = Date.now();
    setPaused(false);
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = muted;
      videoRef.current.playsInline = true;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (!currentVideo?.id) return;
    const postId = String(currentVideo.id);
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiFetch<{
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
        if (typeof res?.viewsCount === 'number') {
          updateCachedPostStats(postId, { viewsCount: res.viewsCount });
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [currentIndex, currentVideo?.id]);

  const goNext = () => {
    if (currentIndex < capshots.length - 1) {
      const elapsed = (Date.now() - watchStartRef.current) / 1000;
      flushWatchMetrics(currentVideo, elapsed < 2);
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      flushWatchMetrics(currentVideo, false);
      setCurrentIndex((i) => i - 1);
    }
  };

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      if (voiceoverAudioRef.current && !muted) {
        voiceoverAudioRef.current.currentTime = vid.currentTime || 0;
        voiceoverAudioRef.current.play().catch(() => {});
      }
      setPaused(false);
    } else {
      vid.pause();
      voiceoverAudioRef.current?.pause();
      setPaused(true);
    }
  };

  const handleLike = async () => {
    if (!currentVideo || likeBusyRef.current) return;
    likeBusyRef.current = true;
    const prevLiked = currentVideo.isLiked;
    const prevCount = currentVideo.likesCount;
    const nextLiked = !prevLiked;
    const optimisticCount = nextLiked
      ? prevCount + 1
      : Math.max(0, prevCount - 1);

    setCapshots((list) =>
      list.map((item, idx) =>
        idx === currentIndex
          ? {
              ...item,
              isLiked: nextLiked,
              likesCount: optimisticCount,
            }
          : item
      )
    );
    updateCachedPostStats(currentVideo.id, {
      isLiked: nextLiked,
      likesCount: optimisticCount,
    });

    try {
      const res = await apiFetch<{ liked?: boolean; likesCount?: number }>(
        `/api/posts/${currentVideo.id}/like`,
        { method: 'POST' }
      );
      const finalLiked =
        typeof res?.liked === 'boolean' ? res.liked : nextLiked;
      const finalCount =
        typeof res?.likesCount === 'number' ? res.likesCount : optimisticCount;
      setCapshots((list) =>
        list.map((item, idx) =>
          idx === currentIndex
            ? {
                ...item,
                isLiked: finalLiked,
                likesCount: finalCount,
              }
            : item
        )
      );
      updateCachedPostStats(currentVideo.id, {
        isLiked: finalLiked,
        likesCount: finalCount,
      });
    } catch {
      setCapshots((list) =>
        list.map((item, idx) =>
          idx === currentIndex
            ? { ...item, isLiked: prevLiked, likesCount: prevCount }
            : item
        )
      );
      updateCachedPostStats(currentVideo.id, {
        isLiked: prevLiked,
        likesCount: prevCount,
      });
    } finally {
      likeBusyRef.current = false;
    }
  };

  const handleSave = async () => {
    if (!currentVideo) return;
    const prevSaved = currentVideo.isSaved;
    const prevCount = currentVideo.savesCount;
    const nextSaved = !prevSaved;

    setCapshots((list) =>
      list.map((item, idx) =>
        idx === currentIndex
          ? {
              ...item,
              isSaved: nextSaved,
              savesCount: nextSaved ? prevCount + 1 : Math.max(0, prevCount - 1),
            }
          : item
      )
    );

    try {
      await apiFetch(`/api/posts/${currentVideo.id}/save`, { method: 'POST' });
      showToast(nextSaved ? 'Capshot saved!' : 'Removed from saved', 'info');
    } catch {
      setCapshots((list) =>
        list.map((item, idx) =>
          idx === currentIndex
            ? { ...item, isSaved: prevSaved, savesCount: prevCount }
            : item
        )
      );
    }
  };

  const handleFollow = async () => {
    if (!currentVideo) return;
    try {
      const res = await apiFetch<{ following: boolean }>(
        `/api/profiles/${currentVideo.userId}/follow`,
        { method: 'POST' }
      );
      setCapshots((list) =>
        list.map((item) =>
          item.userId === currentVideo.userId
            ? { ...item, isFollowingAuthor: res.following }
            : item
        )
      );
      showToast(
        res.following
          ? `Following @${currentVideo.author.username}`
          : `Unfollowed @${currentVideo.author.username}`,
        'info'
      );
    } catch {
      showToast('Failed to update follow status.', 'error');
    }
  };

  const handleFeedback = async (type: 'not_interested' | 'report') => {
    if (!currentVideo) return;
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'video',
          targetId: String(currentVideo.id),
          feedbackType: type,
          reason: `Capshots ${type}`,
        }),
      });
      if (type === 'not_interested') {
        showToast('We will show fewer Capshots like this.', 'info');
        setCapshots((prev) => prev.filter((c) => c.id !== currentVideo.id));
      } else {
        showToast('Capshot reported to moderation.', 'success');
      }
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-7.5rem)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading Capshots...</p>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-purple-600/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
          <Video className="w-7 h-7" />
        </div>
        <h2 className="font-display text-xl font-bold text-white">
          No Capshots Uploaded Yet
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Publish your first vertical short video in the Create tab to launch
          the Capshots stream!
        </p>
        <button
          onClick={() => onChangeTab('create')}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Upload a Capshot
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7.2rem)] lg:h-[calc(100vh-3.5rem)] flex items-center justify-center bg-black/95 p-0 sm:p-4 select-none">
      {/* Preload Next Video in Background */}
      {nextVideo?.mediaUrl && (
        <video
          src={nextVideo.mediaUrl.split('#')[0]}
          preload="auto"
          muted
          className="hidden"
        />
      )}

      <div
        onTouchStart={(e) => {
          touchStartYRef.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartYRef.current === null) return;
          const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
          if (deltaY > 55) goNext();
          else if (deltaY < -55) goPrev();
          touchStartYRef.current = null;
        }}
        className="relative w-full max-w-[420px] h-full sm:rounded-3xl overflow-hidden bg-[#060813] border border-white/10 shadow-2xl flex items-center justify-center"
      >
        {currentVideo.mediaUrl ? (() => {
          const studioMeta = parseStudioUrlHash(currentVideo.mediaUrl);
          const cleanVideoSrc = currentVideo.mediaUrl.split('#')[0];
          const attachedAudioUrl =
            studioMeta?.voiceoverAudioUrl || studioMeta?.customAudioUrl || '';
          return (
            <>
              {attachedAudioUrl && (
                <audio
                  ref={voiceoverAudioRef}
                  src={attachedAudioUrl}
                  loop
                  preload="auto"
                  muted={muted}
                  className="hidden"
                />
              )}
              <video
                ref={videoRef}
                src={cleanVideoSrc}
                poster={currentVideo.thumbnailUrl || undefined}
                autoPlay
                loop
                playsInline
                preload="auto"
                muted={muted || Boolean(attachedAudioUrl) || Boolean(studioMeta?.muteAudio)}
                style={
                  studioMeta
                    ? {
                        filter: buildCssFilterString(studioMeta),
                        transform: `rotate(${studioMeta.rotation || 0}deg) scale(${
                          (studioMeta.zoom || 1) * (studioMeta.flipH ? -1 : 1)
                        }, ${(studioMeta.zoom || 1) * (studioMeta.flipV ? -1 : 1)})`,
                      }
                    : undefined
                }
                onPlay={() => {
                  setPaused(false);
                  if (voiceoverAudioRef.current) {
                    voiceoverAudioRef.current.muted = muted;
                    if (!muted) {
                      voiceoverAudioRef.current.play().catch(() => {});
                    }
                  }
                }}
                onPause={() => {
                  voiceoverAudioRef.current?.pause();
                }}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  if (studioMeta?.playbackSpeed) {
                    vid.playbackRate = studioMeta.playbackSpeed;
                  }
                  if (studioMeta?.trimStart && studioMeta.trimStart > 0) {
                    vid.currentTime = studioMeta.trimStart;
                  }
                }}
                onTimeUpdate={(e) => {
                  const vid = e.currentTarget;
                  setCapshotTime(vid.currentTime || 0);
                  if (
                    studioMeta?.trimEnd &&
                    studioMeta.trimEnd > 0 &&
                    vid.currentTime >= studioMeta.trimEnd
                  ) {
                    vid.currentTime = studioMeta.trimStart || 0;
                    if (voiceoverAudioRef.current) {
                      voiceoverAudioRef.current.currentTime = 0;
                    }
                  }
                }}
                onClick={togglePlayPause}
                onEnded={() => flushWatchMetrics(currentVideo, false)}
                className="w-full h-full object-cover cursor-pointer"
              />
              {studioMeta && (
                <StudioFloatingOverlays
                  stickers={studioMeta.stickers}
                  texts={studioMeta.texts}
                  subtitles={studioMeta.subtitles}
                  currentTime={capshotTime}
                />
              )}
            </>
          );
        })() : (
          <div
            onClick={togglePlayPause}
            className="w-full h-full flex items-center justify-center p-8 text-center bg-gradient-to-br from-blue-950 via-[#080D21] to-purple-950"
          >
            <p className="text-lg font-semibold text-white">
              {currentVideo.caption}
            </p>
          </div>
        )}

        {paused && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </button>
        )}

        {/* Top Controls: Mute & Swipe Up/Down Buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            onClick={() => {
              const nextMuted = !muted;
              setMuted(nextMuted);
              if (voiceoverAudioRef.current) {
                voiceoverAudioRef.current.muted = nextMuted;
                if (!nextMuted) {
                  voiceoverAudioRef.current.currentTime =
                    videoRef.current?.currentTime || 0;
                  voiceoverAudioRef.current.play().catch(() => {});
                } else {
                  voiceoverAudioRef.current.pause();
                }
              }
            }}
            className="min-h-[44px] min-w-[44px] rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center"
          >
            {muted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="min-h-[40px] min-w-[40px] rounded-full bg-black/50 backdrop-blur-md text-white disabled:opacity-30 flex items-center justify-center"
              title="Previous Capshot"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex >= capshots.length - 1}
              className="min-h-[40px] min-w-[40px] rounded-full bg-black/50 backdrop-blur-md text-white disabled:opacity-30 flex items-center justify-center"
              title="Next Capshot"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Vertical Action Rail */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                currentVideo.isLiked
                  ? 'bg-pink-500 text-white'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${currentVideo.isLiked ? 'fill-current' : ''}`}
              />
            </div>
            <span className="text-xs font-semibold text-white tabular-nums">
              {formatCompactNumber(currentVideo.likesCount)}
            </span>
          </button>

          <button
            onClick={() => onOpenComments(currentVideo)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white tabular-nums">
              {formatCompactNumber(currentVideo.commentsCount)}
            </span>
          </button>

          <button
            onClick={handleSave}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md ${
                currentVideo.isSaved
                  ? 'bg-purple-600 text-white'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${currentVideo.isSaved ? 'fill-current' : ''}`}
              />
            </div>
            <span className="text-xs font-semibold text-white tabular-nums">
              {formatCompactNumber(currentVideo.savesCount)}
            </span>
          </button>

          <button
            onClick={() => onOpenShare(currentVideo)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-white tabular-nums">
              {formatCompactNumber(currentVideo.sharesCount)}
            </span>
          </button>

          <button
            onClick={() => handleFeedback('not_interested')}
            className="w-9 h-9 rounded-full bg-black/50 text-slate-300 hover:text-white flex items-center justify-center"
            title="Not Interested"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleFeedback('report')}
            className="w-9 h-9 rounded-full bg-black/50 text-rose-400 hover:text-rose-300 flex items-center justify-center"
            title="Report Capshot"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Scrim Overlay: Creator Info, Caption, Hashtags */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pr-16 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 space-y-2">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={currentVideo.author.avatarUrl}
              name={currentVideo.author.displayName}
              size="sm"
              onClick={() => onSelectUser(currentVideo.author.id)}
            />
            <button
              onClick={() => onSelectUser(currentVideo.author.id)}
              className="text-sm font-bold text-white hover:underline truncate"
            >
              @{currentVideo.author.username}
            </button>
            {currentVideo.userId !== userProfile?.id && (
              <button
                onClick={handleFollow}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                {currentVideo.isFollowingAuthor ? (
                  <>
                    <UserCheck className="w-3 h-3" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" /> Follow
                  </>
                )}
              </button>
            )}
          </div>

          {currentVideo.caption && (
            <p className="text-xs sm:text-sm text-slate-100 line-clamp-3">
              {currentVideo.caption}
            </p>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            {currentVideo.hashtags && (
              <span className="text-blue-400 truncate">
                {currentVideo.hashtags}
              </span>
            )}
            <span>·</span>
            <span className="tabular-nums">
              {formatCompactNumber(currentVideo.viewsCount)} views
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
