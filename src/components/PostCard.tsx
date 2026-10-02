import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  ThumbsDown,
  Flag,
  UserPlus,
  UserCheck,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PostItem } from '../types';
import {
  apiFetch,
  setCachedFeed,
  updateCachedPostStats,
} from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { formatRelativeTime, formatCompactNumber } from '../utils/format';
import {
  parseStudioUrlHash,
  buildCssFilterString,
  StudioFloatingOverlays,
} from './StudioMediaEditor';
import {
  getGlobalVideoMuted,
  setGlobalVideoMuted,
  subscribeToGlobalAudio,
} from '../utils/globalAudio';

interface PostCardProps {
  post: PostItem;
  onOpenComments: (post: PostItem) => void;
  onOpenShare: (post: PostItem) => void;
  onSelectUser: (userId: string) => void;
  onPostRemoved?: (postId: number) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenComments,
  onOpenShare,
  onSelectUser,
  onPostRemoved,
  onSelectHashtag,
}) => {
  const { userProfile, showToast } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [savesCount, setSavesCount] = useState(post.savesCount);
  const [isFollowing, setIsFollowing] = useState(post.isFollowingAuthor);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getGlobalVideoMuted());
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(17);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const likeBusyRef = useRef(false);

  useEffect(() => {
    return subscribeToGlobalAudio((muted) => {
      setIsMuted(muted);
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
      if (voiceoverAudioRef.current) {
        voiceoverAudioRef.current.muted = muted;
      }
    });
  }, []);

  const formatVideoClock = (sec: number) => {
    const safe = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setCommentsCount(post.commentsCount);
    setViewsCount(post.viewsCount);
    setIsSaved(post.isSaved);
    setSavesCount(post.savesCount);
    setIsFollowing(post.isFollowingAuthor);
  }, [
    post.id,
    post.isLiked,
    post.likesCount,
    post.commentsCount,
    post.viewsCount,
    post.isSaved,
    post.savesCount,
    post.isFollowingAuthor,
  ]);

  useEffect(() => {
    const handlePostStatSync = (e: Event) => {
      const custom = e as CustomEvent<{
        postId: string;
        patch: Partial<PostItem>;
      }>;
      if (!custom.detail || String(custom.detail.postId) !== String(post.id)) {
        return;
      }
      const { patch } = custom.detail;
      if (typeof patch.isLiked === 'boolean') setIsLiked(patch.isLiked);
      if (typeof patch.likesCount === 'number') setLikesCount(patch.likesCount);
      if (typeof patch.commentsCount === 'number') {
        setCommentsCount(patch.commentsCount);
      }
      if (typeof patch.viewsCount === 'number') setViewsCount(patch.viewsCount);
      if (typeof patch.isSaved === 'boolean') setIsSaved(patch.isSaved);
      if (typeof patch.savesCount === 'number') setSavesCount(patch.savesCount);
    };
    window.addEventListener('boosthub:post-updated', handlePostStatSync);
    return () => {
      window.removeEventListener('boosthub:post-updated', handlePostStatSync);
    };
  }, [post.id]);

  const isOwnPost = userProfile?.id === post.userId;

  // Strictly 1 like per account with in-flight lock & authoritative count sync
  const handleToggleLike = async () => {
    if (likeBusyRef.current) return;
    likeBusyRef.current = true;

    const prevLiked = isLiked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const optimisticCount = nextLiked
      ? prevCount + 1
      : Math.max(0, prevCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(optimisticCount);
    updateCachedPostStats(post.id, {
      isLiked: nextLiked,
      likesCount: optimisticCount,
    });

    try {
      const res = await apiFetch<{ liked?: boolean; likesCount?: number }>(
        `/api/posts/${post.id}/like`,
        { method: 'POST' }
      );
      const finalLiked =
        typeof res?.liked === 'boolean' ? res.liked : nextLiked;
      const finalCount =
        typeof res?.likesCount === 'number' ? res.likesCount : optimisticCount;
      setIsLiked(finalLiked);
      setLikesCount(finalCount);
      updateCachedPostStats(post.id, {
        isLiked: finalLiked,
        likesCount: finalCount,
      });
    } catch {
      // Rollback UI safely on failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      updateCachedPostStats(post.id, {
        isLiked: prevLiked,
        likesCount: prevCount,
      });
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      likeBusyRef.current = false;
    }
  };

  const handleToggleSave = async () => {
    const prevSaved = isSaved;
    const prevSavesCount = savesCount;
    const nextSaved = !prevSaved;
    setIsSaved(nextSaved);
    setSavesCount(nextSaved ? prevSavesCount + 1 : Math.max(0, prevSavesCount - 1));

    try {
      await apiFetch(`/api/posts/${post.id}/save`, { method: 'POST' });
      showToast(nextSaved ? 'Saved to your private collection' : 'Removed from saved', 'info');
    } catch {
      setIsSaved(prevSaved);
      setSavesCount(prevSavesCount);
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handleToggleFollow = async () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      const res = await apiFetch<{ following: boolean }>(
        `/api/profiles/${post.userId}/follow`,
        { method: 'POST' }
      );
      setIsFollowing(res.following);
      showToast(
        res.following
          ? `Following ${post.author.displayName}`
          : `Unfollowed ${post.author.displayName}`,
        'info'
      );
    } catch {
      setIsFollowing(prev);
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handleFeedback = async (
    feedbackType: 'hide' | 'not_interested' | 'report'
  ) => {
    setMenuOpen(false);
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          targetType:
            post.postType === 'video' || post.postType === 'capshot'
              ? 'video'
              : 'post',
          targetId: String(post.id),
          feedbackType,
          reason: `User selected ${feedbackType}`,
        }),
      });
      if (feedbackType === 'hide' || feedbackType === 'not_interested') {
        onPostRemoved?.(post.id);
        showToast(
          feedbackType === 'hide'
            ? 'Post hidden from your feed.'
            : 'Got it. We will recommend fewer posts like this.',
          'info'
        );
      } else {
        showToast('Report submitted to BoostHub moderation.', 'success');
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const parsedHashtags = (post.hashtags || '')
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.muted = isMuted;
      videoRef.current.volume = 1.0;
      videoRef.current.playsInline = true;
    }
  }, [isMuted, post.id]);

  return (
    <article className="bg-[#131A2A] border border-white/[0.08] rounded-3xl p-4 sm:p-5 transition-colors hover:border-white/[0.14]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={post.author.avatarUrl}
            name={post.author.displayName}
            size="md"
            onClick={() => onSelectUser(post.author.id)}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSelectUser(post.author.id)}
                className="text-sm font-bold text-white hover:underline truncate"
              >
                {post.author.displayName}
              </button>
              {post.author.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-[#2B8CFF] shrink-0" />
              )}
            </div>
            {/* Metadata row: @Abba · 2d ago · Creators */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
              <span>@{post.author.username}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#2B8CFF] font-medium">
                {post.category || 'Creators'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isOwnPost && (
            <button
              onClick={handleToggleFollow}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                isFollowing
                  ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" /> Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> Follow
                </>
              )}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-[#111830] border border-white/10 shadow-xl py-1.5 z-30">
                <button
                  onClick={() => handleFeedback('not_interested')}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
                >
                  <ThumbsDown className="w-4 h-4 text-slate-400" /> Not interested
                </button>
                <button
                  onClick={() => handleFeedback('hide')}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
                >
                  <EyeOff className="w-4 h-4 text-slate-400" /> Hide post
                </button>
                <button
                  onClick={() => handleFeedback('report')}
                  className="w-full px-4 py-2.5 text-left text-xs text-rose-400 hover:bg-white/5 flex items-center gap-2.5"
                >
                  <Flag className="w-4 h-4" /> Report content
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Caption & Hashtags */}
      {post.caption && (
        <p className="mt-3.5 text-[15px] leading-relaxed text-slate-100 whitespace-pre-wrap break-words">
          {post.caption}
        </p>
      )}

      {parsedHashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-blue-400">
          {parsedHashtags.map((tag, i) => {
            const formatted = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <button
                key={i}
                onClick={() => onSelectHashtag?.(formatted)}
                className="hover:underline"
              >
                {formatted}
              </button>
            );
          })}
        </div>
      )}

      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-blue-400 hover:bg-white/[0.06] transition-colors"
        >
          <span className="truncate">{post.linkUrl}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
        </a>
      )}

      {/* Media Slot */}
      {post.mediaUrl && !mediaError && (() => {
        const studioMeta = parseStudioUrlHash(post.mediaUrl);
        const cleanMediaSrc = post.mediaUrl.split('#')[0];
        const attachedAudioUrl =
          studioMeta?.voiceoverAudioUrl || studioMeta?.customAudioUrl || '';
        const isVideoPost =
          post.postType === 'video' || post.postType === 'capshot';
        const progressPct =
          videoDuration > 0
            ? Math.min(100, Math.max(0, (videoCurrentTime / videoDuration) * 100))
            : 0;

        return (
          <div
            className={`mt-3.5 rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center relative ${
              isVideoPost
                ? 'aspect-[9/16] w-full max-h-[540px]'
                : 'max-h-[520px]'
            }`}
          >
            {isVideoPost ? (
              <>
                {attachedAudioUrl && (
                  <audio
                    ref={voiceoverAudioRef}
                    src={attachedAudioUrl}
                    loop
                    preload="auto"
                    muted={isMuted}
                    className="hidden"
                  />
                )}
                <video
                  ref={videoRef}
                  data-post-id={post.id}
                  src={cleanMediaSrc}
                  poster={post.thumbnailUrl || undefined}
                  muted={isMuted || Boolean(attachedAudioUrl) || Boolean(studioMeta?.muteAudio)}
                  playsInline
                  loop
                  preload="auto"
                  onClick={(e) => {
                    const vid = e.currentTarget;
                    if (vid.paused) {
                      vid.play().catch(() => {});
                      if (voiceoverAudioRef.current && !isMuted) {
                        voiceoverAudioRef.current.currentTime = vid.currentTime || 0;
                        voiceoverAudioRef.current.play().catch(() => {});
                      }
                    } else {
                      vid.pause();
                      voiceoverAudioRef.current?.pause();
                    }
                  }}
                  onPlay={() => {
                    setIsVideoPaused(false);
                    if (voiceoverAudioRef.current) {
                      voiceoverAudioRef.current.muted = isMuted;
                      if (!isMuted) {
                        voiceoverAudioRef.current.play().catch(() => {});
                      }
                    }
                  }}
                  onPause={() => {
                    setIsVideoPaused(true);
                    voiceoverAudioRef.current?.pause();
                  }}
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
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    if (vid.duration && Number.isFinite(vid.duration)) {
                      setVideoDuration(vid.duration);
                    }
                    if (studioMeta?.playbackSpeed) {
                      vid.playbackRate = studioMeta.playbackSpeed;
                    }
                    if (studioMeta?.muteAudio || attachedAudioUrl) {
                      vid.muted = true;
                    }
                    if (studioMeta?.trimStart && studioMeta.trimStart > 0) {
                      vid.currentTime = studioMeta.trimStart;
                    } else if (!post.thumbnailUrl && vid.currentTime === 0) {
                      try {
                        vid.currentTime = 0.05;
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  onCanPlay={(e) => {
                    const vid = e.currentTarget;
                    if (vid.dataset.inView === 'true' && vid.paused) {
                      vid.muted =
                        isMuted ||
                        Boolean(attachedAudioUrl) ||
                        Boolean(studioMeta?.muteAudio);
                      vid.play().catch(() => {});
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const vid = e.currentTarget;
                    setVideoCurrentTime(vid.currentTime || 0);
                    if (vid.duration && Number.isFinite(vid.duration)) {
                      setVideoDuration(vid.duration);
                    }
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
                  className="w-full h-full object-cover cursor-pointer"
                />

                {/* Paused Play Indicator Overlay */}
                {isVideoPaused && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const vid = videoRef.current;
                      if (!vid) return;
                      vid.play().catch(() => {});
                      if (voiceoverAudioRef.current && !isMuted) {
                        voiceoverAudioRef.current.play().catch(() => {});
                      }
                    }}
                    className="absolute inset-0 z-15 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors"
                    aria-label="Play video"
                  >
                    <div className="w-14 h-14 rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-2xl">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </button>
                )}

                {studioMeta?.voiceoverName && (
                  <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-400/40 text-[10px] font-extrabold text-purple-200 flex items-center gap-1 shadow">
                    <span>🎙️ {studioMeta.voiceoverName}</span>
                  </div>
                )}

                {/* Top-Right Muted Speaker Icon when Auto-Playing */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    setGlobalVideoMuted(nextMuted);
                    if (videoRef.current) {
                      videoRef.current.muted =
                        nextMuted ||
                        Boolean(attachedAudioUrl) ||
                        Boolean(studioMeta?.muteAudio);
                      videoRef.current.volume = 1.0;
                      if (videoRef.current.paused && !nextMuted) {
                        videoRef.current.play().catch(() => {});
                      }
                    }
                    if (voiceoverAudioRef.current) {
                      voiceoverAudioRef.current.muted = nextMuted;
                      voiceoverAudioRef.current.volume = 1.0;
                      if (!nextMuted) {
                        voiceoverAudioRef.current.currentTime =
                          videoRef.current?.currentTime || 0;
                        voiceoverAudioRef.current.play().catch(() => {});
                      } else {
                        voiceoverAudioRef.current.pause();
                      }
                    }
                    showToast(
                      nextMuted
                        ? 'Muted'
                        : '🔊 Audio On (automatically enabled for all reels & videos)',
                      'info'
                    );
                  }}
                  className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-lg transition-all"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  title={isMuted ? 'Tap to unmute' : 'Tap to mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#2B8CFF]" />
                  )}
                </button>

                {/* Bottom Video Progress Bar & 0:09 / 0:17 Time Display */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!videoRef.current || !videoDuration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.min(
                      1,
                      Math.max(0, (e.clientX - rect.left) / rect.width)
                    );
                    const targetTime = ratio * videoDuration;
                    videoRef.current.currentTime = targetTime;
                    if (voiceoverAudioRef.current) {
                      voiceoverAudioRef.current.currentTime = targetTime;
                    }
                    setVideoCurrentTime(targetTime);
                  }}
                  className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-6 pb-2.5 px-3.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-white/95 tabular-nums mb-1.5">
                    <span>
                      {formatVideoClock(videoCurrentTime)} /{' '}
                      {formatVideoClock(videoDuration)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progressPct}%` }}
                      className="h-full bg-[#2B8CFF] rounded-full transition-all duration-100"
                    />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={cleanMediaSrc}
                alt={post.caption || 'Post image'}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setMediaError(true)}
                className="w-full max-h-[520px] object-cover"
              />
            )}
            {studioMeta && (
              <StudioFloatingOverlays
                stickers={studioMeta.stickers}
                texts={studioMeta.texts}
                subtitles={studioMeta.subtitles}
                currentTime={videoCurrentTime}
              />
            )}
          </div>
        );
      })()}

      {/* Interaction Bar */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={handleToggleLike}
            className={`min-h-[44px] px-3 rounded-xl inline-flex items-center gap-2 text-xs font-medium transition-colors ${
              isLiked
                ? 'text-pink-500 bg-pink-500/10'
                : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="tabular-nums">{formatCompactNumber(likesCount)}</span>
          </button>

          <button
            onClick={() => onOpenComments({ ...post, commentsCount })}
            className="min-h-[44px] px-3 rounded-xl inline-flex items-center gap-2 text-xs font-medium hover:bg-white/5 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="tabular-nums">
              {formatCompactNumber(commentsCount)}
            </span>
          </button>

          <button
            onClick={() => onOpenShare(post)}
            className="min-h-[44px] px-3 rounded-xl inline-flex items-center gap-2 text-xs font-medium hover:bg-white/5 hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="tabular-nums">
              {formatCompactNumber(post.sharesCount)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 inline-flex items-center gap-1 tabular-nums mr-1">
            <Play className="w-3 h-3" /> {formatCompactNumber(viewsCount)} views
          </span>
          <button
            onClick={handleToggleSave}
            className={`min-h-[44px] min-w-[44px] rounded-xl inline-flex items-center justify-center transition-colors ${
              isSaved
                ? 'text-purple-400 bg-purple-500/10'
                : 'hover:bg-white/5 hover:text-white'
            }`}
            title={isSaved ? 'Saved' : 'Save post'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inline Recent Comments Preview & Quick Reply / Comment Trigger */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
        {post.recentComments && post.recentComments.length > 0 && (
          <div className="space-y-1.5">
            {post.recentComments.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => onOpenComments({ ...post, commentsCount })}
                className="flex items-start justify-between gap-2 text-xs bg-[#0B1220]/70 hover:bg-[#0B1220] px-3 py-2 rounded-xl border border-white/[0.05] cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white mr-1.5">
                    {c.author.displayName}
                  </span>
                  <span className="text-slate-500 text-[11px] mr-1.5">
                    @{c.author.username}
                  </span>
                  <span className="text-slate-200 break-words">{c.content}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#2B8CFF] shrink-0">
                  Reply
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenComments({ ...post, commentsCount })}
          className="w-full px-3.5 py-2 rounded-xl bg-[#0B1220]/80 hover:bg-[#0B1220] border border-white/[0.07] flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span>
            {commentsCount > 0
              ? `View all ${commentsCount} comment${commentsCount === 1 ? '' : 's'} or write a reply...`
              : 'Write a comment...'}
          </span>
          <span className="font-semibold text-[#2B8CFF]">Comment →</span>
        </button>
      </div>
    </article>
  );
};
