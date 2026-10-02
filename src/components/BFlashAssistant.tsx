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
} from 'lucide-react';
import { MainTab } from '../types';
import { useAuth } from '../state/AuthContext';

interface BFlashMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface BFlashAssistantProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenMessages: () => void;
}

const CLOUD_API_ORIGIN =
  'https://ais-pre-62xylcimytvbz7erjuuswo-579537184586.europe-west2.run.app';

const QUICK_PROMPTS = [
  'How do I translate my voice to Igbo, Hausa, Yoruba or Akwa Ibom in B-Edit?',
  'How do I send a Voice Note in Messages?',
  'Write 5 viral Capshot captions with trending hashtags',
  'How do Boost Points (BP), Missions, and B-Shop gifts work?',
  'Translate "Welcome to my video, follow for more!" into Igbo, Yoruba, Hausa, Akwa Ibom & Pidgin',
];

function buildSmartFallbackAnswer(query: string, userName: string): string {
  const q = query.trim().toLowerCase();

  // Math expression evaluator
  const mathMatch = q.replace(/[^0-9+\-*/().%^ ]/g, '').trim();
  if (
    mathMatch.length >= 3 &&
    /[0-9]+\s*[+\-*/]\s*[0-9]+/.test(mathMatch) &&
    !/[a-z]{4,}/i.test(q.replace(/what|is|calculate|solve|equals/gi, ''))
  ) {
    try {
      // Safe arithmetic evaluation
      const sanitized = mathMatch.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized});`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        return `⚡ **B FLASH Calculation:**\n\n\`${mathMatch} = ${result.toLocaleString()}\`\n\nNeed help with more advanced math, formulas, or word problems? Just ask!`;
      }
    } catch {
      // fall through
    }
  }

  if (
    q.includes('igbo') ||
    q.includes('hausa') ||
    q.includes('yoruba') ||
    q.includes('youroba') ||
    q.includes('akwa ibom') ||
    q.includes('ibibio') ||
    q.includes('pidgin') ||
    q.includes('pidgen') ||
    q.includes('voice changer') ||
    q.includes('dialect')
  ) {
    return `⚡ **B FLASH Guide — 54 Realistic Voices & Nigerian Dialect Translator:**

1. Tap **B-Edit** (or the **+** button → **B-Edit Studio**).
2. Go to the **Audio** tab at the bottom and select **Voice Cover**.
3. Tap **Record Voice Cover** and speak naturally in **English** (or type/edit your spoken words in the transcript box).
4. Switch to **54 Voices & Dialects** and tap any voice:
   - 🇳🇬 **Igbo Language (Odogwu Male / Ada Igbo Female)**: Translates your English speech into fluent *Asụsụ Igbo* (e.g., *"Nnọọ na vidiyo m, biko soro m!"*).
   - 🇳🇬 **Yoruba Language (Ọmọ Yorùbá / Olori Female)**: Translates into authentic *Èdè Yorùbá* (e.g., *"Ẹ káàbọ̀ sí fídíò mi, ẹ máa tẹ̀lé mi!"*).
   - 🇳🇬 **Hausa Language (Mallam / Hajiya Hausa)**: Translates into fluent *Harshen Hausa* (e.g., *"Barka da zuwa bidiyo na, ku biyo ni!"*).
   - 🇳🇬 **Akwa Ibom / Ibibio (Ette / Mma Akwa Ibom)**: Translates into authentic *Ibibio/Efik* (e.g., *"Emesiere o, mediọọn̄ ke vidio mi, tiene mi!"*).
   - 🇳🇬 **Lagos Street Pidgin**: Converts into authentic Naija street flow (e.g., *"How far my people! Una welcome to my video, make una follow!"*).
   - Plus realistic **Male**, **Female**, **Children**, and **Comedy** human voices!`;
  }

  if (q.includes('voice note') || q.includes('message') || q.includes('chat')) {
    return `⚡ **B FLASH — Sending Voice Notes in Messages:**

1. Tap the **Messages** icon at the top bar (or open any friend's profile and tap **Message**).
2. In the chat bar at the bottom, tap the **🎤 Microphone icon** next to the message box.
3. Speak your message — you'll see a live timer and waveform.
4. Tap **Send Voice Note** to deliver crystal-clear audio instantly to the recipient!`;
  }

  if (
    q.includes('bp') ||
    q.includes('boost point') ||
    q.includes('b-shop') ||
    q.includes('bshop') ||
    q.includes('gift')
  ) {
    return `⚡ **B FLASH — Boost Points (BP) & B-Shop Guide:**

- **Earning BP**: Complete Daily & Weekly Missions (like posting, liking, commenting, and watching Capshots) to earn BP and XP.
- **Spending BP in B-Shop**: Open **B-Shop** to buy profile frames, badges, Mystery Boxes, or send virtual gifts (Roses, Diamonds, Crowns, Trophies) to creators.
- **Instant Balance Deduction**: Every time you buy an item or send a gift with BP, the exact BP cost is immediately deducted from your BP wallet balance and credited toward creator recognition!`;
  }

  if (q.includes('caption') || q.includes('hashtag') || q.includes('viral')) {
    return `⚡ **B FLASH — 5 Viral Capshot Captions & Hashtags:**

1. *"Wait till the end... this energy is unmatched! 🔥✨ #BoostHub #Capshots #Trending #Vibes"*
2. *"From vision to reality — rate this edit 1 to 10! 🎬🚀 #BEditStudio #Creators #ViralVideo"*
3. *"No cap, this is the real street vibe right here 🇳🇬💯 #NaijaCreators #LagosVibes #BoostHub"*
4. *"Behind every great clip is a story worth sharing 🌟🎥 #ContentCreator #Capshots #Explore"*
5. *"Turn up your volume and hear the switch-up! 🎧🗣️ #VoiceChanger #BEditStudio #BoostHub"*`;
  }

  return `⚡ **Hello ${userName}! I'm B FLASH — your all-in-one BoostHub AI Assistant.**

Regarding **"${query}"**:
- If you're asking a general question (science, business, tech, writing, math, or Nigerian languages), tell me the exact details or text you want analyzed, translated, or solved and I'll break it down step by step!
- If you want to **edit videos or translate your voice** into **Igbo, Hausa, Yoruba, Akwa Ibom, or Lagos Street Pidgin**, tap **B-Edit Studio** below.
- If you want to **send a Voice Note**, tap **Messages** below and press the **🎤 Mic** button!`;
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
  const [messages, setMessages] = useState<BFlashMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${
        userProfile?.displayName || 'Creator'
      }! ⚡ I'm **B FLASH**, your smart AI assistant. Ask me **any question at all** — science, math, coding, viral captions, Nigerian languages (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin), or how to use anything on BoostHub!`,
      createdAt: new Date().toISOString(),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

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
    const cleanText = msg.content.replace(/[*#`_~]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 1.02;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsg: BFlashMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        message: trimmed,
        history: updatedHistory.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        activeTab,
        userName: userProfile?.displayName || userProfile?.username || 'Creator',
      };

      let replyText = '';

      // 1. Try relative server endpoint first
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
      } catch {
        // try cloud origin fallback
      }

      // 2. If running on GitHub Pages static domain, try Cloud Run server endpoint
      if (!replyText && typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
        try {
          const cloudRes = await fetch(`${CLOUD_API_ORIGIN}/api/ai/bflash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (cloudRes.ok) {
            const cloudData = await cloudRes.json();
            if (cloudData?.reply) replyText = String(cloudData.reply);
          }
        } catch {
          // fallback below
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

  return (
    <>
      {/* Floating B FLASH Launcher Button: Shifted above B-Edit Studio toolbar when in bedit */}
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
            AI Assistant
          </span>
        </div>
      </button>

      {/* B FLASH Chat Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-end sm:p-4">
          <div className="w-full sm:w-[420px] h-[85vh] sm:h-[640px] bg-[#0B1021] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-purple-950/90 border-b border-white/10 flex items-center justify-between">
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
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Smart BoostHub & General Knowledge AI
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
                          'Chat cleared! ⚡ Ask me anything — app tips, translations, math, coding, science, or viral captions.',
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
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isBot
                          ? 'bg-[#121A33] border border-blue-500/25 text-slate-100 rounded-tl-xs'
                          : 'bg-blue-600 text-white rounded-tr-xs'
                      }`}
                    >
                      {isBot && (
                        <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-white/10">
                          <span className="text-[10px] font-black text-amber-300 inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> B FLASH
                          </span>
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
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#121A33] border border-blue-500/25 w-fit text-xs text-blue-300">
                  <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>B FLASH is thinking...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested Prompts */}
            <div className="px-3 py-2 bg-[#080C1A] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => sendQuestion(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 whitespace-nowrap shrink-0"
                >
                  {prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
              className="p-3 bg-[#0B1021] border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask B FLASH anything..."
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="min-h-[40px] min-w-[40px] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg"
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
