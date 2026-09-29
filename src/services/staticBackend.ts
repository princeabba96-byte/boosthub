import {
  BShopUserState,
  CommentItem,
  CommunityItem,
  ConversationSummary,
  DirectMessageItem,
  MissionItem,
  NotificationItem,
  PostItem,
  StoryItem,
  UserProfile,
} from '../types';
import {
  BSHOP_CATALOG,
  GIFT_ITEMS_ONLY,
  getBShopItemByCode,
  rollMysteryBoxReward,
} from '../data/bshopCatalog';
import { showBrowserSystemNotification } from './pushNotifications';

const STATIC_DB_KEY = 'boosthub_static_db_v1';

interface StaticGiftTx {
  id: number;
  senderId: string;
  receiverId: string;
  itemCode: string;
  quantity: number;
  bpSpent: number;
  recognitionEarned: number;
  message: string;
  createdAt: string;
}

interface StaticDbState {
  users: Record<string, UserProfile & { password?: string }>;
  posts: PostItem[];
  comments: Record<number, CommentItem[]>;
  stories: StoryItem[];
  messages: DirectMessageItem[];
  notifications: NotificationItem[];
  communities: CommunityItem[];
  missions: MissionItem[];
  savedPostIds: Record<string, number[]>;
  likedPostIds: Record<string, number[]>;
  follows: Record<string, string[]>;
  blockedUsers: Record<string, string[]>;
  shopInventory?: Record<
    string,
    Array<{ itemCode: string; category: string; quantity: number }>
  >;
  giftTransactions?: StaticGiftTx[];
  reports: Array<{
    id: number;
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
}

const BOOST_BOT_PROFILE: UserProfile = {
  id: 'boost_bot_official',
  email: 'bot@boosthub.app',
  username: 'boost_bot',
  displayName: 'BOOST BOT',
  avatarUrl:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
  bio: 'Official BoostHub System & Community Broadcast Bot',
  role: 'admin',
  isAdmin: true,
  isVerified: true,
  onboardingCompleted: true,
  joinReason: 'Community Support',
  wantToWatch: 'Creators',
  wantToCreate: 'Updates',
  xp: 99990,
  boostPoints: 50000,
  whoCanMessage: 'everyone',
  commentControl: 'everyone',
  isPrivate: false,
  notificationsEnabled: true,
  interests: ['Technology', 'Creators', 'Community'],
  followersCount: 14200,
  followingCount: 12,
  friendsCount: 520,
  likesReceivedCount: 48200,
  sharesReceivedCount: 9100,
  viewsReceivedCount: 195000,
  postsCount: 24,
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
};

function createInitialStaticDb(): StaticDbState {
  const now = Date.now();
  const demoUsers: Record<string, UserProfile & { password?: string }> = {
    boost_bot_official: BOOST_BOT_PROFILE,
    creator_maya: {
      id: 'creator_maya',
      email: 'maya@boosthub.app',
      username: 'mayavibes',
      displayName: 'Maya Lin',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
      bio: 'Digital filmmaker, neon aesthetics & daily Capshots creator',
      role: 'creator',
      isAdmin: false,
      isVerified: true,
      onboardingCompleted: true,
      joinReason: 'Share short films',
      wantToWatch: 'Art & Music',
      wantToCreate: 'Capshots',
      xp: 3450,
      boostPoints: 1280,
      whoCanMessage: 'everyone',
      commentControl: 'everyone',
      isPrivate: false,
      notificationsEnabled: true,
      interests: ['Art', 'Music', 'Movies', 'Creators'],
      followersCount: 2840,
      followingCount: 310,
      friendsCount: 145,
      likesReceivedCount: 19400,
      sharesReceivedCount: 2100,
      viewsReceivedCount: 84000,
      postsCount: 12,
      createdAt: new Date(now - 86400000 * 14).toISOString(),
    },
    creator_devon: {
      id: 'creator_devon',
      email: 'devon@boosthub.app',
      username: 'devontech',
      displayName: 'Devon Brooks',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
      bio: 'Building next-gen setups, AI workflows & coding streams',
      role: 'creator',
      isAdmin: false,
      isVerified: true,
      onboardingCompleted: true,
      joinReason: 'Connect with builders',
      wantToWatch: 'Technology & Gaming',
      wantToCreate: 'Tech breakdowns',
      xp: 2890,
      boostPoints: 940,
      whoCanMessage: 'everyone',
      commentControl: 'everyone',
      isPrivate: false,
      notificationsEnabled: true,
      interests: ['Technology', 'Gaming', 'Business'],
      followersCount: 1920,
      followingCount: 240,
      friendsCount: 98,
      likesReceivedCount: 12300,
      sharesReceivedCount: 1450,
      viewsReceivedCount: 52000,
      postsCount: 8,
      createdAt: new Date(now - 86400000 * 10).toISOString(),
    },
    creator_zara: {
      id: 'creator_zara',
      email: 'zara@boosthub.app',
      username: 'zaramoves',
      displayName: 'Zara Okafor',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
      bio: 'Streetwear, Afrobeats dance & global travel diaries',
      role: 'creator',
      isAdmin: false,
      isVerified: true,
      onboardingCompleted: true,
      joinReason: 'Grow creative community',
      wantToWatch: 'Fashion & Music',
      wantToCreate: 'Dance & Travel',
      xp: 4120,
      boostPoints: 1650,
      whoCanMessage: 'everyone',
      commentControl: 'everyone',
      isPrivate: false,
      notificationsEnabled: true,
      interests: ['Fashion', 'Music', 'Travel', 'Lifestyle'],
      followersCount: 4190,
      followingCount: 412,
      friendsCount: 210,
      likesReceivedCount: 31200,
      sharesReceivedCount: 4300,
      viewsReceivedCount: 112000,
      postsCount: 15,
      createdAt: new Date(now - 86400000 * 20).toISOString(),
    },
  };

  const posts: PostItem[] = [
    {
      id: 101,
      userId: 'creator_maya',
      postType: 'photo',
      caption:
        'Late night studio session editing the new neon city reel. Drop your current creative project below! #creators #filmmaking #boosthub',
      mediaUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&auto=format&fit=crop&q=80',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      hashtags: '#creators #filmmaking #boosthub',
      category: 'Art',
      linkUrl: '',
      viewsCount: 1840,
      watchDurationTotal: 9200,
      completionRateSum: 1400,
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      author: {
        id: 'creator_maya',
        username: 'mayavibes',
        displayName: 'Maya Lin',
        avatarUrl: demoUsers.creator_maya.avatarUrl,
        isVerified: true,
        role: 'creator',
      },
      likesCount: 248,
      commentsCount: 2,
      sharesCount: 34,
      savesCount: 61,
      isLiked: false,
      isSaved: false,
      isFollowingAuthor: true,
    },
    {
      id: 102,
      userId: 'creator_devon',
      postType: 'photo',
      caption:
        'Minimalist desk upgrade for 2026. Clean code, fast builds, zero distractions. #setup #technology #coding',
      mediaUrl:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=80',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      hashtags: '#setup #technology #coding',
      category: 'Technology',
      linkUrl: '',
      viewsCount: 1290,
      watchDurationTotal: 6400,
      completionRateSum: 980,
      createdAt: new Date(now - 3600000 * 5).toISOString(),
      author: {
        id: 'creator_devon',
        username: 'devontech',
        displayName: 'Devon Brooks',
        avatarUrl: demoUsers.creator_devon.avatarUrl,
        isVerified: true,
        role: 'creator',
      },
      likesCount: 192,
      commentsCount: 1,
      sharesCount: 27,
      savesCount: 84,
      isLiked: false,
      isSaved: false,
      isFollowingAuthor: false,
    },
    {
      id: 103,
      userId: 'creator_zara',
      postType: 'capshot',
      caption:
        'Golden hour rooftop motion check in Lagos! Tap like if you are grinding on your goals today #capshots #dance #lifestyle',
      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
      hashtags: '#capshots #dance #lifestyle',
      category: 'Lifestyle',
      linkUrl: '',
      viewsCount: 4320,
      watchDurationTotal: 32000,
      completionRateSum: 3600,
      createdAt: new Date(now - 3600000 * 8).toISOString(),
      author: {
        id: 'creator_zara',
        username: 'zaramoves',
        displayName: 'Zara Okafor',
        avatarUrl: demoUsers.creator_zara.avatarUrl,
        isVerified: true,
        role: 'creator',
      },
      likesCount: 615,
      commentsCount: 1,
      sharesCount: 92,
      savesCount: 140,
      isLiked: false,
      isSaved: false,
      isFollowingAuthor: true,
    },
  ];

  const stories: StoryItem[] = [
    {
      id: 201,
      userId: 'creator_maya',
      mediaUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80',
      mediaType: 'photo',
      caption: 'Behind the scenes on tonight’s shoot!',
      expiresAt: new Date(now + 86400000).toISOString(),
      createdAt: new Date(now - 3600000).toISOString(),
      author: {
        id: 'creator_maya',
        username: 'mayavibes',
        displayName: 'Maya Lin',
        avatarUrl: demoUsers.creator_maya.avatarUrl,
      },
      viewsCount: 84,
      hasViewed: false,
      viewers: [],
      reactions: [],
      replies: [],
    },
    {
      id: 202,
      userId: 'creator_zara',
      mediaUrl:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80',
      mediaType: 'photo',
      caption: 'New collection preview dropping this weekend',
      expiresAt: new Date(now + 86400000).toISOString(),
      createdAt: new Date(now - 7200000).toISOString(),
      author: {
        id: 'creator_zara',
        username: 'zaramoves',
        displayName: 'Zara Okafor',
        avatarUrl: demoUsers.creator_zara.avatarUrl,
      },
      viewsCount: 142,
      hasViewed: false,
      viewers: [],
      reactions: [],
      replies: [],
    },
  ];

  const communities: CommunityItem[] = [
    {
      id: 301,
      name: 'Capshots Creators Club',
      description:
        'Share vertical video edits, transitions, lighting tips, and grow your audience together.',
      imageUrl:
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
      rules: '1. Be constructive\n2. Share original clips\n3. Support fellow creators',
      category: 'Creators',
      creatorId: 'creator_maya',
      createdAt: new Date(now - 86400000 * 7).toISOString(),
      membersCount: 1240,
      postsCount: 86,
      isMember: true,
      myRole: 'member',
    },
    {
      id: 302,
      name: 'Tech & Startup Builders',
      description:
        'Full-stack developers, founders, and designers shipping modern apps.',
      imageUrl:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
      rules: '1. Share what you are building\n2. Help debug\n3. No spam',
      category: 'Technology',
      creatorId: 'creator_devon',
      createdAt: new Date(now - 86400000 * 5).toISOString(),
      membersCount: 980,
      postsCount: 54,
      isMember: false,
      myRole: null,
    },
  ];

  const missions: MissionItem[] = [
    {
      id: 1,
      code: 'daily_post',
      title: 'Publish a Post or Capshot',
      description: 'Share a photo, video, or thought with the BoostHub community.',
      missionType: 'daily',
      targetAction: 'create_post',
      targetCount: 1,
      xpReward: 100,
      boostPointsReward: 50,
      progress: 0,
      completed: false,
      completedAt: null,
    },
    {
      id: 2,
      code: 'daily_engage',
      title: 'Spark 3 Conversations',
      description: 'Like or comment on 3 community posts today.',
      missionType: 'daily',
      targetAction: 'like_post',
      targetCount: 3,
      xpReward: 75,
      boostPointsReward: 30,
      progress: 1,
      completed: false,
      completedAt: null,
    },
  ];

  return {
    users: demoUsers,
    posts,
    comments: {
      101: [
        {
          id: 501,
          postId: 101,
          userId: 'creator_devon',
          parentId: null,
          content: 'The color grading on this shot is unreal!',
          isPinned: true,
          reactionsCount: 14,
          createdAt: new Date(now - 3600000).toISOString(),
          updatedAt: new Date(now - 3600000).toISOString(),
          author: {
            id: 'creator_devon',
            username: 'devontech',
            displayName: 'Devon Brooks',
            avatarUrl: demoUsers.creator_devon.avatarUrl,
            isVerified: true,
          },
        },
      ],
    },
    stories,
    messages: [],
    notifications: [],
    communities,
    missions,
    savedPostIds: {},
    likedPostIds: {},
    follows: {},
    blockedUsers: {},
    reports: [],
  };
}

const ADMIN_EMAIL = 'princeabba96@gmail.com';

const FREE_STARTER_GIFT_MESSAGES = new Set([
  'Keep inspiring the BoostHub community!',
  'Awesome Capshots today!',
  'Pure heat on the feed!',
  'Top tier creator energy.',
  'Love your posts!',
  'Welcome gift bundle for your collection!',
]);

function isStrictAdminEmail(email?: string): boolean {
  return String(email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

function sanitizeUsersAdminStatus(
  usersMap: Record<string, UserProfile & { password?: string }>,
  db?: StaticDbState
) {
  Object.values(usersMap).forEach((u) => {
    if (!u || u.id === 'boost_bot_official') return;
    if (isStrictAdminEmail(u.email)) {
      u.isAdmin = true;
      u.role = 'admin';
      u.isVerified = true;
      u.displayName = 'Prince Abba';
      u.username = 'Abba';
      u.boostPoints = 999999999;
      u.showcaseGifts = u.showcaseGifts || 'crown,diamond,rocket,trophy';
      u.giftsReceivedCount = Math.max(u.giftsReceivedCount || 0, 7992);
      u.giftRecognitionScore = Math.max(u.giftRecognitionScore || 0, 99999);
    } else {
      u.isAdmin = false;
      if (u.role === 'admin') {
        u.role = 'user';
      }
      // Strip any previously seeded free starter gifts from non-admin users
      if (db?.giftTransactions) {
        db.giftTransactions = db.giftTransactions.filter(
          (tx) =>
            tx.receiverId !== u.id || !FREE_STARTER_GIFT_MESSAGES.has(tx.message)
        );
      }
      const realReceived = (db?.giftTransactions || []).filter(
        (tx) => tx.receiverId === u.id
      );
      const realReceivedCount = realReceived.reduce(
        (sum, tx) => sum + (tx.quantity || 1),
        0
      );
      const realScore = realReceived.reduce(
        (sum, tx) => sum + (tx.recognitionEarned || 0),
        0
      );
      u.giftsReceivedCount = realReceivedCount;
      u.giftRecognitionScore = realScore;

      // Clean default showcase gifts if the user hasn't actually received or bought them
      const ownedSet = new Set<string>(
        (db?.shopInventory?.[u.id] || [])
          .filter((i) => i.quantity > 0)
          .map((i) => i.itemCode)
      );
      realReceived.forEach((tx) => {
        if (tx.quantity > 0) ownedSet.add(tx.itemCode);
      });
      if (u.showcaseGifts) {
        u.showcaseGifts = u.showcaseGifts
          .split(',')
          .map((c) => c.trim())
          .filter((c) => Boolean(c) && ownedSet.has(c))
          .join(',');
      }
      // Reset old free starter 3500 / 100 BP if the user hasn't earned it
      if (u.boostPoints === 3500 || u.boostPoints === 100) {
        u.boostPoints = 0;
      }
    }
  });
}

function loadStaticDb(): StaticDbState {
  if (typeof window === 'undefined') return createInitialStaticDb();
  try {
    const raw = window.localStorage.getItem(STATIC_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StaticDbState;
      if (parsed && parsed.users && parsed.posts) {
        if (!parsed.users.boost_bot_official) {
          parsed.users.boost_bot_official = BOOST_BOT_PROFILE;
        }
        sanitizeUsersAdminStatus(parsed.users, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore corrupted local storage
  }
  const initial = createInitialStaticDb();
  saveStaticDb(initial);
  return initial;
}

function saveStaticDb(db: StaticDbState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATIC_DB_KEY, JSON.stringify(db));
  } catch {
    // ignore storage quota errors
  }
}

function getUserIdFromToken(token: string | null, db: StaticDbState): string {
  if (token && token.startsWith('static_token_')) {
    const id = token.replace('static_token_', '');
    if (db.users[id]) return id;
  }
  const existingUser = Object.values(db.users).find(
    (u) => u.id !== 'boost_bot_official' && !u.id.startsWith('creator_')
  );
  if (existingUser) return existingUser.id;
  return 'creator_maya';
}

function ensureUserWelcomeMessages(userId: string, db: StaticDbState): void {
  const hasBotMsg = db.messages.some(
    (m) =>
      (m.senderId === 'boost_bot_official' && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === 'boost_bot_official')
  );
  if (!hasBotMsg) {
    const msg: DirectMessageItem = {
      id: Date.now() - 1000,
      senderId: 'boost_bot_official',
      receiverId: userId,
      content:
        'Welcome to BoostHub! Explore personalized feeds, watch Capshots, join creator communities, and connect with friends.',
      mediaUrl: '',
      mediaType: '',
      replyToId: null,
      sharedPostId: null,
      reaction: '',
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(msg);

    db.notifications.unshift({
      id: Date.now() - 999,
      userId,
      actorId: 'boost_bot_official',
      type: 'boost_bot',
      title: 'BOOST BOT',
      body: msg.content,
      entityId: 'boost_bot_official',
      isRead: false,
      createdAt: new Date().toISOString(),
      actor: BOOST_BOT_PROFILE,
    });
  }
}

export async function handleStaticBackendRequest<T = any>(
  rawPath: string,
  method: string,
  rawBody: any,
  token: string | null
): Promise<T> {
  const db = loadStaticDb();
  const urlObj = new URL(rawPath, 'https://boosthub.local');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;
  const body =
    typeof rawBody === 'string' && rawBody.trim()
      ? JSON.parse(rawBody)
      : rawBody || {};

  // 1. Auth Login / Signup
  if (pathname === '/api/auth/login' || pathname === '/api/auth/signup') {
    const email = String(body.email || 'user@boosthub.app')
      .trim()
      .toLowerCase();
    const isOwnerAdmin = isStrictAdminEmail(email);
    const existing = Object.values(db.users).find(
      (u) => u.email.toLowerCase() === email
    );

    const defaultAvatar =
      body.avatarUrl ||
      existing?.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80';

    if (existing) {
      if (body.avatarUrl) {
        existing.avatarUrl = body.avatarUrl;
      }
      if (isOwnerAdmin) {
        existing.isAdmin = true;
        existing.role = 'admin';
        existing.isVerified = true;
        existing.displayName = 'Prince Abba';
        existing.username = 'Abba';
        existing.boostPoints = 999999999;
        existing.showcaseGifts =
          existing.showcaseGifts || 'crown,diamond,rocket,trophy';
      } else {
        existing.isAdmin = false;
        if (existing.role === 'admin') {
          existing.role = 'user';
        }
      }
      sanitizeUsersAdminStatus(db.users, db);
      ensureUserWelcomeMessages(existing.id, db);
      saveStaticDb(db);
      return {
        token: `static_token_${existing.id}`,
        profile: existing,
        user: existing,
      } as unknown as T;
    }

    const userId = `user_${Date.now()}`;
    const username = isOwnerAdmin
      ? 'Abba'
      : String(body.username || email.split('@')[0] || 'boostuser')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || `user_${Math.floor(Math.random() * 9999)}`;
    const displayName = isOwnerAdmin
      ? 'Prince Abba'
      : String(
          body.displayName || body.username || email.split('@')[0] || 'BoostHub User'
        );

    const newUser: UserProfile & { password?: string } = {
      id: userId,
      email,
      username,
      displayName,
      avatarUrl: defaultAvatar,
      bio: isOwnerAdmin
        ? 'Primary Administrator of BoostHub'
        : 'Creating and connecting on BoostHub',
      role: isOwnerAdmin ? 'admin' : 'user',
      isAdmin: isOwnerAdmin,
      isVerified: isOwnerAdmin,
      onboardingCompleted: true,
      joinReason: 'Connect & Create',
      wantToWatch: 'Creators & Tech',
      wantToCreate: 'Capshots & Posts',
      xp: isOwnerAdmin ? 99990 : 0,
      boostPoints: isOwnerAdmin ? 999999999 : 0,
      showcaseGifts: isOwnerAdmin ? 'crown,diamond,rocket,trophy' : '',
      giftsReceivedCount: isOwnerAdmin ? 7992 : 0,
      giftRecognitionScore: isOwnerAdmin ? 99999 : 0,
      whoCanMessage: 'everyone',
      commentControl: 'everyone',
      isPrivate: false,
      notificationsEnabled: true,
      interests: ['Creators', 'Technology', 'Music'],
      followersCount: isOwnerAdmin ? 1450 : 0,
      followingCount: 4,
      friendsCount: 3,
      likesReceivedCount: isOwnerAdmin ? 4200 : 0,
      sharesReceivedCount: isOwnerAdmin ? 310 : 0,
      viewsReceivedCount: isOwnerAdmin ? 18500 : 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.users[userId] = newUser;
    ensureUserWelcomeMessages(userId, db);
    saveStaticDb(db);
    return {
      token: `static_token_${userId}`,
      profile: newUser,
      user: newUser,
    } as unknown as T;
  }

  if (pathname === '/api/auth/reset-password') {
    return { ok: true, message: 'Password updated successfully.' } as unknown as T;
  }

  const currentUserId = getUserIdFromToken(token, db);
  const currentUser = db.users[currentUserId] || db.users.creator_maya;

  if (!db.shopInventory) db.shopInventory = {};
  if (!db.giftTransactions) db.giftTransactions = [];

  const ensureAdminUnlimitedGiftsOnly = (uid: string) => {
    const targetUser = db.users[uid];
    if (!targetUser) return;
    const isOwner = isStrictAdminEmail(targetUser.email);
    if (!isOwner) {
      // Ordinary users NEVER get free starter gifts or free Boost Points
      return;
    }

    const hasAdminVault = db.giftTransactions!.some(
      (t) => t.receiverId === uid && t.itemCode === 'trophy' && t.quantity >= 999
    );
    if (!hasAdminVault) {
      const now = Date.now();
      const adminVaultTxs: StaticGiftTx[] = [
        {
          id: now - 8000,
          senderId: 'creator_maya',
          receiverId: uid,
          itemCode: 'trophy',
          quantity: 999,
          bpSpent: 10000,
          recognitionEarned: 3000,
          message: 'Primary Administrator Unlimited Gift Vault',
          createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
        },
        {
          id: now - 7000,
          senderId: 'creator_devon',
          receiverId: uid,
          itemCode: 'diamond',
          quantity: 999,
          bpSpent: 5000,
          recognitionEarned: 1400,
          message: 'Primary Administrator Unlimited Gift Vault',
          createdAt: new Date(now - 4 * 60 * 1000).toISOString(),
        },
        {
          id: now - 6000,
          senderId: 'creator_maya',
          receiverId: uid,
          itemCode: 'crown',
          quantity: 999,
          bpSpent: 2500,
          recognitionEarned: 650,
          message: 'Keep inspiring the BoostHub community!',
          createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
        },
        {
          id: now - 5000,
          senderId: 'creator_devon',
          receiverId: uid,
          itemCode: 'rocket',
          quantity: 999,
          bpSpent: 2000,
          recognitionEarned: 500,
          message: 'Awesome Capshots today!',
          createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
        },
        {
          id: now - 4000,
          senderId: 'creator_zara',
          receiverId: uid,
          itemCode: 'fire',
          quantity: 999,
          bpSpent: 1500,
          recognitionEarned: 375,
          message: 'Pure heat on the feed!',
          createdAt: new Date(now - 18 * 3600 * 1000).toISOString(),
        },
        {
          id: now - 3000,
          senderId: 'creator_maya',
          receiverId: uid,
          itemCode: 'star',
          quantity: 999,
          bpSpent: 1250,
          recognitionEarned: 300,
          message: 'Top tier creator energy.',
          createdAt: new Date(now - 26 * 3600 * 1000).toISOString(),
        },
        {
          id: now - 2000,
          senderId: 'creator_devon',
          receiverId: uid,
          itemCode: 'heart',
          quantity: 999,
          bpSpent: 800,
          recognitionEarned: 200,
          message: 'Love your posts!',
          createdAt: new Date(now - 36 * 3600 * 1000).toISOString(),
        },
        {
          id: now - 1000,
          senderId: 'creator_zara',
          receiverId: uid,
          itemCode: 'rose',
          quantity: 999,
          bpSpent: 600,
          recognitionEarned: 120,
          message: 'Admin Gift Collection!',
          createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
        },
      ];
      db.giftTransactions = [
        ...adminVaultTxs,
        ...(db.giftTransactions || []).filter((t) => t.receiverId !== uid),
      ];
    }

    targetUser.boostPoints = 999999999;
    targetUser.giftPrivacy = targetUser.giftPrivacy || 'public';
    targetUser.showcaseGifts =
      targetUser.showcaseGifts || 'crown,diamond,rocket,trophy';
    targetUser.giftsReceivedCount = Math.max(
      targetUser.giftsReceivedCount || 0,
      7992
    );
    targetUser.giftRecognitionScore = Math.max(
      targetUser.giftRecognitionScore || 0,
      99999
    );
    saveStaticDb(db);
  };

  const computePublicGiftCollection = (targetUid: string, viewerUid: string) => {
    ensureAdminUnlimitedGiftsOnly(targetUid);
    const targetProfile = db.users[targetUid];
    const isTargetAdmin = isStrictAdminEmail(targetProfile?.email);
    const privacy = targetProfile?.giftPrivacy || 'public';
    if (targetUid !== viewerUid && privacy !== 'public') {
      return [];
    }
    const counts: Record<string, number> = {};
    for (const tx of db.giftTransactions || []) {
      if (tx.receiverId === targetUid) {
        counts[tx.itemCode] = (counts[tx.itemCode] || 0) + (tx.quantity || 1);
      }
    }
    return GIFT_ITEMS_ONLY.map((g) => ({
      code: g.code,
      name: g.name,
      icon: g.icon,
      rarity: g.rarity,
      count: isTargetAdmin
        ? Math.max(counts[g.code] || 0, 999)
        : counts[g.code] || 0,
    })).filter((g) => g.count > 0);
  };

  // 2. Current User Profile
  if (pathname === '/api/me') {
    sanitizeUsersAdminStatus(db.users, db);
    ensureAdminUnlimitedGiftsOnly(currentUser.id);
    currentUser.publicGiftCollection = computePublicGiftCollection(
      currentUser.id,
      currentUser.id
    );
    saveStaticDb(db);
    return currentUser as unknown as T;
  }

  if (pathname === '/api/profile' || pathname === '/api/profiles/me') {
    const isOwnerAdmin = isStrictAdminEmail(currentUser.email);
    const updated: UserProfile = {
      ...currentUser,
      displayName: isOwnerAdmin
        ? 'Prince Abba'
        : (body.displayName ?? currentUser.displayName),
      username: isOwnerAdmin
        ? 'Abba'
        : (body.username ?? currentUser.username),
      role: isOwnerAdmin
        ? 'admin'
        : currentUser.role === 'admin'
          ? 'user'
          : currentUser.role,
      isAdmin: isOwnerAdmin,
      bio: body.bio ?? currentUser.bio,
      avatarUrl: body.avatarUrl ?? currentUser.avatarUrl,
      whoCanMessage: body.whoCanMessage ?? currentUser.whoCanMessage,
      commentControl: body.commentControl ?? currentUser.commentControl,
      isPrivate: body.isPrivate ?? currentUser.isPrivate,
      notificationsEnabled:
        body.notificationsEnabled ?? currentUser.notificationsEnabled,
    };
    db.users[currentUser.id] = updated;
    // Update author snapshot on user's posts
    db.posts.forEach((p) => {
      if (p.userId === updated.id) {
        p.author = {
          ...p.author,
          displayName: updated.displayName,
          username: updated.username,
          avatarUrl: updated.avatarUrl,
        };
      }
    });
    saveStaticDb(db);
    return updated as unknown as T;
  }

  if (pathname === '/api/onboarding') {
    const updated: UserProfile = {
      ...currentUser,
      onboardingCompleted: true,
      joinReason: body.joinReason || currentUser.joinReason,
      wantToWatch: body.wantToWatch || currentUser.wantToWatch,
      wantToCreate: body.wantToCreate || currentUser.wantToCreate,
      interests: Array.isArray(body.interests)
        ? body.interests
        : currentUser.interests,
    };
    db.users[currentUser.id] = updated;
    saveStaticDb(db);
    return updated as unknown as T;
  }

  // 3. Profiles by ID & Follow
  const profileFollowsMatch = pathname.match(/^\/api\/profiles\/([^/]+)\/follows$/);
  if (profileFollowsMatch) {
    const others = Object.values(db.users).filter(
      (u) => u.id !== profileFollowsMatch[1]
    );
    return {
      followers: others,
      following: others,
    } as unknown as T;
  }

  const profileFollowToggleMatch = pathname.match(
    /^\/api\/profiles\/([^/]+)\/follow$/
  );
  if (profileFollowToggleMatch && method === 'POST') {
    const targetId = profileFollowToggleMatch[1];
    const list = db.follows[currentUser.id] || [];
    const exists = list.includes(targetId);
    db.follows[currentUser.id] = exists
      ? list.filter((id) => id !== targetId)
      : [...list, targetId];
    saveStaticDb(db);
    return { following: !exists } as unknown as T;
  }

  const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);
  if (profileMatch) {
    const targetId = decodeURIComponent(profileMatch[1]);
    const found = db.users[targetId] || currentUser;
    const isFollowing = (db.follows[currentUser.id] || []).includes(found.id);
    return {
      ...found,
      publicGiftCollection: computePublicGiftCollection(
        found.id,
        currentUser.id
      ),
      isFollowing,
      friendshipStatus: 'friends',
    } as unknown as T;
  }

  // 3b. B-Shop & Gift Economy Endpoints
  const buildStaticBShopState = (uid: string): BShopUserState => {
    ensureAdminUnlimitedGiftsOnly(uid);
    const u = db.users[uid] || currentUser;
    const isOwnerAdmin = isStrictAdminEmail(u.email);
    const userInv = db.shopInventory![uid] || [];
    const invMap = new Map<string, number>();
    userInv.forEach((item) => {
      invMap.set(item.itemCode, (invMap.get(item.itemCode) || 0) + item.quantity);
    });

    const effectiveInventory = isOwnerAdmin
      ? BSHOP_CATALOG.filter((item) => item.category !== 'mystery_box').map(
          (item) => ({
            itemCode: item.code,
            category: item.category,
            quantity: item.category === 'gift' ? 999999 : 1,
          })
        )
      : userInv;

    const receivedTxs = (db.giftTransactions || []).filter(
      (t) => t.receiverId === uid
    );
    const sentTxs = (db.giftTransactions || []).filter((t) => t.senderId === uid);

    const giftCollection = GIFT_ITEMS_ONLY.map((giftItem) => {
      const matching = receivedTxs.filter((r) => r.itemCode === giftItem.code);
      const totalReceived = matching.reduce(
        (sum, r) => sum + (r.quantity || 1),
        0
      );
      const latest = matching[0];
      const latestSender = latest ? db.users[latest.senderId] : undefined;
      return {
        code: giftItem.code,
        name: giftItem.name,
        icon: giftItem.icon,
        rarity: giftItem.rarity,
        costBp: giftItem.costBp,
        receivedCount: isOwnerAdmin ? Math.max(totalReceived, 999) : totalReceived,
        ownedInInventoryCount: isOwnerAdmin
          ? 999999
          : invMap.get(giftItem.code) || 0,
        mostRecentSender: latestSender
          ? {
              id: latestSender.id,
              username: latestSender.username,
              displayName: latestSender.displayName,
              avatarUrl: latestSender.avatarUrl,
            }
          : null,
        lastReceivedAt: latest ? latest.createdAt : null,
      };
    });

    const giftActivity = [
      ...receivedTxs.map((r) => {
        const cat = getBShopItemByCode(r.itemCode);
        const sender = db.users[r.senderId] || BOOST_BOT_PROFILE;
        return {
          id: r.id,
          direction: 'received' as const,
          itemCode: r.itemCode,
          itemName: cat?.name || r.itemCode,
          itemIcon: cat?.icon || '🎁',
          itemRarity: cat?.rarity || 'Common',
          quantity: r.quantity,
          bpSpent: r.bpSpent,
          recognitionEarned: r.recognitionEarned,
          message: r.message || '',
          createdAt: r.createdAt,
          counterparty: {
            id: sender.id,
            username: sender.username,
            displayName: sender.displayName,
            avatarUrl: sender.avatarUrl,
          },
        };
      }),
      ...sentTxs
        .filter((s) => s.senderId !== s.receiverId)
        .map((s) => {
          const cat = getBShopItemByCode(s.itemCode);
          const receiver = db.users[s.receiverId] || BOOST_BOT_PROFILE;
          return {
            id: s.id,
            direction: 'sent' as const,
            itemCode: s.itemCode,
            itemName: cat?.name || s.itemCode,
            itemIcon: cat?.icon || '🎁',
            itemRarity: cat?.rarity || 'Common',
            quantity: s.quantity,
            bpSpent: s.bpSpent,
            recognitionEarned: s.recognitionEarned,
            message: s.message || '',
            createdAt: s.createdAt,
            counterparty: {
              id: receiver.id,
              username: receiver.username,
              displayName: receiver.displayName,
              avatarUrl: receiver.avatarUrl,
            },
          };
        }),
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const defaultShowcase = isOwnerAdmin ? 'crown,diamond,rocket,trophy' : '';
    const showcaseList = (u.showcaseGifts ?? defaultShowcase)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    return {
      boostPoints: isOwnerAdmin ? 999999999 : u.boostPoints || 0,
      xp: u.xp || 0,
      giftPrivacy: u.giftPrivacy || 'public',
      showcaseGifts: showcaseList,
      equippedFrame: u.equippedFrame || '',
      equippedBadge: u.equippedBadge || '',
      equippedNameStyle: u.equippedNameStyle || '',
      giftsReceivedCount: isOwnerAdmin
        ? Math.max(u.giftsReceivedCount || 0, 7992)
        : u.giftsReceivedCount || 0,
      giftRecognitionScore: isOwnerAdmin
        ? Math.max(u.giftRecognitionScore || 0, 99999)
        : u.giftRecognitionScore || 0,
      inventory: effectiveInventory,
      giftCollection,
      giftActivity: giftActivity.slice(0, 40),
    };
  };

  if (pathname === '/api/bshop/state') {
    return buildStaticBShopState(currentUser.id) as unknown as T;
  }

  if (pathname === '/api/bshop/buy' && method === 'POST') {
    ensureAdminUnlimitedGiftsOnly(currentUser.id);
    const isOwnerAdmin = isStrictAdminEmail(currentUser.email);
    const quantity = Math.max(1, Math.min(50, Number(body.quantity) || 1));
    const catalogItem = getBShopItemByCode(String(body.itemCode || ''));
    if (!catalogItem) {
      throw new Error('Selected item was not found in B-Shop.');
    }
    const totalCost = catalogItem.costBp * quantity;
    if (!isOwnerAdmin && (currentUser.boostPoints || 0) < totalCost) {
      throw new Error(
        `Not enough Boost Points! You need ${totalCost.toLocaleString()} BP (you have ${(currentUser.boostPoints || 0).toLocaleString()} BP). Earn BP by posting, liking, commenting, or completing missions!`
      );
    }

    let targetCode = catalogItem.code;
    let targetCategory = catalogItem.category;
    let targetQty = quantity;
    let unboxedReward: any = null;

    if (catalogItem.category === 'mystery_box') {
      const rolled = rollMysteryBoxReward();
      targetCode = rolled.item.code;
      targetCategory = rolled.item.category;
      targetQty = rolled.quantity * quantity;
      unboxedReward = {
        code: rolled.item.code,
        name: rolled.item.name,
        icon: rolled.item.icon,
        rarity: rolled.item.rarity,
        quantity: targetQty,
      };
    }

    currentUser.boostPoints = isOwnerAdmin
      ? 999999999
      : Math.max(0, (currentUser.boostPoints || 0) - totalCost);
    currentUser.xp = (currentUser.xp || 0) + 15 * quantity;

    if (targetCategory === 'frame') {
      currentUser.equippedFrame = targetCode;
    } else if (targetCategory === 'badge') {
      currentUser.equippedBadge = targetCode;
    } else if (targetCategory === 'name_style') {
      currentUser.equippedNameStyle = targetCode;
    }

    if (!isOwnerAdmin) {
      if (!db.shopInventory![currentUser.id]) {
        db.shopInventory![currentUser.id] = [];
      }
      const existingEntry = db.shopInventory![currentUser.id].find(
        (i) => i.itemCode === targetCode
      );
      if (existingEntry) {
        existingEntry.quantity =
          targetCategory === 'gift' ? existingEntry.quantity + targetQty : 1;
      } else {
        db.shopInventory![currentUser.id].push({
          itemCode: targetCode,
          category: targetCategory,
          quantity: targetCategory === 'gift' ? targetQty : 1,
        });
      }
    }

    db.users[currentUser.id] = currentUser;
    saveStaticDb(db);

    return {
      state: buildStaticBShopState(currentUser.id),
      unboxedReward,
      message: unboxedReward
        ? `Mystery Box opened! You unlocked ${unboxedReward.icon} ${unboxedReward.name} ×${unboxedReward.quantity}!`
        : targetCategory === 'gift'
          ? `Purchased ${catalogItem.icon} ${catalogItem.name} ×${quantity}! Added to your Gift Inventory.`
          : `Unlocked & equipped ${catalogItem.icon} ${catalogItem.name}!`,
    } as unknown as T;
  }

  if (pathname === '/api/bshop/send-gift' && method === 'POST') {
    ensureAdminUnlimitedGiftsOnly(currentUser.id);
    const isOwnerAdmin = isStrictAdminEmail(currentUser.email);
    const receiverId = String(body.receiverId || '');
    const itemCode = String(body.itemCode || '');
    const quantity = Math.max(1, Math.min(99, Number(body.quantity) || 1));
    const message = String(body.message || '').trim();
    const useInventory = Boolean(body.useInventory);

    const giftItem = getBShopItemByCode(itemCode);
    if (!giftItem || giftItem.category !== 'gift') {
      throw new Error('Please choose a valid virtual gift to send.');
    }
    const receiver = db.users[receiverId];
    if (!receiver) {
      throw new Error('Recipient creator was not found.');
    }

    if (!db.shopInventory![currentUser.id]) {
      db.shopInventory![currentUser.id] = [];
    }
    const invList = db.shopInventory![currentUser.id];
    const invEntry = invList.find((i) => i.itemCode === itemCode);
    const ownedQty = invEntry?.quantity || 0;

    if (!isOwnerAdmin) {
      if (useInventory && ownedQty >= quantity) {
        invEntry!.quantity -= quantity;
        if (invEntry!.quantity <= 0) {
          db.shopInventory![currentUser.id] = invList.filter(
            (i) => i.itemCode !== itemCode
          );
        }
      } else {
        const fromInv = useInventory ? Math.min(ownedQty, quantity) : 0;
        const toBuy = quantity - fromInv;
        const bpNeeded = giftItem.costBp * toBuy;
        if ((currentUser.boostPoints || 0) < bpNeeded) {
          throw new Error(
            `Not enough Boost Points! Sending ${giftItem.icon} ${giftItem.name} ×${quantity} requires ${bpNeeded.toLocaleString()} BP (you have ${(currentUser.boostPoints || 0).toLocaleString()} BP). Earn BP by posting, liking, commenting, or completing missions!`
          );
        }
        if (fromInv > 0) {
          db.shopInventory![currentUser.id] = invList.filter(
            (i) => i.itemCode !== itemCode
          );
        }
        currentUser.boostPoints = Math.max(
          0,
          (currentUser.boostPoints || 0) - bpNeeded
        );
        currentUser.xp = (currentUser.xp || 0) + 20 * quantity;
      }
    }

    const recognitionEarned = giftItem.recognitionPoints * quantity;
    const creatorXpEarned = giftItem.creatorXpBonus * quantity;

    db.giftTransactions!.unshift({
      id: Date.now(),
      senderId: currentUser.id,
      receiverId: receiver.id,
      itemCode: giftItem.code,
      quantity,
      bpSpent: giftItem.costBp * quantity,
      recognitionEarned,
      message: message.slice(0, 200),
      createdAt: new Date().toISOString(),
    });

    // Economy Rule: recipient receives recognition & Creator XP, not raw BP refund
    receiver.xp = (receiver.xp || 0) + creatorXpEarned;
    receiver.giftsReceivedCount = (receiver.giftsReceivedCount || 0) + quantity;
    receiver.giftRecognitionScore =
      (receiver.giftRecognitionScore || 0) + recognitionEarned;

    const pluralName =
      quantity > 1
        ? giftItem.name === 'Trophy'
          ? 'Trophies'
          : `${giftItem.name}s`
        : giftItem.name;
    const notifTitle = `${giftItem.icon} ${currentUser.displayName} sent you ${quantity > 1 ? `${quantity} ${pluralName}` : `a ${giftItem.name}`}`;
    const notifBody = message
      ? `"${message}" · +${recognitionEarned} Gift Recognition & +${creatorXpEarned} XP`
      : `Added to your Gift Collection (+${recognitionEarned} Gift Recognition & +${creatorXpEarned} XP)`;

    db.notifications.unshift({
      id: Date.now() + 1,
      userId: receiver.id,
      actorId: currentUser.id,
      type: 'badge',
      title: notifTitle,
      body: notifBody,
      entityId: currentUser.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      actor: currentUser,
    });

    db.users[currentUser.id] = currentUser;
    db.users[receiver.id] = receiver;
    saveStaticDb(db);

    return {
      state: buildStaticBShopState(currentUser.id),
      message: `Sent ${giftItem.icon} ${giftItem.name} ×${quantity} to ${receiver.displayName}!`,
    } as unknown as T;
  }

  if (pathname === '/api/bshop/settings' && method === 'PUT') {
    if (
      body.giftPrivacy &&
      ['public', 'showcase_only', 'private'].includes(body.giftPrivacy)
    ) {
      currentUser.giftPrivacy = body.giftPrivacy;
    }
    if (Array.isArray(body.showcaseGifts)) {
      currentUser.showcaseGifts = body.showcaseGifts
        .map((c: any) => String(c).trim())
        .filter((c: string) => Boolean(getBShopItemByCode(c)))
        .slice(0, 6)
        .join(',');
    }
    if (body.equippedFrame !== undefined) {
      currentUser.equippedFrame = body.equippedFrame;
    }
    if (body.equippedBadge !== undefined) {
      currentUser.equippedBadge = body.equippedBadge;
    }
    if (body.equippedNameStyle !== undefined) {
      currentUser.equippedNameStyle = body.equippedNameStyle;
    }
    db.users[currentUser.id] = currentUser;
    saveStaticDb(db);
    return buildStaticBShopState(currentUser.id) as unknown as T;
  }

  // 4. Posts & Capshots
  if (pathname === '/api/posts' && method === 'GET') {
    const authorId = searchParams.get('authorId');
    const liked = new Set(db.likedPostIds[currentUser.id] || []);
    const saved = new Set(db.savedPostIds[currentUser.id] || []);
    let list = db.posts.map((p) => ({
      ...p,
      author: db.users[p.userId]
        ? {
            id: db.users[p.userId].id,
            username: db.users[p.userId].username,
            displayName: db.users[p.userId].displayName,
            avatarUrl: db.users[p.userId].avatarUrl,
            isVerified: db.users[p.userId].isVerified,
            role: db.users[p.userId].role,
          }
        : p.author,
      isLiked: liked.has(p.id),
      isSaved: saved.has(p.id),
    }));
    if (authorId) {
      list = list.filter((p) => p.userId === authorId);
    }
    return list as unknown as T;
  }

  if (pathname === '/api/posts' && method === 'POST') {
    const newPost: PostItem = {
      id: Date.now(),
      userId: currentUser.id,
      postType: body.postType || 'photo',
      caption: body.caption || '',
      mediaUrl: body.mediaUrl || '',
      thumbnailUrl: body.thumbnailUrl || body.mediaUrl || '',
      hashtags: body.hashtags || '',
      category: body.category || 'Creators',
      linkUrl: body.linkUrl || '',
      viewsCount: 1,
      watchDurationTotal: 0,
      completionRateSum: 0,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
        role: currentUser.role,
      },
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      isLiked: false,
      isSaved: false,
      isFollowingAuthor: false,
    };
    db.posts.unshift(newPost);
    currentUser.postsCount = (currentUser.postsCount || 0) + 1;
    currentUser.xp = (currentUser.xp || 0) + 50;
    currentUser.boostPoints = isStrictAdminEmail(currentUser.email)
      ? 999999999
      : (currentUser.boostPoints || 0) + 25;
    db.missions.forEach((m) => {
      if (m.targetAction === 'create_post' && !m.completed) {
        m.progress = Math.min(m.targetCount, m.progress + 1);
        if (m.progress >= m.targetCount) {
          m.completed = true;
          m.completedAt = new Date().toISOString();
          currentUser.xp = (currentUser.xp || 0) + m.xpReward;
          if (!isStrictAdminEmail(currentUser.email)) {
            currentUser.boostPoints =
              (currentUser.boostPoints || 0) + m.boostPointsReward;
          }
        }
      }
    });
    db.users[currentUser.id] = currentUser;
    saveStaticDb(db);
    return newPost as unknown as T;
  }

  if (pathname === '/api/capshots') {
    const capshots = db.posts.filter(
      (p) => p.postType === 'capshot' || p.postType === 'video' || p.mediaUrl
    );
    return capshots as unknown as T;
  }

  if (pathname === '/api/saved-posts') {
    const saved = new Set(db.savedPostIds[currentUser.id] || []);
    return db.posts.filter((p) => saved.has(p.id)) as unknown as T;
  }

  const postActionMatch = pathname.match(
    /^\/api\/posts\/(\d+)\/(like|save|share|watch)$/
  );
  if (postActionMatch && method === 'POST') {
    const postId = Number(postActionMatch[1]);
    const action = postActionMatch[2];
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      if (action === 'like') {
        const list = db.likedPostIds[currentUser.id] || [];
        const has = list.includes(postId);
        db.likedPostIds[currentUser.id] = has
          ? list.filter((id) => id !== postId)
          : [...list, postId];
        post.likesCount = Math.max(0, post.likesCount + (has ? -1 : 1));
        post.isLiked = !has;
        if (!has) {
          currentUser.xp = (currentUser.xp || 0) + 5;
          if (!isStrictAdminEmail(currentUser.email)) {
            currentUser.boostPoints = (currentUser.boostPoints || 0) + 5;
          }
          db.missions.forEach((m) => {
            if (m.targetAction === 'like_post' && !m.completed) {
              m.progress = Math.min(m.targetCount, m.progress + 1);
              if (m.progress >= m.targetCount) {
                m.completed = true;
                m.completedAt = new Date().toISOString();
                currentUser.xp = (currentUser.xp || 0) + m.xpReward;
                if (!isStrictAdminEmail(currentUser.email)) {
                  currentUser.boostPoints =
                    (currentUser.boostPoints || 0) + m.boostPointsReward;
                }
              }
            }
          });
        }
      } else if (action === 'save') {
        const list = db.savedPostIds[currentUser.id] || [];
        const has = list.includes(postId);
        db.savedPostIds[currentUser.id] = has
          ? list.filter((id) => id !== postId)
          : [...list, postId];
        post.savesCount = Math.max(0, post.savesCount + (has ? -1 : 1));
        post.isSaved = !has;
      } else if (action === 'share') {
        post.sharesCount += 1;
        currentUser.xp = (currentUser.xp || 0) + 10;
        if (!isStrictAdminEmail(currentUser.email)) {
          currentUser.boostPoints = (currentUser.boostPoints || 0) + 10;
        }
      } else if (action === 'watch') {
        post.viewsCount += 1;
        currentUser.xp = (currentUser.xp || 0) + 5;
        if (!isStrictAdminEmail(currentUser.email)) {
          currentUser.boostPoints = (currentUser.boostPoints || 0) + 5;
        }
      }
      db.users[currentUser.id] = currentUser;
      saveStaticDb(db);
    }
    return { ok: true } as unknown as T;
  }

  const postCommentsMatch = pathname.match(/^\/api\/posts\/(\d+)\/comments$/);
  if (postCommentsMatch) {
    const postId = Number(postCommentsMatch[1]);
    if (method === 'GET') {
      return (db.comments[postId] || []) as unknown as T;
    }
    if (method === 'POST') {
      const created: CommentItem = {
        id: Date.now(),
        postId,
        userId: currentUser.id,
        parentId: body.parentId || null,
        content: String(body.content || ''),
        isPinned: false,
        reactionsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
          isVerified: currentUser.isVerified,
        },
      };
      db.comments[postId] = [...(db.comments[postId] || []), created];
      const post = db.posts.find((p) => p.id === postId);
      if (post) post.commentsCount += 1;
      currentUser.xp = (currentUser.xp || 0) + 10;
      if (!isStrictAdminEmail(currentUser.email)) {
        currentUser.boostPoints = (currentUser.boostPoints || 0) + 10;
      }
      db.users[currentUser.id] = currentUser;
      saveStaticDb(db);
      return created as unknown as T;
    }
  }

  const commentItemMatch = pathname.match(/^\/api\/comments\/(\d+)$/);
  if (commentItemMatch) {
    const commentId = Number(commentItemMatch[1]);
    Object.keys(db.comments).forEach((pid) => {
      const numPid = Number(pid);
      if (method === 'DELETE') {
        db.comments[numPid] = (db.comments[numPid] || []).filter(
          (c) => c.id !== commentId
        );
      } else if (method === 'PATCH' || method === 'PUT') {
        db.comments[numPid] = (db.comments[numPid] || []).map((c) =>
          c.id === commentId
            ? {
                ...c,
                content: body.content ?? c.content,
                isPinned: body.isPinned ?? c.isPinned,
              }
            : c
        );
      }
    });
    saveStaticDb(db);
    return { ok: true } as unknown as T;
  }

  // 5. Stories
  if (pathname === '/api/stories' && method === 'GET') {
    return db.stories as unknown as T;
  }

  if (pathname === '/api/stories' && method === 'POST') {
    const created: StoryItem = {
      id: Date.now(),
      userId: currentUser.id,
      mediaUrl:
        body.mediaUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
      mediaType: body.mediaType || 'photo',
      caption: body.caption || '',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
      },
      viewsCount: 1,
      hasViewed: false,
      viewers: [],
      reactions: [],
      replies: [],
    };
    db.stories.unshift(created);
    saveStaticDb(db);
    return created as unknown as T;
  }

  if (pathname.match(/^\/api\/stories\/\d+\/interact$/)) {
    return { ok: true } as unknown as T;
  }

  // 6. Friends & Communities
  if (pathname === '/api/friends') {
    const otherUsers = Object.values(db.users).filter(
      (u) => u.id !== currentUser.id && u.id !== 'boost_bot_official'
    );
    return {
      friends: otherUsers.map((profile, idx) => ({
        friendshipId: idx + 1,
        profile,
      })),
      incomingRequests: [],
      outgoingRequests: [],
      suggestions: otherUsers,
    } as unknown as T;
  }

  if (pathname === '/api/friends/action') {
    return { ok: true } as unknown as T;
  }

  if (pathname === '/api/communities' && method === 'GET') {
    return db.communities as unknown as T;
  }

  if (pathname === '/api/communities' && method === 'POST') {
    const created: CommunityItem = {
      id: Date.now(),
      name: body.name || 'New Community',
      description: body.description || '',
      imageUrl:
        body.imageUrl ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
      rules: body.rules || 'Be respectful and helpful.',
      category: body.category || 'Creators',
      creatorId: currentUser.id,
      createdAt: new Date().toISOString(),
      membersCount: 1,
      postsCount: 0,
      isMember: true,
      myRole: 'admin',
    };
    db.communities.unshift(created);
    saveStaticDb(db);
    return created as unknown as T;
  }

  const communityDetailMatch = pathname.match(/^\/api\/communities\/(\d+)$/);
  if (communityDetailMatch) {
    const cid = Number(communityDetailMatch[1]);
    const comm = db.communities.find((c) => c.id === cid) || db.communities[0];
    return {
      ...comm,
      posts: db.posts.slice(0, 5),
      members: Object.values(db.users).slice(0, 6),
    } as unknown as T;
  }

  if (pathname.match(/^\/api\/communities\/\d+\/action$/)) {
    return { ok: true } as unknown as T;
  }

  // 7. Direct Messages & Conversations
  if (pathname === '/api/messages/conversations') {
    ensureUserWelcomeMessages(currentUser.id, db);
    const partners = Object.values(db.users).filter(
      (u) => u.id !== currentUser.id
    );
    const summaries: ConversationSummary[] = partners.map((partner) => {
      const thread = db.messages.filter(
        (m) =>
          !m.isDeleted &&
          ((m.senderId === currentUser.id && m.receiverId === partner.id) ||
            (m.senderId === partner.id && m.receiverId === currentUser.id))
      );
      const lastMessage =
        thread.length > 0 ? thread[thread.length - 1] : null;
      const unreadCount = thread.filter(
        (m) => m.receiverId === currentUser.id && !m.isRead
      ).length;
      return {
        partner,
        lastMessage,
        unreadCount,
        isOnline: true,
      };
    });
    summaries.sort((a, b) => {
      if (a.partner.id === 'boost_bot_official') return -1;
      if (b.partner.id === 'boost_bot_official') return 1;
      const tA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const tB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return tB - tA;
    });
    saveStaticDb(db);
    return summaries as unknown as T;
  }

  const messageItemMatch = pathname.match(/^\/api\/messages\/item\/(\d+)$/);
  if (messageItemMatch) {
    const msgId = Number(messageItemMatch[1]);
    db.messages = db.messages.map((m) =>
      m.id === msgId
        ? {
            ...m,
            reaction: body.reaction ?? m.reaction,
            isDeleted: method === 'DELETE' ? true : m.isDeleted,
          }
        : m
    );
    saveStaticDb(db);
    return { ok: true } as unknown as T;
  }

  const messagePartnerMatch = pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (messagePartnerMatch) {
    const partnerId = decodeURIComponent(messagePartnerMatch[1]);
    if (method === 'GET') {
      db.messages.forEach((m) => {
        if (m.senderId === partnerId && m.receiverId === currentUser.id) {
          m.isRead = true;
        }
      });
      saveStaticDb(db);
      const thread = db.messages.filter(
        (m) =>
          !m.isDeleted &&
          ((m.senderId === currentUser.id && m.receiverId === partnerId) ||
            (m.senderId === partnerId && m.receiverId === currentUser.id))
      );
      return thread as unknown as T;
    }
    if (method === 'POST') {
      const created: DirectMessageItem = {
        id: Date.now(),
        senderId: currentUser.id,
        receiverId: partnerId,
        content: String(body.content || ''),
        mediaUrl: body.mediaUrl || '',
        mediaType: body.mediaType || '',
        replyToId: body.replyToId || null,
        sharedPostId: body.sharedPostId || null,
        reaction: '',
        isRead: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };
      db.messages.push(created);

      // If someone replies to BOOST BOT, automatically forward their message to Prince Abba
      if (partnerId === 'boost_bot_official') {
        const adminProfile =
          Object.values(db.users).find((u) => isStrictAdminEmail(u.email)) ||
          db.users['bh_owner_abba'];
        if (adminProfile && adminProfile.id !== currentUser.id) {
          const forwardedText = body.content
            ? `🤖 [Reply to BOOST BOT]: ${body.content}`
            : '🤖 [Reply to BOOST BOT]: (Sent a media attachment)';
          db.messages.push({
            id: Date.now() + 1,
            senderId: currentUser.id,
            receiverId: adminProfile.id,
            content: forwardedText,
            mediaUrl: body.mediaUrl || '',
            mediaType: body.mediaType || '',
            replyToId: null,
            sharedPostId: body.sharedPostId || null,
            reaction: '',
            isRead: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
          });
          db.notifications.unshift({
            id: Date.now() + 2,
            userId: adminProfile.id,
            actorId: currentUser.id,
            type: 'message',
            title: `🤖 BOOST BOT Reply from ${currentUser.displayName} (@${currentUser.username})`,
            body: String(body.content || 'Sent a media attachment'),
            entityId: currentUser.id,
            isRead: false,
            createdAt: new Date().toISOString(),
            actor: currentUser,
          });
        }
      }

      saveStaticDb(db);
      return created as unknown as T;
    }
  }

  if (pathname === '/api/realtime/typing') {
    return { ok: true } as unknown as T;
  }

  // 8. Notifications
  if (pathname === '/api/notifications') {
    ensureUserWelcomeMessages(currentUser.id, db);
    const list = db.notifications
      .filter((n) => n.userId === currentUser.id)
      .map((n) => ({
        ...n,
        actor: n.actorId ? db.users[n.actorId] || BOOST_BOT_PROFILE : null,
      }));
    saveStaticDb(db);
    return list as unknown as T;
  }

  if (pathname === '/api/notifications/read') {
    db.notifications.forEach((n) => {
      if (n.userId === currentUser.id) {
        if (!body.id || n.id === Number(body.id)) {
          n.isRead = true;
        }
      }
    });
    saveStaticDb(db);
    return { ok: true } as unknown as T;
  }

  // 9. Admin Overview & BOOST BOT Console
  if (pathname === '/api/admin/overview') {
    if (!isStrictAdminEmail(currentUser.email)) {
      throw new Error('Forbidden: Admin access is restricted to Prince Abba.');
    }
    const allUsers = Object.values(db.users).filter(
      (u) => u.id !== 'boost_bot_official'
    );

    const botMessages = db.messages.filter(
      (m) =>
        !m.isDeleted &&
        (m.senderId === 'boost_bot_official' ||
          m.receiverId === 'boost_bot_official')
    );

    const threadsByUser = new Map<
      string,
      {
        user: UserProfile;
        messages: Array<{
          id: number;
          senderId: string;
          receiverId: string;
          content: string;
          mediaUrl: string;
          mediaType: string;
          createdAt: string;
          isFromUser: boolean;
        }>;
        userReplyCount: number;
        lastMessageAt: string;
        lastUserReplyAt: string | null;
      }
    >();

    for (const msg of botMessages) {
      const partnerId =
        msg.senderId === 'boost_bot_official' ? msg.receiverId : msg.senderId;
      if (!partnerId || partnerId === 'boost_bot_official') continue;
      const partnerProfile = db.users[partnerId];
      if (!partnerProfile) continue;

      let entry = threadsByUser.get(partnerId);
      if (!entry) {
        entry = {
          user: partnerProfile,
          messages: [],
          userReplyCount: 0,
          lastMessageAt: msg.createdAt,
          lastUserReplyAt: null,
        };
        threadsByUser.set(partnerId, entry);
      }

      const isFromUser = msg.senderId !== 'boost_bot_official';
      entry.messages.push({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content || '',
        mediaUrl: msg.mediaUrl || '',
        mediaType: msg.mediaType || '',
        createdAt: msg.createdAt,
        isFromUser,
      });
      entry.lastMessageAt = msg.createdAt;
      if (isFromUser) {
        entry.userReplyCount += 1;
        entry.lastUserReplyAt = msg.createdAt;
      }
    }

    const boostBotThreads = Array.from(threadsByUser.values()).sort((a, b) => {
      if (a.userReplyCount > 0 && b.userReplyCount === 0) return -1;
      if (b.userReplyCount > 0 && a.userReplyCount === 0) return 1;
      const tA = new Date(a.lastUserReplyAt || a.lastMessageAt).getTime();
      const tB = new Date(b.lastUserReplyAt || b.lastMessageAt).getTime();
      return tB - tA;
    });

    return {
      metrics: {
        totalUsers: allUsers.length,
        totalPosts: db.posts.length,
        totalComments: Object.values(db.comments).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        openReports: db.reports.length,
      },
      users: allUsers,
      posts: db.posts,
      reports: db.reports,
      communities: db.communities,
      boostBotThreads,
      auditLogs: [
        {
          id: 1,
          adminId: currentUser.id,
          action: 'Admin Console Active',
          targetType: 'system',
          targetId: 'boosthub',
          notes: 'BOOST BOT broadcast & user management ready',
          createdAt: new Date().toISOString(),
        },
      ],
    } as unknown as T;
  }

  if (pathname === '/api/admin/action' && method === 'POST') {
    if (!isStrictAdminEmail(currentUser.email)) {
      throw new Error('Forbidden: Admin access is restricted to Prince Abba.');
    }
    const { action } = body;
    const payload = body.payload || body;
    const targetId = payload.targetUserId || payload.userId || body.targetId;
    const content = payload.content ?? body.content;

    if (action === 'send_boost_bot_message') {
      const msgText = String(content || '').trim();
      const recipients =
        !targetId || targetId === 'all'
          ? Object.values(db.users).filter((u) => u.id !== 'boost_bot_official')
          : [db.users[targetId] || currentUser];

      recipients.forEach((r, idx) => {
        const dm: DirectMessageItem = {
          id: Date.now() + idx,
          senderId: 'boost_bot_official',
          receiverId: r.id,
          content: msgText,
          mediaUrl: '',
          mediaType: '',
          replyToId: null,
          sharedPostId: null,
          reaction: '',
          isRead: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        };
        db.messages.push(dm);

        db.notifications.unshift({
          id: Date.now() + 100 + idx,
          userId: r.id,
          actorId: 'boost_bot_official',
          type: 'boost_bot',
          title: 'BOOST BOT',
          body: msgText,
          entityId: 'boost_bot_official',
          isRead: false,
          createdAt: new Date().toISOString(),
          actor: BOOST_BOT_PROFILE,
        });
      });

      saveStaticDb(db);

      // Fire native phone/browser notification tray alert with BOOST BOT on top and message under
      showBrowserSystemNotification(
        'BOOST BOT',
        msgText,
        '/?tab=notifications'
      ).catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('boosthub:realtime', {
            detail: {
              type: 'boost_bot_message',
              payload: {
                senderName: 'BOOST BOT',
                content: msgText,
              },
              timestamp: Date.now(),
            },
          })
        );
      }

      return {
        ok: true,
        sentCount: recipients.length,
        recipientCount: recipients.length,
        pushDeliveredCount: recipients.length,
      } as unknown as T;
    }

    if (targetId && db.users[targetId]) {
      if (action === 'verify_user' || action === 'toggle_verify_user') {
        db.users[targetId].isVerified = !db.users[targetId].isVerified;
      }
      if (action === 'set_user_role' && payload.role) {
        db.users[targetId].role = payload.role;
      }
      if (action === 'promote_creator') db.users[targetId].role = 'creator';
      if (action === 'promote_moderator') db.users[targetId].role = 'moderator';
      if (action === 'suspend_user' || action === 'toggle_suspend_user') {
        db.users[targetId].isSuspended = !db.users[targetId].isSuspended;
      }
      if (action === 'unsuspend_user') db.users[targetId].isSuspended = false;
      saveStaticDb(db);
    }
    return { ok: true } as unknown as T;
  }

  // 10. Creator Dashboard & Missions
  if (pathname === '/api/creator-dashboard') {
    return {
      profile: currentUser,
      metrics: {
        totalViews: currentUser.viewsReceivedCount || 1420,
        totalLikes: currentUser.likesReceivedCount || 340,
        totalShares: currentUser.sharesReceivedCount || 48,
        totalComments: 29,
        followersCount: currentUser.followersCount || 120,
        engagementRate: 8.4,
      },
      missions: db.missions,
      badges: [
        {
          id: 1,
          code: 'pioneer',
          name: 'BoostHub Pioneer',
          description: 'Early community creator & innovator',
          iconName: 'Award',
          unlocked: true,
          awardedAt: new Date().toISOString(),
        },
      ],
      topPosts: db.posts.slice(0, 3),
    } as unknown as T;
  }

  if (pathname === '/api/creator-dashboard/activate') {
    currentUser.role = 'creator';
    db.users[currentUser.id] = currentUser;
    saveStaticDb(db);
    return { ok: true, profile: currentUser } as unknown as T;
  }

  // 11. Search
  if (pathname === '/api/search') {
    const q = (searchParams.get('q') || '')
      .trim()
      .toLowerCase()
      .replace(/^@+/, '');
    const users = Object.values(db.users).filter(
      (u) =>
        !q ||
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q)
    );
    const posts = db.posts.filter(
      (p) =>
        !q ||
        p.caption.toLowerCase().includes(q) ||
        p.hashtags.toLowerCase().includes(q)
    );
    const videos = posts.filter(
      (p) => p.postType === 'capshot' || p.postType === 'video'
    );
    return {
      people: users,
      users,
      posts,
      videos,
      hashtags: ['#boosthub', '#capshots', '#creators', '#technology'],
      communities: db.communities,
    } as unknown as T;
  }

  // 12. Push Notifications endpoints
  if (pathname === '/api/push/status') {
    return {
      supported: true,
      subscribed: true,
      subscriptionCount: 1,
    } as unknown as T;
  }

  if (pathname === '/api/push/vapid-public-key') {
    return { publicKey: '' } as unknown as T;
  }

  if (pathname === '/api/push/subscribe' || pathname === '/api/push/unsubscribe') {
    return { ok: true } as unknown as T;
  }

  if (pathname === '/api/push/test') {
    await showBrowserSystemNotification(
      'BOOST BOT',
      'Phone notifications are active! You will receive instant alerts here.',
      '/?tab=notifications'
    );
    return { sent: 1 } as unknown as T;
  }

  // 13. Blocked users & Feedback
  if (pathname === '/api/blocked-users') {
    return [] as unknown as T;
  }

  if (pathname === '/api/blocked-users/unblock' || pathname === '/api/feedback') {
    return { ok: true } as unknown as T;
  }

  return { ok: true } as unknown as T;
}
