import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { INTEREST_CATEGORIES } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';

export const OnboardingScreen: React.FC = () => {
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
      if (prev.length >= 6) {
        showToast('You have already selected 6 interests.', 'info');
        return prev;
      }
      return [...prev, cat];
    });
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length !== 6) {
      showToast('Please select exactly 6 interests to personalize BoostHub.', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          categories: selected,
          joinReason,
          wantToWatch,
          wantToCreate,
        }),
      });
      await refreshProfile();
      showToast('Welcome to BoostHub! Your feed is now personalized.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-white flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-[#0B1021] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>Personalize Your Experience</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome, {userProfile?.displayName || 'Creator'}! Choose 6 Interests
          </h1>
          <p className="text-sm text-slate-400">
            Select <span className="text-white font-semibold">exactly 6 categories</span>{' '}
            so BoostHub can tailor your Home feed, Capshots, and creator
            recommendations. ({selected.length}/6 selected)
          </p>
        </div>

        {/* 20 Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {INTEREST_CATEGORIES.map((category) => {
            const isSelected = selected.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border border-blue-400/50 shadow-md shadow-blue-600/20'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10'
                }`}
              >
                <span className="truncate">{category}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>

        {/* Optional Onboarding Questions */}
        <form onSubmit={handleComplete} className="space-y-4 pt-2 border-t border-white/10">
          <p className="text-xs font-semibold text-slate-400">
            Optional: Tell us more about your goals
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Why did you join?
              </label>
              <input
                type="text"
                value={joinReason}
                onChange={(e) => setJoinReason(e.target.value)}
                placeholder="e.g. Connect & grow"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                What do you want to watch?
              </label>
              <input
                type="text"
                value={wantToWatch}
                onChange={(e) => setWantToWatch(e.target.value)}
                placeholder="e.g. Tech & Capshots"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                What do you want to create?
              </label>
              <input
                type="text"
                value={wantToCreate}
                onChange={(e) => setWantToCreate(e.target.value)}
                placeholder="e.g. Short videos & tutorials"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={selected.length !== 6 || saving}
            className="w-full min-h-[48px] py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          >
            <span>
              {saving
                ? 'Saving Your Preferences...'
                : `Continue with ${selected.length}/6 Interests`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
