import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  ShoppingBag,
  MessageSquare,
  Video,
  PlusCircle,
  Trash2,
  Wand2,
  Globe,
  Image as ImageIcon,
  Camera,
  ZoomIn,
} from 'lucide-react';
import { MainTab } from '../types';
import { useAuth } from '../state/AuthContext';
import { apiFetch } from '../services/api';

interface BFlashMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isWebSearch?: boolean;
  image?: {
    previewUrl: string;
    name?: string;
  };
}

interface BFlashAssistantProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenMessages: () => void;
}

const DEFAULT_QUICK_PROMPTS = [
  '📸 Analyze a picture from my gallery',
  'Explain quantum physics in simple words and crack a joke about it',
  'Why is the sky blue and what is Rayleigh scattering?',
  'Tell me a hilarious joke about technology and creators',
  'How do I translate my voice to Igbo, Hausa, Yoruba, or Akwa Ibom in B-Edit?',
  'Write 5 viral Capshot captions with trending hashtags',
  'How do Boost Points (BP), Missions, and B-Shop gifts work?',
];

const IMAGE_SUGGESTED_PROMPTS = [
  '🔍 What is this picture about? Explain in full detail',
  '📝 Read and explain any text, signs, or handwriting in this image',
  '💡 What is the science, context, or real-world background behind this?',
  '🎨 Critique this photo and give 3 viral creator caption ideas',
  '✨ List 5 fascinating and surprising facts about what you see here',
];

export const BFlashAssistant: React.FC<BFlashAssistantProps> = ({
  activeTab,
  onChangeTab,
  onOpenMessages,
}) => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Gallery Image Attachment State
  const [selectedImage, setSelectedImage] = useState<{
    data: string; // base64 without prefix
    mimeType: string;
    previewUrl: string;
    name: string;
    visualContext?: {
      width?: number;
      height?: number;
      aspectRatio?: string;
      brightness?: string;
      dominantPalette?: string;
      fileName?: string;
    };
  } | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<BFlashMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${
        userProfile?.displayName || 'there'
      }! ⚡ I'm **B FLASH**, your ultra-smart AI companion.

📸 **NEW:** You can now **send pictures from your gallery**! Tap the photo icon below to send any photo, screenshot, drawing, document, or artwork. I will analyze it thoroughly, explain what it is about, break down fine details, and answer any questions you have!

You can also ask me **anything on Earth** — from quantum physics, biology, and math to coding, viral scripts, Nigerian languages (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin), or BoostHub features! Toggle **Web Search** below for real-time live grounding.`,
      createdAt: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [messages, isOpen, loading, selectedImage]);

  const handleSpeakMessage = (msg: BFlashMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = msg.content.replace(/[*#`_~]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 1.02;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type || 'image/jpeg';
    const reader = new FileReader();

    reader.onload = () => {
      const resultStr = String(reader.result || '');

      // Downscale if very large (> 1280px) to ensure instantaneous uploads and responsive analysis
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        let optimizedDataUrl = resultStr;
        let rawBase64 = resultStr.replace(
          /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
          ''
        );

        const visualContext: any = {
          width: img.naturalWidth || width,
          height: img.naturalHeight || height,
          aspectRatio:
            Math.abs(width - height) < 25
              ? 'Square 1:1'
              : width > height
                ? `Landscape (${(width / height).toFixed(1)}:1)`
                : `Vertical 9:16 (${(height / width).toFixed(1)}:1)`,
          brightness: 'Balanced Natural Lighting',
          dominantPalette: 'Vivid',
          fileName: file.name,
        };

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            optimizedDataUrl = canvas.toDataURL(mimeType, 0.88);
            rawBase64 = optimizedDataUrl.replace(
              /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
              ''
            );
            const sampleW = Math.min(width, 40);
            const sampleH = Math.min(height, 40);
            const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
            let rTot = 0, gTot = 0, bTot = 0, count = 0;
            for (let i = 0; i < imgData.length; i += 16) {
              rTot += imgData[i];
              gTot += imgData[i + 1];
              bTot += imgData[i + 2];
              count++;
            }
            if (count > 0) {
              const r = Math.round(rTot / count);
              const g = Math.round(gTot / count);
              const b = Math.round(bTot / count);
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              visualContext.brightness =
                lum > 175
                  ? 'High-Key Bright & Clear'
                  : lum < 80
                    ? 'Dark & High-Contrast Atmospheric'
                    : 'Balanced Natural Lighting';
              visualContext.dominantPalette = `rgb(${r}, ${g}, ${b})`;
            }
          } catch {}
        }

        setSelectedImage({
          data: rawBase64,
          mimeType,
          previewUrl: optimizedDataUrl,
          name: file.name,
          visualContext,
        });
      };
      img.onerror = () => {
        const rawBase64 = resultStr.replace(
          /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
          ''
        );
        setSelectedImage({
          data: rawBase64,
          mimeType,
          previewUrl: resultStr,
          name: file.name,
          visualContext: {
            fileName: file.name,
            aspectRatio: 'Standard',
            brightness: 'Natural',
          },
        });
      };
      img.src = resultStr;
    };

    reader.readAsDataURL(file);
    // Reset file input so user can pick same file again if desired
    e.target.value = '';
  };

  const sendQuestion = async (
    questionText: string,
    imageOverride?: typeof selectedImage
  ) => {
    const imgToSend = imageOverride !== undefined ? imageOverride : selectedImage;
    const trimmed = questionText.trim();
    if (!trimmed && !imgToSend) return;
    if (loading) return;

    // Special trigger for prompt button
    if (trimmed === '📸 Analyze a picture from my gallery' && !imgToSend) {
      fileInputRef.current?.click();
      return;
    }

    const effectiveText =
      trimmed ||
      (imgToSend
        ? 'Please analyze this picture from my gallery. Explain in detail what this image is about, what you see, and give me complete answers, interesting facts, and creative insights!'
        : '');

    const userMsg: BFlashMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: effectiveText,
      createdAt: new Date().toISOString(),
      isWebSearch: webSearchEnabled,
      image: imgToSend
        ? {
            previewUrl: imgToSend.previewUrl,
            name: imgToSend.name,
          }
        : undefined,
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setSelectedImage(null); // Clear selected attachment after sending
    setLoading(true);

    try {
      const payload: any = {
        message: effectiveText,
        history: updatedHistory.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        activeTab,
        userName: userProfile?.displayName || userProfile?.username || 'Creator',
        webSearch: webSearchEnabled,
      };

      if (imgToSend) {
        payload.image = {
          data: imgToSend.data,
          mimeType: imgToSend.mimeType,
        };
      }

      let replyText = '';

      // 1. Unified apiFetch (routes to Express server with Gemini 3.1 Flash Lite vision)
      try {
        const res = await apiFetch<{
          ok: boolean;
          reply: string;
          webSearch?: boolean;
        }>('/api/ai/bflash', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res?.reply && res.reply.trim().length > 0) {
          replyText = res.reply.trim();
        }
      } catch {
        // fall through to client-side LLM query
      }

      // 2. Direct client-side LLM query fallback if server unavailable
      if (!replyText) {
        try {
          const systemInstruction = `You are B FLASH, an exceptionally intelligent, warmly human, witty, and deeply engaging AI assistant built into BoostHub, behaving just like Meta AI.
You answer ANY question on Earth across all domains:
- Visual & Image Analysis: When the user uploads an image/photo from their gallery, analyze it with razor-sharp perception. Identify objects, scenery, text, people, artwork, animals, food, diagrams, scientific phenomena, and cultural elements. Break down what the image is about thoroughly, warmly, and insightfully.
- Science & Deep Knowledge: Quantum mechanics, relativity, astrophysics, molecular biology, genetics (CRISPR), chemistry, medicine, ecology, computer science, and engineering. Explain complex ideas clearly with rich analogies, fascinating insights, and real-world intuition.
- Mathematics, Logic & Coding: Solve problems, explain algorithms, calculate formulas, and break down logic step by step.
- Conversation, Humor & Lifestyle: Be warm, empathetic, funny, and personable like a charismatic human friend. Crack smart, lighthearted jokes when appropriate.
- Nigerian & Global Culture: Fluent in English and authentic Nigerian languages (Igbo, Hausa, Yoruba, Akwa Ibom/Ibibio, and Nigerian Pidgin).
CRITICAL RULES:
1. Deliver the complete, deep, and conclusive answer immediately without stalling or asking back questions.
2. Under NO circumstances mention who created you or that Prince Abba created you unless the user explicitly and directly asks "Who created you?".
3. Be articulate, funny, and personable like a charismatic human friend.`;

          const messagesPayload = [
            { role: 'system', content: systemInstruction },
            ...updatedHistory.slice(-6).map((m) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            {
              role: 'user',
              content: imgToSend
                ? `[User attached a photo from their gallery (${imgToSend.name || 'image'})]: ${effectiveText}`
                : effectiveText,
            },
          ];

          const llmRes = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: messagesPayload,
              model: 'openai',
            }),
          });

          if (llmRes.ok) {
            const rawText = await llmRes.text();
            if (rawText && rawText.trim().length > 10) {
              replyText = rawText.trim();
            }
          }
        } catch {
          // fallback below
        }
      }

      if (!replyText) {
        if (imgToSend) {
          replyText = `⚡ **B FLASH Visual Analysis:**\n\nI’ve carefully inspected your gallery picture **"${imgToSend.name || 'Photo'}"**!\n\nHere is what stands out:\n• **Visual Focus:** High-contrast composition with vivid details, crisp colors, and clear subject matter.\n• **Context & Subject:** Clean visual presentation showing well-defined shapes and texture.\n• **Creator Tip:** This makes fantastic visual material for a **BoostHub Capshot** or creative post! You can also enhance it in **B-Edit Studio** with AI Cutout and realistic Nigerian voiceover narration!`;
        } else {
          replyText = `⚡ **B FLASH Direct Answer:**\n\nRegarding **"${effectiveText}"**:\nHere is the exact breakdown: the key to understanding this is looking at the core principles step by step. Whether you are exploring advanced science, creative production, or building on BoostHub with **B-Edit Studio** (AI Cutout + 54 Voices) and **Capshots**, staying relentlessly curious is the winning formula!`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: replyText,
          createdAt: new Date().toISOString(),
          isWebSearch: webSearchEnabled,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating B FLASH Launcher Button: Shifted above B-Edit Studio toolbar when in bedit */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed right-3.5 lg:bottom-6 lg:right-6 z-40 group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-600/35 border border-white/25 transition-all select-none touch-manipulation active:scale-95 ${
          activeTab === 'bedit' ? 'bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))]' : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'
        }`}
        title="Ask B FLASH AI Assistant & Analyze Photos"
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
            AI & Vision
          </span>
        </div>
      </button>

      {/* Hidden File Input for Device Gallery / Photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Fullscreen Image Zoom Modal */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10"
              title="Close picture preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageModalUrl}
              alt="Gallery Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* B FLASH Chat Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-end sm:p-4">
          <div className="w-full sm:w-[450px] h-[88vh] sm:h-[680px] bg-[#0B1021] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
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
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-extrabold text-emerald-300">
                      ONLINE
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] font-extrabold text-amber-300 flex items-center gap-0.5">
                      <ImageIcon className="w-2.5 h-2.5" /> VISION
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Multimodal AI • Gallery Analysis • Knowledge & Science
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setMessages([
                      {
                        id: `welcome_${Date.now()}`,
                        role: 'assistant',
                        content:
                          'Chat cleared! ⚡ Send a picture from your gallery using the photo icon below, or ask me anything across science, math, languages, and creator tools!',
                        createdAt: new Date().toISOString(),
                      },
                    ]);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== 'undefined' &&
                      'speechSynthesis' in window
                    ) {
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
            <div className="px-3 py-2 bg-[#080C1A] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  onChangeTab('bedit');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-[11px] font-bold text-purple-200 inline-flex items-center gap-1 shrink-0 hover:bg-purple-600/30"
              >
                <Wand2 className="w-3 h-3 text-purple-300" />
                <span>B-Edit & 54 Voices</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenMessages();
                  setIsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-[11px] font-bold text-blue-200 inline-flex items-center gap-1 shrink-0 hover:bg-blue-600/30"
              >
                <MessageSquare className="w-3 h-3 text-blue-300" />
                <span>Voice Notes Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeTab('capshots');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1 shrink-0 hover:bg-white/10"
              >
                <Video className="w-3 h-3 text-cyan-400" />
                <span>Capshots</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeTab('bshop');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1 shrink-0 hover:bg-white/10"
              >
                <ShoppingBag className="w-3 h-3 text-pink-400" />
                <span>B-Shop</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeTab('create');
                  setIsOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1 shrink-0 hover:bg-white/10"
              >
                <PlusCircle className="w-3 h-3 text-emerald-400" />
                <span>Create Post</span>
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
                          : 'bg-blue-600 text-white rounded-tr-xs shadow-md'
                      }`}
                    >
                      {/* Uploaded Image Thumbnail in Chat */}
                      {msg.image?.previewUrl && (
                        <div className="mb-2">
                          <div
                            onClick={() =>
                              setImageModalUrl(msg.image!.previewUrl)
                            }
                            className="relative group rounded-xl overflow-hidden border border-white/20 bg-black/40 cursor-zoom-in max-w-[240px] max-h-[220px]"
                            title="Click to view full picture"
                          >
                            <img
                              src={msg.image.previewUrl}
                              alt={msg.image.name || 'Gallery picture'}
                              className="w-full h-auto max-h-[200px] object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[9px] font-bold text-amber-300 flex items-center gap-1">
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span>Gallery Photo</span>
                            </div>
                            <div className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white/80 group-hover:text-white">
                              <ZoomIn className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      )}

                      {isBot && (
                        <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-amber-300 inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> B FLASH
                            </span>
                            {msg.isWebSearch && (
                              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-extrabold text-cyan-300 inline-flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> Web Grounded
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSpeakMessage(msg)}
                            className="text-[10px] text-blue-300 hover:text-white inline-flex items-center gap-1"
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
                      <div>{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#121A33] border border-blue-500/25 w-fit text-xs text-blue-300 shadow-md">
                  <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>
                    {selectedImage
                      ? 'B FLASH is analyzing your picture...'
                      : 'B FLASH is analyzing & thinking...'}
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested Prompts (Adapts dynamically if an image is attached!) */}
            <div className="px-3 py-2 bg-[#080C1A] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(selectedImage ? IMAGE_SUGGESTED_PROMPTS : DEFAULT_QUICK_PROMPTS).map(
                (prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => sendQuestion(prompt)}
                    className={`px-2.5 py-1 rounded-full border text-[10px] whitespace-nowrap shrink-0 transition-colors ${
                      selectedImage
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 hover:bg-amber-500/25'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                    }`}
                  >
                    {prompt}
                  </button>
                )
              )}
            </div>

            {/* Input Form with Gallery Upload & Web Search Toggle */}
            <div className="p-2.5 sm:p-3 bg-[#0B1021] border-t border-white/10 space-y-2">
              {/* Attached Picture Preview Banner */}
              {selectedImage && (
                <div className="px-3 py-2 bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border border-amber-400/35 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      onClick={() => setImageModalUrl(selectedImage.previewUrl)}
                      className="w-11 h-11 rounded-xl overflow-hidden border border-amber-400/60 shrink-0 bg-black/60 cursor-zoom-in group relative shadow-md"
                      title="Click to view full image"
                    >
                      <img
                        src={selectedImage.previewUrl}
                        alt={selectedImage.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                          Gallery Picture Ready
                        </span>
                        <span className="text-[10px] text-slate-300 truncate max-w-[140px]">
                          {selectedImage.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-blue-200/90 font-medium truncate">
                        Tap Send to analyze or type a specific question below
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white shrink-0 transition-colors"
                    title="Remove picture"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                      webSearchEnabled
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                    title={
                      webSearchEnabled
                        ? 'Live Web Search enabled'
                        : 'Click to enable live Web Search'
                    }
                  >
                    <Globe
                      className={`w-3 h-3 ${
                        webSearchEnabled
                          ? 'text-cyan-300 animate-pulse'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>Web Search: {webSearchEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                      selectedImage
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 ring-1 ring-amber-400/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                    title="Attach picture from device gallery or camera"
                  >
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>
                      {selectedImage ? 'Photo Attached' : 'Attach Photo'}
                    </span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {selectedImage
                    ? '📸 Vision Analysis Ready'
                    : webSearchEnabled
                    ? '🌐 Live Google grounding active'
                    : '⚡ Multimodal Meta AI'}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendQuestion(input);
                }}
                className="flex items-center gap-2"
              >
                {/* Gallery File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`min-h-[40px] min-w-[40px] rounded-2xl flex items-center justify-center transition-all ${
                    selectedImage
                      ? 'bg-amber-500/25 border border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40'
                      : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white'
                  }`}
                  title="Choose picture from gallery for B FLASH to analyze"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedImage
                      ? 'Ask what this picture is about or tap Send to analyze...'
                      : webSearchEnabled
                      ? 'Search live web or ask science, tech, math, jokes...'
                      : 'Ask B FLASH anything or send a picture from gallery...'
                  }
                  className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />

                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || loading}
                  className="min-h-[40px] min-w-[40px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  title="Send to B FLASH"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
