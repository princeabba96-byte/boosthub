import {
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
import { showBrowserSystemNotification } from './pushNotifications';

const STATIC_DB_KEY = 'boosthub_static_db_v1';

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
        'Welcome to BoostHub! You can message friends, share Capshots, or use the Admin Console in your Profile to send BOOST BOT broadcasts.',
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
      existing.isAdmin = true;
      existing.role = 'admin';
      ensureUserWelcomeMessages(existing.id, db);
      saveStaticDb(db);
      return {
        token: `static_token_${existing.id}`,
        profile: existing,
        user: existing,
      } as unknown as T;
    }

    const userId = `user_${Date.now()}`;
    const username =
      String(body.username || email.split('@')[0] || 'boostuser')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') || `user_${Math.floor(Math.random() * 9999)}`;
    const displayName = String(
      body.displayName || body.username || email.split('@')[0] || 'BoostHub Creator'
    );

    const newUser: UserProfile & { password?: string } = {
      id: userId,
      email,
      username,
      displayName,
      avatarUrl: defaultAvatar,
      bio: 'Creating and connecting on BoostHub',
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      onboardingCompleted: true,
      joinReason: 'Connect & Create',
      wantToWatch: 'Creators & Tech',
      wantToCreate: 'Capshots & Posts',
      xp: 250,
      boostPoints: 100,
      whoCanMessage: 'everyone',
      commentControl: 'everyone',
      isPrivate: false,
      notificationsEnabled: true,
      interests: ['Creators', 'Technology', 'Music'],
      followersCount: 18,
      followingCount: 4,
      friendsCount: 3,
      likesReceivedCount: 42,
      sharesReceivedCount: 9,
      viewsReceivedCount: 320,
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

  // 2. Current User Profile
  if (pathname === '/api/me') {
    return currentUser as unknown as T;
  }

  if (pathname === '/api/profile' || pathname === '/api/profiles/me') {
    const updated: UserProfile = {
      ...currentUser,
      displayName: body.displayName ?? currentUser.displayName,
      username: body.username ?? currentUser.username,
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
      isFollowing,
      friendshipStatus: 'friends',
    } as unknown as T;
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
      } else if (action === 'watch') {
        post.viewsCount += 1;
      }
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
    const allUsers = Object.values(db.users).filter(
      (u) => u.id !== 'boost_bot_official'
    );
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
      reports: db.reports,
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
    const { action, targetId, content } = body;
    if (action === 'send_boost_bot_message') {
      const msgText = String(content || '').trim();
      const recipients =
        targetId === 'all'
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
        recipientCount: recipients.length,
        pushDeliveredCount: recipients.length,
      } as unknown as T;
    }

    if (targetId && db.users[targetId]) {
      if (action === 'verify_user') db.users[targetId].isVerified = true;
      if (action === 'promote_creator') db.users[targetId].role = 'creator';
      if (action === 'promote_moderator') db.users[targetId].role = 'moderator';
      if (action === 'suspend_user') db.users[targetId].isSuspended = true;
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
    const q = (searchParams.get('q') || '').toLowerCase();
    const users = Object.values(db.users).filter(
      (u) =>
        !q ||
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
    const posts = db.posts.filter(
      (p) =>
        !q ||
        p.caption.toLowerCase().includes(q) ||
        p.hashtags.toLowerCase().includes(q)
    );
    return {
      users,
      posts,
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
