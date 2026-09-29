import { getAuthToken } from '../services/api';

export interface UploadProgressCallback {
  (progress: number): void;
}

export async function compressImageFile(file: File, maxWidth = 1280, quality = 0.84): Promise<string> {
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
            (canvas.width * (video.videoHeight || 854)) / (video.videoWidth || 480)
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read media file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function uploadMediaWithProgress(
  file: File,
  bucket: 'avatars' | 'posts' | 'videos' | 'stories' | 'messages' | 'communities' | 'thumbnails',
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal
): Promise<{ url: string; thumbnailUrl?: string; mimeType: string }> {
  const maxBytes = 30 * 1024 * 1024; // 30MB limit
  if (file.size > maxBytes) {
    throw new Error('File size exceeds the 30MB maximum limit.');
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error('Only image and video files are supported.');
  }

  onProgress?.(12);
  let dataUrl: string;
  let thumbnailUrl = '';

  if (isImage) {
    dataUrl = await compressImageFile(file, bucket === 'avatars' ? 512 : 1280);
    onProgress?.(40);
  } else {
    const thumbData = await generateVideoThumbnail(file);
    dataUrl = await readFileAsDataUrl(file);
    onProgress?.(35);
    if (thumbData) {
      const thumbRes = await sendUploadRequest(
        {
          bucket: 'thumbnails',
          fileName: `thumb_${file.name}.jpg`,
          mimeType: 'image/jpeg',
          sizeBytes: thumbData.length,
          dataUrl: thumbData,
        },
        undefined,
        signal
      );
      thumbnailUrl = thumbRes.url;
    }
    onProgress?.(50);
  }

  const uploaded = await sendUploadRequest(
    {
      bucket,
      fileName: file.name,
      mimeType: isImage ? 'image/jpeg' : file.type,
      sizeBytes: file.size,
      dataUrl,
    },
    (xhrProgress) => {
      const mapped = 50 + Math.round(xhrProgress * 0.5);
      onProgress?.(Math.min(100, mapped));
    },
    signal
  );

  onProgress?.(100);
  return {
    url: uploaded.url,
    thumbnailUrl: thumbnailUrl || (isImage ? uploaded.url : ''),
    mimeType: uploaded.mimeType,
  };
}

function sendUploadRequest(
  payload: {
    bucket: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  },
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<{ id: number; url: string; mimeType: string }> {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('.github.io') ||
      window.location.hostname.endsWith('.pages.dev') ||
      window.location.hostname.endsWith('.netlify.app'))
  ) {
    onProgress?.(100);
    return Promise.resolve({
      id: Date.now(),
      url: payload.dataUrl,
      mimeType: payload.mimeType,
    });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/storage/upload', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled.'));
      });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid response from storage server.'));
        }
      } else if (xhr.status === 404 || xhr.status === 405) {
        resolve({
          id: Date.now(),
          url: payload.dataUrl,
          mimeType: payload.mimeType,
        });
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || 'Upload failed. Please try again.'));
        } catch {
          reject(new Error('Upload failed. Please try again.'));
        }
      }
    };

    xhr.onerror = () => {
      resolve({
        id: Date.now(),
        url: payload.dataUrl,
        mimeType: payload.mimeType,
      });
    };

    xhr.send(JSON.stringify(payload));
  });
}
