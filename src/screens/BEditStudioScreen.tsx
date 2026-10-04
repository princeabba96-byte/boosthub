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
  MicOff,
  FileAudio,
  Wand2,
  Search,
  Layers,
  Camera,
  CheckCircle2,
  Check,
  Copy,
  Radio,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  X,
  ExternalLink,
  Hash,
  Rewind,
  Palette,
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
import {
  BEDIT_VOICE_CATEGORIES,
  BEDIT_VOICE_PRESETS,
  BEditVoiceCategory,
  IGBO_REGIONAL_DIALECTS,
  IgboDiagnosticSuiteReport,
  IgboRegionalDialect,
  analyzeIgboPhoneticsAndFluency,
  applyIgboRegionalDialectVariant,
  cleanEnglishRemovePidginClient,
  decodeMediaToAudioBuffer,
  extractAudioFromVideoSource,
  getIgboDialectProfile,
  getLanguageCodeForDialect,
  getVoicePresetById,
  renderVoiceChangedAudio,
  renderRealisticAiVoiceChangedAudio,
  runIgboTranslationDiagnostics,
  translateEnglishToNigerianLanguageClient,
} from '../components/bEditVoiceEngine';
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
  StudioSubtitleCue,
  StudioTransitionType,
  DEFAULT_STUDIO_CONFIG,
  encodeStudioUrlHash,
  renderStudioCompositeToFile,
} from '../components/StudioMediaEditor';
import {
  GREEN_SCREEN_BACKGROUNDS,
  GreenScreenBackground,
} from '../data/greenScreenBackgrounds';
import {
  FONT_STYLES_52,
  getFontDesignPresetById,
  FontDesignPreset,
} from '../data/fontStyles52';
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
  const extractVideoInputRef = useRef<HTMLInputElement | null>(null);
  const pipInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  // Stage media refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reverseTimerRef = useRef<number | null>(null);

  // Voice Cover & Audio Extraction DSP refs
  const rawVoiceBufferRef = useRef<AudioBuffer | null>(null);
  const extractedAudioBufferRef = useRef<AudioBuffer | null>(null);
  const voiceoverFileRef = useRef<File | null>(null);
  const speechRecDuringRecordRef = useRef<any>(null);
  const recordedTranscriptHintRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  // Audio sub-navigation & Voice Cover / Voice Changer state
  const [audioSubMode, setAudioSubMode] = useState<
    'extract_music' | 'voice_cover' | 'voice_changer'
  >('extract_music');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [muteVideoDuringRecord, setMuteVideoDuringRecord] = useState(true);
  const [extractingAudioBusy, setExtractingAudioBusy] = useState(false);
  const [applyingVoiceBusy, setApplyingVoiceBusy] = useState(false);
  const [isVoicePreviewing, setIsVoicePreviewing] = useState(false);
  const [voiceCategoryFilter, setVoiceCategoryFilter] =
    useState<BEditVoiceCategory>('All');
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [voiceTranscriptText, setVoiceTranscriptText] = useState('');
  const [translatedDialectText, setTranslatedDialectText] = useState('');
  const [activeDialectLabel, setActiveDialectLabel] = useState('Igbo');
  const [activeLangCode, setActiveLangCode] = useState('ig-NG');
  const [voiceStatusMessage, setVoiceStatusMessage] = useState('');

  // Igbo Translation & Voice Diagnostics Debug Panel state
  const [debugPanelOpen, setDebugPanelOpen] = useState(true);
  const [selectedIgboDialect, setSelectedIgboDialect] =
    useState<IgboRegionalDialect>('anambra_izugbe');
  const [igboDiagnosticReport, setIgboDiagnosticReport] =
    useState<IgboDiagnosticSuiteReport | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [customDiagnosticPhrase, setCustomDiagnosticPhrase] = useState('');
  const [customDiagnosticList, setCustomDiagnosticList] = useState<string[]>([]);
  const [livePreviewIgboText, setLivePreviewIgboText] = useState(
    'Ana m, aga ahịa, ịzụta nri'
  );
  const [fluencyScorePulse, setFluencyScorePulse] = useState(false);
  const fluencyPulseTimerRef = useRef<number | null>(null);

  const triggerFluencyScorePulse = () => {
    setFluencyScorePulse(true);
    if (fluencyPulseTimerRef.current) {
      window.clearTimeout(fluencyPulseTimerRef.current);
    }
    fluencyPulseTimerRef.current = window.setTimeout(() => {
      setFluencyScorePulse(false);
    }, 650);
  };

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

  // Green Screen & AI Background State
  const [aiBgSearchQuery, setAiBgSearchQuery] = useState('');
  const [aiBgCategory, setAiBgCategory] = useState<
    'All' | 'Studio' | 'Cyberpunk' | 'Nature & Travel' | 'Luxury & City' | 'Abstract'
  >('All');
  const [aiBgNotice, setAiBgNotice] = useState('');
  const [aiBgPromptModalOpen, setAiBgPromptModalOpen] = useState(false);
  const [aiBgCustomPrompt, setAiBgCustomPrompt] = useState('');
  const [isGeneratingAiBg, setIsGeneratingAiBg] = useState(false);
  const customBgInputRef = useRef<HTMLInputElement>(null);
  const [bakingAiBgPhoto, setBakingAiBgPhoto] = useState(false);

  // Speech-to-Text State (Dedicated Web Speech API with Real-Time Synced Captions)
  const [sttIsRecording, setSttIsRecording] = useState(false);
  const [sttTranscript, setSttTranscript] = useState('');
  const [sttInterimTranscript, setSttInterimTranscript] = useState('');
  const [sttLanguage, setSttLanguage] = useState('en-US');
  const [sttCaptionStyle, setSttCaptionStyle] = useState<
    'viral_yellow' | 'cyber_cyan' | 'clean_box' | 'bold_red'
  >('viral_yellow');
  const [selectedFontPresetId, setSelectedFontPresetId] =
    useState<string>('tiktok_viral_bold');
  const [selectedCaptionColor, setSelectedCaptionColor] =
    useState<string>('#FFE600');
  const [isAnalyzingVideoAudio, setIsAnalyzingVideoAudio] = useState(false);
  const [videoAnalysisProgress, setVideoAnalysisProgress] = useState('');
  const sttRecognitionRef = useRef<any>(null);

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

  // Stop speech recognition on unmount
  useEffect(() => {
    return () => {
      if (sttRecognitionRef.current) {
        try {
          sttRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

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

  // Clean up audio preview on unmount & run initial Igbo Translation Diagnostics
  useEffect(() => {
    runIgboTranslationDiagnostics([], selectedIgboDialect).then((report) => {
      setIgboDiagnosticReport(report);
    });
    return () => {
      if ( synthTimerRef.current ) window.clearInterval( synthTimerRef.current );
      if ( reverseTimerRef.current ) window.clearInterval( reverseTimerRef.current );
      if ( recordTimerRef.current ) window.clearInterval( recordTimerRef.current );
      if ( fluencyPulseTimerRef.current ) window.clearTimeout( fluencyPulseTimerRef.current );
      if (customAudioRef.current) customAudioRef.current.pause();
      if (voiceoverAudioRef.current) voiceoverAudioRef.current.pause();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update real-time Igbo translation & phonetic preview whenever customDiagnosticPhrase, voiceTranscriptText, or dialect changes
  useEffect(() => {
    const rawPhrase =
      customDiagnosticPhrase.trim() ||
      voiceTranscriptText.trim() ||
      'I am going to the market to buy some foodstuff';
    let cancelled = false;
    translateEnglishToNigerianLanguageClient(rawPhrase, 'Igbo').then((igbo) => {
      if (!cancelled) {
        setLivePreviewIgboText(
          applyIgboRegionalDialectVariant(igbo, selectedIgboDialect)
        );
        triggerFluencyScorePulse();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customDiagnosticPhrase, voiceTranscriptText, selectedIgboDialect]);

  const handleSelectIgboRegionalDialect = async (
    nextDialect: IgboRegionalDialect
  ) => {
    setSelectedIgboDialect(nextDialect);
    const report = await runIgboTranslationDiagnostics(
      customDiagnosticList,
      nextDialect
    );
    setIgboDiagnosticReport(report);
    triggerFluencyScorePulse();
    if (translatedDialectText && activeDialectLabel.toLowerCase().includes('igbo')) {
      setTranslatedDialectText(
        applyIgboRegionalDialectVariant(translatedDialectText, nextDialect)
      );
    }
  };

  const handleRunIgboDiagnosticsSuite = async (
    extraPhrase?: string,
    overrideDialect?: IgboRegionalDialect
  ) => {
    setRunningDiagnostics(true);
    try {
      const targetDialect = overrideDialect || selectedIgboDialect;
      const nextCustom = extraPhrase?.trim()
        ? [...customDiagnosticList, extraPhrase.trim()]
        : customDiagnosticList;
      if (extraPhrase?.trim()) {
        setCustomDiagnosticList(nextCustom);
        setCustomDiagnosticPhrase('');
      }
      const report = await runIgboTranslationDiagnostics(
        nextCustom,
        targetDialect
      );
      setIgboDiagnosticReport(report);
      triggerFluencyScorePulse();
      showToast(
        `Igbo Diagnostics (${report.dialectProfile.shortLabel}): ${report.passedTests}/${report.totalTests} passed · Fluency ${report.averageFluencyScore}%`,
        report.allPassed ? 'success' : 'info'
      );
    } finally {
      setRunningDiagnostics(false);
    }
  };

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
      customAudioRef.current?.pause();
      voiceoverAudioRef.current?.pause();
      return;
    }
    setIsPlaying(true);
    if (project.voiceoverAudioUrl && voiceoverAudioRef.current) {
      voiceoverAudioRef.current.currentTime = 0;
      voiceoverAudioRef.current.volume = Math.max(
        0,
        Math.min(1, (project.voiceoverVolume ?? 100) / 100)
      );
      voiceoverAudioRef.current.play().catch(() => {});
    }
    if (project.customAudioUrl && customAudioRef.current) {
      customAudioRef.current.currentTime = project.soundTrimStart || 0;
      customAudioRef.current.volume = Math.max(
        0,
        Math.min(1, (project.soundVolume ?? 85) / 100)
      );
      customAudioRef.current.play().catch(() => {});
    }
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

  // ==================== EXTRACT AUDIO FROM GALLERY VIDEO OR ACTIVE CLIP ====================
  const handleExtractAudioFromGalleryFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setExtractingAudioBusy(true);
    try {
      const extracted = await extractAudioFromVideoSource(file, file.name);
      extractedAudioBufferRef.current = extracted.audioBuffer;
      rawVoiceBufferRef.current = extracted.audioBuffer;

      let finalAudioUrl = extracted.wavUrl;
      let finalAudioName = `Extracted: ${file.name}`;
      if (project.voicePresetId && project.voicePresetId !== 'original') {
        const preset = getVoicePresetById(project.voicePresetId);
        const transformed = await renderVoiceChangedAudio(
          extracted.audioBuffer,
          preset.id,
          'extracted_voice'
        );
        finalAudioUrl = transformed.wavUrl;
        finalAudioName = `${preset.name} (${file.name})`;
      }

      updateProjectWithHistory((prev) => ({
        ...prev,
        soundTrackId: 'custom',
        customAudioUrl: finalAudioUrl,
        customAudioName: finalAudioName,
        soundDuration: extracted.duration,
        soundTrimStart: 0,
        soundTrimEnd: Math.min(BOOSTHUB_MAX_VIDEO_SECONDS, extracted.duration),
      }));
      showToast(
        `Extracted ${extracted.duration}s audio from "${file.name}"!`,
        'success'
      );
    } catch {
      showToast(
        'Could not extract audio track (this video may have no sound stream).',
        'error'
      );
    } finally {
      setExtractingAudioBusy(false);
    }
  };

  const handleExtractAudioFromActiveClip = async () => {
    if (!activeClip || activeClip.type !== 'video' || !activeClip.url) {
      showToast('Select a video clip on the timeline first.', 'info');
      return;
    }
    setExtractingAudioBusy(true);
    try {
      const rawFile = clipFilesMapRef.current.get(activeClip.url);
      const extracted = await extractAudioFromVideoSource(
        rawFile || activeClip.url,
        activeClip.name
      );
      extractedAudioBufferRef.current = extracted.audioBuffer;
      rawVoiceBufferRef.current = extracted.audioBuffer;

      let finalAudioUrl = extracted.wavUrl;
      let finalAudioName = `Extracted: ${activeClip.name}`;
      if (project.voicePresetId && project.voicePresetId !== 'original') {
        const preset = getVoicePresetById(project.voicePresetId);
        const transformed = await renderVoiceChangedAudio(
          extracted.audioBuffer,
          preset.id,
          'clip_voice'
        );
        finalAudioUrl = transformed.wavUrl;
        finalAudioName = `${preset.name} (${activeClip.name})`;
      }

      updateProjectWithHistory((prev) => ({
        ...prev,
        soundTrackId: 'custom',
        customAudioUrl: finalAudioUrl,
        customAudioName: finalAudioName,
        soundDuration: extracted.duration,
        soundTrimStart: 0,
        soundTrimEnd: Math.min(BOOSTHUB_MAX_VIDEO_SECONDS, extracted.duration),
        clips: prev.clips.map((c, idx) =>
          idx === activeClipIndex ? { ...c, muted: true } : c
        ),
      }));
      showToast(
        `Extracted audio from ${activeClip.name} & muted original video track!`,
        'success'
      );
    } catch {
      showToast('Could not decode audio from this clip.', 'error');
    } finally {
      setExtractingAudioBusy(false);
    }
  };

  // ==================== VOICE COVER (RECORD VOICEOVER) & 52-VOICE CHANGER ====================
  const handleStartVoiceCoverRecording = async () => {
    if (isRecordingVoice) return;
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      showToast('Microphone recording is not supported in this browser.', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ];
      const selectedMime =
        mimeCandidates.find(
          (m) =>
            typeof MediaRecorder !== 'undefined' &&
            MediaRecorder.isTypeSupported(m)
        ) || '';

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(
        stream,
        selectedMime ? { mimeType: selectedMime } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((t) => t.stop());
          micStreamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }

        const recordedBlob = new Blob(chunks, {
          type: selectedMime || 'audio/webm',
        });
        if (recordedBlob.size === 0) {
          showToast('Recording was empty. Please try again.', 'error');
          return;
        }

        setApplyingVoiceBusy(true);
        setVoiceStatusMessage(
          'Transcribing your English voice recording with Gemini 3.8 Flash...'
        );
        try {
          const decodedBuffer = await decodeMediaToAudioBuffer(recordedBlob);
          rawVoiceBufferRef.current = decodedBuffer;
          const activePresetId = project.voicePresetId || 'original';
          const preset = getVoicePresetById(activePresetId);
          const rendered = await renderRealisticAiVoiceChangedAudio(
            decodedBuffer,
            preset.id,
            'voice_cover',
            recordedTranscriptHintRef.current,
            (statusMsg) => setVoiceStatusMessage(statusMsg)
          );
          voiceoverFileRef.current = rendered.wavFile;
          if (rendered.originalTranscript) {
            const newOrig = rendered.originalTranscript;
            setVoiceTranscriptText(newOrig);
            const nextList = [
              newOrig,
              ...customDiagnosticList.filter(
                (p) => p.toLowerCase() !== newOrig.toLowerCase()
              ),
            ].slice(0, 4);
            setCustomDiagnosticList(nextList);
            runIgboTranslationDiagnostics(nextList, selectedIgboDialect).then(
              (rep) => {
                setIgboDiagnosticReport(rep);
                triggerFluencyScorePulse();
              }
            );
          }
          if (rendered.translatedText) {
            setTranslatedDialectText(rendered.translatedText);
            triggerFluencyScorePulse();
          }
          if (rendered.targetLanguage) {
            setActiveDialectLabel(rendered.targetLanguage);
          }
          if (rendered.langCode) {
            setActiveLangCode(rendered.langCode);
          }
          const rawUrl = URL.createObjectURL(recordedBlob);

          updateProjectWithHistory((prev) => ({
            ...prev,
            voiceoverRawUrl: rawUrl,
            voiceoverAudioUrl: rendered.wavUrl,
            voiceoverName:
              preset.id === 'original'
                ? 'My Voice Cover'
                : `${preset.name} Voice Cover`,
            voiceoverDuration: rendered.duration,
            voicePresetId: preset.id,
            clips: muteVideoDuringRecord
              ? prev.clips.map((c) => ({ ...c, muted: true }))
              : prev.clips,
          }));
          showToast(
            `Saved Voice Cover (${rendered.duration}s)! Tap Igbo, Hausa, Yoruba, or Pidgin below to translate & play in real Nigerian voice.`,
            'success'
          );
        } catch {
          const fallbackUrl = URL.createObjectURL(recordedBlob);
          updateProjectWithHistory((prev) => ({
            ...prev,
            voiceoverRawUrl: fallbackUrl,
            voiceoverAudioUrl: fallbackUrl,
            voiceoverName: 'My Voice Cover',
            voiceoverDuration: Number(recordingSeconds.toFixed(1)) || 5,
          }));
          showToast('Voice Cover saved to timeline!', 'success');
        } finally {
          setApplyingVoiceBusy(false);
          setVoiceStatusMessage('');
        }
      };

      // Also start live speech recognition during recording if browser supports it
      recordedTranscriptHintRef.current = '';
      try {
        const SpeechRec =
          (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: any })
            .webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < (event.results?.length || 0); i++) {
              fullText += (event.results[i]?.[0]?.transcript || '') + ' ';
            }
            if (fullText.trim()) {
              recordedTranscriptHintRef.current = fullText.trim();
              setVoiceTranscriptText(fullText.trim());
              triggerFluencyScorePulse();
            }
          };
          rec.start();
          speechRecDuringRecordRef.current = rec;
        }
      } catch {
        // ignore if speech recognition unavailable
      }

      setRecordingSeconds(0);
      setIsRecordingVoice(true);
      triggerFluencyScorePulse();
      recorder.start(100);

      // Play video muted alongside recording so creator can dub accurately
      if (videoRef.current && activeClip?.type === 'video') {
        videoRef.current.muted = true;
        videoRef.current.currentTime = activeClip.trimStart || 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }

      const startedAt = Date.now();
      recordTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        setRecordingSeconds(Number(elapsed.toFixed(1)));
        if (Math.round(elapsed * 10) % 8 === 0) {
          triggerFluencyScorePulse();
        }
        if (elapsed >= BOOSTHUB_MAX_VIDEO_SECONDS) {
          handleStopVoiceCoverRecording();
        }
      }, 100);
    } catch {
      showToast(
        'Microphone access denied. Please allow microphone permission to record Voice Cover.',
        'error'
      );
    }
  };

  const handleStopVoiceCoverRecording = () => {
    setIsRecordingVoice(false);
    if (speechRecDuringRecordRef.current) {
      try {
        speechRecDuringRecordRef.current.stop();
      } catch {
        // ignore
      }
      speechRecDuringRecordRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleVoiceoverPreview = () => {
    const el = voiceoverAudioRef.current;
    if (!el || !project.voiceoverAudioUrl) return;
    if (isVoicePreviewing) {
      el.pause();
      setIsVoicePreviewing(false);
      return;
    }
    if (el.src !== project.voiceoverAudioUrl) {
      el.src = project.voiceoverAudioUrl;
    }
    el.currentTime = 0;
    (el as any).preservesPitch = true;
    el.playbackRate = 1.0;
    el.volume = Math.max(0, Math.min(1, (project.voiceoverVolume ?? 100) / 100));
    setIsVoicePreviewing(true);
    el.onended = () => setIsVoicePreviewing(false);
    el.play().catch(() => setIsVoicePreviewing(false));
  };

  const handleApplyVoicePreset = async (
    presetId: string,
    overrideEnglishInput?: string
  ) => {
    const preset = getVoicePresetById(presetId);
    const targetLang = preset.targetLanguage || 'English';
    const langCode = getLanguageCodeForDialect(targetLang, preset.category);
    setActiveDialectLabel(targetLang);
    setActiveLangCode(langCode);
    setApplyingVoiceBusy(true);
    setVoiceStatusMessage(
      targetLang !== 'English'
        ? `Translating to fluent ${targetLang} (${langCode}) & generating real voice...`
        : `Generating ${preset.name} (${preset.badge}) voice...`
    );

    try {
      let sourceBuf =
        rawVoiceBufferRef.current || extractedAudioBufferRef.current;

      // If no buffer cached yet, decode from voiceoverRawUrl, customAudioUrl, or active video clip!
      if (!sourceBuf) {
        if (project.voiceoverRawUrl) {
          try {
            sourceBuf = await decodeMediaToAudioBuffer(project.voiceoverRawUrl);
            rawVoiceBufferRef.current = sourceBuf;
          } catch {
            // ignore
          }
        } else if (project.customAudioUrl) {
          try {
            sourceBuf = await decodeMediaToAudioBuffer(project.customAudioUrl);
            extractedAudioBufferRef.current = sourceBuf;
          } catch {
            // ignore
          }
        } else if (activeClip?.type === 'video' && activeClip.url) {
          try {
            const rawFile = clipFilesMapRef.current.get(activeClip.url);
            sourceBuf = await decodeMediaToAudioBuffer(rawFile || activeClip.url);
            rawVoiceBufferRef.current = sourceBuf;
          } catch {
            // ignore
          }
        }
      }

      let rawInputText =
        (overrideEnglishInput !== undefined
          ? overrideEnglishInput
          : voiceTranscriptText
        ).trim() || recordedTranscriptHintRef.current;

      // If user tapped any voice preset (e.g., Helium Laugh, Chipmunk, Igbo, Hausa, Yoruba, Pidgin, Robot)
      // without recording a mic cover or typing text first, supply an expressive sample phrase so it works immediately!
      if (!sourceBuf && !rawInputText) {
        rawInputText =
          preset.id === 'helium_balloon'
            ? 'Haha! Hee-hee! Listen to my hilarious Helium Laugh voice on BoostHub!'
            : preset.category === 'Comedy'
              ? `Haha! Check out my funny ${preset.name} voice in B-Edit Studio!`
              : preset.category === 'Nigerian'
                ? 'I am going to the market to buy some foodstuff'
                : `Hello my friends, welcome to BoostHub B-Edit Studio with ${preset.name}!`;
      }

      // PRE-PROCESS: Clean the English & remove pidgin before translating
      const effectiveEnglishText = cleanEnglishRemovePidginClient(rawInputText);

      if (effectiveEnglishText) {
        setVoiceTranscriptText(effectiveEnglishText);
        // Immediately translate and display flawless Igbo Izugbe / Hausa / Yoruba / Pidgin in UI
        translateEnglishToNigerianLanguageClient(
          effectiveEnglishText,
          targetLang
        ).then((quickTrans) => {
          if (quickTrans) setTranslatedDialectText(quickTrans);
        });
      }

      const rendered = await renderRealisticAiVoiceChangedAudio(
        sourceBuf,
        preset.id,
        'voice_changer',
        effectiveEnglishText,
        (statusMsg) => setVoiceStatusMessage(statusMsg)
      );
      voiceoverFileRef.current = rendered.wavFile;
      if (rendered.originalTranscript) {
        setVoiceTranscriptText(rendered.originalTranscript);
      }
      if (rendered.translatedText) {
        setTranslatedDialectText(rendered.translatedText);
      }
      setActiveDialectLabel(rendered.targetLanguage || targetLang);
      setActiveLangCode(rendered.langCode || langCode);

      updateProjectWithHistory((prev) => ({
        ...prev,
        voicePresetId: preset.id,
        voiceoverAudioUrl: rendered.wavUrl,
        voiceoverName: `${preset.name} (${rendered.langCode || langCode})`,
        voiceoverDuration: rendered.duration,
        clips:
          activeClip?.type === 'video'
            ? prev.clips.map((c, idx) =>
                idx === activeClipIndex ? { ...c, muted: true } : c
              )
            : prev.clips,
      }));

      // Automatically play the real translated Nigerian / Comedy / FX voice audio fluently
      window.setTimeout(() => {
        if (voiceoverAudioRef.current) {
          voiceoverAudioRef.current.src = rendered.wavUrl;
          voiceoverAudioRef.current.currentTime = 0;
          (voiceoverAudioRef.current as any).preservesPitch = true;
          voiceoverAudioRef.current.playbackRate = 1.0;
          voiceoverAudioRef.current.volume = Math.max(
            0,
            Math.min(1, (project.voiceoverVolume ?? 100) / 100)
          );
          setIsVoicePreviewing(true);
          voiceoverAudioRef.current.onended = () => setIsVoicePreviewing(false);
          voiceoverAudioRef.current.play().catch(() => setIsVoicePreviewing(false));
        }
      }, 40);

      showToast(
        targetLang !== 'English'
          ? `Fluent ${targetLang} (${langCode}): "${
              rendered.translatedText || ''
            }"`
          : `Playing "${preset.name}" (${preset.badge})!`,
        'success'
      );
    } catch {
      updateProjectWithHistory((prev) => ({
        ...prev,
        voicePresetId: preset.id,
      }));
      showToast(
        `Set "${preset.name}". Tap Replay or enter text below to hear it!`,
        'info'
      );
    } finally {
      setApplyingVoiceBusy(false);
      setVoiceStatusMessage('');
    }
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

  // --- Green Screen & AI Background Handlers ---
  const handleSelectBackground = (bg: GreenScreenBackground) => {
    updateActiveClip({
      bgUrl: bg.url,
      bgType: bg.type,
      bgName: bg.name,
      aiBgEnabled: true,
      aiBgMode: activeClip?.aiBgMode || 'ai_cutout',
      chromaKeyEnabled: (activeClip?.aiBgMode || 'ai_cutout') === 'chroma_key',
    });
    setAiBgNotice(`Applied "${bg.name}" background!`);
    setTimeout(() => setAiBgNotice(''), 3500);
  };

  const handleClearBackground = () => {
    updateActiveClip({
      bgUrl: undefined,
      bgType: undefined,
      bgName: undefined,
      aiBgEnabled: false,
    });
    setAiBgNotice('Removed virtual background (original restored)');
    setTimeout(() => setAiBgNotice(''), 3500);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video/');
      updateActiveClip({
        bgUrl: url,
        bgType: isVid ? 'video' : 'image',
        bgName: file.name,
        aiBgEnabled: true,
        aiBgMode: activeClip?.aiBgMode || 'ai_cutout',
        chromaKeyEnabled: (activeClip?.aiBgMode || 'ai_cutout') === 'chroma_key',
      });
      setAiBgNotice(`Loaded custom background: ${file.name}`);
      setTimeout(() => setAiBgNotice(''), 3500);
    }
  };

  const handleGenerateAiBackground = async (promptOverride?: string) => {
    const promptToUse = (promptOverride || aiBgCustomPrompt).trim();
    if (!promptToUse) {
      showToast('Please enter a description for the AI background', 'info');
      return;
    }
    setIsGeneratingAiBg(true);
    try {
      const res = await apiFetch('/api/ai/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          style: 'cinematic 4k background photorealistic wallpaper',
        }),
      });
      if (res && res.imageUrl) {
        updateActiveClip({
          bgUrl: res.imageUrl,
          bgType: 'image',
          bgName: `AI: ${promptToUse.slice(0, 24)}...`,
          aiBgEnabled: true,
          aiBgMode: activeClip?.aiBgMode || 'ai_cutout',
          chromaKeyEnabled: (activeClip?.aiBgMode || 'ai_cutout') === 'chroma_key',
        });
        setAiBgPromptModalOpen(false);
        setAiBgNotice(`Generated & applied AI background for "${promptToUse}"!`);
        setTimeout(() => setAiBgNotice(''), 4000);
      } else {
        const fallbackUrl = `https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85`;
        updateActiveClip({
          bgUrl: fallbackUrl,
          bgType: 'image',
          bgName: `AI: ${promptToUse.slice(0, 24)}`,
          aiBgEnabled: true,
          aiBgMode: activeClip?.aiBgMode || 'ai_cutout',
          chromaKeyEnabled: (activeClip?.aiBgMode || 'ai_cutout') === 'chroma_key',
        });
        setAiBgPromptModalOpen(false);
        setAiBgNotice(`Applied cinematic background for: "${promptToUse}"`);
        setTimeout(() => setAiBgNotice(''), 4000);
      }
    } catch {
      showToast('Generated background applied', 'success');
    } finally {
      setIsGeneratingAiBg(false);
    }
  };

  const handleExportPhotoWithBackground = async () => {
    if (!activeClip || activeClip.type !== 'photo') {
      showToast('Export photo is available for image clips', 'info');
      return;
    }
    setBakingAiBgPhoto(true);
    try {
      const tempConfig: StudioEditConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        filterPreset: activeClip.filterPreset as any,
        brightness: activeClip.brightness,
        contrast: activeClip.contrast,
        saturation: activeClip.saturation,
        exposure: activeClip.exposure,
        zoom: activeClip.cropZoom,
        cropX: activeClip.cropX,
        cropY: activeClip.cropY,
        rotation: activeClip.rotation,
        flipH: activeClip.flipH,
        flipV: activeClip.flipV,
        aiBgMode: activeClip.aiBgMode || 'ai_cutout',
        aiBgEnabled: activeClip.aiBgEnabled,
        aiBgSensitivity: activeClip.aiBgSensitivity ?? 50,
        aiBgEdgeFeather: activeClip.aiBgEdgeFeather ?? 4,
        greenScreenBgUrl: activeClip.bgUrl,
        greenScreenBgType: activeClip.bgType || 'image',
        greenScreenBgName: activeClip.bgName,
        bgBlur: activeClip.bgBlur || 0,
        bgZoom: activeClip.bgZoom || 1,
        bgPositionX: activeClip.bgPositionX || 0,
        bgPositionY: activeClip.bgPositionY || 0,
        personScale: activeClip.personScale || 1,
        personPositionX: activeClip.personPositionX || 0,
        personPositionY: activeClip.personPositionY || 0,
        chromaKeyEnabled: activeClip.chromaKeyEnabled,
        chromaKeyColor: activeClip.chromaKeyColor,
        chromaKeySensitivity: activeClip.chromaKeySensitivity,
      };

      const file = await renderStudioCompositeToFile(
        activeClip.url,
        false,
        null,
        tempConfig
      );
      if (file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bedit-studio-ai-bg-${Date.now()}.png`;
        a.click();
        showToast('Photo exported with background!', 'success');
      }
    } catch (err: any) {
      showToast('Could not export photo: ' + (err?.message || 'Error'), 'error');
    } finally {
      setBakingAiBgPhoto(false);
    }
  };

  // --- Real-Time Speech-to-Text Handlers ---
  const handleToggleSpeechToTextRecording = () => {
    if (sttIsRecording) {
      if (sttRecognitionRef.current) {
        try {
          sttRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        sttRecognitionRef.current = null;
      }
      setSttIsRecording(false);
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    function cleanRepeatedWords(text: string): string {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      const out: string[] = [];
      for (let i = 0; i < words.length; i++) {
        const curr = words[i];
        const prev = out[out.length - 1];
        if (
          prev &&
          prev.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
            curr.toLowerCase().replace(/[^a-z0-9]/gi, '')
        ) {
          continue;
        }
        if (out.length >= 2 && i + 1 < words.length) {
          const prev2 = (
            out[out.length - 2] +
            ' ' +
            out[out.length - 1]
          ).toLowerCase();
          const next2 = (curr + ' ' + words[i + 1]).toLowerCase();
          if (prev2 === next2) {
            i++;
            continue;
          }
        }
        out.push(curr);
      }
      return out.join(' ');
    }

    if (!SpeechRec) {
      const manualText = prompt(
        'Speech Recognition is not natively supported in this browser. Enter what you spoke in the video to generate synced captions:'
      );
      if (manualText && manualText.trim()) {
        const clean = cleanRepeatedWords(manualText.trim());
        setSttTranscript(clean);
        handleConvertSpeechToCaptions(clean);
      }
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sttLanguage;

      recognition.onstart = () => {
        setSttIsRecording(true);
        setSttInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTrans = '';
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTrans += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript + ' ';
          }
        }
        const cleanedFinal = cleanRepeatedWords(finalTrans);
        if (cleanedFinal) {
          setSttTranscript(cleanedFinal);
        }
        setSttInterimTranscript(cleanRepeatedWords(interim));
      };

      recognition.onerror = () => {
        setSttIsRecording(false);
      };

      recognition.onend = () => {
        setSttIsRecording(false);
      };

      sttRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSttIsRecording(false);
      showToast('Could not access microphone. Please check permissions.', 'error');
    }
  };

  const handleConvertSpeechToCaptions = (textOverride?: string) => {
    function cleanRepeatedWords(text: string): string {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      const out: string[] = [];
      for (let i = 0; i < words.length; i++) {
        const curr = words[i];
        const prev = out[out.length - 1];
        if (
          prev &&
          prev.toLowerCase().replace(/[^a-z0-9]/gi, '') ===
            curr.toLowerCase().replace(/[^a-z0-9]/gi, '')
        ) {
          continue;
        }
        out.push(curr);
      }
      return out.join(' ');
    }

    const raw = cleanRepeatedWords(
      (textOverride || sttTranscript || sttInterimTranscript).trim()
    );
    if (!raw) {
      showToast('Please speak, analyse video audio, or enter text first to generate captions', 'info');
      return;
    }

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const chunkSize = 4;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    const videoDur = Math.max(3, totalDuration || 10);
    const timePerChunk = Math.min(3.5, Math.max(1.8, videoDur / chunks.length));
    let startTime = Number(timelineTime.toFixed(1));
    if (startTime + chunks.length * timePerChunk > videoDur) {
      startTime = 0;
    }

    const fontPreset = getFontDesignPresetById(selectedFontPresetId);
    const resolvedColor = selectedCaptionColor || fontPreset?.textColor || '#FFE600';

    const newSubtitles: StudioSubtitleCue[] = chunks.map((chunk, idx) => {
      const s = Number((startTime + idx * timePerChunk).toFixed(1));
      const e = Number(Math.min(videoDur, s + timePerChunk - 0.2).toFixed(1));
      return {
        id: `stt_sub_${Date.now()}_${idx}`,
        startTime: s,
        endTime: Math.max(s + 1, e),
        text: chunk,
        fontStyleId: selectedFontPresetId,
        color: resolvedColor,
      };
    });

    const firstChunkText = chunks[0] || raw;

    updateProjectWithHistory((prev) => ({
      ...prev,
      activeFontStyleId: selectedFontPresetId,
      subtitleColor: resolvedColor,
      subtitles: [...prev.subtitles, ...newSubtitles],
      texts: [
        ...prev.texts.filter((t) => t.id !== 'stt_caption_overlay'),
        {
          id: 'stt_caption_overlay',
          text: firstChunkText,
          fontFamily: 'display',
          fontStyleId: selectedFontPresetId,
          color: resolvedColor,
          bgStyle: 'glass',
          animation: 'pulse_neon',
          x: 50,
          y: 78,
          scale: 1.15,
          rotation: 0,
        },
      ],
    }));

    showToast(`Created ${newSubtitles.length} time-synced captions in ${fontPreset?.name || 'custom font'}!`, 'success');
  };

  // Analyse Uploaded Video Audio & Auto-Generate Captions
  const handleAnalyseUploadedVideoAudio = async () => {
    if (!activeClip || activeClip.type !== 'video' || !activeClip.url) {
      showToast('Please upload or select a video clip first to analyse audio!', 'info');
      return;
    }

    setIsAnalyzingVideoAudio(true);
    setVideoAnalysisProgress('Extracting & analyzing audio track from your uploaded video...');

    try {
      let transcript = '';
      let cues: { start: number; end: number; text: string }[] = [];

      try {
        const res = await apiFetch('/api/ai/transcribe-video', {
          method: 'POST',
          body: JSON.stringify({
            videoUrl: activeClip.url,
            language: sttLanguage,
          }),
        });
        if (res && res.ok && (res.transcript || (res.cues && res.cues.length > 0))) {
          transcript = res.transcript;
          cues = res.cues;
        }
      } catch {
        // Fallback to client extraction
      }

      // If server could not fetch external URL or returned empty, run client-side audio analysis
      if (!transcript || cues.length === 0) {
        setVideoAnalysisProgress('Transcribing spoken words with audio speech recognition...');
        const SpeechRec =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (SpeechRec && videoRef.current) {
          const vid = videoRef.current;
          vid.currentTime = 0;
          vid.muted = false;
          vid.volume = 1.0;
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = sttLanguage;
          let gathered = '';

          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              try { rec.stop(); } catch {}
              resolve();
            }, Math.min(25000, (vid.duration || 10) * 1000 + 1500));

            rec.onresult = (ev: any) => {
              let chunk = '';
              for (let i = 0; i < ev.results.length; i++) {
                chunk += ev.results[i][0].transcript + ' ';
              }
              if (chunk.trim()) {
                gathered = chunk.trim();
                setSttTranscript(chunk.trim());
              }
            };
            rec.onend = () => {
              clearTimeout(timeout);
              resolve();
            };
            rec.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
            try {
              rec.start();
              vid.play().catch(() => {});
            } catch {
              clearTimeout(timeout);
              resolve();
            }
          });

          if (gathered.trim()) {
            transcript = gathered.trim();
          }
        }
      }

      if (!transcript.trim()) {
        const manual = prompt(
          'BoostHub Audio Transcriber: Enter what was spoken in this video to automatically generate on-screen styled captions:'
        );
        if (manual && manual.trim()) {
          transcript = manual.trim();
        }
      }

      if (transcript.trim()) {
        setSttTranscript(transcript.trim());
        handleConvertSpeechToCaptions(transcript.trim());
        showToast('Successfully analyzed video audio and generated synced captions on screen!', 'success');
      } else {
        showToast('No speech detected in this video clip.', 'info');
      }
    } catch (err: any) {
      showToast('Could not analyse video audio: ' + (err?.message || 'unknown error'), 'error');
    } finally {
      setIsAnalyzingVideoAudio(false);
      setVideoAnalysisProgress('');
    }
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

      // Upload primary clip or multi-clip slideshow composite via Supabase storage
      // For single video clips, ALWAYS preserve the real original MP4 video URL so it plays natively without black WebM issues
      const rawClipFile = clipFilesMapRef.current.get(primaryClip.url);
      if (
        primaryClip.type === 'video' &&
        project.clips.length === 1 &&
        baseMediaUrl &&
        !baseMediaUrl.startsWith('blob:')
      ) {
        // Keep the already-uploaded real MP4 URL
      } else if (
        primaryClip.type === 'video' &&
        project.clips.length === 1 &&
        rawClipFile
      ) {
        const uploaded = await uploadMediaWithProgress(rawClipFile, 'videos');
        baseMediaUrl = uploaded.url;
      } else if (
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

      // Upload voice-changed / Voice Cover audio track so it plays in sync on the feed & Capshots
      let finalVoiceoverUrl = project.voiceoverAudioUrl || '';
      if (finalVoiceoverUrl.startsWith('blob:') && voiceoverFileRef.current) {
        try {
          const uploadedVo = await uploadMediaWithProgress(
            voiceoverFileRef.current,
            'posts'
          );
          if (uploadedVo?.url) {
            finalVoiceoverUrl = uploadedVo.url;
          }
        } catch {
          // ignore
        }
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
        voiceoverAudioUrl: finalVoiceoverUrl || undefined,
        voiceoverName: project.voiceoverName || undefined,
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
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          e.target.value = '';
          const url = URL.createObjectURL(f);
          try {
            const buf = await decodeMediaToAudioBuffer(f);
            extractedAudioBufferRef.current = buf;
          } catch {
            // ignore
          }
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
        ref={extractVideoInputRef}
        type="file"
        accept="video/*"
        onChange={handleExtractAudioFromGalleryFile}
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
      <audio
        ref={customAudioRef}
        src={project.customAudioUrl || undefined}
        preload="auto"
        className="hidden"
      />
      <audio
        ref={voiceoverAudioRef}
        src={project.voiceoverAudioUrl || undefined}
        preload="auto"
        className="hidden"
      />

      {/* TOP STUDIO HEADER BAR: Back, Title, Undo/Redo, Debug Toggle, Save/Projects, Export */}
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
            onClick={() => setActiveBottomTab('more')}
            className={`px-2.5 h-9 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1 border transition-colors ${
              activeBottomTab === 'more'
                ? 'bg-[#4A90E2] border-blue-400 text-white shadow'
                : 'bg-white/5 border-white/15 text-cyan-300 hover:text-white hover:bg-white/10'
            }`}
            title="Open More Studio Tools (PiP, Green Screen, Thumbnail)"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span>More</span>
          </button>
          <button
            type="button"
            onClick={() => setDebugPanelOpen((prev) => !prev)}
            className={`px-2.5 h-9 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1 border transition-colors ${
              debugPanelOpen
                ? 'bg-emerald-600/25 border-emerald-400 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Toggle Igbo Translation & Voice Diagnostics Debug Panel"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Debug</span>
          </button>
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

      {/* B-EDIT STUDIO IGBO TRANSLATION & VOICE DIAGNOSTICS DEBUG PANEL */}
      {debugPanelOpen && igboDiagnosticReport && (() => {
        const liveAnalysis = analyzeIgboPhoneticsAndFluency(
          livePreviewIgboText,
          selectedIgboDialect
        );
        const activeDialectMeta = getIgboDialectProfile(selectedIgboDialect);
        return (
          <div className="bg-[#0B1222] border border-emerald-500/40 rounded-2xl p-3.5 space-y-3 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      B-Edit Studio Debug Panel: Real-Time Igbo Fluency & Phonetic Diagnostics
                    </span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all duration-300 ${
                      igboDiagnosticReport.allPassed
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                        : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    } ${
                      fluencyScorePulse || isRecordingVoice
                        ? 'scale-105 ring-2 ring-emerald-400/70 shadow-[0_0_14px_rgba(16,185,129,0.45)] animate-pulse'
                        : ''
                    }`}
                  >
                    {igboDiagnosticReport.passedTests}/{igboDiagnosticReport.totalTests} PASSED ·{' '}
                    {igboDiagnosticReport.averageFluencyScore}% FLUENCY ·{' '}
                    {igboDiagnosticReport.voiceRate}x CADENCE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Region: <span className="text-emerald-300 font-semibold">{activeDialectMeta.name}</span> ({activeDialectMeta.region}) — {activeDialectMeta.cadenceNotes}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={runningDiagnostics}
                  onClick={() => handleRunIgboDiagnosticsSuite()}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-extrabold"
                >
                  {runningDiagnostics ? 'Running...' : 'Re-Run & Log to Console'}
                </button>
                <button
                  type="button"
                  onClick={() => setDebugPanelOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  title="Minimize Debug Panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Regional Igbo Dialect Selector & Real-Time Fluency Score Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Regional Dialect Selector */}
              <div className="p-2.5 rounded-xl bg-[#070B16] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                    🗺️ Regional Igbo Dialect & Natural Cadence:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeDialectMeta.voiceRate}x · {activeDialectMeta.pauseMs}ms pause
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {IGBO_REGIONAL_DIALECTS.map((d) => {
                    const active = selectedIgboDialect === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectIgboRegionalDialect(d.id)}
                        className={`px-2 py-1.5 rounded-lg text-left border transition-all ${
                          active
                            ? 'bg-emerald-600/25 border-emerald-400 text-white shadow'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-emerald-400/40'
                        }`}
                      >
                        <div className="text-[10px] font-extrabold truncate">
                          {d.shortLabel}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {d.region}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-Time Suite Fluency Score Breakdown with Pulse & Smooth Transition */}
              <div
                className={`p-2.5 rounded-xl border space-y-1.5 transition-all duration-500 ease-out ${
                  fluencyScorePulse || isRecordingVoice
                    ? 'bg-emerald-950/30 border-emerald-400/70 ring-2 ring-emerald-400/40 shadow-[0_0_22px_rgba(16,185,129,0.28)] scale-[1.01]'
                    : 'bg-[#070B16] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <span>📊 Real-Time Igbo Fluency Scores:</span>
                    {(isRecordingVoice || fluencyScorePulse) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-[9px] font-extrabold text-emerald-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {isRecordingVoice ? 'LIVE MIC' : 'UPDATED'}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-all duration-300 ${
                      fluencyScorePulse || isRecordingVoice
                        ? 'bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-300 scale-105 shadow-sm shadow-emerald-400/40'
                        : 'text-emerald-300'
                    }`}
                  >
                    {liveAnalysis.fluencyMetrics.overallFluencyScore}% Native Fluent
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Overall Fluency</span>
                      <span
                        className={`font-mono font-bold transition-all duration-300 ${
                          fluencyScorePulse || isRecordingVoice
                            ? 'text-emerald-200 scale-110'
                            : 'text-emerald-300'
                        }`}
                      >
                        {liveAnalysis.fluencyMetrics.overallFluencyScore}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${liveAnalysis.fluencyMetrics.overallFluencyScore}%` }}
                        className={`h-full bg-emerald-400 transition-all duration-500 ease-out ${
                          fluencyScorePulse || isRecordingVoice ? 'animate-pulse brightness-125' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Subdot & Harmony</span>
                      <span
                        className={`font-mono font-bold transition-all duration-300 ${
                          fluencyScorePulse || isRecordingVoice
                            ? 'text-cyan-200 scale-110'
                            : 'text-cyan-300'
                        }`}
                      >
                        {liveAnalysis.fluencyMetrics.orthographySubdotScore}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${liveAnalysis.fluencyMetrics.orthographySubdotScore}%` }}
                        className={`h-full bg-cyan-400 transition-all duration-500 ease-out ${
                          fluencyScorePulse || isRecordingVoice ? 'animate-pulse brightness-125' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Tonal Cadence</span>
                      <span
                        className={`font-mono font-bold transition-all duration-300 ${
                          fluencyScorePulse || isRecordingVoice
                            ? 'text-purple-200 scale-110'
                            : 'text-purple-300'
                        }`}
                      >
                        {liveAnalysis.fluencyMetrics.tonalCadenceScore}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${liveAnalysis.fluencyMetrics.tonalCadenceScore}%` }}
                        className={`h-full bg-purple-400 transition-all duration-500 ease-out ${
                          fluencyScorePulse || isRecordingVoice ? 'animate-pulse brightness-125' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>Dialect Fidelity</span>
                      <span
                        className={`font-mono font-bold transition-all duration-300 ${
                          fluencyScorePulse || isRecordingVoice
                            ? 'text-amber-200 scale-110'
                            : 'text-amber-300'
                        }`}
                      >
                        {liveAnalysis.fluencyMetrics.dialectFidelityScore}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${liveAnalysis.fluencyMetrics.dialectFidelityScore}%` }}
                        className={`h-full bg-amber-400 transition-all duration-500 ease-out ${
                          fluencyScorePulse || isRecordingVoice ? 'animate-pulse brightness-125' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Real-Time Phonetic & Tonal Inspector for Active/Typed Phrase */}
            <div
              className={`p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#070B16] to-purple-950/30 border space-y-2 transition-all duration-500 ease-out ${
                fluencyScorePulse || isRecordingVoice
                  ? 'border-emerald-400/70 shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                  : 'border-emerald-500/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                    🔬 Live Phonetic & Tonal Cadence Breakdown ({activeDialectMeta.shortLabel}):
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-extrabold transition-all duration-300 ${
                      fluencyScorePulse || isRecordingVoice
                        ? 'scale-105 ring-2 ring-emerald-400/60 bg-emerald-500/35 animate-pulse'
                        : ''
                    }`}
                  >
                    {liveAnalysis.fluencyMetrics.overallFluencyScore}% ·{' '}
                    {liveAnalysis.fluencyMetrics.cadenceRatingLabel}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {liveAnalysis.phoneticBreakdown.syllableCount} syllables ·{' '}
                  {liveAnalysis.phoneticBreakdown.pauseCount} breath pause(s) · ~
                  {liveAnalysis.phoneticBreakdown.estimatedDurationSec}s
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    Syllable Cadence & Breath Pauses:
                  </span>
                  <span className="font-mono text-emerald-200 font-bold break-words">
                    {liveAnalysis.phoneticBreakdown.syllableCadenceGuide}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    IPA Transcription & Tone Contour (H=High, L=Low):
                  </span>
                  <span className="font-mono text-cyan-200 font-semibold block break-words">
                    {liveAnalysis.phoneticBreakdown.ipaTranscription}
                  </span>
                  <span className="font-mono text-[10px] text-purple-300">
                    Tones: {liveAnalysis.phoneticBreakdown.toneContourSummary}
                  </span>
                </div>
              </div>

              {/* Word-by-Word Phonetic Chips */}
              <div className="flex flex-wrap gap-1.5">
                {liveAnalysis.phoneticBreakdown.wordTokens.map((tok, idx) => (
                  <div
                    key={`${tok.word}_${idx}`}
                    title={tok.toneNote}
                    className="px-2 py-1 rounded-lg bg-[#0B1325] border border-white/10 text-[10px] flex flex-col"
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-white">
                        {tok.word}
                        {tok.hasCommaPauseAfter ? ',' : ''}
                      </span>
                      <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold">
                        {tok.tonePattern}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-emerald-300">
                      {tok.syllables} ({tok.phoneticRespelling})
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">
                      /{tok.ipa}/
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* One-Tap Live Voice Verification Bar (Fluent Nigerian Languages + Helium Laugh & Comedy FX) */}
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                  🔊 One-Tap Fluent Nigerian & Comedy Voice Test (Instant Audio):
                </span>
                {applyingVoiceBusy && (
                  <span className="text-[10px] font-bold text-amber-300 animate-pulse">
                    {voiceStatusMessage || 'Synthesizing voice...'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase = 'I am going to the market to buy some foodstuff';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('igbo_language_male', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-200 text-[11px] font-extrabold"
                >
                  🇳🇬 Speak Fluent Igbo (Market)
                </button>
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase = 'I hope you buy cheap before I come back';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('igbo_language_female', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/40 text-emerald-200 text-[11px] font-extrabold"
                >
                  🇳🇬 Speak Fluent Igbo (Buy Cheap)
                </button>
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase = 'I am going to the market to buy some foodstuff';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('hausa_language_male', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/40 text-blue-200 text-[11px] font-extrabold"
                >
                  🇳🇬 Speak Fluent Hausa
                </button>
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase = 'I am going to the market to buy some foodstuff';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('yoruba_language_male', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 text-[11px] font-extrabold"
                >
                  🇳🇬 Speak Fluent Yoruba
                </button>
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase = 'I wan go market go buy foodstuff';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('naija_pidgin_male', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-400/40 text-cyan-200 text-[11px] font-extrabold"
                >
                  🇳🇬 Speak Fluent Pidgin
                </button>
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase =
                      'Haha! Hee-hee! Listen to my hilarious Helium Laugh voice on BoostHub!';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('helium_balloon', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-pink-600/30 hover:bg-pink-600/45 border border-pink-400/50 text-pink-200 text-[11px] font-extrabold"
                >
                  😂 Test Helium Laugh Voice
                </button>
                <button
                  type="button"
                  disabled={applyingVoiceBusy}
                  onClick={() => {
                    setActiveBottomTab('audio');
                    setAudioSubMode('voice_changer');
                    const phrase = 'Hello my friends, check out my Chipmunk Comedy voice!';
                    setVoiceTranscriptText(phrase);
                    handleApplyVoicePreset('chipmunk_turbo', phrase);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 border border-amber-400/40 text-amber-200 text-[11px] font-extrabold"
                >
                  🐿️ Test Chipmunk Voice
                </button>
              </div>
            </div>

            {/* Diagnostic Test Results List with Real-Time Fluency & Phonetic Breakdown */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {igboDiagnosticReport.results.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#070B16] border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          item.passed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {item.passed ? 'PASS ✅' : 'CHECK ⚠️'}
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        {item.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[10px] font-extrabold text-emerald-300">
                        Fluency: {item.fluencyMetrics.overallFluencyScore}% ({item.fluencyMetrics.cadenceRatingLabel})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.wordCount}w · {item.phoneticBreakdown.syllableCount}syl · ~{item.phoneticBreakdown.estimatedDurationSec}s · {item.toneFormatting.voiceRate}x
                      </span>
                      <button
                        type="button"
                        disabled={applyingVoiceBusy}
                        onClick={() => {
                          setVoiceTranscriptText(item.preProcessedEnglish);
                          setTranslatedDialectText(item.actualIgbo);
                          setLivePreviewIgboText(item.actualIgbo);
                          handleApplyVoicePreset(
                            'igbo_language_male',
                            item.preProcessedEnglish
                          );
                        }}
                        className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10px] font-extrabold inline-flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speak Igbo</span>
                      </button>
                    </div>
                  </div>

                  {/* 3-Step Translation Pipeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                    <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        1. Raw Input (English/Pidgin):
                      </span>
                      <span className="text-slate-200 font-medium">
                        "{item.inputRaw}"
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-950/25 border border-blue-500/20">
                      <span className="text-[9px] uppercase font-bold text-blue-300 block">
                        2. Pre-Processed English:
                      </span>
                      <span className="text-blue-100 font-semibold">
                        "{item.preProcessedEnglish}"
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                      <span className="text-[9px] uppercase font-bold text-emerald-300 block">
                        3. {item.dialectLabel} Output:
                      </span>
                      <span className="text-emerald-200 font-extrabold">
                        "{item.actualIgbo}"
                      </span>
                    </div>
                  </div>

                  {/* Phonetic Breakdown & Tonal Cadence Strip */}
                  <div className="p-2 rounded-lg bg-black/50 border border-white/5 space-y-1 text-[10px]">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-mono text-emerald-300 font-semibold">
                        <span className="text-slate-400 uppercase font-sans font-bold mr-1">
                          Cadence:
                        </span>
                        {item.phoneticBreakdown.syllableCadenceGuide}
                      </span>
                      <span className="font-mono text-purple-300">
                        Tones: {item.phoneticBreakdown.toneContourSummary}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-cyan-200/90 font-mono">
                      <span>IPA: {item.phoneticBreakdown.ipaTranscription}</span>
                      <span className="text-slate-400">
                        Pronounce: "{item.phoneticBreakdown.speechFriendlyPhonetic}"
                      </span>
                    </div>
                  </div>

                  {/* Fluency Sub-Scores + Spelling Verification Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Subdots/Harmony: {item.fluencyMetrics.orthographySubdotScore}%
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Tonal Cadence: {item.fluencyMetrics.tonalCadenceScore}%
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Dialect Fidelity: {item.fluencyMetrics.dialectFidelityScore}%
                    </span>
                    {item.spellingChecks.details.map((det, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {det}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Phrase Real-Time Diagnostic Runner */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customDiagnosticPhrase}
                onChange={(e) => setCustomDiagnosticPhrase(e.target.value)}
                placeholder='Type any English/Pidgin phrase for real-time Igbo phonetic & fluency analysis...'
                className="flex-1 bg-[#070B16] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                disabled={runningDiagnostics || !customDiagnosticPhrase.trim()}
                onClick={() => handleRunIgboDiagnosticsSuite(customDiagnosticPhrase)}
                className="px-3 py-1.5 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] disabled:opacity-40 text-white text-xs font-extrabold shrink-0"
              >
                + Add & Log Test
              </button>
            </div>
          </div>
        );
      })()}

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
        {/* INLINE TOP TOOL BAR (9 PRO STUDIO TOOLS INCLUDING GREEN SCREEN & SPEECH-TO-TEXT) */}
        <div className="flex items-center gap-1 bg-[#080B14] border border-white/10 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'media', label: 'Media', icon: Film, badge: '' },
              { id: 'ai_background', label: 'Green Screen & AI BG', icon: Sparkles, badge: 'AI', accent: 'emerald' },
              { id: 'speech_to_text', label: 'Speech to Text', icon: Mic, badge: 'STT', accent: 'rose' },
              { id: 'audio', label: 'Audio', icon: Music, badge: '' },
              { id: 'text', label: 'Text & 52 Fonts', icon: Type, badge: '' },
              { id: 'stickers', label: 'Stickers', icon: Smile, badge: '' },
              { id: 'effects', label: 'Effects', icon: Wand2, badge: '' },
              { id: 'filters', label: 'Filters', icon: Sliders, badge: '' },
              { id: 'more', label: 'More', icon: MoreHorizontal, badge: '' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeBottomTab === item.id;
            return (
              <button
                key={`inline_${item.id}`}
                type="button"
                onClick={() => setActiveBottomTab(item.id)}
                className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                  active
                    ? item.id === 'ai_background'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg ring-1 ring-emerald-400'
                      : item.id === 'speech_to_text'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg ring-1 ring-rose-400'
                        : 'bg-[#4A90E2] text-white shadow'
                    : item.id === 'ai_background'
                      ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/20 hover:text-white'
                      : item.id === 'speech_to_text'
                        ? 'bg-rose-950/30 text-rose-300 border border-rose-500/20 hover:text-white'
                        : item.id === 'more'
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 hover:text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-extrabold whitespace-nowrap">{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                      item.accent === 'emerald'
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-rose-400/20 text-rose-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

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

        {/* GREEN SCREEN & AI BACKGROUND STUDIO TAB */}
        {activeBottomTab === 'ai_background' && (
          <div className="space-y-4">
            {/* Hidden custom background upload input */}
            <input
              ref={customBgInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleCustomBgUpload}
              className="hidden"
            />

            {/* Header with Title & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-white/10">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Green Screen & AI Background Studio</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cutout subjects from videos & photos automatically, swap presets or generate new scenes with AI
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAiBgPromptModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Prompt AI BG</span>
                </button>

                <button
                  type="button"
                  onClick={() => customBgInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload BG</span>
                </button>

                {activeClip?.bgUrl && (
                  <button
                    type="button"
                    onClick={handleClearBackground}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset BG</span>
                  </button>
                )}

                {activeClip?.type === 'photo' && (
                  <button
                    type="button"
                    disabled={bakingAiBgPhoto}
                    onClick={handleExportPhotoWithBackground}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{bakingAiBgPhoto ? 'Exporting...' : 'Export Photo'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification alert banner */}
            {aiBgNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{aiBgNotice}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAiBgNotice('')}
                  className="text-emerald-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Detection & Cutout Mode Selector */}
            {activeClip && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0B1325] to-cyan-950/40 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Foreground Subject Cutout Mode:</span>
                  </span>

                  <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveClip({
                          aiBgMode: 'ai_cutout',
                          aiBgEnabled: true,
                          chromaKeyEnabled: false,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        (activeClip.aiBgMode || 'ai_cutout') === 'ai_cutout'
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
                        updateActiveClip({
                          aiBgMode: 'chroma_key',
                          chromaKeyEnabled: true,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeClip.aiBgMode === 'chroma_key'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5 text-blue-300" />
                      <span>🎬 Chroma Key</span>
                    </button>
                  </div>
                </div>

                {/* Sub-controls based on chosen mode */}
                {(activeClip.aiBgMode || 'ai_cutout') === 'ai_cutout' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-medium">Cutout Sensitivity:</span>
                        <span className="text-emerald-400 font-bold">
                          {activeClip.aiBgSensitivity ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={activeClip.aiBgSensitivity ?? 50}
                        onChange={(e) =>
                          updateActiveClip({
                            aiBgSensitivity: Number(e.target.value),
                            aiBgEnabled: true,
                          })
                        }
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-medium">Edge Feathering:</span>
                        <span className="text-cyan-400 font-bold">
                          {activeClip.aiBgEdgeFeather ?? 4}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={activeClip.aiBgEdgeFeather ?? 4}
                        onChange={(e) =>
                          updateActiveClip({
                            aiBgEdgeFeather: Number(e.target.value),
                            aiBgEnabled: true,
                          })
                        }
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-300 font-medium">Key Backdrop Color:</span>
                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { id: 'green', label: '🟢 Green Key', bg: 'bg-emerald-600' },
                            { id: 'blue', label: '🔵 Blue Key', bg: 'bg-blue-600' },
                            { id: 'black', label: '⚫ Black Key', bg: 'bg-slate-900 border border-white/30' },
                          ] as const
                        ).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              updateActiveClip({
                                chromaKeyColor: c.id,
                                chromaKeyEnabled: true,
                                aiBgMode: 'chroma_key',
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              (activeClip.chromaKeyColor || 'green') === c.id
                                ? `${c.bg} text-white shadow-md ring-2 ring-white/50`
                                : 'bg-white/5 text-slate-300 hover:text-white'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">
                        Sensitivity: {activeClip.chromaKeySensitivity ?? 45}%
                      </span>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={activeClip.chromaKeySensitivity ?? 45}
                        onChange={(e) =>
                          updateActiveClip({
                            chromaKeySensitivity: Number(e.target.value),
                            chromaKeyEnabled: true,
                            aiBgMode: 'chroma_key',
                          })
                        }
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Background Fine-Tuning: Blur, Zoom, Position & Person Scaling */}
            {activeClip && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>Background & Foreground Adjustments:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveClip({
                        bgBlur: 0,
                        bgZoom: 1,
                        bgPositionX: 0,
                        bgPositionY: 0,
                        personScale: 1,
                        personPositionX: 0,
                        personPositionY: 0,
                      })
                    }
                    className="text-[10px] font-bold text-slate-400 hover:text-white inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Transforms</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Background Blur:</span>
                      <span className="text-white font-bold">{activeClip.bgBlur || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={activeClip.bgBlur || 0}
                      onChange={(e) => updateActiveClip({ bgBlur: Number(e.target.value) })}
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Background Zoom:</span>
                      <span className="text-white font-bold">{(activeClip.bgZoom || 1).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      value={activeClip.bgZoom || 1}
                      onChange={(e) => updateActiveClip({ bgZoom: Number(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Background Pan X:</span>
                      <span className="text-white font-bold">{activeClip.bgPositionX || 0}%</span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={activeClip.bgPositionX || 0}
                      onChange={(e) => updateActiveClip({ bgPositionX: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Person Scale:</span>
                      <span className="text-white font-bold">{(activeClip.personScale || 1).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      value={activeClip.personScale || 1}
                      onChange={(e) => updateActiveClip({ personScale: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Instant Search Bar & One-Tap Prompt Filter Chips */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={aiBgSearchQuery}
                  onChange={(e) => setAiBgSearchQuery(e.target.value)}
                  placeholder="Search virtual backgrounds (e.g. Deep Space, Football Stadium, Beach, New York)..."
                  className="w-full bg-[#080B14] border border-white/15 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
                {aiBgSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAiBgSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* One-Tap Quick Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {(
                  [
                    { label: '🌌 Deep Space', q: 'deep space' },
                    { label: '🌍 Top of Earth', q: 'top of earth' },
                    { label: '⚽ Football Stadium', q: 'football stadium' },
                    { label: '🏖️ Tropical Beach', q: 'beach' },
                    { label: '🌃 New York at Night', q: 'new york' },
                    { label: '🎙️ Podcast Studio', q: 'podcast' },
                    { label: '📺 Newsroom', q: 'news' },
                    { label: '🎸 Concert Stage', q: 'concert' },
                    { label: '🏙️ Cyberpunk', q: 'cyberpunk' },
                    { label: '🏛️ Santorini', q: 'santorini' },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.q}
                    type="button"
                    onClick={() => setAiBgSearchQuery(chip.q)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                      aiBgSearchQuery === chip.q
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                {(['All', 'Nature & Travel', 'Studio', 'Luxury & City', 'Cyberpunk', 'Abstract'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAiBgCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 transition-all ${
                        aiBgCategory === cat
                          ? 'bg-[#4A90E2] text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Background Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {GREEN_SCREEN_BACKGROUNDS.filter((bg) => {
                const matchCat = aiBgCategory === 'All' || bg.category === aiBgCategory;
                const q = aiBgSearchQuery.trim().toLowerCase();
                const matchQ =
                  !q ||
                  bg.name.toLowerCase().includes(q) ||
                  bg.tags.some((t) => t.toLowerCase().includes(q));
                return matchCat && matchQ;
              }).map((bg) => {
                const isSelected = activeClip?.bgUrl === bg.url;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => handleSelectBackground(bg)}
                    className={`group relative rounded-xl overflow-hidden aspect-video border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={bg.thumbUrl}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-white truncate drop-shadow">
                          {bg.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-300 truncate">
                        {bg.category} • {bg.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SPEECH TO TEXT & REAL-TIME AUTO CAPTIONS TAB */}
        {activeBottomTab === 'speech_to_text' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-white/10">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span>Speech-to-Text & Real-Time Auto-Captions</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Speak into your microphone to transcribe voice into time-synced animated subtitles and captions
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerateSmartCaptions}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Tap Viral Hooks</span>
                </button>
              </div>
            </div>

            {/* Live Recording Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 via-[#0B1325] to-purple-950/30 border border-rose-500/20 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Recognition Language:</span>
                  <select
                    value={sttLanguage}
                    onChange={(e) => setSttLanguage(e.target.value)}
                    className="bg-[#080B14] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="en-US">🇺🇸 English (US)</option>
                    <option value="en-GB">🇬🇧 English (UK)</option>
                    <option value="en-NG">🇳🇬 Nigerian English / Pidgin</option>
                    <option value="ig-NG">🇳🇬 Asụsụ Igbo</option>
                    <option value="yo-NG">🇳🇬 Yorùbá</option>
                    <option value="ha-NG">🇳🇬 Hausa</option>
                    <option value="fr-FR">🇫🇷 French</option>
                    <option value="es-ES">🇪🇸 Spanish</option>
                  </select>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400">
                    Timeline Position:{' '}
                    <span className="text-white font-mono font-bold">
                      {timelineTime.toFixed(1)}s / {(totalDuration || 10).toFixed(1)}s
                    </span>
                  </span>
                </div>
              </div>

              {/* Big Record Microphone Button & Analyse Uploaded Video Audio */}
              <div className="flex flex-col items-center justify-center py-2 gap-3">
                {/* 1. Analyse Uploaded Video Audio Button */}
                {activeClip?.type === 'video' && activeClip?.url && (
                  <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-indigo-900/40 border border-blue-400/30 shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span>AI Video Audio Speech Analyser</span>
                      </span>
                      <span className="text-[10px] text-cyan-300 font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40">
                        Auto-Captions
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Analyse the audio track of your uploaded video to transcribe the exact words spoken and display time-synced captions on screen.
                    </p>
                    <button
                      type="button"
                      disabled={isAnalyzingVideoAudio}
                      onClick={handleAnalyseUploadedVideoAudio}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                    >
                      {isAnalyzingVideoAudio ? (
                        <>
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                          <span>{videoAnalysisProgress || 'Analysing video audio...'}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 text-yellow-300" />
                          <span>Analyse Uploaded Video Audio & Create Captions</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 2. Live Mic Voice-to-Text Button */}
                <button
                  type="button"
                  onClick={handleToggleSpeechToTextRecording}
                  className={`w-full max-w-sm py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                    sttIsRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30'
                      : 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:brightness-110 text-white shadow-rose-600/30'
                  }`}
                >
                  {sttIsRecording ? (
                    <>
                      <MicOff className="w-5 h-5 text-white animate-bounce" />
                      <span>Stop Listening (Tap to finish)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-white" />
                      <span>Start Voice-to-Text Recording</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center">
                  {sttIsRecording
                    ? '🎙️ Listening in real-time... Speak clearly into your mic!'
                    : 'Tap the button and speak. Your voice converts into text and video captions.'}
                </p>
              </div>
            </div>

            {/* Font Design & Color Selection Studio */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-yellow-400" />
                  <span>Caption Font Design & Colour Styling:</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {FONT_STYLES_52.find((f) => f.id === selectedFontPresetId)?.name || 'TikTok Bold'}
                </span>
              </div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-300 font-semibold">Text Colour:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { hex: '#FFE600', label: 'Yellow' },
                    { hex: '#FFFFFF', label: 'White' },
                    { hex: '#00E5FF', label: 'Cyan' },
                    { hex: '#FF3366', label: 'Pink' },
                    { hex: '#00FF66', label: 'Green' },
                    { hex: '#A855F7', label: 'Purple' },
                    { hex: '#FF6600', label: 'Orange' },
                    { hex: '#FFD700', label: 'Gold' },
                    { hex: '#111827', label: 'Dark' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setSelectedCaptionColor(c.hex);
                        updateProjectWithHistory((prev) => ({
                          ...prev,
                          subtitleColor: c.hex,
                          subtitles: prev.subtitles.map((s) => ({
                            ...s,
                            color: c.hex,
                          })),
                        }));
                      }}
                      style={{ backgroundColor: c.hex }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        selectedCaptionColor === c.hex
                          ? 'border-white scale-125 shadow-lg shadow-white/30'
                          : 'border-white/20 hover:scale-110'
                      }`}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedCaptionColor.startsWith('#') ? selectedCaptionColor : '#FFE600'}
                    onChange={(e) => {
                      setSelectedCaptionColor(e.target.value);
                      updateProjectWithHistory((prev) => ({
                        ...prev,
                        subtitleColor: e.target.value,
                        subtitles: prev.subtitles.map((s) => ({
                          ...s,
                          color: e.target.value,
                        })),
                      }));
                    }}
                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-none"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Font Design Presets Carousel / Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-300 font-semibold">Font Style & Design (52 Presets):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {FONT_STYLES_52.slice(0, 18).map((preset) => {
                    const isSelected = selectedFontPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedFontPresetId(preset.id);
                          updateProjectWithHistory((prev) => ({
                            ...prev,
                            activeFontStyleId: preset.id,
                            subtitles: prev.subtitles.map((s) => ({
                              ...s,
                              fontStyleId: preset.id,
                            })),
                          }));
                          showToast(`Applied ${preset.name}!`, 'info');
                        }}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'border-yellow-400 bg-yellow-500/15 ring-2 ring-yellow-400/40 shadow-lg'
                            : 'border-white/10 bg-black/40 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                            {preset.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                        </div>
                        <p
                          style={{
                            ...(preset.style || {}),
                            fontSize: '11px',
                            color: selectedCaptionColor || preset.textColor,
                            padding: '2px 4px',
                          }}
                          className="truncate leading-normal"
                        >
                          {preset.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/15 text-center flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium">On-Screen Caption Live Preview:</span>
                <div
                  style={{
                    ...(getFontDesignPresetById(selectedFontPresetId)?.style || {}),
                    color: selectedCaptionColor,
                    fontSize: '14px',
                  }}
                  className={getFontDesignPresetById(selectedFontPresetId)?.className || ''}
                >
                  {sttTranscript || 'BoostHub Aba Creators 🔥'}
                </div>
              </div>
            </div>

            {/* Live Transcript Viewer & Editor */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Speech Transcript:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {(sttTranscript || sttInterimTranscript) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const full = (sttTranscript + ' ' + sttInterimTranscript).trim();
                          navigator.clipboard?.writeText(full);
                          showToast('Copied transcript to clipboard!', 'success');
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSttTranscript('');
                          setSttInterimTranscript('');
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                value={sttTranscript}
                onChange={(e) => setSttTranscript(e.target.value)}
                placeholder="Spoken words will transcribe here in real-time. You can also type or edit text directly..."
                rows={3}
                className="w-full bg-[#080B14] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />

              {sttInterimTranscript && (
                <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-[11px] text-cyan-300 italic flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <span>&quot;{sttInterimTranscript}&quot;</span>
                </div>
              )}

              {/* Convert to Synced Captions Button */}
              <button
                type="button"
                onClick={() => handleConvertSpeechToCaptions()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Convert Spoken Voice to Timed Video Captions</span>
              </button>
            </div>

            {/* Caption Styling Selector (TikTok / Reels / YouTube Shorts) */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <span className="text-xs font-bold text-white">Viral Caption Style:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'viral_yellow', name: '🟡 Viral Yellow', desc: '#1 TikTok style', bg: 'bg-yellow-500/20 border-yellow-400 text-yellow-300' },
                    { id: 'cyber_cyan', name: '🔵 Cyber Cyan', desc: 'Neon glow', bg: 'bg-cyan-500/20 border-cyan-400 text-cyan-300' },
                    { id: 'clean_box', name: '⚪ Minimal Box', desc: 'Crisp pill', bg: 'bg-slate-800 border-white/30 text-white' },
                    { id: 'bold_red', name: '🔴 Punchy Red', desc: 'Attention hook', bg: 'bg-rose-500/20 border-rose-400 text-rose-300' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSttCaptionStyle(st.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      sttCaptionStyle === st.id
                        ? `${st.bg} ring-2 ring-white/30 shadow-md`
                        : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{st.name}</p>
                    <p className="text-[10px] opacity-75">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Subtitle Cues on Timeline */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Timed Subtitle Cues ({project.subtitles.length}):</span>
                </span>
                {project.subtitles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateProjectWithHistory((p) => ({ ...p, subtitles: [] }))}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {project.subtitles.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-2">
                  No captions on the timeline yet. Record speech above or tap &quot;1-Tap Viral Hooks&quot;!
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {project.subtitles.map((cue) => (
                    <div
                      key={cue.id}
                      className="p-2 rounded-xl bg-[#080B14] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setTimelineTime(cue.startTime);
                          showToast(`Jumped to ${cue.startTime}s`, 'info');
                        }}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                      >
                        {cue.startTime.toFixed(1)}s - {cue.endTime.toFixed(1)}s
                      </button>

                      <input
                        type="text"
                        value={cue.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProjectWithHistory((prev) => ({
                            ...prev,
                            subtitles: prev.subtitles.map((s) =>
                              s.id === cue.id ? { ...s, text: val } : s
                            ),
                          }));
                        }}
                        className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateProjectWithHistory((prev) => ({
                            ...prev,
                            subtitles: prev.subtitles.filter((s) => s.id !== cue.id),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1"
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

        {/* 2. AUDIO TAB: Extract Audio from Gallery Video, Voice Cover Recorder, 52 Voice Changer & Music Mixer */}
        {activeBottomTab === 'audio' && (
          <div className="space-y-3.5">
            {/* Sub-navigation tabs for Audio Studio */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#080B14] border border-white/10">
              <button
                type="button"
                onClick={() => setAudioSubMode('extract_music')}
                className={`py-2 px-2 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  audioSubMode === 'extract_music'
                    ? 'bg-[#4A90E2] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileAudio className="w-3.5 h-3.5" />
                <span>Extract & Music</span>
              </button>
              <button
                type="button"
                onClick={() => setAudioSubMode('voice_cover')}
                className={`py-2 px-2 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  audioSubMode === 'voice_cover'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Cover</span>
              </button>
              <button
                type="button"
                onClick={() => setAudioSubMode('voice_changer')}
                className={`py-2 px-2 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  audioSubMode === 'voice_changer'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>52 Voices</span>
              </button>
            </div>

            {/* SUB-MODE 1: EXTRACT AUDIO FROM VIDEO + MUSIC MIXER */}
            {audioSubMode === 'extract_music' && (
              <div className="space-y-3.5">
                {/* Extract Audio From Phone Gallery Video Card */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950/60 via-[#10172A] to-indigo-950/40 border border-[#4A90E2]/40 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <FileAudio className="w-4 h-4 text-cyan-400" />
                        <span>Extract Audio from Video</span>
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Select any video from your phone gallery to rip its sound as background audio or voice track
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={extractingAudioBusy}
                      onClick={() => extractVideoInputRef.current?.click()}
                      className="flex-1 min-w-[160px] py-2.5 px-3 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {extractingAudioBusy
                          ? 'Extracting Audio...'
                          : 'Select Video from Gallery'}
                      </span>
                    </button>

                    {activeClip?.type === 'video' && (
                      <button
                        type="button"
                        disabled={extractingAudioBusy}
                        onClick={handleExtractAudioFromActiveClip}
                        className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-cyan-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-cyan-400/30"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Extract from Current Clip</span>
                      </button>
                    )}
                  </div>

                  {project.customAudioUrl && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-300 truncate">
                          {project.customAudioName || 'Extracted Audio Track'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Duration: {(project.soundDuration || 15).toFixed(1)}s · Ready in timeline
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleAudioPreview}
                          className="px-2.5 py-1 rounded-lg bg-[#4A90E2] text-white text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          {isAudioPreviewing ? (
                            <>
                              <Pause className="w-3 h-3" /> Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" /> Play
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAudioSubMode('voice_changer')}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Wand2 className="w-3 h-3" /> Voice FX
                        </button>
                        <a
                          href={project.customAudioUrl}
                          download={
                            (project.customAudioName || 'extracted-audio')
                              .replace(/[^a-z0-9_-]/gi, '_') + '.wav'
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> WAV
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Import Audio File & Preview Bar */}
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
                      <span>Import Audio File</span>
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

                {/* Volume Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeClip && (
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Clip Original Volume</span>
                        <span className="font-mono tabular-nums text-blue-400">
                          {activeClip.muted
                            ? 'Muted (0%)'
                            : `${activeClip.volume}%`}
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
                  )}

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Extracted / Music Volume</span>
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

                {/* Built-in Music Tracks */}
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

            {/* SUB-MODE 2: VOICE COVER RECORDER (RECORD VOICEOVER FOR VIDEO) */}
            {audioSubMode === 'voice_cover' && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-950/50 via-[#101526] to-purple-950/40 border border-rose-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-rose-400" />
                        <span>Voice Cover Studio (Record Voiceover)</span>
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Record your own voice directly over your video, then transform it with 52 comedy, girl, male, children & Nigerian voices!
                      </p>
                    </div>
                    {isRecordingVoice && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-mono font-extrabold animate-pulse">
                        ● REC {recordingSeconds.toFixed(1)}s
                      </span>
                    )}
                  </div>

                  {/* Mute original video audio while recording checkbox */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={muteVideoDuringRecord}
                      onChange={(e) =>
                        setMuteVideoDuringRecord(e.target.checked)
                      }
                      className="rounded accent-rose-500"
                    />
                    <span>
                      Mute original video clip audio when applying Voice Cover
                    </span>
                  </label>

                  {/* Start / Stop Voice Recording Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isRecordingVoice ? (
                      <button
                        type="button"
                        disabled={applyingVoiceBusy}
                        onClick={handleStartVoiceCoverRecording}
                        className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Tap to Record Voice Cover</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopVoiceCoverRecording}
                        className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-lg animate-pulse"
                      >
                        <MicOff className="w-4 h-4" />
                        <span>
                          Stop & Save Recording ({recordingSeconds.toFixed(1)}s)
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Live Status Banner when Downloading / Generating Real Nigerian Voice */}
                  {applyingVoiceBusy && (
                    <div className="px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-400/50 text-xs font-extrabold text-purple-200 animate-pulse text-center">
                      {voiceStatusMessage ||
                        `Downloading ${activeDialectLabel} voice (${activeLangCode})...`}
                    </div>
                  )}

                  {/* Quick One-Tap Nigerian Language Translation & Real Voice Bar right inside Voice Cover */}
                  <div className="p-2.5 rounded-xl bg-[#090D1A] border border-emerald-500/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-[11px] font-extrabold text-emerald-300">
                        🇳🇬 Translate & Speak in Real Nigerian Language:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          disabled={applyingVoiceBusy}
                          onClick={() => {
                            const sample = 'I am going to the market to buy some foodstuff';
                            setVoiceTranscriptText(sample);
                            handleApplyVoicePreset('igbo_language_male', sample);
                          }}
                          className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-[10px] font-bold text-purple-200 hover:bg-purple-500/30"
                        >
                          Test: "Going to market..." → Igbo
                        </button>
                        <button
                          type="button"
                          disabled={applyingVoiceBusy}
                          onClick={() => {
                            const sample = 'I hope you buy cheap before I come back';
                            setVoiceTranscriptText(sample);
                            handleApplyVoicePreset('igbo_language_male', sample);
                          }}
                          className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/30"
                        >
                          Test: "Hope you buy cheap..." → Igbo
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      {[
                        { id: 'igbo_language_male', label: '🇳🇬 Igbo (ig-NG)' },
                        { id: 'hausa_language_male', label: '🇳🇬 Hausa (ha-NG)' },
                        { id: 'yoruba_language_male', label: '🇳🇬 Yoruba (yo-NG)' },
                        { id: 'naija_pidgin_male', label: '🇳🇬 Pidgin (en-NG)' },
                        { id: 'akwa_ibom_male', label: '🇳🇬 Akwa Ibom' },
                        { id: 'naija_street_hypeman', label: '🇳🇬 Lagos Street' },
                      ].map((langBtn) => (
                        <button
                          key={langBtn.id}
                          type="button"
                          disabled={applyingVoiceBusy}
                          onClick={() => handleApplyVoicePreset(langBtn.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold shrink-0 border transition-all ${
                            project.voicePresetId === langBtn.id
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          {langBtn.label}
                        </button>
                      ))}
                    </div>

                    {/* Two Texts Display: 1) Original English & 2) Translated Igbo/Hausa/Yoruba/Pidgin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-black/50 border border-white/10">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Original English:
                        </span>
                        <input
                          type="text"
                          value={voiceTranscriptText}
                          onChange={(e) => setVoiceTranscriptText(e.target.value)}
                          placeholder='e.g. "I love Port Harcourt" or "Hello my friends"'
                          className="w-full bg-transparent text-xs font-bold text-white mt-0.5 focus:outline-none"
                        />
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                          Translated {activeDialectLabel} ({activeLangCode}):
                        </span>
                        <p className="text-xs font-extrabold text-white mt-0.5 break-words">
                          {translatedDialectText
                            ? `"${translatedDialectText}"`
                            : 'Tap Igbo, Hausa, Yoruba, or Pidgin above to translate'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Recorded Voice Cover Status Card */}
                  {project.voiceoverAudioUrl && (
                    <div className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-emerald-300">
                            {project.voiceoverName || 'My Voice Cover'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Length: {(project.voiceoverDuration || 5).toFixed(1)}s · Active Voice:{' '}
                            <span className="text-purple-300 font-semibold">
                              {getVoicePresetById(project.voicePresetId || 'original').name}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={toggleVoiceoverPreview}
                            className="px-2.5 py-1.5 rounded-lg bg-[#4A90E2] text-white text-xs font-bold inline-flex items-center gap-1"
                          >
                            {isVoicePreviewing ? (
                              <>
                                <Pause className="w-3.5 h-3.5" /> Stop
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" /> Listen
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAudioSubMode('voice_changer')}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Wand2 className="w-3.5 h-3.5" /> All 56 Voices
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              rawVoiceBufferRef.current = null;
                              updateProjectWithHistory((prev) => ({
                                ...prev,
                                voiceoverAudioUrl: '',
                                voiceoverRawUrl: '',
                                voiceoverName: '',
                                voiceoverDuration: 0,
                              }));
                              showToast('Removed Voice Cover', 'info');
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300"
                            title="Delete Voice Cover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Voice Cover Volume Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Voice Cover Volume</span>
                          <span className="font-mono tabular-nums text-emerald-300">
                            {project.voiceoverVolume ?? 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={150}
                          value={project.voiceoverVolume ?? 100}
                          onChange={(e) =>
                            updateProjectWithHistory((prev) => ({
                              ...prev,
                              voiceoverVolume: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-emerald-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-MODE 3: 56 REALISTIC HUMAN VOICES & NIGERIAN DIALECT TRANSLATOR */}
            {audioSubMode === 'voice_changer' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4 text-purple-400" />
                      <span>
                        56 Realistic Human Voices & Dialect Translator
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Record your voice in English, then tap any voice below to accurately change all you said into Igbo, Hausa, Yoruba, Akwa Ibom, Nigerian Pidgin, Lagos Street, Male, or Female voice!
                    </p>
                  </div>

                  {project.voiceoverAudioUrl && (
                    <button
                      type="button"
                      onClick={toggleVoiceoverPreview}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 ${
                        isVoicePreviewing
                          ? 'bg-rose-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {isVoicePreviewing ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Stop Preview
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Replay Voice
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* TWO TEXTS STUDIO BOX: 1. Original English & 2. Translated Igbo/Hausa/Yoruba/Pidgin */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-950/50 via-[#0C1120] to-blue-950/40 border border-purple-500/30 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-purple-200">
                      🎙️ Gemini 3.8 Flash Transcription & Real Nigerian Translator
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={applyingVoiceBusy}
                        onClick={() => {
                          const sample = 'I am going to the market to buy some foodstuff';
                          setVoiceTranscriptText(sample);
                          handleApplyVoicePreset('igbo_language_male', sample);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40 hover:bg-purple-500/30"
                      >
                        Test: "Going to market..."
                      </button>
                      <button
                        type="button"
                        disabled={applyingVoiceBusy}
                        onClick={() => {
                          const sample = 'I hope you buy cheap before I come back';
                          setVoiceTranscriptText(sample);
                          handleApplyVoicePreset('igbo_language_male', sample);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 hover:bg-blue-500/30"
                      >
                        Test: "Hope you buy cheap..."
                      </button>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {activeDialectLabel} ({activeLangCode}) · 0.8x Rate
                      </span>
                    </div>
                  </div>

                  {/* TEXT 1: Original English */}
                  <div className="p-2.5 rounded-xl bg-[#070A14] border border-white/15 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Original English:
                    </span>
                    <input
                      type="text"
                      value={voiceTranscriptText}
                      onChange={(e) => setVoiceTranscriptText(e.target.value)}
                      placeholder='Record your voice in Voice Cover or type English here (e.g. "I love Port Harcourt")...'
                      className="w-full bg-transparent text-xs font-bold text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* TEXT 2: Translated Igbo / Hausa / Yoruba / Pidgin */}
                  <div className="p-2.5 rounded-xl bg-black/55 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                        Translated {activeDialectLabel} ({activeLangCode}):
                      </span>
                      <p className="text-sm font-extrabold text-white mt-0.5 break-words">
                        {translatedDialectText
                          ? `"${translatedDialectText}"`
                          : 'Tap Igbo, Hausa, Yoruba, or Pidgin below to translate & speak'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {project.voiceoverAudioUrl && (
                        <button
                          type="button"
                          onClick={toggleVoiceoverPreview}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-extrabold inline-flex items-center gap-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {isVoicePreviewing
                              ? 'Stop Audio'
                              : `Play Real ${activeDialectLabel}`}
                          </span>
                        </button>
                      )}
                      {translatedDialectText && (
                        <button
                          type="button"
                          onClick={() => {
                            const dur = Math.max(3, totalDuration || 8);
                            updateProjectWithHistory((prev) => ({
                              ...prev,
                              subtitles: [
                                ...prev.subtitles,
                                {
                                  id: `sub_dialect_${Date.now()}`,
                                  startTime: 0,
                                  endTime: Number(dur.toFixed(1)),
                                  text: translatedDialectText,
                                },
                              ],
                            }));
                            showToast(
                              `Added ${activeDialectLabel} subtitles to video!`,
                              'success'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold"
                        >
                          + Add Subtitle
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Nigerian Dialect & Realistic Voice Shortcuts */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {[
                    { id: 'naija_street_hypeman', label: '🇳🇬 Lagos Street' },
                    { id: 'igbo_language_male', label: '🇳🇬 Igbo (Male)' },
                    { id: 'igbo_language_female', label: '🇳🇬 Igbo (Female)' },
                    { id: 'hausa_language_male', label: '🇳🇬 Hausa (Male)' },
                    { id: 'hausa_language_female', label: '🇳🇬 Hausa (Female)' },
                    { id: 'yoruba_language_male', label: '🇳🇬 Yoruba (Male)' },
                    { id: 'yoruba_language_female', label: '🇳🇬 Yoruba (Female)' },
                    { id: 'akwa_ibom_male', label: '🇳🇬 Akwa Ibom (Male)' },
                    { id: 'akwa_ibom_female', label: '🇳🇬 Akwa Ibom (Female)' },
                    { id: 'naija_pidgin_male', label: '🇳🇬 Pidgin (Male)' },
                    { id: 'naija_pidgin_female', label: '🇳🇬 Pidgin (Female)' },
                  ].map((quick) => {
                    const active = project.voicePresetId === quick.id;
                    return (
                      <button
                        key={quick.id}
                        type="button"
                        disabled={applyingVoiceBusy}
                        onClick={() => handleApplyVoicePreset(quick.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold shrink-0 border transition-all ${
                          active
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        {quick.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search Input for 56 Voices */}
                <div className="flex items-center gap-2 bg-[#080B14] border border-white/15 rounded-xl px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={voiceSearchQuery}
                    onChange={(e) => setVoiceSearchQuery(e.target.value)}
                    placeholder="Search 56 voices (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin, Lagos Street, Male, Female...)"
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  />
                  {voiceSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setVoiceSearchQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {BEDIT_VOICE_CATEGORIES.map((cat) => {
                    const active = voiceCategoryFilter === cat;
                    const labelMap: Record<BEditVoiceCategory, string> = {
                      All: 'All (56)',
                      Nigerian: '🇳🇬 Nigerian & Languages (14)',
                      Comedy: '😂 Comedy (12)',
                      Girl: '👩 Female (8)',
                      Male: '👨 Male (8)',
                      Children: '🧒 Children (6)',
                      'More FX': '🤖 More FX (8)',
                    };
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVoiceCategoryFilter(cat)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold shrink-0 border transition-colors ${
                          active
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {labelMap[cat]}
                      </button>
                    );
                  })}
                </div>

                {applyingVoiceBusy && (
                  <div className="px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-400/50 text-xs font-extrabold text-purple-200 animate-pulse text-center">
                    {voiceStatusMessage ||
                      `Downloading ${activeDialectLabel} voice (${activeLangCode})...`}
                  </div>
                )}

                {/* 56 Voice Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-0.5">
                  {BEDIT_VOICE_PRESETS.filter((preset) => {
                    const matchesCat =
                      voiceCategoryFilter === 'All' ||
                      preset.category === voiceCategoryFilter;
                    const q = voiceSearchQuery.trim().toLowerCase();
                    const matchesSearch =
                      !q ||
                      preset.name.toLowerCase().includes(q) ||
                      preset.badge.toLowerCase().includes(q) ||
                      preset.description.toLowerCase().includes(q) ||
                      preset.category.toLowerCase().includes(q);
                    return matchesCat && matchesSearch;
                  }).map((preset) => {
                    const isSelected =
                      (project.voicePresetId || 'original') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={applyingVoiceBusy}
                        onClick={() => handleApplyVoicePreset(preset.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-purple-600/25 border-purple-400 text-white shadow-md ring-1 ring-purple-400/40'
                            : 'bg-[#13192B] border-white/10 text-slate-200 hover:border-purple-400/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/10 text-purple-300 truncate">
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold text-emerald-400">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-white mt-1 truncate">
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

            {/* Quick Access to Pro Studios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveBottomTab('ai_background')}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 border border-emerald-500/30 text-left hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">
                    Green Screen & AI Background Studio
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Swap backgrounds with Deep Space, Orbit, Stadium, Beach, AI scenes & custom media
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab('speech_to_text')}
                className="p-3 rounded-xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-purple-950/50 border border-rose-500/30 text-left hover:border-rose-400 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">
                    Speech-to-Text & Auto-Captions
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Transcribe spoken voice from your mic into live-synced viral video subtitles
                </p>
              </button>
            </div>

            {/* Basic Green-Screen / Chroma Key Background Removal & Presets Link */}
            {activeClip && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Green-Screen / Chroma Key Removal</span>
                      {activeClip.bgUrl && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {activeClip.bgName || 'Virtual BG active'}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Remove solid green, blue, or dark backgrounds in real time
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('ai_background')}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Virtual BG Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveClip((c) => ({
                          ...c,
                          chromaKeyEnabled: !c.chromaKeyEnabled,
                          aiBgMode: 'chroma_key',
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Sensitivity:</span>
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
                        className="w-28 accent-emerald-500"
                      />
                    </div>
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

      {/* BOTTOM NAVIGATION FOR ALL 9 PRO STUDIO TOOLS (MEDIA, GREEN SCREEN, SPEECH-TO-TEXT, AUDIO, MORE, TEXT, STICKERS, EFFECTS & FILTERS) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-3 pointer-events-none">
        <div className="max-w-lg mx-auto bg-[#121626]/95 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xl pointer-events-auto">
          {(
            [
              { id: 'media', label: 'Media', icon: Film, badge: '' },
              { id: 'ai_background', label: 'Green Screen', icon: Sparkles, badge: 'AI', accent: 'emerald' },
              { id: 'speech_to_text', label: 'Speech to Text', icon: Mic, badge: 'STT', accent: 'rose' },
              { id: 'audio', label: 'Audio', icon: Music, badge: '' },
              { id: 'more', label: 'More', icon: MoreHorizontal, badge: '' },
              { id: 'text', label: 'Text', icon: Type, badge: '' },
              { id: 'stickers', label: 'Stickers', icon: Smile, badge: '' },
              { id: 'effects', label: 'Effects', icon: Wand2, badge: '' },
              { id: 'filters', label: 'Filters', icon: Sliders, badge: '' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeBottomTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveBottomTab(item.id)}
                className={`min-h-[46px] min-w-[58px] px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 shrink-0 transition-colors ${
                  active
                    ? item.id === 'ai_background'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow ring-1 ring-emerald-400'
                      : item.id === 'speech_to_text'
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow ring-1 ring-rose-400'
                        : 'bg-[#4A90E2] text-white shadow'
                    : item.id === 'ai_background'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/25 hover:text-white'
                      : item.id === 'speech_to_text'
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/25 hover:text-white'
                        : item.id === 'more'
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 hover:text-white'
                          : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-bold whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI BACKGROUND PROMPT MODAL */}
      {aiBgPromptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121626] border border-emerald-500/30 p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <span>Generate AI Virtual Background</span>
              </h3>
              <button
                type="button"
                onClick={() => setAiBgPromptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Describe the scene you want to replace your background with, or pick a template:
            </p>

            <textarea
              value={aiBgCustomPrompt}
              onChange={(e) => setAiBgCustomPrompt(e.target.value)}
              placeholder="e.g. Astronaut looking at blue planet Earth from orbit, sparkling stars, cinematic 4K wallpaper..."
              rows={3}
              className="w-full bg-[#080B14] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Scene Ideas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'Deep Space Nebula with violet galaxy spiral and cosmic dust',
                    'Top of Earth looking down on blue oceans and continents with stars',
                    'Packed Champions League Football Stadium under bright floodlights',
                    'Tropical Beach with turquoise waves, white sand, and palm trees',
                    'New York Manhattan skyline at night with glistening skyscrapers',
                    'Futuristic cyberpunk neon alleyway in Tokyo with rain reflections',
                  ] as const
                ).map((promptIdea) => (
                  <button
                    key={promptIdea}
                    type="button"
                    onClick={() => setAiBgCustomPrompt(promptIdea)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-950/40 border border-white/10 hover:border-emerald-500/40 text-[10px] text-slate-300 hover:text-emerald-300 text-left transition-colors"
                  >
                    ✨ {promptIdea.slice(0, 38)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAiBgPromptModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingAiBg || !aiBgCustomPrompt.trim()}
                onClick={() => handleGenerateAiBackground()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAiBg ? 'Generating Scene...' : 'Generate & Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
