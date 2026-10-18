import { getGiftPngUrl } from "./giftPngAssets";
import {
  GiftBoxType,
  GiftTier,
  GIFT_TIER_CONFIGS,
  UnboxAnimationType,
} from './giftTiers';

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
  | 'Mythic'
  | 'Grand';

export interface BShopCatalogItem {
  code: string;
  name: string;
  icon: string;
  iconPng: string;
  category: BShopItemCategory;
  costBp: number;
  rarity: BShopItemRarity;
  tier?: GiftTier;
  boxType?: GiftBoxType;
  boxCode?: string;
  boxIconPng?: string;
  unboxAnimation?: UnboxAnimationType;
  rankOrder?: number;
  recipeRequirement?: string;
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
  // ==========================================
  // TIER 1: RANDOM (10 - 50 pts)
  // Box: Pink Ribbon Box | Animation: bounce pop
  // ==========================================
  {
    code: 'neon_star',
    name: 'Neon Star',
    icon: '⭐',
    iconPng: getGiftPngUrl('neon_star'),
    category: 'gift',
    costBp: 10,
    rarity: 'Common',
    tier: 'Random',
    boxType: 'Pink Ribbon Box',
    boxCode: 'pink_ribbon_box',
    boxIconPng: getGiftPngUrl('pink_ribbon_box'),
    unboxAnimation: 'bounce_pop',
    rankOrder: 1,
    recipeRequirement: 'Starter Gifter Recipe: Complete 1 Daily Mission',
    description: 'A radiant electric neon star that pulses with vibrant cyan-indigo energy.',
    creatorXpBonus: 10,
    recognitionPoints: 8,
    isFeatured: true,
    accentGradient: 'from-pink-500/20 via-cyan-500/10 to-transparent',
  },
  {
    code: 'wobbly_duck',
    name: 'Wobbly Duck',
    icon: '🦆',
    iconPng: getGiftPngUrl('wobbly_duck'),
    category: 'gift',
    costBp: 25,
    rarity: 'Common',
    tier: 'Random',
    boxType: 'Pink Ribbon Box',
    boxCode: 'pink_ribbon_box',
    boxIconPng: getGiftPngUrl('pink_ribbon_box'),
    unboxAnimation: 'bounce_pop',
    rankOrder: 2,
    recipeRequirement: 'Starter Gifter Recipe: Complete 1 Daily Mission',
    description: 'An adorable wobbly rubber duck that squeaks playfully on the creator’s screen.',
    creatorXpBonus: 20,
    recognitionPoints: 15,
    accentGradient: 'from-yellow-400/20 via-pink-500/10 to-transparent',
  },
  {
    code: 'pizza_slice',
    name: 'Pizza Slice',
    icon: '🍕',
    iconPng: getGiftPngUrl('pizza_slice'),
    category: 'gift',
    costBp: 35,
    rarity: 'Common',
    tier: 'Random',
    boxType: 'Pink Ribbon Box',
    boxCode: 'pink_ribbon_box',
    boxIconPng: getGiftPngUrl('pink_ribbon_box'),
    unboxAnimation: 'bounce_pop',
    rankOrder: 3,
    recipeRequirement: 'Starter Gifter Recipe: Complete 1 Daily Mission',
    description: 'A sizzling hot artisan pepperoni pizza slice with stretching melted cheese.',
    creatorXpBonus: 30,
    recognitionPoints: 20,
    accentGradient: 'from-red-500/20 via-orange-500/10 to-transparent',
  },
  {
    code: 'lucky_dice',
    name: 'Lucky Dice',
    icon: '🎲',
    iconPng: getGiftPngUrl('lucky_dice'),
    category: 'gift',
    costBp: 50,
    rarity: 'Common',
    tier: 'Random',
    boxType: 'Pink Ribbon Box',
    boxCode: 'pink_ribbon_box',
    boxIconPng: getGiftPngUrl('pink_ribbon_box'),
    unboxAnimation: 'bounce_pop',
    rankOrder: 4,
    recipeRequirement: 'Starter Gifter Recipe: Complete 1 Daily Mission',
    description: 'Pair of lucky crystal casino dice rolling natural high numbers for your stream.',
    creatorXpBonus: 40,
    recognitionPoints: 30,
    accentGradient: 'from-pink-500/25 via-rose-500/10 to-transparent',
  },

  // ==========================================
  // TIER 2: UNCOMMON (100 - 250 pts)
  // Box: Red Heart Box | Animation: hearts explode
  // ==========================================
  {
    code: 'lightning_bolt',
    name: 'Lightning Bolt',
    icon: '⚡',
    iconPng: getGiftPngUrl('lightning_bolt'),
    category: 'gift',
    costBp: 100,
    rarity: 'Common',
    tier: 'Uncommon',
    boxType: 'Red Heart Box',
    boxCode: 'red_heart_box',
    boxIconPng: getGiftPngUrl('red_heart_box'),
    unboxAnimation: 'hearts_explode',
    rankOrder: 5,
    recipeRequirement: 'Heart Patron Recipe: Complete 1 Daily Mission & reach 50+ XP',
    description: 'A crackling high-voltage lightning bolt delivering an instant boost of hype.',
    creatorXpBonus: 60,
    recognitionPoints: 50,
    isFeatured: true,
    accentGradient: 'from-rose-500/25 via-amber-400/15 to-transparent',
  },
  {
    code: 'golden_rose',
    name: 'Golden Rose',
    icon: '🌹',
    iconPng: getGiftPngUrl('golden_rose'),
    category: 'gift',
    costBp: 180,
    rarity: 'Common',
    tier: 'Uncommon',
    boxType: 'Red Heart Box',
    boxCode: 'red_heart_box',
    boxIconPng: getGiftPngUrl('red_heart_box'),
    unboxAnimation: 'hearts_explode',
    rankOrder: 6,
    recipeRequirement: 'Heart Patron Recipe: Complete 1 Daily Mission & reach 50+ XP',
    description: 'A genuine 24-karat dipped golden rose with shimmering velvety petals.',
    creatorXpBonus: 90,
    recognitionPoints: 75,
    accentGradient: 'from-amber-400/25 via-rose-500/15 to-transparent',
  },
  {
    code: 'crystal_crown_mini',
    name: 'Crystal Crown Mini',
    icon: '👑',
    iconPng: getGiftPngUrl('crystal_crown_mini'),
    category: 'gift',
    costBp: 250,
    rarity: 'Common',
    tier: 'Uncommon',
    boxType: 'Red Heart Box',
    boxCode: 'red_heart_box',
    boxIconPng: getGiftPngUrl('red_heart_box'),
    unboxAnimation: 'hearts_explode',
    rankOrder: 7,
    recipeRequirement: 'Heart Patron Recipe: Complete 1 Daily Mission & reach 50+ XP',
    description: 'Petite royal crown carved from iridescent blue crystal and platinum.',
    creatorXpBonus: 120,
    recognitionPoints: 100,
    accentGradient: 'from-cyan-400/25 via-rose-500/15 to-transparent',
  },

  // ==========================================
  // TIER 3: RARE (500 - 800 pts)
  // Box: Black Gold Luxury Box | Animation: magnetic snap + gold beam
  // ==========================================
  {
    code: 'serpent_ring',
    name: 'Serpent Ring',
    icon: '💍',
    iconPng: getGiftPngUrl('serpent_ring'),
    category: 'gift',
    costBp: 500,
    rarity: 'Rare',
    tier: 'Rare',
    boxType: 'Black Gold Luxury Box',
    boxCode: 'black_gold_luxury_box',
    boxIconPng: getGiftPngUrl('black_gold_luxury_box'),
    unboxAnimation: 'magnetic_snap_gold_beam',
    rankOrder: 8,
    recipeRequirement: 'Golden Aristocrat Recipe: Complete 3 Daily Missions & reach 250+ XP',
    description: 'An emerald-eyed serpent signet ring forged in black gold with ancient protective wards.',
    creatorXpBonus: 200,
    recognitionPoints: 160,
    isFeatured: true,
    accentGradient: 'from-emerald-500/25 via-amber-500/15 to-transparent',
  },
  {
    code: 'dragon_egg',
    name: 'Dragon Egg',
    icon: '🥚',
    iconPng: getGiftPngUrl('dragon_egg'),
    category: 'gift',
    costBp: 600,
    rarity: 'Rare',
    tier: 'Rare',
    boxType: 'Black Gold Luxury Box',
    boxCode: 'black_gold_luxury_box',
    boxIconPng: getGiftPngUrl('black_gold_luxury_box'),
    unboxAnimation: 'magnetic_snap_gold_beam',
    rankOrder: 9,
    recipeRequirement: 'Golden Aristocrat Recipe: Complete 3 Daily Missions & reach 250+ XP',
    description: 'Warm obsidian dragon egg covered in glowing crimson dragon scales.',
    creatorXpBonus: 240,
    recognitionPoints: 190,
    accentGradient: 'from-orange-500/25 via-amber-500/15 to-transparent',
  },
  {
    code: 'angel_wings',
    name: 'Angel Wings',
    icon: '🪽',
    iconPng: getGiftPngUrl('angel_wings'),
    category: 'gift',
    costBp: 700,
    rarity: 'Rare',
    tier: 'Rare',
    boxType: 'Black Gold Luxury Box',
    boxCode: 'black_gold_luxury_box',
    boxIconPng: getGiftPngUrl('black_gold_luxury_box'),
    unboxAnimation: 'magnetic_snap_gold_beam',
    rankOrder: 10,
    recipeRequirement: 'Golden Aristocrat Recipe: Complete 3 Daily Missions & reach 250+ XP',
    description: 'Majestic celestial feathered wings glowing with divine golden radiance.',
    creatorXpBonus: 280,
    recognitionPoints: 230,
    accentGradient: 'from-sky-300/30 via-amber-400/15 to-transparent',
  },
  {
    code: 'demon_horns',
    name: 'Demon Horns',
    icon: '😈',
    iconPng: getGiftPngUrl('demon_horns'),
    category: 'gift',
    costBp: 800,
    rarity: 'Rare',
    tier: 'Rare',
    boxType: 'Black Gold Luxury Box',
    boxCode: 'black_gold_luxury_box',
    boxIconPng: getGiftPngUrl('black_gold_luxury_box'),
    unboxAnimation: 'magnetic_snap_gold_beam',
    rankOrder: 11,
    recipeRequirement: 'Golden Aristocrat Recipe: Complete 3 Daily Missions & reach 250+ XP',
    description: 'Crimson demon horns wrapped in glowing obsidian runes and dark fire.',
    creatorXpBonus: 320,
    recognitionPoints: 260,
    accentGradient: 'from-rose-600/30 via-amber-500/15 to-transparent',
  },

  // ==========================================
  // TIER 4: EPIC (1500 - 2500 pts)
  // Box: Galaxy Box with particles | Animation: nebula smoke
  // ==========================================
  {
    code: 'galaxy_sword',
    name: 'Galaxy Sword',
    icon: '⚔️',
    iconPng: getGiftPngUrl('galaxy_sword'),
    category: 'gift',
    costBp: 1500,
    rarity: 'Epic',
    tier: 'Epic',
    boxType: 'Galaxy Box with particles',
    boxCode: 'galaxy_box',
    boxIconPng: getGiftPngUrl('galaxy_box'),
    unboxAnimation: 'nebula_smoke',
    rankOrder: 12,
    recipeRequirement: 'Nebula Artisan Recipe: Complete 5 Daily Missions & reach 800+ XP',
    description: 'Forged from fallen stellar meteorites, slicing through the darkness with nebula light.',
    creatorXpBonus: 500,
    recognitionPoints: 400,
    isFeatured: true,
    accentGradient: 'from-purple-500/30 via-cyan-500/20 to-transparent',
  },
  {
    code: 'star_serpent_crown',
    name: 'Star Serpent Crown',
    icon: '👑',
    iconPng: getGiftPngUrl('star_serpent_crown'),
    category: 'gift',
    costBp: 1800,
    rarity: 'Epic',
    tier: 'Epic',
    boxType: 'Galaxy Box with particles',
    boxCode: 'galaxy_box',
    boxIconPng: getGiftPngUrl('galaxy_box'),
    unboxAnimation: 'nebula_smoke',
    rankOrder: 13,
    recipeRequirement: 'Nebula Artisan Recipe: Complete 5 Daily Missions & reach 800+ XP',
    description: 'Crown of the cosmic dragon constellation, radiating starry purple and teal auroras.',
    creatorXpBonus: 600,
    recognitionPoints: 480,
    accentGradient: 'from-indigo-500/30 via-purple-500/20 to-transparent',
  },
  {
    code: 'frost_phoenix_pet',
    name: 'Frost Phoenix Pet',
    icon: '🦅',
    iconPng: getGiftPngUrl('frost_phoenix_pet'),
    category: 'gift',
    costBp: 2200,
    rarity: 'Epic',
    tier: 'Epic',
    boxType: 'Galaxy Box with particles',
    boxCode: 'galaxy_box',
    boxIconPng: getGiftPngUrl('galaxy_box'),
    unboxAnimation: 'nebula_smoke',
    rankOrder: 14,
    recipeRequirement: 'Nebula Artisan Recipe: Complete 5 Daily Missions & reach 800+ XP',
    description: 'A magical companion bird born from glacial comets, flapping wings of icy stardust.',
    creatorXpBonus: 750,
    recognitionPoints: 600,
    accentGradient: 'from-cyan-400/30 via-blue-500/20 to-transparent',
  },
  {
    code: 'void_eye',
    name: 'Void Eye',
    icon: '👁️',
    iconPng: getGiftPngUrl('void_eye'),
    category: 'gift',
    costBp: 2500,
    rarity: 'Epic',
    tier: 'Epic',
    boxType: 'Galaxy Box with particles',
    boxCode: 'galaxy_box',
    boxIconPng: getGiftPngUrl('galaxy_box'),
    unboxAnimation: 'nebula_smoke',
    rankOrder: 15,
    recipeRequirement: 'Nebula Artisan Recipe: Complete 5 Daily Missions & reach 800+ XP',
    description: 'An ancient ocular singularity peering into alternate dimensions of the multiverse.',
    creatorXpBonus: 850,
    recognitionPoints: 700,
    isLimitedTime: true,
    limitedEndsLabel: '3d 12h left',
    accentGradient: 'from-fuchsia-600/30 via-purple-900/20 to-transparent',
  },

  // ==========================================
  // TIER 5: MYTHIC (5000 pts)
  // Box: Void Box | Animation: void shatter
  // ==========================================
  {
    code: 'titan_gauntlet',
    name: 'Titan Gauntlet',
    icon: '🥊',
    iconPng: getGiftPngUrl('titan_gauntlet'),
    category: 'gift',
    costBp: 5000,
    rarity: 'Mythic',
    tier: 'Mythic',
    boxType: 'Void Box',
    boxCode: 'void_box',
    boxIconPng: getGiftPngUrl('void_box'),
    unboxAnimation: 'void_shatter',
    rankOrder: 16,
    recipeRequirement: 'Void Conqueror Recipe: Complete all Daily Missions & reach 2,000+ XP',
    description: 'The legendary golden gauntlet socketed with elemental infinity singularities.',
    creatorXpBonus: 1600,
    recognitionPoints: 1300,
    isFeatured: true,
    accentGradient: 'from-amber-400/35 via-fuchsia-500/20 to-transparent',
  },
  {
    code: 'celestial_throne',
    name: 'Celestial Throne',
    icon: '🪑',
    iconPng: getGiftPngUrl('celestial_throne'),
    category: 'gift',
    costBp: 5000,
    rarity: 'Mythic',
    tier: 'Mythic',
    boxType: 'Void Box',
    boxCode: 'void_box',
    boxIconPng: getGiftPngUrl('void_box'),
    unboxAnimation: 'void_shatter',
    rankOrder: 17,
    recipeRequirement: 'Void Conqueror Recipe: Complete all Daily Missions & reach 2,000+ XP',
    description: 'The supreme golden royal seat hovering above stellar clouds in the higher cosmos.',
    creatorXpBonus: 1600,
    recognitionPoints: 1300,
    accentGradient: 'from-purple-500/35 via-yellow-400/20 to-transparent',
  },
  {
    code: 'star_serpent_pet',
    name: 'Star Serpent Pet',
    icon: '🐉',
    iconPng: getGiftPngUrl('star_serpent_pet'),
    category: 'gift',
    costBp: 5000,
    rarity: 'Mythic',
    tier: 'Mythic',
    boxType: 'Void Box',
    boxCode: 'void_box',
    boxIconPng: getGiftPngUrl('void_box'),
    unboxAnimation: 'void_shatter',
    rankOrder: 18,
    recipeRequirement: 'Void Conqueror Recipe: Complete all Daily Missions & reach 2,000+ XP',
    description: 'Living star dragon whelp swirling around the creator with iridescent stellar scales.',
    creatorXpBonus: 1650,
    recognitionPoints: 1400,
    isLimitedTime: true,
    limitedEndsLabel: '4d 08h left',
    accentGradient: 'from-cyan-400/35 via-indigo-600/20 to-transparent',
  },

  // ==========================================
  // TIER 6: GRAND (10000 pts+)
  // Box: Cosmic God Box | Animation: slow-mo god rays
  // ==========================================
  {
    code: 'crown_of_infinite_stars',
    name: 'Crown of Infinite Stars',
    icon: '👑',
    iconPng: getGiftPngUrl('crown_of_infinite_stars'),
    category: 'gift',
    costBp: 10000,
    rarity: 'Grand',
    tier: 'Grand',
    boxType: 'Cosmic God Box',
    boxCode: 'cosmic_god_box',
    boxIconPng: getGiftPngUrl('cosmic_god_box'),
    unboxAnimation: 'slow_mo_god_rays',
    rankOrder: 19,
    recipeRequirement: 'Emperor Ascension Recipe: Earn 5,000+ XP & unlock Creator Legend tier',
    description: 'The crown that binds galaxies together — blinding god rays and diamond stars.',
    creatorXpBonus: 3500,
    recognitionPoints: 3000,
    isFeatured: true,
    accentGradient: 'from-yellow-400/40 via-amber-500/25 to-transparent',
  },
  {
    code: 'star_serpent_emperor',
    name: 'Star Serpent Emperor',
    icon: '🐲',
    iconPng: getGiftPngUrl('star_serpent_emperor'),
    category: 'gift',
    costBp: 15000,
    rarity: 'Grand',
    tier: 'Grand',
    boxType: 'Cosmic God Box',
    boxCode: 'cosmic_god_box',
    boxIconPng: getGiftPngUrl('cosmic_god_box'),
    unboxAnimation: 'slow_mo_god_rays',
    rankOrder: 20,
    recipeRequirement: 'Emperor Ascension Recipe: Earn 5,000+ XP & unlock Creator Legend tier',
    description: 'The pinnacle cosmic deity of BoostHub. Transcendent golden dragon god of infinite light.',
    creatorXpBonus: 5000,
    recognitionPoints: 4500,
    isFeatured: true,
    isLimitedTime: true,
    limitedEndsLabel: '1d 18h left',
    accentGradient: 'from-amber-300/45 via-yellow-500/30 to-transparent',
  },

  // Mystery Box (Special Surprise)
  {
    code: 'mystery_box',
    name: 'Mystery Gift Box',
    icon: '🎁',
    iconPng: getGiftPngUrl('galaxy_box'),
    category: 'mystery_box',
    costBp: 350,
    rarity: 'Epic',
    tier: 'Epic',
    boxType: 'Galaxy Box with particles',
    boxCode: 'galaxy_box',
    boxIconPng: getGiftPngUrl('galaxy_box'),
    unboxAnimation: 'nebula_smoke',
    rankOrder: 0,
    recipeRequirement: 'Instant Unlock',
    description:
      'Unbox a surprise gift tier reward from Neon Star up to Crown of Infinite Stars!',
    creatorXpBonus: 100,
    recognitionPoints: 90,
    isFeatured: true,
    accentGradient: 'from-purple-500/25 via-fuchsia-500/15 to-transparent',
  },

  // Badges
  {
    code: 'badge_aba_supporter',
    name: 'Aba Top Supporter',
    icon: '🏅',
    iconPng: getGiftPngUrl('golden_rose'),
    category: 'badge',
    costBp: 400,
    rarity: 'Rare',
    description: 'Official badge honoring active patrons who uplift Aba creators and builders.',
    creatorXpBonus: 40,
    recognitionPoints: 35,
    accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  },
  {
    code: 'badge_og_vanguard',
    name: 'Boost Vanguard Badge',
    icon: '🏅',
    iconPng: getGiftPngUrl('lightning_bolt'),
    category: 'badge',
    costBp: 750,
    rarity: 'Rare',
    description: 'Limited-time season emblem displayed next to your name on your profile.',
    creatorXpBonus: 60,
    recognitionPoints: 50,
    isLimitedTime: true,
    limitedEndsLabel: '5d 06h left',
    accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  },

  // Profile Frames
  {
    code: 'frame_neon_pulse',
    name: 'Neon Pulse Frame',
    icon: '✨',
    iconPng: getGiftPngUrl('neon_star'),
    category: 'frame',
    costBp: 600,
    rarity: 'Epic',
    description: 'Surrounds your profile picture with a luminous cyan-and-cobalt electric ring.',
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
    iconPng: getGiftPngUrl('crystal_crown_mini'),
    category: 'frame',
    costBp: 1800,
    rarity: 'Legendary',
    description: 'Radiant golden sovereign border around your avatar across your profile and showcase.',
    creatorXpBonus: 120,
    recognitionPoints: 100,
    isLimitedTime: true,
    limitedEndsLabel: '3d 19h left',
    accentGradient: 'from-amber-400/25 via-yellow-500/10 to-transparent',
    previewClass: 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.7)]',
  },

  // Name Styles
  {
    code: 'name_aurora_glow',
    name: 'Aurora Name Glow',
    icon: '🎨',
    iconPng: getGiftPngUrl('star_serpent_crown'),
    category: 'name_style',
    costBp: 850,
    rarity: 'Epic',
    description: 'Styles your profile display name in a vivid cyan-to-violet aurora gradient.',
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
    iconPng: getGiftPngUrl('crown_of_infinite_stars'),
    category: 'name_style',
    costBp: 1500,
    rarity: 'Legendary',
    description: 'Transforms your profile display name into a lustrous metallic gold finish.',
    creatorXpBonus: 110,
    recognitionPoints: 90,
    isLimitedTime: true,
    limitedEndsLabel: '3d 11h left',
    accentGradient: 'from-amber-300/25 via-orange-500/10 to-transparent',
    previewClass:
      'bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent',
  },
];

// Strictly sorted list of the 20 official gifts (low to high costBp / rank)
export const OFFICIAL_20_GIFTS = BSHOP_CATALOG.filter(
  (item) => item.category === 'gift'
).sort((a, b) => a.costBp - b.costBp);

export const GIFT_ITEMS_ONLY = OFFICIAL_20_GIFTS;

// Backward-compatibility aliases for legacy codes
export const LEGACY_GIFT_ALIASES: Record<string, string> = {
  rose: 'golden_rose',
  chocolate: 'pizza_slice',
  coffee: 'lightning_bolt',
  bouquet: 'neon_star',
  champagne: 'lucky_dice',
  watch: 'serpent_ring',
  supercar: 'dragon_egg',
  helicopter: 'galaxy_sword',
  crown: 'crystal_crown_mini',
  diamond: 'frost_phoenix_pet',
  palace: 'celestial_throne',
  trophy: 'crown_of_infinite_stars',
  palm_wine: 'pizza_slice',
  chief_cap: 'serpent_ring',
  aba_shoes: 'lucky_dice',
  fire: 'lightning_bolt',
  gold_chain: 'serpent_ring',
  rocket: 'galaxy_sword',
  golden_eagle: 'frost_phoenix_pet',
  heart: 'golden_rose',
  star: 'neon_star',
  gift_box: 'neon_star',
};

export function getBShopItemByCode(code: string): BShopCatalogItem | undefined {
  if (!code) return undefined;
  const direct = BSHOP_CATALOG.find((i) => i.code === code);
  if (direct) return direct;
  const alias = LEGACY_GIFT_ALIASES[code];
  if (alias) {
    return BSHOP_CATALOG.find((i) => i.code === alias);
  }
  return undefined;
}

export function rollMysteryBoxReward(): {
  item: BShopCatalogItem;
  quantity: number;
} {
  const roll = Math.random() * 100;
  // Weighted drop table over the 20 official gifts
  if (roll < 30) {
    return { item: getBShopItemByCode('neon_star')!, quantity: 3 };
  }
  if (roll < 55) {
    return { item: getBShopItemByCode('lucky_dice')!, quantity: 2 };
  }
  if (roll < 75) {
    return { item: getBShopItemByCode('lightning_bolt')!, quantity: 1 };
  }
  if (roll < 88) {
    return { item: getBShopItemByCode('serpent_ring')!, quantity: 1 };
  }
  if (roll < 96) {
    return { item: getBShopItemByCode('galaxy_sword')!, quantity: 1 };
  }
  if (roll < 99) {
    return { item: getBShopItemByCode('titan_gauntlet')!, quantity: 1 };
  }
  return { item: getBShopItemByCode('crown_of_infinite_stars')!, quantity: 1 };
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
