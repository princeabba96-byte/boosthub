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
  // Virtual Gifts (strictly sorted from lowest to highest costBp)
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
    code: 'palm_wine',
    name: 'Fresh Palm Wine',
    icon: '🧉',
    category: 'gift',
    costBp: 100,
    rarity: 'Common',
    description:
      'Iko Mmanya! Cool cup of sweet fresh palm wine tapped straight from the village.',
    creatorXpBonus: 30,
    recognitionPoints: 25,
    accentGradient: 'from-amber-600/20 via-orange-500/10 to-transparent',
  },
  {
    code: 'chief_cap',
    name: 'Red Chief Cap',
    icon: '🧢',
    category: 'gift',
    costBp: 200,
    rarity: 'Rare',
    description:
      'Okpu Odogwu! Traditional red cap of high esteem, honor, and distinguished status.',
    creatorXpBonus: 60,
    recognitionPoints: 50,
    accentGradient: 'from-red-600/25 via-rose-500/10 to-transparent',
  },
  {
    code: 'aba_shoes',
    name: 'Aba Made Designer Shoe',
    icon: '👞',
    category: 'gift',
    costBp: 350,
    rarity: 'Rare',
    description:
      'Authentic Ariaria International handcrafted leather kicks with unmatched drip!',
    creatorXpBonus: 110,
    recognitionPoints: 95,
    isFeatured: true,
    accentGradient: 'from-emerald-500/25 via-teal-500/10 to-transparent',
  },
  {
    code: 'fire',
    name: 'Viral Fire',
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
    code: 'gold_chain',
    name: 'Heavy Aba Gold Chain',
    icon: '⛓️',
    category: 'gift',
    costBp: 750,
    rarity: 'Epic',
    description:
      'Solid golden cuban link chain for pure swagger and ultimate street respect.',
    creatorXpBonus: 240,
    recognitionPoints: 190,
    isFeatured: true,
    accentGradient: 'from-yellow-400/25 via-amber-500/15 to-transparent',
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
    code: 'golden_eagle',
    name: 'Golden Eagle of Aba',
    icon: '🦅',
    category: 'gift',
    costBp: 2000,
    rarity: 'Legendary',
    description:
      'Ugo Ocha! Majestic soaring golden eagle representing strength, royalty, and distinction.',
    creatorXpBonus: 650,
    recognitionPoints: 500,
    isFeatured: true,
    accentGradient: 'from-amber-400/30 via-yellow-500/20 to-transparent',
  },
  {
    code: 'crown',
    name: 'Imperial Crown',
    icon: '👑',
    category: 'gift',
    costBp: 3500,
    rarity: 'Legendary',
    description:
      'Royal tribute reserved for top-tier creators. Commands instant profile prestige.',
    creatorXpBonus: 1100,
    recognitionPoints: 900,
    isFeatured: true,
    accentGradient: 'from-yellow-400/30 via-amber-500/20 to-transparent',
  },
  {
    code: 'diamond',
    name: 'Diamond Crystal',
    icon: '💎',
    category: 'gift',
    costBp: 5000,
    rarity: 'Legendary',
    description:
      'Ultra-rare crystalline tribute that shines brightly in the recipient’s Gift Showcase.',
    creatorXpBonus: 1650,
    recognitionPoints: 1400,
    isFeatured: true,
    isLimitedTime: true,
    limitedEndsLabel: '4d 14h left',
    accentGradient: 'from-cyan-400/25 via-sky-500/15 to-transparent',
  },
  {
    code: 'planet_cosmos',
    name: 'Cosmic Planetarium',
    icon: '🪐',
    category: 'gift',
    costBp: 6000,
    rarity: 'Legendary',
    description:
      'Luminous celestial ring planet with orbiting stellar particles and cosmic radiance.',
    creatorXpBonus: 2000,
    recognitionPoints: 1750,
    isFeatured: true,
    accentGradient: 'from-indigo-500/30 via-purple-500/20 to-transparent',
  },
  {
    code: 'cyber_hypercar',
    name: 'Neon Cyber Hypercar',
    icon: '🏎️',
    category: 'gift',
    costBp: 7500,
    rarity: 'Mythic',
    description:
      'Ultra-futuristic high-speed hypercar with glowing cyber neon trails and sound roaring!',
    creatorXpBonus: 2600,
    recognitionPoints: 2300,
    isFeatured: true,
    accentGradient: 'from-cyan-400/35 via-fuchsia-500/25 to-transparent',
  },
  {
    code: 'phoenix_wings',
    name: 'Phoenix Flame Wings',
    icon: '🪽',
    category: 'gift',
    costBp: 8500,
    rarity: 'Legendary',
    description:
      'Majestic immortal blazing wings of fire representing rebirth, courage, and triumph.',
    creatorXpBonus: 3000,
    recognitionPoints: 2700,
    isFeatured: true,
    accentGradient: 'from-orange-500/35 via-red-500/25 to-transparent',
  },
  {
    code: 'trophy',
    name: 'Aba Made Supreme Trophy',
    icon: '🏆',
    category: 'gift',
    costBp: 10000,
    rarity: 'Mythic',
    description:
      'The ultimate championship honor in Aba and across Nigeria! Massive Creator Standing.',
    creatorXpBonus: 3500,
    recognitionPoints: 3000,
    isFeatured: true,
    isLimitedTime: true,
    limitedEndsLabel: '2d 08h left',
    accentGradient: 'from-amber-300/30 via-yellow-500/20 to-transparent',
  },
  {
    code: 'galaxy_crown',
    name: 'Galaxy Emperor Crown',
    icon: '👑',
    category: 'gift',
    costBp: 12000,
    rarity: 'Mythic',
    description:
      'Cosmic starlight crown forged in deep space. Commands majestic celestial aurora celebrations!',
    creatorXpBonus: 4500,
    recognitionPoints: 4000,
    isFeatured: true,
    accentGradient: 'from-purple-500/35 via-amber-400/25 to-transparent',
  },
  {
    code: 'golden_dragon',
    name: 'Imperial Golden Dragon',
    icon: '🐉',
    category: 'gift',
    costBp: 15000,
    rarity: 'Mythic',
    description:
      'The supreme emperor of virtual gifts! Breathes dazzling fireworks and eternal creator prestige.',
    creatorXpBonus: 6000,
    recognitionPoints: 5500,
    isFeatured: true,
    accentGradient: 'from-amber-400/40 via-yellow-300/30 to-transparent',
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
      'Unbox a surprise virtual gift (from Rose up to Crown or Trophy!) added straight to your inventory.',
    creatorXpBonus: 100,
    recognitionPoints: 90,
    isFeatured: true,
    accentGradient: 'from-purple-500/25 via-fuchsia-500/15 to-transparent',
  },

  // Badges (sorted by costBp)
  {
    code: 'badge_aba_supporter',
    name: 'Aba Top Supporter',
    icon: '🏅',
    category: 'badge',
    costBp: 400,
    rarity: 'Rare',
    description:
      'Official badge honoring active patrons who uplift Aba creators and builders.',
    creatorXpBonus: 40,
    recognitionPoints: 35,
    accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  },
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
    code: 'badge_palm_king',
    name: 'Palm King Creator',
    icon: '👑',
    category: 'badge',
    costBp: 800,
    rarity: 'Epic',
    description:
      'Prestigious crown badge recognizing authentic culture and community spirit.',
    creatorXpBonus: 70,
    recognitionPoints: 60,
    isFeatured: true,
    accentGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
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
    code: 'badge_bflash_vip',
    name: 'B-Flash VIP Vanguard',
    icon: '⚡',
    category: 'badge',
    costBp: 1500,
    rarity: 'Epic',
    description:
      'Exclusive electric crest awarded to premier creators and tech innovators.',
    creatorXpBonus: 120,
    recognitionPoints: 100,
    isFeatured: true,
    accentGradient: 'from-purple-500/25 via-pink-500/15 to-transparent',
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
  {
    code: 'badge_aba_legend',
    name: 'Aba Made Legend Crest',
    icon: '🌟',
    category: 'badge',
    costBp: 6000,
    rarity: 'Mythic',
    description:
      'Supreme legendary emblem reserved for the greatest pioneers of Aba Made greatness!',
    creatorXpBonus: 500,
    recognitionPoints: 450,
    isFeatured: true,
    accentGradient: 'from-amber-300/30 via-yellow-400/20 to-transparent',
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
