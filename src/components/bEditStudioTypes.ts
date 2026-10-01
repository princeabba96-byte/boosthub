import {
  StudioStickerLayer,
  StudioTextLayer,
  StudioSubtitleCue,
  StudioTransitionType,
  StudioVfxOverlay,
  StudioSoundEffect,
  STUDIO_FILTER_PRESETS,
  STUDIO_BUILTIN_SOUNDS,
  buildCssFilterString,
  getFontFamilyCss,
} from './StudioMediaEditor';

export interface BEditTimelineClip {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'photo';
  sourceDuration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  reversed: boolean;
  volume: number;
  muted: boolean;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  cropZoom: number;
  cropX: number;
  cropY: number;
  filterPreset: string;
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  vfxOverlay: StudioVfxOverlay;
  transitionAfter: StudioTransitionType;
  transitionDuration: number;
  chromaKeyEnabled: boolean;
  chromaKeyColor: 'green' | 'blue' | 'black';
  chromaKeySensitivity: number;
}

export interface BEditPiPLayer {
  id: string;
  url: string;
  type: 'video' | 'photo';
  x: number; // 10..90%
  y: number; // 10..90%
  scale: number; // 0.4..1.8
  borderRadius: number;
}

export interface BEditProjectState {
  id: string;
  name: string;
  updatedAt: string;
  aspectRatio: '9:16' | '1:1' | '16:9' | '4:5';
  canvasBgColor: string;
  clips: BEditTimelineClip[];
  stickers: StudioStickerLayer[];
  texts: StudioTextLayer[];
  subtitles: StudioSubtitleCue[];
  pipLayer: BEditPiPLayer | null;
  // Audio Track & Voice Cover / Voice Changer
  soundTrackId: string;
  customAudioUrl: string;
  customAudioName: string;
  soundTrimStart: number;
  soundTrimEnd: number;
  soundDuration: number;
  soundVolume: number;
  soundLoop: boolean;
  soundEffect: StudioSoundEffect;
  voiceoverAudioUrl?: string;
  voiceoverRawUrl?: string;
  voiceoverName?: string;
  voiceoverDuration?: number;
  voiceoverVolume?: number;
  voicePresetId?: string;
  thumbnailDataUrl: string;
}

export type BEditBottomTab =
  | 'media'
  | 'audio'
  | 'text'
  | 'stickers'
  | 'effects'
  | 'filters'
  | 'more';

export const BOOSTHUB_MAX_VIDEO_SECONDS = 30;

const SAVED_PROJECTS_KEY = 'boosthub_bedit_saved_projects_v1';

export function createDefaultClip(
  partial?: Partial<BEditTimelineClip>
): BEditTimelineClip {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: 'Clip 1',
    url: '',
    type: 'video',
    sourceDuration: 10,
    trimStart: 0,
    trimEnd: 10,
    speed: 1,
    reversed: false,
    volume: 100,
    muted: false,
    rotation: 0,
    flipH: false,
    flipV: false,
    cropZoom: 1,
    cropX: 0,
    cropY: 0,
    filterPreset: 'original',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    vfxOverlay: 'none',
    transitionAfter: 'cross_dissolve',
    transitionDuration: 0.6,
    chromaKeyEnabled: false,
    chromaKeyColor: 'green',
    chromaKeySensitivity: 45,
    ...partial,
  };
}

export function createDefaultProjectState(): BEditProjectState {
  return {
    id: `proj_${Date.now()}`,
    name: 'Untitled BoostHub Edit',
    updatedAt: new Date().toISOString(),
    aspectRatio: '9:16',
    canvasBgColor: '#090D1A',
    clips: [],
    stickers: [],
    texts: [],
    subtitles: [],
    pipLayer: null,
    soundTrackId: 'none',
    customAudioUrl: '',
    customAudioName: '',
    soundTrimStart: 0,
    soundTrimEnd: 15,
    soundDuration: 20,
    soundVolume: 85,
    soundLoop: true,
    soundEffect: 'original',
    voiceoverAudioUrl: '',
    voiceoverRawUrl: '',
    voiceoverName: '',
    voiceoverDuration: 0,
    voiceoverVolume: 100,
    voicePresetId: 'original',
    thumbnailDataUrl: '',
  };
}

export function getClipEffectiveDuration(clip: BEditTimelineClip): number {
  const rawLen = Math.max(0.5, clip.trimEnd - clip.trimStart);
  return Math.max(0.3, rawLen / (clip.speed || 1));
}

export function getProjectTotalDuration(project: BEditProjectState): number {
  if (project.clips.length === 0) return 0;
  return project.clips.reduce(
    (acc, clip) => acc + getClipEffectiveDuration(clip),
    0
  );
}

export function loadSavedBEditProjects(): BEditProjectState[] {
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBEditProjectToStorage(
  project: BEditProjectState
): BEditProjectState[] {
  try {
    const existing = loadSavedBEditProjects();
    const updatedProject: BEditProjectState = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    const next = [
      updatedProject,
      ...existing.filter((p) => p.id !== project.id),
    ].slice(0, 15);
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function deleteSavedBEditProject(projectId: string): BEditProjectState[] {
  try {
    const existing = loadSavedBEditProjects();
    const next = existing.filter((p) => p.id !== projectId);
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/**
 * Captures a frame from an HTMLVideoElement or HTMLImageElement into a JPEG data URL for thumbnails
 */
export function captureElementFrameDataUrl(
  el: HTMLVideoElement | HTMLImageElement | null,
  width = 540,
  height = 960
): string {
  if (!el) return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#090D1A';
    ctx.fillRect(0, 0, width, height);
    const sw =
      el instanceof HTMLVideoElement
        ? el.videoWidth || width
        : el.naturalWidth || width;
    const sh =
      el instanceof HTMLVideoElement
        ? el.videoHeight || height
        : el.naturalHeight || height;
    const scale = Math.max(width / sw, height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(el, (width - dw) / 2, (height - dh) / 2, dw, dh);
    return canvas.toDataURL('image/jpeg', 0.86);
  } catch {
    return '';
  }
}

export async function dataUrlToFile(
  dataUrl: string,
  filename = `thumbnail-${Date.now()}.jpg`
): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

/**
 * Real browser-based canvas compositor & MediaRecorder video exporter.
 * Renders the sequence of clips, filters, chroma-key, transitions, PiP, stickers, animated text & subtitles
 * into a downloadable & uploadable WebM/MP4 video File (clamped to BoostHub's 30s limit).
 */
export async function exportBEditProjectToVideoFile(
  project: BEditProjectState,
  onProgress: (pct: number, stepLabel: string) => void
): Promise<{ file: File; thumbnailDataUrl: string } | null> {
  const dims =
    project.aspectRatio === '1:1'
      ? { w: 720, h: 720 }
      : project.aspectRatio === '16:9'
        ? { w: 960, h: 540 }
        : project.aspectRatio === '4:5'
          ? { w: 720, h: 900 }
          : { w: 540, h: 960 };

  const canvas = document.createElement('canvas');
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const totalDur = Math.min(
    BOOSTHUB_MAX_VIDEO_SECONDS,
    Math.max(2, getProjectTotalDuration(project) || 5)
  );

  onProgress(5, 'Initializing browser video encoder...');

  // Preload clip media elements
  const loadedMedia: Array<{
    clip: BEditTimelineClip;
    el: HTMLVideoElement | HTMLImageElement | null;
    startOffset: number;
    endOffset: number;
  }> = [];

  let cursor = 0;
  for (const clip of project.clips) {
    const effDur = getClipEffectiveDuration(clip);
    if (cursor >= BOOSTHUB_MAX_VIDEO_SECONDS) break;
    const clampedDur = Math.min(effDur, BOOSTHUB_MAX_VIDEO_SECONDS - cursor);
    let el: HTMLVideoElement | HTMLImageElement | null = null;

    if (clip.url) {
      if (clip.type === 'video') {
        el = await new Promise<HTMLVideoElement | null>((resolve) => {
          const v = document.createElement('video');
          v.crossOrigin = 'anonymous';
          v.muted = true;
          v.playsInline = true;
          v.preload = 'auto';
          v.src = clip.url.split('#')[0];
          const timer = window.setTimeout(() => resolve(v), 2500);
          v.onloadeddata = () => {
            window.clearTimeout(timer);
            resolve(v);
          };
          v.onerror = () => {
            window.clearTimeout(timer);
            resolve(null);
          };
        });
      } else {
        el = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = clip.url;
        });
      }
    }

    loadedMedia.push({
      clip,
      el,
      startOffset: cursor,
      endOffset: cursor + clampedDur,
    });
    cursor += clampedDur;
  }

  // Load optional PiP element
  let pipEl: HTMLImageElement | HTMLVideoElement | null = null;
  if (project.pipLayer?.url) {
    if (project.pipLayer.type === 'photo') {
      pipEl = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = project.pipLayer!.url;
      });
    } else {
      pipEl = await new Promise<HTMLVideoElement | null>((resolve) => {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.muted = true;
        v.playsInline = true;
        v.src = project.pipLayer!.url;
        const t = window.setTimeout(() => resolve(v), 1800);
        v.onloadeddata = () => {
          window.clearTimeout(t);
          v.play().catch(() => {});
          resolve(v);
        };
        v.onerror = () => {
          window.clearTimeout(t);
          resolve(null);
        };
      });
    }
  }

  const stream = canvas.captureStream(30);

  // Mix Voice Cover / Extracted Audio / Custom Music into the MediaRecorder stream
  let exportAudioCtx: AudioContext | null = null;
  const activeSources: AudioBufferSourceNode[] = [];
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      exportAudioCtx = new AudioCtx();
      const dest = exportAudioCtx.createMediaStreamDestination();

      const scheduleAudioUrl = async (
        url: string | undefined,
        volPct: number,
        loop: boolean,
        trimStart = 0
      ) => {
        if (!url) return;
        try {
          const res = await fetch(url.split('#')[0]);
          const arr = await res.arrayBuffer();
          const buf = await exportAudioCtx!.decodeAudioData(arr.slice(0));
          const srcNode = exportAudioCtx!.createBufferSource();
          srcNode.buffer = buf;
          srcNode.loop = loop;
          const gainNode = exportAudioCtx!.createGain();
          gainNode.gain.value = Math.max(0, Math.min(1.5, volPct / 100));
          srcNode.connect(gainNode);
          gainNode.connect(dest);
          srcNode.start(0, Math.max(0, Math.min(buf.duration - 0.1, trimStart)));
          activeSources.push(srcNode);
        } catch {
          // ignore if audio decode fails
        }
      };

      await Promise.all([
        scheduleAudioUrl(
          project.voiceoverAudioUrl,
          project.voiceoverVolume ?? 100,
          false,
          0
        ),
        scheduleAudioUrl(
          project.customAudioUrl,
          project.soundVolume ?? 85,
          Boolean(project.soundLoop),
          project.soundTrimStart || 0
        ),
      ]);

      dest.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });
    }
  } catch {
    // fallback to video-only stream if AudioContext blocked
  }

  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  const selectedMime =
    mimeTypes.find((m) =>
      typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
    ) || '';

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(
    stream,
    selectedMime ? { mimeType: selectedMime } : undefined
  );
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingStopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(
        new Blob(chunks, {
          type: selectedMime || 'video/webm',
        })
      );
    };
  });

  recorder.start(100);
  let capturedThumb = project.thumbnailDataUrl;

  const fps = 24;
  const totalFrames = Math.max(12, Math.min(240, Math.round(totalDur * fps)));
  const timePerFrame = totalDur / totalFrames;

  for (let f = 0; f < totalFrames; f++) {
    const timelineTime = f * timePerFrame;
    const pct = Math.min(96, 10 + Math.round((f / totalFrames) * 85));
    onProgress(pct, `Rendering frame ${f + 1}/${totalFrames}...`);

    // 1. Fill canvas background
    ctx.fillStyle = project.canvasBgColor || '#090D1A';
    ctx.fillRect(0, 0, dims.w, dims.h);

    // 2. Find active clip for timelineTime
    const activeEntry =
      loadedMedia.find(
        (m) => timelineTime >= m.startOffset && timelineTime <= m.endOffset
      ) || loadedMedia[loadedMedia.length - 1];

    if (activeEntry && activeEntry.el) {
      const { clip, el, startOffset, endOffset } = activeEntry;
      const localElapsed = Math.max(0, timelineTime - startOffset);
      const clipSpan = Math.max(0.2, endOffset - startOffset);

      if (el instanceof HTMLVideoElement) {
        const targetVidTime = clip.reversed
          ? Math.max(
              clip.trimStart,
              clip.trimEnd - localElapsed * (clip.speed || 1)
            )
          : Math.min(
              clip.trimEnd,
              clip.trimStart + localElapsed * (clip.speed || 1)
            );
        if (Math.abs(el.currentTime - targetVidTime) > 0.12) {
          el.currentTime = targetVidTime;
        }
      }

      ctx.save();
      ctx.filter = buildCssFilterString({
        filterPreset: clip.filterPreset,
        brightness: clip.brightness,
        contrast: clip.contrast,
        saturation: clip.saturation,
        exposure: clip.exposure,
      });

      // Transition near end of clip
      const remaining = endOffset - timelineTime;
      if (
        clip.transitionAfter !== 'none' &&
        remaining <= (clip.transitionDuration || 0.6)
      ) {
        const trP =
          1 - remaining / Math.max(0.2, clip.transitionDuration || 0.6);
        if (clip.transitionAfter === 'cross_dissolve') {
          ctx.globalAlpha = Math.max(0.2, 1 - trP * 0.8);
        } else if (clip.transitionAfter === 'slide_left') {
          ctx.translate(-trP * dims.w * 0.7, 0);
        } else if (clip.transitionAfter === 'slide_right') {
          ctx.translate(trP * dims.w * 0.7, 0);
        } else if (clip.transitionAfter === 'zoom_in') {
          ctx.translate(dims.w / 2, dims.h / 2);
          ctx.scale(1 + trP * 0.8, 1 + trP * 0.8);
          ctx.translate(-dims.w / 2, -dims.h / 2);
        }
      }

      ctx.translate(
        dims.w / 2 + (clip.cropX / 100) * dims.w,
        dims.h / 2 + (clip.cropY / 100) * dims.h
      );
      ctx.rotate((clip.rotation * Math.PI) / 180);
      ctx.scale(
        clip.cropZoom * (clip.flipH ? -1 : 1),
        clip.cropZoom * (clip.flipV ? -1 : 1)
      );

      const sw =
        el instanceof HTMLVideoElement
          ? el.videoWidth || dims.w
          : el.naturalWidth || dims.w;
      const sh =
        el instanceof HTMLVideoElement
          ? el.videoHeight || dims.h
          : el.naturalHeight || dims.h;
      const scale = Math.min(dims.w / sw, dims.h / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      // Optional VFX overlays
      if (clip.vfxOverlay === 'cinema_bars') {
        const bh = Math.round(dims.h * 0.09);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, dims.w, bh);
        ctx.fillRect(0, dims.h - bh, dims.w, bh);
      } else if (clip.vfxOverlay === 'light_leak') {
        const grad = ctx.createLinearGradient(0, 0, dims.w * 0.6, dims.h * 0.5);
        grad.addColorStop(0, 'rgba(251,146,60,0.35)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, dims.w, dims.h);
      }

      void clipSpan;
    }

    // 3. Draw PiP overlay if present
    if (project.pipLayer && pipEl) {
      ctx.save();
      const px = (project.pipLayer.x / 100) * dims.w;
      const py = (project.pipLayer.y / 100) * dims.h;
      const pw = dims.w * 0.32 * project.pipLayer.scale;
      const ph = pw * 1.25;
      ctx.translate(px, py);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      ctx.drawImage(pipEl, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    // 4. Draw Stickers
    for (const st of project.stickers) {
      ctx.save();
      ctx.translate((st.x / 100) * dims.w, (st.y / 100) * dims.h);
      ctx.rotate((st.rotation * Math.PI) / 180);
      ctx.scale(st.scale, st.scale);
      ctx.font = st.isBadge
        ? '800 22px system-ui, sans-serif'
        : '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(st.content, 0, 0);
      ctx.restore();
    }

    // 5. Draw Text Overlays
    for (const tx of project.texts) {
      if (!tx.text.trim()) continue;
      ctx.save();
      ctx.translate((tx.x / 100) * dims.w, (tx.y / 100) * dims.h);
      ctx.rotate((tx.rotation * Math.PI) / 180);
      ctx.scale(tx.scale, tx.scale);
      ctx.font = `800 28px ${getFontFamilyCss(tx.fontFamily)}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = tx.color;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 8;
      const displayTxt =
        tx.animation === 'typewriter'
          ? tx.text.slice(
              0,
              Math.max(
                1,
                Math.floor(((timelineTime % 3) / 2.2) * tx.text.length)
              )
            )
          : tx.text;
      ctx.fillText(displayTxt, 0, 0);
      ctx.restore();
    }

    // 6. Draw Timed Auto-Captions / Subtitles
    const activeCue = project.subtitles.find(
      (c) => timelineTime >= c.startTime && timelineTime <= c.endTime
    );
    if (activeCue) {
      ctx.save();
      ctx.font = '800 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText(activeCue.text);
      const bw = Math.min(dims.w - 32, metrics.width + 32);
      const bh = 44;
      const bx = (dims.w - bw) / 2;
      const by = dims.h * 0.82 - bh / 2;
      ctx.fillStyle = 'rgba(9, 13, 26, 0.82)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#FACC15';
      ctx.fillText(activeCue.text, dims.w / 2, dims.h * 0.82);
      ctx.restore();
    }

    if (!capturedThumb && f === Math.min(5, totalFrames - 1)) {
      capturedThumb = canvas.toDataURL('image/jpeg', 0.86);
    }

    await new Promise((r) => window.setTimeout(r, 25));
  }

  activeSources.forEach((s) => {
    try {
      s.stop();
    } catch {
      // ignore
    }
  });
  if (exportAudioCtx) {
    exportAudioCtx.close().catch(() => {});
  }
  recorder.stop();
  const videoBlob = await recordingStopped;
  onProgress(100, 'Export complete!');

  const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([videoBlob], `boosthub-bedit-${Date.now()}.${ext}`, {
    type: videoBlob.type || 'video/webm',
  });

  return {
    file,
    thumbnailDataUrl: capturedThumb || canvas.toDataURL('image/jpeg', 0.85),
  };
}

export { STUDIO_FILTER_PRESETS, STUDIO_BUILTIN_SOUNDS };
