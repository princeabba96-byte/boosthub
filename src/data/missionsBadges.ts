export interface BoostLevelDef {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  badgeCode: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  frameCode: string;
  frameName: string;
  frameBorderClass: string;
  profileIconUrl: string;
  description: string;
  perks: string[];
}

export interface UnlockedBadgeItem {
  code: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'neon' | 'mythic';
  color: string;
  requirement: string;
  unlocked: boolean;
  equipped: boolean;
  category: 'daily' | 'weekly' | 'level' | 'creator';
}

export const BOOST_LEVELS: BoostLevelDef[] = [
  {
    level: 1,
    name: 'Spark Creator',
    minXp: 0,
    maxXp: 499,
    badgeCode: 'badge_spark',
    badgeName: 'Spark Scout',
    badgeIcon: '⚡',
    badgeColor: '#38BDF8',
    frameCode: 'frame_spark',
    frameName: 'Electric Cyan Glow',
    frameBorderClass: 'ring-2 ring-cyan-400 shadow-cyan-500/30',
    profileIconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    description: 'Beginner creator taking their first steps on BoostHub.',
    perks: ['Unlock B-Edit Studio AI Voices', 'Capshots Feed Eligibility'],
  },
  {
    level: 2,
    name: 'Flame Pioneer',
    minXp: 500,
    maxXp: 1499,
    badgeCode: 'badge_flame',
    badgeName: 'Flame Pioneer',
    badgeIcon: '🔥',
    badgeColor: '#F97316',
    frameCode: 'frame_flame',
    frameName: 'Blazing Amber Ring',
    frameBorderClass: 'ring-2 ring-orange-500 shadow-orange-500/40',
    profileIconUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80',
    description: 'Consistent creator with regular daily content submissions.',
    perks: ['+15% Boost Point Bonus on Missions', 'Exclusive Flame Profile Icon'],
  },
  {
    level: 3,
    name: 'Blaze Champion',
    minXp: 1500,
    maxXp: 3499,
    badgeCode: 'badge_blaze',
    badgeName: 'Blaze Champion',
    badgeIcon: '🌟',
    badgeColor: '#FBBF24',
    frameCode: 'frame_golden_blaze',
    frameName: 'Golden Champion Crest',
    frameBorderClass: 'ring-2 ring-amber-400 shadow-amber-400/50 shadow-lg',
    profileIconUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=150&auto=format&fit=crop&q=80',
    description: 'Community standout who frequently hits weekly milestones.',
    perks: ['Golden Badge on Posts & Comments', 'Unlocks Custom Profile Theme'],
  },
  {
    level: 4,
    name: 'Supernova Elite',
    minXp: 3500,
    maxXp: 6999,
    badgeCode: 'badge_supernova',
    badgeName: 'Cosmic Supernova',
    badgeIcon: '💫',
    badgeColor: '#A855F7',
    frameCode: 'frame_supernova',
    frameName: 'Cosmic Violet Aura',
    frameBorderClass: 'ring-2 ring-purple-400 shadow-purple-500/60 shadow-xl',
    profileIconUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&auto=format&fit=crop&q=80',
    description: 'Elite viral creator with high watch-through rates and shares.',
    perks: ['Animated Supernova Badge Aura', 'Priority Capshots Feed Boost', 'B-Shop Exclusive Drops'],
  },
  {
    level: 5,
    name: 'Apex Titan',
    minXp: 7000,
    maxXp: 9999999,
    badgeCode: 'badge_apex_titan',
    badgeName: 'Apex Titan Crown',
    badgeIcon: '👑',
    badgeColor: '#EC4899',
    frameCode: 'frame_apex_titan',
    frameName: 'Mythic Cyberpunk Diamond',
    frameBorderClass: 'ring-4 ring-pink-500 shadow-pink-500/80 shadow-2xl animate-pulse',
    profileIconUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
    description: 'Peak BoostHub royalty who has conquered all challenges.',
    perks: ['Mythic Crown Badge by Username', 'Permanent 2x Boost Point Multiplier', 'Direct Line to Founder Team'],
  },
];

export function getBoostLevelForXp(xp: number): BoostLevelDef {
  const safeXp = Math.max(0, Number(xp) || 0);
  for (let i = BOOST_LEVELS.length - 1; i >= 0; i--) {
    if (safeXp >= BOOST_LEVELS[i].minXp) {
      return BOOST_LEVELS[i];
    }
  }
  return BOOST_LEVELS[0];
}

export function getNextBoostLevel(currentLevel: number): BoostLevelDef | null {
  const next = BOOST_LEVELS.find((l) => l.level === currentLevel + 1);
  return next || null;
}

export function getWeeklyResetCountdown(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  nextResetIso: string;
} {
  const now = new Date();
  const nextMonday = new Date(now);
  // Reset every Monday 00:00 UTC
  const day = nextMonday.getUTCDay();
  const diffDays = day === 0 ? 1 : 8 - day;
  nextMonday.setUTCDate(nextMonday.getUTCDate() + diffDays);
  nextMonday.setUTCHours(0, 0, 0, 0);

  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const formatted = `${days}d ${hours}h ${minutes}m`;
  return {
    days,
    hours,
    minutes,
    seconds,
    formatted,
    nextResetIso: nextMonday.toISOString(),
  };
}

export function getCurrentWeekCycleId(): string {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7
  );
  return `${now.getUTCFullYear()}-W${weekNum}`;
}
