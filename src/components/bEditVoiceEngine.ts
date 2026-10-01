export type BEditVoiceCategory =
  | 'All'
  | 'Nigerian'
  | 'Comedy'
  | 'Girl'
  | 'Male'
  | 'Children'
  | 'More FX';

export interface BEditVoicePreset {
  id: string;
  name: string;
  category: Exclude<BEditVoiceCategory, 'All'>;
  badge: string;
  description: string;
  // Real Web Audio API DSP parameters
  pitchRate: number; // 0.60 .. 1.85
  formantFreq: number; // Hz (120 .. 3400)
  formantGain: number; // dB (-15 .. +18)
  formantQ?: number;
  lowShelfGain: number; // dB (-18 .. +16)
  highShelfGain: number; // dB (-18 .. +16)
  highpassHz?: number;
  lowpassHz?: number;
  vibratoHz?: number;
  vibratoDepth?: number; // seconds delay mod (0.001 .. 0.012)
  ringModHz?: number;
  ringModMix?: number; // 0 .. 1
  distortion?: number; // 0 .. 100
  echoDelaySec?: number;
  echoFeedback?: number; // 0 .. 0.75
  echoMix?: number; // 0 .. 0.8
}

export const BEDIT_VOICE_PRESETS: BEditVoicePreset[] = [
  // 0. Original Clean Voice
  {
    id: 'original',
    name: 'Original Clean Voice',
    category: 'More FX',
    badge: 'NATURAL',
    description: 'Clean studio microphone pass-through',
    pitchRate: 1.0,
    formantFreq: 1000,
    formantGain: 0,
    lowShelfGain: 0,
    highShelfGain: 0,
  },

  // ==================== NIGERIAN & AFRICAN VOICES (10) ====================
  {
    id: 'naija_street_hypeman',
    name: 'Naija Street Hypeman',
    category: 'Nigerian',
    badge: '🇳🇬 LAGOS HYPE',
    description: 'Energetic Lagos party hypeman with punchy slapback echo',
    pitchRate: 1.04,
    formantFreq: 1650,
    formantGain: 9,
    formantQ: 1.8,
    lowShelfGain: 5,
    highShelfGain: 8,
    distortion: 14,
    echoDelaySec: 0.14,
    echoFeedback: 0.38,
    echoMix: 0.35,
  },
  {
    id: 'lagos_babe',
    name: 'Lagos Big Girl',
    category: 'Nigerian',
    badge: '🇳🇬 ISLAND BABE',
    description: 'Bright, crisp feminine formant with glossy studio air',
    pitchRate: 1.24,
    formantFreq: 2250,
    formantGain: 8,
    formantQ: 1.5,
    lowShelfGain: -6,
    highShelfGain: 9,
    echoDelaySec: 0.06,
    echoFeedback: 0.15,
    echoMix: 0.15,
  },
  {
    id: 'odogwu_chief',
    name: 'Igbo Chief (Odogwu)',
    category: 'Nigerian',
    badge: '🇳🇬 ODOGWU',
    description: 'Deep commanding chest resonance with royal authority',
    pitchRate: 0.82,
    formantFreq: 185,
    formantGain: 12,
    formantQ: 1.4,
    lowShelfGain: 11,
    highShelfGain: 2,
    echoDelaySec: 0.11,
    echoFeedback: 0.22,
    echoMix: 0.2,
  },
  {
    id: 'naija_comedy_mama',
    name: 'African Mama (Naija)',
    category: 'Nigerian',
    badge: '🇳🇬 NAIJA MAMA',
    description: 'Expressive dramatic mid-high pitch with warm room acoustics',
    pitchRate: 1.18,
    formantFreq: 1450,
    formantGain: 10,
    formantQ: 2.0,
    lowShelfGain: -3,
    highShelfGain: 6,
    vibratoHz: 4.5,
    vibratoDepth: 0.0018,
    echoDelaySec: 0.05,
    echoFeedback: 0.18,
    echoMix: 0.22,
  },
  {
    id: 'warri_comedian',
    name: 'Warri Street Comedian',
    category: 'Nigerian',
    badge: '🇳🇬 WARRI SKIT',
    description: 'Lively skitmaker vocal punch with crisp comedic presence',
    pitchRate: 1.12,
    formantFreq: 1800,
    formantGain: 11,
    formantQ: 2.2,
    lowShelfGain: -2,
    highShelfGain: 8,
    vibratoHz: 5.5,
    vibratoDepth: 0.0022,
  },
  {
    id: 'yoruba_elder',
    name: 'Yoruba Agba (Elder)',
    category: 'Nigerian',
    badge: '🇳🇬 AGBA',
    description: 'Rich resonant low-mid warmth with subtle proverb echo',
    pitchRate: 0.86,
    formantFreq: 240,
    formantGain: 9,
    formantQ: 1.5,
    lowShelfGain: 8,
    highShelfGain: -2,
    vibratoHz: 3.8,
    vibratoDepth: 0.0015,
    echoDelaySec: 0.16,
    echoFeedback: 0.28,
    echoMix: 0.24,
  },
  {
    id: 'aboki_radio',
    name: 'Arewa Radio Host',
    category: 'Nigerian',
    badge: '🇳🇬 AREWA FM',
    description: 'Warm northern broadcast baritone with AM/FM presence',
    pitchRate: 0.92,
    formantFreq: 950,
    formantGain: 7,
    formantQ: 1.8,
    lowShelfGain: 4,
    highShelfGain: 5,
    highpassHz: 160,
    lowpassHz: 5200,
  },
  {
    id: 'afrobeats_star',
    name: 'Afrobeats Auto-Vibe',
    category: 'Nigerian',
    badge: '🇳🇬 AFRO STAR',
    description: 'Melodic harmonic chorus shimmer with studio compression',
    pitchRate: 1.06,
    formantFreq: 2100,
    formantGain: 7,
    formantQ: 1.6,
    lowShelfGain: 3,
    highShelfGain: 10,
    vibratoHz: 6.2,
    vibratoDepth: 0.0016,
    echoDelaySec: 0.18,
    echoFeedback: 0.35,
    echoMix: 0.3,
  },
  {
    id: 'danfo_conductor',
    name: 'Lagos Danfo Conductor',
    category: 'Nigerian',
    badge: '🇳🇬 OWA O!',
    description: 'Raspy street megaphone projection with gritty overdrive',
    pitchRate: 1.08,
    formantFreq: 1350,
    formantGain: 14,
    formantQ: 3.0,
    lowShelfGain: -10,
    highShelfGain: 6,
    highpassHz: 380,
    lowpassHz: 3600,
    distortion: 38,
    echoDelaySec: 0.09,
    echoFeedback: 0.25,
    echoMix: 0.25,
  },
  {
    id: 'nollywood_epic',
    name: 'Nollywood Epic Ancestor',
    category: 'Nigerian',
    badge: '🇳🇬 IGWESHRINE',
    description: 'Booming ancestral oracle voice with mystic cave reverb',
    pitchRate: 0.74,
    formantFreq: 160,
    formantGain: 13,
    formantQ: 1.4,
    lowShelfGain: 13,
    highShelfGain: -3,
    echoDelaySec: 0.26,
    echoFeedback: 0.58,
    echoMix: 0.52,
  },

  // ==================== COMEDY & FUNNY VOICES (12) ====================
  {
    id: 'chipmunk_turbo',
    name: 'Chipmunk Comedy',
    category: 'Comedy',
    badge: '😂 CHIPMUNK',
    description: 'Classic high-pitched squeaky chipmunk comedy voice',
    pitchRate: 1.58,
    formantFreq: 2800,
    formantGain: 10,
    lowShelfGain: -12,
    highShelfGain: 10,
  },
  {
    id: 'helium_balloon',
    name: 'Helium Laugh',
    category: 'Comedy',
    badge: '😂 HELIUM',
    description: 'Ultra-high squeaky helium party balloon voice',
    pitchRate: 1.76,
    formantFreq: 3200,
    formantGain: 12,
    lowShelfGain: -15,
    highShelfGain: 12,
  },
  {
    id: 'drunk_wobble',
    name: 'Dizzy / Tipsy Wobble',
    category: 'Comedy',
    badge: '😂 WOBBLE',
    description: 'Hilarious unsteady pitch wobble and slurred chorus',
    pitchRate: 0.94,
    formantFreq: 800,
    formantGain: 5,
    lowShelfGain: 3,
    highShelfGain: -4,
    vibratoHz: 2.4,
    vibratoDepth: 0.0085,
  },
  {
    id: 'cartoon_duck',
    name: 'Quacky Cartoon',
    category: 'Comedy',
    badge: '😂 CARTOON',
    description: 'Nasal resonant cartoon duck quack filter',
    pitchRate: 1.36,
    formantFreq: 1150,
    formantGain: 16,
    formantQ: 4.5,
    lowShelfGain: -10,
    highShelfGain: 5,
    distortion: 18,
  },
  {
    id: 'slow_mo_giant',
    name: 'Slow-Mo Sloth',
    category: 'Comedy',
    badge: '😂 SLOW-MO',
    description: 'Deep stretched-out sleepy comedy giant',
    pitchRate: 0.68,
    formantFreq: 220,
    formantGain: 8,
    lowShelfGain: 10,
    highShelfGain: -6,
  },
  {
    id: 'megaphone_clown',
    name: 'Circus Megaphone',
    category: 'Comedy',
    badge: '😂 CIRCUS',
    description: 'Honky horn megaphone with springy slapback',
    pitchRate: 1.16,
    formantFreq: 1500,
    formantGain: 14,
    formantQ: 3.5,
    lowShelfGain: -14,
    highShelfGain: 4,
    highpassHz: 450,
    lowpassHz: 3200,
    distortion: 28,
    echoDelaySec: 0.08,
    echoFeedback: 0.35,
    echoMix: 0.32,
  },
  {
    id: 'vibrato_opera',
    name: 'Dramatic Opera Vibrato',
    category: 'Comedy',
    badge: '😂 OPERA',
    description: 'Over-the-top wide pitch vibrato in a concert hall',
    pitchRate: 1.14,
    formantFreq: 1900,
    formantGain: 9,
    lowShelfGain: 2,
    highShelfGain: 8,
    vibratoHz: 6.8,
    vibratoDepth: 0.0065,
    echoDelaySec: 0.19,
    echoFeedback: 0.42,
    echoMix: 0.36,
  },
  {
    id: 'alien_invader',
    name: 'Martian Alien',
    category: 'Comedy',
    badge: '😂 ALIEN',
    description: 'Sci-fi ring-modulated extraterrestrial voice',
    pitchRate: 1.32,
    formantFreq: 2100,
    formantGain: 8,
    lowShelfGain: -6,
    highShelfGain: 8,
    ringModHz: 48,
    ringModMix: 0.65,
  },
  {
    id: 'goblin_gremlin',
    name: 'Sneaky Goblin',
    category: 'Comedy',
    badge: '😂 GOBLIN',
    description: 'Raspy mischievous gremlin with nasal crunch',
    pitchRate: 1.28,
    formantFreq: 1650,
    formantGain: 13,
    formantQ: 3.2,
    lowShelfGain: -8,
    highShelfGain: 9,
    distortion: 32,
  },
  {
    id: 'underwater_bubble',
    name: 'Underwater Bubbles',
    category: 'Comedy',
    badge: '😂 BUBBLES',
    description: 'Submerged bubbly warble effect',
    pitchRate: 1.05,
    formantFreq: 600,
    formantGain: 10,
    lowShelfGain: 4,
    highShelfGain: -12,
    lowpassHz: 1400,
    vibratoHz: 9.5,
    vibratoDepth: 0.0055,
  },
  {
    id: 'kazoo_party',
    name: 'Buzzing Kazoo',
    category: 'Comedy',
    badge: '😂 KAZOO',
    description: 'Funny harmonic fuzz buzz like a party kazoo',
    pitchRate: 1.22,
    formantFreq: 1300,
    formantGain: 15,
    formantQ: 4.0,
    lowShelfGain: -12,
    highShelfGain: 8,
    distortion: 55,
  },
  {
    id: 'dizzy_squirrel',
    name: 'Hyper Squirrel',
    category: 'Comedy',
    badge: '😂 SQUIRREL',
    description: 'Super-fast caffeinated squirrel chatter',
    pitchRate: 1.48,
    formantFreq: 2600,
    formantGain: 11,
    lowShelfGain: -10,
    highShelfGain: 11,
    vibratoHz: 11,
    vibratoDepth: 0.0025,
  },

  // ==================== GIRL / FEMALE VOICES (8) ====================
  {
    id: 'girl_sweet',
    name: 'Sweet Girl Voice',
    category: 'Girl',
    badge: '👩 SWEET GIRL',
    description: 'Natural feminine pitch lift with warm lifted vocal formant',
    pitchRate: 1.22,
    formantFreq: 2150,
    formantGain: 7,
    formantQ: 1.4,
    lowShelfGain: -7,
    highShelfGain: 7,
  },
  {
    id: 'girl_soft_asmr',
    name: 'Soft Whisper Girl',
    category: 'Girl',
    badge: '👩 ASMR GIRL',
    description: 'Intimate airy feminine voice with silky treble',
    pitchRate: 1.19,
    formantFreq: 2500,
    formantGain: 9,
    formantQ: 1.3,
    lowShelfGain: -9,
    highShelfGain: 12,
    highpassHz: 180,
  },
  {
    id: 'girl_anime',
    name: 'Anime Heroine',
    category: 'Girl',
    badge: '👩 ANIME',
    description: 'High, expressive anime character voice',
    pitchRate: 1.35,
    formantFreq: 2650,
    formantGain: 9,
    formantQ: 1.6,
    lowShelfGain: -10,
    highShelfGain: 10,
  },
  {
    id: 'girl_diva_pop',
    name: 'Pop Diva Queen',
    category: 'Girl',
    badge: '👩 POP DIVA',
    description: 'Polished female vocalist with studio shimmer reverb',
    pitchRate: 1.2,
    formantFreq: 2300,
    formantGain: 8,
    lowShelfGain: -5,
    highShelfGain: 9,
    echoDelaySec: 0.14,
    echoFeedback: 0.3,
    echoMix: 0.26,
  },
  {
    id: 'girl_sassy_vlogger',
    name: 'Sassy Vlogger',
    category: 'Girl',
    badge: '👩 VLOGGER',
    description: 'Confident, upfront lifestyle creator voice',
    pitchRate: 1.16,
    formantFreq: 1950,
    formantGain: 8,
    lowShelfGain: -4,
    highShelfGain: 8,
  },
  {
    id: 'girl_news_anchor',
    name: 'Female News Anchor',
    category: 'Girl',
    badge: '👩 ANCHOR',
    description: 'Clear, articulate broadcast television presenter',
    pitchRate: 1.14,
    formantFreq: 1800,
    formantGain: 6,
    lowShelfGain: -3,
    highShelfGain: 6,
  },
  {
    id: 'girl_princess',
    name: 'Fairytale Princess',
    category: 'Girl',
    badge: '👩 PRINCESS',
    description: 'Sweet melodic voice with magical hall sparkle',
    pitchRate: 1.27,
    formantFreq: 2400,
    formantGain: 8,
    lowShelfGain: -8,
    highShelfGain: 10,
    vibratoHz: 5.0,
    vibratoDepth: 0.0014,
    echoDelaySec: 0.17,
    echoFeedback: 0.34,
    echoMix: 0.28,
  },
  {
    id: 'girl_cyber_ai',
    name: 'Cyber AI Girl',
    category: 'Girl',
    badge: '👩 AI VOICE',
    description: 'Futuristic female digital assistant with subtle modulation',
    pitchRate: 1.21,
    formantFreq: 2350,
    formantGain: 8,
    lowShelfGain: -6,
    highShelfGain: 9,
    ringModHz: 24,
    ringModMix: 0.22,
  },

  // ==================== MALE VOICES (8) ====================
  {
    id: 'male_deep_alpha',
    name: 'Deep Alpha Male',
    category: 'Male',
    badge: '👨 DEEP MALE',
    description: 'Rich, masculine low-pitched voice with chest bass',
    pitchRate: 0.81,
    formantFreq: 190,
    formantGain: 10,
    formantQ: 1.3,
    lowShelfGain: 9,
    highShelfGain: 3,
  },
  {
    id: 'male_movie_trailer',
    name: 'Movie Trailer Voice',
    category: 'Male',
    badge: '👨 TRAILER',
    description: 'Cinema narrator baritone with thunderous sub-bass',
    pitchRate: 0.76,
    formantFreq: 155,
    formantGain: 12,
    lowShelfGain: 12,
    highShelfGain: 5,
    echoDelaySec: 0.12,
    echoFeedback: 0.24,
    echoMix: 0.2,
  },
  {
    id: 'male_podcast_host',
    name: 'Pro Podcast Host',
    category: 'Male',
    badge: '👨 PODCAST',
    description: 'Warm condenser-mic male voice with smooth presence',
    pitchRate: 0.91,
    formantFreq: 230,
    formantGain: 8,
    lowShelfGain: 7,
    highShelfGain: 4,
  },
  {
    id: 'male_baritone_singer',
    name: 'Smooth Baritone',
    category: 'Male',
    badge: '👨 BARITONE',
    description: 'Velvet R&B male vocal with lush studio room',
    pitchRate: 0.86,
    formantFreq: 260,
    formantGain: 7,
    lowShelfGain: 6,
    highShelfGain: 5,
    echoDelaySec: 0.15,
    echoFeedback: 0.28,
    echoMix: 0.24,
  },
  {
    id: 'male_drill_rapper',
    name: 'UK/NY Drill Voice',
    category: 'Male',
    badge: '👨 DRILL',
    description: 'Gritty deep street vocal with punchy ad-lib slap delay',
    pitchRate: 0.88,
    formantFreq: 310,
    formantGain: 9,
    lowShelfGain: 8,
    highShelfGain: 7,
    distortion: 12,
    echoDelaySec: 0.13,
    echoFeedback: 0.3,
    echoMix: 0.25,
  },
  {
    id: 'male_old_grandpa',
    name: 'Wise Grandpa',
    category: 'Male',
    badge: '👨 GRANDPA',
    description: 'Aged storyteller voice with gentle vocal character',
    pitchRate: 0.84,
    formantFreq: 680,
    formantGain: 6,
    lowShelfGain: 3,
    highShelfGain: -4,
    vibratoHz: 4.8,
    vibratoDepth: 0.0022,
  },
  {
    id: 'male_sports_caster',
    name: 'Football Commentator',
    category: 'Male',
    badge: '👨 STADIUM',
    description: 'Excited live match commentator with stadium PA echo',
    pitchRate: 1.03,
    formantFreq: 1400,
    formantGain: 9,
    lowShelfGain: 2,
    highShelfGain: 8,
    echoDelaySec: 0.16,
    echoFeedback: 0.36,
    echoMix: 0.32,
  },
  {
    id: 'male_action_hero',
    name: 'Gritty Action Hero',
    category: 'Male',
    badge: '👨 HERO',
    description: 'Tough, gravelly low male voice',
    pitchRate: 0.79,
    formantFreq: 210,
    formantGain: 11,
    lowShelfGain: 9,
    highShelfGain: 4,
    distortion: 22,
  },

  // ==================== CHILDREN & KID VOICES (6) ====================
  {
    id: 'child_happy_kid',
    name: 'Happy 7-Year-Old',
    category: 'Children',
    badge: '🧒 KID VOICE',
    description: 'Bright, cheerful young child vocal resonance',
    pitchRate: 1.31,
    formantFreq: 2550,
    formantGain: 9,
    formantQ: 1.5,
    lowShelfGain: -10,
    highShelfGain: 8,
  },
  {
    id: 'child_toddler_cute',
    name: 'Cute Toddler',
    category: 'Children',
    badge: '🧒 TODDLER',
    description: 'Adorable baby/toddler high vocal tract timbre',
    pitchRate: 1.42,
    formantFreq: 2900,
    formantGain: 10,
    formantQ: 1.6,
    lowShelfGain: -12,
    highShelfGain: 9,
  },
  {
    id: 'child_school_boy',
    name: 'Playful Schoolboy',
    category: 'Children',
    badge: '🧒 BOY VOICE',
    description: 'Energetic 10-year-old boy voice',
    pitchRate: 1.25,
    formantFreq: 2200,
    formantGain: 8,
    lowShelfGain: -8,
    highShelfGain: 6,
  },
  {
    id: 'child_little_sister',
    name: 'Little Sister',
    category: 'Children',
    badge: '🧒 LITTLE GIRL',
    description: 'Sweet young girl voice for storytelling & skits',
    pitchRate: 1.34,
    formantFreq: 2700,
    formantGain: 9,
    lowShelfGain: -11,
    highShelfGain: 9,
  },
  {
    id: 'child_cartoon_hero',
    name: 'Kid Superhero',
    category: 'Children',
    badge: '🧒 SUPER KID',
    description: 'Bold animated kid hero with heroic echo',
    pitchRate: 1.29,
    formantFreq: 2400,
    formantGain: 9,
    lowShelfGain: -7,
    highShelfGain: 8,
    echoDelaySec: 0.11,
    echoFeedback: 0.25,
    echoMix: 0.22,
  },
  {
    id: 'child_bedtime_story',
    name: 'Storybook Kid',
    category: 'Children',
    badge: '🧒 STORY KID',
    description: 'Gentle young narrator voice with cozy room warmth',
    pitchRate: 1.28,
    formantFreq: 2350,
    formantGain: 7,
    lowShelfGain: -8,
    highShelfGain: 5,
    echoDelaySec: 0.06,
    echoFeedback: 0.15,
    echoMix: 0.18,
  },

  // ==================== SCI-FI, MONSTER & STUDIO FX (7 + Original = 8) ====================
  {
    id: 'robot_prime',
    name: 'Mecha Robot',
    category: 'More FX',
    badge: '🤖 ROBOT',
    description: 'Metallic ring-modulated android synthesizer voice',
    pitchRate: 1.0,
    formantFreq: 1400,
    formantGain: 10,
    lowShelfGain: -2,
    highShelfGain: 6,
    ringModHz: 65,
    ringModMix: 0.78,
    echoDelaySec: 0.03,
    echoFeedback: 0.4,
    echoMix: 0.35,
  },
  {
    id: 'cyber_demon',
    name: 'Dark Monster Titan',
    category: 'More FX',
    badge: '👹 MONSTER',
    description: 'Terrifying sub-octave beast with cavern roar',
    pitchRate: 0.64,
    formantFreq: 140,
    formantGain: 15,
    lowShelfGain: 15,
    highShelfGain: -4,
    distortion: 42,
    echoDelaySec: 0.22,
    echoFeedback: 0.5,
    echoMix: 0.45,
  },
  {
    id: 'ghost_phantom',
    name: 'Haunted Ghost',
    category: 'More FX',
    badge: '👻 GHOST',
    description: 'Eerie whispering phantom with long haunting trails',
    pitchRate: 0.89,
    formantFreq: 1800,
    formantGain: 8,
    lowShelfGain: -8,
    highShelfGain: 10,
    vibratoHz: 3.2,
    vibratoDepth: 0.004,
    echoDelaySec: 0.28,
    echoFeedback: 0.65,
    echoMix: 0.58,
  },
  {
    id: 'walkie_talkie',
    name: 'Police Walkie-Talkie',
    category: 'More FX',
    badge: '📟 WALKIE',
    description: 'Tactical two-way radio bandpass with crisp overdrive',
    pitchRate: 1.0,
    formantFreq: 1250,
    formantGain: 14,
    formantQ: 3.8,
    lowShelfGain: -16,
    highShelfGain: -8,
    highpassHz: 480,
    lowpassHz: 2700,
    distortion: 45,
  },
  {
    id: 'vintage_1950_radio',
    name: '1950s Vintage Radio',
    category: 'More FX',
    badge: '📻 RETRO FM',
    description: 'Nostalgic mid-century tube radio warmth',
    pitchRate: 0.98,
    formantFreq: 1100,
    formantGain: 10,
    formantQ: 2.5,
    lowShelfGain: -12,
    highShelfGain: -6,
    highpassHz: 320,
    lowpassHz: 3400,
    distortion: 16,
  },
  {
    id: 'stadium_megastar',
    name: 'Stadium Live PA',
    category: 'More FX',
    badge: '🏟️ ARENA',
    description: 'Massive concert arena echo and crowd stage presence',
    pitchRate: 1.0,
    formantFreq: 1600,
    formantGain: 6,
    lowShelfGain: 4,
    highShelfGain: 7,
    echoDelaySec: 0.24,
    echoFeedback: 0.55,
    echoMix: 0.48,
  },
  {
    id: 'cathedral_choir',
    name: 'Angelic Choir Harmony',
    category: 'More FX',
    badge: '✨ ANGELIC',
    description: 'Ethereal pitch shimmer with grand cathedral acoustics',
    pitchRate: 1.15,
    formantFreq: 2400,
    formantGain: 8,
    lowShelfGain: -4,
    highShelfGain: 11,
    vibratoHz: 4.2,
    vibratoDepth: 0.0028,
    echoDelaySec: 0.3,
    echoFeedback: 0.62,
    echoMix: 0.55,
  },
];

export const BEDIT_VOICE_CATEGORIES: BEditVoiceCategory[] = [
  'All',
  'Nigerian',
  'Comedy',
  'Girl',
  'Male',
  'Children',
  'More FX',
];

export function getVoicePresetById(id: string): BEditVoicePreset {
  return (
    BEDIT_VOICE_PRESETS.find((p) => p.id === id) || BEDIT_VOICE_PRESETS[0]
  );
}

function makeDistortionCurve(amount = 20): Float32Array<ArrayBuffer> {
  const k = Math.max(0, amount);
  const nSamples = 44100;
  const curve = new Float32Array(new ArrayBuffer(nSamples * 4));
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Encodes a Web Audio API AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
export function encodeAudioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, Math.max(1, buffer.numberOfChannels));
  const sampleRate = buffer.sampleRate || 44100;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i] || 0));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Decodes any File or URL (video or audio) into an AudioBuffer.
 */
export async function decodeMediaToAudioBuffer(
  source: File | Blob | string
): Promise<AudioBuffer> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();

  try {
    let arrayBuffer: ArrayBuffer;
    if (typeof source === 'string') {
      const cleanUrl = source.split('#')[0];
      const res = await fetch(cleanUrl);
      arrayBuffer = await res.arrayBuffer();
    } else {
      arrayBuffer = await source.arrayBuffer();
    }
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    await ctx.close().catch(() => {});
    return decoded;
  } catch (err) {
    await ctx.close().catch(() => {});
    throw err;
  }
}

/**
 * Extracts the real audio track from a selected gallery video File or URL
 * and returns a playable/downloadable WAV File + URL + AudioBuffer.
 */
export async function extractAudioFromVideoSource(
  source: File | string,
  sourceName = 'gallery-video'
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  wavFile: File;
  wavUrl: string;
  duration: number;
}> {
  const audioBuffer = await decodeMediaToAudioBuffer(source);
  const wavBlob = encodeAudioBufferToWavBlob(audioBuffer);
  const safeBase = sourceName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const wavFile = new File([wavBlob], `${safeBase}_extracted_audio.wav`, {
    type: 'audio/wav',
  });
  const wavUrl = URL.createObjectURL(wavBlob);
  return {
    audioBuffer,
    wavBlob,
    wavFile,
    wavUrl,
    duration: Number(audioBuffer.duration.toFixed(1)),
  };
}

/**
 * Applies any of the 52 Voice Changer DSP presets to an AudioBuffer using OfflineAudioContext
 * and returns the transformed AudioBuffer + WAV File + Object URL.
 */
export async function renderVoiceChangedAudio(
  sourceBuffer: AudioBuffer,
  presetId: string,
  baseName = 'voice'
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  wavFile: File;
  wavUrl: string;
  duration: number;
}> {
  const preset = getVoicePresetById(presetId);

  if (preset.id === 'original') {
    const wavBlob = encodeAudioBufferToWavBlob(sourceBuffer);
    const wavFile = new File([wavBlob], `${baseName}_original.wav`, {
      type: 'audio/wav',
    });
    return {
      audioBuffer: sourceBuffer,
      wavBlob,
      wavFile,
      wavUrl: URL.createObjectURL(wavBlob),
      duration: Number(sourceBuffer.duration.toFixed(1)),
    };
  }

  const rate = Math.max(0.55, Math.min(1.9, preset.pitchRate || 1.0));
  const tailSec = preset.echoDelaySec ? Math.min(1.2, preset.echoDelaySec * 3) : 0.1;
  const outputDuration = Math.max(0.5, sourceBuffer.duration / rate + tailSec);
  const sampleRate = sourceBuffer.sampleRate || 44100;
  const totalFrames = Math.ceil(outputDuration * sampleRate);

  const offlineCtx = new OfflineAudioContext(
    Math.min(2, Math.max(1, sourceBuffer.numberOfChannels)),
    totalFrames,
    sampleRate
  );

  const src = offlineCtx.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = rate;

  let currentNode: AudioNode = src;

  // Optional Highpass (telephone / megaphone / walkie-talkie)
  if (preset.highpassHz) {
    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = preset.highpassHz;
    currentNode.connect(hp);
    currentNode = hp;
  }

  // Optional Lowpass
  if (preset.lowpassHz) {
    const lp = offlineCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = preset.lowpassHz;
    currentNode.connect(lp);
    currentNode = lp;
  }

  // Low-shelf bass sculpting
  if (preset.lowShelfGain !== 0) {
    const lowShelf = offlineCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 220;
    lowShelf.gain.value = preset.lowShelfGain;
    currentNode.connect(lowShelf);
    currentNode = lowShelf;
  }

  // Vocal Formant Filter
  if (preset.formantGain !== 0) {
    const formant = offlineCtx.createBiquadFilter();
    formant.type = 'peaking';
    formant.frequency.value = preset.formantFreq;
    formant.Q.value = preset.formantQ || 1.6;
    formant.gain.value = preset.formantGain;
    currentNode.connect(formant);
    currentNode = formant;
  }

  // High-shelf presence/air
  if (preset.highShelfGain !== 0) {
    const highShelf = offlineCtx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = preset.highShelfGain;
    currentNode.connect(highShelf);
    currentNode = highShelf;
  }

  // Optional Vibrato / Pitch Wobble LFO
  if (preset.vibratoHz && preset.vibratoDepth) {
    const delay = offlineCtx.createDelay(0.1);
    delay.delayTime.value = 0.015;
    const lfo = offlineCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = preset.vibratoHz;
    const lfoGain = offlineCtx.createGain();
    lfoGain.gain.value = preset.vibratoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    currentNode.connect(delay);
    currentNode = delay;
    lfo.start(0);
  }

  // Optional Ring Modulator (Robot / Alien / AI)
  if (preset.ringModHz && preset.ringModMix) {
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - preset.ringModMix * 0.65;
    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = preset.ringModMix;

    const ringNode = offlineCtx.createGain();
    ringNode.gain.value = 0;
    const ringOsc = offlineCtx.createOscillator();
    ringOsc.type = 'sine';
    ringOsc.frequency.value = preset.ringModHz;
    ringOsc.connect(ringNode.gain);
    ringOsc.start(0);

    const sumMerge = offlineCtx.createGain();
    currentNode.connect(dryGain);
    dryGain.connect(sumMerge);

    currentNode.connect(ringNode);
    ringNode.connect(wetGain);
    wetGain.connect(sumMerge);

    currentNode = sumMerge;
  }

  // Optional Harmonic Distortion (Megaphone / Danfo Conductor / Monster)
  if (preset.distortion && preset.distortion > 0) {
    const shaper = offlineCtx.createWaveShaper();
    shaper.curve = makeDistortionCurve(preset.distortion);
    shaper.oversample = '2x';
    currentNode.connect(shaper);
    currentNode = shaper;
  }

  // Master Compressor so output is punchy and never clips
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.15;

  // Optional Echo / Reverb Space
  if (preset.echoDelaySec && preset.echoMix) {
    const dryOut = offlineCtx.createGain();
    dryOut.gain.value = 1.0;
    const echoDelay = offlineCtx.createDelay(1.0);
    echoDelay.delayTime.value = preset.echoDelaySec;
    const feedback = offlineCtx.createGain();
    feedback.gain.value = Math.min(0.75, preset.echoFeedback || 0.3);
    const wetOut = offlineCtx.createGain();
    wetOut.gain.value = preset.echoMix;

    currentNode.connect(dryOut);
    dryOut.connect(compressor);

    currentNode.connect(echoDelay);
    echoDelay.connect(feedback);
    feedback.connect(echoDelay);
    echoDelay.connect(wetOut);
    wetOut.connect(compressor);
  } else {
    currentNode.connect(compressor);
  }

  compressor.connect(offlineCtx.destination);
  src.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = encodeAudioBufferToWavBlob(renderedBuffer);
  const wavFile = new File([wavBlob], `${baseName}_${preset.id}.wav`, {
    type: 'audio/wav',
  });
  const wavUrl = URL.createObjectURL(wavBlob);

  return {
    audioBuffer: renderedBuffer,
    wavBlob,
    wavFile,
    wavUrl,
    duration: Number(renderedBuffer.duration.toFixed(1)),
  };
}
