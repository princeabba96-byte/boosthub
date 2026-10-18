import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, CheckCircle2, ArrowUpRight, Send, Package, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BShopCatalogItem } from '../data/bshopCatalog';
import {
  GIFT_TIER_CONFIGS,
  GiftTier,
  resolveGiftAssetUrl,
} from '../data/giftTiers';

export interface SendGiftFlowOverlayProps {
  item: BShopCatalogItem;
  quantity: number;
  recipientName: string;
  recipientUsername?: string;
  recipientAvatar?: string;
  isSelfGift?: boolean;
  onComplete: () => void;
}

type SendStep = 'packing' | 'sealing' | 'swooshing' | 'delivered';

export const SendGiftFlowOverlay: React.FC<SendGiftFlowOverlayProps> = ({
  item,
  quantity,
  recipientName,
  recipientUsername,
  recipientAvatar,
  isSelfGift,
  onComplete,
}) => {
  const [step, setStep] = useState<SendStep>('packing');
  const audioContextRef = useRef<AudioContext | null>(null);

  const tier: GiftTier = item.tier || 'Random';
  const tierConfig = GIFT_TIER_CONFIGS[tier];

  const resolvedItemIcon = resolveGiftAssetUrl(item?.iconPng);
  const resolvedBoxIcon = resolveGiftAssetUrl(tierConfig?.boxIconPng);

  const handleGiftImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;
    if (currentSrc.includes('/assets/gifts/') && !currentSrc.includes('/gh-bundle/')) {
      target.src = currentSrc.replace('/assets/gifts/', '/gh-bundle/assets/gifts/');
    }
  };

  // Synthesize Web Audio sound effects for packing, snap seal, and whoosh
  const playSwooshAudio = (type: 'pack' | 'seal' | 'swoosh' | 'delivered') => {
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
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (type === 'pack') {
        // Shimmer rising chime
        [320, 480, 640].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.18, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.36);
        });
      } else if (type === 'seal') {
        // Satisfying mechanical/magic click & clasp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'swoosh') {
        // High-velocity Doppler swoosh with rising then descending noise sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.6);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (type === 'delivered') {
        // Triumphant chord
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + i * 0.05);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.55);
        });
      }
    } catch {}
  };

  useEffect(() => {
    // 1. Start packing animation
    playSwooshAudio('pack');

    // 2. Transition to sealing gift into box
    const sealTimer = setTimeout(() => {
      setStep('sealing');
      playSwooshAudio('seal');
    }, 1100);

    // 3. Transition to swoosh away
    const swooshTimer = setTimeout(() => {
      setStep('swooshing');
      playSwooshAudio('swoosh');
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: 0.5, y: 0.6 },
          colors: [tierConfig.accentColor, '#FFFFFF', '#FACC15'],
        });
      } catch {}
    }, 2100);

    // 4. Transition to delivered stage
    const deliveredTimer = setTimeout(() => {
      setStep('delivered');
      playSwooshAudio('delivered');
      try {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#10B981', '#34D399', '#FACC15', '#FFFFFF'],
        });
      } catch {}
    }, 3100);

    // 5. Complete and return control
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(sealTimer);
      clearTimeout(swooshTimer);
      clearTimeout(deliveredTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      {/* Background glow and sparkles */}
      <div
        style={{ backgroundColor: tierConfig.glowColor }}
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-40 pointer-events-none"
      />

      <div className="relative w-full max-w-sm sm:max-w-md text-center flex flex-col items-center justify-center space-y-6">
        {/* Recipient Header Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 shadow-xl backdrop-blur-sm">
          {recipientAvatar ? (
            <img
              src={recipientAvatar}
              alt={recipientName}
              className="w-6 h-6 rounded-full object-cover border border-amber-400"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {recipientName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-bold text-white">
            {isSelfGift ? 'Gifting to Yourself' : `Sending Gift to ${recipientName}`}
          </span>
          {recipientUsername && (
            <span className="text-[11px] text-slate-400">@{recipientUsername}</span>
          )}
        </div>

        {/* Tier and Box Type Badge */}
        <div
          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${tierConfig.badgeClass}`}
        >
          {tierConfig.label} · {tierConfig.boxName}
        </div>

        {/* ======================================================== */}
        {/* ANIMATION STAGE: GIFT DESCENDING INTO BOX & SWOOSH AWAY */}
        {/* ======================================================== */}
        <div className="relative w-72 h-72 flex items-center justify-center overflow-visible">
          {/* Speed / Trail streaks during swoosh */}
          {step === 'swooshing' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-1 bg-gradient-to-r from-transparent via-white to-transparent rotate-[-35deg] animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rotate-[-30deg] translate-y-6 opacity-75" />
            </div>
          )}

          {/* GIFT ICON (Descends into box during packing -> disappears into box on sealing) */}
          {(step === 'packing' || step === 'sealing') && (
            <div
              className={`absolute z-20 flex flex-col items-center transition-all duration-700 ease-in-out ${
                step === 'packing'
                  ? 'top-4 scale-100 opacity-100'
                  : 'top-24 scale-75 opacity-0'
              }`}
            >
              <div className="relative w-24 h-24 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <img
                  src={resolvedItemIcon}
                  onError={handleGiftImgError}
                  alt={item.name}
                  className="w-20 h-20 object-contain filter drop-shadow-md animate-bounce"
                  style={{ animationDuration: '2s' }}
                />
                {quantity > 1 && (
                  <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                    ×{quantity}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-white mt-1 drop-shadow-sm">
                {item.name}
              </span>
            </div>
          )}

          {/* GIFT BOX (Receives gift, seals, and swooshes away) */}
          <div
            className={`relative z-10 w-44 h-44 flex items-center justify-center transition-all duration-700 ${
              step === 'packing'
                ? 'translate-y-12 scale-95 opacity-90'
                : step === 'sealing'
                  ? 'translate-y-6 scale-105 opacity-100 rotate-1'
                  : step === 'swooshing'
                    ? 'translate-x-[360px] -translate-y-[360px] scale-50 rotate-[-25deg] opacity-0 transition-all duration-600 ease-in'
                    : 'scale-0 opacity-0'
            }`}
          >
            {/* Box Glow */}
            <div
              style={{ backgroundColor: tierConfig.glowColor }}
              className="absolute inset-0 rounded-full blur-2xl opacity-60 pointer-events-none"
            />

            <img
              src={resolvedBoxIcon}
              onError={handleGiftImgError}
              alt={tierConfig.boxName}
              className="relative w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] select-none"
            />

            {/* Glowing Lock / Ribbon Knot when sealed */}
            {step === 'sealing' && (
              <div className="absolute inset-0 flex items-center justify-center animate-ping pointer-events-none">
                <div
                  style={{ backgroundColor: tierConfig.accentColor }}
                  className="w-12 h-12 rounded-full opacity-60 blur-sm"
                />
              </div>
            )}
          </div>

          {/* DELIVERED CHECKMARK STAGE */}
          {step === 'delivered' && (
            <div className="relative z-30 flex flex-col items-center justify-center space-y-3 animate-scale-up">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  {isSelfGift ? 'Gift Delivered to You!' : 'Gift Dispatched!'}
                </h3>
                <p className="text-xs text-emerald-300 font-medium">
                  {isSelfGift
                    ? 'Ready to open your gift box now!'
                    : `Swooshed away to @${recipientUsername || recipientName}!`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Text & Progress Indicators */}
        <div className="space-y-2">
          <p className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
            {step === 'packing' && (
              <>
                <Package className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Packing {item.name} into {tierConfig.boxName}...</span>
              </>
            )}
            {step === 'sealing' && (
              <>
                <Lock className="w-4 h-4 text-pink-400 animate-pulse" />
                <span>Sealing {tierConfig.boxName}...</span>
              </>
            )}
            {step === 'swooshing' && (
              <>
                <ArrowUpRight className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span>Swooshing Away to Recipient!</span>
              </>
            )}
            {step === 'delivered' && (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Successfully Sent!</span>
              </>
            )}
          </p>

          <div className="flex items-center justify-center gap-2">
            {(['packing', 'sealing', 'swooshing', 'delivered'] as SendStep[]).map((s, idx) => {
              const activeIdx = ['packing', 'sealing', 'swooshing', 'delivered'].indexOf(step);
              return (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= activeIdx
                      ? 'w-8 bg-gradient-to-r from-blue-500 to-emerald-400'
                      : 'w-2 bg-white/20'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Quick Close Button */}
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-semibold text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer pt-2"
        >
          {step === 'delivered' ? 'Done' : 'Skip Animation'}
        </button>
      </div>
    </div>
  );
};
