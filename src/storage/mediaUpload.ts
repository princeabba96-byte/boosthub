import { supabase, ADMIN_ABBA_UUID } from '../lib/supabase';
import { getAuthToken } from '../services/api';

export interface UploadProgressCallback {
  (progress: number): void;
}

export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4 || 0);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(720, video.videoWidth || 480);
        canvas.height = Math.min(
          1280,
          Math.round(
            (canvas.width * (video.videoHeight || 854)) /
              (video.videoWidth || 480)
          )
        );
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          cleanup();
          resolve(canvas.toDataURL('image/jpeg', 0.8));
          return;
        }
      } catch {
        // ignore
      }
      cleanup();
      resolve('');
    };

    video.onerror = () => {
      cleanup();
      resolve('');
    };
  });
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1] || '');
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return { blob: new Blob([array], { type: mimeType }), mimeType };
}

function resolveCurrentUserIdForPath(): string {
  const token = getAuthToken();
  if (token && token.startsWith('sb_user_')) {
    return token.replace('sb_user_', '');
  }
  return ADMIN_ABBA_UUID;
}

async function uploadBlobToSupabaseStorage(
  logicalBucket: string,
  fileName: string,
  blob: Blob | File,
  contentType: string
): Promise<string> {
  const uid = resolveCurrentUserIdForPath();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniquePath = `${uid}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${safeName}`;

  const targetBucketMap: Record<string, string> = {
    avatars: 'avatars',
    posts: 'posts-media',
    videos: 'posts-media',
    stories: 'stories-media',
    thumbnails: 'posts-media',
    communities: 'posts-media',
    messages: 'posts-media',
  };
  const preferredBucket = targetBucketMap[logicalBucket] || 'posts-media';

  // 1. Try preferred bucket (avatars / posts-media / stories-media)
  const firstTry = await supabase.storage
    .from(preferredBucket)
    .upload(uniquePath, blob, {
      contentType,
      upsert: true,
    });

  if (!firstTry.error) {
    const { data } = supabase.storage
      .from(preferredBucket)
      .getPublicUrl(uniquePath);
    if (data?.publicUrl) return data.publicUrl;
  }

  // 2. Fallback to guaranteed public `posts` bucket on user's Supabase
  const fallbackPath = `${logicalBucket}/${uniquePath}`;
  const secondTry = await supabase.storage
    .from('posts')
    .upload(fallbackPath, blob, {
      contentType,
      upsert: true,
    });

  if (secondTry.error) {
    throw new Error(
      `Supabase storage upload failed: ${secondTry.error.message}`
    );
  }

  const { data } = supabase.storage.from('posts').getPublicUrl(fallbackPath);
  return data.publicUrl;
}

export async function uploadMediaWithProgress(
  file: File,
  bucket:
    | 'avatars'
    | 'posts'
    | 'videos'
    | 'stories'
    | 'messages'
    | 'communities'
    | 'thumbnails',
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<{ url: string; thumbnailUrl?: string; mimeType: string }> {
  const maxBytes = 45 * 1024 * 1024; // 45MB limit
  if (file.size > maxBytes) {
    throw new Error('File size exceeds the 45MB maximum limit.');
  }

  if (signal?.aborted) {
    throw new Error('Upload cancelled.');
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error('Only image and video files are supported.');
  }

  onProgress?.(15);
  let thumbnailUrl = '';

  if (isImage) {
    const compressedDataUrl = await compressImageFile(
      file,
      bucket === 'avatars' ? 512 : 1280
    );
    onProgress?.(45);
    const { blob, mimeType } = dataUrlToBlob(compressedDataUrl);
    const publicUrl = await uploadBlobToSupabaseStorage(
      bucket,
      file.name.endsWith('.jpg') ? file.name : `${file.name}.jpg`,
      blob,
      mimeType
    );
    onProgress?.(100);
    return {
      url: publicUrl,
      thumbnailUrl: publicUrl,
      mimeType,
    };
  }

  // Video upload directly to Supabase Storage
  const thumbDataUrl = await generateVideoThumbnail(file);
  onProgress?.(35);

  if (thumbDataUrl) {
    try {
      const { blob: thumbBlob, mimeType: thumbMime } =
        dataUrlToBlob(thumbDataUrl);
      thumbnailUrl = await uploadBlobToSupabaseStorage(
        'thumbnails',
        `thumb_${file.name}.jpg`,
        thumbBlob,
        thumbMime
      );
    } catch {
      // ignore thumbnail upload failure
    }
  }

  onProgress?.(60);
  const videoUrl = await uploadBlobToSupabaseStorage(
    bucket,
    file.name,
    file,
    file.type || 'video/mp4'
  );
  onProgress?.(100);

  return {
    url: videoUrl,
    thumbnailUrl,
    mimeType: file.type || 'video/mp4',
  };
}
