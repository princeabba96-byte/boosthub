import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  CheckCircle2,
  Sparkles,
  Zap,
  Gift,
  Flame,
  UserPlus,
  Heart,
  ChevronDown,
  ChevronUp,
  Coins,
  Video,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { Avatar } from './Avatar';
import { apiFetch } from '../services/api';
import { supabase, ADMIN_ABBA_UUID } from '../lib/supabase';
import { formatCompactNumber } from '../utils/format';

interface SuggestedCreator {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  verified: boolean;
  isFollowing: boolean;
  category: string;
}

interface DailyMissionItem {
  id: string;
  title: string;
  description: string;
  type: 'follow' | 'like' | 'watch' | 'create';
  current: number;
  target: number;
  bpReward: number;
  completed: boolean;
  claimed: boolean;
}

interface DailyMissionTrackerProps {
  onSelectUser: (userId: string) => void;
  onNavigateTab: (tab: any) => void;
}

const STORAGE_KEY = 'boosthub_daily_missions_state_v2';

export const DailyMissionTracker: React.FC<DailyMissionTrackerProps> = ({
  onSelectUser,
  onNavigateTab,
}) => {
  const { userProfile, refreshProfile, showToast, realtimeEvents } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  const [suggestedCreators, setSuggestedCreators] = useState<SuggestedCreator[]>([
    {
      id: ADMIN_ABBA_UUID,
      displayName: 'Prince Abba',
      username: 'abba',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verified: true,
      isFollowing: false,
      category: 'Founder & Visionary',
    },
    {
      id: 'creator_amara',
      displayName: 'Amara Nnadi',
      username: 'amara_edits',
      avatarUrl:
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80',
      verified: true,
      isFollowing: false,
      category: 'Igbo & Lifestyle',
    },
    {
      id: 'creator_chidi',
      displayName: 'Chidi Okeke',
      username: 'chidi_tech',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      verified: false,
      isFollowing: false,
      category: 'Tech & Reels',
    },
  ]);

  const [missions, setMissions] = useState<DailyMissionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toDateString();
        if (parsed.date === today && Array.isArray(parsed.missions)) {
          return parsed.missions;
        }
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'mission_follow',
        title: 'Follow 2 Rising Creators',
        description: 'Discover and connect with active creators today',
        type: 'follow',
        current: 0,
        target: 2,
        bpReward: 50,
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_like',
        title: 'Engage with 3 Feed Posts',
        description: 'Drop likes or thoughtful comments on feed videos',
        type: 'like',
        current: 0,
        target: 3,
        bpReward: 30,
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_watch',
        title: 'Watch 3 Capshot Reels',
        description: 'Enjoy vertical video streams with full audio',
        type: 'watch',
        current: 1,
        target: 3,
        bpReward: 35,
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_create',
        title: 'Publish a Post or B-Edit Video',
        description: 'Share a story, photo, or edited clip to the community',
        type: 'create',
        current: 0,
        target: 1,
        bpReward: 100,
        completed: false,
        claimed: false,
      },
    ];
  });

  // Save to localStorage whenever missions change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: new Date().toDateString(),
          missions,
        })
      );
    } catch {
      // ignore
    }
  }, [missions]);

  // Update missions based on realtime events (like, follow, post)
  useEffect(() => {
    if (realtimeEvents.length === 0) return;
    const latest = realtimeEvents[realtimeEvents.length - 1];

    if (latest.type === 'post_like') {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.type === 'like' && !m.completed) {
            const nextCur = Math.min(m.target, m.current + 1);
            return {
              ...m,
              current: nextCur,
              completed: nextCur >= m.target,
            };
          }
          return m;
        })
      );
    } else if (latest.type === 'posts_changed') {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.type === 'create' && !m.completed) {
            return {
              ...m,
              current: 1,
              completed: true,
            };
          }
          return m;
        })
      );
    }
  }, [realtimeEvents]);

  // Handle follow creator directly inside mission tracker
  const handleFollowCreator = async (creator: SuggestedCreator) => {
    const nextFollowing = !creator.isFollowing;
    setSuggestedCreators((prev) =>
      prev.map((c) =>
        c.id === creator.id ? { ...c, isFollowing: nextFollowing } : c
      )
    );

    if (nextFollowing) {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.type === 'follow' && !m.completed) {
            const nextCur = Math.min(m.target, m.current + 1);
            return {
              ...m,
              current: nextCur,
              completed: nextCur >= m.target,
            };
          }
          return m;
        })
      );
      showToast(`Following @${creator.username}! Mission updated 🎯`, 'success');
    }

    try {
      const myId = userProfile?.id || ADMIN_ABBA_UUID;
      if (nextFollowing) {
        await supabase.from('follows').insert({
          follower_id: myId,
          following_id: creator.id,
        });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', myId)
          .eq('following_id', creator.id);
      }
    } catch {
      // offline or silent
    }
  };

  // Claim individual mission reward
  const handleClaimReward = async (mission: DailyMissionItem) => {
    if (claimingId || mission.claimed) return;
    setClaimingId(mission.id);

    try {
      // Attempt backend claim
      await apiFetch('/api/missions/claim', {
        method: 'POST',
        body: JSON.stringify({
          code: mission.id,
          xpReward: mission.bpReward,
          boostPointsReward: mission.bpReward,
        }),
      }).catch(() => {});

      // Add to user profile points in DB
      if (userProfile?.id) {
        const nextBp = (userProfile.boostPoints || 0) + mission.bpReward;
        try {
          await supabase
            .from('profiles')
            .update({ boost_points: nextBp })
            .eq('id', userProfile.id);
        } catch {
          // ignore error
        }
      }

      setMissions((prev) =>
        prev.map((m) =>
          m.id === mission.id
            ? { ...m, claimed: true, completed: true, current: m.target }
            : m
        )
      );

      triggerCelebration();
      await refreshProfile();
      showToast(
        `🎉 Claimed +${mission.bpReward} Boost Points for completing "${mission.title}"!`,
        'success'
      );
    } catch {
      showToast('Reward claimed successfully!', 'success');
    } finally {
      setClaimingId(null);
    }
  };

  const triggerCelebration = () => {
    setConfettiActive(true);
    window.setTimeout(() => setConfettiActive(false), 3000);
  };

  const completedCount = missions.filter((m) => m.completed || m.claimed).length;
  const allCompleted = completedCount === missions.length;
  const progressPercent = Math.round((completedCount / missions.length) * 100);

  const handleClaimDailyGrandBonus = async () => {
    if (bonusClaimed) return;
    setBonusClaimed(true);
    triggerCelebration();
    const bonusAmount = 150;
    if (userProfile?.id) {
      const nextBp = (userProfile.boostPoints || 0) + bonusAmount;
      try {
        await supabase
          .from('profiles')
          .update({ boost_points: nextBp })
          .eq('id', userProfile.id);
      } catch {
        // ignore error
      }
    }
    await refreshProfile();
    showToast(
      `🏆 Mega Daily Streak Completed! +${bonusAmount} Bonus Boost Points awarded!`,
      'success'
    );
  };

  return (
    <div className="relative bg-gradient-to-br from-[#111A30] via-[#0E1528] to-[#141C33] border border-[#2B8CFF]/25 rounded-3xl p-4 sm:p-5 shadow-xl overflow-hidden space-y-4">
      {/* Decorative Gradient Background Highlights */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-[#2B8CFF]/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl" />

      {/* Header Bar */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2B8CFF] to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm sm:text-base font-extrabold text-white">
                Daily Mission Tracker
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>Streak</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Complete today's missions to earn{' '}
              <span className="text-amber-400 font-bold">Boost Points (BP)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BP Wallet Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold text-amber-300 flex items-center gap-1.5 shadow">
            <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">
              {(userProfile?.boostPoints || 0).toLocaleString()} BP
            </span>
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors"
            title={expanded ? 'Collapse Missions' : 'Expand Missions'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar & Level Overview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold text-white">
            Daily Progress: {completedCount}/{missions.length} Finished
          </span>
          <span className="text-blue-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mission Cards */}
      {expanded && (
        <div className="space-y-3 pt-1">
          {missions.map((mission) => {
            const isDone = mission.completed || mission.claimed;
            const canClaim = mission.completed && !mission.claimed;

            return (
              <div
                key={mission.id}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  mission.claimed
                    ? 'bg-white/[0.02] border-white/5 opacity-80'
                    : canClaim
                      ? 'bg-gradient-to-r from-emerald-950/40 via-[#112438] to-emerald-950/40 border-emerald-500/40 shadow-lg'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-500 shrink-0" />
                      )}
                      <h3
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isDone ? 'text-slate-300 line-through' : 'text-white'
                        }`}
                      >
                        {mission.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold shrink-0">
                        +{mission.bpReward} BP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-6">
                      {mission.description} ({mission.current}/{mission.target})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                    {/* Action Button */}
                    {mission.claimed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                      </span>
                    ) : canClaim ? (
                      <button
                        type="button"
                        disabled={claimingId === mission.id}
                        onClick={() => handleClaimReward(mission)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/30 animate-pulse transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Claim +{mission.bpReward} BP</span>
                      </button>
                    ) : mission.type === 'like' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const postsSection = document.getElementById('feed-posts-container');
                          postsSection?.scrollIntoView({ behavior: 'smooth' });
                          showToast('Like or comment on posts below to complete mission!', 'info');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-pink-400" />
                        <span>Engage</span>
                      </button>
                    ) : mission.type === 'watch' ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('capshots')}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                        <span>Watch Reels</span>
                      </button>
                    ) : mission.type === 'create' ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('create')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Create</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Sub-view: Quick Suggested Creators for Follow Mission */}
                {mission.type === 'follow' && !mission.claimed && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Suggested Creators to Follow for Instant BP:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {suggestedCreators.map((creator) => (
                        <div
                          key={creator.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/5"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectUser(creator.id)}
                            className="flex items-center gap-2 min-w-0 text-left"
                          >
                            <Avatar
                              src={creator.avatarUrl}
                              name={creator.displayName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {creator.displayName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                @{creator.username}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFollowCreator(creator)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                              creator.isFollowing
                                ? 'bg-white/10 text-slate-300'
                                : 'bg-[#2B8CFF] hover:bg-blue-500 text-white shadow-sm'
                            }`}
                          >
                            {creator.isFollowing ? 'Following' : '+ Follow'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Bonus Unlock Banner when all daily missions completed */}
          {allCompleted && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 border border-amber-500/40 flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-300">
                    All Daily Missions Completed!
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Unlock your Daily Grand Streak Chest for +150 Boost Points
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={bonusClaimed}
                onClick={handleClaimDailyGrandBonus}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg transition-all ${
                  bonusClaimed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 animate-bounce'
                }`}
              >
                {bonusClaimed ? '✓ Chest Claimed' : 'Unlock +150 BP 🎁'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
