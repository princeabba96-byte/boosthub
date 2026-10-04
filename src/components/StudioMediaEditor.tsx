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
  Music,
  Repeat,
  Upload,
  Wand2,
  Gauge,
  Layers,
  Zap,
  SplitSquareHorizontal,
  Mic,
  MicOff,
  Search,
  Image as ImageIcon,
  Film,
  Palette,
  CheckCircle2,
  X,
  Download,
  RefreshCw,
  Eye,
  Undo2,
} from 'lucide-react';
import {
  FONT_STYLES_52,
  getFontDesignPresetById,
  FontDesignPreset,
} from '../data/fontStyles52';
import {
  GREEN_SCREEN_BACKGROUNDS,
  GreenScreenBackground,
} from '../data/greenScreenBackgrounds';

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

export type StudioTextAnimation =
  | 'none'
  | 'typewriter'
  | 'pulse_neon'
  | 'bounce_in'
  | 'slide_up'
  | 'wave';

export interface StudioSubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  fontStyleId?: string;
  color?: string;
}

export interface StudioTextLayer {
  id: string;
  text: string;
  fontFamily: 'display' | 'sans' | 'mono' | 'serif' | 'neon';
  fontStyleId?: string;
  color: string;
  bgStyle: 'pill' | 'glass' | 'neon' | 'none';
  animation?: StudioTextAnimation;
  x: number; // percentage 10..90
  y: number; // percentage 10..90
  scale: number; // 0.4..3.0
  rotation: number; // -180..180
}

export type StudioLoopMode =
  | 'normal'
  | 'boomerang'
  | 'stutter_3x'
  | 'pulse_zoom'
  | 'ken_burns';

export type StudioVfxOverlay =
  | 'none'
  | 'vhs_glitch'
  | 'cinema_bars'
  | 'neon_frame'
  | 'light_leak'
  | 'sparkle_dust';

export type StudioSoundEffect =
  | 'original'
  | 'bass_boost'
  | 'vocal_clarity'
  | 'slowed_reverb'
  | 'nightcore'
  | 'radio_lofi';

export type StudioTransitionType =
  | 'none'
  | 'cross_dissolve'
  | 'fade_black'
  | 'flash_white'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'wipe_right'
  | 'wipe_clock'
  | 'zoom_in'
  | 'spin_whirl'
  | 'glitch_rgb';

export type StudioTransitionEasing = 'ease_in_out' | 'linear' | 'snap_bounce';

export interface StudioClipSegment {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  transitionAfter: StudioTransitionType;
  transitionDuration: number;
}

export const STUDIO_TRANSITION_EFFECTS: Array<{
  id: StudioTransitionType;
  name: string;
  category: 'Basic' | 'Slide & Push' | 'Wipe & Iris' | 'Camera & Glitch';
  badge: string;
  description: string;
}> = [
  {
    id: 'none',
    name: 'Hard Cut',
    category: 'Basic',
    badge: 'CUT',
    description: 'Instant frame cut between clips',
  },
  {
    id: 'cross_dissolve',
    name: 'Cross Dissolve',
    category: 'Basic',
    badge: 'FADE',
    description: 'Smooth cinematic opacity blend',
  },
  {
    id: 'fade_black',
    name: 'Dip to Black',
    category: 'Basic',
    badge: 'DARK',
    description: 'Cinema fade through deep black',
  },
  {
    id: 'flash_white',
    name: 'White Strobe Flash',
    category: 'Basic',
    badge: 'FLASH',
    description: 'High-energy camera shutter flash',
  },
  {
    id: 'slide_left',
    name: 'Whip Slide Left',
    category: 'Slide & Push',
    badge: '← SLIDE',
    description: 'Fast horizontal whip pan left',
  },
  {
    id: 'slide_right',
    name: 'Whip Slide Right',
    category: 'Slide & Push',
    badge: 'SLIDE →',
    description: 'Fast horizontal whip pan right',
  },
  {
    id: 'slide_up',
    name: 'Vertical Push Up',
    category: 'Slide & Push',
    badge: '↑ PUSH',
    description: 'CapCut-style vertical reel push',
  },
  {
    id: 'wipe_right',
    name: 'Linear Wipe',
    category: 'Wipe & Iris',
    badge: 'WIPE ▸',
    description: 'Clean directional linear reveal',
  },
  {
    id: 'wipe_clock',
    name: 'Iris Circle Wipe',
    category: 'Wipe & Iris',
    badge: '◎ IRIS',
    description: 'Expanding circular lens reveal',
  },
  {
    id: 'zoom_in',
    name: 'Hyper Zoom Punch',
    category: 'Camera & Glitch',
    badge: '⊕ ZOOM',
    description: 'Dynamic lens punch-in transition',
  },
  {
    id: 'spin_whirl',
    name: '360° Whip Spin',
    category: 'Camera & Glitch',
    badge: '↻ SPIN',
    description: 'Rotational motion-blur spin cut',
  },
  {
    id: 'glitch_rgb',
    name: 'Cyber RGB Glitch',
    category: 'Camera & Glitch',
    badge: '⚡ RGB',
    description: 'Digital chromatic slice transition',
  },
];

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
  exposure?: number; // -50..50
  cropX?: number; // -50..50
  cropY?: number; // -50..50
  warmth?: number;
  hueRotate?: number;
  blur?: number;
  vignette?: number;
  vfxOverlay?: StudioVfxOverlay;
  loopMode?: StudioLoopMode;
  loopCount?: number; // 0 = infinite
  loopSegmentDuration?: number;
  reversePlayback?: boolean;
  // Picture-in-Picture & Photo/Video Overlay
  pipUrl?: string;
  pipIsVideo?: boolean;
  pipX?: number;
  pipY?: number;
  pipScale?: number;
  // Green Screen / Chroma Key & AI Background Replacement (Works for both videos & photos)
  aiBgMode?: 'ai_cutout' | 'chroma_key';
  aiBgEnabled?: boolean;
  aiBgSensitivity?: number; // 10..100
  aiBgEdgeFeather?: number; // 0..20
  bgBlur?: number; // 0..30 (px)
  bgZoom?: number; // 0.5..3.0
  bgPositionX?: number; // -100..100 (%)
  bgPositionY?: number; // -100..100 (%)
  personScale?: number; // 0.5..2.5
  personPositionX?: number; // -100..100 (%)
  personPositionY?: number; // -100..100 (%)
  chromaKeyEnabled?: boolean;
  chromaKeyColor?: 'green' | 'blue' | 'black';
  chromaKeySensitivity?: number;
  greenScreenBgUrl?: string;
  greenScreenBgType?: 'image' | 'video';
  greenScreenBgName?: string;
  // Multi-clip: Secondary video to cut & merge
  secondaryVideoUrl?: string;
  secondaryVideoName?: string;
  activeFontStyleId?: string;
  // Auto Captions / Subtitles
  subtitles?: StudioSubtitleCue[];
  // Sound cutting & audio loop tools (works for both video & photo)
  soundTrackId?: string;
  customAudioUrl?: string;
  customAudioName?: string;
  voiceoverAudioUrl?: string;
  voiceoverName?: string;
  soundTrimStart?: number;
  soundTrimEnd?: number;
  soundDuration?: number;
  soundLoop?: boolean;
  soundSpeed?: number;
  soundVolume?: number;
  clipVolume?: number;
  soundFadeIn?: boolean;
  soundFadeOut?: boolean;
  soundEffect?: StudioSoundEffect;
  // Transition Effects Library & Multi-Clip Split Segments
  transitionType?: StudioTransitionType;
  transitionDuration?: number;
  transitionEasing?: StudioTransitionEasing;
  introTransition?: StudioTransitionType;
  outroTransition?: StudioTransitionType;
  transitionSoundSfx?: boolean;
  clipSegments?: StudioClipSegment[];
  stickers: StudioStickerLayer[];
  texts: StudioTextLayer[];
  canvasBgId?: string;
}

export const DEFAULT_STUDIO_CONFIG: StudioEditConfig = {
  trimStart: 0,
  trimEnd: 15,
  duration: 15,
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
  warmth: 0,
  hueRotate: 0,
  blur: 0,
  vignette: 0,
  vfxOverlay: 'none',
  loopMode: 'normal',
  loopCount: 0,
  loopSegmentDuration: 3,
  soundTrackId: 'none',
  customAudioUrl: '',
  customAudioName: '',
  soundTrimStart: 0,
  soundTrimEnd: 12,
  soundDuration: 20,
  soundLoop: true,
  soundSpeed: 1,
  soundVolume: 85,
  clipVolume: 100,
  soundFadeIn: true,
  soundFadeOut: true,
  soundEffect: 'original',
  transitionType: 'cross_dissolve',
  transitionDuration: 0.6,
  transitionEasing: 'ease_in_out',
  introTransition: 'none',
  outroTransition: 'cross_dissolve',
  transitionSoundSfx: true,
  clipSegments: [],
  stickers: [],
  texts: [],
  canvasBgId: 'cyber_neon',
  aiBgMode: 'ai_cutout',
  aiBgEnabled: false,
  aiBgSensitivity: 50,
  aiBgEdgeFeather: 4,
  bgBlur: 0,
  bgZoom: 1,
  bgPositionX: 0,
  bgPositionY: 0,
  personScale: 1,
  personPositionX: 0,
  personPositionY: 0,
};

export const STUDIO_BUILTIN_SOUNDS: Array<{
  id: string;
  name: string;
  bpm: number;
  genre: string;
  duration: number;
  notes: number[];
}> = [
  {
    id: 'cyber_phonk',
    name: 'Cyber Phonk Drift',
    bpm: 132,
    genre: 'Phonk • Cowbell Loop',
    duration: 16,
    notes: [146.83, 174.61, 220.0, 207.65, 146.83, 220.0, 261.63, 220.0],
  },
  {
    id: 'afrobeat_vibe',
    name: 'Afrobeat Sunset Groove',
    bpm: 106,
    genre: 'Afrobeats • Percussive',
    duration: 20,
    notes: [196.0, 246.94, 293.66, 329.63, 293.66, 246.94, 220.0, 196.0],
  },
  {
    id: 'lofi_chill',
    name: 'Lo-Fi Midnight Study',
    bpm: 84,
    genre: 'Chillhop • Warm Keys',
    duration: 24,
    notes: [130.81, 164.81, 196.0, 246.94, 220.0, 196.0, 164.81, 146.83],
  },
  {
    id: 'hyperpop_pulse',
    name: 'Hyperpop Glitch Lead',
    bpm: 150,
    genre: 'Electro • Synth Arp',
    duration: 15,
    notes: [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 329.63, 293.66],
  },
  {
    id: 'trap_808',
    name: '808 Sub Arena Bounce',
    bpm: 140,
    genre: 'Hip-Hop • Heavy 808',
    duration: 18,
    notes: [110.0, 110.0, 130.81, 146.83, 110.0, 164.81, 146.83, 130.81],
  },
  {
    id: 'cinema_riser',
    name: 'Cinema Tension Pulse',
    bpm: 118,
    genre: 'Soundtrack • Epic',
    duration: 22,
    notes: [146.83, 220.0, 293.66, 349.23, 440.0, 349.23, 293.66, 220.0],
  },
];

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
  const exp = config.exposure ?? 0;
  const b = Math.max(20, (config.brightness ?? 100) + exp * 0.75);
  const c = Math.max(20, (config.contrast ?? 100) + Math.abs(exp) * 0.18);
  const s = config.saturation ?? 100;
  const w = config.warmth ?? 0;
  const h = config.hueRotate ?? 0;
  const bl = config.blur ?? 0;
  const preset = STUDIO_FILTER_PRESETS.find((p) => p.id === config.filterPreset);
  const extra = preset?.extraCss ? ` ${preset.extraCss}` : '';
  const warmCss = w > 0 ? ` sepia(${w}%)` : '';
  const hueCss = h !== 0 ? ` hue-rotate(${h}deg)` : '';
  const blurCss = bl > 0 ? ` blur(${bl}px)` : '';
  return `brightness(${b.toFixed(0)}%) contrast(${c.toFixed(0)}%) saturate(${s}%)${warmCss}${hueCss}${blurCss}${extra}`;
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
    (config.exposure ?? 0) !== 0 ||
    (config.warmth ?? 0) !== 0 ||
    (config.hueRotate ?? 0) !== 0 ||
    (config.blur ?? 0) !== 0 ||
    (config.vignette ?? 0) !== 0 ||
    (config.vfxOverlay && config.vfxOverlay !== 'none') ||
    (config.loopMode && config.loopMode !== 'normal') ||
    (config.transitionType && config.transitionType !== 'none') ||
    (config.clipSegments && config.clipSegments.length > 0) ||
    (config.soundTrackId && config.soundTrackId !== 'none') ||
    Boolean(config.customAudioUrl) ||
    Boolean(config.voiceoverAudioUrl) ||
    Boolean(config.pipUrl) ||
    (config.subtitles && config.subtitles.length > 0) ||
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
    ex: config.exposure || 0,
    wm: config.warmth || 0,
    hr: config.hueRotate || 0,
    bl: config.blur || 0,
    vg: config.vignette || 0,
    vx: config.vfxOverlay || 'none',
    lm: config.loopMode || 'normal',
    tr: config.transitionType || 'none',
    td: Number((config.transitionDuration || 0.6).toFixed(2)),
    teas: config.transitionEasing || 'ease_in_out',
    csg: config.clipSegments || [],
    snd: config.soundTrackId || 'none',
    ca: config.customAudioUrl || '',
    vo: config.voiceoverAudioUrl || '',
    vn: config.voiceoverName || '',
    sts: Number((config.soundTrimStart || 0).toFixed(1)),
    ste: Number((config.soundTrimEnd || 12).toFixed(1)),
    slp: config.soundLoop !== false ? 1 : 0,
    sfx: config.soundEffect || 'original',
    sub: config.subtitles || [],
    st: config.stickers,
    tx: config.texts,
  };

  try {
    const encoded = btoa(encodeURIComponent(JSON.stringify(compactPayload)));
    return `${cleanBase}#studio=${encoded}`;
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
      exposure: Number(raw.ex) || 0,
      warmth: Number(raw.wm) || 0,
      hueRotate: Number(raw.hr) || 0,
      blur: Number(raw.bl) || 0,
      vignette: Number(raw.vg) || 0,
      vfxOverlay: raw.vx || 'none',
      loopMode: raw.lm || 'normal',
      transitionType: raw.tr || 'none',
      transitionDuration: Number(raw.td) || 0.6,
      transitionEasing: raw.teas || 'ease_in_out',
      clipSegments: Array.isArray(raw.csg) ? raw.csg : [],
      soundTrackId: raw.snd || 'none',
      customAudioUrl: raw.ca || '',
      voiceoverAudioUrl: raw.vo || '',
      voiceoverName: raw.vn || '',
      soundTrimStart: Number(raw.sts) || 0,
      soundTrimEnd: Number(raw.ste) || 12,
      soundLoop: raw.slp !== 0,
      soundEffect: raw.sfx || 'original',
      subtitles: Array.isArray(raw.sub) ? raw.sub : [],
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

    // 1b. Render Replacement Virtual Background (AI Background or Green Screen)
    if (config.greenScreenBgUrl) {
      try {
        const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = config.greenScreenBgUrl!;
        });
        ctx.save();
        if ((config.bgBlur || 0) > 0) {
          ctx.filter = `blur(${config.bgBlur}px)`;
        }
        const bz = config.bgZoom || 1;
        const bpx = ((config.bgPositionX || 0) / 100) * width;
        const bpy = ((config.bgPositionY || 0) / 100) * height;
        ctx.translate(width / 2 + bpx, height / 2 + bpy);
        ctx.scale(bz, bz);
        const bw = bgImg.naturalWidth || width;
        const bh = bgImg.naturalHeight || height;
        const bScale = Math.max(width / bw, height / bh);
        const bdw = bw * bScale;
        const bdh = bh * bScale;
        ctx.drawImage(bgImg, -bdw / 2, -bdh / 2, bdw, bdh);
        ctx.restore();
      } catch {
        // Fall back gracefully
      }
    }

    // 2. Draw Photo or Video Frame with Filter, Zoom, Rotation, Flip & Person Scale/Pan
    ctx.save();
    ctx.filter = buildCssFilterString(config);
    const ppx = ((config.personPositionX || 0) / 100) * width;
    const ppy = ((config.personPositionY || 0) / 100) * height;
    ctx.translate(width / 2 + ppx, height / 2 + ppy);
    ctx.rotate((config.rotation * Math.PI) / 180);
    const effScale = (config.personScale || 1) * config.zoom;
    ctx.scale(
      effScale * (config.flipH ? -1 : 1),
      effScale * (config.flipV ? -1 : 1)
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

    // 2b. Vignette & Cinema Bars if enabled
    if ((config.vignette ?? 0) > 0) {
      const vStrength = (config.vignette || 0) / 100;
      const radGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.65
      );
      radGrad.addColorStop(0, 'rgba(0,0,0,0)');
      radGrad.addColorStop(1, `rgba(0,0,0,${(vStrength * 0.85).toFixed(2)})`);
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    }

    if (config.vfxOverlay === 'cinema_bars') {
      const barH = Math.round(height * 0.1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, barH);
      ctx.fillRect(0, height - barH, width, barH);
    } else if (config.vfxOverlay === 'light_leak') {
      const leakGrad = ctx.createLinearGradient(0, 0, width * 0.6, height * 0.5);
      leakGrad.addColorStop(0, 'rgba(251, 146, 60, 0.38)');
      leakGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.18)');
      leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, width, height);
    }

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
  subtitles?: StudioSubtitleCue[];
  currentTime?: number;
}> = ({ stickers = [], texts = [], subtitles = [], currentTime = 0 }) => {
  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  if (stickers.length === 0 && texts.length === 0 && !activeSubtitle) return null;
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

      {texts.map((tx) => {
        const preset = tx.fontStyleId ? getFontDesignPresetById(tx.fontStyleId) : null;
        return (
          <div
            key={tx.id}
            style={{
              left: `${tx.x}%`,
              top: `${tx.y}%`,
              transform: `translate(-50%, -50%) scale(${tx.scale}) rotate(${tx.rotation}deg)`,
              fontFamily: preset?.style?.fontFamily || getFontFamilyCss(tx.fontFamily),
              color: preset?.textColor || tx.color,
              ...(preset?.style || {}),
              textShadow:
                preset?.style?.textShadow ||
                (tx.fontFamily === 'neon'
                  ? `0 0 12px ${tx.color}, 0 0 24px ${tx.color}`
                  : tx.bgStyle === 'none'
                    ? '0 2px 10px rgba(0,0,0,0.9)'
                    : undefined),
            }}
            className={`absolute font-extrabold text-base sm:text-lg text-center whitespace-pre-wrap leading-snug max-w-[280px] ${
              preset?.className || (
                tx.bgStyle === 'pill'
                  ? 'px-3.5 py-1.5 rounded-xl bg-[#0F172A] shadow-xl border border-white/15'
                  : tx.bgStyle === 'glass'
                    ? 'px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15'
                    : tx.bgStyle === 'neon'
                      ? 'px-3.5 py-1.5 rounded-xl bg-purple-950/80 border-2 shadow-lg'
                      : ''
              )
            }`}
          >
            {tx.text}
          </div>
        );
      })}

      {activeSubtitle && (() => {
        const subPreset = activeSubtitle.fontStyleId
          ? getFontDesignPresetById(activeSubtitle.fontStyleId)
          : null;
        return (
          <div className="absolute bottom-14 inset-x-4 flex justify-center">
            <div
              style={{
                ...(subPreset?.style || {}),
                color: activeSubtitle.color || subPreset?.textColor || '#FFFFFF',
              }}
              className={
                subPreset?.className ||
                'px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-extrabold text-center shadow-lg'
              }
            >
              {activeSubtitle.text}
            </div>
          </div>
        );
      })()}
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
    | 'cut_crop'
    | 'ai_background'
    | 'greenscreen'
    | 'transitions'
    | 'sound'
    | 'filters'
    | 'stickers'
    | 'text'
  >('cut_crop');

  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoElRef = videoRefExternal || internalVideoRef;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const customAudioInputRef = useRef<HTMLInputElement | null>(null);
  const customAudioElRef = useRef<HTMLAudioElement | null>(null);
  const customBgInputRef = useRef<HTMLInputElement | null>(null);
  const secondaryVideoInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const chromaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const transitionAnimRef = useRef<number | null>(null);
  const lastTriggeredCutRef = useRef<number>(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [soundPlayhead, setSoundPlayhead] = useState(0);
  const [stutterCounter, setStutterCounter] = useState(0);
  const [loopAnimationPhase, setLoopAnimationPhase] = useState(0);

  // AI Background Replacement & Green Screen state
  const [isGeneratingAiBg, setIsGeneratingAiBg] = useState(false);
  const [aiBgPrompt, setAiBgPrompt] = useState('');
  const [showAiBgPromptModal, setShowAiBgPromptModal] = useState(false);
  const [aiBgNotice, setAiBgNotice] = useState('');
  const [bgSearchQuery, setBgSearchQuery] = useState('');
  const [selectedBgCategory, setSelectedBgCategory] = useState<string>('All');

  // Speech to text & 52 fonts state
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [selectedFontCategory, setSelectedFontCategory] =
    useState<string>('All');
  const [selectedFontPresetId, setSelectedFontPresetId] = useState<string>(
    config.activeFontStyleId || 'tiktok_viral_bold'
  );

  // Transition library & multi-clip state
  const [transitionCategory, setTransitionCategory] = useState<
    'All' | 'Basic' | 'Slide & Push' | 'Wipe & Iris' | 'Camera & Glitch'
  >('All');
  const [selectedTransitionClipId, setSelectedTransitionClipId] =
    useState<string>('all');
  const [activeTransitionAnim, setActiveTransitionAnim] = useState<{
    type: StudioTransitionType;
    progress: number;
    label: string;
  } | null>(null);

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

  // Live Clean Chroma Keying Canvas Rendering Engine
  useEffect(() => {
    if (!config.chromaKeyEnabled || config.aiBgMode !== 'chroma_key') return;
    const canvas = chromaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let rafId: number;
    const renderChroma = () => {
      const srcEl = isVideo
        ? videoElRef.current
        : (stageRef.current?.querySelector('img') as HTMLImageElement | null);
      if (srcEl && ctx) {
        const w = 360;
        const h = 640;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        try {
          ctx.drawImage(srcEl as any, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);
          const data = frame.data;
          const sensitivity = config.chromaKeySensitivity ?? 50;
          const keyColor = config.chromaKeyColor || 'green';

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (keyColor === 'green') {
              const maxOther = Math.max(r, b);
              const diff = g - maxOther;
              const thresholdLow = Math.max(12, 60 - sensitivity * 0.55);
              const thresholdHigh = thresholdLow + 35;

              if (diff >= thresholdHigh && g > 75) {
                data[i + 3] = 0;
              } else if (diff > thresholdLow && g > 65) {
                const factor = (diff - thresholdLow) / (thresholdHigh - thresholdLow);
                data[i + 3] = Math.round(data[i + 3] * (1 - factor));
                data[i + 1] = Math.round(maxOther + (g - maxOther) * (1 - factor));
              } else if (diff > 0 && g > 90) {
                data[i + 1] = Math.round((g + maxOther) / 2);
              }
            } else if (keyColor === 'blue') {
              const maxOther = Math.max(r, g);
              const diff = b - maxOther;
              const thresholdLow = Math.max(12, 60 - sensitivity * 0.55);
              const thresholdHigh = thresholdLow + 35;

              if (diff >= thresholdHigh && b > 75) {
                data[i + 3] = 0;
              } else if (diff > thresholdLow && b > 65) {
                const factor = (diff - thresholdLow) / (thresholdHigh - thresholdLow);
                data[i + 3] = Math.round(data[i + 3] * (1 - factor));
                data[i + 2] = Math.round(maxOther + (b - maxOther) * (1 - factor));
              } else if (diff > 0 && b > 90) {
                data[i + 2] = Math.round((b + maxOther) / 2);
              }
            } else if (keyColor === 'black') {
              const brightness = (r + g + b) / 3;
              const darkThreshold = Math.max(10, sensitivity * 0.85);
              if (brightness < darkThreshold) {
                const factor = brightness / darkThreshold;
                data[i + 3] = Math.round(data[i + 3] * factor);
              }
            }
          }
          ctx.putImageData(frame, 0, 0);
        } catch {
          // ignore
        }
      }
      rafId = requestAnimationFrame(renderChroma);
    };

    rafId = requestAnimationFrame(renderChroma);
    return () => cancelAnimationFrame(rafId);
  }, [
    config.chromaKeyEnabled,
    config.aiBgMode,
    config.chromaKeySensitivity,
    config.chromaKeyColor,
    mediaUrl,
    isVideo,
    isPlaying,
  ]);

  // AI Background Generator Handler
  const handleGenerateAiBackground = async (promptOverride?: string) => {
    const query = (promptOverride || aiBgPrompt).trim();
    if (!query) return;
    setIsGeneratingAiBg(true);
    setAiBgNotice('Generating custom AI environment...');
    try {
      const res = await fetch('/api/ai/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, isVideo }),
      });
      const data = await res.json();
      if (data?.ok && data?.background?.url) {
        onChangeConfig((prev) => ({
          ...prev,
          greenScreenBgUrl: data.background.url,
          greenScreenBgType: 'image',
          greenScreenBgName: data.background.name || query,
          aiBgEnabled: true,
          chromaKeyEnabled: prev.aiBgMode === 'chroma_key',
        }));
        setShowAiBgPromptModal(false);
        setAiBgNotice(`Applied AI Background: ${data.background.name || query}`);
        setTimeout(() => setAiBgNotice(''), 4000);
        return;
      }
    } catch {
      // Fall through to preset matcher
    } finally {
      setIsGeneratingAiBg(false);
    }

    // Curated fallback if offline or API error
    const lower = query.toLowerCase();
    const match =
      GREEN_SCREEN_BACKGROUNDS.find(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          b.tags.some((t) => t.toLowerCase().includes(lower))
      ) || GREEN_SCREEN_BACKGROUNDS[0];

    onChangeConfig((prev) => ({
      ...prev,
      greenScreenBgUrl: match.url,
      greenScreenBgType: match.type,
      greenScreenBgName: match.name,
      aiBgEnabled: true,
      chromaKeyEnabled: prev.aiBgMode === 'chroma_key',
    }));
    setShowAiBgPromptModal(false);
    setAiBgNotice(`Applied AI Background: ${match.name}`);
    setTimeout(() => setAiBgNotice(''), 4000);
  };

  // Speech-to-Text Handler: converts spoken voice into real-time synced captions
  const handleToggleSpeechToText = () => {
    if (isRecordingSpeech) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        speechRecognitionRef.current = null;
      }
      setIsRecordingSpeech(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const input = prompt(
        'Speech-to-Text: Enter what you spoke in the video to generate synced captions:'
      );
      if (input && input.trim()) {
        const text = input.trim();
        const start = Number((currentTime || 0).toFixed(1));
        const preset = getFontDesignPresetById(selectedFontPresetId);
        onChangeConfig((prev) => ({
          ...prev,
          activeFontStyleId: selectedFontPresetId,
          texts: [
            ...prev.texts,
            {
              id: `text_stt_${Date.now()}`,
              text,
              fontFamily: 'display',
              fontStyleId: selectedFontPresetId,
              color: preset.textColor || '#FFFFFF',
              bgStyle: 'glass',
              x: 50,
              y: 80,
              scale: 1.1,
              rotation: 0,
            },
          ],
          subtitles: [
            ...(prev.subtitles || []),
            {
              id: `sub_${Date.now()}`,
              startTime: start,
              endTime: start + Math.max(3, text.split(' ').length * 0.4),
              text,
            },
          ],
        }));
      }
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecordingSpeech(true);
      };

      recognition.onresult = (event: any) => {
        let full = '';
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript + ' ';
        }
        // Deduplicate repeated words and adjacent identical phrases
        const words = full.trim().split(/\s+/);
        const deduped: string[] = [];
        for (let i = 0; i < words.length; i++) {
          const curr = words[i];
          const prev = deduped[deduped.length - 1];
          if (
            prev &&
            prev.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
              curr.toLowerCase().replace(/[^a-z0-9]/gi, '')
          ) {
            continue;
          }
          deduped.push(curr);
        }
        const clean = deduped.join(' ');
        setSpeechTranscript(clean);
        if (clean) {
          const start = Number((currentTime || 0).toFixed(1));
          const preset = getFontDesignPresetById(selectedFontPresetId);
          onChangeConfig((prev) => {
            const exists = prev.texts.find((t) => t.id === 'live_stt_layer');
            const newLayer: StudioTextLayer = {
              id: 'live_stt_layer',
              text: clean,
              fontFamily: 'display',
              fontStyleId: selectedFontPresetId,
              color: preset?.textColor || '#FFFFFF',
              bgStyle: 'glass',
              x: 50,
              y: 82,
              scale: 1.1,
              rotation: 0,
            };
            return {
              ...prev,
              activeFontStyleId: selectedFontPresetId,
              texts: exists
                ? prev.texts.map((t) => (t.id === 'live_stt_layer' ? newLayer : t))
                : [...prev.texts, newLayer],
              subtitles: [
                ...(prev.subtitles || []).filter((s) => s.id !== 'live_stt_sub'),
                {
                  id: 'live_stt_sub',
                  startTime: start,
                  endTime: start + 5,
                  text: clean,
                  fontStyleId: selectedFontPresetId,
                  color: preset?.textColor || '#FFFFFF',
                },
              ],
            };
          });
        }
      };

      recognition.onerror = () => {
        setIsRecordingSpeech(false);
      };

      recognition.onend = () => {
        setIsRecordingSpeech(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecordingSpeech(false);
    }
  };

  // Secondary Video File Upload to cut and add another video clip
  const handleSecondaryVideoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChangeConfig((prev) => {
      const dur = prev.duration || 15;
      const c1End = Number((dur / 2).toFixed(1));
      return {
        ...prev,
        secondaryVideoUrl: url,
        secondaryVideoName: file.name,
        clipSegments: [
          {
            id: 'clip_primary',
            label: 'Clip 1 (Original)',
            startTime: 0,
            endTime: c1End,
            transitionAfter: 'cross_dissolve',
            transitionDuration: 0.6,
          },
          {
            id: 'clip_secondary',
            label: `Clip 2 (${file.name.slice(0, 14)})`,
            startTime: c1End,
            endTime: dur,
            transitionAfter: 'cross_dissolve',
            transitionDuration: 0.6,
          },
        ],
      };
    });
  };

  // Custom Background Upload for Green Screen replacement
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVid = file.type.startsWith('video/');
    onChangeConfig((prev) => ({
      ...prev,
      chromaKeyEnabled: true,
      greenScreenBgUrl: url,
      greenScreenBgType: isVid ? 'video' : 'image',
      greenScreenBgName: file.name,
    }));
  };

  // Sync video playback speed & volume/mute
  useEffect(() => {
    const vid = videoElRef.current;
    if (!vid || !isVideo) return;
    vid.playbackRate = config.playbackSpeed || 1;
    vid.muted = config.muteAudio;
    vid.volume = Math.max(0, Math.min(1, (config.clipVolume ?? 100) / 100));
  }, [config.playbackSpeed, config.muteAudio, config.clipVolume, isVideo]);

  // Animate loop motion phase for both Photo & Video loop modes (Boomerang, Pulse Zoom, Ken Burns)
  useEffect(() => {
    if (!config.loopMode || config.loopMode === 'normal') {
      setLoopAnimationPhase(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoopAnimationPhase((p) => (p + 1) % 120);
    }, 50);
    return () => window.clearInterval(id);
  }, [config.loopMode]);

  // Photo timeline playhead simulation when previewing loops/sound/transitions on a photo
  useEffect(() => {
    if (isVideo || !isPlaying) return;
    const maxDur = Math.max(1, config.trimEnd || config.duration || 10);
    const id = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1 * (config.playbackSpeed || 1);
        checkAndFireClipBoundaryTransition(prev, next);
        if (next >= maxDur) {
          if (config.outroTransition && config.outroTransition !== 'none') {
            triggerStageTransitionPreview(
              config.outroTransition,
              config.transitionDuration || 0.6
            );
          }
          return config.trimStart || 0;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [
    isVideo,
    isPlaying,
    config.trimStart,
    config.trimEnd,
    config.duration,
    config.playbackSpeed,
    config.clipSegments,
    config.transitionType,
    config.transitionDuration,
  ]);

  // Clean up synth audio & transition timer on unmount
  useEffect(() => {
    return () => {
      if (synthIntervalRef.current) {
        window.clearInterval(synthIntervalRef.current);
      }
      if (transitionAnimRef.current) {
        window.clearInterval(transitionAnimRef.current);
      }
      if (customAudioElRef.current) {
        customAudioElRef.current.pause();
      }
    };
  }, []);

  // Compute effective multi-clip segments (defaults to 3 clips across trimStart..trimEnd if none saved yet)
  const effectiveSegments: StudioClipSegment[] = React.useMemo(() => {
    if (config.clipSegments && config.clipSegments.length >= 2) {
      return config.clipSegments;
    }
    const start = config.trimStart || 0;
    const end = Math.max(start + 1.5, config.trimEnd || config.duration || 15);
    const span = end - start;
    const c1End = Number((start + span / 3).toFixed(1));
    const c2End = Number((start + (span * 2) / 3).toFixed(1));
    const defaultTr = config.transitionType || 'cross_dissolve';
    const defaultDur = config.transitionDuration || 0.6;
    return [
      {
        id: 'clip_1',
        label: 'Clip 1',
        startTime: Number(start.toFixed(1)),
        endTime: c1End,
        transitionAfter: defaultTr,
        transitionDuration: defaultDur,
      },
      {
        id: 'clip_2',
        label: 'Clip 2',
        startTime: c1End,
        endTime: c2End,
        transitionAfter: defaultTr,
        transitionDuration: defaultDur,
      },
      {
        id: 'clip_3',
        label: 'Clip 3',
        startTime: c2End,
        endTime: Number(end.toFixed(1)),
        transitionAfter: defaultTr,
        transitionDuration: defaultDur,
      },
    ];
  }, [
    config.clipSegments,
    config.trimStart,
    config.trimEnd,
    config.duration,
    config.transitionType,
    config.transitionDuration,
  ]);

  const playTransitionWhooshSfx = (type: StudioTransitionType) => {
    if (type === 'none' || config.transitionSoundSfx === false || config.muteAudio) {
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const dur = Math.min(1.2, Math.max(0.25, config.transitionDuration || 0.6));
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'flash_white') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + dur * 0.8);
      } else if (type === 'glitch_rgb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(640, now + dur * 0.25);
        osc.frequency.setValueAtTime(180, now + dur * 0.5);
      } else if (
        type === 'slide_left' ||
        type === 'slide_right' ||
        type === 'slide_up' ||
        type === 'spin_whirl' ||
        type === 'zoom_in'
      ) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + dur * 0.45);
        osc.frequency.exponentialRampToValueAtTime(110, now + dur);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + dur * 0.6);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + dur * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch {
      // ignore audio context errors
    }
  };

  const triggerStageTransitionPreview = (
    type: StudioTransitionType,
    durationSec = config.transitionDuration || 0.6
  ) => {
    if (transitionAnimRef.current) {
      window.clearInterval(transitionAnimRef.current);
      transitionAnimRef.current = null;
    }
    if (type === 'none') {
      setActiveTransitionAnim(null);
      return;
    }

    const meta =
      STUDIO_TRANSITION_EFFECTS.find((e) => e.id === type) ||
      STUDIO_TRANSITION_EFFECTS[1];
    playTransitionWhooshSfx(type);

    const totalMs = Math.max(220, Math.min(2200, durationSec * 1000));
    const startedAt = performance.now();
    setActiveTransitionAnim({ type, progress: 0.02, label: meta.name });

    transitionAnimRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const rawProgress = Math.min(1, elapsed / totalMs);

      let eased = rawProgress;
      if (config.transitionEasing === 'ease_in_out') {
        eased =
          rawProgress < 0.5
            ? 2 * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;
      } else if (config.transitionEasing === 'snap_bounce') {
        eased = Math.min(1, rawProgress * 1.15);
      }

      if (rawProgress >= 1) {
        if (transitionAnimRef.current) {
          window.clearInterval(transitionAnimRef.current);
          transitionAnimRef.current = null;
        }
        setActiveTransitionAnim(null);
      } else {
        setActiveTransitionAnim({
          type,
          progress: eased,
          label: meta.name,
        });
      }
    }, 24);
  };

  const checkAndFireClipBoundaryTransition = (prevTime: number, nextTime: number) => {
    if (nextTime <= prevTime) return;
    for (let i = 0; i < effectiveSegments.length - 1; i++) {
      const seg = effectiveSegments[i];
      const cutPoint = seg.endTime;
      if (
        prevTime < cutPoint &&
        nextTime >= cutPoint &&
        Math.abs(lastTriggeredCutRef.current - cutPoint) > 0.25
      ) {
        lastTriggeredCutRef.current = cutPoint;
        const trType = seg.transitionAfter || config.transitionType || 'none';
        const trDur = seg.transitionDuration || config.transitionDuration || 0.6;
        if (trType !== 'none') {
          triggerStageTransitionPreview(trType, trDur);
        }
        window.setTimeout(() => {
          lastTriggeredCutRef.current = -1;
        }, 400);
        break;
      }
    }
  };

  const handleSplitClipAtPlayhead = () => {
    const start = config.trimStart || 0;
    const end = Math.max(start + 1.5, config.trimEnd || config.duration || 15);
    const currentSegs = [...effectiveSegments];

    // Find segment containing playhead, or split middle of active segment
    let splitTime = Number(currentTime.toFixed(1));
    let targetIdx = currentSegs.findIndex(
      (s) => splitTime > s.startTime + 0.4 && splitTime < s.endTime - 0.4
    );

    if (targetIdx === -1) {
      // Pick longest clip segment and split it in half
      let longestIdx = 0;
      let maxLen = 0;
      currentSegs.forEach((s, idx) => {
        const len = s.endTime - s.startTime;
        if (len > maxLen) {
          maxLen = len;
          longestIdx = idx;
        }
      });
      targetIdx = longestIdx;
      const targetSeg = currentSegs[targetIdx];
      splitTime = Number(
        ((targetSeg.startTime + targetSeg.endTime) / 2).toFixed(1)
      );
    }

    if (splitTime <= start + 0.3 || splitTime >= end - 0.3) return;

    const segToSplit = currentSegs[targetIdx];
    const defaultTr = config.transitionType || 'cross_dissolve';
    const defaultDur = config.transitionDuration || 0.6;

    const firstHalf: StudioClipSegment = {
      ...segToSplit,
      endTime: splitTime,
      transitionAfter: defaultTr,
      transitionDuration: defaultDur,
    };
    const secondHalf: StudioClipSegment = {
      id: `clip_${Date.now().toString(36)}`,
      label: `Clip ${currentSegs.length + 1}`,
      startTime: splitTime,
      endTime: segToSplit.endTime,
      transitionAfter: segToSplit.transitionAfter || defaultTr,
      transitionDuration: segToSplit.transitionDuration || defaultDur,
    };

    const updated = [
      ...currentSegs.slice(0, targetIdx),
      firstHalf,
      secondHalf,
      ...currentSegs.slice(targetIdx + 1),
    ].map((seg, idx) => ({
      ...seg,
      label: `Clip ${idx + 1}`,
    }));

    onChangeConfig((prev) => ({
      ...prev,
      clipSegments: updated,
    }));
    setSelectedTransitionClipId(firstHalf.id);
    triggerStageTransitionPreview(defaultTr, defaultDur);
  };

  const handleAutoSplitThreeClips = () => {
    const start = config.trimStart || 0;
    const end = Math.max(start + 1.8, config.trimEnd || config.duration || 15);
    const span = end - start;
    const c1 = Number((start + span / 3).toFixed(1));
    const c2 = Number((start + (span * 2) / 3).toFixed(1));
    const tr = config.transitionType || 'cross_dissolve';
    const dur = config.transitionDuration || 0.6;
    const segs: StudioClipSegment[] = [
      {
        id: 'clip_1',
        label: 'Clip 1',
        startTime: Number(start.toFixed(1)),
        endTime: c1,
        transitionAfter: tr,
        transitionDuration: dur,
      },
      {
        id: 'clip_2',
        label: 'Clip 2',
        startTime: c1,
        endTime: c2,
        transitionAfter:
          tr === 'cross_dissolve' ? 'slide_left' : tr,
        transitionDuration: dur,
      },
      {
        id: 'clip_3',
        label: 'Clip 3',
        startTime: c2,
        endTime: Number(end.toFixed(1)),
        transitionAfter: tr,
        transitionDuration: dur,
      },
    ];
    onChangeConfig((prev) => ({
      ...prev,
      clipSegments: segs,
    }));
    setSelectedTransitionClipId('all');
    triggerStageTransitionPreview(tr, dur);
  };

  const handleMergeClipSegment = (segId: string) => {
    if (effectiveSegments.length <= 2) return;
    const idx = effectiveSegments.findIndex((s) => s.id === segId);
    if (idx === -1) return;
    const copy = [...effectiveSegments];
    if (idx < copy.length - 1) {
      copy[idx] = {
        ...copy[idx],
        endTime: copy[idx + 1].endTime,
        transitionAfter: copy[idx + 1].transitionAfter,
      };
      copy.splice(idx + 1, 1);
    } else if (idx > 0) {
      copy[idx - 1] = {
        ...copy[idx - 1],
        endTime: copy[idx].endTime,
      };
      copy.splice(idx, 1);
    }
    const relabeled = copy.map((s, i) => ({
      ...s,
      label: `Clip ${i + 1}`,
    }));
    onChangeConfig((prev) => ({
      ...prev,
      clipSegments: relabeled,
    }));
    setSelectedTransitionClipId('all');
  };

  const handleSelectTransitionEffect = (effectId: StudioTransitionType) => {
    const dur = config.transitionDuration || 0.6;
    const updatedSegments = effectiveSegments.map((seg) => {
      if (
        selectedTransitionClipId === 'all' ||
        seg.id === selectedTransitionClipId
      ) {
        return {
          ...seg,
          transitionAfter: effectId,
          transitionDuration: dur,
        };
      }
      return seg;
    });

    onChangeConfig((prev) => ({
      ...prev,
      transitionType: effectId,
      clipSegments: updatedSegments,
    }));

    triggerStageTransitionPreview(effectId, dur);
  };

  const stopSoundPreview = () => {
    if (synthIntervalRef.current) {
      window.clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (customAudioElRef.current) {
      customAudioElRef.current.pause();
    }
    setIsSoundPlaying(false);
  };

  const startSoundPreview = () => {
    stopSoundPreview();
    const sStart = config.soundTrimStart ?? 0;
    const sEnd = Math.max(sStart + 0.5, config.soundTrimEnd ?? 12);
    setSoundPlayhead(sStart);
    setIsSoundPlaying(true);

    // If user uploaded custom audio file
    if (config.customAudioUrl && customAudioElRef.current) {
      const audio = customAudioElRef.current;
      audio.currentTime = sStart;
      audio.playbackRate = config.soundSpeed || 1;
      audio.volume = Math.max(0, Math.min(1, (config.soundVolume ?? 85) / 100));
      audio.play().catch(() => {});

      synthIntervalRef.current = window.setInterval(() => {
        if (!customAudioElRef.current) return;
        const cur = customAudioElRef.current.currentTime;
        setSoundPlayhead(cur);
        if (cur >= sEnd) {
          if (config.soundLoop !== false) {
            customAudioElRef.current.currentTime = sStart;
            customAudioElRef.current.play().catch(() => {});
          } else {
            stopSoundPreview();
          }
        }
      }, 100);
      return;
    }

    // Built-in synth beat loop generator via Web Audio API
    const track =
      STUDIO_BUILTIN_SOUNDS.find((t) => t.id === config.soundTrackId) ||
      STUDIO_BUILTIN_SOUNDS[0];
    if (config.soundTrackId === 'none') {
      onChangeConfig((prev) => ({
        ...prev,
        soundTrackId: STUDIO_BUILTIN_SOUNDS[0].id,
        soundDuration: STUDIO_BUILTIN_SOUNDS[0].duration,
      }));
    }

    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtxRef.current && AudioCtx) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    let stepIdx = 0;
    let elapsed = sStart;
    const speed = config.soundSpeed || 1;
    const stepMs = Math.max(90, Math.round((60000 / track.bpm / 2) / speed));

    synthIntervalRef.current = window.setInterval(() => {
      elapsed += stepMs / 1000;
      if (elapsed >= sEnd) {
        if (config.soundLoop !== false) {
          elapsed = sStart;
        } else {
          stopSoundPreview();
          return;
        }
      }
      setSoundPlayhead(elapsed);

      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const baseFreq = track.notes[stepIdx % track.notes.length];
        const fx = config.soundEffect || 'original';
        const freqMultiplier =
          fx === 'nightcore'
            ? 1.25
            : fx === 'slowed_reverb'
              ? 0.82
              : fx === 'bass_boost'
                ? 0.75
                : 1;

        osc.type =
          fx === 'bass_boost'
            ? 'triangle'
            : fx === 'radio_lofi'
              ? 'square'
              : 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq * freqMultiplier, now);

        const vol = Math.max(0.02, ((config.soundVolume ?? 85) / 100) * 0.18);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + stepMs / 1000);
      }
      stepIdx++;
    }, stepMs);
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      const dur =
        Number.isFinite(tempAudio.duration) && tempAudio.duration > 0
          ? Number(tempAudio.duration.toFixed(1))
          : 20;
      onChangeConfig((prev) => ({
        ...prev,
        soundTrackId: 'custom',
        customAudioUrl: url,
        customAudioName: file.name,
        soundDuration: dur,
        soundTrimStart: 0,
        soundTrimEnd: Math.min(dur, 15),
      }));
    });
  };

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
    checkAndFireClipBoundaryTransition(currentTime, t);
    setCurrentTime(t);
    const segLen = config.loopSegmentDuration || 3;

    // Stutter 3x loop mode
    if (
      config.loopMode === 'stutter_3x' &&
      t >= config.trimStart + Math.min(1.2, segLen * 0.5) &&
      stutterCounter < 2
    ) {
      setStutterCounter((c) => c + 1);
      vid.currentTime = config.trimStart;
      return;
    }

    if (config.trimEnd > 0 && t >= config.trimEnd) {
      setStutterCounter(0);
      if (config.transitionType && config.transitionType !== 'none') {
        triggerStageTransitionPreview(
          config.transitionType,
          config.transitionDuration || 0.6
        );
      }
      vid.currentTime = config.trimStart;
      if (!vid.paused) {
        vid.play().catch(() => {});
      }
    }
  };

  const toggleVideoPlay = () => {
    if (!isVideo) {
      setIsPlaying((p) => !p);
      return;
    }
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

  // Compute dynamic loop transform modifier for stage preview (Boomerang, Pulse Zoom, Ken Burns)
  const loopScaleBoost =
    config.loopMode === 'pulse_zoom'
      ? 1 + Math.sin((loopAnimationPhase / 15) * Math.PI) * 0.08
      : config.loopMode === 'ken_burns'
        ? 1 + (loopAnimationPhase / 120) * 0.18
        : 1;
  const loopRotateBoost =
    config.loopMode === 'boomerang'
      ? Math.sin((loopAnimationPhase / 20) * Math.PI) * 3.5
      : 0;

  const combinedZoom = config.zoom * loopScaleBoost;
  const combinedRotation = config.rotation + loopRotateBoost;

  // Compute live stage transition CSS styles when a transition is actively animating between clips
  const getTransitionMediaStyles = (): React.CSSProperties => {
    if (!activeTransitionAnim) return {};
    const { type, progress } = activeTransitionAnim;
    // progress goes 0 -> 1 across the transition window
    // Midpoint is 0.5 (outgoing clip 0..0.5, incoming clip 0.5..1)
    const isOut = progress < 0.5;
    const halfP = isOut ? progress * 2 : (progress - 0.5) * 2; // 0..1 within each half

    switch (type) {
      case 'cross_dissolve': {
        const alpha = isOut ? 1 - halfP * 0.75 : 0.25 + halfP * 0.75;
        return {
          opacity: alpha,
          filter: `${buildCssFilterString(config)} blur(${((1 - alpha) * 6).toFixed(1)}px)`,
        };
      }
      case 'fade_black':
      case 'flash_white': {
        return {};
      }
      case 'slide_left': {
        const tx = isOut ? -halfP * 100 : (1 - halfP) * 100;
        return {
          transform: `translateX(${tx.toFixed(1)}%) rotate(${combinedRotation}deg) scale(${
            combinedZoom * (config.flipH ? -1 : 1)
          }, ${combinedZoom * (config.flipV ? -1 : 1)})`,
        };
      }
      case 'slide_right': {
        const tx = isOut ? halfP * 100 : -(1 - halfP) * 100;
        return {
          transform: `translateX(${tx.toFixed(1)}%) rotate(${combinedRotation}deg) scale(${
            combinedZoom * (config.flipH ? -1 : 1)
          }, ${combinedZoom * (config.flipV ? -1 : 1)})`,
        };
      }
      case 'slide_up': {
        const ty = isOut ? -halfP * 100 : (1 - halfP) * 100;
        return {
          transform: `translateY(${ty.toFixed(1)}%) rotate(${combinedRotation}deg) scale(${
            combinedZoom * (config.flipH ? -1 : 1)
          }, ${combinedZoom * (config.flipV ? -1 : 1)})`,
        };
      }
      case 'wipe_right': {
        const rightInset = Math.max(0, 100 - progress * 100);
        return {
          clipPath: `inset(0 ${rightInset.toFixed(1)}% 0 0)`,
        };
      }
      case 'wipe_clock': {
        const radius = Math.max(4, progress * 115);
        return {
          clipPath: `circle(${radius.toFixed(1)}% at 50% 50%)`,
        };
      }
      case 'zoom_in': {
        const zBoost = isOut ? 1 + halfP * 1.35 : 2.35 - halfP * 1.35;
        return {
          transform: `rotate(${combinedRotation}deg) scale(${
            combinedZoom * zBoost * (config.flipH ? -1 : 1)
          }, ${combinedZoom * zBoost * (config.flipV ? -1 : 1)})`,
        };
      }
      case 'spin_whirl': {
        const spinDeg = progress * 360;
        const sBoost = isOut ? 1 - halfP * 0.35 : 0.65 + halfP * 0.35;
        return {
          transform: `rotate(${(combinedRotation + spinDeg).toFixed(1)}deg) scale(${
            combinedZoom * sBoost * (config.flipH ? -1 : 1)
          }, ${combinedZoom * sBoost * (config.flipV ? -1 : 1)})`,
        };
      }
      case 'glitch_rgb': {
        const jitterX = Math.sin(progress * Math.PI * 12) * 18;
        const skew = Math.cos(progress * Math.PI * 8) * 8;
        return {
          transform: `translateX(${jitterX.toFixed(1)}px) skewX(${skew.toFixed(1)}deg) rotate(${combinedRotation}deg) scale(${
            combinedZoom * (config.flipH ? -1 : 1)
          }, ${combinedZoom * (config.flipV ? -1 : 1)})`,
          filter: `${buildCssFilterString(config)} hue-rotate(${Math.round(
            Math.sin(progress * Math.PI * 6) * 90
          )}deg) contrast(145%)`,
        };
      }
      default:
        return {};
    }
  };

  const transitionMediaStyle = getTransitionMediaStyles();

  return (
    <div className="rounded-3xl bg-[#070B18] border border-white/15 overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5">
      {config.customAudioUrl && (
        <audio ref={customAudioElRef} src={config.customAudioUrl} className="hidden" />
      )}
      <input
        ref={customAudioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCustomAudioUpload}
        className="hidden"
      />

      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                B-Edit Studio Pro ({isVideo ? 'Video Mode' : 'Photo Mode'})
              </h3>
              {config.loopMode && config.loopMode !== 'normal' && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-bold text-purple-300">
                  Loop: {config.loopMode.replace('_', ' ')}
                </span>
              )}
              {config.transitionType && config.transitionType !== 'none' && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-300">
                  Transition:{' '}
                  {STUDIO_TRANSITION_EFFECTS.find(
                    (e) => e.id === config.transitionType
                  )?.name || 'Cross Dissolve'}
                </span>
              )}
              {config.soundTrackId && config.soundTrackId !== 'none' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                  Sound Cut Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-clip cuts, pro transitions (dissolve, slide, wipe, zoom), sound cutter & loops, LUTs, VFX, stickers & text
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            stopSoundPreview();
            onChangeConfig((prev) => ({
              ...DEFAULT_STUDIO_CONFIG,
              duration: prev.duration,
              trimEnd: prev.duration || 15,
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
          {/* Green Screen & AI Replacement Virtual Background Layer (Positioned behind person) */}
          {config.greenScreenBgUrl && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {config.greenScreenBgType === 'video' ? (
                <video
                  src={config.greenScreenBgUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    filter: (config.bgBlur || 0) > 0 ? `blur(${config.bgBlur}px)` : undefined,
                    transform: `translate(${config.bgPositionX || 0}%, ${config.bgPositionY || 0}%) scale(${config.bgZoom || 1})`,
                    transformOrigin: 'center center',
                  }}
                  className="w-full h-full object-cover transition-transform duration-75"
                />
              ) : (
                <img
                  src={config.greenScreenBgUrl}
                  alt={config.greenScreenBgName || 'Virtual background'}
                  style={{
                    filter: (config.bgBlur || 0) > 0 ? `blur(${config.bgBlur}px)` : undefined,
                    transform: `translate(${config.bgPositionX || 0}%, ${config.bgPositionY || 0}%) scale(${config.bgZoom || 1})`,
                    transformOrigin: 'center center',
                  }}
                  className="w-full h-full object-cover transition-transform duration-75"
                />
              )}
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-emerald-400/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[170px]">
                  {config.greenScreenBgName || 'Virtual BG'}
                  {(config.bgBlur || 0) > 0 ? ` • ${config.bgBlur}px blur` : ''}
                  {(config.bgZoom || 1) !== 1 ? ` • ${config.bgZoom}x zoom` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Underlying Foreground Media: Person / Subject (Face, body, clothes, hair, voice 100% untouched) */}
          {mediaUrl ? (
            <>
              {isVideo ? (
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
                    transform: `translate(${config.personPositionX || 0}%, ${config.personPositionY || 0}%) rotate(${combinedRotation}deg) scale(${
                      combinedZoom * (config.personScale || 1) * (config.flipH ? -1 : 1)
                    }, ${combinedZoom * (config.personScale || 1) * (config.flipV ? -1 : 1)})`,
                    opacity:
                      config.chromaKeyEnabled && config.aiBgMode === 'chroma_key'
                        ? 0.01
                        : 1,
                    position: 'relative',
                    zIndex: 10,
                    ...transitionMediaStyle,
                  }}
                  className="w-full h-full object-contain cursor-pointer transition-transform duration-75"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Studio preview"
                  onClick={toggleVideoPlay}
                  style={{
                    filter: buildCssFilterString(config),
                    transform: `translate(${config.personPositionX || 0}%, ${config.personPositionY || 0}%) rotate(${combinedRotation}deg) scale(${
                      combinedZoom * (config.personScale || 1) * (config.flipH ? -1 : 1)
                    }, ${combinedZoom * (config.personScale || 1) * (config.flipV ? -1 : 1)})`,
                    opacity:
                      config.chromaKeyEnabled && config.aiBgMode === 'chroma_key'
                        ? 0.01
                        : 1,
                    position: 'relative',
                    zIndex: 10,
                    ...transitionMediaStyle,
                  }}
                  className="w-full h-full object-contain transition-transform duration-75 cursor-pointer"
                />
              )}

              {/* Live Chroma-Key Green Screen Cutout Canvas */}
              {config.chromaKeyEnabled && config.aiBgMode === 'chroma_key' && (
                <canvas
                  ref={chromaCanvasRef}
                  onClick={toggleVideoPlay}
                  style={{
                    transform: `translate(${config.personPositionX || 0}%, ${config.personPositionY || 0}%) rotate(${combinedRotation}deg) scale(${
                      combinedZoom * (config.personScale || 1) * (config.flipH ? -1 : 1)
                    }, ${combinedZoom * (config.personScale || 1) * (config.flipV ? -1 : 1)})`,
                    position: 'absolute',
                    zIndex: 15,
                    ...transitionMediaStyle,
                  }}
                  className="inset-0 w-full h-full object-contain cursor-pointer pointer-events-auto"
                />
              )}
            </>
          ) : (
            <div
              style={transitionMediaStyle}
              className="text-center p-6 pointer-events-none space-y-1 transition-all duration-75"
            >
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                B-Edit Interactive Canvas Stage
              </p>
              <p className="text-[11px] text-slate-300/80">
                Use Cut, Pro Transitions (Dissolve, Slide, Wipe), Sound Cutter, Filters, Stickers & Text below!
              </p>
            </div>
          )}

          {/* Live Stage Transition Curtain / Wipe / Glitch / Strobe Overlays */}
          {activeTransitionAnim && (
            <>
              {activeTransitionAnim.type === 'fade_black' && (
                <div
                  className="pointer-events-none absolute inset-0 bg-black z-25"
                  style={{
                    opacity: Math.sin(activeTransitionAnim.progress * Math.PI),
                  }}
                />
              )}
              {activeTransitionAnim.type === 'flash_white' && (
                <div
                  className="pointer-events-none absolute inset-0 bg-white z-25"
                  style={{
                    opacity: Math.pow(
                      Math.sin(activeTransitionAnim.progress * Math.PI),
                      0.7
                    ),
                  }}
                />
              )}
              {activeTransitionAnim.type === 'wipe_right' && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-300 via-white to-purple-400 shadow-[0_0_20px_rgba(34,211,238,0.95)] z-25"
                  style={{
                    left: `${(activeTransitionAnim.progress * 100).toFixed(1)}%`,
                  }}
                />
              )}
              {activeTransitionAnim.type === 'glitch_rgb' && (
                <div className="pointer-events-none absolute inset-0 z-25 mix-blend-screen bg-gradient-to-r from-cyan-500/35 via-transparent to-rose-500/35" />
              )}
              <div className="pointer-events-none absolute top-3 right-3 px-2.5 py-1 rounded-full bg-purple-950/90 border border-cyan-400/60 text-[10px] font-extrabold text-cyan-300 flex items-center gap-1 shadow-lg z-30">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Transition: {activeTransitionAnim.label}</span>
              </div>
            </>
          )}

          {/* Vignette Lens Overlay */}
          {(config.vignette ?? 0) > 0 && (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background: `radial-gradient(circle, transparent 35%, rgba(0,0,0,${(
                  (config.vignette || 0) / 100
                ).toFixed(2)}) 95%)`,
              }}
            />
          )}

          {/* Live VFX Overlays (Works on both Video & Photo!) */}
          {config.vfxOverlay === 'cinema_bars' && (
            <>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-[10%] bg-black z-10" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[10%] bg-black z-10" />
            </>
          )}
          {config.vfxOverlay === 'neon_frame' && (
            <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-cyan-400 shadow-[inset_0_0_24px_rgba(34,211,238,0.55),0_0_24px_rgba(168,85,247,0.55)] z-10" />
          )}
          {config.vfxOverlay === 'light_leak' && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/35 via-rose-500/15 to-transparent mix-blend-screen z-10" />
          )}
          {config.vfxOverlay === 'vhs_glitch' && (
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px]" />
              <div className="absolute top-3 left-3 font-mono text-[10px] font-bold text-emerald-400 tracking-widest drop-shadow">
                PLAY ▶ VHS • B-EDIT
              </div>
            </div>
          )}
          {config.vfxOverlay === 'sparkle_dust' && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-around opacity-70 text-lg">
              <span className="animate-pulse">✨</span>
              <span className="animate-bounce">✦</span>
              <span className="animate-pulse">⭐</span>
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
                {/* On-Canvas Quick Overlay Action Badge: Resize & Remove */}
                {isSel && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-blue-400 shadow-xl z-30"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeConfig((prev) => ({
                          ...prev,
                          stickers: prev.stickers.map((s) =>
                            s.id === st.id ? { ...s, scale: Math.max(0.4, Number((s.scale - 0.15).toFixed(2))) } : s
                          ),
                        }));
                      }}
                      className="text-xs text-white hover:text-blue-300 font-bold px-1"
                      title="Smaller"
                    >
                      –
                    </button>
                    <span className="text-[10px] text-slate-300">{st.scale.toFixed(1)}x</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeConfig((prev) => ({
                          ...prev,
                          stickers: prev.stickers.map((s) =>
                            s.id === st.id ? { ...s, scale: Math.min(2.8, Number((s.scale + 0.15).toFixed(2))) } : s
                          ),
                        }));
                      }}
                      className="text-xs text-white hover:text-blue-300 font-bold px-1"
                      title="Bigger"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeConfig((prev) => ({
                          ...prev,
                          stickers: prev.stickers.filter((s) => s.id !== st.id),
                        }));
                        setSelectedLayer(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 pl-1 border-l border-white/20"
                      title="Remove Overlay"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Draggable Text Layers */}
          {config.texts.map((tx) => {
            const isSel =
              selectedLayer?.type === 'text' && selectedLayer.id === tx.id;
            const preset = tx.fontStyleId ? getFontDesignPresetById(tx.fontStyleId) : null;
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
                  fontFamily: preset?.style?.fontFamily || getFontFamilyCss(tx.fontFamily),
                  color: preset?.textColor || tx.color,
                  ...(preset?.style || {}),
                  textShadow:
                    preset?.style?.textShadow ||
                    (tx.fontFamily === 'neon'
                      ? `0 0 12px ${tx.color}, 0 0 24px ${tx.color}`
                      : tx.bgStyle === 'none'
                        ? '0 2px 10px rgba(0,0,0,0.9)'
                        : undefined),
                }}
                className={`absolute cursor-grab active:cursor-grabbing z-20 font-extrabold text-base sm:text-lg text-center whitespace-pre-wrap leading-snug max-w-[280px] ${
                  preset?.className || (
                    tx.bgStyle === 'pill'
                      ? 'px-3.5 py-1.5 rounded-xl bg-[#0F172A] shadow-xl border border-white/15'
                      : tx.bgStyle === 'glass'
                        ? 'px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15'
                        : tx.bgStyle === 'neon'
                          ? 'px-3.5 py-1.5 rounded-xl bg-purple-950/80 border-2 shadow-lg'
                          : ''
                  )
                } ${isSel ? 'ring-2 ring-blue-400' : ''}`}
              >
                {tx.text}

                {/* On-Canvas Quick Overlay Action Badge: Resize & Remove */}
                {isSel && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-blue-400 shadow-xl z-30"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === tx.id ? { ...t, scale: Math.max(0.4, Number((t.scale - 0.15).toFixed(2))) } : t
                          ),
                        }));
                      }}
                      className="text-xs text-white hover:text-blue-300 font-bold px-1"
                      title="Smaller"
                    >
                      –
                    </button>
                    <span className="text-[10px] text-slate-300">{tx.scale.toFixed(1)}x</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === tx.id ? { ...t, scale: Math.min(2.8, Number((t.scale + 0.15).toFixed(2))) } : t
                          ),
                        }));
                      }}
                      className="text-xs text-white hover:text-blue-300 font-bold px-1"
                      title="Bigger"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.filter((t) => t.id !== tx.id),
                        }));
                        setSelectedLayer(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 pl-1 border-l border-white/20"
                      title="Remove Overlay"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Stage Play/Pause, Cut & Sound Indicator Overlay (Works for BOTH Video and Photo) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-30">
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

            <span className="text-[11px] text-emerald-300 font-semibold truncate">
              {isVideo ? 'Video Cut' : 'Photo Loop'}: {config.trimStart.toFixed(1)}s –{' '}
              {(config.trimEnd || config.duration || 15).toFixed(1)}s •{' '}
              {(config.loopMode || 'normal').replace('_', ' ')}
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
              title={config.muteAudio ? 'Unmute Audio' : 'Mute Audio'}
            >
              {config.muteAudio ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {(config.stickers.length > 0 || config.texts.length > 0) && (
          <p className="text-[11px] text-slate-400 mt-2 inline-flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-blue-400" /> Drag any sticker or
            text on the preview to reposition it
          </p>
        )}
      </div>

      {/* 7 Pro Studio Tool Tabs (All Available for Both Video & Photo!) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 p-1 bg-white/[0.04] rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveToolTab('cut_crop')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'cut_crop'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Cut & Speed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('ai_background')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'ai_background' || activeToolTab === 'greenscreen'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg ring-1 ring-emerald-400/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400 animate-pulse" />
          <span className="truncate">AI Background</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('text')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'text'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Type className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">52 Fonts & STT</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('transitions')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'transitions'
              ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SplitSquareHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Transitions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('sound')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'sound'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Music className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Sound Cut</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('filters')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'filters'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Filters & VFX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToolTab('stickers')}
          className={`py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeToolTab === 'stickers'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smile className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Stickers ({config.stickers.length})</span>
        </button>
      </div>

      {/* TAB 1: CUT, LOOP & CROP (Available for BOTH Video and Photo!) */}
      {activeToolTab === 'cut_crop' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          {/* Timeline Cut & Trim (For BOTH Video & Photo Loop Duration) */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {isVideo
                    ? 'Video Cut, Split & Loop Timeline'
                    : 'Photo Clip Duration & Motion Loop Timeline'}
                </span>
              </label>
              <span className="text-[11px] text-purple-300 font-semibold">
                Active Window:{' '}
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
                Math.min(
                  100 - leftPct,
                  ((rightVal - config.trimStart) / maxDur) * 100
                )
              );
              const playheadPct = Math.min(100, (currentTime / maxDur) * 100);

              return (
                <div className="relative h-10 rounded-xl bg-[#0D1326] border border-white/15 overflow-hidden flex items-center px-2">
                  <div className="w-full flex items-center justify-between opacity-25 pointer-events-none">
                    {Array.from({ length: 22 }).map((_, i) => (
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
                  max={Math.max(
                    0.5,
                    (config.trimEnd || config.duration || 15) - 0.5
                  )}
                  step={0.1}
                  value={config.trimStart}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChangeConfig((prev) => ({
                      ...prev,
                      trimStart: Math.min(
                        val,
                        (prev.trimEnd || prev.duration || 15) - 0.5
                      ),
                    }));
                    if (videoElRef.current && isVideo) {
                      videoElRef.current.currentTime = val;
                    } else {
                      setCurrentTime(val);
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

            {/* Playhead Split / Quick Cut Presets & Speed Curve */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSplitClipAtPlayhead}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold inline-flex items-center gap-1"
                >
                  <SplitSquareHorizontal className="w-3 h-3" />
                  <span>Split Clip @ Playhead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToolTab('transitions')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] text-amber-300 font-semibold inline-flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Add Transitions ({effectiveSegments.length - 1})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cutIn = Math.min(
                      currentTime,
                      (config.trimEnd || config.duration || 15) - 0.5
                    );
                    onChangeConfig((prev) => ({
                      ...prev,
                      trimStart: Number(Math.max(0, cutIn).toFixed(1)),
                    }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[11px] text-blue-300 font-semibold"
                >
                  Cut In @ Playhead
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cutOut = Math.max(
                      currentTime,
                      config.trimStart + 0.5
                    );
                    onChangeConfig((prev) => ({
                      ...prev,
                      trimEnd: Number(cutOut.toFixed(1)),
                    }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-[11px] text-purple-300 font-semibold"
                >
                  Cut Out @ Playhead
                </button>
                {[3, 5, 10, 15].map((sec) => (
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
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200 font-medium"
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Pro Speed Control & Playback Rate */}
              <div className="w-full pt-2.5 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-pink-400" />
                    <span>Speed Control: {config.playbackSpeed}x</span>
                  </span>
                  <span className="text-[11px] text-pink-300 font-semibold">
                    {config.playbackSpeed < 1
                      ? 'Slow Motion 🐌'
                      : config.playbackSpeed > 1
                        ? 'Fast Forward ⚡'
                        : 'Normal Speed 🎬'}
                  </span>
                </div>

                {/* Speed Slider: 0.25x to 4.0x */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">0.25x</span>
                  <input
                    type="range"
                    min={0.25}
                    max={4.0}
                    step={0.05}
                    value={config.playbackSpeed}
                    onChange={(e) => {
                      const sp = Number(Number(e.target.value).toFixed(2));
                      onChangeConfig((prev) => ({ ...prev, playbackSpeed: sp }));
                      if (videoElRef.current) {
                        videoElRef.current.playbackRate = sp;
                      }
                    }}
                    className="flex-1 accent-pink-500"
                  />
                  <span className="text-[10px] text-slate-400">4.0x</span>
                </div>

                {/* Speed Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        onChangeConfig((prev) => ({
                          ...prev,
                          playbackSpeed: sp,
                        }));
                        if (videoElRef.current) {
                          videoElRef.current.playbackRate = sp;
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        config.playbackSpeed === sp
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>

                {/* Cut & Add Another Video Section */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Cut & Add Another Video Clip</span>
                    </span>
                    {config.secondaryVideoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeConfig((prev) => ({
                            ...prev,
                            secondaryVideoUrl: undefined,
                            secondaryVideoName: undefined,
                          }))
                        }
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Remove 2nd Clip
                      </button>
                    )}
                  </div>

                  <input
                    ref={secondaryVideoInputRef}
                    type="file"
                    accept="video/*,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        onChangeConfig((prev) => ({
                          ...prev,
                          secondaryVideoUrl: url,
                          secondaryVideoName: file.name,
                        }));
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => secondaryVideoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{config.secondaryVideoUrl ? 'Change 2nd Video Clip' : '➕ Add Another Video Clip / Merge'}</span>
                    </button>
                    {config.secondaryVideoName && (
                      <span className="text-[11px] text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 truncate max-w-[200px]">
                        🎬 {config.secondaryVideoName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loop Engine Controls (Works on both Video & Photo!) */}
          <div className="space-y-2.5 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                <span>Loop Effect & Replay Mode (Video & Photo)</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold">
                {config.loopCount === 0
                  ? '∞ Infinite Loop'
                  : `${config.loopCount}x Repeat`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'normal', label: 'Seamless Loop' },
                  { id: 'boomerang', label: 'Boomerang Bounce' },
                  { id: 'stutter_3x', label: '3x Stutter Cut' },
                  { id: 'pulse_zoom', label: 'Beat Pulse Loop' },
                  { id: 'ken_burns', label: 'Cinema Pan Loop' },
                ] as const
              ).map((lm) => (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      loopMode: lm.id,
                    }))
                  }
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                    (config.loopMode || 'normal') === lm.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {lm.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Loop Repeat:</span>
                {[
                  { count: 0, label: '∞ Infinite' },
                  { count: 2, label: '2x Loop' },
                  { count: 3, label: '3x Loop' },
                  { count: 5, label: '5x Loop' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() =>
                      onChangeConfig((prev) => ({
                        ...prev,
                        loopCount: item.count,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                      (config.loopCount ?? 0) === item.count
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                  min={0.5}
                  max={3.0}
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

              <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 flex-wrap">
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

            {/* Studio Canvas Background Selector */}
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

      {/* TAB: AI BACKGROUND REPLACEMENT & GREEN SCREEN CHROMA KEY (WORKS FOR BOTH VIDEOS & PHOTOS) */}
      {(activeToolTab === 'ai_background' || activeToolTab === 'greenscreen') && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  AI Video & Photo Tool
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Background Replacement Studio</span>
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically separate person from original background with AI, search 4K virtual scenes, or generate custom environments.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {config.greenScreenBgUrl && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeConfig((prev) => ({
                      ...prev,
                      greenScreenBgUrl: undefined,
                      greenScreenBgName: undefined,
                      chromaKeyEnabled: false,
                      aiBgEnabled: false,
                      bgBlur: 0,
                      bgZoom: 1,
                      bgPositionX: 0,
                      bgPositionY: 0,
                      personScale: 1,
                      personPositionX: 0,
                      personPositionY: 0,
                    }));
                    setAiBgNotice('Background removed. Original video/photo restored.');
                    setTimeout(() => setAiBgNotice(''), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo / Remove BG
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAiBgPromptModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate with AI</span>
              </button>

              <input
                ref={customBgInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    const isVid = file.type.startsWith('video/');
                    onChangeConfig((prev) => ({
                      ...prev,
                      greenScreenBgUrl: url,
                      greenScreenBgType: isVid ? 'video' : 'image',
                      greenScreenBgName: file.name,
                      aiBgEnabled: true,
                      chromaKeyEnabled: prev.aiBgMode === 'chroma_key',
                    }));
                    setAiBgNotice(`Loaded custom background: ${file.name}`);
                    setTimeout(() => setAiBgNotice(''), 3000);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => customBgInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload Custom BG</span>
              </button>

              {!isVideo && onBakeStudioImage && (
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
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(file);
                        downloadLink.download = `ai-background-${Date.now()}.png`;
                        downloadLink.click();
                        setAiBgNotice('Photo exported with AI Background!');
                        setTimeout(() => setAiBgNotice(''), 3000);
                      }
                    } finally {
                      setBakingImage(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{bakingImage ? 'Exporting...' : 'Export Photo'}</span>
                </button>
              )}
            </div>
          </div>

          {aiBgNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span>{aiBgNotice}</span>
              <button
                type="button"
                onClick={() => setAiBgNotice('')}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mode Selector: AI Segmentation (No Green Screen) VS Chroma Key */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Detection & Cutout Mode:</span>
              </span>

              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      aiBgMode: 'ai_cutout',
                      aiBgEnabled: true,
                      chromaKeyEnabled: false,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    (config.aiBgMode || 'ai_cutout') === 'ai_cutout'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>🤖 AI Person Cutout</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      aiBgMode: 'chroma_key',
                      chromaKeyEnabled: true,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    config.aiBgMode === 'chroma_key'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-blue-300" />
                  <span>🟩 Chroma Key Screen</span>
                </button>
              </div>
            </div>

            {(config.aiBgMode || 'ai_cutout') === 'ai_cutout' ? (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                    ✓ AI Person Segmentation Active
                  </span>
                  <span className="text-slate-400">
                    Keeps face, body, clothes, hair, movements & voice 100% unchanged
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Cutout Precision:</span>
                      <span className="font-bold text-emerald-400">
                        {config.aiBgSensitivity ?? 50}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={config.aiBgSensitivity ?? 50}
                      onChange={(e) =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          aiBgSensitivity: Number(e.target.value),
                          aiBgEnabled: true,
                        }))
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Natural Edge Feathering:</span>
                      <span className="font-bold text-teal-400">
                        {config.aiBgEdgeFeather ?? 4}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={config.aiBgEdgeFeather ?? 4}
                      onChange={(e) =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          aiBgEdgeFeather: Number(e.target.value),
                          aiBgEnabled: true,
                        }))
                      }
                      className="w-full accent-teal-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Key Screen Color:</span>
                    {(
                      [
                        { id: 'green', label: '🟢 Green', color: '#10B981' },
                        { id: 'blue', label: '🔵 Blue', color: '#3B82F6' },
                        { id: 'black', label: '⚫ Dark', color: '#1F2937' },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          onChangeConfig((prev) => ({
                            ...prev,
                            chromaKeyColor: c.id,
                            chromaKeyEnabled: true,
                          }))
                        }
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                          (config.chromaKeyColor || 'green') === c.id
                            ? 'border-emerald-400 bg-emerald-500/20 text-white'
                            : 'border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <span className="text-[11px] text-slate-300 whitespace-nowrap">
                      Cutout Sensitivity: {(config.chromaKeySensitivity ?? 50)}%
                    </span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={config.chromaKeySensitivity ?? 50}
                      onChange={(e) =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          chromaKeySensitivity: Number(e.target.value),
                          chromaKeyEnabled: true,
                        }))
                      }
                      className="flex-1 accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Background Positioning, Zoom & Blur Controls (Behind Person) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Reposition, Zoom & Background Blur (Behind Person)</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    bgBlur: 0,
                    bgZoom: 1,
                    bgPositionX: 0,
                    bgPositionY: 0,
                    personScale: 1,
                    personPositionX: 0,
                    personPositionY: 0,
                  }))
                }
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Reset Position & Zoom
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Background Blur */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Background Blur:</span>
                  <span className="text-purple-400 font-bold">
                    {config.bgBlur || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={config.bgBlur || 0}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      bgBlur: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  Bokeh depth-of-field for portrait photos & videos
                </p>
              </div>

              {/* Background Zoom */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Background Zoom:</span>
                  <span className="text-blue-400 font-bold">
                    {(config.bgZoom || 1).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.05}
                  value={config.bgZoom || 1}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      bgZoom: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-blue-500"
                />
                <p className="text-[10px] text-slate-500">
                  Scale virtual environment behind person
                </p>
              </div>

              {/* Person Scale / Foreground Resize */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Person Scale (Foreground):</span>
                  <span className="text-emerald-400 font-bold">
                    {(config.personScale || 1).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={config.personScale || 1}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      personScale: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  Resize person in front of replacement scene
                </p>
              </div>

              {/* Background Pan X */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Background Pan X:</span>
                  <span className="text-cyan-400 font-bold">
                    {config.bgPositionX || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={config.bgPositionX || 0}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      bgPositionX: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Background Pan Y */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Background Pan Y:</span>
                  <span className="text-cyan-400 font-bold">
                    {config.bgPositionY || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={config.bgPositionY || 0}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      bgPositionY: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Person Position Y */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Person Placement Y:</span>
                  <span className="text-amber-400 font-bold">
                    {config.personPositionY || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={config.personPositionY || 0}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      personPositionY: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Search Chips: Exact Requested Queries */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Popular Replacement Environments (1-Tap Search):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(
                [
                  { label: '🌌 Deep Space', q: 'deep space' },
                  { label: '🌍 Top of Earth', q: 'top of Earth' },
                  { label: '⚽ Football Stadium', q: 'football stadium' },
                  { label: '🏖️ Beach', q: 'beach' },
                  { label: '🌃 New York at Night', q: 'New York at night' },
                  { label: '🌆 Cyberpunk', q: 'cyberpunk' },
                  { label: '🏢 Luxury Penthouse', q: 'penthouse' },
                  { label: '🏔️ Alpine Peak', q: 'mountain' },
                  { label: '🎙️ Podcast Studio', q: 'studio' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.q}
                  type="button"
                  onClick={() => {
                    setBgSearchQuery(chip.q);
                    setSelectedBgCategory('All');
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border ${
                    bgSearchQuery.toLowerCase() === chip.q.toLowerCase()
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Category Filter Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bgSearchQuery}
                onChange={(e) => setBgSearchQuery(e.target.value)}
                placeholder="Search replacement background, e.g. deep space, top of Earth, football stadium, beach, New York at night..."
                className="w-full bg-[#0B1021] border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {bgSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBgSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(
                [
                  'All',
                  'Nature & Travel',
                  'Studio',
                  'Luxury & City',
                  'Cyberpunk',
                  'Abstract',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedBgCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    selectedBgCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Background Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {GREEN_SCREEN_BACKGROUNDS.filter((bg) => {
              const matchesCat =
                selectedBgCategory === 'All' || bg.category === selectedBgCategory;
              const matchesSearch =
                !bgSearchQuery ||
                bg.name.toLowerCase().includes(bgSearchQuery.toLowerCase()) ||
                bg.tags.some((t) =>
                  t.toLowerCase().includes(bgSearchQuery.toLowerCase())
                );
              return matchesCat && matchesSearch;
            }).map((bg) => {
              const isSelected = config.greenScreenBgUrl === bg.url;
              return (
                <div
                  key={bg.id}
                  onClick={() => {
                    onChangeConfig((prev) => ({
                      ...prev,
                      greenScreenBgUrl: bg.url,
                      greenScreenBgType: bg.type,
                      greenScreenBgName: bg.name,
                      aiBgEnabled: true,
                      chromaKeyEnabled: prev.aiBgMode === 'chroma_key',
                    }));
                    setAiBgNotice(`Applied background: ${bg.name}`);
                    setTimeout(() => setAiBgNotice(''), 3000);
                  }}
                  className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all aspect-video bg-slate-900 ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-[1.02]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={bg.thumbUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[10px] font-bold text-white truncate drop-shadow">
                      {bg.name}
                    </span>
                    <span className="text-[9px] text-emerald-300 drop-shadow truncate">
                      {bg.category} • {bg.type === 'video' ? '🎬 Live Video' : '🖼️ 4K Scene'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Background Generator Modal */}
          {showAiBgPromptModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-white/20 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    <h3 className="text-sm font-bold text-white">
                      AI Generated Background
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiBgPromptModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Describe any background you imagine (e.g. &quot;top of Earth overlooking continents&quot;, &quot;cyberpunk football stadium in 2050&quot;, &quot;luxury Dubai penthouse with sunset&quot;):
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={aiBgPrompt}
                    onChange={(e) => setAiBgPrompt(e.target.value)}
                    placeholder="Enter what you want behind the person..."
                    className="w-full bg-[#0B1021] border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateAiBackground();
                      }
                    }}
                  />

                  {/* Suggestion pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {(
                      [
                        'Deep space nebula with purple stars',
                        'Top of Earth blue atmosphere',
                        'Packed football stadium under floodlights',
                        'Tropical beach crystal turquoise waters',
                        'New York at night glowing skyscrapers',
                      ] as const
                    ).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setAiBgPrompt(sug);
                          handleGenerateAiBackground(sug);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 hover:text-white border border-white/10"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAiBgPromptModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingAiBg || !aiBgPrompt.trim()}
                    onClick={() => handleGenerateAiBackground()}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-pink-500/20 disabled:opacity-50"
                  >
                    {isGeneratingAiBg ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Scene...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate & Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFESSIONAL TRANSITION EFFECTS LIBRARY & MULTI-CLIP JUNCTIONS */}
      {activeToolTab === 'transitions' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          {/* Header & Live Preview Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <SplitSquareHorizontal className="w-4 h-4 text-cyan-400" />
                <span>
                  Pro Transition Effects Library (Dissolve, Slide, Wipe, Iris & Glitch)
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Split clips and tap any [⚡] junction node between edited clips to assign seamless studio transitions
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleSplitClipAtPlayhead}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                <span>Split @ Playhead</span>
              </button>

              <button
                type="button"
                onClick={handleAutoSplitThreeClips}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Auto-Split 3 Clips</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const activeTr =
                    selectedTransitionClipId === 'all'
                      ? config.transitionType || 'cross_dissolve'
                      : effectiveSegments.find(
                          (s) => s.id === selectedTransitionClipId
                        )?.transitionAfter ||
                        config.transitionType ||
                        'cross_dissolve';
                  triggerStageTransitionPreview(
                    activeTr === 'none' ? 'cross_dissolve' : activeTr,
                    config.transitionDuration || 0.6
                  );
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Preview Transition</span>
              </button>
            </div>
          </div>

          {/* Interactive Multi-Clip Timeline with Transition Nodes Between Clips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Multi-Clip Timeline & Transition Junctions ({effectiveSegments.length} Clips)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTransitionClipId('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    selectedTransitionClipId === 'all'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  Apply to All Clip Cuts
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1">
              {effectiveSegments.map((seg, idx) => {
                const isLast = idx === effectiveSegments.length - 1;
                const trMeta =
                  STUDIO_TRANSITION_EFFECTS.find(
                    (e) => e.id === seg.transitionAfter
                  ) || STUDIO_TRANSITION_EFFECTS[1];
                const isJunctionSelected =
                  selectedTransitionClipId === 'all' ||
                  selectedTransitionClipId === seg.id;

                return (
                  <React.Fragment key={seg.id}>
                    {/* Clip Block */}
                    <div
                      onClick={() => {
                        if (videoElRef.current && isVideo) {
                          videoElRef.current.currentTime = seg.startTime;
                        }
                        setCurrentTime(seg.startTime);
                      }}
                      className="min-w-[115px] flex-1 p-2.5 rounded-xl bg-[#0D1326] border border-white/15 hover:border-purple-400/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-white">
                          {seg.label}
                        </span>
                        {effectiveSegments.length > 2 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMergeClipSegment(seg.id);
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-400"
                            title="Merge Clip"
                          >
                            Merge
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {seg.startTime.toFixed(1)}s – {seg.endTime.toFixed(1)}s (
                        {Math.max(0.2, seg.endTime - seg.startTime).toFixed(1)}s)
                      </p>
                    </div>

                    {/* Interactive Transition Node Between Clips */}
                    {!isLast && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTransitionClipId(seg.id);
                          triggerStageTransitionPreview(
                            seg.transitionAfter || 'cross_dissolve',
                            seg.transitionDuration ||
                              config.transitionDuration ||
                              0.6
                          );
                        }}
                        className={`shrink-0 px-2.5 py-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-w-[76px] ${
                          isJunctionSelected
                            ? 'bg-gradient-to-b from-cyan-500/30 to-purple-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                            : 'bg-white/5 border-white/15 text-slate-300 hover:text-white'
                        }`}
                        title={`Transition between ${seg.label} and Clip ${idx + 2}`}
                      >
                        <span className="text-[10px] font-extrabold text-cyan-300 tracking-tight">
                          {trMeta.badge}
                        </span>
                        <span className="text-[9px] text-slate-300 truncate max-w-[68px]">
                          {trMeta.name}
                        </span>
                        <span className="text-[9px] font-mono text-amber-300">
                          {(
                            seg.transitionDuration ||
                            config.transitionDuration ||
                            0.6
                          ).toFixed(1)}
                          s
                        </span>
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Transition Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'All',
                'Basic',
                'Slide & Push',
                'Wipe & Iris',
                'Camera & Glitch',
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTransitionCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  transitionCategory === cat
                    ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 12 Professional Transition Effects Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {STUDIO_TRANSITION_EFFECTS.filter(
              (fx) =>
                transitionCategory === 'All' ||
                fx.category === transitionCategory
            ).map((fx) => {
              const currentSelectedTr =
                selectedTransitionClipId === 'all'
                  ? config.transitionType || 'cross_dissolve'
                  : effectiveSegments.find(
                      (s) => s.id === selectedTransitionClipId
                    )?.transitionAfter ||
                    config.transitionType ||
                    'cross_dissolve';
              const isSelected = currentSelectedTr === fx.id;

              return (
                <button
                  key={fx.id}
                  type="button"
                  onClick={() => handleSelectTransitionEffect(fx.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-500/25 via-purple-600/25 to-blue-600/25 border-cyan-400 text-white shadow-[0_0_18px_rgba(34,211,238,0.2)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/15 text-[10px] font-extrabold text-cyan-300 tracking-wider">
                      {fx.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {fx.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      {fx.name}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                      {fx.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Transition Timing, Easing Curve & Sound SFX Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Transition Duration</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {(config.transitionDuration || 0.6).toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={2.0}
                step={0.1}
                value={config.transitionDuration || 0.6}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeConfig((prev) => ({
                    ...prev,
                    transitionDuration: val,
                    clipSegments: effectiveSegments.map((s) =>
                      selectedTransitionClipId === 'all' ||
                      s.id === selectedTransitionClipId
                        ? { ...s, transitionDuration: val }
                        : s
                    ),
                  }));
                }}
                className="w-full accent-cyan-500"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { d: 0.3, label: '0.3s Fast' },
                  { d: 0.6, label: '0.6s Standard' },
                  { d: 1.0, label: '1.0s Smooth' },
                  { d: 1.5, label: '1.5s Cinema' },
                ].map((preset) => (
                  <button
                    key={preset.d}
                    type="button"
                    onClick={() => {
                      onChangeConfig((prev) => ({
                        ...prev,
                        transitionDuration: preset.d,
                        clipSegments: effectiveSegments.map((s) => ({
                          ...s,
                          transitionDuration: preset.d,
                        })),
                      }));
                      triggerStageTransitionPreview(
                        config.transitionType || 'cross_dissolve',
                        preset.d
                      );
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                      Math.abs((config.transitionDuration || 0.6) - preset.d) <
                      0.05
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="block text-[11px] text-slate-300 mb-1">
                  Transition Curve & Audio Whoosh SFX
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'ease_in_out', label: 'Smooth Ease' },
                      { id: 'linear', label: 'Linear' },
                      { id: 'snap_bounce', label: 'Whip Snap' },
                    ] as const
                  ).map((curve) => (
                    <button
                      key={curve.id}
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          transitionEasing: curve.id,
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
                        (config.transitionEasing || 'ease_in_out') === curve.id
                          ? 'bg-purple-600/30 border-purple-400 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {curve.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      onChangeConfig((prev) => ({
                        ...prev,
                        transitionSoundSfx:
                          prev.transitionSoundSfx === false ? true : false,
                      }))
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1 ${
                      config.transitionSoundSfx !== false
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>
                      Whoosh SFX:{' '}
                      {config.transitionSoundSfx !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOUND CUTTING & AUDIO LOOPS (Works for BOTH Video and Photo!) */}
      {activeToolTab === 'sound' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music className="w-4 h-4 text-pink-400" />
                <span>Sound Cutter, Beat Loops & Audio Mixer</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Cut any sound segment, loop beats seamlessly, or upload custom audio for your video or photo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => customAudioInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {config.customAudioName
                    ? `Audio: ${config.customAudioName.slice(0, 14)}...`
                    : 'Import Audio File'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  isSoundPlaying ? stopSoundPreview() : startSoundPreview()
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow ${
                  isSoundPlaying
                    ? 'bg-rose-600 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                }`}
              >
                {isSoundPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Loop ({soundPlayhead.toFixed(1)}s)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Preview Cut Sound</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Built-in Studio Sound Loops */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STUDIO_BUILTIN_SOUNDS.map((snd) => {
              const isSelected = config.soundTrackId === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => {
                    onChangeConfig((prev) => ({
                      ...prev,
                      soundTrackId: snd.id,
                      customAudioUrl: '',
                      customAudioName: '',
                      soundDuration: snd.duration,
                      soundTrimStart: 0,
                      soundTrimEnd: Math.min(snd.duration, 12),
                    }));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-purple-600/25 border-pink-400 text-white shadow'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">
                      {snd.name}
                    </span>
                    <span className="text-[10px] font-mono text-pink-300">
                      {snd.bpm} BPM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {snd.genre} • {snd.duration}s
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive Sound Cutting Waveform & Trim Sliders */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-pink-400" />
                <span>Sound Cutting Window (Audio Trim & Loop)</span>
              </span>
              <span className="text-[11px] font-mono text-pink-300">
                {(config.soundTrimStart ?? 0).toFixed(1)}s –{' '}
                {(config.soundTrimEnd ?? 12).toFixed(1)}s (
                {Math.max(
                  0.5,
                  (config.soundTrimEnd ?? 12) - (config.soundTrimStart ?? 0)
                ).toFixed(1)}
                s loop)
              </span>
            </div>

            {/* Waveform Bar */}
            {(() => {
              const maxSnd = Math.max(2, config.soundDuration || 20);
              const sStart = config.soundTrimStart ?? 0;
              const sEnd = Math.max(sStart + 0.5, config.soundTrimEnd ?? 12);
              const leftPct = Math.min(100, (sStart / maxSnd) * 100);
              const widthPct = Math.max(
                4,
                Math.min(100 - leftPct, ((sEnd - sStart) / maxSnd) * 100)
              );
              const headPct = Math.min(100, (soundPlayhead / maxSnd) * 100);

              return (
                <div className="relative h-12 rounded-xl bg-[#0D1326] border border-white/15 overflow-hidden flex items-center px-2">
                  <div className="w-full flex items-center justify-between gap-0.5 opacity-45 pointer-events-none">
                    {Array.from({ length: 36 }).map((_, i) => {
                      const barH = 25 + ((i * 19) % 65);
                      return (
                        <div
                          key={i}
                          style={{ height: `${barH}%` }}
                          className="w-1 rounded-full bg-gradient-to-t from-purple-400 to-pink-400"
                        />
                      );
                    })}
                  </div>
                  <div
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className="absolute top-1 bottom-1 bg-pink-500/25 border-x-4 border-pink-400 rounded-lg pointer-events-none"
                  />
                  {isSoundPlaying && (
                    <div
                      style={{ left: `${headPct}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow pointer-events-none"
                    />
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Sound Cut Start (In)</span>
                  <span className="font-mono text-pink-400">
                    {(config.soundTrimStart ?? 0).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.5, (config.soundTrimEnd ?? 12) - 0.5)}
                  step={0.1}
                  value={config.soundTrimStart ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChangeConfig((prev) => ({
                      ...prev,
                      soundTrimStart: Math.min(
                        val,
                        (prev.soundTrimEnd ?? 12) - 0.5
                      ),
                    }));
                  }}
                  className="w-full accent-pink-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Sound Cut End (Out)</span>
                  <span className="font-mono text-purple-400">
                    {(config.soundTrimEnd ?? 12).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={(config.soundTrimStart ?? 0) + 0.5}
                  max={Math.max(2, config.soundDuration || 20)}
                  step={0.1}
                  value={config.soundTrimEnd ?? 12}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChangeConfig((prev) => ({
                      ...prev,
                      soundTrimEnd: Math.max(
                        val,
                        (prev.soundTrimStart ?? 0) + 0.5
                      ),
                    }));
                  }}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            {/* Sound Loop Toggle, Audio Speed & Sound FX */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      soundLoop: prev.soundLoop === false ? true : false,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                    config.soundLoop !== false
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>
                    Loop Cut Sound:{' '}
                    {config.soundLoop !== false ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      soundFadeIn: !prev.soundFadeIn,
                      soundFadeOut: !prev.soundFadeOut,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    config.soundFadeIn
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  Fade In/Out: {config.soundFadeIn ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 mr-1">
                  Beat Speed:
                </span>
                {[0.75, 1, 1.25, 1.5].map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() =>
                      onChangeConfig((prev) => ({
                        ...prev,
                        soundSpeed: sp,
                      }))
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                      (config.soundSpeed || 1) === sp
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

            {/* Sound FX / EQ Presets */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <span className="text-[11px] text-slate-400 block">
                Sound Voice & Beat FX:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                {(
                  [
                    { id: 'original', label: 'Original' },
                    { id: 'bass_boost', label: '808 Bass Boost' },
                    { id: 'slowed_reverb', label: 'Slowed + Reverb' },
                    { id: 'nightcore', label: 'Nightcore Pitch' },
                    { id: 'vocal_clarity', label: 'Vocal Crisp' },
                    { id: 'radio_lofi', label: 'Vinyl Lo-Fi' },
                  ] as const
                ).map((fx) => (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig((prev) => ({
                        ...prev,
                        soundEffect: fx.id,
                      }))
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${
                      (config.soundEffect || 'original') === fx.id
                        ? 'bg-pink-500/25 border-pink-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {fx.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Volume Mixer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Added Sound Loop Volume</span>
                  <span className="font-mono text-pink-400">
                    {config.soundVolume ?? 85}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.soundVolume ?? 85}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      soundVolume: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-pink-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Original Clip Volume</span>
                  <span className="font-mono text-blue-400">
                    {config.muteAudio ? 'Muted (0%)' : `${config.clipVolume ?? 100}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.muteAudio ? 0 : (config.clipVolume ?? 100)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onChangeConfig((prev) => ({
                      ...prev,
                      muteAudio: val === 0,
                      clipVolume: val,
                    }));
                  }}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STICKERS & BADGES */}
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

      {/* TAB 4: 52 FONTS, SPEECH TO TEXT & OVERLAYS */}
      {activeToolTab === 'text' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          {/* 1. Speech-to-Text Transcribe Section */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 border border-blue-500/25 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-blue-400" />
                  <span>Speech-to-Text: Spoken Voice → Live Synced Captions</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Tap to speak: all you say in the audio is automatically transcribed and displayed on the video
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleSpeechToText}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md ${
                  isRecordingSpeech
                    ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
                }`}
              >
                {isRecordingSpeech ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening... Tap to Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Choose Speech-to-Text</span>
                  </>
                )}
              </button>
            </div>

            {speechTranscript && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white flex items-center justify-between gap-2">
                <span className="truncate">🗣️ &quot;{speechTranscript}&quot;</span>
                <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                  ✓ Displayed on Video
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTextValue}
              onChange={(e) => setNewTextValue(e.target.value)}
              placeholder="Write text to place on your video or photo..."
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

          {/* 2. 52 Font Styles, Colours & Design Gallery */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>52 Pro Font Styles, Colors & Preset Designs</span>
              </span>
              <span className="text-[10px] text-purple-300 font-semibold">
                Tap any design to apply to text overlay
              </span>
            </div>

            {/* Category Filter for 52 Styles */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(
                [
                  'All',
                  'Viral & Subtitles',
                  'Neon & Glow',
                  'Luxury & Metallic',
                  'Retro & Comic',
                  'Urban & Modern',
                  'Aesthetic & Nature',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFontCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    selectedFontCategory === cat
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 52 Font Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {FONT_STYLES_52.filter(
                (p) =>
                  selectedFontCategory === 'All' ||
                  p.category === selectedFontCategory
              ).map((preset) => {
                const isSelected = selectedFontPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedFontPresetId(preset.id);
                      onChangeConfig((prev) => {
                        const targetText = activeText || prev.texts[0];
                        if (targetText) {
                          return {
                            ...prev,
                            activeFontStyleId: preset.id,
                            texts: prev.texts.map((t) =>
                              t.id === targetText.id
                                ? {
                                    ...t,
                                    fontStyleId: preset.id,
                                    color: preset.textColor,
                                  }
                                : t
                            ),
                          };
                        } else {
                          return {
                            ...prev,
                            activeFontStyleId: preset.id,
                            texts: [
                              ...prev.texts,
                              {
                                id: `tx_${Date.now()}`,
                                text: newTextValue.trim() || 'BoostHub Vibes ✨',
                                fontFamily: 'display',
                                fontStyleId: preset.id,
                                color: preset.textColor,
                                bgStyle: 'glass',
                                x: 50,
                                y: 50,
                                scale: 1.1,
                                rotation: 0,
                              },
                            ],
                          };
                        }
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[64px] bg-[#0E1428] ${
                      isSelected
                        ? 'border-purple-400 ring-2 ring-purple-500/50 scale-[1.02]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="text-slate-400 truncate">{preset.category}</span>
                      <span className="px-1.5 py-0.2 rounded bg-white/10 font-bold text-amber-300">
                        {preset.badge}
                      </span>
                    </div>

                    <div
                      style={{
                        ...preset.style,
                        fontSize: '12px',
                        lineHeight: 1.2,
                        padding: '2px 4px',
                      }}
                      className="truncate text-center my-auto"
                    >
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">

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
                    <span>Resize Overlay (Scale)</span>
                    <span className="font-mono text-blue-400">
                      {activeText.scale.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === activeText.id
                              ? { ...t, scale: Math.max(0.4, Number((t.scale - 0.1).toFixed(1))) }
                              : t
                          ),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
                      title="Make Smaller"
                    >
                      –
                    </button>
                    <input
                      type="range"
                      min={0.4}
                      max={3.0}
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
                      className="flex-1 accent-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === activeText.id
                              ? { ...t, scale: Math.min(3.0, Number((t.scale + 0.1).toFixed(1))) }
                              : t
                          ),
                        }))
                      }
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
                      title="Make Bigger"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Quick Align Overlay</span>
                    <span className="text-[10px] text-slate-400">Top / Center / Bottom</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === activeText.id ? { ...t, x: 50, y: 15 } : t
                          ),
                        }))
                      }
                      className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200"
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === activeText.id ? { ...t, x: 50, y: 50 } : t
                          ),
                        }))
                      }
                      className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === activeText.id ? { ...t, x: 50, y: 82 } : t
                          ),
                        }))
                      }
                      className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-200"
                    >
                      Bottom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {config.texts.length > 0 && !activeText && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {config.texts.length} text layer(s) on stage
              </span>
              <button
                type="button"
                onClick={() => {
                  onChangeConfig((prev) => ({ ...prev, texts: [] }));
                  setSelectedLayer(null);
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear All Text Overlays
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FILTERS, COLOR GRADING & VFX OVERLAYS (Works for BOTH Video and Photo!) */}
      {activeToolTab === 'filters' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <div>
            <p className="text-xs font-bold text-white mb-2">
              Studio LUT Filter Presets
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

          {/* Live VFX Overlays */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Studio VFX & Cinema Overlays (Video & Photo)</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
              {(
                [
                  { id: 'none', label: 'Clean' },
                  { id: 'vhs_glitch', label: 'VHS Glitch' },
                  { id: 'cinema_bars', label: '2.35:1 Cinema' },
                  { id: 'neon_frame', label: 'Neon Border' },
                  { id: 'light_leak', label: 'Light Leak' },
                  { id: 'sparkle_dust', label: 'Starlight' },
                ] as const
              ).map((vfx) => (
                <button
                  key={vfx.id}
                  type="button"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      vfxOverlay: vfx.id,
                    }))
                  }
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                    (config.vfxOverlay || 'none') === vfx.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {vfx.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6 Pro Color & Lens Sliders */}
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

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Warmth / Gold Tone</span>
                <span>{config.warmth ?? 0}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={config.warmth ?? 0}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    warmth: Number(e.target.value),
                  }))
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Hue Shift</span>
                <span>{config.hueRotate ?? 0}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={config.hueRotate ?? 0}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    hueRotate: Number(e.target.value),
                  }))
                }
                className="w-full accent-pink-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Vignette Lens</span>
                <span>{config.vignette ?? 0}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={config.vignette ?? 0}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    vignette: Number(e.target.value),
                  }))
                }
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optional Bake / Flatten Action for Photos or Standalone Studio Graphics */}
      {!isVideo && onBakeStudioImage && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400">
            Your stickers, text overlays, crop, VFX & color grading will be baked into your photo when you publish or save snapshot.
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
