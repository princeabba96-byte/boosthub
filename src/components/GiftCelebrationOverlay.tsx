import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Award, Heart, X, CheckCircle2 } from 'lucide-react';
import { BShopCatalogItem, getBShopItemByCode } from '../data/bshopCatalog';

export interface GiftCelebrationPayload {
  id: string;
  senderName: string;
  receiverName: string;
  itemCode: string;
  quantity: number;
  message?: string;
  badgeUnlocked?: string;
}

interface GiftCelebrationOverlayProps {
  celebration: GiftCelebrationPayload | null;
  onDismiss: () => void;
}

export const GiftCelebrationOverlay: React.FC<GiftCelebrationOverlayProps> = ({
  celebration,
  onDismiss,
}) => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      emoji: string;
      delay: number;
      duration: number;
    }>
  >([]);

  useEffect(() => {
    if (!celebration) return;

    // Play cheerful celebration sound via Web Audio API
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.001, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.12 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.45);
        });
      }
    } catch {}

    // Generate floating celebration particles
    const item = getBShopItemByCode(celebration.itemCode);
    const emojis = [item?.icon || '🎁', '✨', '🎉', '🌟', '💎', '🔥', '👑'];
    const pList = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 20 + Math.floor(Math.random() * 24),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setParticles(pList);

    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);

    return () => clearTimeout(timer);
  }, [celebration, onDismiss]);

  if (!celebration) return null;
  const item = getBShopItemByCode(celebration.itemCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
            className="absolute animate-bounce transition-all opacity-80"
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Main Celebration Card */}
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#141B33] via-[#0E1528] to-[#080B15] border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.35)] overflow-hidden">
        {/* Glowing backdrop spotlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-amber-400/40 via-yellow-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] font-extrabold text-amber-300 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>VIRTUAL GIFT CELEBRATION</span>
        </div>

        {/* Big Animated Icon */}
        <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 to-yellow-300/30 animate-pulse blur-xl" />
          <div className="text-7xl transform hover:scale-110 transition-transform filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
            {item?.icon || '🎁'}
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-white mb-1">
          {item?.name || 'Exclusive Gift'}
          {celebration.quantity > 1 && (
            <span className="text-amber-400 ml-1.5 font-black">
              ×{celebration.quantity}
            </span>
          )}
        </h3>

        <p className="text-xs text-amber-200/90 font-medium mb-3">
          <span className="font-bold text-white">{celebration.senderName}</span> sent this to{' '}
          <span className="font-bold text-white">{celebration.receiverName}</span>!
        </p>

        {celebration.message && (
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 italic mb-4 max-h-20 overflow-y-auto">
            "{celebration.message}"
          </div>
        )}

        {/* Badges Earned / Recognition */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-300">
            {celebration.badgeUnlocked || '+Creator XP & Recognition Granted!'}
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all"
        >
          Magnificent! ✨
        </button>
      </div>
    </div>
  );
};
