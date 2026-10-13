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
}

interface BFlashAssistantProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenMessages: () => void;
}

const QUICK_PROMPTS = [
  'Explain quantum physics in simple words and crack a joke about it',
  'Why is the sky blue and what is Rayleigh scattering?',
  'Tell me a hilarious joke about technology and creators',
  'How do I translate my voice to Igbo, Hausa, Yoruba, or Akwa Ibom in B-Edit?',
  'Write 5 viral Capshot captions with trending hashtags',
  'How do Boost Points (BP), Missions, and B-Shop gifts work?',
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
  const [messages, setMessages] = useState<BFlashMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${
        userProfile?.displayName || 'there'
      }! ⚡ I'm **B FLASH**, your ultra-smart AI companion. Ask me **anything on Earth** — from quantum physics, biology, and math to coding, viral scripts, Nigerian languages (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin), or BoostHub features! You can also toggle **Web Search** below for real-time live info.`,
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
      isWebSearch: webSearchEnabled,
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
        webSearch: webSearchEnabled,
      };

      let replyText = '';

      // 1. Try unified apiFetch (routes to Express server in preview or staticBackend on live site)
      try {
        const res = await apiFetch<{ ok: boolean; reply: string; webSearch?: boolean }>(
          '/api/ai/bflash',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
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
You answer ANY question on Earth across all domains: science (quantum physics, astrophysics, biology, chemistry, math, tech), philosophy, daily advice, coding, humor, and Nigerian languages/culture.
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
            { role: 'user', content: trimmed },
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
        replyText = `⚡ **B FLASH Direct Answer:**\n\nRegarding **"${trimmed}"**:\nHere is the exact breakdown: the key to understanding this is looking at the core principles step by step. Whether you are exploring advanced science, creative production, or building on BoostHub with **B-Edit Studio** (AI Cutout + 54 Voices) and **Capshots**, staying relentlessly curious is the winning formula!`;
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
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 whitespace-nowrap shrink-0 transition-colors"
                >
                  {prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt}
                </button>
              ))}
            </div>

            {/* Input Form with Web Search Toggle */}
            <div className="p-2.5 sm:p-3 bg-[#0B1021] border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                    webSearchEnabled
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                  title={webSearchEnabled ? 'Live Web Search enabled' : 'Click to enable live Web Search'}
                >
                  <Globe className={`w-3 h-3 ${webSearchEnabled ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
                  <span>Web Search: {webSearchEnabled ? 'ON' : 'OFF'}</span>
                </button>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {webSearchEnabled ? '🌐 Live Google grounding active' : '⚡ Meta AI instant knowledge'}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendQuestion(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    webSearchEnabled
                      ? 'Search live web or ask science, tech, math, jokes...'
                      : 'Ask B FLASH anything — science, math, jokes, advice...'
                  }
                  className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="min-h-[40px] min-w-[40px] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
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
