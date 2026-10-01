import React, { useState } from 'react';
import {
  User,
  Scissors,
  ShoppingBag,
  Video,
  Heart,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Search,
  Sparkles,
  ShieldCheck,
  Bell,
  X,
  CheckCircle2,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';
import { MainTab } from '../types';
import { apiFetch } from '../services/api';

interface MenuScreenProps {
  onNavigateTab: (tab: MainTab) => void;
  onOpenMyProfile: (options?: {
    mainMode?: 'profile' | 'dashboard' | 'gifts' | 'settings' | 'admin';
    contentTab?: 'posts' | 'videos' | 'photos' | 'liked' | 'saved' | 'about';
    settingsSubMenu?: 'general' | 'notifications';
  }) => void;
  onOpenSearch: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onNavigateTab,
  onOpenMyProfile,
  onOpenSearch,
}) => {
  const { userProfile, logout, showToast } = useAuth();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [pushingGithub, setPushingGithub] = useState(false);
  const [githubPushStatus, setGithubPushStatus] = useState<string | null>(null);

  const isFounderAdmin =
    userProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com';

  const handleDirectPushToGithubPages = async () => {
    setPushingGithub(true);
    setGithubPushStatus('Pushing v23 bundle to princeabba96-byte/boosthub main branch...');
    try {
      const res = await apiFetch<{
        ok: boolean;
        commitSha: string;
        liveUrl: string;
      }>('/api/admin/github-pages-push', {
        method: 'POST',
        body: JSON.stringify({
          githubToken: githubToken.trim(),
          repo: 'princeabba96-byte/boosthub',
          branch: 'main',
        }),
      });
      if (res?.ok) {
        const msg = `Pushed commit ${res.commitSha.slice(0, 7)} to main! Live at ${res.liveUrl}`;
        setGithubPushStatus(msg);
        showToast(msg, 'success');
      }
    } catch (err: any) {
      const errMsg =
        err?.message ||
        'Use the GitHub icon in the top AI Studio toolbar or enter a GitHub token with repo write access.';
      setGithubPushStatus(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setPushingGithub(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const followerCount = userProfile?.followersCount ?? 0;
  const followingCount = userProfile?.followingCount ?? 0;

  return (
    <div className="min-h-[calc(100vh-7.5rem)] pb-24 animate-in slide-in-from-bottom-6 duration-300 ease-out">
      {/* Top Menu Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            Menu
          </h1>
          <p className="text-xs text-slate-400">
            Your BoostHub shortcuts, studio & marketplace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full bg-[#1E1E26] hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 transition-colors"
            aria-label="Search BoostHub"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() =>
              onOpenMyProfile({ mainMode: 'settings', settingsSubMenu: 'general' })
            }
            className="w-10 h-10 rounded-full bg-[#1E1E26] hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 transition-colors"
            aria-label="Open Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top Profile Card with Gradient Banner */}
      {userProfile && (
        <div className="relative rounded-3xl overflow-hidden bg-[#1E1E26] border border-white/10 shadow-xl mb-6">
          {/* Gradient Banner */}
          <div className="h-24 w-full bg-gradient-to-r from-[#4A90E2] via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E26] via-[#1E1E26]/30 to-transparent" />
          </div>

          <div className="px-5 pb-5 -mt-10 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div className="rounded-full ring-4 ring-[#1E1E26] bg-[#121212] shrink-0">
                <Avatar
                  src={userProfile.avatarUrl}
                  name={userProfile.displayName}
                  size="lg"
                  isOnline={true}
                />
              </div>
              <div className="min-w-0 pb-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-display text-lg font-extrabold text-white truncate">
                    {userProfile.displayName}
                  </h2>
                  {userProfile.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-[#4A90E2] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  @{userProfile.username}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                  <span>
                    <strong className="text-white font-bold tabular-nums">
                      {followerCount.toLocaleString()}
                    </strong>{' '}
                    Followers
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>
                    <strong className="text-white font-bold tabular-nums">
                      {followingCount.toLocaleString()}
                    </strong>{' '}
                    Following
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onOpenMyProfile({ mainMode: 'profile', contentTab: 'posts' })
              }
              className="px-4 py-2.5 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(74,144,226,0.35)] transition-all shrink-0"
            >
              <span>View Profile</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Marketplace & Creator Studio */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#4A90E2]" />
            <span>Marketplace & Studio</span>
          </h3>
          <span className="text-[11px] text-[#4A90E2] font-semibold">
            Creator Tools
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* My Profile (person icon blue) */}
          <button
            onClick={() =>
              onOpenMyProfile({ mainMode: 'profile', contentTab: 'posts' })
            }
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-[#4A90E2]/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-[#4A90E2]/15 border border-[#4A90E2]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5 text-[#4A90E2]" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              My Profile
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Bio, posts & creator stats
            </p>
          </button>

          {/* B-Edit Studio (scissors purple) */}
          <button
            onClick={() => onNavigateTab('bedit')}
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-purple-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 text-purple-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              B-Edit Studio
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Edit like CapCut
            </p>
          </button>

          {/* B-Shop (shopping bag teal) */}
          <button
            onClick={() => onNavigateTab('bshop')}
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-teal-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-teal-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">B-Shop</p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Marketplace & cosmetics
            </p>
          </button>

          {/* My Capshots (video pink) */}
          <button
            onClick={() =>
              onOpenMyProfile({ mainMode: 'profile', contentTab: 'videos' })
            }
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-pink-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5 text-pink-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              My Capshots
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Your uploaded reels & clips
            </p>
          </button>
        </div>
      </div>

      {/* Section 2: Social & Saved Library */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>Community & Library</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">
            Shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Liked Videos (heart red) */}
          <button
            onClick={() =>
              onOpenMyProfile({ mainMode: 'profile', contentTab: 'liked' })
            }
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-red-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              Liked Videos
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Posts & videos you loved
            </p>
          </button>

          {/* Find Friends (group orange) */}
          <button
            onClick={() => onNavigateTab('friends')}
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-orange-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              Find Friends
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Discover & connect
            </p>
          </button>
        </div>
      </div>

      {/* Section 3: Settings, Notification Preferences & Support */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Settings & Support</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Settings (gear indigo) */}
          <button
            onClick={() =>
              onOpenMyProfile({ mainMode: 'settings', settingsSubMenu: 'general' })
            }
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-indigo-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              Settings
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Privacy & Notifications
            </p>
          </button>

          {/* Help Center (question cyan) */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] hover:border-cyan-500/40 text-left transition-all group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="font-display text-sm font-bold text-white">
              Help Center
            </p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Guides, safety & FAQs
            </p>
          </button>
        </div>

        {/* Direct quick-shortcut banner to Notification Preferences */}
        <button
          onClick={() =>
            onOpenMyProfile({
              mainMode: 'settings',
              settingsSubMenu: 'notifications',
            })
          }
          className="w-full mt-3 p-3.5 rounded-2xl bg-[#1E1E26] hover:bg-[#262631] border border-white/[0.07] flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#4A90E2]" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">
                Notification Preferences & Push Batching
              </p>
              <p className="text-[11px] text-slate-400">
                Toggle likes, comments, mentions & smart summary windows
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {isFounderAdmin && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#1E1E26] to-[#141829] border border-[#4A90E2]/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4A90E2]" />
                  <span>GitHub Pages v23 Live Sync (Founder Only)</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Target: <code className="text-blue-300">princeabba96-byte/boosthub</code> (main • v23 bundle ready)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                v23 Built
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Paste GitHub Personal Access Token (ghp_...) to push directly"
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#4A90E2]"
              />
              <button
                type="button"
                onClick={handleDirectPushToGithubPages}
                disabled={pushingGithub}
                className="px-4 py-2 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap shadow"
              >
                {pushingGithub ? 'Pushing v23...' : 'Push v23 to GitHub Pages'}
              </button>
            </div>
            {githubPushStatus && (
              <p className="text-[11px] text-blue-300 font-medium">
                {githubPushStatus}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Logout Card */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full p-4 rounded-2xl bg-[#1E1E26] hover:bg-red-500/15 border border-white/[0.08] hover:border-red-500/30 flex items-center justify-center gap-2.5 text-red-400 font-bold text-sm transition-all shadow-md"
      >
        <LogOut className="w-5 h-5" />
        <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
      </button>

      {/* Help Center Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#181820] border border-white/10 p-6 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-white">
                    BoostHub Help Center
                  </h3>
                  <p className="text-xs text-slate-400">
                    Creator tools, verification & safety guide
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#1E1E26] border border-white/[0.07] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Scissors className="w-4 h-4" />
                  <span>How do I use B-Edit Studio?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tap the blue <strong>+</strong> button in the top bar or select{' '}
                  <strong>B-Edit Studio</strong> from the Menu to trim clips,
                  adjust playback speed, apply color filters, crop aspect ratios
                  (9:16, 1:1, 16:9), and publish directly to Capshots.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1E1E26] border border-white/[0.07] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4A90E2]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>How does the Verified Badge work?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verified badges on BoostHub are granted exclusively by the
                  platform founder & administrator to authentic creators.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1E1E26] border border-white/[0.07] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Bell className="w-4 h-4" />
                  <span>How does Notification Batching work?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When you receive multiple likes, comments, or mentions in a
                  short window, BoostHub groups them into a single clean summary
                  push alert. You can customize your batch frequency in{' '}
                  <strong>Settings → Notification Preferences</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1E1E26] border border-white/[0.07] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Community Safety & Privacy</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You can set your account to Private, control who can comment on
                  your Capshots, or manage blocked accounts anytime inside Settings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowHelpModal(false);
                  onOpenMyProfile({
                    mainMode: 'settings',
                    settingsSubMenu: 'general',
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
              >
                Go to Settings
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#4A90E2] hover:bg-[#357ABD] text-xs font-bold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
