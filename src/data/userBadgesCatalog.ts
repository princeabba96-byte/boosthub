export interface BadgeChallengeItem {
  key: string;
  label: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface BadgeDefinition {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  level: number;
  levelLabel: string;
  category: 'progression' | 'achievement' | 'special';
  description: string;
  requirementDescription: string;
  requirementType: 'posts' | 'likes_received' | 'xp' | 'follows' | 'communities' | 'missions' | 'gifts' | 'views';
  requirementCount: number;
  xpReward: number;
  badgeType: 'bronze' | 'silver' | 'gold' | 'crystal' | 'grandmaster' | 'achievement';
  glowColor: string;
  challenges: {
    key: 'posts' | 'likes' | 'views' | 'xp' | 'gifts' | 'friends';
    label: string;
    target: number;
  }[];
}

export const USER_BADGES_CATALOG: BadgeDefinition[] = [
  {
    id: 1,
    code: 'rookie',
    name: 'Rookie Pioneer',
    subtitle: 'Level 1 Rookie',
    level: 1,
    levelLabel: 'LV.1 • ROOKIE',
    category: 'progression',
    description: 'Began your journey on BoostHub Aba and took your first verified steps as an active creator.',
    requirementDescription: 'Publish at least 2 posts/videos and earn 100 XP to start your creator journey.',
    requirementType: 'posts',
    requirementCount: 2,
    xpReward: 50,
    badgeType: 'bronze',
    glowColor: '#F97316',
    challenges: [
      { key: 'posts', label: 'Published Posts', target: 2 },
      { key: 'xp', label: 'Earned XP', target: 100 },
    ],
  },
  {
    id: 7,
    code: 'firering_editor',
    name: 'Firering Editor',
    subtitle: 'Level 2 Editor Shield',
    level: 2,
    levelLabel: 'LV.2 • FIRERING EDITOR',
    category: 'progression',
    description: 'Master the craft of video editing with B-Edit Studio AI cutouts, 52 fonts, and sound design.',
    requirementDescription: 'Publish 8 video creations, earn 35 likes, and reach 400 XP.',
    requirementType: 'posts',
    requirementCount: 8,
    xpReward: 100,
    badgeType: 'bronze',
    glowColor: '#B45309',
    challenges: [
      { key: 'posts', label: 'Published Videos', target: 8 },
      { key: 'likes', label: 'Likes Received', target: 35 },
      { key: 'xp', label: 'Total XP', target: 400 },
    ],
  },
  {
    id: 8,
    code: 'engagement_master',
    name: 'Engagement Master',
    subtitle: 'Level 3 Engagement Shield',
    level: 3,
    levelLabel: 'LV.3 • ENGAGEMENT MASTER',
    category: 'progression',
    description: 'Built genuine engagement with viewers, capturing audience attention across your media.',
    requirementDescription: 'Receive 120 likes, 1,000 video views, 15 posts, and reach 1,000 XP.',
    requirementType: 'likes_received',
    requirementCount: 120,
    xpReward: 200,
    badgeType: 'silver',
    glowColor: '#94A3B8',
    challenges: [
      { key: 'posts', label: 'Published Posts', target: 15 },
      { key: 'likes', label: 'Likes Received', target: 120 },
      { key: 'views', label: 'Video Views', target: 1000 },
      { key: 'xp', label: 'Total XP', target: 1000 },
    ],
  },
  {
    id: 9,
    code: 'content_god',
    name: 'Content God',
    subtitle: 'Level 4 Royal Gold Shield',
    level: 4,
    levelLabel: 'LV.4 • CONTENT GOD',
    category: 'progression',
    description: 'Ascended to prestigious creator status with consistent viral media, capshots, and loyal supporters.',
    requirementDescription: 'Publish 30 posts, earn 300 likes, 4,000 video views, 2 gifts exchanged, and 2,500 XP.',
    requirementType: 'posts',
    requirementCount: 30,
    xpReward: 350,
    badgeType: 'gold',
    glowColor: '#F59E0B',
    challenges: [
      { key: 'posts', label: 'Published Posts', target: 30 },
      { key: 'likes', label: 'Likes Received', target: 300 },
      { key: 'views', label: 'Video Views', target: 4000 },
      { key: 'gifts', label: 'Gifts Exchanged', target: 2 },
      { key: 'xp', label: 'Total XP', target: 2500 },
    ],
  },
  {
    id: 10,
    code: 'distant_winner',
    name: 'Distant Winner',
    subtitle: 'Level 5 Diamond Crystal Trophy',
    level: 5,
    levelLabel: 'LV.5 • DISTANT WINNER',
    category: 'progression',
    description: 'Outpaced the competition through elite persistence. A creator ranking high on seasonal leaderboards.',
    requirementDescription: 'Publish 50 posts, reach 650 likes, 10,000 views, 5 connections, 6 gifts exchanged, and 5,000 XP.',
    requirementType: 'xp',
    requirementCount: 5000,
    xpReward: 500,
    badgeType: 'crystal',
    glowColor: '#38BDF8',
    challenges: [
      { key: 'posts', label: 'Published Posts', target: 50 },
      { key: 'likes', label: 'Likes Received', target: 650 },
      { key: 'views', label: 'Video Views', target: 10000 },
      { key: 'friends', label: 'Creator Connections', target: 5 },
      { key: 'gifts', label: 'Gifts Exchanged', target: 6 },
      { key: 'xp', label: 'Total XP', target: 5000 },
    ],
  },
  {
    id: 11,
    code: 'boost_pro',
    name: 'Boost Pro (Heroic Grandmaster)',
    subtitle: 'Level 6 Heroic Grandmaster Wings',
    level: 6,
    levelLabel: 'LV.6 • HEROIC GRANDMASTER',
    category: 'progression',
    description: 'The supreme pinnacle of BoostHub Aba. A living legend with fiery master wings and royal supremacy.',
    requirementDescription: 'Publish 80 posts, earn 1,500 likes, 25,000 views, 12 connections, 15 gifts, and 10,000 XP. Strictly elite!',
    requirementType: 'xp',
    requirementCount: 10000,
    xpReward: 1000,
    badgeType: 'grandmaster',
    glowColor: '#EF4444',
    challenges: [
      { key: 'posts', label: 'Published Posts', target: 80 },
      { key: 'likes', label: 'Likes Received', target: 1500 },
      { key: 'views', label: 'Video Views', target: 25000 },
      { key: 'friends', label: 'Creator Connections', target: 12 },
      { key: 'gifts', label: 'Gifts Exchanged', target: 15 },
      { key: 'xp', label: 'Total XP', target: 10000 },
    ],
  },
  // Achievement Badges
  {
    id: 12,
    code: 'top_creator',
    name: 'Top Creator',
    subtitle: 'Viral Prestige Achievement',
    level: 0,
    levelLabel: 'PRESTIGE • TOP CREATOR',
    category: 'achievement',
    description: 'Recognized by the community for outstanding viral quality and creative distinction.',
    requirementDescription: 'Earn 500+ likes and 5,000+ views across your library of videos and posts.',
    requirementType: 'likes_received',
    requirementCount: 500,
    xpReward: 300,
    badgeType: 'gold',
    glowColor: '#EAB308',
    challenges: [
      { key: 'likes', label: 'Likes Received', target: 500 },
      { key: 'views', label: 'Video Views', target: 5000 },
    ],
  },
  {
    id: 13,
    code: 'early_adopter',
    name: 'Early Adopter',
    subtitle: 'Founding Member Achievement',
    level: 0,
    levelLabel: 'SPECIAL • EARLY ADOPTER',
    category: 'achievement',
    description: 'A dedicated pioneer of BoostHub Aba who actively published content in the inaugural season.',
    requirementDescription: 'Publish 5 creations and reach 300 XP in the pioneer season.',
    requirementType: 'posts',
    requirementCount: 5,
    xpReward: 150,
    badgeType: 'bronze',
    glowColor: '#F97316',
    challenges: [
      { key: 'posts', label: 'Published Posts', target: 5 },
      { key: 'xp', label: 'Total XP', target: 300 },
    ],
  },
  {
    id: 14,
    code: 'community_helper',
    name: 'Community Helper',
    subtitle: 'Pillar of the Community',
    level: 0,
    levelLabel: 'HONOR • COMMUNITY HELPER',
    category: 'achievement',
    description: 'An exemplary supporter who uplifts others with virtual gifts, connections, and friendly collaboration.',
    requirementDescription: 'Form 5 creator friendships and exchange at least 5 classic gifts.',
    requirementType: 'communities',
    requirementCount: 5,
    xpReward: 200,
    badgeType: 'silver',
    glowColor: '#06B6D4',
    challenges: [
      { key: 'friends', label: 'Creator Friends', target: 5 },
      { key: 'gifts', label: 'Gifts Exchanged', target: 5 },
    ],
  },
];

export function getBadgeByCode(code: string): BadgeDefinition | undefined {
  return USER_BADGES_CATALOG.find((b) => b.code === code);
}

export function isUserPlatformOwner(user: {
  id?: string;
  email?: string;
  username?: string;
  isAdmin?: boolean;
}): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const uid = String(user.id || '').toLowerCase();
  if (
    uid === 'eaada352-5704-4566-a7a7-88df80853ada' ||
    uid === 'prince_abba_admin_uuid' ||
    uid === 'admin-abba-uuid'
  ) {
    return true;
  }
  const email = String(user.email || '').toLowerCase().trim();
  if (email === 'princeabba96@gmail.com' || email.includes('princeabba')) {
    return true;
  }
  const username = String(user.username || '').toLowerCase().trim();
  if (username === 'abba' || username === 'princeabba' || username === 'princeabba96') {
    return true;
  }
  return false;
}

export function calculateBadgeChallenges(
  badge: BadgeDefinition,
  userStats: {
    posts: number;
    likes: number;
    views: number;
    xp: number;
    gifts: number;
    friends: number;
  },
  isOwner = false
): BadgeChallengeItem[] {
  return badge.challenges.map((c) => {
    const currentVal = userStats[c.key] || 0;
    const completed = isOwner || currentVal >= c.target;
    return {
      key: c.key,
      label: c.label,
      current: isOwner ? c.target : currentVal,
      target: c.target,
      completed,
    };
  });
}

export function calculateUserBadges(user: {
  id?: string;
  email?: string;
  username?: string;
  xp?: number;
  postsCount?: number;
  likesReceivedCount?: number;
  viewsReceivedCount?: number;
  followersCount?: number;
  friendsCount?: number;
  giftsReceivedCount?: number;
  boostPoints?: number;
  isAdmin?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  equippedBadge?: string;
}): {
  id: number;
  code: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  awardedAt: string;
  requirementType?: string;
  requirementCount?: number;
  challenges?: BadgeChallengeItem[];
}[] {
  // Only the creator & platform owner Prince Abba has all badges automatically unlocked
  const isOwnerAdmin = isUserPlatformOwner(user);

  const stats = {
    xp: Number(user.xp || 0),
    posts: Number(user.postsCount || 0),
    likes: Number(user.likesReceivedCount || 0),
    views: Number(user.viewsReceivedCount || 0),
    friends: Number(user.friendsCount || user.followersCount || 0),
    gifts: Number(user.giftsReceivedCount || 0),
  };

  const earned: {
    id: number;
    code: string;
    name: string;
    description: string;
    iconName: string;
    unlocked: boolean;
    awardedAt: string;
    requirementType?: string;
    requirementCount?: number;
    challenges?: BadgeChallengeItem[];
  }[] = [];

  // Strictly evaluate every badge: every challenge must be satisfied (the higher the tier, the harder it is)
  const isBadgeFullyEarned = (def: BadgeDefinition): boolean => {
    if (isOwnerAdmin) return true;
    const challengeList = calculateBadgeChallenges(def, stats, false);
    return challengeList.every((ch) => ch.completed);
  };

  for (const def of USER_BADGES_CATALOG) {
    if (isBadgeFullyEarned(def)) {
      earned.push({
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description,
        iconName: def.code,
        unlocked: true,
        awardedAt: new Date().toISOString(),
        requirementType: def.requirementType,
        requirementCount: def.requirementCount,
        challenges: calculateBadgeChallenges(def, stats, isOwnerAdmin),
      });
    }
  }

  // If user has an equipped badge that is earned or owner, ensure it remains
  if (user.equippedBadge && isOwnerAdmin && !earned.some((b) => b.code === user.equippedBadge)) {
    const found = USER_BADGES_CATALOG.find((b) => b.code === user.equippedBadge);
    if (found) {
      earned.push({
        id: found.id,
        code: found.code,
        name: found.name,
        description: found.description,
        iconName: found.code,
        unlocked: true,
        awardedAt: new Date().toISOString(),
        requirementType: found.requirementType,
        requirementCount: found.requirementCount,
        challenges: calculateBadgeChallenges(found, stats, true),
      });
    }
  }

  return earned;
}

export function getHighestBadgeShield(
  badges: { code: string; name: string }[] | undefined
): BadgeDefinition | undefined {
  if (!badges || badges.length === 0) return undefined;
  const codes = new Set(badges.map((b) => b.code));

  // Check progression from highest to lowest
  const progressionOrder = [
    'boost_pro',
    'distant_winner',
    'content_god',
    'engagement_master',
    'firering_editor',
    'rookie',
  ];

  for (const code of progressionOrder) {
    if (codes.has(code)) {
      return USER_BADGES_CATALOG.find((b) => b.code === code);
    }
  }

  // Fallback to prestige achievements
  if (codes.has('top_creator')) return USER_BADGES_CATALOG.find((b) => b.code === 'top_creator');
  if (codes.has('community_helper')) return USER_BADGES_CATALOG.find((b) => b.code === 'community_helper');
  if (codes.has('early_adopter')) return USER_BADGES_CATALOG.find((b) => b.code === 'early_adopter');

  return undefined;
}

