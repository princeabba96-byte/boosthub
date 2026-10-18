import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  X,
  MessageCircle,
  PackageOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BShopCatalogItem,
  getBShopItemByCode,
  OFFICIAL_20_GIFTS,
} from '../data/bshopCatalog';
import {
  GIFT_TIER_CONFIGS,
  GiftBoxType,
  GiftTier,
  UnboxAnimationType,
} from '../data/giftTiers';
import { getGiftImageUrl } from '../data/giftImagesData';

export interface GiftCelebrationPayload {
  id: string;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  senderId?: string;
  receiverName: string;
  itemCode: string;
  quantity: number;
  message?: string;
  badgeUnlocked?: string;
  isSelfGift?: boolean;
}

interface GiftCelebrationOverlayProps {
  celebration: GiftCelebrationPayload | null;
  onDismiss: () => void;
  onOpenChatWithSender?: (senderId: string) => void;
}

type UnboxPhase = 'box_pulsing' | 'unboxing_anim' | 'gift_reveal';

export const GiftCelebrationOverlay: React.FC<GiftCelebrationOverlayProps> = ({
  celebration,
  onDismiss,
  onOpenChatWithSender,
}) => {
  const [phase, setPhase] = useState<UnboxPhase>('box_pulsing');
  const [ambientParticles, setAmbientParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([]);
  const [animProgress, setAnimProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Determine item and tier config
  const item: BShopCatalogItem =
    (celebration && getBShopItemByCode(celebration.itemCode)) ||
    OFFICIAL_20_GIFTS[0];

  const tier: GiftTier = item.tier || 'Random';
  const tierConfig = GIFT_TIER_CONFIGS[tier];
  const boxType: GiftBoxType = tierConfig.boxName;
  const unboxAnim: UnboxAnimationType = tierConfig.unboxAnimation;

  // Calculate bonus Boost Points reward to display
  const rewardBp = Math.max(10, Math.round(item.costBp * 0.5 * (celebration?.quantity || 1)));

  // Web Audio Synthesizer for tier-specific unboxing sound effects
  const playTierSound = (animType: UnboxAnimationType) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (animType === 'bounce_pop') {
        // Playful spring boing + pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (animType === 'hearts_explode') {
        // Warm romantic harmony chord
        const freqs = [330, 415, 523, 659];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);
          gain.gain.setValueAtTime(0.2, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + 0.7);
        });
      } else if (animType === 'magnetic_snap_gold_beam') {
        // Magnetic snap click + resonant brass beam
        const snap = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snap.type = 'square';
        snap.frequency.setValueAtTime(1400, now);
        snap.frequency.exponentialRampToValueAtTime(180, now + 0.06);
        snapGain.gain.setValueAtTime(0.4, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        snap.connect(snapGain);
        snapGain.connect(ctx.destination);
        snap.start(now);
        snap.stop(now + 0.09);

        // Gold beam fanfare
        [440, 554, 659, 880].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + 0.08 + i * 0.06);
          g.gain.setValueAtTime(0.25, now + 0.08 + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + 0.08 + i * 0.06);
          osc.stop(now + 0.95);
        });
      } else if (animType === 'nebula_smoke') {
        // Deep cosmic whoosh + resonant fifths
        const freqs = [196, 293, 392, 587, 880];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          g.gain.setValueAtTime(0.28, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + 1.25);
        });
      } else if (animType === 'void_shatter') {
        // Ominous sub-bass + shattering resonance
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(90, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.4);
        subGain.gain.setValueAtTime(0.5, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.85);

        // High frequency glass shards
        [1600, 2400, 3100, 4200].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.setValueAtTime(f, now + 0.15 + i * 0.03);
          g.gain.setValueAtTime(0.18, now + 0.15 + i * 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + 0.15 + i * 0.03);
          o.stop(now + 0.55);
        });
      } else {
        // Grand Tier: slow-mo god rays orchestral fanfare
        const chords = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
        chords.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0.22, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + 1.85);
        });
      }
    } catch {}
  };

  // Reset to initial pulsing box whenever a new celebration payload is received
  useEffect(() => {
    if (!celebration) return;
    setPhase('box_pulsing');
    setAnimProgress(0);

    // Setup ambient background floating sparkles
    const p = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 4 + Math.floor(Math.random() * 8),
      delay: Math.random() * 2,
    }));
    setAmbientParticles(p);
  }, [celebration]);

  // Handle Box Tap -> Trigger Unbox Animation -> Transition to Gift Reveal
  const handleOpenGiftBox = () => {
    if (phase !== 'box_pulsing') return;
    setPhase('unboxing_anim');
    playTierSound(unboxAnim);

    // Haptic feedback
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 40, 120, 60, 200]);
      }
    } catch {}

    // Run tier-specific confetti/particle explosion
    if (unboxAnim === 'hearts_explode') {
      try {
        confetti({
          particleCount: 80,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#F43F5E', '#FB7185', '#FDA4AF', '#FFF1F2'],
        });
      } catch {}
    } else if (unboxAnim === 'magnetic_snap_gold_beam') {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#F59E0B', '#FCD34D', '#FFFBEB', '#D97706'],
        });
      } catch {}
    } else if (unboxAnim === 'nebula_smoke') {
      try {
        confetti({
          particleCount: 120,
          spread: 140,
          origin: { y: 0.5 },
          colors: ['#A855F7', '#C084FC', '#06B6D4', '#67E8F9'],
        });
      } catch {}
    } else if (unboxAnim === 'void_shatter') {
      try {
        confetti({
          particleCount: 140,
          spread: 160,
          origin: { y: 0.5 },
          colors: ['#D946EF', '#86198F', '#4A044E', '#FDF4FF'],
        });
      } catch {}
    } else if (unboxAnim === 'slow_mo_god_rays') {
      try {
        confetti({
          particleCount: 180,
          spread: 360,
          origin: { y: 0.45 },
          colors: ['#FACC15', '#FEF08A', '#F59E0B', '#FFFFFF'],
        });
      } catch {}
    } else {
      // bounce_pop
      try {
        confetti({
          particleCount: 70,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#EC4899', '#F472B6', '#38BDF8', '#FDE047'],
        });
      } catch {}
    }

    // Progress animation timeline
    const duration = unboxAnim === 'slow_mo_god_rays' ? 2200 : 1500;
    const interval = 50;
    let elapsed = 0;
    const t = setInterval(() => {
      elapsed += interval;
      setAnimProgress(Math.min(1, elapsed / duration));
      if (elapsed >= duration) {
        clearInterval(t);
        setPhase('gift_reveal');
      }
    }, interval);
  };

  if (!celebration) return null;

  const isSelf =
    celebration.isSelfGift ||
    celebration.senderId === celebration.receiverName ||
    celebration.senderName === 'Myself' ||
    celebration.senderName === 'You';

  const cleanSenderHandle = celebration.senderUsername
    ? `@${celebration.senderUsername.replace(/^@/, '')}`
    : celebration.senderName
      ? celebration.senderName.startsWith('@')
        ? celebration.senderName
        : `@${celebration.senderName}`
      : '@A Supporter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in pointer-events-auto select-none">
      {/* Ambient Floating Sparkles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {ambientParticles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              backgroundColor: tierConfig.accentColor,
            }}
            className="absolute rounded-full animate-ping opacity-40 blur-[1px]"
          />
        ))}
      </div>

      {/* ========================================================= */}
      {/* STAGE 1: CENTER SCREEN PULSING GIFT BOX ("Open Gift Box") */}
      {/* ========================================================= */}
      {phase === 'box_pulsing' && (
        <div className="relative w-full max-w-sm sm:max-w-md text-center flex flex-col items-center justify-center space-y-6 animate-scale-up">
          {/* Top Close Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute -top-10 right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sender Spotlight Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-xl backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {isSelf ? '🎁 Personal Gift Unbox' : `🎁 Gift from ${cleanSenderHandle}`}
            </span>
          </div>

          {/* Tier Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${tierConfig.badgeClass}`}>
            {tierConfig.label} · {boxType}
          </div>

          {/* Centered Pulsing 3D Gift Box */}
          <div
            onClick={handleOpenGiftBox}
            className="relative cursor-pointer group py-4 transition-transform duration-300 active:scale-95"
          >
            {/* Pulsing Aura Rings behind box */}
            <div
              style={{ backgroundColor: tierConfig.glowColor }}
              className="absolute inset-0 rounded-full blur-3xl opacity-70 animate-pulse pointer-events-none"
            />
            <div
              style={{ borderColor: tierConfig.accentColor }}
              className="absolute -inset-4 rounded-full border-2 border-dashed opacity-40 animate-[spin_12s_linear_infinite] pointer-events-none"
            />

            {/* 3D Box Transparent PNG Icon */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center transform group-hover:scale-108 transition-all duration-300 drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]">
              <img
                src={tierConfig.boxIconPng}
                alt={boxType}
                className="w-full h-full object-contain select-none animate-bounce"
                style={{ animationDuration: '2.5s' }}
              />

              {celebration.quantity > 1 && (
                <div className="absolute -top-1 -right-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 border-2 border-white text-white font-black text-sm shadow-xl animate-pulse">
                  ×{celebration.quantity}
                </div>
              )}
            </div>

            {/* Ambient Label underneath box */}
            <p className="text-xs text-slate-300 font-medium mt-2">
              Tap the box to break the seal & unbox!
            </p>
          </div>

          {/* Glowing Pulsing Button: "Open Gift Box" */}
          <button
            type="button"
            onClick={handleOpenGiftBox}
            style={{
              boxShadow: `0 0 35px ${tierConfig.glowColor}`,
              backgroundColor: tierConfig.accentColor,
            }}
            className="w-full py-4 px-6 rounded-2xl text-slate-950 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PackageOpen className="w-5 h-5 text-slate-950 animate-bounce" />
            <span>Open Gift Box</span>
            <Sparkles className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: TIER-SPECIFIC UNBOXING ANIMATION                 */}
      {/* ========================================================= */}
      {phase === 'unboxing_anim' && (
        <div className="relative w-full max-w-sm sm:max-w-md text-center flex flex-col items-center justify-center space-y-4">
          {/* Dynamic visual stage according to unbox animation type */}
          {unboxAnim === 'bounce_pop' && (
            <div className="relative w-64 h-64 flex items-center justify-center animate-[bounce_0.6s_infinite]">
              <div className="absolute inset-0 rounded-full bg-pink-500/40 blur-2xl animate-ping" />
              <img
                src={tierConfig.boxIconPng}
                alt="Box"
                className="w-48 h-48 object-contain transform scale-125 transition-transform"
              />
              <div className="absolute text-5xl animate-spin">💥</div>
            </div>
          )}

          {unboxAnim === 'hearts_explode' && (
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-600/50 blur-3xl animate-ping" />
              <img
                src={tierConfig.boxIconPng}
                alt="Box"
                className="w-44 h-44 object-contain animate-pulse"
              />
              {/* Exploding heart bursts */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <div
                  key={deg}
                  style={{
                    transform: `rotate(${deg}deg) translate(90px) rotate(-${deg}deg)`,
                  }}
                  className="absolute text-3xl animate-ping"
                >
                  💖
                </div>
              ))}
            </div>
          )}

          {unboxAnim === 'magnetic_snap_gold_beam' && (
            <div className="relative w-64 h-80 flex flex-col items-center justify-center overflow-visible">
              {/* Piercing vertical golden light beam shooting up */}
              <div className="absolute -top-40 bottom-0 w-24 bg-gradient-to-t from-amber-400 via-yellow-200 to-transparent blur-md opacity-90 animate-pulse" />
              <div className="absolute -top-40 bottom-0 w-8 bg-white opacity-95 blur-sm" />
              <img
                src={tierConfig.boxIconPng}
                alt="Box"
                className="relative w-44 h-44 object-contain z-10"
              />
              <div className="absolute -bottom-4 text-xs font-black tracking-widest text-amber-300 uppercase">
                ⚡ Magnetic Snap ⚡
              </div>
            </div>
          )}

          {unboxAnim === 'nebula_smoke' && (
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Deep swirling nebula rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/60 via-cyan-500/50 to-indigo-600/60 blur-3xl animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border-4 border-dashed border-cyan-400/80 animate-[spin_6s_linear_infinite]" />
              <img
                src={tierConfig.boxIconPng}
                alt="Box"
                className="relative w-48 h-48 object-contain z-10 animate-pulse"
              />
              <div className="absolute text-4xl animate-spin">🌌</div>
            </div>
          )}

          {unboxAnim === 'void_shatter' && (
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Dark void energy + shattering crystal cracks */}
              <div className="absolute inset-0 rounded-full bg-fuchsia-950/80 border-4 border-fuchsia-500/80 animate-ping blur-sm" />
              <img
                src={tierConfig.boxIconPng}
                alt="Box"
                className="relative w-44 h-44 object-contain filter invert opacity-90 animate-[spin_0.8s_ease-out]"
              />
              {/* Shatter shards */}
              {[-60, -20, 30, 75, 120, 190, 240].map((rot) => (
                <div
                  key={rot}
                  style={{ transform: `rotate(${rot}deg) translateY(-85px)` }}
                  className="absolute w-4 h-12 bg-gradient-to-t from-fuchsia-500 to-white opacity-85 rotate-45"
                />
              ))}
            </div>
          )}

          {unboxAnim === 'slow_mo_god_rays' && (
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Slow-mo rotating celestial god rays */}
              <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-3xl animate-ping" />
              <div className="absolute inset-0 animate-[spin_16s_linear_infinite] opacity-80 pointer-events-none">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    style={{ transform: `rotate(${deg}deg)` }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-gradient-to-b from-yellow-300/60 via-amber-400/30 to-transparent"
                  />
                ))}
              </div>
              <img
                src={tierConfig.boxIconPng}
                alt="Box"
                className="relative w-52 h-52 object-contain z-10 animate-[bounce_1.5s_infinite]"
              />
              <div className="absolute text-5xl animate-pulse">👑</div>
            </div>
          )}

          <div className="space-y-1 text-center">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">
              Unboxing {tierConfig.label.split(' ')[0]} Box...
            </h3>
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              {tierConfig.unboxLabel}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: COOL REVEAL WITH TRANSPARENT PNG & +BP REWARD    */}
      {/* ========================================================= */}
      {phase === 'gift_reveal' && (
        <div
          style={{ borderColor: tierConfig.accentColor }}
          className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#131A33] via-[#0B1021] to-[#060813] border-2 rounded-3xl p-5 sm:p-6 text-center shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden animate-scale-up"
        >
          {/* Radial Aura Glow */}
          <div
            style={{ backgroundColor: tierConfig.glowColor }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-80 animate-pulse"
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer z-10"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Rank Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-black text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="tracking-wider uppercase">
              RANK #{item.rankOrder || 1} · {tier.toUpperCase()} TIER REVEAL
            </span>
          </div>

          {/* Transparent PNG Gift Icon (128x128 high-res showcase) */}
          <div className="relative w-36 h-36 mx-auto mb-2 flex items-center justify-center">
            {/* Spinning Aura */}
            <div
              style={{ borderColor: tierConfig.accentColor }}
              className="absolute inset-0 rounded-full border-2 border-dashed opacity-60 animate-[spin_10s_linear_infinite]"
            />
            <div
              style={{ backgroundColor: tierConfig.glowColor }}
              className="absolute inset-2 rounded-full blur-xl opacity-60"
            />

            {/* Genuine Transparent PNG Icon */}
            <img
              src={item.iconPng || getGiftImageUrl(item.code)}
              alt={item.name}
              className="relative w-28 h-28 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] select-none transform hover:scale-115 transition-transform duration-300"
            />

            {celebration.quantity > 1 && (
              <div className="absolute -top-1 -right-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 border border-white text-white font-black text-xs shadow-lg animate-bounce">
                ×{celebration.quantity}
              </div>
            )}
          </div>

          {/* Gift Title & Description */}
          <div className="space-y-1 mb-3">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>{item.name}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto line-clamp-2">
              {item.description}
            </p>
          </div>

          {/* ==================================================== */}
          {/* PROMINENT "+Boost Points" REWARD BANNER             */}
          {/* ==================================================== */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-500/25 border border-amber-400/60 shadow-lg mb-3 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xl font-black shrink-0">
              🪙
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                GIFT REWARD UNLOCKED
              </span>
              <span className="text-base font-black text-white block">
                +{rewardBp} Boost Points Reward!
              </span>
              <span className="text-[11px] text-amber-200/90 font-medium block">
                +{item.creatorXpBonus * celebration.quantity} Creator XP & Recognition
              </span>
            </div>
          </div>

          {/* Sender Attribution */}
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center gap-2.5 mb-3">
            {celebration.senderAvatar ? (
              <img
                src={celebration.senderAvatar}
                alt="Sender"
                className="w-7 h-7 rounded-full object-cover border border-amber-400 shadow-sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                {isSelf ? 'Y' : 'S'}
              </div>
            )}
            <span className="text-xs text-slate-200">
              {isSelf ? (
                <>Gifted to yourself as a creator reward!</>
              ) : (
                <>
                  Gifted by <strong className="text-amber-300 font-bold">{cleanSenderHandle}</strong>
                </>
              )}
            </span>
          </div>

          {/* Optional sender message */}
          {celebration.message && (
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-amber-100 italic mb-4 max-h-16 overflow-y-auto">
              "{celebration.message}"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isSelf && celebration.senderId && onOpenChatWithSender && (
              <button
                type="button"
                onClick={() => {
                  if (celebration.senderId && onOpenChatWithSender) {
                    onOpenChatWithSender(celebration.senderId);
                  }
                  onDismiss();
                }}
                className="flex-1 py-3 px-3 rounded-2xl bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-400/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Say Thanks</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDismiss}
              style={{
                backgroundColor: tierConfig.accentColor,
              }}
              className="flex-1 py-3 px-4 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer hover:brightness-110"
            >
              Collect Gift ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
