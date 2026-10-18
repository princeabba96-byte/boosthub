import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Target,
  CheckCircle2,
  Sparkles,
  Trophy,
  Zap,
  RefreshCw,
  Gift,
  Flame,
  Award,
  Crown,
  Shield,
  Clock,
  ChevronRight,
  Sparkle,
  Lock,
  Check,
} from 'lucide-react';
import { MissionItem } from '../types';
import { apiFetch, setCachedMissions } from '../services/api';
import { useAuth } from '../state/AuthContext';
import {
  BOOST_LEVELS,
  getBoostLevelForXp,
  getNextBoostLevel,
  getWeeklyResetCountdown,
  BoostLevelDef,
} from '../data/missionsBadges';

interface MissionsPanelProps {
  userId?: string;
  initialMissions?: MissionItem[];
  compact?: boolean;
  onMissionCompleted?: () => void;
  onMissionClaimed?: () => void;
  onClose?: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

const CONFETTI_COLORS = [
  '#2B8CFF',
  '#00E5FF',
  '#A855F7',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#FFFFFF',
];

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
  userId,
  initialMissions,
  compact = false,
  onMissionCompleted,
  onMissionClaimed,
  onClose,
}) => {
  const { userProfile, refreshProfile, showToast, realtimeEvents, setUserProfile } = useAuth();
  const [missions, setMissions] = useState<MissionItem[]>(initialMissions || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'badges'>('daily');
  const [confettiActive, setConfettiActive] = useState<boolean>(false);
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(null);
  const [equippingCode, setEquippingCode] = useState<string | null>(null);

  // Live weekly countdown timer
  const [weeklyTimer, setWeeklyTimer] = useState(() => getWeeklyResetCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setWeeklyTimer(getWeeklyResetCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevCompletedCodesRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  // Calculate current user's Boost Level and progress
  const currentXp = Number(userProfile?.xp || 0);
  const currentLevel = getBoostLevelForXp(currentXp);
  const nextLevel = getNextBoostLevel(currentLevel.level);

  const xpInCurrentLevel = currentXp - currentLevel.minXp;
  const xpNeededForNext = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1000;
  const levelProgressPct = nextLevel
    ? Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNext) * 100)))
    : 100;

  const triggerConfettiAnimation = useCallback((missionTitle?: string) => {
    setConfettiActive(true);
    if (missionTitle) {
      setCelebrationBanner(`🎉 Milestone Completed: ${missionTitle}!`);
      window.setTimeout(() => {
        setCelebrationBanner(null);
      }, 4500);
    }

    window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: ConfettiParticle[] = [];
      const origins = [
        { x: canvas.width * 0.25, y: canvas.height * 0.55 },
        { x: canvas.width * 0.5, y: canvas.height * 0.45 },
        { x: canvas.width * 0.75, y: canvas.height * 0.55 },
      ];

      origins.forEach((origin) => {
        for (let i = 0; i < 55; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
          const speed = 7 + Math.random() * 14;
          particles.push({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            size: 6 + Math.random() * 6,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 14,
            opacity: 1,
            shape: Math.random() > 0.35 ? 'rect' : 'circle',
          });
        }
      });

      const startTime = performance.now();
      const duration = 3200;

      const render = (now: number) => {
        const elapsed = now - startTime;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.32;
          p.vx *= 0.99;
          p.rotation += p.rotationSpeed;
          if (elapsed > duration * 0.65) {
            p.opacity = Math.max(0, 1 - (elapsed - duration * 0.65) / (duration * 0.35));
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        if (elapsed < duration) {
          animFrameRef.current = window.requestAnimationFrame(render);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setConfettiActive(false);
        }
      };

      if (animFrameRef.current) {
        window.cancelAnimationFrame(animFrameRef.current);
      }
      animFrameRef.current = window.requestAnimationFrame(render);
    }, 20);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        window.cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const fetchChallenges = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await apiFetch<{ missions?: MissionItem[] }>('/api/missions');
        const list = Array.isArray(res?.missions) ? res.missions : [];
        setMissions(list);
        setCachedMissions(list);

        const currentCompleted = new Set<string>(
          list.filter((m) => m.completed || m.claimed).map((m) => m.code)
        );

        if (initializedRef.current) {
          for (const item of list) {
            if (
              (item.completed || item.claimed) &&
              !prevCompletedCodesRef.current.has(item.code)
            ) {
              triggerConfettiAnimation(item.title);
              break;
            }
          }
        } else {
          initializedRef.current = true;
        }
        prevCompletedCodesRef.current = currentCompleted;
      } catch {
        // ignore
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [triggerConfettiAnimation]
  );

  useEffect(() => {
    fetchChallenges(false);
  }, [fetchChallenges, userProfile?.id, userId]);

  useEffect(() => {
    if (realtimeEvents.length > 0) {
      fetchChallenges(true);
    }
  }, [realtimeEvents.length, fetchChallenges]);

  const handleCompleteOrClaimMission = async (mission: MissionItem) => {
    if (claimingCode) return;
    setClaimingCode(mission.code);
    try {
      const res = await apiFetch<{ missions?: MissionItem[] }>('/api/missions/claim', {
        method: 'POST',
        body: JSON.stringify({
          code: mission.code,
          xpReward: mission.xpReward,
          boostPointsReward: mission.boostPointsReward,
        }),
      });

      if (Array.isArray(res?.missions)) {
        setMissions(res.missions);
        setCachedMissions(res.missions);
      } else {
        setMissions((prev) =>
          prev.map((m) =>
            m.code === mission.code
              ? { ...m, progress: m.targetCount, completed: true, claimed: true }
              : m
          )
        );
      }

      triggerConfettiAnimation(mission.title);
      await refreshProfile();
      onMissionCompleted?.();
      onMissionClaimed?.();
      showToast(
        `🎉 Milestone Completed! +${mission.xpReward} XP & +${mission.boostPointsReward} BP earned!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Could not claim mission reward.', 'error');
    } finally {
      setClaimingCode(null);
    }
  };

  const handleEquipBadgeOrFrame = async (badgeCode: string, frameCode: string) => {
    if (equippingCode) return;
    setEquippingCode(badgeCode);
    try {
      const isAlreadyEquipped = userProfile?.equippedBadge === badgeCode;
      const targetBadge = isAlreadyEquipped ? '' : badgeCode;
      const targetFrame = isAlreadyEquipped ? '' : frameCode;

      await apiFetch('/api/bshop/settings', {
        method: 'PUT',
        body: JSON.stringify({
          equippedBadge: targetBadge,
          equippedFrame: targetFrame,
        }),
      });

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          equippedBadge: targetBadge,
          equippedFrame: targetFrame,
        });
      }
      await refreshProfile();
      showToast(
        isAlreadyEquipped
          ? 'Unequipped badge and frame.'
          : '🎉 Boost Level Badge & Avatar Frame equipped!',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update equipped badge.', 'error');
    } finally {
      setEquippingCode(null);
    }
  };

  const dailyMissions = missions.filter((m) => m.missionType === 'daily');
  const weeklyMissions = missions.filter((m) => m.missionType === 'weekly');
  const completedDailyCount = dailyMissions.filter((m) => m.completed || m.claimed).length;
  const completedWeeklyCount = weeklyMissions.filter((m) => m.completed || m.claimed).length;

  return (
    <section className="relative bg-[#0E1528] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl overflow-hidden">
      {/* Full-Screen Confetti Canvas Overlay */}
      {confettiActive && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[100] pointer-events-none w-screen h-screen"
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/20"
            style={{ backgroundColor: `${currentLevel.badgeColor}25` }}
          >
            <span>{currentLevel.badgeIcon}</span>
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Missions & Boost Levels</span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                style={{
                  backgroundColor: `${currentLevel.badgeColor}20`,
                  color: currentLevel.badgeColor,
                  borderColor: `${currentLevel.badgeColor}40`,
                }}
              >
                Level {currentLevel.level}: {currentLevel.name}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete daily & weekly creator milestones to level up and unlock exclusive visual badges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-[#070A14] border border-white/10 text-xs font-mono font-semibold text-white tabular-nums flex items-center gap-2">
            <span className="text-cyan-400">
              {currentXp.toLocaleString()} XP
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-purple-400">
              {(userProfile?.boostPoints || 0).toLocaleString()} BP
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchChallenges(false)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Refresh Challenges"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Celebration Banner */}
      {celebrationBanner && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{celebrationBanner}</span>
          </div>
          <span className="text-[11px] text-white/80">Milestone Unlocked ✨</span>
        </div>
      )}

      {/* HERO BOOST LEVEL PROGRESS CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#121B35] via-[#0E162C] to-[#1A1333] border border-white/15 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${currentLevel.frameBorderClass}`}
              style={{ backgroundColor: `${currentLevel.badgeColor}25` }}
            >
              <span>{currentLevel.badgeIcon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  Boost Level {currentLevel.level}: {currentLevel.name}
                </span>
                {userProfile?.equippedBadge === currentLevel.badgeCode && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                    Equipped
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {currentLevel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={equippingCode === currentLevel.badgeCode}
              onClick={() => handleEquipBadgeOrFrame(currentLevel.badgeCode, currentLevel.frameCode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                userProfile?.equippedBadge === currentLevel.badgeCode
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
              }`}
            >
              {userProfile?.equippedBadge === currentLevel.badgeCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Badge Equipped</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>Equip Level Badge</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Level Progress</span>
            </span>
            <span className="font-mono text-cyan-300 font-bold tabular-nums">
              {nextLevel
                ? `${xpInCurrentLevel} / ${xpNeededForNext} XP (${levelProgressPct}%)`
                : 'Max Level Reached! 👑'}
            </span>
          </div>
          <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>

        {/* Current Level Perks Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] font-bold text-slate-400">Level Perks:</span>
          {currentLevel.perks.map((perk, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-200 flex items-center gap-1 font-medium"
            >
              <Sparkle className="w-3 h-3 text-amber-300" />
              <span>{perk}</span>
            </span>
          ))}
        </div>
      </div>

      {/* WEEKLY REFRESH COUNTDOWN BANNER */}
      <div className="p-3.5 rounded-2xl bg-[#090D1A] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
            <Clock className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Weekly Missions Reset Cycle</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                REFRESHES EVERY MONDAY
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Weekly creator challenges refresh weekly at 00:00 UTC with new rewards
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-400/50 text-xs font-mono font-bold text-purple-200 flex items-center gap-2 self-start sm:self-auto">
          <span className="text-purple-400">⏱️ Resets In:</span>
          <span className="tabular-nums text-white">{weeklyTimer.formatted}</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Daily Challenges ({completedDailyCount}/{dailyMissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'weekly'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Weekly Milestones ({completedWeeklyCount}/{weeklyMissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'badges'
              ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Boost Levels & Badges (5 Tiers)</span>
        </button>
      </div>

      {/* TAB 1 & 2: MISSIONS LIST (DAILY / WEEKLY) */}
      {activeTab !== 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(activeTab === 'daily' ? dailyMissions : weeklyMissions).map((m) => {
            const pct = Math.min(100, Math.round((m.progress / Math.max(1, m.targetCount)) * 100));
            const isDone = Boolean(m.completed || m.claimed);
            const isClaimed = Boolean(m.claimed);
            const isBusy = claimingCode === m.code;

            return (
              <div
                key={m.code}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isClaimed
                    ? 'bg-emerald-950/20 border-emerald-500/35'
                    : isDone
                      ? 'bg-blue-950/25 border-cyan-400/50 shadow-lg shadow-blue-600/10'
                      : 'bg-[#090D1C] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          m.missionType === 'daily'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {m.missionType}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {m.title}
                      </h4>
                    </div>

                    <span className="font-mono text-xs font-bold text-slate-300 tabular-nums shrink-0">
                      {m.progress}/{m.targetCount}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {m.description}
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed || isDone
                            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                            : 'bg-gradient-to-r from-cyan-400 to-purple-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-semibold tabular-nums">
                    <span className="text-cyan-400 inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" /> +{m.xpReward} XP
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-purple-300 inline-flex items-center gap-1">
                      <Gift className="w-3 h-3" /> +{m.boostPointsReward} BP
                    </span>
                  </div>

                  {isClaimed ? (
                    <button
                      type="button"
                      onClick={() => triggerConfettiAnimation(m.title)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed 🎉</span>
                    </button>
                  ) : isDone ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCompleteOrClaimMission(m)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all"
                    >
                      <Trophy className="w-3.5 h-3.5 text-slate-950" />
                      <span>{isBusy ? 'Claiming...' : 'Claim Reward 🎉'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCompleteOrClaimMission(m)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'Completing...' : 'Complete & Claim'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: BOOST LEVELS & VISUAL BADGE SHOWCASE */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {BOOST_LEVELS.map((tier) => {
              const isUnlocked = currentXp >= tier.minXp;
              const isCurrent = currentLevel.level === tier.level;
              const isEquipped = userProfile?.equippedBadge === tier.badgeCode;

              return (
                <div
                  key={tier.level}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'bg-gradient-to-b from-[#16203D] to-[#0E1528] border-cyan-400/60 shadow-xl shadow-cyan-950/40'
                      : isUnlocked
                        ? 'bg-[#090D1C] border-white/15'
                        : 'bg-black/30 border-white/5 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
                            isUnlocked ? tier.frameBorderClass : 'border-white/10'
                          }`}
                          style={{
                            backgroundColor: isUnlocked ? `${tier.badgeColor}25` : '#1E293B',
                          }}
                        >
                          {isUnlocked ? <span>{tier.badgeIcon}</span> : <Lock className="w-5 h-5 text-slate-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">
                              Level {tier.level}: {tier.name}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-extrabold">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[10px] font-bold block"
                            style={{ color: tier.badgeColor }}
                          >
                            {tier.badgeName}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {tier.minXp.toLocaleString()} XP
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tier.description}
                    </p>

                    {/* Unlocked Profile Icon Preview */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={tier.profileIconUrl}
                          alt={tier.name}
                          className={`w-10 h-10 rounded-full object-cover border ${tier.frameBorderClass}`}
                        />
                        <span className="absolute -bottom-1 -right-1 text-xs">{tier.badgeIcon}</span>
                      </div>
                      <div className="text-[11px] leading-tight">
                        <span className="block font-bold text-white">
                          {tier.frameName}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Profile Icon & Glowing Avatar Ring
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {isUnlocked ? 'Unlocked ✨' : `Locked (${tier.minXp - currentXp} XP to go)`}
                    </span>

                    {isUnlocked ? (
                      <button
                        type="button"
                        disabled={equippingCode === tier.badgeCode}
                        onClick={() => handleEquipBadgeOrFrame(tier.badgeCode, tier.frameCode)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                          isEquipped
                            ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Equipped</span>
                          </>
                        ) : (
                          <>
                            <Award className="w-3.5 h-3.5" />
                            <span>Equip Icon & Badge</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
