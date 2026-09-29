import React from 'react';
import {
  Home,
  PlaySquare,
  Users,
  PlusSquare,
  Bell,
  User,
  Search,
  MessageSquare,
} from 'lucide-react';
import { MainTab } from '../types';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';

interface NavigationProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenSearch: () => void;
  onOpenMessages: () => void;
}

export const TopNavigationBar: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  onOpenSearch,
  onOpenMessages,
}) => {
  const { userProfile, unreadNotifications, unreadMessages } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#060813]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between">
      {/* Zone 1: Single text element Brand wordmark */}
      <button
        onClick={() => onChangeTab('home')}
        className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap"
      >
        BoostHub
      </button>

      {/* Zone 2: 5 clean text navigation links on desktop */}
      <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => onChangeTab('home')}
          className={`py-1 transition-colors whitespace-nowrap ${
            activeTab === 'home'
              ? 'text-white underline underline-offset-8 decoration-blue-500 decoration-2'
              : 'hover:text-white'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => onChangeTab('capshots')}
          className={`py-1 transition-colors whitespace-nowrap ${
            activeTab === 'capshots'
              ? 'text-white underline underline-offset-8 decoration-blue-500 decoration-2'
              : 'hover:text-white'
          }`}
        >
          Capshots
        </button>
        <button
          onClick={() => onChangeTab('friends')}
          className={`py-1 transition-colors whitespace-nowrap ${
            activeTab === 'friends'
              ? 'text-white underline underline-offset-8 decoration-blue-500 decoration-2'
              : 'hover:text-white'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => onChangeTab('create')}
          className={`py-1 transition-colors whitespace-nowrap ${
            activeTab === 'create'
              ? 'text-white underline underline-offset-8 decoration-blue-500 decoration-2'
              : 'hover:text-white'
          }`}
        >
          Create
        </button>
        <button
          onClick={() => onChangeTab('notifications')}
          className={`py-1 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'text-white underline underline-offset-8 decoration-blue-500 decoration-2'
              : 'hover:text-white'
          }`}
        >
          <span>Notifications</span>
          {unreadNotifications > 0 && (
            <span className="text-xs text-blue-400 tabular-nums">
              ({unreadNotifications})
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: Search, Messages, and User Account Profile Picture */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          aria-label="Global Search"
        >
          <Search className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Search</span>
        </button>

        <button
          onClick={onOpenMessages}
          className="relative min-h-[40px] px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          aria-label="Direct Messages"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Messages</span>
          {unreadMessages > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-pink-500 text-[10px] font-bold text-white tabular-nums">
              {unreadMessages}
            </span>
          )}
        </button>

        {userProfile && (
          <button
            onClick={() => onChangeTab('me')}
            title={`${userProfile.displayName} (@${userProfile.username})`}
            className="ml-1 rounded-full ring-2 ring-blue-500/40 hover:ring-blue-400 transition-all"
          >
            <Avatar
              src={userProfile.avatarUrl}
              name={userProfile.displayName}
              size="sm"
              isOnline={true}
            />
          </button>
        )}
      </div>
    </header>
  );
};

export const BottomNavigationBar: React.FC<{
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}> = ({ activeTab, onChangeTab }) => {
  const { userProfile, unreadNotifications } = useAuth();

  const items: Array<{
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'capshots', label: 'Capshots', icon: PlaySquare },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'create', label: 'Create', icon: PlusSquare },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      badge: unreadNotifications,
    },
    { id: 'me', label: 'Me', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-15 bg-[#080C1A]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-6 items-center px-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`relative min-h-[44px] flex flex-col items-center justify-center transition-colors ${
              isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {item.id === 'me' && userProfile?.avatarUrl ? (
                <Avatar
                  src={userProfile.avatarUrl}
                  name={userProfile.displayName}
                  size="xs"
                />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center tabular-nums">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
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
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'capshots', label: 'Capshots', icon: PlaySquare },
    { id: 'friends', label: 'Friends & Communities', icon: Users },
    { id: 'create', label: 'Create Post', icon: PlusSquare },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications,
    },
    { id: 'me', label: 'My Profile & Studio', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-white/[0.08] p-4 justify-between">
      <div className="space-y-1.5">
        {userProfile && (
          <button
            onClick={() => onChangeTab('me')}
            className="w-full mb-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] flex items-center gap-3 text-left transition-colors"
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
                  ? 'bg-gradient-to-r from-blue-600/25 to-purple-600/20 text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-semibold tabular-nums">
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
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <span>Direct Messages</span>
          </span>
          {unreadMessages > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold tabular-nums">
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
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Creator Standing</span>
            <span className="text-blue-400 font-semibold tabular-nums">
              {userProfile.xp} XP
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Boost Points</span>
            <span className="text-purple-400 font-semibold tabular-nums">
              {userProfile.boostPoints} BP
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
