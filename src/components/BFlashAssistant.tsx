import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Film,
  ShoppingBag,
  MessageSquare,
  Video,
  PlusCircle,
  Trash2,
  Wand2,
  Image as ImageIcon,
  Camera,
  Maximize2,
} from 'lucide-react';
import { MainTab } from '../types';
import { useAuth } from '../state/AuthContext';

interface BFlashMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  createdAt: string;
}

interface BFlashAssistantProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenMessages: () => void;
}

const LIVE_CLOUD_ORIGIN =
  'https://ais-pre-dcxbkwei6q7fkhlsqjulum-948785102023.europe-west2.run.app';

const QUICK_PROMPTS = [
  'Who created you and built BoostHub?',
  'Explain the solar system with a picture and diagrams',
  'How do I translate my voice to Igbo, Hausa, Yoruba or Akwa Ibom in B-Edit?',
  'How do I earn badges and complete progressive missions?',
  'Write 5 viral Capshot captions with trending hashtags',
];

function buildSmartFallbackAnswer(query: string, userName: string): string {
  const q = query.trim().toLowerCase();

  if (
    q.includes('who created') ||
    q.includes('who made') ||
    q.includes('creator') ||
    q.includes('founder') ||
    q.includes('owner') ||
    q.includes('prince abba')
  ) {
    return `⚡ **B FLASH Origin & Creator:**\n\nI was created and engineered by **Prince Abba (@princeabba96-byte)** — the visionary founder and creator of BoostHub!\n\nPrince Abba built me to be your all-in-one multimodal AI companion for creative dominance, viral storytelling, Nigerian dialect translation, pro video editing, and universal knowledge. Salute to the founder! 👑`;
  }

  // Math expression evaluator
  const mathMatch = q.replace(/[^0-9+\-*/().%^ ]/g, '').trim();
  if (
    mathMatch.length >= 3 &&
    /[0-9]+\s*[+\-*/]\s*[0-9]+/.test(mathMatch) &&
    !/[a-z]{4,}/i.test(q.replace(/what|is|calculate|solve|equals/gi, ''))
  ) {
    try {
      const sanitized = mathMatch.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized});`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        return `⚡ **B FLASH Calculation:**\n\n\`${mathMatch} = ${result.toLocaleString()}\`\n\nNeed help with advanced algebra, calculus, physics equations, or word problems? Just ask or send a photo of your math!`;
      }
    } catch {}
  }

  if (
    q.includes('picture') ||
    q.includes('photo') ||
    q.includes('image') ||
    q.includes('diagram') ||
    q.includes('show me') ||
    q.includes('visual')
  ) {
    return `⚡ **B FLASH Visual Illustration:**\n\nHere is a visual breakdown for your topic:\n\n![Visual Explanation](https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80)\n\n*Key Elements:*\n- Clean visual representation with balanced lighting and clear focal points.\n- You can also upload any image directly to me using the 📷 **Picture** button and I will analyze, explain, or translate it immediately!`;
  }

  if (
    q.includes('badge') ||
    q.includes('rank') ||
    q.includes('mission')
  ) {
    return `⚡ **B FLASH Guide — Badges & Progressive Missions:**\n\n1. **Earned, Not Given Freely:** On BoostHub, badges can NEVER be gotten freely! You must complete missions **one rank at a time**.\n2. **Progression Track (Rank 1 to 7):**\n   - **Rank 1 (Rookie Pioneer):** Complete profile, post 1 clip, give 5 likes.\n   - **Rank 2 (Firering Editor):** Edit 3 clips in B-Edit + earn 15 likes. *(Locked until Rank 1 claimed)*.\n   - **Rank 3 (Engagement Master):** 60 likes + 2 communities. *(Locked until Rank 2 claimed)*.\n   - **Rank 4 (Content God):** 12 Capshots + 500 views + send 2 gifts.\n   - **Rank 5 (Distant Winner):** 1,500 XP + 50 followers.\n   - **Rank 6 (Boost Pro Grandmaster):** 3,500 XP + 100 followers + 10 gifts.\n   - **Rank 7 (Sovereign Mythic):** 7,500 XP + 500 followers + top 1% prestige!\n3. Only the founder Prince Abba holds supreme godmode with all badges permanently unlocked!`;
  }

  if (
    q.includes('igbo') ||
    q.includes('hausa') ||
    q.includes('yoruba') ||
    q.includes('youroba') ||
    q.includes('akwa ibom') ||
    q.includes('ibibio') ||
    q.includes('pidgin') ||
    q.includes('voice changer') ||
    q.includes('dialect')
  ) {
    return `⚡ **B FLASH Guide — 54 Realistic Voices & Nigerian Dialect Translator:**\n\n1. Tap **B-Edit** (or **+** → **B-Edit Studio**).\n2. Go to **Audio** → **Voice Cover**.\n3. Tap **Record Voice Cover** and speak naturally in English.\n4. Switch to **54 Voices & Dialects** and tap any voice:\n   - 🇳🇬 **Igbo Language (Odogwu Male / Ada Igbo Female)**: Fluent *Asụsụ Igbo*.\n   - 🇳🇬 **Yoruba Language (Ọmọ Yorùbá / Olori Female)**: Fluent *Èdè Yorùbá*.\n   - 🇳🇬 **Hausa Language (Mallam / Hajiya Hausa)**: Fluent *Harshen Hausa*.\n   - 🇳🇬 **Akwa Ibom / Ibibio (Ette / Mma Akwa Ibom)**: Authentic *Ibibio/Efik*.\n   - 🇳🇬 **Lagos Street Pidgin**: Sharp Naija street flow!\n5. The AI translates every word and locks the voice track to your video timeline!`;
  }

  return `⚡ **Hello ${userName}! I'm B FLASH — created by Prince Abba (@princeabba96-byte).**\n\nRegarding **"${query}"**:\n- I can answer ANY question across science, math, technology, business, philosophy, coding, and viral media.\n- You can also upload any image or screenshot using the 📷 **Picture** button and I will analyze and explain it for you.\n- Tap any quick action or ask your question below!`;
}

export const BFlashAssistant: React.FC<BFlashAssistantProps> = ({
  activeTab,
  onChangeTab,
  onOpenMessages,
}) => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    mimeType: string;
    data: string;
  } | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<BFlashMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${
        userProfile?.displayName || 'Creator'
      }! ⚡ I'm **B FLASH**, your ultra-smart AI companion created by **Prince Abba (@princeabba96-byte)**.\n\nAsk me **ANY question on Earth** — science, math, coding, Nigerian languages, viral video hooks, or how to use BoostHub. You can also **send pictures** to me using the 📷 button below, and I can explain concepts with pictures too!`,
      createdAt: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [messages, isOpen]);

  const handleSpeakMessage = (msg: BFlashMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = msg.content
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/[*#`_~]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 1.02;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1] || '';
      setAttachedImage({
        dataUrl,
        mimeType,
        data: base64Data,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if ((!trimmed && !attachedImage) || loading) return;

    const userImgUrl = attachedImage?.dataUrl;
    const userImgPayload = attachedImage
      ? { mimeType: attachedImage.mimeType, data: attachedImage.data }
      : null;

    const userMsg: BFlashMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed || 'Analyze this picture for me in detail.',
      imageUrl: userImgUrl,
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    try {
      const payload = {
        message: trimmed,
        image: userImgPayload,
        history: updatedHistory.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        activeTab,
        userName: userProfile?.displayName || userProfile?.username || 'Creator',
      };

      let replyText = '';

      // 1. Try local relative server endpoint
      try {
        const res = await fetch('/api/ai/bflash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) replyText = String(data.reply);
        }
      } catch {}

      // 2. If running on GitHub Pages or external domain, fallback to live cloud origin
      if (!replyText && typeof window !== 'undefined') {
        const isExternalOrGh =
          window.location.hostname.includes('github.io') ||
          window.location.protocol === 'file:';
        if (isExternalOrGh) {
          try {
            const cloudRes = await fetch(`${LIVE_CLOUD_ORIGIN}/api/ai/bflash`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (cloudRes.ok) {
              const cloudData = await cloudRes.json();
              if (cloudData?.reply) replyText = String(cloudData.reply);
            }
          } catch {}
        }
      }

      if (!replyText) {
        replyText = buildSmartFallbackAnswer(
          trimmed,
          userProfile?.displayName || 'Creator'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: replyText,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render message content with inline image cards
  const renderMessageContent = (content: string) => {
    // Check for markdown image: ![alt](url)
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const alt = match[1] || 'Explanation Image';
      const url = match[2];
      parts.push(
        <div key={match.index} className="my-2.5 rounded-2xl overflow-hidden border border-white/20 group relative">
          <img
            src={url}
            alt={alt}
            className="w-full max-h-56 object-cover rounded-xl cursor-pointer hover:brightness-105 transition-all"
            onClick={() => setPreviewZoomImage(url)}
          />
          <button
            type="button"
            onClick={() => setPreviewZoomImage(url)}
            className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-[10px] text-white flex items-center gap-1 font-semibold backdrop-blur-xs"
          >
            <Maximize2 className="w-3 h-3" /> Zoom
          </button>
        </div>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectImageFile}
      />

      {/* Floating B FLASH Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed right-3.5 lg:bottom-6 lg:right-6 z-40 group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-600/35 border border-white/25 transition-all active:scale-95 ${
          activeTab === 'bedit' ? 'bottom-[136px]' : 'bottom-[74px]'
        }`}
        title="Ask B FLASH AI Assistant"
      >
        <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 border border-amber-300/60">
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#060813]" />
        </span>
        <div className="text-left leading-tight">
          <span className="block text-[11px] font-black tracking-wider text-white">
            B FLASH
          </span>
          <span className="block text-[9px] font-semibold text-blue-100/90">
            Multimodal AI
          </span>
        </div>
      </button>

      {/* Fullscreen Image Preview Zoom Lightbox */}
      {previewZoomImage && (
        <div
          onClick={() => setPreviewZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={previewZoomImage}
              alt="Zoom Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* B FLASH Chat Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-end sm:p-4">
          <div className="w-full sm:w-[440px] h-[85vh] sm:h-[660px] bg-[#0B1021] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-purple-950/90 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-blue-500 to-purple-600 p-0.5 shadow-lg">
                  <div className="w-full h-full rounded-[14px] bg-[#0B1021] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-wide text-white">
                      B FLASH AI
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-extrabold text-emerald-300">
                      MULTIMODAL
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Created by Prince Abba • Universal AI & Vision
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: `welcome_${Date.now()}`,
                        role: 'assistant',
                        content:
                          'Conversation refreshed! ⚡ Ask me anything, or send a picture using the 📷 button for full visual analysis.',
                        createdAt: new Date().toISOString(),
                      },
                    ])
                  }
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick App Navigation Shortcuts */}
            <div className="px-3 py-2 bg-[#080C1A] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  onChangeTab('bedit');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[11px] font-semibold text-purple-200 inline-flex items-center gap-1 shrink-0 hover:bg-purple-500/25"
              >
                <Film className="w-3 h-3 text-purple-400" />
                <span>B-Edit Studio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeTab('bshop');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-[11px] font-semibold text-teal-200 inline-flex items-center gap-1 shrink-0 hover:bg-teal-500/25"
              >
                <ShoppingBag className="w-3 h-3 text-teal-400" />
                <span>B-Shop Gifts</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenMessages();
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[11px] font-semibold text-blue-200 inline-flex items-center gap-1 shrink-0 hover:bg-blue-500/25"
              >
                <MessageSquare className="w-3 h-3 text-blue-400" />
                <span>Messages</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {messages.map((msg) => {
                const isBot = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isBot ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isBot
                          ? 'bg-[#121A33] border border-blue-500/25 text-slate-100 rounded-tl-xs shadow-md'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md'
                      }`}
                    >
                      {isBot && (
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10">
                          <span className="text-[10px] font-black text-amber-300 inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> B FLASH AI
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(msg)}
                            className="text-[10px] text-blue-300 hover:text-white inline-flex items-center gap-1 font-semibold"
                          >
                            {speakingId === msg.id ? (
                              <>
                                <VolumeX className="w-3 h-3 text-rose-400" /> Stop
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" /> Listen
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Attached User Picture */}
                      {msg.imageUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/20">
                          <img
                            src={msg.imageUrl}
                            alt="Attached image"
                            className="max-h-48 w-full object-cover rounded-lg cursor-pointer hover:brightness-105"
                            onClick={() => setPreviewZoomImage(msg.imageUrl!)}
                          />
                        </div>
                      )}

                      <div>{renderMessageContent(msg.content)}</div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#121A33] border border-blue-500/25 w-fit text-xs text-blue-300 animate-pulse">
                  <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>B FLASH is analyzing & preparing answer...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-1.5 bg-[#080C1A] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => sendQuestion(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 whitespace-nowrap shrink-0 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Attached Image Preview Bar before sending */}
            {attachedImage && (
              <div className="px-3 py-2 bg-[#0B132B] border-t border-cyan-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={attachedImage.dataUrl}
                    alt="Upload thumbnail"
                    className="w-10 h-10 object-cover rounded-lg border border-cyan-400/50"
                  />
                  <div className="text-[11px] text-cyan-200">
                    <p className="font-bold">Picture Attached</p>
                    <p className="text-[9px] text-slate-400">
                      B FLASH will analyze this picture with your question
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Form with Picture Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
              className="p-3 bg-[#0B1021] border-t border-white/10 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] min-w-[40px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-400 hover:text-cyan-300 flex items-center justify-center transition-colors shadow-sm"
                title="Send picture to B FLASH"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  attachedImage
                    ? 'Ask about this picture...'
                    : 'Ask B FLASH anything or send pictures...'
                }
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !attachedImage) || loading}
                className="min-h-[40px] min-w-[40px] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
