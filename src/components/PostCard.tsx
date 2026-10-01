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
} from 'lucide-react';
import { PostItem } from '../types';
import { apiFetch, setCachedFeed } from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { formatRelativeTime, formatCompactNumber } from '../utils/format';
import {
  parseStudioUrlHash,
  buildCssFilterString,
  StudioFloatingOverlays,
} from './StudioMediaEditor';

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
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [savesCount, setSavesCount] = useState(post.savesCount);
  const [isFollowing, setIsFollowing] = useState(post.isFollowingAuthor);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const likeBusyRef = useRef(false);
  const watchStartRef = useRef<number | null>(null);

  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setIsSaved(post.isSaved);
    setSavesCount(post.savesCount);
  }, [post.id, post.isLiked, post.likesCount, post.isSaved, post.savesCount]);

  const isOwnPost = userProfile?.id === post.userId;

  // Strictly 1 like per account with in-flight lock & authoritative count sync
  const handleToggleLike = async () => {
    if (likeBusyRef.current) return;
    likeBusyRef.current = true;

    const prevLiked = isLiked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    setIsLiked(nextLiked);
    setLikesCount(nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1));

    try {
      const res = await apiFetch<{ liked?: boolean; likesCount?: number }>(
        `/api/posts/${post.id}/like`,
        { method: 'POST' }
      );
      if (typeof res?.liked === 'boolean') {
        setIsLiked(res.liked);
      }
      if (typeof res?.likesCount === 'number') {
        setLikesCount(res.likesCount);
      }
      setCachedFeed('recommended', []);
    } catch {
      // Rollback UI safely on failure
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
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

  return (
    <article className="bg-[#0B1021]/90 border border-white/[0.08] rounded-3xl p-4 sm:p-5 transition-colors hover:border-white/[0.14]">
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
                className="text-sm font-semibold text-white hover:underline truncate"
              >
                {post.author.displayName}
              </button>
              {post.author.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              )}
            </div>
            {/* Zero-pill static metadata with clean typographic separators */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
              <span>@{post.author.username}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.category && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-300">{post.category}</span>
                </>
              )}
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
        return (
          <div className="mt-3.5 rounded-2xl overflow-hidden bg-black/60 border border-white/10 max-h-[520px] flex items-center justify-center relative">
            {post.postType === 'video' || post.postType === 'capshot' ? (
              <video
                src={post.mediaUrl}
                poster={post.thumbnailUrl || undefined}
                controls
                playsInline
                preload="metadata"
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
                  if (studioMeta?.playbackSpeed) {
                    vid.playbackRate = studioMeta.playbackSpeed;
                  }
                  if (studioMeta?.muteAudio) {
                    vid.muted = true;
                  }
                  if (studioMeta?.trimStart && studioMeta.trimStart > 0) {
                    vid.currentTime = studioMeta.trimStart;
                  }
                }}
                onTimeUpdate={(e) => {
                  const vid = e.currentTarget;
                  if (
                    studioMeta?.trimEnd &&
                    studioMeta.trimEnd > 0 &&
                    vid.currentTime >= studioMeta.trimEnd
                  ) {
                    vid.currentTime = studioMeta.trimStart || 0;
                  }
                }}
                onPlay={() => {
                  watchStartRef.current = Date.now();
                }}
                onPause={(e) => {
                  if (watchStartRef.current) {
                    const elapsed = Math.max(
                      1,
                      Math.round((Date.now() - watchStartRef.current) / 1000)
                    );
                    watchStartRef.current = null;
                    const dur = e.currentTarget.duration || 15;
                    const pct = Math.min(100, Math.round((elapsed / dur) * 100));
                    apiFetch(`/api/posts/${post.id}/watch`, {
                      method: 'POST',
                      body: JSON.stringify({
                        watchDurationSeconds: elapsed,
                        completionPercentage: pct,
                        skipped: elapsed < 2,
                      }),
                    }).catch(() => {});
                    setCachedFeed('recommended', []);
                  }
                }}
                onEnded={(e) => {
                  const elapsed = watchStartRef.current
                    ? Math.max(
                        3,
                        Math.round((Date.now() - watchStartRef.current) / 1000)
                      )
                    : Math.round(e.currentTarget.duration || 15);
                  watchStartRef.current = null;
                  apiFetch(`/api/posts/${post.id}/watch`, {
                    method: 'POST',
                    body: JSON.stringify({
                      watchDurationSeconds: elapsed,
                      completionPercentage: 100,
                      skipped: false,
                    }),
                  }).catch(() => {});
                  setCachedFeed('recommended', []);
                }}
                className="w-full max-h-[520px] object-contain"
              />
            ) : (
              <img
                src={post.mediaUrl}
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
            onClick={() => onOpenComments(post)}
            className="min-h-[44px] px-3 rounded-xl inline-flex items-center gap-2 text-xs font-medium hover:bg-white/5 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="tabular-nums">
              {formatCompactNumber(post.commentsCount)}
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
          {(post.postType === 'video' || post.postType === 'capshot') && (
            <span className="text-xs text-slate-400 inline-flex items-center gap-1 tabular-nums mr-1">
              <Play className="w-3 h-3" /> {formatCompactNumber(post.viewsCount)} views
            </span>
          )}
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
    </article>
  );
};
