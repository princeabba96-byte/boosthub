import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff } from 'lucide-react';
import { AuthProvider, useAuth } from './state/AuthContext';
import { MainTab, NotificationItem, PostItem, UserProfile } from './types';
import { apiFetch } from './services/api';
import { supabase } from './lib/supabase';

/*
-- RUN THIS SQL IN SUPABASE DASHBOARD SQL EDITOR:
drop table if exists push_subscriptions;
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  subscription jsonb,
  created_at timestamp default now(),
  unique(user_id, endpoint)
);
alter table push_subscriptions enable row level security;
drop policy if exists "Allow all for push" on push_subscriptions;
create policy "Allow all for push" on push_subscriptions for all using (true) with check (true);
*/
import {
  TopNavigationBar,
  BottomNavigationBar,
  DesktopLeftRail,
  CreateBottomSheetModal,
} from './navigation/Navigation';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CapshotsScreen } from './screens/CapshotsScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BShopScreen } from './screens/BShopScreen';
import { MenuScreen } from './screens/MenuScreen';
import { BEditStudioScreen } from './screens/BEditStudioScreen';
import { CommentsDrawer } from './components/CommentsDrawer';
import { ShareModal } from './components/ShareModal';
import { SearchModal } from './components/SearchModal';
import { MessagesModal } from './components/MessagesModal';

const BoostHubAppShell: React.FC = () => {
  const { userProfile, loading, isOffline, toasts } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [profileInitialMode, setProfileInitialMode] = useState<
    'profile' | 'dashboard' | 'gifts' | 'settings' | 'admin'
  >('profile');
  const [profileInitialContentTab, setProfileInitialContentTab] = useState<
    'posts' | 'videos' | 'photos' | 'liked' | 'saved' | 'about'
  >('posts');
  const [profileInitialSettingsSubMenu, setProfileInitialSettingsSubMenu] =
    useState<'general' | 'notifications'>('general');
  const [bshopRecipient, setBshopRecipient] = useState<UserProfile | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<PostItem | null>(
    null
  );
  const [activeSharePost, setActiveSharePost] = useState<PostItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagePartner, setMessagePartner] = useState<UserProfile | null>(null);

  useEffect(() => {
    supabase.rpc('create_push_table_if_not_exists').then(
      () => {},
      () => {}
    );
  }, []);

  const openDeepLinkDestination = useCallback(
    async (opts: {
      url?: string;
      type?: string;
      entityId?: string;
      actorId?: string;
    }) => {
      const parsedParams = new URLSearchParams(
        opts.url && opts.url.includes('?')
          ? opts.url.slice(opts.url.indexOf('?'))
          : window.location.search
      );

      const postParam =
        parsedParams.get('post') ||
        (opts.type === 'like' ||
        opts.type === 'comment' ||
        opts.type === 'reply' ||
        opts.type === 'mention' ||
        opts.type === 'share'
          ? opts.entityId
          : null);
      const profileParam =
        parsedParams.get('profile') ||
        (opts.type === 'follow' ? opts.actorId || opts.entityId : null);
      const messagesParam =
        parsedParams.get('messages') ||
        (opts.type === 'message' || opts.type === 'boost_bot'
          ? opts.actorId || opts.entityId
          : null);
      const modeParam =
        parsedParams.get('mode') || (opts.type === 'gift' ? 'gifts' : null);
      const tabParam = parsedParams.get('tab') as MainTab | null;

      if (messagesParam) {
        try {
          const partner = await apiFetch<UserProfile>(
            `/api/profiles/${encodeURIComponent(messagesParam)}`
          );
          if (partner) {
            setMessagePartner(partner);
          }
        } catch {
          setMessagePartner(null);
        }
        setMessagesOpen(true);
        return;
      }

      if (profileParam) {
        setViewedUserId(profileParam);
        setProfileInitialMode('profile');
        setActiveTab('me');
        return;
      }

      if (modeParam === 'gifts') {
        setViewedUserId(null);
        setProfileInitialMode('gifts');
        setActiveTab('me');
        return;
      }

      if (postParam) {
        setActiveTab('home');
        try {
          const posts = await apiFetch<PostItem[]>('/api/posts?tab=new&limit=100');
          const found = (posts || []).find(
            (p) => String(p.id) === String(postParam)
          );
          if (found) {
            if (found.postType === 'capshot' && !parsedParams.get('comments')) {
              setActiveTab('capshots');
            }
            setActiveCommentPost(found);
          }
        } catch {
          // ignore
        }
        return;
      }

      if (
        opts.type === 'friend_request' ||
        opts.type === 'friend_accept' ||
        tabParam === 'friends'
      ) {
        setActiveTab('friends');
        return;
      }

      if (
        window.location.pathname.endsWith('/edit') ||
        window.location.hash === '#/edit'
      ) {
        setActiveTab('bedit');
        return;
      }

      if (
        tabParam &&
        [
          'home',
          'capshots',
          'friends',
          'bshop',
          'create',
          'bedit',
          'notifications',
          'menu',
          'me',
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      } else if (opts.type) {
        setActiveTab('notifications');
      }
    },
    []
  );

  useEffect(() => {
    openDeepLinkDestination({ url: window.location.search });

    if ('serviceWorker' in navigator && window.self === window.top) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'PUSH_NOTIFICATION_CLICK') {
          const payloadData = event.data?.data || {};
          openDeepLinkDestination({
            url: String(payloadData.url || ''),
            type: String(payloadData.type || ''),
            entityId: String(payloadData.entityId || ''),
            actorId: String(payloadData.actorId || ''),
          });
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [openDeepLinkDestination]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
          <p className="font-display text-lg font-bold tracking-tight">
            BoostHub
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <AuthScreen />;
  }

  if (!userProfile.onboardingCompleted) {
    return <OnboardingScreen />;
  }

  const handleSelectUser = (userId: string) => {
    setViewedUserId(userId);
    setProfileInitialMode('profile');
    setActiveTab('me');
  };

  const handleChangeTab = (tab: MainTab) => {
    if (tab === 'me') {
      setViewedUserId(null);
      setProfileInitialMode('profile');
      setProfileInitialContentTab('posts');
    }
    if (tab === 'bshop') {
      setBshopRecipient(null);
    }
    if (tab === 'bedit') {
      window.history.replaceState({}, '', '#/edit');
    } else if (window.location.hash === '#/edit') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setActiveTab(tab);
  };

  const handleOpenMyProfileFromMenu = (options?: {
    mainMode?: 'profile' | 'dashboard' | 'gifts' | 'settings' | 'admin';
    contentTab?: 'posts' | 'videos' | 'photos' | 'liked' | 'saved' | 'about';
    settingsSubMenu?: 'general' | 'notifications';
  }) => {
    setViewedUserId(null);
    setProfileInitialMode(options?.mainMode || 'profile');
    setProfileInitialContentTab(options?.contentTab || 'posts');
    setProfileInitialSettingsSubMenu(options?.settingsSubMenu || 'general');
    setActiveTab('me');
  };

  return (
    <div className="min-h-screen bg-[#060813] text-[#F8FAFC] flex flex-col pb-16 lg:pb-0">
      {/* Offline Resilience Banner */}
      {isOffline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            You are currently offline. Viewing cached content — actions will
            synchronize automatically when reconnected.
          </span>
        </div>
      )}

      {/* Top Bar Contract */}
      <TopNavigationBar
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
        onOpenSearch={() => {
          setSearchInitialQuery('');
          setSearchOpen(true);
        }}
        onOpenMessages={() => {
          setMessagePartner(null);
          setMessagesOpen(true);
        }}
        onOpenCreateSheet={() => setCreateSheetOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex">
        <DesktopLeftRail
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          onOpenMessages={() => {
            setMessagePartner(null);
            setMessagesOpen(true);
          }}
          onOpenSearch={() => {
            setSearchInitialQuery('');
            setSearchOpen(true);
          }}
        />

        <main className="flex-1 min-w-0">
          {activeTab === 'home' && (
            <HomeScreen
              onOpenComments={(post) => setActiveCommentPost(post)}
              onOpenShare={(post) => setActiveSharePost(post)}
              onSelectUser={handleSelectUser}
              onChangeTab={handleChangeTab}
              onSelectHashtag={(tag) => {
                setSearchInitialQuery(tag);
                setSearchOpen(true);
              }}
            />
          )}

          {activeTab === 'capshots' && (
            <CapshotsScreen
              onOpenComments={(post) => setActiveCommentPost(post)}
              onOpenShare={(post) => setActiveSharePost(post)}
              onSelectUser={handleSelectUser}
              onChangeTab={handleChangeTab}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsScreen
              onSelectUser={handleSelectUser}
              onOpenMessageWith={(partner) => {
                setMessagePartner(partner);
                setMessagesOpen(true);
              }}
            />
          )}

          {activeTab === 'bshop' && (
            <BShopScreen
              initialRecipient={bshopRecipient}
              onSelectUser={handleSelectUser}
              onGoToMyGifts={() => {
                setViewedUserId(null);
                setProfileInitialMode('gifts');
                setActiveTab('me');
              }}
            />
          )}

          {activeTab === 'create' && (
            <CreatePostScreen
              onPostCreated={() => {
                setActiveTab('home');
              }}
            />
          )}

          {activeTab === 'bedit' && (
            <BEditStudioScreen
              onPublished={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setActiveTab('capshots');
              }}
              onBack={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setActiveTab('home');
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsScreen
              onSelectUser={handleSelectUser}
              onOpenNotification={(notif: NotificationItem) => {
                openDeepLinkDestination({
                  type: notif.type,
                  entityId: notif.entityId,
                  actorId: notif.actorId || undefined,
                });
              }}
            />
          )}

          {activeTab === 'menu' && (
            <div className="max-w-2xl mx-auto px-4 py-5">
              <MenuScreen
                onNavigateTab={handleChangeTab}
                onOpenMyProfile={handleOpenMyProfileFromMenu}
                onOpenSearch={() => {
                  setSearchInitialQuery('');
                  setSearchOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === 'me' && (
            <ProfileScreen
              viewedUserId={viewedUserId}
              initialMainMode={profileInitialMode}
              initialContentTab={profileInitialContentTab}
              initialSettingsSubMenu={profileInitialSettingsSubMenu}
              onBackToMyProfile={() => {
                setViewedUserId(null);
                setProfileInitialMode('profile');
              }}
              onSelectUser={handleSelectUser}
              onOpenComments={(post) => setActiveCommentPost(post)}
              onOpenShare={(post) => setActiveSharePost(post)}
              onOpenMessageWith={(partner) => {
                setMessagePartner(partner);
                setMessagesOpen(true);
              }}
              onOpenBShop={(recipient) => {
                setBshopRecipient(recipient || null);
                setActiveTab('bshop');
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomNavigationBar
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
      />

      {/* Create (+) Bottom Sheet Modal */}
      <CreateBottomSheetModal
        isOpen={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onSelectNewCapshot={() => handleChangeTab('create')}
        onSelectBEditStudio={() => handleChangeTab('bedit')}
      />

      {/* Instant Comments Drawer */}
      {activeCommentPost && (
        <CommentsDrawer
          post={activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          onSelectUser={handleSelectUser}
        />
      )}

      {/* Share Modal */}
      {activeSharePost && (
        <ShareModal
          post={activeSharePost}
          onClose={() => setActiveSharePost(null)}
        />
      )}

      {/* Global Search Modal */}
      {searchOpen && (
        <SearchModal
          initialQuery={searchInitialQuery}
          onClose={() => setSearchOpen(false)}
          onSelectUser={handleSelectUser}
          onSelectPost={(post) => {
            if (post.postType === 'capshot') {
              setActiveTab('capshots');
            } else {
              setActiveCommentPost(post);
            }
          }}
        />
      )}

      {/* Real-Time Direct Messages Modal */}
      {messagesOpen && (
        <MessagesModal
          initialPartner={messagePartner}
          onClose={() => setMessagesOpen(false)}
        />
      )}

      {/* Non-Blocking Toast Notifications */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border backdrop-blur-md pointer-events-auto ${
              t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : t.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : 'bg-[#111830]/95 border-blue-500/30 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BoostHubAppShell />
    </AuthProvider>
  );
}
