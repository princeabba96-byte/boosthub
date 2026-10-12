import React, { useState } from 'react';
import {
  X,
  Flame,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Trophy,
  Crown,
  Heart,
  Star,
  Compass,
  Users,
  Gift,
  HelpCircle,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, UserBadge } from '../types';
import { USER_BADGES_CATALOG, BadgeDefinition } from '../data/userBadgesCatalog';
import {
  BronzeShieldFireringEditor,
  SilverShieldEngagementMaster,
  GoldShieldContentGod,
  CrystalShieldDistantWinner,
  HeroicGrandmasterBoostPro,
  RookieFlameSkullIcon,
  MasterPadlockIcon,
} from './BadgeShieldIcons';

import { isPlatformFounder } from '../utils/creatorAdmin';

interface UserBadgesProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  isMe: boolean;
  onRefreshProfile?: () => void;
}

export const UserBadgesProgressModal: React.FC<UserBadgesProgressModalProps> = ({
  isOpen,
  onClose,
  profile,
  isMe,
  onRefreshProfile,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [claimedNotice, setClaimedNotice] = useState<string>('');

  if (!isOpen) return null;

  const isFounder = isPlatformFounder(profile);
  const userXp = isFounder ? 99999 : profile.xp || 0;
  const maxTrackXp = 7500;
  const progressPct = isFounder
    ? 100
    : Math.min(100, Math.round((userXp / maxTrackXp) * 100));
  const xpToNext = isFounder ? 0 : Math.max(0, maxTrackXp - userXp);

  // Check which badges user has unlocked
  const earnedCodeSet = new Set(
    isFounder
      ? USER_BADGES_CATALOG.map((b) => b.code)
      : (profile.badges || []).map((b) => b.code)
  );

  // Determine current badge level
  let currentLevel = isFounder ? 7 : 1;
  if (!isFounder) {
    if (userXp >= 7500 && earnedCodeSet.has('boost_pro')) currentLevel = 7;
    else if (userXp >= 3500 && earnedCodeSet.has('distant_winner')) currentLevel = 6;
    else if (userXp >= 1500 && earnedCodeSet.has('content_god')) currentLevel = 5;
    else if (userXp >= 900 && earnedCodeSet.has('engagement_master')) currentLevel = 4;
    else if (userXp >= 500 && earnedCodeSet.has('firering_editor')) currentLevel = 3;
    else if (userXp >= 250 && earnedCodeSet.has('rookie')) currentLevel = 2;
  }

  const handleClaimRewards = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EF4444', '#38BDF8', '#FDE047'],
      });
    } catch {}
    setClaimedNotice('🔥 All available seasonal XP bonuses and Badges claimed!');
    setTimeout(() => setClaimedNotice(''), 4500);
    onRefreshProfile?.();
  };

  const renderBadgeIcon = (code: string, size = 52, locked = false) => {
    switch (code) {
      case 'rookie':
        return <RookieFlameSkullIcon size={size} locked={locked} />;
      case 'firering_editor':
        return <BronzeShieldFireringEditor size={size} locked={locked} />;
      case 'engagement_master':
        return <SilverShieldEngagementMaster size={size} locked={locked} />;
      case 'content_god':
        return <GoldShieldContentGod size={size} locked={locked} />;
      case 'distant_winner':
        return <CrystalShieldDistantWinner size={size} locked={locked} />;
      case 'boost_pro':
        return <HeroicGrandmasterBoostPro size={size} locked={locked} />;
      default:
        return (
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white border transition-all ${
              locked
                ? 'bg-slate-800/80 border-slate-700 text-slate-500'
                : 'bg-gradient-to-br from-amber-500 to-red-600 border-amber-300 shadow-lg shadow-amber-500/30'
            }`}
          >
            <Award className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#080D1E] border-2 border-[#1E293B] rounded-3xl shadow-2xl shadow-blue-950/60 overflow-hidden my-auto">
        {/* Cyber-tech Corner Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-2xl pointer-events-none" />

        {/* Top Header Bar matching Image 1 */}
        <div className="bg-gradient-to-r from-[#0C142A] via-[#111A38] to-[#0C142A] border-b-2 border-amber-500/30 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/40">
              <div className="w-full h-full bg-[#0B0F1F] rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-red-400 tracking-wider uppercase italic">
                PROGRESS BADGE
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-cyan-400 tracking-wider uppercase">
                LEVEL PROGRESSION TRACK • SEASON 23 PASS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {claimedNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>{claimedNotice}</span>
          </div>
        )}

        {/* Main Content Grid matching Image 1: Left XP Column + Right Progression Track */}
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Left Column: XP Progress Fiery Tube */}
          <div className="sm:col-span-5 flex flex-col justify-between bg-[#0B1224] border border-cyan-500/30 rounded-2xl p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  XP PROGRESS
                </span>
              </div>

              {/* Vertical Flame Tube matching Image 1 */}
              <div className="relative h-64 sm:h-72 w-full bg-[#040814] rounded-2xl border-2 border-blue-900/60 p-2 overflow-hidden flex flex-col justify-end">
                {/* Glowing Flame Core Fill */}
                <div
                  style={{ height: `${progressPct}%` }}
                  className="w-full rounded-xl bg-gradient-to-t from-red-700 via-orange-500 to-amber-300 relative transition-all duration-700 overflow-hidden shadow-[0_0_24px_rgba(249,115,22,0.8)]"
                >
                  {/* Fiery particles & heat lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(254,240,138,0.9),transparent_60%)] animate-pulse" />
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-yellow-200 to-transparent opacity-80" />
                </div>

                {/* Centered Readout Over Tube */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-3 text-center">
                  <span className="text-lg sm:text-xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-tight font-mono">
                    {userXp} / {maxTrackXp} XP
                  </span>
                  <span className="text-xs font-bold text-amber-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    Level {currentLevel} Creator
                  </span>
                </div>
              </div>

              {/* Percent Complete & Next Tier */}
              <div className="mt-3 text-center space-y-1.5">
                <p className="text-base font-black text-orange-400 tracking-wider">
                  {progressPct}% COMPLETE
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0F172A] border border-orange-500/40 text-[11px] font-bold text-orange-200">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>+{xpToNext} XP TO NEXT REWARD</span>
                </div>
              </div>
            </div>

            {/* Currency Badges: Diamonds & Coins matching Image 1 */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#060A17] border border-cyan-500/20">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>💎 DIAMONDS:</span>
                </span>
                <span className="text-xs font-extrabold text-white font-mono">
                  {(profile.boostPoints || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#060A17] border border-amber-500/20">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🪙 COINS:</span>
                </span>
                <span className="text-xs font-extrabold text-white font-mono">
                  {(profile.balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Vertical Progression Milestone Track */}
          <div className="sm:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>SEASON MILESTONE TRACK</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Tap any badge for details
              </span>
            </div>

            {isFounder && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 border-2 border-amber-400/60 flex items-center gap-3 shadow-lg shadow-amber-500/20">
                <Crown className="w-7 h-7 text-amber-300 animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👑 FOUNDER SUPREME GODMODE</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">ALL BADGES ACTIVE</span>
                  </p>
                  <p className="text-[10px] text-amber-100/90 mt-0.5">
                    Sovereign Creator status confirmed. All 7 Rank Shields and Prestige Honors are permanently unlocked for Prince Abba.
                  </p>
                </div>
              </div>
            )}

            {/* Vertical Milestone Pathway */}
            <div className="relative pl-6 space-y-4 before:absolute before:top-4 before:bottom-4 before:left-3.5 before:w-1 before:bg-gradient-to-b before:from-orange-500 before:via-cyan-400 before:to-slate-700 before:rounded-full">
              {USER_BADGES_CATALOG.filter((b) => b.category === 'progression').map((badge) => {
                const isPreviousEarned = isFounder || !badge.requiredPreviousBadgeCode || earnedCodeSet.has(badge.requiredPreviousBadgeCode);
                const isEarned = isFounder || (isPreviousEarned && earnedCodeSet.has(badge.code));
                const isSelected = selectedBadge?.code === badge.code;
                const isLockedBySequence = !isFounder && !isPreviousEarned;

                return (
                  <div
                    key={badge.code}
                    onClick={() => setSelectedBadge(badge)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-950/40 via-[#111A38] to-[#0B1224] border-amber-400 ring-2 ring-amber-400/30'
                        : isEarned
                          ? 'bg-[#0B1224]/80 border-cyan-500/30 hover:border-cyan-400'
                          : 'bg-[#060A17]/60 border-white/10 opacity-75 hover:opacity-100 hover:border-white/20'
                    }`}
                  >
                    {/* Node Dot on Path Line */}
                    <div
                      className={`absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isEarned
                          ? 'bg-amber-400 border-white shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                          : 'bg-slate-900 border-slate-600'
                      }`}
                    >
                      {isEarned && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {renderBadgeIcon(badge.code, 52, !isEarned)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-white truncate">
                            {badge.name}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isEarned
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isLockedBySequence
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isEarned
                              ? `CLAIMED • +${badge.xpReward} XP`
                              : isLockedBySequence
                                ? `LOCKED • COMPLETE RANK ${badge.level - 1} FIRST`
                                : `MISSION ACTIVE • ${badge.requirementCount} XP`}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          {badge.requirementDescription}
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
                          <span className="text-amber-400 font-mono">
                            {badge.levelLabel}
                          </span>
                          {isEarned && (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Unlocked
                            </span>
                          )}
                          {isLockedBySequence && (
                            <span className="text-rose-400 flex items-center gap-0.5">
                              <Lock className="w-3 h-3" /> 1 Rank At A Time
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Level 6 Master Locked Milestone from Image 1 */}
              <div className="relative p-3 rounded-2xl bg-[#060A17]/60 border border-slate-800 opacity-60">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700" />
                <div className="flex items-center gap-3">
                  <MasterPadlockIcon size={52} locked={true} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-300">
                        LV.6 • MASTER LEGEND
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                        LOCKED • 3000 XP
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supreme Season 23 Pass Master Tier. Complete all weekly quests.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Badges Showcase */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                <span>COMMUNITY & CREATOR ACHIEVEMENTS</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {USER_BADGES_CATALOG.filter((b) => b.category === 'achievement').map((ach) => {
                  const isEarned = earnedCodeSet.has(ach.code);
                  return (
                    <button
                      key={ach.code}
                      type="button"
                      onClick={() => setSelectedBadge(ach)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isEarned
                          ? 'bg-gradient-to-br from-amber-500/15 to-purple-500/15 border-amber-400/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {ach.code === 'top_creator' ? (
                          <Star className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : ach.code === 'early_adopter' ? (
                          <Compass className="w-4 h-4 text-orange-400 shrink-0" />
                        ) : (
                          <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">{ach.name}</span>
                      </div>
                      <p className="text-[9px] text-slate-300 line-clamp-2">
                        {ach.requirementDescription}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Badge Modal Inspector Popup */}
        {selectedBadge && (
          <div className="bg-[#0B132B] border-t-2 border-amber-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                {renderBadgeIcon(selectedBadge.code, 56, !earnedCodeSet.has(selectedBadge.code))}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">{selectedBadge.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedBadge.levelLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{selectedBadge.description}</p>
                <p className="text-[11px] text-cyan-300 font-medium mt-0.5">
                  🎯 Requirement: {selectedBadge.requirementDescription}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0"
            >
              Close Details
            </button>
          </div>
        )}

        {/* Bottom Bar: Season Reward & Claim Rewards matching Image 1 */}
        <div className="bg-[#070B17] border-t border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-300 shadow-md">
              💎
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SEASON REWARD: NEXT
              </p>
              <p className="text-xs font-black text-cyan-300">
                ➔ LEGENDARY CHEST (+500 BOOST POINTS)
              </p>
            </div>
          </div>

          {isMe && (
            <button
              type="button"
              onClick={handleClaimRewards}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-red-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/40 ring-2 ring-amber-400/50 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Flame className="w-4 h-4 text-yellow-200 animate-pulse" />
              <span>CLAIM ALL REWARDS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
