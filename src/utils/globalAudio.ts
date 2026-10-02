/**
 * Global Audio and Volume Coordinator for BoostHub
 *
 * Solves the issue where reel volume keeps resetting to muted.
 * Once a user un-mutes any video or reel, this preference is remembered globally
 * so subsequent reels, feed videos, and capshots automatically play with clear audio.
 */

const STORAGE_KEY = 'boosthub_global_video_muted';
const EVENT_NAME = 'boosthub:global-audio-change';

let memoryMuted: boolean = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // fallback
  }
  // Default to unmuted if user previously unmuted, or default to false once interacted
  return false;
})();

export function getGlobalVideoMuted(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // ignore
  }
  return memoryMuted;
}

export function setGlobalVideoMuted(muted: boolean): void {
  memoryMuted = muted;
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // ignore
  }

  // Dispatch custom event to notify all active video components
  try {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { muted },
      })
    );
  } catch {
    // ignore
  }
}

export function toggleGlobalVideoMuted(): boolean {
  const next = !getGlobalVideoMuted();
  setGlobalVideoMuted(next);
  return next;
}

export function subscribeToGlobalAudio(
  callback: (muted: boolean) => void
): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ muted: boolean }>;
    if (custom.detail && typeof custom.detail.muted === 'boolean') {
      callback(custom.detail.muted);
    } else {
      callback(getGlobalVideoMuted());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
}

export function configureVideoElementAudio(
  video: HTMLVideoElement | null,
  overrideMuted?: boolean
): void {
  if (!video) return;
  const isMuted =
    typeof overrideMuted === 'boolean' ? overrideMuted : getGlobalVideoMuted();

  video.muted = isMuted;
  video.defaultMuted = isMuted;
  video.volume = 1.0;
  video.playsInline = true;
}
