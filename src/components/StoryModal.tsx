import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Eye,
  Trash2,
  Send,
  Upload,
} from 'lucide-react';
import { StoryItem } from '../types';
import { apiFetch } from '../services/api';
import { uploadMediaWithProgress } from '../storage/mediaUpload';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../utils/format';

interface StoryViewerModalProps {
  stories: StoryItem[];
  initialIndex: number;
  onClose: () => void;
  onStoriesChanged: () => void;
}

interface FloatingReactionParticle {
  id: string;
  emoji: string;
  leftPercent: number;
  size: number;
  delayMs: number;
  durationMs: number;
  rotationDeg: number;
  driftX: number;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  onClose,
  onStoriesChanged,
}) => {
  const { userProfile, showToast } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [floatingParticles, setFloatingParticles] = useState<FloatingReactionParticle[]>([]);
  const [centerPopEmoji, setCenterPopEmoji] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStory = stories[currentIndex];

  const advanceToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!currentStory) return;
    setProgress(0);
    setPaused(false);
    apiFetch(`/api/stories/${currentStory.id}/interact`, {
      method: 'POST',
      body: JSON.stringify({ action: 'view' }),
    }).catch(() => {});
  }, [currentStory]);

  useEffect(() => {
    if (!currentStory || currentStory.mediaType !== 'video' || !videoRef.current) return;
    if (paused || showViewers) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [currentStory, paused, showViewers]);

  useEffect(() => {
    if (!currentStory || paused || showViewers || currentStory.mediaType === 'video') return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [currentStory, paused, showViewers, currentIndex, stories.length, onClose]);

  if (!currentStory) return null;
  const isOwner = currentStory.userId === userProfile?.id;

  const handleReact = async (emoji: string) => {
    // 1. Center pop burst
    setCenterPopEmoji(emoji);
    setTimeout(() => setCenterPopEmoji(null), 850);

    // 2. Stream of Instagram-like floating emoji particles
    const particleCount = 14;
    const newParticles: FloatingReactionParticle[] = [];
    const now = Date.now();

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: `react_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        emoji,
        leftPercent: 12 + Math.random() * 76,
        size: 28 + Math.floor(Math.random() * 26),
        delayMs: Math.floor(Math.random() * 300),
        durationMs: 1600 + Math.floor(Math.random() * 800),
        rotationDeg: -25 + Math.random() * 50,
        driftX: -45 + Math.random() * 90,
      });
    }

    setFloatingParticles((prev) => [...prev, ...newParticles]);

    // Clean up particles when animation completes
    setTimeout(() => {
      setFloatingParticles((prev) =>
        prev.filter((p) => !newParticles.some((np) => np.id === p.id))
      );
    }, 2600);

    try {
      await apiFetch(`/api/stories/${currentStory.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ action: 'react', payload: emoji }),
      });
    } catch {
      // non-blocking
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await apiFetch(`/api/stories/${currentStory.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ action: 'reply', payload: replyText.trim() }),
      });
      setReplyText('');
      showToast('Reply sent to creator!', 'success');
    } catch {
      showToast('Failed to send reply.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/stories/${currentStory.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete' }),
      });
      showToast('Story deleted.', 'info');
      onStoriesChanged();
      onClose();
    } catch {
      showToast('Could not delete story.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="relative w-full max-w-md h-full max-h-[92vh] sm:rounded-3xl overflow-hidden bg-[#060813] border border-white/10 flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
          {stories.map((st, idx) => (
            <div
              key={st.id}
              className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-7 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={currentStory.author.avatarUrl}
              name={currentStory.author.displayName}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-white">
                {currentStory.author.displayName}
              </p>
              <p className="text-xs text-slate-300">
                {formatRelativeTime(currentStory.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaused((p) => !p)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/90 hover:text-white"
            >
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-400 hover:text-rose-300"
                title="Delete Story"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/90 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted={false}
              onClick={() => setPaused((p) => !p)}
              onTimeUpdate={(e) => {
                const vid = e.currentTarget;
                if (vid.duration && Number.isFinite(vid.duration)) {
                  setProgress(Math.min(100, (vid.currentTime / vid.duration) * 100));
                }
              }}
              onEnded={advanceToNextStory}
              className="w-full h-full object-contain cursor-pointer"
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt={currentStory.caption || 'Story'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          )}

          {/* Prev/Next Navigation Controls */}
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Instagram-Style Floating Reaction Particles Overlay */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingParticles.map((p) => (
              <span
                key={p.id}
                style={{
                  left: `${p.leftPercent}%`,
                  bottom: '20px',
                  fontSize: `${p.size}px`,
                  animationDelay: `${p.delayMs}ms`,
                  animationDuration: `${p.durationMs}ms`,
                  '--drift-x': `${p.driftX}px`,
                  '--rot': `${p.rotationDeg}deg`,
                } as React.CSSProperties}
                className="absolute animate-instagram-story-float select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              >
                {p.emoji}
              </span>
            ))}

            {/* Giant Center Pop Heart / Reaction */}
            {centerPopEmoji && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                <span className="text-7xl sm:text-8xl animate-instagram-center-pop select-none filter drop-shadow-[0_0_28px_rgba(255,255,255,0.5)]">
                  {centerPopEmoji}
                </span>
              </div>
            )}
          </div>

          {currentStory.caption && (
            <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 rounded-2xl z-20">
              <p className="text-sm text-white text-center">{currentStory.caption}</p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-[#0B1021] border-t border-white/10 space-y-3">
          {isOwner ? (
            <div>
              <button
                onClick={() => setShowViewers((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="tabular-nums">{currentStory.viewsCount} viewers</span>
                <span>·</span>
                <span className="tabular-nums">
                  {currentStory.reactions?.length || 0} reactions
                </span>
              </button>
              {showViewers && (
                <div className="mt-3 max-h-36 overflow-y-auto space-y-2 border-t border-white/10 pt-2">
                  {currentStory.viewers?.length === 0 ? (
                    <p className="text-xs text-slate-500">No viewers yet.</p>
                  ) : (
                    currentStory.viewers.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs text-white">
                        <Avatar src={v.avatarUrl} name={v.displayName} size="xs" />
                        <span>{v.displayName}</span>
                        <span className="text-slate-400">@{v.username}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Instagram Quick Reactions Bar */}
              <div className="flex items-center justify-around gap-2 px-1">
                {(
                  [
                    { emoji: '❤️', label: 'Heart' },
                    { emoji: '🔥', label: 'Fire' },
                    { emoji: '😂', label: 'Laugh' },
                    { emoji: '👏', label: 'Clap' },
                    { emoji: '😍', label: 'Love' },
                    { emoji: '😮', label: 'Wow' },
                  ] as const
                ).map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(emoji)}
                    aria-label={`Send ${label} reaction`}
                    title={`Send ${label}`}
                    className="min-h-[44px] min-w-[44px] rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-2xl transition-all hover:scale-125 active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <form onSubmit={handleReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  placeholder="Reply to story..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="min-h-[44px] min-w-[44px] rounded-2xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface CreateStoryModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  onClose,
  onCreated,
}) => {
  const { showToast } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(5);
    try {
      const isVid = file.type.startsWith('video/');
      setMediaType(isVid ? 'video' : 'photo');
      const res = await uploadMediaWithProgress(
        file,
        'stories',
        (pct) => setUploadProgress(pct)
      );
      setMediaUrl(res.url);
      showToast('Story media uploaded!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      showToast('Please select a photo or video for your story.', 'error');
      return;
    }
    setPublishing(true);
    try {
      await apiFetch('/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          caption,
        }),
      });
      showToast('24-hour Story published!', 'success');
      onCreated();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish story.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Create 24h Story</h3>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!mediaUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-56 rounded-2xl border-2 border-dashed border-white/15 hover:border-blue-500/60 bg-white/[0.02] flex flex-col items-center justify-center gap-3 transition-colors"
          >
            <Upload className="w-8 h-8 text-blue-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {uploading ? `Uploading (${uploadProgress}%)...` : 'Upload Photo or Video'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Expires automatically after 24 hours
              </p>
            </div>
          </button>
        ) : (
          <div className="relative h-64 rounded-2xl overflow-hidden bg-black border border-white/10">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full object-contain" />
            ) : (
              <img
                src={mediaUrl}
                alt="Story preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => setMediaUrl('')}
              className="absolute top-2 right-2 px-3 py-1 rounded-xl bg-black/70 text-xs text-white"
            >
              Change
            </button>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption to your story..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!mediaUrl || publishing || uploading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm disabled:opacity-40 transition-all"
          >
            {publishing ? 'Publishing Story...' : 'Publish to Story'}
          </button>
        </form>
      </div>
    </div>
  );
};
