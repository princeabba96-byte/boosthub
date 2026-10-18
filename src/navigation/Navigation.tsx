import React from 'react';
import {
  Home,
  PlaySquare,
  Users,
  Bell,
  Menu,
  Search,
  Send,
  Plus,
  Camera,
  Scissors,
  ShoppingBag,
  User,
  X,
  ChevronRight,
} from 'lucide-react';
import { MainTab } from '../types';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';

interface NavigationProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenSearch: () => void;
  onOpenMessages: () => void;
  onOpenCreateSheet: () => void;
}

export const TopNavigationBar: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  onOpenSearch,
  onOpenMessages,
  onOpenCreateSheet,
}) => {
  const { unreadNotifications, unreadMessages } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#121212] border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between shadow-md">
      {/* Left: BoostHub logo with blue B circle + "BoostHub" text */}
      <button
        onClick={() => onChangeTab('home')}
        className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2563EB] flex items-center justify-center text-white font-display font-black text-lg shadow-[0_0_14px_rgba(74,144,226,0.5)] group-hover:scale-105 transition-transform">
          B
        </div>
        <span>BoostHub</span>
      </button>

      {/* Center: Clean Facebook-style 5-tab navigation on desktop */}
      <nav className="hidden lg:flex items-center gap-2">
        {[
          { id: 'home' as MainTab, label: 'Home', icon: Home },
          { id: 'capshots' as MainTab, label: 'Capshots', icon: PlaySquare },
          { id: 'friends' as MainTab, label: 'Friends', icon: Users },
          {
            id: 'notifications' as MainTab,
            label: 'Alerts',
            icon: Bell,
            badge: unreadNotifications,
          },
          { id: 'menu' as MainTab, label: 'Menu', icon: Menu },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              title={item.label}
              className={`relative px-6 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'text-[#4A90E2]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="relative flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <span className="hidden xl:inline">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-[#4A90E2]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: 3 icons: Search (magnify), Messages (paper plane), Create (+) blue circle button */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSearch}
          className="w-10 h-10 rounded-full bg-[#1E1E26] hover:bg-white/15 border border-white/[0.08] text-slate-200 flex items-center justify-center transition-colors"
          aria-label="Search BoostHub"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenMessages}
          className="relative w-10 h-10 rounded-full bg-[#1E1E26] hover:bg-white/15 border border-white/[0.08] text-slate-200 flex items-center justify-center transition-colors"
          aria-label="Messages"
          title="Direct Messages"
        >
          <Send className="w-4 h-4 -rotate-12 translate-x-[0.5px]" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center tabular-nums border-2 border-[#121212]">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>

        <button
          onClick={onOpenCreateSheet}
          className="w-10 h-10 rounded-full bg-[#4A90E2] hover:bg-[#357ABD] text-white flex items-center justify-center shadow-[0_0_16px_rgba(74,144,226,0.5)] active:scale-95 transition-all"
          aria-label="Create Capshot or Open B-Edit Studio"
          title="Create (+)"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};

export const BottomNavigationBar: React.FC<{
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}> = ({ activeTab, onChangeTab }) => {
  const { unreadNotifications } = useAuth();

  const items: Array<{
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'capshots', label: 'Capshots', icon: PlaySquare },
    { id: 'friends', label: 'Friends', icon: Users },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      badge: unreadNotifications,
    },
    { id: 'menu', label: 'Menu', icon: Menu },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#121212]/98 backdrop-blur-xl rounded-t-2xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.65)] grid grid-cols-5 items-center px-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`relative h-full flex flex-col items-center justify-center transition-colors ${
              isActive
                ? 'text-[#4A90E2]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-[3px] rounded-b-full bg-[#4A90E2]" />
            )}
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[17px] h-[17px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center tabular-nums border border-[#121212]">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export const CreateBottomSheetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectNewCapshot: () => void;
  onSelectBEditStudio: () => void;
}> = ({ isOpen, onClose, onSelectNewCapshot, onSelectBEditStudio }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-[#181820] border-t border-x border-white/15 p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg font-extrabold text-white">
              Create on BoostHub
            </h2>
            <p className="text-xs text-slate-400">
              Choose how you want to create and share
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
            aria-label="Close Create Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Option 1: New Capshot (camera icon, red gradient) */}
          <button
            onClick={() => {
              onClose();
              onSelectNewCapshot();
            }}
            className="w-full p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#252530] border border-white/10 hover:border-rose-500/40 flex items-center justify-between gap-4 text-left transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-[0_0_18px_rgba(244,63,94,0.45)] group-hover:scale-105 transition-transform shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display text-base font-extrabold text-white">
                  New Capshot
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share a photo, video reel, or thought to the feed
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
          </button>

          {/* Option 2: B-Edit Studio - Edit like CapCut (scissors icon, purple gradient) */}
          <button
            onClick={() => {
              onClose();
              onSelectBEditStudio();
            }}
            className="w-full p-4 rounded-2xl bg-[#1E1E26] hover:bg-[#252530] border border-white/10 hover:border-purple-500/40 flex items-center justify-between gap-4 text-left transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_18px_rgba(168,85,247,0.45)] group-hover:scale-105 transition-transform shrink-0">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display text-base font-extrabold text-white">
                  B-Edit Studio - Edit like CapCut
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pro timeline trim, speed curve, LUT filters & 9:16 video studio
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const DesktopLeftRail: React.FC<{
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenMessages: () => void;
  onOpenSearch: () => void;
}> = ({ activeTab, onChangeTab, onOpenMessages, onOpenSearch }) => {
  const { userProfile, unreadNotifications, unreadMessages } = useAuth();

  const navItems: Array<{
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'capshots', label: 'Capshots', icon: PlaySquare },
    { id: 'friends', label: 'Friends', icon: Users },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      badge: unreadNotifications,
    },
    { id: 'menu', label: 'Menu (All Shortcuts)', icon: Menu },
    { id: 'bedit', label: 'B-Edit Studio', icon: Scissors },
    { id: 'bshop', label: 'B-Shop Marketplace', icon: ShoppingBag },
    { id: 'me', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-white/[0.08] p-4 justify-between">
      <div className="space-y-1.5">
        {userProfile && (
          <button
            onClick={() => onChangeTab('me')}
            className="w-full mb-3 p-3 rounded-2xl bg-[#1E1E26] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-3 text-left transition-colors"
          >
            <Avatar
              src={userProfile.avatarUrl}
              name={userProfile.displayName}
              size="md"
              isOnline={true}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                @{userProfile.username}
              </p>
            </div>
          </button>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#4A90E2]/20 text-white border border-[#4A90E2]/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#4A90E2]' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={onOpenMessages}
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors whitespace-nowrap"
        >
          <span className="flex items-center gap-3">
            <Send className="w-5 h-5 text-slate-400" />
            <span>Direct Messages</span>
          </span>
          {unreadMessages > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold tabular-nums">
              {unreadMessages}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSearch}
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors whitespace-nowrap"
        >
          <Search className="w-5 h-5 text-slate-400" />
          <span>Explore & Search</span>
        </button>
      </div>

      {userProfile && (
        <div className="p-3.5 rounded-2xl bg-[#1E1E26] border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Creator Standing</span>
            <span className="text-[#4A90E2] font-semibold tabular-nums">
              {userProfile.xp} XP
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Boost Points</span>
            <span className="text-purple-400 font-semibold tabular-nums">
              {userProfile.email?.trim().toLowerCase() ===
              'princeabba96@gmail.com'
                ? '∞ Unlimited BP'
                : `${(userProfile.boostPoints || 0).toLocaleString()} BP`}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
