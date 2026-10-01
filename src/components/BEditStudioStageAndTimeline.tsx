import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Scissors,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Zap,
  Music,
  Subtitles,
  Layers,
  Upload,
} from 'lucide-react';
import {
  BEditProjectState,
  BEditTimelineClip,
  BOOSTHUB_MAX_VIDEO_SECONDS,
  getClipEffectiveDuration,
  getProjectTotalDuration,
} from './bEditStudioTypes';
import {
  buildCssFilterString,
  getFontFamilyCss,
  STUDIO_TRANSITION_EFFECTS,
  StudioTransitionType,
} from './StudioMediaEditor';

interface BEditStudioStageAndTimelineProps {
  project: BEditProjectState;
  activeClipIndex: number;
  onSelectClipIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  timelineTime: number;
  onSeekTimeline: (seconds: number) => void;
  selectedOverlay: { type: 'sticker' | 'text' | 'pip'; id: string } | null;
  onSelectOverlay: (
    sel: { type: 'sticker' | 'text' | 'pip'; id: string } | null
  ) => void;
  onUpdateOverlayPosition: (
    type: 'sticker' | 'text' | 'pip',
    id: string,
    x: number,
    y: number
  ) => void;
  onSplitActiveClip: () => void;
  onDeleteActiveClip: () => void;
  onMoveActiveClip: (dir: -1 | 1) => void;
  onToggleMuteActiveClip: () => void;
  onTriggerAddMedia: () => void;
  onOpenTransitionPickerForClip: (clipIndex: number) => void;
  activeTransitionAnim: {
    type: StudioTransitionType;
    progress: number;
    label: string;
  } | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  onVideoLoadedMetadata: (duration: number) => void;
  onVideoTimeUpdate: (clipLocalTime: number) => void;
  onVideoEnded: () => void;
}

export const BEditStudioStageAndTimeline: React.FC<
  BEditStudioStageAndTimelineProps
> = ({
  project,
  activeClipIndex,
  onSelectClipIndex,
  isPlaying,
  onTogglePlay,
  timelineTime,
  onSeekTimeline,
  selectedOverlay,
  onSelectOverlay,
  onUpdateOverlayPosition,
  onSplitActiveClip,
  onDeleteActiveClip,
  onMoveActiveClip,
  onToggleMuteActiveClip,
  onTriggerAddMedia,
  onOpenTransitionPickerForClip,
  activeTransitionAnim,
  videoRef,
  imageRef,
  onVideoLoadedMetadata,
  onVideoTimeUpdate,
  onVideoEnded,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const chromaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragging, setDragging] = useState<{
    type: 'sticker' | 'text' | 'pip';
    id: string;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeClip: BEditTimelineClip | undefined =
    project.clips[activeClipIndex] || project.clips[0];

  const totalDuration = getProjectTotalDuration(project);

  // Real-time Green-Screen / Chroma Key pixel processing onto canvas when enabled
  useEffect(() => {
    if (!activeClip?.chromaKeyEnabled || !chromaCanvasRef.current) return;
    let rafId = 0;
    const canvas = chromaCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const renderChromaFrame = () => {
      if (!ctx) return;
      const srcEl =
        activeClip.type === 'video' ? videoRef.current : imageRef.current;
      if (srcEl) {
        const w = 360;
        const h = 640;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        try {
          ctx.drawImage(srcEl, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);
          const data = frame.data;
          const threshold = (activeClip.chromaKeySensitivity || 45) * 2.2;
          const keyColor = activeClip.chromaKeyColor || 'green';

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (
              keyColor === 'green' &&
              g > 90 &&
              g - Math.max(r, b) > 120 - threshold
            ) {
              data[i + 3] = 0;
            } else if (
              keyColor === 'blue' &&
              b > 90 &&
              b - Math.max(r, g) > 120 - threshold
            ) {
              data[i + 3] = 0;
            } else if (
              keyColor === 'black' &&
              r < threshold &&
              g < threshold &&
              b < threshold
            ) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(frame, 0, 0);
        } catch {
          // ignore cross-origin taint if external
        }
      }
      rafId = window.requestAnimationFrame(renderChromaFrame);
    };

    rafId = window.requestAnimationFrame(renderChromaFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    activeClip?.chromaKeyEnabled,
    activeClip?.chromaKeyColor,
    activeClip?.chromaKeySensitivity,
    activeClip?.type,
    activeClip?.url,
    isPlaying,
  ]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = Math.min(
      92,
      Math.max(8, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const yPct = Math.min(
      92,
      Math.max(8, ((e.clientY - rect.top) / rect.height) * 100)
    );
    onUpdateOverlayPosition(dragging.type, dragging.id, xPct, yPct);
  };

  const toggleFullscreenPreview = () => {
    setIsFullscreen((prev) => !prev);
  };

  const aspectClass =
    project.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[340px] sm:max-h-[390px]'
      : project.aspectRatio === '1:1'
        ? 'aspect-square max-h-[320px]'
        : project.aspectRatio === '4:5'
          ? 'aspect-[4/5] max-h-[340px]'
          : 'aspect-video max-h-[280px]';

  // Compute transition styles when crossing between clips
  const getTransitionStyle = (): React.CSSProperties => {
    if (!activeTransitionAnim) return {};
    const { type, progress } = activeTransitionAnim;
    const isOut = progress < 0.5;
    const halfP = isOut ? progress * 2 : (progress - 0.5) * 2;

    switch (type) {
      case 'cross_dissolve':
        return { opacity: isOut ? 1 - halfP * 0.75 : 0.25 + halfP * 0.75 };
      case 'slide_left':
        return {
          transform: `translateX(${(isOut ? -halfP * 100 : (1 - halfP) * 100).toFixed(1)}%)`,
        };
      case 'slide_right':
        return {
          transform: `translateX(${(isOut ? halfP * 100 : -(1 - halfP) * 100).toFixed(1)}%)`,
        };
      case 'slide_up':
        return {
          transform: `translateY(${(isOut ? -halfP * 100 : (1 - halfP) * 100).toFixed(1)}%)`,
        };
      case 'wipe_right':
        return {
          clipPath: `inset(0 ${Math.max(0, 100 - progress * 100).toFixed(1)}% 0 0)`,
        };
      case 'wipe_clock':
        return {
          clipPath: `circle(${Math.max(4, progress * 115).toFixed(1)}% at 50% 50%)`,
        };
      case 'zoom_in': {
        const z = isOut ? 1 + halfP * 1.2 : 2.2 - halfP * 1.2;
        return { transform: `scale(${z.toFixed(2)})` };
      }
      case 'spin_whirl':
        return {
          transform: `rotate(${(progress * 360).toFixed(0)}deg) scale(${(
            1 -
            Math.sin(progress * Math.PI) * 0.3
          ).toFixed(2)})`,
        };
      default:
        return {};
    }
  };

  const activeSubtitleCue = project.subtitles.find(
    (c) => timelineTime >= c.startTime && timelineTime <= c.endTime
  );

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#05070E] flex flex-col justify-between p-3'
          : 'space-y-2.5'
      }
    >
      {/* 1. VIDEO PREVIEW STAGE AT THE TOP */}
      <div className="relative bg-[#080B14] rounded-2xl border border-white/10 p-2.5 flex flex-col items-center justify-center overflow-hidden">
        {/* Aspect Ratio Badge & Fullscreen Toggle */}
        <div className="w-full flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-200">
              {project.aspectRatio}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {activeClip
                ? `${activeClip.name} (${activeClip.speed}x${
                    activeClip.reversed ? ' · Reversed' : ''
                  })`
                : 'No clip loaded'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreenPreview}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Stage Viewport */}
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
          style={{ backgroundColor: project.canvasBgColor || '#090D1A' }}
          className={`relative w-full ${
            isFullscreen ? 'flex-1 max-h-[72vh]' : aspectClass
          } rounded-xl overflow-hidden flex items-center justify-center select-none touch-none border border-white/10`}
        >
          {activeClip && activeClip.url ? (
            <div
              style={getTransitionStyle()}
              className="w-full h-full flex items-center justify-center transition-transform duration-75"
            >
              {activeClip.type === 'video' ? (
                <video
                  ref={videoRef as React.RefObject<HTMLVideoElement>}
                  src={activeClip.url.split('#')[0]}
                  playsInline
                  muted={activeClip.muted}
                  onLoadedMetadata={(e) =>
                    onVideoLoadedMetadata(e.currentTarget.duration || 10)
                  }
                  onTimeUpdate={(e) =>
                    onVideoTimeUpdate(e.currentTarget.currentTime)
                  }
                  onEnded={onVideoEnded}
                  onClick={onTogglePlay}
                  style={{
                    filter: buildCssFilterString({
                      filterPreset: activeClip.filterPreset,
                      brightness: activeClip.brightness,
                      contrast: activeClip.contrast,
                      saturation: activeClip.saturation,
                      exposure: activeClip.exposure,
                    }),
                    transform: `translate(${activeClip.cropX}%, ${activeClip.cropY}%) rotate(${activeClip.rotation}deg) scale(${
                      activeClip.cropZoom * (activeClip.flipH ? -1 : 1)
                    }, ${activeClip.cropZoom * (activeClip.flipV ? -1 : 1)})`,
                    opacity: activeClip.chromaKeyEnabled ? 0 : 1,
                  }}
                  className="w-full h-full object-contain cursor-pointer"
                />
              ) : (
                <img
                  ref={imageRef as React.RefObject<HTMLImageElement>}
                  src={activeClip.url}
                  alt={activeClip.name}
                  onClick={onTogglePlay}
                  style={{
                    filter: buildCssFilterString({
                      filterPreset: activeClip.filterPreset,
                      brightness: activeClip.brightness,
                      contrast: activeClip.contrast,
                      saturation: activeClip.saturation,
                      exposure: activeClip.exposure,
                    }),
                    transform: `translate(${activeClip.cropX}%, ${activeClip.cropY}%) rotate(${activeClip.rotation}deg) scale(${
                      activeClip.cropZoom * (activeClip.flipH ? -1 : 1)
                    }, ${activeClip.cropZoom * (activeClip.flipV ? -1 : 1)})`,
                    opacity: activeClip.chromaKeyEnabled ? 0 : 1,
                  }}
                  className="w-full h-full object-contain cursor-pointer"
                />
              )}

              {/* Live Chroma-Key Green Screen Canvas */}
              {activeClip.chromaKeyEnabled && (
                <canvas
                  ref={chromaCanvasRef}
                  onClick={onTogglePlay}
                  className="absolute inset-0 w-full h-full object-contain cursor-pointer z-10"
                />
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onTriggerAddMedia}
              className="flex flex-col items-center justify-center gap-2.5 p-6 text-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#4A90E2]/20 border border-[#4A90E2]/40 flex items-center justify-center text-[#4A90E2] group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Tap to Upload Video or Photo
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Import from your phone gallery to start editing
                </p>
              </div>
            </button>
          )}

          {/* Live Transition Curtain Overlays */}
          {activeTransitionAnim && (
            <>
              {activeTransitionAnim.type === 'fade_black' && (
                <div
                  className="pointer-events-none absolute inset-0 bg-black z-20"
                  style={{
                    opacity: Math.sin(activeTransitionAnim.progress * Math.PI),
                  }}
                />
              )}
              {activeTransitionAnim.type === 'flash_white' && (
                <div
                  className="pointer-events-none absolute inset-0 bg-white z-20"
                  style={{
                    opacity: Math.sin(activeTransitionAnim.progress * Math.PI),
                  }}
                />
              )}
              {activeTransitionAnim.type === 'glitch_rgb' && (
                <div className="pointer-events-none absolute inset-0 z-20 mix-blend-screen bg-gradient-to-r from-cyan-500/40 via-transparent to-rose-500/40" />
              )}
            </>
          )}

          {/* VFX Overlays */}
          {activeClip?.vfxOverlay === 'cinema_bars' && (
            <>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-[9%] bg-black z-15" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[9%] bg-black z-15" />
            </>
          )}
          {activeClip?.vfxOverlay === 'neon_frame' && (
            <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-cyan-400 shadow-[inset_0_0_20px_rgba(34,211,238,0.5)] z-15" />
          )}
          {activeClip?.vfxOverlay === 'light_leak' && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/35 via-rose-500/15 to-transparent mix-blend-screen z-15" />
          )}
          {activeClip?.vfxOverlay === 'vhs_glitch' && (
            <div className="pointer-events-none absolute inset-0 z-15 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px]" />
          )}
          {activeClip?.vfxOverlay === 'sparkle_dust' && (
            <div className="pointer-events-none absolute inset-0 z-15 flex items-center justify-around opacity-75 text-xl">
              <span className="animate-pulse">✨</span>
              <span className="animate-bounce">✦</span>
              <span className="animate-pulse">⭐</span>
            </div>
          )}

          {/* Picture-in-Picture (PiP) / Photo-over-Video Overlay */}
          {project.pipLayer && (
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelectOverlay({ type: 'pip', id: project.pipLayer!.id });
                setDragging({ type: 'pip', id: project.pipLayer!.id });
              }}
              style={{
                left: `${project.pipLayer.x}%`,
                top: `${project.pipLayer.y}%`,
                transform: `translate(-50%, -50%) scale(${project.pipLayer.scale})`,
              }}
              className={`absolute w-24 sm:w-28 aspect-[4/5] rounded-xl overflow-hidden border-2 shadow-2xl cursor-grab active:cursor-grabbing z-25 ${
                selectedOverlay?.type === 'pip'
                  ? 'border-[#4A90E2] ring-2 ring-[#4A90E2]/50'
                  : 'border-white/60'
              }`}
            >
              {project.pipLayer.type === 'video' ? (
                <video
                  src={project.pipLayer.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <img
                  src={project.pipLayer.url}
                  alt="PiP Overlay"
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}
            </div>
          )}

          {/* Stickers Layer */}
          {project.stickers.map((st) => {
            const isSel =
              selectedOverlay?.type === 'sticker' &&
              selectedOverlay.id === st.id;
            return (
              <div
                key={st.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectOverlay({ type: 'sticker', id: st.id });
                  setDragging({ type: 'sticker', id: st.id });
                }}
                style={{
                  left: `${st.x}%`,
                  top: `${st.y}%`,
                  transform: `translate(-50%, -50%) scale(${st.scale}) rotate(${st.rotation}deg)`,
                }}
                className={`absolute cursor-grab active:cursor-grabbing z-25 ${
                  isSel ? 'ring-2 ring-[#4A90E2] rounded-xl p-1' : ''
                }`}
              >
                {st.isBadge ? (
                  <div
                    className={`px-3 py-1 rounded-xl bg-gradient-to-r ${
                      st.badgeColor || 'from-blue-600 to-purple-600'
                    } text-white font-extrabold text-xs shadow-lg border border-white/30 whitespace-nowrap`}
                  >
                    {st.content}
                  </div>
                ) : (
                  <span className="text-4xl drop-shadow-xl block leading-none">
                    {st.content}
                  </span>
                )}
              </div>
            );
          })}

          {/* Animated Text Overlays */}
          {project.texts.map((tx) => {
            const isSel =
              selectedOverlay?.type === 'text' && selectedOverlay.id === tx.id;
            const animClass =
              tx.animation === 'pulse_neon'
                ? 'animate-pulse'
                : tx.animation === 'bounce_in'
                  ? 'animate-bounce'
                  : '';
            const visibleChars =
              tx.animation === 'typewriter'
                ? Math.max(
                    1,
                    Math.floor(
                      (((timelineTime || 1) % 3) / 2.2) * tx.text.length
                    )
                  )
                : tx.text.length;

            return (
              <div
                key={tx.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelectOverlay({ type: 'text', id: tx.id });
                  setDragging({ type: 'text', id: tx.id });
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
                      : '0 2px 8px rgba(0,0,0,0.85)',
                }}
                className={`absolute cursor-grab active:cursor-grabbing z-25 font-extrabold text-base text-center whitespace-pre-wrap max-w-[240px] ${animClass} ${
                  tx.bgStyle === 'pill'
                    ? 'px-3 py-1.5 rounded-xl bg-[#0F172A] border border-white/20'
                    : tx.bgStyle === 'glass'
                      ? 'px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15'
                      : tx.bgStyle === 'neon'
                        ? 'px-3 py-1.5 rounded-xl bg-purple-950/80 border-2'
                        : ''
                } ${isSel ? 'ring-2 ring-[#4A90E2]' : ''}`}
              >
                {tx.text.slice(0, visibleChars)}
              </div>
            );
          })}

          {/* Auto Captions / Subtitles Overlay */}
          {activeSubtitleCue && (
            <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex justify-center z-30">
              <div className="px-3.5 py-1.5 rounded-xl bg-black/85 border border-amber-400/40 text-amber-300 font-extrabold text-xs sm:text-sm text-center shadow-xl">
                {activeSubtitleCue.text}
              </div>
            </div>
          )}
        </div>

        {/* Transport & Quick Clip Action Bar Directly Below Preview */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] text-white flex items-center justify-center shadow transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="font-mono tabular-nums text-xs">
              <span className="text-white font-bold">
                {timelineTime.toFixed(1)}s
              </span>
              <span className="text-slate-500"> / </span>
              <span
                className={
                  totalDuration > BOOSTHUB_MAX_VIDEO_SECONDS
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-300'
                }
              >
                {totalDuration.toFixed(1)}s
              </span>
              <span className="text-[10px] text-slate-500 ml-1">
                (Max {BOOSTHUB_MAX_VIDEO_SECONDS}s)
              </span>
            </div>
          </div>

          {/* Quick Clip Actions: Split, Delete, Rearrange, Mute */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onSplitActiveClip}
              disabled={!activeClip}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-white inline-flex items-center gap-1"
              title="Split clip at playhead"
            >
              <Scissors className="w-3.5 h-3.5 text-cyan-400" />
              <span>Split</span>
            </button>

            <button
              type="button"
              onClick={() => onMoveActiveClip(-1)}
              disabled={activeClipIndex <= 0}
              className="min-h-[38px] px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-slate-200"
              title="Move clip earlier"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onMoveActiveClip(1)}
              disabled={activeClipIndex >= project.clips.length - 1}
              className="min-h-[38px] px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-slate-200"
              title="Move clip later"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleMuteActiveClip}
              disabled={!activeClip}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs text-slate-200 inline-flex items-center gap-1"
              title={activeClip?.muted ? 'Unmute Clip' : 'Mute Clip'}
            >
              {activeClip?.muted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={onDeleteActiveClip}
              disabled={project.clips.length === 0}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 text-xs font-semibold text-rose-300 inline-flex items-center gap-1"
              title="Delete selected clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE MULTI-TRACK TIMELINE DIRECTLY BELOW PREVIEW */}
      <div className="bg-[#0B0F1C] rounded-2xl border border-white/10 p-3 space-y-2.5">
        {/* Timeline Playhead Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tabular-nums text-slate-400 w-10">
            {timelineTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, totalDuration)}
            step={0.1}
            value={Math.min(timelineTime, Math.max(1, totalDuration))}
            onChange={(e) => onSeekTimeline(Number(e.target.value))}
            className="flex-1 accent-[#4A90E2] h-1.5 cursor-pointer"
          />
          <span className="text-[11px] font-mono tabular-nums text-slate-400 w-10 text-right">
            {totalDuration.toFixed(1)}s
          </span>
        </div>

        {/* Multi-Clip Video/Photo Track + [+] Add Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5">
          {project.clips.map((clip, idx) => {
            const isSelected = idx === activeClipIndex;
            const effDur = getClipEffectiveDuration(clip);
            const trMeta =
              STUDIO_TRANSITION_EFFECTS.find(
                (t) => t.id === clip.transitionAfter
              ) || STUDIO_TRANSITION_EFFECTS[0];

            return (
              <React.Fragment key={clip.id}>
                <button
                  type="button"
                  onClick={() => onSelectClipIndex(idx)}
                  className={`min-w-[112px] p-2.5 rounded-xl border text-left transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#4A90E2]/20 border-[#4A90E2] text-white shadow'
                      : 'bg-[#13192B] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate max-w-[75px]">
                      {idx + 1}. {clip.name}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-blue-300">
                      {effDur.toFixed(1)}s
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <span>{clip.type === 'video' ? 'Video' : 'Photo'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{clip.speed}x</span>
                    {clip.reversed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300">Rev</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Transition Junction Button Between Clips */}
                {idx < project.clips.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onOpenTransitionPickerForClip(idx)}
                    className="h-11 px-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/15 hover:border-cyan-400 text-cyan-300 flex flex-col items-center justify-center shrink-0 transition-colors"
                    title="Change transition between clips"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-[9px] font-bold tracking-tight">
                      {trMeta.badge}
                    </span>
                  </button>
                )}
              </React.Fragment>
            );
          })}

          {/* [+] Add Video/Photo Clip Button */}
          <button
            type="button"
            onClick={onTriggerAddMedia}
            className="h-14 px-3.5 rounded-xl bg-[#4A90E2]/15 hover:bg-[#4A90E2]/25 border border-dashed border-[#4A90E2]/60 text-[#4A90E2] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clip</span>
          </button>
        </div>

        {/* Compact Secondary Track Indicators (Audio, Voice Cover, Captions, PiP) */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-white/5">
          <span className="inline-flex items-center gap-1">
            <Music className="w-3 h-3 text-pink-400" />
            <span>
              Audio:{' '}
              {project.customAudioName
                ? project.customAudioName.slice(0, 18)
                : project.soundTrackId !== 'none'
                  ? project.soundTrackId.replace('_', ' ')
                  : 'Original Clip Audio'}
            </span>
          </span>
          {project.voiceoverAudioUrl && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                <Volume2 className="w-3 h-3" />
                <span>
                  Voice: {project.voiceoverName || 'Voice Cover'} (
                  {project.voicePresetId && project.voicePresetId !== 'original'
                    ? project.voicePresetId.replace(/_/g, ' ')
                    : 'Original'}
                  )
                </span>
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Subtitles className="w-3 h-3 text-amber-400" />
            <span>
              Captions: {project.subtitles.length} cues · Text:{' '}
              {project.texts.length}
            </span>
          </span>
          {project.pipLayer && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-cyan-300">
                <Layers className="w-3 h-3" />
                <span>PiP Overlay Active</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
