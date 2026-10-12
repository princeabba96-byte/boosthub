import { isPlatformFounder } from '../utils/creatorAdmin';

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
  requirementType:
    | 'posts'
    | 'likes_received'
    | 'xp'
    | 'follows'
    | 'communities'
    | 'missions'
    | 'gifts';
  requirementCount: number;
  xpReward: number;
  badgeType:
    | 'bronze'
    | 'silver'
    | 'gold'
    | 'crystal'
    | 'grandmaster'
    | 'mythic'
    | 'achievement';
  glowColor: string;
  requiredPreviousBadgeCode?: string;
}

export const USER_BADGES_CATALOG: BadgeDefinition[] = [
  // Progression Track (Strictly earned 1 rank at a time through missions)
  {
    id: 1,
    code: 'rookie',
    name: 'Rookie Pioneer',
    subtitle: 'Rank 1 • Rookie Bronze Shield',
    level: 1,
    levelLabel: 'RANK 1 • ROOKIE',
    category: 'progression',
    description:
      'The initial step of a BoostHub creator. Began your creative journey with your first creations.',
    requirementDescription:
      'Mission 1: Complete your profile, publish 1 post/Capshot, and give 5 likes.',
    requirementType: 'posts',
    requirementCount: 1,
    xpReward: 100,
    badgeType: 'bronze',
    glowColor: '#F97316',
  },
  {
    id: 2,
    code: 'firering_editor',
    name: 'Firering Editor',
    subtitle: 'Rank 2 • Fiery Bronze Shield',
    level: 2,
    levelLabel: 'RANK 2 • FIRERING EDITOR',
    category: 'progression',
    description:
      'Mastered the art of video cutting, speed control, and multi-track pacing in B-Edit Studio.',
    requirementDescription:
      'Mission 2: Complete Rank 1 + Edit & publish 3 videos in B-Edit Studio and gain 15 likes.',
    requirementType: 'posts',
    requirementCount: 3,
    xpReward: 250,
    badgeType: 'bronze',
    glowColor: '#B45309',
    requiredPreviousBadgeCode: 'rookie',
  },
  {
    id: 3,
    code: 'engagement_master',
    name: 'Engagement Master',
    subtitle: 'Rank 3 • Silver Honor Shield',
    level: 3,
    levelLabel: 'RANK 3 • ENGAGEMENT MASTER',
    category: 'progression',
    description:
      'Commands active viewership and vibrant comments across the BoostHub community.',
    requirementDescription:
      'Mission 3: Complete Rank 2 + Earn 60 total likes on your creations and join 2 communities.',
    requirementType: 'likes_received',
    requirementCount: 60,
    xpReward: 500,
    badgeType: 'silver',
    glowColor: '#94A3B8',
    requiredPreviousBadgeCode: 'firering_editor',
  },
  {
    id: 4,
    code: 'content_god',
    name: 'Content God',
    subtitle: 'Rank 4 • Royal Gold Shield',
    level: 4,
    levelLabel: 'RANK 4 • CONTENT GOD',
    category: 'progression',
    description:
      'Ascended to high creator stature with consistent viral media, capshots, and storytelling.',
    requirementDescription:
      'Mission 4: Complete Rank 3 + Publish 12 Capshots, get 500 total video views, and send 2 gifts.',
    requirementType: 'posts',
    requirementCount: 12,
    xpReward: 900,
    badgeType: 'gold',
    glowColor: '#F59E0B',
    requiredPreviousBadgeCode: 'engagement_master',
  },
  {
    id: 5,
    code: 'distant_winner',
    name: 'Distant Winner',
    subtitle: 'Rank 5 • Diamond Crystal Trophy',
    level: 5,
    levelLabel: 'RANK 5 • DISTANT WINNER',
    category: 'progression',
    description:
      'Outpaced the competition with stellar persistence, ranking prominently on creator leaderboards.',
    requirementDescription:
      'Mission 5: Complete Rank 4 + Reach 1,500 XP, complete 15 missions, and maintain 50 followers.',
    requirementType: 'xp',
    requirementCount: 1500,
    xpReward: 1400,
    badgeType: 'crystal',
    glowColor: '#38BDF8',
    requiredPreviousBadgeCode: 'content_god',
  },
  {
    id: 6,
    code: 'boost_pro',
    name: 'Boost Pro Grandmaster',
    subtitle: 'Rank 6 • Heroic Grandmaster Wings',
    level: 6,
    levelLabel: 'RANK 6 • HEROIC GRANDMASTER',
    category: 'progression',
    description:
      'The supreme pinnacle of creator elite. Blazing wings, royal crown, and mastercraft standing.',
    requirementDescription:
      'Mission 6: Complete Rank 5 + Reach 3,500 XP, complete 35 missions, and receive 10 B-Shop gifts.',
    requirementType: 'xp',
    requirementCount: 3500,
    xpReward: 2500,
    badgeType: 'grandmaster',
    glowColor: '#EF4444',
    requiredPreviousBadgeCode: 'distant_winner',
  },
  {
    id: 7,
    code: 'sovereign_legend',
    name: 'Sovereign Creator Legend',
    subtitle: 'Rank 7 • Supreme Mythic Crown',
    level: 7,
    levelLabel: 'RANK 7 • SOVEREIGN MYTHIC',
    category: 'progression',
    description:
      'God-tier legend recognized across Africa and beyond. Unmatched creator prestige.',
    requirementDescription:
      'Mission 7: Complete Rank 6 + Reach 7,500 XP, hold 500 followers, and rank in the Top 1%.',
    requirementType: 'xp',
    requirementCount: 7500,
    xpReward: 5000,
    badgeType: 'mythic',
    glowColor: '#A855F7',
    requiredPreviousBadgeCode: 'boost_pro',
  },

  // Prestige Achievements
  {
    id: 12,
    code: 'top_creator',
    name: 'Top Creator',
    subtitle: 'Viral Prestige Achievement',
    level: 0,
    levelLabel: 'PRESTIGE • TOP CREATOR',
    category: 'achievement',
    description:
      'Recognized by the community for outstanding creative quality, viral reach, and cultural impact.',
    requirementDescription:
      'Earn 200+ total likes across your library of videos and posts.',
    requirementType: 'likes_received',
    requirementCount: 200,
    xpReward: 400,
    badgeType: 'gold',
    glowColor: '#EAB308',
  },
  {
    id: 13,
    code: 'early_adopter',
    name: 'Early Adopter',
    subtitle: 'Founding Member Achievement',
    level: 0,
    levelLabel: 'SPECIAL • EARLY ADOPTER',
    category: 'achievement',
    description:
      'A founding creator of BoostHub who joined in the initial season to ignite creator media.',
    requirementDescription: 'Published content during the early pioneer release.',
    requirementType: 'posts',
    requirementCount: 1,
    xpReward: 150,
    badgeType: 'bronze',
    glowColor: '#F97316',
  },
  {
    id: 14,
    code: 'community_helper',
    name: 'Community Helper',
    subtitle: 'Pillar of the Community',
    level: 0,
    levelLabel: 'HONOR • COMMUNITY HELPER',
    category: 'achievement',
    description:
      'An exemplary supporter who actively joins creator communities, gifts Aba crafts, and empowers others.',
    requirementDescription:
      'Join at least 2 creator communities and exchange gifts.',
    requirementType: 'communities',
    requirementCount: 2,
    xpReward: 250,
    badgeType: 'silver',
    glowColor: '#06B6D4',
  },
];

export function getBadgeByCode(code: string): BadgeDefinition | undefined {
  return USER_BADGES_CATALOG.find((b) => b.code === code);
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
  isCreator?: boolean;
  role?: string;
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
}[] {
  // ONLY THE FOUNDER / CREATOR HAS ALL BADGES UNLOCKED!
  const isOwnerAdmin = isPlatformFounder(user);

  const xp = Number(user.xp || 0);
  const posts = Number(user.postsCount || 0);
  const likes = Number(user.likesReceivedCount || 0);
  const views = Number(user.viewsReceivedCount || 0);
  const friends = Number(user.friendsCount || 0);
  const gifts = Number(user.giftsReceivedCount || 0);

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
  }[] = [];

  // Founder has godmode: unlocks 100% of badges immediately
  if (isOwnerAdmin) {
    return USER_BADGES_CATALOG.map((def) => ({
      id: def.id,
      code: def.code,
      name: def.name,
      description: def.description,
      iconName: def.code,
      unlocked: true,
      awardedAt: new Date().toISOString(),
      requirementType: def.requirementType,
      requirementCount: def.requirementCount,
    }));
  }

  // Regular users MUST complete missions sequentially ONE RANK AT A TIME
  const unlockedCodes = new Set<string>();

  // Rank 1: Rookie Pioneer
  if (posts >= 1 && (likes >= 5 || xp >= 100)) {
    unlockedCodes.add('rookie');
  }

  // Rank 2: Firering Editor (Strictly requires Rank 1 completed first)
  if (unlockedCodes.has('rookie') && posts >= 3 && likes >= 15 && xp >= 250) {
    unlockedCodes.add('firering_editor');
  }

  // Rank 3: Engagement Master (Strictly requires Rank 2 completed first)
  if (
    unlockedCodes.has('firering_editor') &&
    likes >= 60 &&
    (friends >= 2 || gifts >= 1) &&
    xp >= 500
  ) {
    unlockedCodes.add('engagement_master');
  }

  // Rank 4: Content God (Strictly requires Rank 3 completed first)
  if (
    unlockedCodes.has('engagement_master') &&
    posts >= 12 &&
    views >= 500 &&
    xp >= 900
  ) {
    unlockedCodes.add('content_god');
  }

  // Rank 5: Distant Winner (Strictly requires Rank 4 completed first)
  if (unlockedCodes.has('content_god') && xp >= 1500 && gifts >= 2) {
    unlockedCodes.add('distant_winner');
  }

  // Rank 6: Boost Pro Grandmaster (Strictly requires Rank 5 completed first)
  if (
    unlockedCodes.has('distant_winner') &&
    xp >= 3500 &&
    posts >= 20 &&
    gifts >= 5
  ) {
    unlockedCodes.add('boost_pro');
  }

  // Rank 7: Sovereign Creator Legend (Strictly requires Rank 6 completed first)
  if (unlockedCodes.has('boost_pro') && xp >= 7500 && gifts >= 10) {
    unlockedCodes.add('sovereign_legend');
  }

  // Achievements
  if (likes >= 200 || Boolean(user.isVerified)) {
    unlockedCodes.add('top_creator');
  }
  if (posts >= 1) {
    unlockedCodes.add('early_adopter');
  }
  if (friends >= 2 || gifts >= 1) {
    unlockedCodes.add('community_helper');
  }

  for (const def of USER_BADGES_CATALOG) {
    if (unlockedCodes.has(def.code)) {
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
      });
    }
  }

  // Equipped cosmetic badge
  if (user.equippedBadge && !earned.some((b) => b.code === user.equippedBadge)) {
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

  // Check progression from highest to lowest rank
  const progressionOrder = [
    'sovereign_legend',
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
  if (codes.has('top_creator'))
    return USER_BADGES_CATALOG.find((b) => b.code === 'top_creator');
  if (codes.has('community_helper'))
    return USER_BADGES_CATALOG.find((b) => b.code === 'community_helper');
  if (codes.has('early_adopter'))
    return USER_BADGES_CATALOG.find((b) => b.code === 'early_adopter');

  return undefined;
}
