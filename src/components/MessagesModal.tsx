import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Send,
  Image as ImageIcon,
  Smile,
  Trash2,
  CornerUpLeft,
  CheckCheck,
  Search,
  ArrowLeft,
  BadgeCheck,
  Mic,
  Square,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import {
  ConversationSummary,
  DirectMessageItem,
  UserProfile,
} from '../types';
import { apiFetch } from '../services/api';
import { uploadMediaWithProgress } from '../storage/mediaUpload';
import {
  decodeMediaToAudioBuffer,
  encodeAudioBufferToWavBlob,
} from './bEditVoiceEngine';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../utils/format';

interface MessagesModalProps {
  initialPartner?: UserProfile | null;
  onClose: () => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '👏', '🚀', '🎉', '🙌', '💯'];

const VoiceNoteBubblePlayer: React.FC<{
  src: string;
  label?: string;
  isMine: boolean;
}> = ({ src, label, isMine }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const formatSec = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.playbackRate = speed;
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const cycleSpeed = () => {
    const next: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const progressPct =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const waveBars = [35, 65, 45, 85, 55, 95, 70, 40, 80, 60, 90, 50, 75, 45, 85, 60, 40, 70];

  return (
    <div
      className={`my-1.5 p-2.5 rounded-2xl flex items-center gap-2.5 min-w-[210px] sm:min-w-[240px] ${
        isMine
          ? 'bg-blue-700/60 border border-blue-300/25'
          : 'bg-black/35 border border-white/15'
      }`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onPause={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow transition-transform active:scale-95 ${
          isMine
            ? 'bg-white text-blue-600'
            : 'bg-blue-600 text-white'
        }`}
      >
        {playing ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-0.5 h-6 cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audioRef.current.currentTime = ratio * duration;
            setCurrentTime(ratio * duration);
          }}
        >
          {waveBars.map((h, i) => {
            const barPct = ((i + 1) / waveBars.length) * 100;
            const active = barPct <= progressPct;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-colors ${
                  active
                    ? isMine
                      ? 'bg-white'
                      : 'bg-blue-400'
                    : isMine
                      ? 'bg-blue-200/40'
                      : 'bg-white/25'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
          <span className="font-mono tabular-nums">
            {playing || currentTime > 0
              ? `${formatSec(currentTime)} / ${formatSec(duration)}`
              : duration > 0
                ? formatSec(duration)
                : label || 'Voice Note'}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.2 rounded bg-black/25 font-bold text-[9px]"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};

export const MessagesModal: React.FC<MessagesModalProps> = ({
  initialPartner = null,
  onClose,
}) => {
  const {
    userProfile,
    onlineUserIds,
    realtimeEvents,
    refreshBadgesCount,
    showToast,
  } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activePartner, setActivePartner] = useState<UserProfile | null>(
    initialPartner
  );
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [replyTo, setReplyTo] = useState<DirectMessageItem | null>(null);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [replyAsBoostBot, setReplyAsBoostBot] = useState(false);
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceTimerRef = useRef<number | null>(null);
  const voiceCancelledRef = useRef<boolean>(false);

  const isOwnerAdmin =
    userProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com';

  const loadConversations = async () => {
    try {
      const list = await apiFetch<ConversationSummary[]>(
        '/api/messages/conversations'
      );
      // Sort BOOST BOT or newest unread conversations to top
      const sorted = [...list].sort((a, b) => {
        if (a.partner.id === 'boost_bot_official' && a.unreadCount > 0) return -1;
        if (b.partner.id === 'boost_bot_official' && b.unreadCount > 0) return 1;
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;
        return bTime - aTime;
      });
      setConversations(sorted);
      if (!activePartner && initialPartner) {
        setActivePartner(initialPartner);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activePartner) return;
    apiFetch<DirectMessageItem[]>(`/api/messages/${activePartner.id}`)
      .then((thread) => {
        setMessages(thread);
        if (isOwnerAdmin && activePartner.id !== 'boost_bot_official') {
          const lastIncoming = [...thread]
            .reverse()
            .find((m) => m.senderId === activePartner.id);
          if (
            lastIncoming &&
            lastIncoming.content?.startsWith('🤖 [Reply to BOOST BOT]:')
          ) {
            setReplyAsBoostBot(true);
          } else {
            setReplyAsBoostBot(false);
          }
        }
        refreshBadgesCount();
        loadConversations();
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
          60
        );
      })
      .catch(() => {});
  }, [activePartner, refreshBadgesCount, isOwnerAdmin]);

  // Listen to SSE realtime messages and typing events
  useEffect(() => {
    if (realtimeEvents.length === 0) return;
    const latest = realtimeEvents[realtimeEvents.length - 1];
    if (latest.type === 'direct_message') {
      const msg: DirectMessageItem = latest.payload;
      if (
        activePartner &&
        (msg.senderId === activePartner.id ||
          msg.receiverId === activePartner.id)
      ) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
          60
        );
      }
      loadConversations();
    } else if (latest.type === 'message_modified') {
      const mod: DirectMessageItem = latest.payload;
      setMessages((prev) =>
        mod.isDeleted
          ? prev.filter((m) => m.id !== mod.id)
          : prev.map((m) => (m.id === mod.id ? mod : m))
      );
    } else if (
      latest.type === 'typing' &&
      activePartner &&
      latest.payload?.senderId === activePartner.id
    ) {
      setPartnerTyping(Boolean(latest.payload.isTyping));
    }
  }, [realtimeEvents, activePartner]);

  const handleTypingChange = (val: string) => {
    setInputContent(val);
    if (activePartner) {
      apiFetch('/api/realtime/typing', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: activePartner.id,
          isTyping: val.trim().length > 0,
        }),
      }).catch(() => {});
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner || !inputContent.trim()) return;
    const text = inputContent.trim();
    setInputContent('');
    const replyId = replyTo?.id;
    setReplyTo(null);

    try {
      if (isOwnerAdmin && replyAsBoostBot && activePartner.id !== 'boost_bot_official') {
        await apiFetch('/api/admin/action', {
          method: 'POST',
          body: JSON.stringify({
            action: 'send_boost_bot_message',
            payload: {
              targetUserId: activePartner.id,
              content: text,
            },
          }),
        });
        const created = await apiFetch<DirectMessageItem>(
          `/api/messages/${activePartner.id}`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: `🤖 [Replied via BOOST BOT]: ${text}`,
              replyToId: replyId,
            }),
          }
        );
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        );
        showToast(
          `Reply delivered to ${activePartner.displayName} via BOOST BOT!`,
          'success'
        );
      } else {
        const created = await apiFetch<DirectMessageItem>(
          `/api/messages/${activePartner.id}`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: text,
              replyToId: replyId,
            }),
          }
        );
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        );
        if (activePartner.id === 'boost_bot_official' && !isOwnerAdmin) {
          showToast(
            'Your reply to BOOST BOT was sent directly to Prince Abba!',
            'success'
          );
        }
      }
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        60
      );
      loadConversations();
    } catch {
      showToast('Failed to send message.', 'error');
    }
  };

  const handleUploadAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activePartner) return;
    setUploadingMedia(true);
    try {
      const isVid = file.type.startsWith('video/');
      const isAud =
        file.type.startsWith('audio/') ||
        /\.(wav|mp3|ogg|m4a|aac)$/i.test(file.name);
      const uploaded = await uploadMediaWithProgress(file, 'messages');
      const created = await apiFetch<DirectMessageItem>(
        `/api/messages/${activePartner.id}`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: isAud
              ? '🎤 Voice Note'
              : isVid
                ? 'Sent a video'
                : 'Sent a photo',
            mediaUrl: uploaded.url,
            mediaType: isAud ? 'audio' : isVid ? 'video' : 'photo',
          }),
        }
      );
      setMessages((prev) => [...prev, created]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        60
      );
    } catch (err: any) {
      showToast(err.message || 'Media upload failed.', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const cleanupVoiceRecording = () => {
    if (voiceTimerRef.current) {
      window.clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
    }
    setIsRecordingVoiceNote(false);
  };

  const handleStartVoiceNoteRecording = async () => {
    if (!activePartner || isRecordingVoiceNote) return;
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      showToast('Microphone recording is not supported on this device.', 'error');
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
      voiceStreamRef.current = stream;
      voiceCancelledRef.current = false;

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
      voiceRecorderRef.current = recorder;

      const startedAt = Date.now();
      setRecordingSeconds(0);
      setIsRecordingVoiceNote(true);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        const elapsedSec = Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000)
        );
        cleanupVoiceRecording();

        if (voiceCancelledRef.current) {
          return;
        }

        const rawBlob = new Blob(chunks, {
          type: selectedMime || 'audio/webm',
        });
        if (rawBlob.size === 0) {
          showToast('Voice note was empty. Please try again.', 'error');
          return;
        }

        setUploadingMedia(true);
        try {
          // Convert to universal 16-bit PCM WAV so it plays on 100% of iOS, Android & desktop browsers
          let audioFile: File;
          try {
            const audioBuffer = await decodeMediaToAudioBuffer(rawBlob);
            const wavBlob = encodeAudioBufferToWavBlob(audioBuffer);
            audioFile = new File([wavBlob], `voice-note-${Date.now()}.wav`, {
              type: 'audio/wav',
            });
          } catch {
            audioFile = new File([rawBlob], `voice-note-${Date.now()}.webm`, {
              type: rawBlob.type || 'audio/webm',
            });
          }

          const uploaded = await uploadMediaWithProgress(audioFile, 'messages');
          const mins = Math.floor(elapsedSec / 60);
          const secs = elapsedSec % 60;
          const durLabel = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

          const created = await apiFetch<DirectMessageItem>(
            `/api/messages/${activePartner.id}`,
            {
              method: 'POST',
              body: JSON.stringify({
                content: `🎤 Voice Note (${durLabel})`,
                mediaUrl: uploaded.url,
                mediaType: 'audio',
                replyToId: replyTo?.id,
              }),
            }
          );
          setReplyTo(null);
          setMessages((prev) =>
            prev.some((m) => m.id === created.id) ? prev : [...prev, created]
          );
          loadConversations();
          showToast('Voice note sent!', 'success');
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
            60
          );
        } catch (err: any) {
          showToast(err.message || 'Could not send voice note.', 'error');
        } finally {
          setUploadingMedia(false);
        }
      };

      recorder.start(100);
      voiceTimerRef.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - startedAt) / 1000);
        setRecordingSeconds(sec);
        if (sec >= 120) {
          handleStopAndSendVoiceNote();
        }
      }, 250);
    } catch {
      showToast(
        'Microphone permission denied. Please allow microphone access to send voice notes.',
        'error'
      );
    }
  };

  const handleStopAndSendVoiceNote = () => {
    voiceCancelledRef.current = false;
    if (
      voiceRecorderRef.current &&
      voiceRecorderRef.current.state !== 'inactive'
    ) {
      voiceRecorderRef.current.stop();
    } else {
      cleanupVoiceRecording();
    }
  };

  const handleCancelVoiceNoteRecording = () => {
    voiceCancelledRef.current = true;
    if (
      voiceRecorderRef.current &&
      voiceRecorderRef.current.state !== 'inactive'
    ) {
      voiceRecorderRef.current.stop();
    } else {
      cleanupVoiceRecording();
    }
    showToast('Voice note cancelled', 'info');
  };

  const handleModifyMessage = async (
    msgId: number,
    action: 'react' | 'delete',
    reaction?: string
  ) => {
    try {
      const updated = await apiFetch<DirectMessageItem>(
        `/api/messages/item/${msgId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ action, reaction }),
        }
      );
      if (action === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? updated : m))
        );
      }
    } catch {
      showToast('Could not update message.', 'error');
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      c.partner.displayName.toLowerCase().includes(q) ||
      c.partner.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-6">
      <div className="w-full max-w-4xl h-full sm:h-[84vh] bg-[#0B1021] sm:border border-white/10 sm:rounded-3xl flex overflow-hidden shadow-2xl">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-white/10 flex flex-col ${
            activePartner ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {userProfile && (
                <Avatar
                  src={userProfile.avatarUrl}
                  name={userProfile.displayName}
                  size="sm"
                  isOnline={true}
                />
              )}
              <h3 className="text-base font-semibold text-white">Messages</h3>
            </div>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No conversations yet. Connect with friends or tap Message on any
                profile!
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isBoostBot =
                  conv.partner.id === 'boost_bot_official' ||
                  conv.partner.displayName === 'BOOST BOT';
                const isOnline =
                  isBoostBot ||
                  conv.isOnline ||
                  onlineUserIds.has(conv.partner.id);
                const isSelected = activePartner?.id === conv.partner.id;

                return (
                  <button
                    key={conv.partner.id}
                    onClick={() => setActivePartner(conv.partner)}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600/15'
                        : isBoostBot
                          ? 'bg-purple-500/10 hover:bg-purple-500/15'
                          : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <Avatar
                      src={conv.partner.avatarUrl}
                      name={
                        isBoostBot ? 'BOOST BOT' : conv.partner.displayName
                      }
                      size="md"
                      isOnline={isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate inline-flex items-center gap-1">
                          <span>
                            {isBoostBot
                              ? 'BOOST BOT'
                              : conv.partner.displayName}
                          </span>
                          {(isBoostBot || conv.partner.isVerified) && (
                            <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[11px] text-slate-400">
                            {formatRelativeTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-slate-300 truncate">
                          {conv.lastMessage
                            ? conv.lastMessage.content || 'Sent media'
                            : `@${conv.partner.username}`}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-semibold text-white tabular-nums">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Thread */}
        <div
          className={`flex-1 flex flex-col bg-[#070B17] ${
            activePartner ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!activePartner ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-slate-300">
                Select a conversation to start messaging
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Real-time messages, profile photos, media sharing, and reactions
              </p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-white/10 bg-[#0B1021] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePartner(null)}
                    className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar
                    src={activePartner.avatarUrl}
                    name={
                      activePartner.id === 'boost_bot_official'
                        ? 'BOOST BOT'
                        : activePartner.displayName
                    }
                    size="md"
                    isOnline={
                      activePartner.id === 'boost_bot_official' ||
                      onlineUserIds.has(activePartner.id)
                    }
                  />
                  <div>
                    <p className="text-sm font-bold text-white inline-flex items-center gap-1.5">
                      <span>
                        {activePartner.id === 'boost_bot_official'
                          ? 'BOOST BOT'
                          : activePartner.displayName}
                      </span>
                      {(activePartner.id === 'boost_bot_official' ||
                        activePartner.isVerified) && (
                        <BadgeCheck className="w-4 h-4 text-blue-400" />
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {activePartner.id === 'boost_bot_official'
                        ? 'Official BoostHub Messenger · Replies go directly to Prince Abba'
                        : partnerTyping
                          ? 'Typing...'
                          : onlineUserIds.has(activePartner.id)
                            ? 'Active now'
                            : `@${activePartner.username}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Scroll Area (Facebook Messenger style with avatars & sender name on top, message down) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Say hello to {activePartner.displayName}!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === userProfile?.id;
                    const isBoostBotSender =
                      msg.senderId === 'boost_bot_official' ||
                      activePartner.id === 'boost_bot_official';
                    const senderLabel = isMine
                      ? userProfile?.displayName || 'You'
                      : isBoostBotSender
                        ? 'BOOST BOT'
                        : activePartner.displayName;
                    const senderAvatar = isMine
                      ? userProfile?.avatarUrl
                      : activePartner.avatarUrl;
                    const repliedMsg = msg.replyToId
                      ? messages.find((m) => m.id === msg.replyToId)
                      : null;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${
                          isMine ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar
                          src={senderAvatar}
                          name={senderLabel}
                          size="sm"
                        />

                        <div
                          className={`flex flex-col max-w-[75%] ${
                            isMine ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`w-full rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-xs'
                                : isBoostBotSender
                                  ? 'bg-gradient-to-br from-purple-900/80 via-[#131C38] to-blue-900/70 border border-purple-500/40 text-white rounded-bl-xs shadow-lg'
                                  : 'bg-white/10 text-slate-100 rounded-bl-xs'
                            }`}
                          >
                            {/* Sender Name on Top */}
                            <div className="flex items-center gap-1 mb-1">
                              <span
                                className={`text-xs font-extrabold tracking-wide ${
                                  isMine
                                    ? 'text-blue-100'
                                    : isBoostBotSender
                                      ? 'text-amber-300'
                                      : 'text-blue-300'
                                }`}
                              >
                                {senderLabel}
                              </span>
                              {!isMine &&
                                (isBoostBotSender ||
                                  activePartner.isVerified) && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                )}
                            </div>

                            {repliedMsg && (
                              <div className="mb-1.5 pl-2 border-l-2 border-white/40 text-[11px] opacity-80 truncate">
                                Replying to: {repliedMsg.content}
                              </div>
                            )}

                            {msg.mediaUrl && (
                              <>
                                {msg.mediaType === 'audio' ||
                                /\.(wav|mp3|ogg|m4a|aac)(\?|$)/i.test(
                                  msg.mediaUrl
                                ) ||
                                msg.content?.startsWith('🎤 Voice Note') ? (
                                  <VoiceNoteBubblePlayer
                                    src={msg.mediaUrl}
                                    label={msg.content || 'Voice Note'}
                                    isMine={isMine}
                                  />
                                ) : (
                                  <div className="mb-2 rounded-xl overflow-hidden bg-black/30">
                                    {msg.mediaType === 'video' ? (
                                      <video
                                        src={msg.mediaUrl}
                                        controls
                                        playsInline
                                        preload="auto"
                                        className="max-h-52 w-full object-contain"
                                      />
                                    ) : (
                                      <img
                                        src={msg.mediaUrl}
                                        alt="Attachment"
                                        referrerPolicy="no-referrer"
                                        className="max-h-52 w-full object-cover"
                                      />
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Message Down Below */}
                            {msg.content &&
                              !(
                                msg.mediaUrl &&
                                (msg.mediaType === 'audio' ||
                                  msg.content.startsWith('🎤 Voice Note'))
                              ) && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                              )}

                            <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] opacity-75">
                              <span>{formatRelativeTime(msg.createdAt)}</span>
                              {isMine && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${
                                    msg.isRead ? 'text-sky-200' : 'opacity-60'
                                  }`}
                                />
                              )}
                            </div>
                          </div>

                          {/* Message Actions & Reaction */}
                          <div className="flex items-center gap-2 mt-1 px-1">
                            {msg.reaction && (
                              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                                {msg.reaction}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                handleModifyMessage(
                                  msg.id,
                                  'react',
                                  msg.reaction === '❤️' ? '🔥' : '❤️'
                                )
                              }
                              className="text-[11px] text-slate-500 hover:text-pink-400"
                            >
                              React
                            </button>
                            <button
                              onClick={() => setReplyTo(msg)}
                              className="text-[11px] text-slate-500 hover:text-white inline-flex items-center gap-0.5"
                            >
                              <CornerUpLeft className="w-3 h-3" /> Reply
                            </button>
                            {isMine && (
                              <button
                                onClick={() =>
                                  handleModifyMessage(msg.id, 'delete')
                                }
                                className="text-[11px] text-slate-500 hover:text-rose-400 inline-flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Emoji Picker Bar */}
              {showEmojiBar && (
                <div className="px-4 py-2 bg-[#0B1021] border-t border-white/10 flex items-center gap-2 overflow-x-auto">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setInputContent((c) => c + em)}
                      className="text-lg hover:scale-125 transition-transform px-1.5"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Composer */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-[#0B1021] border-t border-white/10"
              >
                {isOwnerAdmin && activePartner.id !== 'boost_bot_official' && (
                  <div className="flex items-center justify-between gap-2 mb-2.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px]">
                    <span className="text-slate-400 font-medium">
                      Send Reply Mode:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setReplyAsBoostBot(false)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          !replyAsBoostBot
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        As @Abba
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyAsBoostBot(true)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          replyAsBoostBot
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🤖 As BOOST BOT
                      </button>
                    </div>
                  </div>
                )}

                {replyTo && (
                  <div className="flex items-center justify-between text-xs text-blue-400 mb-2 px-2">
                    <span className="truncate">
                      Replying to: "{replyTo.content.slice(0, 45)}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleUploadAttachment}
                  className="hidden"
                />

                {isRecordingVoiceNote ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-rose-950/60 border border-rose-500/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="text-xs font-extrabold text-rose-200 font-mono tabular-nums">
                        🎤 Recording {Math.floor(recordingSeconds / 60)}:
                        {recordingSeconds % 60 < 10 ? '0' : ''}
                        {recordingSeconds % 60}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelVoiceNoteRecording}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleStopAndSendVoiceNote}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white inline-flex items-center gap-1.5 shadow-lg"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Voice Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="min-h-[42px] min-w-[42px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center"
                      title="Send Photo or Video"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleStartVoiceNoteRecording}
                      disabled={uploadingMedia}
                      className="min-h-[42px] min-w-[42px] rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 flex items-center justify-center"
                      title="Record Voice Note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmojiBar((s) => !s)}
                      className="min-h-[42px] min-w-[42px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center"
                      title="Emojis"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={inputContent}
                      onChange={(e) => handleTypingChange(e.target.value)}
                      placeholder={
                        uploadingMedia
                          ? 'Sending voice note / attachment...'
                          : 'Write a message or tap 🎤 for voice note...'
                      }
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputContent.trim()}
                      className="min-h-[42px] min-w-[42px] rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
