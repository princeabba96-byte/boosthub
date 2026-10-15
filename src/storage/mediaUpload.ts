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
    let settled = false;
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);

    const finish = (result: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timer = window.setTimeout(() => {
      finish('');
    }, 2000);

    const captureFrame = () => {
      try {
        const vw = video.videoWidth || 480;
        const vh = video.videoHeight || 854;
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(720, vw);
        canvas.height = Math.min(1280, Math.round((canvas.width * vh) / vw));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Verify frame is not purely black
          const sample = ctx.getImageData(
            Math.floor(canvas.width / 2),
            Math.floor(canvas.height / 2),
            1,
            1
          ).data;
          const cornerSample = ctx.getImageData(
            Math.floor(canvas.width / 4),
            Math.floor(canvas.height / 4),
            1,
            1
          ).data;
          const hasSignal =
            sample[0] + sample[1] + sample[2] > 6 ||
            cornerSample[0] + cornerSample[1] + cornerSample[2] > 6;
          if (hasSignal) {
            finish(canvas.toDataURL('image/jpeg', 0.82));
            return;
          }
        }
      } catch {
        // ignore
      }
      finish('');
    };

    video.onloadedmetadata = () => {
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      const targetTime = Math.max(0.1, Math.min(1.0, dur * 0.15));
      try {
        video.currentTime = targetTime;
      } catch {
        captureFrame();
      }
    };

    video.onseeked = () => {
      captureFrame();
    };

    video.onerror = () => {
      finish('');
    };

    video.src = objectUrl;
    try {
      video.load();
    } catch {
      // ignore
    }
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

  // Upload directly to the guaranteed public `posts` bucket (or `avatars` for profile avatars)
  // so files are uploaded in a single fast request without failing on non-existent buckets first.
  if (logicalBucket === 'avatars') {
    const avatarTry = await supabase.storage
      .from('avatars')
      .upload(uniquePath, blob, {
        contentType,
        upsert: true,
      });
    if (!avatarTry.error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(uniquePath);
      if (data?.publicUrl) return data.publicUrl;
    }
  }

  const storagePath = `${logicalBucket}/${uniquePath}`;
  const uploadRes = await supabase.storage
    .from('posts')
    .upload(storagePath, blob, {
      contentType,
      upsert: true,
    });

  if (uploadRes.error) {
    throw new Error(
      `Supabase storage upload failed: ${uploadRes.error.message}`
    );
  }

  const { data } = supabase.storage.from('posts').getPublicUrl(storagePath);
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
  const isAudio =
    file.type.startsWith('audio/') ||
    /\.(wav|mp3|ogg|m4a|aac|webm)$/i.test(file.name);
  if (!isImage && !isVideo && !isAudio) {
    throw new Error('Only image, video, and audio files are supported.');
  }

  onProgress?.(15);
  let thumbnailUrl = '';

  if (isAudio) {
    onProgress?.(45);
    const audioUrl = await uploadBlobToSupabaseStorage(
      bucket,
      file.name,
      file,
      file.type || 'audio/wav'
    );
    onProgress?.(100);
    return {
      url: audioUrl,
      thumbnailUrl: '',
      mimeType: file.type || 'audio/wav',
    };
  }

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
