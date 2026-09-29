import React, { useEffect, useRef, useState } from 'react';
import {
  Scissors,
  Type,
  Smile,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Trash2,
  Check,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Move,
} from 'lucide-react';

export interface StudioStickerLayer {
  id: string;
  content: string;
  isBadge?: boolean;
  badgeColor?: string;
  x: number; // percentage 10..90
  y: number; // percentage 10..90
  scale: number; // 0.5..2.5
  rotation: number; // -180..180
}

export interface StudioTextLayer {
  id: string;
  text: string;
  fontFamily: 'display' | 'sans' | 'mono' | 'serif' | 'neon';
  color: string;
  bgStyle: 'pill' | 'glass' | 'neon' | 'none';
  x: number; // percentage 10..90
  y: number; // percentage 10..90
  scale: number; // 0.6..2.2
  rotation: number; // -45..45
}

export interface StudioEditConfig {
  trimStart: number;
  trimEnd: number;
  duration: number;
  playbackSpeed: number;
  muteAudio: boolean;
  aspectRatio: 'original' | '9:16' | '1:1' | '4:5' | '16:9';
  zoom: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  filterPreset: string;
  brightness: number;
  contrast: number;
  saturation: number;
  stickers: StudioStickerLayer[];
  texts: StudioTextLayer[];
  canvasBgId?: string;
}

export const DEFAULT_STUDIO_CONFIG: StudioEditConfig = {
  trimStart: 0,
  trimEnd: 0,
  duration: 0,
  playbackSpeed: 1,
  muteAudio: false,
  aspectRatio: 'original',
  zoom: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
  filterPreset: 'original',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  stickers: [],
  texts: [],
  canvasBgId: 'cyber_neon',
};

export const STUDIO_FILTER_PRESETS: Array<{
  id: string;
  name: string;
  brightness: number;
  contrast: number;
  saturation: number;
  extraCss?: string;
}> = [
  { id: 'original', name: 'Original', brightness: 100, contrast: 100, saturation: 100 },
  { id: 'boost_neon', name: 'Boost Neon', brightness: 108, contrast: 122, saturation: 145 },
  { id: 'golden_hour', name: 'Golden Hour', brightness: 106, contrast: 110, saturation: 132, extraCss: 'sepia(18%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', brightness: 105, contrast: 128, saturation: 160, extraCss: 'hue-rotate(-12deg)' },
  { id: 'crisp_vivid', name: 'Crisp Vivid', brightness: 104, contrast: 118, saturation: 128 },
  { id: 'warm_cinema', name: 'Warm Cinema', brightness: 98, contrast: 115, saturation: 112, extraCss: 'sepia(14%)' },
  { id: 'cool_arctic', name: 'Cool Arctic', brightness: 106, contrast: 112, saturation: 92, extraCss: 'hue-rotate(14deg)' },
  { id: 'noir_bw', name: 'Noir B&W', brightness: 105, contrast: 135, saturation: 0 },
];

export const STUDIO_BADGE_STICKERS: Array<{ label: string; color: string }> = [
  { label: 'BOOSTED 🔥', color: 'from-orange-500 to-rose-600' },
  { label: 'CAPSHOT 🎬', color: 'from-purple-600 to-blue-600' },
  { label: 'NEW DROP 🚀', color: 'from-blue-600 to-cyan-500' },
  { label: 'VIP 👑', color: 'from-amber-400 to-yellow-600' },
  { label: '100% REAL 💯', color: 'from-emerald-500 to-teal-600' },
  { label: 'MUST WATCH 👀', color: 'from-pink-500 to-purple-600' },
  { label: 'SOUND ON 🔊', color: 'from-indigo-500 to-blue-600' },
  { label: 'TRENDING #1 🏆', color: 'from-amber-500 to-orange-600' },
  { label: 'LIVE VIBES ⚡', color: 'from-violet-600 to-fuchsia-600' },
  { label: 'LINK BELOW 🔗', color: 'from-sky-500 to-blue-700' },
];

export const STUDIO_EMOJI_STICKERS: string[] = [
  '🔥', '💎', '👑', '🚀', '❤️', '😂', '🤯', '🎉',
  '✨', '💯', '👏', '🙌', '⚡', '🌟', '🎶', '📸',
  '🎯', '💪', '🦁', '🌍', '🍿', '🦋', '🌈', '💥',
];

export const STUDIO_TEXT_COLORS: string[] = [
  '#FFFFFF',
  '#38BDF8',
  '#A855F7',
  '#FACC15',
  '#34D399',
  '#FB7185',
  '#F97316',
  '#22D3EE',
  '#F43F5E',
  '#0F172A',
];

export const STUDIO_CANVAS_BACKGROUNDS: Array<{
  id: string;
  name: string;
  css: string;
  stops: [string, string, string];
}> = [
  {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    css: 'bg-gradient-to-br from-blue-900 via-[#0B1026] to-purple-900',
    stops: ['#1e3a8a', '#0B1026', '#581c87'],
  },
  {
    id: 'royal_purple',
    name: 'Royal Purple',
    css: 'bg-gradient-to-br from-purple-900 via-fuchsia-950 to-indigo-950',
    stops: ['#581c87', '#4a044e', '#1e1b4b'],
  },
  {
    id: 'sunset_blaze',
    name: 'Sunset Blaze',
    css: 'bg-gradient-to-br from-rose-900 via-orange-950 to-amber-900',
    stops: ['#881337', '#431407', '#78350f'],
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    css: 'bg-gradient-to-br from-emerald-900 via-[#071F1B] to-teal-950',
    stops: ['#064e3b', '#071F1B', '#042f2e'],
  },
  {
    id: 'midnight_gold',
    name: 'Midnight Gold',
    css: 'bg-gradient-to-br from-amber-800 via-[#12100B] to-yellow-950',
    stops: ['#92400e', '#12100B', '#422006'],
  },
  {
    id: 'deep_space',
    name: 'Deep Space',
    css: 'bg-gradient-to-br from-slate-900 via-[#05070F] to-blue-950',
    stops: ['#0f172a', '#05070F', '#172554'],
  },
];

export function buildCssFilterString(config: Partial<StudioEditConfig>): string {
  const b = config.brightness ?? 100;
  const c = config.contrast ?? 100;
  const s = config.saturation ?? 100;
  const preset = STUDIO_FILTER_PRESETS.find((p) => p.id === config.filterPreset);
  const extra = preset?.extraCss ? ` ${preset.extraCss}` : '';
  return `brightness(${b}%) contrast(${c}%) saturate(${s}%)${extra}`;
}

export function getFontFamilyCss(font: StudioTextLayer['fontFamily']): string {
  switch (font) {
    case 'display':
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    case 'serif':
      return 'Georgia, Cambria, "Times New Roman", Times, serif';
    case 'neon':
      return 'system-ui, -apple-system, sans-serif';
    default:
      return 'Inter, system-ui, sans-serif';
  }
}

export function encodeStudioUrlHash(
  baseUrl: string,
  config: StudioEditConfig,
  isVideo: boolean
): string {
  if (!baseUrl) return '';
  const cleanBase = baseUrl.split('#')[0];
  const hasTrim =
    isVideo &&
    config.duration > 0 &&
    (config.trimStart > 0.1 ||
      (config.trimEnd > 0 && config.trimEnd < config.duration - 0.1));
  const hasEdits =
    hasTrim ||
    config.playbackSpeed !== 1 ||
    config.muteAudio ||
    config.zoom !== 1 ||
    config.rotation !== 0 ||
    config.flipH ||
    config.flipV ||
    config.filterPreset !== 'original' ||
    config.brightness !== 100 ||
    config.contrast !== 100 ||
    config.saturation !== 100 ||
    config.stickers.length > 0 ||
    config.texts.length > 0;

  if (!hasEdits) return cleanBase;

  const compactPayload = {
    ts: Number(config.trimStart.toFixed(1)),
    te: Number(config.trimEnd.toFixed(1)),
    sp: config.playbackSpeed,
    mu: config.muteAudio ? 1 : 0,
    zm: config.zoom,
    rt: config.rotation,
    fh: config.flipH ? 1 : 0,
    fv: config.flipV ? 1 : 0,
    fp: config.filterPreset,
    br: config.brightness,
    ct: config.contrast,
    sa: config.saturation,
    st: config.stickers,
    tx: config.texts,
  };

  try {
    const encoded = btoa(encodeURIComponent(JSON.stringify(compactPayload)));
    const timeFrag =
      isVideo && config.trimEnd > config.trimStart
        ? `t=${config.trimStart.toFixed(1)},${config.trimEnd.toFixed(1)}&`
        : '';
    return `${cleanBase}#${timeFrag}studio=${encoded}`;
  } catch {
    return cleanBase;
  }
}

export function parseStudioUrlHash(mediaUrl?: string): Partial<StudioEditConfig> | null {
  if (!mediaUrl || !mediaUrl.includes('studio=')) return null;
  try {
    const hash = mediaUrl.split('#')[1] || '';
    const match = hash.match(/studio=([^&]+)/);
    if (!match) return null;
    const raw = JSON.parse(decodeURIComponent(atob(match[1])));
    return {
      trimStart: Number(raw.ts) || 0,
      trimEnd: Number(raw.te) || 0,
      playbackSpeed: Number(raw.sp) || 1,
      muteAudio: Boolean(raw.mu),
      zoom: Number(raw.zm) || 1,
      rotation: Number(raw.rt) || 0,
      flipH: Boolean(raw.fh),
      flipV: Boolean(raw.fv),
      filterPreset: raw.fp || 'original',
      brightness: raw.br ?? 100,
      contrast: raw.ct ?? 100,
      saturation: raw.sa ?? 100,
      stickers: Array.isArray(raw.st) ? raw.st : [],
      texts: Array.isArray(raw.tx) ? raw.tx : [],
    };
  } catch {
    return null;
  }
}

/**
 * Renders an image or studio canvas + all stickers, text overlays, crop/zoom/rotation & color filters
 * into a high-resolution PNG File so published photo/canvas posts have all edits baked in.
 */
export async function renderStudioCompositeToFile(
  sourceMediaUrl: string,
  isVideo: boolean,
  videoElement: HTMLVideoElement | null,
  config: StudioEditConfig
): Promise<File | null> {
  try {
    const canvas = document.createElement('canvas');
    let width = 1080;
    let height = 1080;
    if (config.aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (config.aspectRatio === '4:5') {
      width = 1080;
      height = 1350;
    } else if (config.aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Background fill
    const bgPreset =
      STUDIO_CANVAS_BACKGROUNDS.find((b) => b.id === config.canvasBgId) ||
      STUDIO_CANVAS_BACKGROUNDS[0];
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, bgPreset.stops[0]);
    grad.addColorStop(0.5, bgPreset.stops[1]);
    grad.addColorStop(1, bgPreset.stops[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Photo or Video Frame with Filter, Zoom, Rotation, Flip
    ctx.save();
    ctx.filter = buildCssFilterString(config);
    ctx.translate(width / 2, height / 2);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.scale(
      config.zoom * (config.flipH ? -1 : 1),
      config.zoom * (config.flipV ? -1 : 1)
    );

    if (isVideo && videoElement && videoElement.videoWidth > 0) {
      const vw = videoElement.videoWidth;
      const vh = videoElement.videoHeight;
      const scale = Math.max(width / vw, height / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.drawImage(videoElement, -dw / 2, -dh / 2, dw, dh);
    } else if (!isVideo && sourceMediaUrl) {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = sourceMediaUrl;
      });
      const iw = img.naturalWidth || width;
      const ih = img.naturalHeight || height;
      const scale = Math.max(width / iw, height / vhOrHeight(ih, height));
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    }
    ctx.restore();

    // 3. Draw Sticker Overlays
    for (const st of config.stickers) {
      ctx.save();
      const px = (st.x / 100) * width;
      const py = (st.y / 100) * height;
      ctx.translate(px, py);
      ctx.rotate((st.rotation * Math.PI) / 180);
      ctx.scale(st.scale, st.scale);

      if (st.isBadge) {
        ctx.font = '800 38px Inter, system-ui, sans-serif';
        const metrics = ctx.measureText(st.content);
        const bw = metrics.width + 52;
        const bh = 68;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 22);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#a855f7';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.content, 0, 2);
      } else {
        ctx.font = '96px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.content, 0, 0);
      }
      ctx.restore();
    }

    // 4. Draw Text Overlays
    for (const tx of config.texts) {
      if (!tx.text.trim()) continue;
      ctx.save();
      const px = (tx.x / 100) * width;
      const py = (tx.y / 100) * height;
      ctx.translate(px, py);
      ctx.rotate((tx.rotation * Math.PI) / 180);
      ctx.scale(tx.scale, tx.scale);

      const fontSize = 52;
      ctx.font = `800 ${fontSize}px ${getFontFamilyCss(tx.fontFamily)}`;
      const lines = tx.text.split('\n');
      const lineHeight = fontSize * 1.24;
      let maxW = 0;
      for (const line of lines) {
        const m = ctx.measureText(line);
        if (m.width > maxW) maxW = m.width;
      }
      const totalH = lines.length * lineHeight;

      if (tx.bgStyle !== 'none') {
        const padX = 42;
        const padY = 26;
        const boxW = maxW + padX * 2;
        const boxH = totalH + padY * 2;
        if (tx.bgStyle === 'pill') {
          ctx.fillStyle = tx.color === '#0F172A' ? '#F8FAFC' : '#0F172A';
        } else if (tx.bgStyle === 'glass') {
          ctx.fillStyle = 'rgba(11, 16, 33, 0.78)';
        } else {
          ctx.fillStyle = 'rgba(88, 28, 135, 0.82)';
        }
        roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 24);
        ctx.fill();
        if (tx.bgStyle === 'neon') {
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = tx.color;
          ctx.stroke();
        }
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
      }

      if (tx.fontFamily === 'neon') {
        ctx.shadowColor = tx.color;
        ctx.shadowBlur = 22;
      }

      ctx.fillStyle = tx.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, idx) => {
        const ly = -totalH / 2 + idx * lineHeight + lineHeight / 2;
        ctx.fillText(line, 0, ly);
      });

      ctx.restore();
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 0.92)
    );
    if (!blob) return null;
    return new File([blob], `boosthub-studio-${Date.now()}.png`, {
      type: 'image/png',
    });
  } catch {
    return null;
  }
}

function vhOrHeight(val: number, fallback: number) {
  return val > 0 ? val : fallback;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Renders any studio overlays (stickers & text) on top of a video in PostCard or CapshotsScreen
 */
export const StudioFloatingOverlays: React.FC<{
  stickers?: StudioStickerLayer[];
  texts?: StudioTextLayer[];
}> = ({ stickers = [], texts = [] }) => {
  if (stickers.length === 0 && texts.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10 select-none">
      {stickers.map((st) => (
        <div
          key={st.id}
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            transform: `translate(-50%, -50%) scale(${st.scale}) rotate(${st.rotation}deg)`,
          }}
          className="absolute"
        >
          {st.isBadge ? (
            <div
              className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${
                st.badgeColor || 'from-purple-600 to-blue-600'
              } text-white font-extrabold text-xs tracking-wide shadow-lg border border-white/25 whitespace-nowrap`}
            >
              {st.content}
            </div>
          ) : (
            <span className="text-4xl drop-shadow-lg block leading-none">
              {st.content}
            </span>
          )}
        </div>
      ))}

      {texts.map((tx) => (
        <div
          key={tx.id}
          style={{
            left: `${tx.x}%`,
            top: `${tx.y}%`,
            transform: `translate(-50%, -50%) scale(${tx.scale}) rotate(${tx.rotation}deg)`,
            fontFamily: getFontFamilyCss(tx.fontFamily),
            color: tx.color,
            textShadow:
              tx.fontFamily === 'neon'
                ? `0 0 12px ${tx.color}, 0 0 24px ${tx.color}`
                : tx.bgStyle === 'none'
                  ? '0 2px 10px rgba(0,0,0,0.9)'
                  : undefined,
          }}
          className={`absolute font-extrabold text-base sm:text-lg text-center whitespace-pre-wrap leading-snug max-w-[260px] ${
            tx.bgStyle === 'pill'
              ? 'px-3.5 py-1.5 rounded-xl bg-[#0F172A] shadow-xl border border-white/15'
              : tx.bgStyle === 'glass'
                ? 'px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15'
                : tx.bgStyle === 'neon'
                  ? 'px-3.5 py-1.5 rounded-xl bg-purple-950/80 border-2 shadow-lg'
                  : ''
          }`}
        >
          {tx.text}
        </div>
      ))}
    </div>
  );
};

interface StudioMediaEditorProps {
  mediaUrl: string;
  isVideo: boolean;
  config: StudioEditConfig;
  onChangeConfig: React.Dispatch<React.SetStateAction<StudioEditConfig>>;
  onBakeStudioImage?: (bakedFile: File) => Promise<void>;
  videoRefExternal?: React.RefObject<HTMLVideoElement | null>;
}

export const StudioMediaEditor: React.FC<StudioMediaEditorProps> = ({
  mediaUrl,
  isVideo,
  config,
  onChangeConfig,
  onBakeStudioImage,
  videoRefExternal,
}) => {
  const [activeToolTab, setActiveToolTab] = useState<
    'cut_crop' | 'stickers' | 'text' | 'filters'
  >('cut_crop');

  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoElRef = videoRefExternal || internalVideoRef;
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<{
    type: 'sticker' | 'text';
    id: string;
  } | null>(null);
  const [draggingLayer, setDraggingLayer] = useState<{
    type: 'sticker' | 'text';
    id: string;
  } | null>(null);

  // Text composer state
  const [newTextValue, setNewTextValue] = useState('');
  const [newTextFont, setNewTextFont] =
    useState<StudioTextLayer['fontFamily']>('display');
  const [newTextColor, setNewTextColor] = useState('#FFFFFF');
  const [newTextBg, setNewTextBg] =
    useState<StudioTextLayer['bgStyle']>('glass');
  const [bakingImage, setBakingImage] = useState(false);

  // Sync video playback speed & mute
  useEffect(() => {
    const vid = videoElRef.current;
    if (!vid || !isVideo) return;
    vid.playbackRate = config.playbackSpeed || 1;
    vid.muted = config.muteAudio;
  }, [config.playbackSpeed, config.muteAudio, isVideo]);

  const handleLoadedMetadata = () => {
    const vid = videoElRef.current;
    if (!vid) return;
    const dur = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 15;
    onChangeConfig((prev) => ({
      ...prev,
      duration: dur,
      trimStart: 0,
      trimEnd: prev.trimEnd > 0 && prev.trimEnd <= dur ? prev.trimEnd : Number(dur.toFixed(1)),
    }));
  };

  const handleTimeUpdate = () => {
    const vid = videoElRef.current;
    if (!vid) return;
    const t = vid.currentTime;
    setCurrentTime(t);
    if (config.trimEnd > 0 && t >= config.trimEnd) {
      vid.currentTime = config.trimStart;
      if (!vid.paused) {
        vid.play().catch(() => {});
      }
    }
  };

  const toggleVideoPlay = () => {
    const vid = videoElRef.current;
    if (!vid) return;
    if (vid.paused) {
      if (
        vid.currentTime < config.trimStart ||
        (config.trimEnd > 0 && vid.currentTime >= config.trimEnd)
      ) {
        vid.currentTime = config.trimStart;
      }
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  // Pointer dragging for stickers & text on stage
  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingLayer || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = Math.min(
      92,
      Math.max(8, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const yPct = Math.min(
      92,
      Math.max(8, ((e.clientY - rect.top) / rect.height) * 100)
    );

    if (draggingLayer.type === 'sticker') {
      onChangeConfig((prev) => ({
        ...prev,
        stickers: prev.stickers.map((s) =>
          s.id === draggingLayer.id ? { ...s, x: xPct, y: yPct } : s
        ),
      }));
    } else {
      onChangeConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) =>
          t.id === draggingLayer.id ? { ...t, x: xPct, y: yPct } : t
        ),
      }));
    }
  };

  const handleAddSticker = (
    content: string,
    isBadge = false,
    badgeColor?: string
  ) => {
    const id = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const offset = (config.stickers.length % 5) * 6 - 12;
    const newLayer: StudioStickerLayer = {
      id,
      content,
      isBadge,
      badgeColor,
      x: 50 + offset,
      y: 35 + offset,
      scale: 1,
      rotation: 0,
    };
    onChangeConfig((prev) => ({
      ...prev,
      stickers: [...prev.stickers, newLayer],
    }));
    setSelectedLayer({ type: 'sticker', id });
  };

  const handleAddTextLayer = () => {
    const txt = newTextValue.trim() || 'BOOSTHUB STUDIO ✨';
    const id = `txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const offset = (config.texts.length % 4) * 8 - 10;
    const newLayer: StudioTextLayer = {
      id,
      text: txt,
      fontFamily: newTextFont,
      color: newTextColor,
      bgStyle: newTextBg,
      x: 50,
      y: 50 + offset,
      scale: 1,
      rotation: 0,
    };
    onChangeConfig((prev) => ({
      ...prev,
      texts: [...prev.texts, newLayer],
    }));
    setNewTextValue('');
    setSelectedLayer({ type: 'text', id });
  };

  const activeSticker =
    selectedLayer?.type === 'sticker'
      ? config.stickers.find((s) => s.id === selectedLayer.id) || null
      : null;

  const activeText =
    selectedLayer?.type === 'text'
      ? config.texts.find((t) => t.id === selectedLayer.id) || null
      : null;

  const bgCanvasStyle =
    STUDIO_CANVAS_BACKGROUNDS.find((b) => b.id === config.canvasBgId) ||
    STUDIO_CANVAS_BACKGROUNDS[0];

  const aspectClass =
    config.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[440px]'
      : config.aspectRatio === '1:1'
        ? 'aspect-square max-h-[380px]'
        : config.aspectRatio === '4:5'
          ? 'aspect-[4/5] max-h-[410px]'
          : config.aspectRatio === '16:9'
            ? 'aspect-video max-h-[340px]'
            : 'min-h-[300px] max-h-[420px]';

  return (
    <div className="rounded-3xl bg-[#070B18] border border-white/15 overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              BoostHub Studio Editor
            </h3>
            <p className="text-[11px] text-slate-400">
              Cut & trim timeline, crop, drag stickers, write text & apply filters before posting
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onChangeConfig((prev) => ({
              ...DEFAULT_STUDIO_CONFIG,
              duration: prev.duration,
              trimEnd: prev.duration,
            }));
            setSelectedLayer(null);
          }}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset All Edits
        </button>
      </div>

      {/* Interactive Live Stage */}
      <div className="flex flex-col items-center justify-center bg-black/70 rounded-2xl border border-white/10 p-3 relative">
        <div
          ref={stageRef}
          onPointerMove={handleStagePointerMove}
          onPointerUp={() => setDraggingLayer(null)}
          onPointerLeave={() => setDraggingLayer(null)}
          className={`relative w-full ${aspectClass} overflow-hidden rounded-xl flex items-center justify-center select-none touch-none ${bgCanvasStyle.css}`}
        >
          {/* Underlying Media (Video or Photo or Studio Background) */}
          {mediaUrl ? (
            isVideo ? (
              <video
                ref={videoElRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl.split('#')[0]}
                playsInline
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={toggleVideoPlay}
                style={{
                  filter: buildCssFilterString(config),
                  transform: `rotate(${config.rotation}deg) scale(${
                    config.zoom * (config.flipH ? -1 : 1)
                  }, ${config.zoom * (config.flipV ? -1 : 1)})`,
                }}
                className="w-full h-full object-contain cursor-pointer transition-transform duration-150"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Studio preview"
                style={{
                  filter: buildCssFilterString(config),
                  transform: `rotate(${config.rotation}deg) scale(${
                    config.zoom * (config.flipH ? -1 : 1)
                  }, ${config.zoom * (config.flipV ? -1 : 1)})`,
                }}
                className="w-full h-full object-contain transition-transform duration-150 pointer-events-none"
              />
            )
          ) : (
            <div className="text-center p-6 pointer-events-none space-y-1">
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                Studio Canvas Stage
              </p>
              <p className="text-[11px] text-slate-300/80">
                Add stickers & text below or upload a photo/video to cut & trim!
              </p>
            </div>
          )}

          {/* Draggable Sticker Layers */}
          {config.stickers.map((st) => {
            const isSel =
              selectedLayer?.type === 'sticker' && selectedLayer.id === st.id;
            return (
              <div
                key={st.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedLayer({ type: 'sticker', id: st.id });
                  setDraggingLayer({ type: 'sticker', id: st.id });
                }}
                style={{
                  left: `${st.x}%`,
                  top: `${st.y}%`,
                  transform: `translate(-50%, -50%) scale(${st.scale}) rotate(${st.rotation}deg)`,
                }}
                className={`absolute cursor-grab active:cursor-grabbing z-20 transition-shadow ${
                  isSel
                    ? 'ring-2 ring-blue-400 rounded-2xl p-1 bg-black/20'
                    : ''
                }`}
              >
                {st.isBadge ? (
                  <div
                    className={`px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${
                      st.badgeColor || 'from-purple-600 to-blue-600'
                    } text-white font-extrabold text-xs tracking-wide shadow-lg border border-white/30 whitespace-nowrap`}
                  >
                    {st.content}
                  </div>
                ) : (
                  <span className="text-4xl sm:text-5xl drop-shadow-xl block leading-none">
                    {st.content}
                  </span>
                )}
              </div>
            );
          })}

          {/* Draggable Text Layers */}
          {config.texts.map((tx) => {
            const isSel =
              selectedLayer?.type === 'text' && selectedLayer.id === tx.id;
            return (
              <div
                key={tx.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedLayer({ type: 'text', id: tx.id });
                  setDraggingLayer({ type: 'text', id: tx.id });
                }}
                style={{
                  left: `${tx.x}%`,
                  top: `${tx.y}%`,
                  transform: `translate(-50%, -50%) scale(${tx.scale}) rotate(${tx.rotation}deg)`,
                  fontFamily: getFontFamilyCss(tx.fontFamily),
                  color: tx.color,
                  textShadow:
                    tx.fontFamily === 'neon'
                      ? `0 0 12px ${tx.color}, 0 0 24px ${tx.color}`
                      : tx.bgStyle === 'none'
                        ? '0 2px 10px rgba(0,0,0,0.9)'
                        : undefined,
                }}
                className={`absolute cursor-grab active:cursor-grabbing z-20 font-extrabold text-base sm:text-lg text-center whitespace-pre-wrap leading-snug max-w-[260px] ${
                  tx.bgStyle === 'pill'
                    ? 'px-3.5 py-1.5 rounded-xl bg-[#0F172A] shadow-xl border border-white/15'
                    : tx.bgStyle === 'glass'
                      ? 'px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15'
                      : tx.bgStyle === 'neon'
                        ? 'px-3.5 py-1.5 rounded-xl bg-purple-950/80 border-2 shadow-lg'
                        : ''
                } ${isSel ? 'ring-2 ring-blue-400' : ''}`}
              >
                {tx.text}
              </div>
            );
          })}

          {/* Video Play/Pause & Time Indicator Overlay */}
          {isVideo && mediaUrl && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-30">
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-blue-400"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{currentTime.toFixed(1)}s</span>
              </button>

              <span className="text-[11px] text-emerald-300 font-semibold">
                Cut: {config.trimStart.toFixed(1)}s –{' '}
                {(config.trimEnd || config.duration || 15).toFixed(1)}s (
                {Math.max(
                  0.5,
                  (config.trimEnd || config.duration || 15) - config.trimStart
                ).toFixed(1)}
                s)
              </span>

              <button
                type="button"
                onClick={() =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    muteAudio: !prev.muteAudio,
                  }))
                }
                className="text-slate-200 hover:text-white"
                title={config.muteAudio ? 'Unmute Video' : 'Mute Video'}
              >
                {config.muteAudio ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          )}
        </div>

        {(config.stickers.length > 0 || config.texts.length > 0) && (
          <p className="text-[11px] text-slate-400 mt-2 inline-flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-blue-400" /> Drag any sticker or
            text on the preview to reposition it
          </p>
        )}
      </div>

      {/* Studio Tool Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/[0.04] rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveToolTab('cut_crop')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeToolTab === 'cut_crop'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>{isVideo ? 'Cut & Trim' : 'Cut & Crop'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('stickers')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeToolTab === 'stickers'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Stickers ({config.stickers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('text')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeToolTab === 'text'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Write Text ({config.texts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('filters')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeToolTab === 'filters'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* TAB 1: CUT, TRIM & CROP */}
      {activeToolTab === 'cut_crop' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          {isVideo && (
            <div className="space-y-3 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  <span>Video Cut & Trim Timeline</span>
                </label>
                <span className="text-[11px] text-purple-300 font-semibold">
                  Selected Clip:{' '}
                  {Math.max(
                    0.5,
                    (config.trimEnd || config.duration || 15) - config.trimStart
                  ).toFixed(1)}
                  s
                </span>
              </div>

              {/* Visual Filmstrip Timeline Bar */}
              {(() => {
                const maxDur = Math.max(1, config.duration || 15);
                const leftPct = Math.min(100, (config.trimStart / maxDur) * 100);
                const rightVal = config.trimEnd > 0 ? config.trimEnd : maxDur;
                const widthPct = Math.max(
                  4,
                  Math.min(100 - leftPct, ((rightVal - config.trimStart) / maxDur) * 100)
                );
                const playheadPct = Math.min(100, (currentTime / maxDur) * 100);

                return (
                  <div className="relative h-10 rounded-xl bg-[#0D1326] border border-white/15 overflow-hidden flex items-center px-2">
                    <div className="w-full flex items-center justify-between opacity-25 pointer-events-none">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-5 rounded-full bg-slate-400"
                        />
                      ))}
                    </div>
                    {/* Active Cut Window */}
                    <div
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500/35 via-purple-500/35 to-blue-500/35 border-x-4 border-purple-400 rounded-lg pointer-events-none"
                    />
                    {/* Playhead */}
                    <div
                      style={{ left: `${playheadPct}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow pointer-events-none"
                    />
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Start Point (Cut In)</span>
                    <span className="font-mono text-blue-400">
                      {config.trimStart.toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0.5, (config.trimEnd || config.duration || 15) - 0.5)}
                    step={0.1}
                    value={config.trimStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig((prev) => ({
                        ...prev,
                        trimStart: Math.min(val, (prev.trimEnd || prev.duration || 15) - 0.5),
                      }));
                      if (videoElRef.current) {
                        videoElRef.current.currentTime = val;
                      }
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>End Point (Cut Out)</span>
                    <span className="font-mono text-purple-400">
                      {(config.trimEnd || config.duration || 15).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config.trimStart + 0.5}
                    max={Math.max(1, config.duration || 15)}
                    step={0.1}
                    value={config.trimEnd || config.duration || 15}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig((prev) => ({
                        ...prev,
                        trimEnd: Math.max(val, prev.trimStart + 0.5),
                      }));
                    }}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* Quick Cut Presets & Speed */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">
                    Quick Cut:
                  </span>
                  {[5, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        const dur = config.duration || 15;
                        onChangeConfig((prev) => ({
                          ...prev,
                          trimStart: 0,
                          trimEnd: Math.min(dur, sec),
                        }));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 font-medium"
                    >
                      First {sec}s
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const dur = config.duration || 15;
                      onChangeConfig((prev) => ({
                        ...prev,
                        trimStart: 0,
                        trimEnd: Number(dur.toFixed(1)),
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-blue-300 font-medium"
                  >
                    Full Clip
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">Speed:</span>
                  {[0.5, 1, 1.5, 2].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          playbackSpeed: sp,
                        }))
                      }
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                        config.playbackSpeed === sp
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Frame Aspect Ratio, Zoom, Rotate & Flip */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Aspect Ratio & Frame Cut</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'original', label: 'Original' },
                    { id: '9:16', label: '9:16 Capshot' },
                    { id: '1:1', label: '1:1 Square' },
                    { id: '4:5', label: '4:5 Portrait' },
                    { id: '16:9', label: '16:9 Wide' },
                  ] as const
                ).map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig((prev) => ({
                        ...prev,
                        aspectRatio: ar.id,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      config.aspectRatio === ar.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Crop Zoom</span>
                  <span className="text-blue-400 font-mono">
                    {config.zoom.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2.4}
                  step={0.05}
                  value={config.zoom}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      zoom: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      rotation: (prev.rotation - 90) % 360,
                    }))
                  }
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1"
                  title="Rotate Left"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> -90°
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      rotation: (prev.rotation + 90) % 360,
                    }))
                  }
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1"
                  title="Rotate Right"
                >
                  <RotateCw className="w-3.5 h-3.5" /> +90°
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      flipH: !prev.flipH,
                    }))
                  }
                  className={`px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1 ${
                    config.flipH
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      flipV: !prev.flipV,
                    }))
                  }
                  className={`px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1 ${
                    config.flipV
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-3.5 h-3.5" /> Flip V
                </button>
              </div>
            </div>

            {/* Studio Canvas Background Selector (Great for vertical crops or standalone sticker/text posts) */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Canvas Backdrop:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {STUDIO_CANVAS_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig((prev) => ({
                        ...prev,
                        canvasBgId: bg.id,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      config.canvasBgId === bg.id
                        ? 'border-blue-400 text-white bg-white/10'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STICKERS & BADGES */}
      {activeToolTab === 'stickers' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <div>
            <p className="text-xs font-bold text-white mb-2">
              BoostHub Neon Badges (Tap to add, then drag on preview)
            </p>
            <div className="flex flex-wrap gap-2">
              {STUDIO_BADGE_STICKERS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => handleAddSticker(b.label, true, b.color)}
                  className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${b.color} text-white font-bold text-xs shadow hover:scale-105 transition-transform`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-white mb-2">
              Emoji Stickers
            </p>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
              {STUDIO_EMOJI_STICKERS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handleAddSticker(em, false)}
                  className="h-10 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-xl transition-transform hover:scale-110"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {activeSticker && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">
                  Selected Sticker: {activeSticker.content}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onChangeConfig((prev) => ({
                      ...prev,
                      stickers: prev.stickers.filter(
                        (s) => s.id !== activeSticker.id
                      ),
                    }));
                    setSelectedLayer(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Sticker
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Sticker Size</span>
                    <span>{activeSticker.scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={activeSticker.scale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig((prev) => ({
                        ...prev,
                        stickers: prev.stickers.map((s) =>
                          s.id === activeSticker.id ? { ...s, scale: val } : s
                        ),
                      }));
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Rotation</span>
                    <span>{activeSticker.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={5}
                    value={activeSticker.rotation}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig((prev) => ({
                        ...prev,
                        stickers: prev.stickers.map((s) =>
                          s.id === activeSticker.id
                            ? { ...s, rotation: val }
                            : s
                        ),
                      }));
                    }}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WRITE TEXT & TYPOGRAPHY */}
      {activeToolTab === 'text' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTextValue}
              onChange={(e) => setNewTextValue(e.target.value)}
              placeholder="Write text to place on your post..."
              className="flex-1 bg-[#0B1021] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTextLayer}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Text Layer
            </button>
          </div>

          {/* Font, Banner & Color Selectors (applies to new text AND currently selected text!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">
                Font Style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'display', label: 'Bold' },
                    { id: 'neon', label: 'Neon Glow' },
                    { id: 'sans', label: 'Clean' },
                    { id: 'mono', label: 'Mono' },
                    { id: 'serif', label: 'Serif' },
                  ] as const
                ).map((f) => {
                  const currentFont = activeText
                    ? activeText.fontFamily
                    : newTextFont;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setNewTextFont(f.id);
                        if (activeText) {
                          onChangeConfig((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === activeText.id
                                ? { ...t, fontFamily: f.id }
                                : t
                            ),
                          }));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        currentFont === f.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">
                Text Backdrop Style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'glass', label: 'Glass Box' },
                    { id: 'pill', label: 'Solid Pill' },
                    { id: 'neon', label: 'Neon Frame' },
                    { id: 'none', label: 'No Box' },
                  ] as const
                ).map((b) => {
                  const currentBg = activeText ? activeText.bgStyle : newTextBg;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setNewTextBg(b.id);
                        if (activeText) {
                          onChangeConfig((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === activeText.id
                                ? { ...t, bgStyle: b.id }
                                : t
                            ),
                          }));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        currentBg === b.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">
              Text Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {STUDIO_TEXT_COLORS.map((hex) => {
                const currentColor = activeText
                  ? activeText.color
                  : newTextColor;
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setNewTextColor(hex);
                      if (activeText) {
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === activeText.id ? { ...t, color: hex } : t
                          ),
                        }));
                      }
                    }}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      currentColor === hex
                        ? 'border-white scale-115 ring-2 ring-blue-400'
                        : 'border-white/20 hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {activeText && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={activeText.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChangeConfig((prev) => ({
                      ...prev,
                      texts: prev.texts.map((t) =>
                        t.id === activeText.id ? { ...t, text: val } : t
                      ),
                    }));
                  }}
                  className="flex-1 bg-[#0B1021] border border-blue-500/40 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    onChangeConfig((prev) => ({
                      ...prev,
                      texts: prev.texts.filter((t) => t.id !== activeText.id),
                    }));
                    setSelectedLayer(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Text Size</span>
                    <span>{activeText.scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={2.2}
                    step={0.1}
                    value={activeText.scale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig((prev) => ({
                        ...prev,
                        texts: prev.texts.map((t) =>
                          t.id === activeText.id ? { ...t, scale: val } : t
                        ),
                      }));
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Text Angle</span>
                    <span>{activeText.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    step={1}
                    value={activeText.rotation}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig((prev) => ({
                        ...prev,
                        texts: prev.texts.map((t) =>
                          t.id === activeText.id ? { ...t, rotation: val } : t
                        ),
                      }));
                    }}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FILTERS & COLOR GRADING */}
      {activeToolTab === 'filters' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <div>
            <p className="text-xs font-bold text-white mb-2">
              Studio Filter Presets
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STUDIO_FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      filterPreset: preset.id,
                      brightness: preset.brightness,
                      contrast: preset.contrast,
                      saturation: preset.saturation,
                    }))
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    config.filterPreset === preset.id
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Brightness</span>
                <span>{config.brightness}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={config.brightness}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    brightness: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Contrast</span>
                <span>{config.contrast}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={config.contrast}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    contrast: Number(e.target.value),
                  }))
                }
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Saturation</span>
                <span>{config.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={config.saturation}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    saturation: Number(e.target.value),
                  }))
                }
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optional Bake / Flatten Action for Photos or Standalone Studio Graphics */}
      {!isVideo && onBakeStudioImage && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400">
            Your stickers, text overlays, crop & filters will also be automatically baked when you hit Publish Post.
          </p>
          <button
            type="button"
            disabled={bakingImage}
            onClick={async () => {
              setBakingImage(true);
              try {
                const file = await renderStudioCompositeToFile(
                  mediaUrl,
                  false,
                  null,
                  config
                );
                if (file) {
                  await onBakeStudioImage(file);
                }
              } finally {
                setBakingImage(false);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {bakingImage ? 'Baking Studio Image...' : 'Save Studio Snapshot'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
