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
  requirementType: 'posts' | 'likes_received' | 'xp' | 'follows' | 'communities' | 'missions' | 'gifts';
  requirementCount: number;
  xpReward: number;
  badgeType: 'bronze' | 'silver' | 'gold' | 'crystal' | 'grandmaster' | 'achievement';
  glowColor: string;
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
    description: 'Began your journey on BoostHub Aba and took your first steps as a creator.',
    requirementDescription: 'Publish your first post or Capshot to start your progression.',
    requirementType: 'posts',
    requirementCount: 1,
    xpReward: 50,
    badgeType: 'bronze',
    glowColor: '#F97316',
  },
  {
    id: 7,
    code: 'firering_editor',
    name: 'Firering Editor',
    subtitle: 'Level 1 Editor Shield',
    level: 1,
    levelLabel: 'LV.1 • FIRERING EDITOR',
    category: 'progression',
    description: 'Master the craft of video editing with B-Edit Studio AI cutouts, 52 fonts, and effects.',
    requirementDescription: 'Edit and publish at least 3 videos or clips using B-Edit Studio.',
    requirementType: 'posts',
    requirementCount: 3,
    xpReward: 100,
    badgeType: 'bronze',
    glowColor: '#B45309',
  },
  {
    id: 8,
    code: 'engagement_master',
    name: 'Engagement Master',
    subtitle: 'Level 2 Engagement Shield',
    level: 2,
    levelLabel: 'LV.2 • ENGAGEMENT MASTER',
    category: 'progression',
    description: 'Built genuine connections with viewers, receiving widespread love across your videos.',
    requirementDescription: 'Earn at least 50 likes across your creations and support fellow creators.',
    requirementType: 'likes_received',
    requirementCount: 50,
    xpReward: 200,
    badgeType: 'silver',
    glowColor: '#94A3B8',
  },
  {
    id: 9,
    code: 'content_god',
    name: 'Content God',
    subtitle: 'Level 3 Royal Gold Shield',
    level: 3,
    levelLabel: 'LV.3 • CONTENT GOD',
    category: 'progression',
    description: 'Ascended to high creator status with consistent viral media, capshots, and storytelling.',
    requirementDescription: 'Publish 15 viral posts or Capshots and reach 1,000 total video views.',
    requirementType: 'posts',
    requirementCount: 15,
    xpReward: 350,
    badgeType: 'gold',
    glowColor: '#F59E0B',
  },
  {
    id: 10,
    code: 'distant_winner',
    name: 'Distant Winner',
    subtitle: 'Level 4 Diamond Crystal Trophy',
    level: 4,
    levelLabel: 'LV.4 • DISTANT WINNER',
    category: 'progression',
    description: 'Outpaced the competition with stellar persistence, ranking on creator leaderboards.',
    requirementDescription: 'Reach 1,500 total XP earned through daily missions and viral engagement.',
    requirementType: 'xp',
    requirementCount: 1500,
    xpReward: 500,
    badgeType: 'crystal',
    glowColor: '#38BDF8',
  },
  {
    id: 11,
    code: 'boost_pro',
    name: 'Boost Pro (Heroic Grandmaster)',
    subtitle: 'Level 5 Heroic Grandmaster Wings',
    level: 5,
    levelLabel: 'LV.5 • HEROIC GRANDMASTER',
    category: 'progression',
    description: 'The supreme pinnacle of BoostHub Aba. A legend with fiery wings, royal crown, and mastercraft.',
    requirementDescription: 'Reach 3,000 XP, complete 30 missions, and exchange 5 B-Shop gifts. Strictly elite!',
    requirementType: 'xp',
    requirementCount: 3000,
    xpReward: 1000,
    badgeType: 'grandmaster',
    glowColor: '#EF4444',
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
    description: 'Recognized by the community for outstanding creative quality, viral reach, and cultural impact.',
    requirementDescription: 'Earn 150+ total likes across your library of videos and posts.',
    requirementType: 'likes_received',
    requirementCount: 150,
    xpReward: 300,
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
    description: 'A founding creator of BoostHub Aba who joined in the initial season to ignite Nigerian creator media.',
    requirementDescription: 'Published content during the Season 23 pioneer release.',
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
    description: 'An exemplary supporter who actively joins creator communities, gifts Aba crafts, and empowers others.',
    requirementDescription: 'Join at least 2 creator communities and engage in collaborative activities.',
    requirementType: 'communities',
    requirementCount: 2,
    xpReward: 200,
    badgeType: 'silver',
    glowColor: '#06B6D4',
  },
];

export function getBadgeByCode(code: string): BadgeDefinition | undefined {
  return USER_BADGES_CATALOG.find((b) => b.code === code);
}

export function calculateUserBadges(user: {
  id?: string;
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
}[] {
  const isOwnerAdmin =
    Boolean(user.isAdmin) ||
    user.id === 'prince_abba_admin_uuid' ||
    user.id === 'admin-abba-uuid' ||
    Number(user.xp || 0) >= 50000;

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

  // Helper to test if a badge is unlocked
  const isUnlocked = (code: string): boolean => {
    if (isOwnerAdmin) return true;
    switch (code) {
      case 'rookie':
        return posts >= 1 || xp >= 50;
      case 'firering_editor':
        return posts >= 3 || xp >= 150;
      case 'engagement_master':
        return likes >= 50 || xp >= 300;
      case 'content_god':
        return (posts >= 15 && (views >= 1000 || likes >= 100)) || xp >= 600;
      case 'distant_winner':
        // Don't make it easy: requires 1,500 total XP
        return xp >= 1500;
      case 'boost_pro':
        // Elite Grandmaster tier: requires 3,000 XP + at least 20 posts or gifts
        return xp >= 3000 && (posts >= 20 || gifts >= 5);
      case 'top_creator':
        return likes >= 150 || Boolean(user.isVerified);
      case 'early_adopter':
        return posts >= 1;
      case 'community_helper':
        return friends >= 2 || gifts >= 1;
      default:
        return false;
    }
  };

  for (const def of USER_BADGES_CATALOG) {
    if (isUnlocked(def.code)) {
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

  // Also handle custom equipped badges if any
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

