export type GiftTier =
  | 'Random'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Mythic'
  | 'Grand';

export type GiftBoxType =
  | 'Pink Ribbon Box'
  | 'Red Heart Box'
  | 'Black Gold Luxury Box'
  | 'Galaxy Box with particles'
  | 'Void Box'
  | 'Cosmic God Box';

export type UnboxAnimationType =
  | 'bounce_pop'
  | 'hearts_explode'
  | 'magnetic_snap_gold_beam'
  | 'nebula_smoke'
  | 'void_shatter'
  | 'slow_mo_god_rays';

export interface GiftTierConfig {
  tier: GiftTier;
  label: string;
  priceRange: string;
  boxName: GiftBoxType;
  boxCode: string;
  boxIconPng: string;
  unboxAnimation: UnboxAnimationType;
  unboxLabel: string;
  badgeClass: string;
  borderClass: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  missionRecipe: {
    id: string;
    title: string;
    requirement: string;
    requiredXp: number;
    requiredMissions: number;
  };
}

export const GIFT_TIER_CONFIGS: Record<GiftTier, GiftTierConfig> = {
  Random: {
    tier: 'Random',
    label: 'Random Tier (10-50 pts)',
    priceRange: '10-50 BP',
    boxName: 'Pink Ribbon Box',
    boxCode: 'pink_ribbon_box',
    boxIconPng: '/assets/gifts/pink_ribbon_box.png',
    unboxAnimation: 'bounce_pop',
    unboxLabel: 'Bounce Pop',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    borderClass: 'border-pink-500/40 hover:border-pink-400',
    accentColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    bgGradient: 'from-pink-900/40 via-purple-900/20 to-slate-900/60',
    missionRecipe: {
      id: 'recipe_starter',
      title: 'Starter Gifter Recipe',
      requirement: 'Complete 1 Daily Mission or like 1 post',
      requiredXp: 0,
      requiredMissions: 0,
    },
  },
  Uncommon: {
    tier: 'Uncommon',
    label: 'Uncommon Tier (100-250 pts)',
    priceRange: '100-250 BP',
    boxName: 'Red Heart Box',
    boxCode: 'red_heart_box',
    boxIconPng: '/assets/gifts/red_heart_box.png',
    unboxAnimation: 'hearts_explode',
    unboxLabel: 'Hearts Explode',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderClass: 'border-rose-500/40 hover:border-rose-400',
    accentColor: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    bgGradient: 'from-rose-900/40 via-pink-900/20 to-slate-900/60',
    missionRecipe: {
      id: 'recipe_uncommon',
      title: 'Heart Patron Recipe',
      requirement: 'Complete 1 Daily Mission & reach 50+ XP',
      requiredXp: 50,
      requiredMissions: 1,
    },
  },
  Rare: {
    tier: 'Rare',
    label: 'Rare Tier (500-800 pts)',
    priceRange: '500-800 BP',
    boxName: 'Black Gold Luxury Box',
    boxCode: 'black_gold_luxury_box',
    boxIconPng: '/assets/gifts/black_gold_luxury_box.png',
    unboxAnimation: 'magnetic_snap_gold_beam',
    unboxLabel: 'Magnetic Snap + Gold Beam',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-400/50 hover:border-amber-300',
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    bgGradient: 'from-amber-950/50 via-yellow-950/25 to-slate-950',
    missionRecipe: {
      id: 'recipe_rare',
      title: 'Golden Aristocrat Recipe',
      requirement: 'Complete 3 Daily Missions & reach 250+ XP',
      requiredXp: 250,
      requiredMissions: 2,
    },
  },
  Epic: {
    tier: 'Epic',
    label: 'Epic Tier (1500-2500 pts)',
    priceRange: '1500-2500 BP',
    boxName: 'Galaxy Box with particles',
    boxCode: 'galaxy_box',
    boxIconPng: '/assets/gifts/galaxy_box.png',
    unboxAnimation: 'nebula_smoke',
    unboxLabel: 'Nebula Smoke',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderClass: 'border-purple-500/50 hover:border-purple-400',
    accentColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    bgGradient: 'from-purple-950/60 via-indigo-950/40 to-slate-950',
    missionRecipe: {
      id: 'recipe_epic',
      title: 'Nebula Artisan Recipe',
      requirement: 'Complete 5 Daily Missions & reach 800+ XP',
      requiredXp: 800,
      requiredMissions: 4,
    },
  },
  Mythic: {
    tier: 'Mythic',
    label: 'Mythic Tier (5000 pts)',
    priceRange: '5000 BP',
    boxName: 'Void Box',
    boxCode: 'void_box',
    boxIconPng: '/assets/gifts/void_box.png',
    unboxAnimation: 'void_shatter',
    unboxLabel: 'Void Shatter',
    badgeClass: 'bg-fuchsia-600/25 text-fuchsia-300 border-fuchsia-500/50',
    borderClass: 'border-fuchsia-500/60 hover:border-fuchsia-400',
    accentColor: '#D946EF',
    glowColor: 'rgba(217, 70, 239, 0.6)',
    bgGradient: 'from-fuchsia-950/60 via-slate-950 to-purple-950/60',
    missionRecipe: {
      id: 'recipe_mythic',
      title: 'Void Conqueror Recipe',
      requirement: 'Complete all Daily Missions & reach 2,000+ XP',
      requiredXp: 2000,
      requiredMissions: 6,
    },
  },
  Grand: {
    tier: 'Grand',
    label: 'Grand Tier (10000 pts+)',
    priceRange: '10,000+ BP',
    boxName: 'Cosmic God Box',
    boxCode: 'cosmic_god_box',
    boxIconPng: '/assets/gifts/cosmic_god_box.png',
    unboxAnimation: 'slow_mo_god_rays',
    unboxLabel: 'Slow-mo God Rays',
    badgeClass: 'bg-yellow-400/25 text-yellow-200 border-yellow-400/60 animate-pulse',
    borderClass: 'border-yellow-400/70 hover:border-yellow-300',
    accentColor: '#FACC15',
    glowColor: 'rgba(250, 204, 21, 0.75)',
    bgGradient: 'from-yellow-950/70 via-amber-950/50 to-slate-950',
    missionRecipe: {
      id: 'recipe_grand',
      title: 'Emperor Ascension Recipe',
      requirement: 'Earn 5,000+ XP & unlock Creator Legend tier',
      requiredXp: 5000,
      requiredMissions: 8,
    },
  },
};

export function isGiftRecipeUnlocked(
  tier: GiftTier,
  userXp: number = 0,
  completedMissionsCount: number = 0,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  const cfg = GIFT_TIER_CONFIGS[tier];
  if (!cfg) return true;
  if (tier === 'Random') return true;
  return (
    userXp >= cfg.missionRecipe.requiredXp ||
    completedMissionsCount >= cfg.missionRecipe.requiredMissions
  );
}
