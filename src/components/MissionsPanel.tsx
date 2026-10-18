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
} from 'lucide-react';
import { MissionItem } from '../types';
import { apiFetch, setCachedMissions } from '../services/api';
import { useAuth } from '../state/AuthContext';

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
  const { userProfile, refreshProfile, showToast, realtimeEvents } = useAuth();
  const [missions, setMissions] = useState<MissionItem[]>(
    initialMissions || []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevCompletedCodesRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  const triggerConfettiAnimation = useCallback((missionTitle?: string) => {
    setConfettiActive(true);
    if (missionTitle) {
      setCelebrationBanner(`🎉 Daily Mission Completed: ${missionTitle}!`);
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
            color:
              CONFETTI_COLORS[
                Math.floor(Math.random() * CONFETTI_COLORS.length)
              ],
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
          p.vy += 0.32; // gravity
          p.vx *= 0.99; // air resistance
          p.rotation += p.rotationSpeed;
          if (elapsed > duration * 0.65) {
            p.opacity = Math.max(
              0,
              1 - (elapsed - duration * 0.65) / (duration * 0.35)
            );
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
        const res = await apiFetch<{ missions?: MissionItem[] }>(
          '/api/missions'
        );
        const list = Array.isArray(res?.missions) ? res.missions : [];
        setMissions(list);
        setCachedMissions(list);

        // Check if any daily mission newly completed since initial load
        const currentCompleted = new Set<string>(
          list
            .filter(
              (m) =>
                m.missionType === 'daily' && (m.completed || m.claimed)
            )
            .map((m) => m.code)
        );

        if (initializedRef.current) {
          for (const item of list) {
            if (
              item.missionType === 'daily' &&
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
        // ignore transient error
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [triggerConfettiAnimation]
  );

  useEffect(() => {
    fetchChallenges(false);
  }, [fetchChallenges, userProfile?.id, userId]);

  // Refresh challenges automatically when user likes, comments, watches, or follows
  useEffect(() => {
    if (realtimeEvents.length > 0) {
      fetchChallenges(true);
    }
  }, [realtimeEvents.length, fetchChallenges]);

  const handleCompleteOrClaimMission = async (mission: MissionItem) => {
    if (claimingCode) return;
    setClaimingCode(mission.code);
    try {
      const res = await apiFetch<{ missions?: MissionItem[] }>(
        '/api/missions/claim',
        {
          method: 'POST',
          body: JSON.stringify({
            code: mission.code,
            xpReward: mission.xpReward,
            boostPointsReward: mission.boostPointsReward,
          }),
        }
      );

      if (Array.isArray(res?.missions)) {
        setMissions(res.missions);
        setCachedMissions(res.missions);
        res.missions.forEach((m) => {
          if (m.completed || m.claimed) {
            prevCompletedCodesRef.current.add(m.code);
          }
        });
      } else {
        setMissions((prev) =>
          prev.map((m) =>
            m.code === mission.code
              ? {
                  ...m,
                  progress: m.targetCount,
                  completed: true,
                  claimed: true,
                }
              : m
          )
        );
      }

      triggerConfettiAnimation(mission.title);
      await refreshProfile();
      onMissionCompleted?.();
      onMissionClaimed?.();
      showToast(
        `🎉 Mission Completed! +${mission.xpReward} XP & +${mission.boostPointsReward} Boost Points earned!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Could not claim mission reward.', 'error');
    } finally {
      setClaimingCode(null);
    }
  };

  const dailyMissions = missions.filter((m) => m.missionType === 'daily');
  const weeklyMissions = missions.filter((m) => m.missionType === 'weekly');
  const completedDailyCount = dailyMissions.filter(
    (m) => m.completed || m.claimed
  ).length;
  const totalDailyCount = Math.max(1, dailyMissions.length);
  const overallDailyPct = Math.min(
    100,
    Math.round((completedDailyCount / totalDailyCount) * 100)
  );

  const totalCompletedAll = missions.filter(
    (m) => m.completed || m.claimed
  ).length;
  const overallAllPct =
    missions.length > 0
      ? Math.min(100, Math.round((totalCompletedAll / missions.length) * 100))
      : 0;

  return (
    <section className="relative bg-[#131A2A] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl overflow-hidden">
      {/* Full-Screen Confetti Canvas Overlay */}
      {confettiActive && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[100] pointer-events-none w-screen h-screen"
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2B8CFF]/20 border border-[#2B8CFF]/40 flex items-center justify-center text-[#2B8CFF]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Daily & Platform Challenges</span>
                <span className="px-2 py-0.5 rounded-full bg-[#2B8CFF]/20 border border-[#2B8CFF]/40 text-[#2B8CFF] text-[10px] font-bold">
                  {completedDailyCount}/{dailyMissions.length} Daily Done
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Complete daily missions to earn Creator XP, Boost Points &
                confetti rewards
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs font-mono font-semibold text-white tabular-nums flex items-center gap-2">
            <span className="text-[#2B8CFF]">
              {(userProfile?.xp || 0).toLocaleString()} XP
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-purple-400">
              {userProfile?.email?.trim().toLowerCase() ===
              'princeabba96@gmail.com'
                ? '∞ BP'
                : `${(userProfile?.boostPoints || 0).toLocaleString()} BP`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchChallenges(false)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Refresh Challenges"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin text-[#2B8CFF]' : ''}`}
            />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      {/* Celebration Banner */}
      {celebrationBanner && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-[#2B8CFF]/20 to-purple-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{celebrationBanner}</span>
          </div>
          <span className="text-[11px] text-white/80">Confetti Active ✨</span>
        </div>
      )}

      {/* Overall User Progress Bar */}
      <div className="p-4 rounded-2xl bg-[#0B1220] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Your Daily Mission Progress</span>
          </span>
          <span className="font-mono font-bold text-[#2B8CFF] tabular-nums">
            {overallDailyPct}% Completed ({completedDailyCount}/
            {dailyMissions.length} Daily · {overallAllPct}% Total)
          </span>
        </div>
        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2B8CFF] via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${overallDailyPct}%` }}
          />
        </div>
      </div>

      {/* Missions Grid */}
      {loading && missions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-[#0B1220] border border-white/5 animate-pulse p-4"
            />
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'
          } gap-3`}
        >
          {[...dailyMissions, ...weeklyMissions].map((m) => {
            const pct = Math.min(
              100,
              Math.round((m.progress / Math.max(1, m.targetCount)) * 100)
            );
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
                      ? 'bg-[#2B8CFF]/15 border-[#2B8CFF]/50 shadow-lg shadow-blue-600/10'
                      : 'bg-[#0B1220] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          m.missionType === 'daily'
                            ? 'bg-[#2B8CFF]/20 text-[#2B8CFF] border border-[#2B8CFF]/30'
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

                  {/* Mission Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed || isDone
                            ? 'bg-gradient-to-r from-emerald-400 to-[#2B8CFF]'
                            : 'bg-gradient-to-r from-[#2B8CFF] to-purple-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-semibold tabular-nums">
                    <span className="text-[#2B8CFF] inline-flex items-center gap-1">
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
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#2B8CFF] hover:from-emerald-400 hover:to-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'Claiming...' : 'Claim Reward 🎉'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCompleteOrClaimMission(m)}
                      className="px-3 py-1.5 rounded-xl bg-[#2B8CFF] hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isBusy ? 'Completing...' : 'Complete & Claim'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
