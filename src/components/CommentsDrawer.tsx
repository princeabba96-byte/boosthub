import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Send,
  Heart,
  Pin,
  Trash2,
  Edit3,
  Flag,
  CornerDownRight,
  CheckCircle2,
  MessageSquareReply,
} from 'lucide-react';
import { CommentItem, PostItem } from '../types';
import {
  apiFetch,
  getCachedComments,
  setCachedComments,
  updateCachedPostStats,
} from '../services/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../utils/format';

interface CommentsDrawerProps {
  post: PostItem | null;
  onClose: () => void;
  onCommentCountChange?: (postId: any, delta: number) => void;
  onSelectUser?: (userId: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  post,
  onClose,
  onCommentCountChange,
  onSelectUser,
}) => {
  const { userProfile, realtimeEvents, showToast } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<any | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const syncFreshComments = useCallback(
    async (postId: any) => {
      try {
        const fresh = await apiFetch<CommentItem[]>(
          `/api/posts/${postId}/comments`
        );
        if (Array.isArray(fresh)) {
          setComments(fresh);
          setCachedComments(postId, fresh);
          updateCachedPostStats(postId, { commentsCount: fresh.length });
        }
      } catch {
        // retain existing comments
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!post) return;
    const cached = getCachedComments(post.id);
    if (cached && cached.length > 0) {
      setComments(cached);
    } else {
      setComments([]);
      setLoading(true);
    }

    syncFreshComments(post.id);
    const pollTimer = window.setInterval(() => {
      syncFreshComments(post.id);
    }, 3000);

    // Direct Supabase Realtime subscription for post_comments & comments on this post
    const channel = supabase
      .channel(`comments-drawer-${post.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        () => {
          syncFreshComments(post.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          syncFreshComments(post.id);
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [post?.id, syncFreshComments]);

  // Also refetch immediately when AuthContext receives a broadcast comment event
  useEffect(() => {
    if (!post || realtimeEvents.length === 0) return;
    const latest = realtimeEvents[realtimeEvents.length - 1];
    if (latest.type === 'post_comment') {
      syncFreshComments(post.id);
    }
  }, [realtimeEvents, post?.id, syncFreshComments]);

  if (!post) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawContent = text.trim();
    if (!rawContent || submitting || !userProfile) return;

    const targetParentId = replyTo
      ? String(replyTo.parentId || replyTo.id)
      : null;

    const content =
      replyTo && !rawContent.startsWith(`@${replyTo.author.username}`)
        ? `@${replyTo.author.username} ${rawContent}`
        : rawContent;

    setSubmitting(true);
    const tempId = `temp_${Date.now()}`;
    const optimisticComment: CommentItem = {
      id: tempId as any,
      postId: post.id,
      userId: userProfile.id,
      parentId: targetParentId,
      content,
      isPinned: false,
      reactionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: userProfile.id,
        username: userProfile.username,
        displayName: userProfile.displayName,
        avatarUrl: userProfile.avatarUrl,
        isVerified: userProfile.isVerified,
      },
    };

    const nextList = [optimisticComment, ...comments];
    setComments(nextList);
    setCachedComments(post.id, nextList);
    setText('');
    setReplyTo(null);
    updateCachedPostStats(post.id, { commentsCount: nextList.length });
    onCommentCountChange?.(post.id, 1);

    try {
      const created = await apiFetch<CommentItem & { commentsCount?: number }>(
        `/api/posts/${post.id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            content,
            parentId: targetParentId,
          }),
        }
      );
      const updatedList = nextList.map((c) => (c.id === tempId ? created : c));
      setComments(updatedList);
      setCachedComments(post.id, updatedList);
      const exactCount =
        typeof created.commentsCount === 'number'
          ? created.commentsCount
          : updatedList.length;
      updateCachedPostStats(post.id, { commentsCount: exactCount });
      // Sync fresh list from Supabase to ensure all replies & authors match
      syncFreshComments(post.id);
    } catch (err: any) {
      const rolledBack = comments.filter((c) => c.id !== tempId);
      setComments(rolledBack);
      setCachedComments(post.id, rolledBack);
      updateCachedPostStats(post.id, { commentsCount: rolledBack.length });
      onCommentCountChange?.(post.id, -1);
      showToast(err.message || 'Could not post comment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    comment: CommentItem,
    action: 'react' | 'pin' | 'delete' | 'edit',
    newText?: string
  ) => {
    try {
      if (action === 'delete') {
        const filtered = comments.filter((c) => c.id !== comment.id);
        setComments(filtered);
        setCachedComments(post.id, filtered);
        updateCachedPostStats(post.id, { commentsCount: filtered.length });
        onCommentCountChange?.(post.id, -1);
        const res = await apiFetch<{ ok?: boolean; commentsCount?: number }>(
          `/api/comments/${comment.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({ action: 'delete' }),
          }
        );
        if (typeof res?.commentsCount === 'number') {
          updateCachedPostStats(post.id, { commentsCount: res.commentsCount });
        }
        showToast('Comment deleted', 'info');
        return;
      }

      const updated = await apiFetch<CommentItem>(`/api/comments/${comment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ action, content: newText }),
      });

      const next = comments.map((c) =>
        c.id === comment.id ? { ...c, ...updated } : c
      );
      setComments(next);
      setCachedComments(post.id, next);
      setEditingCommentId(null);
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const handleReportComment = async (comment: CommentItem) => {
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'comment',
          targetId: String(comment.id),
          feedbackType: 'report',
          reason: 'Reported comment from drawer',
        }),
      });
      showToast('Comment reported to moderation.', 'success');
    } catch {
      showToast('Failed to report comment.', 'error');
    }
  };

  // Ensure every comment is visible even if its parentId was deleted or nested
  const allRootIds = new Set(
    comments.filter((c) => !c.parentId).map((c) => String(c.id))
  );
  const rootComments = comments.filter(
    (c) => !c.parentId || !allRootIds.has(String(c.parentId))
  );
  const getReplies = (parentId: any) =>
    comments
      .filter(
        (c) =>
          c.parentId &&
          String(c.parentId) === String(parentId) &&
          String(c.id) !== String(parentId)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#0B1021] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[84vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Comments</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-white tabular-nums">
              {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && comments.length === 0 ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-white/10 rounded" />
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : rootComments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No comments yet. Be the first to comment below!
            </div>
          ) : (
            rootComments.map((comment) => {
              const replies = getReplies(comment.id);
              const isMine = comment.userId === userProfile?.id;
              const isPostCreator = post.userId === userProfile?.id;

              return (
                <div
                  key={comment.id}
                  className="p-3.5 rounded-2xl bg-[#131A2A]/80 border border-white/[0.06] space-y-2.5"
                >
                  <div className="flex gap-3 items-start">
                    <Avatar
                      src={comment.author.avatarUrl}
                      name={comment.author.displayName}
                      size="sm"
                      onClick={() => {
                        onClose();
                        onSelectUser?.(comment.author.id);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectUser?.(comment.author.id);
                          }}
                          className="font-bold text-white hover:underline truncate"
                        >
                          {comment.author.displayName}
                        </button>
                        <span className="text-slate-500">
                          @{comment.author.username}
                        </span>
                        {comment.author.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2B8CFF] shrink-0" />
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(comment.createdAt)}</span>
                        {comment.isPinned && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-purple-400 font-medium">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          </>
                        )}
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() =>
                              handleAction(comment, 'edit', editContent)
                            }
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-xl whitespace-nowrap"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="px-2.5 py-1.5 text-slate-400 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-100 mt-1 break-words leading-relaxed">
                          {comment.content}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleAction(comment, 'react')}
                          className="inline-flex items-center gap-1 hover:text-pink-400 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span className="tabular-nums">
                            {comment.reactionsCount || 0}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyTo(comment)}
                          className="inline-flex items-center gap-1 text-[#2B8CFF] hover:text-blue-300 font-semibold transition-colors"
                        >
                          <MessageSquareReply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                        {isPostCreator && (
                          <button
                            type="button"
                            onClick={() => handleAction(comment, 'pin')}
                            className="hover:text-purple-400 transition-colors"
                          >
                            {comment.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                        )}
                        {isMine && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditContent(comment.content);
                              }}
                              className="hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(comment, 'delete')}
                              className="hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        )}
                        {!isMine && (
                          <button
                            type="button"
                            onClick={() => handleReportComment(comment)}
                            className="hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                          >
                            <Flag className="w-3 h-3" /> Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {replies.length > 0 && (
                    <div className="pl-9 space-y-2.5 pt-2 border-t border-white/[0.05]">
                      {replies.map((reply) => {
                        const isReplyMine = reply.userId === userProfile?.id;
                        return (
                          <div
                            key={reply.id}
                            className="flex gap-2.5 items-start bg-[#0B1220]/70 p-2.5 rounded-xl border border-white/[0.04]"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-[#2B8CFF] mt-1.5 shrink-0" />
                            <Avatar
                              src={reply.author.avatarUrl}
                              name={reply.author.displayName}
                              size="xs"
                              onClick={() => {
                                onClose();
                                onSelectUser?.(reply.author.id);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onSelectUser?.(reply.author.id);
                                  }}
                                  className="font-bold text-white hover:underline"
                                >
                                  {reply.author.displayName}
                                </button>
                                <span className="text-slate-500">
                                  @{reply.author.username}
                                </span>
                                {reply.author.isVerified && (
                                  <CheckCircle2 className="w-3 h-3 text-[#2B8CFF] shrink-0" />
                                )}
                                <span>·</span>
                                <span>
                                  {formatRelativeTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-100 mt-1 break-words leading-relaxed">
                                {reply.content}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => handleAction(reply, 'react')}
                                  className="inline-flex items-center gap-1 hover:text-pink-400"
                                >
                                  <Heart className="w-3 h-3" />
                                  <span>{reply.reactionsCount || 0}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReplyTo(reply)}
                                  className="text-[#2B8CFF] hover:text-blue-300 font-semibold"
                                >
                                  Reply
                                </button>
                                {isReplyMine && (
                                  <button
                                    type="button"
                                    onClick={() => handleAction(reply, 'delete')}
                                    className="hover:text-rose-400"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="p-3.5 border-t border-white/10 bg-[#080C1A]"
        >
          {replyTo && (
            <div className="flex items-center justify-between text-xs bg-[#131A2A] border border-[#2B8CFF]/30 rounded-xl px-3 py-2 text-[#2B8CFF] mb-2">
              <span className="font-medium truncate">
                Replying to <strong>{replyTo.author.displayName}</strong> (@
                {replyTo.author.username})
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-slate-400 hover:text-white ml-2 font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar
              src={userProfile?.avatarUrl}
              name={userProfile?.displayName}
              size="sm"
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                replyTo
                  ? `Write a reply to ${replyTo.author.displayName}...`
                  : `Comment as ${userProfile?.displayName || 'User'}...`
              }
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2B8CFF]"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-[#2B8CFF] hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
