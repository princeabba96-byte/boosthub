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
    | 'achievement';
  glowColor: string;
  requiredMissionId: number;
  requiredMissionCode: string;
  requiredMissionName: string;
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
    description:
      'Began your journey on BoostHub Aba and took your first steps as a creator.',
    requirementDescription:
      'Complete Mission #4: Publish a Capshot or Story to earn this badge.',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 50,
    badgeType: 'bronze',
    glowColor: '#F97316',
    requiredMissionId: 4,
    requiredMissionCode: 'daily_create_post',
    requiredMissionName: 'Publish a Capshot or Story',
  },
  {
    id: 7,
    code: 'firering_editor',
    name: 'Firering Editor',
    subtitle: 'Level 1 Editor Shield',
    level: 1,
    levelLabel: 'LV.1 • FIRERING EDITOR',
    category: 'progression',
    description:
      'Master the craft of video editing with B-Edit Studio AI cutouts, 54 voices, and effects.',
    requirementDescription:
      'Complete Mission #7: B-Edit Studio Virtuoso (Publish 2 studio videos).',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 100,
    badgeType: 'bronze',
    glowColor: '#B45309',
    requiredMissionId: 7,
    requiredMissionCode: 'weekly_studio_pro',
    requiredMissionName: 'B-Edit Studio Virtuoso: 2 Videos',
  },
  {
    id: 8,
    code: 'engagement_master',
    name: 'Engagement Master',
    subtitle: 'Level 2 Engagement Shield',
    level: 2,
    levelLabel: 'LV.2 • ENGAGEMENT MASTER',
    category: 'progression',
    description:
      'Built genuine connections with viewers, receiving widespread love across your creations.',
    requirementDescription:
      'Complete Mission #2: Support 2 Creator Posts with likes.',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 200,
    badgeType: 'silver',
    glowColor: '#94A3B8',
    requiredMissionId: 2,
    requiredMissionCode: 'daily_like_posts',
    requiredMissionName: 'Support 2 Creator Posts',
  },
  {
    id: 9,
    code: 'content_god',
    name: 'Content God',
    subtitle: 'Level 3 Royal Gold Shield',
    level: 3,
    levelLabel: 'LV.3 • CONTENT GOD',
    category: 'progression',
    description:
      'Ascended to high creator status with consistent viral media, capshots, and storytelling.',
    requirementDescription:
      'Complete Mission #6: Creator Velocity (Reach 100 Video Views this cycle).',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 350,
    badgeType: 'gold',
    glowColor: '#F59E0B',
    requiredMissionId: 6,
    requiredMissionCode: 'weekly_views_100',
    requiredMissionName: 'Creator Velocity: 100 Video Views',
  },
  {
    id: 10,
    code: 'distant_winner',
    name: 'Distant Winner',
    subtitle: 'Level 4 Diamond Crystal Trophy',
    level: 4,
    levelLabel: 'LV.4 • DISTANT WINNER',
    category: 'progression',
    description:
      'Outpaced the competition with stellar persistence, ranking on creator leaderboards.',
    requirementDescription:
      'Complete Mission #9: Content Dynamo (Publish at least 3 posts in weekly streak).',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 500,
    badgeType: 'crystal',
    glowColor: '#38BDF8',
    requiredMissionId: 9,
    requiredMissionCode: 'weekly_creator_streak',
    requiredMissionName: 'Content Dynamo: 3 Posts Streak',
  },
  {
    id: 11,
    code: 'boost_pro',
    name: 'Boost Pro (Heroic Grandmaster)',
    subtitle: 'Level 5 Heroic Grandmaster Wings',
    level: 5,
    levelLabel: 'LV.5 • HEROIC GRANDMASTER',
    category: 'progression',
    description:
      'The supreme pinnacle of BoostHub Aba. A legend with fiery wings, royal crown, and mastercraft.',
    requirementDescription:
      'Complete Mission #8: Generous Patron (Send a virtual gift to a creator).',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 1000,
    badgeType: 'grandmaster',
    glowColor: '#EF4444',
    requiredMissionId: 8,
    requiredMissionCode: 'weekly_send_gift',
    requiredMissionName: 'Generous Patron: Send a Gift',
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
    description:
      'Recognized by the community for outstanding creative quality, viral reach, and cultural impact.',
    requirementDescription:
      'Complete Mission #6: Creator Velocity (Reach 100 Video Views).',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 300,
    badgeType: 'gold',
    glowColor: '#EAB308',
    requiredMissionId: 6,
    requiredMissionCode: 'weekly_views_100',
    requiredMissionName: 'Creator Velocity: 100 Video Views',
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
      'A founding creator of BoostHub Aba who joined in the initial season to ignite creator media.',
    requirementDescription:
      'Complete Mission #1: Watch a Capshot Video in the feed.',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 150,
    badgeType: 'bronze',
    glowColor: '#F97316',
    requiredMissionId: 1,
    requiredMissionCode: 'daily_watch_video',
    requiredMissionName: 'Watch a Capshot Video',
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
      'An exemplary supporter who actively connects with creators, gifts crafts, and empowers others.',
    requirementDescription:
      'Complete Mission #5: Follow a Creator or Add a Friend.',
    requirementType: 'missions',
    requirementCount: 1,
    xpReward: 200,
    badgeType: 'silver',
    glowColor: '#06B6D4',
    requiredMissionId: 5,
    requiredMissionCode: 'daily_connect_creator',
    requiredMissionName: 'Follow a Creator or Add a Friend',
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
  completedMissions?: Array<string | number>;
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
  const cleanId = String(user.id || '').trim().toLowerCase();
  const isOnlyMePrinceAbba =
    cleanId === 'eaada352-5704-4566-a7a7-88df80853ada' ||
    cleanId === 'prince_abba_admin_uuid' ||
    cleanId === 'admin-abba-uuid' ||
    cleanId === 'bh_5c82dc8e3aa243a28413' ||
    cleanId === 'abba' ||
    cleanId === 'princeabba';

  // Normalize set of completed mission IDs and codes
  const userMissionsSet = new Set<string>(
    (user.completedMissions || []).map((m) => String(m).toLowerCase())
  );

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

  // Strict requirement: User must have completed the required mission before unlocking the badge!
  const isUnlocked = (def: BadgeDefinition): boolean => {
    if (isOnlyMePrinceAbba) return true;

    const hasMission =
      userMissionsSet.has(String(def.requiredMissionId)) ||
      userMissionsSet.has(def.requiredMissionCode.toLowerCase());

    return hasMission;
  };

  for (const def of USER_BADGES_CATALOG) {
    if (isUnlocked(def)) {
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

  // Handle custom equipped badge ONLY if the user has unlocked it (or is Prince Abba)
  if (user.equippedBadge && !earned.some((b) => b.code === user.equippedBadge)) {
    const found = USER_BADGES_CATALOG.find((b) => b.code === user.equippedBadge);
    if (found && (isOnlyMePrinceAbba || isUnlocked(found))) {
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
  badges: { code: string; level?: number }[] = []
): (BadgeDefinition & { unlocked: boolean }) | null {
  if (!badges || badges.length === 0) return null;

  const priorityOrder = [
    'boost_pro',
    'distant_winner',
    'content_god',
    'engagement_master',
    'firering_editor',
    'rookie',
    'top_creator',
    'early_adopter',
    'community_helper',
  ];

  for (const code of priorityOrder) {
    const has = badges.some((b) => b.code === code);
    if (has) {
      const def = USER_BADGES_CATALOG.find((d) => d.code === code);
      if (def) return { ...def, unlocked: true };
    }
  }

  return null;
}
