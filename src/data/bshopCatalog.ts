export type BShopItemCategory =
  | 'gift'
  | 'mystery_box'
  | 'frame'
  | 'badge'
  | 'name_style';

export type BShopItemRarity =
  | 'Common'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic';

export interface BShopCatalogItem {
  code: string;
  name: string;
  icon: string;
  category: BShopItemCategory;
  costBp: number;
  rarity: BShopItemRarity;
  description: string;
  creatorXpBonus: number;
  recognitionPoints: number;
  isFeatured?: boolean;
  isLimitedTime?: boolean;
  limitedEndsLabel?: string;
  accentGradient: string;
  previewClass?: string;
}

export const BSHOP_CATALOG: BShopCatalogItem[] = [
  // Virtual Gifts
  {
    code: 'rose',
    name: 'Rose',
    icon: '🌹',
    category: 'gift',
    costBp: 50,
    rarity: 'Common',
    description:
      'A classic token of appreciation to brighten a creator’s day and boost their standing.',
    creatorXpBonus: 15,
    recognitionPoints: 10,
    accentGradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
  },
  {
    code: 'heart',
    name: 'Heart',
    icon: '❤️',
    category: 'gift',
    costBp: 100,
    rarity: 'Common',
    description:
      'Show genuine love for a creator’s post, Capshot, or community contribution.',
    creatorXpBonus: 30,
    recognitionPoints: 25,
    accentGradient: 'from-red-500/20 via-rose-500/10 to-transparent',
  },
  {
    code: 'star',
    name: 'Star',
    icon: '⭐',
    category: 'gift',
    costBp: 250,
    rarity: 'Rare',
    description:
      'Spotlight standout talent and elevate their Creator Dashboard recognition.',
    creatorXpBonus: 75,
    recognitionPoints: 60,
    accentGradient: 'from-amber-400/20 via-yellow-500/10 to-transparent',
  },
  {
    code: 'fire',
    name: 'Fire',
    icon: '🔥',
    category: 'gift',
    costBp: 500,
    rarity: 'Rare',
    description:
      'Ignite hype on high-heat content and boost creator momentum across BoostHub.',
    creatorXpBonus: 150,
    recognitionPoints: 125,
    isFeatured: true,
    accentGradient: 'from-orange-500/25 via-amber-500/10 to-transparent',
  },
  {
    code: 'rocket',
    name: 'Rocket',
    icon: '🚀',
    category: 'gift',
    costBp: 1000,
    rarity: 'Epic',
    description:
      'Propel a creator into the stratosphere with major recognition and Creator XP.',
    creatorXpBonus: 320,
    recognitionPoints: 250,
    isFeatured: true,
    accentGradient: 'from-blue-500/25 via-indigo-500/10 to-transparent',
  },
  {
    code: 'crown',
    name: 'Crown',
    icon: '👑',
    category: 'gift',
    costBp: 2500,
    rarity: 'Epic',
    description:
      'Royal tribute reserved for top-tier creators. Commands instant profile prestige.',
    creatorXpBonus: 800,
    recognitionPoints: 650,
    isFeatured: true,
    accentGradient: 'from-yellow-400/25 via-amber-500/15 to-transparent',
  },
  {
    code: 'diamond',
    name: 'Diamond',
    icon: '💎',
    category: 'gift',
    costBp: 5000,
    rarity: 'Legendary',
    description:
      'Ultra-rare crystalline tribute that shines in the recipient’s Gift Showcase.',
    creatorXpBonus: 1650,
    recognitionPoints: 1400,
    isFeatured: true,
    isLimitedTime: true,
    limitedEndsLabel: '4d 14h left',
    accentGradient: 'from-cyan-400/25 via-sky-500/15 to-transparent',
  },
  {
    code: 'trophy',
    name: 'Trophy',
    icon: '🏆',
    category: 'gift',
    costBp: 10000,
    rarity: 'Mythic',
    description:
      'The ultimate championship honor on BoostHub. Awards massive Creator Standing.',
    creatorXpBonus: 3500,
    recognitionPoints: 3000,
    isFeatured: true,
    isLimitedTime: true,
    limitedEndsLabel: '2d 08h left',
    accentGradient: 'from-amber-300/30 via-yellow-500/15 to-transparent',
  },

  // Mystery Box
  {
    code: 'mystery_box',
    name: 'Mystery Box',
    icon: '🎁',
    category: 'mystery_box',
    costBp: 350,
    rarity: 'Epic',
    description:
      'Unbox a surprise virtual gift (from Rose up to Crown or Diamond!) added straight to your Gift Inventory.',
    creatorXpBonus: 100,
    recognitionPoints: 90,
    isFeatured: true,
    accentGradient: 'from-purple-500/25 via-fuchsia-500/15 to-transparent',
  },

  // Profile Effects / Frames
  {
    code: 'frame_neon_pulse',
    name: 'Neon Pulse Frame',
    icon: '✨',
    category: 'frame',
    costBp: 600,
    rarity: 'Epic',
    description:
      'Surrounds your profile picture with a luminous cyan-and-cobalt electric ring.',
    creatorXpBonus: 50,
    recognitionPoints: 40,
    isFeatured: true,
    accentGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    previewClass: 'ring-4 ring-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.65)]',
  },
  {
    code: 'frame_royal_gold',
    name: 'Imperial Gold Frame',
    icon: '✨',
    category: 'frame',
    costBp: 1800,
    rarity: 'Legendary',
    description:
      'Radiant golden sovereign border around your avatar across your profile and showcase.',
    creatorXpBonus: 120,
    recognitionPoints: 100,
    isLimitedTime: true,
    limitedEndsLabel: '3d 19h left',
    accentGradient: 'from-amber-400/25 via-yellow-500/10 to-transparent',
    previewClass: 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.7)]',
  },
  {
    code: 'frame_cyber_halo',
    name: 'Cyber Violet Halo',
    icon: '✨',
    category: 'frame',
    costBp: 1100,
    rarity: 'Epic',
    description:
      'Deep ultraviolet aura ring that highlights your profile presence.',
    creatorXpBonus: 80,
    recognitionPoints: 65,
    accentGradient: 'from-purple-500/25 via-pink-500/10 to-transparent',
    previewClass: 'ring-4 ring-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.65)]',
  },

  // Limited-Time Badges
  {
    code: 'badge_og_vanguard',
    name: 'Boost Vanguard Badge',
    icon: '🏅',
    category: 'badge',
    costBp: 750,
    rarity: 'Rare',
    description:
      'Limited-time season emblem displayed next to your name on your profile.',
    creatorXpBonus: 60,
    recognitionPoints: 50,
    isLimitedTime: true,
    limitedEndsLabel: '5d 06h left',
    accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  },
  {
    code: 'badge_creator_patron',
    name: 'Top Patron Emblem',
    icon: '🏅',
    category: 'badge',
    costBp: 1200,
    rarity: 'Epic',
    description:
      'Distinguishes supporters who actively uplift creators in the BoostHub economy.',
    creatorXpBonus: 95,
    recognitionPoints: 80,
    isFeatured: true,
    accentGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
  },
  {
    code: 'badge_diamond_sovereign',
    name: 'Diamond Sovereign Crest',
    icon: '🏅',
    category: 'badge',
    costBp: 3200,
    rarity: 'Legendary',
    description:
      'Prestigious seasonal collector crest with high-tier recognition status.',
    creatorXpBonus: 240,
    recognitionPoints: 200,
    isLimitedTime: true,
    limitedEndsLabel: '1d 22h left',
    accentGradient: 'from-sky-400/25 via-indigo-500/15 to-transparent',
  },

  // Name / Profile Decorations
  {
    code: 'name_aurora_glow',
    name: 'Aurora Name Glow',
    icon: '🎨',
    category: 'name_style',
    costBp: 850,
    rarity: 'Epic',
    description:
      'Styles your profile display name in a vivid cyan-to-violet aurora gradient.',
    creatorXpBonus: 70,
    recognitionPoints: 55,
    isFeatured: true,
    accentGradient: 'from-teal-400/20 via-purple-500/10 to-transparent',
    previewClass:
      'bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent',
  },
  {
    code: 'name_imperial_gold',
    name: 'Imperial Gold Name',
    icon: '🎨',
    category: 'name_style',
    costBp: 1500,
    rarity: 'Legendary',
    description:
      'Transforms your profile display name into a lustrous metallic gold finish.',
    creatorXpBonus: 110,
    recognitionPoints: 90,
    isLimitedTime: true,
    limitedEndsLabel: '3d 11h left',
    accentGradient: 'from-amber-300/25 via-orange-500/10 to-transparent',
    previewClass:
      'bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent',
  },
  {
    code: 'name_crimson_flame',
    name: 'Solar Flare Name',
    icon: '🎨',
    category: 'name_style',
    costBp: 950,
    rarity: 'Epic',
    description:
      'Gives your profile display name a warm sunset-rose and ember gradient.',
    creatorXpBonus: 75,
    recognitionPoints: 60,
    accentGradient: 'from-rose-500/20 via-orange-500/10 to-transparent',
    previewClass:
      'bg-gradient-to-r from-rose-300 via-pink-400 to-amber-300 bg-clip-text text-transparent',
  },
];

export const GIFT_ITEMS_ONLY = BSHOP_CATALOG.filter(
  (item) => item.category === 'gift'
);

export function getBShopItemByCode(code: string): BShopCatalogItem | undefined {
  return BSHOP_CATALOG.find((i) => i.code === code);
}

export function rollMysteryBoxReward(): {
  item: BShopCatalogItem;
  quantity: number;
} {
  const roll = Math.random() * 100;
  // Weighted drop table:
  // 30% -> 3x Rose (150 BP value)
  // 25% -> 2x Heart (200 BP value)
  // 20% -> 2x Star (500 BP value)
  // 13% -> 1x Fire (500 BP value)
  // 8%  -> 1x Rocket (1,000 BP value)
  // 3%  -> 1x Crown (2,500 BP value)
  // 1%  -> 1x Diamond (5,000 BP value)
  if (roll < 30) {
    return { item: getBShopItemByCode('rose')!, quantity: 3 };
  }
  if (roll < 55) {
    return { item: getBShopItemByCode('heart')!, quantity: 2 };
  }
  if (roll < 75) {
    return { item: getBShopItemByCode('star')!, quantity: 2 };
  }
  if (roll < 88) {
    return { item: getBShopItemByCode('fire')!, quantity: 1 };
  }
  if (roll < 96) {
    return { item: getBShopItemByCode('rocket')!, quantity: 1 };
  }
  if (roll < 99) {
    return { item: getBShopItemByCode('crown')!, quantity: 1 };
  }
  return { item: getBShopItemByCode('diamond')!, quantity: 1 };
}

export function getFrameRingClasses(frameCode?: string): string {
  if (!frameCode) return '';
  const found = getBShopItemByCode(frameCode);
  return found?.previewClass || '';
}

export function getNameStyleClasses(nameStyleCode?: string): string {
  if (!nameStyleCode) return 'text-white';
  const found = getBShopItemByCode(nameStyleCode);
  return found?.previewClass || 'text-white';
}
