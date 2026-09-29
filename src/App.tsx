import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { AuthProvider, useAuth } from './state/AuthContext';
import { MainTab, PostItem, UserProfile } from './types';
import {
  TopNavigationBar,
  BottomNavigationBar,
  DesktopLeftRail,
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
import { CommentsDrawer } from './components/CommentsDrawer';
import { ShareModal } from './components/ShareModal';
import { SearchModal } from './components/SearchModal';
import { MessagesModal } from './components/MessagesModal';

const BoostHubAppShell: React.FC = () => {
  const { userProfile, loading, isOffline, toasts } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [profileInitialMode, setProfileInitialMode] = useState<
    'profile' | 'dashboard' | 'gifts' | 'settings' | 'admin'
  >('profile');
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
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as MainTab | null;
    if (
      tabParam &&
      [
        'home',
        'capshots',
        'friends',
        'bshop',
        'create',
        'notifications',
        'me',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }

    if ('serviceWorker' in navigator && window.self === window.top) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'PUSH_NOTIFICATION_CLICK') {
          const targetUrl = String(event.data?.data?.url || '');
          if (targetUrl.includes('tab=friends')) {
            setActiveTab('friends');
          } else {
            setActiveTab('notifications');
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, []);

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
    }
    if (tab === 'bshop') {
      setBshopRecipient(null);
    }
    setActiveTab(tab);
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

          {activeTab === 'notifications' && (
            <NotificationsScreen onSelectUser={handleSelectUser} />
          )}

          {activeTab === 'me' && (
            <ProfileScreen
              viewedUserId={viewedUserId}
              initialMainMode={profileInitialMode}
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
