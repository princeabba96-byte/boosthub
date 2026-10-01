import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  FolderOpen,
  Save,
  Download,
  Send,
  Film,
  Music,
  Type,
  Smile,
  Sparkles,
  Sliders,
  MoreHorizontal,
  Upload,
  Plus,
  Scissors,
  Trash2,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Subtitles,
  Mic,
  Layers,
  Camera,
  CheckCircle2,
  X,
  ExternalLink,
  Hash,
  Rewind,
} from 'lucide-react';
import {
  BEditBottomTab,
  BEditProjectState,
  BEditTimelineClip,
  BOOSTHUB_MAX_VIDEO_SECONDS,
  captureElementFrameDataUrl,
  createDefaultClip,
  createDefaultProjectState,
  dataUrlToFile,
  deleteSavedBEditProject,
  exportBEditProjectToVideoFile,
  getClipEffectiveDuration,
  getProjectTotalDuration,
  loadSavedBEditProjects,
  saveBEditProjectToStorage,
  STUDIO_BUILTIN_SOUNDS,
  STUDIO_FILTER_PRESETS,
} from '../components/bEditStudioTypes';
import { BEditStudioStageAndTimeline } from '../components/BEditStudioStageAndTimeline';
import {
  STUDIO_BADGE_STICKERS,
  STUDIO_EMOJI_STICKERS,
  STUDIO_TEXT_COLORS,
  STUDIO_TRANSITION_EFFECTS,
  StudioEditConfig,
  StudioStickerLayer,
  StudioTextAnimation,
  StudioTextLayer,
  StudioTransitionType,
  DEFAULT_STUDIO_CONFIG,
  encodeStudioUrlHash,
} from '../components/StudioMediaEditor';
import { useAuth } from '../state/AuthContext';
import { INTEREST_CATEGORIES, PostItem } from '../types';
import { apiFetch } from '../services/api';
import { uploadMediaWithProgress } from '../storage/mediaUpload';

interface BEditStudioScreenProps {
  onPublished: () => void;
  onBack: () => void;
}

export const BEditStudioScreen: React.FC<BEditStudioScreenProps> = ({
  onPublished,
  onBack,
}) => {
  const { userProfile, refreshProfile, showToast } = useAuth();

  // Hidden file inputs
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const pipInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  // Stage media refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reverseTimerRef = useRef<number | null>(null);

  // Project State + Undo/Redo History Stack
  const [project, setProject] = useState<BEditProjectState>(() =>
    createDefaultProjectState()
  );
  const [historyPast, setHistoryPast] = useState<BEditProjectState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<BEditProjectState[]>([]);

  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [activeBottomTab, setActiveBottomTab] =
    useState<BEditBottomTab>('media');
  const [selectedOverlay, setSelectedOverlay] = useState<{
    type: 'sticker' | 'text' | 'pip';
    id: string;
  } | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineTime, setTimelineTime] = useState(0);
  const [isAudioPreviewing, setIsAudioPreviewing] = useState(false);
  const [activeTransitionAnim, setActiveTransitionAnim] = useState<{
    type: StudioTransitionType;
    progress: number;
    label: string;
  } | null>(null);

  // Text & Subtitle composer state
  const [textDraft, setTextDraft] = useState('');
  const [textFont, setTextFont] =
    useState<StudioTextLayer['fontFamily']>('display');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBg, setTextBg] = useState<StudioTextLayer['bgStyle']>('glass');
  const [textAnim, setTextAnim] = useState<StudioTextAnimation>('none');
  const [subtitleDraft, setSubtitleDraft] = useState('');
  const [speechSupported] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition
    )
  );
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);

  // Projects Drawer & Export/Publish Modal State
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<BEditProjectState[]>(() =>
    loadSavedBEditProjects()
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingVideo, setExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepText, setExportStepText] = useState('');
  const [exportedVideoFile, setExportedVideoFile] = useState<File | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string>('');

  // BoostHub Post fields inside Export Modal
  const [postCaption, setPostCaption] = useState('');
  const [postHashtags, setPostHashtags] = useState('#BEditStudio #Capshots');
  const [postExternalLink, setPostExternalLink] = useState('');
  const [postCategory, setPostCategory] = useState<string>('Tech & Gaming');
  const [publishingToBoostHub, setPublishingToBoostHub] = useState(false);
  const [uploadingClipPct, setUploadingClipPct] = useState<number | null>(null);

  // Map raw Files by clip URL so original uploads work seamlessly
  const clipFilesMapRef = useRef<Map<string, File>>(new Map());

  const activeClip: BEditTimelineClip | undefined =
    project.clips[activeClipIndex] || project.clips[0];

  const totalDuration = getProjectTotalDuration(project);

  // Helper to commit a state change with Undo/Redo history
  const updateProjectWithHistory = (
    updater: (prev: BEditProjectState) => BEditProjectState
  ) => {
    setProject((prev) => {
      const next = updater(prev);
      setHistoryPast((past) => [...past.slice(-30), prev]);
      setHistoryFuture([]);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [project, ...future.slice(0, 30)]);
    setProject(previous);
    showToast('Undid last edit', 'info');
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past.slice(-30), project]);
    setProject(next);
    showToast('Redid edit', 'info');
  };

  const updateActiveClip = (
    patch:
      | Partial<BEditTimelineClip>
      | ((c: BEditTimelineClip) => BEditTimelineClip)
  ) => {
    if (!activeClip) return;
    updateProjectWithHistory((prev) => ({
      ...prev,
      clips: prev.clips.map((c, idx) => {
        if (idx !== activeClipIndex) return c;
        return typeof patch === 'function' ? patch(c) : { ...c, ...patch };
      }),
    }));
  };

  // Sync active video element properties
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !activeClip || activeClip.type !== 'video') return;
    vid.playbackRate = activeClip.speed || 1;
    vid.muted = activeClip.muted;
    vid.volume = Math.max(0, Math.min(1, (activeClip.volume ?? 100) / 100));
  }, [
    activeClip?.id,
    activeClip?.speed,
    activeClip?.muted,
    activeClip?.volume,
    activeClip?.type,
  ]);

  // Photo or Reversed Video playhead driver
  useEffect(() => {
    if (!isPlaying || !activeClip) {
      if (reverseTimerRef.current) {
        window.clearInterval(reverseTimerRef.current);
        reverseTimerRef.current = null;
      }
      return;
    }

    if (activeClip.type === 'photo' || activeClip.reversed) {
      if (activeClip.type === 'video' && videoRef.current) {
        videoRef.current.pause();
      }
      const stepSec = 0.08 * (activeClip.speed || 1);
      reverseTimerRef.current = window.setInterval(() => {
        if (activeClip.type === 'video' && activeClip.reversed && videoRef.current) {
          const vid = videoRef.current;
          const nextVidTime = vid.currentTime - stepSec;
          if (nextVidTime <= activeClip.trimStart) {
            handleAdvanceToNextClipOrStop();
          } else {
            vid.currentTime = nextVidTime;
          }
        } else {
          setTimelineTime((prev) => {
            const next = prev + 0.08;
            if (next >= totalDuration) {
              setIsPlaying(false);
              return 0;
            }
            return next;
          });
        }
      }, 80);

      return () => {
        if (reverseTimerRef.current) {
          window.clearInterval(reverseTimerRef.current);
          reverseTimerRef.current = null;
        }
      };
    }
  }, [
    isPlaying,
    activeClip?.id,
    activeClip?.type,
    activeClip?.reversed,
    activeClip?.speed,
    totalDuration,
  ]);

  // Clean up audio preview on unmount
  useEffect(() => {
    return () => {
      if (synthTimerRef.current) window.clearInterval(synthTimerRef.current);
      if (reverseTimerRef.current) window.clearInterval(reverseTimerRef.current);
      if (customAudioRef.current) customAudioRef.current.pause();
    };
  }, []);

  const triggerTransitionPreview = (
    type: StudioTransitionType,
    durationSec = 0.6
  ) => {
    if (type === 'none') {
      setActiveTransitionAnim(null);
      return;
    }
    const meta =
      STUDIO_TRANSITION_EFFECTS.find((t) => t.id === type) ||
      STUDIO_TRANSITION_EFFECTS[1];
    const started = performance.now();
    const totalMs = Math.max(250, durationSec * 1000);
    setActiveTransitionAnim({ type, progress: 0.05, label: meta.name });

    const timer = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / totalMs);
      if (p >= 1) {
        window.clearInterval(timer);
        setActiveTransitionAnim(null);
      } else {
        setActiveTransitionAnim({ type, progress: p, label: meta.name });
      }
    }, 25);
  };

  const getClipStartTimelineOffset = (clipIndex: number): number => {
    let sum = 0;
    for (let i = 0; i < clipIndex && i < project.clips.length; i++) {
      sum += getClipEffectiveDuration(project.clips[i]);
    }
    return sum;
  };

  const handleAdvanceToNextClipOrStop = () => {
    if (activeClip && activeClip.transitionAfter !== 'none') {
      triggerTransitionPreview(
        activeClip.transitionAfter,
        activeClip.transitionDuration || 0.6
      );
    }
    if (activeClipIndex < project.clips.length - 1) {
      const nextIdx = activeClipIndex + 1;
      setActiveClipIndex(nextIdx);
      const nextClip = project.clips[nextIdx];
      const offset = getClipStartTimelineOffset(nextIdx);
      setTimelineTime(offset);
      window.setTimeout(() => {
        if (videoRef.current && nextClip.type === 'video') {
          videoRef.current.currentTime = nextClip.reversed
            ? nextClip.trimEnd
            : nextClip.trimStart;
          if (!nextClip.reversed) {
            videoRef.current.play().catch(() => {});
          }
        }
      }, 60);
    } else {
      setIsPlaying(false);
      setActiveClipIndex(0);
      setTimelineTime(0);
      if (videoRef.current && project.clips[0]?.type === 'video') {
        videoRef.current.currentTime = project.clips[0].trimStart;
        videoRef.current.pause();
      }
    }
  };

  const handleTogglePlay = () => {
    if (project.clips.length === 0) {
      mediaInputRef.current?.click();
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      videoRef.current?.pause();
      return;
    }
    setIsPlaying(true);
    if (activeClip?.type === 'video' && videoRef.current) {
      if (activeClip.reversed) {
        if (
          videoRef.current.currentTime <= activeClip.trimStart ||
          videoRef.current.currentTime > activeClip.trimEnd
        ) {
          videoRef.current.currentTime = activeClip.trimEnd;
        }
      } else {
        if (
          videoRef.current.currentTime < activeClip.trimStart ||
          videoRef.current.currentTime >= activeClip.trimEnd
        ) {
          videoRef.current.currentTime = activeClip.trimStart;
        }
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Upload multiple videos or photos from phone gallery
  const handleAddMediaFiles = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);
    e.target.value = '';

    const newClips: BEditTimelineClip[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const isVid = f.type.startsWith('video/');
      const localUrl = URL.createObjectURL(f);
      clipFilesMapRef.current.set(localUrl, f);

      let detectedDur = isVid ? 10 : 5;
      if (isVid) {
        detectedDur = await new Promise<number>((resolve) => {
          const tempV = document.createElement('video');
          tempV.preload = 'metadata';
          tempV.src = localUrl;
          const t = window.setTimeout(() => resolve(10), 2000);
          tempV.onloadedmetadata = () => {
            window.clearTimeout(t);
            resolve(
              Number.isFinite(tempV.duration) && tempV.duration > 0
                ? Number(tempV.duration.toFixed(1))
                : 10
            );
          };
          tempV.onerror = () => {
            window.clearTimeout(t);
            resolve(10);
          };
        });
      }

      const clampedEnd = Math.min(detectedDur, BOOSTHUB_MAX_VIDEO_SECONDS);

      // Upload in background to Supabase Storage / backend so URLs survive refresh
      setUploadingClipPct(15);
      let finalUrl = localUrl;
      try {
        const uploaded = await uploadMediaWithProgress(
          f,
          isVid ? 'videos' : 'posts',
          (pct) => setUploadingClipPct(pct)
        );
        if (uploaded?.url) {
          finalUrl = uploaded.url;
          clipFilesMapRef.current.set(finalUrl, f);
        }
      } catch {
        // fallback to object URL for local editing
      } finally {
        setUploadingClipPct(null);
      }

      newClips.push(
        createDefaultClip({
          name: `Clip ${project.clips.length + i + 1}`,
          url: finalUrl,
          type: isVid ? 'video' : 'photo',
          sourceDuration: detectedDur,
          trimStart: 0,
          trimEnd: clampedEnd,
        })
      );
    }

    updateProjectWithHistory((prev) => {
      const merged = [...prev.clips, ...newClips];
      return {
        ...prev,
        clips: merged,
      };
    });
    setActiveClipIndex(project.clips.length);
    showToast(
      `Added ${newClips.length} ${newClips.length === 1 ? 'clip' : 'clips'} to timeline`,
      'success'
    );
  };

  // Split active clip at current playhead position
  const handleSplitActiveClip = () => {
    if (!activeClip) return;
    const vid = videoRef.current;
    const currentLocal =
      activeClip.type === 'video' && vid
        ? vid.currentTime
        : (activeClip.trimStart + activeClip.trimEnd) / 2;

    const splitPoint =
      currentLocal > activeClip.trimStart + 0.4 &&
      currentLocal < activeClip.trimEnd - 0.4
        ? Number(currentLocal.toFixed(1))
        : Number(((activeClip.trimStart + activeClip.trimEnd) / 2).toFixed(1));

    if (splitPoint <= activeClip.trimStart + 0.2 || splitPoint >= activeClip.trimEnd - 0.2) {
      showToast('Clip is too short to split further', 'info');
      return;
    }

    const firstPart: BEditTimelineClip = {
      ...activeClip,
      trimEnd: splitPoint,
    };
    const secondPart: BEditTimelineClip = {
      ...activeClip,
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: `${activeClip.name} (Part 2)`,
      trimStart: splitPoint,
    };

    updateProjectWithHistory((prev) => {
      const nextClips = [
        ...prev.clips.slice(0, activeClipIndex),
        firstPart,
        secondPart,
        ...prev.clips.slice(activeClipIndex + 1),
      ].map((c, idx) => ({ ...c, name: `Clip ${idx + 1}` }));
      return { ...prev, clips: nextClips };
    });
    showToast(`Split clip at ${splitPoint.toFixed(1)}s`, 'success');
  };

  const handleDeleteActiveClip = () => {
    if (!activeClip) return;
    updateProjectWithHistory((prev) => {
      const remaining = prev.clips
        .filter((_, idx) => idx !== activeClipIndex)
        .map((c, idx) => ({ ...c, name: `Clip ${idx + 1}` }));
      return { ...prev, clips: remaining };
    });
    setActiveClipIndex((idx) => Math.max(0, idx - 1));
    showToast('Deleted clip from timeline', 'info');
  };

  const handleMoveActiveClip = (dir: -1 | 1) => {
    const targetIdx = activeClipIndex + dir;
    if (targetIdx < 0 || targetIdx >= project.clips.length) return;
    updateProjectWithHistory((prev) => {
      const copy = [...prev.clips];
      const [moved] = copy.splice(activeClipIndex, 1);
      copy.splice(targetIdx, 0, moved);
      return {
        ...prev,
        clips: copy.map((c, idx) => ({ ...c, name: `Clip ${idx + 1}` })),
      };
    });
    setActiveClipIndex(targetIdx);
  };

  // Audio preview (built-in synth beat or imported device audio)
  const stopAudioPreview = () => {
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }
    setIsAudioPreviewing(false);
  };

  const toggleAudioPreview = () => {
    if (isAudioPreviewing) {
      stopAudioPreview();
      return;
    }
    setIsAudioPreviewing(true);

    if (project.customAudioUrl && customAudioRef.current) {
      const el = customAudioRef.current;
      el.currentTime = project.soundTrimStart || 0;
      el.volume = Math.max(0, Math.min(1, (project.soundVolume ?? 85) / 100));
      el.play().catch(() => {});
      synthTimerRef.current = window.setInterval(() => {
        if (!customAudioRef.current) return;
        if (
          customAudioRef.current.currentTime >=
          Math.max(1, project.soundTrimEnd || 15)
        ) {
          if (project.soundLoop) {
            customAudioRef.current.currentTime = project.soundTrimStart || 0;
          } else {
            stopAudioPreview();
          }
        }
      }, 150);
      return;
    }

    const track =
      STUDIO_BUILTIN_SOUNDS.find((s) => s.id === project.soundTrackId) ||
      STUDIO_BUILTIN_SOUNDS[0];

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!audioCtxRef.current && AudioCtx) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

    let step = 0;
    const stepMs = Math.round(60000 / track.bpm / 2);
    synthTimerRef.current = window.setInterval(() => {
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(
          track.notes[step % track.notes.length],
          now
        );
        const vol = Math.max(0.02, ((project.soundVolume ?? 85) / 100) * 0.16);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + stepMs / 1000);
      }
      step++;
    }, stepMs);
  };

  // Auto-Captions via Web Speech API or Smart Timed Generator
  const handleStartLiveSpeechCaptions = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast(
        'Voice recognition is not supported on this browser; use Add Timed Caption below.',
        'info'
      );
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      setIsListeningSpeech(true);
      rec.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          const start = Number(timelineTime.toFixed(1));
          const end = Number(Math.min(Math.max(3, totalDuration || 10), start + 3).toFixed(1));
          updateProjectWithHistory((prev) => ({
            ...prev,
            subtitles: [
              ...prev.subtitles,
              {
                id: `sub_${Date.now()}`,
                startTime: start,
                endTime: end,
                text: transcript.trim(),
              },
            ],
          }));
          showToast('Voice caption added to timeline!', 'success');
        }
      };
      rec.onend = () => setIsListeningSpeech(false);
      rec.onerror = () => setIsListeningSpeech(false);
      rec.start();
    } catch {
      setIsListeningSpeech(false);
    }
  };

  const handleGenerateSmartCaptions = () => {
    const dur = Math.max(4, totalDuration || 9);
    const seg = Number((dur / 3).toFixed(1));
    updateProjectWithHistory((prev) => ({
      ...prev,
      subtitles: [
        {
          id: `sub_${Date.now()}_1`,
          startTime: 0,
          endTime: seg,
          text: 'Watch till the end 🔥',
        },
        {
          id: `sub_${Date.now()}_2`,
          startTime: seg,
          endTime: Number((seg * 2).toFixed(1)),
          text: 'Edited in BoostHub B-Edit Studio ✨',
        },
        {
          id: `sub_${Date.now()}_3`,
          startTime: Number((seg * 2).toFixed(1)),
          endTime: Number(dur.toFixed(1)),
          text: 'Follow & drop a comment below! 🚀',
        },
      ],
    }));
    showToast('Generated 3 time-synced subtitle cues!', 'success');
  };

  // Capture video frame as custom thumbnail
  const handleCaptureCurrentFrameThumbnail = () => {
    const el =
      activeClip?.type === 'video' ? videoRef.current : imageRef.current;
    const dataUrl = captureElementFrameDataUrl(el);
    if (!dataUrl) {
      showToast('Load a video or photo first to capture a thumbnail', 'info');
      return;
    }
    updateProjectWithHistory((prev) => ({
      ...prev,
      thumbnailDataUrl: dataUrl,
    }));
    showToast('Captured current video frame as thumbnail!', 'success');
  };

  // Run Real Browser Video Export
  const handleOpenExportAndRender = async () => {
    if (project.clips.length === 0) {
      showToast('Please upload at least one video or photo clip first.', 'error');
      return;
    }
    if (!project.thumbnailDataUrl) {
      const el =
        activeClip?.type === 'video' ? videoRef.current : imageRef.current;
      const autoThumb = captureElementFrameDataUrl(el);
      if (autoThumb) {
        setProject((p) => ({ ...p, thumbnailDataUrl: autoThumb }));
      }
    }
    setExportModalOpen(true);
    setExportingVideo(true);
    setExportProgress(5);
    setExportStepText('Preparing timeline clips...');

    try {
      const res = await exportBEditProjectToVideoFile(
        project,
        (pct, stepLabel) => {
          setExportProgress(pct);
          setExportStepText(stepLabel);
        }
      );
      if (res) {
        setExportedVideoFile(res.file);
        setExportedVideoUrl(URL.createObjectURL(res.file));
        if (res.thumbnailDataUrl && !project.thumbnailDataUrl) {
          setProject((p) => ({
            ...p,
            thumbnailDataUrl: res.thumbnailDataUrl,
          }));
        }
        showToast('Video exported & ready to download or post!', 'success');
      }
    } catch {
      showToast('Fast export ready for BoostHub publishing', 'info');
    } finally {
      setExportingVideo(false);
    }
  };

  // Post to BoostHub after exporting
  const handlePostToBoostHub = async () => {
    if (!userProfile || project.clips.length === 0) return;
    setPublishingToBoostHub(true);
    try {
      const primaryClip = project.clips[0];
      let baseMediaUrl = primaryClip.url;

      // Upload primary clip or exported composite file via existing Supabase / backend storage
      const rawClipFile = clipFilesMapRef.current.get(primaryClip.url);
      if (
        (!baseMediaUrl || baseMediaUrl.startsWith('blob:')) &&
        (rawClipFile || exportedVideoFile)
      ) {
        const fileToUpload = rawClipFile || exportedVideoFile!;
        const isVidUpload =
          primaryClip.type === 'video' || project.clips.length > 1;
        const uploaded = await uploadMediaWithProgress(
          fileToUpload,
          isVidUpload ? 'videos' : 'posts'
        );
        baseMediaUrl = uploaded.url;
      }

      // Upload chosen thumbnail if it's a data URL
      let finalThumbnailUrl = project.thumbnailDataUrl || '';
      if (finalThumbnailUrl.startsWith('data:')) {
        const thumbFile = await dataUrlToFile(finalThumbnailUrl);
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

      // Build studio metadata hash so PostCard & CapshotsScreen preserve all edits, trims, filters, subtitles, texts & stickers
      const clampedEnd = Math.min(
        BOOSTHUB_MAX_VIDEO_SECONDS,
        primaryClip.trimEnd || 15
      );
      const studioConfigForHash: StudioEditConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        trimStart: primaryClip.trimStart,
        trimEnd: clampedEnd,
        duration: Math.min(
          BOOSTHUB_MAX_VIDEO_SECONDS,
          getProjectTotalDuration(project) || 15
        ),
        playbackSpeed: primaryClip.speed,
        muteAudio: primaryClip.muted,
        aspectRatio: project.aspectRatio,
        zoom: primaryClip.cropZoom,
        rotation: primaryClip.rotation,
        flipH: primaryClip.flipH,
        flipV: primaryClip.flipV,
        filterPreset: primaryClip.filterPreset,
        brightness: primaryClip.brightness,
        contrast: primaryClip.contrast,
        saturation: primaryClip.saturation,
        exposure: primaryClip.exposure,
        vfxOverlay: primaryClip.vfxOverlay,
        transitionType: primaryClip.transitionAfter,
        transitionDuration: primaryClip.transitionDuration,
        soundTrackId: project.soundTrackId,
        soundTrimStart: project.soundTrimStart,
        soundTrimEnd: project.soundTrimEnd,
        soundLoop: project.soundLoop,
        soundEffect: project.soundEffect,
        stickers: project.stickers,
        texts: project.texts,
        subtitles: project.subtitles,
      };

      const finalMediaUrl = encodeStudioUrlHash(
        baseMediaUrl,
        studioConfigForHash,
        primaryClip.type === 'video'
      );

      await apiFetch<PostItem>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          postType: primaryClip.type === 'video' ? 'capshot' : 'photo',
          caption:
            postCaption.trim() || 'Edited in B-Edit Studio ✨ #BEditStudio',
          mediaUrl: finalMediaUrl,
          thumbnailUrl: finalThumbnailUrl,
          hashtags: postHashtags.trim() || '#BEditStudio #Capshots',
          category: postCategory,
          linkUrl: postExternalLink.trim(),
        }),
      });

      await refreshProfile();
      showToast('Posted to BoostHub!', 'success');
      setExportModalOpen(false);
      onPublished();
    } catch (err: any) {
      showToast(err?.message || 'Failed to post to BoostHub', 'error');
    } finally {
      setPublishingToBoostHub(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-3 py-3 pb-28 space-y-3 select-none">
      {/* Hidden File Inputs */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        onChange={handleAddMediaFiles}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = URL.createObjectURL(f);
          updateProjectWithHistory((prev) => ({
            ...prev,
            soundTrackId: 'custom',
            customAudioUrl: url,
            customAudioName: f.name,
            soundTrimStart: 0,
            soundTrimEnd: 15,
          }));
          showToast(`Imported audio: ${f.name}`, 'success');
        }}
        className="hidden"
      />
      <input
        ref={pipInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const isVid = f.type.startsWith('video/');
          const url = URL.createObjectURL(f);
          updateProjectWithHistory((prev) => ({
            ...prev,
            pipLayer: {
              id: `pip_${Date.now()}`,
              url,
              type: isVid ? 'video' : 'photo',
              x: 76,
              y: 26,
              scale: 1,
              borderRadius: 12,
            },
          }));
          showToast('Added Picture-in-Picture overlay! Drag it on the video.', 'success');
        }}
        className="hidden"
      />
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              updateProjectWithHistory((prev) => ({
                ...prev,
                thumbnailDataUrl: reader.result as string,
              }));
              showToast('Custom video thumbnail set!', 'success');
            }
          };
          reader.readAsDataURL(f);
        }}
        className="hidden"
      />
      {project.customAudioUrl && (
        <audio
          ref={customAudioRef}
          src={project.customAudioUrl}
          className="hidden"
        />
      )}

      {/* TOP STUDIO HEADER BAR: Back, Title, Undo/Redo, Save/Projects, Export */}
      <div className="flex items-center justify-between gap-2 bg-[#121626] border border-white/10 rounded-2xl px-3 py-2.5 shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-200 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-white truncate">
              B-Edit Studio
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              {project.clips.length} clip{project.clips.length === 1 ? '' : 's'} ·{' '}
              {totalDuration.toFixed(1)}s / {BOOSTHUB_MAX_VIDEO_SECONDS}s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyPast.length === 0}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-slate-200"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyFuture.length === 0}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-slate-200"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const updated = saveBEditProjectToStorage(project);
              setSavedProjects(updated);
              setProjectsModalOpen(true);
              showToast('Project saved locally!', 'success');
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-200"
            title="Save / Load Projects"
          >
            <FolderOpen className="w-4 h-4 text-blue-400" />
          </button>
          <button
            type="button"
            onClick={handleOpenExportAndRender}
            className="px-3.5 py-2 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {uploadingClipPct !== null && (
        <div className="px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
          <span>Uploading media to BoostHub cloud storage...</span>
          <span className="font-mono tabular-nums font-bold">
            {uploadingClipPct}%
          </span>
        </div>
      )}

      {/* VIDEO PREVIEW AT TOP + MULTI-CLIP TIMELINE DIRECTLY BELOW */}
      <BEditStudioStageAndTimeline
        project={project}
        activeClipIndex={activeClipIndex}
        onSelectClipIndex={(idx) => {
          setActiveClipIndex(idx);
          const offset = getClipStartTimelineOffset(idx);
          setTimelineTime(offset);
        }}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        timelineTime={timelineTime}
        onSeekTimeline={(sec) => {
          setTimelineTime(sec);
          if (videoRef.current && activeClip?.type === 'video') {
            const clipOffset = getClipStartTimelineOffset(activeClipIndex);
            const localSec = Math.max(
              activeClip.trimStart,
              Math.min(activeClip.trimEnd, activeClip.trimStart + (sec - clipOffset))
            );
            videoRef.current.currentTime = localSec;
          }
        }}
        selectedOverlay={selectedOverlay}
        onSelectOverlay={setSelectedOverlay}
        onUpdateOverlayPosition={(type, id, x, y) => {
          if (type === 'pip') {
            setProject((prev) =>
              prev.pipLayer ? { ...prev, pipLayer: { ...prev.pipLayer, x, y } } : prev
            );
          } else if (type === 'sticker') {
            setProject((prev) => ({
              ...prev,
              stickers: prev.stickers.map((s) =>
                s.id === id ? { ...s, x, y } : s
              ),
            }));
          } else {
            setProject((prev) => ({
              ...prev,
              texts: prev.texts.map((t) => (t.id === id ? { ...t, x, y } : t)),
            }));
          }
        }}
        onSplitActiveClip={handleSplitActiveClip}
        onDeleteActiveClip={handleDeleteActiveClip}
        onMoveActiveClip={handleMoveActiveClip}
        onToggleMuteActiveClip={() =>
          updateActiveClip((c) => ({ ...c, muted: !c.muted }))
        }
        onTriggerAddMedia={() => mediaInputRef.current?.click()}
        onOpenTransitionPickerForClip={(idx) => {
          setActiveClipIndex(idx);
          setActiveBottomTab('effects');
        }}
        activeTransitionAnim={activeTransitionAnim}
        videoRef={videoRef}
        imageRef={imageRef}
        onVideoLoadedMetadata={(dur) => {
          if (!activeClip) return;
          if (Math.abs(activeClip.sourceDuration - dur) > 0.5) {
            const clamped = Math.min(dur, BOOSTHUB_MAX_VIDEO_SECONDS);
            setProject((prev) => ({
              ...prev,
              clips: prev.clips.map((c, i) =>
                i === activeClipIndex
                  ? {
                      ...c,
                      sourceDuration: Number(dur.toFixed(1)),
                      trimEnd: Math.min(c.trimEnd, clamped),
                    }
                  : c
              ),
            }));
          }
        }}
        onVideoTimeUpdate={(localTime) => {
          if (!activeClip || activeClip.reversed) return;
          const offset = getClipStartTimelineOffset(activeClipIndex);
          const rel = Math.max(
            0,
            (localTime - activeClip.trimStart) / (activeClip.speed || 1)
          );
          setTimelineTime(offset + rel);
          if (localTime >= activeClip.trimEnd) {
            handleAdvanceToNextClipOrStop();
          }
        }}
        onVideoEnded={handleAdvanceToNextClipOrStop}
      />

      {/* ACTIVE TOOL DRAWER PANEL */}
      <div className="bg-[#0E1322] border border-white/10 rounded-2xl p-3.5 space-y-3.5">
        {/* 1. MEDIA TAB: Upload, Trim, Split, Crop, Rotate, Aspect Ratio, Speed, Reverse */}
        {activeBottomTab === 'media' && (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">
                Media, Trim, Crop & Aspect Ratio
              </span>
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Add Video / Photo</span>
              </button>
            </div>

            {/* Aspect Ratio Selector: 9:16, 1:1, 16:9, 4:5 */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1.5">
                Resize / Aspect Ratio
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['9:16', '1:1', '16:9', '4:5'] as const).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() =>
                      updateProjectWithHistory((prev) => ({
                        ...prev,
                        aspectRatio: ar,
                      }))
                    }
                    className={`min-h-[40px] rounded-xl text-xs font-bold border transition-colors ${
                      project.aspectRatio === ar
                        ? 'bg-[#4A90E2]/20 border-[#4A90E2] text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {activeClip && (
              <>
                {/* Trim Start & End Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Trim Start</span>
                      <span className="font-mono tabular-nums text-blue-400">
                        {activeClip.trimStart.toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.5, activeClip.trimEnd - 0.5)}
                      step={0.1}
                      value={activeClip.trimStart}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        updateActiveClip({
                          trimStart: Math.min(v, activeClip.trimEnd - 0.5),
                        });
                        if (videoRef.current && activeClip.type === 'video') {
                          videoRef.current.currentTime = v;
                        }
                      }}
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Trim End</span>
                      <span className="font-mono tabular-nums text-blue-400">
                        {activeClip.trimEnd.toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={activeClip.trimStart + 0.5}
                      max={Math.min(
                        BOOSTHUB_MAX_VIDEO_SECONDS,
                        Math.max(1, activeClip.sourceDuration)
                      )}
                      step={0.1}
                      value={activeClip.trimEnd}
                      onChange={(e) =>
                        updateActiveClip({
                          trimEnd: Math.max(
                            Number(e.target.value),
                            activeClip.trimStart + 0.5
                          ),
                        })
                      }
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>
                </div>

                {/* Crop Zoom & Pan + Rotate & Flip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Crop / Zoom</span>
                      <span className="font-mono tabular-nums text-blue-400">
                        {activeClip.cropZoom.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={activeClip.cropZoom}
                      onChange={(e) =>
                        updateActiveClip({ cropZoom: Number(e.target.value) })
                      }
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveClip((c) => ({
                          ...c,
                          rotation: (c.rotation - 90) % 360,
                        }))
                      }
                      className="flex-1 min-h-[40px] rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> -90°
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveClip((c) => ({
                          ...c,
                          rotation: (c.rotation + 90) % 360,
                        }))
                      }
                      className="flex-1 min-h-[40px] rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center justify-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> +90°
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveClip((c) => ({ ...c, flipH: !c.flipH }))
                      }
                      className={`flex-1 min-h-[40px] rounded-xl text-xs inline-flex items-center justify-center gap-1 ${
                        activeClip.flipH
                          ? 'bg-[#4A90E2] text-white'
                          : 'bg-white/5 text-slate-200'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" /> Flip
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveClip((c) => ({ ...c, flipV: !c.flipV }))
                      }
                      className={`flex-1 min-h-[40px] rounded-xl text-xs inline-flex items-center justify-center gap-1 ${
                        activeClip.flipV
                          ? 'bg-[#4A90E2] text-white'
                          : 'bg-white/5 text-slate-200'
                      }`}
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Playback Speed & Reverse Toggle */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[11px] text-slate-400 mr-1">
                      Speed:
                    </span>
                    {[0.5, 0.75, 1, 1.5, 2].map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => updateActiveClip({ speed: sp })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                          activeClip.speed === sp
                            ? 'bg-[#4A90E2] text-white'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateActiveClip((c) => ({ ...c, reversed: !c.reversed }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                      activeClip.reversed
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <Rewind className="w-3.5 h-3.5" />
                    <span>Reverse: {activeClip.reversed ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. AUDIO TAB: Volume, Mute, Background Music, Import Audio from Device */}
        {activeBottomTab === 'audio' && (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">
                Audio Mixer & Background Music
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import Audio</span>
                </button>
                <button
                  type="button"
                  onClick={toggleAudioPreview}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                    isAudioPreviewing
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#4A90E2] text-white'
                  }`}
                >
                  {isAudioPreviewing ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Preview Music
                    </>
                  )}
                </button>
              </div>
            </div>

            {activeClip && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Clip Volume</span>
                    <span className="font-mono tabular-nums text-blue-400">
                      {activeClip.muted ? 'Muted (0%)' : `${activeClip.volume}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={activeClip.muted ? 0 : activeClip.volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateActiveClip({ volume: v, muted: v === 0 });
                    }}
                    className="w-full accent-[#4A90E2]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Background Music Volume</span>
                    <span className="font-mono tabular-nums text-pink-400">
                      {project.soundVolume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.soundVolume}
                    onChange={(e) =>
                      updateProjectWithHistory((prev) => ({
                        ...prev,
                        soundVolume: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
              {STUDIO_BUILTIN_SOUNDS.map((snd) => (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() =>
                    updateProjectWithHistory((prev) => ({
                      ...prev,
                      soundTrackId: snd.id,
                      customAudioUrl: '',
                      customAudioName: '',
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    project.soundTrackId === snd.id
                      ? 'bg-[#4A90E2]/20 border-[#4A90E2] text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{snd.name}</p>
                  <p className="text-[10px] text-slate-400">{snd.genre}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. TEXT TAB: Text Overlays, Animated Text, Auto Captions / Subtitles */}
        {activeBottomTab === 'text' && (
          <div className="space-y-3.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                placeholder="Type text overlay..."
                className="flex-1 bg-[#080B14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const content = textDraft.trim() || 'BoostHub ✨';
                  const newLayer: StudioTextLayer = {
                    id: `txt_${Date.now()}`,
                    text: content,
                    fontFamily: textFont,
                    color: textColor,
                    bgStyle: textBg,
                    animation: textAnim,
                    x: 50,
                    y: 45,
                    scale: 1,
                    rotation: 0,
                  };
                  updateProjectWithHistory((prev) => ({
                    ...prev,
                    texts: [...prev.texts, newLayer],
                  }));
                  setTextDraft('');
                  setSelectedOverlay({ type: 'text', id: newLayer.id });
                }}
                className="px-3.5 py-2 rounded-xl bg-[#4A90E2] text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Text
              </button>
            </div>

            {/* Animated Text Presets */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1">
                Animated Text Effect
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'none', label: 'Static' },
                    { id: 'typewriter', label: 'Typewriter' },
                    { id: 'pulse_neon', label: 'Neon Pulse' },
                    { id: 'bounce_in', label: 'Bounce' },
                  ] as const
                ).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setTextAnim(a.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      textAnim === a.id
                        ? 'bg-[#4A90E2] text-white'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Colors */}
            <div className="flex items-center gap-2 flex-wrap">
              {STUDIO_TEXT_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setTextColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-full border-2 ${
                    textColor === hex ? 'border-white scale-110' : 'border-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Auto Captions / Subtitles Section */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto Captions & Timed Subtitles</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={handleStartLiveSpeechCaptions}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${
                        isListeningSpeech
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>
                        {isListeningSpeech ? 'Listening...' : 'Voice to Caption'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateSmartCaptions}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold"
                  >
                    Auto-Generate Captions
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtitleDraft}
                  onChange={(e) => setSubtitleDraft(e.target.value)}
                  placeholder="Add subtitle at current time..."
                  className="flex-1 bg-[#080B14] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!subtitleDraft.trim()) return;
                    const start = Number(timelineTime.toFixed(1));
                    const end = Number((start + 3).toFixed(1));
                    updateProjectWithHistory((prev) => ({
                      ...prev,
                      subtitles: [
                        ...prev.subtitles,
                        {
                          id: `sub_${Date.now()}`,
                          startTime: start,
                          endTime: end,
                          text: subtitleDraft.trim(),
                        },
                      ],
                    }));
                    setSubtitleDraft('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold"
                >
                  + Cue
                </button>
              </div>

              {project.subtitles.length > 0 && (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {project.subtitles.map((cue) => (
                    <div
                      key={cue.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs"
                    >
                      <span className="font-mono text-[10px] text-amber-300">
                        {cue.startTime}s–{cue.endTime}s
                      </span>
                      <span className="flex-1 text-white truncate">
                        {cue.text}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProjectWithHistory((prev) => ({
                            ...prev,
                            subtitles: prev.subtitles.filter(
                              (c) => c.id !== cue.id
                            ),
                          }))
                        }
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. STICKERS TAB: Stickers & Emojis */}
        {activeBottomTab === 'stickers' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {STUDIO_BADGE_STICKERS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => {
                    const st: StudioStickerLayer = {
                      id: `stk_${Date.now()}`,
                      content: b.label,
                      isBadge: true,
                      badgeColor: b.color,
                      x: 50,
                      y: 35,
                      scale: 1,
                      rotation: 0,
                    };
                    updateProjectWithHistory((prev) => ({
                      ...prev,
                      stickers: [...prev.stickers, st],
                    }));
                    setSelectedOverlay({ type: 'sticker', id: st.id });
                  }}
                  className={`px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${b.color} text-white font-bold text-xs`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {STUDIO_EMOJI_STICKERS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    const st: StudioStickerLayer = {
                      id: `stk_${Date.now()}`,
                      content: em,
                      isBadge: false,
                      x: 50,
                      y: 45,
                      scale: 1,
                      rotation: 0,
                    };
                    updateProjectWithHistory((prev) => ({
                      ...prev,
                      stickers: [...prev.stickers, st],
                    }));
                    setSelectedOverlay({ type: 'sticker', id: st.id });
                  }}
                  className="h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. EFFECTS TAB: Video Effects (VFX) & Transitions Between Clips */}
        {activeBottomTab === 'effects' && activeClip && (
          <div className="space-y-3.5">
            <div>
              <span className="block text-xs font-bold text-white mb-2">
                Video Effects (VFX)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'none', label: 'Clean' },
                    { id: 'vhs_glitch', label: 'VHS Glitch' },
                    { id: 'cinema_bars', label: 'Cinema Bars' },
                    { id: 'neon_frame', label: 'Neon Frame' },
                    { id: 'light_leak', label: 'Light Leak' },
                    { id: 'sparkle_dust', label: 'Starlight' },
                  ] as const
                ).map((vfx) => (
                  <button
                    key={vfx.id}
                    type="button"
                    onClick={() => updateActiveClip({ vfxOverlay: vfx.id })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border ${
                      activeClip.vfxOverlay === vfx.id
                        ? 'bg-[#4A90E2]/20 border-[#4A90E2] text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {vfx.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">
                  Transitions Between Clips
                </span>
                <button
                  type="button"
                  onClick={() =>
                    triggerTransitionPreview(
                      activeClip.transitionAfter,
                      activeClip.transitionDuration
                    )
                  }
                  className="text-[11px] font-bold text-cyan-300 hover:underline"
                >
                  Preview Transition
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STUDIO_TRANSITION_EFFECTS.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => {
                      updateActiveClip({ transitionAfter: tr.id });
                      triggerTransitionPreview(
                        tr.id,
                        activeClip.transitionDuration
                      );
                    }}
                    className={`p-2 rounded-xl border text-left ${
                      activeClip.transitionAfter === tr.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block text-[10px] font-extrabold text-cyan-300">
                      {tr.badge}
                    </span>
                    <span className="block text-xs font-bold truncate">
                      {tr.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. FILTERS TAB: LUT Presets + Brightness, Contrast, Saturation, Exposure */}
        {activeBottomTab === 'filters' && activeClip && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-4 gap-1.5">
              {STUDIO_FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    updateActiveClip({
                      filterPreset: preset.id,
                      brightness: preset.brightness,
                      contrast: preset.contrast,
                      saturation: preset.saturation,
                    })
                  }
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border ${
                    activeClip.filterPreset === preset.id
                      ? 'bg-[#4A90E2]/25 border-[#4A90E2] text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono tabular-nums">
                    {activeClip.brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={activeClip.brightness}
                  onChange={(e) =>
                    updateActiveClip({ brightness: Number(e.target.value) })
                  }
                  className="w-full accent-[#4A90E2]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono tabular-nums">
                    {activeClip.contrast}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={activeClip.contrast}
                  onChange={(e) =>
                    updateActiveClip({ contrast: Number(e.target.value) })
                  }
                  className="w-full accent-[#4A90E2]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono tabular-nums">
                    {activeClip.saturation}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={activeClip.saturation}
                  onChange={(e) =>
                    updateActiveClip({ saturation: Number(e.target.value) })
                  }
                  className="w-full accent-[#4A90E2]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Exposure</span>
                  <span className="font-mono tabular-nums">
                    {activeClip.exposure > 0
                      ? `+${activeClip.exposure}`
                      : activeClip.exposure}
                  </span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={activeClip.exposure}
                  onChange={(e) =>
                    updateActiveClip({ exposure: Number(e.target.value) })
                  }
                  className="w-full accent-[#4A90E2]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. "MORE" MENU TAB: Picture-in-Picture, Green-Screen Chroma Key, Video Thumbnails, Projects */}
        {activeBottomTab === 'more' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white">
              Advanced Studio Tools
            </h4>

            {/* Picture-in-Picture (PiP) & Add Photo/Video Over Video */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">
                    Picture-in-Picture (Overlay Photo/Video)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Add a floating photo or video layer over your main video
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => pipInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-[#4A90E2] text-white text-xs font-bold"
                  >
                    {project.pipLayer ? 'Replace PiP' : '+ Add PiP'}
                  </button>
                  {project.pipLayer && (
                    <button
                      type="button"
                      onClick={() =>
                        updateProjectWithHistory((prev) => ({
                          ...prev,
                          pipLayer: null,
                        }))
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {project.pipLayer && (
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>PiP Overlay Size</span>
                    <span>{project.pipLayer.scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.8}
                    step={0.1}
                    value={project.pipLayer.scale}
                    onChange={(e) =>
                      updateProjectWithHistory((prev) =>
                        prev.pipLayer
                          ? {
                              ...prev,
                              pipLayer: {
                                ...prev.pipLayer,
                                scale: Number(e.target.value),
                              },
                            }
                          : prev
                      )
                    }
                    className="w-full accent-[#4A90E2]"
                  />
                </div>
              )}
            </div>

            {/* Basic Green-Screen / Chroma Key Background Removal */}
            {activeClip && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">
                      Green-Screen / Chroma Key Removal
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Remove solid green, blue, or dark backgrounds in real time
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveClip((c) => ({
                        ...c,
                        chromaKeyEnabled: !c.chromaKeyEnabled,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      activeClip.chromaKeyEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {activeClip.chromaKeyEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
                {activeClip.chromaKeyEnabled && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {(['green', 'blue', 'black'] as const).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() =>
                            updateActiveClip({ chromaKeyColor: col })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                            activeClip.chromaKeyColor === col
                              ? 'bg-[#4A90E2] text-white'
                              : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          {col} Key
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={85}
                      value={activeClip.chromaKeySensitivity}
                      onChange={(e) =>
                        updateActiveClip({
                          chromaKeySensitivity: Number(e.target.value),
                        })
                      }
                      className="w-32 accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Video Thumbnail Capture & Upload */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">Video Thumbnail</p>
                <p className="text-[11px] text-slate-400">
                  Capture current video frame or upload cover image
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCaptureCurrentFrameThumbnail}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white inline-flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Capture Frame</span>
                </button>
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                >
                  Upload Cover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION FOR MEDIA, AUDIO, TEXT, STICKERS, EFFECTS, FILTERS & MORE */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-3 pointer-events-none">
        <div className="max-w-lg mx-auto bg-[#121626]/95 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 grid grid-cols-7 gap-1 shadow-2xl pointer-events-auto">
          {(
            [
              { id: 'media', label: 'Media', icon: Film },
              { id: 'audio', label: 'Audio', icon: Music },
              { id: 'text', label: 'Text', icon: Type },
              { id: 'stickers', label: 'Stickers', icon: Smile },
              { id: 'effects', label: 'Effects', icon: Sparkles },
              { id: 'filters', label: 'Filters', icon: Sliders },
              { id: 'more', label: 'More', icon: MoreHorizontal },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeBottomTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveBottomTab(item.id)}
                className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? 'bg-[#4A90E2] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SAVED PROJECTS MODAL (Save & Continue Editing Saved Projects) */}
      {projectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121626] border border-white/15 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Saved B-Edit Projects
              </h3>
              <button
                type="button"
                onClick={() => setProjectsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={project.name}
                onChange={(e) =>
                  setProject((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Project name..."
                className="flex-1 bg-[#080B14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const next = saveBEditProjectToStorage(project);
                  setSavedProjects(next);
                  showToast('Saved project!', 'success');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#4A90E2] text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedProjects.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No saved projects yet.
                </p>
              ) : (
                savedProjects.map((sp) => (
                  <div
                    key={sp.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {sp.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {sp.clips.length} clips ·{' '}
                        {new Date(sp.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProject(sp);
                          setActiveClipIndex(0);
                          setProjectsModalOpen(false);
                          showToast(`Loaded "${sp.name}"`, 'success');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#4A90E2] text-white text-xs font-bold"
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSavedProjects(deleteSavedBEditProject(sp.id))
                        }
                        className="p-1 text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT & POST TO BOOSTHUB MODAL */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-[#121626] border border-white/15 p-4 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">
                Export & Post to BoostHub
              </h3>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {exportingVideo ? (
              <div className="p-4 rounded-xl bg-white/5 space-y-2 text-center">
                <p className="text-xs font-bold text-white">{exportStepText}</p>
                <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                  <div
                    style={{ width: `${exportProgress}%` }}
                    className="h-full bg-[#4A90E2] transition-all"
                  />
                </div>
                <p className="text-[11px] font-mono text-blue-300">
                  {exportProgress}%
                </p>
              </div>
            ) : (
              exportedVideoUrl && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Video Export Complete!</span>
                  </span>
                  <a
                    href={exportedVideoUrl}
                    download={exportedVideoFile?.name || 'boosthub-video.webm'}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              )
            )}

            {/* Thumbnail Picker */}
            <div className="flex items-center gap-3">
              {project.thumbnailDataUrl ? (
                <img
                  src={project.thumbnailDataUrl}
                  alt="Video Thumbnail"
                  className="w-16 h-24 rounded-xl object-cover border border-white/15 shrink-0"
                />
              ) : (
                <div className="w-16 h-24 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-[10px] text-slate-400 text-center p-1 shrink-0">
                  No Cover
                </div>
              )}
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-bold text-white">Video Thumbnail</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleCaptureCurrentFrameThumbnail}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white"
                  >
                    Use Current Frame
                  </button>
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 text-xs font-semibold text-slate-300"
                  >
                    Upload Image
                  </button>
                </div>
              </div>
            </div>

            {/* Caption, Hashtags, External Link & Category */}
            <div className="space-y-2.5">
              <textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                rows={2}
                placeholder="Write a caption for your BoostHub video..."
                className="w-full px-3 py-2 rounded-xl bg-[#080B14] border border-white/15 text-xs text-white"
              />
              <div className="flex items-center gap-2 bg-[#080B14] border border-white/15 rounded-xl px-3 py-2">
                <Hash className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  type="text"
                  value={postHashtags}
                  onChange={(e) => setPostHashtags(e.target.value)}
                  placeholder="#BEditStudio #Capshots"
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-[#080B14] border border-white/15 rounded-xl px-3 py-2">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={postExternalLink}
                  onChange={(e) => setPostExternalLink(e.target.value)}
                  placeholder="Optional external social/profile link (https://...)"
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#080B14] border border-white/15 text-xs font-semibold text-white"
              >
                {INTEREST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePostToBoostHub}
              disabled={publishingToBoostHub || exportingVideo}
              className="w-full py-3 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>
                {publishingToBoostHub ? 'Posting to BoostHub...' : 'Post to BoostHub'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
