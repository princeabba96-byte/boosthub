import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  DollarSign,
  CheckCircle2,
  Users,
  TrendingUp,
  Target,
  Gift,
  Video,
  X,
  ArrowRight,
  Flame,
  Award,
  ShieldCheck,
} from 'lucide-react';

interface ProfessionalModeGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  isProfessionalMode: boolean;
  activating?: boolean;
  onConfirmActivate?: () => void;
  onOpenCompetitions?: () => void;
  inline?: boolean;
}

export const PROFESSIONAL_GUIDE_STEPS = [
  {
    step: '01',
    badge: 'BENEFITS OF PROFESSIONAL MODE',
    title: 'Transform Friends into a Global Follower Audience',
    subtitle:
      'When you create an account on BoostHub, you start in Personal Friends Mode. Turning on Professional Mode upgrades your profile into a public Creator Hub.',
    image:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=900&q=80',
    imageCaption: 'Your profile switches from Friends to Public Followers & Creator Analytics',
    highlights: [
      {
        icon: Users,
        label: 'Followers Replace Friends Display',
        desc: 'Anyone on BoostHub can follow your content without waiting for friend requests, growing your audience exponentially.',
      },
      {
        icon: TrendingUp,
        label: 'Real-Time Creator Studio & Insights',
        desc: 'Track 7-day video views, watch time, completion rates, and audience growth curves.',
      },
      {
        icon: Trophy,
        label: 'Unlock Creator Competitions',
        desc: 'Gain exclusive access to Creator Competitions where top performers fast-track monetization.',
      },
    ],
  },
  {
    step: '02',
    badge: 'WHAT TO DO IN PROFESSIONAL MODE',
    title: 'Post Capshots, Complete Daily Missions & Enter Competitions',
    subtitle:
      'To grow rapidly and qualify for full monetization, follow these core creator actions every day:',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    imageCaption: 'Publish high-retention Capshots & compete in weekly leaderboard challenges',
    highlights: [
      {
        icon: Video,
        label: '1. Publish Original Capshots & Posts',
        desc: 'Post vertical videos and engaging photo stories using trending hashtags to reach the For You feed.',
      },
      {
        icon: Target,
        label: '2. Complete Daily Missions (MissionsPanel)',
        desc: 'Finish daily platform challenges to claim instant XP, Boost Points (BP), and algorithmic boosts.',
      },
      {
        icon: Flame,
        label: '3. Compete to Reach Monetization Milestones',
        desc: 'Enter Creator Competitions to hit 1,000 Followers, 10,000 Video Views, and 5,000 Creator XP.',
      },
    ],
  },
  {
    step: '03',
    badge: 'HOW TO EARN & GET MONETIZED',
    title: 'Turn Your Views, Competitions & Fan Gifts into Earnings',
    subtitle:
      'Once Professional Mode is active, you unlock three direct pathways to earn rewards and monetize your channel:',
    image:
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=900&q=80',
    imageCaption: 'Earn from Creator Competitions, B-Shop Fan Gifts, and Monetized Views',
    highlights: [
      {
        icon: Award,
        label: 'Competition Prize Pools & Monetization Fast-Track',
        desc: 'Win massive XP & Boost Point payouts in Creator Competitions and unlock your Monetized Creator badge.',
      },
      {
        icon: Gift,
        label: 'Receive B-Shop Virtual Gifts from Viewers',
        desc: 'Fans send Roses, Rockets, Crowns, and Trophies on your posts—converting directly into BP & Recognition Score.',
      },
      {
        icon: DollarSign,
        label: 'Creator Monetization Payouts',
        desc: 'Maintain 1,000+ Followers, 10,000+ Views & 5,000+ XP in Professional Mode to activate Creator Revenue Share.',
      },
    ],
  },
];

export const ProfessionalModeGuideModal: React.FC<ProfessionalModeGuideProps> = ({
  isOpen = true,
  onClose,
  isProfessionalMode,
  activating = false,
  onConfirmActivate,
  onOpenCompetitions,
  inline = false,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!inline && !isOpen) return null;

  const content = (
    <div
      className={`${
        inline
          ? 'bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl'
          : 'bg-zinc-950 border border-amber-500/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Visual Creator Guide
              </span>
              {isProfessionalMode && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Professional Mode Active
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              How Professional Mode & Creator Monetization Work
            </h2>
          </div>
        </div>
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Step selector tabs */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {PROFESSIONAL_GUIDE_STEPS.map((item, idx) => {
          const isCurrent = idx === activeStepIndex;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-500/50 text-white shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  Step {item.step}
                </span>
                {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-xs font-bold line-clamp-1">
                {idx === 0
                  ? '1. Benefits & Followers'
                  : idx === 1
                    ? '2. What To Do'
                    : '3. How To Earn'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Visual Cards with Pictures */}
      <div className="space-y-6">
        {PROFESSIONAL_GUIDE_STEPS.map((stepObj, idx) => {
          if (!inline && idx !== activeStepIndex) return null;
          return (
            <div
              key={stepObj.step}
              className={`${
                inline && idx !== activeStepIndex ? 'hidden md:block' : 'block'
              } bg-zinc-900/60 border border-zinc-800/90 rounded-2xl overflow-hidden`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Illustrated Picture Banner */}
                <div className="md:col-span-5 relative min-h-[200px] bg-zinc-950">
                  <img
                    src={stepObj.image}
                    alt={stepObj.title}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex flex-col justify-end p-4">
                    <span className="inline-block w-fit text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 mb-1.5">
                      {stepObj.badge}
                    </span>
                    <p className="text-xs font-semibold text-zinc-200 leading-snug">
                      {stepObj.imageCaption}
                    </p>
                  </div>
                </div>

                {/* Explanation & Action List */}
                <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mb-1.5">
                      {stepObj.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      {stepObj.subtitle}
                    </p>

                    <div className="space-y-3">
                      {stepObj.highlights.map((h, hIdx) => {
                        const IconComp = h.icon;
                        return (
                          <div
                            key={hIdx}
                            className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/70"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                              <IconComp className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                {h.label}
                              </p>
                              <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                                {h.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation & Action CTA */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {activeStepIndex > 0 && (
            <button
              type="button"
              onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-800"
            >
              Previous
            </button>
          )}
          {activeStepIndex < PROFESSIONAL_GUIDE_STEPS.length - 1 && (
            <button
              type="button"
              onClick={() =>
                setActiveStepIndex((i) =>
                  Math.min(PROFESSIONAL_GUIDE_STEPS.length - 1, i + 1)
                )
              }
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              Next Picture Guide <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {!isProfessionalMode && onConfirmActivate && (
            <button
              type="button"
              disabled={activating}
              onClick={onConfirmActivate}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {activating
                ? 'Activating Professional Mode...'
                : 'Turn On Professional Mode Now'}
            </button>
          )}

          {isProfessionalMode && onOpenCompetitions && (
            <button
              type="button"
              onClick={onOpenCompetitions}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Enter Creator Competitions to Monetize
            </button>
          )}

          {!inline && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-800"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {content}
    </div>
  );
};
