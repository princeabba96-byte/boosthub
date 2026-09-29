import React, { useEffect, useState } from 'react';
import {
  X,
  Link2,
  Send,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { PostItem, UserProfile } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';

interface ShareModalProps {
  post: PostItem | null;
  onClose: () => void;
  onShared?: (postId: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  onClose,
  onShared,
}) => {
  const { showToast } = useAuth();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [copied, setCopied] = useState(false);
  const [sharingToStory, setSharingToStory] = useState(false);
  const [sendingToUserId, setSendingToUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    apiFetch<{ friends: Array<{ profile: UserProfile }> }>('/api/friends')
      .then((res) => {
        setFriends(res.friends.map((f) => f.profile));
      })
      .catch(() => {});
  }, [post]);

  if (!post) return null;

  const permanentLink = `${window.location.origin}/?post=${post.id}`;

  const recordShare = async (shareType: string) => {
    try {
      await apiFetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ shareType }),
      });
      onShared?.(post.id);
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(permanentLink);
      setCopied(true);
      await recordShare('link');
      showToast('Permanent link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy link.', 'error');
    }
  };

  const handleShareToStory = async () => {
    if (!post.mediaUrl) {
      showToast('Only photo or video posts can be shared directly to Stories.', 'info');
      return;
    }
    setSharingToStory(true);
    try {
      await apiFetch('/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          mediaUrl: post.mediaUrl,
          mediaType: post.postType === 'video' || post.postType === 'capshot' ? 'video' : 'photo',
          caption: `Shared from @${post.author.username}: ${post.caption.slice(0, 80)}`,
        }),
      });
      await recordShare('story');
      showToast('Shared to your 24-hour Story!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to share to story.', 'error');
    } finally {
      setSharingToStory(false);
    }
  };

  const handleShareViaMessage = async (friend: UserProfile) => {
    setSendingToUserId(friend.id);
    try {
      await apiFetch(`/api/messages/${friend.id}`, {
        method: 'POST',
        body: JSON.stringify({
          content: `Shared a post by @${post.author.username}: "${post.caption.slice(0, 70)}"`,
          sharedPostId: post.id,
          mediaUrl: post.mediaUrl || '',
          mediaType: post.postType === 'photo' ? 'photo' : post.postType === 'video' || post.postType === 'capshot' ? 'video' : '',
        }),
      });
      await recordShare('message');
      showToast(`Sent to ${friend.displayName}!`, 'success');
    } catch {
      showToast('Failed to send message.', 'error');
    } finally {
      setSendingToUserId(null);
    }
  };

  const handleExternalShare = async () => {
    await recordShare('external');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BoostHub post by @${post.author.username}`,
          text: post.caption,
          url: permanentLink,
        });
        onClose();
        return;
      } catch {
        // fallback to copy
      }
    }
    handleCopyLink();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-[#0B1021] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Share Post</h3>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Link2 className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-xs font-medium text-white whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          <button
            onClick={handleShareToStory}
            disabled={sharingToStory}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-medium text-white whitespace-nowrap">
              Add to Story
            </span>
          </button>

          <button
            onClick={handleExternalShare}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <Share2 className="w-5 h-5 text-pink-400" />
            <span className="text-xs font-medium text-white whitespace-nowrap">
              External Share
            </span>
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 mb-3">
            Send via BoostHub Direct Message
          </p>
          {friends.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">
              Add friends in the Friends tab to share posts directly in chat.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={friend.avatarUrl}
                      name={friend.displayName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {friend.displayName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShareViaMessage(friend)}
                    disabled={sendingToUserId === friend.id}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingToUserId === friend.id ? 'Sending...' : 'Send'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
