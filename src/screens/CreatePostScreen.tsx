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
  Sparkles,
} from 'lucide-react';
import { INTEREST_CATEGORIES, PostItem } from '../types';
import { uploadMediaWithProgress } from '../storage/mediaUpload';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';
import {
  StudioMediaEditor,
  StudioEditConfig,
  DEFAULT_STUDIO_CONFIG,
  encodeStudioUrlHash,
  renderStudioCompositeToFile,
} from '../components/StudioMediaEditor';

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
  const [studioConfig, setStudioConfig] = useState<StudioEditConfig>(
    DEFAULT_STUDIO_CONFIG
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadPromiseRef = useRef<Promise<{ url: string; thumbnailUrl?: string } | null> | null>(null);
  const uploadedRemoteUrlRef = useRef<string>('');
  const uploadedThumbUrlRef = useRef<string>('');
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const studioVideoRef = useRef<HTMLVideoElement | null>(null);

  const startMediaUpload = async (file: File) => {
    setSelectedFile(file);
    setUploadError('');

    const isVid = file.type.startsWith('video/');
    if (isVid && postType === 'photo') {
      setPostType('capshot');
    } else if (!isVid && (postType === 'video' || postType === 'capshot')) {
      setPostType('photo');
    }

    // Immediately load local blob URL into StudioMediaEditor (0ms wait time!)
    const localPreviewUrl = URL.createObjectURL(file);
    uploadedRemoteUrlRef.current = '';
    uploadedThumbUrlRef.current = '';
    setMediaUrl(localPreviewUrl);
    setThumbnailUrl('');
    setStudioConfig((prev) => ({
      ...DEFAULT_STUDIO_CONFIG,
      stickers: prev.stickers,
      texts: prev.texts,
    }));
    showToast('Media ready for editing!', 'success');

    // Upload to cloud storage silently in the background
    setUploading(true);
    setUploadProgress(10);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const bgPromise = (async () => {
      try {
        const uploaded = await uploadMediaWithProgress(
          file,
          isVid ? 'videos' : 'posts',
          (pct) => setUploadProgress(pct),
          controller.signal
        );
        uploadedRemoteUrlRef.current = uploaded.url;
        uploadedThumbUrlRef.current = uploaded.thumbnailUrl || '';
        setThumbnailUrl(uploaded.thumbnailUrl || '');
        return uploaded;
      } catch (err: any) {
        setUploadError(err.message || 'Cloud sync failed. Tap Retry before publishing.');
        return null;
      } finally {
        setUploading(false);
        abortControllerRef.current = null;
      }
    })();

    uploadPromiseRef.current = bgPromise;
    await bgPromise;
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
    uploadPromiseRef.current = null;
    setUploading(false);
    setUploadProgress(0);
    setUploadError('Upload cancelled by user.');
  };

  const handleRetryUpload = () => {
    if (selectedFile) {
      void startMediaUpload(selectedFile);
    }
  };

  const hasVisualEdits =
    studioConfig.stickers.length > 0 ||
    studioConfig.texts.length > 0 ||
    studioConfig.zoom !== 1 ||
    studioConfig.rotation !== 0 ||
    studioConfig.flipH ||
    studioConfig.flipV ||
    studioConfig.filterPreset !== 'original' ||
    studioConfig.brightness !== 100 ||
    studioConfig.contrast !== 100 ||
    studioConfig.saturation !== 100 ||
    studioConfig.aspectRatio !== 'original';

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const isVideoMode = postType === 'video' || postType === 'capshot';
    const hasStudioCanvasCard =
      !mediaUrl &&
      (studioConfig.stickers.length > 0 || studioConfig.texts.length > 0);

    if (postType !== 'text' && !mediaUrl && !hasStudioCanvasCard) {
      showToast(
        'Please upload a photo/video or add stickers/text on the Studio Canvas before publishing.',
        'error'
      );
      return;
    }
    if (postType === 'text' && !caption.trim() && !hasStudioCanvasCard) {
      showToast('Please write a caption or add text/stickers on the Studio Canvas.', 'error');
      return;
    }

    setPublishing(true);
    try {
      let finalPostType = postType;
      let resolvedBaseMediaUrl = uploadedRemoteUrlRef.current || mediaUrl;
      let finalThumbnailUrl = uploadedThumbUrlRef.current || thumbnailUrl;

      // If background upload is still running or hasn't completed yet, await or finish it now
      if (uploadPromiseRef.current) {
        const bgResult = await uploadPromiseRef.current;
        if (bgResult?.url) {
          resolvedBaseMediaUrl = bgResult.url;
          finalThumbnailUrl = bgResult.thumbnailUrl || finalThumbnailUrl;
        }
      }
      if (
        selectedFile &&
        (!resolvedBaseMediaUrl || resolvedBaseMediaUrl.startsWith('blob:'))
      ) {
        const uploadedNow = await uploadMediaWithProgress(
          selectedFile,
          isVideoMode ? 'videos' : 'posts',
          (pct) => setUploadProgress(pct)
        );
        resolvedBaseMediaUrl = uploadedNow.url;
        finalThumbnailUrl = uploadedNow.thumbnailUrl || finalThumbnailUrl;
        uploadedRemoteUrlRef.current = uploadedNow.url;
        uploadedThumbUrlRef.current = uploadedNow.thumbnailUrl || '';
      }

      let finalMediaUrl = resolvedBaseMediaUrl;

      if (isVideoMode && resolvedBaseMediaUrl) {
        finalMediaUrl = encodeStudioUrlHash(resolvedBaseMediaUrl, studioConfig, true);
        if (hasVisualEdits) {
          const thumbFile = await renderStudioCompositeToFile(
            mediaUrl.split('#')[0],
            true,
            studioVideoRef.current,
            studioConfig
          );
          if (thumbFile) {
            const uploadedThumb = await uploadMediaWithProgress(
              thumbFile,
              'posts'
            );
            if (uploadedThumb?.url) {
              finalThumbnailUrl = uploadedThumb.url;
            }
          }
        }
      } else if ((!isVideoMode && mediaUrl && hasVisualEdits) || hasStudioCanvasCard) {
        const bakedFile = await renderStudioCompositeToFile(
          mediaUrl.split('#')[0],
          false,
          null,
          studioConfig
        );
        if (bakedFile) {
          const uploadedBaked = await uploadMediaWithProgress(
            bakedFile,
            'posts'
          );
          if (uploadedBaked?.url) {
            finalMediaUrl = uploadedBaked.url;
            finalThumbnailUrl = uploadedBaked.url;
            if (finalPostType === 'text') {
              finalPostType = 'photo';
            }
          }
        }
      }

      const created = await apiFetch<PostItem>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          postType: finalPostType,
          caption: caption.trim(),
          mediaUrl: finalPostType === 'text' ? '' : finalMediaUrl,
          thumbnailUrl: finalPostType === 'text' ? '' : finalThumbnailUrl,
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
      setStudioConfig(DEFAULT_STUDIO_CONFIG);

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

        {/* Media Upload Box & BoostHub Studio Editing Panel */}
        <div className="space-y-4">
          {postType !== 'text' && !mediaUrl && (
            <div className="p-5 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-center space-y-3.5">
              <Upload className="w-7 h-7 text-blue-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-white">
                  Select media from Gallery or capture with Camera
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Then use the Studio Editing Panel below to cut, trim, crop, add stickers, write text & apply filters
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
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
          )}

          {mediaUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium">
                  Media loaded in Studio Editor ({mediaUrl.split('#')[0]})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold"
                >
                  Change Media
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setThumbnailUrl('');
                    setSelectedFile(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* BoostHub Studio Editing Panel: Cut, Trim, Crop, Stickers, Write Text & Filters */}
          <StudioMediaEditor
            mediaUrl={mediaUrl}
            isVideo={postType === 'video' || postType === 'capshot'}
            config={studioConfig}
            onChangeConfig={setStudioConfig}
            videoRefExternal={studioVideoRef}
            onBakeStudioImage={async (bakedFile) => {
              await startMediaUpload(bakedFile);
              setStudioConfig(DEFAULT_STUDIO_CONFIG);
              showToast(
                'Studio stickers, text & filters baked into your image!',
                'success'
              );
            }}
          />
        </div>

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
