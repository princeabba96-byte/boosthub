import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, Users, HeartHandshake } from 'lucide-react';
import { INTEREST_CATEGORIES } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';

const JOIN_REASONS = [
  'Connect with Friends & Chat',
  'Watch Capshots & Short Videos',
  'Create Videos & Share My Talent',
  'Join Creator Communities',
  'Turn on Professional Mode & Earn',
  'Discover Trending Music, Comedy & Sports',
];

interface OnboardingScreenProps {
  onCompleted?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onCompleted,
}) => {
  const { userProfile, refreshProfile, showToast } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [joinReason, setJoinReason] = useState('');
  const [wantToWatch, setWantToWatch] = useState('');
  const [wantToCreate, setWantToCreate] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelected((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      }
      if (prev.length >= 8) {
        showToast('You can select up to 8 favorite categories.', 'info');
        return prev;
      }
      return [...prev, cat];
    });
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length < 1) {
      showToast('Please choose at least 1 category you like.', 'error');
      return;
    }
    if (!joinReason.trim()) {
      showToast('Please select or type why you joined BoostHub.', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          categories: selected,
          joinReason: joinReason.trim(),
          wantToWatch: wantToWatch.trim() || selected.slice(0, 3).join(', '),
          wantToCreate: wantToCreate.trim() || 'Posts & Capshots',
        }),
      });
      await refreshProfile();
      showToast(
        'Welcome to BoostHub! You are starting in Friends Mode.',
        'success'
      );
      onCompleted?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-white flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-[#0B1021] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-7 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2B8CFF]">
            <Sparkles className="w-4 h-4" />
            <span>New Account Setup · {userProfile?.email}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome, {userProfile?.displayName || 'Friend'}! Personalize BoostHub
          </h1>
          <p className="text-sm text-slate-400">
            1. Choose the <span className="text-white font-semibold">categories you like</span>{' '}
            ({selected.length} selected) and{' '}
            <span className="text-white font-semibold">why you joined BoostHub</span>.
          </p>
        </div>

        {/* Step 1: Categories Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Step 1: Choose Categories You Like
            </label>
            <span className="text-xs text-[#2B8CFF] font-semibold">
              {selected.length} chosen
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {INTEREST_CATEGORIES.map((category) => {
              const isSelected = selected.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#2B8CFF] text-white border border-blue-400 shadow-md shadow-blue-600/20'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10'
                  }`}
                >
                  <span className="truncate">{category}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Why did you join BoostHub? */}
        <form onSubmit={handleComplete} className="space-y-5 pt-4 border-t border-white/10">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Step 2: Why Did You Join BoostHub? (Required)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JOIN_REASONS.map((reason) => {
                const active = joinReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setJoinReason(reason)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between border transition-all ${
                      active
                        ? 'bg-purple-600/25 border-purple-400 text-white'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <span className="truncate">{reason}</span>
                    {active && <Check className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              required
              value={joinReason}
              onChange={(e) => setJoinReason(e.target.value)}
              placeholder="Or type in your own words why you joined BoostHub..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                What do you love watching most?
              </label>
              <input
                type="text"
                value={wantToWatch}
                onChange={(e) => setWantToWatch(e.target.value)}
                placeholder="e.g. Comedy, Music & Capshots"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                What would you like to share or create?
              </label>
              <input
                type="text"
                value={wantToCreate}
                onChange={(e) => setWantToCreate(e.target.value)}
                placeholder="e.g. Daily stories & short videos"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Friends First Mode Info Banner */}
          <div className="p-4 rounded-2xl bg-[#131A2A] border border-blue-500/30 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4 text-[#2B8CFF]" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>You Start in Friends Mode</span>
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-slate-300 leading-relaxed">
                When you finish setup, the first thing you see is{' '}
                <strong className="text-white">Friends</strong>. Whenever you want to
                unlock <strong className="text-white">Followers</strong> and enter{' '}
                <strong className="text-white">Creator Competitions to Get Monetized</strong>,
                simply go to <strong>Settings → Turn On Professional Mode</strong>!
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={selected.length < 1 || !joinReason.trim() || saving}
            className="w-full min-h-[48px] py-3.5 rounded-2xl bg-gradient-to-r from-[#2B8CFF] via-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-lg shadow-blue-600/25"
          >
            <span>
              {saving
                ? 'Saving Your Account Setup...'
                : 'Finish Setup & See Friends'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
