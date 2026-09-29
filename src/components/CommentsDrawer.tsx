import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { CommentItem, PostItem } from '../types';
import { apiFetch, getCachedComments, setCachedComments } from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../utils/format';

interface CommentsDrawerProps {
  post: PostItem | null;
  onClose: () => void;
  onCommentCountChange?: (postId: number, delta: number) => void;
  onSelectUser?: (userId: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  post,
  onClose,
  onCommentCountChange,
  onSelectUser,
}) => {
  const { userProfile, showToast } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!post) return;
    // 1. Show cached comments immediately
    const cached = getCachedComments(post.id);
    if (cached) {
      setComments(cached);
    } else {
      setComments([]);
      setLoading(true);
    }

    // 2. Load fresh comments in background
    let mounted = true;
    apiFetch<CommentItem[]>(`/api/posts/${post.id}/comments`)
      .then((fresh) => {
        if (!mounted) return;
        setComments(fresh);
        setCachedComments(post.id, fresh);
      })
      .catch(() => {
        // retain cached
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [post]);

  if (!post) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || submitting || !userProfile) return;

    setSubmitting(true);
    // Optimistic insertion
    const tempId = Date.now();
    const optimisticComment: CommentItem = {
      id: tempId,
      postId: post.id,
      userId: userProfile.id,
      parentId: replyTo ? replyTo.id : null,
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
    onCommentCountChange?.(post.id, 1);

    try {
      const created = await apiFetch<CommentItem>(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          parentId: optimisticComment.parentId,
        }),
      });
      const updatedList = nextList.map((c) => (c.id === tempId ? created : c));
      setComments(updatedList);
      setCachedComments(post.id, updatedList);
    } catch (err: any) {
      // Rollback
      const rolledBack = comments.filter((c) => c.id !== tempId);
      setComments(rolledBack);
      setCachedComments(post.id, rolledBack);
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
        onCommentCountChange?.(post.id, -1);
        await apiFetch(`/api/comments/${comment.id}`, {
          method: 'PUT',
          body: JSON.stringify({ action: 'delete' }),
        });
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

  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: number) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#0B1021] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[82vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Comments</h3>
            <span className="text-xs text-slate-400 tabular-nums">
              · {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-full"
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
              No comments yet. Start the conversation below!
            </div>
          ) : (
            rootComments.map((comment) => {
              const replies = getReplies(comment.id);
              const isMine = comment.userId === userProfile?.id;
              const isPostCreator = post.userId === userProfile?.id;

              return (
                <div key={comment.id} className="space-y-2">
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
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectUser?.(comment.author.id);
                          }}
                          className="font-semibold text-white hover:underline truncate"
                        >
                          {comment.author.displayName}
                        </button>
                        {comment.author.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
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
                        <p className="text-sm text-slate-200 mt-1 break-words">
                          {comment.content}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <button
                          onClick={() => handleAction(comment, 'react')}
                          className="inline-flex items-center gap-1 hover:text-pink-400 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span className="tabular-nums">
                            {comment.reactionsCount || 0}
                          </span>
                        </button>
                        <button
                          onClick={() => setReplyTo(comment)}
                          className="hover:text-white transition-colors"
                        >
                          Reply
                        </button>
                        {isPostCreator && (
                          <button
                            onClick={() => handleAction(comment, 'pin')}
                            className="hover:text-purple-400 transition-colors"
                          >
                            {comment.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                        )}
                        {isMine && (
                          <>
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditContent(comment.content);
                              }}
                              className="hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleAction(comment, 'delete')}
                              className="hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        )}
                        {!isMine && (
                          <button
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
                    <div className="pl-11 space-y-2.5 pt-1">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5 items-start">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-500 mt-2 shrink-0" />
                          <Avatar
                            src={reply.author.avatarUrl}
                            name={reply.author.displayName}
                            size="xs"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span className="font-semibold text-white">
                                {reply.author.displayName}
                              </span>
                              <span>·</span>
                              <span>{formatRelativeTime(reply.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-200 mt-0.5 break-words">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
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
            <div className="flex items-center justify-between text-xs text-blue-400 mb-2 px-2">
              <span>Replying to @{replyTo.author.username}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-slate-400 hover:text-white"
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
                  ? `Reply to ${replyTo.author.displayName}...`
                  : 'Add a comment...'
              }
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
