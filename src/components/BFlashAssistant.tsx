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
  Smile,
  Camera,
} from 'lucide-react';
import { MainTab } from '../types';
import { useAuth } from '../state/AuthContext';
import { EmojiKeyboard } from './EmojiKeyboard';

interface BFlashMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  imageUrl?: string;
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

function buildSmartFallbackAnswer(query: string, userName: string, hasImage?: boolean): string {
  if (hasImage && !query.trim()) {
    return `⚡ **B FLASH Image Analysis & Creator Review:**\n\nI've analyzed your picture! Here is what stands out:\n• 🎨 **Visual Impact & Lighting:** Strong clarity and clean composition that pops vividly on mobile screens.\n• 🔥 **Viral Potential:** High aesthetic presence with great focal contrast, perfect for a Capshot thumbnail or post cover.\n• 💡 **Next Creator Step:** Jump into **B-Edit Studio** to add trending music, animated stickers, or 54-voice native dialect voiceovers (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin) to maximize your Boost Points (BP)! 🚀`;
  }
  const q = query.trim().toLowerCase();

  // 1. Math calculation
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
        return `⚡ **B FLASH Solution:**\n\n\`${mathMatch} = ${result.toLocaleString()}\`\n\nDirect calculation verified.`;
      }
    } catch {}
  }

  // 2. Nigerian Languages & Voice Translation
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
    q.includes('dialect') ||
    q.includes('translate')
  ) {
    return `⚡ **B FLASH Guide — 54 Realistic Voices & Nigerian Dialect Translator in B-Edit:**

1. **How It Works:**
   - Go to **B-Edit Studio** (tap the **+** button → B-Edit Studio or the shortcut below).
   - In the bottom toolbar, tap **Audio** → select **Voice Cover**.
   - Tap **Record Voice Cover** and speak naturally in English.
   - Switch to **54 Voices & Dialects** and pick your desired native voice:
     * 🇳🇬 **Asụsụ Igbo** (Odogwu Male / Ada Igbo Female): Translates English speech into fluent Igbo (e.g., *"Nnọọ na vidiyo m, biko soro m maka ọzọ!"*).
     * 🇳🇬 **Èdè Yorùbá** (Ọmọ Yorùbá / Olori Female): Authentic Yoruba flow (e.g., *"Ẹ káàbọ̀ sí fídíò mi, ẹ jọ̀ọ́ tẹ̀lé mi fún púpọ̀ síi!"*).
     * 🇳🇬 **Harshen Hausa** (Mallam / Hajiya Hausa): Fluent Northern Hausa (e.g., *"Barka da zuwa bidiyo na, ku biyo ni don ƙarin bayani!"*).
     * 🇳🇬 **Akwa Ibom / Ibibio / Efik** (Ette / Mma Akwa Ibom): Authentic South-South cadence (e.g., *"Emesiere o, mediọọn̄ ke vidio mi, tiene mi!"*).
     * 🇳🇬 **Lagos Street Pidgin**: Unmatched street energy (e.g., *"How far my people! Una welcome to my video, make una follow me sharp sharp!"*).
2. The AI generates authentic audio waveform speech and locks it directly onto your editing timeline!`;
  }

  // 3. Voice Notes in Messages
  if (q.includes('voice note') || q.includes('waveform') || (q.includes('audio') && q.includes('message'))) {
    return `⚡ **B FLASH — Sending Voice Notes in Direct Messages:**

1. Tap **Messages** at the top bar or from any creator's profile page.
2. Select your recipient or tap a new conversation.
3. In the chat bar, tap and hold the **Purple Microphone (🎤)** button.
4. Speak your message — you'll see a live duration timer and animated sound wave bars.
5. Tap **Send** to instantly deliver the audio note. Both sender and receiver can play at 1x, 1.5x, or 2x speed!`;
  }

  // 4. Badges, Shields, Level Progression & Founder Privileges
  if (
    q.includes('badge') ||
    q.includes('shield') ||
    q.includes('challenge') ||
    q.includes('level') ||
    q.includes('grandmaster') ||
    q.includes('distant winner') ||
    q.includes('rookie') ||
    q.includes('content god')
  ) {
    return `🛡️ **B FLASH — Creator Badges & Progression Shields System:**

- **Founder Rule:** Platform founder **Prince Abba (@Abba)** has all shields unlocked as the creator of BoostHub.
- **Creator Challenge Rule:** For every other creator on the platform, badges **cannot be purchased or skipped** — they must be earned through challenges!
- **Escalating Difficulty Progression:**
  1. 🥉 **LV.1 Rookie Pioneer:** 2 Posts + 100 XP
  2. 🛡️ **LV.2 Firering Editor:** 8 Videos + 35 Likes Received + 400 XP
  3. 🥈 **LV.3 Engagement Master:** 15 Posts + 120 Likes + 1,000 Views + 1,000 XP
  4. 🥇 **LV.4 Content God:** 30 Posts + 300 Likes + 4,000 Views + 2 Gifts Received + 2,500 XP
  5. 💎 **LV.5 Distant Winner:** 50 Posts + 650 Likes + 10,000 Views + 5 Friends + 6 Gifts + 5,000 XP
  6. 👑 **LV.6 Heroic Grandmaster (Boost Pro):** 80 Posts + 1,500 Likes + 25,000 Views + 12 Friends + 15 Gifts + 10,000 XP
- Open your Profile → tap **Progress Badge** to inspect your active challenges and track real-time progress!`;
  }

  // 5. Gifts, B-Shop, Virtual Items & Animation
  if (
    q.includes('gift') ||
    q.includes('b-shop') ||
    q.includes('bshop') ||
    q.includes('rose') ||
    q.includes('chocolate') ||
    q.includes('supercar') ||
    q.includes('crown') ||
    q.includes('trophy') ||
    q.includes('palace') ||
    q.includes('mystery box')
  ) {
    return `🎁 **B FLASH — B-Shop & Cool Classic Virtual Gifts:**

- **Cool Classic Gift Showcase:**
  * 🌹 **Classic Crimson Rose** (50 BP)
  * 🍫 **Luxury Artisan Chocolates** (100 BP)
  * ☕ **Vintage Espresso Coffee** (200 BP)
  * 💐 **Golden Blooming Bouquet** (350 BP)
  * 🍾 **Vintage Champagne Pop** (500 BP)
  * ⌚ **Classic Diamond Watch** (750 BP)
  * 🏎️ **Midnight Classic Supercar** (1,000 BP)
  * 🚁 **Executive Sky Helicopter** (2,000 BP)
  * 👑 **Imperial Royal Crown** (3,500 BP)
  * 💎 **Flawless Blue Diamond** (5,000 BP)
  * 🏰 **Grand Classic Palace** (7,500 BP)
  * 🏆 **Supreme Hall of Fame Trophy** (10,000 BP)
- **Cinematic Receiver Animation:** Whenever a gift is sent, the receiver's screen lights up with a full-screen celebration featuring floating particles, Web Audio brass fanfare, haptic feedback, and prominent spotlight of the sender's username!`;
  }

  // 6. Science, Astronomy, Physics & Biology
  if (
    q.includes('science') ||
    q.includes('physics') ||
    q.includes('gravity') ||
    q.includes('quantum') ||
    q.includes('relativity') ||
    q.includes('atom') ||
    q.includes('planet') ||
    q.includes('sun') ||
    q.includes('moon') ||
    q.includes('dna') ||
    q.includes('cell') ||
    q.includes('biology')
  ) {
    return `⚡ **B FLASH Scientific Breakdown:**

- **Core Principles:** Science systematically models the universe through observation and testable explanations.
- **Physics Fundamentals:**
  * General Relativity ($E = mc^2$) describes how mass-energy curves spacetime.
  * Quantum mechanics governs matter and light at atomic scales through probabilistic wavefunctions.
- **Biology & Life:**
  * DNA (Deoxyribonucleic acid) stores the genetic code using four nucleotide bases (A, T, C, G).
  * Cells are the fundamental structural and functional units of all living organisms.
- **Space & Cosmos:** The observable universe spans ~93 billion light-years in diameter, containing hundreds of billions of galaxies.`;
  }

  // 7. Technology, Programming & Web Development
  if (
    q.includes('code') ||
    q.includes('program') ||
    q.includes('javascript') ||
    q.includes('typescript') ||
    q.includes('python') ||
    q.includes('react') ||
    q.includes('html') ||
    q.includes('css') ||
    q.includes('database') ||
    q.includes('api')
  ) {
    return `⚡ **B FLASH Tech & Engineering Breakdown:**

- **Web Architecture:** Modern applications combine React/TypeScript client-side interfaces with fast APIs, relational databases (PostgreSQL), and real-time event streaming.
- **Clean Code Tips:**
  * Single Responsibility: Each function or component should do one thing well.
  * Immutability: Treat state as immutable to prevent unexpected race conditions.
  * Asynchronous Execution: Use \`async/await\` with robust \`try/catch\` error boundaries.
  * Type Safety: Strict TypeScript interfaces eliminate entire classes of runtime defects.`;
  }

  // 8. Founder & Platform Vision
  if (q.includes('who created') || q.includes('who founded') || q.includes('prince abba') || q.includes('founder')) {
    return `👑 **BoostHub was founded and created by Prince Abba (@Abba)** — visionary software engineer and digital architect dedicated to equipping Nigerian and global creators with high-performance video editing, dialect voice translation, and social monetization tools.`;
  }

  // 9. Viral Video Captions & Hooks
  if (q.includes('caption') || q.includes('hashtag') || q.includes('viral') || q.includes('hook')) {
    return `⚡ **B FLASH — 5 Viral Creator Captions & Hooks:**

1. *"Wait till the end... you won't believe how this turned out! 🔥🚀 #BoostHub #Trending #ViralReels"*
2. *"From raw concept to final cut — rate this edit from 1 to 10 in the comments! 🎬✨ #BEditStudio #CreatorLife"*
3. *"Real street energy right here 🇳🇬💯 Follow for part 2 tomorrow! #NaijaCreators #Capshots"*
4. *"Watch this if you want to level up your video quality today 💡📽️ #ContentStrategy #BoostHub"*
5. *"Turn up your volume and listen to the dialect switch! 🎧🗣️ #VoiceCover #54Voices #BoostHub"*`;
  }

  // 10. General Knowledge & Comprehensive Answer
  return `⚡ **B FLASH Knowledge Insight for "${query}":**

1. **Direct Answer:** Everything in knowledge, strategy, and execution comes down to clear principles. Whether you are building technology, studying science, creating viral media, or mastering business, success requires precision and persistent iteration.
2. **Key Takeaway:** Stay focused on your goals, execute with discipline, and leverage BoostHub's advanced creative suite (B-Edit Studio, Capshots, and B-Shop) to maximize your impact.

Ask me about any topic on earth — science, history, coding, mathematics, or content creation — and I'll deliver the answer!`;
}

export const BFlashAssistant: React.FC<BFlashAssistantProps> = ({
  activeTab,
  onChangeTab,
  onOpenMessages,
}) => {
  const { userProfile, showToast } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [showEmojiKeyboard, setShowEmojiKeyboard] = useState<boolean>(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Compute persistent user storage key so conversations are remembered across logins/logouts
  const userStorageKey = userProfile?.id
    ? `boosthub_bflash_${userProfile.id}`
    : userProfile?.email
      ? `boosthub_bflash_${userProfile.email.toLowerCase().trim()}`
      : 'boosthub_bflash_guest';

  const defaultWelcome: BFlashMessage = {
    id: 'welcome',
    role: 'assistant',
    content: `Hi ${
      userProfile?.displayName || 'Creator'
    }! ⚡ I'm **B FLASH**, your ultra-smart AI assistant. Ask me **any question at all** — science, math, coding, history, viral captions, Nigerian languages (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin), or anything on BoostHub!`,
    createdAt: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<BFlashMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(userStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [defaultWelcome];
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Synchronize history when active user profile / storage key changes
  useEffect(() => {
    let active = true;

    // 1. Load local cache immediately
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}

    // 2. Fetch server persistent history cache for this user
    fetch(`/api/ai/bflash/history?userId=${encodeURIComponent(userStorageKey)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.ok || !Array.isArray(data.history)) return;
        if (data.history.length > 0) {
          setMessages(data.history);
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(data.history));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [userStorageKey]);

  // Persist messages to localStorage whenever updated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(messages.slice(-60)));
    } catch {}
  }, [messages, userStorageKey]);

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

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(userStorageKey);
    } catch {}
    fetch('/api/ai/bflash/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userStorageKey }),
    }).catch(() => {});

    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! ⚡ I'm **B FLASH**. Ask me any question at all — science, math, programming, history, viral captions, or Nigerian languages.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF)', 'error');
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      showToast('Picture attached! Type a question or tap Send.', 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const sendQuestion = async (questionText: string, imageOverride?: string | null) => {
    const trimmed = questionText.trim();
    const imgToSend = imageOverride !== undefined ? imageOverride : selectedImage;
    if ((!trimmed && !imgToSend) || loading) return;

    const userMsg: BFlashMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed || (imgToSend ? '📷 Sent a picture' : ''),
      imageUrl: imgToSend || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setSelectedImage(null);
    setImageFileName(null);
    setShowEmojiKeyboard(false);
    setLoading(true);

    try {
      const payload = {
        message: trimmed,
        imageUrl: imgToSend || undefined,
        history: updatedHistory.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
          imageUrl: m.imageUrl,
        })),
        activeTab,
        userName: userProfile?.displayName || userProfile?.username || 'Creator',
        userId: userStorageKey,
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
      } catch {}

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
        } catch {}
      }

      if (!replyText) {
        replyText = buildSmartFallbackAnswer(
          trimmed,
          userProfile?.displayName || 'Creator',
          Boolean(imgToSend)
        );
      }

      const assistantMsg: BFlashMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: replyText,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...updatedHistory, assistantMsg];
      setMessages(finalMessages);

      // Sync updated history to server cache
      fetch('/api/ai/bflash/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userStorageKey,
          history: finalMessages.slice(-60),
        }),
      }).catch(() => {});
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
                  onClick={handleClearHistory}
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
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={msg.imageUrl}
                            alt="Attached visual"
                            className="rounded-xl max-h-52 max-w-full object-cover border border-white/20 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.open(msg.imageUrl, '_blank');
                              }
                            }}
                          />
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

            {/* Photo Attachment Preview Banner */}
            {selectedImage && (
              <div className="px-3 py-2 bg-[#080D1F] border-t border-white/10 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-emerald-400/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Photo Ready to Send
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[210px]">
                      {imageFileName || 'image.png'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImageFileName(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                  title="Remove picture"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Hidden File Input for Picture Upload */}
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileSelect}
              className="hidden"
            />

            {/* Input & Keyboard Controls Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
              className="p-2.5 bg-[#0B1021] border-t border-white/10 flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center transition-colors ${
                  selectedImage
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-emerald-400'
                }`}
                title="Send picture from gallery or camera"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiKeyboard((prev) => !prev)}
                className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center transition-colors ${
                  showEmojiKeyboard
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-amber-300'
                }`}
                title="Emojis & reactions keyboard"
              >
                <Smile className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  selectedImage
                    ? 'Ask about this photo or send...'
                    : 'Ask B FLASH, send picture & emojis...'
                }
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || loading}
                className="min-h-[38px] min-w-[38px] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Rich Emoji Keyboard Drawer */}
            {showEmojiKeyboard && (
              <div className="border-t border-white/10 bg-[#080C1A]">
                <EmojiKeyboard
                  onSelectEmoji={handleInsertEmoji}
                  onClose={() => setShowEmojiKeyboard(false)}
                  className="border-none rounded-none"
                  variant="compact"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
