import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Camera,
  Upload,
  X,
  RotateCcw,
  CheckCircle2,
  Link2,
  Hash,
  Eye,
} from 'lucide-react';
import { INTEREST_CATEGORIES, PostItem } from '../types';
import { uploadMediaWithProgress } from '../storage/mediaUpload';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';

interface CreatePostScreenProps {
  onPostCreated: (post: PostItem) => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  onPostCreated,
}) => {
  const { showToast } = useAuth();
  const [postType, setPostType] = useState<'photo' | 'video' | 'capshot' | 'text'>(
    'photo'
  );
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [category, setCategory] = useState<string>('Lifestyle');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const startMediaUpload = async (file: File) => {
    setSelectedFile(file);
    setUploadError('');
    setUploading(true);
    setUploadProgress(5);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const isVid = file.type.startsWith('video/');
      if (isVid && postType === 'photo') {
        setPostType('capshot');
      } else if (!isVid && (postType === 'video' || postType === 'capshot')) {
        setPostType('photo');
      }

      const uploaded = await uploadMediaWithProgress(
        file,
        isVid ? 'videos' : 'posts',
        (pct) => setUploadProgress(pct),
        controller.signal
      );

      setMediaUrl(uploaded.url);
      setThumbnailUrl(uploaded.thumbnailUrl || '');
      showToast('Media uploaded to permanent storage!', 'success');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please retry.');
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
    setUploading(false);
    setUploadProgress(0);
    setUploadError('Upload cancelled by user.');
  };

  const handleRetryUpload = () => {
    if (selectedFile) {
      startMediaUpload(selectedFile);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postType !== 'text' && !mediaUrl) {
      showToast('Please upload a photo or video before publishing.', 'error');
      return;
    }
    if (postType === 'text' && !caption.trim()) {
      showToast('Please write a caption for your text post.', 'error');
      return;
    }

    setPublishing(true);
    try {
      const created = await apiFetch<PostItem>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          postType,
          caption: caption.trim(),
          mediaUrl: postType === 'text' ? '' : mediaUrl,
          thumbnailUrl: postType === 'text' ? '' : thumbnailUrl,
          hashtags: hashtags.trim(),
          category,
          linkUrl: linkUrl.trim(),
        }),
      });

      // Clear composer
      setCaption('');
      setHashtags('');
      setLinkUrl('');
      setMediaUrl('');
      setThumbnailUrl('');
      setSelectedFile(null);
      setUploadProgress(0);

      showToast('Post published to BoostHub!', 'success');
      onPostCreated(created);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish post.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
              Create New Post
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Share photos, videos, vertical Capshots, or text updates with permanent
              cloud storage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>{showPreview ? 'Edit' : 'Preview'}</span>
          </button>
        </div>

        {/* Post Type Selector */}
        <div className="grid grid-cols-4 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          {[
            { id: 'photo', label: 'Photo', icon: ImageIcon },
            { id: 'capshot', label: 'Capshot', icon: Video },
            { id: 'video', label: 'Video', icon: Video },
            { id: 'text', label: 'Text', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const active = postType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPostType(item.id as any)}
                className={`min-h-[42px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hidden Gallery & Camera Inputs */}
        <input
          ref={galleryInputRef}
          type="file"
          accept={
            postType === 'photo'
              ? 'image/*'
              : postType === 'video' || postType === 'capshot'
                ? 'video/*'
                : 'image/*,video/*'
          }
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) startMediaUpload(file);
          }}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) startMediaUpload(file);
          }}
          className="hidden"
        />

        {/* Media Upload Box */}
        {postType !== 'text' && (
          <div className="space-y-3">
            {!mediaUrl ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-center space-y-4">
                <Upload className="w-8 h-8 text-blue-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Select media from Gallery or capture with Camera
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Automatically compressed and stored permanently in cloud storage
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" /> Choose from Gallery
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>
                </div>

                {/* Upload Progress & Cancel */}
                {uploading && (
                  <div className="max-w-sm mx-auto pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Uploading media...</span>
                      <span className="tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="text-xs text-rose-400 hover:underline inline-flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel Upload
                    </button>
                  </div>
                )}

                {/* Upload Error & Retry */}
                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                    <span>{uploadError}</span>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={handleRetryUpload}
                        className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 max-h-80 flex items-center justify-center">
                  {postType === 'video' || postType === 'capshot' ? (
                    <video
                      src={mediaUrl}
                      poster={thumbnailUrl || undefined}
                      controls
                      className="max-h-80 w-full object-contain"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Uploaded preview"
                      referrerPolicy="no-referrer"
                      className="max-h-80 w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaUrl('');
                      setThumbnailUrl('');
                      setSelectedFile(null);
                    }}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 text-xs text-white hover:bg-black"
                  >
                    Remove Media
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Permanent cloud storage URL verified ({mediaUrl})</span>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Caption
            </label>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write an engaging caption..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Hashtags
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#BoostHub #Creators #Tech"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111830] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {INTEREST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Optional Link URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Live Preview Section */}
          {showPreview && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <p className="text-xs font-semibold text-blue-400">Post Preview</p>
              <p className="text-sm text-white whitespace-pre-wrap">
                {caption || 'No caption yet'}
              </p>
              {hashtags && <p className="text-xs text-blue-400">{hashtags}</p>}
              {linkUrl && <p className="text-xs text-slate-400 underline">{linkUrl}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={publishing || uploading}
            className="w-full min-h-[48px] py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm disabled:opacity-40 transition-all shadow-lg shadow-blue-600/20"
          >
            {publishing ? 'Publishing to BoostHub...' : 'Publish Post'}
          </button>
        </form>
      </div>
    </div>
  );
};
